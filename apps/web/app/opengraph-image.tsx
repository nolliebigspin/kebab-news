import { SPECTRUM } from "@/lib/lean";
import { OG_SIZE, renderOgImage } from "@/lib/og";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name}: ${SITE.claim}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OpenGraphImage() {
  return renderOgImage({
    kicker: "Viele Quellen, von links bis rechts",
    title: "Eine verständliche Zusammenfassung. Alle Unterschiede transparent.",
    covered: [...SPECTRUM],
  });
}
