import { BASE_URL } from "@kebab/core";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LoginToast } from "@/components/LoginToast";
import { Toaster } from "@/components/ui/sonner";
import { getSession } from "@/lib/session";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export function generateMetadata(): Metadata {
  const title = "kebab.news — We wrapped the news.";
  const description =
    "Viele Quellen, eine verständliche Zusammenfassung. Unterschiede, Unsicherheiten und Framing transparent.";
  return {
    title,
    description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: BASE_URL,
    },
    openGraph: {
      title,
      description,
      url: BASE_URL,
      siteName: "kebab.news",
      locale: "de_DE",
      type: "website",
      images: [
        {
          url: "/kebab-news-logo.png",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/kebab-news-logo.png"],
    },
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
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [messages, session] = await Promise.all([getMessages(), getSession()]);

  return (
    <html lang="de" className={`${inter.variable} ${ibmPlexMono.variable}`}>
      <body
        className="flex min-h-screen flex-col antialiased"
        style={{ background: "var(--bg)", color: "var(--ink)" }}
      >
        <NextIntlClientProvider messages={messages}>
          {/* Skip link: first focusable element, lets keyboard/AT users jump
              past the header straight to content (WCAG 2.4.1). */}
          <a
            href="#main"
            className="sr-only fixed top-2 left-2 z-50 -translate-y-full rounded-md bg-brand px-4 py-2 font-medium text-sm text-white transition-transform focus:not-sr-only focus:translate-y-0"
          >
            Zum Inhalt springen
          </a>
          <Header isAuthenticated={session !== null} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <Toaster />
          {/* useSearchParams needs a Suspense boundary to keep the build static. */}
          <Suspense fallback={null}>
            <LoginToast />
          </Suspense>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
