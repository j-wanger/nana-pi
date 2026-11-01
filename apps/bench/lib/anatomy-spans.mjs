/**
 * @module apps/bench/lib/anatomy-spans.mjs
 * @purpose Tile pushed parts with lossless Markdown spans and deterministic function labels.
 * @inputs Part text, part name and a stable private id prefix.
 * @outputs Ordered contiguous unit/glue spans with offsets, heading ancestry and rule tiers.
 * @effects none
 * @errors none; unrecognized prose receives a fixed unsorted reason.
 */
import { HEADING_RULES, PART_RULES, PART_SPLITTERS, RULES, UNSORTED_REASON } from "./anatomy-config.mjs";

function label(text, part, heading) {
 if (PART_RULES[part]) return { label: PART_RULES[part], tier: "part" };
 if (heading) return { label: heading, tier: "heading" };
 const lead = text.replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/u, "").replace(/[`*_]/g, "").trim();
 const rule = RULES.find((r) => r.pattern.test(lead));
 return rule ? { label: rule.label, tier: rule.tier } : { label: "unsorted", tier: "unsorted", reason: UNSORTED_REASON };
}

/** Fence state follows markdown-list-sections: backtick/tilde runs, closing length >= opening. */
export function segmentPart(raw, part, prefix) {
 if (!raw) return [];
 if (PART_SPLITTERS[part] === "opaque") return [{ id: `${prefix}:0`, kind: "unit", start: 0, end: raw.length, text: raw, headingIds: [], ...label(raw, part, null) }];
 const lines = raw.match(/[^\r\n]*(?:\r\n|\r|\n|$)/gu).filter(Boolean);
 const spans = [], headings = [];
 let offset = 0, pending = null, fence = null;
 const emit = (kind, start, end, extra = {}) => {
  const text = raw.slice(start, end);
  spans.push({ id: `${prefix}:${spans.length}`, kind, start, end, text, headingIds: headings.map((h) => h.id), ...(kind === "unit" ? label(text, part, [...headings].reverse().find((h) => h.label)?.label) : {}), ...extra });
 };
 const flush = () => { if (pending !== null) { emit("unit", pending, offset); pending = null; } };
 for (let i = 0; i < lines.length; i++) {
  const line = lines[i], clean = line.replace(/[\r\n]+$/u, "");
  const marker = /^ {0,3}(`{3,}|~{3,})/u.exec(clean);
  if (fence) {
   if (marker && marker[1][0] === fence[0] && marker[1].length >= fence[1]) fence = null;
   offset += line.length; continue;
  }
  if (marker) { if (pending === null) pending = offset; fence = [marker[1][0], marker[1].length]; offset += line.length; continue; }
  const heading = /^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/u.exec(clean);
  if (heading) {
   flush(); const level = heading[1].length;
   while (headings.length && headings.at(-1).level >= level) headings.pop();
   const id = `${prefix}:h${spans.length}`;
   emit("glue", offset, offset + line.length, { heading: true, headingId: id, level });
   headings.push({ id, level, label: HEADING_RULES.find(([, re]) => re.test(heading[2]))?.[0] });
  } else if (!clean.trim()) { flush(); emit("glue", offset, offset + line.length); }
  else if (/^\s*\|/u.test(clean)) {
   flush();
   const delimiter = (s) => /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/u.test(s.trim());
   const header = lines[i + 1] && delimiter(lines[i + 1]);
   emit(header || delimiter(clean) ? "glue" : "unit", offset, offset + line.length);
  } else {
   if (/^\s*(?:[-*+]\s+|\d+[.)]\s+)/u.test(clean)) flush();
   if (pending === null) pending = offset;
  }
  offset += line.length;
 }
 flush(); return spans;
}
