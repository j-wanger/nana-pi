/**
 * @module packages/nana-pack/lib/memory-replay-context.mjs
 * @purpose Rebuild a recorded Claude moment with one replaceable historical memory slot.
 * @inputs Stored transcript entries and an exclusive replay point index.
 * @outputs Standing prefix, bounded history, historical slot and exact slot spans.
 * @effects none
 * @errors Invalid replay points throw fixed errors; missing instructions are reported as unrecorded.
 */
import { assistantText, textFrom } from './claude-transcript.mjs';
import * as C from './memory-replay-config.mjs';

/** Render only kept message parts, never recursive thinking or image payloads. */
export function renderReplayEntry(entry) {
 if (!C.KEPT_TYPES.includes(entry.type) || entry.isSidechain || entry.isMeta) return '';
 const content = entry.message?.content ?? entry.content;
 const parts = typeof content === 'string' ? [{ type: 'text', text: content }] : Array.isArray(content) ? content : [];
 const text = [];
 for (const part of parts) {
  if (typeof part === 'string') { text.push(part); continue; }
  if (!C.KEPT_TYPES.includes(part?.type)) continue;
  if (part.type === 'text') text.push(part.text ?? '');
  else if (part.type === 'tool_use') text.push(`TOOL ${part.name}: ${JSON.stringify(part.input ?? {})}`);
  else if (part.type === 'tool_result') {
   // Results can contain images, too. Retain textual children only.
   const body = typeof part.content === 'string' ? part.content : (part.content ?? []).filter(p => p?.type === 'text').map(p => p.text ?? '').join('\n');
   text.push(`RESULT ${part.tool_use_id ?? ''}: ${body.slice(0, C.TOOL_RESULT_CAP)}`);
  }
 }
 // Share the transcript reader's assistant-text convention for text-only entries.
 if (entry.type === 'assistant' && typeof content === 'string') return assistantText({ ...entry, isSidechain: false });
 return text.join('\n');
}

/** As in anatomy's span assembly, retained parts alone form the result; raw is never a fallback. */
export function rebuildContext(entries, point) {
 if (!Number.isInteger(point) || point < 0 || point >= entries.length || entries[point].type !== 'user') throw Error('invalid replay point');
 const past = entries.slice(0, point + 1), files = new Map(), hooks = [], memoryHooks = [];
 let recorded = false, boundary = -1, summary = '';
 for (const [index, entry] of past.entries()) {
  if (entry.isSidechain) continue;
  const attachment = entry.attachment;
  if (attachment?.type === 'instructions') {
   recorded = true;
   for (const file of attachment.files ?? []) if (typeof file.path === 'string' && typeof file.content === 'string') files.set(file.path, file);
  }
  const event = attachment?.hookEvent ?? attachment?.hookName ?? entry.hookEvent;
  if (attachment?.type === 'hook_success' && (event === 'SessionStart' || event?.startsWith('SessionStart:'))) {
   const command = attachment.command ?? '', output = textFrom(attachment.content ?? attachment.output ?? attachment.stdout ?? '');
   (C.SLOT_MARKERS.hooks.some(marker => command.includes(marker)) ? memoryHooks : hooks).push(output);
  }
  if (entry.subtype === 'compact_boundary' || entry.type === 'compact_boundary') {
   boundary = index;
   // SessionStart:compact refreshes the hook outputs the seat sees after compaction.
   hooks.length = 0; memoryHooks.length = 0;
  }
  if (entry.isCompactSummary) summary = renderReplayEntry({ ...entry, isMeta: false });
 }
 const ancestors = new Set();
 if (entries[point].parentUuid) {
  const byId = new Map(past.filter(e => e.uuid).map(e => [e.uuid, e]));
  let current = entries[point];
  while (current && !ancestors.has(current.uuid)) { ancestors.add(current.uuid); current = byId.get(current.parentUuid); }
 }
 const historyEntries = past.flatMap((entry, index) => {
  if (index <= boundary || entry.isCompactSummary || (ancestors.size && entry.uuid && !ancestors.has(entry.uuid))) return [];
  const text = renderReplayEntry(entry);
  return text ? [{ index, text: `${entry.type.toUpperCase()}: ${text}\n` }] : [];
 });
 if (summary) historyEntries.unshift({ index: boundary, text: `SUMMARY: ${summary}\n` });
 let chars = historyEntries.reduce((n, e) => n + e.text.length, 0), removedChars = 0;
 while (chars > C.HISTORY_BUDGET && historyEntries.length > 1) {
  const removed = historyEntries.shift(); chars -= removed.text.length; removedChars += removed.text.length;
 }
 const standing = [...files.values()].filter(file => file.type !== C.SLOT_MARKERS.instruction).map(file => `${file.type} ${file.path}\n${file.content}`);
 const control = [...files.values()].filter(file => file.type === C.SLOT_MARKERS.instruction).map(file => file.content).concat(memoryHooks).join('\n');
 return { recorded, prefix: [C.REPLAY_PREAMBLE, ...standing, ...hooks].join('\n\n') + '\n\nMEMORY\n', control: C.CONTROL_MODE === 'historical' ? control : '', history: historyEntries.map(e => e.text).join('\n'), removedChars };
}

/** Exact offsets permit an audit that all arms differ only inside this span. */
export function withMemorySlot(context, memory) {
 const slotStart = context.prefix.length, slotEnd = slotStart + memory.length;
 return { text: `${context.prefix}${memory}\n\nCONVERSATION\n${context.history}`, slotStart, slotEnd };
}
