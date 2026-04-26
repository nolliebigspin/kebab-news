import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { routing } from "@/i18n/routing";
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

export const metadata: Metadata = {
  title: "kebab.news — Jede Behauptung belegbar",
  description:
    "Community-getriebene Plattform für nachvollziehbare Recherche. Jede Aussage belegbar. Jede Quelle verlinkt.",
  openGraph: {
    title: "kebab.news",
    description:
      "Wir zeigen dir nicht, was du denken sollst. Wir zeigen dir, woher die Informationen kommen.",
    type: "website",
  },
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "de" | "en")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${ibmPlexMono.variable}`}>
      <body
        className="flex min-h-screen flex-col antialiased"
        style={{ background: "var(--bg)", color: "var(--ink)" }}
      >
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
