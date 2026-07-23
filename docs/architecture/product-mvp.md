# kebab.news product MVP

## Decision

kebab.news does not promise neutrality. Its reader-facing units are a **Thema** (the clustered original contributions and source comparison) and a versioned **Artikel** (the published summary built from that topic). Reader voting no longer selects topics; readers rate the quality of a published article.

## Deep modules and seams

1. `@kebab/core/story-summary` is the content-validation seam. It validates short and long summaries, sourced facts, uncertainties, source differences and framing annotations. The worker must cross this seam before persistence.
2. `apps/web/lib/stories.ts` is the public read-model seam. It composes summary, cluster, source and version data and provides explicit fallbacks for legacy rows.
3. `apps/web/lib/summary-ratings.ts` owns the one-rating-per-user invariant. The database unique index is the final concurrency guard.
4. `apps/web/lib/comments.ts` owns validation and ownership checks. Routes do not write comment tables directly.

## Versioning

`published_articles` remains the append-only summary-version table. `version`, `status`, `change_summary` and `correction_note` make updates auditable. Generated updates compare themselves with the current public version and record the newly added information in `change_summary`. `stories.published_article_id` is the only public version; older rows remain available to the editorial workflow. The public URL uses the stable `stories.slug`, independent of version-internal slugs. `summary_sources` freezes the exact article receipts for each new version so later cluster changes cannot rewrite its evidence. Rows created before receipts existed use one best-effort article per persisted outlet, never an article newer than the summary, and the UI labels that reconstruction as approximate.

Publishing requires an explicit operator choice: either `--reviewed-by <name>` (which records `reviewed_at` and `reviewed_by`) or `--unreviewed` (which keeps the visible unreviewed state). Running the publish command alone never implies editorial review.

## Annotation anchoring

Annotations use a paragraph id plus exact quote and optional prefix/suffix context. Numeric offsets are intentionally not persisted as the only anchor. Ambiguous anchors do not render rather than highlighting the wrong passage.

## Trust and safety

- RSS text is untrusted model input. The worker prompt explicitly ignores instructions in source content.
- AI output is JSON-schema constrained and Zod validated. Unsupported or unsourced shapes are rejected.
- User content is plaintext, length-validated server-side and rendered through React escaping. No user HTML is accepted.
- Rating and comment mutations require a server-side session and are rate limited.
- Share analytics store only summary id, channel and timestamp; no account, IP or user agent.
- Public reads require `published_at` and the story's current-version pointer; drafts and superseded versions are not reachable through the public loader.

## Editorial states

`draft → processing → needs_review → published → updated/corrected → archived`

The role model is `user`, `moderator`, `editor`, `admin`. The initial `/redaktion` dashboard is read-only and server-authorized. Future write adapters must reuse the same role check and append a new summary version instead of mutating published history in place.

## Legal posture

Only RSS headlines and teasers are imported in the current pipeline. Quotes shown publicly must remain short, attributed and linked to the original. Before public launch, legal review, processor agreements, SMTP provider wording and a named moderation contact remain required.
