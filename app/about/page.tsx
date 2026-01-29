'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (parallaxRef.current) {
        const scrolled = window.scrollY;
        parallaxRef.current.style.transform = `translateY(${scrolled * 0.5}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold">
              S
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
              SyncFlow
            </span>
          </Link>
          <nav className="flex gap-8">
            <Link href="/" className="text-white/80 hover:text-white transition-colors">Home</Link>
            <Link href="/about" className="text-cyan-400 transition-colors">About</Link>
            <Link href="/how-it-works" className="text-white/80 hover:text-white transition-colors">How It Works</Link>
            <Link href="/pricing" className="text-white/80 hover:text-white transition-colors">Pricing</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div ref={parallaxRef} className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold text-white mb-6">
              About <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">SyncFlow</span>
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Unified multi-channel order management for Shopify merchants selling on Amazon, Etsy, and more
            </p>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-br from-cyan-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-12 mb-20">
            <h2 className="text-4xl font-bold text-white mb-6 text-center">The Problem We Solve</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="text-5xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent mb-4">3+</div>
                <h3 className="text-xl font-bold text-white mb-2">Fragmented Channels</h3>
                <p className="text-white/70">
                  Multi-channel sellers manage orders across Shopify, Amazon, and Etsy separately. Each platform has different dashboards, fees, and reporting.
                </p>
              </div>
              <div>
                <div className="text-5xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent mb-4">$57/mo</div>
                <h3 className="text-xl font-bold text-white mb-2">Expensive Solutions</h3>
                <p className="text-white/70">
                  Tools like A2X charge $19/month per channel. Connecting Amazon, Shopify, and Etsy costs $57/month just for basic order sync.
                </p>
              </div>
              <div>
                <div className="text-5xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent mb-4">Hours</div>
                <h3 className="text-xl font-bold text-white mb-2">Manual Reconciliation</h3>
                <p className="text-white/70">
                  Without proper tools, merchants spend hours each month manually reconciling payouts, tracking fees, and calculating true profit margins.
                </p>
              </div>
            </div>
          </div>

          {/* Adam's Story */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 backdrop-blur-sm border border-white/10 rounded-2xl p-2">
                <div className="bg-slate-800/50 rounded-xl p-12 text-center">
                  <div className="w-48 h-48 rounded-full mx-auto mb-6 bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <span className="text-6xl font-bold text-white">A</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Adam</h3>
                  <p className="text-cyan-400 mb-4">Founder</p>
                  <a href="mailto:adam@argora.ai" className="text-white/60 hover:text-white transition-colors text-sm">
                    adam@argora.ai
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-white mb-6">Why I Built SyncFlow</h2>
              <p className="text-lg text-white/70 mb-4">
                Hi, I'm Adam. I built SyncFlow to solve the biggest pain point for multi-channel e-commerce sellers: fragmented order management.
              </p>
              <p className="text-lg text-white/70 mb-4">
                As sellers expand to Amazon, Etsy, and other marketplaces alongside their Shopify stores, they face a growing challenge. Each platform has different fee structures, payout schedules, and reporting formats.
              </p>
              <p className="text-lg text-white/70 mb-4">
                Existing solutions like A2X charge per channel - $19/month each for Amazon, Shopify, and Etsy. That's $57/month before you've even synced a single order.
              </p>
              <p className="text-lg text-white/70">
                SyncFlow consolidates all your channels into one dashboard for just $29/month. Track orders, reconcile payouts, and understand your true profit across every platform - saving you both time and money.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How SyncFlow Works */}
      <section className="py-20 relative bg-gradient-to-b from-transparent via-cyan-900/10 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              What <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">SyncFlow</span> Does
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              One dashboard for all your sales channels
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-gradient-to-br from-cyan-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-cyan-500/50 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Order Sync</h3>
              <p className="text-white/70">
                Automatically sync orders from Amazon, Etsy, and Shopify into a unified dashboard. No more switching between platforms.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-gradient-to-br from-cyan-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-cyan-500/50 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Fee Tracking</h3>
              <p className="text-white/70">
                Automatically track marketplace fees, shipping costs, and commissions. Know exactly how much you're paying each platform.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-gradient-to-br from-cyan-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-cyan-500/50 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Profit Analytics</h3>
              <p className="text-white/70">
                See revenue breakdown by channel, track net profit after fees, and export data for accounting. Reconcile payouts in minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Summary */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-br from-cyan-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-12">
            <h2 className="text-4xl font-bold text-white mb-6 text-center">Simple, Fair Pricing</h2>
            <p className="text-xl text-white/70 mb-8 text-center max-w-3xl mx-auto">
              All channels included for one price. No per-channel fees.
            </p>

            <div className="grid md:grid-cols-2 gap-8 mb-8 max-w-3xl mx-auto">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">$29/Month Flat Fee</h3>
                  <p className="text-white/70">Amazon, Shopify, and Etsy all included. Compare to A2X at $57/month for the same channels.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">14-Day Free Trial</h3>
                  <p className="text-white/70">Try SyncFlow risk-free. No credit card required to start.</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/dashboard"
                className="inline-block px-12 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold text-lg rounded-xl transition-all"
              >
                Start Free Trial
              </Link>
              <p className="text-white/60 text-sm mt-4">No credit card required</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  S
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">SyncFlow</span>
              </div>
              <p className="text-white/60">Multi-channel order sync for Shopify</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-white/60 hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/about" className="text-white/60 hover:text-white transition-colors">About</Link></li>
                <li><Link href="/how-it-works" className="text-white/60 hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="/pricing" className="text-white/60 hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-white/60 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-white/60 hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <p className="text-white/60">adam@argora.ai</p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-white/60">
            <p>&copy; 2025 SyncFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
