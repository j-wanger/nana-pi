/**
 * @module packages/nana-pack/lib/memory-shaping.mjs
 * @purpose Shape shared memory units with an injected capped classifier and private counts-only output.
 * @inputs Injected roots, optional day/instant window, runModel and output callbacks.
 * @outputs Shared candidate records, unit/spend counts and one private JSONL file.
 * @effects disk (shared unit walks and exclusive private output); network (only through injected runner)
 * @errors Invalid arguments or unsafe output return nonzero with fixed diagnostics; bad calls reject a batch.
 */
import fs from "node:fs";
import path from "node:path";
import { privateFolder } from "./claude-transcript.mjs";
import { defaultMemoryRepo, memoryArgs, reviewUnits, shape, transcriptUnits } from "./memory-making.mjs";
import { CLAIM_CAP, PRIVATE_REFUSAL } from "./memory-making-config.mjs";
import { addUsage, costTotal, emptyUsage, totalTokens } from "./pi-usage.mjs";
import { ALLOWED_KINDS, BATCH_SIZE, CONTEXT_CAP, OUTPUT_FILE, OWNER_CAP, PROMPT_LEAD, SYSTEM_PROMPT, TOKEN_CAP, WORDS } from "./memory-shaping-config.mjs";

function replySchema(source) {
 return { type: "object", additionalProperties: false, required: ["units"], properties: { units: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "kind", "claim"], properties: { id: { type: "string" }, kind: { enum: ALLOWED_KINDS[source] }, claim: { type: "string" } } } } } };
}
function validated(text, source, size) {
 if (typeof text !== "string") return null;
 const trimmed = text.trim();
 const fence = /^```(?:json)?\s*\n([\s\S]*?)\n```$/u.exec(trimmed);
 let rows;
 try { rows = JSON.parse(fence ? fence[1] : trimmed)?.units; } catch { return null; }
 if (!Array.isArray(rows) || rows.length !== size) return null;
 const found = new Map();
 for (const row of rows) {
  if (!row || typeof row !== "object" || Object.keys(row).sort().join(",") !== "claim,id,kind" || !ALLOWED_KINDS[source].includes(row.kind) || typeof row.claim !== "string" || (row.kind !== "none" && !row.claim.trim()) || found.has(row.id)) return null;
  found.set(row.id, row);
 }
 const ordered = Array.from({ length: size }, (_, i) => found.get(`u${i + 1}`));
 return ordered.every(Boolean) ? ordered : null;
}
const pairedSeat = (unit, kind) => kind === "decision" ? unit.question ?? unit.substantial ?? unit.lastSeat : unit.substantial ?? unit.question ?? unit.lastSeat;

/** Only runModel can spend; no labels or machine-specific roots are read here. */
export async function extractShaped(options) {
 const { runModel } = options;
 if (typeof runModel !== "function") throw new Error("runner required");
 const records = [], owners = [], reviews = [], seen = new Set();
 const counts = { ownerTurns: 0, skipped: 0, asks: 0, reviewTitles: 0, cutOwner: 0, cutContext: 0, cappedClaims: 0, calls: 0, unknownUsage: 0, unsent: 0, unclassified: 0 };
 const emit = (value) => { records.push(value.record); counts.cappedClaims += value.capped; };
 for await (const unit of transcriptUnits(options)) {
  if (seen.has(unit.evidence)) continue;
  seen.add(unit.evidence);
  if (unit.source === "ask") {
   counts.asks++;
   emit(shape("user", "decision", unit.quote, unit.context, unit.evidence, unit.date));
  } else {
   counts.ownerTurns++;
   if (!unit.lastSeat) { counts.skipped++; continue; }
   owners.push(unit);
  }
 }
 for (const unit of reviewUnits(options)) { counts.reviewTitles++; reviews.push(unit); }
 const spend = emptyUsage(); let unknownCost = false;
 for (const units of [owners, reviews]) {
  for (let start = 0; start < units.length; start += BATCH_SIZE) {
   const batch = units.slice(start, start + BATCH_SIZE);
   if (totalTokens(spend) >= TOKEN_CAP) { counts.unsent += batch.length; continue; }
   const source = batch[0].source;
   const input = batch.map((unit, i) => {
    const id = `u${i + 1}`;
    if (source === "review") return { id, title: unit.quote };
    const seat = pairedSeat(unit, "correction"), context = seat.context;
    counts.cutOwner += Number(unit.quote.length > OWNER_CAP); counts.cutContext += Number(context.length > CONTEXT_CAP);
    return { id, owner: unit.quote.slice(0, OWNER_CAP), context: context.slice(-CONTEXT_CAP), question: unit.question && unit.question.uuid !== seat.uuid ? unit.question.text.slice(-CONTEXT_CAP) : "" };
   });
   counts.calls++;
   let result;
   try { result = await runModel({ system: SYSTEM_PROMPT, prompt: PROMPT_LEAD + JSON.stringify(input), schema: replySchema(source) }); } catch { result = null; }
   const usage = result?.usage;
   if (!usage || !Number.isFinite(usage.tokens) || usage.tokens < 0) { counts.unknownUsage++; unknownCost = true; }
   else {
    const priced = Number.isFinite(usage.cost) && usage.cost >= 0;
    addUsage(spend, { totalTokens: usage.tokens, cost: { total: priced ? usage.cost : 0 } });
    if (!priced || (usage.tokens > 0 && usage.cost === 0)) unknownCost = true;
   }
   const rows = result?.ok ? validated(result.text, source, batch.length) : null;
   if (!rows) { counts.unclassified += batch.length; continue; }
   for (const [i, row] of rows.entries()) {
    if (row.kind === "none") continue;
    const unit = batch[i], seat = source === "owner" ? pairedSeat(unit, row.kind) : null;
    // Stored context uses the same seat entry as the pointer, retaining its ending at the shared record cap.
    const context = seat ? seat.context.slice(-CONTEXT_CAP).slice(-CLAIM_CAP) : "";
    emit(shape(source === "owner" ? "user" : "worker", row.kind, unit.quote, context, seat ? `${unit.evidence}+${seat.uuid}` : unit.evidence, unit.date, { claim: row.claim, context }));
   }
  }
 }
 return { records, counts, tokens: totalTokens(spend), cost: unknownCost ? null : costTotal(spend) };
}
/** Shared strict argv reader and private folder policy; no runner exception text escapes. */
export async function runShape(argv, { runModel, stdout = (s) => process.stdout.write(s), stderr = (s) => process.stderr.write(s), repoRoot = process.cwd(), projectsRoot = path.join(process.env.HOME ?? process.env.USERPROFILE ?? "~", ".claude", "projects") } = {}) {
 let fd;
 try {
  const args = memoryArgs(argv, ["repo", "root", "reviews", "project", "from", "to", "until", "out"]);
  if (!args.out) throw new Error("missing output");
  repoRoot = args.repo ? path.resolve(args.repo) : defaultMemoryRepo(repoRoot);
  for (const day of [args.from, args.to]) if (day && (!/^\d{4}-\d{2}-\d{2}$/u.test(day) || !Number.isFinite(Date.parse(day)))) throw new Error("invalid day");
  if (args.from && args.to && args.from > args.to) throw new Error("invalid window");
  if (args.until && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(args.until) || !Number.isFinite(Date.parse(args.until)))) throw new Error("invalid instant");
  const out = privateFolder(args.out, { allowAncestorSymlinks: true, refuseCheckout: true, refusal: PRIVATE_REFUSAL });
  fd = fs.openSync(path.join(out, OUTPUT_FILE), "wx", 0o600);
  const result = await extractShaped({ repoRoot, projectsRoot: args.root ?? projectsRoot, reviewsRoot: args.reviews ?? path.join(repoRoot, "docs", "reviews"), project: args.project, from: args.from, to: args.to, until: args.until, runModel });
  for (const record of result.records) fs.writeSync(fd, `${JSON.stringify(record)}\n`);
  const c = result.counts;
  for (const [word, count] of [["owner turns", c.ownerTurns], [WORDS.skipped, c.skipped], ["asks", c.asks], ["review titles", c.reviewTitles], ["cut owner", c.cutOwner], ["cut context", c.cutContext], ["capped claims", c.cappedClaims], ["calls", c.calls], ["calls with unknown usage", c.unknownUsage], [WORDS.unsent, c.unsent], [WORDS.unclassified, c.unclassified]]) stdout(`${word} ${count}\n`);
  stdout(`tokens ${c.unknownUsage ? ">= " : ""}${result.tokens}\n`);
  stdout(`cost ${result.cost === null ? "unknown" : result.cost}\n`);
  if (c.unsent) stdout(`${WORDS.capReached}\n`);
  return 0;
 } catch (error) { stderr(`${error.code === "OUTPUT_CHECKOUT" ? PRIVATE_REFUSAL : "memory: shape failed"}\n`); return 1; }
 finally { if (fd !== undefined) fs.closeSync(fd); }
}
