import { NextRequest, NextResponse } from 'next/server';
import { syncStoreOrders } from '@/lib/sync-orders';

/**
 * Sync Orders from All Connected Channels
 * POST /api/sync/orders
 */
export async function POST(request: NextRequest) {
  try {
    const { store_id, platform, days = 30 } = await request.json();

    if (!store_id) {
      return NextResponse.json({ error: 'Missing store_id' }, { status: 400 });
    }

    const result = await syncStoreOrders(store_id, days, platform);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, results: result.results });
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
  }
}
