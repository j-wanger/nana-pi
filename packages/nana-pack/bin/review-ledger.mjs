#!/usr/bin/env node
// review-ledger.mjs — the review round cap for ANY launcher (T2b). Same ledger and rules as
// pi-review (see review-round.mjs); this is the hook a hand-rolled launcher calls.
//
//   review-ledger run   --item <slug> --out <file> [--role R] [--revision R] [--over-cap WHY] -- <cmd...>
//       reserve a slot, run <cmd> with stdout → <file>, record ONE verdict iff it exits 0 with a
//       review-shaped output; otherwise return the slot. Exit = 1 if refused/no verdict, else 0.
//   review-ledger check --item <slug> [--role R] [--revision R]
//       would the next review be admitted? exit 0 yes / 1 no (reserves nothing).

import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { admit, complete, release, reviewShaped } from './review-round.mjs';

const [cmd, ...rest] = process.argv.slice(2);
const sep = rest.indexOf('--');
const own = sep >= 0 ? rest.slice(0, sep) : rest;
const child = sep >= 0 ? rest.slice(sep + 1) : [];
const die = (m) => { process.stderr.write(`review-ledger: ${m}\n`); process.exit(1); };

if (cmd !== 'run' && cmd !== 'check') die('usage: review-ledger run|check --item <slug> ... (see packages/nana-pack/README.md)');
if (cmd === 'run' && (!own.includes('--out') || !child.length)) die('run needs --out <file> and -- <cmd...>');
if (cmd === 'check' && own.includes('--over-cap')) die('check takes no --over-cap (an override is recorded only when a review runs)');
if (own.includes('--worker')) die('--worker is a pi-review option; review-ledger only launches reviews');

const adm = admit(own, { launcher: `review-ledger ${cmd}` });
if (!adm.ok) die(adm.message);
if (cmd === 'check') {
  release(adm.id);
  process.stdout.write(`${adm.note.replace('admitted as', 'next would be')}\n`);
  process.exit(0);
}
process.stderr.write(`review-ledger: ${adm.note}\n`);
const out = adm.res.out;
const r = spawnSync(child[0], child.slice(1), { stdio: ['inherit', 'pipe', 'inherit'], encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const text = r.stdout ?? '';
writeFileSync(out, text);
if (r.status === 0 && text.trim() && reviewShaped(text)) {
  complete(adm.res, out);
  process.stderr.write(`review-ledger: verdict recorded for item ${adm.res.item} (${out})\n`);
  process.exit(0);
}
release(adm.id);
die(`no verdict (exit ${r.status ?? r.signal ?? r.error?.code}; ${text.length} chars) — slot returned, no round consumed`);
