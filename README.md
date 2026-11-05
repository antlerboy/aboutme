# antlerboy.com

Static personal homepage for Benjamin P Taylor / @antlerboy.

This replaces the old About.me-hosted page while preserving its useful information and links. The public site is deliberately simple: one HTML page, no framework, no analytics, no cookies, and no dependency on About.me.

## Public content

The page covers:

- systems | cybernetics | complexity in public | service | transformation;
- RedQuadrant;
- the Public Service Transformation Academy;
- SCiO;
- the Systems Community of Inquiry;
- The Necessary Tangle;
- chosen path, Medium and the LinkedIn newsletter;
- current useful links, groups and reading lists;
- contact details and social accounts;
- the Operational Excellence Society advisory-board link;
- the @antlerboy origin link.

## Design

The page uses the current RedQuadrant visual system: RedQuadrant red `#99141B`, dark chocolate `#3E0908`, gold `#ED7703`, neutral greys, black and white. It uses no blue as a RedQuadrant identity colour.

## Publishing

The practice guides at `/four-dynamics/` and `/arms-lengthiness/` include browser-only working tools. Their form entries aren't submitted or automatically saved. The four-dynamics guide draws primarily on the full 2023 StretchCon presentation. The delivery-model tool retains the original 21 criteria, 11 profiles, equal weights, absolute-distance fit calculation, and gap threshold; its method page explains the public edition.

`python scripts/add-practice-microsites.py` maintains the homepage and library entries, search records, and sitemap. `python scripts/check-practice-tools.py` checks their files and internal links. The publishing workflow also checks interactions, downloads, imports, and desktop and mobile layouts before deployment, then repeats those checks against the deployed commit. Tool pages are excluded from the page-visit beacon.

GitHub Actions publishes the repository through GitHub Pages. Before the custom domain is moved, the GitHub Pages version can be tested independently.

Do not cancel the existing About.me service or change DNS until the GitHub Pages preview has been checked.

See `MIGRATE_ANTLERBOY_COM.md` for the final domain switch.


## Keeping the three editorial selections current

`content/latest.json` contains exactly three primary selections, in editorial order. Choose current, distinct topics for relevance; do not automatically take the three newest feed entries. `content/latest-fallbacks.json` holds at least three approved evergreen alternatives. The build rejects repeated topics or links within either list, unsafe URLs, incomplete items, and missing expiry decisions.

Each item has `topic`, `source`, `title`, `summary`, `href`, `link_label`, and `reviewed_on` (`YYYY-MM-DD`). A dated promotion must have an exclusive `expires_at` timestamp with an explicit timezone, for example `2026-11-09T15:00:00+00:00`. Use the event end or the point at which the promotional wording ceases to be valid. A resource that remains useful after a particular date instead has `evergreen: true`. An optional `valid_from` timestamp prevents a primary item appearing early. Fall-back items must be evergreen and immediately available.

Both the build and the browser select three valid items, using primary order first and then approved alternatives while excluding duplicate topics and links. The browser rechecks on loading, returning to the tab, and the next expiry boundary, so a dated promotion rolls off without waiting for another commit or deployment. Static HTML also contains three selections made at build time.

The public `/assets/data/latest.json` manifest records `selection_as_of`, `source_commit`, `selected`, `candidates`, `expired_topics`, `fallback_topics`, `review_due_topics`, and `next_transition_at`. `review_needed` becomes true when the build uses a replacement, an item has expired, or the primary selection has gone fourteen days without editorial review. A successful rebuild is not evidence of a new editorial review: only update `reviewed_on` when checking the actual content and links.

The existing 06:00 UK editorial automation should inspect the manifest and source files, check approved news, events, resources, and social material, and update the primary choices when warranted. It must compare expiry timestamps with the current time even if an old manifest says `review_needed: false`, because the public manifest records build-time state. Keep one panel of three distinct topics. Preserve useful evergreen items when they remain the better choice. The existing Friday check covers stale dates, promotions, and broken links; no second publishing schedule is needed.

Run `python3 -m unittest discover -s tests -p test_curated_latest.py` before publishing. The tests cover date boundaries, explicit timezones, future items, duplicate topics and links, missing expiry decisions, evergreen replacement capacity, escaped markup, and matching browser/build selections.
