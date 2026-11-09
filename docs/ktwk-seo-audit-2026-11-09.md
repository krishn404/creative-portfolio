# KTWK SEO audit and implementation — 2026-11-09

Production checked: `https://art.krixnx.xyz`  
Repository: `krishn404/creative-portfolio`  
Scope: KTWK blog, article records, public KTWK pages, and blog admin workflow.

## Baseline

The production inventory contained eight published articles. Every preferred article URL returned HTTP 200, exposed its article text in rendered HTML, used a self-referencing canonical, allowed indexing, appeared in the generated sitemap, had one visible H1, and included parseable `BlogPosting` plus breadcrumb structured data. The blog hub linked to every article, including the oldest post. A nonexistent article returned 404.

This establishes technical indexing eligibility, not Google indexing or ranking. Search Console API/property access was not available in the workspace, so Google-selected canonicals, live indexed status, queries, impressions, CTR, and position were not claimed as checked.

### Prioritized findings

- P0 — none found. There was no production crawl block, blanket `noindex`, broken canonical, missing published sitemap URL, login gate, or client-only article body.
- P1 — article type was not stored. Public UI assumed every post was an interview, so the Kayze album review displayed “IN THIS INTERVIEW.” Future defaults could therefore mislabel reviews.
- P1 — artist/subject identity was a single ambiguous `guestName` string with no verified aliases or identity links. Arsu’s primary name and alias were combined into one schema name.
- P1 — nine inline images across BLUK, Hadi, Vidhu Kota, and Rohh had empty alt text. The actual images were inspected before writing descriptions.
- P1 — saving an article revalidated only its new topics, leaving old tag/archive paths potentially stale after tag or keyword edits.
- P1 — unpublishing cleared the original publication timestamp, so republishing could create a false new publication date.
- P2 — article pages inherited a global meta-keywords field. It was not useful for Google and encouraged keyword-list thinking in the editor.
- P2 — metadata defaults did not use article type plus verified subject. The editor treated 60/160-character conventions as hard targets and used subjective warnings as a second-click publishing gate.
- P2 — the live validator did not prove reverse hub-to-sitemap coverage, correct 404 behavior, article-type/schema consistency, or absence of meta-keywords.
- P3 — actual Google indexing and search performance remain a Search Console verification task after deployment and recrawl.

## Published article inventory and reviewed record changes

| Preferred URL | Type | Baseline search title | Baseline description assessment | Reviewed change |
| --- | --- | --- | --- | --- |
| `/blog/arsu-bhai` | Interview | Kezual talk w kant // Arsu bhai \| KTWK | Specific and content-supported | Preserve title/description; store `Arsu Bhai` as subject and verified existing `Arsalaan` as alias |
| `/blog/bharg` | Interview | Bharg Kale Kezual Talks w Kant \| KTWK | Specific and content-supported | Preserve strong metadata; store article type and subject |
| `/blog/bluk` | Interview | BLUK on EDM, Bollywood and Going Full-Time in Music \| KTWK | Specific and content-supported | Preserve metadata; store type/subject; add 2 visually verified inline image descriptions |
| `/blog/krameri` | Interview | Krameri on Music, Identity and Creative Freedom \| KTWK | Specific and content-supported | Preserve metadata; store article type and subject |
| `/blog/hadi` | Interview | Hadi on RAWBONED, Sampling and Starting Over \| KTWK | Specific and content-supported | Preserve metadata; store type/subject; add 3 visually verified inline image descriptions |
| `/blog/vidhu-kota` | Interview | Vidhu Kota on Montage and Handmade Music Videos \| KTWK | Specific but did not explicitly identify the format or publication | Prepare `Vidhu Kota Interview: Montage and Handmade Music Videos \| KTWK`; prepare a factual KTWK description; add 2 visually verified inline image descriptions |
| `/blog/rohh` | Interview | Rohh on Khwabida, Sunset Bar and Writing Songs \| KTWK | Specific and content-supported | Preserve metadata; store type/subject; add 2 visually verified inline image descriptions |
| `/blog/renaissance-album-review-by-Kayze` | Review | Kayze’s Renaissance: A Track-by-Track Album Review \| KTWK | Strong and accurately identifies a review | Preserve metadata and URL; store `review` plus subject `Kayze`; replace interview-only public labels automatically |

No slug, publication status, original publication date, interview answer, quotation, or article meaning is changed by the prepared migration.

## Implemented architecture

- Added an explicit `interview | review | article` field plus verified subject aliases and optional verified identity URLs.
- Kept the existing subject field instead of creating a parallel artist record system.
- Added deterministic title, description, summary, and schema defaults based on stored facts. Empty fields use defaults; manual overrides remain untouched on ordinary saves and can be reset explicitly.
- Added type-aware visible summary headings, breadcrumb language, related-reading language, `BlogPosting.genre`, article section, verified subject nodes, aliases, and optional `sameAs` links.
- Removed meta-keywords from KTWK pages while retaining meaningful topics for internal discovery and supported article schema.
- Preserved the existing self-canonical URLs, server rendering/static generation, sitemap generator, thin-archive `noindex` policy, and redirect behavior.
- Preserved original `publishedAt` through unpublish/republish and updates `updatedAt` only when stored article fields actually change.
- Revalidates the article, previous slug, old and new topic pages, blog hub, home discovery, About KTWK, RSS, and sitemap after writes.
- Added an authenticated, idempotent backfill with before/after snapshots and a safe revert. Retry is a no-op when applied; drift is reported as a conflict rather than overwritten.
- Added a production inventory command and strengthened the HTML validator for crawlable hub links, sitemap parity, 404s, unique metadata, canonicals, indexing directives, schema/content agreement, article-type labels, and meta-keywords removal.

The implementation follows current Google guidance that titles and snippets are generated algorithmically, descriptions should be unique and useful rather than keyword lists, Article markup should reflect visible facts, and sitemap submission is a discovery hint rather than an indexing guarantee:

- https://developers.google.com/search/docs/appearance/title-link
- https://developers.google.com/search/docs/appearance/snippet
- https://developers.google.com/search/docs/appearance/structured-data/article
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap

## Safe current-record migration

Migration key: `ktwk-seo-v2-2026-11-09`.

The blog admin now exposes “Apply reviewed backfill” and “Revert safe changes.” Both require the existing authenticated admin session. The mutation also validates the existing server secret. Each article stores its exact before/after migration state. Revert restores only records that still equal the saved after-state; later editorial changes become conflicts and are never overwritten.

This is deliberately separate from seed files. The secret-authenticated service mutation was applied to the production Convex deployment on 2026-11-09 after the code deployment. All eight expected slugs were updated; there were no missing records or conflicts. The saved snapshots remain available to the authenticated “Revert safe changes” action.

## Deployment status

- Git commit `97f766f` was pushed to `origin/main`.
- The production Convex schema/functions were deployed with no deleted indexes.
- The reviewed backfill updated all eight production article records with no conflicts.
- The linked Vercel production deployment completed successfully. A follow-up deployment was triggered after the data migration so statically generated article HTML would include the updated records immediately rather than waiting for ISR.

## Future publishing workflow

1. Choose the accurate article type.
2. Enter the verified artist/guest/subject display name; add aliases or official identity URLs only when confirmed.
3. Keep the expressive visible headline. Leave the SEO title blank for the deterministic type/subject/headline default, or write a factual override.
4. Add a unique excerpt and optional description grounded in the article. Resetting an override returns to the deterministic default.
5. Add meaningful tags/topics, cover-image description, visible summary, and inline image descriptions. Advisory warnings do not block publication; invalid identity URLs do.
6. Publish normally. The canonical URL remains the slug, the article enters the hub/RSS/sitemap, schema and social metadata are generated, and affected caches are revalidated.

## Post-deployment Search Console and monitoring

1. Confirm the existing `https://art.krixnx.xyz` property; do not replace verification.
2. Inspect `/blog`, `/about-ktwk`, `/blog/vidhu-kota`, the Kayze review, and a sample of older interviews. Compare user-declared and Google-selected canonical.
3. Open the Sitemaps report and confirm `https://art.krixnx.xyz/sitemap.xml` succeeds with all eight current article URLs.
4. Request indexing only for a small representative set of materially updated URLs. Do not use Google’s Indexing API for these articles.
5. Export Search results data before or immediately after deployment, filtering pages containing `/blog/` and queries for `KTWK`, `KWTK`, `Kezual Talks`, and each verified artist name.

Track at 30, 60, and 90 days: valid indexed article count; excluded article reasons; brand and artist-query impressions; clicks; CTR; average position; and mobile/desktop Core Web Vitals. Compare equivalent date ranges and annotate the deployment date. Changes establish eligibility and clearer relevance; Google controls recrawl, indexing, selected snippets, and rankings.
