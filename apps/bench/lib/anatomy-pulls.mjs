/**
 * @module apps/bench/lib/anatomy-pulls.mjs
 * @purpose Count builder-initiated reads by configured target class and function without exporting targets.
 * @inputs Pi message entries, cwd and readBrief's public precedent paths.
 * @outputs Read rows with class, function and result chars, including unclassified bash.
 * @effects none
 * @errors Missing or errored results contribute zero chars.
 */
import path from "node:path";
import { textFrom } from "../../../packages/nana-pack/lib/claude-transcript.mjs";
import { CLASS_FUNCTION, DEDICATED_READERS, READER_VERBS, SHELL_SPLITTERS, TARGET_RULES } from "./anatomy-config.mjs";

/** Quote-aware shell segmentation, including bash -lc bodies; not an interpreter evaluator. */
function segments(command) {
 const result = []; let start = 0, quote = null, escaped = false;
 for (let i = 0; i < command.length; i++) {
  const ch = command[i];
  if (escaped) { escaped = false; continue; }
  if (ch === "\\" && quote !== "'") { escaped = true; continue; }
  if (quote) { if (ch === quote) quote = null; continue; }
  if (ch === "'" || ch === '"') { quote = ch; continue; }
  const sep = SHELL_SPLITTERS.find((s) => command.startsWith(s, i));
  if (sep) { result.push(command.slice(start, i).trim()); i += sep.length - 1; start = i + 1; }
 }
 result.push(command.slice(start).trim());
 return result.filter(Boolean).flatMap((s) => {
  const wrapped = /^(?:bash|sh)\s+-(?:lc|c)\s+(['"])([\s\S]*)\1\s*$/u.exec(s);
  return wrapped ? segments(wrapped[2]) : [s];
 });
}
function targetClass(target, { cwd = "", precedent = [] } = {}) {
 const clean = target.replaceAll("\\", "/").replace(/^[^/\s:]+:(?=[^/])/u, "");
 if (precedent.some((p) => clean === p || clean.endsWith(`/${p}`) || (p.endsWith("/") && clean.startsWith(p)))) return "precedent";
 for (const [cls, pattern] of TARGET_RULES) if (pattern.test(clean)) return cls;
 if (path.isAbsolute(clean) && cwd && path.relative(cwd, clean).startsWith("..")) return "outside";
 return clean ? "source" : "discovery";
}
const words = (s) => (s.match(/'(?:[^']*)'|"(?:\\.|[^"])*"|[^\s]+/gu) ?? []).map((w) => w.replace(/^(['"])([\s\S]*)\1$/u, "$2"));
function bashReads(command, options) {
 const split = segments(command), found = [];
 for (const segment of split) {
  const tokens = words(segment), [verb] = tokens;
  if (verb === "cd") continue;
  const reader = READER_VERBS.find((r) => {
   const w = r.split(" "); return w.every((v, i) => tokens[i] === v);
  });
  const target = reader ? tokens.slice(reader.split(" ").length).filter((w) => !w.startsWith("-")).at(-1) ?? "" : "";
  found.push(reader ? targetClass(target, options) : "unclassified-bash");
 }
 return found.length ? found : ["unclassified-bash"];
}

/** One tool result's chars are partitioned across its shell segments, never multiplied by a pipe.
 * Chosen 2026-11-01, T6: equal integer allocation with remainder on the last segment;
 * the transcript cannot attribute pipe output to an individual segment. Counts remain exact.
 */
export function pullsOf(entries, options = {}) {
 const results = new Map();
 for (const e of entries) if (e.type === "message" && e.message?.role === "toolResult") results.set(e.message.toolCallId, e.message);
 const rows = [];
 for (const e of entries) {
  if (e.type !== "message" || e.message?.role !== "assistant" || !Array.isArray(e.message.content)) continue;
  for (const call of e.message.content.filter((p) => p.type === "toolCall")) {
   const args = call.arguments ?? {}, name = call.name;
   let classes;
   if (DEDICATED_READERS.includes(name)) classes = [targetClass(args.path ?? args.file_path ?? args.file ?? "", options)];
   else if (name === "bash") classes = bashReads(args.command ?? "", options);
   else continue;
   const result = results.get(call.id), chars = result && !result.isError ? textFrom(result.content).length : 0;
   const share = Math.floor(chars / classes.length);
   classes.forEach((cls, i) => rows.push({ class: cls, function: CLASS_FUNCTION[cls], chars: i === classes.length - 1 ? chars - share * i : share }));
  }
 }
 return rows;
}
