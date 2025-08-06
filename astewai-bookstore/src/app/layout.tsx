import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { PWAInstallPrompt } from '@/components/layout/pwa-install-prompt';
import { SkipNavigation } from '@/components/layout/skip-navigation';
import { AuthProvider } from '@/contexts/auth-context';
import { QueryProvider, PurchaseRequestProvider } from '@/components/providers';
import { AnalyticsProvider } from '@/components/providers/analytics-provider';
import { APP_NAME, APP_DESCRIPTION } from '@/utils/constants';
import { Toaster } from 'sonner';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

// Temporarily disabled JetBrains Mono due to Turbopack font loading issue
// const jetbrainsMono = JetBrains_Mono({
//   variable: '--font-jetbrains-mono',
//   subsets: ['latin'],
//   display: 'swap',
// });

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    'digital bookstore',
    'ebooks',
    'online books',
    'book bundles',
    'reading',
    'digital library',
    'book collection',
    'astewai',
  ],
  authors: [{ name: 'Astewai Digital Bookstore' }],
  creator: 'Astewai Digital Bookstore',
  publisher: 'Astewai Digital Bookstore',
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_DESCRIPTION,
    site: '@astewai_books',
    creator: '@astewai_books',
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': APP_NAME,
    'application-name': APP_NAME,
    'msapplication-TileColor': '#000000',
    'msapplication-config': '/browserconfig.xml',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={APP_NAME} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      </head>
      <body
        className={`${inter.variable} antialiased layout-mobile safe-area-top safe-area-bottom`}
      >
        <QueryProvider>
          <AuthProvider>
            <PurchaseRequestProvider>
              <AnalyticsProvider>
                <SkipNavigation />
                <div className="layout-mobile">
                  <Header />
                  <main id="main-content" className="content-mobile" tabIndex={-1}>
                    {children}
                  </main>
                  <Footer />
                </div>
                <PWAInstallPrompt />
                <Toaster />
                {/* Live region for screen reader announcements */}
                <div
                  id="live-region"
                  aria-live="polite"
                  aria-atomic="true"
                  className="sr-only"
                />
              </AnalyticsProvider>
            </PurchaseRequestProvider>
          </AuthProvider>
        </QueryProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
