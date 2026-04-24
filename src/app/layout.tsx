import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
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
  title: "unsere.news — Jede Zahl belegbar",
  description:
    "Community-driven investigative news built on primary sources. Every claim traceable. Every source linked.",
  openGraph: {
    title: "unsere.news",
    description: "We don't tell you what to think. We show you where the information comes from.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${inter.variable} ${ibmPlexMono.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
