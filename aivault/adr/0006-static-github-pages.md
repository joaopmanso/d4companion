# 0006. Static Vite build on GitHub Pages, no framework

- Status: Accepted (recorded retroactively)
- Date: 2026-10-30

## Context
A free, low-maintenance site with daily data updates.

## Decision
Vanilla ES modules, bundled by Vite with `base: "./"` and deployed to GitHub Pages by `.github/workflows/deploy.yml` on pushes to `main` and after each successful guide sync. Heavy modules (Tesseract, the Anthropic SDK) are imported dynamically.

## Consequences
- No hosting cost, and deploys follow from commits. `npm test` gates every deploy.
- No server-side features beyond the Worker (0005).
