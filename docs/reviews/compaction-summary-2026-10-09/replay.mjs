// Read-only replay for hardening plan 6.6 (compaction-summary store exposure).
// Usage: node replay.mjs [journal] [since] [until]   (half-open window; the journal is append-only, never rotated)
// Unit: a pi session is "eligible" (could write or pick up the store) when the handoff
// extension did NOT journal handoff_skipped_role for it. Every pi-watchdog child
// (pi-worker, pi-review) is marked NANA_HANDOFF=off; the marker went live 2026-09-28T19:00:38Z.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const journal = process.argv[2] ?? path.join(os.homedir(), ".pi/agent/nana-journal.jsonl");
const since = process.argv[3] ?? "2026-09-28T19:00:00Z";
const until = process.argv[4] ?? "9999";
const JOIN_MS = 5_000; // chosen: both lines come from one event dispatch (observed same second); wider windows mis-join concurrent same-cwd sessions
const L = fs.readFileSync(journal, "utf8").split("\n").filter(Boolean).flatMap((l) => {
  try { return [JSON.parse(l)]; } catch { return []; }
}).filter((o) => o.ts >= since && o.ts < until);
const near = (a, b) => a.cwd === b.cwd && Math.abs(Date.parse(a.ts) - Date.parse(b.ts)) < JOIN_MS;
const skips = (op) => L.filter((o) => o.event === "handoff_skipped_role" && o.op === op);
const count = (e) => L.filter((o) => o.event === e).length;

const compacts = L.filter((o) => o.event === "session_compact");
const eligibleCompacts = compacts.filter((c) => !skips("write").some((s) => near(s, c)));
const starts = L.filter((o) => o.event === "session_start" && (o.reason === "startup" || o.reason === "new"));
const eligibleStarts = starts.filter((s) => !skips("pickup").some((k) => near(k, s)));
const shut = L.filter((o) => o.event === "session_shutdown");
const minutes = (s) => {
  const e = shut.find((x) => x.pid === s.pid && x.cwd === s.cwd && x.ts >= s.ts);
  return e ? (Date.parse(e.ts) - Date.parse(s.ts)) / 60000 : null;
};
let storeEntries = null, storeMtime = null;
try {
  const dir = path.join(os.homedir(), ".pi/agent/handoffs");
  storeEntries = fs.readdirSync(dir).length;
  storeMtime = fs.statSync(dir).mtime.toISOString();
} catch {}

console.log(JSON.stringify({
  since, until,
  compactions: compacts.length,
  eligibleCompactions: eligibleCompacts.map((c) => ({ ts: c.ts, cwd: c.cwd, pid: c.pid })),
  handoff_written: count("handoff_written"),
  handoff_write_failed: count("handoff_write_failed"),
  handoff_pickup: count("handoff_pickup"),
  handoff_stale_pointer: count("handoff_stale_pointer"),
  sessionStarts: starts.length,
  eligibleStarts: eligibleStarts.length,
  eligibleStartsOver10Min: eligibleStarts.filter((s) => (minutes(s) ?? 0) >= 10).map((s) => ({ ts: s.ts, cwd: s.cwd, min: Math.round(minutes(s)) })),
  storeEntries,
  storeMtime,
}, null, 2));
