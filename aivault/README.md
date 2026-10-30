# AI vault

The docs vault for D4 Companion, and the **source of truth for every AI session and every prompt** in this repository.

A session should be able to plan and make a change from these pages, then open only the files it touches. It should not need to crawl the codebase. That saves time and credits, but only while the vault is accurate. So **the vault is updated in the same pull request as the code it describes.**

## Read order

1. [overview.md](overview.md): what the product is, who it's for, and the hard constraints.
2. [architecture.md](architecture.md): every source file, what it does, and how data flows.
3. [data-model.md](data-model.md): the shapes of characters, items, builds, settings and synced data.
4. [features.md](features.md): what ships today, with status and where each feature lives.
5. [operations.md](operations.md): commands, tests, CI, the daily sync, deploys and environment gotchas.
6. [roadmap.md](roadmap.md): what's next and known issues.
7. [adr/](adr/README.md): architecture decisions and why they were made.
8. [prompts/](prompts/README.md): every prompt, both the ones the app sends and the ones used to drive sessions.
9. [changelog.md](changelog.md): notable changes, newest first.

## Keeping it current (every PR)

- **New, renamed or deleted file** under `src/` or `scripts/`: update [architecture.md](architecture.md).
- **User-visible behaviour changed**: update [features.md](features.md), and `README.md` if players would notice.
- **Data shape changed** (character, item, build, synced JSON, storage keys): update [data-model.md](data-model.md).
- **New command, workflow or environment quirk**: update [operations.md](operations.md).
- **A decision that's hard to reverse or easy to second-guess**: add an ADR from [adr/0000-template.md](adr/0000-template.md).
- **A prompt changed**: edit it in [prompts/](prompts/README.md), never inline in code.
- **Roadmap item done or found**: move it in [roadmap.md](roadmap.md).
- **Every PR**: add one line to [changelog.md](changelog.md).

`tests/vault.test.js` fails the build when a source file, npm script or ADR is missing from the vault. Deploys run `npm test`, so a stale vault blocks a release. The test checks coverage only. Accuracy is the author's job.

## Conventions

- Plain Markdown with relative links, so the folder also opens as an Obsidian vault.
- State facts about the code as it is on `main`. Plans go in the roadmap, not in the other pages.
- Keep pages dense. A page is read on every session, so every line costs.
