import { mdToHtml } from "./md.js";

import {
	stripAnsi, el, contentBlocks, renderImage, argSummary,
	toolRow, setToolStreaming, renderDiff, finishToolRow as finishToolRowCore,
	buildDialog, openEventStream, rpcCall,
} from "./desk-client.mjs";

const $ = (id) => document.getElementById(id);
const HOME = "~";

const short = (p) => (p || "").replace(/^(\/(Users|home)\/[^/]+|[A-Za-z]:\\Users\\[^\\]+)/, HOME);
const basename = (p) => (p || "").split(/[\\/]/).pop();
const when = (ms) => {
	const d = new Date(ms);
	const today = new Date().toDateString() === d.toDateString();
	return today
		? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
		: d.toLocaleDateString([], { month: "short", day: "numeric" });
};
const fmtTok = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(n ?? 0));
const fmtCost = (c) => (c >= 0.995 ? `$${c.toFixed(2)}` : `$${(c ?? 0).toFixed(3)}`);

// ── view state ──
let selected = null; // {kind: "live"|"hist", id?, file?, cwd?}
let stream = null;
let L = null; // live session state
let statsTimer = null;

// ── stage generation ──
// The pane, `L` and the editor are ONE set of globals shared by every session,
// so any await can land after the user has moved on. Every async continuation
// captures the generation it started in; `stale(g)` means "the stage changed
// under me" and the continuation returns without touching anything. One counter,
// bumped in clearStage() — the single point every select/close/reopen goes
// through. No per-site flags.
let stageGen = 0;
const stale = (g) => g !== stageGen;

function newLiveState(id, cwd) {
	return {
		id, cwd,
		streaming: false,
		state: null, // last get_state data
		ctx: { container: $("transcript"), toolRows: new Map(), summarize: deskSummarize, decorate: deskDecorate },
		liveEls: [], // elements created from deltas since last message_start
		optimisticUserEls: [], // user bubbles appended at send(), awaiting their echoed message_end
		currentBubble: null,
		attachments: [], // {data, mimeType, name}
		commands: null, // get_commands cache
		files: null,
		retryNote: null,
		ctxEstimate: null, // estimatedTokensAfter from the last compaction; pi reports percent:null until the next reply
		helloSeen: false, // a SECOND desk_hello is a reconnect, not the first attach
		pendingBashEvents: new Map(), // bash id → events that arrived before the row existed
		renderSeq: 0, // bumped by renderMessages; tells an in-flight POST the transcript was rebuilt
	};
}

// ── rail ──
// Overlap-guarded + timed out: if the server or connection pool stalls, ticks
// must not pile queued requests behind the stall (that turns a hiccup into a
// permanently wedged desk).
let railBusy = false;
async function refreshRail() {
	if (railBusy) return;
	railBusy = true;
	try {
		await refreshRailInner();
	} catch {
		// next tick retries
	} finally {
		railBusy = false;
	}
}

async function refreshRailInner() {
	const t = () => AbortSignal.timeout(10000);
	const [live, groups] = await Promise.all([
		fetch("/api/live", { signal: t() }).then((r) => r.json()),
		fetch("/api/sessions", { signal: t() }).then((r) => r.json()),
	]);

	const states = await Promise.all(
		live.map((c) =>
			c.state === "running"
				? fetch(`/api/session/${c.id}/rpc`, {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({ command: { type: "get_state" } }),
						signal: t(),
					})
						.then((r) => r.json())
						.then((r) => r.data)
						.catch(() => null)
				: Promise.resolve(null),
		),
	);

	const liveList = $("live-list");
	liveList.innerHTML = "";
	for (let i = 0; i < live.length; i++) {
		const c = live[i];
		const st = states[i];
		const b = document.createElement("button");
		b.className = `live-row ${c.state}` + (selected?.kind === "live" && selected.id === c.id ? " selected" : "");
		const label = st?.sessionName || short(c.cwd);
		const flags = [
			st?.isStreaming ? "streaming" : c.state === "running" ? "idle" : c.state,
			c.openDialogs ? `❗${c.openDialogs}` : "",
			c.queued ? `⧗${c.queued}` : "",
		]
			.filter(Boolean)
			.join(" · ");
		b.innerHTML = `<span class="lamp">●</span><span class="cwd"></span><span class="flags"></span>`;
		b.querySelector(".cwd").textContent = label;
		b.querySelector(".flags").textContent = flags;
		if (st?.isStreaming) b.classList.add("streaming");
		if (c.openDialogs) b.classList.add("attention");
		b.onclick = () => openLive(c.id, c.cwd);
		liveList.appendChild(b);
	}

	const list = $("session-list");
	list.innerHTML = "";
	let count = 0;
	const pref = collapsedPref();
	for (let gi = 0; gi < groups.length; gi++) {
		const g = groups[gi];
		count += g.sessions.length;
		// default: only the most recently active workspace starts open
		const isOpen = pref[g.cwd] ?? gi === 0;
		const h = document.createElement("button");
		h.className = "ws-head" + (isOpen ? "" : " closed");
		h.innerHTML = `<span class="chev"></span><span class="wname"></span><span class="wcount"></span>`;
		h.querySelector(".chev").textContent = isOpen ? "▾" : "▸";
		h.querySelector(".wname").textContent = short(g.cwd);
		h.querySelector(".wcount").textContent = g.sessions.length;
		h.title = g.cwd;
		h.onclick = () => {
			const p = collapsedPref();
			p[g.cwd] = !isOpen;
			localStorage.setItem("desk-collapsed", JSON.stringify(p));
			refreshRail();
		};
		list.appendChild(h);
		if (!isOpen) continue;
		for (const s of g.sessions) {
			const b = document.createElement("button");
			b.className = "sess" + (selected?.kind === "hist" && selected.file === s.file ? " selected" : "");
			b.innerHTML = `<span class="when">${when(s.mtime)}</span><span class="title"></span><span class="row-rename" title="Rename">✎</span>`;
			b.querySelector(".title").textContent = s.name || s.title || "(untitled)";
			b.title = s.title || "(untitled)";
			b.onclick = () => openHistorical(s.file, g.cwd);
			b.querySelector(".row-rename").onclick = (ev) => {
				ev.stopPropagation();
				renameHistorical(s);
			};
			list.appendChild(b);
		}
	}
	$("stats").textContent = `${groups.length} workspaces · ${count} sessions · ${live.length} live`;
	deriveTitles(groups);
}

// ── background title derivation for unnamed sessions ──
// One batched submit; the SERVER queues and derives (one headless pi call per
// session, ever — names persist in the session files) and results surface via
// the normal 15s refresh. No held browser connections.
const titleSubmitted = new Set();
function deriveTitles(groups) {
	const pref = collapsedPref();
	const files = [];
	for (let gi = 0; gi < groups.length; gi++) {
		if (!(pref[groups[gi].cwd] ?? gi === 0)) continue;
		for (const s of groups[gi].sessions) {
			if (!s.name && s.title && !titleSubmitted.has(s.file)) {
				titleSubmitted.add(s.file);
				files.push(s.file);
			}
		}
	}
	if (!files.length) return;
	fetch("/api/derive-titles", { method: "POST", headers: JH, body: JSON.stringify({ files: files.slice(0, 30) }) }).catch(() => {});
}

// Native folder picker: start, then poll with short requests (a held request
// while a dialog sits open would eat a browser connection — the frozen-desk bug).
async function pickDir() {
	const start = await fetch("/api/pick-dir", { method: "POST" }).then((r) => r.json());
	if (start.error) {
		toast(start.error, "warning");
		return null;
	}
	for (let i = 0; i < 900; i++) {
		await new Promise((r) => setTimeout(r, 700));
		let r;
		try {
			r = await fetch(`/api/pick-dir?id=${start.id}`, { signal: AbortSignal.timeout(5000) }).then((r) => r.json());
		} catch {
			continue;
		}
		if (r.pending) continue;
		if (r.error) {
			toast(r.error, "warning");
			return null;
		}
		return r.cancelled ? null : r.path;
	}
	return null;
}

function collapsedPref() {
	// {cwd: true=open, false=closed}; unset falls to the default rule
	try {
		return JSON.parse(localStorage.getItem("desk-collapsed")) || {};
	} catch {
		return {};
	}
}

async function renameHistorical(s) {
	const name = prompt("Session name:", s.name || s.title || "");
	if (name === null) return;
	const r = await fetch("/api/rename", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ file: s.file, name }),
	}).then((r) => r.json());
	if (r.error) return toast(r.error, "error");
	refreshRail();
}

// ── rpc helper ──
async function rpc(command) {
	if (!L) throw new Error("no live session");
	return rpcCall(`/api/session/${L.id}`, command);
}

// ── toasts ──
function toast(message, type = "info", ms) {
	const el = document.createElement("div");
	el.className = `toast ${type}`;
	el.textContent = message;
	$("toasts").appendChild(el);
	setTimeout(() => el.remove(), ms || (type === "error" ? 10000 : 5000));
}

// ── message rendering (shared by snapshot, live authoritative, historical) ──
function isPinned(container) {
	return container.scrollHeight - container.scrollTop - container.clientHeight < 60;
}
function pin(container) {
	container.scrollTop = container.scrollHeight;
}

function addCopyBtn(bubble, text) {
	const b = el("button", "copy-btn", "copy");
	b.onclick = (ev) => {
		ev.stopPropagation();
		navigator.clipboard.writeText(text);
		b.textContent = "copied";
		setTimeout(() => (b.textContent = "copy"), 1200);
	};
	bubble.appendChild(b);
}

// ── subagent tool: human-readable card instead of raw args/output JSON ──
function subagentArgSummary(a) {
	if (!a || typeof a !== "object") return "";
	if (typeof a.agent === "string") return [a.agent, a.task].filter(Boolean).join(" — ").slice(0, 160);
	if (Array.isArray(a.chain)) {
		const names = a.chain.map((s) =>
			s?.agent || (Array.isArray(s?.parallel) ? `[${s.parallel.map((p) => p?.agent || "?").join(" | ")}]` : s?.expand ? "expand" : "?"));
		return `chain: ${names.join(" → ")}`.slice(0, 160);
	}
	if (typeof a.action === "string") return a.action.slice(0, 160);
	if (a.workflowScript || a.workflowScriptPath) return "workflow";
	return argSummary(a);
}

const fmtDur = (ms) => (ms >= 60000 ? `${Math.floor(ms / 60000)}m${String(Math.round((ms % 60000) / 1000)).padStart(2, "0")}s` : `${Math.round(ms / 1000)}s`);

// merge Details.results (per-child rows) with Details.progress (live snapshots)
function subagentChildren(d) {
	const byIndex = new Map();
	for (const p of d.progress || []) byIndex.set(p.index ?? 0, p);
	const rows = d.results?.length
		? d.results
		: [...byIndex.values()].map((p) => ({ index: p.index, agent: p.agent, task: p.task, progress: p }));
	return rows.map((r) => {
		const p = r.progress || byIndex.get(r.index) || r.progressSummary || {};
		return {
			agent: r.agent || p.agent || "?",
			task: r.task || p.task || "",
			model: r.model || p.model || "",
			status: p.status || (r.detached ? "detached" : r.exitCode === undefined ? "running" : r.exitCode === 0 ? "completed" : "failed"),
			tokens: p.tokens || 0,
			toolCount: p.toolCount || 0,
			durationMs: p.durationMs || 0,
			activity: p.currentTool ? `${p.currentTool}${p.currentToolArgs ? ` ${p.currentToolArgs}` : ""}` : "",
			error: p.error || r.error || "",
		};
	});
}

const SUB_GLYPH = { running: "⚙", pending: "○", completed: "✓", failed: "✗", detached: "⇢" };
function setSubagentProgress(row, d, autoOpen) {
	let strip = row.querySelector(".sub-strip");
	if (!strip) {
		strip = el("div", "sub-strip");
		row.querySelector(".tool-body").prepend(strip);
	}
	strip.innerHTML = "";
	for (const c of subagentChildren(d)) {
		const line = el("div", "sub-child");
		const markCls = c.status === "running" ? "mark spin" : c.status === "completed" ? "mark ok" : c.status === "failed" ? "mark bad" : "mark";
		line.appendChild(el("span", markCls, SUB_GLYPH[c.status] || "○"));
		line.appendChild(el("b", "sub-name", c.agent));
		if (c.model) line.appendChild(el("span", "dim", c.model));
		const stats = [c.toolCount > 0 && `${c.toolCount} tools`, c.tokens > 0 && `${fmtTok(c.tokens)} tok`, c.durationMs > 0 && fmtDur(c.durationMs)]
			.filter(Boolean).join(" · ");
		if (stats) line.appendChild(el("span", "dim", `· ${stats}`));
		strip.appendChild(line);
		if (c.task) strip.appendChild(el("div", "sub-task", c.task.length > 200 ? `${c.task.slice(0, 200)}…` : c.task));
		if (c.status === "running" && c.activity) strip.appendChild(el("div", "sub-task", `⎿ ${c.activity.slice(0, 140)}`));
		if (c.error) strip.appendChild(el("div", "sub-task err", c.error.slice(0, 200)));
	}
	if (autoOpen && !row.dataset.userToggled) {
		row.querySelector(".tool-body").hidden = false;
		row.querySelector(".caret").textContent = "▾";
	}
}

// Desk render ctx: the shared core plus the desk's subagent card (one-line
// agent/task summary instead of raw args; the live tracking strip on results).
const deskSummarize = (name, args) => (name === "subagent" ? subagentArgSummary(args) : argSummary(args));
const deskDecorate = (row, m) => {
	if (m.toolName === "subagent" && m.details && (m.details.results?.length || m.details.progress?.length))
		setSubagentProgress(row, m.details, false);
};
function finishToolRow(ctx, m) {
	return finishToolRowCore({ summarize: deskSummarize, decorate: deskDecorate, ...ctx }, m);
}

function bashRow(ctx, id, command) {
	let row = id ? ctx.toolRows.get(`bash:${id}`) : null;
	if (row && !row.isConnected) row = null;
	if (!row) {
		row = el("div", "bash-card");
		row.innerHTML = `<div class="bash-head"><span class="mark spin">⚙</span><code class="bcmd"></code><span class="bexit"></span></div><pre class="bout" hidden></pre>`;
		ctx.container.appendChild(row);
		if (id) ctx.toolRows.set(`bash:${id}`, row);
	}
	row.querySelector(".bcmd").textContent = `! ${command}`;
	row.dataset.bcmd = command;
	if (id) row.dataset.bashId = id;
	return row;
}

// A reconnect resync can rebuild the transcript while a bash POST is still in
// flight, and pi's own record of that command comes back with it — already
// FINISHED and with no RPC id, which is the key rows are stored under. Claim
// that row rather than adding a second card for the same command. Newest match
// wins; two identical commands in one transcript render the same thing either
// way, so picking the wrong one is invisible.
function adoptHistoryBashRow(ctx, command) {
	const rows = [...ctx.container.querySelectorAll(".bash-card")].filter(
		(r) => r.dataset.bcmd === command && !r.dataset.bashId && !r.querySelector(".mark")?.classList.contains("spin"),
	);
	return rows.length ? rows[rows.length - 1] : null;
}

// One window for everything a bash card holds or shows: the streamed tail, a
// buffered event's retained text, and a finished result's rendered output. The
// number means the same thing in all three places.
const BASH_CHARS = 20000;
const tail = (s) => (s.length > BASH_CHARS ? s.slice(-BASH_CHARS) : s);

function appendBashDelta(row, delta) {
	const out = row.querySelector(".bout");
	out.hidden = false;
	out.textContent = tail(out.textContent + delta);
}

// The POST that creates a bash row races the child's output for it: the server
// hands the command to the child BEFORE it writes the HTTP response (server.mjs,
// `action === "bash"`), so a chunk — or the whole result — can reach the page
// over SSE while `fetch(...).json()` is still resolving. Events for an id with
// no row yet are held in arrival order and flushed when the row appears, so
// nothing is dropped and nothing spins forever. Bounded on both axes: an id
// whose POST never produced a row (an error, a session switch) must not grow.
const BASH_BUFFER_IDS = 8;
const BASH_BUFFER_EVENTS = 200;
// Every text an event can carry counts against the per-id budget, not just the
// streamed delta: a `desk_bash_result` carries the WHOLE captured output (and an
// error string), so counting deltas alone let eight unknown ids retain eight
// stdout-cap-sized results. Oversized text is cut on the way IN, so one event
// can never exceed the budget on its own.
const bashEventChars = (e) => (e.delta?.length || 0) + (e.data?.output?.length || 0) + String(e.error || "").length;
function clipBashEvent(e) {
	if (e.delta?.length > BASH_CHARS) return { ...e, delta: tail(e.delta) };
	if (e.data?.output?.length > BASH_CHARS) return { ...e, data: { ...e.data, output: tail(e.data.output), truncated: true } };
	return e;
}
function bufferBashEvent(id, e) {
	if (!id) return;
	const buf = L.pendingBashEvents;
	const list = buf.get(id) || [];
	list.push(clipBashEvent(e));
	let chars = list.reduce((n, x) => n + bashEventChars(x), 0);
	while (list.length > BASH_BUFFER_EVENTS || (chars > BASH_CHARS && list.length > 1)) chars -= bashEventChars(list.shift());
	buf.set(id, list);
	while (buf.size > BASH_BUFFER_IDS) buf.delete(buf.keys().next().value);
}
function flushBashEvents(row, id) {
	const list = L.pendingBashEvents.get(id);
	if (!list) return;
	L.pendingBashEvents.delete(id);
	for (const e of list) {
		if (e.type === "bash_execution_update") appendBashDelta(row, e.delta);
		else finishBashRow(row, e.data, e.success ? undefined : e.error || "failed");
	}
}

function finishBashRow(row, { output, exitCode, cancelled, truncated } = {}, error) {
	const mark = row.querySelector(".mark");
	const failed = error || cancelled || (exitCode !== 0 && exitCode !== undefined);
	mark.className = `mark ${failed ? "bad" : "ok"}`;
	mark.textContent = failed ? "✗" : "✓";
	// A result carries the WHOLE captured output; the streaming path already keeps
	// only the last BASH_CHARS, so render the same window here rather than putting
	// an unbounded string in the DOM. A cut we made is reported like the server's.
	const cut = output !== undefined && output.length > BASH_CHARS;
	if (output !== undefined) {
		const out = row.querySelector(".bout");
		out.hidden = !output;
		out.textContent = tail(output);
	}
	row.querySelector(".bexit").textContent = error
		? String(error)
		: cancelled
			? "cancelled"
			: `exit ${exitCode}${truncated || cut ? " · truncated" : ""}`;
}

function noteRow(ctx, text, cls = "") {
	const n = el("div", `msg note ${cls}`, text);
	ctx.container.appendChild(n);
	return n;
}

function expandableNote(ctx, label, body) {
	const d = el("details", "note-details");
	const s = el("summary", "", label);
	d.appendChild(s);
	const pre = el("div", "note-body");
	pre.textContent = body || "";
	d.appendChild(pre);
	ctx.container.appendChild(d);
	return d;
}

function appendMessage(m, ctx) {
	const container = ctx.container;
	switch (m.role) {
		case "user": {
			const bubble = el("div", "msg user");
			for (const b of contentBlocks(m.content)) {
				if (b.type === "text") bubble.appendChild(el("div", "", b.text));
				else if (b.type === "image") bubble.appendChild(renderImage(b));
			}
			container.appendChild(bubble);
			return bubble;
		}
		case "assistant": {
			const group = el("div", "amsg");
			for (const b of m.content || []) {
				if (b.type === "thinking") {
					const d = el("details", "thinking-details");
					d.appendChild(el("summary", "", "thinking"));
					d.appendChild(el("div", "thinking-body", b.thinking));
					group.appendChild(d);
				} else if (b.type === "text") {
					const bubble = el("div", "msg assistant md");
					bubble.innerHTML = mdToHtml(b.text);
					addCopyBtn(bubble, b.text);
					group.appendChild(bubble);
				} else if (b.type === "toolCall") {
					const sub = { ...ctx, container: group };
					toolRow(sub, b.id, b.name, b.arguments);
				}
			}
			if (m.stopReason === "error") group.appendChild(el("div", "msg error", m.errorMessage || "model error"));
			else if (m.stopReason === "aborted") group.appendChild(el("div", "msg note", "— aborted —"));
			container.appendChild(group);
			return group;
		}
		case "toolResult":
			return finishToolRow(ctx, m);
		case "bashExecution": {
			const row = bashRow(ctx, null, m.command);
			finishBashRow(row, m);
			return row;
		}
		case "custom":
			if (m.display === false) return null;
			return expandableNote(
				ctx,
				`⧉ ${m.customType || "extension"}`,
				contentBlocks(m.content).filter((b) => b.type === "text").map((b) => b.text).join("\n"),
			);
		case "compactionSummary":
			return expandableNote(ctx, `— context compacted (${fmtTok(m.tokensBefore)} before) —`, m.summary);
		case "branchSummary":
			return expandableNote(ctx, "— branch summary —", m.summary);
		default:
			return null;
	}
}

function renderMessages(messages) {
	const container = L.ctx.container;
	container.innerHTML = "";
	L.ctx.toolRows.clear();
	L.liveEls = [];
	L.optimisticUserEls = [];
	L.currentBubble = null;
	for (const m of messages) appendMessage(m, L.ctx);
	L.renderSeq++;
	pin(container);
}

// ── live session: header / footer ──
function setChip(state) {
	const chip = $("chip");
	chip.className = `chip ${state.replace(/[^a-z]/g, "")}`;
	chip.textContent = state;
}

async function refreshState() {
	if (!L) return;
	const g = stageGen;
	let s;
	try {
		s = await rpc({ type: "get_state" });
	} catch {
		return;
	}
	if (stale(g) || !L) return; // this state describes a session we have left
	L.state = s;
	L.streaming = !!s.isStreaming;
	$("sess-name").textContent = s.sessionName || "(unnamed)";
	$("sess-file").textContent = s.sessionFile ? basename(s.sessionFile) : "(ephemeral)";
	$("model-chip").textContent = s.model ? `${s.model.provider}/${s.model.id}` : "no model";
	$("think-chip").textContent = `think: ${s.thinkingLevel || "off"}`;
	if (!s.isStreaming && !s.isCompacting) setChip("idle");
	else if (s.isCompacting) setChip("compacting");
	else setChip("running");
}

async function refreshStats() {
	if (!L) return;
	const g = stageGen;
	try {
		const d = await rpc({ type: "get_session_stats" });
		if (stale(g) || !L) return; // these numbers belong to a session we have left
		const cu = d.contextUsage;
		$("foot-tokens").textContent = `in ${fmtTok(d.tokens.input)} · out ${fmtTok(d.tokens.output)} · cache ${fmtTok(d.tokens.cacheRead)}`;
		$("foot-cost").textContent = fmtCost(d.cost);
		$("foot-msgs").textContent = `${d.totalMessages} msgs`;
		if (cu && cu.percent != null) {
			L.ctxEstimate = null; // real usage is known again
			$("ctx-meter").hidden = false;
			$("ctx-fill").style.width = `${Math.min(100, cu.percent)}%`;
			$("ctx-fill").className = `meter-fill${cu.percent > 80 ? " hot" : ""}`;
			$("ctx-label").textContent = `${Math.round(cu.percent)}% of ${fmtTok(cu.contextWindow)}`;
		} else if (cu && cu.contextWindow && L.ctxEstimate != null) {
			// post-compaction: pi reports percent:null until the next reply — show
			// the compaction's own estimate instead of a stale or empty meter
			const pct = Math.min(100, (L.ctxEstimate / cu.contextWindow) * 100);
			$("ctx-meter").hidden = false;
			$("ctx-fill").style.width = `${pct}%`;
			$("ctx-fill").className = "meter-fill";
			$("ctx-label").textContent = `~${Math.round(pct)}% of ${fmtTok(cu.contextWindow)} (est)`;
		} else {
			$("ctx-meter").hidden = true;
			$("ctx-label").textContent = "";
		}
	} catch {}
}

function startStatsPoll() {
	stopStatsPoll();
	statsTimer = setInterval(() => {
		if (L?.streaming) {
			refreshStats();
			refreshState();
		}
	}, 6000);
}
function stopStatsPoll() {
	if (statsTimer) clearInterval(statsTimer);
	statsTimer = null;
}

async function resync() {
	if (!L) return;
	const g = stageGen;
	try {
		const d = await rpc({ type: "get_messages" });
		if (stale(g) || !L) return; // never paint one session's messages into another's pane
		renderMessages(d.messages || []);
	} catch {}
	if (stale(g) || !L) return;
	refreshState();
	refreshStats();
}

// ── dialogs (extension UI) ──
function showDialog(req) {
	if (!L || document.querySelector(`[data-ui-id="${CSS.escape(req.id)}"]`)) return;
	const wrap = el("div", "dialog");
	wrap.dataset.uiId = req.id;
	const answer = (body) => {
		fetch(`/api/session/${L.id}/ui-response`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ id: req.id, ...body }),
		});
		wrap.remove();
	};
	wrap.appendChild(buildDialog(req, answer));
	$("dialogs").appendChild(wrap);
}

function dismissDialog(id) {
	document.querySelector(`[data-ui-id="${CSS.escape(id)}"]`)?.remove();
}

// ── statuses / widgets / queue ──
function renderStatuses(statuses) {
	const box = $("status-chips");
	box.innerHTML = "";
	for (const [k, v] of Object.entries(statuses || {})) {
		const c = el("span", "status-chip", stripAnsi(v));
		c.title = k;
		box.appendChild(c);
	}
}

// pi-subagents publishes its async-jobs widget to RPC clients as one line of
// "PI_SUBAGENT_ASYNC_JSON:{...}" — a machine snapshot the client is expected to
// decode and render itself (the TUI draws its own tree from the same data)
const SUB_WIDGET_PREFIX = "PI_SUBAGENT_ASYNC_JSON:";
const SUB_STATE_GLYPH = { queued: "○", running: "⚙", complete: "✓", failed: "✗", rejected: "✗", partial: "◐", paused: "⏸", stopped: "■" };
// Finished runs linger briefly, then the desk clears them on its own clock.
// pi-subagents' cleanup predicate misses `partial`/`rejected` (async-job-tracker
// terminalStatus), so such runs stay in every future snapshot forever — observed
// as a partial reviewer pinned above the editor for a day. The TUI clears
// finished runs after ~10s; the desk keeps them a little longer, then prunes.
const SUB_TERMINAL = new Set(["complete", "failed", "rejected", "partial", "stopped", "paused"]);
const SUB_LINGER_MS = 60000;
const subEndedAt = (node, snap) => node.endedAt ?? node.updatedAt ?? snap.generatedAt ?? 0;

function subagentWidgetBox(snap) {
	const now = Date.now();
	const runs = (snap.runs || []).filter((r) => !(SUB_TERMINAL.has(r.state) && now - subEndedAt(r, snap) > SUB_LINGER_MS));
	if (!runs.length && !snap.omitted?.runs) return null;
	const box = el("div", "widget sub-widget");
	const walk = (node, depth) => {
		const st = node.state;
		const line = el("div", "sub-child");
		line.style.paddingLeft = `${depth * 14}px`;
		const markCls = st === "running" ? "mark spin" : st === "complete" ? "mark ok" : st === "failed" || st === "rejected" ? "mark bad" : "mark";
		line.appendChild(el("span", markCls, SUB_STATE_GLYPH[st] || "○"));
		line.appendChild(el("b", "sub-name", node.label || node.kind || "run"));
		const a = node.activity || {};
		const stats = [
			st !== "running" && st,
			a.turnCount > 0 && `${a.turnCount} turns`,
			a.toolCount > 0 && `${a.toolCount} tools`,
			st === "running" && node.startedAt && fmtDur(now - node.startedAt),
			SUB_TERMINAL.has(st) && node.startedAt && node.endedAt && fmtDur(node.endedAt - node.startedAt),
		].filter(Boolean).join(" · ");
		if (stats) line.appendChild(el("span", "dim", `· ${stats}`));
		box.appendChild(line);
		if (st === "running" && a.currentTool) box.appendChild(el("div", "sub-task", `⎿ ${a.currentTool}`));
		for (const c of node.children || []) walk(c, depth + 1);
	};
	for (const r of runs) walk(r, 0);
	if (snap.omitted?.runs) box.appendChild(el("div", "sub-task", `… +${snap.omitted.runs} more`));
	// self-clear: lingering finished runs must expire even if no further widget
	// event ever arrives (the stuck-state case sends none)
	const expiries = runs.filter((r) => SUB_TERMINAL.has(r.state)).map((r) => subEndedAt(r, snap) + SUB_LINGER_MS - now);
	if (expiries.length) {
		setTimeout(() => {
			if (!box.isConnected) return;
			const fresh = subagentWidgetBox(snap);
			if (fresh) {
				fresh.title = box.title;
				box.replaceWith(fresh);
			} else box.remove();
		}, Math.max(1000, Math.min(...expiries) + 250));
	}
	return box;
}

function widgetBox(key, lines) {
	const enc = (lines || []).find((l) => typeof l === "string" && l.startsWith(SUB_WIDGET_PREFIX));
	if (enc) {
		try {
			const box = subagentWidgetBox(JSON.parse(enc.slice(SUB_WIDGET_PREFIX.length)));
			if (box) box.title = key;
			return box; // null = every finished run expired — render nothing
		} catch {
			// fall through to raw rendering
		}
	}
	const box = el("pre", "widget");
	box.title = key;
	box.textContent = (lines || []).map(stripAnsi).join("\n");
	return box;
}

function renderWidgets(widgets) {
	const above = $("widgets-above");
	const below = $("widgets-below");
	above.innerHTML = "";
	below.innerHTML = "";
	for (const [k, w] of Object.entries(widgets || {})) {
		const b = widgetBox(k, w.lines);
		if (b) (w.placement === "belowEditor" ? below : above).appendChild(b);
	}
}

function renderQueue(q) {
	const bar = $("queue");
	bar.innerHTML = "";
	const items = [...(q?.steering || []).map((t) => ["steer", t]), ...(q?.followUp || []).map((t) => ["follow-up", t])];
	bar.hidden = items.length === 0;
	for (const [kind, text] of items) {
		const chip = el("span", "queue-chip");
		chip.appendChild(el("b", "", kind));
		chip.appendChild(document.createTextNode(` ${text.slice(0, 80)}`));
		bar.appendChild(chip);
	}
	if (items.length) {
		const btn = el("button", "queue-clear", "↩ reclaim");
		btn.title = "Remove queued messages and put them back in the editor";
		btn.onclick = reclaimQueue;
		bar.appendChild(btn);
	}
}

async function reclaimQueue() {
	const g = stageGen;
	try {
		const d = await rpc({ type: "clear_queue" });
		if (stale(g)) return; // reclaimed text belongs to the session we left, not this editor
		const texts = [...(d.steering || []), ...(d.followUp || [])];
		if (texts.length) {
			const input = $("input");
			input.value = [input.value, ...texts].filter(Boolean).join("\n");
		}
		renderQueue({ steering: [], followUp: [] });
	} catch (e) {
		toast(String(e.message || e), "error");
	}
}

// ── stage lifecycle ──
function clearStage() {
	stageGen++; // everything already in flight for the old stage is now stale
	closePopover(); // a picker anchored to the old session would act on the new one
	stream?.close();
	stream = null;
	stopStatsPoll();
	L = null;
	$("transcript").innerHTML = "";
	$("dialogs").innerHTML = "";
	$("queue").hidden = true;
	$("widgets-above").innerHTML = "";
	$("widgets-below").innerHTML = "";
	$("status-chips").innerHTML = "";
	$("hist-head").hidden = true;
	$("live-head").hidden = true;
	$("live-foot").hidden = true;
	$("completion").hidden = true;
	document.title = "nana code";
}

// ── live view ──
function openLive(id, cwd) {
	clearStage();
	const g = stageGen;
	selected = { kind: "live", id, cwd };
	L = newLiveState(id, cwd);
	$("empty").hidden = true;
	$("composer").hidden = false;
	$("live-head").hidden = false;
	$("live-foot").hidden = false;
	$("cwd-label").textContent = short(cwd);
	setChip("…");

	// The stream outlives nothing: a closed EventSource still has an error
	// callback and a dispatch already in the queue, and both write into whatever
	// `L` is by then. Gate the whole transport on the generation that opened it.
	stream = openEventStream(
		`/api/session/${id}/events`,
		(e) => !stale(g) && handleEvent(e),
		() => !stale(g) && L && setChip("disconnected"),
	);

	resync();
	rpc({ type: "get_commands" }).then((d) => !stale(g) && (L.commands = d.commands || [])).catch(() => {});
	fetch(`/api/session/${id}/files`).then((r) => r.json()).then((d) => !stale(g) && (L.files = d.files || [])).catch(() => {});
	startStatsPoll();
	refreshRail();
	$("input").focus();
}

function liveBubble(kind) {
	if (!L.currentBubble || L.currentBubble.dataset.kind !== kind) {
		L.currentBubble = el("div", kind === "thinking" ? "msg thinking" : "msg assistant streaming");
		L.currentBubble.dataset.kind = kind;
		L.currentBubble.dataset.raw = "";
		L.ctx.container.appendChild(L.currentBubble);
		L.liveEls.push(L.currentBubble);
	}
	return L.currentBubble;
}

function handleEvent(e) {
	if (!L) return;
	const container = L.ctx.container;
	const pinned = isPinned(container);
	switch (e.type) {
		case "desk_hello": {
			// Every render below is a whole-snapshot replacement (showDialog is
			// id-guarded, the other three clear their box first), so a replayed
			// hello is idempotent by construction.
			for (const d of e.dialogs || []) showDialog(d);
			renderStatuses(e.statuses);
			renderWidgets(e.widgets);
			renderQueue(e.queue);
			if (e.title) document.title = `${e.title} — nana code`;
			if (e.state === "exited") setChip("exited");
			// A SECOND hello on this stage is a RECONNECT: the stream was down and
			// every event in that window is gone for good. One resync restores the
			// transcript and — through refreshState — the chip and `streaming`,
			// which would otherwise sit on "disconnected" forever.
			else if (L.helloSeen) resync();
			L.helloSeen = true;
			break;
		}
		case "agent_start":
			L.streaming = true;
			setChip("running");
			break;
		case "agent_settled":
			L.streaming = false;
			setChip("idle");
			L.currentBubble = null;
			resync();
			refreshRail();
			break;
		case "message_start":
			L.currentBubble = null;
			L.liveEls = [];
			break;
		case "message_update": {
			const ame = e.assistantMessageEvent;
			if (!ame) break;
			if (ame.type === "text_delta") {
				const b = liveBubble("text");
				b.dataset.raw += ame.delta;
				b.innerHTML = mdToHtml(b.dataset.raw);
			} else if (ame.type === "thinking_delta") {
				const b = liveBubble("thinking");
				b.dataset.raw += ame.delta;
				b.textContent = b.dataset.raw;
			} else if (ame.type === "toolcall_start") {
				L.currentBubble = null;
				const row = toolRow(L.ctx, ame.id, ame.toolName);
				L.liveEls.push(row);
			}
			break;
		}
		case "message_end": {
			for (const elm of L.liveEls) elm.remove();
			L.liveEls = [];
			L.currentBubble = null;
			// pi echoes user messages as message_end too; swap the matching
			// optimistic bubble from send() for the echo instead of rendering a
			// second copy. Content-matched (not FIFO) so a user echo from another
			// client/tab on the same session can't consume our pending bubble.
			if (e.message?.role === "user" && L.optimisticUserEls.length) {
				const echoText = contentBlocks(e.message.content).filter((b) => b.type === "text").map((b) => b.text).join("\n");
				const i = L.optimisticUserEls.findIndex((o) => o.text === echoText);
				if (i >= 0) L.optimisticUserEls.splice(i, 1)[0].el.remove();
			}
			if (e.message) appendMessage(e.message, L.ctx);
			break;
		}
		case "tool_execution_start": {
			const row = toolRow(L.ctx, e.toolCallId, e.toolName, e.args ?? e.input);
			const mark = row.querySelector(".mark");
			mark.className = "mark spin";
			mark.textContent = "⚙";
			break;
		}
		case "tool_execution_update": {
			const row = toolRow(L.ctx, e.toolCallId, e.toolName);
			const d = e.partialResult?.details;
			if (e.toolName === "subagent" && d && (d.results?.length || d.progress?.length)) {
				// subtle live tracking (agent · model · task · tokens) instead of
				// dumping the child's raw streamed output
				setSubagentProgress(row, d, true);
			} else {
				const texts = contentBlocks(e.partialResult?.content).filter((b) => b.type === "text").map((b) => b.text).join("\n");
				setToolStreaming(row, texts);
			}
			break;
		}
		case "tool_execution_end":
			// pi 0.84: a failed tool reports result.isError; the event's own isError stays false
			finishToolRow(L.ctx, { toolCallId: e.toolCallId, toolName: e.toolName, content: e.result?.content, details: e.result?.details, isError: !!(e.isError || e.result?.isError) });
			break;
		case "bash_execution_update": {
			const row = L.ctx.toolRows.get(`bash:${e.id}`);
			if (row) appendBashDelta(row, e.delta);
			else bufferBashEvent(e.id, e); // the POST that creates the row has not landed yet
			break;
		}
		case "desk_bash_result": {
			const row = L.ctx.toolRows.get(`bash:${e.id}`);
			if (row) finishBashRow(row, e.data, e.success ? undefined : e.error || "failed");
			else bufferBashEvent(e.id, e);
			break;
		}
		case "queue_update":
			renderQueue(e);
			break;
		case "compaction_start":
			setChip("compacting");
			noteRow(L.ctx, `— compacting context (${e.reason || "manual"}) —`);
			break;
		case "compaction_end": {
			setChip(L.streaming ? "running" : "idle");
			if (e.aborted) noteRow(L.ctx, "— compaction aborted —");
			else if (e.errorMessage) noteRow(L.ctx, `— compaction FAILED: ${e.errorMessage} —`, "err");
			else if (e.result) {
				expandableNote(L.ctx, `— compacted ${fmtTok(e.result.tokensBefore)} → ~${fmtTok(e.result.estimatedTokensAfter)} —`, e.result.summary);
				if (e.result.estimatedTokensAfter != null) L.ctxEstimate = e.result.estimatedTokensAfter;
			}
			if (!L.streaming) resync();
			else refreshStats();
			break;
		}
		case "auto_retry_start":
			L.retryNote?.remove();
			L.retryNote = noteRow(L.ctx, `— transient error, retry ${e.attempt}/${e.maxAttempts} in ${Math.round((e.delayMs || 0) / 1000)}s: ${e.errorMessage || ""} —`, "err");
			setChip(`retry ${e.attempt}/${e.maxAttempts}`);
			break;
		case "auto_retry_end":
			L.retryNote?.remove();
			L.retryNote = null;
			if (!e.success) noteRow(L.ctx, `— retries exhausted: ${e.finalError || ""} —`, "err");
			break;
		case "extension_error":
			noteRow(L.ctx, `extension error [${short(e.extensionPath || "")} · ${e.event || ""}]: ${e.error || ""}`, "err");
			break;
		case "extension_ui_request":
			handleUiRequest(e);
			break;
		case "desk_ui_resolved":
			dismissDialog(e.id);
			break;
		case "desk_prompt_rejected":
			toast(`prompt rejected: ${e.error || "unknown"}`, "error");
			break;
		case "desk_renamed":
			// server pushed a derived/edited name into this live session
			refreshState();
			refreshRail();
			break;
		case "desk_exit":
			L.streaming = false;
			setChip("exited");
			noteRow(L.ctx, `— session process exited (${e.code}) ${e.stderrTail || ""}`);
			refreshRail();
			break;
	}
	if (pinned) pin(container);
}

function handleUiRequest(e) {
	switch (e.method) {
		case "select":
		case "confirm":
		case "input":
		case "editor":
			showDialog(e);
			toast(`session asks: ${stripAnsi(e.title || e.method).slice(0, 80)}`, "warning");
			break;
		case "notify":
			toast(stripAnsi(e.message || ""), e.notifyType || "info");
			break;
		case "setStatus": {
			// server tracks state; cheap local re-read via desk_hello is not available → patch DOM directly
			const box = $("status-chips");
			const existing = [...box.children].find((c) => c.title === e.statusKey);
			if (e.statusText === undefined || e.statusText === null) existing?.remove();
			else if (existing) existing.textContent = stripAnsi(e.statusText);
			else {
				const c = el("span", "status-chip", stripAnsi(e.statusText));
				c.title = e.statusKey;
				box.appendChild(c);
			}
			break;
		}
		case "setWidget": {
			const parent = e.widgetPlacement === "belowEditor" ? $("widgets-below") : $("widgets-above");
			const existing = [...parent.children, ...$("widgets-above").children, ...$("widgets-below").children].find((c) => c.title === e.widgetKey);
			existing?.remove();
			if (e.widgetLines) {
				const b = widgetBox(e.widgetKey, e.widgetLines);
				if (b) parent.appendChild(b);
			}
			break;
		}
		case "setTitle":
			document.title = e.title ? `${e.title} — nana code` : "nana code";
			break;
		case "set_editor_text":
			$("input").value = e.text || "";
			$("input").focus();
			break;
	}
}

// ── pickers (model / thinking / fork) ──
function popover(anchor, build) {
	closePopover();
	const pop = el("div", "popover");
	pop.id = "popover";
	build(pop);
	document.body.appendChild(pop);
	const r = anchor.getBoundingClientRect();
	pop.style.top = `${Math.min(r.bottom + 6, window.innerHeight - pop.offsetHeight - 10)}px`;
	pop.style.left = `${Math.min(r.left, window.innerWidth - pop.offsetWidth - 10)}px`;
	setTimeout(() => {
		// not {once}: inside-clicks (checkboxes, filters) must not disarm closing
		const close = (ev) => {
			if (!pop.isConnected) return document.removeEventListener("mousedown", close);
			if (!pop.contains(ev.target)) {
				closePopover();
				document.removeEventListener("mousedown", close);
			}
		};
		document.addEventListener("mousedown", close);
	}, 0);
}
function closePopover() {
	document.getElementById("popover")?.remove();
}

async function modelPicker() {
	let models;
	try {
		models = (await rpc({ type: "get_available_models" })).models || [];
	} catch (e) {
		return toast(String(e.message || e), "error");
	}
	popover($("model-chip"), (pop) => {
		const filter = el("input", "pop-filter");
		filter.placeholder = "filter models…";
		pop.appendChild(filter);
		const list = el("div", "pop-list");
		pop.appendChild(list);
		const draw = () => {
			list.innerHTML = "";
			const q = filter.value.toLowerCase();
			for (const m of models.filter((m) => `${m.provider}/${m.id} ${m.name}`.toLowerCase().includes(q)).slice(0, 40)) {
				const b = el("button", "pop-item");
				const cur = L.state?.model && L.state.model.id === m.id && L.state.model.provider === m.provider;
				b.innerHTML = `<b></b><span class="dim"></span>`;
				b.querySelector("b").textContent = `${cur ? "● " : ""}${m.provider}/${m.id}`;
				b.querySelector(".dim").textContent = ` ${fmtTok(m.contextWindow)} ctx${m.reasoning ? " · thinking" : ""}`;
				b.onclick = async () => {
					closePopover();
					try {
						await rpc({ type: "set_model", provider: m.provider, modelId: m.id });
						toast(`model → ${m.provider}/${m.id}`);
						refreshState();
					} catch (e) {
						toast(String(e.message || e), "error");
					}
				};
				list.appendChild(b);
			}
		};
		filter.oninput = draw;
		draw();
		setTimeout(() => filter.focus(), 0);
	});
}

async function thinkingPicker() {
	let levels;
	try {
		levels = (await rpc({ type: "get_available_thinking_levels" })).levels || ["off"];
	} catch (e) {
		return toast(String(e.message || e), "error");
	}
	popover($("think-chip"), (pop) => {
		const list = el("div", "pop-list");
		for (const lvl of levels) {
			const b = el("button", "pop-item", `${L.state?.thinkingLevel === lvl ? "● " : ""}${lvl}`);
			b.onclick = async () => {
				closePopover();
				try {
					await rpc({ type: "set_thinking_level", level: lvl });
					toast(`thinking → ${lvl}`);
					refreshState();
				} catch (e) {
					toast(String(e.message || e), "error");
				}
			};
			list.appendChild(b);
		}
		pop.appendChild(list);
	});
}

async function forkPicker() {
	let msgs;
	try {
		msgs = (await rpc({ type: "get_fork_messages" })).messages || [];
	} catch (e) {
		return toast(String(e.message || e), "error");
	}
	if (!msgs.length) return toast("no user messages to fork from", "warning");
	popover($("btn-fork"), (pop) => {
		pop.appendChild(el("div", "pop-title", "Fork from…"));
		const list = el("div", "pop-list");
		for (const m of msgs.slice().reverse()) {
			const b = el("button", "pop-item", m.text.slice(0, 90).replace(/\s+/g, " "));
			b.onclick = async () => {
				closePopover();
				try {
					const d = await rpc({ type: "fork", entryId: m.entryId });
					if (d.cancelled) return toast("fork cancelled by an extension", "warning");
					$("input").value = d.text || "";
					toast("forked — original prompt is in the editor");
					await resync();
					refreshRail();
				} catch (e) {
					toast(String(e.message || e), "error");
				}
			};
			list.appendChild(b);
		}
		pop.appendChild(list);
	});
}

// ── settings window (tabs over pi settings.json / mcp.json / nana-pack.json /
// context files / pi-subagents agent files; every server write backs up .bak) ──
const JH = { "content-type": "application/json" };
const getSettings = () => fetch("/api/settings").then((r) => r.json());
async function patchSettings(patch) {
	const r = await fetch("/api/settings", { method: "POST", headers: JH, body: JSON.stringify({ patch }) }).then((r) => r.json());
	if (r.error) throw new Error(r.error);
	return r;
}
const field = (label, input) => {
	const w = el("label", "field");
	w.append(el("span", "flabel", label), input);
	return w;
};
const txtInput = (val, ph) => {
	const i = el("input", "tin");
	i.value = val ?? "";
	if (ph) i.placeholder = ph;
	return i;
};
const area = (val, rows = 10) => {
	const a = el("textarea", "tarea");
	a.value = val ?? "";
	a.rows = rows;
	return a;
};
const saveBtn = (label, fn) => {
	const b = el("button", "", label);
	b.onclick = async () => {
		b.disabled = true;
		try {
			await fn();
			toast("saved");
		} catch (e) {
			toast(String(e.message || e), "error");
		}
		b.disabled = false;
	};
	return b;
};

function settingsModal(initialTab) {
	closePopover();
	document.getElementById("desk-modal")?.remove();
	const overlay = el("div", "modal-overlay");
	overlay.id = "desk-modal";
	const modal = el("div", "modal");
	const head = el("div", "modal-head");
	head.append(el("b", "", "Settings"), el("span", "spacer"));
	const x = el("button", "quiet", "✕");
	x.onclick = () => overlay.remove();
	head.appendChild(x);
	const tabbar = el("div", "tabbar");
	const body = el("div", "modal-body");
	modal.append(head, tabbar, body);
	overlay.appendChild(modal);
	overlay.onmousedown = (e) => {
		if (e.target === overlay) overlay.remove();
	};
	document.body.appendChild(overlay);

	const TABS = [
		["skills", "Skills", tabSkills],
		["mcp", "MCP", tabMcp],
		["models", "Models", tabModels],
		["context", "Context", tabContext],
		["agents", "Agents", tabAgents],
		["tools", "Tools", tabTools],
		["nana", "Nana pack", tabNana],
		["session", "Session", tabSession],
	];
	const show = (key) => {
		for (const t of tabbar.querySelectorAll(".tab")) t.classList.toggle("on", t.dataset.key === key);
		body.innerHTML = "";
		// fresh pane per invocation: an async tab resolving after a switch appends
		// into a detached node instead of the new tab's view
		const pane = el("div", "pane");
		body.appendChild(pane);
		TABS.find(([k]) => k === key)[2](pane);
	};
	for (const [key, label] of TABS) {
		const t = el("button", "tab", label);
		t.dataset.key = key;
		t.onclick = () => show(key);
		tabbar.appendChild(t);
	}
	show(TABS.some(([k]) => k === initialTab) ? initialTab : "skills");
}

function tabSession(body) {
	if (!L || selected?.kind !== "live") {
		body.appendChild(el("p", "dim", "Open a live session to change its runtime settings."));
		return;
	}
	const mk = (label, get, set, opts) => {
		const sel = el("select");
		for (const o of opts) {
			const op = el("option", "", o);
			op.value = o;
			sel.appendChild(op);
		}
		sel.value = String(get() ?? opts[0]);
		sel.onchange = () => set(sel.value);
		body.appendChild(field(label, sel));
	};
	mk("steering", () => L.state?.steeringMode, (v) => rpc({ type: "set_steering_mode", mode: v }).then(refreshState).catch((e) => toast(String(e), "error")), ["one-at-a-time", "all"]);
	mk("follow-ups", () => L.state?.followUpMode, (v) => rpc({ type: "set_follow_up_mode", mode: v }).then(refreshState).catch((e) => toast(String(e), "error")), ["one-at-a-time", "all"]);
	mk("auto-compaction", () => String(L.state?.autoCompactionEnabled ?? true), (v) => rpc({ type: "set_auto_compaction", enabled: v === "true" }).then(refreshState).catch((e) => toast(String(e), "error")), ["true", "false"]);
	body.appendChild(el("p", "dim", "These apply to the OPEN session only. Startup defaults live in the Models and Context tabs."));
}

async function tabSkills(body) {
	const [s, r] = await Promise.all([getSettings(), fetch("/api/resources?cwd=~").then((r) => r.json())]);
	body.appendChild(el("div", "sec-head", "Discovered skills (global scope)"));
	for (const sk of r.skills || []) {
		const row = el("div", "srow");
		row.append(el("b", "", sk.name), el("span", "dim", ` /skill:${sk.name} · ${sk.origin}`));
		if (sk.description) row.title = sk.description;
		body.appendChild(row);
	}
	body.appendChild(el("p", "dim", "Invoke in a session as /skill:<name> (or just describe the task — the model picks skills up from its system prompt). Typing /<name> in the composer now completes to the full form."));
	body.appendChild(el("div", "sec-head", "Extra skill folders (settings.json → skills)"));
	// re-read current state inside each handler — a captured array would let two
	// quick edits clobber each other
	const currentFolders = async () => {
		const cur = await getSettings();
		return Array.isArray(cur.settings.skills) ? cur.settings.skills : [];
	};
	const folders = Array.isArray(s.settings.skills) ? s.settings.skills : [];
	for (const f of folders) {
		const row = el("div", "srow");
		row.appendChild(el("span", "", f));
		const rm = el("button", "quiet", "✕");
		rm.onclick = async () => {
			try {
				await patchSettings({ skills: (await currentFolders()).filter((x) => x !== f) });
				tabReload(body, tabSkills);
			} catch (e) {
				toast(String(e.message || e), "error");
			}
		};
		row.append(el("span", "spacer"), rm);
		body.appendChild(row);
	}
	const add = el("button", "", "Add skills folder…");
	add.onclick = async () => {
		const picked = await pickDir();
		if (!picked) return;
		try {
			const now = await currentFolders();
			if (!now.includes(picked)) await patchSettings({ skills: [...now, picked] });
			tabReload(body, tabSkills);
		} catch (e) {
			toast(String(e.message || e), "error");
		}
	};
	body.appendChild(add);
	body.appendChild(el("p", "dim", "Folders here load in every session. Per-session on/off lives in the spawn popover. Project skills (.pi/skills, .agents/skills) are managed in each repo."));
}

async function tabMcp(body) {
	const s = await getSettings();
	const servers = s.mcp.mcpServers || {};
	body.appendChild(el("div", "sec-head", `MCP servers — ${s.mcpPath}`));
	for (const [name, cfg] of Object.entries(servers)) {
		const row = el("div", "srow");
		row.append(el("b", "", name), el("span", "dim", ` ${cfg.url || [cfg.command, ...(cfg.args || [])].join(" ")}`));
		const rm = el("button", "quiet", "✕");
		rm.onclick = async () => {
			if (!confirm(`Remove MCP server "${name}"?`)) return;
			const next = { ...servers };
			delete next[name];
			await saveMcp(next);
			tabReload(body, tabMcp);
		};
		row.append(el("span", "spacer"), rm);
		body.appendChild(row);
	}
	body.appendChild(el("div", "sec-head", "Add server"));
	const nameIn = txtInput("", "name (e.g. memory)");
	const cmdIn = txtInput("", "stdio command line (simple space split) — OR leave empty and use URL");
	const urlIn = txtInput("", "http(s) URL for streamable-http/SSE servers");
	body.append(field("name", nameIn), field("command", cmdIn), field("url", urlIn));
	body.appendChild(
		saveBtn("Add", async () => {
			const name = nameIn.value.trim();
			if (!/^[\w-]{1,64}$/.test(name)) throw new Error("name: letters/digits/_- only");
			const cmd = cmdIn.value.trim();
			const u = urlIn.value.trim();
			if (!cmd && !u) throw new Error("give a command or a URL");
			const entry = u ? { url: u } : { command: cmd.split(/\s+/)[0], args: cmd.split(/\s+/).slice(1) };
			await saveMcp({ ...servers, [name]: entry });
			tabReload(body, tabMcp);
		}),
	);
	body.appendChild(el("div", "sec-head", "Raw (advanced — full mcpServers JSON)"));
	const raw = area(JSON.stringify(servers, null, 2), 8);
	body.append(raw, saveBtn("Save raw", async () => {
		const parsed = JSON.parse(raw.value);
		await saveMcp(parsed);
		tabReload(body, tabMcp);
	}));
	body.appendChild(el("p", "dim", "Bridged by pi-mcp-adapter: one ~200-token proxy tool, servers connect on first use. In-session: /mcp for status, OAuth, and direct-tool toggles. Env vars and secrets: edit the file directly."));
}

async function saveMcp(mcpServers) {
	const r = await fetch("/api/mcp", { method: "POST", headers: JH, body: JSON.stringify({ mcpServers }) }).then((r) => r.json());
	if (r.error) throw new Error(r.error);
}

async function tabModels(body) {
	const s = await getSettings();
	const prov = txtInput(s.settings.defaultProvider, "e.g. openai-codex, anthropic");
	const model = txtInput(s.settings.defaultModel, "e.g. gpt-5.5, claude-fable-5");
	const think = txtInput(s.settings.defaultThinkingLevel, "off · minimal · low · medium · high · xhigh · max");
	body.append(
		el("div", "sec-head", "Startup defaults (new sessions)"),
		field("provider", prov), field("model", model), field("thinking", think),
		saveBtn("Save defaults", () => patchSettings({
			defaultProvider: prov.value.trim() || null,
			defaultModel: model.value.trim() || null,
			defaultThinkingLevel: think.value.trim() || null,
		})),
		el("p", "dim", "The live session's model/thinking switch from the header chips; this sets what NEW sessions start with."),
		el("div", "sec-head", "Append to system prompt (desk-side, every desk spawn)"),
	);
	const sp = area(localStorage.getItem("desk-append-sp") || "", 6);
	sp.placeholder = "Extra system-prompt text passed with --append-system-prompt on every session the desk opens. Leave empty for none.";
	body.append(sp, saveBtn("Save", () => localStorage.setItem("desk-append-sp", sp.value)));
}

async function tabContext(body) {
	const s = await getSettings();
	const c = s.settings.compaction || {};
	const en = el("input");
	en.type = "checkbox";
	en.checked = c.enabled !== false;
	const reserve = txtInput(c.reserveTokens ?? 16384);
	const keep = txtInput(c.keepRecentTokens ?? 20000);
	body.append(
		el("div", "sec-head", "Auto-compaction"),
		field("enabled", en), field("reserveTokens", reserve), field("keepRecentTokens", keep),
		el("p", "dim", "Compaction fires when context exceeds window − reserveTokens. \"Compact at 75%\" of a 200k window → reserveTokens 50000. keepRecentTokens stays verbatim."),
		saveBtn("Save compaction", () => patchSettings({
			compaction: { enabled: en.checked, reserveTokens: Number(reserve.value) || 16384, keepRecentTokens: Number(keep.value) || 20000 },
		})),
		el("div", "sec-head", "Global instructions — ~/.pi/agent/AGENTS.md (every session)"),
	);
	const g = await fetch(`/api/context-file?dir=${encodeURIComponent(s.piDir)}&name=AGENTS.md`).then((r) => r.json());
	const ga = area(g.content, 8);
	body.append(ga, saveBtn("Save global AGENTS.md", async () => {
		const r = await fetch("/api/context-file", { method: "POST", headers: JH, body: JSON.stringify({ dir: s.piDir, name: "AGENTS.md", content: ga.value }) }).then((r) => r.json());
		if (r.error) throw new Error(r.error);
	}));
	body.appendChild(el("div", "sec-head", "Project context file"));
	const dirIn = txtInput("", "project directory");
	const pick = el("button", "", "Browse…");
	pick.onclick = async () => {
		const picked = await pickDir();
		if (picked) dirIn.value = picked;
	};
	const nameSel = el("select");
	for (const n of ["AGENTS.md", "CLAUDE.md", "AGENTS.override.md"]) {
		const o = el("option", "", n);
		o.value = n;
		nameSel.appendChild(o);
	}
	const pa = area("", 8);
	const load = el("button", "", "Load");
	load.onclick = async () => {
		const r = await fetch(`/api/context-file?dir=${encodeURIComponent(dirIn.value.trim())}&name=${encodeURIComponent(nameSel.value)}`).then((r) => r.json());
		if (r.error) return toast(r.error, "error");
		pa.value = r.content;
		toast(r.exists ? "loaded" : "new file — save to create");
	};
	const prow = el("div", "srow");
	prow.append(dirIn, pick, nameSel, load);
	body.append(prow, pa, saveBtn("Save project file", async () => {
		const r = await fetch("/api/context-file", { method: "POST", headers: JH, body: JSON.stringify({ dir: dirIn.value.trim(), name: nameSel.value, content: pa.value }) }).then((r) => r.json());
		if (r.error) throw new Error(r.error);
	}));
}

async function tabAgents(body) {
	const s = await fetch("/api/agents").then((r) => r.json());
	body.appendChild(el("div", "sec-head", `Subagents (pi-subagents) — ${s.dir}`));
	const editor = (name, content, isNew) => {
		body.querySelector(".agent-editor")?.remove();
		const box = el("div", "agent-editor");
		const nameIn = txtInput(name, "agent-name");
		nameIn.disabled = !isNew;
		const ta = area(content, 12);
		box.append(field("name", nameIn), ta, saveBtn("Save agent", async () => {
			const r = await fetch("/api/agents", { method: "POST", headers: JH, body: JSON.stringify({ name: nameIn.value.trim(), content: ta.value }) }).then((r) => r.json());
			if (r.error) throw new Error(r.error);
			tabReload(body, tabAgents);
		}));
		if (!isNew) {
			const del = el("button", "danger", "Delete");
			del.onclick = async () => {
				if (!confirm(`Delete agent "${name}"?`)) return;
				const target = s.agents.find((a) => a.name === name)?.path;
				const r = await fetch(`/api/agents?path=${encodeURIComponent(target)}`, { method: "DELETE" }).then((r) => r.json());
				if (r.error) return toast(r.error, "error");
				tabReload(body, tabAgents);
			};
			box.appendChild(del);
		}
		body.appendChild(box);
	};
	for (const a of s.agents) {
		const row = el("button", "srow srow-btn");
		row.append(el("b", "", a.name), el("span", "dim", ` ${a.content.match(/^description:\s*(.+)$/m)?.[1] || ""}`));
		row.onclick = () => editor(a.name, a.content, false);
		body.appendChild(row);
	}
	const add = el("button", "", "New agent…");
	add.onclick = () => editor("", "---\nname: my-agent\ndescription: what it does\nmodel: gpt-5.5\ntools: read, grep, find, ls\n---\n\nSystem prompt here.\n", true);
	body.appendChild(add);
	body.appendChild(el("p", "dim", "Built-ins (scout, researcher, worker, reviewer) ship with pi-subagents. Project agents live in each repo's .pi/agents/. Frontmatter fields: name, description, model, tools, thinking, systemPromptMode."));
}

// pi 0.84.4 built-in tools (docs/settings.md "Tools"). settings.defaultTools
// REPLACES pi's own default set; when it is absent pi uses PI_DEFAULT_TOOLS
// (dist/core/sdk.js defaultActiveToolNames). Extension/SDK tools are never in here.
const PI_BUILTIN_TOOLS = ["read", "bash", "powershell", "edit", "write", "grep", "find", "ls"];
const PI_DEFAULT_TOOLS = ["read", "bash", "edit", "write"];

async function tabTools(body) {
	const s = await getSettings();
	const configured = Array.isArray(s.settings.defaultTools) ? s.settings.defaultTools : null;
	body.appendChild(el("div", "sec-head", "Built-in tools for NEW sessions (settings.json \u2192 defaultTools)"));
	const boxes = new Map();
	for (const name of PI_BUILTIN_TOOLS) {
		const row = el("label", "checkrow");
		const box = el("input");
		box.type = "checkbox";
		box.checked = configured ? configured.includes(name) : PI_DEFAULT_TOOLS.includes(name);
		boxes.set(name, box);
		row.append(box, el("span", "", name));
		if (name === "powershell") row.append(el("span", "dim", "Windows only"));
		if (!configured && PI_DEFAULT_TOOLS.includes(name)) row.append(el("span", "dim", "pi default"));
		body.appendChild(row);
	}
	body.append(
		el("p", "dim", configured
			? "defaultTools is set, so this list replaces pi's own default set for every new session."
			: "defaultTools is not set \u2014 pi's own defaults (read, bash, edit, write) apply. Saving pins the list above."),
		el("p", "dim", "Built-in tools only. Extension-provided tools (nana-stage, pi-subagents, the MCP proxy) are unaffected by this list."),
	);
	const row = el("div", "srow");
	row.appendChild(saveBtn("Save tools", async () => {
		await patchSettings({ defaultTools: PI_BUILTIN_TOOLS.filter((n) => boxes.get(n).checked) });
		tabReload(body, tabTools);
	}));
	const reset = el("button", "quiet", "Use pi defaults");
	reset.disabled = !configured;
	reset.title = "Remove defaultTools from settings.json";
	reset.onclick = async () => {
		try {
			await patchSettings({ defaultTools: null });
			toast("saved");
			tabReload(body, tabTools);
		} catch (e) {
			toast(String(e.message || e), "error");
		}
	};
	row.appendChild(reset);
	body.appendChild(row);
	body.appendChild(el("p", "dim", "A project's own settings.json defaultTools array replaces this one for sessions opened there."));
}

// ── nana-pack config editor ──
// Covers the whole schema (packages/nana-pack/lib/config.ts) at BOTH scopes. The
// server does a whole-file replace, so the form round-trips everything it read:
// unknown sub-keys ride along untouched, unknown TOP-LEVEL keys are refused by the
// server with their names (a typo the extensions would otherwise ignore forever).
const NANA_SCOPE_NOTE = "Project overrides user per section, and the project file is only read when the project is trusted.";

const checkbox = (on) => {
	const b = el("input");
	b.type = "checkbox";
	b.checked = on;
	return b;
};

// {match, run, timeoutMs?} rows + a raw-JSON escape hatch for power users
function postEditRows(commands) {
	const wrap = el("div", "pe-rows");
	const draw = (list) => {
		wrap.innerHTML = "";
		for (const c of list) {
			const row = el("div", "srow");
			const match = txtInput(c.match ?? "", "regex on the file path");
			const run = txtInput(c.run ?? "", "command; {file} = the edited file");
			const ms = txtInput(c.timeoutMs ?? "", "timeoutMs");
			ms.style.maxWidth = "110px";
			const rm = el("button", "quiet", "✕");
			rm.title = "Remove this command";
			rm.onclick = () => row.remove();
			row.append(match, run, ms, rm);
			row._read = () => ({ match: match.value, run: run.value, ms: ms.value });
			wrap.appendChild(row);
		}
	};
	draw(commands);
	return {
		wrap,
		add: () => draw([...readRaw(), { match: "", run: "", timeoutMs: "" }]),
		replace: (list) => draw(list),
		read,
	};
	function readRaw() {
		return [...wrap.querySelectorAll(".srow")].map((r) => {
			const v = r._read();
			return { match: v.match, run: v.run, timeoutMs: v.ms };
		});
	}
	// throws with the offending row number — a silently-dropped rule is worse than a refusal
	function read() {
		const out = [];
		readRaw().forEach((v, i) => {
			const n = i + 1;
			if (!v.match.trim() && !v.run.trim() && !String(v.timeoutMs).trim()) return; // an empty row is "no rule"
			if (typeof v.run !== "string" || !v.run.trim()) throw new Error(`post-edit command ${n}: run must be a command string`);
			try {
				new RegExp(v.match);
			} catch {
				throw new Error(`post-edit command ${n}: match is not a valid regex`);
			}
			const cmd = { match: v.match, run: v.run };
			const raw = String(v.timeoutMs ?? "").trim();
			if (raw) {
				const ms = Number(raw);
				if (!Number.isInteger(ms) || ms < 0) throw new Error(`post-edit command ${n}: timeoutMs must be a non-negative whole number`);
				cmd.timeoutMs = ms;
			}
			out.push(cmd);
		});
		return out;
	}
}

async function tabNana(body) {
	// scope survives tabReload (same pane element, innerHTML cleared)
	const mode = body.dataset.nanaScope === "project" ? "project" : "user";
	const dir = body.dataset.nanaDir || "";
	const scopeSel = el("select");
	for (const [v, label] of [["user", "User — ~/.pi/agent/nana-pack.json"], ["project", "Project — <dir>/.pi/nana-pack.json"]]) {
		const o = el("option", "", label);
		o.value = v;
		scopeSel.appendChild(o);
	}
	scopeSel.value = mode;
	scopeSel.onchange = () => {
		body.dataset.nanaScope = scopeSel.value;
		tabReload(body, tabNana);
	};
	body.append(el("div", "sec-head", "Scope"), field("scope", scopeSel));

	if (mode === "project") {
		const dirIn = txtInput(dir, "project directory");
		const pick = el("button", "", "Browse…");
		pick.onclick = async () => {
			const picked = await pickDir();
			if (picked) {
				dirIn.value = picked;
				load.onclick();
			}
		};
		const load = el("button", "", "Load");
		load.onclick = () => {
			body.dataset.nanaDir = dirIn.value.trim();
			tabReload(body, tabNana);
		};
		const row = el("div", "srow");
		row.append(dirIn, pick, load);
		body.appendChild(row);
		if (!dir) {
			body.appendChild(el("p", "dim", `Pick a project directory to edit its nana-pack config. ${NANA_SCOPE_NOTE}`));
			return;
		}
	}

	const q = mode === "project" ? `?dir=${encodeURIComponent(dir)}` : "";
	const s = await fetch(`/api/nana-pack${q}`).then((r) => r.json());
	if (s.error) {
		body.appendChild(el("p", "dim", s.error));
		return;
	}
	const n = s.config || {};
	body.appendChild(el("p", "dim", `${s.exists ? "" : "new file — "}${s.path}`));
	if (s.unreadable) body.appendChild(el("p", "dim", "⚠ that file exists but is not readable JSON — the form below shows DEFAULTS, and saving replaces it (the previous file is kept as .bak)."));
	body.appendChild(el("p", "dim", NANA_SCOPE_NOTE));

	const lines = (arr) => (Array.isArray(arr) ? arr : []).join("\n");
	const extra = area(lines(n.gate?.extraPatterns), 3);
	const allow = area(lines(n.gate?.allowPatterns), 3);
	const prot = area(lines(n.gate?.protectedPaths), 3);
	body.append(
		el("div", "sec-head", "Gate (one regex per line)"),
		field("extra dangerous", extra), field("allow (skip gate)", allow), field("protected paths", prot),
	);

	const pe = postEditRows(Array.isArray(n.postEdit?.commands) ? n.postEdit.commands : []);
	const addBtn = el("button", "quiet", "Add command");
	addBtn.onclick = () => pe.add();
	const rawBox = el("details");
	const rawArea = area(JSON.stringify(n.postEdit?.commands || [], null, 2), 6);
	const rawApply = el("button", "quiet", "Load raw into the rows");
	rawApply.onclick = () => {
		try {
			const parsed = JSON.parse(rawArea.value);
			if (!Array.isArray(parsed)) throw new Error("raw post-edit commands must be a JSON array");
			pe.replace(parsed);
			toast("rows updated — Save to write");
		} catch (e) {
			toast(String(e.message || e), "error");
		}
	};
	rawBox.append(el("summary", "", "raw JSON (advanced)"), rawArea, rawApply);
	body.append(
		el("div", "sec-head", "Post-edit commands — match (regex on path) · run ({file} = the file) · timeoutMs"),
		pe.wrap, addBtn, rawBox,
	);

	const notifyEn = checkbox(n.notify?.enabled !== false);
	const notifyHeadless = checkbox(n.notify?.headless === true);
	const journalEn = checkbox(n.journal?.enabled !== false);
	const journalPath = txtInput(n.journal?.path ?? "", "blank = ~/.pi/agent/nana-journal.jsonl");
	const handoffEn = checkbox(n.handoff?.enabled !== false);
	const handoffPath = txtInput(n.handoff?.path ?? "", "blank = the pack's default");
	const receiptsEn = checkbox(n.receipts?.enabled !== false);
	const receiptsDir = txtInput(n.receipts?.dir ?? "", "blank = ~/.pi/agent/receipts");
	body.append(
		el("div", "sec-head", "Notifications"),
		field("enabled", notifyEn), field("also when headless", notifyHeadless),
		el("div", "sec-head", "Lifecycle journal"),
		field("enabled", journalEn), field("path", journalPath),
		el("div", "sec-head", "Handoff"),
		field("enabled", handoffEn), field("path", handoffPath),
		el("div", "sec-head", "Post-edit check receipts"),
		field("enabled", receiptsEn), field("dir", receiptsDir),
	);

	const orNull = (i) => (i.value.trim() ? i.value.trim() : null);
	body.append(
		saveBtn("Save nana-pack", async () => {
			// only blank lines go: a gate regex may legitimately end in a space
			// ("^curl " is the exact shape these take), so lines are NOT trimmed
			const toLines = (a) => a.value.split("\n").map((x) => x.replace(/\r$/, "")).filter((x) => x.trim());
			const config = {
				...n, // unknown SUB-keys survive; an unknown top-level key is refused by name
				gate: { ...n.gate, extraPatterns: toLines(extra), allowPatterns: toLines(allow), protectedPaths: toLines(prot) },
				postEdit: { ...n.postEdit, commands: pe.read() },
				notify: { ...n.notify, enabled: notifyEn.checked, headless: notifyHeadless.checked },
				journal: { ...n.journal, enabled: journalEn.checked, path: orNull(journalPath) },
				handoff: { ...n.handoff, enabled: handoffEn.checked, path: orNull(handoffPath) },
				receipts: { ...n.receipts, enabled: receiptsEn.checked, dir: orNull(receiptsDir) },
			};
			const payload = mode === "project" ? { config, dir } : { config };
			const r = await fetch("/api/nana-pack", { method: "POST", headers: JH, body: JSON.stringify(payload) }).then((r) => r.json());
			if (r.error) throw new Error(r.error);
		}),
		el("p", "dim", "Config is re-read on every event — changes apply to running sessions without restart. Every write backs the previous file up to .bak."),
	);
}

function tabReload(body, tab) {
	body.innerHTML = "";
	tab(body);
}

async function renameSession() {
	const cur = L.state?.sessionName || "";
	const name = prompt("Session name:", cur);
	if (name === null) return;
	const g = stageGen;
	try {
		await rpc({ type: "set_session_name", name });
		if (stale(g)) return;
		refreshState();
		refreshRail();
	} catch (e) {
		toast(String(e.message || e), "error");
	}
}

async function exportSession() {
	// The name is read BEFORE the await: this file is the session that was
	// exported, whatever is selected by the time the blob arrives. The download
	// itself still happens — the user asked for it.
	const label = L.state?.sessionName || L.id;
	try {
		const r = await fetch(`/api/session/${L.id}/export`, { method: "POST" });
		if (!r.ok) throw new Error((await r.json()).error || "export failed");
		const blob = await r.blob();
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = `nana-code-session-${label}.html`;
		a.click();
		URL.revokeObjectURL(a.href);
	} catch (e) {
		toast(String(e.message || e), "error");
	}
}

// ── desk-handled slash commands ──
const DESK_COMMANDS = [
	["model", "switch model (picker, or /model <pattern>)"],
	["thinking", "set thinking level"],
	["compact", "compact context, optional instructions"],
	["name", "set session display name"],
	["new", "start a fresh session in this process"],
	["fork", "fork from a previous user message"],
	["clone", "duplicate active branch into a new session"],
	["export", "download session as HTML"],
	["session", "show session file / id / stats"],
];

// Every branch below either issues its RPC before any await (so it reaches the
// right child) or awaits first — and then must not act on whatever session is
// selected when it resumes. One generation for the whole handler.
async function handleDeskCommand(text) {
	const m = text.match(/^\/(\w+)\s*(.*)$/s);
	if (!m) return false;
	const [, cmd, rest] = m;
	const g = stageGen;
	switch (cmd) {
		case "model":
			if (!rest) modelPicker();
			else {
				try {
					const models = (await rpc({ type: "get_available_models" })).models || [];
					const q = rest.toLowerCase();
					const hit = models.find((mo) => `${mo.provider}/${mo.id}`.toLowerCase().includes(q) || (mo.name || "").toLowerCase().includes(q));
					if (stale(g)) return true; // set_model would target the session we switched to
					if (!hit) return toast(`no model matches "${rest}"`, "warning"), true;
					await rpc({ type: "set_model", provider: hit.provider, modelId: hit.id });
					toast(`model → ${hit.provider}/${hit.id}`);
					refreshState();
				} catch (e) {
					toast(String(e.message || e), "error");
				}
			}
			return true;
		case "thinking":
			if (!rest) thinkingPicker();
			else
				rpc({ type: "set_thinking_level", level: rest.trim() })
					.then(() => !stale(g) && (toast(`thinking → ${rest.trim()}`), refreshState()))
					.catch((e) => toast(String(e.message || e), "error"));
			return true;
		case "compact":
			toast("compacting…");
			rpc({ type: "compact", ...(rest ? { customInstructions: rest } : {}) }).catch((e) => toast(String(e.message || e), "error"));
			return true;
		case "name":
			if (rest) rpc({ type: "set_session_name", name: rest.trim() }).then(() => !stale(g) && (refreshState(), refreshRail())).catch((e) => toast(String(e), "error"));
			else renameSession();
			return true;
		case "new":
			rpc({ type: "new_session" })
				.then((d) => {
					if (stale(g)) return;
					if (d?.cancelled) return toast("new session cancelled by an extension", "warning");
					toast("fresh session");
					resync();
					refreshRail();
				})
				.catch((e) => toast(String(e.message || e), "error"));
			return true;
		case "fork":
			forkPicker();
			return true;
		case "clone":
			rpc({ type: "clone" })
				.then((d) => {
					if (stale(g)) return;
					if (d?.cancelled) return toast("clone cancelled by an extension", "warning");
					toast("cloned into a new session file");
					refreshState();
					refreshRail();
				})
				.catch((e) => toast(String(e.message || e), "error"));
			return true;
		case "export":
			exportSession();
			return true;
		case "session": {
			const s = L.state;
			toast(`${s?.sessionFile || "(ephemeral)"} · id ${s?.sessionId || "?"} · ${s?.messageCount ?? "?"} messages`, "info", 8000);
			return true;
		}
		default:
			return false;
	}
}

// ── composer ──
async function send() {
	if (selected?.kind !== "live" || !L) return;
	const g = stageGen;
	const input = $("input");
	const text = input.value.trim();
	if (!text && !L.attachments.length) return;

	if (text.startsWith("!")) {
		if (text.startsWith("!!")) return toast("`!!` (hidden bash) isn't supported over RPC — use `!`", "warning");
		const command = text.slice(1).trim();
		input.value = "";
		const seq = L.renderSeq;
		try {
			const r = await fetch(`/api/session/${L.id}/bash`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ command }),
			}).then((r) => r.json());
			if (stale(g)) return; // the row belongs to a session we have left
			if (r.error) return toast(r.error, "error");
			const adopted = L.renderSeq !== seq ? adoptHistoryBashRow(L.ctx, command) : null;
			if (adopted) {
				// The transcript was rebuilt while we waited and already holds pi's
				// own finished record of this command. Key it by the id so later
				// events find it, and drop the buffer: history is authoritative for
				// the same output, and replaying deltas into it would double them.
				adopted.dataset.bashId = r.id;
				L.ctx.toolRows.set(`bash:${r.id}`, adopted);
				L.pendingBashEvents.delete(r.id);
			} else flushBashEvents(bashRow(L.ctx, r.id, command), r.id);
			pin(L.ctx.container);
		} catch (e) {
			if (!stale(g)) toast(String(e.message || e), "error");
		}
		return;
	}

	if (text.startsWith("/") && (await handleDeskCommand(text))) {
		if (!stale(g)) input.value = ""; // never clear the editor of a session we switched to
		return;
	}

	let mode = $("mode").value;
	if (mode === "auto") mode = L.streaming ? "steer" : "prompt";
	if (mode === "prompt" && L.streaming) mode = "steer"; // prompt during streaming errors without streamingBehavior
	if (text.startsWith("/")) mode = "prompt"; // extension commands execute immediately, even mid-stream; steer rejects them

	const images = L.attachments.map((a) => ({ data: a.data, mimeType: a.mimeType }));
	const savedAtt = L.attachments;
	input.value = "";
	setAttachments([]);
	// optimistic append must happen BEFORE the POST: pi's echoed user
	// message_end can arrive over SSE before the fetch resolves, and the
	// message_end handler needs the bubble queued to swap instead of duplicate
	let optimistic = null;
	if (mode === "prompt") {
		const pinned = isPinned(L.ctx.container);
		optimistic = appendMessage({ role: "user", content: text }, L.ctx);
		if (optimistic) L.optimisticUserEls.push({ el: optimistic, text });
		if (pinned) pin(L.ctx.container);
		setChip("running");
		L.streaming = true;
	}
	// `explicit` = the server ANSWERED and refused. That is the only proof the
	// prompt is not running, and it outranks a matching echo (which can come from
	// another tab or client on the same session): put the text back. Transport
	// loss is the opposite — the echo proves pi HAS the message, so restoring it
	// would hand the user a second copy of a prompt already under way.
	const restore = (explicit) => {
		if (stale(g) || !L) return; // this text belongs to a session we have left
		const pending = !!optimistic && L.optimisticUserEls.some((o) => o.el === optimistic);
		if (!explicit && optimistic && !pending) return;
		input.value = input.value ? `${text}\n${input.value}` : text;
		setAttachments(savedAtt);
		if (pending) {
			L.optimisticUserEls = L.optimisticUserEls.filter((o) => o.el !== optimistic);
			optimistic.remove();
			setChip("idle");
			L.streaming = false;
		}
	};
	try {
		const r = await fetch(`/api/session/${L.id}/prompt`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ message: text, mode, ...(images.length ? { images } : {}) }),
		}).then((r) => r.json());
		if (stale(g)) return;
		if (!r.ok) {
			restore(true);
			return toast(r.error || "prompt rejected", "error");
		}
	} catch (e) {
		restore(false);
		if (!stale(g)) toast(String(e.message || e), "error");
	}
}

function setAttachments(list) {
	L.attachments = list;
	const box = $("attachments");
	box.innerHTML = "";
	box.hidden = list.length === 0;
	list.forEach((a, i) => {
		const chip = el("span", "att-chip");
		const img = el("img");
		img.src = `data:${a.mimeType};base64,${a.data}`;
		chip.appendChild(img);
		chip.appendChild(el("span", "", a.name || "image"));
		const x = el("button", "att-x", "×");
		x.onclick = () => setAttachments(L.attachments.filter((_, j) => j !== i));
		chip.appendChild(x);
		box.appendChild(chip);
	});
}

function addImageFile(file) {
	if (!file.type.startsWith("image/")) return;
	const g = stageGen;
	const reader = new FileReader();
	reader.onload = () => {
		if (stale(g) || !L) return; // an image picked for a session we have left
		const data = String(reader.result).split(",")[1];
		setAttachments([...L.attachments, { data, mimeType: file.type, name: file.name }]);
	};
	reader.readAsDataURL(file);
}

// ── completion (slash commands + @files) ──
const comp = { open: false, items: [], sel: 0, start: 0, end: 0 };

function updateCompletion() {
	const input = $("input");
	const pos = input.selectionStart;
	const text = input.value;
	let found = null;
	if (text.startsWith("/") && !/\s/.test(text.slice(0, pos)) && pos <= text.length) {
		const q = text.slice(1, pos).toLowerCase();
		const deskItems = DESK_COMMANDS.map(([name, desc]) => ({ label: `/${name}`, hint: desc, insert: `/${name} ` }));
		const extItems = (L?.commands || []).map((c) => ({
			label: `/${c.name}`,
			hint: `${c.description || ""} (${c.source})`,
			insert: `/${c.name} `,
		}));
		// match the full name OR the segment after a namespace colon, so typing
		// /adopt finds /skill:adopt-py (pi registers skills as skill:<name>)
		const matches = [...deskItems, ...extItems].filter((i) => {
			const name = i.label.slice(1).toLowerCase();
			return name.startsWith(q) || name.split(":").pop().startsWith(q);
		});
		matches.sort((a, b) => (a.label.slice(1).toLowerCase().startsWith(q) ? 0 : 1) - (b.label.slice(1).toLowerCase().startsWith(q) ? 0 : 1));
		found = { start: 0, end: pos, items: matches };
	} else {
		const before = text.slice(0, pos);
		const at = before.match(/(?:^|\s)@([\w./-]*)$/);
		if (at && L?.files) {
			const q = at[1].toLowerCase();
			const start = pos - at[1].length - 1;
			const ranked = L.files
				.filter((f) => f.toLowerCase().includes(q))
				.sort((a, b) => {
					const ab = a.toLowerCase().split("/").pop().startsWith(q) ? 0 : 1;
					const bb = b.toLowerCase().split("/").pop().startsWith(q) ? 0 : 1;
					return ab - bb || a.length - b.length;
				});
			found = { start, end: pos, items: ranked.slice(0, 50).map((f) => ({ label: `@${f}`, hint: "", insert: `@${f} ` })) };
		}
	}
	if (!found || !found.items.length) {
		comp.open = false;
		$("completion").hidden = true;
		return;
	}
	comp.open = true;
	comp.items = found.items.slice(0, 12);
	comp.sel = 0;
	comp.start = found.start;
	comp.end = found.end;
	drawCompletion();
}

function drawCompletion() {
	const box = $("completion");
	box.innerHTML = "";
	box.hidden = false;
	comp.items.forEach((it, i) => {
		const row = el("div", `comp-item${i === comp.sel ? " sel" : ""}`);
		row.appendChild(el("b", "", it.label));
		if (it.hint) row.appendChild(el("span", "dim", ` ${it.hint}`));
		row.onmousedown = (e) => {
			e.preventDefault();
			applyCompletion(i);
		};
		box.appendChild(row);
	});
}

function applyCompletion(i) {
	const it = comp.items[i ?? comp.sel];
	if (!it) return;
	const input = $("input");
	input.value = input.value.slice(0, comp.start) + it.insert + input.value.slice(comp.end);
	const newPos = comp.start + it.insert.length;
	input.setSelectionRange(newPos, newPos);
	comp.open = false;
	$("completion").hidden = true;
	input.focus();
}

// ── historical view ──
async function openHistorical(file, cwd) {
	clearStage();
	const g = stageGen;
	selected = { kind: "hist", file, cwd };
	$("empty").hidden = true;
	$("composer").hidden = true;
	$("hist-head").hidden = false;

	const data = await fetch(`/api/transcript?file=${encodeURIComponent(file)}`).then((r) => r.json());
	if (stale(g)) return; // a transcript for a session we have left is never painted
	if (data.error) {
		$("hist-title").textContent = "error";
		noteRow({ container: $("transcript") }, data.error, "err");
		return;
	}
	$("hist-title").textContent = data.name || basename(file);
	$("hist-sub").textContent = `${short(cwd)} · ${data.total} entries${data.total > data.entries.length ? ` (showing last ${data.entries.length})` : ""}`;
	$("btn-continue").onclick = () => spawnSession(cwd, file);

	const container = $("transcript");
	const ctx = { container, toolRows: new Map() };
	let offGroup = null; // collapsed details for abandoned-branch runs
	for (const e of data.entries) {
		let target = ctx;
		if (!e.onBranch) {
			if (!offGroup) {
				offGroup = el("details", "branch-details");
				offGroup.appendChild(el("summary", "", "abandoned branch"));
				container.appendChild(offGroup);
				offGroup._count = 0;
				offGroup._ctx = { container: offGroup, toolRows: new Map() };
			}
			offGroup._count++;
			offGroup.querySelector("summary").textContent = `abandoned branch (${offGroup._count} entries)`;
			target = offGroup._ctx;
		} else offGroup = null;

		switch (e.type) {
			case "message":
				appendMessage(e.message, target);
				break;
			case "compaction":
				expandableNote(target, `— context compacted (${fmtTok(e.tokensBefore)} before) —`, e.summary);
				break;
			case "branch_summary":
				expandableNote(target, "— branch summary —", e.summary);
				break;
			case "model_change":
				noteRow(target, `model → ${e.provider}/${e.modelId}`);
				break;
			case "thinking_level_change":
				noteRow(target, `thinking → ${e.thinkingLevel}`);
				break;
			default:
				noteRow(target, `— ${e.type} —`);
		}
	}
	container.scrollTop = 0;
	refreshRail();
}

async function spawnSession(cwd, sessionFile, extra) {
	const g = stageGen;
	const body = { cwd, ...extra };
	if (sessionFile) body.session = sessionFile;
	const sp = localStorage.getItem("desk-append-sp");
	if (sp?.trim() && !body.appendSystemPrompt) body.appendSystemPrompt = sp;
	const r = await fetch("/api/spawn", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	}).then((r) => r.json());
	if (r.error) return toast(r.error, "error");
	// You picked another stage while this spawn was in flight: the session exists
	// and is in the rail, but stealing the stage back would undo your choice.
	if (stale(g)) return refreshRail();
	openLive(r.id, cwd);
}

// ── spawn popover: pick a directory (native OS dialog), toggle skills/
// extensions, open. (pi has no MCP — extensions ARE the pluggable surface;
// toggling happens at spawn because pi resolves resources at process start.)
function spawnPopover(anchor) {
	popover(anchor || $("btn-spawn"), (pop) => {
		pop.classList.add("spawn-pop");
		pop.appendChild(el("div", "pop-title", "Open a session"));

		const pathRow = el("div", "path-row");
		const pathIn = el("input", "pop-filter");
		pathIn.placeholder = "~/some/repo — Enter to load";
		const browseBtn = el("button", "", "Browse…");
		browseBtn.title = "Pick a folder with the system dialog";
		pathRow.append(pathIn, browseBtn);
		pop.appendChild(pathRow);
		const resWrap = el("div", "res-wrap");
		pop.appendChild(resWrap);
		const toolsWrap = el("div", "res-wrap tools-wrap");
		pop.appendChild(toolsWrap);

		// Built-in tools for THIS session, shown all-checked so leaving them alone
		// changes nothing. Unchecking sends `-xt`, NOT `-t`: `-t` is a strict
		// allowlist over every tool and would silently drop nana-stage and the
		// subagent tools along with it.
		//
		// The effective set depends on BOTH the cwd and the trust box: a project's
		// .pi/settings.json defaultTools REPLACES the global array (settings.md
		// "Tools"), and pi only reads that file for a trusted project. /api/resources
		// reports both, so this recomputes on every nav and every trust flip —
		// reading the global settings alone would hide a project-enabled tool and
		// leave the user unable to drop it.
		let builtinTools = null; // [{name, on}] for the current effective set
		let toolDefaults = null; // {global, project} from /api/resources
		const drawTools = () => {
			toolsWrap.innerHTML = "";
			if (!builtinTools?.length) return;
			const useProject = trustBox.checked && Array.isArray(toolDefaults?.project);
			const source = useProject ? "project settings.json" : Array.isArray(toolDefaults?.global) ? "global settings.json" : "pi defaults";
			const sec = el("div", "res-sec");
			sec.appendChild(el("div", "res-head", `Built-in tools \u00b7 ${source}`));
			for (const t of builtinTools) {
				const row = el("label", "checkrow");
				const box = el("input");
				box.type = "checkbox";
				box.checked = t.on;
				if (t.unknown) {
					// named by settings but not a built-in this desk build knows, so the
					// server would refuse it in -xt. Shown (it IS in the session) but not
					// offered as something we can drop.
					box.disabled = true;
					row.classList.add("off");
					row.title = "not a built-in this desk build knows — it cannot be dropped from here";
				}
				box.onchange = () => (t.on = box.checked);
				row.append(box, el("span", "", t.name));
				if (t.unknown) row.append(el("span", "dim", "unknown to this desk"));
				sec.appendChild(row);
			}
			toolsWrap.append(sec, el("div", "res-note", "unchecked ones are dropped for this session only (pi -xt) \u2014 extension tools are unaffected; the startup default lives in Settings \u2192 Tools"));
		};
		const recomputeTools = () => {
			const useProject = trustBox.checked && Array.isArray(toolDefaults?.project);
			const eff = useProject ? toolDefaults.project : Array.isArray(toolDefaults?.global) ? toolDefaults.global : PI_DEFAULT_TOOLS;
			const prev = new Map((builtinTools || []).map((t) => [t.name, t.on]));
			builtinTools = eff.map((name) => ({ name, on: prev.get(name) ?? true, unknown: !PI_BUILTIN_TOOLS.includes(name) }));
			drawTools();
		};

		const foot = el("div", "spawn-foot");
		const nameIn = el("input", "pop-filter");
		nameIn.placeholder = "session name (optional)";
		const trustRow = el("label", "checkrow");
		const trustBox = el("input");
		trustBox.type = "checkbox";
		trustBox.checked = true;
		trustRow.append(trustBox, el("span", "", "trust project config"));
		trustRow.title = "on = pi -a (load this project's .pi settings/extensions), off = pi -na (ignore them, even if trust was saved earlier)";
		const openBtn = el("button", "", "Open here");
		foot.append(nameIn, trustRow, openBtn);
		pop.appendChild(foot);

		let cur = null; // {path} of the validated directory
		let res = null; // /api/resources payload, items get .on

		// what pi itself would load: everything, except project items when untrusted
		const defaultOn = (item) => (item.project ? trustBox.checked : true);

		const drawResources = () => {
			resWrap.innerHTML = "";
			for (const [key, label] of [["skills", "Skills"], ["extensions", "Extensions"]]) {
				if (!res[key].length) continue;
				const sec = el("div", "res-sec");
				sec.appendChild(el("div", "res-head", label));
				for (const item of res[key]) {
					const row = el("label", "checkrow");
					const box = el("input");
					box.type = "checkbox";
					if (item.project && !trustBox.checked) {
						// untrusted project code must not ride in via explicit --skill/-e
						item.on = false;
						box.disabled = true;
						row.classList.add("off");
						row.title = "project-local — enable “trust project config” to load";
					} else if (item.description) row.title = item.description;
					box.checked = item.on;
					box.onchange = () => (item.on = box.checked);
					row.append(box, el("span", "", item.name), el("span", "dim", item.origin));
					sec.appendChild(row);
				}
				resWrap.appendChild(sec);
			}
			if (res.skills.length || res.extensions.length)
				resWrap.appendChild(el("div", "res-note", "unchecking anything spawns with exactly this checked set — glob entries in settings.json aren't listed here and would be dropped"));
		};

		let navSeq = 0;
		const nav = async (p) => {
			const seq = ++navSeq;
			const rr = await fetch(`/api/resources?cwd=${encodeURIComponent(p)}`).then((r) => r.json());
			if (seq !== navSeq || !pop.isConnected) return; // superseded / popover closed
			if (rr.error) return toast(rr.error, "error");
			cur = { path: rr.cwd };
			pathIn.value = rr.cwd;
			res = {
				skills: rr.skills.map((x) => ({ ...x, on: defaultOn(x) })),
				extensions: rr.extensions.map((x) => ({ ...x, on: defaultOn(x) })),
			};
			toolDefaults = rr.defaultTools || null;
			drawResources();
			recomputeTools();
		};

		browseBtn.onclick = async () => {
			browseBtn.disabled = true;
			try {
				const picked = await pickDir();
				if (picked && pop.isConnected) nav(picked);
			} finally {
				browseBtn.disabled = false;
			}
		};

		trustBox.onchange = () => {
			recomputeTools(); // a trusted project's defaultTools replaces the global list
			if (!res) return;
			for (const item of [...res.skills, ...res.extensions]) if (item.project) item.on = trustBox.checked;
			drawResources();
		};
		pathIn.onkeydown = (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				nav(pathIn.value.trim() || "~");
			}
		};
		openBtn.onclick = () => {
			if (!cur) return;
			const extra = {};
			if (nameIn.value.trim()) extra.name = nameIn.value.trim();
			// ALWAYS explicit: unchecked must mean pi -na (ignore this project's
			// config), not "say nothing". Saying nothing let a saved trust decision
			// or defaultProjectTrust:"always" load the project's .pi settings and
			// extensions anyway — the box looked like a decision and wasn't one.
			extra.approve = trustBox.checked;
			// flags only when the set differs from what pi would load on its own
			// (`on` is already false for project items while untrusted; the second
			// test is belt-and-braces so an unchecked box can never send repo code —
			// the server refuses it too)
			const sendable = (x) => x.on && (trustBox.checked || !x.project);
			if (res && [...res.skills, ...res.extensions].some((x) => x.on !== defaultOn(x)))
				extra.resources = {
					skills: res.skills.filter(sendable).map((x) => x.path),
					extensions: res.extensions.filter(sendable).map((x) => x.path),
				};
			const off = (builtinTools || []).filter((t) => !t.on && !t.unknown).map((t) => t.name);
			if (off.length) extra.excludeTools = off;
			const cwd = cur.path;
			closePopover();
			spawnSession(cwd, undefined, extra);
		};
		nav("~");
		setTimeout(() => pathIn.focus(), 0);
	});
}

// ── global wiring ──
$("send").onclick = send;
$("input").addEventListener("keydown", (e) => {
	if (comp.open) {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			comp.sel = (comp.sel + 1) % comp.items.length;
			return drawCompletion();
		}
		if (e.key === "ArrowUp") {
			e.preventDefault();
			comp.sel = (comp.sel - 1 + comp.items.length) % comp.items.length;
			return drawCompletion();
		}
		if (e.key === "Tab" || e.key === "Enter") {
			e.preventDefault();
			return applyCompletion();
		}
		if (e.key === "Escape") {
			e.stopPropagation(); // the document Esc handler must not see this as reclaim+abort
			comp.open = false;
			$("completion").hidden = true;
			return;
		}
	}
	if (e.key === "Enter" && !e.shiftKey) {
		if (e.altKey) {
			// Alt+Enter → follow-up, mirroring the TUI
			e.preventDefault();
			const prev = $("mode").value;
			$("mode").value = "follow_up";
			send().finally(() => ($("mode").value = prev));
			return;
		}
		e.preventDefault();
		send();
	}
});
$("input").addEventListener("input", updateCompletion);
$("input").addEventListener("click", updateCompletion);
$("input").addEventListener("paste", (e) => {
	if (!L) return;
	for (const item of e.clipboardData?.items || []) {
		if (item.type.startsWith("image/")) {
			e.preventDefault();
			addImageFile(item.getAsFile());
		}
	}
});
$("composer").addEventListener("dragover", (e) => e.preventDefault());
$("composer").addEventListener("drop", (e) => {
	e.preventDefault();
	if (!L) return;
	for (const f of e.dataTransfer?.files || []) addImageFile(f);
});

document.addEventListener("keydown", (e) => {
	// Ctrl/Cmd+B folds the rail. Nothing else in the desk binds it (the composer's
	// own handler runs first and never sees a plain modifier+letter).
	if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && (e.key === "b" || e.key === "B")) {
		e.preventDefault();
		return toggleRail();
	}
	if (e.key !== "Escape") return;
	if (document.getElementById("popover")) return closePopover();
	if (!L) return;
	const dialog = document.querySelector("#dialogs .dialog");
	if (dialog) return; // dialogs own Escape via their Cancel buttons; don't abort under a dialog
	if (comp.open) return;
	// TUI Esc: reclaim queued messages, then abort. Both halves belong to the
	// session that was selected when Esc was pressed — `reclaimQueue` guards
	// itself, but the abort has to carry the id captured HERE: reading the global
	// after the await aborts whichever session you switched to.
	const g = stageGen;
	const id = L.id;
	(async () => {
		try {
			await reclaimQueue();
			if (stale(g)) return;
			await fetch(`/api/session/${id}/abort`, { method: "POST" });
		} catch {}
	})();
});

$("abort").onclick = () => selected?.kind === "live" && fetch(`/api/session/${selected.id}/abort`, { method: "POST" });
$("kill").onclick = async () => {
	if (selected?.kind !== "live") return;
	if (!confirm("Kill this session process?")) return;
	await fetch(`/api/session/${selected.id}`, { method: "DELETE" });
	clearStage();
	selected = null;
	$("composer").hidden = true;
	$("empty").hidden = false;
	refreshRail();
};
$("model-chip").onclick = modelPicker;
$("think-chip").onclick = thinkingPicker;
$("sess-name").onclick = renameSession;
$("btn-new").onclick = () => handleDeskCommand("/new");
$("btn-fork").onclick = forkPicker;
$("btn-compact").onclick = () => handleDeskCommand("/compact");
$("btn-export").onclick = exportSession;
$("btn-settings").onclick = () => settingsModal("session");
$("btn-desk-settings").onclick = () => settingsModal("skills");

// ── theme ── (index.html applies the saved theme pre-CSS; this owns cycling + live system-follow)
const THEME_ORDER = ["auto", "light", "dark"];
const THEME_MARKS = { auto: "◐", light: "○", dark: "●" };
const darkMedia = matchMedia("(prefers-color-scheme: dark)");
function applyTheme() {
	const stored = localStorage.getItem("nana-code-theme");
	const pref = THEME_ORDER.includes(stored) ? stored : "auto";
	document.documentElement.dataset.theme = pref === "auto" ? (darkMedia.matches ? "dark" : "light") : pref;
	$("theme-btn").textContent = `${THEME_MARKS[pref]} ${pref}`;
}
$("theme-btn").onclick = () => {
	const cur = localStorage.getItem("nana-code-theme");
	const i = Math.max(0, THEME_ORDER.indexOf(cur)); // unset/garbage counts as "auto"
	localStorage.setItem("nana-code-theme", THEME_ORDER[(i + 1) % THEME_ORDER.length]);
	applyTheme();
};
darkMedia.addEventListener("change", applyTheme);
applyTheme();
$("btn-spawn").onclick = () => spawnPopover($("btn-spawn"));

// ── rail collapse ── (persisted per browser; Ctrl/Cmd+B toggles. With the rail
// away the masthead carries a compact spawn button, so "open a session" never
// becomes unreachable.)
const RAIL_KEY = "nana-code-rail";
const railClosed = () => localStorage.getItem(RAIL_KEY) === "closed";
function applyRail() {
	const closed = railClosed();
	// same attribute index.html sets pre-paint — one mechanism, no first-frame flash
	if (closed) document.documentElement.dataset.rail = "closed";
	else delete document.documentElement.dataset.rail;
	const t = $("rail-toggle");
	t.textContent = closed ? "\u2630" : "\u27e8";
	t.title = closed ? "Show the sidebar (Ctrl/Cmd+B)" : "Hide the sidebar (Ctrl/Cmd+B)";
	t.setAttribute("aria-expanded", String(!closed));
	$("btn-spawn-mast").hidden = !closed;
}
function toggleRail() {
	localStorage.setItem(RAIL_KEY, railClosed() ? "open" : "closed");
	applyRail();
	if (railClosed()) closePopover(); // a popover anchored to the rail button would hang in space
}
$("rail-toggle").onclick = toggleRail;
$("btn-spawn-mast").onclick = () => spawnPopover($("btn-spawn-mast"));
applyRail();

refreshRail();
setInterval(refreshRail, 15000);
