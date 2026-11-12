#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/pi-review.mjs
 * @purpose Run and record a pi review from an immutable checkout under the liveness watchdog.
 * @inputs argv (--out, --item, --tree, --role, --revision, --stall-secs, --retries, --poll, then `--`
 *  and the pi args), the user-scope review ledger, the reviewed tree's git revision, and
 *  prompts/review-standard.md and the brief feature's known bugs
 * @outputs the review text written to --out and the kept-text store, a round recorded in the ledger,
 *  an external temporary known-bug prompt file, and admission, warning and SUCCESS, FAILED or unread-verdict lines
 * @effects disk (output, checkout, known-bug prompt and review store), process (git, watchdog child and heartbeat)
 * @errors exit 1 when admission is refused (a git failure, a bad --out, bad args, a missing,
 *  non-regular or blank review standard), when every attempt stalled or failed, when the round could not
 *  be recorded, or when its recorded verdict is empty; exit 0 otherwise
 */
import { mkdtempSync, readFileSync, statSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { admit, complete, release, startHeartbeat, treeScope, reviewRoot, resolveRevision, inTreeRedirect, outInTree } from './review-round.mjs';
import { realPath } from '../lib/real-path.mjs';
import { reviewShaped } from './review-shape.mjs';
import { parseWatchdogArgv, runWatchdog } from './pi-watchdog.mjs';
import { REVIEWER_CHILD_ENV, piChildSkillArgs } from './worker-config.mjs';
import { credentialStripEnv } from '../lib/credential-strip.mjs';
import { readReviewStandard } from '../lib/review-standard.mjs';
import { readBrief } from '../lib/brief-precedent.mjs';
import { reviewKnownBugSection } from '../lib/known-bug-digest.mjs';

function piOption(args, ...names) {
  for (const name of names) {
    for (let i=0;i<args.length;i++) {
      if (args[i].startsWith(`${name}=`)) return args[i].slice(name.length + 1);
      if (args[i] === name) return args[i + 1];
    }
  }
  return null;
}

const USAGE = 'usage: pi-review.mjs --out <file> --item <slug> [--tree <path>] [--role R] [--revision R] [--stall-secs N] [--retries N] [--poll N] -- <pi args...>\n';
const w = parseWatchdogArgv(process.argv);
if (w.error) {
  process.stderr.write(w.error === 'usage' ? USAGE : `pi-review: ${w.error}\n`);
  process.exit(1);
}

// R-1106 — read and validate the review standard before admission: no reservation, no checkout,
// no pi child when it is missing, not a regular file, unreadable, or blank after trimming.
const reviewStandard = readReviewStandard();
if (reviewStandard.problem) {
  process.stderr.write(`pi-review: review standard refused: ${reviewStandard.problem}\n`);
  process.exit(1);
}
const reviewStandardText = reviewStandard.text;

// Only wrapper argv BEFORE `--` supplies the review identity.
const optionValue = (name, fallback = null) => {
  const i = w.ownArgs.indexOf(name);
  return i >= 0 ? w.ownArgs[i + 1] : fallback;
};
if (optionValue('--role') === 'land') {
  process.stderr.write('pi-review: --role land is retired; every lane has one reviewer plus CI.\n');
  process.exit(1);
}
const sourceTree = resolve(process.cwd(), optionValue('--tree', '.'));
const outPath = resolve(process.cwd(), w.outPath);
let sourceScope, sourceRevision, sourceRoot;
let sourceOutWarning = null;
let tempRoot = null, tempRootReal = null, admittedId = null, setupSignal = null;
let knownBugFolder = null;
const setupSignalHandlers = new Map(['SIGINT', 'SIGTERM', 'SIGHUP'].map((signal) => [signal, () => { setupSignal = signal; }]));
for (const [signal, handler] of setupSignalHandlers) process.on(signal, handler);
const git = (cwd, args) => {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (r.status !== 0) throw new Error((r.stderr || `git ${args[0]} failed`).trim());
  return r.stdout;
};
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
try {
  sourceRoot = reviewRoot(sourceTree);
  sourceOutWarning = outInTree(sourceRoot, outPath);
  const sourceRedirect = inTreeRedirect(sourceRoot);
  if (sourceRedirect) throw new Error(`redirect the review log outside the reviewed tree (${sourceRedirect})`);
  reclaimDeadReviewWorktrees();
  sourceScope = treeScope(sourceTree);
  sourceRevision = resolveRevision(optionValue('--revision'), sourceScope, sourceScope.root);
  if (sourceOutWarning) process.stderr.write(`pi-review: WARNING: ${sourceOutWarning}\n`);
  // Initialized submodules are not populated by the detached checkout.
  const gitlinks = git(sourceRoot, ['ls-files', '--stage', '-z']).split('\0').filter((x) => x.startsWith('160000 ')).map((x) => x.slice(x.indexOf('\t') + 1));
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

  let reviewBrief = '';
  for (let i=0;i<w.piArgs.length;i++) {
    if (w.piArgs[i] !== '--append-system-prompt' && !w.piArgs[i].startsWith('--append-system-prompt=')) continue;
    const value = piOption(w.piArgs.slice(i), '--append-system-prompt');
    let text = value, file = null;
    try { const candidate = resolve(sourceRoot, value); if (statSync(candidate).isFile()) { text = readFileSync(candidate,'utf8'); file = candidate; } } catch {}
    const isBrief = file !== null && !reviewBrief && readBrief(text).feature;
    if (isBrief) reviewBrief = text;
    if (w.piArgs[i] === '--append-system-prompt') i++;
  }
  const knownBugs = reviewKnownBugSection(tempRoot, null, reviewBrief);
  let knownBugPrompt = null;
  if (knownBugs.text !== null) {
    knownBugFolder = mkdtempSync(join(tmpdir(), 'nana-review-known-bugs-'));
    knownBugPrompt = join(knownBugFolder, 'known-bugs.md');
    writeFileSync(knownBugPrompt, knownBugs.text);
  }
  const childEnv = { ...process.env, ...REVIEWER_CHILD_ENV, NANA_REVIEW_ROOT: tempRoot, ...credentialStripEnv(process.env) };
  // childCwd below is canonical checkout identity, not the loader's path spelling.
  // The session record counts the actual runtime composition, even under an alternate path spelling.
  const contextLoad = { launcher: 'pi-review', role: 'reviewer', slot: 'reviewer', runtime: 'pi', model: piOption(w.piArgs,'--model','-m'), cwd: sourceRoot, childCwd: tempRootReal, item: optionValue('--item') };
  const stopHeartbeat = startHeartbeat(adm.res); // a live, renewing review never loses its reservation
  let r;
  try {
    r = await runWatchdog('pi-review', { ...w, cwd: tempRoot, piArgs: [...piChildSkillArgs(), ...w.piArgs, '--append-system-prompt', `Your cwd is an immutable checkout of revision ${sourceRevision} at ${tempRoot}; read files there, not in other worktrees`, '--append-system-prompt', reviewStandardText, ...(knownBugPrompt === null ? [] : ['--append-system-prompt', knownBugPrompt])], contextLoad, childEnv, accept: reviewShaped });
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
  if (knownBugFolder) {
    try { rmSync(knownBugFolder, { recursive: true, force: true }); }
    catch (e) { process.stderr.write(`pi-review: WARNING: known-bug cleanup failed: ${e.code ?? e.message}\n`); }
  }
  try { removeWorktree(); } catch (e) { process.stderr.write(`pi-review: WARNING: worktree cleanup failed: ${e.message}\n`); process.exitCode = 1; }
  for (const [signal, handler] of setupSignalHandlers) process.removeListener(signal, handler);
}
