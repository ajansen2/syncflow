// app/api/webhooks/stripe/route.ts
// Stripe webhooks have been removed. All billing is handled through Shopify's Billing API.
// See /api/billing/check and /api/billing/callback for the active billing flow.

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Stripe webhooks have been removed. Billing is handled through Shopify.' },
    { status: 410 }
  );
}
