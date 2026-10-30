# 0002. Sync guide data daily from d4builds only; link other sites

- Status: Accepted (recorded retroactively)
- Date: 2026-10-30

## Context
Builds change every patch, and hand-written builds go stale. Guide sites differ in what they allow: d4builds' `robots.txt` permits `/builds/`, Maxroll's terms forbid scraping, and Mobalytics and Icy Veins block automated requests.

## Decision
`scripts/fetch-guides.mjs` (Playwright) reads the d4builds tier list and every class's endgame guides and variants daily in CI, and writes `public/data/`. The class tree, Paragon tiles and tooltips refresh weekly. Other sites appear only as outbound links. Images are hotlinked, never copied.

## Consequences
- Guides stay current without manual work. A commit happens only when the content changed.
- The app depends on d4builds' page structure, so scraper breakage shows up as failed sync runs.
- Guide text has the source's typos, which the vocabulary code handles (see 0004).

## Alternatives considered
- Scraping Maxroll and others: against their terms or blocked.
- Hand-maintained builds: they go stale within a patch.
