import { permanentRedirect } from "next/navigation";

export default async function LegacyRadarDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/themen/${slug}`);
}
