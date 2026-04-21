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

    // Check existing subscriptions via GraphQL
    const subsResponse = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': store.access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `query { currentAppInstallation { activeSubscriptions { id name status } } }`,
      }),
    });

    if (!subsResponse.ok) {
      console.error('Failed to fetch subscriptions:', subsResponse.status);
      if (subsResponse.status === 401) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://syncflow-blush.vercel.app';
        const oauthUrl = `${appUrl}/api/auth/shopify/install?shop=${shop}`;
        return NextResponse.json({ needsOAuth: true, oauthUrl });
      }
      return NextResponse.json({ needsBilling: false });
    }

    const subsData = await subsResponse.json();
    const subs = subsData.data?.currentAppInstallation?.activeSubscriptions || [];
    console.log('💰 Active subscriptions:', subs.length);

    const activeSub = subs.find((s: any) => s.status === 'ACTIVE');
    if (activeSub) {
      console.log('✅ Active subscription found:', activeSub.id);

      if (store.subscription_status !== 'active') {
        await supabase
          .from('stores')
          .update({ subscription_status: 'active' })
          .eq('id', store.id);
      }

      return NextResponse.json({ needsBilling: false, status: 'active' });
    }

    // No active subscription - create new one via GraphQL
    console.log('💰 Creating new subscription via GraphQL...');

    const isTestCharge = shop.includes('-test') || shop.includes('development') || shop.includes('dev-');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://syncflow-blush.vercel.app';
    const returnUrl = `${appUrl}/api/billing/callback?shop=${shop}&store_id=${store.id}`;

    const createResponse = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': store.access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          mutation AppSubscriptionCreate($name: String!, $returnUrl: URL!, $trialDays: Int, $test: Boolean, $lineItems: [AppSubscriptionLineItemInput!]!) {
            appSubscriptionCreate(name: $name, returnUrl: $returnUrl, trialDays: $trialDays, test: $test, lineItems: $lineItems) {
              appSubscription { id status }
              confirmationUrl
              userErrors { field message }
            }
          }
        `,
        variables: {
          name: 'SyncFlow Pro',
          returnUrl,
          trialDays: 7,
          test: isTestCharge,
          lineItems: [{
            plan: {
              appRecurringPricingDetails: {
                price: { amount: 29.99, currencyCode: 'USD' },
                interval: 'EVERY_30_DAYS',
              },
            },
          }],
        },
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ Failed to create subscription:', createResponse.status, errorText);
      return NextResponse.json({ needsBilling: false, error: 'Failed to create billing' });
    }

    const createData = await createResponse.json();
    const userErrors = createData.data?.appSubscriptionCreate?.userErrors;
    if (userErrors?.length > 0) {
      console.error('❌ Subscription user errors:', userErrors);
      return NextResponse.json({ needsBilling: false, error: userErrors[0].message });
    }

    const confirmationUrl = createData.data?.appSubscriptionCreate?.confirmationUrl;

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
