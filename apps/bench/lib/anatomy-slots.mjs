/**
 * @module apps/bench/lib/anatomy-slots.mjs
 * @purpose Report recorded role payload kinds, repeats, reads and correction joins without private text.
 * @inputs Normalized role contexts and an optional explicit corrections JSONL path.
 * @outputs Counts-only kind, phase, session, coverage, repeat and outcome tables.
 * @effects disk (optional corrections file only)
 * @errors Malformed corrections throw a fixed INVALID_CORRECTIONS diagnostic.
 */
import { rows } from '../../../packages/nana-pack/lib/memory-score.mjs';
import { distinctUnits, normalize } from './anatomy-measures.mjs';
import { OVERSIZE_UNIT_CHARS, REPORT_PARTS, SEAT_CLASS_FUNCTION, SEAT_POLICY, SHARE_DIGITS } from './anatomy-config.mjs';

const sum = (items, value) => items.reduce((n, item) => n + value(item), 0);
const share = (n, total) => total ? Number((100 * n / total).toFixed(SHARE_DIGITS)) : 0;
const safeKind = name => REPORT_PARTS.includes(name) ? name : 'attachment-other';
const allParts = contexts => contexts.flatMap(c => c.parts.map(p => ({ c, p })));
const fresh = contexts => contexts.map(c => ({ ...c, parts: c.parts.filter(p => !p.inherited), pulls: c.pulls.filter(p => !p.inherited) }));
function reasons(items) {
 return [...new Set(items.map(r => r.reason))].sort().map(reason => ({ reason, count: items.filter(r => r.reason === reason).length }));
}
function totals(parts) {
 return { recordedInputChars: sum(parts.filter(({ p }) => p.delivery === 'recorded-input'), ({ p }) => p.raw.length), unknownChars: sum(parts.filter(({ p }) => p.delivery !== 'recorded-input'), ({ p }) => p.raw.length) };
}
function kindRows(parts) {
 const denominator = totals(parts).recordedInputChars;
 return [...new Set(parts.map(({ p }) => safeKind(p.name)))].sort().flatMap(kind => ['recorded-input', 'unknown'].flatMap(delivery => {
  const found = parts.filter(({ p }) => safeKind(p.name) === kind && (p.delivery === 'recorded-input' ? 'recorded-input' : 'unknown') === delivery);
  return found.length ? [{ kind, delivery, chars: sum(found, ({ p }) => p.raw.length), share: delivery === 'recorded-input' ? share(sum(found, ({ p }) => p.raw.length), denominator) : null }] : [];
 }));
}
function outcomeCounts() { return { ownerTurns: 0, correction: 0, decision: 0, none: 0, unlabelled: 0, conflict: 0, structuredAnswers: 0, missingTurn: 0 }; }
function correctionsOf(contexts, file) {
 let input;
 try { input = rows(file, true, { allowDuplicates: true }); } catch { throw Object.assign(Error('invalid corrections'), { code: 'INVALID_CORRECTIONS' }); }
 const source = input.some(row => typeof row.claim === 'string') ? 'estimated' : 'labelled';
 const sessionMap = new Map(), entries = new Map(), turns = new Map();
 for (const c of contexts) {
  const session = c.session ?? c.id;
  if (!sessionMap.has(c.sourceSession)) sessionMap.set(c.sourceSession, { session, ...outcomeCounts() });
  for (const e of c.entries ?? []) if (!e.inherited) entries.set(`${c.sourceSession}#${e.uuid}`, e);
  for (const [index, t] of (c.turns ?? []).entries()) if (!t.inherited) turns.set(`${c.sourceSession}#${t.uuid ?? `unrecorded-${c.id}-${index}`}`, sessionMap.get(c.sourceSession));
 }
 for (const row of turns.values()) row.ownerTurns++;
 const joined = new Map();
 for (const row of input) {
  const key = row.evidence.replace(/\+.*$/u, '').replace(/^claude-code:/u, '');
  const kinds = joined.get(key) ?? new Set(); kinds.add(row.kind); joined.set(key, kinds);
 }
 let outside = 0;
 for (const [key, kinds] of joined) {
  const session = key.split('#')[0], row = sessionMap.get(session);
  if (!row) { outside++; continue; }
  const entry = entries.get(key);
  if (!entry) { row.missingTurn++; continue; }
  if (entry.structured) { row.structuredAnswers++; continue; }
  if (!turns.has(key)) { row.missingTurn++; continue; }
  if (kinds.size > 1) row.conflict++;
  else { const kind = [...kinds][0]; if (['correction', 'decision', 'none'].includes(kind)) row[kind]++; else row.unlabelled++; }
 }
 for (const [key, row] of turns) if (!joined.has(key)) row.unlabelled++;
 const sessions = [...sessionMap.values()].sort((a, b) => a.session.localeCompare(b.session));
 const result = { source, ...outcomeCounts(), outside };
 for (const key of Object.keys(outcomeCounts())) result[key] = sum(sessions, row => row[key]);
 return { ...result, sessions };
}

/** Deterministic kind totals include glue and oversize spans; function shares do not. */
export function reportSlots(contexts, { corrections } = {}) {
 const kept = fresh(contexts), parts = allParts(kept), all = allParts(contexts), total = totals(parts);
 const observations = contexts.flatMap(c => c.observations ? [c.observations] : []);
 const sessions = [...new Set(contexts.map(c => c.session ?? c.id))].sort().map(session => {
  const selected = contexts.filter(c => (c.session ?? c.id) === session), owned = allParts(fresh(selected));
  return { session, segments: selected.length, newChars: sum(owned, ({ p }) => p.raw.length), inheritedChars: sum(allParts(selected).filter(({ p }) => p.inherited), ({ p }) => p.raw.length), ownerTurns: sum(selected, c => (c.turns ?? []).filter(t => !t.inherited).length), kinds: kindRows(owned) };
 });
 const seenSlots = new Map(), seenExact = new Set(); let repeated = 0, exact = 0;
 for (const { c, p } of parts) {
  const key = JSON.stringify([c.session ?? c.id, p.name, p.identity ?? p.name]);
  const segments = seenSlots.get(key) ?? new Set();
  if ([...segments].some(id => id !== c.id)) repeated += p.raw.length;
  segments.add(c.id); seenSlots.set(key, segments);
  if (p.raw && seenExact.has(p.raw)) exact += p.raw.length;
  seenExact.add(p.raw);
 }
 const normalized = new Map([...distinctUnits(kept).values()].filter(u => u.normalized).map(u => [u.normalized, u.occurrences.length]));
 for (const { c, p } of parts) for (const s of p.spans) if (s.kind === 'unit' && s.text.length > OVERSIZE_UNIT_CHARS) {
  const key = normalize(s.text, c); if (key) normalized.set(key, (normalized.get(key) ?? 0) + 1);
 }
 const coverageRows = contexts.flatMap(c => c.coverage ?? []).filter(r => !r.inherited);
 const coverage = [...new Set(coverageRows.map(r => r.type))].sort().map(type => {
  const selected = coverageRows.filter(r => r.type === type), entries = sum(selected, r => r.entries), found = sum(selected, r => r.found);
  return { type, entries, found, share: share(found, entries) };
 });
 const pulls = kept.flatMap(c => c.pulls), reads = Object.keys(SEAT_CLASS_FUNCTION).map(cls => ({ class: cls, calls: pulls.filter(r => r.class === cls).length, chars: sum(pulls.filter(r => r.class === cls), r => r.chars) }));
 return {
  interpretation: 'recorded payload is not delivered context; UTF-16 chars are not tokens; function rule shares are not findings',
  denominator: 'unique owned main-thread payload chars; recorded-input only for headline shares; unknown separate; subagent files are not enumerated',
  totals: { ...total, inheritedChars: sum(all.filter(({ p }) => p.inherited), ({ p }) => p.raw.length) },
  kinds: kindRows(parts), phases: ['standing', 'turn'].map(phase => ({ phase, ...totals(parts.filter(({ p }) => p.phase === phase)), kinds: kindRows(parts.filter(({ p }) => p.phase === phase)) })),
  starts: [...SEAT_POLICY.starts, 'unknown'].map(start => ({ start, segments: contexts.filter(c => c.start === start).length, kinds: kindRows(parts.filter(({ c, p }) => c.start === start && p.phase === 'standing')) })),
  sessions, segments: contexts.map(c => ({ id: c.id, start: SEAT_POLICY.starts.includes(c.start) ? c.start : 'unknown', version: /^\d+\.\d+\.\d+$/u.test(c.version) ? c.version : 'unknown', ...totals(allParts(fresh([c]))), inheritedChars: sum(allParts([c]).filter(({ p }) => p.inherited), ({ p }) => p.raw.length) })),
  coverage, skipped: reasons(observations.flatMap(o => o.skipped)), exclusions: reasons(contexts.flatMap(c => c.excluded ?? [])),
  events: reasons(contexts.flatMap(c => c.events ?? []).filter(e => !e.inherited)), ambiguous: reasons(contexts.flatMap(c => c.ambiguous ?? []).filter(e => !e.inherited)),
  ownerTurns: sum(sessions, s => s.ownerTurns), reads,
  repeats: {
   repeatedDelivery: { chars: repeated, denominator: total.recordedInputChars + total.unknownChars, basis: 'new payload chars with the same session kind and slot identity in a later segment' },
   exactDuplicate: { chars: exact, denominator: total.recordedInputChars + total.unknownChars, basis: 'new payload chars byte-identical after the first payload' },
   normalizedDuplicate: { units: sum([...normalized.values()], n => Math.max(0, n - 1)), denominator: sum([...normalized.values()], n => n), basis: 'new unit occurrences equal after normalize, including oversize, after the first' },
  },
  ...(corrections ? { corrections: correctionsOf(contexts, corrections) } : {}),
 };
}
