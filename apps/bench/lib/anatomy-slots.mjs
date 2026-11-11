/**
 * @module apps/bench/lib/anatomy-slots.mjs
 * @purpose Report recorded role payload kinds, repeats and reads without private text.
 * @inputs Normalized role contexts.
 * @outputs Counts-only kind, phase, session, coverage, repeat and read tables.
 * @effects none
 * @errors none
 */
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
/** Deterministic kind totals include glue and oversize spans; function shares do not. */
export function reportSlots(contexts) {
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
 };
}
