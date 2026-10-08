#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/pi-review.mjs
 * @purpose Run a `pi` REVIEW under the liveness watchdog and the per-item round cap, recording the verdict
 *  only when a review was produced.
 * @inputs argv (--out, --item, --tree, --role, --revision, --over-cap, --stall-secs, --retries, --poll, then `--`
 *  and the pi args), the user-scope review ledger, and the reviewed tree's git revision
 * @outputs the review text written to --out, a round recorded in the ledger, and the admission note,
 *  warnings and a SUCCESS / FAILED line on stderr
 * @effects disk (writes --out plus the ledger's reservation, tally and audit files), process (the
 *  watchdog's `pi` child, the reservation heartbeat, the exit code)
 * @errors exit 1 when admission is refused (over the cap, a git failure, a bad --out, bad args), when every
 *  attempt stalled or failed, or when the round could not be recorded; exit 0 otherwise
 */
// pi-review.mjs — run a `pi` (Codex) REVIEW under the liveness watchdog (pi-watchdog.mjs), with
// the per-item review round cap (review-round.mjs, T2b). Every launch here is a review: there is
// no opt-out flag (--worker was removed — a worker launch uses pi-worker, which records nothing).
//
// Usage:
//   node pi-review.mjs --out <file> --item <slug> [--tree <path>] [--role sol] [--revision <id>]
//                      [--stall-secs 75] [--retries 2] [--poll 15] [--over-cap <why>] -- <pi args...>
// Exit: 0 = a review was produced (written to --out) and its verdict recorded; 1 = refused, all
// retries stalled, bad args, or the verdict could not be recorded.

import { chmodSync, copyFileSync, lstatSync, mkdirSync, mkdtempSync, readlinkSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { admit, complete, release, startHeartbeat, treeScope, resolveRevision, inTreeRedirect, outInTree } from './review-round.mjs';
import { reviewShaped } from './review-shape.mjs';
import { parseWatchdogArgv, runWatchdog, RETRIES_NOTICE } from './pi-watchdog.mjs';

const USAGE = 'usage: pi-review.mjs --out <file> --item <slug> [--tree <path>] [--role R] [--revision R] [--over-cap WHY] [--stall-secs N] [--retries N] [--poll N] -- <pi args...>\n';
const w = parseWatchdogArgv(process.argv);
if (w.error) {
  process.stderr.write(w.error === 'usage' ? USAGE : `pi-review: ${w.error}\n`);
  process.exit(1);
}

if (w.retriesExplicit) process.stderr.write(RETRIES_NOTICE('pi-review', w.retries));

// Round cap — only the argv BEFORE `--` is consulted, so a pi arg can never satisfy or spoof
// --item/--over-cap.
const optionValue = (name, fallback = null) => {
  const i = w.ownArgs.indexOf(name);
  return i >= 0 ? w.ownArgs[i + 1] : fallback;
};
const sourceTree = resolve(process.cwd(), optionValue('--tree', '.'));
const outPath = resolve(process.cwd(), w.outPath);
const sourceScope = treeScope(sourceTree, { exclude: [outPath] });
const sourceRevision = resolveRevision(optionValue('--revision'), sourceScope, sourceScope.root);
const sourceRoot = realpathSync(sourceScope.root);
let sourceOutWarning = null;
const sourceRedirect = inTreeRedirect(sourceRoot);
let tempRoot = null, admittedId = null, setupSignal = null;
const setupSignalHandlers = new Map(['SIGINT', 'SIGTERM', 'SIGHUP'].map((signal) => [signal, () => { setupSignal = signal; }]));
for (const [signal, handler] of setupSignalHandlers) process.on(signal, handler);
const git = (cwd, args) => {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (r.status !== 0) throw new Error((r.stderr || `git ${args[0]} failed`).trim());
  return r.stdout;
};
const list = (cwd, args) => git(cwd, args).split('\0').filter(Boolean);
const reclaimDeadReviewWorktrees = () => {
  const listed = git(sourceRoot, ['worktree', 'list', '--porcelain']);
  const paths = listed.split(/\r?\n/).filter((line) => line.startsWith('worktree ')).map((line) => line.slice(9));
  let reclaimed = false;
  for (const path of paths) {
    let canonicalPath;
    try { canonicalPath = realpathSync(path); } catch { canonicalPath = resolve(path); }
    const tempRelative = relative(realpathSync(tmpdir()), canonicalPath);
    if (tempRelative === '..' || tempRelative.startsWith(`..${sep}`) || tempRelative === '') continue;
    const match = /^nana-review-(\d+)-/.exec(path.split(/[\\/]/).at(-1));
    if (!match) continue;
    try { process.kill(Number(match[1]), 0); } catch (error) {
      if (error.code !== 'ESRCH') continue;
      const removed = spawnSync('git', ['worktree', 'remove', '--force', path], { cwd: sourceRoot, stdio: 'ignore' });
      if (removed.error || removed.status !== 0) throw new Error(`cannot reclaim stale review worktree ${path}`);
      reclaimed = true;
    }
  }
  if (reclaimed) {
    const pruned = spawnSync('git', ['worktree', 'prune'], { cwd: sourceRoot, stdio: 'ignore' });
    if (pruned.error || pruned.status !== 0) throw new Error('cannot prune reclaimed review worktrees');
  }
};
const removeWorktree = () => {
  if (!tempRoot) return;
  const removed = spawnSync('git', ['worktree', 'remove', '--force', tempRoot], { cwd: sourceRoot, stdio: 'ignore' });
  if (removed.error) throw removed.error;
  if (removed.status !== 0) rmSync(tempRoot, { recursive: true, force: true });
  const pruned = spawnSync('git', ['worktree', 'prune', '--expire', 'now'], { cwd: sourceRoot, stdio: 'ignore' });
  if (pruned.error) throw pruned.error;
  if (pruned.status !== 0) throw new Error('git worktree prune failed');
  const registrations = spawnSync('git', ['worktree', 'list', '--porcelain'], { cwd: sourceRoot, encoding: 'utf8' });
  if (registrations.error) throw registrations.error;
  if (registrations.status !== 0) throw new Error('cannot verify worktree cleanup');
  if (registrations.stdout.split(/\r?\n/).includes(`worktree ${tempRoot}`)) throw new Error(`worktree registration remains: ${tempRoot}`);
};
const copySnapshot = (root, target, excludedPath = null) => {
  const files = [...new Set([...list(root, ['ls-tree', '-r', '-z', '--name-only', 'HEAD']), ...list(root, ['ls-files', '-z']), ...list(root, ['ls-files', '--others', '--exclude-standard', '-z'])])];
  for (const p of files) {
    const from = join(root, p), to = join(target, p);
    if (excludedPath && resolve(from) === excludedPath) continue;
    let st;
    try { st = lstatSync(from); } catch (e) { if (e.code === 'ENOENT' || e.code === 'ENOTDIR') { rmSync(to, { recursive: true, force: true }); continue; } throw e; }
    mkdirSync(dirname(to), { recursive: true });
    rmSync(to, { recursive: true, force: true });
    if (st.isSymbolicLink()) symlinkSync(readlinkSync(from), to);
    else if (st.isFile()) { copyFileSync(from, to); chmodSync(to, st.mode & 0o777); }
    else if (st.isDirectory()) mkdirSync(to, { recursive: true });
    else throw new Error(`unsupported source entry: ${p}`);
  }
};
try {
  reclaimDeadReviewWorktrees();
  sourceOutWarning = outInTree(sourceRoot, outPath);
  if (sourceOutWarning) process.stderr.write(`pi-review: WARNING: ${sourceOutWarning}\n`);
  if (sourceRedirect) throw new Error(`redirect the review log outside the reviewed tree (${sourceRedirect})`);
  // Reject nested repositories (including untracked non-ignored ones) before creating a reservation.
  const gitlinks = git(sourceRoot, ['ls-files', '--stage', '-z']).split('\0').filter((x) => x.startsWith('160000 ')).map((x) => x.slice(x.indexOf('\t') + 1));
  const trackedAndUntracked = [...new Set([...list(sourceRoot, ['ls-files', '-z']), ...list(sourceRoot, ['ls-files', '--others', '--exclude-standard', '-z'])])];
  for (const p of trackedAndUntracked) {
    if (gitlinks.some((link) => p === link || p.startsWith(`${link}/`))) continue;
    const parts = p.split('/');
    for (let i = 1; i <= parts.length; i++) {
      const parent = join(sourceRoot, ...parts.slice(0, i));
      try { lstatSync(join(parent, '.git')); throw new Error(`nested repository cannot be materialized: ${parts.slice(0, i).join('/')}`); }
      catch (e) { if (!['ENOENT', 'ENOTDIR'].includes(e.code)) throw e; }
    }
  }
  for (const p of gitlinks) {
    const status = spawnSync('git', ['-C', join(sourceRoot, p), 'rev-parse', '--show-toplevel'], { encoding: 'utf8' });
    if (status.status === 0) throw new Error(`initialized submodule cannot be materialized: ${p}`);
  }
  tempRoot = mkdtempSync(join(tmpdir(), `nana-review-${process.pid}-`));
  rmSync(tempRoot, { recursive: true, force: true });
  const add = spawnSync('git', ['worktree', 'add', '--detach', tempRoot, sourceScope.head], { cwd: sourceRoot, encoding: 'utf8' });
  if (add.status !== 0) throw new Error(`cannot create detached review worktree: ${(add.stderr || '').trim()}`);
  if (setupSignal) throw new Error(`aborted by ${setupSignal} while preparing the immutable checkout`);
  const outputRelative = relative(sourceRoot, outPath);
  const checkoutOutPath = outputRelative === '..' || outputRelative.startsWith(`..${sep}`) ? outPath : resolve(tempRoot, outputRelative);
  copySnapshot(sourceRoot, tempRoot, outputRelative === '..' || outputRelative.startsWith(`..${sep}`) ? null : outPath);
  const checkoutScope = treeScope(tempRoot, { exclude: [checkoutOutPath] });
  const checkoutRevision = resolveRevision(sourceScope.head, checkoutScope, checkoutScope.root);
  if (checkoutRevision !== sourceRevision) throw new Error(`dirty snapshot could not be reproduced exactly (source ${sourceRevision}, checkout ${checkoutRevision}); review refused without consuming a round`);

  const childArgs = [...w.ownArgs];
  const treeIndex = childArgs.indexOf('--tree');
  if (treeIndex >= 0) childArgs[treeIndex + 1] = tempRoot;
  else childArgs.push('--tree', tempRoot);
  const revisionIndex = childArgs.indexOf('--revision');
  if (revisionIndex >= 0) childArgs[revisionIndex + 1] = sourceScope.head;
  else childArgs.push('--revision', sourceScope.head);
  const outIndex = childArgs.indexOf('--out');
  childArgs[outIndex + 1] = outPath;
  w.outPath = outPath;
  if (setupSignal) throw new Error(`aborted by ${setupSignal} while preparing the immutable checkout`);
  const piOption = (...names) => {
    for (const name of names) {
      const equals = w.piArgs.find((arg) => arg.startsWith(`${name}=`));
      if (equals) return equals.slice(name.length + 1);
      const i = w.piArgs.indexOf(name);
      if (i >= 0) return w.piArgs[i + 1];
    }
    return null;
  };
  const adm = admit(childArgs, { launcher: 'pi-review', cwd: process.cwd(), provider: piOption('--provider'), model: piOption('--model', '-m'), attempts: w.retries + 1 });
  if (!adm.ok) throw new Error(adm.message);
  admittedId = adm.id;
  process.stderr.write(`pi-review: ${adm.note}\n`);
  if (adm.warning) process.stderr.write(`pi-review: WARNING: ${adm.warning}\n`);

  const stopHeartbeat = startHeartbeat(adm.res); // a live, renewing review never loses its reservation
  let r;
  try {
    r = await runWatchdog('pi-review', { ...w, cwd: tempRoot, piArgs: [...w.piArgs, '--append-system-prompt', `Your cwd is an immutable checkout of revision ${sourceRevision} at ${tempRoot}; read files there, not in other worktrees`], childEnv: { NANA_ROLE: 'reviewer', NANA_REVIEW_ROOT: tempRoot }, accept: reviewShaped });
  } finally {
    stopHeartbeat();
    if (!r?.ok) release(adm.id);
  }
  if (r.signal) {
    release(adm.id);
    process.exitCode = { SIGINT: 130, SIGTERM: 143, SIGHUP: 129 }[r.signal] ?? 1;
    process.stderr.write(`[pi-review] aborted by ${r.signal}; reservation released\n`);
  } else if (r.ok) {
    writeFileSync(w.outPath, r.text);
    const c = complete(adm.res, w.outPath, { attempts: r.attempt }); // complete derives in the immutable checkout
    if (!c.ok) throw new Error(`review written to ${w.outPath}, but ${c.message}`);
    process.stderr.write(`[pi-review] SUCCESS on attempt ${r.attempt} (${r.text.length} chars → ${w.outPath}; round ${c.round})\n`);
    process.exitCode = 0;
  } else {
    if (r.text.trim()) writeFileSync(w.outPath, r.text);
    release(adm.id);
    process.stderr.write(`[pi-review] FAILED after ${w.retries + 1} attempts (endpoint likely in a bad stretch)\n`);
    process.exitCode = 1;
  }
} catch (e) {
  if (admittedId) release(admittedId);
  process.stderr.write(`pi-review: ${e.message}\n`);
  process.exitCode = 1;
} finally {
  try { removeWorktree(); } catch (e) { process.stderr.write(`pi-review: WARNING: worktree cleanup failed: ${e.message}\n`); process.exitCode = 1; }
  for (const [signal, handler] of setupSignalHandlers) process.removeListener(signal, handler);
}
