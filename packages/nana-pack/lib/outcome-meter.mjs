/**
 * @module packages/nana-pack/lib/outcome-meter.mjs
 * @purpose Measure repeat memory outcomes and logged context in owner-interaction windows.
 * @inputs Injected transcript roots, candidates, bounded load log, judge and output sinks.
 * @outputs Private pointer-only item/window rows and counts-only measurement lines.
 * @effects disk (one transcript pass, explicit files and exclusive private output); network (injected judge only)
 * @errors Boundary failures throw; command errors return fixed diagnostics; bad calls fail closed.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { assistantText, privateFolder } from "./claude-transcript.mjs";
import { defaultMemoryRepo, memoryArgs, transcriptUnits } from "./memory-making.mjs";
import { CANDIDATE_FIELDS, PRIVATE_REFUSAL, QUESTION_PATTERN } from "./memory-making-config.mjs";
import { addUsage, costTotal, emptyUsage, totalTokens } from "./pi-usage.mjs";
import { CONTEXT_LOAD_FILE } from "./context-load-log.mjs";
import { piAgentDir } from "./agent-dir.mjs";
import { readRecordLedger } from "./record-ledger.mjs";
import * as C from "./outcome-meter-config.mjs";

const kinds = ["correction", "decision"];
const normalise = text => text.toLowerCase().match(/[\p{L}\p{N}]+/gu)?.join(" ") ?? "";
const basePointer = evidence => evidence.split("+")[0];
const readJsonl = file => fs.readFileSync(file, "utf8").split(/\r\n|\r|\n/u).filter(line => line.trim()).map(line => JSON.parse(line));
// Standard normal CDF (Abramowitz-Stegun 26.2.17), then bisection; constants are mathematical, not tuning policy.
function normalQuantile(p) {
 const cdf = x => {
  const z = Math.abs(x), t = 1 / (1 + 0.2316419 * z);
  const tail = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI) * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x >= 0 ? 1 - tail : tail;
 };
 let low = -10, high = 10;
 for (let i = 0; i < 80; i++) { const middle = (low + high) / 2; if (cdf(middle) < p) low = middle; else high = middle; }
 return (low + high) / 2;
}
/** Two-sided Wilson interval, including the no-observation interval. */
export function wilson(hits, n) {
 if (!n) return [0, 1];
 const z = normalQuantile((1 + C.CONFIDENCE) / 2), z2 = z * z, p = hits / n, denominator = 1 + z2 / n;
 const centre = (p + z2 / (2 * n)) / denominator;
 const half = z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / denominator;
 return [Math.max(0, centre - half), Math.min(1, centre + half)];
}
/** Equal-arm two-proportion sample size, converted from items to interactions at observed item density. */
export function halvingExposure(repeats, items, interactions) {
 if (!repeats || !items || !interactions) return null;
 const p = repeats / items, q = p / 2, average = (p + q) / 2;
 const z = normalQuantile((1 + C.CONFIDENCE) / 2), power = normalQuantile(C.POWER);
 const n = (z * Math.sqrt(2 * average * (1 - average)) + power * Math.sqrt(p * (1 - p) + q * (1 - q))) ** 2 / (p - q) ** 2;
 return Math.ceil(n * interactions / items);
}
async function snapshot(options) {
 const entries = new Map(), starts = new Map(), owners = [], asks = [];
 let order = 0;
 const observe = (entry, { file }) => {
  const session = entry.sessionId ?? path.basename(file, ".jsonl"), at = Date.parse(entry.timestamp ?? entry.message?.timestamp);
  const sequence = order++;
  if (!Number.isFinite(at)) return;
  if (!starts.has(session)) starts.set(session, at);
  const text = assistantText(entry);
  if (entry.uuid) entries.set(`claude-code:${session}#${entry.uuid}`, { at, order: sequence, session, seat: entry.type === "assistant" && !entry.isSidechain && !entry.isMeta && !entry.isCompactSummary, prompted: new RegExp(QUESTION_PATTERN).test(text) });
 };
 for await (const unit of transcriptUnits(options, observe)) {
  if (unit.source === "owner" && unit.lastSeat) {
   const meta = entries.get(unit.evidence);
   if (meta) owners.push({ ...meta, evidence: unit.evidence, normal: normalise(unit.quote) });
  } else if (unit.source === "ask") asks.push(unit);
 }
 owners.sort((a, b) => a.at - b.at || a.order - b.order);
 const turns = new Map();
 owners.forEach((owner, i) => { owner.position = i + 1; turns.set(owner.evidence, owner); });
 const askPointers = new Map();
 for (const ask of asks) {
  const meta = entries.get(basePointer(ask.evidence)); if (!meta) continue;
  // A result is placed by instant, but never adds an interaction.
  let position = 0;
  for (const owner of owners) { if (owner.at > meta.at || (owner.at === meta.at && owner.order > meta.order)) break; position = owner.position; }
  if (position) askPointers.set(ask.evidence, { ...meta, position });
 }
 return { entries, starts, owners, turns, askPointers };
}
function validCandidates(candidates) {
 const seen = new Set(), accepted = [];
 for (const row of candidates) {
  if (!row || !["evidence", "kind", "date"].every(key => CANDIDATE_FIELDS.includes(key) && typeof row[key] === "string" && row[key].length)) throw new Error("invalid candidate");
  if (seen.has(row.evidence)) continue;
  seen.add(row.evidence);
  if (row.kind === "lesson") continue;
  if (!kinds.includes(row.kind) || typeof row.claim !== "string") throw new Error("invalid candidate");
  accepted.push(row);
 }
 return accepted;
}
function schema(kind) {
 return { type: "object", additionalProperties: false, required: ["matches"], properties: { matches: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "earlier", "relation"], properties: { id: { type: "string" }, earlier: { type: ["string", "null"] }, relation: { enum: kind === "correction" ? ["same", "none"] : ["same", "changed", "none"] } } } } } };
}
function validateReply(text, batch, earlier, eligible, kind) {
 if (typeof text !== "string") return null;
 const trimmed = text.trim(), fence = /^```(?:json)?\s*\n([\s\S]*?)\n```$/u.exec(trimmed);
 let parsed;
 try { parsed = JSON.parse(fence ? fence[1] : trimmed); } catch { return null; }
 if (!parsed || Object.keys(parsed).join(",") !== "matches" || !Array.isArray(parsed.matches) || parsed.matches.length !== batch.length) return null;
 const found = new Map();
 for (const row of parsed.matches) {
  if (!row || Object.keys(row).sort().join(",") !== "earlier,id,relation" || found.has(row.id)) return null;
  const index = batch.findIndex((_, i) => row.id === `u${i + 1}`); if (index < 0) return null;
  if (row.earlier === null) { if (row.relation !== "none") return null; }
  else {
   if (typeof row.earlier !== "string") return null;
   const match = /^e([1-9]\d*)$/u.exec(row.earlier), prior = match && earlier[Number(match[1]) - 1];
   if (!prior || !eligible(batch[index]).includes(prior) || !(kind === "correction" ? ["same"] : ["same", "changed"]).includes(row.relation)) return null;
  }
  found.set(row.id, row);
 }
 return batch.map((_, i) => found.get(`u${i + 1}`));
}
function loadContext(windows, file, tempRoot) {
 const accepts = row => row?.v === 1 && typeof row.role === "string" && typeof row.launcher === "string" && typeof row.at === "string" && Number.isFinite(Date.parse(row.at)) && Array.isArray(row.parts) && row.parts.every(part => typeof part?.name === "string" && Number.isFinite(part.deliveredChars) && part.deliveredChars >= 0);
 const log = readRecordLedger(file, { maxBytes: C.LOAD_LOG_CAP, accepts });
 let tests = 0, outside = 0;
 // Unknown names remain distinct, but never expose arbitrary log strings in output.
 const aliases = names => {
  const unknown = new Map();
  return value => { if (names.includes(value)) return value; if (!unknown.has(value)) unknown.set(value, `other-${unknown.size + 1}`); return unknown.get(value); };
 };
 const safeRole = aliases(C.WORDS.roles), safeLauncher = aliases(C.WORDS.launchers), safePart = aliases(C.WORDS.parts);
 const underTemp = cwd => {
  if (typeof cwd !== "string" || !path.isAbsolute(cwd)) return false;
  let resolved = path.resolve(cwd); try { resolved = fs.realpathSync(resolved); } catch { /* lexical fallback */ }
  const relative = path.relative(tempRoot, resolved); return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
 };
 for (const row of log.records) {
  if (underTemp(row.cwd)) { tests++; continue; }
  const at = Date.parse(row.at), window = windows.find(w => at >= w.start && (w.end === null || at < w.end));
  if (!window) { outside++; continue; }
  const role = safeRole(row.role), launcher = safeLauncher(row.launcher), key = `${role} ${launcher}`;
  let group = window.context.find(g => g.key === key);
  if (!group) { group = { key, role, launcher, totals: [], parts: {} }; window.context.push(group); }
  group.totals.push(row.parts.reduce((sum, part) => sum + part.deliveredChars, 0));
  // Each part is measured once per load, including repeated part names.
  const parts = new Map();
  for (const part of row.parts) { const name = safePart(part.name); parts.set(name, (parts.get(name) ?? 0) + part.deliveredChars); }
  for (const [name, chars] of parts) (group.parts[name] ??= []).push(chars);
 }
 const describe = values => {
  const sorted = [...values].sort((a, b) => a - b), n = sorted.length;
  return n < C.MIN_LOADS ? `${C.WORDS.fewLoads} ${n}` : `loads ${n} median ${(sorted[Math.floor((n - 1) / 2)] + sorted[Math.ceil((n - 1) / 2)]) / 2} p90 ${sorted[Math.ceil(n * 0.9) - 1]} max ${sorted.at(-1)}`;
 };
 const lines = [];
 for (const w of windows) for (const group of w.context.sort((a, b) => a.key.localeCompare(b.key))) {
  lines.push(`${w.window} context ${group.key} ${describe(group.totals)}`);
  for (const name of Object.keys(group.parts).sort()) lines.push(`${w.window} context ${group.key} part ${name} ${describe(group.parts[name])}`);
 }
 if (!fs.existsSync(file)) lines.push(C.WORDS.noLog);
 lines.push(`${C.WORDS.testLoads} ${tests}`, `${C.WORDS.outside} ${outside}`, `bad load lines ${log.badLines}`);
 return lines;
}
/** No resource defaults are selected here except the OS temp classification root; callers inject private inputs. */
export async function measureOutcomes(options) {
 const candidates = validCandidates(options.candidates);
 const snap = await snapshot(options), { owners, turns, entries, starts, askPointers } = snap;
 const windows = [];
 const addWindow = (start, end, warmUp, partial) => {
  const slice = owners.slice(start, end);
  windows.push({ type: "window", window: windows.length + 1, interactions: slice.length, warmUp, partial, start: slice[0].at, end: owners[end]?.at ?? null, pasted: slice.filter(owner => owners.some(prior => prior.position < owner.position && owner.position - prior.position <= C.LOOKBACK && prior.normal === owner.normal)).length, context: [], outcomes: {} });
 };
 if (owners.length) addWindow(0, Math.min(C.LOOKBACK, owners.length), true, false);
 for (let start = C.LOOKBACK; start < owners.length; start += C.WINDOW_SIZE) {
  const end = Math.min(start + C.WINDOW_SIZE, owners.length);
  addWindow(start, end, false, end - start < C.WINDOW_SIZE);
 }
 const counts = { skipped: 0, unresolved: 0, calls: 0, unknownUsage: 0 };
 const work = [];
 for (const candidate of candidates) {
  if (candidate.evidence.startsWith("seat:")) { counts.skipped++; continue; }
  const match = /^claude-code:([^#]+)#([^+]+)\+(.+)$/u.exec(candidate.evidence);
  const owner = match && (askPointers.get(candidate.evidence) ?? turns.get(basePointer(candidate.evidence)));
  const seat = match && entries.get(`claude-code:${match[1]}#${match[3]}`);
  if (!owner || !seat?.seat) { counts.unresolved++; continue; }
  const window = owner.position <= C.LOOKBACK ? 1 : Math.floor((owner.position - C.LOOKBACK - 1) / C.WINDOW_SIZE) + 2;
  const row = { type: "item", kind: candidate.kind, evidence: candidate.evidence, position: owner.position, window, repeatOf: null, relation: "new", how: "local", prompted: candidate.kind === "decision" ? askPointers.has(candidate.evidence) || seat.prompted : null };
  work.push({ row, session: match[1], at: owner.at, order: owner.order, claim: candidate.claim, normal: normalise(candidate.claim) });
 }
 work.sort((a, b) => a.at - b.at || a.order - b.order);
 const eligible = item => work.filter(prior => prior.row.kind === item.row.kind && prior.row.position < item.row.position && item.row.position - prior.row.position <= C.LOOKBACK && prior.session !== item.session);
 const apply = (item, prior, relation, how) => {
  item.row.how = how;
  if (prior.at >= starts.get(item.session)) item.row.relation = C.WORDS.parallel;
  else if (relation === "changed") item.row.relation = C.WORDS.changed;
  else { item.row.relation = "same"; item.row.repeatOf = prior.row.evidence; }
 };
 const pending = [];
 for (const item of work) {
  if (item.row.kind === "decision" && !item.row.prompted) { item.row.relation = C.WORDS.unprompted; continue; }
  const earlier = eligible(item);
  // Prefer a deliverable exact match to a parallel one, but show parallel when that is all there is.
  const exact = earlier.filter(prior => prior.normal === item.normal).sort((a, b) => Number(a.at >= starts.get(item.session)) - Number(b.at >= starts.get(item.session)))[0];
  if (exact) apply(item, exact, "same", "exact");
  else if (earlier.length) pending.push(item);
 }
 const spend = emptyUsage(); let unknownCost = false, capped = false;
 for (let i = 0; i < pending.length;) {
  const first = pending[i], batch = [];
  while (i < pending.length && batch.length < C.BATCH_SIZE && pending[i].row.kind === first.row.kind && pending[i].row.window === first.row.window) batch.push(pending[i++]);
  if (totalTokens(spend) >= C.TOKEN_CAP) { capped = true; for (const item of batch) item.row.relation = C.WORDS.unjudged; continue; }
  const earlier = work.filter(prior => batch.some(item => eligible(item).includes(prior)));
  const input = { kind: first.row.kind, items: batch.map((item, n) => ({ id: `u${n + 1}`, claim: item.claim.slice(0, C.CLAIM_CAP), earlier: earlier.flatMap((prior, e) => eligible(item).includes(prior) ? [`e${e + 1}`] : []) })), earlier: earlier.map((item, n) => ({ id: `e${n + 1}`, claim: item.claim.slice(0, C.CLAIM_CAP) })) };
  let result; counts.calls++;
  try { result = await options.runModel({ system: C.SYSTEM_PROMPT, prompt: JSON.stringify(input), schema: schema(first.row.kind) }); } catch { result = null; }
  const usage = result?.usage;
  if (!usage || !Number.isFinite(usage.tokens) || usage.tokens < 0) { counts.unknownUsage++; unknownCost = true; }
  else {
   const priced = Number.isFinite(usage.cost) && usage.cost >= 0;
   addUsage(spend, { totalTokens: usage.tokens, cost: { total: priced ? usage.cost : 0 } });
   if (!priced || (usage.tokens > 0 && usage.cost === 0)) unknownCost = true;
  }
  const reply = result?.ok ? validateReply(result.text, batch, earlier, eligible, first.row.kind) : null;
  if (!reply) { for (const item of batch) { item.row.relation = C.WORDS.unjudged; item.row.how = "judge"; } continue; }
  reply.forEach((answer, n) => { batch[n].row.how = "judge"; if (answer.earlier !== null) apply(batch[n], earlier[Number(answer.earlier.slice(1)) - 1], answer.relation, "judge"); });
 }
 const rows = work.map(item => item.row), lines = [`interactions ${owners.length}`];
 for (const w of windows) {
  if (w.warmUp) lines.push(`${w.window} ${C.WORDS.warmUp}`);
  if (w.partial) lines.push(`${w.window} ${C.WORDS.partial}`);
  for (const kind of kinds) {
   const subset = rows.filter(row => row.window === w.window && row.kind === kind);
   const c = { items: subset.length, repeats: subset.filter(row => row.repeatOf !== null).length, exact: subset.filter(row => row.how === "exact").length, parallel: subset.filter(row => row.relation === C.WORDS.parallel).length, unjudged: subset.filter(row => row.relation === C.WORDS.unjudged).length, changed: subset.filter(row => row.relation === C.WORDS.changed).length, unprompted: subset.filter(row => row.relation === C.WORDS.unprompted).length };
   w.outcomes[kind] = c;
   lines.push(kind === "correction" ? `${w.window} corrections ${c.items} repeated ${c.repeats} exact ${c.exact} parallel ${c.parallel} unjudged ${c.unjudged}` : `${w.window} decisions ${c.items} asked again ${c.repeats} re-decided ${c.changed} unprompted ${c.unprompted} exact ${c.exact} parallel ${c.parallel} unjudged ${c.unjudged}`);
  }
  lines.push(`${w.window} ${C.WORDS.pasted} ${w.pasted}`);
 }
 const baseline = windows.filter(w => !w.warmUp && !w.partial), exposure = baseline.reduce((n, w) => n + w.interactions, 0);
 for (const kind of kinds) {
  const n = baseline.reduce((sum, w) => sum + w.outcomes[kind].items, 0), r = baseline.reduce((sum, w) => sum + w.outcomes[kind].repeats, 0);
  lines.push(`pooled ${kind} ${r}/${n} Wilson ${wilson(r, n).map(v => v.toFixed(4)).join(" ")} halving needs ${halvingExposure(r, n, exposure) ?? "unavailable"} interactions each side`);
 }
 lines.push(C.WORDS.windowNote, ...loadContext(windows, options.loadFile, fs.realpathSync(options.tempRoot ?? os.tmpdir())));
 lines.push(`skipped ${counts.skipped}`, `unresolved ${counts.unresolved}`, `calls ${counts.calls}`, `calls with unknown usage ${counts.unknownUsage}`, `tokens ${counts.unknownUsage ? ">= " : ""}${totalTokens(spend)}`, `cost ${unknownCost ? "unknown" : costTotal(spend)}`);
 if (capped) lines.push(C.WORDS.capReached);
 return { rows: [...rows, ...windows], windows, counts, lines };
}
/** Strict public boundary: no raw exceptions, claims, pointers, paths or replies reach either output sink. */
export async function runMeter(argv, { runModel, stdout = s => process.stdout.write(s), stderr = s => process.stderr.write(s), repoRoot = process.cwd(), loadFile = path.join(piAgentDir(), CONTEXT_LOAD_FILE) } = {}) {
 let fd;
 try {
  const args = memoryArgs(argv, ["repo", "root", "project", "candidates", "out", "load-log"]);
  if (!args.root || !args.candidates || !args.out) throw new Error("missing inputs");
  repoRoot = args.repo ? path.resolve(args.repo) : defaultMemoryRepo(repoRoot);
  const out = privateFolder(args.out, { allowAncestorSymlinks: true, refuseCheckout: true, refusal: PRIVATE_REFUSAL });
  // Validate every input row before making any model call.
  const candidates = validCandidates(readJsonl(args.candidates));
  fd = fs.openSync(path.join(out, C.OUTPUT_FILE), "wx", 0o600);
  const result = await measureOutcomes({ repoRoot, projectsRoot: args.root, project: args.project, candidates, runModel, loadFile: args["load-log"] ?? loadFile });
  for (const row of result.rows) fs.writeSync(fd, `${JSON.stringify(row)}\n`);
  for (const line of result.lines) stdout(`${line}\n`);
  return 0;
 } catch (error) { stderr(`${error.code === "OUTPUT_CHECKOUT" ? PRIVATE_REFUSAL : error.code === "ERR_TOO_LARGE" ? "memory: load log too large" : "memory: meter failed"}\n`); return 1; }
 finally { if (fd !== undefined) fs.closeSync(fd); }
}
