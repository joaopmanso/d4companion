# 0005. Share links via a Cloudflare Worker, with a packed-URL fallback

- Status: Accepted (recorded retroactively)
- Date: 2026-10-30

## Context
Players want to share a character. With no server (0001), the whole character could be packed into the URL hash, but those links are long.

## Decision
`src/lib/share.js` POSTs the packed character to the Worker (`d4companion-cdn`, `/share`), which stores it for a year under a content-derived id. The link is `#/c/<id>`. If the Worker can't be reached, the link falls back to `#/s/<packed>`. Screenshots, reader metadata and the API key are stripped before packing. The same Worker caches game art (`src/data/cdn.js`).

## Consequences
- Short links depend on a small private Worker. The fallback keeps sharing working without it.
- The viewer is read-only. "Save a copy" imports into the viewer's own browser.
