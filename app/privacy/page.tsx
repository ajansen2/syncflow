export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 md:p-12">
        <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
        <p className="text-white/60 mb-8">Last updated: February 3, 2026</p>

        <div className="space-y-8 text-white/80">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              SyncFlow (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our Shopify application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <p className="mb-3">When you install and use SyncFlow, we collect:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Store Information:</strong> Your Shopify store name, domain, and email address</li>
              <li><strong>Order Data:</strong> Order details including order numbers, amounts, fees, and status from your connected sales channels</li>
              <li><strong>Connection Data:</strong> OAuth tokens required to sync data from Shopify, Amazon, and Etsy</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <p className="mb-3">We use the collected information to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Sync and display your orders from connected sales channels</li>
              <li>Calculate platform fees and net revenue</li>
              <li>Generate CSV exports for your accounting software</li>
              <li>Provide customer support</li>
              <li>Improve our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Data Storage and Security</h2>
            <p>
              Your data is stored securely using industry-standard encryption. We use Supabase for data storage with row-level security policies. Access tokens are encrypted and stored securely. We do not sell, rent, or share your personal information with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide you services. If you uninstall the app, we will delete your data within 30 days unless required to retain it for legal purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a portable format</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Third-Party Services</h2>
            <p>
              SyncFlow integrates with Shopify, Amazon, and Etsy. Your use of these platforms is governed by their respective privacy policies. We only access data necessary to provide our order syncing services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="mt-3">
              <strong>Email:</strong> adam@argora.ai<br />
              <strong>Company:</strong> Argora
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/20">
          <a href="/" className="text-cyan-400 hover:text-cyan-300 transition">
            ← Back to SyncFlow
          </a>
        </div>
      </div>
    </div>
  );
}
