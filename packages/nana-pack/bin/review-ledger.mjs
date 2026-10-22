#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/review-ledger.mjs
 * @purpose The review round cap as a hook for any launcher — `run` reserves a round around a command and
 *  records its verdict, `check` asks whether one would be admitted.
 * @inputs argv (`run --item <slug> --out <file> [--tree <path>] [--role R] [--revision R] [--over-cap WHY] -- <cmd...>`,
 *  `check --item <slug> [--tree <path>] [--revision R]`, or `keep --item <slug> --into <dir> [--repo <path>]`),
 *  the reviewed tree's git state, the user-scope review ledger,
 *  review-launch.mjs's command resolver, and worker-config.mjs's REVIEWER_CHILD_ENV
 * @outputs the child's stdout written to --out and the kept-text store, a recorded round, lane-folder copies
 *  from `keep`, the projection note on stdout for `check`, and admission, warning, unread-verdict, cannot-start and refusal lines on stderr
 * @effects process (resolves and spawns the review command with reviewer child env and stdout piped,
 *  runs the reservation heartbeat, sets the exit code), disk (writes --out and the ledger's lock,
 *  reservation, kept text, tally and audit files, including a best-effort cannot-start line)
 * @errors exit 1 on a bad subcommand, a missing --out or `--`, a `--over-cap` on check, a refused
 *  admission or command start, an unwritable --out, a recorded empty verdict, or a non-zero /
 *  non-review-shaped result (only the latter returns the reservation with no round consumed); exit 0 otherwise
 */
// review-ledger.mjs — the review round cap for ANY launcher (T2b). Same ledger and rules as
// pi-review (see review-round.mjs); this is the hook a hand-rolled launcher calls.
//
//   review-ledger run   --item <slug> --out <file> [--tree <path>] [--role R] [--revision R] [--over-cap WHY] -- <cmd...>
//       reserve the round, run <cmd> (cwd = the reviewed tree) with stdout → <file>, record the
//       verdict iff it exits 0 with a review-shaped output; otherwise return the reservation.
//       Exit = 1 if refused / no verdict / not recorded, or if the recorded verdict is empty; else 0.
//   review-ledger check --item <slug> [--tree <path>] [--revision R]
//       would a review of this tree's revision be admitted? exit 0 yes / 1 no. Takes the lock,
//       writes nothing (no reservation, no pruning).

import { spawn } from 'node:child_process';
import { lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  admit, canonicalItem, complete, KEEP_NAME_HASH_CHARS, project, readRounds, release, repoKeyOf,
  reviewTextEvidence, SLUG_MAX, startHeartbeat,
} from './review-round.mjs';
import { reviewShaped } from './review-shape.mjs';
import { reviewLaunch } from './review-launch.mjs';
import { REVIEWER_CHILD_ENV } from './worker-config.mjs';

const [cmd, ...rest] = process.argv.slice(2);
const sep = rest.indexOf('--');
const own = sep >= 0 ? rest.slice(0, sep) : rest;
const child = sep >= 0 ? rest.slice(sep + 1) : [];
const die = (m) => { process.stderr.write(`review-ledger: ${m}\n`); process.exit(1); };
const ownOption = (name) => {
  const i = own.indexOf(name);
  return i >= 0 ? own[i + 1] : undefined;
};

if (cmd === 'keep') {
  const rawItem = ownOption('--item');
  const intoArg = ownOption('--into');
  const repoPath = ownOption('--repo') ?? process.cwd();
  if (!rawItem || !intoArg) die('keep needs --item <slug> and --into <dir>');
  let item, repo;
  try { item = canonicalItem(rawItem); } catch (error) { die(error.message); }
  try { repo = repoKeyOf(resolve(repoPath)); } catch { die(`--repo is not a git repository: ${repoPath}`); }
  const home = homedir();
  const rows = readRounds(home, { item, repo });
  const revisions = [...new Set(rows.map((row) => row.revision))];
  const planned = new Map();
  for (const row of rows) {
    if (!Object.hasOwn(row, 'text')) continue;
    const kept = reviewTextEvidence(home, row.text);
    if (kept.status !== 'intact') continue;
    const role = String(row.role ?? 'reviewer').toLowerCase().replace(/[^a-z0-9._-]/g, '-').slice(0, SLUG_MAX) || 'reviewer';
    const round = revisions.indexOf(row.revision) + 1;
    const name = `r${round}-${role}-${row.text.sha256.slice(0, KEEP_NAME_HASH_CHARS)}.md`;
    const prior = planned.get(name);
    if (prior && !prior.equals(kept.bytes)) die(`two kept texts would use ${name} with different bytes; wrote nothing`);
    planned.set(name, kept.bytes);
  }
  if (!planned.size) die(`item ${item} in this repository has no kept text`);
  const into = resolve(intoArg);
  let intoState = null;
  try { intoState = lstatSync(into); } catch (error) { if (error.code !== 'ENOENT') die(`cannot inspect ${into}: ${error.message}`); }
  if (intoState && (!intoState.isDirectory() || intoState.isSymbolicLink())) die(`--into ${into} is not a regular directory`);
  const writes = [];
  for (const [name, bytes] of planned) {
    const target = join(into, name);
    let state = null;
    try { state = lstatSync(target); } catch (error) { if (error.code !== 'ENOENT') die(`cannot inspect ${target}: ${error.message}`); }
    if (!state) { writes.push([target, bytes]); continue; }
    if (!state.isFile() || state.isSymbolicLink()) die(`${target} is not a regular file; wrote nothing`);
    let existing;
    try { existing = readFileSync(target); } catch (error) { die(`cannot read ${target}: ${error.message}; wrote nothing`); }
    if (!existing.equals(bytes)) die(`${target} holds different bytes; wrote nothing`);
  }
  try {
    mkdirSync(into, { recursive: true });
    for (const [target, bytes] of writes) writeFileSync(target, bytes, { flag: 'wx', mode: 0o600 });
  } catch (error) { die(`cannot keep review text: ${error.message}`); }
  process.stdout.write(`kept ${planned.size} review text(s) for ${item} in ${into}\n`);
  process.exit(0);
}
if (cmd === 'report') {
  const item = ownOption('--item');
  const repoPath = ownOption('--repo');
  let repo;
  if (repoPath) {
    try { repo = repoKeyOf(resolve(repoPath)); } catch { die(`--repo is not a git repository: ${repoPath}`); }
  }
  const home = process.env.HOME ?? process.env.USERPROFILE;
  for (const r of readRounds(home, { item, repo })) {
    const short = String(r.revision ?? '-').slice(0, 12);
    const duration = Number.isFinite(r.durationMs) ? `${r.durationMs}ms` : '-';
    const fields = [r.item ?? '-', short, r.role ?? '-', r.model ?? '-', duration, r.attempts ?? '-', r.verdict ?? '-', r.overCap ?? '-'];
    process.stdout.write(fields.map((x) => String(x).replace(/\s+/g, '_')).join(' | ') + '\n');
  }
  process.exit(0);
}
if (cmd !== 'run' && cmd !== 'check') die('usage: review-ledger run|check|report|keep [--item <slug>] [--repo <path>] (see packages/nana-pack/README.md)');
if (cmd === 'check') {
  if (own.includes('--over-cap')) die('check takes no --over-cap (an override is recorded only when a review runs)');
  const pr = project(own);
  if (!pr.ok) die(pr.message);
  process.stdout.write(`${pr.note}\n`);
  if (pr.warning) process.stderr.write(`review-ledger: WARNING: ${pr.warning}\n`);
  process.exit(0);
}
if (!own.includes('--out') || !child.length) die('run needs --out <file> and -- <cmd...>');

const childOption = (name) => {
  const eq = child.find((x) => x.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const i = child.indexOf(name);
  return i >= 0 ? child[i + 1] : null;
};
const adm = admit(own, { launcher: 'review-ledger run', provider: childOption('--provider'), model: childOption('--model'), attempts: 1 });
if (!adm.ok) die(adm.message);
process.stderr.write(`review-ledger: ${adm.note}\n`);
if (adm.warning) process.stderr.write(`review-ledger: WARNING: ${adm.warning}\n`);
const out = adm.res.out;
const cannotStart = (reason) => {
  release(adm.id);
  const line = `cannot start ${child[0] || '""'}: ${reason}`;
  try { writeFileSync(out, `${line}\n`); } catch { /* best effort; stderr remains authoritative */ }
  die(line);
};
const launch = reviewLaunch(child, { cwd: adm.res.cwd });
if (launch.refused) cannotStart(launch.refused);
// async spawn so the heartbeat keeps renewing the reservation while the review runs (sol r2 #15)
const stopHeartbeat = startHeartbeat(adm.res);
const chunks = [];
let k;
try {
  k = spawn(launch.command, launch.args, { ...launch.options, cwd: adm.res.cwd, stdio: ['inherit', 'pipe', 'inherit'], env: { ...process.env, ...REVIEWER_CHILD_ENV } });
} catch (e) {
  stopHeartbeat();
  cannotStart(e.code ?? e.message);
}
const r = await new Promise((done) => {
  k.stdout.on('data', (c) => chunks.push(c));
  k.on('error', (error) => done({ status: null, error, stdout: Buffer.concat(chunks).toString('utf8') }));
  k.on('close', (status, signal) => done({ status, signal, stdout: Buffer.concat(chunks).toString('utf8') }));
});
stopHeartbeat();
if (r.error) cannotStart(r.error.code ?? r.error.message);
const text = r.stdout ?? '';
try { writeFileSync(out, text); } catch (e) { release(adm.id); die(`cannot write ${out}: ${e.message} — reservation returned`); }
if (r.status === 0 && text.trim() && reviewShaped(text)) {
  const c = complete(adm.res, out, { attempts: 1, text });
  if (!c.ok) die(`review written to ${out}, but ${c.message}`);
  if (c.unread) die(c.unread);
  process.stderr.write(`review-ledger: verdict recorded for item ${adm.res.item} (round ${c.round}; ${out})\n`);
  process.exit(0);
}
release(adm.id);
die(`no verdict (exit ${r.status ?? r.signal ?? r.error?.code}; ${text.length} chars) — reservation returned, no round consumed`);
