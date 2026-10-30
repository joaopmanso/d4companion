# 0003. Two screenshot readers: free OCR by default, Claude with the player's key

- Status: Accepted (recorded retroactively)
- Date: 2026-10-30

## Context
Item check needs a tooltip screenshot turned into structured data. A vision model reads everything, including icons, but costs money per check. The site has no server to hold a key.

## Decision
`src/recognize/index.js` picks the reader. If the player saved an Anthropic API key and the engine isn't forced to OCR, it calls Claude directly from the browser (`dangerouslyAllowBrowser`), with JSON-schema output and low effort. Otherwise, or when Claude errors, it uses Tesseract.js in the browser. Both load on first use. The player reviews and edits the result before equipping.

## Consequences
- The free path has to be good enough on its own (see 0004). It can't see GA or temper icons yet.
- The prompt and schema are product code. The prompt lives in `aivault/prompts/` (see 0007).

## Alternatives considered
- Server-side model calls with our own key: needs a server and a budget (see 0001).
- OCR only: noticeably worse on icons and odd layouts.
