/**
 * Renders schema.org data as JSON-LD. `<` is escaped so content from feeds
 * (headlines, summaries) can never close the script element.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script type="application/ld+json">{JSON.stringify(data).replace(/</g, "\\u003c")}</script>
  );
}
