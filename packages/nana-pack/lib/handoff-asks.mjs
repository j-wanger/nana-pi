/**
 * @module packages/nana-pack/lib/handoff-asks.mjs
 * @purpose Splits HANDOFF's Open for the owner section into raw entries with independent tag and title parses.
 * @inputs HANDOFF Markdown text.
 * @outputs Ordered ask entries with source lines, frontier tags, and report titles and bodies.
 * @effects none
 * @errors None; absent sections and unparseable tags or titles yield empty results.
 */
import { OPEN_SECTION_PREFIX, isNamed } from "./frontier-config.mjs";
import { scanListSections } from "./markdown-list-sections.mjs";
export const TAG = /\[(blocking|optional|parked),\s*since\s+(\d{4}-\d{2}-\d{2})\]/i;
const TITLE = /^\s*(?:[-*+]\s+|\d+[.)]\s+)\*\*\[(blocking|optional|parked),\s*since\s+(\d{4}-\d{2}-\d{2})\]\s+(.+?)\.\*\*(.*)$/i;

export function splitOpenSection(text) {
  const sections = scanListSections(text, { headingMatches: (title) => isNamed(title, OPEN_SECTION_PREFIX) });
  return sections.flatMap((section) => section.entries.map((entry) => {
    const tagMatch = TAG.exec(entry.lines.join(" "));
    const titleMatch = TITLE.exec(entry.lines[0]);
    const body = titleMatch
      ? [titleMatch[4].trimStart(), ...entry.lines.slice(1)].filter((line, bodyIndex) => bodyIndex > 0 || line.length > 0).join("\n")
      : "";
    return {
      ...entry,
      tag: tagMatch ? { kind: tagMatch[1].toLowerCase(), since: tagMatch[2] } : null,
      title: titleMatch ? { kind: titleMatch[1].toLowerCase(), since: titleMatch[2], title: titleMatch[3], body } : null,
    };
  }));
}
