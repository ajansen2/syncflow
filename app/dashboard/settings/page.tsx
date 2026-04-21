'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase-client';
import { navigateInApp, authenticatedFetch } from '@/lib/shopify-app-bridge';

interface Store {
  id: string;
  shop_domain: string;
  store_name: string;
  email: string;
  subscription_status: string;
  trial_ends_at: string | null;
}

interface ChannelConnection {
  id: string;
  platform: string;
  account_name: string;
  is_active: boolean;
  last_sync_at: string | null;
  sync_status: string;
}

function SettingsContent() {
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [channels, setChannels] = useState<ChannelConnection[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [syncFrequency, setSyncFrequency] = useState<'hourly' | 'daily' | 'manual'>('daily');
  const [savingSyncSettings, setSavingSyncSettings] = useState(false);
  const [emailReportFrequency, setEmailReportFrequency] = useState<'none' | 'weekly' | 'monthly'>('none');
  const [savingEmailSettings, setSavingEmailSettings] = useState(false);

  const searchParams = useSearchParams();
  const supabase = getSupabaseClient();

  useEffect(() => {
    const loadData = async () => {
      const shop = searchParams.get('shop');
      if (!shop) {
        setLoading(false);
        return;
      }

      try {
        const lookupResponse = await authenticatedFetch(`/api/stores/lookup?shop=${encodeURIComponent(shop)}`);

        if (lookupResponse.ok) {
          const data = await lookupResponse.json();
          if (data.store) {
            setStore(data.store);
            // Load saved settings
            if (data.store.sync_frequency) {
              setSyncFrequency(data.store.sync_frequency);
            }
            if (data.store.email_report_frequency) {
              setEmailReportFrequency(data.store.email_report_frequency);
            }

            if (supabase) {
              const { data: channelsData } = await supabase
                .from('channel_connections')
                .select('*')
                .eq('store_id', data.store.id);

              if (channelsData) setChannels(channelsData);
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }

      setLoading(false);
    };

    loadData();
  }, [searchParams, supabase]);

  const handleSaveSyncSettings = async () => {
    if (!store) return;

    setSavingSyncSettings(true);
    try {
      const response = await authenticatedFetch('/api/stores/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: store.id,
          sync_frequency: syncFrequency,
        }),
      });

      if (response.ok) {
        setSuccessMessage('Sync settings saved');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      setErrorMessage('Failed to save sync settings');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSavingSyncSettings(false);
    }
  };

  const handleSaveEmailSettings = async (frequency: 'none' | 'weekly' | 'monthly') => {
    if (!store) return;

    setSavingEmailSettings(true);
    try {
      const response = await authenticatedFetch('/api/stores/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: store.id,
          email_report_frequency: frequency,
        }),
      });

      if (response.ok) {
        setEmailReportFrequency(frequency);
        setSuccessMessage(`Email reports ${frequency === 'none' ? 'disabled' : `set to ${frequency}`}`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      setErrorMessage('Failed to update email settings');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSavingEmailSettings(false);
    }
  };

  const getPlatformInfo = (platform: string) => {
    switch (platform) {
      case 'amazon':
        return { name: 'Amazon', icon: '📦', color: 'bg-orange-500/20 text-orange-400' };
      case 'etsy':
        return { name: 'Etsy', icon: '🧶', color: 'bg-orange-600/20 text-orange-300' };
      case 'shopify':
      default:
        return { name: 'Shopify', icon: '🛍️', color: 'bg-green-500/20 text-green-400' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-cyan-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 z-50 h-screen w-64 bg-slate-900/90 backdrop-blur border-r border-white/10 hidden lg:block">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10">
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
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-white/5 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => navigateInApp('/dashboard/orders')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-white/5 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="font-medium">Orders</span>
            </button>

            <button
              onClick={() => navigateInApp('/dashboard/channels')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-white/5 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="font-medium">Channels</span>
            </button>

            <button
              onClick={() => navigateInApp('/dashboard/settings')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium">Settings</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <header className="bg-slate-900/50 backdrop-blur border-b border-white/10 sticky top-0 z-30">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-white/60 text-sm">Manage your account and sync preferences</p>
          </div>
        </header>

        <div className="p-6 max-w-4xl">
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
              {errorMessage}
            </div>
          )}

          {/* Account Info */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-white/60 text-sm">Store Name</label>
                <div className="text-white font-medium">{store?.store_name || 'N/A'}</div>
              </div>
              <div>
                <label className="text-white/60 text-sm">Shop Domain</label>
                <div className="text-white font-medium">{store?.shop_domain || 'N/A'}</div>
              </div>
              <div>
                <label className="text-white/60 text-sm">Email</label>
                <div className="text-white font-medium">{store?.email || 'N/A'}</div>
              </div>
              <div>
                <label className="text-white/60 text-sm">Subscription Status</label>
                <div className="flex items-center gap-2">
                  {(() => {
                    const isTrialing = store?.subscription_status === 'trial' ||
                      (store?.trial_ends_at && new Date(store.trial_ends_at) > new Date());

                    if (isTrialing && store?.trial_ends_at) {
                      const trialEnd = new Date(store.trial_ends_at);
                      const now = new Date();
                      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                      return (
                        <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300">
                          Pro Plan <span className="text-yellow-300 ml-1">({daysLeft} day{daysLeft !== 1 ? 's' : ''} left)</span>
                        </span>
                      );
                    }

                    return (
                      <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300">
                        Pro Plan - Active
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Connected Channels Overview */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Connected Channels</h2>
              <button
                onClick={() => navigateInApp('/dashboard/channels')}
                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
              >
                Manage Channels
              </button>
            </div>

            {channels.filter(c => c.is_active).length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🔗</div>
                <p className="text-white/60">No channels connected yet</p>
                <button
                  onClick={() => navigateInApp('/dashboard/channels')}
                  className="mt-3 text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  Connect your first channel
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {channels.filter(c => c.is_active).map((channel) => {
                  const info = getPlatformInfo(channel.platform);
                  return (
                    <div key={channel.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${info.color}`}>
                          {info.icon}
                        </div>
                        <div>
                          <div className="text-white font-medium">{info.name}</div>
                          <div className="text-white/40 text-sm">{channel.account_name || 'Connected'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 text-sm font-medium">Active</div>
                        {channel.last_sync_at && (
                          <div className="text-white/40 text-xs">
                            Last sync: {new Date(channel.last_sync_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sync Settings */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Sync Settings</h2>
                <p className="text-white/60 text-sm">Configure how often orders are synced from your channels</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => setSyncFrequency('hourly')}
                className={`p-4 rounded-lg border-2 transition ${
                  syncFrequency === 'hourly'
                    ? 'bg-cyan-600/20 border-cyan-500 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="font-medium mb-1">Hourly</div>
                <div className="text-xs opacity-60">Every hour</div>
              </button>

              <button
                onClick={() => setSyncFrequency('daily')}
                className={`p-4 rounded-lg border-2 transition ${
                  syncFrequency === 'daily'
                    ? 'bg-cyan-600/20 border-cyan-500 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="font-medium mb-1">Daily</div>
                <div className="text-xs opacity-60">Once per day</div>
              </button>

              <button
                onClick={() => setSyncFrequency('manual')}
                className={`p-4 rounded-lg border-2 transition ${
                  syncFrequency === 'manual'
                    ? 'bg-cyan-600/20 border-cyan-500 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="font-medium mb-1">Manual</div>
                <div className="text-xs opacity-60">On request only</div>
              </button>
            </div>

            <button
              onClick={handleSaveSyncSettings}
              disabled={savingSyncSettings}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 text-white rounded-lg font-medium transition flex items-center gap-2"
            >
              {savingSyncSettings ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                'Save Sync Settings'
              )}
            </button>
          </div>

          {/* Email Reports */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Email Reports</h2>
                <p className="text-white/60 text-sm">Get order summaries and reconciliation reports delivered to your inbox</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleSaveEmailSettings('none')}
                disabled={savingEmailSettings}
                className={`p-4 rounded-lg border-2 transition ${
                  emailReportFrequency === 'none'
                    ? 'bg-cyan-600/20 border-cyan-500 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="font-medium mb-1">Off</div>
                <div className="text-xs opacity-60">No emails</div>
              </button>

              <button
                onClick={() => handleSaveEmailSettings('weekly')}
                disabled={savingEmailSettings}
                className={`p-4 rounded-lg border-2 transition ${
                  emailReportFrequency === 'weekly'
                    ? 'bg-cyan-600/20 border-cyan-500 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="font-medium mb-1">Weekly</div>
                <div className="text-xs opacity-60">Every Monday</div>
              </button>

              <button
                onClick={() => handleSaveEmailSettings('monthly')}
                disabled={savingEmailSettings}
                className={`p-4 rounded-lg border-2 transition ${
                  emailReportFrequency === 'monthly'
                    ? 'bg-cyan-600/20 border-cyan-500 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="font-medium mb-1">Monthly</div>
                <div className="text-xs opacity-60">1st of month</div>
              </button>
            </div>

            {savingEmailSettings && (
              <div className="mt-3 text-white/60 text-sm flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </div>
            )}
          </div>

          {/* Support */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-2">Need Help?</h3>
            <p className="text-white/60 text-sm mb-4">
              Have questions about SyncFlow or need assistance with your channels? We're here to help.
            </p>
            <a
              href="mailto:adam@argora.ai"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Support
            </a>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-cyan-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading settings...</div>
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
