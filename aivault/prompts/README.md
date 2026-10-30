# Prompts

Every prompt used by the app or to drive work on it. **Edit prompts here, not in code.** The app imports these files with Vite's `?raw`, so what's here is what ships.

## Sent by the app
| File | Used by | Notes |
|---|---|---|
| [tooltip-reader.system.md](tooltip-reader.system.md) | `src/recognize/claude.js` (system prompt) | Pure prompt text with no headings, sent as-is (trimmed). The JSON schema stays in code, because its enum comes from `AFFIXES`. Called with `effort: "low"` and structured output. Models: Opus, Sonnet or Haiku 5.5 (`src/recognize/models.js`). |

When you change an app prompt, note it in [../changelog.md](../changelog.md). If you can, check it on a few real screenshots with the player-facing model choices.

## For driving sessions
| File | Use |
|---|---|
| [session-kickoff.md](session-kickoff.md) | Paste at the start of a Claude Code session, with the task filled in. |
