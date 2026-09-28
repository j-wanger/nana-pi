// review-round.mjs — the review ROUND CAP (OBJECTIVE.md rule, 2026-09-16): three review rounds
// per item, then land with residuals, subtract, or instrument/implement before any further round.
//
// T2b (2026-09-28): the cap binds to the ITEM, not to one launcher or one file name. The old
// basename parse ("sol-r4.md" → 4; "sol-final.md" → null → uncapped) was bypassed in practice
// (opus-review B2/B4). Now every launcher (pi-review, review-ledger run) calls admit() here, which
// counts COMPLETED VERDICTS in a user-scope ledger:
//   ~/.pi/agent/review-ledger.jsonl   append-only, one line per completed verdict / override / worker launch
//   ~/.pi/agent/review-ledger.reservations/<id>.json   an in-flight review holding a slot
//   ~/.pi/agent/review-ledger.lock    O_EXCL lock around every read-decide-write
// Rules:
//  - identity is {item, revision, role}; --item is required (no item → refused, never "uncapped").
//  - rounds(item) = Σ over revisions of (max verdicts by any ONE role on that revision): a sol and
//    an astra (or scope+adversarial) verdict on one revision are one cycle; the same role twice on
//    one revision is two rounds. The cap spans revisions — a new revision resets nothing.
//  - only a completed verdict counts; a stalled/failed attempt releases its reservation.
//  - crash recovery: a reservation whose pid is dead (or older than RESERVATION_TTL_MS) is pruned
//    at the next admit; a lock whose pid is dead (or older than LOCK_STALE_MS) is stolen.
//  - bound: when the ledger passes LEDGER_MAX_BYTES it is renamed to .jsonl.1 (replacing the old
//    .1); counting reads both generations, so an item keeps ≥1 MiB of later history.

import { openSync, closeSync, writeSync, readFileSync, appendFileSync, mkdirSync, readdirSync, unlinkSync, statSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

export const REVIEW_ROUND_CAP = 3;
export const LEDGER_MAX_BYTES = 1024 * 1024;
const LOCK_STALE_MS = 30_000;
const LOCK_WAIT_MS = 15_000;
const RESERVATION_TTL_MS = 12 * 3600_000;

export function ledgerPaths(home = homedir()) {
  const dir = join(home, '.pi', 'agent');
  return {
    dir,
    ledger: join(dir, 'review-ledger.jsonl'),
    rotated: join(dir, 'review-ledger.jsonl.1'),
    lock: join(dir, 'review-ledger.lock'),
    resDir: join(dir, 'review-ledger.reservations'),
  };
}

/** The success heuristic shared by every launcher: a review-shaped token in the output. */
export function reviewShaped(text) {
  return /\b(VERDICT|LAND|FAIL|finding|BLOCKING)\b/i.test(text);
}

/** Rounds consumed by a list of {revision, role} verdicts (pure). */
export function roundsUsed(entries) {
  const byRev = new Map();
  for (const e of entries) {
    const roles = byRev.get(e.revision) ?? new Map();
    roles.set(e.role, (roles.get(e.role) ?? 0) + 1);
    byRev.set(e.revision, roles);
  }
  let n = 0;
  for (const roles of byRev.values()) n += Math.max(...roles.values());
  return n;
}

/** 'allow' | 'refuse' | 'override' for a projected round count (pure). */
export function roundCapVerdict(projected, overCap) {
  if (projected <= REVIEW_ROUND_CAP) return 'allow';
  return overCap ? 'override' : 'refuse';
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

export function resolveRevision(explicit, cwd = process.cwd()) {
  if (explicit) return explicit;
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null;
  } catch {
    return null;
  }
}

const sleepMs = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
function alive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}
const ageMs = (f) => Date.now() - statSync(f).mtimeMs;

function withLock(p, fn) {
  mkdirSync(p.resDir, { recursive: true });
  const deadline = Date.now() + LOCK_WAIT_MS;
  for (;;) {
    try {
      const fd = openSync(p.lock, 'wx');
      writeSync(fd, String(process.pid));
      closeSync(fd);
      break;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      let stale = false;
      try {
        const pid = Number(readFileSync(p.lock, 'utf8'));
        stale = (pid > 0 && !alive(pid)) || ageMs(p.lock) > LOCK_STALE_MS;
      } catch { /* vanished between open and read: just retry */ }
      if (stale) { try { unlinkSync(p.lock); } catch {} continue; }
      if (Date.now() > deadline) throw new Error(`review ledger lock busy for ${LOCK_WAIT_MS / 1000}s: ${p.lock}`);
      sleepMs(20);
    }
  }
  try { return fn(); } finally { try { unlinkSync(p.lock); } catch {} }
}

function readJsonl(f) {
  let text = '';
  try { text = readFileSync(f, 'utf8'); } catch { return []; }
  return text.split('\n').flatMap((l) => { try { return l.trim() ? [JSON.parse(l)] : []; } catch { return []; } });
}

function append(p, rec) {
  try { if (statSync(p.ledger).size > LEDGER_MAX_BYTES) renameSync(p.ledger, p.rotated); } catch {}
  appendFileSync(p.ledger, JSON.stringify({ v: 1, ts: new Date().toISOString(), ...rec }) + '\n');
}

/** Live reservations; stale ones (dead pid / past TTL) are deleted — the crash recovery. Call under the lock. */
function liveReservations(p) {
  const out = [];
  for (const name of readdirSync(p.resDir)) {
    const f = join(p.resDir, name);
    let r = null;
    try { r = JSON.parse(readFileSync(f, 'utf8')); } catch {}
    if (!r || !alive(r.pid) || ageMs(f) > RESERVATION_TTL_MS) { try { unlinkSync(f); } catch {} continue; }
    out.push(r);
  }
  return out;
}

/** Item history: completed verdicts (both generations) + live reservations. Call under the lock. */
function itemState(p, item) {
  const verdicts = [...readJsonl(p.rotated), ...readJsonl(p.ledger)].filter((r) => r.kind === 'verdict' && r.item === item);
  const reserved = liveReservations(p).filter((r) => r.item === item);
  return { verdicts, reserved };
}

/**
 * Admission for one review launch. `args` = the launcher's OWN argv (never the child's).
 * Returns {ok:false, message} | {ok:true, id|null, note}. On ok with an id, the caller MUST
 * later call complete(res, out) on a completed verdict or release(id) otherwise.
 */
export function admit(args, { launcher, pid = process.pid, home = homedir(), cwd = process.cwd() } = {}) {
  const p = ledgerPaths(home);
  let item, revArg, role, overCap, out;
  try {
    item = optValue(args, '--item');
    revArg = optValue(args, '--revision');
    role = optValue(args, '--role') ?? 'reviewer';
    overCap = optValue(args, '--over-cap');
    out = optValue(args, '--out');
  } catch (e) {
    return { ok: false, message: e.message };
  }
  if (!item) {
    return {
      ok: false,
      message: '--item <slug> is REQUIRED: the review round cap counts completed verdicts per item ' +
        `(${p.ledger}); an unnamed review is refused, never uncapped. Add --item <slug> [--role sol|astra|…]. ` +
        'A worker launch through this wrapper: add --worker (consumes no round, still logged).',
    };
  }
  const revision = resolveRevision(revArg, cwd);
  if (args.includes('--worker')) {
    withLock(p, () => append(p, { kind: 'worker', item, revision, out, launcher }));
    return { ok: true, id: null, note: `worker launch for item ${item} — consumes no review round (logged)` };
  }
  if (!revision) return { ok: false, message: `no git HEAD at ${cwd}; pass --revision <id> for item ${item}` };
  return withLock(p, () => {
    const { verdicts, reserved } = itemState(p, item);
    const used = roundsUsed([...verdicts, ...reserved]);
    const projected = roundsUsed([...verdicts, ...reserved, { revision, role }]);
    const verdict = roundCapVerdict(projected, overCap);
    const where = `item ${item}: ${verdicts.length} verdict(s), ${reserved.length} in flight, ${used} round(s) used`;
    if (verdict === 'refuse') {
      return {
        ok: false,
        message: `${where}; this would be round ${projected}, over the cap of ${REVIEW_ROUND_CAP} (OBJECTIVE.md). ` +
          `Land with residuals, subtract, or instrument/implement first. To run anyway: --over-cap "<what changed>"`,
      };
    }
    if (verdict === 'override') append(p, { kind: 'override', item, revision, role, reason: overCap, round: projected, launcher });
    const id = `${Date.now()}-${process.pid}-${randomBytes(4).toString('hex')}`;
    const rec = { id, pid, item, revision, role, out, launcher, override: verdict === 'override' ? overCap : undefined };
    writeFileSync(join(p.resDir, `${id}.json`), JSON.stringify(rec));
    const note = `${where}; admitted as round ${projected}/${REVIEW_ROUND_CAP} (${role} @ ${revision})` +
      (verdict === 'override' ? ` — OVER CAP, override recorded: ${overCap}` : '');
    return { ok: true, id, res: rec, note };
  });
}

/** A completed verdict: one ledger line, reservation dropped. `r` = admit(...).res */
export function complete(r, out, { home = homedir() } = {}) {
  const p = ledgerPaths(home);
  withLock(p, () => {
    append(p, { kind: 'verdict', item: r.item, revision: r.revision, role: r.role, out: out ?? r.out, launcher: r.launcher, override: r.override });
    try { unlinkSync(join(p.resDir, `${r.id}.json`)); } catch {}
  });
}

/** No verdict (stall, infra failure, timeout): the slot is returned, nothing is counted. */
export function release(id, { home = homedir() } = {}) {
  try { unlinkSync(join(ledgerPaths(home).resDir, `${id}.json`)); } catch {}
}
