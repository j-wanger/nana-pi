/**
 * @module packages/nana-pack/bin/review-round.mjs
 * @purpose The review round ledger — admit, project, complete and release one per-item review round under a
 *  user-scope lock.
 * @inputs a launcher's own argv (--item, --tree, --revision, --role, --out, --over-cap), the reviewed tree's git
 *  state (common dir, HEAD, tracked and non-ignored untracked content, git config and attributes), stdout/stderr
 *  file identities, captured review text, complete()'s optional rename seam, env NANA_REVIEW_RES_STALE_MS, and ledger files under ~/.pi/agent
 * @outputs an admission or refusal with its note and warning, a reservation file, a round appended to the
 *  tally, a hash-addressed kept text, audit lines (rotated past LEDGER_MAX_BYTES), a heartbeat stopper, the
 *  projected round number, and completion results carrying the recorded verdict plus an unread-verdict note
 * @effects disk (an O_EXCL lock around every read-decide-write, reservation files, the kept-text store, the never-rotated tally
 *  and the rotated audit log; a scratch index and object folder under the OS temp folder while deriving the
 *  working state, removed after each derivation), process (spawns git through spawnSync, runs a renewing
 *  heartbeat interval)
 * @errors canonicalItem throws on a slug that is empty, over SLUG_MAX, holds a separator, `..` or a control
 *  character; admit / project / complete return {ok:false, message} for a missing --item, a tree outside git, an in-tree output redirect, an over-cap
 *  revision, a git failure, a tracked --out, a malformed tally line, a non-regular ledger or lock path, or
 *  a lost reservation
 */
// review-round.mjs — the review ROUND CAP (OBJECTIVE.md rule, 2026-09-16): three review rounds
// per item, then land with residuals, subtract, or instrument/implement before any further round.
//
// T2b (2026-09-28, fix round after sol r1): the cap binds to the ITEM, counted in a user-scope
// ledger that every review launcher (pi-review, review-ledger run) consults through admit().
//
//   ~/.pi/agent/review-ledger.rounds.jsonl   THE TALLY — permanent, never rotated. One line per round
//                                            earned: {v,kind:"round",ts,repo,item,revision,role,…}.
//                                            The cap reads ONLY this (plus live reservations).
//   ~/.pi/agent/review-ledger.jsonl (+ .1)   the verbose AUDIT log (every verdict and override);
//                                            rotated past 1 MiB before EVERY append; never consulted by the cap.
//   ~/.pi/agent/review-ledger.reservations/  one <id>.json per in-flight review holding its round
//   ~/.pi/agent/review-ledger.texts/         captured UTF-8 review text, named by its full sha256
//   ~/.pi/agent/review-ledger.lock           O_EXCL lock around every read-decide-write
//
// Rules:
//  - ITEM = {repo, slug}. The slug is canonicalized (canonicalItem); repo = realpath of the git
//    COMMON dir of --tree (default: launcher cwd), so every worktree of one repository shares an item.
//    A non-git reviewed tree is refused; legacy path: ledger records remain readable.
//  - A ROUND is a distinct REVISION reviewed for the item. Revision = the reviewed tree's git HEAD
//    (full sha) when the working tree's CONTENT equals HEAD's; otherwise
//    "<sha>+snap:<full sha256 of the working-state snapshot>" (T2b fix r3, sol r2 #11 — see
//    workingSnapshot: raw file content + mode + path of every tracked and non-ignored untracked
//    file, independent of the index and of diff rendering). --revision is only the fallback when
//    HEAD cannot be resolved (and inside git it must name that commit). Any number of reviews —
//    any roles — on one revision are ONE round. --role is audit metadata only.
//  - --out on a TRACKED path of the reviewed tree is refused; elsewhere in the tree (not ignored) it
//    warns (sol r3 ruling; see outInTree).
//  - every git failure REFUSES admission with the git error (sol r2 #10) — never "clean".
//  - a completed verdict earns the round; a stall / failure returns the reservation. Exception:
//    a completion whose tree changed mid-review consumes the round as unverified (below).
//  - complete() must own a live reservation: an expired, pruned or replaced one records nothing.
//    A reservation lives while its owner is alive AND renews it (heartbeat, sol r2 #15).
//  - complete() re-derives the revision under the lock; if the tree changed during the review, the round is still
//    CONSUMED for the admitted revision, but the verdict is recorded as unverified and refused
//    (sol r2 #12; see complete()).
//  - a malformed tally line, a non-regular ledger path, or a lock path that is not a regular file
//    REFUSES admission with a diagnostic — never a silent skip, never a stack.
// This is a self-governance device against the fix-review treadmill, not a security control
// (see README "Trust model").

import {
  openSync, closeSync, writeSync, writeFileSync, readFileSync, fstatSync, fchmodSync, lstatSync, mkdirSync, mkdtempSync,
  readdirSync, unlinkSync, renameSync, rmSync, realpathSync, readlinkSync, existsSync, futimesSync, constants as C,
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve, basename, dirname, relative, isAbsolute, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { randomBytes, createHash } from 'node:crypto';
import { UNREAD_VERDICT_CONDITIONS, VERDICT_LOOKALIKE_FOLD } from '../lib/verdict-config.mjs';
import { realPath, gitPathKey, fileIdentity } from '../lib/real-path.mjs';
import { renameWithRetry } from '../lib/rename-retry.mjs';
export { reviewShaped } from './review-shape.mjs';

export const REVIEW_ROUND_CAP = 3;
export const LEDGER_MAX_BYTES = 1024 * 1024; // audit log rotation threshold (the tally never rotates)
export const SLUG_MAX = 128; // characters, after canonicalization
const REVISION_MAX = 128;
// chosen 2026-10-22: beside the tally, so the text and record share one lock and trust model (R-2568).
export const REVIEW_TEXT_STORE_NAME = 'review-ledger.texts';
// chosen 2026-10-22: reviews are Markdown and remain directly readable (R-2568).
export const REVIEW_TEXT_EXTENSION = '.md';
// contract (R-2568): the captured UTF-8 bytes use the snapshot hash family and its full digest.
export const REVIEW_TEXT_HASH = 'sha256';
export const REVIEW_TEXT_HASH_HEX_CHARS = 64;
// chosen 2026-10-22: eight digest characters keep committed review names readable and distinct per item (R-2573).
export const KEEP_NAME_HASH_CHARS = 8;
// chosen, measured 2026-10-22: no size cap; observed p95 8.5 KB and maximum 17.8 KB.
// chosen: names the throwaway scratch index+object folder workingState borrows the repo's objects into
// (W7c amend, 2026-10-18), so a leftover from a crashed derivation is recognizable in the OS temp dir.
export const SNAPSHOT_SCRATCH_PREFIX = 'nana-snapshot-';
const LOCK_WAIT_MS = 15_000;
const LOCK_ORPHAN_MS = 5_000; // a lock file with no readable pid, older than this, is a crashed create
// A reservation is stale when its owner stops renewing it for this long (heartbeat every 1/5 of it).
// There is NO absolute lifetime: a live owner that keeps renewing never expires (sol r2 #15).
const RES_STALE_DEFAULT_MS = 10 * 60_000;
export function reservationStaleMs() {
  const v = Number(process.env.NANA_REVIEW_RES_STALE_MS);
  return Number.isFinite(v) && v >= 500 ? v : RES_STALE_DEFAULT_MS;
}
const CLOCK_SKEW_MS = 60_000; // a reservation dated further in the future than this is stale

export function ledgerPaths(home = homedir()) {
  // Deliberately ~/.pi/agent, NOT pi's active agent dir: the round cap is user-scope self-governance, and keying it to PI_CODING_AGENT_DIR would let one shell variable reset the tally.
  const dir = join(home, '.pi', 'agent');
  return {
    dir,
    tally: join(dir, 'review-ledger.rounds.jsonl'),
    audit: join(dir, 'review-ledger.jsonl'),
    rotated: join(dir, 'review-ledger.jsonl.1'),
    lock: join(dir, 'review-ledger.lock'),
    resDir: join(dir, 'review-ledger.reservations'),
    texts: join(dir, REVIEW_TEXT_STORE_NAME),
  };
}

/** Canonical item slug: NFKC, trim, lowercase (String#toLowerCase — not Unicode case folding), internal whitespace → one space. Throws on a path
 *  separator, "..", a control character, empty, or more than SLUG_MAX characters. Pure. */
export function canonicalItem(raw) {
  const s = String(raw ?? '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!s) throw new Error('--item is blank');
  if (/[/\\]/.test(s) || s.includes('..')) throw new Error(`--item ${JSON.stringify(s)}: no path separators or ".." in an item slug`);
  if (/[\p{Cc}]/u.test(s)) throw new Error('--item contains a control character');
  if ([...s].length > SLUG_MAX) throw new Error(`--item is ${[...s].length} characters; the bound is ${SLUG_MAX}`);
  return s;
}

/** Rounds consumed by a list of {revision} entries: the number of DISTINCT revisions (pure). */
export function roundsUsed(entries) {
  return new Set(entries.map((e) => e.revision)).size;
}

/** 'allow' | 'refuse' | 'override' for a projected round (pure). A blank reason is no reason. */
export function roundCapVerdict(projected, overCap) {
  if (projected === null || projected === undefined || projected <= REVIEW_ROUND_CAP) return 'allow';
  return overCap && String(overCap).trim() ? 'override' : 'refuse';
}

/** @deprecated T2b: the cap no longer reads file names (a basename parse was bypassed). Kept, pure
 *  and unchanged, only so ~/nana-agent-loop's review-round.mjs forwarder still links. Nothing in
 *  the cap consumes it. */
export function roundFromOutPath(p) {
  const m = /(?:^|[^a-z0-9])(?:r|round[-_ ]?)(\d{1,2})(?![a-z0-9])/i.exec(basename(p));
  return m ? Number(m[1]) : null;
}

/** Value of a wrapper option: undefined when absent; throws when present but blank or another flag. */
export function optValue(args, name) {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  const v = args[i + 1];
  if (v === undefined || v.trim() === '' || v.startsWith('-')) {
    throw new Error(`${name} needs a value, got ${v === undefined ? 'nothing' : JSON.stringify(v)} (a flag or blank is not a value)`);
  }
  return v.trim();
}

/** Run git; THROWS with git's own error on any failure (sol r2 #10: never read a failure as "clean").
 *  Pinned config so nothing a user sets changes what is enumerated. `env` (W7c amend, 2026-10-18)
 *  overlays process.env — workingState's scratch derivation points GIT_INDEX_FILE and
 *  GIT_OBJECT_DIRECTORY at a throwaway folder so the real index and object store are never written. */
function gitOut(cwd, args, { okStatus = [0], env } = {}) {
  const r = spawnSync('git', ['-c', 'core.fsmonitor=false', '-c', 'core.untrackedCache=false', ...args],
    { cwd, encoding: 'utf8', maxBuffer: 1 << 30, env: env ? { ...process.env, ...env } : process.env });
  if (r.error) throw new Error(`git ${args[0]} could not run in ${cwd}: ${r.error.message} — admission refused`);
  if (!okStatus.includes(r.status)) {
    throw new Error(`git ${args.join(' ')} failed in ${cwd} (exit ${r.status ?? r.signal}): ` +
      `${(r.stderr || '').trim().split('\n').slice(0, 3).join(' | ') || 'no message'} — admission refused`);
  }
  return r;
}

/** `git:` + the canonical common-dir path shared by every worktree of one repository (W7c). Tries
 *  the absolute form first — correct across a symlinked or firmlinked tree spelling, and across a
 *  main checkout, where the plain flag gives only a relative `.git` (SHOULD 1); falls back to the
 *  relative form (older git) resolved against `tree` (prior art: nana-setup/lib/steps.mjs:841). This
 *  is the ONE repo-key builder: the ledger key here, nana-land's key and common-dir check, and
 *  review-ledger report `--repo` all call it, so they cannot drift apart (R2/N1/N2/L1). */
export function repoKeyOf(tree) {
  for (const args of [['--path-format=absolute', '--git-common-dir'], ['--git-common-dir']]) {
    const r = spawnSync('git', ['-c', 'core.fsmonitor=false', '-c', 'core.untrackedCache=false', 'rev-parse', ...args], { cwd: tree, encoding: 'utf8' });
    const out = r.stdout.trim();
    // SHOULD 1 (brief 2): a git too old to know --path-format does not FAIL the rev-parse — it
    // echoes the unrecognized flag back as an extra output line instead, which would otherwise be
    // read as part of the common-dir path. Treat that echo as a failure of THIS form and fall back.
    if (r.status === 0 && out && !out.startsWith('--path-format')) return `git:${realPath(resolve(tree, out), { mustExist: true })}`;
  }
  throw new Error(`git rev-parse --git-common-dir failed in ${tree} — admission refused`);
}

/** Repository identity + the reviewed tree's revision parts. repo = repoKeyOf(tree) (shared by all
 *  worktrees of one repository). Non-Git admission throws; legacy `path:` keys are readable only in
 *  existing tallies. `exclude` = absolute paths left out of the snapshot. */
export function treeScope(cwd = process.cwd(), { exclude = [] } = {}) {
  const tree = resolve(cwd);
  const r = gitOut(tree, ['rev-parse', '--show-toplevel'], { okStatus: [0, 128] });
  if (r.status !== 0) {
    if (/not a git repository/i.test(r.stderr)) throw new Error('run from the reviewed tree or pass --tree <path inside it>');
    throw new Error(`git rev-parse failed in ${tree}: ${r.stderr.trim().split('\n')[0]} — admission refused`);
  }
  const top = r.stdout.trim();
  const root = realPath(top, { mustExist: true });
  const { head, snapshot } = workingState(root, exclude);
  return { repo: repoKeyOf(tree), inGit: true, root, head, snapshot };
}

function headOf(root) {
  const r = gitOut(root, ['rev-parse', '--verify', '--quiet', 'HEAD^{commit}'], { okStatus: [0, 1] });
  if (r.status === 0) return r.stdout.trim();
  if (r.stderr.trim()) throw new Error(`git rev-parse HEAD failed in ${root}: ${r.stderr.trim()} — admission refused`);
  return null; // unborn branch: no HEAD
}

const nulList = (t) => t.split('\0').filter(Boolean);
const byteOrder = (a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b));
const sha256 = (...parts) => { const h = createHash('sha256'); for (const x of parts) h.update(x); return h.digest('hex'); };

/** Write `objectsDir` as the scratch object folder's one alternate (W7c amend, 2026-10-18): the derivation
 *  borrows the repo's objects by FILE, never by the delimiter-joined GIT_ALTERNATE_OBJECT_DIRECTORIES env
 *  var, which breaks on a path holding the platform delimiter (plan-attack.md). One absolute path per line;
 *  forward slashes on Windows (git's own alternates parser wants them); a path holding a newline cannot be
 *  the sole line separator, so it refuses rather than risk a misread. */
function writeAlternates(file, objectsDir) {
  if (objectsDir.includes('\n')) {
    throw new Error(`the repository's object directory ${JSON.stringify(objectsDir)} holds a newline — the scratch alternates file cannot encode it; admission refused`);
  }
  writeFileSync(file, `${process.platform === 'win32' ? objectsDir.split('\\').join('/') : objectsDir}\n`);
}

/** {head, snapshot}: snapshot = null when the working tree equals HEAD's tree and no nested repository is
 *  dirty or new, else the FULL sha256 of "tree <id>\0" plus every nested record below, sorted in byte order.
 *  The tree is what `git add -A` would record over HEAD (W7c amend, 2026-10-18 — plan-design.md, amended by
 *  plan-attack.md): git applies its own core.fileMode, core.autocrlf, core.symlinks, .gitattributes, clean
 *  filters and ignores, so a checkout git itself calls clean reads clean here too.
 *  Built with:
 *    - a THROWAWAY index seeded by `read-tree HEAD` (never a copy of the real index, R-710/R-1374 stay live);
 *    - a THROWAWAY object folder that borrows the repo's objects through its `info/alternates` file (never
 *      the real index or object store is written);
 *    - the REAL index read first (the untracked-directory listing below), so a corrupt index still refuses
 *      admission (R-712 stays live) before any scratch folder is created;
 *    - `--out` paths (named by `exclude`) restored to HEAD after the add: `git add -A` can itself
 *      re-case an ancestor directory to match an index entry already seeded from HEAD (a case-diverged
 *      folder, MUST 1 of brief 2), so the excluded path's own file identity (dev+ino, win-review-paths'
 *      case-diverged-folder fallback) finds the add's own git-listed spelling to reset, never a string compare;
 *    - an untracked, non-ignored DIRECTORY (a new, uninitialized nested repository) excluded from the add —
 *      an unborn one makes `git add -A` exit 128 — and folded in instead by a recursive call, always
 *      recorded as "new <head|unborn>[+snap:x]\t<path>" (a change, like R-835);
 *    - an initialized submodule (160000 in the post-add scratch index) folded in by the same recursion,
 *      recorded as "sub <head>+snap:<x>\t<path>" only when dirty — a clean one needs no record, since its
 *      gitlink already lands on its HEAD commit, same as the superproject's own tree.
 *  "Equals HEAD" compares the scratch tree's id against `git rev-parse <head>^{tree}`. */
export function workingState(root, exclude = []) {
  const head = headOf(root);
  if (!head) return { head: null, snapshot: null };
  // Reads the REAL index (git needs it to know what is "other"), so a corrupt index still refuses here,
  // before any scratch folder exists (R-712).
  const nested = nulList(gitOut(root, ['ls-files', '-z', '--others', '--exclude-standard']).stdout)
    .filter((p) => p.endsWith('/')).map((p) => p.slice(0, -1));
  const skip = new Set(exclude.map((x) => relUnder(root, realOut(x))).filter(Boolean).map(gitPathKey));
  // MUST 1 (brief 3): git's untracked listing carries the disk case here, so the path-key skip
  // above handles the nested-directory exclusion's case-diverged folder (never added, so never re-cased).
  const skipIds = exclude.map((x) => {
    const real = realOut(x), rel = relUnder(root, real);
    return rel ? { base: basename(rel), id: fileIdentity(real) } : null;
  }).filter((s) => s?.id);
  const scratch = mkdtempSync(join(tmpdir(), SNAPSHOT_SCRATCH_PREFIX));
  try {
    const scratchObjects = join(scratch, 'objects');
    mkdirSync(join(scratchObjects, 'info'), { recursive: true });
    const objectsDir = resolve(root, gitOut(root, ['rev-parse', '--git-path', 'objects']).stdout.trim());
    writeAlternates(join(scratchObjects, 'info', 'alternates'), objectsDir);
    const emptyHooks = join(scratch, 'hooks');
    mkdirSync(emptyHooks);
    const env = { GIT_INDEX_FILE: join(scratch, 'index'), GIT_OBJECT_DIRECTORY: scratchObjects };
    // R-1378 / F2 / F3 (build 2, 2026-10-19): pinned on every scratch command so a stat-less scratch
    // index never trips core.safecrlf against a clean, git-normalized checkout; a split-index repo
    // never leaves a sharedindex.* file in the REAL .git; and the repository's own hooks (notably
    // post-index-change, which fires on every index write) never run.
    const SCRATCH_CONFIG = ['-c', 'core.safecrlf=false', '-c', 'core.splitIndex=false', '-c', `core.hooksPath=${emptyHooks}`];
    const scratchGit = (args) => gitOut(root, [...SCRATCH_CONFIG, ...args], { env });
    scratchGit(['read-tree', head]);
    scratchGit(['add', '-A', '--', ':/', ...nested.map((p) => `:(top,literal,exclude)${p}`)]);
    if (skipIds.length) {
      // A literal pathspec is case-SENSITIVE even under core.ignorecase (probed), so a re-cased ancestor
      // directory needs the file's own identity, not its spelling, to find what the add actually staged.
      const bases = new Set(skipIds.map((s) => s.base));
      const candidates = nulList(scratchGit(['ls-files', '-z']).stdout).filter((p) => bases.has(basename(p)));
      const toReset = candidates.filter((p) => {
        const id = fileIdentity(join(root, p));
        return id && skipIds.some((s) => s.id.dev === id.dev && s.id.ino === id.ino);
      });
      if (toReset.length) scratchGit(['reset', '-q', head, '--', ...toReset.map((p) => `:(top,literal)${p}`)]);
    }
    const tree = scratchGit(['write-tree']).stdout.trim();
    const recs = [];
    for (const rec of nulList(scratchGit(['ls-files', '-z', '--stage']).stdout)) {
      const m = /^160000 [0-9a-f]+ \d\t([\s\S]+)$/.exec(rec);
      if (!m) continue;
      const p = m[1];
      if (!existsSync(join(root, p, '.git'))) continue; // uninitialized: its gitlink already matches HEAD
      const sub = workingState(realpathSync(join(root, p)));
      if (sub.snapshot) recs.push(`sub ${sub.head}+snap:${sub.snapshot}\t${p}\0`);
    }
    for (const p of nested) {
      if (skip.has(gitPathKey(p))) continue;
      const sub = workingState(realpathSync(join(root, p)));
      recs.push(`new ${sub.head ?? 'unborn'}${sub.snapshot ? `+snap:${sub.snapshot}` : ''}\t${p}\0`);
    }
    recs.sort(byteOrder);
    const headTree = gitOut(root, ['rev-parse', `${head}^{tree}`]).stdout.trim();
    const clean = !recs.length && tree === headTree;
    return { head, snapshot: clean ? null : sha256(`tree ${tree}\0`, ...recs) };
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}
/** `abs` relative to `root` as a git path ("a/b"), or null when it is `root` itself or outside it.
 *  Outside = the FIRST path SEGMENT is ".." (T2b r5: a string prefix test misread "..notes.md"). */
export function relUnder(root, abs) {
  const rel = relative(root, abs);
  if (!rel || isAbsolute(rel)) return null;
  const segs = rel.split(sep);
  return segs[0] === '..' ? null : segs.join('/');
}
/** Where a write to `p` actually lands: realpath of the FULL path, the leaf included (T2b r5: an
 *  --out that is itself a symlink resolves to its target). A not-yet-existing leaf resolves through
 *  its parent; a dangling symlink leaf is followed to where the write would create its target. */
export function realOut(p, hops = 0) {
  if (hops > 40) throw new Error(`--out ${p}: too many levels of symbolic links — refused`);
  // SHOULD 4 (brief 2): a missing leaf under a REGULAR FILE ancestor (not a directory) native-
  // realpaths as ENOTDIR, not ENOENT; catching only ENOENT here let that propagate uncaught past
  // this function's own ENOENT/ENOTDIR lstat fallback below, surfacing as a raw stack trace instead
  // of pi-review's clean one-line refusal.
  try { return realPath(p, { mustExist: true }); } catch (e) { if (e.code !== 'ENOENT' && e.code !== 'ENOTDIR') throw e; }
  let st = null;
  try { st = lstatSync(p); } catch (e) { if (e.code !== 'ENOENT' && e.code !== 'ENOTDIR') throw e; }
  if (st?.isSymbolicLink()) return realOut(resolve(dirname(p), readlinkSync(p)), hops + 1);
  const parent = dirname(p);
  if (parent === p) return p;
  return join(realOut(parent, hops), basename(p));
}
const withSnap = (sha, scope) => (scope.snapshot ? `${sha}+snap:${scope.snapshot}` : sha);

/** The revision a review is counted against. Throws with the reason when it cannot be derived. */
export function resolveRevision(explicit, scope, cwd = process.cwd()) {
  if (scope.inGit && explicit) {
    const q = gitOut(cwd, ['rev-parse', '--verify', '--quiet', `${explicit}^{commit}`], { okStatus: [0, 1] });
    const sha = q.status === 0 ? q.stdout.trim() : null;
    if (!sha) throw new Error(`--revision ${JSON.stringify(explicit)} is not a commit in ${cwd}`);
    if (scope.head && sha !== scope.head) {
      throw new Error(`--revision ${explicit} is ${sha.slice(0, 12)}, but the reviewed tree's HEAD is ${scope.head.slice(0, 12)}: ` +
        'the revision is derived from HEAD — run the review from a checkout of that commit');
    }
    return withSnap(sha, scope);
  }
  if (scope.head) return withSnap(scope.head, scope);
  if (!explicit) throw new Error(`no git HEAD at ${cwd}; pass --revision <id>`);
  const r = explicit.trim();
  if (!r || r.length > REVISION_MAX || /[\s\p{Cc}]/u.test(r)) throw new Error(`--revision ${JSON.stringify(r.slice(0, 40))}: 1-${REVISION_MAX} characters, no whitespace`);
  return /^[0-9a-f]{7,64}$/i.test(r) ? r.toLowerCase() : r;
}

// ---- safe file access: regular files only, never through a symlink ----

function lstatOrNull(f) {
  try { return lstatSync(f); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}
function refuseNonRegular(f, st = lstatOrNull(f)) {
  if (st && !st.isFile()) throw new Error(`${f} is not a regular file (${st.isSymbolicLink() ? 'a symlink' : st.isDirectory() ? 'a directory' : 'special'}) — refused; remove it`);
}
function openChecked(f, flags, mode) {
  refuseNonRegular(f);
  let fd;
  try { fd = openSync(f, flags | C.O_NOFOLLOW, mode); } catch (e) {
    if (e.code === 'ELOOP' || e.code === 'EMLINK') throw new Error(`${f} is a symlink — refused; remove it`);
    throw e;
  }
  if (!fstatSync(fd).isFile()) { closeSync(fd); throw new Error(`${f} is not a regular file — refused`); }
  return fd;
}
function readChecked(f) {
  if (!lstatOrNull(f)) return '';
  const fd = openChecked(f, C.O_RDONLY);
  try { return readFileSync(fd, 'utf8'); } finally { closeSync(fd); }
}
function readBufferChecked(f) {
  if (!lstatOrNull(f)) return null;
  const fd = openChecked(f, C.O_RDONLY);
  try { return readFileSync(fd); } finally { closeSync(fd); }
}
function appendChecked(f, rec) {
  const fd = openChecked(f, C.O_WRONLY | C.O_APPEND | C.O_CREAT, 0o600);
  try { writeSync(fd, JSON.stringify({ v: 1, ts: new Date().toISOString(), ...rec }) + '\n'); } finally { closeSync(fd); }
}
function ensureDir(d) {
  mkdirSync(d, { recursive: true });
  const st = lstatSync(d);
  if (!st.isDirectory()) throw new Error(`${d} is not a directory — refused`);
}

function reviewTextRef(text) {
  const bytes = Buffer.from(String(text ?? ''), 'utf8');
  const sha256 = createHash(REVIEW_TEXT_HASH).update(bytes).digest('hex');
  return { bytes, record: { sha256, bytes: bytes.length } };
}

/** A valid kept-text path, or null for a malformed tally reference. */
export function reviewTextPath(home = homedir(), ref) {
  const hash = ref?.sha256;
  return typeof hash === 'string' && new RegExp(`^[0-9a-f]{${REVIEW_TEXT_HASH_HEX_CHARS}}$`).test(hash)
    ? join(ledgerPaths(home).texts, `${hash}${REVIEW_TEXT_EXTENSION}`) : null;
}

/** Classify one kept-text reference and its bytes for review consumers. */
export function reviewTextEvidence(home = homedir(), ref) {
  const file = reviewTextPath(home, ref);
  if (!ref || typeof ref !== 'object' || !file || !Number.isSafeInteger(ref.bytes) || ref.bytes < 0) {
    return { status: 'malformed', file };
  }
  try {
    const kept = readReviewText(home, ref);
    if (!kept) return { status: existsSync(file) ? 'altered' : 'missing', file };
    if (kept.bytes.length !== ref.bytes) return { status: 'altered', file };
    return { status: 'intact', ...kept };
  } catch {
    return { status: 'missing', file };
  }
}

/** Read and hash-check one kept review text without following a symlink. Null means absent or corrupt. */
export function readReviewText(home = homedir(), ref) {
  const p = ledgerPaths(home);
  const store = lstatOrNull(p.texts);
  if (!store) return null;
  if (!store.isDirectory()) throw new Error(`${p.texts} is not a directory — refused`);
  const file = reviewTextPath(home, ref);
  if (!file) return null;
  const bytes = readBufferChecked(file);
  if (!bytes || createHash(REVIEW_TEXT_HASH).update(bytes).digest('hex') !== ref.sha256) return null;
  return { file, bytes, text: bytes.toString('utf8') };
}

/** Write captured review bytes content-addressed in the store. Call under the ledger lock. */
function writeReviewText(p, text, rename) {
  const kept = reviewTextRef(text);
  ensureDir(p.texts);
  const target = join(p.texts, `${kept.record.sha256}${REVIEW_TEXT_EXTENSION}`);
  const existing = readBufferChecked(target);
  if (existing?.equals(kept.bytes)) {
    const fd = openChecked(target, C.O_RDWR);
    try { fchmodSync(fd, 0o600); } finally { closeSync(fd); }
    return kept.record;
  }
  const temp = join(p.texts, `.${kept.record.sha256}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`);
  let fd;
  try {
    fd = openChecked(temp, C.O_WRONLY | C.O_CREAT | C.O_EXCL, 0o600);
    writeFileSync(fd, kept.bytes);
    fchmodSync(fd, 0o600);
    closeSync(fd); fd = undefined;
    if (existing) {
      refuseNonRegular(target);
      unlinkSync(target);
    }
    renameWithRetry(temp, target, { rename });
    const targetFd = openChecked(target, C.O_RDWR);
    try { fchmodSync(targetFd, 0o600); } finally { closeSync(targetFd); }
    return kept.record;
  } finally {
    if (fd !== undefined) closeSync(fd);
    try { unlinkSync(temp); } catch {}
  }
}

const sleepMs = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
function alive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}

/** Run fn under the ledger lock. A lock is taken over only when its holder pid is dead (or it has
 *  no readable pid and is older than LOCK_ORPHAN_MS) — never from a live holder. */
function withLock(p, fn) {
  ensureDir(p.dir);
  const deadline = Date.now() + LOCK_WAIT_MS;
  let holder = '?';
  for (;;) {
    try {
      const fd = openSync(p.lock, C.O_WRONLY | C.O_CREAT | C.O_EXCL | C.O_NOFOLLOW, 0o600);
      writeSync(fd, String(process.pid));
      closeSync(fd);
      break;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      const st = lstatOrNull(p.lock);
      if (!st) continue;
      if (!st.isFile()) throw new Error(`lock path ${p.lock} is not a regular file (${st.isDirectory() ? 'a directory' : 'a symlink or special'}) — remove it`);
      let text = '';
      try { text = readFileSync(p.lock, 'utf8').trim(); } catch { continue; }
      const pid = /^\d+$/.test(text) ? Number(text) : NaN;
      holder = text || '?';
      const stale = Number.isInteger(pid) ? !alive(pid) : Date.now() - st.mtimeMs > LOCK_ORPHAN_MS;
      if (stale) {
        const again = lstatOrNull(p.lock);
        if (again && again.ino === st.ino) { try { unlinkSync(p.lock); } catch {} }
        continue;
      }
      if (Date.now() > deadline) throw new Error(`review ledger lock ${p.lock} held by live pid ${holder} for ${LOCK_WAIT_MS / 1000}s`);
      sleepMs(20);
    }
  }
  try { return fn(); } finally { try { unlinkSync(p.lock); } catch {} }
}

/** Every round in the tally, in order. A malformed line THROWS with its line number. */
function readTally(p) {
  const text = readChecked(p.tally);
  const lines = text.split('\n');
  if (lines.at(-1) === '') lines.pop();
  return lines.map((l, i) => {
    let r = null;
    try { r = JSON.parse(l); } catch {}
    const ok = r && typeof r === 'object' && (r.v === 1 || r.v === 2) && r.kind === 'round' &&
      [r.repo, r.item, r.revision].every((x) => typeof x === 'string' && x);
    if (!ok) {
      throw new Error(`${p.tally}:${i + 1}: malformed record ${JSON.stringify(l.slice(0, 80))} — admission refused. ` +
        'Repair the line or delete it (README "Trust model"); a corrupted record never grants a free review');
    }
    return r;
  });
}

/** Run a caller step while holding the ledger lock, with the complete tally and live reservations read there. */
export function withReviewLedgerLock(home, step) {
  const p = ledgerPaths(home);
  return withLock(p, () => step({ rounds: readTally(p), reservations: liveReservations(p, false) }));
}

/** Stale = owner dead, or not renewed within reservationStaleMs(), or dated in the future. */
function reservationStale(r, st) {
  const age = Date.now() - st.mtimeMs;
  return !r || !alive(r.pid) || age > reservationStaleMs() || age < -CLOCK_SKEW_MS;
}
function readReservation(f) {
  const st = lstatOrNull(f);
  if (!st || !st.isFile()) return { st, r: null };
  let r = null;
  try { r = JSON.parse(readFileSync(f, 'utf8')); } catch {}
  return { st, r };
}
/** Live reservations. prune=true deletes stale ones (crash recovery); false only filters them. */
function liveReservations(p, prune) {
  if (!lstatOrNull(p.resDir)) return [];
  const out = [];
  for (const name of readdirSync(p.resDir)) {
    const f = join(p.resDir, name);
    const { st, r } = readReservation(f);
    if (!st) continue;
    if (!st.isFile() || reservationStale(r, st)) { if (prune) { try { unlinkSync(f); } catch {} } continue; }
    out.push(r);
  }
  return out;
}

const shortRev = (r) => r.replace(/^([0-9a-f]{12})[0-9a-f]*/, '$1');

/** Read recorded rounds without changing ledger state; optional filters use the stored repo key and item. */
export function readRounds(home = homedir(), { repo, item } = {}) {
  const rows = readTally(ledgerPaths(home));
  return rows.filter((r) => (repo === undefined || r.repo === repo) && (item === undefined || r.item === item));
}

/** Read the selected final or plain first line; detection folds but acceptance stays raw. */
function readVerdict(text) {
  text = String(text ?? '');
  if (text.startsWith('\uFEFF')) text = text.slice(1);
  const lines = text.split(/\r?\n/);
  const nonblank = lines.map((line, index) => ({ number: index + 1, text: line })).filter((line) => line.text.trim() !== '');
  if (nonblank.length === 0) {
    return { verdict: null, selected: null, condition: UNREAD_VERDICT_CONDITIONS.EMPTY_OUTPUT, trigger: null };
  }
  const first = nonblank[0];
  const final = nonblank.at(-1);
  const fold = (line) => [...line].map((char) => VERDICT_LOOKALIKE_FOLD[char] ?? char).join('');
  const canon = (line) => fold(fold(line.replace(/\p{Default_Ignorable_Code_Point}/gu, ''))
    .normalize('NFKC').replace(/\p{Default_Ignorable_Code_Point}/gu, '')).toLowerCase();
  const carries = (line) => /(?<![a-z0-9_])verdict:/.test(canon(line));
  const marks = '[*_`]*';
  const score = `(?:\\s+${marks}(?:\\(\\d+/\\d+\\)|—\\s*\\d+/\\d+|\\d+/\\d+)${marks})?`;
  const finalGrammar = new RegExp(`^[\\s#>_*\\x60-]*VERDICT:${marks}\\s+${marks}([A-Z]+(?:-[A-Z]+)*)${marks}${score}[.,;:]?${marks}\\s*$`);
  const firstGrammar = /^VERDICT: ([A-Z]+(?:-[A-Z]+)*)(?: \(\d+\/\d+\)| — \d+\/\d+| \d+\/\d+)?\.?\s*$/;

  if (carries(final.text)) {
    const verdict = finalGrammar.exec(final.text)?.[1] ?? null;
    if (!verdict) {
      return { verdict: null, selected: final, condition: UNREAD_VERDICT_CONDITIONS.FINAL_LINE_GRAMMAR, trigger: null };
    }
    if (nonblank.length > 1 && carries(first.text)) {
      const firstWord = firstGrammar.exec(first.text)?.[1] ?? null;
      if (firstWord !== verdict) {
        return { verdict: null, selected: final, condition: UNREAD_VERDICT_CONDITIONS.FIRST_LINE_CONFLICT, trigger: first };
      }
    }
    return { verdict, selected: final, condition: null, trigger: null };
  }

  const verdict = firstGrammar.exec(first.text)?.[1] ?? null;
  if (!verdict) {
    return { verdict: null, selected: first, condition: UNREAD_VERDICT_CONDITIONS.FIRST_LINE_GRAMMAR, trigger: null };
  }
  const trigger = nonblank.slice(1).find((line) => canon(line.text).includes('verdict')) ?? null;
  if (trigger) {
    return { verdict: null, selected: first, condition: UNREAD_VERDICT_CONDITIONS.LATER_MENTION, trigger };
  }
  return { verdict, selected: first, condition: null, trigger: null };
}
const sameItem = (a, b) => a.repo === b.repo && a.item === b.item;

/** The cap decision for {repo, item, revision}. Call under the lock. Every ledger path is
 *  checked here, so a symlinked audit log is refused BEFORE a review is spent, not after. */
function decide(p, key, revision, overCap, prune) {
  for (const f of [p.audit, p.rotated]) refuseNonRegular(f);
  const textStore = lstatOrNull(p.texts);
  if (textStore && !textStore.isDirectory()) throw new Error(`${p.texts} is not a directory — refused`);
  if (lstatOrNull(p.resDir) && !lstatSync(p.resDir).isDirectory()) throw new Error(`${p.resDir} is not a directory — refused`);
  const rounds = readTally(p).filter((r) => sameItem(r, key));
  const reserved = liveReservations(p, prune).filter((r) => sameItem(r, key));
  const completedRevisions = [...new Set(rounds.map((r) => r.revision))];
  const revs = [...new Set([...rounds, ...reserved].map((r) => r.revision))];
  const used = revs.length;
  const where = `item "${key.item}" (${key.repo}): ${used} round(s) used (${completedRevisions.length} completed, ` +
    `${reserved.length} review(s) in flight)`;
  if (revs.includes(revision)) {
    return { verdict: 'allow', round: revs.indexOf(revision) + 1, used, where, again: true };
  }
  const round = used + 1;
  return { verdict: roundCapVerdict(round, overCap), round, used, where, again: false };
}

function parseReview(args, cwd) {
  if (args.includes('--worker')) {
    throw new Error('--worker was removed: a review cannot opt out of the cap. A worker launch uses pi-worker ' +
      '(same watchdog, records nothing, see README)');
  }
  const rawItem = optValue(args, '--item');
  const treeArg = optValue(args, '--tree');
  const tree = resolve(cwd, treeArg ?? '.');
  const revArg = optValue(args, '--revision');
  const role = optValue(args, '--role') ?? 'reviewer';
  const overCap = optValue(args, '--over-cap');
  const out = optValue(args, '--out');
  if (rawItem === undefined) return { missing: true };
  const item = canonicalItem(rawItem);
  const outAbs = out ? resolve(cwd, out) : null;
  const exclude = out ? [realOut(outAbs)] : []; // the review's own output (where the write LANDS) is not the reviewed work
  const revision = deriveRevision(revArg, tree, exclude);
  const warning = out ? outInTree(revision.root, outAbs) : null; // throws on a tracked --out, symlinked or not
  const redirect = inTreeRedirect(revision.root);
  if (redirect) throw new Error(`redirect the review log outside the reviewed tree (${redirect})`);
  return { key: { repo: revision.repo, item }, revision: revision.id, role, overCap, out, cwd: tree, revArg, exclude, warning };
}
function deriveRevision(revArg, tree, exclude) {
  const scope = treeScope(tree, { exclude });
  return { repo: scope.repo, root: scope.root, id: resolveRevision(revArg, scope, scope.root) };
}

/** Refuse stdout/stderr regular files that alias non-ignored paths in the reviewed tree. */
export function inTreeRedirect(root, fds = [1, 2]) {
  const identities = [];
  for (const fd of fds) {
    try {
      const st = fstatSync(fd);
      if (st.isFile() && Number.isFinite(st.dev) && Number.isFinite(st.ino)) identities.push({ dev: st.dev, ino: st.ino });
    } catch { /* a closed descriptor is a no-op */ }
  }
  if (!identities.length) return null;
  const listed = nulList(gitOut(root, ['ls-files', '-z', '--cached', '--others', '--exclude-standard']).stdout);
  for (const relPath of listed) {
    const full = join(root, relPath);
    let st;
    try { st = lstatSync(full); } catch { continue; }
    if (!st.isFile() || !Number.isFinite(st.dev) || !Number.isFinite(st.ino)) continue;
    if (identities.some((id) => id.dev === st.dev && id.ino === st.ino)) return relPath;
  }
  return null;
}

/** --out inside the reviewed tree (sol r3 ruling). The output is excluded from the snapshot, so:
 *   - a TRACKED path (in HEAD or the index) is REFUSED (throws): excluding it would mask the review
 *     overwriting a tracked file — a silent data-loss/mutation the revision could never show;
 *   - an ignored path returns null (the snapshot never reads it — the recommended in-tree place);
 *   - any other in-tree path returns a warning (a leftover output there changes the NEXT revision
 *     and so can spend a distinct-revision slot); outside the tree, or outside git → null. */
/** Whether `relGit` is tracked in the index or HEAD (MUST 1, brief 2): a literal pathspec compare
 *  first (cheap, covers the ordinary case); when it misses and the target exists on disk, a
 *  case-only folder rename can leave git's own index/HEAD spelling different from the disk
 *  spelling `relGit` carries (a branch switch on a case-insensitive volume: git treats the two as
 *  already equal and never touches the directory entry) — so fall back to the target's on-disk
 *  identity (dev+ino) against every tracked path, as `inTreeRedirect` already does for stdout/stderr. */
function trackedByPath(root, relGit, head) {
  const listed = (args) => gitOut(root, ['--literal-pathspecs', ...args, '--', relGit]).stdout.length > 0;
  return listed(['ls-files', '-z', '--cached']) || (head && listed(['ls-tree', '-r', '-z', '--name-only', '--full-tree', head]));
}
function trackedByIdentity(root, real, head) {
  const targetId = fileIdentity(real);
  if (!targetId) return false;
  const tracked = new Set(nulList(gitOut(root, ['ls-files', '-z', '--cached']).stdout));
  if (head) for (const p of nulList(gitOut(root, ['ls-tree', '-r', '-z', '--name-only', '--full-tree', head]).stdout)) tracked.add(p);
  for (const p of tracked) {
    const id = fileIdentity(join(root, p));
    if (id && id.dev === targetId.dev && id.ino === targetId.ino) return true;
  }
  return false;
}
export function outInTree(root, outAbs) {
  if (!root) return null;
  const real = realOut(outAbs); // the full path, leaf symlink included (T2b r5)
  const relGit = relUnder(root, real); // by path segment: "..notes.md" is in the tree (T2b r5)
  if (relGit === null) return null;
  const head = headOf(root);
  if (trackedByPath(root, relGit, head) || trackedByIdentity(root, real, head)) {
    throw new Error(`--out ${outAbs}${real === outAbs ? '' : ` (→ ${real})`} is a TRACKED file in the reviewed tree (${root}): the review would overwrite it, and ` +
      'excluding it from the snapshot would hide that. Write the output outside the tree (or to an ignored path)');
  }
  if (gitOut(root, ['check-ignore', '-q', '--', relGit], { okStatus: [0, 1] }).status === 0) return null;
  return `--out ${real} is inside the reviewed tree (${root}) and not ignored: it is excluded from this review's ` +
    'snapshot, but a leftover output there changes the next revision. Prefer a path outside the tree or an ignored one';
}
/** The ledger record's view of a revision: both parts, so an audit sees which state was reviewed. */
export function revisionParts(revision) {
  const [head, snapshot] = String(revision).split('+snap:');
  return { head, snapshot: snapshot ?? null };
}

/** Rotate the verbose audit log past LEDGER_MAX_BYTES. Runs before EVERY audit append (T2b r5:
 *  a failed over-cap launch appends too), so the audit is bounded to ~2 × LEDGER_MAX_BYTES. The
 *  tally is separate and NEVER rotates. Call under the lock. */
function rotateAudit(p) {
  const st = lstatOrNull(p.audit);
  refuseNonRegular(p.audit, st);
  if (st && st.size > LEDGER_MAX_BYTES) { refuseNonRegular(p.rotated); renameSync(p.audit, p.rotated); }
}
function appendAudit(p, rec) { rotateAudit(p); appendChecked(p.audit, rec); }

const failMessage = (e) => `review ledger: ${e.message}` +
  (['EACCES', 'EPERM', 'EROFS'].includes(e.code) ? ' — the ledger directory (~/.pi/agent) must be writable by this user' : '');

const REQUIRED = (p) => '--item <slug> is REQUIRED: the review round cap counts rounds per item ' +
  `(${p.tally}); an unnamed review is refused, never uncapped. Add --item <slug> [--role sol|astra|…].`;
const REFUSE = (d) => `${d.where}; revision would be round ${d.round}, over the cap of ${REVIEW_ROUND_CAP} (OBJECTIVE.md). ` +
  'Land with residuals, subtract, or instrument/implement first. To run anyway: --over-cap "<what changed>"';

/**
 * Admission for one review launch. `args` = the launcher's OWN argv (never the child's).
 * Never throws. Returns {ok:false, message} | {ok:true, id, res, note}. On ok the caller MUST
 * later call complete(res, out) on a completed verdict, or release(id) otherwise.
 */
export function admit(args, { launcher, pid = process.pid, home = homedir(), cwd = process.cwd(), provider, model, attempts = 1 } = {}) {
  const p = ledgerPaths(home);
  try {
    const q = parseReview(args, cwd);
    if (q.missing) return { ok: false, message: REQUIRED(p) };
    return withLock(p, () => {
      const d = decide(p, q.key, q.revision, q.overCap, true);
      if (d.verdict === 'refuse') return { ok: false, message: REFUSE(d) };
      const override = d.verdict === 'override' ? q.overCap : undefined;
      if (override) appendAudit(p, { kind: 'override', ...q.key, revision: q.revision, role: q.role, reason: override, round: d.round, launcher });
      ensureDir(p.resDir);
      const id = `${Date.now()}-${pid}-${randomBytes(6).toString('hex')}`;
      const res = { id, pid, ...q.key, revision: q.revision, role: q.role, out: q.out, launcher, override, cwd: q.cwd, revArg: q.revArg, exclude: q.exclude, provider: provider ?? null, model: model ?? null, overCapReason: override ?? null, attempts, startedAt: new Date().toISOString() };
      const fd = openSync(join(p.resDir, `${id}.json`), C.O_WRONLY | C.O_CREAT | C.O_EXCL | C.O_NOFOLLOW, 0o600);
      try { writeSync(fd, JSON.stringify(res)); } finally { closeSync(fd); }
      const note = `${d.where}; admitted as round ${d.round}/${REVIEW_ROUND_CAP}` +
        (d.again ? ' (revision already counted — no new round)' : '') +
        ` (${q.role} @ ${shortRev(q.revision)})` + (override ? ` — OVER CAP, override recorded: ${override}` : '');
      return { ok: true, id, res, note, warning: q.warning };
    });
  } catch (e) {
    return { ok: false, message: failMessage(e) };
  }
}

/** Locked, NON-mutating projection: would a review of this revision be admitted? Never throws. */
export function project(args, { home = homedir(), cwd = process.cwd() } = {}) {
  const p = ledgerPaths(home);
  try {
    const q = parseReview(args, cwd);
    if (q.missing) return { ok: false, message: REQUIRED(p) };
    const run = () => decide(p, q.key, q.revision, undefined, false);
    const d = lstatOrNull(p.dir) ? withLock(p, run) : run(); // no ledger dir: nothing to read, nothing created
    if (d.verdict === 'refuse') return { ok: false, message: REFUSE(d) };
    return { ok: true, note: `${d.where}; next review of ${shortRev(q.revision)} would be round ${d.round}/${REVIEW_ROUND_CAP}` +
      (d.again ? ' (revision already counted — no new round)' : ''), warning: q.warning };
  } catch (e) {
    return { ok: false, message: failMessage(e) };
  }
}

/** A completed verdict. Verifies and consumes the caller's OWN live reservation under the lock,
 *  and RE-DERIVES the reviewed tree's revision (sol r2 #12).
 *   - unchanged → the round is recorded in the tally (once per revision), the verdict in the audit.
 *   - changed (or no longer derivable) during the review → the round IS consumed for the admitted
 *     revision (tally line marked unverified), the verdict is audited as "verdict-unverified", and
 *     this returns ok:false. Chosen over recording against "the state actually reviewed": a tree
 *     edited mid-review was read in no single state, so no state can honestly own the verdict; and
 *     over counting nothing: then editing during a review would make every review free.
 *  The revision is re-derived UNDER the lock, just before recording (sol r3 TOCTOU).
 *  `text` is the launcher's captured string; `out` stays for diagnostics and old callers. The UTF-8 bytes
 *  of `text` are stored before either ledger line is appended.
 *  Never throws: {ok:true, round, verdict, unread} | {ok:false, message}. `r` = admit(...).res */
export function complete(r, out, { home = homedir(), attempts = r?.attempts ?? 1, text, rename } = {}) {
  const p = ledgerPaths(home);
  try {
    return withLock(p, () => {
      const f = join(p.resDir, `${r?.id}.json`);
      const { st, r: held } = readReservation(f);
      const mine = st && held && held.id === r.id && held.pid === r.pid && sameItem(held, r) && held.revision === r.revision;
      if (!mine || reservationStale(held, st)) {
        throw new Error(`reservation ${r?.id} is gone, expired or not this launcher's — this verdict is NOT recorded ` +
          `(output kept at ${out ?? r?.out}). Re-run the review to have it counted`);
      }
      // The final derivation happens HERE, under the lock, immediately before recording (sol r3
      // TOCTOU): deriving before the lock let an edit made while waiting on it receive a valid verdict.
      let now = null, why = '';
      try { now = deriveRevision(r.revArg, r.cwd, r.exclude ?? []).id; } catch (e) { why = e.message; }
      const stable = now === held.revision;
      // audit rotation first (only the verbose log rotates), so a refusal there writes nothing
      rotateAudit(p);
      const rounds = readTally(p).filter((x) => sameItem(x, held));
      const revisionOrder = [...new Set(rounds.map((x) => x.revision))];
      const existingOrdinal = revisionOrder.indexOf(held.revision);
      const round = existingOrdinal >= 0 ? existingOrdinal + 1 : revisionOrder.length + 1;
      const endedAt = new Date().toISOString();
      const metadata = { provider: held.provider ?? null, model: held.model ?? null, startedAt: held.startedAt ?? null, endedAt, attempts, durationMs: held.startedAt ? Math.max(0, Date.parse(endedAt) - Date.parse(held.startedAt)) : null };
      const drift = stable ? {} : { unverified: true, completedAs: now, completedError: why || undefined };
      let captured = text === undefined ? String(out ?? '') : String(text ?? '');
      if (text === undefined) {
        try { if (existsSync(captured)) captured = readFileSync(captured, 'utf8'); } catch { /* old callers may pass text in `out` */ }
      }
      const parsed = readVerdict(captured);
      let kept;
      try { kept = writeReviewText(p, captured, rename); } catch (e) {
        throw new Error(`${e.message} (output kept at ${out ?? held.out})`);
      }
      const textRecord = { text: kept };
      appendChecked(p.tally, { v: 2, kind: 'round', repo: held.repo, item: held.item, revision: held.revision, ...revisionParts(held.revision), role: held.role, launcher: held.launcher, override: held.override, overCap: held.overCapReason ?? held.override ?? null, verdict: parsed.verdict, ...metadata, ...drift, ...textRecord });
      appendAudit(p, { kind: stable ? 'verdict' : 'verdict-unverified', repo: held.repo, item: held.item, revision: held.revision, ...revisionParts(held.revision), role: held.role, out: out ?? held.out, launcher: held.launcher, override: held.override, overCap: held.overCapReason ?? held.override ?? null, verdict: parsed.verdict, ...metadata, ...drift, ...textRecord });
      unlinkSync(f);
      if (!stable) {
        return { ok: false, round, message: `review ledger: the reviewed tree changed during the review (admitted ${shortRev(held.revision)}, ` +
          `now ${why ? `underivable: ${why}` : shortRev(now)}) — the verdict is NOT recorded as valid for either state; round ${round} ` +
          `was consumed for the admitted revision. Re-review the current state (output kept at ${out ?? held.out})` };
      }
      const used = decide(p, held, held.revision, undefined, false).used;
      const selected = parsed.selected ?? { number: 1, text: '' };
      const trigger = parsed.trigger ? `; line ${parsed.trigger.number} ${JSON.stringify(parsed.trigger.text)}` : '';
      const unread = parsed.verdict === null ? `verdict unread for item ${held.item} at ${shortRev(held.revision)} (round ${round}): ` +
        `selected line ${selected.number} ${JSON.stringify(selected.text)} — ${parsed.condition}${trigger}; ` +
        `nana-land will refuse this revision for good — make a new commit and review it; ` +
        `${Math.max(0, REVIEW_ROUND_CAP - used)} of ${REVIEW_ROUND_CAP} rounds remain for the item; review kept at ${out ?? held.out}` : null;
      return { ok: true, round, verdict: parsed.verdict, unread };
    });
  } catch (e) {
    return { ok: false, message: failMessage(e) };
  }
}

/** Heartbeat: renew the caller's reservation (mtime := now). false when it is gone or not ours. */
export function renew(r, { home = homedir() } = {}) {
  if (!/^[\w-]+$/.test(String(r?.id))) return false;
  let fd;
  try {
    fd = openSync(join(ledgerPaths(home).resDir, `${r.id}.json`), C.O_RDWR | C.O_NOFOLLOW);
    if (!fstatSync(fd).isFile()) return false;
    const held = JSON.parse(readFileSync(fd, 'utf8'));
    if (held.id !== r.id || held.pid !== r.pid) return false;
    const t = new Date();
    futimesSync(fd, t, t);
    return true;
  } catch { return false; } finally { if (fd !== undefined) closeSync(fd); }
}
/** Renew `r` every 1/5 of the stale window until the returned stop() is called. Unref'd. */
export function startHeartbeat(r, opts = {}) {
  const t = setInterval(() => renew(r, opts), Math.max(100, Math.floor(reservationStaleMs() / 5)));
  t.unref();
  return () => clearInterval(t);
}

/** No verdict (stall, infra failure, timeout): the reservation is dropped, nothing is counted. */
export function release(id, { home = homedir() } = {}) {
  if (!/^[\w-]+$/.test(String(id))) return;
  try { unlinkSync(join(ledgerPaths(home).resDir, `${id}.json`)); } catch {}
}
