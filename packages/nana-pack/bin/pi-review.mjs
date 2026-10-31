#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/pi-review.mjs
 * @purpose Run a `pi` REVIEW under the liveness watchdog and the per-item round cap, recording the verdict
 *  only when a review was produced.
 * @inputs argv (--out, --item, --tree, --role, --revision, --over-cap, --stall-secs, --retries, --poll, then `--`
 *  and the pi args), the user-scope review ledger, the reviewed tree's git revision, and
 *  prompts/review-standard.md and HEAD's tree movement from scripts/requirements-moved.mjs
 * @outputs the review text written to --out and the kept-text store, a round recorded in the ledger,
 *  an external temporary movement prompt file, and the admission note, warnings and a SUCCESS, FAILED or unread-verdict line on stderr
 * @effects disk (writes --out, creates/removes an external movement folder, and writes the ledger's reservation, kept text, tally and audit files), process (git and scripts/requirements-moved.mjs,
 *  the watchdog's `pi` child, the reservation heartbeat, the exit code)
 * @errors exit 1 when admission is refused (over the cap, a git failure, a bad --out, bad args, a missing,
 *  non-regular or blank review standard), when every attempt stalled or failed, when the round could not
 *  be recorded, or when its recorded verdict is empty; exit 0 otherwise
 */
// pi-review.mjs — run a `pi` (Codex) REVIEW under the liveness watchdog (pi-watchdog.mjs), with
// the per-item review round cap (review-round.mjs, T2b). Every launch here is a review: there is
// no opt-out flag (--worker was removed — a worker launch uses pi-worker, which records nothing).
//
// Usage:
//   node pi-review.mjs --out <file> --item <slug> [--tree <path>] [--role sol] [--revision <id>]
//                      [--stall-secs 75] [--retries 2] [--poll 15] [--over-cap <why>] -- <pi args...>
// Exit: 0 = a review was produced (written to --out) and its non-empty verdict recorded; 1 = refused,
// all retries stalled, bad args, an empty recorded verdict, or the verdict could not be recorded.

import { chmodSync, copyFileSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, statSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { admit, complete, release, startHeartbeat, treeScope, resolveRevision, inTreeRedirect, outInTree, realOut } from './review-round.mjs';
import { realPath, gitPathKey, fileIdentity } from '../lib/real-path.mjs';
import { reviewShaped } from './review-shape.mjs';
import { parseWatchdogArgv, runWatchdog, RETRIES_NOTICE } from './pi-watchdog.mjs';
import { REVIEWER_CHILD_ENV } from './worker-config.mjs';
import { readReviewStandard } from '../lib/review-standard.mjs';
import { reviewMovementSection } from '../lib/review-movement.mjs';
import { MOVEMENT_HEADING, MOVEMENT_LEAD, MOVEMENT_NOT_COMPUTED, MOVEMENT_FOLDER_PREFIX, MOVEMENT_FILE_NAME } from '../lib/review-movement-config.mjs';
import { readBrief } from '../lib/brief-precedent.mjs';
import { reviewKnownBugSection } from '../lib/known-bug-digest.mjs';
import { appendContextLoad, contextPart } from '../lib/context-load-log.mjs';

function piOption(args, ...names) {
  for (const name of names) {
    for (let i=0;i<args.length;i++) {
      if (args[i].startsWith(`${name}=`)) return args[i].slice(name.length + 1);
      if (args[i] === name) return args[i + 1];
    }
  }
  return null;
}

const USAGE = 'usage: pi-review.mjs --out <file> --item <slug> [--tree <path>] [--role R] [--revision R] [--over-cap WHY] [--stall-secs N] [--retries N] [--poll N] -- <pi args...>\n';
const w = parseWatchdogArgv(process.argv);
if (w.error) {
  process.stderr.write(w.error === 'usage' ? USAGE : `pi-review: ${w.error}\n`);
  process.exit(1);
}

if (w.retriesExplicit) process.stderr.write(RETRIES_NOTICE('pi-review', w.retries));

// R-1106 — read and validate the review standard before admission: no reservation, no checkout,
// no pi child when it is missing, not a regular file, unreadable, or blank after trimming.
const reviewStandard = readReviewStandard();
if (reviewStandard.problem) {
  process.stderr.write(`pi-review: review standard refused: ${reviewStandard.problem}\n`);
  process.exit(1);
}
const reviewStandardText = reviewStandard.text;

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
const sourceRoot = realPath(sourceScope.root, { mustExist: true });
let sourceOutWarning = null;
const sourceRedirect = inTreeRedirect(sourceRoot);
let tempRoot = null, tempRootReal = null, admittedId = null, setupSignal = null;
let movementFolder = null;
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
    try { canonicalPath = realPath(path); } catch { canonicalPath = resolve(path); }
    const tempRelative = relative(realPath(tmpdir()), canonicalPath);
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
  const tempTarget = tempRootReal ?? (() => { try { return realPath(tempRoot); } catch { return resolve(tempRoot); } })();
  const remaining = registrations.stdout.split(/\r?\n/).some((l) => {
    if (!l.startsWith('worktree ')) return false;
    let p; try { p = realPath(l.slice(9)); } catch { p = resolve(l.slice(9)); }
    return p === tempTarget;
  });
  if (remaining) throw new Error(`worktree registration remains: ${tempRoot}`);
};
const copySnapshot = (root, target, excludedPath = null) => {
  const files = [...new Set([...list(root, ['ls-tree', '-r', '-z', '--name-only', 'HEAD']), ...list(root, ['ls-files', '-z']), ...list(root, ['ls-files', '--others', '--exclude-standard', '-z'])])];
  const excludedKey = excludedPath ? gitPathKey(resolve(excludedPath)) : null;
  // MUST 1 (brief 3): git's untracked listing carries the disk case here, so the path-key skip
  // above handles the case-diverged folder without relying on a potentially lossy file identity.
  for (const p of files) {
    const from = join(root, p), to = join(target, p);
    if (excludedKey && gitPathKey(resolve(from)) === excludedKey) continue;
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
  tempRootReal = realPath(tempRoot, { mustExist: true });
  if (setupSignal) throw new Error(`aborted by ${setupSignal} while preparing the immutable checkout`);
  const outReal = realOut(outPath);
  const outputRelative = relative(sourceRoot, outReal);
  const checkoutOutPath = outputRelative === '..' || outputRelative.startsWith(`..${sep}`) ? outReal : resolve(tempRoot, outputRelative);
  copySnapshot(sourceRoot, tempRoot, outputRelative === '..' || outputRelative.startsWith(`..${sep}`) ? null : outReal);
  const checkoutScope = treeScope(tempRoot, { exclude: [checkoutOutPath] });
  const checkoutRevision = resolveRevision(sourceScope.head, checkoutScope, checkoutScope.root);
  if (checkoutRevision !== sourceRevision) throw new Error(`dirty snapshot could not be reproduced exactly (source ${sourceRevision}, checkout ${checkoutRevision}); review refused without consuming a round`);

  const movement = reviewMovementSection(tempRoot);
  let movementPrompt = null;
  if (movement !== null) {
    try {
      movementFolder = mkdtempSync(join(tmpdir(), MOVEMENT_FOLDER_PREFIX));
      movementPrompt = join(movementFolder, MOVEMENT_FILE_NAME);
      writeFileSync(movementPrompt, movement);
    } catch (error) {
      movementPrompt = `${MOVEMENT_HEADING}\n\n${MOVEMENT_LEAD}\n\n${MOVEMENT_NOT_COMPUTED} section file: ${error.code ?? 'unknown'}`;
    }
  }

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
  const adm = admit(childArgs, { launcher: 'pi-review', cwd: process.cwd(), provider: piOption(w.piArgs, '--provider'), model: piOption(w.piArgs, '--model', '-m'), attempts: w.retries + 1 });
  if (!adm.ok) throw new Error(adm.message);
  admittedId = adm.id;
  process.stderr.write(`pi-review: ${adm.note}\n`);
  if (adm.warning) process.stderr.write(`pi-review: WARNING: ${adm.warning}\n`);

  const suppliedParts = [];
  let reviewBrief = '';
  for (let i=0;i<w.piArgs.length;i++) {
    if (w.piArgs[i] !== '--append-system-prompt' && !w.piArgs[i].startsWith('--append-system-prompt=')) continue;
    const value = piOption(w.piArgs.slice(i), '--append-system-prompt');
    let text = value, file = null;
    try { const candidate = resolve(sourceRoot, value); if (statSync(candidate).isFile()) { text = readFileSync(candidate,'utf8'); file = candidate; } } catch {}
    const isBrief = file !== null && !reviewBrief && readBrief(text).feature;
    if (isBrief) reviewBrief = text;
    suppliedParts.push(contextPart(isBrief ? 'brief' : 'append', file ?? 'argv', text));
    if (w.piArgs[i] === '--append-system-prompt') i++;
  }
  const knownBugs = reviewKnownBugSection(tempRoot, movement, reviewBrief);
  let knownBugPrompt = null;
  if (knownBugs.text !== null) {
    movementFolder ??= mkdtempSync(join(tmpdir(), MOVEMENT_FOLDER_PREFIX));
    knownBugPrompt = join(movementFolder, 'known-bugs.md');
    writeFileSync(knownBugPrompt, knownBugs.text);
  }
  const parts = [...suppliedParts, ...knownBugs.parts, contextPart('standard', reviewStandard.path, reviewStandardText)];
  if (movement !== null) parts.push(contextPart('movement', sourceRoot, movement));
  const onSpawn = () => appendContextLoad({ launcher: 'pi-review', role: 'reviewer', runtime: 'pi', model: piOption(w.piArgs,'--model','-m'), cwd: sourceRoot, item: optionValue('--item'), parts });
  const stopHeartbeat = startHeartbeat(adm.res); // a live, renewing review never loses its reservation
  let r;
  try {
    r = await runWatchdog('pi-review', { ...w, cwd: tempRoot, piArgs: [...w.piArgs, '--append-system-prompt', `Your cwd is an immutable checkout of revision ${sourceRevision} at ${tempRoot}; read files there, not in other worktrees`, '--append-system-prompt', reviewStandardText, ...(movementPrompt === null ? [] : ['--append-system-prompt', movementPrompt]), ...(knownBugPrompt === null ? [] : ['--append-system-prompt', knownBugPrompt])], onSpawn, childEnv: { ...REVIEWER_CHILD_ENV, NANA_REVIEW_ROOT: tempRoot }, accept: reviewShaped });
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
    const c = complete(adm.res, w.outPath, { attempts: r.attempt, text: r.text }); // complete derives in the immutable checkout
    if (!c.ok) throw new Error(`review written to ${w.outPath}, but ${c.message}`);
    if (c.unread) throw new Error(c.unread);
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
  if (movementFolder) {
    try { rmSync(movementFolder, { recursive: true, force: true }); }
    catch (e) { process.stderr.write(`pi-review: WARNING: movement cleanup failed: ${e.code ?? e.message}\n`); }
  }
  try { removeWorktree(); } catch (e) { process.stderr.write(`pi-review: WARNING: worktree cleanup failed: ${e.message}\n`); process.exitCode = 1; }
  for (const [signal, handler] of setupSignalHandlers) process.removeListener(signal, handler);
}
