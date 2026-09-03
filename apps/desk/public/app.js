import { mdToHtml } from "./md.js";

const $ = (id) => document.getElementById(id);
const HOME = "~";

const short = (p) => (p || "").replace(/^(\/(Users|home)\/[^/]+|[A-Za-z]:\\Users\\[^\\]+)/, HOME);
const basename = (p) => (p || "").split(/[\\/]/).pop();
const stripAnsi = (s) => String(s ?? "").replace(/\x1b\[[0-9;]*m/g, "");
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

function newLiveState(id, cwd) {
	return {
		id, cwd,
		streaming: false,
		state: null, // last get_state data
		ctx: { container: $("transcript"), toolRows: new Map() },
		liveEls: [], // elements created from deltas since last message_start
		optimisticUserEls: [], // user bubbles appended at send(), awaiting their echoed message_end
		currentBubble: null,
		attachments: [], // {data, mimeType, name}
		commands: null, // get_commands cache
		files: null,
		retryNote: null,
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
	const r = await fetch(`/api/session/${L.id}/rpc`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ command }),
	}).then((r) => r.json());
	if (r.error) throw new Error(r.error);
	if (!r.success) throw new Error(r.error || `${command.type} failed`);
	return r.data;
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

function el(tag, cls, text) {
	const e = document.createElement(tag);
	if (cls) e.className = cls;
	if (text !== undefined) e.textContent = text;
	return e;
}

function contentBlocks(content) {
	return typeof content === "string" ? [{ type: "text", text: content }] : content || [];
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

function renderImage(block) {
	const img = el("img", "att-img");
	img.src = `data:${block.mimeType};base64,${block.data}`;
	return img;
}

const ARG_KEYS = ["command", "path", "file_path", "pattern", "url", "query"];
function argSummary(args) {
	if (!args || typeof args !== "object") return "";
	for (const k of ARG_KEYS) if (typeof args[k] === "string") return args[k].slice(0, 160);
	const s = JSON.stringify(args);
	return s === "{}" ? "" : s.slice(0, 160);
}

function toolRow(ctx, id, name, args) {
	let row = id ? ctx.toolRows.get(id) : null;
	if (row && !row.isConnected) row = null;
	if (!row) {
		row = el("div", "tool-card");
		row.innerHTML = `<div class="tool-head"><span class="mark spin">⚙</span><span class="tname"></span><span class="targ"></span><span class="caret">▸</span></div><div class="tool-body" hidden><details class="targs"><summary>arguments</summary><pre></pre></details><pre class="tout" hidden></pre><pre class="tdiff" hidden></pre></div>`;
		row.querySelector(".tool-head").onclick = () => {
			const body = row.querySelector(".tool-body");
			body.hidden = !body.hidden;
			row.dataset.userToggled = "1";
			row.querySelector(".caret").textContent = body.hidden ? "▸" : "▾";
		};
		ctx.container.appendChild(row);
		if (id) ctx.toolRows.set(id, row);
	}
	row.querySelector(".tname").textContent = name || "";
	if (args !== undefined) {
		row.querySelector(".targ").textContent = argSummary(args);
		row.querySelector(".targs pre").textContent = JSON.stringify(args, null, 2);
	}
	return row;
}

function setToolStreaming(row, text) {
	const body = row.querySelector(".tool-body");
	const out = row.querySelector(".tout");
	if (!row.dataset.userToggled) {
		body.hidden = false;
		row.querySelector(".caret").textContent = "▾";
	}
	out.hidden = false;
	out.textContent = String(text ?? "").slice(-4000);
}

function renderDiff(pre, diff) {
	pre.hidden = false;
	pre.innerHTML = "";
	for (const line of String(diff).split("\n")) {
		const d = el("div", line.startsWith("+") ? "dadd" : line.startsWith("-") ? "ddel" : line.startsWith("@") ? "dhunk" : "dctx");
		d.textContent = line || " ";
		pre.appendChild(d);
	}
}

function finishToolRow(ctx, m) {
	// m: {toolCallId, toolName, content, details, isError}
	const row = toolRow(ctx, m.toolCallId, m.toolName);
	const mark = row.querySelector(".mark");
	mark.className = `mark ${m.isError ? "bad" : "ok"}`;
	mark.textContent = m.isError ? "✗" : "✓";
	const texts = contentBlocks(m.content).filter((b) => b.type === "text").map((b) => b.text).join("\n");
	const out = row.querySelector(".tout");
	if (texts.trim()) {
		out.hidden = false;
		out.textContent = texts.length > 20000 ? `${texts.slice(0, 20000)}\n… (${texts.length} chars)` : texts;
	} else out.hidden = true;
	for (const b of contentBlocks(m.content).filter((b) => b.type === "image"))
		row.querySelector(".tool-body").appendChild(renderImage(b));
	if (m.details?.diff) renderDiff(row.querySelector(".tdiff"), m.details.diff);
	const body = row.querySelector(".tool-body");
	if (!row.dataset.userToggled) {
		body.hidden = !m.isError;
		row.querySelector(".caret").textContent = body.hidden ? "▸" : "▾";
	}
	return row;
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
	return row;
}

function finishBashRow(row, { output, exitCode, cancelled, truncated } = {}, error) {
	const mark = row.querySelector(".mark");
	const failed = error || cancelled || (exitCode !== 0 && exitCode !== undefined);
	mark.className = `mark ${failed ? "bad" : "ok"}`;
	mark.textContent = failed ? "✗" : "✓";
	if (output !== undefined) {
		const out = row.querySelector(".bout");
		out.hidden = !output;
		out.textContent = output;
	}
	row.querySelector(".bexit").textContent = error
		? String(error)
		: cancelled
			? "cancelled"
			: `exit ${exitCode}${truncated ? " · truncated" : ""}`;
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
					const sub = { container: group, toolRows: ctx.toolRows };
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
	try {
		L.state = await rpc({ type: "get_state" });
	} catch {
		return;
	}
	const s = L.state;
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
	try {
		const d = await rpc({ type: "get_session_stats" });
		const cu = d.contextUsage;
		$("foot-tokens").textContent = `in ${fmtTok(d.tokens.input)} · out ${fmtTok(d.tokens.output)} · cache ${fmtTok(d.tokens.cacheRead)}`;
		$("foot-cost").textContent = fmtCost(d.cost);
		$("foot-msgs").textContent = `${d.totalMessages} msgs`;
		if (cu && cu.percent != null) {
			$("ctx-meter").hidden = false;
			$("ctx-fill").style.width = `${Math.min(100, cu.percent)}%`;
			$("ctx-fill").className = `meter-fill${cu.percent > 80 ? " hot" : ""}`;
			$("ctx-label").textContent = `${Math.round(cu.percent)}% of ${fmtTok(cu.contextWindow)}`;
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
	try {
		const d = await rpc({ type: "get_messages" });
		renderMessages(d.messages || []);
	} catch {}
	refreshState();
	refreshStats();
}

// ── dialogs (extension UI) ──
function showDialog(req) {
	if (!L || document.querySelector(`[data-ui-id="${CSS.escape(req.id)}"]`)) return;
	const wrap = el("div", "dialog");
	wrap.dataset.uiId = req.id;
	const card = el("div", "dialog-card");
	card.appendChild(el("div", "dialog-title", stripAnsi(req.title || req.method)));
	if (req.message) card.appendChild(el("div", "dialog-msg", stripAnsi(req.message)));
	const answer = (body) => {
		fetch(`/api/session/${L.id}/ui-response`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ id: req.id, ...body }),
		});
		wrap.remove();
	};
	const row = el("div", "dialog-row");
	if (req.method === "select") {
		for (const opt of req.options || []) {
			const b = el("button", "dialog-opt", stripAnsi(opt));
			b.onclick = () => answer({ value: opt });
			row.appendChild(b);
		}
	} else if (req.method === "confirm") {
		const yes = el("button", "dialog-opt", "Yes");
		yes.onclick = () => answer({ confirmed: true });
		const no = el("button", "dialog-opt quiet", "No");
		no.onclick = () => answer({ confirmed: false });
		row.append(yes, no);
	} else if (req.method === "input") {
		const inp = el("input", "dialog-input");
		inp.placeholder = req.placeholder || "";
		const ok = el("button", "dialog-opt", "OK");
		ok.onclick = () => answer({ value: inp.value });
		inp.onkeydown = (e) => e.key === "Enter" && ok.click();
		row.append(inp, ok);
		setTimeout(() => inp.focus(), 0);
	} else if (req.method === "editor") {
		const ta = el("textarea", "dialog-editor");
		ta.value = req.prefill || "";
		const ok = el("button", "dialog-opt", "Save");
		ok.onclick = () => answer({ value: ta.value });
		row.append(ta, ok);
		setTimeout(() => ta.focus(), 0);
	}
	const cancel = el("button", "dialog-opt quiet", "Cancel");
	cancel.onclick = () => answer({ cancelled: true });
	row.appendChild(cancel);
	card.appendChild(row);
	if (req.timeout) card.appendChild(el("div", "dialog-timeout", `auto-resolves in ~${Math.round(req.timeout / 1000)}s`));
	wrap.appendChild(card);
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

function renderWidgets(widgets) {
	const above = $("widgets-above");
	const below = $("widgets-below");
	above.innerHTML = "";
	below.innerHTML = "";
	for (const [k, w] of Object.entries(widgets || {})) {
		const box = el("pre", "widget");
		box.title = k;
		box.textContent = (w.lines || []).map(stripAnsi).join("\n");
		(w.placement === "belowEditor" ? below : above).appendChild(box);
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
	try {
		const d = await rpc({ type: "clear_queue" });
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
	document.title = "the pi desk";
}

// ── live view ──
function openLive(id, cwd) {
	clearStage();
	selected = { kind: "live", id, cwd };
	L = newLiveState(id, cwd);
	$("empty").hidden = true;
	$("composer").hidden = false;
	$("live-head").hidden = false;
	$("live-foot").hidden = false;
	$("cwd-label").textContent = short(cwd);
	setChip("…");

	stream = new EventSource(`/api/session/${id}/events`);
	stream.onmessage = (ev) => {
		let e;
		try {
			e = JSON.parse(ev.data);
		} catch {
			return;
		}
		handleEvent(e);
	};
	stream.onerror = () => L && setChip("disconnected");

	resync();
	rpc({ type: "get_commands" }).then((d) => (L.commands = d.commands || [])).catch(() => {});
	fetch(`/api/session/${id}/files`).then((r) => r.json()).then((d) => (L.files = d.files || [])).catch(() => {});
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
			for (const d of e.dialogs || []) showDialog(d);
			renderStatuses(e.statuses);
			renderWidgets(e.widgets);
			renderQueue(e.queue);
			if (e.title) document.title = `${e.title} — pi desk`;
			if (e.state === "exited") setChip("exited");
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
			const texts = contentBlocks(e.partialResult?.content).filter((b) => b.type === "text").map((b) => b.text).join("\n");
			setToolStreaming(row, texts);
			break;
		}
		case "tool_execution_end":
			finishToolRow(L.ctx, { toolCallId: e.toolCallId, toolName: e.toolName, content: e.result?.content, details: e.result?.details, isError: e.isError });
			break;
		case "bash_execution_update": {
			const row = L.ctx.toolRows.get(`bash:${e.id}`);
			if (row) {
				const out = row.querySelector(".bout");
				out.hidden = false;
				out.textContent = (out.textContent + e.delta).slice(-20000);
			}
			break;
		}
		case "desk_bash_result": {
			const row = L.ctx.toolRows.get(`bash:${e.id}`);
			if (row) finishBashRow(row, e.data, e.success ? undefined : e.error || "failed");
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
			else if (e.result)
				expandableNote(L.ctx, `— compacted ${fmtTok(e.result.tokensBefore)} → ~${fmtTok(e.result.estimatedTokensAfter)} —`, e.result.summary);
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
				const box = el("pre", "widget");
				box.title = e.widgetKey;
				box.textContent = e.widgetLines.map(stripAnsi).join("\n");
				parent.appendChild(box);
			}
			break;
		}
		case "setTitle":
			document.title = e.title ? `${e.title} — pi desk` : "the pi desk";
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
		row.append(el("b", "", sk.name), el("span", "dim", ` ${sk.origin}`));
		if (sk.description) row.title = sk.description;
		body.appendChild(row);
	}
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

async function tabNana(body) {
	const s = await getSettings();
	const n = s.nana;
	const notifyEn = el("input");
	notifyEn.type = "checkbox";
	notifyEn.checked = n.notify?.enabled !== false;
	const notifyHeadless = el("input");
	notifyHeadless.type = "checkbox";
	notifyHeadless.checked = n.notify?.headless === true;
	const journalEn = el("input");
	journalEn.type = "checkbox";
	journalEn.checked = n.journal?.enabled !== false;
	const lines = (arr) => (arr || []).join("\n");
	const extra = area(lines(n.gate?.extraPatterns), 3);
	const allow = area(lines(n.gate?.allowPatterns), 3);
	const prot = area(lines(n.gate?.protectedPaths), 3);
	const post = area(JSON.stringify(n.postEdit?.commands || [], null, 2), 6);
	body.append(
		el("div", "sec-head", `nana-pack — ${s.nanaPath}`),
		field("notifications", notifyEn), field("notify when headless", notifyHeadless), field("lifecycle journal", journalEn),
		el("div", "sec-head", "Gate (one regex per line)"),
		field("extra dangerous", extra), field("allow (skip gate)", allow), field("protected paths", prot),
		el("div", "sec-head", "Post-edit commands (JSON — [{match, run, timeoutMs?}])"),
		post,
		saveBtn("Save nana-pack", async () => {
			const toLines = (a) => a.value.split("\n").map((x) => x.trim()).filter(Boolean);
			const config = {
				...n,
				notify: { ...n.notify, enabled: notifyEn.checked, headless: notifyHeadless.checked },
				journal: { ...n.journal, enabled: journalEn.checked },
				gate: { ...n.gate, extraPatterns: toLines(extra), allowPatterns: toLines(allow), protectedPaths: toLines(prot) },
				postEdit: { ...n.postEdit, commands: JSON.parse(post.value) },
			};
			const r = await fetch("/api/nana-pack", { method: "POST", headers: JH, body: JSON.stringify({ config }) }).then((r) => r.json());
			if (r.error) throw new Error(r.error);
		}),
		el("p", "dim", "Config is re-read on every event — changes apply to running sessions without restart."),
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
	try {
		await rpc({ type: "set_session_name", name });
		refreshState();
		refreshRail();
	} catch (e) {
		toast(String(e.message || e), "error");
	}
}

async function exportSession() {
	try {
		const r = await fetch(`/api/session/${L.id}/export`, { method: "POST" });
		if (!r.ok) throw new Error((await r.json()).error || "export failed");
		const blob = await r.blob();
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = `pi-session-${L.state?.sessionName || L.id}.html`;
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

async function handleDeskCommand(text) {
	const m = text.match(/^\/(\w+)\s*(.*)$/s);
	if (!m) return false;
	const [, cmd, rest] = m;
	switch (cmd) {
		case "model":
			if (!rest) modelPicker();
			else {
				try {
					const models = (await rpc({ type: "get_available_models" })).models || [];
					const q = rest.toLowerCase();
					const hit = models.find((mo) => `${mo.provider}/${mo.id}`.toLowerCase().includes(q) || (mo.name || "").toLowerCase().includes(q));
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
					.then(() => (toast(`thinking → ${rest.trim()}`), refreshState()))
					.catch((e) => toast(String(e.message || e), "error"));
			return true;
		case "compact":
			toast("compacting…");
			rpc({ type: "compact", ...(rest ? { customInstructions: rest } : {}) }).catch((e) => toast(String(e.message || e), "error"));
			return true;
		case "name":
			if (rest) rpc({ type: "set_session_name", name: rest.trim() }).then(() => (refreshState(), refreshRail())).catch((e) => toast(String(e), "error"));
			else renameSession();
			return true;
		case "new":
			rpc({ type: "new_session" })
				.then((d) => {
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
	const input = $("input");
	const text = input.value.trim();
	if (!text && !L.attachments.length) return;

	if (text.startsWith("!")) {
		if (text.startsWith("!!")) return toast("`!!` (hidden bash) isn't supported over RPC — use `!`", "warning");
		const command = text.slice(1).trim();
		input.value = "";
		try {
			const r = await fetch(`/api/session/${L.id}/bash`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ command }),
			}).then((r) => r.json());
			if (r.error) return toast(r.error, "error");
			bashRow(L.ctx, r.id, command);
			pin(L.ctx.container);
		} catch (e) {
			toast(String(e.message || e), "error");
		}
		return;
	}

	if (text.startsWith("/") && (await handleDeskCommand(text))) {
		input.value = "";
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
	const restore = () => {
		input.value = input.value ? `${text}\n${input.value}` : text;
		setAttachments(savedAtt);
		if (optimistic) {
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
		if (!r.ok) {
			restore();
			return toast(r.error || "prompt rejected", "error");
		}
	} catch (e) {
		restore();
		toast(String(e.message || e), "error");
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
	const reader = new FileReader();
	reader.onload = () => {
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
		found = {
			start: 0,
			end: pos,
			items: [...deskItems, ...extItems].filter((i) => i.label.slice(1).toLowerCase().startsWith(q)),
		};
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
	selected = { kind: "hist", file, cwd };
	$("empty").hidden = true;
	$("composer").hidden = true;
	$("hist-head").hidden = false;

	const data = await fetch(`/api/transcript?file=${encodeURIComponent(file)}`).then((r) => r.json());
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
	openLive(r.id, cwd);
}

// ── spawn popover: pick a directory (native OS dialog), toggle skills/
// extensions, open. (pi has no MCP — extensions ARE the pluggable surface;
// toggling happens at spawn because pi resolves resources at process start.)
function spawnPopover() {
	popover($("btn-spawn"), (pop) => {
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

		const foot = el("div", "spawn-foot");
		const nameIn = el("input", "pop-filter");
		nameIn.placeholder = "session name (optional)";
		const trustRow = el("label", "checkrow");
		const trustBox = el("input");
		trustBox.type = "checkbox";
		trustBox.checked = true;
		trustRow.append(trustBox, el("span", "", "trust project config"));
		trustRow.title = "pi -a: load .pi settings/extensions from this project (RPC sessions never prompt)";
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
			drawResources();
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
			if (trustBox.checked) extra.approve = true;
			// flags only when the set differs from what pi would load on its own
			if (res && [...res.skills, ...res.extensions].some((x) => x.on !== defaultOn(x)))
				extra.resources = {
					skills: res.skills.filter((x) => x.on).map((x) => x.path),
					extensions: res.extensions.filter((x) => x.on).map((x) => x.path),
				};
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
	if (e.key !== "Escape") return;
	if (document.getElementById("popover")) return closePopover();
	if (!L) return;
	const dialog = document.querySelector("#dialogs .dialog");
	if (dialog) return; // dialogs own Escape via their Cancel buttons; don't abort under a dialog
	if (comp.open) return;
	// TUI Esc: reclaim queued messages, then abort
	(async () => {
		try {
			await reclaimQueue();
			await fetch(`/api/session/${L.id}/abort`, { method: "POST" });
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
	const stored = localStorage.getItem("desk-theme");
	const pref = THEME_ORDER.includes(stored) ? stored : "auto";
	document.documentElement.dataset.theme = pref === "auto" ? (darkMedia.matches ? "dark" : "light") : pref;
	$("theme-btn").textContent = `${THEME_MARKS[pref]} ${pref}`;
}
$("theme-btn").onclick = () => {
	const cur = localStorage.getItem("desk-theme");
	const i = Math.max(0, THEME_ORDER.indexOf(cur)); // unset/garbage counts as "auto"
	localStorage.setItem("desk-theme", THEME_ORDER[(i + 1) % THEME_ORDER.length]);
	applyTheme();
};
darkMedia.addEventListener("change", applyTheme);
applyTheme();
$("btn-spawn").onclick = spawnPopover;

refreshRail();
setInterval(refreshRail, 15000);
