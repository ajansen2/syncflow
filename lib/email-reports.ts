/**
 * SyncFlow Email Reports System
 * Sends weekly/monthly order summaries to merchants
 */

import { createClient } from '@supabase/supabase-js';

interface ReportData {
  storeName: string;
  shopDomain: string;
  dateRange: string;
  totalOrders: number;
  grossRevenue: number;
  totalFees: number;
  netRevenue: number;
  channels: Array<{
    name: string;
    orders: number;
    revenue: number;
    fees: number;
  }>;
}

/**
 * Generate HTML email template for SyncFlow order report
 */
export function generateReportEmail(data: ReportData): string {
  const shopName = data.shopDomain?.replace('.myshopify.com', '') || '';
  const dashboardUrl = shopName
    ? `https://admin.shopify.com/store/${shopName}/apps/syncflow`
    : 'https://syncflow-blush.vercel.app/dashboard';
  const settingsUrl = shopName
    ? `https://admin.shopify.com/store/${shopName}/apps/syncflow/dashboard/settings`
    : 'https://syncflow-blush.vercel.app/dashboard/settings';

  // Calculate channel percentages for the bar
  const totalChannelRevenue = data.channels.reduce((sum, c) => sum + c.revenue, 0);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SyncFlow Order Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">SyncFlow</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Order Summary Report</p>
              <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0 0; font-size: 14px;">${data.storeName} • ${data.dateRange}</p>
            </td>
          </tr>

          <!-- Summary Stats -->
          <tr>
            <td style="padding: 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding: 10px;">
                    <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                      <p style="color: rgba(255,255,255,0.6); margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Total Orders</p>
                      <p style="color: #22d3ee; margin: 0; font-size: 32px; font-weight: bold;">${data.totalOrders}</p>
                    </div>
                  </td>
                  <td width="50%" style="padding: 10px;">
                    <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                      <p style="color: rgba(255,255,255,0.6); margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Gross Revenue</p>
                      <p style="color: #22c55e; margin: 0; font-size: 32px; font-weight: bold;">$${data.grossRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding: 10px;">
                    <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                      <p style="color: rgba(255,255,255,0.6); margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Total Fees</p>
                      <p style="color: #ef4444; margin: 0; font-size: 32px; font-weight: bold;">-$${data.totalFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  </td>
                  <td width="50%" style="padding: 10px;">
                    <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                      <p style="color: rgba(255,255,255,0.6); margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Net Revenue</p>
                      <p style="color: #22d3ee; margin: 0; font-size: 32px; font-weight: bold;">$${data.netRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Revenue by Channel -->
          ${data.channels.length > 0 ? `
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="color: white; margin: 0 0 15px 0; font-size: 18px;">Revenue by Channel</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(255,255,255,0.05); border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                <tr style="background-color: rgba(255,255,255,0.1);">
                  <td style="padding: 12px 15px; color: rgba(255,255,255,0.6); font-size: 12px; text-transform: uppercase;">Channel</td>
                  <td style="padding: 12px 15px; color: rgba(255,255,255,0.6); font-size: 12px; text-transform: uppercase; text-align: right;">Orders</td>
                  <td style="padding: 12px 15px; color: rgba(255,255,255,0.6); font-size: 12px; text-transform: uppercase; text-align: right;">Revenue</td>
                  <td style="padding: 12px 15px; color: rgba(255,255,255,0.6); font-size: 12px; text-transform: uppercase; text-align: right;">Fees</td>
                </tr>
                ${data.channels.map((channel) => {
                  const channelColor = channel.name.toLowerCase() === 'shopify' ? '#96bf48'
                    : channel.name.toLowerCase() === 'amazon' ? '#ff9900'
                    : channel.name.toLowerCase() === 'etsy' ? '#f56400'
                    : '#22d3ee';
                  return `
                <tr style="border-top: 1px solid rgba(255,255,255,0.1);">
                  <td style="padding: 15px;">
                    <p style="color: ${channelColor}; margin: 0; font-weight: 600;">${channel.name}</p>
                  </td>
                  <td style="padding: 15px; color: white; text-align: right;">${channel.orders}</td>
                  <td style="padding: 15px; color: #22c55e; text-align: right;">$${channel.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style="padding: 15px; color: #ef4444; text-align: right;">-$${channel.fees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                `}).join('')}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- CTA -->
          <tr>
            <td style="padding: 0 30px 30px 30px; text-align: center;">
              <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 14px;">View Full Dashboard</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: rgba(0,0,0,0.2); text-align: center;">
              <p style="color: rgba(255,255,255,0.4); margin: 0; font-size: 12px;">
                You're receiving this because you enabled email reports in SyncFlow.
                <br>
                <a href="${settingsUrl}" style="color: #22d3ee;">Manage preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Send email report using Resend API
 */
export async function sendReportEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'reports@send.argora.ai';

  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `SyncFlow <${fromEmail}>`,
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to send email:', error);
      return false;
    }

    console.log(`✅ Report email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Generate and send weekly/monthly reports for all subscribed merchants
 */
export async function sendScheduledReports(frequency: 'weekly' | 'monthly') {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get all stores with email reports enabled
  const { data: stores, error } = await supabase
    .from('stores')
    .select('*')
    .eq('email_report_frequency', frequency)
    .eq('subscription_status', 'active');

  if (error || !stores) {
    console.error('Failed to fetch stores for reports:', error);
    return;
  }

  console.log(`📧 Sending ${frequency} reports to ${stores.length} stores`);

  const now = new Date();
  const startDate = frequency === 'weekly'
    ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    : new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  for (const store of stores) {
    try {
      // Get orders for the period
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', store.id)
        .gte('order_date', startDate.toISOString())
        .lte('order_date', now.toISOString());

      if (!orders) continue;

      // Calculate totals
      const grossRevenue = orders.reduce((sum, o) => sum + (o.gross_revenue || o.order_total || 0), 0);
      const totalFees = orders.reduce((sum, o) => sum + (o.total_fees || 0), 0);
      const netRevenue = orders.reduce((sum, o) => sum + (o.net_revenue || 0), 0);

      // Group by channel
      const channelMap = new Map<string, { orders: number; revenue: number; fees: number }>();
      for (const order of orders) {
        const platform = order.platform || 'Shopify';
        const existing = channelMap.get(platform) || { orders: 0, revenue: 0, fees: 0 };
        channelMap.set(platform, {
          orders: existing.orders + 1,
          revenue: existing.revenue + (order.gross_revenue || order.order_total || 0),
          fees: existing.fees + (order.total_fees || 0),
        });
      }

      const channels = Array.from(channelMap.entries())
        .map(([name, data]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          ...data,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      const reportData: ReportData = {
        storeName: store.store_name || store.shop_domain,
        shopDomain: store.shop_domain || '',
        dateRange: frequency === 'weekly' ? 'Last 7 days' : 'Last 30 days',
        totalOrders: orders.length,
        grossRevenue,
        totalFees,
        netRevenue,
        channels,
      };

      const html = generateReportEmail(reportData);
      const subject = `📊 ${frequency === 'weekly' ? 'Weekly' : 'Monthly'} Order Summary - ${store.store_name || store.shop_domain}`;

      await sendReportEmail(store.email, subject, html);
    } catch (error) {
      console.error(`Failed to send report for store ${store.id}:`, error);
    }
  }
}
