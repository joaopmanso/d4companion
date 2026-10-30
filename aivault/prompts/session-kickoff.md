Repository: joaopmanso/d4companion (Diablo IV build companion, https://joaopmanso.github.io/d4companion).

Start by reading CLAUDE.md, then aivault/README.md and the vault pages it lists. Work from the vault. Open source files only when you are about to change them or the vault doesn't answer the question. Don't scan the whole codebase.

Task: <describe the change>

When done:
1. Run `npm test` and `npm run build`.
2. Update aivault/ in the same branch: architecture, features, data model, operations, roadmap, an ADR if a decision was made, and a changelog line.
3. Commit on a new branch and open a PR for the maintainer to merge by hand. Don't push to main.
