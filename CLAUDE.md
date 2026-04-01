# SyncFlow (ChannelSync) - Multi-Channel Order Sync App

## Quick Reference

### Shopify API Key
- **API Key**: `ebcd49739472f025754a6afcc20bf66d`
- **Environment Variable**: `SHOPIFY_API_KEY` (server-side) / `NEXT_PUBLIC_SHOPIFY_API_KEY` (client-side)

### Important URLs
- **Production**: `https://syncflow-blush.vercel.app`
- **Shopify Admin Embedded URL**: `https://admin.shopify.com/store/{storename}/apps/ebcd49739472f025754a6afcc20bf66d`

### Billing Flow
1. OAuth callback creates billing charge with `return_url` pointing to `/api/billing/callback`
2. User approves on Shopify
3. Shopify redirects to billing callback
4. Billing callback activates charge and redirects to Shopify admin embedded URL

### Key Files for Billing
- `app/api/auth/shopify/callback/route.ts` - OAuth + billing charge creation
- `app/api/billing/callback/route.ts` - Billing approval handling + redirect to embedded app
- `middleware.ts` - Subscription enforcement

### Common Issues
- If app loads standalone instead of embedded, check billing callback redirect URL
- Billing callback must redirect to `https://admin.shopify.com/store/{storename}/apps/{API_KEY}` (NOT app name)
- Always use API key in admin URLs, not app name/slug

### Database
- Table: `stores` (shop_domain, subscription_status, etc.)
- Subscription statuses: `active`, `trial`, `cancelled`

### Pricing
- **$29.99/month** with 14-day free trial
