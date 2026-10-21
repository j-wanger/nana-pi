/**
 * @module packages/nana-pack/lib/handoff-asks.mjs
 * @purpose Splits HANDOFF's Open for the owner section into raw entries with independent tag and title parses.
 * @inputs HANDOFF Markdown text.
 * @outputs Ordered ask entries with source lines, frontier tags, and report titles and bodies.
 * @effects none
 * @errors None; absent sections and unparseable tags or titles yield empty results.
 */
import { OPEN_SECTION_PREFIX, isNamed } from "./frontier-config.mjs";

const isHeading = (line) => /^ {0,3}#{1,6}\s+/.test(line);
const isListItem = (line) => /^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(line);
const TAG = /\[(blocking|optional|parked),\s*since\s+(\d{4}-\d{2}-\d{2})\]/i;
const TITLE = /^\s*(?:[-*+]\s+|\d+[.)]\s+)\*\*\[(blocking|optional|parked),\s*since\s+(\d{4}-\d{2}-\d{2})\]\s+(.+?)\.\*\*(.*)$/i;

export function splitOpenSection(text) {
  const lines = text.split(/\r\n|\r|\n/);
  const outsideFence = [];
  const headings = [];
  let fence = null;
  for (let index = 0; index < lines.length; index++) {
    const marker = /^ {0,3}(`{3,}|~{3,})/.exec(lines[index]);
    outsideFence[index] = fence === null;
    if (marker && (fence === null || (marker[1][0] === fence[0] && marker[1].length >= fence[1]))) {
      fence = fence === null ? [marker[1][0], marker[1].length] : null;
    }
    if (outsideFence[index]) {
      const heading = /^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(lines[index]);
      if (heading) headings.push({ index, level: heading[1].length, title: heading[2] });
    }
  }
  const entries = [];
  for (const section of headings.filter((heading) => isNamed(heading.title, OPEN_SECTION_PREFIX))) {
    const end = headings.find((heading) => heading.index > section.index && heading.level <= section.level)?.index ?? lines.length;
    for (let index = section.index + 1; index < end; index++) {
      if (!outsideFence[index] || !isListItem(lines[index])) continue;
      const entryLines = [lines[index]];
      for (let next = index + 1; next < end && !/^\s*$/.test(lines[next]) && !isListItem(lines[next]) && !isHeading(lines[next]); next++) {
        entryLines.push(lines[next]);
      }
      const tagMatch = TAG.exec(entryLines.join(" "));
      const titleMatch = TITLE.exec(entryLines[0]);
      const body = titleMatch
        ? [titleMatch[4].trimStart(), ...entryLines.slice(1)].filter((line, bodyIndex) => bodyIndex > 0 || line.length > 0).join("\n")
        : "";
      entries.push({
        line: index + 1,
        lines: entryLines,
        tag: tagMatch ? { kind: tagMatch[1].toLowerCase(), since: tagMatch[2] } : null,
        title: titleMatch ? { kind: titleMatch[1].toLowerCase(), since: titleMatch[2], title: titleMatch[3], body } : null,
      });
    }
  }
  return entries;
}
