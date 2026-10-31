/**
 * @module packages/nana-pack/lib/known-bug-digest.mjs
 * @purpose Select whole known-bug lines by brief relevance and file order for bounded role context.
 * @inputs Known-bug text, relative source, brief text, movement section and reviewed root.
 * @outputs Whole-file or folded digest and a shared reviewer section with per-source sizes.
 * @effects disk (review section reads regular known-bug files)
 * @errors Missing or unreadable feature files are skipped.
 */
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { readBrief } from './brief-precedent.mjs';
import { KNOWN_BUGS_DIR } from './known-bugs-config.mjs';
import { KNOWN_BUG_DIGEST_CHARS, KNOWN_BUG_MATCH_MIN_CHARS, KNOWN_BUG_SECTION_HEADING, KNOWN_BUG_SECTION_LEAD } from './known-bug-digest-config.mjs';

export function digestKnownBugs(text, source, brief = '', budget = KNOWN_BUG_DIGEST_CHARS) {
  if (text.length <= budget) return { text, fullChars: text.length, deliveredChars: text.length };
  // Keep physical lines including their original terminator, trailing whitespace and final-line shape.
  const lines = text.match(/[^\r\n]*(?:\r\n|\r|\n|$)/g).filter(Boolean);
  const first = lines.findIndex(line => /^- /.test(line));
  const header = (first < 0 ? lines : lines.slice(0, first)).join('');
  const bugs = first < 0 ? [] : lines.slice(first).filter(line => /^- /.test(line));
  const newline = text.includes('\r\n') ? '\r\n' : '\n';
  const parsed = readBrief(brief);
  const terms = [...(parsed.precedent ?? []).filter(p => p.kind === 'path').map(p => p.value), ...[...brief.matchAll(/`([^`\r\n]+)`/g)].map(m => m[1])].filter(term => term.length >= KNOWN_BUG_MATCH_MIN_CHARS);
  const selected = new Set();
  const fold = n => `${n} known-bug lines omitted for size; read the whole file ${source} before you report the known bugs your change touches.`;
  const render = () => {
    let kept = header + bugs.filter((_,i) => selected.has(i)).join('');
    if (kept && !/[\r\n]$/.test(kept)) kept += newline;
    return kept + fold(bugs.length - selected.size);
  };
  const tryKeep = i => { selected.add(i); if (render().length > budget) selected.delete(i); };
  for (let i=0;i<bugs.length;i++) if (terms.some(term => bugs[i].includes(term))) tryKeep(i);
  for (let i=bugs.length-1;i>=0;i--) if (!selected.has(i)) tryKeep(i);
  const delivered = render();
  return { text: delivered, fullChars: text.length, deliveredChars: delivered.length };
}

export function reviewKnownBugSection(root, movement, brief = '') {
  const features = [...new Set([...String(movement ?? '').matchAll(/\b(FEAT-\d{3}) · /g)].map(m => m[1]))];
  const read = feature => {
    const source = `${KNOWN_BUGS_DIR}/${feature}.md`;
    try { const file = join(root, source); if (statSync(file).isFile()) return { source, text: readFileSync(file,'utf8') }; } catch {}
    return null;
  };
  let files = features.map(read).filter(Boolean);
  if (!files.length) { const feature = readBrief(brief).feature; if (feature) files = [read(feature)].filter(Boolean); }
  if (!files.length) return { text: null, parts: [] };
  let remaining = KNOWN_BUG_DIGEST_CHARS;
  const parts = [], sections = [];
  for (let i=0;i<files.length;i++) {
    const file = files[i];
    const digest = digestKnownBugs(file.text, file.source, brief, Math.floor(remaining/(files.length-i)));
    remaining -= digest.text.length;
    sections.push(digest.text);
    parts.push({ name: 'known bugs', source: file.source, fullChars: file.text.length, deliveredChars: digest.text.length });
  }
  return { text: `${KNOWN_BUG_SECTION_HEADING}\n\n${KNOWN_BUG_SECTION_LEAD}\n\n${sections.join('\n\n')}`, parts };
}
