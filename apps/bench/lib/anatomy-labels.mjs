/**
 * @module apps/bench/lib/anatomy-labels.mjs
 * @purpose Label distinct blind builder texts through an injected capped runner with durable private resume.
 * @inputs Segmented contexts, guarded private output folder, injected runner, optional caps and counts-only stdout.
 * @outputs Private manifest and appended key/id/label rows; counts-only progress and spend lines.
 * @effects disk (private label store); network (only through injected runner)
 * @errors Fixed fingerprint diagnostics or filesystem errors propagate to the CLI's sanitized boundary; bad calls reject batches.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { normalize } from "./anatomy-measures.mjs";
import { seededSample } from "./catch-stats.mjs";
import { readJsonl } from "./plan.mjs";
import { FUNCTIONS, LABEL_BATCH_CHARS, LABEL_BATCH_UNITS, LABEL_EFFORT, LABEL_FAIL_STREAK, LABEL_FILE, LABEL_MANIFEST_FILE, LABEL_MODEL, LABEL_ORDER_SEED, LABEL_PROGRESS_EVERY, LABEL_SYSTEM_PROMPT, LABEL_TOKEN_CAP, LABEL_UNKNOWN_CHARGE, NORMAL_TOKENS, OVERSIZE_UNIT_CHARS } from "./anatomy-config.mjs";

const sha256 = (text) => crypto.createHash("sha256").update(text).digest("hex");
const vocabulary = [...FUNCTIONS, "unsorted"];
const jsonl = (rows) => rows.map((row) => JSON.stringify(row) + "\n").join("");
const schema = { type: "object", additionalProperties: false, required: ["units"], properties: { units: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "label"], properties: { id: { type: "string" }, label: { enum: vocabulary } } } } } };
function validate(text, size) {
 if (typeof text !== "string") return null;
 const trimmed = text.trim(), fence = /^```(?:json)?\s*\n([\s\S]*?)\n```$/u.exec(trimmed);
 let rows;
 try { rows = JSON.parse(fence ? fence[1] : trimmed)?.units; } catch { return null; }
 if (!Array.isArray(rows) || rows.length !== size) return null;
 const found = new Map();
 for (const row of rows) {
  if (!row || typeof row !== "object" || Object.keys(row).sort().join() !== "id,label" || !vocabulary.includes(row.label) || found.has(row.id)) return null;
  found.set(row.id, row.label);
 }
 const labels = Array.from({ length: size }, (_, i) => found.get(`u${i + 1}`));
 return labels.every((label) => label !== undefined) ? labels : null;
}
/** Keys stay private; only the representative's cwd and branch are replaced in sent text. */
export function distinctUnits(contexts) {
 const units = new Map();
 for (const c of contexts) for (const p of c.parts) for (const s of p.spans) {
  if (s.kind !== "unit" || s.text.length > OVERSIZE_UNIT_CHARS) continue;
  const key = sha256(normalize(s.text, c));
  let text = s.text;
  if (c.cwd) text = text.split(c.cwd).join(NORMAL_TOKENS.cwd);
  if (c.branch) text = text.split(c.branch).join(NORMAL_TOKENS.branch);
  if (!units.has(key)) units.set(key, { key, id: s.id, text });
 }
 return units;
}
function regularFile(file) {
 if (!fs.lstatSync(file).isFile()) throw new Error("invalid label file");
 if (process.platform !== "win32") fs.chmodSync(file, 0o600);
}
/** The caller guards the folder before reading input or invoking any runner. */
export async function labelContexts(contexts, { out, resume = false, runModel, caps, stdout }) {
 if (typeof runModel !== "function") throw new Error("runner required");
 const tokenCap = caps?.tokens ?? LABEL_TOKEN_CAP;
 if (!Number.isFinite(tokenCap) || tokenCap < 0) throw new Error("invalid cap");
 const units = distinctUnits(contexts), promptSha256 = sha256(LABEL_SYSTEM_PROMPT);
 const manifest = { model: LABEL_MODEL, effort: LABEL_EFFORT, promptSha256, orderSeed: LABEL_ORDER_SEED, contexts: contexts.length, distinctUnits: units.size };
 const file = path.join(out, LABEL_FILE), manifestFile = path.join(out, LABEL_MANIFEST_FILE);
 const done = new Set();
 let fd;
 try {
  if (resume) {
   regularFile(manifestFile); regularFile(file);
   const previous = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
   if (["model", "effort", "promptSha256", "orderSeed"].some((field) => previous[field] !== manifest[field])) {
    const error = new Error("label fingerprint mismatch"); error.code = "LABEL_FINGERPRINT"; throw error;
   }
   // Reuse the bench's complete-row/torn-tail reader. Rewrite only to repair the
   // append boundary; no quarantine file with a weaker mode is created.
   const { rows } = await readJsonl(file, { repair: false });
   for (const row of rows) {
    if (!row || !/^[a-f0-9]{64}$/u.test(row.key) || typeof row.id !== "string" || !vocabulary.includes(row.label) || done.has(row.key)) throw new Error("invalid stored labels");
    done.add(row.key);
   }
   const clean = jsonl(rows);
   if (fs.readFileSync(file, "utf8") !== clean) fs.writeFileSync(file, clean, { mode: 0o600 });
   fd = fs.openSync(file, "a", 0o600);
  } else {
   fs.writeFileSync(manifestFile, JSON.stringify(manifest) + "\n", { flag: "wx", mode: 0o600 });
   fd = fs.openSync(file, "wx", 0o600);
  }
  const queue = seededSample([...units.keys()].filter((key) => !done.has(key)), units.size, LABEL_ORDER_SEED, { seedOrder: true }).map((key) => units.get(key));
  const counts = { distinct: units.size, labelled: [...units.keys()].filter((key) => done.has(key)).length, calls: 0, tokens: 0, charged: 0, unknownUsage: 0, cost: 0, unclassified: 0, unsent: 0 };
  let unknownCost = false, streak = 0;
  for (let start = 0; start < queue.length;) {
   if (counts.charged >= tokenCap || streak >= LABEL_FAIL_STREAK) { counts.unsent = queue.length - start; break; }
   let end = start, chars = 0;
   while (end < queue.length && end - start < LABEL_BATCH_UNITS && chars + queue[end].text.length <= LABEL_BATCH_CHARS) { chars += queue[end].text.length; end++; }
   if (end === start) throw new Error("unit exceeds batch cap");
   const batch = queue.slice(start, end); start = end;
   counts.calls++;
   let result;
   try { result = await runModel({ system: LABEL_SYSTEM_PROMPT, prompt: JSON.stringify(batch.map((u, i) => ({ id: `u${i + 1}`, text: u.text }))), schema }); } catch { result = null; }
   const usage = result?.usage;
   if (usage && Number.isFinite(usage.tokens) && usage.tokens >= 0) {
    counts.tokens += usage.tokens; counts.charged += usage.tokens;
    if (Number.isFinite(usage.cost) && usage.cost >= 0 && !(usage.tokens > 0 && usage.cost === 0)) counts.cost += usage.cost;
    else unknownCost = true;
   } else { counts.charged += LABEL_UNKNOWN_CHARGE; counts.unknownUsage++; unknownCost = true; }
   const labels = result?.ok ? validate(result.text, batch.length) : null;
   if (labels) {
    const rows = batch.map((u, i) => ({ key: u.key, id: u.id, label: labels[i] }));
    fs.writeSync(fd, jsonl(rows)); fs.fsyncSync(fd);
    counts.labelled += rows.length; streak = 0;
   } else { counts.unclassified += batch.length; streak++; }
   if (counts.calls % LABEL_PROGRESS_EVERY === 0) stdout(`progress calls ${counts.calls} labelled ${counts.labelled} unclassified ${counts.unclassified} tokens ${counts.unknownUsage ? ">= " : ""}${counts.tokens}\n`);
  }
  stdout(`distinct units ${counts.distinct}\nlabelled ${counts.labelled}\ncalls ${counts.calls}\ntokens ${counts.unknownUsage ? ">= " : ""}${counts.tokens}\ncharged tokens ${counts.charged}\ncost ${unknownCost ? "unknown" : counts.cost}\nunclassified ${counts.unclassified}\nunsent ${counts.unsent}\nmodel ${LABEL_MODEL}\nprompt sha256 ${promptSha256}\n`);
  return counts;
 } finally { if (fd !== undefined) fs.closeSync(fd); }
}
