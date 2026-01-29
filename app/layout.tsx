import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SyncFlow - Multi-Channel Order Sync for Shopify",
  description: "Sync orders from Amazon, Etsy & Shopify in one dashboard. Unified order management, fee tracking, and payout reconciliation for multi-channel sellers.",
  keywords: "multi-channel, order sync, shopify app, amazon seller, etsy seller, ecommerce, bookkeeping, reconciliation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || 'ebcd49739472f025754a6afcc20bf66d';
  
  return (
    <html lang="en">
      <head>
        {/* Shopify App Bridge - MUST be first script, synchronous, from CDN */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
        {/* Shopify API key meta tag for App Bridge */}
        <meta name="shopify-api-key" content={apiKey} />
        {/* Initialize App Bridge with retry logic - waits for CDN to load */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{__html: `
          (function() {
            // Only initialize if embedded in Shopify (in iframe)
            if (window.self === window.top) {
              return; // Not embedded, skip
            }

            var retryCount = 0;
            var maxRetries = 50; // Try for ~5 seconds

            // Wait for window.shopify to be available with retry logic
            function initializeAppBridge() {
              if (window.shopify && window.shopify.createApp) {
                try {
                  var urlParams = new URLSearchParams(window.location.search);
                  var host = urlParams.get('host');
                  var shop = urlParams.get('shop');

                  if (host && shop) {
                    window.shopifyApp = window.shopify.createApp({
                      apiKey: '${apiKey}',
                      host: host,
                      forceRedirect: false
                    });
                    console.log('✅ App Bridge initialized from CDN (inline script after ' + retryCount + ' retries)');
                  }
                } catch (error) {
                  console.error('❌ Failed to initialize App Bridge:', error);
                }
              } else {
                retryCount++;
                if (retryCount < maxRetries) {
                  // Retry after a short delay
                  setTimeout(initializeAppBridge, 100);
                } else {
                  console.error('❌ Timed out waiting for Shopify App Bridge CDN to load');
                }
              }
            }

            // Start initialization attempt
            initializeAppBridge();
          })();
        `}} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
