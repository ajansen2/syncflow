'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase-client';
import { navigateInApp } from '@/lib/shopify-app-bridge';
import Link from 'next/link';

interface Order {
  id: string;
  platform: string;
  platform_order_id: string;
  order_number: string;
  order_date: string;
  gross_revenue: number;
  shipping_revenue: number;
  tax_collected: number;
  platform_fees: number;
  payment_processing_fee: number;
  shipping_cost: number;
  net_revenue: number;
  financial_status: string;
  fulfillment_status: string;
  currency: string;
  created_at: string;
}

function OrdersContent() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [filterSource, setFilterSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const searchParams = useSearchParams();
  const supabase = getSupabaseClient();

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const shop = searchParams.get('shop');

        if (!shop) {
          setLoading(false);
          return;
        }

        // Get store by shop domain
        const { data: store, error: storeError } = await supabase
          .from('stores')
          .select('id')
          .eq('shop_domain', shop)
          .single();

        if (storeError || !store) {
          console.error('Store not found:', storeError);
          setLoading(false);
          return;
        }

        // Fetch orders for this store
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('store_id', store.id)
          .order('order_date', { ascending: false });

        if (ordersError) {
          console.error('Error fetching orders:', ordersError);
        } else {
          setOrders(ordersData || []);
          setFilteredOrders(ordersData || []);
        }
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [searchParams, supabase]);

  // Filter orders when filter or search changes
  useEffect(() => {
    let filtered = orders;

    // Filter by platform
    if (filterSource !== 'all') {
      filtered = filtered.filter(order => order.platform === filterSource);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.order_number?.toLowerCase().includes(query) ||
        order.platform_order_id?.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [orders, filterSource, searchQuery]);

  // Get unique platforms for filter dropdown
  const platforms = Array.from(new Set(orders.map(order => order.platform))).filter(Boolean);

  // Calculate totals
  const totalGrossRevenue = filteredOrders.reduce((sum, order) => sum + (order.gross_revenue || 0), 0);
  const totalNetRevenue = filteredOrders.reduce((sum, order) => sum + (order.net_revenue || 0), 0);
  const totalFees = filteredOrders.reduce((sum, order) =>
    sum + (order.platform_fees || 0) + (order.payment_processing_fee || 0) + (order.shipping_cost || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-cyan-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading orders...</div>
        </div>
      </div>
    );
  }

  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const exportToCSV = () => {
    if (filteredOrders.length === 0) return;

    // QuickBooks/Xero compatible format
    const headers = [
      'Date',
      'Reference',
      'Description',
      'Platform',
      'Gross Revenue',
      'Shipping Revenue',
      'Tax Collected',
      'Platform Fees',
      'Payment Processing Fee',
      'Shipping Cost',
      'Net Revenue',
      'Currency',
      'Status'
    ];

    const rows = filteredOrders.map(order => [
      new Date(order.order_date).toISOString().split('T')[0], // YYYY-MM-DD format
      order.order_number || order.platform_order_id,
      `${order.platform} Order ${order.order_number}`,
      order.platform,
      order.gross_revenue.toFixed(2),
      order.shipping_revenue.toFixed(2),
      order.tax_collected.toFixed(2),
      order.platform_fees.toFixed(2),
      order.payment_processing_fee.toFixed(2),
      order.shipping_cost.toFixed(2),
      order.net_revenue.toFixed(2),
      order.currency,
      order.financial_status || 'completed'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `syncflow-orders-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900">
      {/* Sidebar - same as dashboard */}
      <aside className="fixed top-0 left-0 z-50 h-screen w-64 bg-slate-900/90 backdrop-blur border-r border-white/10 hidden lg:block">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="SyncFlow" className="w-10 h-10" />
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
                SyncFlow
              </span>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => navigateInApp('/dashboard')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-white/5 hover:text-white transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => navigateInApp('/dashboard/orders')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="font-medium">Orders</span>
            </button>

            <button
              onClick={() => navigateInApp('/dashboard/channels')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-white/5 hover:text-white transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="font-medium">Channels</span>
            </button>

            <button
              onClick={() => navigateInApp('/dashboard/settings')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-white/5 hover:text-white transition cursor-pointer"
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
        {/* Header */}
        <header className="bg-slate-900/50 backdrop-blur border-b border-white/10 sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Orders</h1>
            <button
              onClick={exportToCSV}
              disabled={filteredOrders.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        </header>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <h3 className="text-white/60 text-sm font-medium mb-2">Total Orders</h3>
              <div className="text-3xl font-bold text-white">{filteredOrders.length}</div>
            </div>
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <h3 className="text-white/60 text-sm font-medium mb-2">Gross Revenue</h3>
              <div className="text-3xl font-bold text-white">${totalGrossRevenue.toFixed(2)}</div>
            </div>
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <h3 className="text-white/60 text-sm font-medium mb-2">Total Fees</h3>
              <div className="text-3xl font-bold text-red-400">-${totalFees.toFixed(2)}</div>
            </div>
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <h3 className="text-white/60 text-sm font-medium mb-2">Net Revenue</h3>
              <div className="text-3xl font-bold text-green-400">${totalNetRevenue.toFixed(2)}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-white/60 text-sm mb-2 block">Search Orders</label>
                <input
                  type="text"
                  placeholder="Search by order number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="w-full md:w-64">
                <label className="text-white/60 text-sm mb-2 block">Filter by Platform</label>
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Platforms</option>
                  {platforms.map(platform => (
                    <option key={platform} value={platform}>{platform.charAt(0).toUpperCase() + platform.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Order</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Platform</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-white/80">Gross</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-white/80">Fees</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-white/80">Net</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {paginatedOrders.map((order) => {
                    const totalFees = (order.platform_fees || 0) + (order.payment_processing_fee || 0) + (order.shipping_cost || 0);
                    return (
                      <tr key={order.id} className="hover:bg-white/5 transition">
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">#{order.order_number || order.platform_order_id}</div>
                          <div className="text-white/40 text-xs">{order.platform_order_id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                            order.platform === 'amazon'
                              ? 'bg-orange-500/20 text-orange-300'
                              : order.platform === 'shopify'
                              ? 'bg-green-500/20 text-green-300'
                              : order.platform === 'etsy'
                              ? 'bg-orange-600/20 text-orange-200'
                              : 'bg-gray-500/20 text-gray-300'
                          }`}>
                            {order.platform.charAt(0).toUpperCase() + order.platform.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-white font-medium">${(order.gross_revenue || 0).toFixed(2)}</div>
                          <div className="text-white/40 text-xs">{order.currency}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-red-400">-${totalFees.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-green-400 font-bold">${(order.net_revenue || 0).toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                            order.financial_status === 'paid'
                              ? 'bg-green-500/20 text-green-300'
                              : order.financial_status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : order.financial_status === 'refunded'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-gray-500/20 text-gray-300'
                          }`}>
                            {order.financial_status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white">
                            {order.order_date ? new Date(order.order_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            }) : '-'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
                <div className="text-white/60 text-sm">
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredOrders.length)}-{Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      currentPage === 1
                        ? 'bg-white/5 text-white/30 cursor-not-allowed'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    ← Previous
                  </button>
                  <div className="text-white/60 text-sm px-4 py-2">
                    Page {currentPage} of {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      currentPage === totalPages
                        ? 'bg-white/5 text-white/30 cursor-not-allowed'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredOrders.length === 0 && (
              <div className="px-6 py-12 text-center">
                <svg className="w-16 h-16 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h3 className="text-xl font-bold text-white mb-2">No Orders Found</h3>
                <p className="text-white/60">
                  {searchQuery || filterSource !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Orders will appear here once customers make purchases'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-cyan-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading orders...</div>
        </div>
      </div>
    }>
      <OrdersContent />
    </Suspense>
  );
}
