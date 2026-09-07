# Greebling practice update, 7 September 2026

Status: prepared and checked, NOT published on greebling.com.

The live Greebling page was inspected on 7 September 2026. It contained 128 directory destinations and 29 campaign shortcuts. This patch preserves those entries and adds 33 practice routes and the Antlerboy library collection, giving 162 directory destinations. All 26 practice cases are included. The new Antlerboy collection has been published and its live browser tests passed in workflow run 34106645662.

## Publish in the original Sites project

Apply this to the current source of the existing Greebling Sites project, preserving its project identity and domains. Do not restore the older 5 September backup over the current site.

Run `python3 apply-practice-update.py /path/to/current/dist/index.html` with practice-manifest.json alongside the script. The update is idempotent and checks that previous links survive. Include the same records in any directory source that regenerates that HTML. Build using the project's existing command, inspect desktop and mobile layouts, publish using the existing Sites service, and verify https://greebling.com/#systems-practice.

## Acceptance

The directory navigation links to the new systems-methods practice section. It contains the complete pack, all 26 case pages, coverage, resource register, task sheets, answers, tutor guidance and offline download. The library section links to https://antlerboy.com/library/systems-methods-practice/. All existing destination links remain. Counts reflect actual entries. Alpha status, craft/real-world limits and the absence of independent specialist pedagogical review are explicit.

This session has no publishing tool for the existing Sites project. No DNS, domain ownership or hosting migration was attempted. GitHub storage of this package is not a live Greebling publication. This is the remaining publication dependency, not a request for another editorial approval.
