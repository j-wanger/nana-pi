/**
 * @module apps/bench/lib/replay-context.mjs
 * @purpose Render only a recorded first attempt with declared substitutions and one structural or model-label cut.
 * @inputs Private anatomy context spans, readLabels store, arm and clone path.
 * @outputs Ordered sections, exact joined system text, first instruction and selected attempt.
 * @effects disk (explicit private context and label inputs)
 * @errors Invalid arms, missing first context or model labels refuse rendering.
 */
import path from "node:path";
import { entriesIn } from "../../../packages/nana-pack/lib/claude-transcript.mjs";
import { readLabels } from "./anatomy-labels.mjs";
import { distinctUnits, normalize, oversize } from "./anatomy-measures.mjs";

export async function loadContexts(contexts, labels) {
 const records = entriesIn(path.join(contexts, "contexts.jsonl"));
 return { records, labelStore: labels ? await readLabels(labels, records) : null };
}
function cutPart(part, dropLabel, labelStore, context) {
 if (!dropLabel) return part.spans.map(s => s.text).join("");
 // The shared normalization/key owner remains anatomy; rule labels never decide the cut.
 const units = labelStore?.units ?? distinctUnits([context]);
 const remove = new Set();
 for (const s of part.spans.filter(s => s.kind === "unit")) {
  let key = labelStore?.byId.get(s.id);
  if (!key) key = [...units.values()].find(u => u.normalized === normalize(s.text, context))?.key;
  const label = labelStore?.labels.get(key)?.label;
  if (label === undefined) {
   if (oversize(s)) continue;
   throw new Error("replay: model labels missing");
  }
  if (label === dropLabel) remove.add(s.id);
 }
 const orphan = new Set();
 for (const h of part.spans.filter(s => s.heading)) {
  const children = part.spans.filter(s => s.kind === "unit" && s.headingIds?.includes(h.headingId));
  if (children.length && children.every(s => remove.has(s.id))) orphan.add(h.id);
 }
 // Anatomy stores table header/delimiter as glue. Remove them only for a table with removed rows.
 const tableGlue = new Set(); let table = [];
 const flush = () => {
  const rows = table.filter(s => s.kind === "unit");
  if (rows.length && rows.every(s => remove.has(s.id))) for (const s of table) if (s.kind === "glue") tableGlue.add(s.id);
  table = [];
 };
 for (const s of part.spans) { if (/^\s*\|/u.test(s.text)) table.push(s); else flush(); } flush();
 return part.spans.filter(s => !remove.has(s.id) && !orphan.has(s.id) && !tableGlue.has(s.id)).map(s => s.text).join("");
}
function substitute(text, context, clone, mainCheckout) {
 const replacements = new Map([[context.cwd, clone], ["~/nana-pi", clone], ["$HOME/nana-pi", clone]]);
 if (mainCheckout) replacements.set(mainCheckout, clone);
 const keys = [...replacements.keys()].filter(Boolean).sort((a, b) => b.length - a.length);
 const escaped = keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"));
 return keys.length ? text.replace(new RegExp(escaped.join("|"), "gu"), key => replacements.get(key)) : text;
}

export function renderContext(context, { clone, arm = { name: "control" }, labelStore, mainCheckout } = {}) {
 if (!clone || !context || !Array.isArray(context.parts) || !arm.name || (arm.dropLabel && arm.dropSections) || (arm.dropSections && !Array.isArray(arm.dropSections))) throw new Error("replay: invalid context or arm");
 const sections = {}; let instruction, toolsAdded;
 for (const p of context.parts) {
  if (p.attempt !== 0) continue;
  if (p.name === "instruction") { instruction = cutPart(p, arm.dropLabel, labelStore, context); break; }
  if (p.name === "knowledge-pull") continue;
  if (p.name === "toolsAdded") { toolsAdded = p.spans.map(s => s.text).join(""); continue; }
  const section = p.section ?? p.name;
  if (arm.dropSections?.includes(section)) continue;
  const text = cutPart(p, arm.dropLabel, labelStore, context);
  sections[section] = (sections[section] ?? "") + text;
 }
 if (instruction === undefined || !Object.keys(sections).length) throw new Error("replay: first context missing");
 for (const [name, value] of Object.entries(sections)) sections[name] = substitute(value, context, clone, mainCheckout);
 if (sections.cwd !== undefined) sections.cwd = `<cwd>\n${clone.replaceAll("\\", "/")}\n</cwd>`;
 return { sections, systemPrompt: Object.values(sections).join("\n\n"), instruction: substitute(instruction, context, clone, mainCheckout), attempt: 0, ...(toolsAdded ? { toolsAdded } : {}) };
}

/** Session bytes, not a claim made by the extension, decide whether a run received its intervention. */
export function promptMatches(sessionFile, expected) {
 const message = entriesIn(sessionFile).find(e => e.type === "message" && e.message?.role === "system")?.message;
 if (!message) return false;
 const actual = message.sections ? Object.values(message.sections).join("\n\n") : typeof message.content === "string" ? message.content : "";
 return actual === expected;
}
