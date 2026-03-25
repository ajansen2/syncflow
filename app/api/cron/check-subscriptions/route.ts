import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Cron Job: Check Subscription Status & Handle Expired Trials
 * - Marks expired trials
 * - Creates billing charges for expired trial users
 * - Sends reminder emails
 *
 * Run daily at midnight: 0 0 * * *
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date();
    const results = {
      expired_trials: 0,
      charges_created: 0,
      reminders_sent: 0,
      errors: [] as string[],
    };

    // 1. Find stores with expired trials that haven't been marked
    const { data: expiredTrials, error: expiredError } = await supabase
      .from('stores')
      .select('*')
      .eq('subscription_status', 'trial')
      .lt('trial_ends_at', now.toISOString())
      .neq('access_token', 'revoked')
      .not('access_token', 'is', null);

    if (expiredError) {
      console.error('Error fetching expired trials:', expiredError);
      results.errors.push('Failed to fetch expired trials');
    }

    // Process each expired trial
    for (const store of expiredTrials || []) {
      try {
        console.log(`[Subscription] Processing expired trial for ${store.shop_domain}`);

        // Check if store has a pending or active charge
        const existingChargeStatus = await checkExistingCharge(store);

        if (existingChargeStatus === 'active') {
          // Charge is active, update subscription status
          await supabase
            .from('stores')
            .update({
              subscription_status: 'active',
              billing_status: 'active',
              updated_at: now.toISOString(),
            })
            .eq('id', store.id);

          console.log(`[Subscription] ${store.shop_domain} has active charge, updated to active`);
          continue;
        }

        if (existingChargeStatus === 'pending') {
          // Send reminder email about pending charge
          await sendBillingReminder(store, 'pending');
          results.reminders_sent++;
          continue;
        }

        // No active/pending charge - create one and mark as expired
        const chargeCreated = await createBillingCharge(store);

        if (chargeCreated) {
          results.charges_created++;
          console.log(`[Subscription] Created charge for ${store.shop_domain}`);
        }

        // Mark as expired
        await supabase
          .from('stores')
          .update({
            subscription_status: 'expired',
            updated_at: now.toISOString(),
          })
          .eq('id', store.id);

        results.expired_trials++;

        // Send expiration email
        await sendBillingReminder(store, 'expired');
        results.reminders_sent++;

      } catch (err: any) {
        console.error(`[Subscription] Error processing ${store.shop_domain}:`, err);
        results.errors.push(`${store.shop_domain}: ${err.message}`);
      }
    }

    // 2. Find trials expiring soon (3 days or less) and send reminders
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const { data: expiringTrials } = await supabase
      .from('stores')
      .select('*')
      .eq('subscription_status', 'trial')
      .gt('trial_ends_at', now.toISOString())
      .lt('trial_ends_at', threeDaysFromNow.toISOString())
      .is('trial_reminder_sent', null);

    for (const store of expiringTrials || []) {
      try {
        await sendBillingReminder(store, 'expiring_soon');
        await supabase
          .from('stores')
          .update({ trial_reminder_sent: now.toISOString() })
          .eq('id', store.id);
        results.reminders_sent++;
      } catch (err: any) {
        console.error(`[Subscription] Error sending reminder to ${store.shop_domain}:`, err);
      }
    }

    console.log('[Subscription] Cron complete:', results);

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error: any) {
    console.error('[Subscription] Cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function checkExistingCharge(store: any): Promise<'active' | 'pending' | 'none'> {
  try {
    const response = await fetch(
      `https://${store.shop_domain}/admin/api/2024-10/recurring_application_charges.json`,
      {
        headers: { 'X-Shopify-Access-Token': store.access_token },
      }
    );

    if (!response.ok) return 'none';

    const data = await response.json();
    const charges = data.recurring_application_charges || [];

    // Check for active charge
    const activeCharge = charges.find((c: any) => c.status === 'active');
    if (activeCharge) return 'active';

    // Check for pending charge
    const pendingCharge = charges.find((c: any) => c.status === 'pending');
    if (pendingCharge) return 'pending';

    return 'none';
  } catch (error) {
    console.error('Error checking existing charge:', error);
    return 'none';
  }
}

async function createBillingCharge(store: any): Promise<boolean> {
  try {
    const isTestCharge = store.shop_domain.includes('-test') ||
                         store.shop_domain.includes('development') ||
                         store.shop_domain.includes('dev-');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://syncflow-blush.vercel.app';
    const returnUrl = `${appUrl}/api/billing/callback?shop=${store.shop_domain}&store_id=${store.id}`;

    const response = await fetch(
      `https://${store.shop_domain}/admin/api/2024-10/recurring_application_charges.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': store.access_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recurring_application_charge: {
            name: 'SyncFlow - All Channels',
            price: 29.99,
            return_url: returnUrl,
            ...(isTestCharge && { test: true }),
          }
        })
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Error creating billing charge:', error);
    return false;
  }
}

async function sendBillingReminder(store: any, type: 'pending' | 'expired' | 'expiring_soon'): Promise<void> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    const subjects: Record<string, string> = {
      pending: 'Complete your SyncFlow subscription',
      expired: 'Your SyncFlow trial has expired',
      expiring_soon: 'Your SyncFlow trial is ending soon',
    };

    await fetch(`${appUrl}/api/emails/trial-reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: store.email,
        subject: subjects[type],
        shop: store.shop_domain,
        type,
      }),
    });
  } catch (error) {
    console.error('Error sending billing reminder:', error);
  }
}
