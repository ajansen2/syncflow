import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedShop } from '@/lib/verify-session';

/**
 * Analytics Summary
 * Returns revenue and profit metrics by channel
 */
export async function GET(request: NextRequest) {
  const shop = getAuthenticatedShop(request);
  if (!shop) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const storeId = request.nextUrl.searchParams.get('store_id');
  const days = parseInt(request.nextUrl.searchParams.get('days') || '30');

  if (!storeId) {
    return NextResponse.json({ error: 'Missing store_id' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get orders for period
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('store_id', storeId)
    .gte('order_date', startDate.toISOString())
    .order('order_date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  // Calculate totals by platform
  const platformSummary: Record<string, {
    orders: number;
    grossRevenue: number;
    fees: number;
    netRevenue: number;
  }> = {};

  for (const order of orders || []) {
    if (!platformSummary[order.platform]) {
      platformSummary[order.platform] = {
        orders: 0,
        grossRevenue: 0,
        fees: 0,
        netRevenue: 0,
      };
    }

    platformSummary[order.platform].orders += 1;
    platformSummary[order.platform].grossRevenue += parseFloat(order.gross_revenue) || 0;
    platformSummary[order.platform].fees += (parseFloat(order.platform_fees) || 0) + (parseFloat(order.payment_processing_fee) || 0);
    platformSummary[order.platform].netRevenue += parseFloat(order.net_revenue) || 0;
  }

  // Calculate totals
  const totalOrders = orders?.length || 0;
  const totalGrossRevenue = Object.values(platformSummary).reduce((sum, p) => sum + p.grossRevenue, 0);
  const totalFees = Object.values(platformSummary).reduce((sum, p) => sum + p.fees, 0);
  const totalNetRevenue = Object.values(platformSummary).reduce((sum, p) => sum + p.netRevenue, 0);

  // Daily breakdown for chart
  const dailyData: Record<string, Record<string, { revenue: number; orders: number }>> = {};

  for (const order of orders || []) {
    const date = order.order_date?.split('T')[0];
    if (date) {
      if (!dailyData[date]) {
        dailyData[date] = {};
      }
      if (!dailyData[date][order.platform]) {
        dailyData[date][order.platform] = { revenue: 0, orders: 0 };
      }
      dailyData[date][order.platform].revenue += parseFloat(order.net_revenue) || 0;
      dailyData[date][order.platform].orders += 1;
    }
  }

  const chartData = Object.entries(dailyData)
    .map(([date, platforms]) => ({
      date,
      ...Object.fromEntries(
        Object.entries(platforms).map(([platform, data]) => [
          platform,
          data.revenue,
        ])
      ),
      total: Object.values(platforms).reduce((sum, p) => sum + p.revenue, 0),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Get channel connections for status
  const { data: connections } = await supabase
    .from('channel_connections')
    .select('platform, account_name, is_active, last_sync_at, sync_status')
    .eq('store_id', storeId);

  return NextResponse.json({
    summary: {
      totalOrders,
      totalGrossRevenue,
      totalFees,
      totalNetRevenue,
      feePercentage: totalGrossRevenue > 0 ? (totalFees / totalGrossRevenue * 100) : 0,
    },
    byPlatform: platformSummary,
    chartData,
    connections: connections || [],
    recentOrders: orders?.slice(0, 20) || [],
  });
}
