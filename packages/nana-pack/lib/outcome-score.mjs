/**
 * @module packages/nana-pack/lib/outcome-score.mjs
 * @purpose Score labelled outcome accuracy and compare repeat sets without exposing evidence text.
 * @inputs Explicit private meter rows and labels JSONL files.
 * @outputs Per-kind counts, Wilson lower bounds, bar status and repeat-set agreement.
 * @effects disk (explicit private inputs)
 * @errors Invalid rows, labels or arguments return fixed nonzero command diagnostics.
 */
import fs from "node:fs";
import { memoryArgs } from "./memory-making.mjs";
import { wilson } from "./outcome-meter.mjs";
import { KIND_BAR, PRECISION_BAR, RECALL_BAR, MIN_REPEATS, WORDS } from "./outcome-meter-config.mjs";
const kinds = ["correction", "decision"];
const turn = pointer => pointer.split("+")[0];
function readRows(file, labels = false) {
 const rows = fs.readFileSync(file, "utf8").split(/\r\n|\r|\n/u).filter(line => line.trim()).map(line => JSON.parse(line));
 const seen = new Set();
 for (const row of rows) {
  if (!labels && row?.type === "window") {
   if (!Number.isInteger(row.window) || typeof row.warmUp !== "boolean" || typeof row.partial !== "boolean") throw new Error("invalid window");
   continue;
  }
  if (!row || !kinds.includes(row.kind) || typeof row.evidence !== "string" || !row.evidence) throw new Error("invalid row");
  if (seen.has(row.evidence)) throw new Error("duplicate row"); seen.add(row.evidence);
  if (labels) {
   if (typeof row.valid !== "boolean" || !Array.isArray(row.repeatOf) || row.repeatOf.some(pointer => typeof pointer !== "string" || !pointer) || !["same", "changed", "none"].includes(row.relation)) throw new Error("invalid label");
  } else if (row.type !== "item" || !(row.repeatOf === null || (typeof row.repeatOf === "string" && row.repeatOf)) || !Number.isInteger(row.window)) throw new Error("invalid item");
 }
 return rows;
}
function baselineItems(rows) {
 const windows = new Map(rows.filter(row => row.type === "window").map(row => [row.window, row]));
 return rows.filter(row => row.type === "item" && windows.has(row.window) && !windows.get(row.window).warmUp && !windows.get(row.window).partial);
}
const ratio = (kind, name, n, d) => `${kind} ${name} ${n}/${d} lower ${wilson(n, d)[0].toFixed(4)}`;
/** Accuracy labels refer to all baseline items, never only claimed repeats. */
export function scoreOutcomes(rows, labels) {
 const items = baselineItems(rows), byPointer = new Map(labels.map(row => [row.evidence, row]));
 const lines = [];
 for (const kind of kinds) {
  const subset = items.filter(row => row.kind === kind), labelled = subset.filter(row => byPointer.has(row.evidence));
  const valid = labelled.filter(row => { const label = byPointer.get(row.evidence); return label.kind === kind && label.valid; });
  const actual = row => { const label = byPointer.get(row.evidence); return label.relation === "same" && label.repeatOf.length > 0; };
  const positives = valid.filter(actual), predicted = valid.filter(row => row.repeatOf !== null);
  const hits = predicted.filter(actual), pointerHits = predicted.filter(row => byPointer.get(row.evidence).repeatOf.includes(row.repeatOf) && actual(row));
  const unlabelled = subset.length - labelled.length;
  lines.push(ratio(kind, "kind precision", valid.length, labelled.length), ratio(kind, "repeat recall", hits.length, positives.length), ratio(kind, "repeat precision", hits.length, predicted.length), ratio(kind, "pointer agreement", pointerHits.length, predicted.length), `${kind} unlabelled ${unlabelled}`);
  if (unlabelled) lines.push(`${kind} ${WORDS.unlabelled}`);
  if (positives.length < MIN_REPEATS) lines.push(`${kind} ${WORDS.fewRepeats}`);
  if (!unlabelled && positives.length >= MIN_REPEATS) {
   const passed = wilson(valid.length, labelled.length)[0] >= KIND_BAR && wilson(hits.length, predicted.length)[0] >= PRECISION_BAR && wilson(hits.length, positives.length)[0] >= RECALL_BAR;
   lines.push(`${kind} bar ${passed ? "met" : "below"}`);
  }
 }
 return lines;
}
/** Compare repeats by owner-turn identity, ignoring differences in paired seat entries. */
export function compareOutcomes(rows, against) {
 return kinds.map(kind => {
  const repeats = list => new Set(list.filter(row => row.type === "item" && row.kind === kind && row.repeatOf !== null).map(row => turn(row.evidence)));
  const a = repeats(rows), b = repeats(against), shared = [...a].filter(key => b.has(key)).length;
  return `${kind} repeats ${a.size} ${b.size} agreement ${shared}/${new Set([...a, ...b]).size}`;
 });
}
export async function runOutcomeScore(argv, { stdout = s => process.stdout.write(s), stderr = s => process.stderr.write(s) } = {}) {
 try {
  const args = memoryArgs(argv, ["rows", "labels"]);
  if (!args.rows || !args.labels) throw new Error("missing input");
  const lines = scoreOutcomes(readRows(args.rows), readRows(args.labels, true));
  for (const line of lines) stdout(`${line}\n`);
  return 0;
 } catch { stderr("memory: meter-score failed\n"); return 1; }
}
export async function runOutcomeCompare(argv, { stdout = s => process.stdout.write(s), stderr = s => process.stderr.write(s) } = {}) {
 try {
  const args = memoryArgs(argv, ["rows", "against"]);
  if (!args.rows || !args.against) throw new Error("missing input");
  for (const line of compareOutcomes(readRows(args.rows), readRows(args.against))) stdout(`${line}\n`);
  return 0;
 } catch { stderr("memory: meter-compare failed\n"); return 1; }
}
