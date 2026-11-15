import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk, Source_Serif_4 } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LoginToast } from "@/components/LoginToast";
import { JsonLd } from "@/components/seo/JsonLd";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { FEED_ALTERNATE } from "@/lib/seo";
import { getSession } from "@/lib/session";
import { SITE } from "@/lib/site";
import { organizationSchema, websiteSchema } from "@/lib/structured-data";
import "./globals.css";

// Headlines + UI: a grotesk drawn for news publishing.
const grotesk = Schibsted_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-schibsted",
  display: "swap",
});

// Reading face for summaries and article prose (optical sizes).
const serif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  variable: "--font-source-serif",
  display: "swap",
  axes: ["opsz"],
  style: ["normal", "italic"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1322" },
  ],
  colorScheme: "light dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  // No root canonical on purpose: each page declares its own (see lib/seo.ts).
  title: {
    default: `${SITE.name}: ${SITE.claim}`,
    template: `%s – ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: { types: FEED_ALTERNATE },
  openGraph: {
    siteName: SITE.name,
    locale: SITE.locale,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  formatDetection: { telephone: false, address: false, email: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [messages, session] = await Promise.all([getMessages(), getSession()]);

  return (
    <html lang="de" suppressHydrationWarning className={`${grotesk.variable} ${serif.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            {/* Skip link: first focusable element (WCAG 2.4.1). */}
            <a
              href="#main"
              className="sr-only fixed top-3 left-3 z-50 rounded-full bg-ink px-4 py-2 font-semibold text-bg text-sm focus:not-sr-only"
            >
              Zum Inhalt springen
            </a>
            <Header isAuthenticated={session !== null} />
            <main id="main" className="flex-1">
              {children}
            </main>
            <Footer />
            <Toaster />
            {/* useSearchParams needs a Suspense boundary. */}
            <Suspense fallback={null}>
              <LoginToast />
            </Suspense>
          </NextIntlClientProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
