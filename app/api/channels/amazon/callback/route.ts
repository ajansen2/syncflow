import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Amazon Seller Central OAuth Callback
 * Exchanges authorization code for access token
 */
export async function GET(request: NextRequest) {
  try {
    const spapi_oauth_code = request.nextUrl.searchParams.get('spapi_oauth_code');
    const state = request.nextUrl.searchParams.get('state');
    const selling_partner_id = request.nextUrl.searchParams.get('selling_partner_id');

    if (!spapi_oauth_code || !state) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Decode state
    const { storeId, marketplace } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.amazon.com/auth/o2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: spapi_oauth_code,
        client_id: process.env.AMAZON_CLIENT_ID!,
        client_secret: process.env.AMAZON_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/channels/amazon/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Amazon token exchange failed:', await tokenResponse.text());
      return NextResponse.json({ error: 'Token exchange failed' }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();

    // Save connection to database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.from('channel_connections').upsert({
      store_id: storeId,
      platform: 'amazon',
      account_id: selling_partner_id,
      marketplace: marketplace,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      is_active: true,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'store_id,platform,marketplace',
    });

    console.log('✅ Amazon connected for store:', storeId);

    // Redirect back to dashboard
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?amazon_connected=true`);
  } catch (error) {
    console.error('Amazon callback error:', error);
    return NextResponse.json({ error: 'Connection failed' }, { status: 500 });
  }
}
