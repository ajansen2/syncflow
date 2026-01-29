import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Etsy OAuth - Start Connection
 * Uses OAuth 2.0 with PKCE
 */
export async function GET(request: NextRequest) {
  const storeId = request.nextUrl.searchParams.get('store_id');

  if (!storeId) {
    return NextResponse.json({ error: 'Missing store_id' }, { status: 400 });
  }

  // Generate PKCE code verifier and challenge
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  // State contains store_id and code_verifier for callback
  const state = Buffer.from(JSON.stringify({ storeId, codeVerifier })).toString('base64');

  const authUrl = new URL('https://www.etsy.com/oauth/connect');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', process.env.ETSY_API_KEY!);
  authUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/channels/etsy/callback`);
  authUrl.searchParams.set('scope', 'transactions_r shops_r');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  return NextResponse.redirect(authUrl.toString());
}
