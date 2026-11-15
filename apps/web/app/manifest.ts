import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name}: ${SITE.claim}`,
    short_name: SITE.name,
    description: SITE.description,
    lang: SITE.language,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f1b2d",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
