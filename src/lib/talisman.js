// The player's own talisman compared with the guide's: which charms and seal match, and how many
// pieces of each set count (a charm like Hellfire Torch adds +1 to a set; Seal of the Diamond Mind
// lowers every bonus threshold by one, to a minimum of 2).
export const emptyTalisman = () => ({ seal: null, charms: [null, null, null, null, null, null] });

export function charmInfo(name, build) {
  if (!name) return null;
  const c = build.catalog?.charms?.[name] || build.talisman?.charms.find((x) => x.name === name);
  return { name, art: c?.art || "", set: c?.set || "", mythic: !!c?.mythic, unique: !!c?.unique, tip: c?.tip || "" };
}
export function sealInfo(name, build) {
  if (!name) return null;
  const s = build.catalog?.seals?.[name] || (build.talisman?.seal?.name === name ? build.talisman.seal : null);
  return { name, art: s?.art || "", tip: s?.tip || "" };
}

export function setCounts(charms) {
  const counts = new Map();
  for (const c of charms) {
    if (!c) continue;
    if (c.set) counts.set(c.set, (counts.get(c.set) || 0) + 1);
    const bonus = (c.tip || "").match(/\+(\d+) Set count to (.+)$/m);
    if (bonus) counts.set(bonus[2].trim(), (counts.get(bonus[2].trim()) || 0) + Number(bonus[1]));
  }
  return counts;
}
export const lowersThresholds = (seal) => /reduces the number of charms needed/i.test(seal?.tip || "");

// What's missing compared with the guide, as next steps.
export function talismanSteps(mine, build) {
  const want = build.talisman || { charms: [] };
  const have = new Set(mine.charms.filter(Boolean));
  const steps = [];
  if (want.seal && mine.seal !== want.seal.name) steps.push(`Seal: ${want.seal.name}${mine.seal ? ` (you have ${mine.seal})` : ""}.`);
  const missing = want.charms.filter((c) => !have.has(c.name));
  for (const c of missing) steps.push(`Charm: ${c.name}${c.set ? ` (${c.set})` : ""}.`);
  const extra = [...have].filter((n) => !want.charms.some((c) => c.name === n));
  if (extra.length) steps.push(`Not in the guide: ${extra.join(", ")}.`);
  return steps;
}
