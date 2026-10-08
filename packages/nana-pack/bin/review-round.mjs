/**
 * @module packages/nana-pack/bin/review-round.mjs
 * @purpose The review round ledger — admit, project, complete and release one per-item review round under a
 *  user-scope lock.
 * @inputs a launcher's own argv (--item, --tree, --revision, --role, --out, --over-cap), the reviewed tree's git
 *  state (common dir, HEAD, tracked and non-ignored untracked content), stdout/stderr file identities, env NANA_REVIEW_RES_STALE_MS, and
 *  the ledger files under ~/.pi/agent
 * @outputs an admission or refusal with its note and warning, a reservation file, a round appended to the
 *  tally, audit lines (rotated past LEDGER_MAX_BYTES), a heartbeat stopper, and the projected round number
 * @effects disk (an O_EXCL lock around every read-decide-write, reservation files, the never-rotated tally
 *  and the rotated audit log), process (spawns git through spawnSync, runs a renewing heartbeat interval)
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
  openSync, closeSync, writeSync, readFileSync, fstatSync, lstatSync, mkdirSync, readdirSync,
  unlinkSync, renameSync, realpathSync, readlinkSync, existsSync, futimesSync, constants as C,
} from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, basename, dirname, relative, isAbsolute, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { randomBytes, createHash } from 'node:crypto';
export { reviewShaped } from './review-shape.mjs';

export const REVIEW_ROUND_CAP = 3;
export const LEDGER_MAX_BYTES = 1024 * 1024; // audit log rotation threshold (the tally never rotates)
export const SLUG_MAX = 128; // characters, after canonicalization
const REVISION_MAX = 128;
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
 *  Pinned config so nothing a user sets changes what is enumerated. */
function gitOut(cwd, args, { okStatus = [0] } = {}) {
  const r = spawnSync('git', ['-c', 'core.fsmonitor=false', '-c', 'core.untrackedCache=false', ...args],
    { cwd, encoding: 'utf8', maxBuffer: 1 << 30 });
  if (r.error) throw new Error(`git ${args[0]} could not run in ${cwd}: ${r.error.message} — admission refused`);
  if (!okStatus.includes(r.status)) {
    throw new Error(`git ${args.join(' ')} failed in ${cwd} (exit ${r.status ?? r.signal}): ` +
      `${(r.stderr || '').trim().split('\n').slice(0, 3).join(' | ') || 'no message'} — admission refused`);
  }
  return r;
}

/** Repository identity + the reviewed tree's revision parts. repo = realpath of the git common dir
 *  (shared by all worktrees of one repository). Non-Git admission throws; legacy `path:` keys are
 *  readable only in existing tallies. `exclude` = absolute paths left out of the snapshot. */
export function treeScope(cwd = process.cwd(), { exclude = [] } = {}) {
  const tree = resolve(cwd);
  const r = gitOut(tree, ['rev-parse', '--git-common-dir', '--show-toplevel'], { okStatus: [0, 128] });
  if (r.status !== 0) {
    if (/not a git repository/i.test(r.stderr)) throw new Error('run from the reviewed tree or pass --tree <path inside it>');
    throw new Error(`git rev-parse failed in ${tree}: ${r.stderr.trim().split('\n')[0]} — admission refused`);
  }
  const [common, top] = r.stdout.trim().split('\n');
  const root = realpathSync(top);
  const { head, snapshot } = workingState(root, exclude);
  return { repo: `git:${realpathSync(resolve(tree, common))}`, inGit: true, root, head, snapshot };
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

/** {head, snapshot}: snapshot = null when the working tree's content equals HEAD's tree, else the
 *  FULL sha256 of the working-state snapshot:
 *    files  = paths in HEAD's tree ∪ the index ∪ untracked files not ignored (--exclude-standard)
 *             — so staging/unstaging never moves a path in or out; an ignored file never counts
 *    record = "<mode> <sha256(raw bytes)>\t<path>\0" per path present on disk, in byte order of path;
 *             mode from the filesystem (100644 / 100755 by the owner-x bit, 120000 symlink →
 *             sha256 of its target, 160000 submodule → the submodule's own revision, recursively;
 *             an uninitialized submodule → its recorded commit). A missing path has no record.
 *  Raw bytes: no clean/smudge filter, no EOL normalization, no core.fileMode, no diff config.
 *  "Content equals HEAD" compares the same records by git object id against `git ls-tree -r HEAD`. */
export function workingState(root, exclude = []) {
  const head = headOf(root);
  if (!head) return { head: null, snapshot: null };
  const fmt = gitOut(root, ['rev-parse', '--show-object-format']).stdout.trim() || 'sha1';
  const blobId = (buf) => createHash(fmt === 'sha256' ? 'sha256' : 'sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
  const inHead = new Map();
  for (const rec of nulList(gitOut(root, ['ls-tree', '-r', '-z', '--full-tree', head]).stdout)) {
    const m = /^(\d+) \w+ ([0-9a-f]+)\t([\s\S]+)$/.exec(rec);
    if (!m) throw new Error(`git ls-tree: unparseable entry ${JSON.stringify(rec.slice(0, 60))} — admission refused`);
    inHead.set(m[3], `${m[1]} ${m[2]}`);
  }
  const gitlink = new Map();
  const paths = new Set(inHead.keys());
  for (const rec of nulList(gitOut(root, ['ls-files', '-z', '--stage']).stdout)) {
    const m = /^(\d+) ([0-9a-f]+) \d\t([\s\S]+)$/.exec(rec);
    if (!m) throw new Error(`git ls-files: unparseable entry ${JSON.stringify(rec.slice(0, 60))} — admission refused`);
    paths.add(m[3]);
    if (m[1] === '160000') gitlink.set(m[3], m[2]);
  }
  for (const p of nulList(gitOut(root, ['ls-files', '-z', '--others', '--exclude-standard']).stdout)) paths.add(p.replace(/\/$/, ''));
  for (const p of inHead.keys()) if (inHead.get(p).startsWith('160000 ')) gitlink.set(p, gitlink.get(p) ?? inHead.get(p).split(' ')[1]);
  const skip = new Set(exclude.map((x) => relUnder(root, x)).filter(Boolean));

  const records = [], ids = [];
  for (const p of [...paths].sort(byteOrder)) {
    if (skip.has(p)) continue;
    if (p.includes('�')) throw new Error(`path ${JSON.stringify(p)} is not valid UTF-8 — the snapshot cannot read it; admission refused`);
    const full = join(root, p);
    let st;
    try { st = lstatSync(full); } catch (e) { if (e.code === 'ENOENT' || e.code === 'ENOTDIR') continue; throw e; }
    let mode, content, id;
    if (st.isSymbolicLink()) {
      const t = readlinkSync(full, { encoding: 'buffer' });
      mode = '120000'; content = sha256(t); id = blobId(t);
    } else if (st.isFile()) {
      const b = readFileSync(full);
      mode = st.mode & 0o100 ? '100755' : '100644'; content = sha256(b); id = blobId(b);
    } else if (st.isDirectory()) {
      mode = '160000';
      if (existsSync(join(full, '.git'))) {
        const sub = workingState(realpathSync(full));
        content = id = sub.snapshot ? `${sub.head ?? 'unborn'}+snap:${sub.snapshot}` : (sub.head ?? 'unborn');
      } else if (gitlink.has(p)) content = id = gitlink.get(p); // uninitialized submodule: its recorded commit
      else { mode = '040000'; content = id = 'dir'; }
    } else throw new Error(`${full} is not a file, symlink or directory — the snapshot refuses it; admission refused`);
    records.push(`${mode} ${content}\t${p}\0`);
    ids.push(`${mode} ${id}\t${p}`);
  }
  const headIds = [...inHead.keys()].sort(byteOrder).map((p) => `${inHead.get(p)}\t${p}`);
  const clean = ids.length === headIds.length && ids.every((x, i) => x === headIds[i]);
  return { head, snapshot: clean ? null : sha256(records.join('')) };
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
  try { return realpathSync(p); } catch (e) { if (e.code !== 'ENOENT') throw e; }
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
function appendChecked(f, rec) {
  const fd = openChecked(f, C.O_WRONLY | C.O_APPEND | C.O_CREAT, 0o600);
  try { writeSync(fd, JSON.stringify({ v: 1, ts: new Date().toISOString(), ...rec }) + '\n'); } finally { closeSync(fd); }
}
function ensureDir(d) {
  mkdirSync(d, { recursive: true });
  const st = lstatSync(d);
  if (!st.isDirectory()) throw new Error(`${d} is not a directory — refused`);
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
    const ok = r && typeof r === 'object' && r.v === 1 && r.kind === 'round' &&
      [r.repo, r.item, r.revision].every((x) => typeof x === 'string' && x);
    if (!ok) {
      throw new Error(`${p.tally}:${i + 1}: malformed record ${JSON.stringify(l.slice(0, 80))} — admission refused. ` +
        'Repair the line or delete it (README "Trust model"); a corrupted record never grants a free review');
    }
    return r;
  });
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

/** Return the first token following VERDICT: on its first matching line. */
function verdictWord(out) {
  let text = String(out ?? '');
  try { if (existsSync(text)) text = readFileSync(text, 'utf8'); } catch { /* retain non-path input */ }
  return text.match(/^[^\w\r\n]*VERDICT:\s*(\S+)/m)?.[1] ?? null;
}
const sameItem = (a, b) => a.repo === b.repo && a.item === b.item;

/** The cap decision for {repo, item, revision}. Call under the lock. Every ledger path is
 *  checked here, so a symlinked audit log is refused BEFORE a review is spent, not after. */
function decide(p, key, revision, overCap, prune) {
  for (const f of [p.audit, p.rotated]) refuseNonRegular(f);
  if (lstatOrNull(p.resDir) && !lstatSync(p.resDir).isDirectory()) throw new Error(`${p.resDir} is not a directory — refused`);
  const rounds = readTally(p).filter((r) => sameItem(r, key));
  const reserved = liveReservations(p, prune).filter((r) => sameItem(r, key));
  const revs = [...new Set([...rounds, ...reserved].map((r) => r.revision))];
  const used = revs.length;
  const where = `item "${key.item}" (${key.repo}): ${used} round(s) used (${rounds.length} completed, ` +
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
export function outInTree(root, outAbs) {
  if (!root) return null;
  const real = realOut(outAbs); // the full path, leaf symlink included (T2b r5)
  const relGit = relUnder(root, real); // by path segment: "..notes.md" is in the tree (T2b r5)
  if (relGit === null) return null;
  const listed = (args) => gitOut(root, ['--literal-pathspecs', ...args, '--', relGit]).stdout.length > 0;
  const head = headOf(root);
  if (listed(['ls-files', '-z', '--cached']) || (head && listed(['ls-tree', '-r', '-z', '--name-only', '--full-tree', head]))) {
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
 *  Never throws: {ok:true, round} | {ok:false, message}. `r` = admit(...).res */
export function complete(r, out, { home = homedir(), attempts = r?.attempts ?? 1 } = {}) {
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
      let idx = rounds.findIndex((x) => x.revision === held.revision);
      const endedAt = new Date().toISOString();
      const metadata = { provider: held.provider ?? null, model: held.model ?? null, startedAt: held.startedAt ?? null, endedAt, attempts, durationMs: held.startedAt ? Math.max(0, Date.parse(endedAt) - Date.parse(held.startedAt)) : null };
      const drift = stable ? {} : { unverified: true, completedAs: now, completedError: why || undefined };
      if (idx < 0) {
        appendChecked(p.tally, { kind: 'round', repo: held.repo, item: held.item, revision: held.revision, ...revisionParts(held.revision), role: held.role, launcher: held.launcher, override: held.override, overCap: held.overCapReason ?? held.override ?? null, verdict: verdictWord(out), ...metadata, ...drift });
        idx = rounds.length;
      }
      appendAudit(p, { kind: stable ? 'verdict' : 'verdict-unverified', repo: held.repo, item: held.item, revision: held.revision, ...revisionParts(held.revision), role: held.role, out: out ?? held.out, launcher: held.launcher, override: held.override, overCap: held.overCapReason ?? held.override ?? null, verdict: verdictWord(out), ...metadata, ...drift });
      unlinkSync(f);
      if (!stable) {
        return { ok: false, round: idx + 1, message: `review ledger: the reviewed tree changed during the review (admitted ${shortRev(held.revision)}, ` +
          `now ${why ? `underivable: ${why}` : shortRev(now)}) — the verdict is NOT recorded as valid for either state; round ${idx + 1} ` +
          `was consumed for the admitted revision. Re-review the current state (output kept at ${out ?? held.out})` };
      }
      return { ok: true, round: idx + 1 };
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
