/**
 * @module packages/nana-pack/lib/memory-score.mjs
 * @purpose Score a frozen candidate run against independently labelled evidence and kind pairs.
 * @inputs Private candidates and labels JSONL files with evidence and kind fields.
 * @outputs Exact counts-only recall, precision, false-per-turn and unlabelled readings.
 * @effects disk (reads explicitly selected private files)
 * @errors Malformed files or arguments return nonzero with a fixed message.
 */
import fs from "node:fs";
import { memoryArgs } from "./memory-making.mjs";

const kinds = ["correction", "decision", "lesson"];
function rows(file, labels) {
 const records = fs.readFileSync(file, "utf8").split(/\r?\n/u).filter((line) => line.trim()).map((line) => JSON.parse(line));
 const seen = new Set();
 for (const row of records) {
  if (typeof row?.evidence !== "string" || !row.evidence || !(labels ? [...kinds, "none"] : kinds).includes(row.kind)) throw new Error("invalid score record");
  if (labels && seen.has(row.evidence)) throw new Error("duplicate label");
  seen.add(row.evidence);
 }
 return records;
}
/** One label per evidence pointer. Unknown candidates are not false labels: they make the run unscored. */
export function scoreMemory(candidates, labels) {
 const byPointer = new Map(labels.map((row) => [row.evidence, row.kind]));
 const hits = new Set(); let falseCandidates = 0, unlabelled = 0, hitCandidates = 0;
 for (const row of candidates) {
  const label = byPointer.get(row.evidence);
  if (label === undefined) unlabelled++;
  else if (label === row.kind) { hits.add(row.evidence); hitCandidates++; }
  else falseCandidates++;
 }
 const lines = kinds.map((kind) => `${kind}: recall ${labels.filter((row) => row.kind === kind && hits.has(row.evidence)).length}/${labels.filter((row) => row.kind === kind).length}`);
 lines.push(`precision ${hitCandidates}/${candidates.length}`, `false per owner turn ${falseCandidates}/${labels.filter((row) => row.kind !== "lesson").length}`, `unlabelled ${unlabelled}`);
 if (unlabelled) lines.push("unscored: unlabelled candidates");
 return lines;
}
export async function runScore(argv, { stdout = (s) => process.stdout.write(s), stderr = (s) => process.stderr.write(s) } = {}) {
 try {
  const args = memoryArgs(argv, ["candidates", "labels"]);
  if (!args.candidates || !args.labels) throw new Error("missing inputs");
  for (const line of scoreMemory(rows(args.candidates, false), rows(args.labels, true))) stdout(`${line}\n`);
  return 0;
 } catch { stderr("memory: score failed\n"); return 1; }
}
