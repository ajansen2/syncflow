'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function HowItWorksPage() {
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
            <Link href="/about" className="text-white/80 hover:text-white transition-colors">About</Link>
            <Link href="/how-it-works" className="text-cyan-400 transition-colors">How It Works</Link>
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
              How <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">SyncFlow</span> Works
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              From installation to unified order management in 4 simple steps
            </p>
          </div>
        </div>
      </section>

      {/* The Process - 4 Steps */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-20">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-cyan-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-cyan-500/50 transition-all h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Install the App</h3>
                <p className="text-white/70">
                  Install SyncFlow from the Shopify App Store. Your Shopify store connects automatically during installation.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-cyan-600 to-transparent"></div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-cyan-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-cyan-500/50 transition-all h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Connect Channels</h3>
                <p className="text-white/70">
                  Link your Amazon Seller Central and Etsy accounts via secure OAuth. We never store your passwords.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-cyan-600 to-transparent"></div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-cyan-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-cyan-500/50 transition-all h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Orders Sync</h3>
                <p className="text-white/70">
                  Orders from all connected channels sync automatically to your unified dashboard. Configure hourly, daily, or manual sync.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-cyan-600 to-transparent"></div>
            </div>

            {/* Step 4 */}
            <div>
              <div className="bg-gradient-to-br from-cyan-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-cyan-500/50 transition-all h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-white">4</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Track & Reconcile</h3>
                <p className="text-white/70">
                  View all orders, track fees by channel, and reconcile payouts. Export to CSV for your accountant.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Dive Sections */}
      <section className="py-20 relative bg-gradient-to-b from-transparent via-cyan-900/10 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">Under the Hood</h2>
            <p className="text-xl text-white/70">
              Here's what makes SyncFlow different from other multi-channel tools
            </p>
          </div>

          <div className="space-y-12">
            {/* Channel Integration */}
            <div className="bg-gradient-to-br from-cyan-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-10">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-4">Seamless Channel Integration</h3>
                  <p className="text-white/70 mb-4">
                    SyncFlow connects to your sales channels via official APIs, ensuring reliable and secure data sync.
                  </p>
                  <ul className="space-y-2 text-white/70">
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong>Shopify:</strong> Auto-connected during app installation via Shopify App Bridge</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong>Amazon:</strong> Connect via Amazon SP-API with Seller Central OAuth</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong>Etsy:</strong> Connect via Etsy Open API with secure OAuth</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6">
                  <h4 className="text-white font-semibold mb-3">Example Unified Order</h4>
                  <div className="bg-slate-700/50 rounded-lg p-4 text-white/80 text-sm font-mono">
                    Order #AMZ-12345<br/>
                    Platform: Amazon<br/>
                    Product: Blue Widget (3 units)<br/>
                    Gross: $89.97<br/>
                    Amazon Fee: -$13.50<br/>
                    FBA Fee: -$8.25<br/>
                    <span className="text-green-400">Net Revenue: $68.22</span>
                  </div>
                  <p className="text-cyan-400 text-xs mt-3">^ All orders from all channels in one place</p>
                </div>
              </div>
            </div>

            {/* Fee Tracking */}
            <div className="bg-gradient-to-br from-cyan-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-10">
              <h3 className="text-3xl font-bold text-white mb-6 text-center">Automatic Fee Tracking</h3>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-slate-800/50 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📦</span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">Amazon Fees</h4>
                  <ul className="text-white/70 text-sm text-left space-y-1">
                    <li>• Referral fees</li>
                    <li>• FBA fulfillment fees</li>
                    <li>• Storage fees</li>
                    <li>• Advertising costs</li>
                  </ul>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🛍️</span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">Shopify Fees</h4>
                  <ul className="text-white/70 text-sm text-left space-y-1">
                    <li>• Payment processing</li>
                    <li>• Transaction fees</li>
                    <li>• App charges</li>
                    <li>• Shipping labels</li>
                  </ul>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-orange-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🧶</span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">Etsy Fees</h4>
                  <ul className="text-white/70 text-sm text-left space-y-1">
                    <li>• Listing fees</li>
                    <li>• Transaction fees</li>
                    <li>• Payment processing</li>
                    <li>• Offsite ads</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 bg-slate-800/50 rounded-xl p-6">
                <p className="text-white/70 text-sm text-center">
                  <span className="text-white font-semibold">Why this matters:</span> Most sellers don't know their true profit margins because marketplace fees are complex and vary by product. SyncFlow tracks every fee automatically so you know exactly what you're keeping.
                </p>
              </div>
            </div>

            {/* Payout Reconciliation */}
            <div className="bg-gradient-to-br from-cyan-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-10">
              <h3 className="text-3xl font-bold text-white mb-6">Payout Reconciliation</h3>
              <p className="text-white/70 mb-6">
                Reconciling marketplace payouts with your bank deposits is tedious. SyncFlow automates it:
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 rounded-xl p-6">
                  <h4 className="text-white font-semibold mb-3">Match Payouts</h4>
                  <p className="text-white/70 text-sm">
                    We pull payout data from each channel and match it against your orders, showing exactly what each deposit covers.
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6">
                  <h4 className="text-white font-semibold mb-3">Track Discrepancies</h4>
                  <p className="text-white/70 text-sm">
                    Spot when a marketplace payout doesn't match expected amounts. No more wondering where that $47 went.
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6">
                  <h4 className="text-white font-semibold mb-3">Export for Accounting</h4>
                  <p className="text-white/70 text-sm">
                    One-click CSV export with all the data your accountant needs. Formatted for QuickBooks, Xero, or any accounting software.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-6">Supported Platforms</h2>
            <p className="text-xl text-white/70">Connect your sales channels in minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-cyan-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-green-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🛍️</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Shopify</h3>
              <p className="text-white/70">
                Auto-connected during installation. Your primary store hub.
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📦</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Amazon</h3>
              <p className="text-white/70">
                Connect via Amazon SP-API. Supports FBA and FBM orders.
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-orange-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🧶</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Etsy</h3>
              <p className="text-white/70">
                Connect via Etsy Open API. Full order and fee sync.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Unify Your Sales Channels?
          </h2>
          <p className="text-xl text-white/70 mb-8">
            Join Shopify merchants who track all their orders in one place. 14-day free trial, then just $29/month.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-12 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold text-lg rounded-xl transition-all"
          >
            Start Free Trial
          </Link>
          <p className="text-white/60 text-sm mt-4">No credit card required</p>
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
