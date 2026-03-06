import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, shop, type } = await request.json();

    if (!to || !shop || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@syncflow.io';

    if (!SENDGRID_API_KEY) {
      console.warn('SENDGRID_API_KEY not configured - email not sent');
      return NextResponse.json({ success: false, message: 'Email service not configured' });
    }

    const shopName = shop.replace('.myshopify.com', '');
    const appUrl = `https://admin.shopify.com/store/${shopName}/apps/syncflow`;

    const content = getEmailContent(type, shopName, appUrl);

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 40px; }
    .logo { font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #10b981, #059669); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .card { background: linear-gradient(135deg, #1a1a1a, #2a2a2a); border: 1px solid #333333; border-radius: 16px; padding: 30px; margin: 20px 0; }
    .alert-badge { background: ${content.badgeColor}; color: #ffffff; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; }
    .footer { text-align: center; color: #666666; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #333333; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">SyncFlow</div>
      <h1 style="color: #ffffff; margin: 20px 0;">${content.title}</h1>
    </div>

    <div class="alert-badge">
      <h2 style="margin: 0; font-size: 24px;">${content.badge}</h2>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">${content.badgeSubtext}</p>
    </div>

    <div class="card">
      <h2 style="color: #ffffff; margin-bottom: 20px;">${content.cardTitle}</h2>
      <p style="color: #cccccc; line-height: 1.6;">
        ${content.cardBody}
      </p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${appUrl}" class="button">
          ${content.buttonText} →
        </a>
      </div>
    </div>

    <div class="card">
      <h3 style="color: #ffffff; margin-bottom: 15px;">Why SyncFlow Pro?</h3>
      <ul style="color: #cccccc; line-height: 1.8; padding-left: 20px;">
        <li>Sync orders across all your sales channels</li>
        <li>Real-time inventory management</li>
        <li>Advanced analytics and insights</li>
        <li>Priority customer support</li>
      </ul>
    </div>

    <div class="footer">
      <p>© 2025 SyncFlow - All Rights Reserved</p>
      <p style="margin-top: 10px;">
        <a href="mailto:support@syncflow.io" style="color: #10b981;">support@syncflow.io</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }], subject }],
        from: { email: FROM_EMAIL, name: 'SyncFlow' },
        content: [{ type: 'text/html', value: emailHtml }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('SendGrid error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending trial reminder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getEmailContent(type: string, shopName: string, appUrl: string) {
  const contents: Record<string, any> = {
    expiring_soon: {
      title: 'Your Trial is Ending Soon',
      badge: '⏰ 3 Days Left',
      badgeSubtext: 'Your SyncFlow trial expires in 3 days',
      badgeColor: 'linear-gradient(135deg, #f59e0b, #d97706)',
      cardTitle: 'Don\'t Lose Your Data',
      cardBody: `Hi there! Your SyncFlow trial for <strong>${shopName}</strong> is ending in just 3 days. To continue syncing your orders and accessing your analytics, upgrade to Pro now.`,
      buttonText: 'Upgrade to Pro',
    },
    expired: {
      title: 'Your Trial Has Expired',
      badge: '🔒 Trial Expired',
      badgeSubtext: 'Your SyncFlow access has been paused',
      badgeColor: 'linear-gradient(135deg, #ef4444, #dc2626)',
      cardTitle: 'Reactivate Your Account',
      cardBody: `Your SyncFlow trial for <strong>${shopName}</strong> has expired. Your order sync has been paused. Upgrade now to restore access and continue growing your business.`,
      buttonText: 'Upgrade Now',
    },
    pending: {
      title: 'Complete Your Subscription',
      badge: '⏳ Payment Pending',
      badgeSubtext: 'Your subscription is waiting for approval',
      badgeColor: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      cardTitle: 'One More Step',
      cardBody: `You started the upgrade process for <strong>${shopName}</strong> but haven't completed it yet. Click below to finish setting up your Pro subscription.`,
      buttonText: 'Complete Setup',
    },
  };

  return contents[type] || contents.expired;
}
