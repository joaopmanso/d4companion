# Architecture decision records

One file per decision: `NNNN-short-slug.md`, numbered in order and never renumbered. To change a decision, add a new ADR that supersedes the old one and set the old one's status to `Superseded by NNNN`. Start from [0000-template.md](0000-template.md). `tests/vault.test.js` checks that every ADR file is listed here.

ADRs 0001–0003 and 0005–0006 were recorded after the fact, from the code and README as of 2026-10-30.

| # | Decision | Status |
|---|---|---|
| [0001](0001-browser-only.md) | Browser-only app: no accounts, no app server | Accepted |
| [0002](0002-guide-sync-d4builds.md) | Sync guide data daily from d4builds only; link other sites | Accepted |
| [0003](0003-two-screenshot-readers.md) | Two screenshot readers: free OCR by default, Claude with the player's key | Accepted |
| [0004](0004-ocr-vocabulary-snapping.md) | Free OCR snaps lines onto the tooltip's closed vocabulary | Accepted |
| [0005](0005-share-links-worker.md) | Share links via a Cloudflare Worker, with a packed-URL fallback | Accepted |
| [0006](0006-static-github-pages.md) | Static Vite build on GitHub Pages, no framework | Accepted |
| [0007](0007-aivault-source-of-truth.md) | `aivault/` is the source of truth for AI sessions and prompts | Accepted |
| [0008](0008-identify-items-from-catalog.md) | Identify items by name from one all-class catalog (`items.json`) | Accepted |
