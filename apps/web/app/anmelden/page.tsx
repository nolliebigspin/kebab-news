import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/PageHero";
import { LoginForm } from "./LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: `${t("page_title")} — kebab.news`, description: t("page_subtitle") };
}

export default async function AnmeldenPage() {
  const t = await getTranslations("auth");
  return (
    <section className="mx-auto max-w-md px-6 py-12">
      <PageHero title={t("page_title")} subtitle={t("page_subtitle")} />
      <LoginForm />
    </section>
  );
}
