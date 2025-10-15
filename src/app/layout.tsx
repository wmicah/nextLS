import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageErrorFallback } from "@/components/ErrorFallback";
import CustomAnalytics from "@/components/Analytics";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import Toast from "@/components/common/Toast";
import ChatbotWrapper from "@/components/Chatbot/ChatbotWrapper";
import { ChatbotProvider } from "@/components/Chatbot/ChatbotContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
// Lesson reminder service will be initialized via API route instead of layout
import MessagingServiceProvider from "@/components/MessagingServiceProvider";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import PWAProvider from "@/components/PWAProvider";
import SessionManager from "@/components/SessionManager";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Improve font loading performance
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "NextLevel Coaching - Professional Coaching Platform",
    template: "%s | NextLevel Coaching",
  },
  description:
    "Professional coaching platform for coaches and athletes to manage clients, create programs, and track progress.",
  keywords: [
    "coaching platform",
    "athletic training",
    "personalized programs",
    "coaching lessons",
    "sports coaching",
    "athletic development",
    "sports technology",
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
    title: "NextLevel Coaching - Professional Coaching Platform",
    description:
      "Professional coaching platform for coaches and athletes to manage clients, create programs, and track progress.",
    siteName: "NextLevel Coaching",
    images: [
      {
        url: "/dashboard-preview.jpg",
        width: 1200,
        height: 630,
        alt: "NextLevel Coaching Dashboard Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NextLevel Coaching - Professional Coaching Platform",
    description:
      "Professional coaching platform for coaches and athletes to manage clients, create programs, and track progress.",
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
  classification: "softball coaching platform",
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
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta
          httpEquiv="Referrer-Policy"
          content="strict-origin-when-cross-origin"
        />

        {/* PWA manifest */}
        <link rel="manifest" href="/site.webmanifest" />

        {/* PWA meta tags */}
        <meta name="application-name" content="NextLevel Coaching" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NextLevel Coaching" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#4A5A70" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#4A5A70" />

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
                    <ChatbotWrapper />
                    <CustomAnalytics />
                    <ServiceWorkerRegistration />
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
