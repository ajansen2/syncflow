import { createClient } from '@supabase/supabase-js';

/**
 * Sync Orders for a Store
 * Shared logic used by both the API endpoint and cron job
 */
export async function syncStoreOrders(storeId: string, days: number = 30, platform?: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get channel connections
  let query = supabase
    .from('channel_connections')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_active', true);

  if (platform) {
    query = query.eq('platform', platform);
  }

  const { data: connections } = await query;

  if (!connections || connections.length === 0) {
    return { success: false, error: 'No active connections' };
  }

  const results: Record<string, { synced: number; errors: string[] }> = {};
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (const connection of connections) {
    results[connection.platform] = { synced: 0, errors: [] };

    // Log sync start
    const { data: syncLog } = await supabase
      .from('sync_logs')
      .insert({
        store_id: storeId,
        channel_connection_id: connection.id,
        platform: connection.platform,
        sync_type: 'orders',
        status: 'started',
      })
      .select()
      .single();

    try {
      if (connection.platform === 'shopify') {
        const synced = await syncShopifyOrders(supabase, storeId, connection, startDate);
        results[connection.platform].synced = synced;
      } else if (connection.platform === 'amazon') {
        const synced = await syncAmazonOrders(supabase, storeId, connection, startDate);
        results[connection.platform].synced = synced;
      } else if (connection.platform === 'etsy') {
        const synced = await syncEtsyOrders(supabase, storeId, connection, startDate);
        results[connection.platform].synced = synced;
      }

      // Update sync log
      if (syncLog) {
        await supabase
          .from('sync_logs')
          .update({
            status: 'completed',
            records_synced: results[connection.platform].synced,
            completed_at: new Date().toISOString(),
          })
          .eq('id', syncLog.id);
      }

      // Update connection last sync
      await supabase
        .from('channel_connections')
        .update({
          last_sync_at: new Date().toISOString(),
          sync_status: 'completed',
        })
        .eq('id', connection.id);

    } catch (error: any) {
      results[connection.platform].errors.push(error.message);

      if (syncLog) {
        await supabase
          .from('sync_logs')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString(),
          })
          .eq('id', syncLog.id);
      }
    }
  }

  return { success: true, results };
}

async function syncShopifyOrders(supabase: any, storeId: string, connection: any, startDate: Date) {
  // Get store for shop domain
  const { data: store } = await supabase
    .from('stores')
    .select('shop_domain')
    .eq('id', storeId)
    .single();

  if (!store) return 0;

  const shopDomain: string = store.shop_domain;
  let synced = 0;
  let pageInfo: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const url: string = pageInfo
      ? `https://${shopDomain}/admin/api/2024-10/orders.json?limit=250&page_info=${pageInfo}`
      : `https://${shopDomain}/admin/api/2024-10/orders.json?limit=250&created_at_min=${startDate.toISOString()}&status=any`;

    const response = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': connection.access_token },
    });

    if (!response.ok) break;

    const data = await response.json();

    for (const order of data.orders || []) {
      // Calculate fees
      const totalPrice = parseFloat(order.total_price) || 0;
      const subtotal = parseFloat(order.subtotal_price) || 0;
      const shipping = parseFloat(order.total_shipping_price_set?.shop_money?.amount) || 0;
      const tax = parseFloat(order.total_tax) || 0;

      // Shopify fees (estimate based on plan)
      const shopifyFee = totalPrice * 0.02; // Basic plan
      const paymentFee = (totalPrice * 0.029) + 0.30; // Shopify Payments

      await supabase.from('orders').upsert({
        store_id: storeId,
        channel_connection_id: connection.id,
        platform: 'shopify',
        platform_order_id: order.id.toString(),
        order_number: order.name,
        order_date: order.created_at,
        gross_revenue: subtotal,
        shipping_revenue: shipping,
        tax_collected: tax,
        platform_fees: shopifyFee,
        payment_processing_fee: paymentFee,
        net_revenue: totalPrice - shopifyFee - paymentFee,
        financial_status: order.financial_status,
        fulfillment_status: order.fulfillment_status,
        currency: order.currency,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'store_id,platform,platform_order_id',
      });

      synced++;
    }

    // Check for pagination
    const linkHeader = response.headers.get('Link');
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const match = linkHeader.match(/page_info=([^>]+)>; rel="next"/);
      pageInfo = match ? match[1] : null;
      hasNextPage = !!pageInfo;
    } else {
      hasNextPage = false;
    }
  }

  return synced;
}

async function syncAmazonOrders(supabase: any, storeId: string, connection: any, startDate: Date) {
  // Amazon SP-API placeholder - requires AWS SigV4 signing
  console.log('Amazon sync placeholder - requires SP-API setup');
  return 0;
}

async function syncEtsyOrders(supabase: any, storeId: string, connection: any, startDate: Date) {
  // Check if token needs refresh
  if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
    const tokenResponse = await fetch('https://api.etsy.com/v3/public/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: connection.refresh_token,
        client_id: process.env.ETSY_API_KEY!,
      }),
    });

    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      await supabase
        .from('channel_connections')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        })
        .eq('id', connection.id);

      connection.access_token = tokenData.access_token;
    }
  }

  // Get shop receipts (orders)
  const response = await fetch(
    `https://api.etsy.com/v3/application/shops/${connection.account_id}/receipts?min_created=${Math.floor(startDate.getTime() / 1000)}`,
    {
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
        'x-api-key': process.env.ETSY_API_KEY!,
      },
    }
  );

  if (!response.ok) {
    console.error('Etsy API error:', await response.text());
    return 0;
  }

  const data = await response.json();
  let synced = 0;

  for (const receipt of data.results || []) {
    const subtotal = (receipt.subtotal?.amount || 0) / (receipt.subtotal?.divisor || 100);
    const shipping = (receipt.total_shipping_cost?.amount || 0) / (receipt.total_shipping_cost?.divisor || 100);
    const total = (receipt.grandtotal?.amount || 0) / (receipt.grandtotal?.divisor || 100);

    const transactionFee = subtotal * 0.065;
    const paymentFee = (total * 0.03) + 0.25;

    await supabase.from('orders').upsert({
      store_id: storeId,
      channel_connection_id: connection.id,
      platform: 'etsy',
      platform_order_id: receipt.receipt_id.toString(),
      order_number: receipt.receipt_id.toString(),
      order_date: new Date(receipt.created_timestamp * 1000).toISOString(),
      gross_revenue: subtotal,
      shipping_revenue: shipping,
      tax_collected: 0,
      platform_fees: transactionFee,
      payment_processing_fee: paymentFee,
      net_revenue: total - transactionFee - paymentFee,
      financial_status: receipt.status,
      currency: receipt.grandtotal?.currency_code || 'USD',
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'store_id,platform,platform_order_id',
    });

    synced++;
  }

  return synced;
}
