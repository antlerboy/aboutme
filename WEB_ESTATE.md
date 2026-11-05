# Public work and practical routes

Antlerboy connects Benjamin's public writing, practical guides, tools, and facilitated support. Catalogue badges identify entries from the writing archive, the curated library, and the community link record.

The roles are explicit at `/library/use/#where-things-live`: Chosen Path holds the writing archive, SysCoI the broad community link record, The Necessary Tangle the source-backed field atlas, RedQuadrant consulting and implementation, and PSTA capability development. Greebling remains the full directory.

## Maintained sources

- `content/practical-routes.json` holds six situations, prompts, outputs, source links, support routes, and working-note templates.
- `python scripts/apply-web-estate.py` generates `/library/use/`, maintains its homepage and library entries, search controls, catalogue records, and sitemap. It is idempotent and runs after the original library generator.
- `library/catalogue-search.js` searches the existing catalogues. Query, source, year, theme, ordering, and all/any matching are stored in the URL. Result badges distinguish library entries, writing-archive entries, and community link records. A library entry is not a claim of authorship or independent evaluation.
- Working notes stay in the open tab until the user downloads a text copy. The page doesn't submit them or save them in browser storage.

## Shared programme facts

RedQuadrant owns the programme record at `https://redquadrant.com/records/leading-transformation.json`. `content/leading-transformation.json` is its reviewed local snapshot. It supplies the 24-module curriculum, fees, support routes, and delivery/materials status for `/toolshed/`.

The publishing workflow checks the snapshot against the owner record. A difference stops the build and requires review before the next publication. To reconcile an authorised change:

```text
python scripts/sync-programme-record.py --refresh
python scripts/build-toolshed.py
```

Review the changed facts before committing. For coordinated first publication, `--source <path>` accepts the owner record from the RedQuadrant checkout; the normal drift check still uses the public owner URL.

The public page exposes the record URL and version in metadata, gives its last synchronisation date, and asks participants to agree current materials, access, and delivery before booking.

## Validation

The existing publishing workflow now runs `scripts/test-estate-routes.js` after the built catalogues are available and repeats it after publication. It checks desktop and mobile layouts, local note downloads and non-retention, shared queries and filters, all/any matching, provenance badges, invalid-filter recovery, reset focus, the current 24-module sequence, and no-JavaScript routes.

The catalogue refresh uses bounded retries for transient network/server failures and limits simultaneous API requests. It fails on a persistent error instead of publishing a partial new catalogue.
