# 0007. `aivault/` is the source of truth for AI sessions and prompts

- Status: Accepted
- Date: 2026-10-30

## Context
The site is built mostly by Claude Code sessions. Each one re-reads large parts of the codebase to orient itself, which costs credits and time, and sessions don't share what they learned. Prompts were inline in code, where they are hard to review.

## Decision
- `aivault/` holds the overview, architecture, data model, features, operations, roadmap, ADRs, prompts and changelog. Root `CLAUDE.md` tells every session to start there and to update it in the same commit as the code.
- Prompts the app sends live in `aivault/prompts/` and are imported by the code. For example, `src/recognize/claude.js` imports `tooltip-reader.system.md?raw`. The vault file is what ships.
- `tests/vault.test.js` checks coverage: every file under `src/` and `scripts/` is named in `architecture.md`, every npm script in `operations.md`, every ADR in `adr/README.md`, and every prompt file in `prompts/README.md`. Deploys run the tests.

## Consequences
- Sessions can work from a few pages instead of the whole tree.
- Every change carries a small doc cost. A stale vault blocks deploys for coverage gaps, but not for wrong content, so authors still check accuracy.

## Alternatives considered
- README only: too thin for planning, and written for players.
- An external wiki: drifts from the code, and sessions can't read it reliably.
