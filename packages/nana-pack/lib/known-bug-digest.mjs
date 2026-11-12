/**
 * @module packages/nana-pack/lib/known-bug-digest.mjs
 * @purpose Select whole known-bug lines by role relevance and file order for bounded context.
 * @inputs Known-bug text, relative source, brief text and reviewed root.
 * @outputs Whole-file or folded digest and a shared reviewer section with per-source sizes.
 * @effects disk (review section reads regular known-bug files), process (reviewed tree git diff)
 * @errors Missing or unreadable feature files are skipped; git failure falls back to brief terms.
 */
import { readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, posix } from 'node:path';
import { readBrief } from './brief-precedent.mjs';
import { KNOWN_BUGS_DIR } from './known-bugs-config.mjs';
import { KNOWN_BUG_DIGEST_CHARS, KNOWN_BUG_MATCH_MIN_CHARS, KNOWN_BUG_SECTION_HEADING, KNOWN_BUG_SECTION_LEAD, KNOWN_BUG_FOLDER_SENTENCE } from './known-bug-digest-config.mjs';

export function digestKnownBugs(text, source, brief = '', budget = KNOWN_BUG_DIGEST_CHARS, changedFiles = []) {
  // Keep physical lines including their original terminator, trailing whitespace and final-line shape.
  const lines = text.match(/[^\r\n]*(?:\r\n|\r|\n|$)/g).filter(Boolean);
  const first = lines.findIndex(line => /^- /.test(line));
  const header = (first < 0 ? lines : lines.slice(0, first)).join('');
  // The header is unconditional, even above the budget; only the text after it is capped.
  if (text.length - header.length <= budget) return { text, fullChars: text.length, deliveredChars: text.length, headerChars: header.length };
  const bugs = first < 0 ? [] : lines.slice(first).filter(line => /^- /.test(line));
  const newline = text.includes('\r\n') ? '\r\n' : '\n';
  const parsed = readBrief(brief);
  const terms = [...(parsed.precedent ?? []).filter(p => p.kind === 'path').map(p => p.value), ...[...brief.matchAll(/`([^`\r\n]+)`/g)].map(m => m[1]), ...changedFiles].flatMap(term => {
    const basename = posix.basename(term.replaceAll('\\', '/'));
    return [term, basename, basename.split('.')[0]];
  }).filter(term => term.length >= KNOWN_BUG_MATCH_MIN_CHARS);
  const selected = new Set();
  const fold = n => `${n} known-bug lines omitted for size; read the whole file ${source} before you report the known bugs your change touches. ${KNOWN_BUG_FOLDER_SENTENCE}`;
  const render = () => {
    let kept = header + bugs.filter((_,i) => selected.has(i)).join('');
    if (kept && !/[\r\n]$/.test(kept)) kept += newline;
    return kept + fold(bugs.length - selected.size);
  };
  const tryKeep = i => { selected.add(i); if (render().length - header.length > budget) selected.delete(i); };
  for (let i=0;i<bugs.length;i++) if (terms.some(term => bugs[i].includes(term))) tryKeep(i);
  const delivered = render();
  return { text: delivered, fullChars: text.length, deliveredChars: delivered.length, headerChars: header.length };
}

export function reviewKnownBugSection(root, brief = '') {
  const read = feature => {
    const source = `${KNOWN_BUGS_DIR}/${feature}.md`;
    try { const file = join(root, source); if (statSync(file).isFile()) return { source, text: readFileSync(file,'utf8').replaceAll('\r\n', '\n') }; } catch {}
    return null;
  };
  const feature = readBrief(brief).feature;
  const file = feature ? read(feature) : null;
  if (!file) return { text: null, parts: [] };
  let changedFiles = [];
  try {
    const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const base = git(['merge-base', 'HEAD', 'main']).trim();
    changedFiles = git(['diff', '--no-renames', '--name-only', '-z', base, 'HEAD', '--']).split('\0').filter(Boolean);
  } catch {} // Review delivery must not depend on git or a local main branch being available.
  const digest = digestKnownBugs(file.text, file.source, brief, KNOWN_BUG_DIGEST_CHARS, changedFiles);
  const parts = [{ name: 'known bugs', source: file.source, fullChars: file.text.length, deliveredChars: digest.text.length }];
  return { text: `${KNOWN_BUG_SECTION_HEADING}\n\n${KNOWN_BUG_SECTION_LEAD}\n\n${digest.text}`, parts };
}
