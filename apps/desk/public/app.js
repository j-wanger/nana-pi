import { mdToHtml } from "./md.js";

const $ = (id) => document.getElementById(id);
const HOME = "~";

const short = (p) => (p || "").replace(/^\/(Users|home)\/[^/]+/, HOME);
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
		currentBubble: null,
		attachments: [], // {data, mimeType, name}
		commands: null, // get_commands cache
		files: null,
		retryNote: null,
	};
}

// ── rail ──
async function refreshRail() {
	const [live, groups] = await Promise.all([
		fetch("/api/live").then((r) => r.json()),
		fetch("/api/sessions").then((r) => r.json()),
	]);

	const states = await Promise.all(
		live.map((c) =>
			c.state === "running"
				? fetch(`/api/session/${c.id}/rpc`, {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({ command: { type: "get_state" } }),
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
	for (const g of groups) {
		const h = document.createElement("div");
		h.className = "ws-head";
		h.textContent = short(g.cwd);
		list.appendChild(h);
		for (const s of g.sessions) {
			count++;
			const b = document.createElement("button");
			b.className = "sess" + (selected?.kind === "hist" && selected.file === s.file ? " selected" : "");
			b.innerHTML = `<span class="when">${when(s.mtime)}</span><span class="title"></span>`;
			b.querySelector(".title").textContent = s.name || s.title || "(untitled)";
			b.title = s.title || "(untitled)";
			b.onclick = () => openHistorical(s.file, g.cwd);
			list.appendChild(b);
		}
	}
	$("stats").textContent = `${groups.length} workspaces · ${count} sessions · ${live.length} live`;
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
	$("sess-file").textContent = s.sessionFile ? short(s.sessionFile).split("/").pop() : "(ephemeral)";
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
		const close = (ev) => {
			if (!pop.contains(ev.target)) closePopover();
		};
		document.addEventListener("mousedown", close, { once: true });
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

function settingsPopover() {
	popover($("btn-settings"), (pop) => {
		pop.appendChild(el("div", "pop-title", "Session settings"));
		const mk = (label, get, set, opts) => {
			const row = el("div", "pop-setting");
			row.appendChild(el("span", "", label));
			const sel = el("select");
			for (const o of opts) {
				const op = el("option", "", o);
				op.value = o;
				sel.appendChild(op);
			}
			sel.value = String(get() ?? opts[0]);
			sel.onchange = () => set(sel.value);
			row.appendChild(sel);
			pop.appendChild(row);
		};
		mk("steering", () => L.state?.steeringMode, (v) => rpc({ type: "set_steering_mode", mode: v }).then(refreshState).catch((e) => toast(String(e), "error")), ["one-at-a-time", "all"]);
		mk("follow-ups", () => L.state?.followUpMode, (v) => rpc({ type: "set_follow_up_mode", mode: v }).then(refreshState).catch((e) => toast(String(e), "error")), ["one-at-a-time", "all"]);
		mk("auto-compaction", () => String(L.state?.autoCompactionEnabled ?? true), (v) => rpc({ type: "set_auto_compaction", enabled: v === "true" }).then(refreshState).catch((e) => toast(String(e), "error")), ["true", "false"]);
	});
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
	const restore = () => {
		input.value = input.value ? `${text}\n${input.value}` : text;
		setAttachments(savedAtt);
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
		if (mode === "prompt") {
			const pinned = isPinned(L.ctx.container);
			appendMessage({ role: "user", content: text }, L.ctx);
			if (pinned) pin(L.ctx.container);
			setChip("running");
			L.streaming = true;
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
	$("hist-title").textContent = data.name || short(file).split("/").pop();
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

async function spawnSession(cwd, sessionFile) {
	const body = { cwd };
	if (sessionFile) body.session = sessionFile;
	const r = await fetch("/api/spawn", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	}).then((r) => r.json());
	if (r.error) return toast(r.error, "error");
	openLive(r.id, cwd);
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
	if (e.key !== "Escape" || !L) return;
	const dialog = document.querySelector("#dialogs .dialog");
	if (dialog) return; // dialogs own Escape via their Cancel buttons; don't abort under a dialog
	if (comp.open) return;
	if (document.getElementById("popover")) return closePopover();
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
$("btn-settings").onclick = settingsPopover;
$("spawn-form").onsubmit = (e) => {
	e.preventDefault();
	const raw = $("spawn-cwd").value.trim();
	if (raw) spawnSession(raw); // server expands a leading ~
};

// ── the wire ──
function startWire() {
	const es = new EventSource("/api/wire");
	es.onopen = () => $("wire-dot").classList.remove("off");
	es.onerror = () => $("wire-dot").classList.add("off");
	es.onmessage = (ev) => {
		let e;
		try {
			e = JSON.parse(ev.data);
		} catch {
			return;
		}
		const row = document.createElement("div");
		row.className = "wire-row fresh";
		const evName = (e.event || "?").replace("session_", "");
		const cls = evName.includes("compact") ? "compact" : evName.includes("fail") ? "fail" : "";
		// journal fields are untrusted (project-local extensions can write the journal) — textContent only
		row.appendChild(el("span", "", (e.ts || "").slice(11, 19)));
		row.appendChild(el("span", `ev ${cls}`, evName));
		row.appendChild(el("span", "wcwd", short(e.cwd)));
		const list = $("wire-list");
		list.prepend(row);
		while (list.children.length > 100) list.lastChild.remove();
	};
}

refreshRail();
startWire();
setInterval(refreshRail, 15000);
