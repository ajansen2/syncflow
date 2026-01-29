import { NextRequest, NextResponse } from 'next/server';

/**
 * Amazon Seller Central OAuth - Start Connection
 * Redirects merchant to Amazon to authorize access
 */
export async function GET(request: NextRequest) {
  const storeId = request.nextUrl.searchParams.get('store_id');
  const marketplace = request.nextUrl.searchParams.get('marketplace') || 'US';

  if (!storeId) {
    return NextResponse.json({ error: 'Missing store_id' }, { status: 400 });
  }

  // Amazon SP-API OAuth endpoints by marketplace
  const marketplaceEndpoints: Record<string, string> = {
    US: 'https://sellercentral.amazon.com',
    CA: 'https://sellercentral.amazon.ca',
    UK: 'https://sellercentral.amazon.co.uk',
    DE: 'https://sellercentral.amazon.de',
  };

  const baseUrl = marketplaceEndpoints[marketplace] || marketplaceEndpoints.US;

  // State contains store_id and marketplace for callback
  const state = Buffer.from(JSON.stringify({ storeId, marketplace })).toString('base64');

  const authUrl = new URL(`${baseUrl}/apps/authorize/consent`);
  authUrl.searchParams.set('application_id', process.env.AMAZON_APP_ID!);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/channels/amazon/callback`);

  return NextResponse.redirect(authUrl.toString());
}
