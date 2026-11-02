/**
 * @module apps/bench/lib/replay-errors.mjs
 * @purpose Normalize pi input forms and count failed tools, diagnostics and process outcomes without text.
 * @inputs Session entries or JSON events; precedent paths and optional process outcome.
 * @outputs Canonical entries/events and counts-only error summaries.
 * @effects none
 * @errors Malformed events are ignored, never printed.
 */
import { textFrom } from "../../../packages/nana-pack/lib/claude-transcript.mjs";
import { DIAGNOSTICS, TOOL_ERRORS } from "./replay-config.mjs";

/** Authoritative finalized messages win over execution notifications; call ids deduplicate pulls. */
export function normalizeEvents(input) {
 const raw = typeof input === "string" ? input.split(/\r?\n/u).flatMap(line => { try { return [JSON.parse(line)]; } catch { return []; } }) : input;
 const entries = [], events = [], calls = new Map(), results = new Map();
 const starts = new Map(raw.filter(e => e?.type === "tool_execution_start").map(e => [e.toolCallId, e]));
 const hasTurns = raw.some(e => e?.type === "turn_start");
 for (const e of raw) {
  if (!e || typeof e !== "object") continue;
  const m = e.type === "message" || e.type === "message_end" ? e.message : e.type === "entry_appended" && e.entry?.type === "message" ? e.entry.message : null;
  if (m) {
   events.push({ type: "message_end", message: m });
   if (m.role === "assistant") {
    if (!hasTurns) events.push({ type: "turn_start" });
    for (const c of Array.isArray(m.content) ? m.content : []) if (c.type === "toolCall" && !calls.has(c.id)) calls.set(c.id, c);
   } else if (m.role === "toolResult") results.set(m.toolCallId, m);
   else entries.push({ type: "message", message: m });
  } else if (e.type === "usage") events.push({ type: "entry_appended", entry: e });
  else if (e.type !== "tool_execution_start") events.push(e);
 }
 for (const [id, e] of starts) if (!calls.has(id)) calls.set(id, { type: "toolCall", id, name: e.toolName, arguments: e.args ?? {} });
 for (const e of raw) if (e?.type === "tool_execution_end" && !results.has(e.toolCallId)) {
  const m = { role: "toolResult", toolCallId: e.toolCallId, toolName: e.toolName, ...e.result, isError: e.isError ?? e.result?.isError };
  results.set(e.toolCallId, m); events.push({ type: "message_end", message: m });
 }
 for (const c of calls.values()) {
  entries.push({ type: "message", message: { role: "assistant", content: [c] } });
  events.push({ type: "tool_execution_start", toolCallId: c.id, toolName: c.name, args: c.arguments });
 }
 for (const m of results.values()) entries.push({ type: "message", message: m });
 return { entries, events, calls, results };
}

/** Combine sessions after their independent call-id dedup and brief-specific precedent lookup. */
export function mergeErrorCounts(summaries) {
 const total = { failedCalls: 0, tools: {}, diagnostics: {}, outcomes: {}, unclassifiedRate: 0, precedentTouch: { count: 0, interpretation: "proxy, not causal" } };
 const add = (dest, source) => { for (const [key, count] of Object.entries(source)) dest[key] = (dest[key] ?? 0) + count; };
 for (const s of summaries) {
  total.failedCalls += s.failedCalls; total.precedentTouch.count += s.precedentTouch.count;
  add(total.diagnostics, s.diagnostics); add(total.outcomes, s.outcomes);
  for (const [tool, kinds] of Object.entries(s.tools)) { total.tools[tool] ??= {}; add(total.tools[tool], kinds); }
 }
 total.unclassifiedRate = total.failedCalls ? (total.diagnostics.unclassified ?? 0) / total.failedCalls : 0;
 return total;
}

export function classifyErrors(input, { precedent = [], outcome } = {}) {
 const { calls, results } = normalizeEvents(input);
 const tools = {}, diagnostics = {}, outcomes = outcome ? { [outcome]: 1 } : {};
 let failedCalls = 0, touched = 0;
 for (const [id, result] of results) {
  // Bash wrappers used for wrong-code-first can return successful tool results containing red tests.
  // We classify transport/tool failure, not text which merely describes a failure.
  if (!result.isError) continue;
  const call = calls.get(id), name = call?.name ?? result.toolName ?? "unknown", text = textFrom(result.content);
  failedCalls++;
  const kind = TOOL_ERRORS.find(([tool, , pattern]) => tool === name && pattern.test(text))?.[1] ?? "tool-other";
  tools[name] ??= {}; tools[name][kind] = (tools[name][kind] ?? 0) + 1;
  const diagnostic = DIAGNOSTICS.find(([, pattern]) => pattern.test(text))?.[0] ?? "unclassified";
  diagnostics[diagnostic] = (diagnostics[diagnostic] ?? 0) + 1;
  const args = call?.arguments ?? {}, paths = [args.path, args.file_path, args.file, args.command].filter(v => typeof v === "string");
  if (precedent.some(p => paths.some(v => v === p || v.endsWith(`/${p}`) || v.includes(p)))) touched++;
 }
 return { failedCalls, tools, diagnostics, outcomes, unclassifiedRate: failedCalls ? (diagnostics.unclassified ?? 0) / failedCalls : 0, precedentTouch: { count: touched, interpretation: "proxy, not causal" } };
}
