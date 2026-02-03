import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * Shopify Refunds Webhook
 * Handles refunds/create events to update order status
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const hmac = request.headers.get('X-Shopify-Hmac-Sha256');
    const shop = request.headers.get('X-Shopify-Shop-Domain');

    console.log('💰 Refund webhook received:', { shop });

    // Verify webhook signature
    if (!hmac || !verifyWebhook(rawBody, hmac)) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const refundData = JSON.parse(rawBody);
    console.log('💰 Refund data:', {
      refund_id: refundData.id,
      order_id: refundData.order_id,
    });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get store by shop domain
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('shop_domain', shop)
      .single();

    if (!store) {
      console.log('⚠️ Store not found:', shop);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Update order status to refunded
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        financial_status: 'refunded',
        updated_at: new Date().toISOString(),
      })
      .eq('store_id', store.id)
      .eq('platform_order_id', refundData.order_id?.toString());

    if (updateError) {
      console.error('❌ Error updating order:', updateError);
    } else {
      console.log('✅ Order marked as refunded:', refundData.order_id);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Refund webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Verify Shopify webhook signature
function verifyWebhook(data: string, hmac: string): boolean {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) {
    console.error('❌ No Shopify API secret configured');
    return false;
  }

  const hash = crypto
    .createHmac('sha256', secret)
    .update(data, 'utf8')
    .digest('base64');

  return hash === hmac;
}
