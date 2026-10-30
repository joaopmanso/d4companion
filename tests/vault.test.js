// The docs vault (aivault/) must cover the code: every source file, npm script, ADR and prompt is named in it.
// This checks coverage only; whether the words are still true is up to the author and reviewer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const walk = (dir) => readdirSync(new URL(dir, root)).flatMap((f) => {
  const p = `${dir}/${f}`;
  return statSync(new URL(p, root)).isDirectory() ? walk(p) : [p];
});
const missing = (names, doc) => names.filter((n) => !doc.includes(n));

test("aivault/architecture.md names every file under src/ and scripts/", () => {
  const files = [...walk("src"), ...walk("scripts")].filter((f) => /\.(m?js|css)$/.test(f));
  assert.deepEqual(missing(files, read("aivault/architecture.md")), [], "Add these files to aivault/architecture.md");
});

test("aivault/architecture.md names every test file", () => {
  assert.deepEqual(missing(walk("tests"), read("aivault/architecture.md")), [], "Add these tests to aivault/architecture.md");
});

test("aivault/operations.md names every npm script", () => {
  const scripts = Object.keys(JSON.parse(read("package.json")).scripts).map((s) => (s === "test" ? "npm test" : `npm run ${s}`));
  assert.deepEqual(missing(scripts, read("aivault/operations.md")), [], "Document these commands in aivault/operations.md");
});

test("aivault/adr/README.md lists every ADR", () => {
  const adrs = readdirSync(new URL("aivault/adr", root)).filter((f) => /^\d{4}-.+\.md$/.test(f) && !f.startsWith("0000"));
  assert.deepEqual(missing(adrs, read("aivault/adr/README.md")), [], "List these ADRs in aivault/adr/README.md");
});

test("aivault/prompts/README.md lists every prompt", () => {
  const prompts = readdirSync(new URL("aivault/prompts", root)).filter((f) => f !== "README.md");
  assert.deepEqual(missing(prompts, read("aivault/prompts/README.md")), [], "List these prompts in aivault/prompts/README.md");
});

test("prompts the app sends exist in the vault", () => {
  const refs = walk("src").flatMap((f) => [...read(f).matchAll(/aivault\/prompts\/([\w.-]+)\?raw/g)].map((m) => m[1]));
  for (const p of refs) assert.doesNotThrow(() => read(`aivault/prompts/${p}`), `src imports missing prompt ${p}`);
  assert.ok(refs.length > 0, "expected at least one prompt imported from the vault");
});
