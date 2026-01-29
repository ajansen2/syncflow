import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { syncStoreOrders } from '@/lib/sync-orders';

/**
 * Cron Job: Sync Orders for All Active Stores
 * Called by Vercel Cron based on schedule
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const frequency = request.nextUrl.searchParams.get('frequency') || 'daily';

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all stores (active or trial)
    const { data: stores, error } = await supabase
      .from('stores')
      .select('id, shop_domain, sync_frequency')
      .or('subscription_status.eq.active,subscription_status.eq.trial');

    if (error) {
      console.error('Error fetching stores:', error);
      return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
    }

    // Filter by sync frequency
    const storesToSync = (stores || []).filter(store => {
      const storeFrequency = store.sync_frequency || 'daily';
      if (frequency === 'hourly') {
        return storeFrequency === 'hourly';
      }
      return storeFrequency === 'daily' || storeFrequency === 'hourly';
    });

    console.log(`[Cron] Syncing ${storesToSync.length} stores (frequency: ${frequency})`);

    const results: { store_id: string; shop_domain: string; success: boolean; error?: string; synced?: number }[] = [];

    for (const store of storesToSync) {
      try {
        // Call sync logic directly (no HTTP request)
        const syncResult = await syncStoreOrders(store.id, 7);

        if (syncResult.success) {
          const totalSynced = Object.values(syncResult.results || {}).reduce(
            (sum: number, r: any) => sum + (r.synced || 0), 0
          );
          results.push({ store_id: store.id, shop_domain: store.shop_domain, success: true, synced: totalSynced });
          console.log(`[Cron] Synced store ${store.shop_domain}: ${totalSynced} orders`);
        } else {
          results.push({ store_id: store.id, shop_domain: store.shop_domain, success: false, error: syncResult.error });
          console.error(`[Cron] Failed to sync ${store.shop_domain}:`, syncResult.error);
        }
      } catch (err: any) {
        results.push({ store_id: store.id, shop_domain: store.shop_domain, success: false, error: err.message });
        console.error(`[Cron] Error syncing ${store.shop_domain}:`, err.message);
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      frequency,
      stores_synced: successful,
      stores_failed: failed,
      results,
    });
  } catch (error: any) {
    console.error('[Cron] Sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
