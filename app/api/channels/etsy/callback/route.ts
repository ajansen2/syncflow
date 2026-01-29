import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Etsy OAuth Callback
 * Exchanges authorization code for access token
 */
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');
    const state = request.nextUrl.searchParams.get('state');

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Decode state
    const { storeId, codeVerifier } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.etsy.com/v3/public/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.ETSY_API_KEY!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/channels/etsy/callback`,
        code,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Etsy token exchange failed:', await tokenResponse.text());
      return NextResponse.json({ error: 'Token exchange failed' }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();

    // Get shop info
    const shopResponse = await fetch('https://api.etsy.com/v3/application/users/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await shopResponse.json();

    // Save connection to database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.from('channel_connections').upsert({
      store_id: storeId,
      platform: 'etsy',
      account_id: userData.user_id?.toString(),
      account_name: userData.login_name,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      is_active: true,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'store_id,platform,marketplace',
    });

    console.log('✅ Etsy connected for store:', storeId);

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?etsy_connected=true`);
  } catch (error) {
    console.error('Etsy callback error:', error);
    return NextResponse.json({ error: 'Connection failed' }, { status: 500 });
  }
}
