/**
 * @module apps/bench/lib/anatomy-measures.mjs
 * @purpose Measure segmented builder contexts and transform their spans for blinded labels and replay.
 * @inputs Private contexts and filled id/label sheets; explicit sampling and assembly options.
 * @outputs Counts-only reports and agreement, blind samples, or assembled private text.
 * @effects none
 * @errors Invalid labels, duplicate ids, unknown ids and differing sheet id sets throw fixed diagnostics.
 */
import { cohensKappa, seededSample } from "./catch-stats.mjs";
import { CLASS_FUNCTION, FUNCTIONS, KAPPA_MIN_COUNT, NORMALIZATION, NORMAL_TOKENS, OVERSIZE_UNIT_CHARS, REPORT_PARTS, RULE_TIERS, SAMPLE_MIN_FUNCTION, SAMPLE_MIN_TIER, SAMPLE_SIZE, SHARE_DIGITS, SIZE_QUANTILE, STAGE_POINTER } from "./anatomy-config.mjs";

const labels = [...FUNCTIONS, "unsorted", "glue"];
const safePart = (name) => REPORT_PARTS.includes(name) ? name : "extra-section";
const round = (n) => Number(n.toFixed(SHARE_DIGITS));
const pct = (n, total) => total ? round(100 * n / total) : 0;
const flat = (contexts) => contexts.flatMap((c) => c.parts.flatMap((p) => p.spans.map((s) => ({ c, p, s }))));
const oversize = (s) => s.kind === "unit" && s.text.length > OVERSIZE_UNIT_CHARS;
const functionOf = (s) => s.kind === "glue" ? "glue" : s.label;
function counts(rows) {
 const chars = rows.reduce((n, { s }) => n + s.text.length, 0), total = rows.length;
 return labels.map((label) => {
  const found = rows.filter(({ s }) => functionOf(s) === label);
  const size = found.reduce((n, { s }) => n + s.text.length, 0);
  return { function: label, units: found.length, unitShare: pct(found.length, total), chars: size, charShare: pct(size, chars) };
 });
}
function normalize(text, c) {
 for (const step of NORMALIZATION) {
  if (step === "cwd" && c.cwd) text = text.split(c.cwd).join(NORMAL_TOKENS.cwd);
  if (step === "branch" && c.branch) text = text.split(c.branch).join(NORMAL_TOKENS.branch);
  if (step === "list") text = text.replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/gmu, "");
  if (step === "emphasis") text = text.replace(/[*_`]/gu, "");
  if (step === "whitespace") text = text.replace(/\s+/gu, " ").trim();
 }
 return text;
}
function pulled(rows, key, vocabulary) {
 return vocabulary.map((value) => {
  const found = rows.filter((r) => r[key] === value);
  return { [key]: value, calls: found.length, chars: found.reduce((n, r) => n + r.chars, 0) };
 });
}
/** Only the returned aggregate fields are printable; raw text never enters this object. */
export function reportContexts(contexts) {
 const all = flat(contexts), small = all.filter(({ s }) => !oversize(s));
 const duplicates = new Map();
 for (const { c, p, s } of all.filter(({ s }) => s.kind === "unit")) {
  const normalized = normalize(s.text, c);
  if (normalized) { const d = duplicates.get(normalized) ?? { count: 0, parts: new Set() }; d.count++; d.parts.add(safePart(p.name)); duplicates.set(normalized, d); }
 }
 const duplicateRows = [...duplicates.values()].filter((d) => d.count > 1).sort((a, b) => b.count - a.count || [...a.parts].sort().join().localeCompare([...b.parts].sort().join()));
 const parts = [...new Set(all.map(({ p }) => safePart(p.name)))].sort().map((name) => {
  const rows = all.filter(({ p }) => safePart(p.name) === name), sizes = rows.filter(({ s }) => s.kind === "unit").map(({ s }) => s.text.length).sort((a, b) => a - b);
  return { part: name, counts: counts(rows.filter(({ s }) => !oversize(s))), max: sizes.at(-1) ?? 0, p90: sizes[Math.max(0, Math.ceil(sizes.length * SIZE_QUANTILE) - 1)] ?? 0 };
 });
 const zeroSupply = [];
 for (const group of ["1", "2+", "unknown"]) {
  const builds = contexts.filter((c) => group === "1" ? c.buildNumber === 1 : group === "2+" ? typeof c.buildNumber === "number" && c.buildNumber >= 2 : c.buildNumber === "unknown");
  for (const f of FUNCTIONS) {
   const zero = builds.filter((c) => !small.some((r) => r.c === c && r.s.kind === "unit" && r.s.label === f && r.s.text.length)).length;
   zeroSupply.push({ function: f, group, builds: builds.length, zero, zeroShare: pct(zero, builds.length) });
  }
 }
 const pulls = contexts.flatMap((c) => c.pulls), overall = counts(small);
 return {
  overall, parts, oversize: all.filter(({ s }) => oversize(s)).map(({ p, s }) => ({ part: safePart(p.name), units: 1, chars: s.text.length })),
  zeroSupply, duplicates: duplicateRows.map((d, i) => ({ id: `dup-${i + 1}`, count: d.count, parts: [...d.parts].sort() })),
  pulls: { byClass: pulled(pulls, "class", Object.keys(CLASS_FUNCTION)), byFunction: pulled(pulls, "function", [...FUNCTIONS, "unsorted"]).map((r) => ({ ...r, pushedChars: overall.find((x) => x.function === r.function)?.chars ?? 0 })) },
  excluded: [...new Set(contexts.flatMap((c) => c.excluded ?? []).map((e) => e.reason))].sort().map((reason) => {
   const rows = contexts.flatMap((c) => c.excluded ?? []).filter((e) => e.reason === reason); return { reason, count: rows.length, chars: rows.reduce((n, e) => n + e.chars, 0) };
  }),
  builds: contexts.map((c) => ({ id: c.id, lane: c.lane, buildNumber: c.buildNumber, attempts: c.attempts ?? 1, model: c.model, verdict: c.verdict,
   functions: Object.fromEntries(labels.map((label) => { const rows = small.filter((r) => r.c === c && functionOf(r.s) === label); return [label, { units: rows.filter((r) => r.s.kind === "unit").length, chars: rows.reduce((n, r) => n + r.s.text.length, 0) }]; })),
   pulledChars: c.pulls.reduce((n, p) => n + p.chars, 0), tokens: c.tokens, wallMinutes: c.wallMinutes, landed: c.landed })),
 };
}

/** Minima are selected first, then round-robin within rule tiers; seed order is imported. */
export function drawSample(contexts, { seed, n = SAMPLE_SIZE } = {}) {
 if (typeof seed !== "string" || !seed || !Number.isSafeInteger(n) || n < 1) throw new Error("invalid sample options");
 const units = flat(contexts).map(({ s }) => s).filter((s) => s.kind === "unit"), selected = new Set();
 for (const label of FUNCTIONS) for (const id of seededSample(units.filter((s) => s.label === label).map((s) => s.id), SAMPLE_MIN_FUNCTION, seed)) selected.add(id);
 for (const tier of RULE_TIERS) for (const id of seededSample(units.filter((s) => s.tier === tier).map((s) => s.id), SAMPLE_MIN_TIER, seed)) selected.add(id);
 const strata = RULE_TIERS.map((tier) => seededSample(units.filter((s) => s.tier === tier && !selected.has(s.id)).map((s) => s.id), units.length, seed));
 let added = true;
 while (selected.size < n && added) {
  added = false;
  for (const stratum of strata) if (stratum.length && selected.size < n) { selected.add(stratum.shift()); added = true; }
 }
 return units.filter((s) => selected.has(s.id)).sort((a, b) => a.id.localeCompare(b.id)).map((s) => ({ id: s.id, text: s.text }));
}
function sheet(rows) {
 const result = new Map();
 for (const row of rows) {
  if (typeof row.id !== "string" || ![...FUNCTIONS, "unsorted"].includes(row.label) || result.has(row.id)) throw new Error("invalid label sheet");
  result.set(row.id, row.label);
 }
 return result;
}
function pair(name, ids, a, b, units) {
 const av = ids.map((id) => a.get(id)), bv = ids.map((id) => b.get(id));
 const chars = ids.reduce((n, id) => n + units.get(id).text.length, 0), sameChars = ids.reduce((n, id) => n + (a.get(id) === b.get(id) ? units.get(id).text.length : 0), 0);
 const confusion = new Map();
 ids.forEach((id) => { if (a.get(id) !== b.get(id)) { const k = `${a.get(id)}:${b.get(id)}`; confusion.set(k, (confusion.get(k) ?? 0) + 1); } });
 return { pair: name, kappa: cohensKappa(av, bv), charAgreement: chars ? sameChars / chars : 0,
  perFunction: [...FUNCTIONS, "unsorted"].flatMap((f) => {
   const count = ids.filter((id) => a.get(id) === f || b.get(id) === f).length;
   return count >= KAPPA_MIN_COUNT ? [{ function: f, count, kappa: cohensKappa(av.map((v) => v === f), bv.map((v) => v === f)) }] : [];
  }),
  confusions: [...confusion].map(([key, count]) => { const [a, b] = key.split(":"); return { a, b, count }; }).sort((a, b) => b.count - a.count || `${a.a}:${a.b}`.localeCompare(`${b.a}:${b.b}`)),
 };
}
/** Labellers see only id/text; rule and heading provenance stays in the private contexts. */
export function agreement(contexts, aRows, bRows) {
 const a = sheet(aRows), b = sheet(bRows), differing = [...new Set([...a.keys(), ...b.keys()])].filter((id) => a.has(id) !== b.has(id)).length;
 if (differing) throw new Error(`ids differ: ${differing}`);
 const units = new Map(flat(contexts).filter(({ s }) => s.kind === "unit").map(({ s }) => [s.id, s]));
 const ids = [...a.keys()].sort();
 if (!ids.length || ids.some((id) => !units.has(id))) throw new Error("unknown or empty sample ids");
 const rules = new Map(ids.map((id) => [id, units.get(id).label]));
 const consensusIds = ids.filter((id) => a.get(id) === b.get(id));
 return { pairs: [pair("rules:a", ids, rules, a, units), pair("rules:b", ids, rules, b, units), pair("a:b", ids, a, b, units)], consensus: consensusIds.length,
  rulesConsensus: consensusIds.length ? pair("rules:consensus", consensusIds, rules, a, units) : null };
}

/** Replay is derived only from spans: raw is retained for audits, never used for assembly. */
export function assembleParts(context, { drop, stage } = {}) {
 if ((drop && stage) || ((drop || stage) && ![...FUNCTIONS, "unsorted"].includes(drop || stage))) throw new Error("invalid assembly function");
 let removedUnits = 0, removedChars = 0, staged = "";
 const parts = context.parts.map((part, index) => {
  const spans = part.spans, kept = spans.filter((s) => s.kind === "unit" && s.label !== drop), liveHeadings = new Set(kept.flatMap((s) => s.headingIds ?? []));
  let text = "", staging = false;
  for (const s of spans) {
   if (drop && s.kind === "glue" && s.heading && !liveHeadings.has(s.headingId)) continue;
   if (s.kind === "unit" && s.label === drop) { removedUnits++; removedChars += s.text.length; continue; }
   if (s.kind === "unit" && s.label === stage) {
    if (!staging) text += STAGE_POINTER;
    staged += s.text; staging = true; removedUnits++; removedChars += s.text.length; continue;
   }
   if (s.kind === "unit" || s.heading) staging = false;
   text += s.text;
  }
  return { index, name: safePart(part.name), text };
 });
 return { parts, staged, removedUnits, removedChars };
}
