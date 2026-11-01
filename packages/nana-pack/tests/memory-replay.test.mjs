/**
 * @module packages/nana-pack/tests/memory-replay.test.mjs
 * @purpose Pin eight synthetic replay contracts and twelve groups of sealed values.
 * @inputs OS-temp fixtures and injected runners or spawns; no real text or models.
 * @outputs Awaited per-case PASS/FAIL lines.
 * @effects disk (OS temp only)
 * @errors Assertions set exit code 1.
 */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { tmpDir } from "./tmp-dir.mjs";
import { projectKey } from '../../nana-setup/lib/project-key.mjs';
import { shape } from '../lib/memory-making.mjs';
import { PRIVATE_REFUSAL } from '../lib/memory-making-config.mjs';
import { CLAIM_CAP } from '../lib/outcome-meter-config.mjs';
import { wilson } from '../lib/outcome-meter.mjs';
import { readOutcomeRows } from '../lib/outcome-score.mjs';
import * as C from '../lib/memory-replay-config.mjs';
import { rebuildContext, withMemorySlot } from '../lib/memory-replay-context.mjs';
import { buildReplayPlan, executeReplay, screenReplay, decideReplay, runReplayCommand, signFlip } from '../lib/memory-replay.mjs';
import { replayRunners } from '../../../scripts/memory-replay.mjs';
import { createRunner } from '../../../scripts/memory-shape-runners.mjs';

async function check(title, fn) {
 if (process.argv[2] && !title.includes(process.argv[2])) return;
 const abort = new AbortController();
 try { await Promise.race([Promise.resolve().then(fn), delay(20000, null, { signal: abort.signal }).then(() => { throw Error('case deadline'); })]); console.log('PASS', title); }
 catch (e) { console.log('FAIL', title, e.message); process.exitCode = 1; }
 finally { abort.abort(); }
}
const instant = n => new Date(Date.UTC(2026, 0, 1) + n * 1000).toISOString();
const entry = (type, uuid, content, n, sessionId = 'alpha', extra = {}) => ({ type, uuid, sessionId, isSidechain: false, timestamp: instant(n), message: { role: type, content }, ...extra });
const ptr = (session, n) => `claude-code:${session}#u${n}+s${n}`;
const instructions = (session, at = 0) => ({ type: 'attachment', sessionId: session, timestamp: instant(at), attachment: { type: 'instructions', files: [{ path: '/synthetic/PROJECT.md', type: 'Project', content: 'Synthetic project instruction' }, { path: '/synthetic/memory/MEMORY.md', type: 'AutoMem', content: 'Synthetic historical memory' }] } });
const label = (session, n, overrides = {}) => ({ evidence: ptr(session, n), kind: 'correction', valid: true, repeatOf: [], relation: 'none', ...overrides });
const candidate = (session, n, claim = `Synthetic lesson ${session} ${n}`) => shape('user', 'correction', `Synthetic source ${session} ${n}`, 'Synthetic previous action', ptr(session, n), '2026-01-01', { claim }).record;
const result = (value, cost = 0.01) => ({ ok: true, text: JSON.stringify(value), usage: { tokens: 10, cost } });
const judge = async () => result({ id: 'r1', verdict: 'repeats' });
const replay = async () => result({ reply: 'Synthetic new reply' });
async function fixture(fn, { eol = '\n', final = true } = {}) {
 const root = fs.realpathSync(tmpDir(path.join(os.tmpdir(), 'memory-replay-')));
 const roots = { repoRoot: path.join(root, 'repo'), projectsRoot: path.join(root, 'snapshot'), reviewsRoot: path.join(root, 'reviews') };
 fs.mkdirSync(path.join(roots.repoRoot, '.git'), { recursive: true });
 const dir = path.join(roots.projectsRoot, projectKey(roots.repoRoot)); fs.mkdirSync(dir, { recursive: true });
 const jsonl = (file, rows) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, rows.map(r => JSON.stringify(r) + ' \t').join(eol) + (final ? eol : '')); return file; };
 const session = (name, start, ns, extra = []) => jsonl(path.join(dir, `${name}.jsonl`), [instructions(name, start), entry('user', `open-${name}`, 'Synthetic opening request', start + 1, name), ...ns.flatMap(n => [entry('user', `p${n}`, `Synthetic request ${n}`, n * 10 - 2, name), entry('assistant', `s${n}`, `Synthetic corrected behaviour ${n}`, n * 10 - 1, name), entry('user', `u${n}`, `No, synthetic correction ${n}`, n * 10, name)]), ...extra]);
 const cli = async (argv, options = {}) => { let stdout = '', stderr = ''; const code = await runReplayCommand(argv, { repoRoot: roots.repoRoot, runReplay: replay, runJudge: judge, ...options, stdout: s => { stdout += s; }, stderr: s => { stderr += s; } }); return { code, stdout, stderr }; };
 const plan = (labels, candidates = [], extra = {}) => buildReplayPlan({ ...roots, labels, candidates, seed: '7', ...extra });
 try { await fn({ root, roots, dir, jsonl, session, cli, plan }); }
 finally { fs.rmSync(root, { recursive: true, force: true }); }
}
function caseRow(i, control = ['repeats'], treatment = ['avoids'], overrides = {}) {
 const draws = list => list.map((verdict, n) => ({ reply: `Synthetic answer ${i} ${n}`, verdict }));
 return { type: 'case', runId: 'run-a', caseSet: 'synthetic-set', bundleMaker: 'synthetic-maker', preambleHash: C.PREAMBLE_HASH, judgeHash: C.JUDGE_HASH, id: `case-${i}`, session: `session-${i % 3}`, kind: 'correction', stratum: i % 2 ? 'R' : 'F', status: 'complete', original: 'repeats', bundle: '', replies: { control: draws(control), treatment: draws(treatment), [i % 2 ? 'oracle' : 'ceiling']: draws(control.map(() => 'avoids')) }, ...(overrides.status ? { replies: {}, original: overrides.status === 'judge-miss' ? 'avoids' : 'repeats' } : {}), ...overrides };
}
const runRows = (cases, overrides = {}) => [{ type: 'run', runId: 'run-a', caseSet: 'synthetic-set', bundleMaker: 'synthetic-maker', preambleHash: C.PREAMBLE_HASH, judgeHash: C.JUDGE_HASH, started: instant(1), draws: 1, planned: cases.length, ...overrides }, ...cases];
const linesOf = (rows, options = {}) => decideReplay(rows, { caseSet: 'synthetic-set', blindAgree: C.BLIND_AGREE, ...options }).lines;
const has = (lines, text) => assert.ok(lines.includes(text), text);

// req: R-3370
await check('plan stratifies corrections without spend', async () => {
 for (const [eol, final] of [['\n', true], ['\r\n', true], ['\n', false]]) await fixture(async ({ root, roots, session, jsonl, plan, cli }) => {
  session('alpha', 0, [1, 7]); session('beta', 30, [4, 5, 6, 8, 9, 10, 11, 12]); session('gamma', 100, [13]);
  const missingContext = session('old', 130, [14]); const old = fs.readFileSync(missingContext, 'utf8').split(/\r?\n/u).filter(x => x.trim()).slice(1); fs.writeFileSync(missingContext, old.join(eol));
  const decision = label('beta', 5, { kind: 'decision', repeatOf: [ptr('alpha', 1)], relation: 'same' });
  // Prompting comes from recorded source, not an untrusted label boolean.
  const b = path.join(roots.projectsRoot, projectKey(roots.repoRoot), 'beta.jsonl'); fs.writeFileSync(b, fs.readFileSync(b, 'utf8').replace('Synthetic corrected behaviour 5', 'Which synthetic choice?'));
  const labels = [label('beta', 4, { repeatOf: [ptr('alpha', 1)], relation: 'same' }), decision, label('beta', 6), label('beta', 8, { repeatOf: [ptr('alpha', 7)], relation: 'same' }), { evidence: ptr('beta', 9), kind: 'correction' }, label('beta', 10, { relation: 'changed' }), label('beta', 11, { valid: false }), label('beta', 12, { kind: 'decision', repeatOf: [ptr('alpha', 1)], relation: 'same' }), label('gamma', 13, { kind: 'decision' }), label('absent', 1), label('old', 14), { evidence: 'synthetic-lesson', kind: 'lesson' }, { evidence: 'synthetic-none', kind: 'none' }];
  const r = await plan(labels); assert.deepEqual(r.cases.map(c => [c.evidence, c.stratum]).sort(), [[ptr('beta', 4), 'R'], [ptr('beta', 5), 'R'], [ptr('beta', 6), 'F'], [ptr('beta', 8), 'F'], [ptr('beta', 9), 'F']].sort());
  for (const line of ['cases 5 R 2 F 3', 'changed 1', 'invalid 1', 'unresolved 1', 'no recorded context 1', 'late earlier instance 1', 'sessions 1', `case set ${r.hash}`]) has(r.lines, line);
  assert.match(r.hash, /^[a-f0-9]{64}$/u); assert.deepEqual((await plan(labels)).cases.map(c => c.id), r.cases.map(c => c.id)); assert.equal((await plan(labels)).hash, r.hash); const other = await plan(labels, [], { seed: '8' }); assert.notEqual(other.hash, r.hash); assert.notDeepEqual(other.cases.map(c => c.id), r.cases.map(c => c.id));
  assert.deepEqual(r.cases.slice(0, 4).map(c => c.stratum), ['R', 'F', 'R', 'F']);
  const file = jsonl(path.join(root, 'labels'), labels), candidates = jsonl(path.join(root, 'candidates'), []);
  assert.equal(readOutcomeRows(file, true).find(l => l.evidence === ptr('beta', 9)).valid, true);
  let calls = 0; const out = path.join(root, 'planned'); const command = await cli(['plan', '--repo', roots.repoRoot, '--labels', file, '--candidates', candidates, '--root', roots.projectsRoot, '--seed', '7', '--out', out], { runReplay: () => { calls++; }, runJudge: () => { calls++; } });
  assert.equal(command.code, 0); assert.equal(command.stdout, r.lines.join('\n') + '\n'); assert.equal(calls, 0);
  const originalHash = r.hash; session('extra', 150, [16]); assert.notEqual((await plan(labels)).hash, originalHash);
  const dupe = jsonl(path.join(root, 'duplicate'), [labels[0], labels[0]]); assert.throws(() => readOutcomeRows(dupe, true));
 }, { eol, final });
});
// req: R-3371
await check('context preserves past and replaces only memory slot', () => {
 const oldInstructions = instructions('alpha'); oldInstructions.attachment.files[0].content = 'SECRET OLD INSTRUCTION';
 // Claude Code 2.1.310 records statusMessage as command, not the executable path.
 const hook = (command, content, hookName = 'SessionStart:compact') => ({ type: 'attachment', attachment: { type: 'hook_success', hookName, command, content } });
 const entries = [oldInstructions, entry('user', 'old-summary', 'SECRET OLD SUMMARY', 0, 'alpha', { isCompactSummary: true }), { type: 'system', subtype: 'compact_boundary' }, instructions('alpha'), entry('user', 'before', 'Synthetic old history', 1), hook('nana: shared memory index', 'SECRET OLD SHARED HOOK', 'SessionStart:startup'), hook('nana: objective + current priority', 'SECRET OLD STANDING HOOK', 'SessionStart:startup'), { type: 'system', subtype: 'compact_boundary' }, entry('user', 'summary', 'Synthetic latest summary', 2, 'alpha', { isCompactSummary: true }), hook('nana: shared memory index', 'Synthetic shared hook'), hook('nana: objective + current priority', 'Synthetic other hook'), entry('assistant', 'think', [{ type: 'thinking', thinking: 'SECRET THINKING' }, { type: 'text', text: 'Synthetic visible text' }, { type: 'tool_use', name: 'Read', input: { file_path: '/synthetic/file' } }], 3), entry('user', 'tool', [{ type: 'tool_result', content: 'x'.repeat(C.TOOL_RESULT_CAP + 100), tool_use_id: 't1' }], 4), entry('assistant', 'side', 'SECRET SIDECHAIN', 5, 'alpha', { isSidechain: true }), { type: 'attachment', attachment: { type: 'bookkeeping', content: 'SECRET BOOKKEEPING' } }, entry('user', 'point', 'Synthetic current request', 6), entry('assistant', 'later', 'SECRET FUTURE', 7)];
 const c = rebuildContext(entries, entries.findIndex(e => e.uuid === 'point')); const control = withMemorySlot(c, c.control), treatment = withMemorySlot(c, 'Synthetic treatment'), oracle = withMemorySlot(c, 'Synthetic oracle');
 // Pin the label slot before checking stale hooks, so the baseline fails for the MUST first.
 assert.ok(c.control.includes('Synthetic shared hook'), 'recorded status label belongs in the memory slot');
 assert.ok(!treatment.text.includes('Synthetic shared hook'), 'treatment replaces the historical shared index');
 assert.ok(control.text.includes(C.REPLAY_PREAMBLE));
 for (const text of ['Synthetic project instruction', 'Synthetic latest summary', 'Synthetic shared hook', 'Synthetic other hook', 'Synthetic visible text', 'Synthetic current request', 'TOOL Read:']) assert.ok(control.text.includes(text), text);
 for (const text of ['Synthetic old history', 'SECRET THINKING', 'SECRET SIDECHAIN', 'SECRET BOOKKEEPING', 'SECRET FUTURE', 'SECRET OLD SUMMARY', 'SECRET OLD INSTRUCTION', 'SECRET OLD SHARED HOOK', 'SECRET OLD STANDING HOOK']) assert.ok(!control.text.includes(text), text);
 assert.ok(control.text.includes('x'.repeat(C.TOOL_RESULT_CAP))); assert.ok(!control.text.includes('x'.repeat(C.TOOL_RESULT_CAP + 1)));
 assert.equal(c.control, 'Synthetic historical memory\nSynthetic shared hook');
 for (const command of ['node nana-shared-memory.mjs', 'nana-shared-memory']) {
  const legacy = rebuildContext([instructions('alpha'), hook(command, 'Synthetic legacy hook', 'SessionStart'), entry('user', 'point', 'Synthetic request', 1)], 2);
  assert.equal(legacy.control, 'Synthetic historical memory\nSynthetic legacy hook');
  assert.ok(!legacy.prefix.includes('Synthetic legacy hook'));
 }
 const remove = x => x.text.slice(0, x.slotStart) + x.text.slice(x.slotEnd); assert.equal(remove(control), remove(treatment)); assert.equal(remove(control), remove(oracle));
 const trimmed = rebuildContext([instructions('alpha'), entry('user', 'huge', 'z'.repeat(C.HISTORY_BUDGET), 1), entry('user', 'last', 'Synthetic point stays', 2)], 2);
 assert.ok(trimmed.removedChars >= C.HISTORY_BUDGET); assert.ok(!trimmed.history.includes('zz')); assert.ok(trimmed.history.includes('Synthetic point stays'));
});
// req: R-3372
await check('bundle uses pre-cut candidates and one oracle record', () => fixture(async ({ root, session, plan }) => {
 session('alpha', 0, [1, 2]); session('beta', 30, [4, 5]); session('gamma', 60, [7]);
 const candidates = [candidate('alpha', 1, 'Synthetic older lesson'), candidate('alpha', 2, 'Synthetic newer lesson'), candidate('beta', 4, 'Synthetic older lesson'), candidate('gamma', 7, 'Synthetic future lesson')];
 const labels = [label('beta', 4, { repeatOf: [ptr('alpha', 1)], relation: 'same' }), label('beta', 5)];
 const stores = [];
 const r = await plan(labels, candidates, { tempRoot: root, onStore: store => {
  stores.push(store);
  const names = fs.readdirSync(store, { recursive: true }); assert.ok(!names.some(n => n.split(path.sep).includes('events')));
  if (process.platform !== 'win32') { assert.equal(fs.statSync(store).mode & 0o777, 0o700); for (const name of names) if (fs.statSync(path.join(store, name)).isFile()) assert.equal(fs.statSync(path.join(store, name)).mode & 0o777, 0o600); }
 } }); assert.equal(r.cases.length, 2); assert.equal(stores.length, 1); assert.ok(stores.every(store => !fs.existsSync(store)));
 const repeat = r.cases.find(c => c.stratum === 'R'), first = r.cases.find(c => c.stratum === 'F');
 assert.equal(repeat.bundle, 'Synthetic newer lesson\nSynthetic older lesson'); assert.equal(repeat.bundleRecords.length, 2); assert.ok(repeat.bundleRecords.every(c => c.trust === 'low' && c.repeats === 0));
 assert.equal(repeat.oracle, 'No, synthetic correction 1 — correcting: Synthetic corrected behaviour 1');
 // Oracle uses resolved evidence, not the shaper's candidate wording.
 assert.ok(repeat.oracle.includes('No, synthetic correction 1')); assert.ok(!repeat.oracle.includes('Synthetic older lesson'));
 assert.equal(first.oracle, first.description); assert.equal(first.oracleArm, 'ceiling'); assert.equal(repeat.oracleArm, 'oracle');
 assert.deepEqual(fs.readdirSync(root).filter(n => n.startsWith('replay-store-')), []);
 let seen; await plan(labels, candidates, { maker: async rows => { seen = rows; return 'Synthetic delivery'; }, makerHash: 'synthetic-delivery', tempRoot: root });
 assert.deepEqual(seen.map(c => c.evidence), candidates.slice(0, 2).map(c => c.evidence));
 const huge = await plan(labels, [{ ...candidate('alpha', 1), claim: 'a'.repeat(C.BUNDLE_BUDGET + 1) }]); assert.ok(huge.cases.every(c => c.bundle === 'a'.repeat(C.BUNDLE_BUDGET)));
 const leaked = await plan(labels, candidates, { maker: async () => 'NO,\tSYNTHETIC CORRECTION 4', makerHash: 'leak' }); assert.equal(leaked.cases.find(c => c.evidence === ptr('beta', 4)).status, 'leaked');
 await assert.rejects(plan(labels, candidates, { onStore: () => { throw Error('Synthetic private failure'); }, tempRoot: root })); assert.deepEqual(fs.readdirSync(root).filter(n => n.startsWith('replay-store-')), []);
}));
// req: R-3373
await check('judge is isolated blind and fail-closed', () => fixture(async ({ root, session, plan, cli }) => {
 const file = session('alpha', 0, [1]);
 const recorded = fs.readFileSync(file, 'utf8').trim().split('\n').map(JSON.parse);
 recorded.find(e => e.uuid === 's1').message.content = [{ type: 'tool_use', name: 'Write', input: { text: 'Synthetic original tool' } }, { type: 'text', text: 'Synthetic corrected behaviour 1 ' + 'z'.repeat(C.REPLY_CAP) }];
 fs.writeFileSync(file, recorded.map(e => JSON.stringify(e)).join('\n'));
 const p = await plan([label('alpha', 1)]); const calls = [];
 const run = await executeReplay(p, { draws: 2, runReplay: replay, runJudge: async input => { calls.push(input); return result({ id: 'r1', verdict: 'repeats' }); } });
 assert.equal(calls.length, 7);
 for (const call of calls) { const input = JSON.parse(call.prompt); assert.deepEqual(Object.keys(input), ['description', 'id', 'reply']); assert.equal(input.id, 'r1'); assert.equal(input.description, p.cases[0].description); assert.equal(typeof input.reply, 'string'); assert.ok(input.reply.length <= C.REPLY_CAP); for (const forbidden of ['control', 'treatment', 'oracle', 'ceiling', 'claude-code:', 'alpha', instant(1), C.REPLAY_MODEL]) assert.ok(!call.prompt.includes(forbidden), forbidden); }
 assert.equal(run.rows.find(r => r.type === 'case').status, 'complete');
 const original = JSON.parse(calls.at(-1).prompt).reply; assert.ok(original.startsWith('TOOL Write:')); assert.equal(original.length, C.REPLY_CAP);
 for (const bad of ['prefix {"id":"r1","verdict":"repeats"}', '{"id":"r2","verdict":"repeats"}', '{"id":"r1","verdict":"maybe"}', '{"id":"r1","verdict":"repeats","extra":1}', '{}']) { const r = await executeReplay(p, { draws: 2, runReplay: replay, runJudge: async () => ({ ok: true, text: bad }) }); const row = r.rows.find(r => r.type === 'case'); assert.equal(row.status, 'judge-miss'); assert.ok(row.replies.control.every(r => r.verdict === null)); }
 const fenced = await executeReplay(p, { draws: 2, runReplay: async () => ({ ...result({ reply: 'Synthetic fenced reply' }), text: '```json\n{"reply":"Synthetic fenced reply"}\n```' }), runJudge: async () => ({ ...result({ id: 'r1', verdict: 'repeats' }), text: '```json\n{"id":"r1","verdict":"repeats"}\n```' }) }); assert.equal(fenced.rows.find(r => r.type === 'case').status, 'complete');
 const miss = await executeReplay(p, { draws: 2, runReplay: replay, runJudge: async () => result({ id: 'r1', verdict: 'avoids' }) }); assert.equal(miss.rows.find(r => r.type === 'case').status, 'judge-miss');
 for (const badReply of ['', 'prose {"reply":"Synthetic"}', JSON.stringify({ reply: 'x'.repeat(C.REPLY_CAP + 1) }), '{"reply":""}']) { const r = await executeReplay(p, { draws: 2, runReplay: async () => ({ ok: true, text: badReply }), runJudge: judge }); assert.equal(r.rows.find(r => r.type === 'case').status, 'unjudged'); }
 const cases = Array.from({ length: 12 }, (_, i) => caseRow(i, ['repeats'], ['avoids'])); cases.push(caseRow(99, ['repeats'], ['repeats']));
 const sheet = decideReplay(runRows(cases), { caseSet: 'synthetic-set', random: () => 0.5 }).sheet; assert.equal(sheet.length, C.BLIND_SIZE); for (const r of sheet) { assert.deepEqual(Object.keys(r), ['id', 'reply']); assert.ok(!r.reply.includes('answer 99 ')); }
 const folder = path.join(root, 'row-root', 'runs', 'one'); fs.mkdirSync(folder, { recursive: true }); fs.writeFileSync(path.join(folder, C.OUTPUT_FILE), runRows(cases).map(r => JSON.stringify(r)).join('\r\n'));
 const command = await cli(['decide', '--in', path.join(root, 'row-root'), '--case-set', 'synthetic-set', '--sheet', path.join(root, 'sheet')]); assert.equal(command.code, 0); const written = fs.readFileSync(path.join(root, 'sheet', 'blind.jsonl'), 'utf8').trim().split('\n').map(JSON.parse); assert.equal(written.length, C.BLIND_SIZE); assert.ok(written.every(r => Object.keys(r).join() === 'id,reply')); assert.equal(command.stderr, '');
}));
// req: R-3374
await check('decision reports paired statistics attrition and confirmation', () => {
 const cases = Array.from({ length: 12 }, (_, i) => i < 9 ? caseRow(i) : i === 9 ? caseRow(i, ['avoids'], ['repeats']) : caseRow(i, ['repeats'], ['repeats']));
 const rows = runRows(cases), lines = linesOf(rows);
 has(lines, 'cases planned 12 informative 10 favour bundle 9 favour control 1'); has(lines, `pooled p fewer 0.010742 level ${C.BENEFIT_LEVEL} p more 0.999023 level ${C.HARM_LEVEL}`);
 has(lines, `control repeats 11/12 Wilson ${wilson(11, 12).map(n => n.toFixed(4)).join(' ')}`); has(lines, `treatment repeats 3/12 Wilson ${wilson(3, 12).map(n => n.toFixed(4)).join(' ')}`);
 assert.ok(lines.some(l => l.startsWith('verdict bundle fewer repeats'))); assert.ok(lines.some(l => l.startsWith('R cases planned'))); assert.ok(lines.some(l => l.startsWith('F cases planned'))); assert.ok(lines.some(l => l.startsWith('sessions 3 p '))); assert.ok(lines.some(l => l.startsWith('oracle '))); assert.ok(lines.some(l => l.startsWith('ceiling ')));
 const swapped = structuredClone(rows); for (const row of swapped.filter(r => r.type === 'case')) [row.replies.control, row.replies.treatment] = [row.replies.treatment, row.replies.control]; assert.ok(linesOf(swapped).some(l => l.startsWith('verdict bundle more repeats')));
 const balanced = runRows(Array.from({ length: 12 }, (_, i) => i % 2 ? caseRow(i) : caseRow(i, ['avoids'], ['repeats']))); assert.ok(linesOf(balanced).some(l => l.startsWith('verdict no decision')));
 // Equal-denominator rates scale to |d| = 3, 2, 1; observed sum 4. Two of eight flips reach 4.
 assert.equal(signFlip([3, 2, -1]).fewer, 0.25); const k3 = runRows([caseRow(1, ['repeats', 'repeats', 'repeats'], ['avoids', 'avoids', 'avoids']), caseRow(2, ['repeats', 'repeats', 'avoids'], ['avoids', 'avoids', 'avoids']), caseRow(3, ['avoids', 'avoids', 'avoids'], ['repeats', 'avoids', 'avoids'])], { draws: 3 }); has(linesOf(k3), `pooled p fewer 0.250000 level ${C.BENEFIT_LEVEL} p more 0.875000 level ${C.HARM_LEVEL}`);
 // Unequal judged denominators: d = 1/3 - 1/2 = -1/6, 1/3, 1/3.
 // In sixths |d| = 1, 2, 2, observed 3: 2/8 flips >= 3; 7/8 <= 3.
 // Raw counts instead give 0, 1, 1 and falsely erase the case favouring control.
 const unequal = runRows([
  caseRow(0, ['repeats', 'avoids', 'avoids', 'unclear', null, null], ['repeats', 'repeats', 'avoids', 'avoids', 'unclear', null], { session: 'one' }),
  caseRow(1, ['repeats', 'avoids', 'avoids', 'unclear', null, null], ['avoids', 'avoids', 'avoids', 'avoids', 'avoids', null], { session: 'two' }),
  caseRow(2, ['repeats', 'avoids', 'avoids', 'unclear', null, null], ['avoids', 'avoids', 'avoids', 'avoids', 'avoids', null], { session: 'three' }),
 ], { draws: 6 });
 // Make sensitivity arms match treatment, including the stall penalty.
 for (const row of unequal.filter(r => r.type === 'case')) {
  row.replies[row.stratum === 'R' ? 'oracle' : 'ceiling'] = structuredClone(row.replies.treatment);
 }
 unequal[1].replies.treatment[1].verdict = 'stalls'; // numerator remains 2 failures / 4 judged.
 const u = linesOf(unequal);
 for (const line of ['cases planned 3 informative 3 favour bundle 2 favour control 1', `pooled p fewer 0.250000 level ${C.BENEFIT_LEVEL} p more 0.875000 level ${C.HARM_LEVEL}`, 'sessions 3 p fewer 0.250000 p more 0.875000', 'unclear 3/1', 'failed draws 6/3', 'stalls 0/1', 'smaller by 0.166667', 'oracle repeats 0/5 p fewer 0.500000', 'ceiling repeats 2/9 p fewer 0.500000']) has(u, line);
 const swappedUnequal = structuredClone(unequal);
 // With no stalls, swapping rates reverses both one-sided tails exactly.
 unequal[1].replies.treatment[1].verdict = 'repeats';
 for (const row of swappedUnequal.filter(r => r.type === 'case')) {
  row.replies.treatment = structuredClone(unequal.find(r => r.id === row.id).replies.control);
  row.replies.control = structuredClone(unequal.find(r => r.id === row.id).replies.treatment);
 }
 has(linesOf(swappedUnequal), `pooled p fewer 0.875000 level ${C.BENEFIT_LEVEL} p more 0.250000 level ${C.HARM_LEVEL}`);
 // Cluster two positive cases: session magnitudes 1/6, 2/3; 2/4 flips reach 1/2.
 const clustered = structuredClone(unequal); clustered[2].session = 'positive'; clustered[3].session = 'positive';
 has(linesOf(clustered), 'sessions 2 p fewer 0.500000 p more 0.750000');
 const attrition = runRows([caseRow(0, ['repeats', 'unclear', 'unclear'], ['avoids', 'avoids', 'avoids']), caseRow(1, ['repeats', 'repeats', 'repeats'], ['stalls', 'stalls', 'stalls']), ...['leaked', 'judge-miss', 'unrun'].map((status, i) => caseRow(i + 2, ['repeats'], ['avoids'], { status }))], { draws: C.MIN_JUDGED });
 const a = linesOf(attrition); for (const line of ['unjudged 1', 'leaked 1', 'judge-miss 1', 'unrun 1', 'unclear 2/0', 'stalls 0/3']) has(a, line); assert.ok(a.some(l => l.includes('undecided: too few cases'))); assert.ok(a.some(l => l.startsWith('cases planned 5 informative 0')));
 has(linesOf(runRows([caseRow(1, ['avoids'], ['avoids'])])), C.WORDS.weak);
 const cited = structuredClone(rows); const words = Array.from({ length: C.CITES_WORDS }, (_, i) => `synthetic${i}`).join(' '); cited[1].bundle = words; cited[1].replies.control[0].reply = `TOOL Read: /synthetic/memory/MEMORY.md\n${words}`; cited[1].replies.treatment[0].reply = words;
 has(linesOf(cited), 'cites bundle 1/1'); has(linesOf(cited), 'control would read memory 1'); assert.ok(linesOf(cited).some(l => l.includes('bias favours bundle')));
 const second = rows.map(r => ({ ...r, runId: 'run-b', ...(r.type === 'run' ? { started: instant(2) } : {}) })); const all = linesOf([...rows, ...second]); has(all, 'runs on this case set 2'); has(all, 'run 1 confirmatory'); has(all, 'run 2 exploratory');
 assert.ok(linesOf(rows, { blindAgree: undefined }).some(l => l.includes('pending blind check'))); assert.ok(linesOf(rows, { blindAgree: C.BLIND_AGREE - 1 }).some(l => l.includes('judge disagreement')));
 const mixed = structuredClone(rows); mixed[1].judgeHash = 'foreign'; assert.throws(() => linesOf(mixed)); mixed[1].judgeHash = C.JUDGE_HASH; mixed[1].preambleHash = 'foreign'; assert.throws(() => linesOf(mixed));
});
// req: R-3375
await check('caps stop at case boundaries and expose incomplete spend', () => fixture(async ({ root, session, plan, jsonl, cli }) => {
 session('alpha', 0, [1, 2, 3, 4]); const p = await plan([1, 2, 3, 4].map(n => label('alpha', n))); const order = []; let paid = 0;
 const r = await executeReplay(p, { runReplay: async input => { order.push('replay'); assert.equal(input.budgetUsd, C.REPLAY_DOLLARS); paid++; return result({ reply: `Synthetic draw ${paid}` }, C.RUN_DOLLARS / (3 * C.DRAWS + 1)); }, runJudge: async input => { order.push('judge'); assert.equal(input.budgetUsd, C.JUDGE_DOLLARS); return result({ id: 'r1', verdict: 'repeats' }, 0); } });
 const ran = r.rows.filter(r => r.type === 'case' && r.status !== 'unrun'); assert.equal(ran.length, 2); assert.deepEqual(ran.map(c => c.id), p.cases.slice(0, 2).map(c => c.id)); assert.ok(order.slice(0, 3 * C.DRAWS).every(x => x === 'replay')); assert.ok(order.slice(3 * C.DRAWS, 6 * C.DRAWS + 1).every(x => x === 'judge'));
 const l = decideReplay(r.rows, { caseSet: p.hash }).lines; assert.ok(l.some(s => s.startsWith('verdict ') && s.includes('incomplete'))); has(l, 'ran R 0 F 2'); has(l, 'unrun 2');
 let unknown = true; const u = await executeReplay(p, { runReplay: async () => { const r = await replay(); if (unknown) { r.usage = null; unknown = false; } return r; }, runJudge: judge }); has(u.lines, 'calls with unknown usage 1'); has(u.lines, 'cost unknown');
 const out = path.join(root, 'plan'); fs.mkdirSync(out); fs.writeFileSync(path.join(out, 'plan.json'), JSON.stringify(p)); let calls = 0;
 const bad = await cli(['run', '--in', out, '--expect', 'wrong'], { runReplay: () => { calls++; }, runJudge: () => { calls++; } }); assert.equal(bad.code, 1); assert.equal(calls, 0);
}));
// req: R-3376
await check('screen selects repeats but run uses fresh draws', () => fixture(async ({ session, plan }) => {
 session('alpha', 0, [1, 2]); const p = await plan([label('alpha', 1), label('alpha', 2)]); let calls = 0;
 const s = await screenReplay(p, { runReplay: async () => { calls++; return result({ reply: `Synthetic screen ${calls}` }); }, runJudge: async input => result({ id: 'r1', verdict: JSON.parse(input.prompt).reply === 'Synthetic screen 1' ? 'repeats' : 'avoids' }) });
 const capped = await screenReplay(p, { runCap: 0.01, runReplay: replay, runJudge: judge });
 assert.equal(capped.rows[1].status, 'unrun');
 assert.deepEqual(capped.plan.cases.map(c => [c.id, c.status]), [[p.cases[0].id, 'planned'], [p.cases[1].id, 'unrun']]);
 let cappedCalls = 0;
 const afterCap = await executeReplay(capped.plan, { runReplay: async () => { cappedCalls++; return replay(); }, runJudge: judge });
 assert.equal(cappedCalls, C.DRAWS * 3);
 assert.equal(afterCap.rows.find(r => r.id === p.cases[1].id).status, 'unrun');
 has(decideReplay(afterCap.rows, { caseSet: capped.plan.hash }).lines, 'unrun 1');
 assert.equal(p.cases[1].status, 'planned');
 assert.equal(calls, p.cases.length * C.SCREEN_DRAWS); assert.equal(s.plan.cases.length, 1); assert.notEqual(s.plan.hash, p.hash); assert.equal(s.plan.cases[0].id, p.cases[0].id); assert.equal(s.plan.parentHash, p.hash);
 let fresh = 0; const r = await executeReplay(s.plan, { runReplay: async () => { fresh++; return result({ reply: `Synthetic fresh ${fresh}` }); }, runJudge: judge }); assert.equal(fresh, C.DRAWS * 3); assert.ok(r.rows.filter(r => r.type === 'case').every(r => Object.values(r.replies).flat().every(d => d.reply.startsWith('Synthetic fresh')))); has(decideReplay(r.rows, { caseSet: s.plan.hash }).lines, 'cases planned 1 informative 0 favour bundle 0 favour control 0');
}));
// req: R-3377
await check('private commands and sealed Claude runners', () => fixture(async ({ root, roots, session, jsonl, cli }) => {
 session('alpha', 0, [1, 2]); const labels = jsonl(path.join(root, 'labels'), [label('alpha', 1), label('alpha', 2)]), candidates = jsonl(path.join(root, 'candidates'), []);
 const argv = out => ['plan', '--repo', roots.repoRoot, '--labels', labels, '--candidates', candidates, '--root', roots.projectsRoot, '--seed', '7', '--out', out]; const out = path.join(root, 'output');
 const no = await cli(argv(path.join(roots.repoRoot, 'out'))); assert.equal(no.code, 1); assert.equal(no.stderr.trim(), PRIVATE_REFUSAL);
 const good = await cli(argv(out)); assert.equal(good.code, 0); const file = path.join(out, 'plan.json'), before = fs.readFileSync(file, 'utf8'); assert.equal((await cli(argv(out))).code, 1); assert.equal(fs.readFileSync(file, 'utf8'), before);
 if (process.platform !== 'win32') { assert.equal(fs.statSync(file).mode & 0o777, 0o600); assert.equal(fs.statSync(out).mode & 0o777, 0o700); }
 const p = JSON.parse(before); const replies = [await cli(argv(path.join(root, 'throw-plan')), { maker: () => { throw Error('Synthetic historical memory'); }, makerHash: 'throw' })];
 for (const failure of [false, true]) {
  const opts = failure ? { runReplay: () => { throw Error('No, synthetic correction 1'); }, runJudge: () => { throw Error('Synthetic historical memory'); } } : {};
  replies.push(await cli(['run', '--in', out, '--expect', p.hash], opts));
  replies.push(await cli(['screen', '--in', out, '--expect', p.hash], opts));
  replies.push(await cli(['decide', '--in', out, '--case-set', p.hash], opts));
  fs.rmSync(path.join(out, 'screen'), { recursive: true, force: true });
 }
 for (const r of [good, no, ...replies]) for (const secret of ['No, synthetic correction 1', 'Synthetic opening request', 'Synthetic historical memory', 'Synthetic new reply', ptr('alpha', 1)]) assert.ok(!(r.stdout + r.stderr).includes(secret));
 const previous = process.env.MEMORY_SHAPE_RUNNER; process.env.MEMORY_SHAPE_RUNNER = 'pi';
 try {
  const invocations = [], chosen = []; const runners = replayRunners({ create: options => { chosen.push(options.runner); return createRunner({ runner: 'pi', ...options }); }, spawn: (bin, args, opts) => {
   invocations.push({ bin, args, opts }); const model = args[args.indexOf('--model') + 1]; assert.equal(bin, 'claude'); assert.equal(opts.cwd, os.tmpdir()); assert.equal(opts.input, 'Synthetic stdin'); assert.equal(opts.timeout, C.TIMEOUT_MS); assert.equal(opts.maxBuffer, C.MAX_BUFFER); assert.deepEqual(opts.stdio, ['pipe', 'pipe', 'pipe']);
   for (const [flag, value] of [['--tools', ''], ['--setting-sources', '']]) assert.equal(args[args.indexOf(flag) + 1], value); for (const flag of ['--strict-mcp-config', '--no-session-persistence']) assert.ok(args.includes(flag)); assert.ok(!args.includes('Synthetic stdin'));
   return { status: 0, stdout: JSON.stringify({ structured_output: { reply: 'Synthetic', id: 'r1', verdict: 'repeats' }, modelUsage: { [model]: { inputTokens: 2 } }, total_cost_usd: 0.01 }) };
  } });
  await runners.runReplay({ system: C.REPLAY_PREAMBLE, prompt: 'Synthetic stdin', schema: { type: 'object' } }); await runners.runJudge({ system: C.JUDGE_PROMPT, prompt: 'Synthetic stdin', schema: { type: 'object' } });
  assert.deepEqual(chosen, [C.REPLAY_RUNNER, C.JUDGE_RUNNER]);
  assert.deepEqual(invocations.map(({ args }) => [args[args.indexOf('--model') + 1], args[args.indexOf('--effort') + 1], args[args.indexOf('--max-budget-usd') + 1]]), [[C.REPLAY_MODEL, C.REPLAY_EFFORT, String(C.REPLAY_DOLLARS)], [C.JUDGE_MODEL, C.JUDGE_EFFORT, String(C.JUDGE_DOLLARS)]]);
 } finally { if (previous === undefined) delete process.env.MEMORY_SHAPE_RUNNER; else process.env.MEMORY_SHAPE_RUNNER = previous; }
}));
// req: R-3378
await check('seal: runners', () => assert.deepEqual([C.REPLAY_RUNNER, C.JUDGE_RUNNER], ['claude', 'claude']));
// req: R-3379
await check('seal: replay model and effort', () => assert.deepEqual([C.REPLAY_MODEL, C.REPLAY_EFFORT], ['claude-opus-5-5', 'xhigh']));
// req: R-3380
await check('seal: judge model and effort', () => assert.deepEqual([C.JUDGE_MODEL, C.JUDGE_EFFORT], ['claude-sonnet-5', 'low']));
// req: R-3381
await check('seal: draws and screen rule', () => assert.deepEqual([C.DRAWS, C.SCREEN_DRAWS, C.SCREEN_MIN_REPEATS], [5, 5, 1]));
// req: R-3382
await check('seal: dollar caps', () => assert.deepEqual([C.REPLAY_DOLLARS, C.JUDGE_DOLLARS, C.RUN_DOLLARS], [1, 0.1, 150]));
// req: R-3383
await check('seal: context and reply caps', () => assert.deepEqual([C.HISTORY_BUDGET, C.TOOL_RESULT_CAP, C.REPLY_CAP], [160000, 2000, 8000]));
// req: R-3384
await check('seal: bundle budget', () => assert.equal(C.BUNDLE_BUDGET, 8000));
// req: R-3385
await check('seal: slot markers and kept types', () => assert.deepEqual([C.SLOT_MARKERS, C.KEPT_TYPES, C.CONTROL_MODE, C.CEILING_ENABLED], [{ instruction: 'AutoMem', hooks: ['nana-shared-memory.mjs', 'nana-shared-memory', 'nana: shared memory index'], readPaths: ['memory/', 'memory\\', 'memory.md', 'shared-memory'] }, ['user', 'assistant', 'text', 'tool_use', 'tool_result'], 'historical', true]));
// req: R-3386
await check('seal: statistic and blind bars', () => assert.deepEqual([C.BENEFIT_LEVEL, C.HARM_LEVEL, C.MIN_INFORMATIVE, C.MIN_STRATUM, C.MIN_JUDGED, C.REPRODUCTION_FLOOR, C.BLIND_AGREE, C.BLIND_SIZE], [0.05, 0.05, 8, 8, 3, 0.30, 8, 10]));
// req: R-3387
await check('seal: prompt hashes', () => { assert.equal(typeof C.REPLAY_PREAMBLE, 'string'); assert.equal(typeof C.JUDGE_PROMPT, 'string'); assert.equal(crypto.createHash('sha256').update(C.REPLAY_PREAMBLE).digest('hex'), C.PREAMBLE_HASH); assert.equal(crypto.createHash('sha256').update(C.JUDGE_PROMPT).digest('hex'), C.JUDGE_HASH); assert.deepEqual([C.PREAMBLE_HASH, C.JUDGE_HASH], ['7893c6547fd75757df56a1d8a92345e0f36445ff59c248d076cb5840b39c7e2c', '89b0101cc9ff07a9033007d6161aa7f77d183370bfec6625deeeadf1ee3f62c9']); });
// req: R-3388
await check('seal: citation and capture', () => assert.deepEqual([C.CITES_WORDS, C.TIMEOUT_MS, C.MAX_BUFFER], [8, 900000, 67108864]));
// req: R-3389
await check('seal: output and fixed words', () => assert.deepEqual([C.OUTPUT_FILE, C.PLAN_FILE, C.SCREEN_FILE, C.SHEET_FILE, C.RUNS_DIR, C.SCREEN_DIR, C.WORDS], ['memory-replay.jsonl', 'plan.json', 'screen.jsonl', 'blind.jsonl', 'runs', 'screen', { changed: 'changed', invalid: 'invalid', unresolved: 'unresolved', noContext: 'no recorded context', late: 'late earlier instance', leaked: 'leaked', unjudged: 'unjudged', judgeMiss: 'judge-miss', unrun: 'unrun', unclear: 'unclear', stalls: 'stalls', ceiling: 'ceiling', oracle: 'oracle', confirmatory: 'confirmatory', exploratory: 'exploratory', incomplete: 'incomplete', fewer: 'bundle fewer repeats', more: 'bundle more repeats', noDecision: 'no decision', few: 'undecided: too few cases', weak: 'weak replay: control seldom repeats', pending: 'pending blind check', disagreement: 'judge disagreement', cites: 'cites bundle', read: 'control would read memory', larger: 'larger by', smaller: 'smaller by' }]));
