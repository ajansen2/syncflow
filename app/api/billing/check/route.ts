import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedShop } from '@/lib/verify-session';

/**
 * Check billing status and create charge if needed
 * Returns confirmation URL if billing approval is required
 */
export async function POST(request: NextRequest) {
  try {
    const authenticatedShop = getAuthenticatedShop(request);
    const body = await request.json();
    const shop = authenticatedShop || body.shop;

    if (!shop) {
      return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }

    console.log('💰 Checking billing for:', shop);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get store with access token
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, access_token, subscription_status')
      .eq('shop_domain', shop)
      .single();

    if (storeError || !store) {
      console.error('Store not found:', storeError);
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (!store.access_token || store.access_token === 'revoked' || store.access_token === '') {
      console.log('❌ No valid access token - need OAuth');
      // Need to re-authorize - return OAuth URL
      const apiKey = process.env.SHOPIFY_API_KEY;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://syncflow-blush.vercel.app';
      const oauthUrl = `${appUrl}/api/auth/shopify/install?shop=${shop}`;
      return NextResponse.json({
        needsOAuth: true,
        oauthUrl
      });
    }

    // Check existing charges with Shopify
    const chargesResponse = await fetch(
      `https://${shop}/admin/api/2024-10/recurring_application_charges.json`,
      { headers: { 'X-Shopify-Access-Token': store.access_token } }
    );

    if (!chargesResponse.ok) {
      console.error('Failed to fetch charges:', chargesResponse.status);
      // Token might be invalid - need to re-authorize
      if (chargesResponse.status === 401) {
        const apiKey = process.env.SHOPIFY_API_KEY;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://syncflow-blush.vercel.app';
        const oauthUrl = `${appUrl}/api/auth/shopify/install?shop=${shop}`;
        return NextResponse.json({
          needsOAuth: true,
          oauthUrl
        });
      }
      return NextResponse.json({ needsBilling: false });
    }

    const chargesData = await chargesResponse.json();
    const charges = chargesData.recurring_application_charges || [];

    console.log('💰 Existing charges:', charges.map((c: any) => ({ id: c.id, status: c.status })));

    // Check for active charge
    const activeCharge = charges.find((c: any) => c.status === 'active');
    if (activeCharge) {
      console.log('✅ Active billing found:', activeCharge.id);

      // Update store subscription status if needed
      if (store.subscription_status !== 'active') {
        await supabase
          .from('stores')
          .update({ subscription_status: 'active' })
          .eq('id', store.id);
      }

      return NextResponse.json({ needsBilling: false, status: 'active' });
    }

    // Check for pending charge that needs approval
    const pendingCharge = charges.find((c: any) => c.status === 'pending');
    if (pendingCharge) {
      console.log('⏳ Pending charge found, redirecting to approval:', pendingCharge.id);
      return NextResponse.json({
        needsBilling: true,
        confirmationUrl: pendingCharge.confirmation_url
      });
    }

    // No active or pending charge - create new one
    console.log('💰 Creating new billing charge...');

    const isTestCharge = shop.includes('-test') || shop.includes('development') || shop.includes('dev-');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://syncflow-blush.vercel.app';
    const returnUrl = `${appUrl}/api/billing/callback?shop=${shop}&store_id=${store.id}`;

    const createResponse = await fetch(
      `https://${shop}/admin/api/2024-10/recurring_application_charges.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': store.access_token,
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
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ Failed to create charge:', createResponse.status, errorText);
      return NextResponse.json({
        needsBilling: false,
        error: 'Failed to create billing charge'
      });
    }

    const createData = await createResponse.json();
    const confirmationUrl = createData.recurring_application_charge?.confirmation_url;

    console.log('✅ Charge created, confirmation URL:', confirmationUrl);

    return NextResponse.json({
      needsBilling: true,
      confirmationUrl
    });

  } catch (error) {
    console.error('Billing check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
