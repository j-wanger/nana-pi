#!/usr/bin/env node
/**
 * @module uplift
 * @purpose Measure P(read | shown) for knowledge-pull pointers in a time window, with a positive control and a decoy floor, and apply the pre-registered bound rule.
 * @inputs <home>/.pi/agent/nana-knowledge/pull.log; <home>/.pi/agent/nana-knowledge/index.db (opened immutable, read-only);
 *         <home>/.claude/projects/<dir>/<session>.jsonl (main-thread transcripts); <home>/.pi/agent/sessions/** /*.jsonl;
 *         flags --since <iso> --until <iso> --home <dir>
 * @outputs one JSON report on stdout
 * @effects disk (read-only: reads and stats only, never writes, moves or deletes an input)
 * @errors exits 1 with a message when pull.log is unreadable; an unreadable or unparseable transcript is counted
 *         as an exclusion in the funnel, never thrown
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { DatabaseSync } from "node:sqlite";

// ---------------------------------------------------------------------------
// Configuration surface. Every tunable is defined once, with its provenance.
// ---------------------------------------------------------------------------
export const CONFIG = Object.freeze({
  // contract: task brief — D7 stopped reviewer-role pulls at this instant; the window starts here.
  WINDOW_START: "2026-10-08T02:00:00.000Z",
  // contract: pre-registered read definition — "within the next 5 user turns".
  TURNS_AFTER: 5,
  // contract: pre-registered decision rule — Wilson 95% two-sided.
  WILSON_Z: 1.959964,
  // contract: pre-registered decision rule — FAIL holds when the upper bound is below 5 pp.
  FAIL_BOUND: 0.05,
  // contract: pre-registered read definition — shell verbs that count as reading a named path.
  READER_VERBS: ["cat", "sed", "head", "tail", "less", "grep", "rg", "awk", "nl"],
  // contract: pre-registered read definition — tool names that read a path argument / run a shell command.
  READ_TOOLS: ["Read", "read"],
  BASH_TOOLS: ["Bash", "bash"],
  // contract: D6 ruling, mirrors packages/nana-knowledge — a YYYY-MM.md file directly inside a dir named "sessions".
  ARCHIVE_RE: /(^|\/)sessions\/\d{4}-\d{2}\.md$/,
  // chosen: a logged pull whose transcript injection is further than this from the log ts is "not located".
  //         The pi extension abandons the child after ~2 s, so a real injection sits within seconds.
  INJECTION_MATCH_SEC: 120,
  // chosen: a session idle this long is treated as finished when flagging still-open read windows.
  OPEN_WINDOW_GRACE_MIN: 30,
  // chosen: index decoys per shown pointer — 5:1 tightens the floor estimate at negligible cost.
  DECOY_INDEX_PER_POINTER: 5,
  // chosen: fixed seed so the index-decoy sample is reproducible.
  SEED: 20261009,
  // chosen: the window alone holds too few seat sessions to exercise the positive control; widen to Oct.
  POSITIVE_CONTROL_SINCE: "2026-10-01T00:00:00.000Z",
  // contract: seat startup rule (CLAUDE.md "Startup: read HANDOFF.md").
  POSITIVE_CONTROL_FILE: "HANDOFF.md",
  // contract: pull.log schema — the marker every injected block starts with.
  INJECTION_MARKER: "[nana:knowledge]",
  // contract: Claude Code harness prompts that are not human turns (pack README "Skips" list plus harness frames).
  CC_NON_HUMAN_PREFIXES: [
    "<task-notification", "<system-reminder", "[SYSTEM NOTIFICATION", "<command-", "<local-command",
    "This session is being continued", "[Request interrupted", "Caveat:",
  ],
});

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------
export function wilson(k, n, z = CONFIG.WILSON_Z) {
  if (n === 0) return { low: null, high: null };
  const p = k / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const centre = p + z2 / (2 * n);
  const half = z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));
  return { low: round((centre - half) / denom), high: round((centre + half) / denom) };
}
const round = (x) => Math.round(x * 1e6) / 1e6;
const rate = (k, n) => (n === 0 ? null : round(k / n));

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const isArchive = (p) => CONFIG.ARCHIVE_RE.test(p);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const PATH_CH = "A-Za-z0-9_.\\-";

/** Expand a tool's path argument to an absolute normalized path. */
export function expandPath(raw, cwd, home) {
  if (typeof raw !== "string" || raw === "") return null;
  let p = raw.trim().replace(/^['"]|['"]$/g, "");
  if (p.startsWith("@")) p = p.slice(1);
  if (p === "~" || p.startsWith("~/")) p = home + p.slice(1);
  else if (p.startsWith("$HOME/")) p = home + p.slice(5);
  else if (p.startsWith("${HOME}/")) p = home + p.slice(7);
  if (!path.isAbsolute(p)) {
    if (!cwd) return null;
    p = path.resolve(cwd, p);
  }
  return path.normalize(p);
}

/** Shell spellings of an absolute path, as seen from a cwd. */
export function spellings(abs, cwd, home) {
  const out = new Set([abs]);
  if (abs.startsWith(home + "/")) {
    const rel = abs.slice(home.length + 1);
    out.add("~/" + rel);
    out.add("$HOME/" + rel);
    out.add("${HOME}/" + rel);
  }
  if (cwd && abs.startsWith(cwd.replace(/\/$/, "") + "/")) {
    const rel = abs.slice(cwd.replace(/\/$/, "").length + 1);
    out.add(rel);
    out.add("./" + rel);
  }
  return [...out];
}

/** Repo-relative suffix: the path below the top-level directory under home ("docs/x.md" for ~/nana-pi/docs/x.md). */
export function repoSuffix(abs, home) {
  const rel = abs.startsWith(home + "/") ? abs.slice(home.length + 1) : abs.replace(/^\//, "");
  const parts = rel.split("/");
  return parts.length > 1 ? parts.slice(1).join("/") : parts[0];
}

const VERB_RE = new RegExp(`(^|[\\s;|&(\`$])(${CONFIG.READER_VERBS.join("|")})(?=\\s)`);
const hasReaderVerb = (cmd) => VERB_RE.test(cmd);
/** Whole-token substring match: not preceded by a path character (or "/" when strict), not followed by one. */
function containsToken(text, token, allowSlashBefore) {
  const before = allowSlashBefore ? `[^${PATH_CH}]` : `[^${PATH_CH}/]`;
  const re = new RegExp(`(^|${before})${escapeRe(token)}(?![${PATH_CH}/])`);
  return re.test(text);
}

// ---------------------------------------------------------------------------
// Transcript parsing → a uniform event list
// ---------------------------------------------------------------------------
function readJsonl(file) {
  const out = [];
  let bad = 0;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line) continue;
    try { out.push(JSON.parse(line)); } catch { bad++; }
  }
  return { entries: out, bad };
}

/** Parse pointer paths out of an injected block. */
export function parsePointerPaths(text) {
  const paths = [];
  for (const line of String(text).split("\n")) {
    if (!line.startsWith("- ")) continue;
    const f = line.split(" — ");
    if (f.length < 3) continue;
    let p = f[1];
    if (p.startsWith('"')) { try { p = JSON.parse(p); } catch { continue; } }
    paths.push(p);
  }
  return paths;
}

function textOf(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.filter((b) => b?.type === "text").map((b) => b.text).join("\n");
  return "";
}

/**
 * Events: {kind:"user"|"tool"|"inject", ts, cwd, ...}.
 * Claude Code: main thread only (isSidechain !== true); a human turn is a non-meta user entry whose text is not a harness frame.
 */
export function ccEvents(entries) {
  const ev = [];
  let sessionCwd = null;
  for (const e of entries) {
    if (e.isSidechain === true) continue;
    if (!sessionCwd && e.cwd) sessionCwd = e.cwd;
    if (e.type === "user" && !e.isMeta) {
      const c = e.message?.content;
      const isToolResult = Array.isArray(c) && c.some((b) => b?.type === "tool_result");
      if (isToolResult) continue;
      const t = textOf(c).trimStart();
      if (!t) continue;
      if (e.origin && e.origin.kind && e.origin.kind !== "human") continue;
      if (CONFIG.CC_NON_HUMAN_PREFIXES.some((p) => t.startsWith(p))) continue;
      ev.push({ kind: "user", ts: e.timestamp, cwd: e.cwd || sessionCwd, head: t.slice(0, 40) });
    } else if (e.type === "assistant") {
      for (const b of e.message?.content || []) {
        if (b?.type === "tool_use") ev.push({ kind: "tool", ts: e.timestamp, cwd: e.cwd || sessionCwd, name: b.name, input: b.input || {} });
      }
    } else if (e.type === "attachment" && e.attachment?.type === "hook_success" && e.attachment?.hookEvent === "UserPromptSubmit") {
      const c = String(e.attachment.content || "");
      if (c.includes(CONFIG.INJECTION_MARKER)) ev.push({ kind: "inject", ts: e.timestamp, paths: parsePointerPaths(c) });
    }
  }
  return { events: ev, cwd: sessionCwd };
}

export function piEvents(entries) {
  const ev = [];
  let sessionCwd = null;
  for (const e of entries) {
    if (e.type === "session") sessionCwd = e.cwd || sessionCwd;
    if (e.type === "custom_message" && e.customType === "nana-knowledge") {
      ev.push({ kind: "inject", ts: e.timestamp, paths: parsePointerPaths(textOf(e.content)) });
    } else if (e.type === "message" && e.message?.role === "user") {
      ev.push({ kind: "user", ts: e.timestamp, cwd: sessionCwd, head: textOf(e.message.content).trimStart().slice(0, 40) });
    } else if (e.type === "message" && e.message?.role === "assistant") {
      for (const b of e.message.content || []) {
        if (b?.type === "toolCall") ev.push({ kind: "tool", ts: e.timestamp, cwd: sessionCwd, name: b.name, input: b.arguments || {} });
      }
    }
  }
  return { events: ev, cwd: sessionCwd };
}

/** Tool calls from startIdx up to (not including) the (TURNS_AFTER+1)-th user turn after promptIdx. */
export function readWindow(events, promptIdx, startIdx) {
  let turns = 0;
  let end = events.length;
  for (let i = promptIdx + 1; i < events.length; i++) {
    if (events[i].kind !== "user") continue;
    turns++;
    if (turns === CONFIG.TURNS_AFTER + 1) { end = i; break; }
  }
  const tools = events.slice(startIdx + 1, end).filter((x) => x.kind === "tool");
  return { tools, turnsSeen: Math.min(turns, CONFIG.TURNS_AFTER) };
}

/**
 * Score one absolute target against a window's tool calls at three levels:
 * strict (pre-registered), worktree (repo-relative suffix, same tools/verbs), anyTool (suffix in any tool's input).
 */
export function scoreTarget(abs, tools, home) {
  const suffix = repoSuffix(abs, home);
  const res = { strict: false, worktree: false, anyTool: false };
  for (const t of tools) {
    const inp = t.input || {};
    if (CONFIG.READ_TOOLS.includes(t.name)) {
      const p = expandPath(inp.file_path ?? inp.path, t.cwd, home);
      if (p) {
        if (p === abs) res.strict = true;
        if (p === abs || p.endsWith("/" + suffix)) res.worktree = true;
      }
    } else if (CONFIG.BASH_TOOLS.includes(t.name) && typeof inp.command === "string" && hasReaderVerb(inp.command)) {
      const cmd = inp.command;
      if (spellings(abs, t.cwd, home).some((s) => containsToken(cmd, s, false))) res.strict = true;
      if (res.strict || containsToken(cmd, suffix, true)) res.worktree = true;
    }
    if (!res.anyTool) {
      const s = JSON.stringify(inp);
      if (containsToken(s, suffix, true)) res.anyTool = true;
    }
    if (res.strict && res.worktree && res.anyTool) break;
  }
  res.worktree ||= res.strict;
  res.anyTool ||= res.worktree;
  return res;
}

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------
function walk(dir, out = []) {
  let list;
  try { list = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const d of list) {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) walk(p, out);
    else if (d.isFile() && d.name.endsWith(".jsonl")) out.push(p);
  }
  return out;
}

function piSessionIndex(home) {
  const byId = new Map();
  for (const f of walk(path.join(home, ".pi/agent/sessions"))) {
    const m = /_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.jsonl$/.exec(f);
    if (!m) continue;
    if (!byId.has(m[1])) byId.set(m[1], []);
    byId.get(m[1]).push(f);
  }
  return byId;
}

function ccSessionIndex(home) {
  const byId = new Map();
  const root = path.join(home, ".claude/projects");
  let dirs = [];
  try { dirs = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()); } catch { return byId; }
  for (const d of dirs) {
    let files = [];
    try { files = fs.readdirSync(path.join(root, d.name)); } catch { continue; }
    for (const f of files) {
      if (!f.endsWith(".jsonl")) continue;
      const id = f.slice(0, -6);
      if (!byId.has(id)) byId.set(id, []);
      byId.get(id).push(path.join(root, d.name, f));
    }
  }
  return byId;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export function main({ home, now, since, until }) {
  const logPath = path.join(home, ".pi/agent/nana-knowledge/pull.log");
  const idxPath = path.join(home, ".pi/agent/nana-knowledge/index.db");
  const abs = (h) => (h.startsWith("~/") ? home + h.slice(1) : h);
  const short = (p) => (p.startsWith(home + "/") ? "~" + p.slice(home.length) : p);
  const sinceMs = Date.parse(since);
  const untilMs = Date.parse(until);

  // ---- pull.log
  const raw = fs.readFileSync(logPath, "utf8").split("\n").filter(Boolean);
  const rows = [];
  let badJson = 0;
  for (const l of raw) { try { rows.push(JSON.parse(l)); } catch { badJson++; } }

  // Every path ever shown per session (all time), for decoy exclusion.
  const shownBySession = new Map();
  for (const r of rows) {
    const k = r.session_id;
    if (!shownBySession.has(k)) shownBySession.set(k, new Set());
    for (const h of r.hits || []) shownBySession.get(k).add(abs(h));
  }

  const funnel = [];
  const step = (name, keep, before, note) => {
    const ptr = (rs) => rs.reduce((a, r) => a + r.pointers.length, 0);
    funnel.push({ step: name, rowsRemoved: before.length - keep.length, pointersRemoved: ptr(before) - ptr(keep), rowsLeft: keep.length, pointersLeft: ptr(keep), note });
    return keep;
  };

  let cur = rows.map((r) => ({ r, pointers: (r.hits || []).map(abs) }));
  funnel.push({ step: "all pull.log rows", rowsRemoved: 0, pointersRemoved: 0, rowsLeft: cur.length, pointersLeft: cur.reduce((a, x) => a + x.pointers.length, 0), note: `unparseable lines skipped: ${badJson}` });
  cur = step("outside window", cur.filter((x) => { const t = Date.parse(x.r.ts); return t >= sinceMs && t <= untilMs; }), cur, `window ${since} .. ${until}`);
  cur = step("not shown (reason present and not ok, or empty hits)", cur.filter((x) => (x.r.reason === undefined || x.r.reason === "ok") && x.pointers.length > 0), cur, "rows without a reason field mean ok (pack README)");
  cur = step("source missing or not pi/claude-code", cur.filter((x) => x.r.source === "pi" || x.r.source === "claude-code"), cur);
  // Pointer-level exclusion: archives (D6).
  const archiveRemoved = cur.reduce((a, x) => a + x.pointers.filter(isArchive).length, 0);
  cur = cur.map((x) => ({ ...x, archives: x.pointers.filter(isArchive), pointers: x.pointers.filter((p) => !isArchive(p)) }));
  funnel.push({ step: "archive pointers (D6, docs/sessions/YYYY-MM.md)", rowsRemoved: 0, pointersRemoved: archiveRemoved, rowsLeft: cur.length, pointersLeft: cur.reduce((a, x) => a + x.pointers.length, 0) });
  cur = step("row left with no pointer after archive removal", cur.filter((x) => x.pointers.length > 0), cur);
  cur = step("shortened path (contains …)", cur.filter((x) => !x.pointers.some((p) => p.includes("…"))), cur);

  // ---- locate transcripts and injections
  const piIdx = piSessionIndex(home);
  const ccIdx = ccSessionIndex(home);
  const sessionCache = new Map();
  const loadSession = (source, sid) => {
    const key = source + ":" + sid;
    if (sessionCache.has(key)) return sessionCache.get(key);
    const files = (source === "pi" ? piIdx : ccIdx).get(sid) || [];
    let val = null;
    for (const f of files) {
      try {
        const { entries } = readJsonl(f);
        const parsed = source === "pi" ? piEvents(entries) : ccEvents(entries);
        const lastTs = entries.reduce((m, e) => (e.timestamp && e.timestamp > m ? e.timestamp : m), "");
        val = { file: f, ...parsed, lastTs, userTurns: parsed.events.filter((x) => x.kind === "user").length };
        if (parsed.events.some((x) => x.kind === "inject")) break;
      } catch { /* unreadable: counted below as not found */ }
    }
    sessionCache.set(key, val);
    return val;
  };

  const withSession = cur.filter((x) => loadSession(x.r.source, x.r.session_id));
  cur = step("transcript not found or unreadable", withSession, cur);

  // Match each row to an injection event: nearest in time within INJECTION_MATCH_SEC whose pointer set equals the row's hits.
  const claimed = new Set();
  let hitSetMismatch = 0;
  const located = [];
  for (const x of cur) {
    const s = loadSession(x.r.source, x.r.session_id);
    const rowSet = new Set((x.r.hits || []).map(abs));
    let best = -1, bestGap = Infinity, bestExact = false;
    s.events.forEach((e, i) => {
      if (e.kind !== "inject" || claimed.has(s.file + "#" + i)) return;
      const gap = Math.abs(Date.parse(e.ts) - Date.parse(x.r.ts)) / 1000;
      if (gap > CONFIG.INJECTION_MATCH_SEC) return;
      const injSet = new Set(e.paths.map(abs));
      const exact = injSet.size === rowSet.size && [...rowSet].every((p) => injSet.has(p));
      if ((exact && !bestExact) || (exact === bestExact && gap < bestGap)) { best = i; bestGap = gap; bestExact = exact; }
    });
    if (best < 0) continue;
    if (!bestExact) hitSetMismatch++;
    claimed.add(s.file + "#" + best);
    let promptIdx = -1;
    for (let i = best; i >= 0; i--) if (s.events[i].kind === "user") { promptIdx = i; break; }
    located.push({ ...x, s, injIdx: best, promptIdx: promptIdx < 0 ? best : promptIdx, injGapSec: round(bestGap) });
  }
  cur = step("injection not found in transcript within match window", located, cur, `match window ±${CONFIG.INJECTION_MATCH_SEC}s; located rows whose injected pointer set differs from the logged hits: ${hitSetMismatch}`);

  // ---- score shown pointers
  const levels = ["strict", "worktree", "anyTool"];
  const blank = () => ({ rows: 0, sessions: new Set(), shown: 0, read: { strict: 0, worktree: 0, anyTool: 0 }, openWindowPointers: 0, reviewPromptRows: 0 });
  const arms = { pi: blank(), "claude-code": blank() };
  const readsFound = [];
  const windows = [];
  for (const x of cur) {
    const { tools, turnsSeen } = readWindow(x.s.events, x.promptIdx, x.injIdx);
    const idleMin = (now - Date.parse(x.s.lastTs)) / 60000;
    const open = turnsSeen < CONFIG.TURNS_AFTER && idleMin < CONFIG.OPEN_WINDOW_GRACE_MIN && x.s.userTurns > 1;
    const a = arms[x.r.source];
    a.rows++;
    a.sessions.add(x.r.session_id);
    windows.push({ x, tools });
    for (const p of x.pointers) {
      a.shown++;
      if (open) a.openWindowPointers++;
      const sc = scoreTarget(p, tools, home);
      for (const l of levels) if (sc[l]) a.read[l]++;
      if (sc.anyTool) readsFound.push({ runtime: x.r.source, session: x.r.session_id.slice(0, 8), path: short(p), strict: sc.strict, worktree: sc.worktree, anyTool: sc.anyTool });
    }
  }

  const summarize = (a) => {
    const out = { rows: a.rows, sessions: a.sessions.size, shownPointers: a.shown, openWindowPointers: a.openWindowPointers };
    for (const l of levels) out[l] = { readPointers: a.read[l], rate: rate(a.read[l], a.shown), wilson: wilson(a.read[l], a.shown) };
    return out;
  };
  const pooledArm = blank();
  for (const a of Object.values(arms)) {
    pooledArm.rows += a.rows; pooledArm.shown += a.shown; pooledArm.openWindowPointers += a.openWindowPointers;
    for (const s of a.sessions) pooledArm.sessions.add(s);
    for (const l of levels) pooledArm.read[l] += a.read[l];
  }

  // ---- decoy floor A: random index paths not shown in that session
  let indexPaths = [];
  try {
    const db = new DatabaseSync(`file:${idxPath}?immutable=1`, { readOnly: true });
    indexPaths = db.prepare("SELECT DISTINCT path FROM docs").all().map((r) => r.path).filter((p) => !isArchive(p));
    db.close();
  } catch (e) {
    indexPaths = [];
  }
  const rng = mulberry32(CONFIG.SEED);
  const decoyA = { trials: 0, read: { strict: 0, worktree: 0, anyTool: 0 }, found: [] };
  const decoyB = { trials: 0, read: { strict: 0, worktree: 0, anyTool: 0 }, found: [] };
  const note = (d, x, p, sc) => { if (sc.anyTool) d.found.push({ runtime: x.r.source, session: x.r.session_id.slice(0, 8), path: short(p), strict: sc.strict, worktree: sc.worktree }); };
  const windowHitPool = [...new Set(cur.flatMap((x) => x.pointers))];
  for (const { x, tools } of windows) {
    const exclude = shownBySession.get(x.r.session_id) || new Set();
    const pool = indexPaths.filter((p) => !exclude.has(p));
    const want = Math.min(pool.length, CONFIG.DECOY_INDEX_PER_POINTER * x.pointers.length);
    const picked = new Set();
    while (picked.size < want) picked.add(pool[Math.floor(rng() * pool.length)]);
    for (const p of picked) {
      decoyA.trials++;
      const sc = scoreTarget(p, tools, home);
      for (const l of levels) if (sc[l]) decoyA.read[l]++;
      note(decoyA, x, p, sc);
    }
    // decoy floor B (exhaustive): every other in-window shown path never shown in this session.
    for (const p of windowHitPool) {
      if (exclude.has(p)) continue;
      decoyB.trials++;
      const sc = scoreTarget(p, tools, home);
      for (const l of levels) if (sc[l]) decoyB.read[l]++;
      note(decoyB, x, p, sc);
    }
  }
  const sumDecoy = (d) => {
    const out = { trials: d.trials };
    for (const l of levels) out[l] = { reads: d.read[l], rate: rate(d.read[l], d.trials), wilson: wilson(d.read[l], d.trials) };
    out.readsFound = d.found;
    return out;
  };

  // ---- positive control: HANDOFF.md read at session start, same scanner
  const pcSince = Date.parse(CONFIG.POSITIVE_CONTROL_SINCE);
  const positive = { seat: { sessions: 0, handoffFileExists: 0, found: { strict: 0, worktree: 0, anyTool: 0 } }, pi: { sessions: 0, handoffFileExists: 0, found: { strict: 0, worktree: 0, anyTool: 0 } } };
  const pcRun = (bucket, parsed) => {
    const first = parsed.events.findIndex((e) => e.kind === "user");
    if (first < 0 || !parsed.cwd) return;
    if (Date.parse(parsed.events[first].ts) < pcSince) return;
    bucket.sessions++;
    const target = path.join(parsed.cwd, CONFIG.POSITIVE_CONTROL_FILE);
    if (fs.existsSync(target)) bucket.handoffFileExists++;
    const { tools } = readWindow(parsed.events, first, first);
    const sc = scoreTarget(target, tools, home);
    for (const l of levels) if (sc[l]) bucket.found[l]++;
  };
  for (const files of ccIdx.values()) {
    for (const f of files) {
      let st;
      try { st = fs.statSync(f); } catch { continue; }
      if (st.mtimeMs < pcSince) continue;
      try { pcRun(positive.seat, ccEvents(readJsonl(f).entries)); } catch { /* unreadable: skipped */ }
    }
  }
  const pcPiSessions = new Set();
  for (const x of cur) if (x.r.source === "pi" && !pcPiSessions.has(x.s.file)) { pcPiSessions.add(x.s.file); pcRun(positive.pi, { events: x.s.events, cwd: x.s.cwd }); }

  // ---- decision
  const pooled = summarize(pooledArm);
  const upper = pooled.strict.wilson.high;
  const scannerOk = positive.seat.found.strict > 0;
  const decision = !scannerOk ? "indeterminate" : upper === null ? "indeterminate" : upper < CONFIG.FAIL_BOUND ? "FAIL-by-bound" : "needs-randomized-arm";

  return {
    window: { since, until, now: new Date(now).toISOString() },
    config: { ...CONFIG, ARCHIVE_RE: String(CONFIG.ARCHIVE_RE) },
    funnel,
    perRuntime: { pi: summarize(arms.pi), "claude-code": summarize(arms["claude-code"]) },
    pooled,
    readsFound,
    reviewPromptRows: cur.filter((x) => /^review\b/i.test(x.s.events[x.promptIdx]?.head ?? "")).length,
    positiveControl: positive,
    decoy: { indexRandom: { indexPaths: indexPaths.length, ...sumDecoy(decoyA) }, otherWindowHits: { pool: windowHitPool.length, ...sumDecoy(decoyB) } },
    decision: { rule: "pooled strict Wilson-95 upper < FAIL_BOUND ⇒ FAIL-by-bound; else needs-randomized-arm; positive control must find ≥1 seat HANDOFF read", pooledStrictUpper: upper, scannerOk, verdict: decision },
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function arg(name, dflt) {
  const i = process.argv.indexOf(name);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const now = Date.now();
  try {
    const out = main({ home: arg("--home", os.homedir()), now, since: arg("--since", CONFIG.WINDOW_START), until: arg("--until", new Date(now).toISOString()) });
    process.stdout.write(JSON.stringify(out, null, 2) + "\n");
  } catch (e) {
    process.stderr.write(`uplift: ${e.message}\n`);
    process.exit(1);
  }
}
