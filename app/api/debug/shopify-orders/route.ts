import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Debug endpoint to test Shopify API connection
 * Requires CRON_SECRET auth: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  // Require CRON_SECRET for access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const storeId = request.nextUrl.searchParams.get('store_id');

    if (!storeId) {
      return NextResponse.json({ error: 'Missing store_id' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('shop_domain, access_token')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Store not found', details: storeError }, { status: 404 });
    }

    // Get channel connection
    const { data: connection, error: connError } = await supabase
      .from('channel_connections')
      .select('access_token')
      .eq('store_id', storeId)
      .eq('platform', 'shopify')
      .single();

    // Try fetching orders from Shopify
    const shopDomain = store.shop_domain;
    const accessToken = connection?.access_token || store.access_token;

    const url = `https://${shopDomain}/admin/api/2024-10/orders.json?limit=10&status=any`;

    const response = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    });

    const responseStatus = response.status;

    let responseBody;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = await response.text();
    }

    return NextResponse.json({
      store: {
        shop_domain: shopDomain,
        store_token_length: store.access_token?.length || 0,
        connection_token_length: connection?.access_token?.length || 0,
        using_token_length: accessToken?.length || 0,
      },
      shopify_response: {
        status: responseStatus,
        ok: response.ok,
        orders_count: responseBody?.orders?.length || 0,
        orders: responseBody?.orders?.map((o: any) => ({
          id: o.id,
          name: o.name,
          created_at: o.created_at,
          total_price: o.total_price,
        })) || [],
        error: responseBody?.errors || null,
        raw: responseStatus !== 200 ? responseBody : undefined,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
