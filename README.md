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
