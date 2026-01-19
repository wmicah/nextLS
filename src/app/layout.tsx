import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/lib/polyfills"; // Polyfills for browser environment (must be imported first)
import "./globals.css";
import Providers from "@/components/Providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageErrorFallback } from "@/components/ErrorFallback";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import Toast from "@/components/common/Toast";
import { ChatbotProvider } from "@/components/Chatbot/ChatbotContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
// Lesson reminder service will be initialized via API route instead of layout
import MessagingServiceProvider from "@/components/MessagingServiceProvider";
import PWAProvider from "@/components/PWAProvider";
import SessionManager from "@/components/SessionManager";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { LazyClientComponents } from "@/components/LazyClientComponents";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Improve font loading performance
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "NextLevel Coaching - Elevate Your Coaching Game | Sports Coaching Platform",
    template: "%s | NextLevel Coaching",
  },
  description:
    "The professional platform trusted by elite coaches to build championship programs, develop athletes, and grow their business. Athletes train free. Coaches pay monthly. Start your free trial today.",
  keywords: [
    "sports coaching platform",
    "athletic coaching software",
    "coach management system",
    "athlete training platform",
    "sports coaching app",
    "coaching business software",
    "athlete development platform",
    "personal training software",
    "sports team management",
    "coaching program builder",
    "athlete progress tracking",
    "coaching lesson scheduling",
    "baseball coaching platform",
    "softball coaching software",
    "pitching coach software",
    "athletic performance tracking",
    "coach client management",
    "sports technology platform",
    "elite coaching platform",
    "professional coaching tools",
  ],
  authors: [{ name: "NextLevel Coaching Team" }],
  creator: "NextLevel Coaching",
  publisher: "NextLevel Coaching",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://nxlvlcoach.com"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "NextLevel Coaching - Elevate Your Coaching Game",
    description:
      "The professional platform trusted by elite coaches to build championship programs, develop athletes, and grow their business. Athletes train free. Start today.",
    siteName: "NextLevel Coaching",
    images: [
      {
        url: "/nextls-coming-soon.png",
        width: 1200,
        height: 630,
        alt: "NextLevel Coaching - Professional Sports Coaching Platform Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NextLevel Coaching - Elevate Your Coaching Game",
    description:
      "The professional platform trusted by elite coaches. Build championship programs, develop athletes, and grow your coaching business.",
    images: ["/dashboard-preview.jpg"],
    creator: "@nextlevelcoaching",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION,
  },
  category: "sports",
  classification: "sports coaching platform",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Global polyfill - must run before any other scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined' && typeof global === 'undefined') {
                  window.global = window;
                }
                if (typeof globalThis !== 'undefined' && typeof globalThis.global === 'undefined') {
                  globalThis.global = globalThis;
                }
              })();
            `,
          }}
        />
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />

        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta
          httpEquiv="Referrer-Policy"
          content="strict-origin-when-cross-origin"
        />

        {/* PWA manifest */}
        <link rel="manifest" href="/site.webmanifest" />

        {/* PWA meta tags */}
        <meta name="application-name" content="NextLevel Coaching" />
        <meta
          name="description"
          content="Professional coaching platform for coaches and athletes to manage clients, create programs, and track progress."
        />

        {/* iOS-specific meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="NextLevel" />

        {/* Apple Touch Icons - Multiple sizes for better iOS support */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link
          rel="apple-touch-icon"
          sizes="57x57"
          href="/apple-touch-icon-57x57.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="60x60"
          href="/apple-touch-icon-60x60.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="72x72"
          href="/apple-touch-icon-72x72.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="76x76"
          href="/apple-touch-icon-76x76.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="114x114"
          href="/apple-touch-icon-114x114.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="120x120"
          href="/apple-touch-icon-120x120.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="144x144"
          href="/apple-touch-icon-144x144.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href="/apple-touch-icon-152x152.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />

        {/* iOS Splash Screens */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-iphone-6.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash-iphone-6-plus.png"
          media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash-iphone-x.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
        />

        {/* General mobile meta tags */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#4A5A70" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta
          name="theme-color"
          content="#4A5A70"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#2A3133"
          media="(prefers-color-scheme: dark)"
        />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          rel="icon"
          href="/icon-16x16.png"
          type="image/png"
          sizes="16x16"
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SportsOrganization",
              name: "NextLevel Coaching",
              description: "Professional coaching platform",
              url: "https://nxlvlcoach.com",
              logo: "https://nxlvlcoach.com/logo2.png",
              sameAs: [
                "https://twitter.com/nextlevelcoaching",
                "https://facebook.com/nextlevelcoaching",
                "https://instagram.com/nextlevelcoaching",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+1-555-0123",
                contactType: "customer service",
                areaServed: "US",
                availableLanguage: "English",
              },
              areaServed: {
                "@type": "Country",
                name: "United States",
              },
              serviceType: "Professional Coaching",
              offers: {
                "@type": "Offer",
                description: "Professional coaching platform",
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.className} text-slate-100 antialiased`}>
        <ErrorBoundary fallback={<PageErrorFallback />}>
          <Providers>
            <ThemeProvider>
              <ChatbotProvider>
                <MessagingServiceProvider>
                  <PWAProvider>
                    <SessionManager />
                    <ConditionalNavbar />
                    {children}
                    <Toast />
                    <LazyClientComponents />
                  </PWAProvider>
                </MessagingServiceProvider>
              </ChatbotProvider>
            </ThemeProvider>
          </Providers>
        </ErrorBoundary>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
