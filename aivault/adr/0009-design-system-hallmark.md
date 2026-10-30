# 0009. One token design system built with Hallmark

- Status: Accepted
- Date: 2026-10-30

## Context
The first design grew screen by screen: two stylesheets with hundreds of colour literals, Cinzel in tracked capitals everywhere, gold corner brackets, noise textures and glows. It read as a generic fantasy template, and every change risked drift. The maintainer asked for a clean, unique look in the Diablo feel, using the Hallmark design skill (`nutlope/hallmark`, installed for Claude Code).

## Decision
A full Hallmark redesign at app scope with a custom direction. The idea: **colour is loot.** The chrome is iron and bone; the only hues on screen are the game's rarity tiers, the verdicts (good, warn, bad, your deviations) and one blood red for the action. Game art always sits on a dark "deep plate" so it looks right in both themes.

- Every colour, font, space and duration is a token in `src/css/tokens.css`; no literals elsewhere (a screen may add its own tokens in one `:root` block at the top of its file).
- Faces: Marcellus (heads, item and skill names), Alegreya Sans (everything else), IBM Plex Mono (figures only).
- Labels are sentence case and untracked; no eyebrows, middle-dot strings, glows, gradients or noise. The Ancestral white glow stays because the game draws it.
- `src/css/app.css` opens with the Hallmark stamp, which records these decisions; keep it current when the system changes.

## Consequences
Restyling is a token edit. New screens reuse `shell.css` components and add a screen file. Check changes with `node ~/.claude/skills/hallmark/scripts/sloplint.mjs src --genre atmospheric --scope app`; fix every FAIL.

## Alternatives considered
- A catalog Hallmark theme: none carried the game's rarity colours as the palette.
- Keep the old look and polish it: the tells were structural (capitals, brackets, glows everywhere), so a polish would not have changed how it reads.
