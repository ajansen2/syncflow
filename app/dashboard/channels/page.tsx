'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase-client';
import { navigateInApp } from '@/lib/shopify-app-bridge';
import Link from 'next/link';

interface Store {
  id: string;
  shop_domain: string;
  store_name: string;
}

interface ChannelConnection {
  id: string;
  platform: string;
  account_name: string;
  marketplace: string;
  is_active: boolean;
  last_sync_at: string | null;
  sync_status: string;
}

function ChannelsContent() {
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [channels, setChannels] = useState<ChannelConnection[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `/api/stores/lookup?shop=${encodeURIComponent(shop)}`, false);
        xhr.send();

        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          if (data.store) {
            setStore(data.store);

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

  const handleConnectChannel = async (platform: string) => {
    if (!store) return;
    setConnecting(platform);

    try {
      const width = 600;
      const height = 700;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      window.open(
        `/api/channels/${platform}/connect?store_id=${store.id}`,
        `${platform} OAuth`,
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for success message
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === `${platform}_connected`) {
          if (event.data.success) {
            setSuccessMessage(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connected successfully!`);
            window.location.reload();
          } else {
            setErrorMessage(`Failed to connect ${platform}`);
          }
          setTimeout(() => {
            setSuccessMessage('');
            setErrorMessage('');
          }, 5000);
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (error) {
      setErrorMessage(`Failed to connect ${platform}`);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (channelId: string) => {
    if (!confirm('Are you sure you want to disconnect this channel?')) return;

    try {
      if (supabase) {
        await supabase
          .from('channel_connections')
          .update({ is_active: false })
          .eq('id', channelId);

        setChannels(channels.map(c =>
          c.id === channelId ? { ...c, is_active: false } : c
        ));
        setSuccessMessage('Channel disconnected');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      setErrorMessage('Failed to disconnect channel');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const getPlatformInfo = (platform: string) => {
    switch (platform) {
      case 'amazon':
        return {
          name: 'Amazon',
          icon: '📦',
          color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
          description: 'Sync orders from Amazon Seller Central'
        };
      case 'etsy':
        return {
          name: 'Etsy',
          icon: '🧶',
          color: 'bg-orange-600/20 text-orange-300 border-orange-600/30',
          description: 'Sync orders from your Etsy shop'
        };
      case 'shopify':
      default:
        return {
          name: 'Shopify',
          icon: '🛍️',
          color: 'bg-green-500/20 text-green-400 border-green-500/30',
          description: 'Your primary Shopify store (auto-connected)'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-cyan-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading channels...</div>
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
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold">
                S
              </div>
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
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="font-medium">Channels</span>
            </button>

            <button
              onClick={() => navigateInApp('/dashboard/settings')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-white/5 hover:text-white transition"
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
            <h1 className="text-2xl font-bold text-white">Channel Connections</h1>
            <p className="text-white/60 text-sm">Connect your sales channels to sync orders automatically</p>
          </div>
        </header>

        <div className="p-6 max-w-4xl">
          {/* Messages */}
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

          {/* Available Channels */}
          <div className="space-y-4">
            {['shopify', 'amazon', 'etsy'].map((platform) => {
              const info = getPlatformInfo(platform);
              const connection = channels.find(c => c.platform === platform);
              const isConnected = connection?.is_active;

              return (
                <div
                  key={platform}
                  className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${info.color}`}>
                        {info.icon}
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">{info.name}</div>
                        <div className="text-white/60 text-sm">{info.description}</div>
                        {connection && (
                          <div className="text-white/40 text-xs mt-1">
                            {connection.account_name && `Account: ${connection.account_name}`}
                            {connection.last_sync_at && ` · Last sync: ${new Date(connection.last_sync_at).toLocaleDateString()}`}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isConnected ? (
                        <>
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                            Connected
                          </span>
                          {platform !== 'shopify' && (
                            <button
                              onClick={() => handleDisconnect(connection!.id)}
                              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition"
                            >
                              Disconnect
                            </button>
                          )}
                        </>
                      ) : platform === 'shopify' ? (
                        <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm font-medium">
                          Auto-Connected
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConnectChannel(platform)}
                          disabled={connecting === platform}
                          className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 text-white rounded-lg font-medium transition flex items-center gap-2"
                        >
                          {connecting === platform ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Connecting...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Connect
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Channel Features */}
                  {platform !== 'shopify' && !isConnected && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="text-white/60 text-sm">What you'll get:</div>
                      <ul className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <li className="flex items-center gap-2 text-white/80">
                          <span className="text-cyan-400">✓</span> Order sync
                        </li>
                        <li className="flex items-center gap-2 text-white/80">
                          <span className="text-cyan-400">✓</span> Fee tracking
                        </li>
                        <li className="flex items-center gap-2 text-white/80">
                          <span className="text-cyan-400">✓</span> Revenue reports
                        </li>
                        <li className="flex items-center gap-2 text-white/80">
                          <span className="text-cyan-400">✓</span> Payout reconciliation
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">Need Help Connecting?</h3>
            <p className="text-white/60 text-sm mb-4">
              Each channel requires authorization to access your order data. We use secure OAuth to connect - your credentials are never stored.
            </p>
            <a
              href="mailto:adam@argora.ai"
              className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
            >
              Contact Support →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ChannelsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-cyan-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading channels...</div>
        </div>
      </div>
    }>
      <ChannelsContent />
    </Suspense>
  );
}
