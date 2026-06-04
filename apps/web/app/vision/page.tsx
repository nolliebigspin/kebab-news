import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Hero } from "@/components/Hero";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hero");
  return { title: `${t("tagline")} — kebab.news`, description: t("stance") };
}

export default function VisionPage() {
  return <Hero />;
}
