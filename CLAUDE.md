# CLAUDE.md

**Start with [`aivault/README.md`](aivault/README.md).** The vault is the source of truth for this project: its architecture, data model, features, operations, roadmap, decisions (ADRs) and every prompt.

- **Work from the vault.** Read the vault pages first and open source files only when you're about to change them or the vault doesn't answer the question. Don't crawl the codebase to orient yourself. That's what the vault is for.
- **Update the vault in the same branch as the code.** The checklist is in `aivault/README.md` under "Keeping it current". If you find the vault wrong, fix it in the same PR.
- **Prompts live in `aivault/prompts/`.** The app imports them, so never inline a prompt in code.
- **`npm test` must pass.** It includes `tests/vault.test.js`, which fails when a source file, npm script, ADR or prompt is missing from the vault. Deploys run the tests.
- **Branch and PR.** Never push to `main`. The maintainer merges by hand. Don't commit `package-lock.json` churn from a newer npm, or anything personal (backups, exports, API keys).
- Cloud-session quirks (blocked CDNs, Playwright browser path) are in `aivault/operations.md`.
