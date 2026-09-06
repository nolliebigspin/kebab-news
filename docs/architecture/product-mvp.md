# kebab.news product MVP

## Decision

kebab.news does not promise neutrality. Its reader-facing units are a **Thema** (the clustered original contributions and source comparison) and a versioned **Artikel** (the published summary built from that topic). Topics form automatically; current source-diverse topics become articles automatically, with broader independent coverage processed first. Readers can signal interest in topics and rate the quality of published articles.

## Deep modules and seams

1. `@kebab/core/story-summary` is the content-validation seam. It validates short and long summaries, sourced facts, uncertainties, source differences and framing annotations. The worker must cross this seam before persistence.
2. `apps/web/lib/stories.ts` is the public read-model seam. It composes summary, cluster, source and version data and provides explicit fallbacks for legacy rows.
3. `apps/web/lib/summary-ratings.ts` owns the one-rating-per-user invariant. The database unique index is the final concurrency guard.
4. `apps/web/lib/comments.ts` owns validation and ownership checks. Routes do not write comment tables directly.
5. `apps/worker/src/ai-budget.ts` owns atomic UTC-day spend reservations. Model adapters report normalized usage; callers never implement provider pricing or concurrency rules.

## Versioning

`published_articles` remains the append-only summary-version table. `version`, `status`, `change_summary` and `correction_note` make updates auditable. Generated updates compare themselves with the current public version and record the newly added information in `change_summary`. `stories.published_article_id` is the only public version; older rows remain available to the editorial workflow. The public URL uses the stable `stories.slug`, independent of version-internal slugs. `summary_sources` freezes the exact article receipts for each new version so later cluster changes cannot rewrite its evidence. Rows created before receipts existed use one best-effort article per persisted outlet, never an article newer than the summary, and the UI labels that reconstruction as approximate.

Publishing requires an explicit operator choice: either `--reviewed-by <name>` (which records `reviewed_at` and `reviewed_by`) or `--unreviewed` (which keeps the visible unreviewed state). Running the publish command alone never implies editorial review.

## Annotation anchoring

Annotations use a paragraph id plus exact quote and optional prefix/suffix context. The dependency-free `@kebab/core/text-anchor` resolver is shared by generation validation and the browser. It rejects empty quotes and ambiguous occurrences, including overlapping matches. Summary validation also rejects overlapping annotation ranges before persistence.

Source headline/teaser annotations retain quote-backed numeric offsets. Repeated wording can be disambiguated with exact context; at most two spans survive. Explanations describe a concrete linguistic mechanism and possible effect, with speaker attribution and negation respected. Ordinary factual records, numbers, indirect speech and uncertainty markers are not automatic triggers. Missing context in a snippet does not establish omission by a publisher.

The public read model checks every stored evidence quote against that summary version's available sources. Legacy annotations that only name source ids are hidden: an arbitrary teaser is never reconstructed as evidence. Invalid annotations do not hide other valid annotations or the article itself.

## AI request efficiency

- Source annotations are independent text analyses. Already-current rows are excluded before budget reservation; `force` still refreshes all rows. Exact duplicate text in the same request is sent and generated once, then restored to every caller id. No approximate matching, truncation or cross-version cache is used.
- Both model adapters use short request-local ids. All source references in facts, uncertainties, differences and annotation evidence are validated before conversion back to persistent ids.
- The rewrite model produces `body` paragraphs once. `neutral_body` is their exact concatenation with blank lines; it remains present in the storage/API contract. `origin: automatic` and `review_status: needs_review` are set locally, so a model cannot claim editorial verification.
- Budget estimates use the same compact input and output schema as the actual request. Annotation output headroom allows two complete explanations rather than encouraging truncation. A token ceiling is a reservation, not a target: savings come from omitted duplicate work and content, not shorter explanations or a smaller model.
- The prompt versions were bumped; existing source annotations are refreshed through the usual versioned worker path. No migration or paid backfill is needed to deploy the code.

Provider schemas use the [documented Gemini JSON Schema subset](https://ai.google.dev/gemini-api/docs/generate-content/structured-output?hl=en#json-schema-support). String lengths, exact quotations and semantic relationships are enforced locally rather than relying on unsupported provider constraints.

Validation: `mise exec -- bun check:all`, `mise exec -- bun run test` with a dedicated local PostgreSQL/pgvector database, and `mise exec -- bun run build`. Provider responses are mocked in tests. These checks establish exact id/evidence preservation and skipped duplicate work, not a measured semantic quality score or a universal token-saving percentage.

## Trust and safety

- RSS text is untrusted model input. The worker prompt explicitly ignores instructions in source content.
- AI output is JSON-schema constrained and Zod validated. Unsupported or unsourced shapes are rejected.
- The annotation model receives only stale headline/teaser texts for one topic; identical texts are analyzed once per request. The rewrite model generates the article. Model and prompt versions live in `packages/core/src/constants.ts`.
- Generative calls reserve their maximum cost in `ai_usage` before execution and stop when the configured $0.18 UTC-day budget is exhausted; Voyage's sub-cent embedding spend remains outside that ledger.
- User content is plaintext, length-validated server-side and rendered through React escaping. No user HTML is accepted.
- Rating and comment mutations require a server-side session and are rate limited.
- Share analytics store only summary id, channel and timestamp; no account, IP or user agent.
- Public reads require `published_at` and the story's current-version pointer; drafts and superseded versions are not reachable through the public loader.

## Editorial states

`draft → processing → needs_review → published → updated/corrected → archived`

The role model is `user`, `moderator`, `editor`, `admin`. The initial `/redaktion` dashboard is read-only and server-authorized. Future write adapters must reuse the same role check and append a new summary version instead of mutating published history in place.

## Legal posture

Only RSS headlines and teasers are imported in the current pipeline. Quotes shown publicly must remain short, attributed and linked to the original. Before public launch, legal review, processor agreements, SMTP provider wording and a named moderation contact remain required.
