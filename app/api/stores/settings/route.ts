import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedShop } from '@/lib/verify-session';

/**
 * Update Store Settings
 * PATCH /api/stores/settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const shop = getAuthenticatedShop(request);
    if (!shop) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id, sync_frequency, email_report_frequency } = await request.json();

    if (!store_id) {
      return NextResponse.json({ error: 'Missing store_id' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (sync_frequency) {
      if (!['hourly', 'daily', 'manual'].includes(sync_frequency)) {
        return NextResponse.json({ error: 'Invalid sync_frequency' }, { status: 400 });
      }
      updates.sync_frequency = sync_frequency;
    }

    if (email_report_frequency !== undefined) {
      if (!['none', 'weekly', 'monthly'].includes(email_report_frequency)) {
        return NextResponse.json({ error: 'Invalid email_report_frequency' }, { status: 400 });
      }
      updates.email_report_frequency = email_report_frequency;
    }

    const { data, error } = await supabase
      .from('stores')
      .update(updates)
      .eq('id', store_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating store settings:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true, store: data });
  } catch (error: any) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
