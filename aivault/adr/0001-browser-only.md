# 0001. Browser-only app: no accounts, no app server

- Status: Accepted (recorded retroactively)
- Date: 2026-10-30

## Context
The tool holds players' gear and, optionally, an Anthropic API key. Running accounts and a database means hosting costs, privacy obligations and a security surface, for a free fan tool.

## Decision
Everything lives in the player's browser: state in `localStorage` (`d4c.v1`) and screenshots in IndexedDB (`d4c-shots`). The site ships with no characters. Export/Import backup is the way to move between devices.

## Consequences
- No server costs and no personal data stored by us. The API key goes only to `api.anthropic.com`.
- No sync between devices. Clearing site data loses everything without a backup.
- Any feature that needs shared state goes through the Worker (see 0005) and must stay anonymous.

## Alternatives considered
- Accounts with a hosted database: cost, privacy and upkeep, for little gain.
