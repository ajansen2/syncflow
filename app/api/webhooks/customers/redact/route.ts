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

// GDPR: Customer Redact (Delete Customer Data)
// Shopify sends this when a customer requests their data be deleted
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256');

    // ALWAYS verify HMAC signature - reject if missing or invalid
    if (!hmacHeader) {
      console.error('❌ Missing HMAC header for customers/redact');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    if (!verifyShopifyWebhook(body, hmacHeader)) {
      console.error('❌ Invalid webhook signature for customers/redact');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log('✅ HMAC verified for customers/redact');

    const data = JSON.parse(body);
    console.log('Customer redact webhook received:', {
      shop_domain: data.shop_domain,
      customer_id: data.customer?.id,
      customer_email: data.customer?.email,
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete/anonymize customer data from our database
    // For SyncFlow, we need to anonymize order data for this customer
    if (data.customer?.email) {
      // Anonymize the customer email in orders table
      const { error } = await supabase
        .from('orders')
        .update({
          customer_email: 'redacted@privacy.local',
          customer_name: 'Redacted Customer'
        })
        .eq('customer_email', data.customer.email);

      if (error) {
        console.error('Error redacting customer data:', error);
      } else {
        console.log('Customer data redacted successfully for:', data.customer.email);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Customer data redacted'
    });
  } catch (error) {
    console.error('Error processing customer redact webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
