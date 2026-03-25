'use client';

import Link from 'next/link';
import PricingCard from '@/components/ui/pricing-card';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
              S
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
              SyncFlow
            </span>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h1>
          <p className="text-white/60 text-lg">All your channels. One dashboard. One price.</p>
        </div>

        {/* Pricing Card */}
        <div className="flex justify-center">
          <PricingCard />
        </div>

        {/* Comparison */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-white mb-8">Compare with A2X</h3>
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden max-w-2xl mx-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/10">
                  <th className="px-6 py-4 text-left text-white/60">Channel</th>
                  <th className="px-6 py-4 text-center text-cyan-400 font-bold">SyncFlow</th>
                  <th className="px-6 py-4 text-center text-white/60">A2X</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-white/10">
                  <td className="px-6 py-4 text-white">Amazon</td>
                  <td className="px-6 py-4 text-center text-cyan-400">Included</td>
                  <td className="px-6 py-4 text-center text-white/60">$19/mo</td>
                </tr>
                <tr className="border-t border-white/10">
                  <td className="px-6 py-4 text-white">Shopify</td>
                  <td className="px-6 py-4 text-center text-cyan-400">Included</td>
                  <td className="px-6 py-4 text-center text-white/60">$19/mo</td>
                </tr>
                <tr className="border-t border-white/10">
                  <td className="px-6 py-4 text-white">Etsy</td>
                  <td className="px-6 py-4 text-center text-cyan-400">Included</td>
                  <td className="px-6 py-4 text-center text-white/60">$19/mo</td>
                </tr>
                <tr className="border-t border-white/10 bg-white/5">
                  <td className="px-6 py-4 text-white font-bold">Total</td>
                  <td className="px-6 py-4 text-center text-cyan-400 font-bold text-xl">$29/mo</td>
                  <td className="px-6 py-4 text-center text-white/60 font-bold">$57/mo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-white/40 text-sm">
          <p>Questions? Contact us at <a href="mailto:adam@argora.ai" className="text-cyan-400 hover:underline">adam@argora.ai</a></p>
        </div>
      </div>
    </div>
  );
}
