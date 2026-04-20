/**
 * Onboarding Email Sequence
 *
 * Triggered by cron, sends timed emails based on when the merchant installed.
 * Sequence:
 *   Day 0 (immediate): Welcome to SyncFlow
 *   Day 1: Connect your channels
 *   Day 3: Understand your true profit
 *   Day 5: Export for your accountant
 *   Day 6: Trial ending — upgrade to Pro
 */

import { Resend } from 'resend';

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}
const FROM = 'SyncFlow <hello@send.argora.ai>';

function dashboardUrl(shopDomain: string): string {
  const shopName = shopDomain.replace('.myshopify.com', '');
  return `https://admin.shopify.com/store/${shopName}/apps/syncflow`;
}

function settingsUrl(shopDomain: string): string {
  const shopName = shopDomain.replace('.myshopify.com', '');
  return `https://admin.shopify.com/store/${shopName}/apps/syncflow/settings`;
}

function wrapEmail(body: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:28px;font-weight:bold;background:linear-gradient(to right,#06b6d4,#0ea5e9);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">SyncFlow</div>
    </div>
    <div style="background:#141414;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px;">
      ${body}
    </div>
    <div style="text-align:center;margin-top:24px;color:rgba(255,255,255,0.3);font-size:12px;">
      <p>SyncFlow — Multi-Channel Order Management</p>
      <p>You're receiving this because you installed SyncFlow. <a href="https://www.argora.ai" style="color:rgba(255,255,255,0.4);">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;
}

function ctaButton(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;padding:14px 32px;background:linear-gradient(to right,#06b6d4,#0ea5e9);color:white;font-weight:bold;font-size:16px;text-decoration:none;border-radius:12px;margin-top:8px;">${text}</a>`;
}

// ─── Email Templates ────────────────────────────────────────

export function welcomeEmail(storeName: string, shopDomain: string): { subject: string; html: string } {
  return {
    subject: `Welcome to SyncFlow, ${storeName}!`,
    html: wrapEmail(`
      <h1 style="color:white;font-size:28px;margin:0 0 8px;">Welcome to SyncFlow!</h1>
      <p style="color:rgba(255,255,255,0.6);font-size:16px;margin:0 0 24px;">Your 7-day Pro trial has started. Here's how to get set up in minutes.</p>

      <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;margin-bottom:24px;">
        <h3 style="color:#06b6d4;font-size:14px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">Quick Start</h3>
        <div style="color:white;font-size:15px;line-height:2;">
          1. Connect your Amazon account<br>
          2. Connect your Etsy account<br>
          3. Orders sync automatically every hour<br>
          4. Check your unified dashboard
        </div>
      </div>

      <p style="color:rgba(255,255,255,0.6);font-size:14px;">Your dashboard is ready — connect a channel and watch your orders flow in.</p>

      <div style="text-align:center;margin-top:24px;">
        ${ctaButton('Open Your Dashboard', dashboardUrl(shopDomain))}
      </div>
    `),
  };
}

export function connectChannelsEmail(storeName: string, shopDomain: string): { subject: string; html: string } {
  return {
    subject: `${storeName} — connect your channels to see real profit`,
    html: wrapEmail(`
      <h1 style="color:white;font-size:24px;margin:0 0 8px;">Connect Your Channels</h1>
      <p style="color:rgba(255,255,255,0.6);font-size:16px;margin:0 0 24px;">SyncFlow tracks fees and calculates true profit per order. Connect at least one marketplace to see real data.</p>

      <div style="display:flex;gap:12px;margin-bottom:24px;">
        <div style="flex:1;background:rgba(255,153,0,0.1);border:1px solid rgba(255,153,0,0.2);border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:24px;margin-bottom:4px;">📦</div>
          <div style="color:white;font-size:14px;font-weight:600;">Amazon</div>
        </div>
        <div style="flex:1;background:rgba(245,131,66,0.1);border:1px solid rgba(245,131,66,0.2);border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:24px;margin-bottom:4px;">🛍️</div>
          <div style="color:white;font-size:14px;font-weight:600;">Etsy</div>
        </div>
        <div style="flex:1;background:rgba(150,191,72,0.1);border:1px solid rgba(150,191,72,0.2);border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:24px;margin-bottom:4px;">🛒</div>
          <div style="color:white;font-size:14px;font-weight:600;">Shopify</div>
        </div>
      </div>

      <p style="color:rgba(255,255,255,0.5);font-size:14px;">Takes 30 seconds per channel. Your data stays private and encrypted.</p>

      <div style="text-align:center;margin-top:24px;">
        ${ctaButton('Connect Channels', settingsUrl(shopDomain))}
      </div>
    `),
  };
}

export function trueProfitEmail(storeName: string, shopDomain: string): { subject: string; html: string } {
  return {
    subject: `Do you know your real profit after fees?`,
    html: wrapEmail(`
      <h1 style="color:white;font-size:24px;margin:0 0 8px;">Understand Your True Profit</h1>
      <p style="color:rgba(255,255,255,0.6);font-size:16px;margin:0 0 24px;">Most sellers don't know their real profit after fees. SyncFlow deducts platform fees, shipping, and COGS automatically.</p>

      <div style="background:rgba(6,182,212,0.1);border:1px solid rgba(6,182,212,0.2);border-radius:12px;padding:20px;margin-bottom:24px;">
        <h3 style="color:#06b6d4;font-size:14px;margin:0 0 12px;">What SyncFlow calculates:</h3>
        <div style="color:rgba(255,255,255,0.8);font-size:15px;line-height:2;">
          &#10003; Amazon referral fees & FBA fees<br>
          &#10003; Etsy listing fees & transaction fees<br>
          &#10003; Shopify payment processing fees<br>
          &#10003; Shipping costs per order<br>
          &#10003; True net profit per SKU
        </div>
      </div>

      <p style="color:rgba(255,255,255,0.5);font-size:14px;">Stop guessing. See exactly which products and channels are making you money.</p>

      <div style="text-align:center;margin-top:24px;">
        ${ctaButton('View Profit Report', dashboardUrl(shopDomain))}
      </div>
    `),
  };
}

export function exportDataEmail(storeName: string, shopDomain: string): { subject: string; html: string } {
  return {
    subject: `One-click export for your accountant`,
    html: wrapEmail(`
      <h1 style="color:white;font-size:24px;margin:0 0 8px;">Export for Your Accountant</h1>
      <p style="color:rgba(255,255,255,0.6);font-size:16px;margin:0 0 24px;">One-click CSV export with all orders, fees, and profit across all channels. Tax season made easy.</p>

      <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;margin-bottom:24px;">
        <h3 style="color:white;font-size:16px;margin:0 0 12px;">Export includes:</h3>
        <div style="color:rgba(255,255,255,0.7);font-size:15px;line-height:2;">
          &#10003; All orders from every channel<br>
          &#10003; Platform fees broken down per order<br>
          &#10003; Shipping costs & refunds<br>
          &#10003; Net profit calculations<br>
          &#10003; Date range filtering
        </div>
      </div>

      <p style="color:rgba(255,255,255,0.5);font-size:14px;">No more manually combining spreadsheets from Amazon, Etsy, and Shopify.</p>

      <div style="text-align:center;margin-top:24px;">
        ${ctaButton('Export Data', dashboardUrl(shopDomain))}
      </div>
    `),
  };
}

export function trialEndingEmail(storeName: string, shopDomain: string): { subject: string; html: string } {
  return {
    subject: `Your SyncFlow Pro trial ends tomorrow`,
    html: wrapEmail(`
      <h1 style="color:white;font-size:24px;margin:0 0 8px;">Your Trial Ends Tomorrow</h1>
      <p style="color:rgba(255,255,255,0.6);font-size:16px;margin:0 0 24px;">Your 7-day Pro trial is almost over. Subscribe to keep all your Pro features.</p>

      <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:20px;margin-bottom:24px;">
        <h3 style="color:#ef4444;font-size:14px;margin:0 0 12px;">What you'll lose without Pro:</h3>
        <div style="color:rgba(255,255,255,0.7);font-size:15px;line-height:2;">
          &#10007; Multi-channel order sync<br>
          &#10007; Fee tracking & breakdown<br>
          &#10007; Profit reports per SKU<br>
          &#10007; CSV export
        </div>
      </div>

      <div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);border-radius:12px;padding:20px;margin-bottom:24px;">
        <h3 style="color:#22c55e;font-size:14px;margin:0 0 12px;">Keep everything for:</h3>
        <div style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.8;">
          <span style="font-size:28px;font-weight:bold;color:white;">$29.99</span><span style="color:rgba(255,255,255,0.5);">/month</span>
        </div>
      </div>

      <div style="text-align:center;margin-top:24px;">
        ${ctaButton('Upgrade to Pro', dashboardUrl(shopDomain))}
        <p style="color:rgba(255,255,255,0.4);font-size:12px;margin-top:12px;">Cancel anytime. Billed through Shopify.</p>
      </div>
    `),
  };
}

// ─── Send function ──────────────────────────────────────────

export async function sendOnboardingEmail(
  to: string,
  email: { subject: string; html: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await getResend().emails.send({
      from: FROM,
      to,
      subject: email.subject,
      html: email.html,
    });

    if (error) {
      console.error('Onboarding email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Onboarding email failed:', err);
    return { success: false, error: err?.message || 'Unknown error' };
  }
}
