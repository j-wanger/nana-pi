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
//                                            rotated past 1 MiB; never consulted by the cap.
//   ~/.pi/agent/review-ledger.reservations/  one <id>.json per in-flight review holding its round
//   ~/.pi/agent/review-ledger.lock           O_EXCL lock around every read-decide-write
//
// Rules:
//  - ITEM = {repo, slug}. The slug is canonicalized (canonicalItem); repo = realpath of the git
//    COMMON dir, so every worktree of one repository shares an item and the same slug in an
//    unrelated repository does not. Outside git, repo = "path:" + realpath(cwd).
//  - A ROUND is a distinct REVISION reviewed for the item. Revision = the reviewed tree's git HEAD
//    (full sha); --revision is only the fallback when HEAD cannot be resolved (and inside git it
//    must name that commit). A DIRTY tree's revision is "<sha>+diff:<16 hex of sha256(git diff HEAD)>"
//    (tracked changes only), so fix-review-fix-review without committing still counts each state.
//    Any number of reviews — any roles — on one revision are ONE round.
//    --role is audit metadata only.
//  - only a completed verdict earns the round; a stall / failure returns the reservation.
//  - complete() must own a live reservation: an expired, pruned or replaced one records nothing.
//  - a malformed tally line, a non-regular ledger path, or a lock path that is not a regular file
//    REFUSES admission with a diagnostic — never a silent skip, never a stack.
// This is a self-governance device against the fix-review treadmill, not a security control
// (see README "Trust model").

import {
  openSync, closeSync, writeSync, readFileSync, fstatSync, lstatSync, mkdirSync, readdirSync,
  unlinkSync, renameSync, realpathSync, constants as C,
} from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import { randomBytes, createHash } from 'node:crypto';

export const REVIEW_ROUND_CAP = 3;
export const LEDGER_MAX_BYTES = 1024 * 1024; // audit log rotation threshold (the tally never rotates)
export const SLUG_MAX = 128; // characters, after canonicalization
const REVISION_MAX = 128;
const LOCK_WAIT_MS = 15_000;
const LOCK_ORPHAN_MS = 5_000; // a lock file with no readable pid, older than this, is a crashed create
const RESERVATION_TTL_MS = 12 * 3600_000;
const CLOCK_SKEW_MS = 60_000; // a reservation dated further in the future than this is stale

export function ledgerPaths(home = homedir()) {
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

/** The success heuristic shared by every launcher: a review-shaped token in the output. */
export function reviewShaped(text) {
  return /\b(VERDICT|LAND|FAIL|finding|BLOCKING)\b/i.test(text);
}

/** Canonical item slug: NFKC, trim, casefold, internal whitespace → one space. Throws on a path
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

const git = (cwd, args) => {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null;
  } catch {
    return null;
  }
};

/** Repository identity + HEAD of the reviewed tree. repo = realpath of the git common dir (shared
 *  by all worktrees of one repository), or "path:<realpath cwd>" outside git. */
export function treeScope(cwd = process.cwd()) {
  const common = git(cwd, ['rev-parse', '--git-common-dir']);
  if (!common) return { repo: `path:${realpathSync(cwd)}`, inGit: false, head: null };
  return {
    repo: `git:${realpathSync(resolve(cwd, common))}`,
    inGit: true,
    head: git(cwd, ['rev-parse', '--verify', '--quiet', 'HEAD^{commit}']),
    diff: diffDigest(cwd),
  };
}

/** A dirty tree is its own state of the work: a short digest of `git diff HEAD` (tracked changes
 *  only — an untracked file does not change it), or null when the tree is clean. */
function diffDigest(cwd) {
  let d;
  try {
    d = execFileSync('git', ['diff', 'HEAD', '--binary', '--no-color', '--no-ext-diff', '--no-textconv'],
      { cwd, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 30 });
  } catch { return null; } // no HEAD yet: nothing to diff against
  return d.length ? createHash('sha256').update(d).digest('hex').slice(0, 16) : null;
}
const withDiff = (sha, scope) => (scope.diff ? `${sha}+diff:${scope.diff}` : sha);

/** The revision a review is counted against. Throws with the reason when it cannot be derived. */
export function resolveRevision(explicit, scope, cwd = process.cwd()) {
  if (scope.inGit && explicit) {
    const sha = git(cwd, ['rev-parse', '--verify', '--quiet', `${explicit}^{commit}`]);
    if (!sha) throw new Error(`--revision ${JSON.stringify(explicit)} is not a commit in ${cwd}`);
    if (scope.head && sha !== scope.head) {
      throw new Error(`--revision ${explicit} is ${sha.slice(0, 12)}, but the reviewed tree's HEAD is ${scope.head.slice(0, 12)}: ` +
        'the revision is derived from HEAD — run the review from a checkout of that commit');
    }
    return withDiff(sha, scope);
  }
  if (scope.head) return withDiff(scope.head, scope);
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

function reservationStale(r, st) {
  const age = Date.now() - st.mtimeMs;
  return !r || !alive(r.pid) || age > RESERVATION_TTL_MS || age < -CLOCK_SKEW_MS;
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
  const revArg = optValue(args, '--revision');
  const role = optValue(args, '--role') ?? 'reviewer';
  const overCap = optValue(args, '--over-cap');
  const out = optValue(args, '--out');
  if (rawItem === undefined) return { missing: true };
  const item = canonicalItem(rawItem);
  const scope = treeScope(cwd);
  const revision = resolveRevision(revArg, scope, cwd);
  return { key: { repo: scope.repo, item }, revision, role, overCap, out };
}
/** The ledger record's view of a revision: both parts, so an audit sees which state was reviewed. */
export function revisionParts(revision) {
  const [head, diff] = String(revision).split('+diff:');
  return { head, diff: diff ?? null };
}

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
export function admit(args, { launcher, pid = process.pid, home = homedir(), cwd = process.cwd() } = {}) {
  const p = ledgerPaths(home);
  try {
    const q = parseReview(args, cwd);
    if (q.missing) return { ok: false, message: REQUIRED(p) };
    return withLock(p, () => {
      const d = decide(p, q.key, q.revision, q.overCap, true);
      if (d.verdict === 'refuse') return { ok: false, message: REFUSE(d) };
      const override = d.verdict === 'override' ? q.overCap : undefined;
      if (override) appendChecked(p.audit, { kind: 'override', ...q.key, revision: q.revision, role: q.role, reason: override, round: d.round, launcher });
      ensureDir(p.resDir);
      const id = `${Date.now()}-${pid}-${randomBytes(6).toString('hex')}`;
      const res = { id, pid, ...q.key, revision: q.revision, role: q.role, out: q.out, launcher, override };
      const fd = openSync(join(p.resDir, `${id}.json`), C.O_WRONLY | C.O_CREAT | C.O_EXCL | C.O_NOFOLLOW, 0o600);
      try { writeSync(fd, JSON.stringify(res)); } finally { closeSync(fd); }
      const note = `${d.where}; admitted as round ${d.round}/${REVIEW_ROUND_CAP}` +
        (d.again ? ' (revision already counted — no new round)' : '') +
        ` (${q.role} @ ${shortRev(q.revision)})` + (override ? ` — OVER CAP, override recorded: ${override}` : '');
      return { ok: true, id, res, note };
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
      (d.again ? ' (revision already counted — no new round)' : '') };
  } catch (e) {
    return { ok: false, message: failMessage(e) };
  }
}

/** A completed verdict. Verifies and consumes the caller's OWN live reservation under the lock;
 *  records the round in the tally (once per revision) and the verdict in the audit log.
 *  Never throws: {ok:true, round} | {ok:false, message}. `r` = admit(...).res */
export function complete(r, out, { home = homedir() } = {}) {
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
      // audit rotation first (only the verbose log rotates), so a refusal there writes nothing
      const st2 = lstatOrNull(p.audit);
      refuseNonRegular(p.audit, st2);
      if (st2 && st2.size > LEDGER_MAX_BYTES) { refuseNonRegular(p.rotated); renameSync(p.audit, p.rotated); }
      const rounds = readTally(p).filter((x) => sameItem(x, held));
      let idx = rounds.findIndex((x) => x.revision === held.revision);
      if (idx < 0) {
        appendChecked(p.tally, { kind: 'round', repo: held.repo, item: held.item, revision: held.revision, ...revisionParts(held.revision), role: held.role, launcher: held.launcher, override: held.override });
        idx = rounds.length;
      }
      appendChecked(p.audit, { kind: 'verdict', repo: held.repo, item: held.item, revision: held.revision, ...revisionParts(held.revision), role: held.role, out: out ?? held.out, launcher: held.launcher, override: held.override });
      unlinkSync(f);
      return { ok: true, round: idx + 1 };
    });
  } catch (e) {
    return { ok: false, message: failMessage(e) };
  }
}

/** No verdict (stall, infra failure, timeout): the reservation is dropped, nothing is counted. */
export function release(id, { home = homedir() } = {}) {
  if (!/^[\w-]+$/.test(String(id))) return;
  try { unlinkSync(join(ledgerPaths(home).resDir, `${id}.json`)); } catch {}
}
