/**
 * @module apps/bench/test/anatomy-seat.test.mjs
 * @purpose Pin seat payload accounting and role-adapter reuse on synthetic transcripts only.
 * @inputs Synthetic OS-temp transcripts, injected runners and counts-only builder golden data.
 * @outputs Awaited bounded PASS/FAIL cases without private fixture values.
 * @effects disk (OS-temp fixtures), process (bounded synthetic git)
 * @errors Assertions set exit 1 and print only source locations.
 */
import { tmpDir } from "./tmp-dir.mjs";
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { extractSeatContexts } from '../lib/anatomy-seat.mjs';
import { runAnatomy } from '../lib/anatomy.mjs';
import { entriesIn } from '../../../packages/nana-pack/lib/claude-transcript.mjs';
import { projectKey } from '../../../packages/nana-setup/lib/project-key.mjs';
import { segmentPart } from '../lib/anatomy-spans.mjs';
import { distinctUnits, assembleParts } from '../lib/anatomy-measures.mjs';
import * as C from '../lib/anatomy-config.mjs';
import { desiredHooks } from '../../../packages/nana-setup/lib/settings.mjs';

const root = tmpDir(path.join(os.tmpdir(), 'seat-anatomy-'));
let serial = 0, failures = 0, cases = 0;
const folder = () => { const dir = path.join(root, String(++serial)); fs.mkdirSync(dir); return dir; };
const put = (file, text) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); return file; };
const jsonl = (file, rows, eol = '\r\n', final = false) => put(file, rows.map(r => JSON.stringify(r) + ' \t').join(eol) + (final ? eol : ''));
const text = s => [{ type: 'text', text: s }];
const user = (s, extra = {}) => ({ type: 'user', message: { content: text(s) }, ...extra });
const attachment = (type, fields = {}) => ({ type: 'attachment', attachment: { type, ...fields } });
const snapshot = s => attachment('prompt_snapshot', { systemPrompt: [s] });
const instructions = files => attachment('instructions', { files });
const hook = (s, source = 'startup', extra = {}) => attachment('hook_success', { hookEvent: 'SessionStart', hookName: `SessionStart:${source}`, command: 'nana-objective.mjs', content: s, ...extra });
const boundary = () => ({ type: 'system', subtype: 'compact_boundary' });
const assistant = (content = []) => ({ type: 'assistant', message: { content } });
const result = (id, content) => user('', { message: { content: [{ type: 'tool_result', tool_use_id: id, content }] } });
const good = async input => ({ ok: true, text: JSON.stringify({ units: JSON.parse(input.prompt).map(u => ({ id: u.id, label: 'task' })) }), usage: { tokens: 1, cost: 0.01 } });
async function cli(args, options = {}) {
 let stdout = '', stderr = '';
 const exit = await runAnatomy(args, { ...options, stdout: s => { stdout += s; }, stderr: s => { stderr += s; } });
 return { exit, stdout, stderr, value: exit === 0 && stdout.startsWith('{') ? JSON.parse(stdout) : null };
}
function fixture(groups, extras = []) {
 const repo = folder(), projects = folder();
 const files = groups.map((group, i) => {
  const session = group.session ?? `session-${i}`;
  const rows = group.rows.map((e, j) => ({ sessionId: session, uuid: `${session}-${j}`, timestamp: `2026-01-01T00:00:${String(j).padStart(2, '0')}.000Z`, cwd: '/synthetic/project', ...e }));
  return jsonl(path.join(projects, projectKey(repo), `${i}.jsonl`), rows, group.eol, group.final);
 });
 for (const name of extras) jsonl(path.join(projects, name, 'ignored.jsonl'), [snapshot('ignored')]);
 return { repo, projects, files };
}
async function segment(f, options = {}) {
 const out = path.join(folder(), 'store');
 const r = await cli(['segment', '--role', 'seat', '--repo', f.repo, '--projects', f.projects, '--out', out], options);
 assert.equal(r.exit, 0);
 return { ...r, out, contexts: entriesIn(path.join(out, 'contexts.jsonl')) };
}
const report = async s => { const r = await cli(['report', '--in', s.out]); assert.equal(r.exit, 0); return r.value.slots; };
const parts = s => s.contexts.flatMap(c => c.parts);
const size = (rows, kind) => rows.filter(p => p.name === kind).reduce((n, p) => n + p.raw.length, 0);
async function test(title, fn) {
 cases++; let timer;
 try { await Promise.race([Promise.resolve().then(fn), new Promise((_, reject) => { timer = setTimeout(() => reject(Error('limit')), 30000); })]); console.log(`PASS ${title}`); }
 catch (e) { failures++; console.log(`FAIL ${title}`); const location = e.stack?.match(/anatomy-seat\.test\.mjs:\d+:\d+/u)?.[0]; if (location) console.log(`assertion ${location}`); }
 finally { clearTimeout(timer); }
}

// req: R-3640
await test('R-3640: payload fields kinds delivery and coverage', async () => {
 const meta = 'METADATA_TRIPWIRE';
 const records = [snapshot('sys'), instructions([
  { type: 'User', path: '/rules/nana-writing.md', content: 'rule' }, { type: 'User', path: meta, content: 'other' },
  { type: 'Project', path: meta, content: 'project' }, { type: 'AutoMem', path: meta, content: 'memory' },
 ]), ...['nana-shared-memory.mjs', 'nana-objective.mjs', 'nana-adoption.mjs', 'nana-roster-notice.mjs', 'else'].map(command => hook('hook', 'startup', { command })),
 attachment('hook_additional_context', { hookEvent: 'SessionStart', content: ['extra'], toolUseID: 'separate' }),
 attachment('skill_listing', { content: 'skills-list' }), attachment('deferred_tools_delta', { addedLines: ['line'] }),
 attachment('agent_listing_delta', { addedBlocks: ['block'] }), attachment('mcp_instructions_delta', { addedLines: ['mcp'] }),
 attachment('deferred_tools_record', { entries: ['entry'] }), attachment('invoked_skills', { skills: [{ content: 'skill', path: meta }] }),
 attachment('file', { content: 'file' }), attachment('edited_text_file', { snippet: 'snippet' }), attachment('compact_file_reference', { path: meta }),
 attachment('environment', { snapshot: 'env' }), attachment('session_context', { context: 'context' }), attachment('date', { date: 'date' }), attachment('model', { text: 'model' }),
 attachment('auto_mode'), attachment('remote_session_change'), attachment('total_tokens_reminder', { text: 'tokens' }), attachment('silent_turn_reminder', { text: 'silent' }),
 ...['task_status', 'ultra_effort_on', 'thinking_drop', 'command_permissions', 'unknown-future'].map(t => attachment(t, { metadata: meta })),
 user('owner'), user('<task-notification>note</task-notification>'), user('meta', { isMeta: true }),
 attachment('hook_success', { hookEvent: 'UserPromptSubmit', content: 'knowledge' }), attachment('hook_cancelled'),
 ];
 for (const [eol, final] of [['\n', true], ['\r\n', true], ['\r\n', false]]) {
  const s = await segment(fixture([{ rows: records.map(e => ({ ...e, metadata: meta })), eol, final }]));
  const p = parts(s); assert(!JSON.stringify(p).includes(meta + '"metadata'));
  assert(p.every(p => !p.raw.includes(meta)));
  const expected = { 'system-prompt': 3, 'nana-writing': 4, 'user-rules-other': 5, 'project-instructions': 7, 'auto-memory': 6, 'shared-memory': 4, objective: 4, adoption: 4, 'roster-notice': 4, 'hook-other': 9, tools: 28, skills: 5, 'attached-files': 11, environment: 19, harness: 16, owner: 5, notification: 43, 'knowledge-pull': 9, 'attachment-other': 0 };
  for (const [kind, chars] of Object.entries(expected)) assert.equal(size(p, kind), chars, kind);
  for (const c of s.contexts) assert.deepEqual(assembleParts(c).parts.map(p => p.text), c.parts.map(p => p.raw));
  const r = await report(s);
  assert.equal(r.totals.recordedInputChars, 64); assert.equal(r.totals.unknownChars, 122);
  assert.equal(r.coverage.find(r => r.type === 'prompt_snapshot').found, 1);
  assert.deepEqual(r.coverage.find(r => r.type === 'attachment-other'), { type: 'attachment-other', entries: 1, found: 0, share: 0 });
 }
});

// req: R-3641
await test('R-3641: coalesced starts and turn phases', async () => {
 for (const signals of [[boundary(), user('summary', { isCompactSummary: true }), hook('refresh', 'compact')], [hook('refresh', 'compact'), user('summary', { isCompactSummary: true }), boundary()]]) {
  const s = await segment(fixture([{ rows: [snapshot('s'), instructions([]), user('first'), ...signals, hook('second', 'compact', { command: 'else' }), assistant(), attachment('hook_success', { hookEvent: 'UserPromptSubmit', content: 'turn' }), hook('clear', 'clear'), snapshot('new'), user('next'), hook('resume', 'resume'), instructions([])] }]));
  assert.equal(s.contexts.length, 4); assert.deepEqual(s.contexts.map(c => c.start), ['startup', 'compact', 'clear', 'resume']);
  assert.equal(parts(s).find(p => p.raw === 'turn').phase, 'turn');
  assert.equal(parts(s).find(p => p.raw === 'summary').phase, 'standing');
  assert.equal(parts(s).find(p => p.raw === 'new').phase, 'standing');
 }
 const s = await segment(fixture([{ rows: [snapshot('s'), user('first'), boundary(), user('sum', { isCompactSummary: true }), assistant(), user('continued')] }]));
 assert.equal(s.contexts.length, 2); assert.equal(s.contexts[1].start, 'compact');
 assert.deepEqual(s.contexts[1].excluded.map(e => e.reason).sort(), ['unrecorded-instructions', 'unrecorded-system']);
 assert.equal(parts(s).find(p => p.raw === 'continued').phase, 'turn');
});

// req: R-3641
await test('R-3641: realistic compact attachment order', async () => {
 const rows = [snapshot('old'), user('first'), boundary(), instructions([{ type: 'Project', content: 'rules' }]),
  attachment('session_context', { context: 'context' }), attachment('date', { date: 'date' }), user('summary', { isCompactSummary: true }),
  attachment('total_tokens_reminder', { text: 'tokens' }), attachment('file', { content: 'file' }), attachment('task_status', { text: 'task' }),
  attachment('invoked_skills', { skills: [{ content: 'skill' }] }), attachment('skill_listing', { content: 'tools' }),
  attachment('deferred_tools_delta', { addedLines: ['delta'] }), attachment('environment', { snapshot: 'env' }), attachment('model', { text: 'model' }),
  hook('refresh', 'compact'), snapshot('new')];
 for (const [eol, final] of [['\n', true], ['\r\n', true], ['\r\n', false]]) {
  const s = await segment(fixture([{ rows, eol, final }]));
  assert.equal(s.contexts.length, 2);
  assert.equal(s.contexts[1].start, 'compact');
  assert(s.contexts[1].parts.every(p => p.phase === 'standing'));
  assert.deepEqual(s.contexts[1].excluded, []);
 }
});

// req: R-3640
await test('R-3640: public hook labels and commandless attribution', async () => {
 const hooks = desiredHooks({ hooksDir: '/synthetic/hooks', repoRoot: '/synthetic/repo' }).filter(h => h.event === 'SessionStart');
 const expected = ['objective', 'adoption', 'shared-memory', 'roster-notice'];
 for (const [i, h] of hooks.entries()) {
  const s = await segment(fixture([{ rows: [hook('success', 'startup', { command: h.entry.statusMessage }),
   attachment('hook_additional_context', { hookEvent: 'SessionStart', content: 'additional' })] }]));
  assert.deepEqual(parts(s).map(p => p.name), [expected[i], expected[i] === 'roster-notice' ? 'roster-notice' : 'hook-other']);
 }
 const s = await segment(fixture([{ rows: [attachment('hook_additional_context', { hookEvent: 'SessionStart', content: 'orphan' })] }]));
 assert.equal(parts(s)[0].name, 'hook-other');
});

const publicHooks = desiredHooks({ hooksDir: '', repoRoot: '' }).filter(h => h.event === 'SessionStart');
const labelledHook = (kind, content = '', source = 'compact', extra = {}) => hook(content, source, { command: publicHooks.find(h => h.marker.includes(`nana-${kind}.`)).entry.statusMessage, toolUseID: 'group', ...extra });
const commandless = (content, extra = {}) => attachment('hook_additional_context', { hookEvent: 'SessionStart', hookName: 'SessionStart', toolUseID: 'unrelated', content, ...extra });

// req: R-3682
await test('R-3682: real-shaped window attribution conserves characters', async () => {
 for (const source of ['compact', 'startup', 'clear']) for (const early of [false, true]) {
  const context = 'synthetic roster context';
  const rows = [labelledHook('shared-memory', 'memory', source), labelledHook('roster-notice', '', source, { stdout: JSON.stringify({ hookSpecificOutput: { additionalContext: context } }) }), labelledHook('adoption', 'adoption', source), labelledHook('objective', 'objective', source)];
  rows.splice(early ? 1 : rows.length, 0, commandless(context));
  const s = await segment(fixture([{ rows }])), r = await report(s);
  assert.equal(parts(s).find(p => p.raw === context)?.name, 'roster-notice', 'M1 resolved producer kind');
  assert.equal(s.contexts.length, 1); assert.equal(s.contexts[0].start, source);
  assert(parts(s).every(p => p.phase === 'standing'));
  assert.equal(r.kinds.find(k => k.kind === 'roster-notice').chars, context.length, 'M1 report roster characters');
  assert.equal(size(parts(s), 'objective'), 'objective'.length);
  assert.equal(r.totals.recordedInputChars, context.length + 'memoryadoptionobjective'.length, 'M1 conserved total');
  assert.deepEqual(assembleParts(s.contexts[0]).parts.map(p => p.text), parts(s).map(p => p.raw));
 }
});

// req: R-3683
await test('R-3683: unresolved failed closed and competing producers never guess', async () => {
 for (const toolUseID of [undefined, 'group', 'different']) {
  const s = await segment(fixture([{ rows: [labelledHook('objective', '', 'startup', { stdout: 'plain output\n' }), commandless('unresolved', { toolUseID })] }]));
  assert.equal(parts(s).find(p => p.raw === 'unresolved').name, 'hook-other', `M2 no producer ${toolUseID ?? 'missing'}`);
 }
 const failed = labelledHook('roster-notice'); failed.attachment.type = 'hook_non_blocking_error';
 const s = await segment(fixture([{ rows: [failed, hook('', 'compact', { command: 'foreign', stdout: '{"additionalContext":"notice"}' }), commandless('notice')] }]));
 assert.equal(parts(s).find(p => p.raw === 'notice').name, 'hook-other', 'M2 failed and foreign hooks');
 const closed = await segment(fixture([{ rows: [labelledHook('roster-notice'), assistant(), commandless('later')] }]));
 assert.equal(closed.contexts.length, 2); assert.deepEqual(closed.contexts.map(c => c.start), ['compact', 'unknown']);
 assert.equal(parts(closed).find(p => p.raw === 'later').name, 'hook-other', 'M2 closed window');
 assert.equal(parts(closed).find(p => p.raw === 'later').phase, 'standing');
 const competing = await segment(fixture([{ rows: [labelledHook('roster-notice'), commandless('ambiguous', { toolUseID: undefined }), labelledHook('objective')] }]), { adapters: { 'claude-code:seat': args => extractSeatContexts({ ...args, policy: { ...C.SEAT_POLICY, contextHooks: ['roster-notice', 'objective'] } }) } });
 assert.equal(parts(competing).find(p => p.raw === 'ambiguous').name, 'hook-other', 'M2 competing producer kinds');
 assert.equal(competing.contexts.flatMap(c => c.ambiguous).filter(a => a.reason === 'hook-correlation').length, 1, 'M2 exactly one ambiguity');
});

// req: R-3684, R-3643
await test('R-3684: labels not text and producer-only dedupe', async () => {
 for (const context of ['objective', 'shared memory', 'other content\r\n \t']) {
  const s = await segment(fixture([{ rows: [labelledHook('roster-notice', '', 'startup', { stdout: JSON.stringify({ hookSpecificOutput: { additionalContext: context } }) }), labelledHook('objective', `prefix ${context} suffix`, 'startup'), commandless(context, { toolUseID: undefined })] }])), r = await report(s);
  assert.equal(parts(s).find(p => p.raw === context)?.name, 'roster-notice', 'M3 objective overlap cannot remove roster');
  assert.equal(size(parts(s), 'objective'), `prefix ${context} suffix`.length);
  assert.equal(r.totals.recordedInputChars, context.length + `prefix ${context} suffix`.length, 'M3 stdout uncounted');
  const swapped = await segment(fixture([{ rows: [labelledHook('objective', '', 'startup', { stdout: context }), commandless(context)] }]));
  assert.equal(parts(swapped)[1].name, 'hook-other', 'M3 label swap changes attribution');
 }
 for (const envelope of [{ additionalContext: 'duplicate' }, { hookSpecificOutput: { additionalContext: 'duplicate' } }]) {
  const raw = JSON.stringify(envelope);
  const s = await segment(fixture([{ rows: [labelledHook('roster-notice', raw), commandless('duplicate')] }]));
  assert.equal(parts(s).length, 1, 'M3 producer envelope dedupes once');
  assert.equal(size(parts(s), 'roster-notice'), raw.length);
 }
});

// req: R-3642
await test('R-3642: inherited sessions order invariance and skips', async () => {
 const prefix = [{ ...snapshot('system'), uuid: 'shared-system', timestamp: '2026-01-01T00:00:00Z' }, user('prefix', { uuid: 'shared-owner', timestamp: '2026-01-01T00:00:01Z' })];
 const f = fixture([{ session: 'a-original', rows: prefix }, { session: 'a-original', rows: [...prefix, user('new')] }, { session: 'z-fork', rows: [...prefix, user('fork-new'), user('side', { isSidechain: true })] }], ['x-wt-y', 'else-project', 'x-private-tmp-y']);
 put(f.files[2], fs.readFileSync(f.files[2], 'utf8') + '\r\n{torn');
 const s = await segment(f), r = await report(s);
 assert.equal(r.sessions.length, 2); assert.equal(r.sessions.reduce((n, s) => n + s.newChars, 0), 23);
 assert.equal(r.sessions.reduce((n, s) => n + s.inheritedChars, 0), 24);
 assert.deepEqual(r.sessions.map(s => [s.newChars, s.inheritedChars, s.ownerTurns]), [[15, 12, 2], [8, 12, 1]]);
 for (const reason of ['worktree', 'other-project', 'private-tmp', 'sidechain', 'torn-line']) assert.equal(r.skipped.find(s => s.reason === reason).count, 1);
 const bytes = f.files.map(file => fs.readFileSync(file)); bytes.reverse().forEach((b, i) => fs.writeFileSync(f.files[i], b));
 const reversed = await segment(f); assert.deepEqual(await report(reversed), r);
 // Timestamp ownership, not filename or encounter order, owns a copied UUID.
 const later = fixture([{ session: 'z', rows: [user('same', { uuid: 'shared', timestamp: '2026-01-02T00:00:00Z' })] }, { session: 'a', rows: [user('same', { uuid: 'shared', timestamp: '2026-01-01T00:00:00Z' })] }]);
 const lr = await report(await segment(later)); assert.deepEqual(lr.sessions.map(s => [s.newChars, s.inheritedChars]), [[4, 0], [0, 4]]);
});

// req: R-3643
await test('R-3643: hook invocation and queued owner identity', async () => {
 const additional = (s, id) => attachment('hook_additional_context', { hookEvent: 'SessionStart', content: [s], ...(id ? { toolUseID: id } : {}) });
 const q = s => attachment('queued_command', { prompt: s, humanTurn: true });
 const s = await segment(fixture([{ rows: [snapshot('s'), hook('same', 'startup', { toolUseID: 'h1' }), additional('same', 'h1'), hook('{"additionalContext":"json"}', 'startup', { toolUseID: 'h2' }), additional('json', 'h2'), user('one'), hook('same', 'resume', { toolUseID: 'h3' }), user('two'), hook('changed', 'resume', { toolUseID: 'h4' }), hook('a', 'resume'), hook('b', 'resume'), additional('unsettled'), q('queued'), user('queued'), q('absent'), user('repeat'), user('repeat')] }]));
 const r = await report(s);
 assert.equal(size(parts(s), 'objective'), 4 + 28 + 4 + 7 + 1 + 1);
 assert.equal(r.repeats.repeatedDelivery.chars, 4 + 7 + 1 + 1 + 9);
 assert.equal(r.ownerTurns, 6); assert.equal(r.events.find(e => e.reason === 'queued-unmatched').count, 1);
 assert.equal(r.ambiguous.find(e => e.reason === 'hook-correlation'), undefined);
 assert.equal(size(parts(s), 'hook-other'), 4 + 4 + 9);
 assert.equal(parts(s).filter(p => p.raw === 'same').length, 3);
});

// req: R-3644
await test('R-3644: seat tool classes conserve result characters', async () => {
 const specs = [['Read', { file_path: 'README.md' }, 'docs'], ['Grep', { path: 'test/a.test.mjs' }, 'tests'], ['Glob', { path: 'src' }, 'source'], ['Bash', { command: 'cat docs/a.md | head src/b.mjs' }, null], ['Read', { file_path: '/home/memory/a.md' }, 'memory'], ['Agent', {}, 'delegation'], ['WebFetch', {}, 'web'], ['Skill', {}, 'skill'], ['Edit', {}, 'write'], ['Alien', {}, 'other']];
 const rows = [snapshot('s')];
 specs.forEach(([name, input], i) => rows.push(assistant([{ type: 'tool_use', id: `t${i}`, name, input }]), result(`t${i}`, '12345')));
 const s = await segment(fixture([{ rows }])), r = await report(s);
 assert.equal(s.contexts.flatMap(c => c.pulls).reduce((n, p) => n + p.chars, 0), 50);
 const expected = { docs: [2, 7], tests: [1, 5], source: [2, 8], memory: [1, 5], delegation: [1, 5], web: [1, 5], skill: [1, 5], write: [1, 5], other: [1, 5] };
 for (const [cls, [calls, chars]] of Object.entries(expected)) { const row = r.reads.find(r => r.class === cls); assert.deepEqual([row.calls, row.chars], [calls, chars]); }
 assert.equal(r.reads.reduce((n, r) => n + r.chars, 0), 50);
});

// req: R-3645
await test('R-3645: complete kind totals and distinct repeat denominators', async () => {
 const s = await segment(fixture([{ rows: [snapshot('s'), instructions([{ type: 'Project', path: 'same-file', content: '# Heading\r\n\r\nRead /a/file. \t' }]), attachment('skill_listing', { content: 'x'.repeat(24000) }), user('go'), hook('h', 'resume'), instructions([{ type: 'Project', path: 'same-file', content: '# Heading\n\nRead /longer/file.' }]), attachment('skill_listing', { content: 'x'.repeat(24000) })] }]));
 // Normalization uses each context's own cwd; raw lengths intentionally differ.
 s.contexts[0].cwd = '/a'; s.contexts[1].cwd = '/longer'; jsonl(path.join(s.out, 'contexts.jsonl'), s.contexts);
 const r = await report(s);
 assert.equal(r.kinds.find(k => k.kind === 'tools').chars, 48000);
 assert.equal(r.kinds.find(k => k.kind === 'project-instructions').chars, 57);
 assert.equal(r.repeats.repeatedDelivery.chars, 24000 + 29);
 assert.equal(r.repeats.exactDuplicate.chars, 24000);
 assert.equal(r.repeats.normalizedDuplicate.units, 2);
 assert.equal(r.repeats.repeatedDelivery.basis, 'new payload chars with the same session kind and slot identity in a later segment');
 assert.equal(r.repeats.exactDuplicate.basis, 'new payload chars byte-identical after the first payload');
 assert.equal(r.repeats.normalizedDuplicate.basis, 'new unit occurrences equal after normalize, including oversize, after the first');
 assert.equal(r.totals.recordedInputChars, 61); assert.equal(r.totals.unknownChars, 48000);
});

// req: R-3646
await test('R-3646: correction joins distinguish all outcomes and sources', async () => {
 const s = await segment(fixture([{ session: 'private-session', rows: [snapshot('s'), ...['a', 'b', 'c', 'd', 'e'].map(uuid => user(uuid, { uuid })), assistant([{ type: 'tool_use', id: 'ask', name: 'AskUserQuestion', input: {} }]), result('ask', 'answer')] }]));
 const ptr = uuid => `claude-code:private-session#${uuid}`;
 const evidence = [ { evidence: ptr('a') + '+seat', kind: 'correction' }, { evidence: ptr('a') + '+other', kind: 'correction' }, { evidence: ptr('b'), kind: 'decision' }, { evidence: ptr('c'), kind: 'correction' }, { evidence: ptr('c') + '+seat', kind: 'decision' }, { evidence: ptr('private-session-7') + '+ask', kind: 'decision' }, { evidence: ptr('missing'), kind: 'correction' }, { evidence: 'claude-code:absent#x', kind: 'correction' } ];
 for (const source of ['estimated', 'labelled']) {
  const rows = source === 'estimated' ? evidence.map(r => ({ ...r, claim: 'synthetic', type: 'user', quote: 'synthetic', context: '', date: '2026-01-01' })) : [...evidence, { evidence: ptr('d'), kind: 'none' }];
  const file = jsonl(path.join(folder(), 'corrections.jsonl'), rows);
  const r = await cli(['report', '--in', s.out, '--corrections', file]); assert.equal(r.exit, 0);
  assert.deepEqual(r.value.slots.corrections, { source, ownerTurns: 5, correction: 1, decision: 1, none: source === 'labelled' ? 1 : 0, unlabelled: source === 'labelled' ? 1 : 2, conflict: 1, structuredAnswers: 1, outside: 1, missingTurn: 1, sessions: [{ session: 'seat-1', ownerTurns: 5, correction: 1, decision: 1, none: source === 'labelled' ? 1 : 0, unlabelled: source === 'labelled' ? 1 : 2, conflict: 1, structuredAnswers: 1, missingTurn: 1 }] });
 }
 const bad = put(path.join(folder(), 'bad'), '{"evidence":"private","kind":"bad"}');
 const refused = await cli(['report', '--in', s.out, '--corrections', bad]); assert.equal(refused.exit, 1); assert.equal(refused.stderr, 'anatomy: invalid corrections\n');
});

// req: R-3647
await test('R-3647: every seat command keeps tripwires private', async () => {
 const sentinel = 'SEAT_PRIVATE_TRIPWIRE';
 const f = fixture([{ session: sentinel, rows: [snapshot(sentinel), instructions([{ type: 'User', path: sentinel, content: sentinel }, ...Array.from({ length: C.LABEL_BATCH_UNITS * C.LABEL_PROGRESS_EVERY }, (_, i) => ({ type: 'Project', path: `${sentinel}-${i}`, content: `${sentinel} ${i}` }))]), hook(sentinel), user(sentinel), assistant([{ type: 'tool_use', id: sentinel, name: 'Read', input: { file_path: sentinel } }]), result(sentinel, sentinel)].map(e => ({ ...e, cwd: sentinel, metadata: sentinel })) }]);
 const s = await segment(f); assert(s.contexts.every(c => /^seat-\d+:s\d+$/u.test(c.id)));
 const labels = path.join(folder(), 'labels');
 const labelled = await cli(['label', '--in', s.out, '--out', labels], { runModel: good });
 assert.match(labelled.stdout, /^progress calls /mu);
 const failed = await cli(['label', '--in', s.out, '--out', path.join(folder(), 'failure')], { runModel: async () => { throw Error(sentinel); } });
 const corrections = jsonl(path.join(folder(), 'corrections'), [{ evidence: `claude-code:${sentinel}#${sentinel}-3`, kind: 'none' }]);
 const sampleOut = path.join(folder(), 'sample'); const sample = await cli(['sample', '--in', s.out, '--out', sampleOut, '--seed', 'fixed']);
 const sheet = jsonl(path.join(folder(), 'sheet'), entriesIn(path.join(sampleOut, 'sheet.jsonl')).map(r => ({ id: r.id, label: 'task' })));
 const outputs = [s, labelled, failed, sample, await cli(['agree', '--in', s.out, '--a', sheet, '--b', sheet]), await cli(['assemble', '--in', s.out, '--out', path.join(folder(), 'assembled')])];
 for (const args of [[], ['--labels', labels], ['--corrections', corrections]]) outputs.push(await cli(['report', '--in', s.out, ...args]));
 for (const r of outputs) { assert.equal(r.exit, 0); assert(!`${r.stdout}${r.stderr}`.includes(sentinel)); }
 const checkout = folder(); fs.mkdirSync(path.join(checkout, '.git'));
 const refused = await cli(['segment', '--role', 'seat', '--repo', 'absent', '--projects', 'absent', '--out', path.join(checkout, 'out')]);
 assert.equal(refused.exit, 1); assert.equal(refused.stderr, 'anatomy: output checkout refused\n'); assert(!fs.existsSync(path.join(checkout, 'out')));
});

async function builderGolden() {
 const repo = folder(), sessions = folder();
 const git = (...args) => { const r = spawnSync('git', args, { cwd: repo, encoding: 'utf8', timeout: 10000 }); assert.equal(r.status, 0); };
 git('init', '-q');
 jsonl(path.join(sessions, 'a.jsonl'), [{ type: 'session', cwd: repo }, { type: 'session_info', name: 'pi-worker-synthetic' }, { type: 'message', message: { role: 'system', sections: { preamble: 'Synthetic preamble.', skills: '<skills>synthetic</skills>', tools: 'Tool one.\n\nTool two.' } } }, { type: 'message', message: { role: 'user', content: text('Synthetic instruction.') } }]);
 const out = path.join(folder(), 'builder'); const seg = await cli(['segment', '--repo', repo, '--sessions', sessions, '--out', out]); assert.equal(seg.exit, 0);
 const contexts = entriesIn(path.join(out, 'contexts.jsonl'));
 const plain = await cli(['report', '--in', out]); assert.equal(plain.exit, 0);
 const labels = path.join(folder(), 'labels'); assert.equal((await cli(['label', '--in', out, '--out', labels], { runModel: good })).exit, 0);
 const labelled = await cli(['report', '--in', out, '--labels', labels]); assert.equal(labelled.exit, 0);
 const clean = value => JSON.parse(JSON.stringify(value, (_key, v) => v === repo ? '<ROOT>' : v === path.basename(repo) ? '<LANE>' : v === `feat/${path.basename(repo)}` ? 'feat/<LANE>' : v));
 return { contexts: clean(contexts), segment: clean(seg.value), plain: clean(plain.value), labelled: clean(labelled.value) };
}
// req: R-3648
await test('R-3648: reusable adapters labels and builder golden regression', async () => {
 const actual = await builderGolden();
 if (process.env.SEAT_RECORD_GOLDEN) put(process.env.SEAT_RECORD_GOLDEN, JSON.stringify(actual, null, 2) + '\n');
 else assert.deepEqual(actual, JSON.parse(fs.readFileSync(new URL('../../../docs/reviews/seat-anatomy-2026-11-02/builder-golden.json', import.meta.url), 'utf8')));
 const s = await segment(fixture([{ rows: [snapshot('system'), user('unique'), attachment('skill_listing', { content: 'x'.repeat(24000) })] }]));
 let sent = 0; const labels = path.join(folder(), 'labels');
 assert.equal((await cli(['label', '--in', s.out, '--out', labels], { runModel: async input => { sent += JSON.parse(input.prompt).length; return good(input); } })).exit, 0);
 assert.equal(sent, distinctUnits(s.contexts).size);
 for (const args of [['report', '--labels', labels], ['sample', '--labels', labels, '--seed', 'fixed', '--out', path.join(folder(), 'sample')], ['assemble', '--out', path.join(folder(), 'assemble')]]) assert.equal((await cli([...args, '--in', s.out])).exit, 0);
 const raw = 'Synthetic planner'; const out = path.join(folder(), 'fake');
 const fake = { contexts: [{ id: 'planner-1', role: 'planner', runtime: 'fake', lane: 'planner', parts: [{ name: 'system-prompt', raw, phase: 'standing', delivery: 'recorded-input', spans: segmentPart(raw, 'system-prompt', 'planner-1:p0') }], excluded: [], pulls: [] }], skipped: [], denominators: { files: 1 } };
 assert.equal((await cli(['segment', '--runtime', 'fake', '--role', 'planner', '--repo', 'unused', '--out', out], { adapters: { 'fake:planner': async () => fake } })).exit, 0);
 const r = await cli(['report', '--in', out]); assert.equal(r.exit, 0); assert.equal(r.value.slots.totals.recordedInputChars, raw.length);
});
// req: R-3640, R-3641, R-3643
await test('R-3640: seal seat extraction policy', () => {
 assert.deepEqual(C.SEAT_POLICY, {
  payloads: {
   prompt_snapshot: ['system-prompt', 'recorded-input', ['systemPrompt']],
   skill_listing: ['tools', 'unknown', ['content']], deferred_tools_delta: ['tools', 'unknown', ['addedLines', 'addedBlocks']], agent_listing_delta: ['tools', 'unknown', ['addedLines', 'addedBlocks']], mcp_instructions_delta: ['tools', 'unknown', ['addedLines', 'addedBlocks']], deferred_tools_record: ['tools', 'unknown', ['entries']],
   invoked_skills: ['skills', 'unknown', ['skills.content']], file: ['attached-files', 'unknown', ['content']], edited_text_file: ['attached-files', 'unknown', ['snippet']], compact_file_reference: ['attached-files', 'unknown', []],
   environment: ['environment', 'unknown', ['snapshot']], session_context: ['environment', 'unknown', ['context']], date: ['environment', 'unknown', ['date']], model: ['environment', 'unknown', ['text']], auto_mode: ['environment', 'unknown', []], remote_session_change: ['environment', 'unknown', []],
   total_tokens_reminder: ['harness', 'unknown', ['text']], silent_turn_reminder: ['harness', 'unknown', ['text']], task_status: ['harness', 'unknown', ['text']], ultra_effort: ['harness', 'unknown', ['text']], thinking_drop: ['harness', 'unknown', ['text']], command_permissions: ['harness', 'unknown', ['text']],
  },
  rules: ['nana-soul', 'nana-standards', 'nana-writing', 'nana-rulings'], splitters: { tools: 'toolsAdded' },
  instructions: { User: 'user-rules-other', Project: 'project-instructions', AutoMem: 'auto-memory' },
  hooks: [['nana-objective', 'objective'], ['nana-adoption', 'adoption'], ['nana-roster-notice', 'roster-notice']],
  contextHooks: ['roster-notice'],
  starts: ['startup', 'resume', 'clear', 'compact'], standing: ['system-prompt', 'project-instructions', 'auto-memory', 'user-rules-other', 'tools', 'environment'],
  correlation: { invocation: 'toolUseID', envelope: 'additionalContext', nestedEnvelope: 'hookSpecificOutput.additionalContext', human: 'humanTurn' },
  tools: { read: 'Read', grep: 'Grep', find: 'Glob', bash: 'Bash', delegation: ['Agent', 'Task'], web: ['WebFetch', 'WebSearch'], skill: ['Skill'], write: ['Edit', 'Write', 'NotebookEdit'] },
 });
});
// req: R-3644
await test('R-3644: seal seat class functions', () => assert.deepEqual(C.SEAT_CLASS_FUNCTION, { ...C.CLASS_FUNCTION, memory: 'knowledge', delegation: 'knowledge', web: 'knowledge', skill: 'tools', write: 'task', other: 'unsorted' }));
fs.rmSync(root, { recursive: true, force: true });
console.log(`seat anatomy: ${cases - failures}/${cases} checks passed`);
process.exitCode = failures ? 1 : 0;
