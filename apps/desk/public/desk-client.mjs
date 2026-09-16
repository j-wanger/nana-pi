// desk-client.mjs — the reusable nana code client core, extracted from app.js (2026-09-04).
//
// Pure module: no document ids, no globals, no desk state. Everything takes its
// targets as arguments. Two consumers: the desk itself (app.js) and the stage
// host (stage/). Keeping one copy is the point — a fork of app.js drifts.
//
//   rendering   el · contentBlocks · renderImage · argSummary
//               toolRow · setToolStreaming · renderDiff · finishToolRow
//   live text   activityVerb · toolActivity (the composer's activity line)
//               parseSkillMessage · skillLabel · matchesUserEcho
//   dialogs     buildDialog (extension_ui_request select/confirm/input/editor)
//   transport   openEventStream · postJson · rpcCall
//
// A render ctx is { container, toolRows: Map, summarize?(name, args), decorate?(row, m) }.
// `summarize` overrides the one-line argument summary per tool; `decorate` runs after a
// tool result is rendered (the desk uses both for its subagent card).

export const stripAnsi = (s) => String(s ?? "").replace(/\x1b\[[0-9;]*m/g, "");

export function el(tag, cls, text) {
	const e = document.createElement(tag);
	if (cls) e.className = cls;
	if (text !== undefined) e.textContent = text;
	return e;
}

export function contentBlocks(content) {
	return typeof content === "string" ? [{ type: "text", text: content }] : content || [];
}

export function renderImage(block) {
	const img = el("img", "att-img");
	img.src = `data:${block.mimeType};base64,${block.data}`;
	return img;
}

export const ARG_KEYS = ["command", "path", "file_path", "pattern", "url", "query"];
export function argSummary(args) {
	if (!args || typeof args !== "object") return "";
	for (const k of ARG_KEYS) if (typeof args[k] === "string") return args[k].slice(0, 160);
	const s = JSON.stringify(args);
	return s === "{}" ? "" : s.slice(0, 160);
}

// ── live activity: what the turn is doing right now ──
// Pure. A desk/pi event in, the verb phrase for the composer's activity line
// out; null = this event says nothing new, keep the phrase you have
// (most-recent-wins is the caller's job).
const baseName = (p) => String(p ?? "").split(/[\\/]/).pop();

export function toolActivity(toolName, args) {
	const name = String(toolName || "tool");
	const arg = argSummary(args); // same key order the tool cards summarize by
	switch (name) {
		case "read":
			return arg ? `Reading ${baseName(arg)}…` : "Reading…";
		case "edit":
			return arg ? `Editing ${baseName(arg)}…` : "Editing…";
		case "write":
			return arg ? `Writing ${baseName(arg)}…` : "Writing…";
		case "bash":
			return arg ? `Running: ${arg.slice(0, 60)}…` : "Running a command…";
		case "grep":
		case "find":
		case "ls":
			return "Searching…";
		case "subagent":
			return "Delegating…";
		default:
			return `Running ${name}…`;
	}
}

export function activityVerb(e) {
	switch (e?.type) {
		case "agent_start":
			return "Starting…";
		case "message_update": {
			const a = e.assistantMessageEvent;
			if (a?.type === "thinking_start" || a?.type === "thinking_delta") return "Thinking…";
			if (a?.type === "text_start" || a?.type === "text_delta") return "Writing…";
			if (a?.type === "toolcall_start") return `Calling ${a.toolName || "tool"}…`;
			return null;
		}
		case "tool_execution_start":
			return toolActivity(e.toolName, e.args ?? e.input);
		case "tool_execution_end":
			return "Thinking…"; // the tool answered; the model is about to speak again
		case "compaction_start":
			return "Compacting context…";
		case "auto_retry_start":
			return `Retrying (${e.attempt}/${e.maxAttempts})…`;
		default:
			return null;
	}
}

// ── skill triggers ──
// pi EXPANDS `/skill:<name> [args]` into the whole skill file before it records
// the user message (`_expandSkillCommand`, agent-session.js), so what comes back
// as the echo is a `<skill …>` block, not what was typed. Parse that shape back
// — exactly, or not at all: anything that does not match renders as ordinary
// text.  { name, location, body, args } | null
const SKILL_OPEN = /^<skill name="([^"]*)" location="([^"]*)">$/;
const SKILL_CLOSE = "\n</skill>";
export function parseSkillMessage(text) {
	if (typeof text !== "string" || !text.startsWith('<skill name="')) return null;
	const nl = text.indexOf("\n");
	if (nl < 0) return null;
	const head = SKILL_OPEN.exec(text.slice(0, nl));
	if (!head) return null;
	// LAST, not first: a skill file that documents the wrapper (or just contains
	// the line `</skill>`) would otherwise be cut at its own text, and the rest of
	// the body would be read as the user's arguments.
	const close = text.lastIndexOf(SKILL_CLOSE);
	if (close < nl) return null;
	const rest = text.slice(close + SKILL_CLOSE.length);
	// pi appends the user's own args after a blank line, or nothing at all;
	// anything else means we cut in the wrong place, and a wrong parse must lose.
	if (rest !== "" && !rest.startsWith("\n\n")) return null;
	return { name: head[1], location: head[2], body: text.slice(nl + 1, close), args: rest.slice(2) };
}

// `/skill:name args` — what the user typed, recovered from the expansion.
export function skillLabel(text) {
	const sk = parseSkillMessage(text);
	return sk ? `/skill:${sk.name}${sk.args ? ` ${sk.args}` : ""}` : null;
}

// The optimistic user bubble is matched to pi's echo BY CONTENT (a FIFO match
// let another tab's echo consume ours). Ordinary prompts must still match
// exactly; the one tolerated difference is the skill expansion above, which can
// never equal what was typed — match those by name + args instead.
export function matchesUserEcho(typed, echo) {
	if (typed === echo) return true;
	const sk = parseSkillMessage(echo);
	if (!sk) return false;
	const m = /^\/skill:(\S+)([\s\S]*)$/.exec(String(typed ?? "").trim());
	return !!m && m[1] === sk.name && m[2].trim() === sk.args;
}

export function toolRow(ctx, id, name, args) {
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
		row.querySelector(".targ").textContent = ctx.summarize ? ctx.summarize(name, args) : argSummary(args);
		row.querySelector(".targs pre").textContent = JSON.stringify(args, null, 2);
	}
	return row;
}

export function setToolStreaming(row, text) {
	const body = row.querySelector(".tool-body");
	const out = row.querySelector(".tout");
	if (!row.dataset.userToggled) {
		body.hidden = false;
		row.querySelector(".caret").textContent = "▾";
	}
	out.hidden = false;
	out.textContent = String(text ?? "").slice(-4000);
}

export function renderDiff(pre, diff) {
	pre.hidden = false;
	pre.innerHTML = "";
	for (const line of String(diff).split("\n")) {
		const d = el("div", line.startsWith("+") ? "dadd" : line.startsWith("-") ? "ddel" : line.startsWith("@") ? "dhunk" : "dctx");
		d.textContent = line || " ";
		pre.appendChild(d);
	}
}

export function finishToolRow(ctx, m) {
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
	ctx.decorate?.(row, m);
	const body = row.querySelector(".tool-body");
	if (!row.dataset.userToggled) {
		body.hidden = !m.isError;
		row.querySelector(".caret").textContent = body.hidden ? "▸" : "▾";
	}
	return row;
}

// Build the card for an extension_ui_request dialog. `answer(body)` is called
// with {value} | {confirmed} | {cancelled:true}; the caller posts it and removes
// the wrapper. Returns the card element (caller decides where it mounts).
export function buildDialog(req, answer) {
	const card = el("div", "dialog-card");
	card.appendChild(el("div", "dialog-title", stripAnsi(req.title || req.method)));
	if (req.message) card.appendChild(el("div", "dialog-msg", stripAnsi(req.message)));
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
	return card;
}

// ── transport ──
export function openEventStream(url, onEvent, onError) {
	const stream = new EventSource(url);
	stream.onmessage = (ev) => {
		let e;
		try {
			e = JSON.parse(ev.data);
		} catch {
			return;
		}
		onEvent(e);
	};
	if (onError) stream.onerror = onError;
	return stream;
}

export const JSON_HEADERS = { "content-type": "application/json" };

export async function postJson(url, body) {
	return fetch(url, { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(body ?? {}) }).then((r) => r.json());
}

// Allowlisted RPC passthrough: `${sessionBase}/rpc` → the command's response data.
export async function rpcCall(sessionBase, command) {
	const r = await postJson(`${sessionBase}/rpc`, { command });
	if (r.error) throw new Error(r.error);
	if (!r.success) throw new Error(r.error || `${command.type} failed`);
	return r.data;
}
