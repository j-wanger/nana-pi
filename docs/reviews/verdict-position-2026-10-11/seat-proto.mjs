// Seat prototype of the revised verdict rule (sol plan r3). Not product code.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const FOLD = { 'Ε':'E','Е':'E','Τ':'T','Т':'T','С':'C','Ϲ':'C','І':'I','Ι':'I','Ӏ':'I','Ѵ':'V','Ꭰ':'D','Ꭱ':'R','ε':'e','е':'e','τ':'t','т':'t','с':'c','і':'i','ι':'i','ѵ':'v','ԁ':'d','г':'r' };
const DI = /\p{Default_Ignorable_Code_Point}/gu;
export const canon = (s) => [...s.normalize('NFKC').replace(DI, '')].map((c) => FOLD[c] ?? c).join('').toLowerCase();
const carries = (l) => /(?<![a-z0-9_])verdict:/.test(canon(l));
const M = '[*_`]*';
const GEN = new RegExp(`^[\\s#>_*\\x60-]*VERDICT:${M}\\s+${M}([A-Z]+(?:-[A-Z]+)*)${M}(?:\\s+${M}(?:\\(\\d+/\\d+\\)|—\\s*\\d+/\\d+|\\d+/\\d+)${M})?[.,;:]?${M}\\s*$`);
const PLAIN = /^VERDICT: ([A-Z]+(?:-[A-Z]+)*)(?: \(\d+\/\d+\)| — \d+\/\d+| \d+\/\d+)?\.?\s*$/;
export function verdict(text) {
  if (text.startsWith('﻿')) text = text.slice(1);
  const L = text.split(/\r?\n/).filter((x) => x.trim() !== '');
  if (!L.length) return { w: null, why: 'blank' };
  const S = L[0], F = L[L.length - 1];
  if (carries(F)) {
    const w = GEN.exec(F)?.[1] ?? null;
    if (!w) return { w: null, why: 'final malformed' };
    if (L.length > 1 && carries(S)) {
      const ws = PLAIN.exec(S)?.[1] ?? null; // sol build r1: the first line is always held to the plain grammar
      return ws === w ? { w, why: 'first+final agree' } : { w: null, why: 'first disagrees' };
    }
    return { w, why: 'final line' };
  }
  const ws = PLAIN.exec(S)?.[1] ?? null;
  if (!ws) return { w: null, why: L.slice(1).some((l) => carries(l)) || carries(S) ? 'verdict only in the middle / not plain' : 'no verdict' };
  if (L.slice(1).some((l) => canon(l).includes('verdict'))) return { w: null, why: 'other line mentions verdict' };
  return { w: ws, why: 'first line' };
}
if (process.argv[2] === 'corpus') {
  const saved = JSON.parse(readFileSync(process.argv[3], 'utf8'));
  const bad = [];
  const tally = {};
  for (const [cat, files] of Object.entries(saved)) for (const f of files) {
    const r = verdict(readFileSync(f, 'utf8'));
    const got = r.w === null ? 'empty' : r.why;
    tally[got] = (tally[got] ?? 0) + 1;
    const want = cat.startsWith('empty') ? 'empty' : cat;
    if (got !== want) bad.push([cat, got, r.why, f]);
  }
  console.log('ledger corpus:', JSON.stringify(tally), 'mismatches:', bad.length); for (const b of bad) console.log(b);
  const yk = [];
  const walk = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p) : n.endsWith('.md') && yk.push(p); } };
  walk(process.argv[4]);
  // yokai subset: first non-blank line carries the ASCII label, final line does not.
  const tok = /(?<![A-Za-z0-9_])VERDICT:/;
  const yt = {};
  for (const f of yk) {
    const L = readFileSync(f, 'utf8').split(/\r?\n/).filter((x) => x.trim());
    if (!L.length || !tok.test(L[0]) || tok.test(L.at(-1))) continue;
    const r = verdict(readFileSync(f, 'utf8')); const k = r.w === null ? `empty: ${r.why}` : r.why; yt[k] = (yt[k] ?? 0) + 1;
  }
  console.log('yokai first-line-only outputs:', JSON.stringify(yt));
}
if (process.argv[2] === 'probe') {
  const cases = [
    ['zwsp first-line rejection, final LAND', 'V​ERDICT: SEND-BACK\nFindings follow.\nVERDICT: LAND', null],
    ['greek-folded first-line rejection, final LAND', 'VΕRDICT: SEND-BACK\nFindings follow.\nVERDICT: LAND', null],
    ['CGJ later rejection after first LAND', 'VERDICT: LAND\nV͏ERDICT: SEND-BACK', null],
    ['BOM then plain first line', '﻿VERDICT: LAND 9/10\nnotes', 'LAND'],
    ['yokai shape', 'VERDICT: LAND 9/10\n\n## Notes\nfine', 'LAND'],
    ['both agree', 'VERDICT: LAND (9/10)\nbody\nVERDICT: LAND', 'LAND'],
    ['both disagree', 'VERDICT: SEND-BACK 4/10 — blockers remain\nbody\nVERDICT: LAND', null],
    ['lowercase first-line verdict: then final LAND', 'verdict: send-back\nbody\nVERDICT: LAND', null],
    ['final only', 'body\n**VERDICT: LAND** (9/10)', 'LAND'],
    ['prose mention after first LAND', 'VERDICT: LAND\nThe verdict holds.', null],
    ['XVERDICT final', 'VERDICT: LAND\nXVERDICT: SEND-BACK', null],
    ['backtick first line', '`VERDICT: LAND`\nnotes', null],
  ];
  for (const [n, t, want] of cases) { const r = verdict(t); console.log(r.w === want ? 'ok  ' : 'FAIL', n, '→', r.w, `(${r.why})`); }
}
