// uplift-check.mjs — independent skeptic join for P(read | shown) of knowledge-pull pointers.
// READ-ONLY on everything outside this directory. No model calls, no network.
// Writes only ./check-out.json next to this script.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const H = os.homedir();
const LOG = path.join(H, ".pi/agent/nana-knowledge/pull.log");
const INDEX = path.join(H, ".pi/agent/nana-knowledge/index.db");
const PI_SESS = path.join(H, ".pi/agent/sessions");
const CC_PROJ = path.join(H, ".claude/projects");
const WIN_START = "2026-10-08T02:00:00.000Z";
const RUN_AT = new Date().toISOString();
const ARCHIVE = /(^|\/)docs\/sessions\/\d{4}-\d{2}\.md$/;
const VERB = /\b(cat|sed|head|tail|less|grep|rg|awk|nl)\b/;
const NEXT_TURNS = 5;
const MATCH_SKEW_MS = 120_000;
const SEED = 4242;
const DECOYS_PER_POINTER = 5;
const Z = 1.959963984540054;

// ---------- helpers ----------
const wilson = (k, n) => {
	if (n === 0) return [0, 1];
	const p = k / n, z2 = Z * Z;
	const den = 1 + z2 / n, c = p + z2 / (2 * n);
	const h = Z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n));
	return [Math.max(0, (c - h) / den), Math.min(1, (c + h) / den)];
};
const r6 = (x) => Math.round(x * 1e6) / 1e6;
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = mulberry32(SEED);
const readJsonl = (f) => {
	const out = [];
	for (const l of fs.readFileSync(f, "utf8").split("\n")) { if (!l.trim()) continue; try { out.push(JSON.parse(l)); } catch { out.push({ __bad: true }); } }
	return out;
};
const expandHome = (p) => {
	if (typeof p !== "string") return null;
	let s = p.trim().replace(/^@/, "");
	s = s.replace(/^\$\{HOME\}(?=\/|$)/, H).replace(/^\$HOME(?=\/|$)/, H).replace(/^~(?=\/|$)/, H);
	return s;
};
const resolveAgainst = (p, base) => {
	const e = expandHome(p);
	if (!e) return null;
	if (path.isAbsolute(e)) return path.normalize(e);
	if (!base) return null;
	return path.resolve(base, e);
};
const RP = new Map();
const realOr = (p) => { if (RP.has(p)) return RP.get(p); let v; try { v = fs.realpathSync(p); } catch { v = p; } RP.set(p, v); return v; };
const toAbs = (display) => path.normalize(display.replace(/^~(?=\/)/, H).replace(/:\d+$/, ""));
const shortp = (p) => p.replace(H, "~");

// Tokenize a shell command into word-ish tokens, stripping quotes; split on operators and '='.
function shellTokens(cmd) {
	const raw = cmd.split(/[\s;|&<>()`]+/);
	const toks = [];
	for (let t of raw) {
		t = t.replace(/^['"]+|['"]+$/g, "").replace(/['"]/g, "");
		if (!t) continue;
		toks.push(t);
		if (t.includes("=")) toks.push(t.slice(t.lastIndexOf("=") + 1));
		if (/:\d+(:\d+)?$/.test(t)) toks.push(t.replace(/:\d+(:\d+)?$/, ""));
	}
	return toks;
}
function cdTargets(cmd, cwd) {
	const out = [];
	const re = /(?:^|[;&|(\s])(?:cd|pushd)\s+("[^"]+"|'[^']+'|[^\s;&|)]+)/g;
	let m;
	while ((m = re.exec(cmd))) { const r = resolveAgainst(m[1].replace(/^['"]|['"]$/g, ""), cwd); if (r) out.push(r); }
	const gc = /\bgit\s+-C\s+("[^"]+"|'[^']+'|\S+)/g;
	while ((m = gc.exec(cmd))) { const r = resolveAgainst(m[1].replace(/^['"]|['"]$/g, ""), cwd); if (r) out.push(r); }
	return out;
}
const globToRe = (g) => new RegExp("^" + g.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, "\u0000").replace(/\*/g, "[^/]*").replace(/\u0000/g, ".*").replace(/\?/g, "[^/]") + "$");

// Repo-relative suffix of a target under ~/<repo>/..., for worktree-equivalent matching.
function repoRel(abs) {
	const rel = path.relative(H, abs).split(path.sep);
	return rel.length >= 3 ? { repo: rel[0], rel: rel.slice(1).join("/") } : null;
}
function isWorktreeEquivalent(candidate, target) {
	if (candidate === target) return false;
	const rr = repoRel(target);
	if (!rr) return false;
	if (!candidate.endsWith("/" + rr.rel)) return false;
	const root = candidate.slice(0, -(rr.rel.length + 1));
	// another checkout of the same repo: ~/<repo>-wt/<lane> or a dir with a .git FILE pointing at the repo
	if (root.startsWith(path.join(H, rr.repo + "-wt") + "/")) return true;
	try { const g = fs.readFileSync(path.join(root, ".git"), "utf8"); if (g.includes(path.join(H, rr.repo, ".git"))) return true; } catch { /* gone */ }
	return /-wt\//.test(root);
}

// ---------- normalized tool-call extraction ----------
// Each call: {kind: 'read'|'bash'|'grep'|'other', arg, cmd, cwd, idx, ts, argText}
function piCalls(entries, cwd) {
	const calls = [];
	entries.forEach((e, idx) => {
		if (e.type !== "message" || e.message?.role !== "assistant" || !Array.isArray(e.message.content)) return;
		for (const c of e.message.content) {
			if (c.type !== "toolCall") continue;
			const a = c.arguments || {};
			const n = String(c.name || "").toLowerCase();
			const kind = n === "read" ? "read" : n === "bash" ? "bash" : n === "grep" ? "grep" : "other";
			calls.push({ kind, name: c.name, arg: a.path ?? a.file_path, cmd: a.command, cwd, idx, ts: e.timestamp, argText: JSON.stringify(a) });
		}
	});
	return calls;
}
function ccCalls(entries) {
	const calls = [];
	entries.forEach((e, idx) => {
		if (e.type !== "assistant" || e.isSidechain || !Array.isArray(e.message?.content)) return;
		for (const c of e.message.content) {
			if (c.type !== "tool_use") continue;
			const a = c.input || {};
			const kind = c.name === "Read" ? "read" : c.name === "Bash" ? "bash" : c.name === "Grep" ? "grep" : "other";
			calls.push({ kind, name: c.name, arg: a.file_path ?? a.path, cmd: a.command, cwd: e.cwd, idx, ts: e.timestamp, argText: JSON.stringify(a) });
		}
	});
	return calls;
}

// Classify one call against one target. Returns the strongest level matched:
// 'strict' (pre-registered rule), 'grepTool', 'equiv' (worktree copy), 'mention' (basename anywhere in args), or null.
function classify(call, target, extraBases = []) {
	const tReal = realOr(target);
	const same = (p) => p && (p === target || realOr(p) === tReal);
	const bases = [call.cwd, ...extraBases].filter(Boolean);
	if (call.kind === "read" || call.kind === "grep") {
		for (const b of bases.length ? bases : [null]) {
			const r = resolveAgainst(call.arg, b);
			if (same(r)) return { level: call.kind === "read" ? "strict" : "grepTool", how: spelling(call.arg) };
			if (r && isWorktreeEquivalent(r, target)) return { level: "equiv", how: spelling(call.arg) };
		}
	}
	if (call.kind === "bash" && typeof call.cmd === "string") {
		const cmd = call.cmd;
		const allBases = [...bases, ...cdTargets(cmd, call.cwd)];
		const toks = shellTokens(cmd);
		let hit = null, eq = null, glob = null;
		for (const t of toks) {
			for (const b of allBases.length ? allBases : [null]) {
				const r = resolveAgainst(t, b);
				if (!r) continue;
				if (same(r)) { hit = spelling(t); break; }
				if (!eq && isWorktreeEquivalent(r, target)) eq = spelling(t);
				if (!glob && /[*?]/.test(t) && globToRe(r).test(target)) glob = spelling(t);
			}
			if (hit) break;
		}
		if (hit && VERB.test(cmd)) return { level: "strict", how: "bash:" + hit };
		if (hit) return { level: "mention", how: "bash-noverb:" + hit };
		if (glob && VERB.test(cmd)) return { level: "glob", how: "bash-glob:" + glob };
		if (eq && VERB.test(cmd)) return { level: "equiv", how: "bash:" + eq };
	}
	if (call.argText && call.argText.includes(path.basename(target))) return { level: "mention", how: call.kind + "-basename" };
	return null;
}
function spelling(p) {
	if (typeof p !== "string") return "?";
	const s = p.replace(/^['"@]+/, "");
	if (s.startsWith(H)) return "abs";
	if (s.startsWith("~")) return "tilde";
	if (s.startsWith("$HOME") || s.startsWith("${HOME}")) return "$HOME";
	if (s.startsWith("/")) return "abs-other";
	return "rel";
}
const RANK = { strict: 5, grepTool: 4, glob: 3, equiv: 2, mention: 1 };
function bestOver(calls, target, extraBases) {
	let best = null;
	for (const c of calls) {
		const r = classify(c, target, extraBases);
		if (r && (!best || RANK[r.level] > RANK[best.level])) best = { ...r, ts: c.ts };
		if (best?.level === "strict") break;
	}
	return best;
}

// ---------- turn detection ----------
const piIsUser = (e) => e.type === "message" && e.message?.role === "user";
function ccHumanText(e) {
	if (e.type !== "user" || e.isMeta || e.isSidechain || e.isCompactSummary || e.isVisibleInTranscriptOnly) return null;
	const c = e.message?.content;
	let text = null;
	if (typeof c === "string") text = c;
	else if (Array.isArray(c)) {
		if (c.some((x) => x.type === "tool_result")) return null;
		const t = c.find((x) => x.type === "text");
		if (!t) return null;
		text = t.text;
	}
	if (text == null) return null;
	const s = text.trimStart();
	if (/^<(task-notification|command-name|command-message|local-command-stdout|local-command-stderr|bash-stdout|bash-stderr|user-memory-input)/.test(s)) return null;
	if (/^\[Request interrupted/.test(s)) return null;
	if (/^This session is being continued/.test(s)) return null;
	if (/^Caveat: The messages below/.test(s)) return null;
	return s;
}

// ---------- 1. pull.log funnel ----------
const logLines = fs.readFileSync(LOG, "utf8").split("\n").filter((l) => l.trim());
const funnel = { rows: logLines.length, pointers: 0, unparseable: 0 };
const all = [];
for (const l of logLines) { try { const r = JSON.parse(l); all.push(r); funnel.pointers += (r.hits || []).length; } catch { funnel.unparseable++; } }
const inWin = all.filter((r) => r.ts >= WIN_START);
funnel.inWindowRows = inWin.length;
funnel.inWindowPointers = inWin.reduce((s, r) => s + (r.hits || []).length, 0);
const shownRows = inWin.filter((r) => (r.reason === undefined || r.reason === "ok") && Array.isArray(r.hits) && r.hits.length > 0);
funnel.notShownRows = inWin.length - shownRows.length;
funnel.reasonField = inWin.filter((r) => "reason" in r).length;
funnel.sourceCounts = {};
for (const r of shownRows) funnel.sourceCounts[String(r.source)] = (funnel.sourceCounts[String(r.source)] || 0) + 1;
funnel.archiveDropped = 0; funnel.elidedDropped = 0; funnel.locSuffix = 0;
for (const r of shownRows) {
	r.kept = [];
	for (const h of r.hits) {
		if (h.includes("…")) { funnel.elidedDropped++; continue; }
		if (/:\d+$/.test(h)) funnel.locSuffix++;
		if (ARCHIVE.test(h.replace(/:\d+$/, ""))) { funnel.archiveDropped++; continue; }
		r.kept.push(h);
	}
}
funnel.rowsEmptiedByArchive = shownRows.filter((r) => r.kept.length === 0).length;

// ---------- 2. transcript index ----------
const piFiles = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith(".jsonl")) piFiles.push(p); } })(PI_SESS);
const piById = new Map();
for (const f of piFiles) { const m = /_([0-9a-f-]{36})\.jsonl$/.exec(f); if (m) { if (!piById.has(m[1])) piById.set(m[1], []); piById.get(m[1]).push(f); } }
const ccMain = [];
for (const d of fs.readdirSync(CC_PROJ)) { const dd = path.join(CC_PROJ, d); let st; try { st = fs.statSync(dd); } catch { continue; } if (!st.isDirectory()) continue; for (const f of fs.readdirSync(dd)) if (f.endsWith(".jsonl")) ccMain.push(path.join(dd, f)); }
const ccById = new Map();
for (const f of ccMain) { const id = path.basename(f, ".jsonl"); if (!ccById.has(id)) ccById.set(id, []); ccById.get(id).push(f); }

const cache = new Map();
function loadSession(row) {
	const key = row.source + ":" + row.session_id;
	if (cache.has(key)) return cache.get(key);
	let s = null;
	if (row.source === "pi") {
		const fl = piById.get(row.session_id) || [];
		if (fl.length === 1) {
			const entries = readJsonl(fl[0]);
			const head = entries.find((e) => e.type === "session");
			const cwd = head?.cwd || row.cwd;
			const userIdx = entries.map((e, i) => (piIsUser(e) ? i : -1)).filter((i) => i >= 0);
			const firstText = (() => { const u = entries[userIdx[0]]; const c = u?.message?.content; return typeof c === "string" ? c : Array.isArray(c) ? (c.find((x) => x.type === "text")?.text || "") : ""; })();
			const name = entries.find((e) => e.type === "session_info")?.name || "";
			s = { kind: "pi", file: fl[0], files: fl.length, entries, cwd, headId: head?.id, userIdx, calls: piCalls(entries, cwd), firstText, name };
		} else s = { kind: "pi", missing: true, files: fl.length };
	} else {
		const fl = ccById.get(row.session_id) || [];
		if (fl.length === 1) {
			const entries = readJsonl(fl[0]);
			const userIdx = entries.map((e, i) => (ccHumanText(e) != null ? i : -1)).filter((i) => i >= 0);
			s = { kind: "cc", file: fl[0], files: fl.length, entries, cwd: row.cwd, userIdx, calls: ccCalls(entries) };
		} else s = { kind: "cc", missing: true, files: fl.length };
	}
	cache.set(key, s);
	return s;
}

// find the injection entry for a row
function findInjection(s, row) {
	const t = Date.parse(row.ts);
	let best = null;
	s.entries.forEach((e, i) => {
		let text = null;
		if (s.kind === "pi" && e.type === "custom_message" && e.customType === "nana-knowledge") text = typeof e.content === "string" ? e.content : JSON.stringify(e.content);
		if (s.kind === "cc" && e.type === "attachment" && e.attachment?.type?.startsWith("hook") && e.attachment?.hookEvent === "UserPromptSubmit") {
			const a = e.attachment; const c = [a.content, a.stdout].filter((x) => typeof x === "string").join("\n");
			if (c.includes("[nana:knowledge]")) text = c;
		}
		if (s.kind === "cc" && !text && e.type === "user" && e.isMeta) {
			const c = JSON.stringify(e.message?.content || ""); if (c.includes("[nana:knowledge]")) text = c;
		}
		if (!text) return;
		const dt = Math.abs(Date.parse(e.timestamp) - t);
		if (dt > MATCH_SKEW_MS) return;
		const allIn = row.hits.every((h) => text.includes(h));
		if (!best || (allIn && !best.allIn) || (allIn === best.allIn && dt < best.dt)) best = { i, dt, allIn, text };
	});
	return best;
}

// window [start, end) over entry indices
function windowFor(s, injIdx) {
	const priorUsers = s.userIdx.filter((i) => i < injIdx);
	const promptIdx = priorUsers.length ? priorUsers[priorUsers.length - 1] : null;
	const after = s.userIdx.filter((i) => i > injIdx);
	const oneprompt = s.kind === "pi" && s.userIdx.length === 1;
	const wideEnd = oneprompt ? s.entries.length : (after.length > NEXT_TURNS ? after[NEXT_TURNS] : s.entries.length);
	const narrowEnd = oneprompt ? s.entries.length : (after.length > NEXT_TURNS - 1 ? after[NEXT_TURNS - 1] : s.entries.length);
	const open = !oneprompt && after.length <= NEXT_TURNS;
	return { promptIdx, start: injIdx, wideEnd, narrowEnd, laterTurns: after.length, oneprompt, open };
}
const callsIn = (s, a, b) => s.calls.filter((c) => c.idx > a && c.idx < b);

// ---------- 3. join + score ----------
const pairs = [];
const joinIssues = [];
const sessionShown = new Map(); // key -> Set(abs)
for (const r of shownRows) { const k = r.source + ":" + r.session_id; if (!sessionShown.has(k)) sessionShown.set(k, new Set()); for (const h of r.hits) sessionShown.get(k).add(toAbs(h)); }
for (const r of shownRows) {
	if (r.kept.length === 0) continue;
	if (r.source !== "pi" && r.source !== "claude-code") { joinIssues.push({ ts: r.ts, why: "source " + r.source }); continue; }
	const s = loadSession(r);
	if (s.missing) { joinIssues.push({ ts: r.ts, sid: r.session_id.slice(0, 8), why: "transcript files=" + s.files }); continue; }
	const inj = findInjection(s, r);
	if (!inj) { joinIssues.push({ ts: r.ts, sid: r.session_id.slice(0, 8), why: "injection not found" }); continue; }
	if (!inj.allIn) joinIssues.push({ ts: r.ts, sid: r.session_id.slice(0, 8), why: "injection hits mismatch" });
	const w = windowFor(s, inj.i);
	const wide = callsIn(s, inj.i, w.wideEnd), narrow = callsIn(s, inj.i, w.narrowEnd), rest = callsIn(s, inj.i, s.entries.length);
	const role = s.kind === "pi" ? (/^Do the work/.test(s.firstText) ? "worker" : /^Review/.test(s.firstText) ? "reviewer" : "pi-other") : "seat";
	for (const h of r.kept) {
		const target = toAbs(h);
		const bw = bestOver(wide, target), bn = bestOver(narrow, target), br = bestOver(rest, target);
		pairs.push({ runtime: r.source, sid: r.session_id.slice(0, 8), sidFull: r.session_id, ts: r.ts, role, path: h, target, oneprompt: w.oneprompt, open: w.open, laterTurns: w.laterTurns, injDtMs: inj.dt, wide: bw?.level || null, wideHow: bw?.how || null, narrow: bn?.level || null, restOfSession: br?.level || null, s, w, injIdx: inj.i });
	}
}

function tally(list, field, levels) {
	const n = list.length; const k = list.filter((p) => levels.includes(p[field])).length; const [lo, hi] = wilson(k, n);
	return { n, k, rate: r6(n ? k / n : 0), wilsonLow: r6(lo), wilsonHigh: r6(hi) };
}
const L_STRICT = ["strict"], L_GREP = ["strict", "grepTool"], L_GLOB = ["strict", "grepTool", "glob"], L_EQ = ["strict", "grepTool", "glob", "equiv"], L_ANY = ["strict", "grepTool", "glob", "equiv", "mention"];
const byRt = (rt) => pairs.filter((p) => p.runtime === rt);
const result = { runAt: RUN_AT, window: `${WIN_START} .. ${RUN_AT}`, funnel, joinIssues, pairs: pairs.length };
result.perRuntime = {};
for (const rt of ["pi", "claude-code"]) {
	const l = byRt(rt);
	result.perRuntime[rt] = { strictWide: tally(l, "wide", L_STRICT), strictNarrow: tally(l, "narrow", L_STRICT), plusGrepTool: tally(l, "wide", L_GREP), plusGlob: tally(l, "wide", L_GLOB), plusWorktreeEquiv: tally(l, "wide", L_EQ), anyMention: tally(l, "wide", L_ANY), strictRestOfSession: tally(l, "restOfSession", L_STRICT), equivRestOfSession: tally(l, "restOfSession", L_EQ) };
}
result.pooled = { strictWide: tally(pairs, "wide", L_STRICT), strictNarrow: tally(pairs, "narrow", L_STRICT), plusGrepTool: tally(pairs, "wide", L_GREP), plusGlob: tally(pairs, "wide", L_GLOB), plusWorktreeEquiv: tally(pairs, "wide", L_EQ), anyMention: tally(pairs, "wide", L_ANY), strictRestOfSession: tally(pairs, "restOfSession", L_STRICT), equivRestOfSession: tally(pairs, "restOfSession", L_EQ) };
result.nonStrictHits = pairs.filter((p) => p.wide || p.restOfSession).map((p) => ({ runtime: p.runtime, sid: p.sid, role: p.role, path: p.path, wide: p.wide, how: p.wideHow, rest: p.restOfSession }));
// clustering views
const sessKeys = new Set(pairs.map((p) => p.runtime + ":" + p.sidFull));
const sessRead = new Set(pairs.filter((p) => L_STRICT.includes(p.wide)).map((p) => p.runtime + ":" + p.sidFull));
const [, sHi] = wilson(sessRead.size, sessKeys.size);
const distinctPaths = new Set(pairs.map((p) => p.path));
const pathRead = new Set(pairs.filter((p) => L_STRICT.includes(p.wide)).map((p) => p.path));
const [, dHi] = wilson(pathRead.size, distinctPaths.size);
const pathCounts = {}; for (const p of pairs) pathCounts[p.path] = (pathCounts[p.path] || 0) + 1;
result.clustering = { sessions: sessKeys.size, sessionsWithStrictRead: sessRead.size, sessionLevelWilsonHigh: r6(sHi), distinctPaths: distinctPaths.size, distinctPathsRead: pathRead.size, distinctPathWilsonHigh: r6(dHi), topPathCounts: Object.entries(pathCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([p, c]) => [path.basename(p), c]) };
result.roles = {}; for (const p of pairs) result.roles[p.runtime + "/" + p.role] = (result.roles[p.runtime + "/" + p.role] || 0) + 1;
result.windowShape = { oneprompt: pairs.filter((p) => p.oneprompt).length, multiTurnClosed: pairs.filter((p) => !p.oneprompt && !p.open).length, multiTurnOpen: pairs.filter((p) => !p.oneprompt && p.open).map((p) => ({ sid: p.sid, laterTurns: p.laterTurns, path: path.basename(p.path) })) };
result.injectionSkewMaxMs = Math.max(...pairs.map((p) => p.injDtMs));

// ---------- 4. unlogged injections (pulls the log does not know about) ----------
const loggedKeys = new Set(inWin.map((r) => r.session_id));
let unloggedPi = 0, unloggedCc = 0;
const winStartMs = Date.parse(WIN_START);
for (const f of piFiles) {
	if (fs.statSync(f).mtimeMs < winStartMs) continue;
	const txt = fs.readFileSync(f, "utf8"); if (!txt.includes("[nana:knowledge]")) continue;
	const m = /_([0-9a-f-]{36})\.jsonl$/.exec(f); const id = m?.[1];
	for (const e of readJsonl(f)) if (e.type === "custom_message" && e.customType === "nana-knowledge" && e.timestamp >= WIN_START && !loggedKeys.has(id)) unloggedPi++;
}
for (const f of ccMain) {
	if (fs.statSync(f).mtimeMs < winStartMs) continue;
	const txt = fs.readFileSync(f, "utf8"); if (!txt.includes("[nana:knowledge]")) continue;
	const id = path.basename(f, ".jsonl");
	for (const e of readJsonl(f)) if (e.type === "attachment" && e.attachment?.hookEvent === "UserPromptSubmit" && e.timestamp >= WIN_START && JSON.stringify(e.attachment).includes("[nana:knowledge]") && !e.isSidechain) {
		const t = Date.parse(e.timestamp);
		const logged = inWin.some((r) => r.session_id === id && Math.abs(Date.parse(r.ts) - t) < MATCH_SKEW_MS);
		if (!logged) unloggedCc++;
	}
}
result.unloggedInjectionsInWindow = { pi: unloggedPi, claudeCode: unloggedCc };

// ---------- 5. positive controls ----------
function handoffControl(kind, sinceIso) {
	const out = { sessions: 0, found: 0, foundEquiv: 0, spellings: {}, skippedNoHandoffEvidence: 0 };
	const list = kind === "cc" ? ccMain : piFiles;
	for (const f of list) {
		let st; try { st = fs.statSync(f); } catch { continue; }
		if (st.mtimeMs < Date.parse(sinceIso)) continue;
		let entries; try { entries = readJsonl(f); } catch { continue; }
		let s, cwd, firstIdx, firstTs;
		if (kind === "cc") {
			const userIdx = entries.map((e, i) => (ccHumanText(e) != null ? i : -1)).filter((i) => i >= 0);
			if (!userIdx.length) continue;
			firstIdx = userIdx[0]; firstTs = entries[firstIdx].timestamp; cwd = entries[firstIdx].cwd;
			if (!firstTs || firstTs < sinceIso) continue;
			s = { kind, entries, userIdx, calls: ccCalls(entries) };
		} else {
			const head = entries.find((e) => e.type === "session"); cwd = head?.cwd;
			const userIdx = entries.map((e, i) => (piIsUser(e) ? i : -1)).filter((i) => i >= 0);
			if (!userIdx.length || !cwd) continue;
			firstIdx = userIdx[0]; firstTs = entries[firstIdx].timestamp;
			if (!firstTs || firstTs < sinceIso) continue;
			s = { kind: "pi", entries, userIdx, calls: piCalls(entries, cwd) };
		}
		if (!cwd) continue;
		const target = path.join(cwd, "HANDOFF.md");
		// only sessions whose cwd is a project that carries (or carried) a HANDOFF.md
		const exists = fs.existsSync(target);
		const mentioned = s.calls.some((c) => c.argText.includes("HANDOFF.md"));
		if (!exists && !mentioned) { out.skippedNoHandoffEvidence++; continue; }
		out.sessions++;
		const after = s.userIdx.filter((i) => i > firstIdx);
		const oneprompt = kind === "pi" && s.userIdx.length === 1;
		const end = oneprompt ? entries.length : (after.length > NEXT_TURNS ? after[NEXT_TURNS] : entries.length);
		const b = bestOver(callsIn(s, firstIdx - 1, end), target);
		if (b?.level === "strict") { out.found++; out.spellings[b.how] = (out.spellings[b.how] || 0) + 1; }
		if (b && L_EQ.includes(b.level)) out.foundEquiv++;
	}
	return out;
}
result.positiveControl = {
	seatHandoffSince1001: handoffControl("cc", "2026-10-01T00:00:00.000Z"),
	piHandoffInWindow: handoffControl("pi", WIN_START),
};
// Scanner-sensitivity control on the SAME 12 target files: any main-thread strict read of them anywhere
// in sessions active in the window, outside any pull window. Proves the matcher fires on these exact paths.
{
	const targets = [...distinctPaths].map(toAbs);
	const found = {};
	const scan = (calls, sid) => { for (const t of targets) for (const c of calls) { const r = classify(c, t); if (r?.level === "strict") { const k = path.basename(t); found[k] = found[k] || []; if (found[k].length < 3) found[k].push(sid + ":" + r.how); break; } } };
	for (const f of ccMain) { if (fs.statSync(f).mtimeMs < winStartMs) continue; const e = readJsonl(f); scan(ccCalls(e).filter((c) => c.ts >= WIN_START), path.basename(f, ".jsonl").slice(0, 8)); }
	for (const f of piFiles) { if (fs.statSync(f).mtimeMs < winStartMs) continue; const e = readJsonl(f); const h = e.find((x) => x.type === "session"); scan(piCalls(e, h?.cwd).filter((c) => c.ts >= WIN_START), "pi:" + (h?.id || "").slice(0, 8)); }
	result.positiveControl.sameTargetsReadAnywhereInWindow = found;
}

// ---------- 6. decoy floors ----------
let indexPaths = [];
try {
	const outp = execFileSync("/usr/bin/sqlite3", ["-init", "/dev/null", `file:${INDEX}?immutable=1`, "select distinct path from docs;"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
	indexPaths = outp.split("\n").filter(Boolean).filter((p) => !ARCHIVE.test(p));
} catch (e) { result.indexError = String(e.message).slice(0, 120); }
const decoy = { pool: indexPaths.length, n: 0, strict: 0, eq: 0, any: 0, strictExamples: [] };
for (const p of pairs) {
	const shown = sessionShown.get(p.runtime + ":" + p.sidFull) || new Set();
	const wide = callsIn(p.s, p.injIdx, p.w.wideEnd);
	for (let k = 0; k < DECOYS_PER_POINTER; k++) {
		let d; let guard = 0;
		do { d = indexPaths[Math.floor(rand() * indexPaths.length)]; } while (shown.has(d) && ++guard < 50);
		decoy.n++;
		const b = bestOver(wide, d);
		if (b?.level === "strict") { decoy.strict++; if (decoy.strictExamples.length < 5) decoy.strictExamples.push(p.sid + ":" + shortp(d).split("/").slice(0, 2).join("/") + "/…" + path.basename(d)); }
		if (b && L_EQ.includes(b.level)) decoy.eq++;
		if (b) decoy.any++;
	}
}
decoy.strictWilson = wilson(decoy.strict, decoy.n).map(r6);
decoy.eqWilson = wilson(decoy.eq, decoy.n).map(r6);
// exhaustive cross-decoy: every other in-window shown path never shown in that session
const cross = { n: 0, strict: 0, eq: 0, strictCases: [] };
const seenInj = new Set();
for (const p of pairs) {
	const ik = p.runtime + ":" + p.sidFull + ":" + p.injIdx;
	if (seenInj.has(ik)) continue; seenInj.add(ik);
	const shownInSess = sessionShown.get(p.runtime + ":" + p.sidFull) || new Set();
	const wide = callsIn(p.s, p.injIdx, p.w.wideEnd);
	for (const d of distinctPaths) {
		const t = toAbs(d); if (shownInSess.has(t)) continue;
		cross.n++;
		const b = bestOver(wide, t);
		if (b?.level === "strict") { cross.strict++; cross.strictCases.push(p.runtime + ":" + p.sid + ":" + path.basename(t) + ":" + b.how); }
		if (b && L_EQ.includes(b.level)) cross.eq++;
	}
}
cross.strictWilson = wilson(cross.strict, cross.n).map(r6);
result.decoy = { random: decoy, cross };

// ---------- 7. reviewer-shaped rows, archive check ----------
result.rolesBySession = {};
for (const p of pairs) result.rolesBySession[p.role] = (result.rolesBySession[p.role] || new Set()).add(p.sidFull);
for (const k of Object.keys(result.rolesBySession)) result.rolesBySession[k] = result.rolesBySession[k].size;
result.archiveLeftInPairs = pairs.filter((p) => ARCHIVE.test(p.target)).length;
const piExReviewer = pairs.filter((p) => p.role !== "reviewer");
result.pooledExReviewer = tally(piExReviewer, "wide", L_STRICT);

// ---------- 8. matcher self-test (synthetic calls; proves each normalization path fires) ----------
{
	const T = path.join(H, "nana-pi/docs/hardening-plan-2026-10-06.md");
	const WT = path.join(H, "nana-pi-wt/t9-x");
	const cases = [
		[{ kind: "read", arg: T, cwd: WT }, "strict"],
		[{ kind: "read", arg: "~/nana-pi/docs/hardening-plan-2026-10-06.md", cwd: WT }, "strict"],
		[{ kind: "read", arg: "@~/nana-pi/docs/hardening-plan-2026-10-06.md", cwd: WT }, "strict"],
		[{ kind: "read", arg: "docs/hardening-plan-2026-10-06.md", cwd: path.join(H, "nana-pi") }, "strict"],
		[{ kind: "read", arg: "../../nana-pi/docs/hardening-plan-2026-10-06.md", cwd: WT }, "strict"],
		[{ kind: "read", arg: "docs/hardening-plan-2026-10-06.md", cwd: WT }, "equiv"],
		[{ kind: "bash", cmd: "sed -n '1,80p' \"$HOME/nana-pi/docs/hardening-plan-2026-10-06.md\"", cwd: WT }, "strict"],
		[{ kind: "bash", cmd: "cd ~/nana-pi && head -50 docs/hardening-plan-2026-10-06.md", cwd: WT }, "strict"],
		[{ kind: "bash", cmd: "rg -n R-601 ${HOME}/nana-pi/docs/hardening-plan-2026-10-06.md:12", cwd: WT }, "strict"],
		[{ kind: "bash", cmd: "cat ~/nana-pi/docs/hardening-*.md", cwd: WT }, "glob"],
		[{ kind: "bash", cmd: "git grep -n x -- ':!docs/hardening-plan-2026-10-06.md'", cwd: WT }, "mention"],
		[{ kind: "bash", cmd: "ls ~/nana-pi/docs/hardening-plan-2026-10-06.md", cwd: WT }, "mention"],
		[{ kind: "grep", arg: T, cwd: WT }, "grepTool"],
	];
	result.selfTest = cases.map(([c, want]) => { c.argText = JSON.stringify({ path: c.arg, command: c.cmd }); const got = classify(c, T)?.level || null; return { want, got, ok: want === got }; });
	result.selfTestPass = result.selfTest.every((x) => x.ok);
}
// ---------- 9. sidechain / subagent reads of the 12 targets in the window (outside the main-thread rule) ----------
{
	const targets = [...distinctPaths].map(toAbs);
	const side = {};
	const walk = (d) => { let es; try { es = fs.readdirSync(d, { withFileTypes: true }); } catch { return; } for (const e of es) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith(".jsonl") && path.dirname(p) !== path.join(CC_PROJ, path.basename(path.dirname(p)))) {
		let st; try { st = fs.statSync(p); } catch { continue; } if (st.mtimeMs < winStartMs) continue;
		const es2 = readJsonl(p); const calls = [];
		es2.forEach((x, idx) => { if (x.type !== "assistant" || !Array.isArray(x.message?.content)) return; for (const c of x.message.content) if (c.type === "tool_use") { const a = c.input || {}; calls.push({ kind: c.name === "Read" ? "read" : c.name === "Bash" ? "bash" : c.name === "Grep" ? "grep" : "other", arg: a.file_path ?? a.path, cmd: a.command, cwd: x.cwd, idx, ts: x.timestamp, argText: JSON.stringify(a) }); } });
		for (const t of targets) for (const c of calls) { if (c.ts < WIN_START) continue; const r = classify(c, t); if (r?.level === "strict") { const k = path.basename(t); side[k] = (side[k] || 0) + 1; break; } }
	} } };
	for (const d of fs.readdirSync(CC_PROJ)) walk(path.join(CC_PROJ, d));
	result.sidechainStrictReadsOfTargetsInWindow = side;
}
// ---------- 10. open windows: live sessions whose read window has not closed ----------
{
	const now = Date.now();
	const open = [];
	for (const p of pairs) {
		const lastTs = p.s.entries.map((e) => e.timestamp).filter(Boolean).pop();
		const lastE = p.s.entries[p.s.entries.length - 1];
		const unfinished = p.s.kind === "pi" && !(lastE?.type === "message" && lastE.message?.stopReason === "stop");
		const recent = lastTs && now - Date.parse(lastTs) < 30 * 60 * 1000;
		if ((p.open) || (p.oneprompt && unfinished && recent)) open.push({ runtime: p.runtime, sid: p.sidFull.slice(0, 13), path: path.basename(p.path), reason: p.open ? "fewer than 5 later turns" : "pi worker still running" });
	}
	result.openWindows = { count: open.length, list: open };
	const closed = pairs.filter((p) => !open.some((o) => o.sid === p.sidFull.slice(0, 13) && o.path === path.basename(p.path)));
	result.closedOnly = tally(closed, "wide", L_STRICT);
	let flip = 0; while (wilson(flip, pairs.length)[1] < 0.05) flip++;
	result.readsNeededToReachBound = flip;
}
for (const p of pairs) { delete p.s; delete p.w; }
fs.writeFileSync(path.join(HERE, "check-out.json"), JSON.stringify(result, null, 1));
const brief = { ...result }; delete brief.pairs;
console.log(JSON.stringify(brief, null, 1));
