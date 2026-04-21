// app/api/checkout/route.ts
// Stripe billing has been removed. All billing is handled through Shopify's Billing API.
// See /api/billing/check and /api/billing/callback for the active billing flow.

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Stripe checkout has been removed. Billing is handled through Shopify.' },
    { status: 410 }
  );
}
