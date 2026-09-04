// desk-client.mjs — the reusable pi-desk client core, extracted from app.js (2026-09-04).
//
// Pure module: no document ids, no globals, no desk state. Everything takes its
// targets as arguments. Two consumers: the desk itself (app.js) and the stage
// host (stage/). Keeping one copy is the point — a fork of app.js drifts.
//
//   rendering   el · contentBlocks · renderImage · argSummary
//               toolRow · setToolStreaming · renderDiff · finishToolRow
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
