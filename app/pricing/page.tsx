import Link from 'next/link';

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
        <div className="max-w-md mx-auto">
          <div className="bg-white/10 backdrop-blur border-2 border-cyan-500/50 rounded-2xl p-8 text-center relative overflow-hidden">
            <div className="absolute top-4 right-4 px-3 py-1 bg-cyan-500 text-white text-xs font-bold rounded-full">
              SAVE $336/YR
            </div>
            <div className="inline-flex px-4 py-1 bg-cyan-500/20 rounded-full text-cyan-300 text-sm font-medium mb-4">
              All Channels Included
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Pro Plan</h2>
            <div className="mb-6">
              <span className="text-5xl font-bold text-white">$29</span>
              <span className="text-white/60">/month</span>
            </div>
            <div className="text-green-400 font-medium mb-6">14-day free trial included</div>

            <ul className="text-left space-y-3 mb-8">
              <li className="flex items-center gap-3 text-white/80">
                <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Amazon order sync
              </li>
              <li className="flex items-center gap-3 text-white/80">
                <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Shopify order sync
              </li>
              <li className="flex items-center gap-3 text-white/80">
                <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Etsy order sync
              </li>
              <li className="flex items-center gap-3 text-white/80">
                <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Unified dashboard
              </li>
              <li className="flex items-center gap-3 text-white/80">
                <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Fee tracking & profit calculation
              </li>
              <li className="flex items-center gap-3 text-white/80">
                <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Payout reconciliation
              </li>
              <li className="flex items-center gap-3 text-white/80">
                <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Channel analytics
              </li>
              <li className="flex items-center gap-3 text-white/80">
                <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                CSV export
              </li>
            </ul>

            <Link
              href="/dashboard"
              className="block w-full py-3 px-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold rounded-lg transition"
            >
              Start Free Trial
            </Link>
            <p className="text-white/40 text-sm mt-3">No credit card required</p>
          </div>
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
