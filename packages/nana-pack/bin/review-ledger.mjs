#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/review-ledger.mjs
 * @purpose The review round cap as a hook for any launcher — `run` reserves a round around a command and
 *  records its verdict, `check` asks whether one would be admitted.
 * @inputs argv (`run --item <slug> --out <file> [--tree <path>] [--role R] [--revision R] [--over-cap WHY] -- <cmd...>`,
 *  `check --item <slug> [--tree <path>] [--revision R]`, or `keep --item <slug> --into <dir> [--repo <path>]`),
 *  the reviewed tree's git state, the user-scope review ledger, review-movement.mjs's section for `--repo`'s HEAD,
 *  review-launch.mjs's command resolver, reviewer child env, and Claude user/flag settings
 * @outputs the child's stdout written to --out and the kept-text store, a recorded round, lane-folder copies
 *  from `keep` including tree-movement.md and its movement warning, the projection note on stdout for `check`,
 *  and admission, warning, unread-verdict, cannot-start and refusal lines on stderr
 * @effects process (resolves and spawns the review command with reviewer child env and stdout piped,
 *  runs the reservation heartbeat and review-movement.mjs on keep, sets the exit code), disk (writes --out and the ledger's lock,
 *  reservation, kept text, tally and audit files, including a best-effort cannot-start line;
 *  Claude children receive private temporary sealed flag settings with exit/watcher cleanup)
 * @errors keep warns and never refuses over the movement; it exits 1 with no kept text unless it wrote the movement file.
 *  Other exits: 1 on a bad subcommand, a missing --out or `--`, a `--over-cap` on check, a refused
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
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import {
  admit, canonicalItem, complete, KEEP_MOVEMENT_FILE_NAME, KEEP_NAME_HASH_CHARS, project, readRounds, release, repoKeyOf,
  reviewTextEvidence, SLUG_MAX, startHeartbeat,
} from './review-round.mjs';
import { reviewMovementSection, notComputedReason } from '../lib/review-movement.mjs';
import { reviewShaped } from './review-shape.mjs';
import { reviewLaunch } from './review-launch.mjs';
import { CLAUDE_BUILDER_CHILD_ENV, CLAUDE_SETTINGS_FLAG, REVIEWER_CHILD_ENV } from './worker-config.mjs';
import { CLAUDE_BIN } from '../lib/claude-review-config.mjs';
import { credentialStripEnv } from '../lib/credential-strip.mjs';
import { CREDENTIAL_CONFIG_RESETS, CREDENTIAL_ENV, GIT_CONFIG_ENV } from '../lib/credential-strip-config.mjs';
import { readClaudeBuilderSettings, writeClaudeBuilderSettings } from '../lib/claude-settings-carry.mjs';
import { parseJsonBytes } from '../lib/json-text.mjs';
import { startLaneWatcher } from '../lib/lane-watcher.mjs';

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
  const section = reviewMovementSection(resolve(repoPath));
  const notComputed = section === null ? null : notComputedReason(section);
  const movementWarning = (reason) => process.stderr.write(`review-ledger: WARNING: ${KEEP_MOVEMENT_FILE_NAME} not written: ${reason}\n`);
  if (notComputed !== null) movementWarning(notComputed);
  const wantMovement = section !== null && notComputed === null;
  if (planned.size === 0 && !wantMovement) die(`item ${item} in this repository has no kept text`);
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
  let movementWritten = false;
  if (wantMovement) {
    const target = join(into, KEEP_MOVEMENT_FILE_NAME);
    try {
      let state = null;
      try { state = lstatSync(target); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (state && (!state.isFile() || state.isSymbolicLink())) movementWarning('not a regular file');
      else { writeFileSync(target, section); movementWritten = true; }
    } catch (error) { movementWarning(error.code ?? error.message); }
  }
  if (planned.size === 0 && !movementWritten) die(`item ${item} in this repository has no kept text`);
  process.stdout.write(`kept ${planned.size} review text(s)${movementWritten ? ` and ${KEEP_MOVEMENT_FILE_NAME}` : ''} for ${item} in ${into}\n`);
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
// Claude applies settings after spawn, so seal that environment as well. Preserve a
// wrapper's existing flag settings (including its role/memory policy), but never let
// their credential entries restore dispatch. Resolve only after replacing the flag.
if (basename(child[0]).replace(/\.(?:exe|com|cmd|bat)$/i, '').toLowerCase() === CLAUDE_BIN) {
  try {
    const supplied = childOption(CLAUDE_SETTINGS_FLAG);
    const settings = supplied === null ? {} : parseJsonBytes(supplied.trimStart().startsWith('{') ? supplied : readFileSync(resolve(adm.res.cwd, supplied)));
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new Error('settings must be an object');
    const suppliedEnv = settings.env ?? {};
    const names = GIT_CONFIG_ENV;
    const count = Number(suppliedEnv[names.count]);
    // Keep a wrapper's already sealed file and its exact delivered-byte log intact.
    // Check both dispatch routes, every reset slot, and every fixed control first.
    const alreadySealed = Object.entries({ ...CLAUDE_BUILDER_CHILD_ENV, ...REVIEWER_CHILD_ENV, ...CREDENTIAL_ENV }).every(([name, value]) => suppliedEnv[name] === value)
      && suppliedEnv[names.parameters]?.endsWith(CREDENTIAL_CONFIG_RESETS.map(([key, value]) => `'${key}=${value}'`).join(' '))
      && Number.isSafeInteger(count) && count >= CREDENTIAL_CONFIG_RESETS.length
      && CREDENTIAL_CONFIG_RESETS.every(([key, value], offset) => suppliedEnv[`${names.key}${count - CREDENTIAL_CONFIG_RESETS.length + offset}`] === key && suppliedEnv[`${names.value}${count - CREDENTIAL_CONFIG_RESETS.length + offset}`] === value);
    if (!alreadySealed) {
      const sealed = { ...CLAUDE_BUILDER_CHILD_ENV, ...REVIEWER_CHILD_ENV, ...credentialStripEnv({ ...process.env, ...suppliedEnv }) };
      const carry = readClaudeBuilderSettings(sealed, 'review-ledger', childOption('--model'), adm.res.cwd);
      carry.settings = { ...carry.settings, ...settings, env: { ...carry.settings.env, ...suppliedEnv, ...sealed } };
      const folder = mkdtempSync(join(tmpdir(), 'nana-review-ledger-'));
      process.once('exit', () => { try { rmSync(folder, { recursive: true, force: true }); } catch {} });
      for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.once(signal, () => process.exit({ SIGINT: 130, SIGTERM: 143, SIGHUP: 129 }[signal]));
      // The cleanup-only watcher handles forced Windows stops; no build or lane lock exists.
      if (process.platform === 'win32') startLaneWatcher({ folder, lock: join(folder, 'unused-reviewer.lock'), workerPid: process.pid, commonDir: folder, cwd: adm.res.cwd });
      const settingsFile = join(folder, 'reviewer-settings.json');
      writeClaudeBuilderSettings(settingsFile, carry);
      const index = child.findIndex(word => word === CLAUDE_SETTINGS_FLAG || word.startsWith(`${CLAUDE_SETTINGS_FLAG}=`));
      if (index < 0) child.push(CLAUDE_SETTINGS_FLAG, settingsFile);
      else if (child[index] === CLAUDE_SETTINGS_FLAG) child[index + 1] = settingsFile;
      else child[index] = `${CLAUDE_SETTINGS_FLAG}=${settingsFile}`;
    }
  } catch (error) {
    // Parser errors can contain settings values; report only a value-free refusal.
    cannotStart(`cannot seal Claude settings (${error.code ?? 'invalid settings'})`);
  }
}
const launch = reviewLaunch(child, { cwd: adm.res.cwd });
if (launch.refused) cannotStart(launch.refused);
// async spawn so the heartbeat keeps renewing the reservation while the review runs (sol r2 #15)
const stopHeartbeat = startHeartbeat(adm.res);
const chunks = [];
let k;
try {
  k = spawn(launch.command, launch.args, { ...launch.options, cwd: adm.res.cwd, stdio: ['inherit', 'pipe', 'inherit'], env: { ...process.env, ...REVIEWER_CHILD_ENV, ...credentialStripEnv(process.env) } });
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
