import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { routing } from "@/i18n/routing";
import { BASE_URL } from "@/lib/constants";
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

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "hero" });
  const tb = await getTranslations({ locale, namespace: "banner" });
  const url = locale === "de" ? BASE_URL : `${BASE_URL}/${locale}`;
  const ogLocale = locale === "de" ? "de_DE" : "en_US";
  const ogAltLocale = locale === "de" ? "en_US" : "de_DE";

  const title = `kebab.news — ${t("tagline")}`;
  const description = `${t("tagline_accent")} ${tb("bold")} ${tb("text")}`;
  const ogDescription = `${t("tagline")} ${t("tagline_accent")} ${tb("bold")}`;

  return {
    title,
    description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: url,
      languages: {
        de: BASE_URL,
        en: `${BASE_URL}/en`,
        "x-default": BASE_URL,
      },
    },
    openGraph: {
      title,
      description: ogDescription,
      url,
      siteName: "kebab.news",
      locale: ogLocale,
      alternateLocale: ogAltLocale,
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: ogDescription,
      images: ["/og-image.png"],
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
        <Analytics />
      </body>
    </html>
  );
}
