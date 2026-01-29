# ChannelSync - Multi-Channel Revenue Reconciliation

Stop wasting hours reconciling Amazon, Shopify, and Etsy payouts. See profit by channel in one dashboard.

**$29/month for all channels** (vs. A2X at $20-50+ per channel)

---

## Quick Start

### 1. Clone and Install

```bash
cd channelsync
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor**
3. Copy and paste the contents of `supabase_schema.sql`
4. Click **Run**
5. Go to **Settings > API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Create Shopify App

1. Go to [partners.shopify.com](https://partners.shopify.com)
2. Create new app
3. Set **App URL**: `https://channelsync.vercel.app`
4. Set **Redirect URL**: `https://channelsync.vercel.app/api/auth/shopify/callback`
5. Request scopes: `read_orders,read_products`
6. Copy **API Key** and **API Secret**

### 4. (Optional) Set Up Amazon Seller Central API

1. Register as an Amazon SP-API developer at [sellercentral.amazon.com](https://sellercentral.amazon.com)
2. Create an app in Developer Central
3. Get your **Client ID** and **Client Secret**
4. Set up AWS IAM role for SP-API

### 5. (Optional) Set Up Etsy API

1. Go to [etsy.com/developers](https://www.etsy.com/developers)
2. Create a new app
3. Request `transactions_r` and `shops_r` scopes
4. Get your **API Key**

### 6. Configure Environment

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`

### 7. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard.

### 8. Configure Shopify Webhooks

In Shopify Partners, add webhooks:
- `orders/create` → `/api/webhooks/shopify/orders`
- `orders/updated` → `/api/webhooks/shopify/orders`
- `refunds/create` → `/api/webhooks/shopify/refunds`
- `app/uninstalled` → `/api/webhooks/shopify/uninstall`

GDPR webhooks:
- Customer data request → `/api/webhooks/customers/data-request`
- Customer deletion → `/api/webhooks/customers/redact`
- Shop deletion → `/api/webhooks/shop/redact`

---

## Features

### Core
- **Unified Orders** - All orders from Shopify, Amazon, Etsy in one place
- **Automatic Fee Calculation** - Platform fees, payment processing, shipping
- **Net Revenue by Channel** - See which channel is actually profitable
- **Payout Reconciliation** - Match bank deposits to orders

### Dashboard
- Revenue by channel (daily/weekly/monthly)
- Fee breakdown (platform fees, payment processing)
- Profit margins by channel
- Recent orders across all channels

### Sync
- Automatic order sync via webhooks (Shopify)
- Manual sync for Amazon and Etsy
- Historical data import (last 30/60/90 days)

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/shopify/install` | GET | Start Shopify OAuth |
| `/api/auth/shopify/callback` | GET | Complete OAuth + billing |
| `/api/channels/amazon/connect` | GET | Start Amazon OAuth |
| `/api/channels/amazon/callback` | GET | Complete Amazon connection |
| `/api/channels/etsy/connect` | GET | Start Etsy OAuth |
| `/api/channels/etsy/callback` | GET | Complete Etsy connection |
| `/api/sync/orders` | POST | Sync orders from all channels |
| `/api/analytics/summary` | GET | Dashboard metrics |
| `/api/stores/lookup` | GET | Get store by shop domain |

---

## Database Schema

See `supabase_schema.sql`. Key tables:

- `stores` - Shopify stores (entry point)
- `channel_connections` - Connected platforms (Amazon, Etsy)
- `orders` - Unified orders from all channels
- `payouts` - Platform payouts/deposits
- `daily_summaries` - Aggregated daily metrics
- `sync_logs` - Sync history and errors

---

## Fee Calculations

### Shopify
- Transaction fee: 2% (Basic), 1% (Shopify), 0.5% (Advanced)
- Payment processing: 2.9% + $0.30 (Shopify Payments)

### Amazon
- Referral fee: 8-15% (varies by category)
- FBA fees: varies by size/weight
- Subscription: $39.99/month (Professional)

### Etsy
- Transaction fee: 6.5%
- Listing fee: $0.20 per item
- Payment processing: 3% + $0.25
- Offsite ads: 12-15% (if applicable)

---

## Development

```bash
# Run locally
npm run dev

# With Shopify CLI
shopify app dev --config shopify.app.channelsync.toml

# Build
npm run build
```

---

## Shopify App Store Submission

### Required
- [ ] App loads in embedded iframe
- [ ] OAuth flow works
- [ ] Billing works (test on dev store first)
- [ ] GDPR webhooks configured
- [ ] Privacy policy URL
- [ ] App description and screenshots

### Review Checklist
- [ ] Only request necessary scopes
- [ ] Handle token refresh for Amazon/Etsy
- [ ] Return 200 for all GDPR webhooks
- [ ] Don't store unnecessary PII

---

## Support

For issues: your-email@example.com
