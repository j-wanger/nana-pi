/**
 * @module apps/bench/lib/anatomy-seat.mjs
 * @purpose Adapt streamed Claude Code main-thread seat records into private role contexts.
 * @inputs Explicit repository and projects roots and configured field and event policies.
 * @outputs Segmented contexts, private evidence aliases and counts-only skip denominators.
 * @effects disk (explicit transcript roots only)
 * @errors Read failures propagate to the sanitized CLI boundary.
 */
import path from 'node:path';
import crypto from 'node:crypto';
import { streamEntriesIn, transcriptFiles } from '../../../packages/nana-pack/lib/claude-transcript.mjs';
import { ownerTurn, textOnly } from '../../../packages/nana-pack/lib/memory-making.mjs';
import { WRAPPER_TAGS } from '../../../packages/nana-pack/lib/memory-making-config.mjs';
import { SLOT_MARKERS } from '../../../packages/nana-pack/lib/memory-replay-config.mjs';
import { desiredHooks } from '../../../packages/nana-setup/lib/settings.mjs';
import { projectKey } from '../../../packages/nana-setup/lib/project-key.mjs';
import { SEAT_POLICY as P, SEAT_CLASS_FUNCTION } from './anatomy-config.mjs';
import { segmentPart } from './anatomy-spans.mjs';
import { callClasses } from './anatomy-pulls.mjs';

// Select strings only, never recursive object values: ids and paths are not payload.
function strings(value) {
 if (typeof value === 'string') return [value];
 return Array.isArray(value) ? value.flatMap(strings) : [];
}
function field(value, keys) {
 if (!keys.length) return strings(value);
 if (Array.isArray(value)) return value.flatMap(v => field(v, keys));
 return field(value?.[keys[0]], keys.slice(1));
}
const bodyOf = e => Array.isArray(e.message?.content) ? e.message.content : [];
const hookEvent = a => (a?.hookEvent ?? a?.hookName)?.split(':')[0];
const sessionHook = a => ['hook_success', 'hook_additional_context'].includes(a?.type) && hookEvent(a) === 'SessionStart';
const boundaryOf = e => e.type === 'compact_boundary' || e.subtype === 'compact_boundary' || e.isCompactSummary || sessionHook(e.attachment);
const hookLabels = desiredHooks({ hooksDir: '', repoRoot: '' }).filter(h => h.event === 'SessionStart');
function hookKind(a) {
 const command = a.command ?? '';
 const labelled = hookLabels.find(h => h.entry.statusMessage === command);
 if (labelled) return hookKind({ command: labelled.spec.script });
 if (SLOT_MARKERS.hooks.some(marker => command.includes(marker))) return 'shared-memory';
 return P.hooks.find(([marker]) => command.includes(marker))?.[1] ?? 'hook-other';
}
function typeOf(a) { return a?.type?.startsWith('ultra_effort_') ? 'ultra_effort' : a?.type; }
function closesWindow(e) {
 const a = e.attachment;
 return e.type === 'assistant' || ownerTurn(e) || bodyOf(e).some(p => p.type === 'tool_result') ||
  a?.type === 'queued_command' || hookEvent(a) === 'UserPromptSubmit' || a?.type === 'hook_cancelled';
}
function startKind(e) {
 if (e.type === 'compact_boundary' || e.subtype === 'compact_boundary' || e.isCompactSummary) return 'compact';
 const suffix = e.attachment?.hookName?.split(':')[1];
 return P.starts.includes(suffix) ? suffix : 'unknown';
}
const rank = e => [Number.isFinite(Date.parse(e.timestamp)) ? Date.parse(e.timestamp) : Infinity, e.sessionId ?? '', e.uuid ?? ''];
const compare = (a, b) => { const x = rank(a), y = rank(b); return (x[0] === y[0] ? 0 : x[0] < y[0] ? -1 : 1) || x[1].localeCompare(y[1]) || x[2].localeCompare(y[2]); };

/** Two streaming passes establish UUID ownership before materializing one logical session.
 * Physical resume copies and forks retain their inherited prefixes separately.
 * Parent edges break timestamp ties, so a tool result cannot precede its call.
 */
export async function extractSeatContexts({ repo, projects, policy = P }) {
 const skipped = [], observe = row => skipped.push(row);
 const files = transcriptFiles(projects, name => name === projectKey(path.resolve(repo)), { observe });
 const owners = new Map(), descriptions = [];
 for (const { file } of files) {
  const description = { file, sessions: new Set(), first: Infinity, last: -Infinity }, digest = crypto.createHash('sha256');
  let session, version = 'unknown';
  for await (const e of streamEntriesIn(file, { observe })) {
   if (e.isSidechain) { observe({ reason: 'sidechain' }); continue; }
   digest.update(JSON.stringify(e));
   const time = Date.parse(e.timestamp);
   if (Number.isFinite(time)) { description.first = Math.min(description.first, time); description.last = Math.max(description.last, time); }
   session = e.sessionId ?? session; version = e.version ?? version;
   if (e.sessionId) description.sessions.add(e.sessionId);
   if (e.uuid) {
    const candidate = { timestamp: e.timestamp, sessionId: e.sessionId, uuid: e.uuid, description }, previous = owners.get(e.uuid);
    if (!previous || compare(candidate, previous[0]) < 0) owners.set(e.uuid, [candidate]);
    else if (compare(candidate, previous[0]) === 0) previous.push(candidate);
   }
  }
  Object.assign(description, { session, version, key: digest.digest('hex') });
  if (session) descriptions.push(description);
  else observe({ reason: 'missing-session' });
 }
 // Equal occurrences own one logical event. A content-derived physical
 // representative assigns its new copy independently of directory order.
 for (const [uuid, candidates] of owners) owners.set(uuid, candidates.sort((a, b) => (a.description.session ?? '').localeCompare(b.description.session ?? '') || a.description.key.localeCompare(b.description.key))[0]);
 const sessions = [...new Set(descriptions.flatMap(d => [...d.sessions]))].sort(), contexts = [];
 const owningFiles = new Map();
 for (const owner of owners.values()) {
  const selected = owningFiles.get(owner.sessionId) ?? new Set(); selected.add(owner.description); owningFiles.set(owner.sessionId, selected);
 }
 for (const [ordinal, session] of sessions.entries()) {
  const alias = `seat-${ordinal + 1}`;
  let segment = 0;
  for (const description of descriptions.filter(d => d.session === session || owningFiles.get(session)?.has(d)).sort((a, b) => a.first - b.first || a.last - b.last || a.key.localeCompare(b.key))) {
   const entries = new Map(), { file } = description;
   let index = 0;
   for await (const e of streamEntriesIn(file)) {
    const key = e.uuid ?? `${file}:${index}`; index++;
    if (e.isSidechain || (description.session !== session && e.sessionId !== session)) continue;
    if (!entries.has(key) || compare(e, entries.get(key)) < 0) entries.set(key, e);
   }
  const ordered = [...entries.values()].sort(compare), visited = new Set(), byUuid = new Map(ordered.filter(e => e.uuid).map(e => [e.uuid, e])), sorted = [];
  for (const entry of ordered) {
   const chain = [], pending = new Set(); let e = entry;
   while (e && !visited.has(e)) {
    if (pending.has(e)) { observe({ reason: 'parent-cycle' }); break; }
    pending.add(e); chain.push(e); e = byUuid.get(e.parentUuid);
   }
   for (const ancestor of chain.reverse()) { visited.add(ancestor); sorted.push(ancestor); }
  }
  let current, window = true;
  const open = start => {
   current = { id: `${alias}:s${++segment}`, session: alias, sourceSession: session, role: 'seat', runtime: 'claude-code', lane: 'seat', cwd: '', branch: '', start, version: description.version, inheritedChars: 0, parts: [], pulls: [], excluded: [], coverage: [], events: [], ambiguous: [], turns: [], entries: [] };
   contexts.push(current); window = true;
  };
  const contextStart = contexts.length;
  open('startup');
  const push = (name, raw, e, extra = {}) => {
   const inherited = Boolean(e.uuid && (owners.get(e.uuid)?.description !== description || owners.get(e.uuid)?.sessionId !== session));
   const prefix = `${current.id}:p${current.parts.length}`;
   const p = { name, raw, attempt: 0, phase: window ? 'standing' : 'turn', delivery: 'unknown', identity: name, inherited, ...extra, spans: segmentPart(raw, P.splitters[name] ?? name, prefix) };
   current.parts.push(p); if (inherited) current.inheritedChars += raw.length;
   return p;
  };
  // Commandless attribution uses complete start windows, never adjacency or ids.
  const windows = new Map();
  for (const e of sorted) {
   if (boundaryOf(e)) {
    const start = startKind(e);
    if (!window) open(start);
    else if (start !== 'unknown' && (current.start === 'unknown' || start === 'compact' || current.start === 'startup')) current.start = start;
   } else if (closesWindow(e)) window = false;
   const inherited = Boolean(e.uuid && (owners.get(e.uuid)?.description !== description || owners.get(e.uuid)?.sessionId !== session));
   current.cwd ||= e.cwd ?? '';
   if (e.uuid) current.entries.push({ uuid: e.uuid, sourceSession: owners.get(e.uuid)?.sessionId ?? session, inherited, structured: false });
   const a = e.attachment, type = typeOf(a);
   if (a) {
    const known = Object.hasOwn(P.payloads, type) || ['instructions', 'hook_success', 'hook_additional_context', 'hook_cancelled', 'queued_command'].includes(type);
    const coverage = { type: known ? type : 'attachment-other', entries: 1, found: 0, inherited };
    current.coverage.push(coverage);
    const mark = values => { coverage.found = Number(values.length > 0); return values.join('\n'); };
    if (type === 'instructions') {
     const files = (a.files ?? []).filter(f => typeof f.content === 'string'); coverage.found = Number(files.length > 0 || Array.isArray(a.files));
     for (const file of files) {
      let kind = P.instructions[file.type] ?? 'attachment-other';
      if (file.type === 'User') kind = P.rules.find(rule => path.basename((file.path ?? '').replaceAll('\\', '/')) === `${rule}.md`) ?? kind;
      push(kind, file.content, e, { delivery: 'recorded-input', identity: file.path ?? kind });
     }
    } else if (type === 'hook_success' || type === 'hook_additional_context') {
     const raw = mark(strings(a.content)), event = hookEvent(a);
     const commandless = type === 'hook_additional_context' && !a.command;
     const kind = event === 'UserPromptSubmit' ? 'knowledge-pull' : hookKind(a);
     const labelled = hookLabels.some(h => h.entry.statusMessage === a.command);
     const p = push(kind, raw, e, { delivery: 'recorded-input', identity: a.command ?? kind, hook: { type, event, commandless, producer: labelled && policy.contextHooks.includes(kind), invocation: a[P.correlation.invocation] } });
     if (sessionHook(a) && window) { const group = windows.get(current) ?? []; group.push(p); windows.set(current, group); }
    } else if (type === 'hook_cancelled') {
     push('knowledge-pull', '', e, { reason: 'timed-out' }); current.events.push({ reason: 'timed-out', inherited });
    } else if (type === 'queued_command') {
     coverage.found = Number(typeof a.prompt === 'string');
     if (typeof a.prompt === 'string') {
      const p = push(a[P.correlation.human] === true ? 'owner' : 'harness', a.prompt, e, { delivery: a[P.correlation.human] === true ? 'recorded-input' : 'unknown', identity: e.uuid ?? `${current.id}:p${current.parts.length}`, queued: a[P.correlation.human] === true, uuid: e.uuid });
      if (p.queued) current.turns.push({ uuid: e.uuid, queued: true, inherited, part: current.parts.indexOf(p) });
     }
    } else if (Object.hasOwn(P.payloads, type)) {
     const [name, delivery, fields] = P.payloads[type];
     push(name, mark(fields.flatMap(key => field(a, key.split('.')))), e, { delivery });
    } else push('attachment-other', '', e);
   }
   if (e.isCompactSummary) push('compaction-summary', textOnly(e), e, { delivery: 'recorded-input' });
   else if (ownerTurn(e)) {
    const p = push('owner', textOnly(e), e, { delivery: 'recorded-input', identity: e.uuid ?? `${current.id}:p${current.parts.length}`, uuid: e.uuid });
    current.turns.push({ uuid: e.uuid, inherited, part: current.parts.indexOf(p) });
   } else if (e.type === 'user' && textOnly(e)) push(WRAPPER_TAGS.some(tag => tag.includes('notification') && textOnly(e).trimStart().toLowerCase().startsWith(tag.toLowerCase())) ? 'notification' : 'harness', textOnly(e), e, { identity: e.uuid ?? `${current.id}:p${current.parts.length}` });
   for (const call of bodyOf(e).filter(p => p.type === 'tool_use')) {
    // Calls are resolved after segmentation, including results in a later segment.
    current.calls ??= []; current.calls.push({ call, inherited });
   }
   for (const result of bodyOf(e).filter(p => p.type === 'tool_result')) {
    current.results ??= []; current.results.push({ result, inherited, uuid: e.uuid });
   }
  }
  const ownContexts = contexts.slice(contextStart);
  for (const [c, group] of windows) {
   const removed = new Set();
   for (const add of group.filter(p => p.hook.type === 'hook_additional_context')) {
    let candidates;
    if (add.hook.commandless) {
     candidates = group.filter(p => p.hook.type === 'hook_success' && p.hook.producer);
     const kinds = new Set(candidates.map(p => p.name));
     if (kinds.size !== 1) {
      if (kinds.size > 1) c.ambiguous.push({ reason: 'hook-correlation', inherited: add.inherited });
      continue;
     }
     add.name = add.identity = candidates[0].name;
     const prefix = `${c.id}:p${c.parts.indexOf(add)}`;
     add.spans = segmentPart(add.raw, P.splitters[add.name] ?? add.name, prefix);
    } else {
     candidates = group.filter(p => p.hook.type === 'hook_success' && p.hook.event === add.hook.event && (!p.hook.invocation || !add.hook.invocation || p.hook.invocation === add.hook.invocation));
    }
    const matches = candidates.filter(p => {
     let envelope; try { envelope = JSON.parse(p.raw); } catch { /* raw output */ }
     return p.raw.includes(add.raw) || [P.correlation.envelope, P.correlation.nestedEnvelope].some(key => field(envelope, key.split('.')).some(value => value.includes(add.raw)));
    });
    if (matches.length === 1 || (add.hook.commandless && matches.length > 0)) removed.add(add);
    else if (matches.length > 1 || (!add.hook.commandless && candidates.length > 1)) c.ambiguous.push({ reason: 'hook-correlation', inherited: add.inherited });
   }
   c.parts = c.parts.filter(p => !removed.has(p));
  }
  const results = new Map(ownContexts.flatMap(c => c.results ?? []).map(r => [r.result.tool_use_id, r]));
  for (const c of ownContexts) {
   // A queued prompt may match only the first following owner turn before another queue.
   const removed = new Set();
   for (let i = 0; i < c.turns.length; i++) {
    const turn = c.turns[i]; if (!turn.queued) continue;
    const next = c.turns[i + 1], p = c.parts.find(p => p.queued && p.uuid === turn.uuid);
    if (next && !next.queued && p?.raw === c.parts.find(p => !p.queued && p.uuid === next.uuid)?.raw) { removed.add(p); turn.merged = true; }
    else c.events.push({ reason: 'queued-unmatched', inherited: turn.inherited });
   }
   c.parts = c.parts.filter(p => !removed.has(p)); c.turns = c.turns.filter(t => !t.merged).map(({ part, ...t }) => t);
   for (const { call, inherited } of c.calls ?? []) {
    const found = results.get(call.id);
    const result = found?.result;
    const chars = result && !result.is_error ? textOnly({ content: result.content }) || strings(result.content).join('\n') : '';
    const mapping = P.tools, canonical = Object.entries(mapping).find(([, value]) => typeof value === 'string' && value === call.name)?.[0] ?? call.name;
    const fallbackClass = Object.entries(mapping).find(([, value]) => Array.isArray(value) && value.includes(call.name))?.[0] ?? 'other';
    c.pulls.push(...callClasses(canonical, call.input ?? {}, { cwd: c.cwd, memoryPaths: SLOT_MARKERS.readPaths, functions: SEAT_CLASS_FUNCTION, fallbackClass, chars: chars.length }).map(row => ({ ...row, inherited: inherited || found?.inherited === true })));
    if (call.name === 'AskUserQuestion' && found) for (const ctx of ownContexts) for (const entry of ctx.entries) if (entry.uuid === found.uuid) entry.structured = true;
   }
   c.inheritedChars = c.parts.filter(p => p.inherited).reduce((n, p) => n + p.raw.length, 0);
   if (!c.parts.some(p => p.name === 'system-prompt' && p.phase === 'standing')) c.excluded.push({ reason: 'unrecorded-system', chars: 0 });
   if (!c.coverage.some(r => r.type === 'instructions')) c.excluded.push({ reason: 'unrecorded-instructions', chars: 0 });
   delete c.calls; delete c.results;
  }
  }
 }
 // Keep aliases and observation denominators in the private store, not CLI paths.
 const denominators = { files: files.length, sessions: sessions.length, segments: contexts.length };
 if (contexts.length) contexts[0].observations = { skipped, denominators };
 return { contexts, skipped, denominators };
}
