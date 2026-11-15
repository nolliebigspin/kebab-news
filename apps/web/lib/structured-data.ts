import { absoluteUrl, SITE } from "@/lib/site";

/**
 * schema.org builders. Kept as plain objects so pages compose them and the
 * <JsonLd> component serialises them.
 */

const ORG_ID = `${SITE.url}/#organization`;
const SITE_ID = `${SITE.url}/#website`;

export const organizationRef = { "@id": ORG_ID } as const;

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    "@id": ORG_ID,
    name: SITE.name,
    url: SITE.url,
    slogan: SITE.tagline,
    description: SITE.description,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/icon.svg"),
      width: 512,
      height: 512,
    },
    sameAs: [SITE.github],
    publishingPrinciples: absoluteUrl("/methodik"),
    correctionsPolicy: absoluteUrl("/methodik"),
    ethicsPolicy: absoluteUrl("/ueber-uns"),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID,
    name: SITE.name,
    url: SITE.url,
    inLanguage: SITE.language,
    publisher: organizationRef,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE.url}/artikel?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export type Crumb = { name: string; path: string };

export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function itemListSchema(
  items: Array<{ name: string; path: string }>,
  options: { name?: string; description?: string; ranked?: boolean } = {}
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    ...(options.name ? { name: options.name } : {}),
    ...(options.description ? { description: options.description } : {}),
    ...(options.ranked ? { itemListOrder: "https://schema.org/ItemListOrderDescending" } : {}),
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(item.path),
      name: item.name,
    })),
  };
}

/**
 * The homepage as a news front page: its main entity is the ranked top-story
 * list, `dateModified` is the freshest article, and `speakable` points voice
 * assistants at the top headlines.
 */
export function homePageSchema(input: {
  description: string;
  dateModified: Date | null;
  topStories: ReturnType<typeof itemListSchema>;
  speakableSelectors: string[];
}) {
  const { "@context": _context, ...mainEntity } = input.topStories;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE.url}/#webpage`,
    url: SITE.url,
    name: `${SITE.name}: ${SITE.claim}`,
    description: input.description,
    inLanguage: SITE.language,
    isPartOf: { "@id": SITE_ID },
    publisher: organizationRef,
    ...(input.dateModified ? { dateModified: input.dateModified.toISOString() } : {}),
    mainEntity,
    speakable: { "@type": "SpeakableSpecification", cssSelector: input.speakableSelectors },
  };
}

export function newsArticleSchema(input: {
  path: string;
  headline: string;
  description: string;
  body: string;
  datePublished?: Date | null;
  dateModified: Date;
  sourceUrls: string[];
  sourceCount: number;
}) {
  const url = absoluteUrl(input.path);
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${url}#article`,
    mainEntityOfPage: url,
    url,
    headline: input.headline.slice(0, 110),
    description: input.description,
    articleBody: input.body,
    inLanguage: SITE.language,
    image: [`${url}/opengraph-image`],
    datePublished: (input.datePublished ?? input.dateModified).toISOString(),
    dateModified: input.dateModified.toISOString(),
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: organizationRef,
    isAccessibleForFree: true,
    isBasedOn: input.sourceUrls,
    citation: input.sourceUrls,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["#article-headline", "#kurzfassung"],
    },
    about: { "@type": "Thing", name: input.headline },
    backstory: `Zusammenfassung aus ${input.sourceCount} Originalbeiträgen deutschsprachiger Medien.`,
  };
}

export function definedTermSetSchema(name: string, path: string, terms: Array<[string, string]>) {
  const url = absoluteUrl(path);
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": `${url}#glossar`,
    name,
    url,
    inLanguage: SITE.language,
    hasDefinedTerm: terms.map(([term, description]) => ({
      "@type": "DefinedTerm",
      name: term,
      description,
      inDefinedTermSet: `${url}#glossar`,
    })),
  };
}

export function faqSchema(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function howToSchema(input: {
  name: string;
  description: string;
  path: string;
  steps: Array<{ name: string; text: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    inLanguage: SITE.language,
    step: input.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}
