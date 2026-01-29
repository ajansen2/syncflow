-- ChannelSync Supabase Schema
-- Multi-channel revenue reconciliation for Amazon, Shopify, Etsy
-- Run this in your Supabase SQL Editor

-- ============================================
-- STORES TABLE
-- Main table linking Shopify stores (entry point)
-- ============================================
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain TEXT UNIQUE NOT NULL,
  store_name TEXT,
  email TEXT,
  access_token TEXT NOT NULL,
  scope TEXT,
  subscription_status TEXT DEFAULT 'trial',
  billing_charge_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  currency TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'America/New_York',
  sync_frequency TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'manual'
  email_report_frequency TEXT DEFAULT 'none', -- 'none', 'weekly', 'monthly'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add sync_frequency column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'sync_frequency') THEN
    ALTER TABLE stores ADD COLUMN sync_frequency TEXT DEFAULT 'daily';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'email_report_frequency') THEN
    ALTER TABLE stores ADD COLUMN email_report_frequency TEXT DEFAULT 'none';
  END IF;
END $$;

-- ============================================
-- CHANNEL CONNECTIONS TABLE
-- Connected platforms (Amazon, Etsy, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS channel_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'amazon', 'etsy', 'shopify'
  account_id TEXT,
  account_name TEXT,
  marketplace TEXT, -- 'US', 'CA', 'UK' for Amazon
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending', -- 'pending', 'syncing', 'completed', 'error'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, platform, marketplace)
);

-- ============================================
-- ORDERS TABLE
-- Unified orders from all channels
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  channel_connection_id UUID REFERENCES channel_connections(id) ON DELETE SET NULL,
  platform TEXT NOT NULL, -- 'amazon', 'etsy', 'shopify'
  platform_order_id TEXT NOT NULL,
  order_number TEXT,
  order_date TIMESTAMPTZ,
  -- Revenue
  gross_revenue DECIMAL(10,2) DEFAULT 0,
  shipping_revenue DECIMAL(10,2) DEFAULT 0,
  tax_collected DECIMAL(10,2) DEFAULT 0,
  -- Platform Fees
  platform_fees DECIMAL(10,2) DEFAULT 0, -- Amazon referral, Etsy transaction, Shopify fees
  payment_processing_fee DECIMAL(10,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0, -- FBA fees, shipping labels
  other_fees DECIMAL(10,2) DEFAULT 0,
  -- Calculated
  net_revenue DECIMAL(10,2) DEFAULT 0, -- gross - all fees
  -- Status
  financial_status TEXT,
  fulfillment_status TEXT,
  currency TEXT DEFAULT 'USD',
  -- Payout tracking
  payout_id UUID,
  is_reconciled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, platform, platform_order_id)
);

-- ============================================
-- PAYOUTS TABLE
-- Platform payouts/deposits
-- ============================================
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  channel_connection_id UUID REFERENCES channel_connections(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  payout_id TEXT, -- Platform's payout ID
  payout_date DATE,
  deposit_date DATE,
  -- Amounts
  gross_amount DECIMAL(10,2) DEFAULT 0,
  fees_withheld DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) DEFAULT 0, -- What hits the bank
  -- Reconciliation
  orders_count INTEGER DEFAULT 0,
  is_reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMPTZ,
  bank_reference TEXT, -- For matching to bank statement
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, platform, payout_id)
);

-- ============================================
-- DAILY SUMMARY TABLE
-- Aggregated daily metrics per channel
-- ============================================
CREATE TABLE IF NOT EXISTS daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  platform TEXT NOT NULL,
  -- Metrics
  orders_count INTEGER DEFAULT 0,
  gross_revenue DECIMAL(10,2) DEFAULT 0,
  total_fees DECIMAL(10,2) DEFAULT 0,
  net_revenue DECIMAL(10,2) DEFAULT 0,
  refunds DECIMAL(10,2) DEFAULT 0,
  -- Comparison helpers
  prev_period_revenue DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, date, platform)
);

-- ============================================
-- SYNC LOGS TABLE
-- Track sync history and errors
-- ============================================
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  channel_connection_id UUID REFERENCES channel_connections(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  sync_type TEXT, -- 'orders', 'payouts', 'full'
  status TEXT, -- 'started', 'completed', 'failed'
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_stores_shop_domain ON stores(shop_domain);
CREATE INDEX IF NOT EXISTS idx_channel_connections_store ON channel_connections(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_platform ON orders(store_id, platform);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_payout ON orders(payout_id);
CREATE INDEX IF NOT EXISTS idx_payouts_store_platform ON payouts(store_id, platform);
CREATE INDEX IF NOT EXISTS idx_payouts_date ON payouts(payout_date);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_store_date ON daily_summaries(store_id, date);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DONE!
-- ============================================
