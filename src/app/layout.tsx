import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Analytics from "@/components/Analytics";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import Toast from "@/components/common/Toast";
import ChatbotWrapper from "@/components/Chatbot/ChatbotWrapper";
import { ChatbotProvider } from "@/components/Chatbot/ChatbotContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
// Lesson reminder service will be initialized via API route instead of layout
import MessagingServiceProvider from "@/components/MessagingServiceProvider";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Improve font loading performance
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "Next Level Softball - Professional Coaching Platform",
    template: "%s | Next Level Softball",
  },
  description:
    "Transform your softball game with AI-powered coaching, personalized training programs, and expert guidance. Join the next level of softball excellence.",
  keywords: [
    "softball coaching",
    "AI coaching",
    "softball training",
    "personalized programs",
    "softball lessons",
    "coaching platform",
    "athletic development",
    "sports technology",
  ],
  authors: [{ name: "Next Level Softball Team" }],
  creator: "Next Level Softball",
  publisher: "Next Level Softball",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Next Level Softball - Professional Coaching Platform",
    description:
      "Transform your softball game with AI-powered coaching, personalized training programs, and expert guidance.",
    siteName: "Next Level Softball",
    images: [
      {
        url: "/dashboard-preview.jpg",
        width: 1200,
        height: 630,
        alt: "Next Level Softball Dashboard Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Next Level Softball - Professional Coaching Platform",
    description:
      "Transform your softball game with AI-powered coaching, personalized training programs, and expert guidance.",
    images: ["/dashboard-preview.jpg"],
    creator: "@nextlevelsoftball",
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
              name: "Next Level Softball",
              description:
                "Professional softball coaching platform with AI-powered training",
              url: "https://nextlevelsoftball.com",
              logo: "https://nextlevelsoftball.com/logo2.png",
              sameAs: [
                "https://twitter.com/nextlevelsoftball",
                "https://facebook.com/nextlevelsoftball",
                "https://instagram.com/nextlevelsoftball",
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
              serviceType: "Softball Coaching",
              offers: {
                "@type": "Offer",
                description:
                  "AI-powered softball coaching and training programs",
              },
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            <ThemeProvider>
              <ChatbotProvider>
                <MessagingServiceProvider>
                  <ConditionalNavbar />
                  {children}
                  <Toast />
                  <ChatbotWrapper />
                  <Analytics />
                  <ServiceWorkerRegistration />
                </MessagingServiceProvider>
              </ChatbotProvider>
            </ThemeProvider>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
