import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Cron Job: Sync Orders for All Active Stores
 * Called by Vercel Cron based on schedule
 *
 * Frequency query param:
 * - 'hourly' - runs every hour
 * - 'daily' - runs once per day
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

    // Get all active stores with matching sync frequency
    // For now, sync all stores. Later we can add sync_frequency column
    const { data: stores, error } = await supabase
      .from('stores')
      .select('id, shop_domain, sync_frequency')
      .eq('subscription_status', 'active')
      .or('subscription_status.eq.trial');

    if (error) {
      console.error('Error fetching stores:', error);
      return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
    }

    // Also get trial stores
    const { data: trialStores } = await supabase
      .from('stores')
      .select('id, shop_domain, sync_frequency')
      .eq('subscription_status', 'trial');

    const allStores = [...(stores || []), ...(trialStores || [])];

    // Filter by sync frequency (default to daily if not set)
    const storesToSync = allStores.filter(store => {
      const storeFrequency = store.sync_frequency || 'daily';
      if (frequency === 'hourly') {
        return storeFrequency === 'hourly';
      }
      // Daily cron syncs both daily and hourly (in case hourly was missed)
      return storeFrequency === 'daily' || storeFrequency === 'hourly';
    });

    console.log(`[Cron] Syncing ${storesToSync.length} stores (frequency: ${frequency})`);

    const results: { store_id: string; success: boolean; error?: string }[] = [];

    for (const store of storesToSync) {
      try {
        // Call the sync endpoint internally
        const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/sync/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            store_id: store.id,
            days: 7, // Sync last 7 days
          }),
        });

        if (syncResponse.ok) {
          results.push({ store_id: store.id, success: true });
          console.log(`[Cron] Synced store ${store.shop_domain}`);
        } else {
          const errorData = await syncResponse.json();
          results.push({ store_id: store.id, success: false, error: errorData.error });
          console.error(`[Cron] Failed to sync ${store.shop_domain}:`, errorData.error);
        }
      } catch (err: any) {
        results.push({ store_id: store.id, success: false, error: err.message });
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
