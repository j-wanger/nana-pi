/**
 * @module apps/bench/lib/anatomy-measures.mjs
 * @purpose Measure segmented builder contexts and transform their spans for blinded labels and replay.
 * @inputs Private contexts and filled id/label sheets; explicit sampling and assembly options.
 * @outputs Counts-only reports and agreement, blind samples, or assembled private text.
 * @effects none
 * @errors Invalid labels, duplicate ids, unknown ids and differing sheet id sets throw fixed diagnostics.
 */
import crypto from "node:crypto";
import { cohensKappa, seededSample } from "./catch-stats.mjs";
import { CLASS_FUNCTION, FUNCTIONS, KAPPA_MIN_COUNT, LABEL_HEAVY_MIN, LABEL_SAMPLE_MIN, LABEL_SHORT_CHARS, NORMALIZATION, NORMAL_TOKENS, OVERSIZE_UNIT_CHARS, REPORT_PARTS, RULE_TIERS, SAMPLE_MIN_FUNCTION, SAMPLE_MIN_TIER, SAMPLE_SIZE, SHARE_DIGITS, SIZE_QUANTILE, STAGE_POINTER } from "./anatomy-config.mjs";

const labels = [...FUNCTIONS, "unsorted", "glue"];
const safePart = (name) => REPORT_PARTS.includes(name) ? name : "extra-section";
const round = (n) => Number(n.toFixed(SHARE_DIGITS));
const pct = (n, total) => total ? round(100 * n / total) : 0;
const flat = (contexts) => contexts.flatMap((c) => c.parts.flatMap((p) => p.spans.map((s) => ({ c, p, s }))));
const oversize = (s) => s.kind === "unit" && s.text.length > OVERSIZE_UNIT_CHARS;
const functionOf = (s) => s.kind === "glue" ? "glue" : s.label;
function counts(rows, vocabulary = labels) {
 const chars = rows.reduce((n, { s }) => n + s.text.length, 0), total = rows.length;
 return vocabulary.map((label) => {
  const found = rows.filter(({ s }) => functionOf(s) === label);
  const size = found.reduce((n, { s }) => n + s.text.length, 0);
  return { function: label, units: found.length, unitShare: pct(found.length, total), chars: size, charShare: pct(size, chars) };
 });
}
export function normalize(text, c) {
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
export function reportContexts(contexts, vocabulary = labels) {
 const all = flat(contexts), small = all.filter(({ s }) => !oversize(s));
 const duplicates = new Map();
 for (const { c, p, s } of all.filter(({ s }) => s.kind === "unit")) {
  const normalized = normalize(s.text, c);
  if (normalized) { const d = duplicates.get(normalized) ?? { count: 0, parts: new Set() }; d.count++; d.parts.add(safePart(p.name)); duplicates.set(normalized, d); }
 }
 const duplicateRows = [...duplicates.values()].filter((d) => d.count > 1).sort((a, b) => b.count - a.count || [...a.parts].sort().join().localeCompare([...b.parts].sort().join()));
 const parts = [...new Set(all.map(({ p }) => safePart(p.name)))].sort().map((name) => {
  const rows = all.filter(({ p }) => safePart(p.name) === name), sizes = rows.filter(({ s }) => s.kind === "unit").map(({ s }) => s.text.length).sort((a, b) => a - b);
  return { part: name, counts: counts(rows.filter(({ s }) => !oversize(s)), vocabulary), max: sizes.at(-1) ?? 0, p90: sizes[Math.max(0, Math.ceil(sizes.length * SIZE_QUANTILE) - 1)] ?? 0 };
 });
 const zeroSupply = [];
 for (const group of ["1", "2+", "unknown"]) {
  const builds = contexts.filter((c) => group === "1" ? c.buildNumber === 1 : group === "2+" ? typeof c.buildNumber === "number" && c.buildNumber >= 2 : c.buildNumber === "unknown");
  for (const f of FUNCTIONS) {
   const zero = builds.filter((c) => !small.some((r) => r.c === c && r.s.kind === "unit" && r.s.label === f && r.s.text.length)).length;
   zeroSupply.push({ function: f, group, builds: builds.length, zero, zeroShare: pct(zero, builds.length) });
  }
 }
 const pulls = contexts.flatMap((c) => c.pulls), overall = counts(small, vocabulary);
 return {
  overall, parts, oversize: all.filter(({ s }) => oversize(s)).map(({ p, s }) => ({ part: safePart(p.name), units: 1, chars: s.text.length })),
  zeroSupply, duplicates: duplicateRows.map((d, i) => ({ id: `dup-${i + 1}`, count: d.count, parts: [...d.parts].sort() })),
  pulls: { byClass: pulled(pulls, "class", Object.keys(CLASS_FUNCTION)), byFunction: pulled(pulls, "function", [...FUNCTIONS, "unsorted"]).map((r) => ({ ...r, pushedChars: overall.find((x) => x.function === r.function)?.chars ?? 0 })) },
  excluded: [...new Set(contexts.flatMap((c) => c.excluded ?? []).map((e) => e.reason))].sort().map((reason) => {
   const rows = contexts.flatMap((c) => c.excluded ?? []).filter((e) => e.reason === reason); return { reason, count: rows.length, chars: rows.reduce((n, e) => n + e.chars, 0) };
  }),
  builds: contexts.map((c) => ({ id: c.id, lane: c.lane, buildNumber: c.buildNumber, attempts: c.attempts ?? 1, model: c.model, verdict: c.verdict,
   functions: Object.fromEntries(vocabulary.map((label) => { const rows = small.filter((r) => r.c === c && functionOf(r.s) === label); return [label, { units: rows.filter((r) => r.s.kind === "unit").length, chars: rows.reduce((n, r) => n + r.s.text.length, 0) }]; })),
   pulledChars: c.pulls.reduce((n, p) => n + p.chars, 0), tokens: c.tokens, wallMinutes: c.wallMinutes, landed: c.landed })),
 };
}

/** Pick function/tier minima, then round-robin through seed-ordered tiers; return id-sorted blind rows. */
export function drawSample(contexts, { seed, n = SAMPLE_SIZE } = {}) {
 if (typeof seed !== "string" || !seed || !Number.isSafeInteger(n) || n < 1) throw new Error("invalid sample options");
 const units = flat(contexts).map(({ s }) => s).filter((s) => s.kind === "unit"), selected = new Set();
 for (const label of FUNCTIONS) for (const id of seededSample(units.filter((s) => s.label === label).map((s) => s.id), SAMPLE_MIN_FUNCTION, seed)) selected.add(id);
 for (const tier of RULE_TIERS) for (const id of seededSample(units.filter((s) => s.tier === tier).map((s) => s.id), SAMPLE_MIN_TIER, seed)) selected.add(id);
 const strata = RULE_TIERS.map((tier) => seededSample(units.filter((s) => s.tier === tier && !selected.has(s.id)).map((s) => s.id), units.length, seed, { seedOrder: true }));
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

function blindText(s, c) {
 let text = s.text;
 if (c.cwd) text = text.split(c.cwd).join(NORMAL_TOKENS.cwd);
 if (c.branch) text = text.split(c.branch).join(NORMAL_TOKENS.branch);
 return text;
}
/** Shared private keys and representatives; occurrences retain provenance only in memory. */
export function distinctUnits(contexts) {
 const units = new Map();
 for (const { c, p, s } of flat(contexts)) {
  if (s.kind !== "unit" || oversize(s)) continue;
  const normalized = normalize(s.text, c), key = crypto.createHash("sha256").update(normalized).digest("hex");
  if (!units.has(key)) units.set(key, { key, id: s.id, text: blindText(s, c), normalized, label: s.label, occurrences: [], parts: new Set() });
  const u = units.get(key); u.occurrences.push({ c, p, s }); u.parts.add(safePart(p.name));
 }
 return units;
}
const modelVocabulary = [...FUNCTIONS, "unsorted", "unlabelled"];
const nonempty = (store) => [...store.units.values()].filter((u) => u.normalized);
function storedText(u, store) {
 const id = store.labels.get(u.key)?.id ?? u.id;
 const { c, s } = u.occurrences.find(({ s }) => s.id === id);
 return blindText(s, c);
}
const emptyCount = (store) => [...store.units.values()].filter((u) => !u.normalized).reduce((n, u) => n + u.occurrences.length, 0);
/** Dual independent minima, then seed-order fill over stored representative ids, never keys. */
export function drawLabelSample(store, { seed, n = SAMPLE_SIZE, heavy = false } = {}) {
 if (!heavy && (typeof seed !== "string" || !seed || !Number.isSafeInteger(n) || n < 1)) throw new Error("invalid sample options");
 const available = nonempty(store), rows = available.filter((u) => store.labels.has(u.key)).map((u) => {
  const row = store.labels.get(u.key);
  return { id: row.id, text: storedText(u, store), model: row.label, rule: u.label, count: u.occurrences.length };
 });
 const selected = new Set();
 if (heavy) for (const u of rows) { if (u.count >= LABEL_HEAVY_MIN) selected.add(u.id); }
 else {
  for (const source of ["model", "rule"]) for (const label of [...FUNCTIONS, "unsorted"]) for (const id of seededSample(rows.filter((u) => u[source] === label).map((u) => u.id), LABEL_SAMPLE_MIN, seed)) selected.add(id);
  for (const id of seededSample(rows.filter((u) => !selected.has(u.id)).map((u) => u.id), rows.length, seed, { seedOrder: true })) { if (selected.size >= n) break; selected.add(id); }
 }
 return { sheet: rows.filter((u) => selected.has(u.id)).sort((a, b) => a.id.localeCompare(b.id)).map(({ id, text }) => ({ id, text })), unlabelledKeys: available.length - rows.length, emptyNormalized: emptyCount(store) };
}
const denominator = (rows, basis) => ({ basis, units: rows.reduce((n, r) => n + r.units, 0), chars: rows.reduce((n, r) => n + r.chars, 0) });
/** Transform labels once before every existing report consumer; distinct views use blind chars. */
export function reportLabels(contexts, store) {
 const transformed = contexts.map((c) => ({ ...c, parts: c.parts.map((p) => ({ ...p, spans: p.spans.filter((s) => s.kind !== "unit" || oversize(s) || store.units.get(store.byId.get(s.id))?.normalized).map((s) => s.kind !== "unit" || oversize(s) ? s : { ...s, label: store.labels.get(store.byId.get(s.id))?.label ?? "unlabelled" }) })) }));
 const report = reportContexts(transformed, [...modelVocabulary, "glue"]), units = nonempty(store);
 const distinctRows = units.map((u) => ({ s: { kind: "unit", label: store.labels.get(u.key)?.label ?? "unlabelled", text: storedText(u, store) }, u }));
 const distinct = counts(distinctRows, modelVocabulary);
 const summary = (rows) => ({ keys: rows.length, occurrences: rows.reduce((n, u) => n + u.occurrences.length, 0), rawChars: rows.reduce((n, u) => n + u.occurrences.reduce((m, { s }) => m + s.text.length, 0), 0) });
 const short = units.map((u) => ({ ...u, occurrences: u.occurrences.filter(({ s }) => s.text.length < LABEL_SHORT_CHARS) })).filter((u) => u.occurrences.length);
 return { ...report, provenance: store.provenance, interpretation: "blind-text model labels; not findings until the pre-registered bars pass",
  pulls: { ...report.pulls, functionProvenance: "target-rule functions; model-labelled pushed chars" },
  perOccurrence: { counts: report.overall, denominator: denominator(report.overall, "non-oversize occurrences including glue"), parts: report.parts.map((p) => ({ part: p.part, counts: p.counts, denominator: denominator(p.counts, "non-oversize occurrences including glue in part") })) },
  perDistinct: { counts: distinct, denominator: denominator(distinct, "distinct nonempty non-oversize texts; representative blind chars"), parts: report.parts.map((p) => { const rows = counts(distinctRows.filter(({ u }) => u.parts.has(p.part)), modelVocabulary); return { part: p.part, counts: rows, denominator: denominator(rows, "distinct keys present in part; representative blind chars") }; }) },
  contextDependent: { spanningParts: summary(units.filter((u) => u.parts.size > 1)), short: summary(short) }, emptyNormalized: emptyCount(store) };
}
function modelRows(contexts, aRows, bRows, store) {
 // Reuse sheet validation and the legacy id-set contract, including oversize ids.
 agreement(contexts, aRows, bRows);
 const a = sheet(aRows), b = sheet(bRows), all = new Map(flat(contexts).filter(({ s }) => s.kind === "unit").map(({ s }) => [s.id, s]));
 const ids = [...a.keys()].sort().filter((id) => !oversize(all.get(id)));
 const missing = new Set(ids.map((id) => store.byId.get(id)).filter((key) => !store.labels.has(key)));
 if (missing.size) throw Object.assign(new Error(`model labels missing: ${missing.size}`), { code: "MODEL_LABELS_MISSING" });
 return { rows: ids.map((id) => { const key = store.byId.get(id), u = store.units.get(key); return { id, key, a: a.get(id), b: b.get(id), model: store.labels.get(key).label, u: { ...u, text: storedText(u, store) } }; }), excluded: a.size - ids.length, all };
}
const kappaOrNull = (a, b) => a.length ? cohensKappa(a, b) : null;
function modelPair(name, rows, target, units) {
 const ids = rows.map((r) => r.id), a = new Map(rows.map((r) => [r.id, r.model])), b = new Map(rows.map((r) => [r.id, r[target]]));
 const result = rows.length ? pair(name, ids, a, b, units) : { pair: name, kappa: null, charAgreement: 0, confusions: [] };
 return { ...result, rows: rows.length, distinctKeys: new Set(rows.map((r) => r.key)).size, perFunction: [...FUNCTIONS, "unsorted"].map((f) => ({ function: f, count: rows.filter((r) => r.model === f || r[target] === f).length, kappa: kappaOrNull(rows.map((r) => r.model === f), rows.map((r) => r[target] === f)) })) };
}
const weights = (rows) => ({ occurrences: rows.reduce((n, r) => n + r.u.occurrences.length, 0), occurrenceChars: rows.reduce((n, r) => n + r.u.occurrences.length * r.u.text.length, 0) });
const uniqueRows = (rows) => [...new Map([...rows].reverse().map((r) => [r.key, r])).values()];
/** κ remains per row; weighted proportions and pooling count each nonempty key once. */
export function agreementLabels(contexts, a, b, store, a2, b2) {
 const legacy = agreement(contexts, a, b), first = modelRows(contexts, a, b, store), rows = first.rows;
 const unique = uniqueRows(rows).filter((r) => r.u.normalized), consensus = rows.filter((r) => r.a === r.b);
 const weighted = {};
 for (const [name, selected] of [["model:b", unique], ["model:consensus", unique.filter((r) => r.a === r.b)]]) {
  const total = weights(selected), same = weights(selected.filter((r) => r.model === r.b));
  weighted[name] = { occurrences: total.occurrences ? same.occurrences / total.occurrences : null, occurrenceChars: total.occurrenceChars ? same.occurrenceChars / total.occurrenceChars : null, denominator: total };
 }
 const result = { ...legacy, provenance: store.provenance, oversizeExcluded: first.excluded, modelPairs: [modelPair("model:a", rows, "a", first.all), modelPair("model:b", rows, "b", first.all), modelPair("model:consensus", consensus, "a", first.all)], weighted,
  disputed: [...FUNCTIONS, "unsorted"].map((f) => ({ function: f, aVsB: weights(unique.filter((r) => r.a !== r.b && [r.a, r.b].includes(f))), modelVsB: weights(unique.filter((r) => r.model !== r.b && [r.model, r.b].includes(f))) })),
  consensusLeftOut: weights(unique.filter((r) => r.a !== r.b)), emptyNormalized: emptyCount(store) };
 if (a2 && b2) {
  const second = modelRows(contexts, a2, b2, store), firstKeys = new Set(unique.map((r) => r.key)), secondUnique = uniqueRows(second.rows).filter((r) => r.u.normalized), pooled = [...unique, ...secondUnique.filter((r) => !firstKeys.has(r.key))];
  result.pooled = { distinctKeys: pooled.length, overlap: secondUnique.filter((r) => firstKeys.has(r.key)).length, perFunction: [...FUNCTIONS, "unsorted"].map((f) => {
   const consensus = pooled.filter((r) => r.a === r.b);
   return { function: f, count: pooled.filter((r) => [r.model, r.a, r.b].includes(f)).length, modelB: kappaOrNull(pooled.map((r) => r.model === f), pooled.map((r) => r.b === f)), modelConsensus: kappaOrNull(consensus.map((r) => r.model === f), consensus.map((r) => r.a === f)) };
  }) };
 }
 return result;
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
  return { index, name: safePart(part.name), attempt: part.attempt, text };
 });
 return { parts, staged, removedUnits, removedChars };
}
