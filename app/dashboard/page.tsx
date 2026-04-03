'use client';

import { useEffect, useState, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase-client';
import { initializeAppBridge, isEmbeddedInShopify, navigateInApp, getShopifySessionToken, redirectToOAuth, redirectToShopifyAdmin } from '@/lib/shopify-app-bridge';
import Link from 'next/link';

type DateRangeOption = '7d' | '14d' | '30d' | '90d' | 'all';

interface Store {
  id: string;
  shop_domain: string;
  store_name: string;
  email: string;
  subscription_status: string;
  trial_ends_at: string | null;
  currency: string;
}

interface ChannelConnection {
  id: string;
  platform: 'amazon' | 'etsy' | 'shopify';
  account_name: string;
  marketplace: string;
  is_active: boolean;
  last_sync_at: string | null;
  sync_status: string;
}

interface Order {
  id: string;
  platform: string;
  platform_order_id: string;
  order_number: string;
  order_date: string;
  gross_revenue: number;
  platform_fees: number;
  payment_processing_fee: number;
  shipping_cost: number;
  net_revenue: number;
  currency: string;
  financial_status: string;
}

interface ChannelMetrics {
  platform: string;
  orders_count: number;
  gross_revenue: number;
  total_fees: number;
  net_revenue: number;
}

function DashboardContent() {
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading dashboard...');
  const [store, setStore] = useState<Store | null>(null);
  const [channels, setChannels] = useState<ChannelConnection[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showBillingSuccess, setShowBillingSuccess] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('30d');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [showBillingRequired, setShowBillingRequired] = useState(false);
  const [billingUrl, setBillingUrl] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  const router = useRouter();

  // Calculate trial days left
  const getTrialDaysLeft = () => {
    if (!store?.trial_ends_at) return null;
    const trialEnd = new Date(store.trial_ends_at);
    const now = new Date();
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  // Check if subscription is required (trial expired and not active)
  const isSubscriptionRequired = () => {
    if (!store) return false;
    if (store.subscription_status === 'active') return false;
    const trialDays = getTrialDaysLeft();
    if (trialDays === null) return true; // No trial info, require subscription
    return trialDays <= 0;
  };

  // Handle subscribe button click
  const handleSubscribe = async () => {
    if (!store) return;
    setSubscribing(true);
    try {
      const shop = searchParams.get('shop');
      const response = await fetch('/api/billing/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop })
      });
      const data = await response.json();
      if (data.confirmationUrl) {
        redirectToOAuth(data.confirmationUrl);
      } else if (data.oauthUrl) {
        redirectToOAuth(data.oauthUrl);
      }
    } catch (error) {
      console.error('Error creating billing charge:', error);
    } finally {
      setSubscribing(false);
    }
  };

  // Check subscription status after store loads
  useEffect(() => {
    if (store && !loading) {
      if (isSubscriptionRequired()) {
        setShowBillingRequired(true);
      }
    }
  }, [store, loading]);

  // Show onboarding only ONCE for new users
  useEffect(() => {
    if (store && !loading) {
      const storageKey = `channelsync_onboarding_${store.id}`;
      const hasSeenOnboarding = localStorage.getItem(storageKey);
      if (hasSeenOnboarding !== 'true') {
        setShowOnboarding(true);
        // Immediately mark as seen to prevent re-showing on refresh
        localStorage.setItem(storageKey, 'true');
      }
    }
  }, [store, loading]);

  const completeOnboarding = () => {
    if (store) {
      localStorage.setItem(`channelsync_onboarding_${store.id}`, 'true');
    }
    setShowOnboarding(false);
    setOnboardingStep(1);
  };
  const searchParams = useSearchParams();
  const supabase = getSupabaseClient();

  // Calculate date range
  const dateRange = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const days = dateRangeOption === '7d' ? 7 : dateRangeOption === '14d' ? 14 : dateRangeOption === '30d' ? 30 : dateRangeOption === '90d' ? 90 : null;

    return {
      start: days ? new Date(now.getTime() - days * 24 * 60 * 60 * 1000) : null,
      end,
      label: dateRangeOption === 'all' ? 'All time' : `Last ${days} days`
    };
  }, [dateRangeOption]);

  // Filter orders by date
  const filteredOrders = useMemo(() => {
    if (!dateRange.start) return orders;
    return orders.filter(order => {
      const orderDate = new Date(order.order_date);
      return orderDate >= dateRange.start! && orderDate <= dateRange.end;
    });
  }, [orders, dateRange]);

  // Calculate metrics by channel
  const channelMetrics = useMemo((): ChannelMetrics[] => {
    const metrics: { [key: string]: ChannelMetrics } = {};

    filteredOrders.forEach(order => {
      if (!metrics[order.platform]) {
        metrics[order.platform] = {
          platform: order.platform,
          orders_count: 0,
          gross_revenue: 0,
          total_fees: 0,
          net_revenue: 0
        };
      }
      metrics[order.platform].orders_count += 1;
      metrics[order.platform].gross_revenue += order.gross_revenue;
      metrics[order.platform].total_fees += order.platform_fees + order.payment_processing_fee + order.shipping_cost;
      metrics[order.platform].net_revenue += order.net_revenue;
    });

    return Object.values(metrics);
  }, [filteredOrders]);

  // Total metrics
  const totals = useMemo(() => {
    return {
      orders: filteredOrders.length,
      grossRevenue: filteredOrders.reduce((sum, o) => sum + o.gross_revenue, 0),
      totalFees: filteredOrders.reduce((sum, o) => sum + o.platform_fees + o.payment_processing_fee + o.shipping_cost, 0),
      netRevenue: filteredOrders.reduce((sum, o) => sum + o.net_revenue, 0)
    };
  }, [filteredOrders]);

  // Check for billing success
  useEffect(() => {
    const billingStatus = searchParams.get('billing');
    if (billingStatus === 'success') {
      setShowBillingSuccess(true);
      setTimeout(() => setShowBillingSuccess(false), 10000);
    }
  }, [searchParams]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      const embedded = isEmbeddedInShopify();
      const shop = searchParams.get('shop');

      // If opened standalone with shop param, redirect to Shopify admin
      if (!embedded && shop) {
        redirectToShopifyAdmin(shop);
        return;
      }

      if (embedded) {
        initializeAppBridge();
        await getShopifySessionToken();

        if (!shop) {
          setLoadError('Missing shop parameter');
          setLoading(false);
          return;
        }

        try {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', `/api/stores/lookup?shop=${encodeURIComponent(shop)}`, false);
          xhr.send();

          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            if (data.store) {
              setStore(data.store);

              // Check billing status (skip if just returned from billing approval)
              const billingParam = searchParams.get('billing');
              if (billingParam !== 'success') {
                setLoadingMessage('Checking subscription...');
                const billingResponse = await fetch('/api/billing/check', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ shop })
                });

                if (billingResponse.ok) {
                  const billingData = await billingResponse.json();

                  // Need to re-authorize (token invalid)
                  if (billingData.needsOAuth && billingData.oauthUrl) {
                    console.log('Redirecting to OAuth:', billingData.oauthUrl);
                    setLoadingMessage('Reconnecting to Shopify...');
                    redirectToOAuth(billingData.oauthUrl);
                    return;
                  }

                  // Need billing approval
                  if (billingData.needsBilling && billingData.confirmationUrl) {
                    console.log('Redirecting to billing:', billingData.confirmationUrl);
                    redirectToOAuth(billingData.confirmationUrl);
                    return;
                  }
                }
              }

              await loadChannelsAndOrders(data.store.id);
            }
          } else if (xhr.status === 404) {
            const installResponse = await fetch('/api/shopify/install-embedded', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ shop })
            });

            if (installResponse.ok) {
              const installData = await installResponse.json();
              setStore(installData.store);

              // Check billing for new installs too
              setLoadingMessage('Setting up subscription...');
              const billingResponse = await fetch('/api/billing/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shop })
              });

              if (billingResponse.ok) {
                const billingData = await billingResponse.json();

                if (billingData.needsOAuth && billingData.oauthUrl) {
                  console.log('Redirecting to OAuth:', billingData.oauthUrl);
                  setLoadingMessage('Connecting to Shopify...');
                  redirectToOAuth(billingData.oauthUrl);
                  return;
                }

                if (billingData.needsBilling && billingData.confirmationUrl) {
                  console.log('Redirecting to billing:', billingData.confirmationUrl);
                  redirectToOAuth(billingData.confirmationUrl);
                  return;
                }
              }
            }
          }
        } catch (error) {
          console.error('Error loading store:', error);
          setLoadError('Failed to load store data');
        }
      }

      setLoading(false);
    };

    loadData();
  }, [searchParams, supabase]);

  const loadChannelsAndOrders = async (storeId: string) => {
    if (supabase) {
      const { data: channelsData } = await supabase
        .from('channel_connections')
        .select('*')
        .eq('store_id', storeId);

      if (channelsData) setChannels(channelsData);

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .order('order_date', { ascending: false })
        .limit(500);

      if (ordersData) setOrders(ordersData);
    }
  };

  const handleSyncOrders = async () => {
    if (!store || syncing) return;
    setSyncing(true);

    try {
      const response = await fetch('/api/sync/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: store.id })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Sync completed:', data);
        await loadChannelsAndOrders(store.id);
      } else {
        console.error('❌ Sync failed:', data);
        alert(`Sync failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Sync failed - check console for details');
    } finally {
      setSyncing(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'amazon':
        return <span className="text-xl">📦</span>;
      case 'etsy':
        return <span className="text-xl">🧶</span>;
      case 'shopify':
      default:
        return <span className="text-xl">🛍️</span>;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'amazon': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'etsy': return 'bg-orange-600/20 text-orange-300 border-orange-600/30';
      case 'shopify': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-cyan-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">{loadingMessage}</div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-red-500/10 border-2 border-red-500/50 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Unable to Load Dashboard</h2>
          <p className="text-white/80 mb-6">{loadError}</p>
          <p className="text-white/60 text-sm">Contact support at adam@argora.ai</p>
        </div>
      </div>
    );
  }

  // Billing Required Paywall - blocks entire UI
  if (showBillingRequired) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/50 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Trial Ended</h2>
            <p className="text-white/70 mb-6 text-lg">
              Your 14-day free trial has expired. Subscribe to SyncFlow to continue syncing your sales channels.
            </p>
            <div className="bg-zinc-900/50 rounded-xl p-4 mb-6">
              <div className="text-white/60 text-sm mb-1">SyncFlow Pro</div>
              <div className="text-3xl font-bold text-white">$29.99<span className="text-lg font-normal text-white/60">/month</span></div>
              <div className="text-cyan-400 text-sm mt-1">Unlimited channels, orders & analytics</div>
            </div>
            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-lg transition"
            >
              {subscribing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : (
                'Subscribe Now'
              )}
            </button>
            <p className="text-white/40 text-sm mt-4">
              Secure payment through Shopify. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full transition-all ${
                    step === onboardingStep ? 'bg-cyan-500 w-6' : step < onboardingStep ? 'bg-cyan-500' : 'bg-zinc-700'
                  }`}
                />
              ))}
            </div>

            {onboardingStep === 1 && (
              <div className="text-center">
                <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔗</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to SyncFlow!</h2>
                <p className="text-zinc-400 mb-6">
                  Consolidate all your sales channels (Amazon, Etsy, Shopify) in one dashboard with real profit tracking.
                </p>
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📊</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Connect Your Channels</h2>
                <p className="text-zinc-400 mb-6">
                  Link Amazon, Etsy, or additional Shopify stores. We automatically sync orders and calculate true profit after all fees.
                </p>
              </div>
            )}

            {onboardingStep === 3 && (
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💰</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">See Your True Profit</h2>
                <p className="text-zinc-400 mb-6">
                  View gross revenue, platform fees, shipping costs, and net profit across all channels in real-time.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {onboardingStep > 1 && (
                <button
                  onClick={() => setOnboardingStep(onboardingStep - 1)}
                  className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition"
                >
                  Back
                </button>
              )}
              {onboardingStep < 3 ? (
                <button
                  onClick={() => setOnboardingStep(onboardingStep + 1)}
                  className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={completeOnboarding}
                  className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition"
                >
                  Get Started
                </button>
              )}
            </div>

            {onboardingStep < 3 && (
              <button
                onClick={completeOnboarding}
                className="w-full mt-3 text-zinc-500 hover:text-zinc-400 text-sm transition"
              >
                Skip tutorial
              </button>
            )}
          </div>
        </div>
      )}

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-screen w-64 bg-zinc-900 border-r border-zinc-800 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-zinc-800">
            <Link href="/" className="flex items-center gap-3">
              <img src="/channelsync.jpg" alt="SyncFlow" className="w-10 h-10 rounded-xl" />
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
                SyncFlow
              </span>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => navigateInApp('/dashboard')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => navigateInApp('/dashboard/orders')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-zinc-900/50 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="font-medium">Orders</span>
            </button>

            <button
              onClick={() => navigateInApp('/dashboard/channels')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-zinc-900/50 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="font-medium">Channels</span>
            </button>

            <button
              onClick={() => navigateInApp('/dashboard/settings')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-zinc-900/50 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium">Settings</span>
            </button>
          </nav>

          {store && (
            <div className="p-4 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-1">
                <div className="text-white font-medium truncate">{store.store_name}</div>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  store.subscription_status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {store.subscription_status === 'active' ? 'Pro' : 'Trial'}
                </span>
              </div>
              <div className="text-white/40 text-sm truncate">{store.shop_domain}</div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-medium transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {dateRange.label}
                </button>

                {showDatePicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
                      {['7d', '14d', '30d', '90d', 'all'].map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setDateRangeOption(option as DateRangeOption);
                            setShowDatePicker(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition ${
                            dateRangeOption === option ? 'bg-cyan-600 text-white' : 'text-white/80 hover:bg-zinc-800'
                          }`}
                        >
                          {option === 'all' ? 'All time' : `Last ${option.replace('d', '')} days`}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleSyncOrders}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 text-white rounded-lg font-medium transition"
              >
                {syncing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sync All
                  </>
                )}
              </button>

              {/* Help Button */}
              <button
                onClick={() => setShowOnboarding(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-300 text-sm font-medium transition"
                title="Quick Start Guide"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Help
              </button>

              {/* Trial Badge */}
              {(() => {
                const trialDays = getTrialDaysLeft();
                if (store?.subscription_status === 'active') {
                  return (
                    <span className="px-3 py-1 bg-green-600/20 border border-green-500/30 rounded-full text-green-300 text-sm font-medium">
                      Pro Plan
                    </span>
                  );
                }
                if (trialDays !== null) {
                  return (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      trialDays <= 3
                        ? 'bg-red-500/20 border border-red-500/30 text-red-300'
                        : 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-300'
                    }`}>
                      {trialDays} day{trialDays !== 1 ? 's' : ''} left
                    </span>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </header>

        {showBillingSuccess && (
          <div className="mx-6 mt-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Welcome to SyncFlow!</h3>
                <p className="text-green-100">Your subscription is active. Start connecting your channels below.</p>
              </div>
            </div>
          </div>
        )}

        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white/60 text-sm font-medium">Total Orders</h3>
                <span className="text-2xl">📦</span>
              </div>
              <div className="text-3xl font-bold text-white">{totals.orders}</div>
              <div className="text-white/40 text-sm">{dateRange.label}</div>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white/60 text-sm font-medium">Gross Revenue</h3>
                <span className="text-2xl">💰</span>
              </div>
              <div className="text-3xl font-bold text-white">${totals.grossRevenue.toFixed(2)}</div>
              <div className="text-white/40 text-sm">Before fees</div>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white/60 text-sm font-medium">Total Fees</h3>
                <span className="text-2xl">📉</span>
              </div>
              <div className="text-3xl font-bold text-red-400">${totals.totalFees.toFixed(2)}</div>
              <div className="text-white/40 text-sm">Platform + shipping</div>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white/60 text-sm font-medium">Net Revenue</h3>
                <span className="text-2xl">📈</span>
              </div>
              <div className="text-3xl font-bold text-green-400">${totals.netRevenue.toFixed(2)}</div>
              <div className="text-white/40 text-sm">After all fees</div>
            </div>
          </div>

          {/* Channel Connections */}
          <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Connected Channels</h2>
              <button
                onClick={() => navigateInApp('/dashboard/channels')}
                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition"
              >
                Manage Channels →
              </button>
            </div>

            {channels.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-cyan-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔗</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Connect Your First Channel</h3>
                <p className="text-white/60 mb-6">Link Amazon, Etsy, or another Shopify store to start syncing orders</p>
                <button
                  onClick={() => navigateInApp('/dashboard/channels')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Channel
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['shopify', 'amazon', 'etsy'].map((platform) => {
                  const connection = channels.find(c => c.platform === platform);
                  const metrics = channelMetrics.find(m => m.platform === platform);

                  return (
                    <div
                      key={platform}
                      className={`p-4 rounded-lg border ${connection ? getPlatformColor(platform) : 'bg-zinc-900/50 border-zinc-800'}`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${connection ? '' : 'bg-zinc-800'}`}>
                          {getPlatformIcon(platform)}
                        </div>
                        <div>
                          <div className="text-white font-medium capitalize">{platform}</div>
                          <div className="text-white/40 text-sm">
                            {connection ? (connection.is_active ? 'Connected' : 'Inactive') : 'Not connected'}
                          </div>
                        </div>
                      </div>

                      {connection && metrics && (
                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-800">
                          <div>
                            <div className="text-white/40 text-xs">Orders</div>
                            <div className="text-white font-medium">{metrics.orders_count}</div>
                          </div>
                          <div>
                            <div className="text-white/40 text-xs">Revenue</div>
                            <div className="text-white font-medium">${metrics.gross_revenue.toFixed(0)}</div>
                          </div>
                        </div>
                      )}

                      {!connection && (
                        <button
                          onClick={() => navigateInApp('/dashboard/channels')}
                          className="block w-full mt-3 px-4 py-2 bg-zinc-800 hover:bg-white/20 text-white text-center rounded-lg text-sm font-medium transition"
                        >
                          Connect {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Revenue by Channel */}
          {channelMetrics.length > 0 && (
            <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold text-white mb-6">Revenue by Channel</h2>
              <div className="space-y-4">
                {channelMetrics.map((metric) => {
                  const percentage = totals.grossRevenue > 0 ? (metric.gross_revenue / totals.grossRevenue) * 100 : 0;

                  return (
                    <div key={metric.platform}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(metric.platform)}
                          <span className="capitalize text-white font-medium">{metric.platform}</span>
                          <span className="text-white/40 text-sm">({metric.orders_count} orders)</span>
                        </div>
                        <span className="text-white font-bold">${metric.gross_revenue.toFixed(2)}</span>
                      </div>
                      <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            metric.platform === 'shopify' ? 'bg-green-500' :
                            metric.platform === 'amazon' ? 'bg-orange-500' :
                            'bg-orange-400'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Orders */}
          <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Recent Orders</h2>
              <button
                onClick={() => navigateInApp('/dashboard/orders')}
                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition"
              >
                View All →
              </button>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-white/60">
                No orders yet. Connect a channel and sync to see your orders here.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.slice(0, 10).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getPlatformColor(order.platform)}`}>
                        {getPlatformIcon(order.platform)}
                      </div>
                      <div>
                        <div className="text-white font-medium">{order.order_number}</div>
                        <div className="text-white/40 text-sm">
                          {new Date(order.order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">${order.gross_revenue.toFixed(2)}</div>
                      <div className="text-red-400/80 text-sm">
                        -${(order.platform_fees + order.payment_processing_fee + order.shipping_cost).toFixed(2)} fees
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-cyan-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading dashboard...</div>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
