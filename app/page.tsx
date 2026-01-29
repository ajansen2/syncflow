'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const isEmbedded = window.self !== window.top
    if (isEmbedded) {
      const urlParams = new URLSearchParams(window.location.search)
      const shop = urlParams.get('shop')
      if (shop) {
        window.location.href = `/dashboard?${urlParams.toString()}`
      } else {
        window.location.href = '/dashboard'
      }
    }
  }, [router])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-slate-950/90 backdrop-blur-md border-b border-white/5' : ''
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
              S
            </div>
            <span className="text-xl font-bold">SyncFlow</span>
          </Link>
          <div className="flex items-center gap-8">
            <Link href="/pricing" className="text-white/60 hover:text-white transition text-sm">
              Pricing
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-white text-slate-900 rounded-lg font-medium text-sm hover:bg-white/90 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm mb-8">
            <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
            Shopify App
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            All your orders.
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              One dashboard.
            </span>
          </h1>

          <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
            Sync orders from Amazon, Etsy, and Shopify into a single view.
            Track fees, reconcile payouts, and see your true profit.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-semibold text-lg hover:opacity-90 transition"
            >
              Start Free Trial
            </Link>
            <Link
              href="/how-it-works"
              className="px-8 py-3.5 bg-white/5 border border-white/10 rounded-xl font-semibold text-lg hover:bg-white/10 transition"
            >
              How it Works
            </Link>
          </div>

          <p className="text-white/40 text-sm mt-6">
            14-day free trial &bull; $29/month &bull; No credit card required
          </p>
        </div>
      </section>

      {/* Channels */}
      <section className="py-16 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-white/40 text-sm mb-8">SYNC ORDERS FROM</p>
          <div className="flex justify-center items-center gap-12 flex-wrap">
            <div className="flex items-center gap-3 text-white/60">
              <span className="text-3xl">🛍️</span>
              <span className="font-medium">Shopify</span>
            </div>
            <div className="flex items-center gap-3 text-white/60">
              <span className="text-3xl">📦</span>
              <span className="font-medium">Amazon</span>
            </div>
            <div className="flex items-center gap-3 text-white/60">
              <span className="text-3xl">🧶</span>
              <span className="font-medium">Etsy</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to manage multi-channel sales
            </h2>
            <p className="text-white/50 text-lg">
              Stop switching between seller portals. See everything in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '📊',
                title: 'Unified Orders',
                desc: 'All orders from every channel in a single, searchable dashboard.'
              },
              {
                icon: '💰',
                title: 'Fee Tracking',
                desc: 'Automatically track platform fees and calculate true profit per order.'
              },
              {
                icon: '🔄',
                title: 'Payout Reconciliation',
                desc: 'Match marketplace payouts to orders. Know exactly what each deposit covers.'
              },
              {
                icon: '📈',
                title: 'Channel Analytics',
                desc: 'Compare performance across platforms. See which channel drives profit.'
              },
              {
                icon: '📤',
                title: 'Easy Export',
                desc: 'One-click CSV export for your accountant. QuickBooks and Xero ready.'
              },
              {
                icon: '⚡',
                title: 'Auto Sync',
                desc: 'Set it and forget it. Orders sync hourly, daily, or on demand.'
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple pricing. Half the cost of A2X.
            </h2>
            <p className="text-white/50">
              A2X charges per channel. We include everything.
            </p>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-white/10 overflow-hidden">
            <div className="grid grid-cols-3 border-b border-white/10">
              <div className="p-4 text-white/40 text-sm">Channel</div>
              <div className="p-4 text-center font-semibold text-cyan-400">SyncFlow</div>
              <div className="p-4 text-center text-white/40">A2X</div>
            </div>
            {[
              { channel: 'Amazon', sync: 'Included', a2x: '$19/mo' },
              { channel: 'Shopify', sync: 'Included', a2x: '$19/mo' },
              { channel: 'Etsy', sync: 'Included', a2x: '$19/mo' },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-3 border-b border-white/5">
                <div className="p-4 text-white/70">{row.channel}</div>
                <div className="p-4 text-center text-cyan-400">{row.sync}</div>
                <div className="p-4 text-center text-white/40">{row.a2x}</div>
              </div>
            ))}
            <div className="grid grid-cols-3 bg-white/[0.02]">
              <div className="p-4 font-semibold">Total</div>
              <div className="p-4 text-center font-bold text-2xl text-cyan-400">$29/mo</div>
              <div className="p-4 text-center text-white/40">$57/mo</div>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-white/40 mb-6">
              Save <span className="text-cyan-400 font-semibold">$336/year</span> compared to A2X
            </p>
            <Link
              href="/dashboard"
              className="inline-flex px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-semibold hover:opacity-90 transition"
            >
              Start 14-Day Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to simplify your multi-channel business?
          </h2>
          <p className="text-white/50 mb-8">
            Join sellers who save hours every week with unified order management.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex px-8 py-3.5 bg-white text-slate-900 rounded-xl font-semibold hover:bg-white/90 transition"
          >
            Get Started Free
          </Link>
          <p className="text-white/30 text-sm mt-4">
            No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            <span className="font-semibold">SyncFlow</span>
          </div>
          <div className="flex gap-6 text-sm text-white/40">
            <Link href="/privacy" className="hover:text-white/60 transition">Privacy</Link>
            <Link href="/terms" className="hover:text-white/60 transition">Terms</Link>
            <a href="mailto:adam@argora.ai" className="hover:text-white/60 transition">Contact</a>
          </div>
          <div className="text-white/30 text-sm">
            © 2025 SyncFlow
          </div>
        </div>
      </footer>
    </div>
  )
}
