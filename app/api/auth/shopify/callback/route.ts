import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * ChannelSync - Shopify OAuth Callback
 * Handles token exchange, store creation, and billing
 */

function topLevelRedirectHTML(url: string, message: string = 'Redirecting...'): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>${message}</title>
<style>body{background:#0a0a0a;color:white;font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}.loader{text-align:center}.spinner{width:40px;height:40px;border:3px solid #333;border-top:3px solid #8b5cf6;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px}@keyframes spin{to{transform:rotate(360deg)}}</style>
</head>
<body><div class="loader"><div class="spinner"></div><p>${message}</p></div>
<script>if(window.top&&window.top!==window.self){window.top.location.href=${JSON.stringify(url)}}else{window.location.href=${JSON.stringify(url)}}</script>
</body></html>`;
}
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const shop = searchParams.get('shop');
    const state = searchParams.get('state');
    const hmac = searchParams.get('hmac');

    if (!code || !shop) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // State validation
    const storedState = request.cookies.get('shopify_oauth_state')?.value;
    if (storedState && state && state !== storedState) {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    // Verify HMAC
    const query = new URLSearchParams(searchParams.toString());
    query.delete('hmac');
    const message = Array.from(query.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${key}=${val}`)
      .join('&');

    const generatedHmac = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
      .update(message)
      .digest('hex');

    if (generatedHmac !== hmac) {
      console.error('❌ HMAC validation failed');
      return NextResponse.json({ error: 'HMAC validation failed' }, { status: 403 });
    }

    console.log('✅ HMAC validated');

    // Exchange code for access token
    const apiKey = process.env.SHOPIFY_API_KEY;
    const apiSecret = process.env.SHOPIFY_API_SECRET;

    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: apiSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get shop details
    const shopResponse = await fetch(`https://${shop}/admin/api/2024-10/shop.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    });

    const shopData = await shopResponse.json();
    const shopInfo = shopData.shop;

    // Save store to database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existingStore } = await supabase
      .from('stores')
      .select('*')
      .eq('shop_domain', shop)
      .maybeSingle();

    let store;

    if (existingStore) {
      const { data: updatedStore, error: updateError } = await supabase
        .from('stores')
        .update({
          access_token: accessToken,
          store_name: shopInfo.name || shop,
          email: shopInfo.email,
          currency: shopInfo.currency,
          timezone: shopInfo.iana_timezone,
          subscription_status: 'trial',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingStore.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Store update failed:', updateError);
        return NextResponse.json({
          error: 'Failed to update store',
          details: updateError.message
        }, { status: 500 });
      }

      store = updatedStore;
      console.log('✅ Store updated:', store.id);
    } else {
      const { data: newStore, error: insertError } = await supabase
        .from('stores')
        .insert({
          shop_domain: shop,
          store_name: shopInfo.name || shop,
          email: shopInfo.email,
          access_token: accessToken,
          currency: shopInfo.currency,
          timezone: shopInfo.iana_timezone,
          subscription_status: 'trial',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Store creation failed:', insertError);
        return NextResponse.json({
          error: 'Failed to create store',
          details: insertError.message
        }, { status: 500 });
      }

      store = newStore;
      console.log('✅ Store created:', store.id);
    }

    if (!store) {
      console.error('❌ Store is null after database operation');
      return NextResponse.json({
        error: 'Store operation returned null'
      }, { status: 500 });
    }

    console.log('✅ Store ready:', store.id);

    // Create/update Shopify channel connection
    const { data: existingConnection } = await supabase
      .from('channel_connections')
      .select('id')
      .eq('store_id', store.id)
      .eq('platform', 'shopify')
      .maybeSingle();

    if (existingConnection) {
      await supabase
        .from('channel_connections')
        .update({
          account_id: shopInfo.id?.toString(),
          account_name: shopInfo.name,
          access_token: accessToken,
          is_active: true,
          sync_status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConnection.id);
    } else {
      const { error: connError } = await supabase
        .from('channel_connections')
        .insert({
          store_id: store.id,
          platform: 'shopify',
          account_id: shopInfo.id?.toString(),
          account_name: shopInfo.name,
          access_token: accessToken,
          is_active: true,
          sync_status: 'pending',
        });

      if (connError) {
        console.error('Failed to create channel connection:', connError);
      }
    }

    console.log('✅ Shopify channel connection ready');

    // Register webhooks for order syncing
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify`;

    // First, delete any existing webhooks to avoid duplicates
    const existingWebhooksResponse = await fetch(`https://${shop}/admin/api/2024-10/webhooks.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    });

    if (existingWebhooksResponse.ok) {
      const existingWebhooks = await existingWebhooksResponse.json();
      for (const webhook of existingWebhooks.webhooks || []) {
        await fetch(`https://${shop}/admin/api/2024-10/webhooks/${webhook.id}.json`, {
          method: 'DELETE',
          headers: { 'X-Shopify-Access-Token': accessToken },
        });
      }
      console.log('🗑️ Deleted', existingWebhooks.webhooks?.length || 0, 'old webhooks');
    }

    const webhookTopics = [
      { topic: 'orders/create', address: `${webhookUrl}/orders` },
      { topic: 'orders/updated', address: `${webhookUrl}/orders` },
      { topic: 'refunds/create', address: `${webhookUrl}/refunds` },
      { topic: 'app/uninstalled', address: `${webhookUrl}/uninstall` },
      { topic: 'app_subscriptions/update', address: `${webhookUrl}/subscription` },
    ];

    for (const webhook of webhookTopics) {
      const result = await fetch(`https://${shop}/admin/api/2024-10/webhooks.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webhook: { ...webhook, format: 'json' } }),
      });
      if (!result.ok) {
        console.error('❌ Failed to register webhook:', webhook.topic, await result.text());
      }
    }

    console.log('✅ Webhooks registered');

    // Create billing charge ($29/month with 14-day trial)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`;
    const isTestCharge = shop.includes('-test') || shop.includes('development') || shop.includes('dev-');
    const shopName = shop.replace('.myshopify.com', '');
    const returnUrl = `${appUrl}/api/billing/callback?shop=${shop}&store_id=${store.id}`;

    // First check for existing active charges
    console.log('💰 Checking for existing charges...');
    const existingChargesResponse = await fetch(`https://${shop}/admin/api/2024-10/recurring_application_charges.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    });

    let hasActiveCharge = false;
    if (existingChargesResponse.ok) {
      const existingCharges = await existingChargesResponse.json();
      console.log('💰 Existing charges:', JSON.stringify(existingCharges.recurring_application_charges?.map((c: any) => ({ id: c.id, status: c.status, name: c.name }))));

      const activeCharge = existingCharges.recurring_application_charges?.find(
        (c: any) => c.status === 'active'
      );
      if (activeCharge) {
        console.log('✅ Already has active billing charge:', activeCharge.id, activeCharge.status);
        hasActiveCharge = true;
      }
    } else {
      console.log('💰 Failed to fetch existing charges:', existingChargesResponse.status);
    }

    // Only create new charge if no active one exists
    if (!hasActiveCharge) {
      console.log('💰 Creating new billing charge...');
      const chargeResponse = await fetch(`https://${shop}/admin/api/2024-10/recurring_application_charges.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recurring_application_charge: {
            name: 'SyncFlow - All Channels',
            price: 29.99,
            trial_days: 7,
            return_url: returnUrl,
            ...(isTestCharge && { test: true }),
          }
        })
      });

      console.log('💰 Billing response status:', chargeResponse.status);

      if (chargeResponse.ok) {
        const chargeData = await chargeResponse.json();
        const confirmationUrl = chargeData.recurring_application_charge.confirmation_url;

        console.log('✅ Billing charge created, redirecting to:', confirmationUrl);

        const response = new NextResponse(
          topLevelRedirectHTML(confirmationUrl, 'Redirecting to billing approval...'),
          { status: 200, headers: { 'Content-Type': 'text/html' } }
        );
        response.cookies.delete('shopify_oauth_state');
        return response;
      } else {
        const errorText = await chargeResponse.text();
        console.error('❌ Billing charge failed:', chargeResponse.status, errorText);
      }
    }

    // Go to dashboard if already has active charge or billing creation fails
    const dashboardUrl = hasActiveCharge
      ? `https://admin.shopify.com/store/${shopName}/apps/${apiKey}?shop=${shop}`
      : `https://admin.shopify.com/store/${shopName}/apps/${apiKey}?shop=${shop}&billing_required=true`;
    console.log('📍 Redirecting to dashboard:', dashboardUrl);
    const response = new NextResponse(
      topLevelRedirectHTML(dashboardUrl, hasActiveCharge ? 'Loading dashboard...' : 'Redirecting to dashboard...'),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
    response.cookies.delete('shopify_oauth_state');
    return response;

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ error: 'OAuth failed' }, { status: 500 });
  }
}
