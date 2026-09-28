#!/usr/bin/env node
// review-ledger.mjs — the review round cap for ANY launcher (T2b). Same ledger and rules as
// pi-review (see review-round.mjs); this is the hook a hand-rolled launcher calls.
//
//   review-ledger run   --item <slug> --out <file> [--role R] [--revision R] [--over-cap WHY] -- <cmd...>
//       reserve the round, run <cmd> (cwd = the reviewed tree) with stdout → <file>, record the
//       verdict iff it exits 0 with a review-shaped output; otherwise return the reservation.
//       Exit = 1 if refused / no verdict / not recorded, else 0.
//   review-ledger check --item <slug> [--revision R]
//       would a review of this tree's revision be admitted? exit 0 yes / 1 no. Takes the lock,
//       writes nothing (no reservation, no pruning).

import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { admit, complete, project, release, startHeartbeat } from './review-round.mjs';
import { reviewShaped } from './review-shape.mjs';

const [cmd, ...rest] = process.argv.slice(2);
const sep = rest.indexOf('--');
const own = sep >= 0 ? rest.slice(0, sep) : rest;
const child = sep >= 0 ? rest.slice(sep + 1) : [];
const die = (m) => { process.stderr.write(`review-ledger: ${m}\n`); process.exit(1); };

if (cmd !== 'run' && cmd !== 'check') die('usage: review-ledger run|check --item <slug> ... (see packages/nana-pack/README.md)');
if (cmd === 'check') {
  if (own.includes('--over-cap')) die('check takes no --over-cap (an override is recorded only when a review runs)');
  const pr = project(own);
  if (!pr.ok) die(pr.message);
  process.stdout.write(`${pr.note}\n`);
  if (pr.warning) process.stderr.write(`review-ledger: WARNING: ${pr.warning}\n`);
  process.exit(0);
}
if (!own.includes('--out') || !child.length) die('run needs --out <file> and -- <cmd...>');

const adm = admit(own, { launcher: 'review-ledger run' });
if (!adm.ok) die(adm.message);
process.stderr.write(`review-ledger: ${adm.note}\n`);
if (adm.warning) process.stderr.write(`review-ledger: WARNING: ${adm.warning}\n`);
const out = adm.res.out;
// async spawn so the heartbeat keeps renewing the reservation while the review runs (sol r2 #15)
const stopHeartbeat = startHeartbeat(adm.res);
const r = await new Promise((done) => {
  const chunks = [];
  const k = spawn(child[0], child.slice(1), { stdio: ['inherit', 'pipe', 'inherit'] });
  k.stdout.on('data', (c) => chunks.push(c));
  k.on('error', (error) => done({ status: null, error, stdout: Buffer.concat(chunks).toString('utf8') }));
  k.on('close', (status, signal) => done({ status, signal, stdout: Buffer.concat(chunks).toString('utf8') }));
});
stopHeartbeat();
const text = r.stdout ?? '';
try { writeFileSync(out, text); } catch (e) { release(adm.id); die(`cannot write ${out}: ${e.message} — reservation returned`); }
if (r.status === 0 && text.trim() && reviewShaped(text)) {
  const c = complete(adm.res, out);
  if (!c.ok) die(`review written to ${out}, but ${c.message}`);
  process.stderr.write(`review-ledger: verdict recorded for item ${adm.res.item} (round ${c.round}; ${out})\n`);
  process.exit(0);
}
release(adm.id);
die(`no verdict (exit ${r.status ?? r.signal ?? r.error?.code}; ${text.length} chars) — reservation returned, no round consumed`);
