import { NextRequest, NextResponse } from 'next/server';
import { generateReportEmail, sendReportEmail } from '@/lib/email-reports';

/**
 * Send a test email report
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, storeName, shopDomain } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Generate test report data for SyncFlow
    const testData = {
      storeName: storeName || 'Test Store',
      shopDomain: shopDomain || '',
      dateRange: 'Last 7 days (Test)',
      totalOrders: 47,
      grossRevenue: 14583.19,
      totalFees: 716.08,
      netRevenue: 13867.11,
      channels: [
        { name: 'Shopify', orders: 25, revenue: 8250.00, fees: 412.50 },
        { name: 'Amazon', orders: 15, revenue: 4533.19, fees: 226.66 },
        { name: 'Etsy', orders: 7, revenue: 1800.00, fees: 76.92 },
      ],
    };

    const html = generateReportEmail(testData);
    const subject = '📊 SyncFlow Test Report';

    const success = await sendReportEmail(email, subject, html);

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${email}`,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email. Check RESEND_API_KEY configuration.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending test report:', error);
    return NextResponse.json(
      { error: 'Failed to send test report' },
      { status: 500 }
    );
  }
}
