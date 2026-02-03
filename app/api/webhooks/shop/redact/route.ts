import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Verify Shopify webhook HMAC signature - tries multiple secrets
function verifyShopifyWebhook(body: string, hmacHeader: string): boolean {
  const secrets = [
    process.env.SHOPIFY_API_SECRET,
    process.env.SHOPIFY_API_SECRET_PRODUCTION,
    process.env.SHOPIFY_API_SECRET_DEV,
  ].filter(Boolean);

  if (secrets.length === 0) {
    console.error('❌ No Shopify API secrets configured');
    return false;
  }

  // Try each secret until one validates
  for (const secret of secrets) {
    const generatedHash = crypto
      .createHmac('sha256', secret!)
      .update(body, 'utf8')
      .digest('base64');

    try {
      if (crypto.timingSafeEqual(Buffer.from(generatedHash), Buffer.from(hmacHeader))) {
        return true;
      }
    } catch {
      // Buffer lengths don't match, try next secret
    }
  }

  return false;
}

// GDPR: Shop Redact (Delete All Shop Data)
// Shopify sends this 48 hours after a merchant uninstalls the app
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256');

    // ALWAYS verify HMAC signature - reject if missing or invalid
    if (!hmacHeader) {
      console.error('❌ Missing HMAC header for shop/redact');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    if (!verifyShopifyWebhook(body, hmacHeader)) {
      console.error('❌ Invalid webhook signature for shop/redact');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log('✅ HMAC verified for shop/redact');

    const data = JSON.parse(body);
    console.log('Shop redact webhook received:', {
      shop_id: data.shop_id,
      shop_domain: data.shop_domain,
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the store by shop domain
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('shop_domain', data.shop_domain)
      .single();

    if (store) {
      // Delete all data associated with this store
      // Order matters due to foreign key constraints

      // 1. Delete orders
      await supabase
        .from('orders')
        .delete()
        .eq('store_id', store.id);

      // 2. Delete channel connections
      await supabase
        .from('channel_connections')
        .delete()
        .eq('store_id', store.id);

      // 3. Delete the store itself
      await supabase
        .from('stores')
        .delete()
        .eq('id', store.id);

      console.log('✅ All shop data deleted for:', data.shop_domain);
    }

    return NextResponse.json({
      success: true,
      message: 'Shop data deleted'
    });
  } catch (error) {
    console.error('Error processing shop redact webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
