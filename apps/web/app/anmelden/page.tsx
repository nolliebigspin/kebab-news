import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { pageMetadata } from "@/lib/seo";
import { LoginForm } from "./LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return pageMetadata({
    title: t("page_title"),
    description: t("page_subtitle"),
    path: "/anmelden",
    noindex: true,
  });
}

export default async function AnmeldenPage() {
  const t = await getTranslations("auth");
  return (
    <Container width="prose" className="py-12 sm:py-16">
      <PageHeader title={t("page_title")} lede={t("page_subtitle")} className="mb-10" />
      <div className="max-w-md">
        <LoginForm />
      </div>
    </Container>
  );
}
