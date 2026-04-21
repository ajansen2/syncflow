import { NextRequest, NextResponse } from 'next/server';
import { syncStoreOrders } from '@/lib/sync-orders';
import { getAuthenticatedShop } from '@/lib/verify-session';

/**
 * Sync Orders from All Connected Channels
 * POST /api/sync/orders
 */
export async function POST(request: NextRequest) {
  try {
    const shop = getAuthenticatedShop(request);
    if (!shop) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    // Accept both storeId (from dashboard) and store_id (from cron)
    const store_id = body.storeId || body.store_id;
    const platform = body.platform;
    const days = body.days || 30;

    if (!store_id) {
      return NextResponse.json({ error: 'Missing store_id' }, { status: 400 });
    }

    console.log('📦 Sync request for store:', store_id, 'platform:', platform || 'all', 'days:', days);

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
