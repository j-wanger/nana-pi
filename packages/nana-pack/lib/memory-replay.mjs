/**
 * @module packages/nana-pack/lib/memory-replay.mjs
 * @purpose Plan, screen, run and decide paired private memory replays without exposing source text.
 * @inputs Frozen transcript roots, labels, candidates, explicit private outputs and injected models/clock/random.
 * @outputs Private hashed plans and run rows, blind sheets and counts-only decision lines.
 * @effects disk (explicit private outputs and disposable stores); network (injected isolated runners only)
 * @errors Library validation throws fixed errors; command failures return 1 with fixed diagnostics.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { entriesIn, privateFolder } from './claude-transcript.mjs';
import { defaultMemoryRepo, memoryArgs, resolveEvidence, shape, sourceFiles, transcriptUnits } from './memory-making.mjs';
import { CANDIDATE_FIELDS, PRIVATE_REFUSAL, QUESTION_PATTERN } from './memory-making-config.mjs';
import { mergeMemory, readMemoryStore } from './memory-store.mjs';
import { normalizeProfileText } from './profile-store.mjs';
import { readOutcomeRows } from './outcome-score.mjs';
import { wilson } from './outcome-meter.mjs';
import { CLAIM_CAP } from './outcome-meter-config.mjs';
import { addUsage, costTotal, emptyUsage, totalTokens } from './pi-usage.mjs';
import { rebuildContext, renderReplayEntry, withMemorySlot } from './memory-replay-context.mjs';
import * as C from './memory-replay-config.mjs';

const W = C.WORDS;
const hash = value => crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const pointerParts = pointer => /^claude-code:([^#]+)#([^+]+)\+(.+)$/u.exec(pointer);
const seals = () => ({ ...C });
const jsonl = rows => rows.map(row => JSON.stringify(row) + '\n').join('');
const writePrivate = (dir, file, text) => fs.writeFileSync(path.join(dir, file), text, { flag: 'wx', mode: 0o600 });
function outputFolder(dir, empty = false) {
 const out = privateFolder(dir, { allowAncestorSymlinks: true, refuseCheckout: true, refusal: PRIVATE_REFUSAL });
 if (empty && fs.readdirSync(out).length) throw Error('output occupied');
 return out;
}
function frozenRoot(root) {
 const real = fs.realpathSync(root);
 const live = [path.join(os.homedir(), '.claude', 'projects'), ...(process.env.CLAUDE_CONFIG_DIR ? [path.join(process.env.CLAUDE_CONFIG_DIR, 'projects')] : [])].map(dir => { try { return fs.realpathSync(dir); } catch { return path.resolve(dir); } });
 for (let current = real; ; current = path.dirname(current)) {
  if (live.some(dir => path.resolve(dir) === current) || (path.basename(current) === 'projects' && path.basename(path.dirname(current)) === '.claude')) throw Error('frozen snapshot required');
  if (path.dirname(current) === current) break;
 }
 return real;
}
/** Collect the full stored entries and owner/ask eligibility in the maker's single unit walk. */
async function recordedSnapshot(roots) {
 const sessions = new Map(), owners = new Set();
 const files = sourceFiles(roots).map(({ file }) => ({ file: path.relative(roots.projectsRoot, file), bytes: fs.statSync(file).size }));
 for await (const unit of transcriptUnits(roots, (entry, { file }) => {
  const id = entry.sessionId ?? path.basename(file, '.jsonl');
  if (!sessions.has(id)) sessions.set(id, { entries: [], start: null });
  const session = sessions.get(id), at = Date.parse(entry.timestamp ?? entry.message?.timestamp);
  if (session.start === null && Number.isFinite(at)) session.start = at;
  session.entries.push(entry);
 })) {
  if (unit.source === 'owner') owners.add(unit.evidence);
 }
 const resolved = new Map();
 const evidence = async pointer => {
  if (resolved.has(pointer)) return resolved.get(pointer);
  const parts = pointerParts(pointer), session = parts && sessions.get(parts[1]);
  const ownerIndex = session?.entries.findIndex(entry => entry.uuid === parts[2]);
  const seatIndex = session?.entries.findIndex(entry => entry.uuid === parts[3]);
  let value = null;
  if (session && ownerIndex >= 0 && seatIndex >= 0) {
   const owner = session.entries[ownerIndex], seat = session.entries[seatIndex];
   const at = Date.parse(owner.timestamp ?? owner.message?.timestamp);
   const text = await resolveEvidence(pointer, roots);
   if (text.status === 'resolved' && Number.isFinite(at) && seat.type === 'assistant' && !seat.isSidechain && !seat.isMeta && !seat.isCompactSummary && seatIndex < ownerIndex) value = { ...text, session: parts[1], start: session.start, at, ownerIndex, seatIndex, entries: session.entries, prompted: (seat.message?.content ?? []).some?.(p => p?.type === 'tool_use' && p.name === 'AskUserQuestion') || new RegExp(QUESTION_PATTERN).test(renderReplayEntry(seat)) };
  }
  resolved.set(pointer, value); return value;
 };
 return { sessions, owners, files, evidence };
}
function caseSetHash(plan) {
 return hash({ pointers: plan.cases.map(c => [c.evidence, c.stratum]).sort((a, b) => a[0].localeCompare(b[0])), seed: plan.seed, order: plan.cases.map(c => c.id), screen: plan.screen, seals: plan.seals, files: plan.files });
}
async function defaultBundle(rows, { tempRoot = os.tmpdir(), repository, onStore }) {
 const store = outputFolder(path.join(tempRoot, `replay-store-${crypto.randomUUID()}`));
 try {
  for (const { record, at } of rows) mergeMemory(store, record, { repository, now: () => new Date(at) });
  const instants = new Map(rows.map(r => [r.record.evidence, r.at]));
  const records = readMemoryStore(store).filter(r => r.live).sort((a, b) => instants.get(b.evidence) - instants.get(a.evidence) || a.evidence.localeCompare(b.evidence));
  onStore?.(store);
  return { text: records.map(r => r.claim).join('\n').slice(0, C.BUNDLE_BUDGET), records };
 } finally { fs.rmSync(store, { recursive: true, force: true }); }
}
/** Selection and assembly spend nothing. Every delivery maker receives the identical pre-cut candidate list. */
export async function buildReplayPlan(options) {
 const roots = { repoRoot: options.repoRoot, projectsRoot: frozenRoot(options.projectsRoot), reviewsRoot: options.reviewsRoot ?? path.join(options.repoRoot, 'docs', 'reviews'), project: options.project };
 const seed = String(options.seed ?? ''); if (!seed) throw Error('seed required');
 const labels = readOutcomeRows(options.labels, true), snap = await recordedSnapshot(roots);
 const candidates = options.candidates ?? [];
 for (const candidate of candidates) if (!candidate || !['id', 'claim', 'evidence'].every(key => CANDIDATE_FIELDS.includes(key) && typeof candidate[key] === 'string' && candidate[key])) throw Error('invalid candidate');
 const skips = Object.fromEntries([W.changed, W.invalid, W.unresolved, W.noContext, W.late].map(word => [word, 0]));
 const cases = [], prepared = [];
 for (const record of candidates) { const source = await snap.evidence(record.evidence); if (source) prepared.push({ record, at: source.at, start: source.start }); }
 prepared.sort((a, b) => a.at - b.at || a.record.evidence.localeCompare(b.record.evidence));
 const bundleCache = new Map();
 for (const label of labels) {
  if (!['correction', 'decision'].includes(label.kind)) continue;
  if (!label.valid) { skips[W.invalid]++; continue; }
  if (label.relation === 'changed') { skips[W.changed]++; continue; }
  const source = await snap.evidence(label.evidence);
  if (!source) { skips[W.unresolved]++; continue; }
  const priors = [];
  if (label.relation === 'same') for (const pointer of label.repeatOf) {
   const prior = await snap.evidence(pointer);
   if (prior && prior.session !== source.session && prior.start < source.start) priors.push({ pointer, ...prior });
  }
  const earlier = priors.filter(prior => prior.at < source.start).sort((a, b) => b.at - a.at || a.pointer.localeCompare(b.pointer))[0];
  if (label.kind === 'decision' && (!source.prompted || !earlier)) continue;
  let point = source.seatIndex - 1;
  while (point >= 0 && !snap.owners.has(`claude-code:${source.session}#${source.entries[point].uuid}`)) point--;
  if (point < 0) { skips[W.unresolved]++; continue; }
  const context = rebuildContext(source.entries, point);
  if (!context.recorded) { skips[W.noContext]++; continue; }
  if (!earlier && priors.some(prior => prior.at >= source.start && prior.at < source.at)) skips[W.late]++;
  const mistake = shape('user', label.kind, source.texts[0], source.texts[1], label.evidence, new Date(source.at).toISOString().slice(0, 10)).record;
  const description = mistake.claim.slice(0, CLAIM_CAP);
  const cut = source.start;
  if (!bundleCache.has(cut)) {
   const past = prepared.filter(candidate => candidate.at < cut && candidate.start < cut);
   const bundle = options.maker ? { text: await options.maker(past.map(c => c.record)), records: [] } : await defaultBundle(past, { tempRoot: options.tempRoot, repository: hash(roots.repoRoot), onStore: options.onStore });
   if (typeof bundle.text !== 'string') throw Error('invalid bundle');
   bundleCache.set(cut, { text: bundle.text.slice(0, C.BUNDLE_BUDGET), records: bundle.records });
  }
  const bundle = bundleCache.get(cut), quote = normalizeProfileText(mistake.quote.slice(0, CLAIM_CAP));
  const leaked = quote && normalizeProfileText(bundle.text).includes(quote);
  const oracleArm = earlier ? W.oracle : C.CEILING_ENABLED ? W.ceiling : null;
  const oracle = earlier ? shape('user', label.kind, earlier.texts[0], earlier.texts[1], earlier.pointer, new Date(earlier.at).toISOString().slice(0, 10)).record.claim.slice(0, CLAIM_CAP) : description;
  const original = source.entries.slice(point + 1, source.ownerIndex).filter(e => e.type === 'assistant').map(renderReplayEntry).filter(Boolean).join('\n').slice(0, C.REPLY_CAP);
  cases.push({ id: hash(label.evidence), evidence: label.evidence, session: source.session, stratum: earlier ? 'R' : 'F', kind: label.kind, cut, context, description, original, bundle: bundle.text, bundleRecords: bundle.records, oracle, oracleArm, status: leaked ? W.leaked : 'planned' });
 }
 const strata = ['R', 'F'].map(stratum => cases.filter(c => c.stratum === stratum).sort((a, b) => hash(`${seed}:${a.id}`).localeCompare(hash(`${seed}:${b.id}`))));
 const order = []; while (strata.some(s => s.length)) for (const stratum of strata) if (stratum.length) order.push(stratum.shift());
 if (options.maker && !options.makerHash) throw Error('maker hash required');
 const plan = { seed, cases: order, files: snap.files, seals: seals(), screen: { draws: C.SCREEN_DRAWS, minRepeats: C.SCREEN_MIN_REPEATS, applied: false }, bundleMaker: options.makerHash ?? hash([defaultBundle.toString(), mergeMemory.toString(), readMemoryStore.toString()]), candidatesHash: hash(candidates) };
 plan.hash = caseSetHash(plan);
 plan.lines = [`cases ${cases.length} R ${cases.filter(c => c.stratum === 'R').length} F ${cases.filter(c => c.stratum === 'F').length}`, ...Object.entries(skips).map(([word, count]) => `${word} ${count}`), `sessions ${new Set(cases.map(c => c.session)).size}`, `case set ${plan.hash}`];
 return plan;
}
function parsedReply(result) {
 if (!result?.ok || typeof result.text !== 'string') return null;
 let text = result.text.trim();
 if (text.startsWith('```')) {
  const lines = text.split(/\r?\n/u);
  if (!['```', '```json'].includes(lines.shift()) || lines.pop() !== '```') return null;
  text = lines.join('\n');
 }
 try { return JSON.parse(text); } catch { return null; }
}
const verdicts = ['repeats', 'avoids', W.stalls, W.unclear];
const replaySchema = () => ({ type: 'object', additionalProperties: false, required: ['reply'], properties: { reply: { type: 'string', minLength: 1, maxLength: C.REPLY_CAP } } });
const judgeSchema = () => ({ type: 'object', additionalProperties: false, required: ['id', 'verdict'], properties: { id: { const: 'r1' }, verdict: { enum: verdicts } } });
function spendMeter() {
 const usage = emptyUsage(); let calls = 0, unknownUsage = 0, unknownCost = false, boundaryCost = 0;
 return {
  async call(runner, input, budgetUsd) {
   calls++; let result; try { result = await runner({ ...input, budgetUsd }); } catch { result = null; }
   const value = result?.usage;
   if (!value || !Number.isFinite(value.tokens) || value.tokens < 0) { unknownUsage++; unknownCost = true; boundaryCost += budgetUsd; }
   else {
    const priced = Number.isFinite(value.cost) && value.cost >= 0 && (value.cost > 0 || value.tokens === 0);
    addUsage(usage, { totalTokens: value.tokens, cost: { total: priced ? value.cost : 0 } });
    boundaryCost += priced ? value.cost : budgetUsd;
    if (!priced) unknownCost = true;
   }
   return result;
  },
  reached: cap => boundaryCost >= cap,
  lines: () => [`calls ${calls}`, `calls with unknown usage ${unknownUsage}`, `tokens ${unknownUsage ? '>= ' : ''}${totalTokens(usage)}`, `cost ${unknownCost ? 'unknown' : costTotal(usage)}`],
 };
}
async function drawReply(context, slot, meter, runReplay) {
 const answer = parsedReply(await meter.call(runReplay, { system: C.REPLAY_PREAMBLE, prompt: withMemorySlot(context, slot).text, schema: replaySchema() }, C.REPLAY_DOLLARS));
 return answer && Object.keys(answer).join() === 'reply' && typeof answer.reply === 'string' && answer.reply.trim() && answer.reply.length <= C.REPLY_CAP ? answer.reply : null;
}
async function judgeReply(description, reply, meter, runJudge) {
 if (typeof reply !== 'string' || !reply.trim()) return null;
 const answer = parsedReply(await meter.call(runJudge, { system: C.JUDGE_PROMPT, prompt: JSON.stringify({ description, id: 'r1', reply: reply.slice(0, C.REPLY_CAP) }), schema: judgeSchema() }, C.JUDGE_DOLLARS));
 return answer && Object.keys(answer).sort().join() === 'id,verdict' && answer.id === 'r1' && verdicts.includes(answer.verdict) ? answer.verdict : null;
}
function checkedPlan(plan, expect) {
 if (expect !== plan.hash || caseSetHash(plan) !== plan.hash || hash(plan.seals) !== hash(seals())) throw Error('plan hash mismatch');
}
/** Calls stay case-local: all replay arms first, all isolated judges second; caps apply between cases. */
export async function executeReplay(plan, options) {
 checkedPlan(plan, options.expect ?? plan.hash);
 const draws = options.draws ?? C.DRAWS;
 if (!Number.isSafeInteger(draws) || draws < 1) throw Error('invalid draws');
 const runId = options.runId ?? crypto.randomUUID(), started = (options.now ?? (() => new Date()))().toISOString();
 const header = { type: 'run', runId, started, caseSet: plan.hash, bundleMaker: plan.bundleMaker, preambleHash: C.PREAMBLE_HASH, judgeHash: C.JUDGE_HASH, draws, planned: plan.cases.length, plannedCases: plan.cases.map(c => ({ id: c.id, session: c.session, stratum: c.stratum, kind: c.kind })), candidatesHash: plan.candidatesHash };
 const rows = [], emit = row => { rows.push(row); options.onRow?.(row); }; emit(header);
 const meter = spendMeter();
 for (const c of plan.cases) {
  const row = { ...header, type: 'case', id: c.id, evidence: c.evidence, session: c.session, stratum: c.stratum, kind: c.kind, status: c.status, bundle: c.bundle, replies: {}, original: null };
  delete row.plannedCases;
  if (c.status === W.leaked) { emit(row); continue; }
  if (meter.reached(options.runCap ?? C.RUN_DOLLARS)) { row.status = W.unrun; emit(row); continue; }
  const arms = [['control', c.context.control], ['treatment', c.bundle], ...(c.oracleArm ? [[c.oracleArm, c.oracle]] : [])];
  for (const [arm, slot] of arms) {
   row.replies[arm] = [];
   for (let k = 0; k < draws; k++) row.replies[arm].push({ reply: await drawReply(c.context, slot, meter, options.runReplay), verdict: null });
  }
  for (const [arm] of arms) for (const draw of row.replies[arm]) draw.verdict = await judgeReply(c.description, draw.reply, meter, options.runJudge);
  row.original = await judgeReply(c.description, c.original, meter, options.runJudge);
  row.status = row.original !== 'repeats' ? W.judgeMiss : arms.some(([arm]) => row.replies[arm].filter(d => d.verdict && d.verdict !== W.unclear).length < Math.min(C.MIN_JUDGED, draws)) ? W.unjudged : 'complete';
  emit(row);
 }
 const lines = meter.lines(); emit({ type: 'spend', runId, caseSet: plan.hash, lines });
 return { rows, lines };
}
/** Screening changes the case set and never contributes any draw to a paired run. */
export async function screenReplay(plan, options) {
 checkedPlan(plan, options.expect ?? plan.hash);
 if (plan.screen.applied) throw Error('already screened');
 const meter = spendMeter(), kept = [], rows = [];
 for (const c of plan.cases) {
  if (c.status === W.leaked || meter.reached(options.runCap ?? C.RUN_DOLLARS)) { rows.push({ id: c.id, status: c.status === W.leaked ? W.leaked : W.unrun }); continue; }
  const replies = [];
  for (let k = 0; k < C.SCREEN_DRAWS; k++) replies.push({ reply: await drawReply(c.context, c.context.control, meter, options.runReplay), verdict: null });
  for (const draw of replies) draw.verdict = await judgeReply(c.description, draw.reply, meter, options.runJudge);
  const keep = replies.filter(d => d.verdict === 'repeats').length >= C.SCREEN_MIN_REPEATS;
  rows.push({ id: c.id, keep, replies }); if (keep) kept.push(c);
 }
 const screened = { ...plan, cases: kept, parentHash: plan.hash, screen: { ...plan.screen, applied: true } };
 screened.hash = caseSetHash(screened);
 screened.lines = [`cases ${kept.length} R ${kept.filter(c => c.stratum === 'R').length} F ${kept.filter(c => c.stratum === 'F').length}`, `case set ${screened.hash}`];
 return { plan: screened, rows, lines: [...screened.lines, ...meter.lines()] };
}
/** Exact sign-flip distribution over integer sums; zero differences add no information. */
export function signFlip(differences) {
 let probabilities = new Map([[0, 1]]);
 for (const d of differences.filter(Boolean)) {
  if (!Number.isSafeInteger(d)) throw Error('noninteger difference');
  const next = new Map();
  for (const [sum, p] of probabilities) for (const value of [sum - Math.abs(d), sum + Math.abs(d)]) next.set(value, (next.get(value) ?? 0) + p / 2);
  probabilities = next;
 }
 const observed = differences.reduce((n, d) => n + d, 0);
 return { fewer: [...probabilities].reduce((p, [sum, mass]) => p + (sum >= observed ? mass : 0), 0), more: [...probabilities].reduce((p, [sum, mass]) => p + (sum <= observed ? mass : 0), 0) };
}
function judged(draws) { return (draws ?? []).filter(d => d.verdict && d.verdict !== W.unclear); }
const repeats = draws => draws.filter(d => d.verdict === 'repeats').length;
const failures = draws => draws.filter(d => d.verdict === 'repeats' || d.verdict === W.stalls).length;
function classify(row, header) {
 if ([W.leaked, W.unrun].includes(row.status)) return row.status;
 if (row.original !== 'repeats') return W.judgeMiss;
 if (Object.values(row.replies).some(draws => judged(draws).length < Math.min(C.MIN_JUDGED, header.draws)) || !row.replies.control || !row.replies.treatment) return W.unjudged;
 return 'complete';
}
function measurement(rows) {
 const pairs = rows.map(row => ({ row, control: judged(row.replies.control), treatment: judged(row.replies.treatment) }));
 for (const pair of pairs) pair.d = repeats(pair.control) - failures(pair.treatment);
 return { pairs, differences: pairs.map(p => p.d), control: pairs.flatMap(p => p.control), treatment: pairs.flatMap(p => p.treatment) };
}
function statistic(name, rows, planned, min) {
 const data = measurement(rows), informative = data.differences.filter(Boolean), p = signFlip(informative);
 return { ...data, p, informative, lines: [`${name ? name + ' ' : ''}cases planned ${planned} informative ${informative.length} favour bundle ${informative.filter(d => d > 0).length} favour control ${informative.filter(d => d < 0).length}`, `${name || 'pooled'} p fewer ${p.fewer.toFixed(6)} level ${C.BENEFIT_LEVEL} p more ${p.more.toFixed(6)} level ${C.HARM_LEVEL}`], verdict: informative.length < min ? W.few : p.fewer <= C.BENEFIT_LEVEL ? W.fewer : p.more <= C.HARM_LEVEL ? W.more : W.noDecision };
}
const rate = (name, draws) => `${name} repeats ${repeats(draws)}/${draws.length} Wilson ${wilson(repeats(draws), draws.length).map(n => n.toFixed(4)).join(' ')}`;
function cites(reply, bundle) {
 const words = normalizeProfileText(bundle).split(' ').filter(Boolean), text = normalizeProfileText(reply ?? '');
 for (let i = 0; i + C.CITES_WORDS <= words.length; i++) if (text.includes(words.slice(i, i + C.CITES_WORDS).join(' '))) return true;
 return false;
}
/** Only these aggregate lines may print. All run rows, including replies and the sheet, stay private. */
export function decideReplay(rows, { caseSet, blindAgree, random = Math.random } = {}) {
 if (blindAgree !== undefined && (!Number.isSafeInteger(blindAgree) || blindAgree < 0 || blindAgree > C.BLIND_SIZE)) throw Error('invalid blind agreement');
 const headers = rows.filter(r => r.type === 'run' && r.caseSet === caseSet).sort((a, b) => a.started.localeCompare(b.started) || a.runId.localeCompare(b.runId));
 if (!headers.length || new Set(headers.map(r => r.runId)).size !== headers.length) throw Error('missing or duplicate runs');
 const lines = [`runs on this case set ${headers.length}`], makers = new Set(), sheetPool = [];
 for (const [index, header] of headers.entries()) {
  if (!Number.isSafeInteger(header.draws) || header.draws < 1 || !Number.isSafeInteger(header.planned) || header.planned < 0 || typeof header.bundleMaker !== 'string') throw Error('invalid run');
  const cases = rows.filter(r => r.type === 'case' && r.runId === header.runId);
  if (new Set(cases.map(c => c.id)).size !== cases.length || cases.length > header.planned) throw Error('invalid cases');
  for (const c of cases) {
   if (c.caseSet !== header.caseSet || c.bundleMaker !== header.bundleMaker || c.preambleHash !== header.preambleHash || c.judgeHash !== header.judgeHash || !['R', 'F'].includes(c.stratum) || !['correction', 'decision'].includes(c.kind) || ![W.leaked, W.unrun, W.unjudged, W.judgeMiss, 'complete'].includes(c.status)) throw Error('mixed or invalid run');
   if (!c.replies || typeof c.replies !== 'object') throw Error('invalid replies');
   for (const [arm, draws] of Object.entries(c.replies)) {
    if (!['control', 'treatment', W.oracle, W.ceiling].includes(arm) || !Array.isArray(draws) || draws.length !== header.draws || draws.some(d => !d || !(d.reply === null || typeof d.reply === 'string') || !(d.verdict === null || verdicts.includes(d.verdict)))) throw Error('invalid draws');
   }
  }
  if (cases.length < header.planned) {
   if (header.plannedCases?.length !== header.planned) throw Error('missing case manifest');
   for (const c of header.plannedCases) if (!cases.some(r => r.id === c.id)) cases.push({ ...c, status: W.unrun, replies: {} });
  }
  const confirmation = makers.has(header.bundleMaker) ? W.exploratory : W.confirmatory; makers.add(header.bundleMaker); lines.push(`run ${index + 1} ${confirmation}`);
  const statuses = new Map(cases.map(c => [c, classify(c, header)])), complete = cases.filter(c => statuses.get(c) === 'complete');
  const primary = statistic('', complete, header.planned, C.MIN_INFORMATIVE); lines.push(...primary.lines);
  lines.push(rate('control', primary.control), rate('treatment', primary.treatment));
  const delta = repeats(primary.control) - failures(primary.treatment); lines.push(`${delta < 0 ? W.larger : W.smaller} ${Math.abs(delta)}`);
  for (const stratum of ['R', 'F']) {
   const result = statistic(stratum, complete.filter(c => c.stratum === stratum), cases.filter(c => c.stratum === stratum).length, C.MIN_STRATUM);
   lines.push(...result.lines, `${stratum} ${result.verdict}`);
  }
  const sessionD = new Map(); for (const pair of primary.pairs) sessionD.set(pair.row.session, (sessionD.get(pair.row.session) ?? 0) + pair.d);
  const cluster = signFlip([...sessionD.values()]); lines.push(`sessions ${sessionD.size} p fewer ${cluster.fewer.toFixed(6)} p more ${cluster.more.toFixed(6)}`);
  for (const kind of ['correction', 'decision']) lines.push(rate(`reproduction ${kind}`, complete.filter(c => c.kind === kind).flatMap(c => judged(c.replies.control))));
  for (const arm of [W.oracle, W.ceiling]) {
   const subset = complete.filter(c => c.replies[arm]);
   const d = subset.map(c => repeats(judged(c.replies.control)) - failures(judged(c.replies[arm]))), p = signFlip(d);
   lines.push(`${arm} repeats ${subset.reduce((n, c) => n + failures(judged(c.replies[arm])), 0)}/${subset.reduce((n, c) => n + judged(c.replies[arm]).length, 0)} p fewer ${p.fewer.toFixed(6)}`);
  }
  for (const reason of [W.leaked, W.unjudged, W.judgeMiss, W.unrun]) lines.push(`${reason} ${cases.filter(c => statuses.get(c) === reason).length}`);
  for (const word of [W.unclear, W.stalls]) lines.push(`${word} ${['control', 'treatment'].map(arm => cases.reduce((n, c) => n + (c.replies[arm] ?? []).filter(d => d.verdict === word).length, 0)).join('/')}`);
  lines.push(`${W.cites} ${['control', 'treatment'].map(arm => cases.reduce((n, c) => n + (c.replies[arm] ?? []).filter(d => cites(d.reply, c.bundle ?? '')).length, 0)).join('/')}`);
  lines.push(`${W.read} ${cases.reduce((n, c) => n + (c.replies.control ?? []).filter(d => (d.reply ?? '').split(/\r?\n/u).some(line => /^TOOL Read:/u.test(line) && C.SLOT_MARKERS.readPaths.some(marker => normalizeProfileText(line).includes(marker)))).length, 0)}`);
  if (!primary.control.length || repeats(primary.control) / primary.control.length < C.REPRODUCTION_FLOOR) lines.push(W.weak);
  const incomplete = cases.some(c => statuses.get(c) === W.unrun);
  lines.push(`ran R ${cases.filter(c => c.stratum === 'R' && statuses.get(c) !== W.unrun).length} F ${cases.filter(c => c.stratum === 'F' && statuses.get(c) !== W.unrun).length}`);
  const blind = blindAgree === undefined ? W.pending : blindAgree < C.BLIND_AGREE ? W.disagreement : primary.verdict;
  lines.push(`verdict ${blind}${incomplete ? ' ' + W.incomplete : ''}; bias favours bundle`);
  for (const pair of primary.pairs.filter(p => p.d !== 0)) for (const draws of Object.values(pair.row.replies)) for (const draw of judged(draws)) if (draw.reply) sheetPool.push(draw.reply);
  lines.push(...rows.filter(r => r.type === 'spend' && r.runId === header.runId).flatMap(r => r.lines));
 }
 // Fisher-Yates without replacement. The random source is injected for synthetic checks.
 for (let i = sheetPool.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [sheetPool[i], sheetPool[j]] = [sheetPool[j], sheetPool[i]]; }
 const sheet = sheetPool.length >= C.BLIND_SIZE ? sheetPool.slice(0, C.BLIND_SIZE).map((reply, i) => ({ id: `r${i + 1}`, reply })) : [];
 return { lines, sheet };
}
function runFiles(root) {
 const files = [];
 for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (entry.isSymbolicLink()) continue;
  const file = path.join(root, entry.name);
  if (entry.isDirectory()) files.push(...runFiles(file)); else if (entry.name === C.OUTPUT_FILE) files.push(file);
 }
 return files;
}
/** The only printing boundary: fixed diagnostics, sealed words and counts, never raw exceptions. */
export async function runReplayCommand(argv, options = {}) {
 const stdout = options.stdout ?? (s => process.stdout.write(s)), stderr = options.stderr ?? (s => process.stderr.write(s));
 let fd;
 try {
  const [command, ...rest] = argv;
  const allowed = { plan: ['labels', 'candidates', 'root', 'seed', 'out', 'repo', 'project'], screen: ['in', 'expect'], run: ['in', 'expect'], decide: ['in', 'case-set', 'sheet', 'blind-agree'] };
  if (!allowed[command]) throw Error('invalid command');
  const args = memoryArgs(rest, allowed[command]); let result;
  if (command === 'plan') {
   if (!['labels', 'candidates', 'root', 'seed', 'out'].every(key => args[key])) throw Error('missing input');
   const out = outputFolder(args.out, true), repoRoot = args.repo ? path.resolve(args.repo) : defaultMemoryRepo(options.repoRoot ?? process.cwd());
   result = await buildReplayPlan({ ...options, repoRoot, projectsRoot: args.root, project: args.project, seed: args.seed, labels: readOutcomeRows(args.labels, true), candidates: entriesIn(args.candidates) });
   writePrivate(out, C.PLAN_FILE, JSON.stringify(result) + '\n');
  } else if (command === 'decide') {
   if (!args.in || !args['case-set']) throw Error('missing input');
   const rows = runFiles(args.in).flatMap(file => entriesIn(file));
   result = decideReplay(rows, { caseSet: args['case-set'], blindAgree: args['blind-agree'] === undefined ? undefined : Number(args['blind-agree']), random: options.random });
   if (args.sheet) { const out = outputFolder(args.sheet, true); if (result.sheet.length !== C.BLIND_SIZE) throw Error('too few blind replies'); writePrivate(out, C.SHEET_FILE, jsonl(result.sheet)); }
  } else {
   if (!args.in || !args.expect) throw Error('missing input');
   const plan = JSON.parse(fs.readFileSync(path.join(args.in, C.PLAN_FILE), 'utf8')); checkedPlan(plan, args.expect);
   outputFolder(args.in);
   if (command === 'screen') {
    const out = outputFolder(path.join(args.in, C.SCREEN_DIR), true);
    result = await screenReplay(plan, { ...options, expect: args.expect });
    writePrivate(out, C.SCREEN_FILE, jsonl(result.rows)); writePrivate(out, C.PLAN_FILE, JSON.stringify(result.plan) + '\n');
   } else {
    const runId = crypto.randomUUID(), out = outputFolder(path.join(args.in, C.RUNS_DIR, runId), true);
    fd = fs.openSync(path.join(out, C.OUTPUT_FILE), 'wx', 0o600);
    result = await executeReplay(plan, { ...options, expect: args.expect, runId, onRow: row => fs.writeSync(fd, JSON.stringify(row) + '\n') });
   }
  }
  for (const line of result.lines) stdout(`${line}\n`);
  return 0;
 } catch (error) { stderr(`${error.code === 'OUTPUT_CHECKOUT' ? PRIVATE_REFUSAL : 'memory: replay failed'}\n`); return 1; }
 finally { if (fd !== undefined) fs.closeSync(fd); }
}
