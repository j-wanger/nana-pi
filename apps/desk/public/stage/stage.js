// stage.js — the stage host (design §3.3): stage + drawer + gate bar over one
// app listener. Second consumer of desk-client.mjs; the reducer/contract come
// from blocks.mjs. The layout is fixed and app-owned; the agent only fills it.
import { el, contentBlocks, stripAnsi, toolRow, setToolStreaming, finishToolRow, buildDialog, openEventStream, postJson } from "/desk-client.mjs";
import { reduceEntries, applyLiveBlocks, pathEntries, rowPrompt, fmtNum, columnDecimals, fmtCell, fmtY, summarizeSeries } from "/blocks.mjs";
import { mdToHtml } from "/md.js";

const $ = (id) => document.getElementById(id);
const JH = { "content-type": "application/json" };

// ── state ──
let manifest = null;
let session = null; // {id, cwd, state, ...}
let stream = null;
let blocks = []; // the stage, in first-appearance order
let leafId = null; // active-branch leaf at the last full replay
let hellos = 0; // desk_hello count on this stream (>1 = reconnect)
let streaming = false;
const turnsCtx = { container: null, toolRows: new Map() };
let liveText = null; // streaming assistant bubble
let currentTurn = null; // the .turn element receiving live content
const QUICK = [
	["general board", "Show the 2026-27 general board (top 30)"],
	["consensus board", "Show the consensus dynasty board (top 30)"],
	["which boards?", "Which boards are available?"],
];

// ── toasts / chip ──
function toast(message, type = "info", ms) {
	const t = el("div", `toast ${type}`, message);
	$("toasts").appendChild(t);
	setTimeout(() => t.remove(), ms || (type === "error" ? 10000 : 5000));
}
function setChip(s) {
	const c = $("chip");
	c.textContent = s;
	c.className = `chip ${s === "running" ? "run" : s === "idle" ? "ok" : s === "exited" || s === "disconnected" ? "bad" : ""}`;
	$("btn-abort").hidden = s !== "running";
}

// ── the stage ──
function renderStage() {
	const main = $("slot-main"), side = $("slot-side"), modal = $("modal-slot");
	main.innerHTML = ""; side.innerHTML = ""; modal.innerHTML = "";
	const shown = blocks.filter((b) => b.show !== false);
	for (const b of shown) {
		const target = b.slot === "side" ? side : b.slot === "modal" ? modal : main;
		target.appendChild(renderBlock(b));
	}
	side.hidden = !side.children.length;
	modal.hidden = !modal.children.length;
	$("empty").hidden = shown.length > 0;
}

function provenance(b) {
	const p = b.produced_by || {};
	const args = p.args && Object.keys(p.args).length ? JSON.stringify(p.args) : "";
	const foot = el("div", "blk-foot");
	foot.appendChild(el("span", "blk-scope", b.scope || ""));
	const by = el("span", "blk-by");
	by.textContent = `${p.tool || "?"}${args ? " " + args : ""}${p.at ? " · " + new Date(p.at).toLocaleTimeString() : ""}`;
	by.title = "produced by (stamped by nana-stage, not the model)";
	foot.appendChild(by);
	return foot;
}

function actionButtons(b, rowFor) {
	const box = el("div", "blk-actions");
	for (const a of b.actions || []) {
		if (a.per_row) continue;
		const btn = el("button", `btn small${a.mutates ? " mut" : ""}`, a.label);
		btn.onclick = () => compose(a.prompt, { send: !a.mutates });
		box.appendChild(btn);
	}
	return box;
}

function renderBlock(b) {
	const card = el("article", `blk blk-${b.type}`);
	card.dataset.id = b.id;
	const head = el("div", "blk-head");
	head.appendChild(el("h2", "blk-title", b.title));
	if (b.subtitle) head.appendChild(el("div", "blk-sub", b.subtitle));
	if (b.badges?.length) {
		const bb = el("div", "blk-badges");
		for (const t of b.badges) bb.appendChild(el("span", "badge", t));
		head.appendChild(bb);
	}
	card.appendChild(head);
	if (b.type === "table") card.appendChild(renderTable(b));
	else if (b.type === "card") card.appendChild(renderCard(b));
	else if (b.type === "chart") card.appendChild(renderChart(b));
	if (b.note) card.appendChild(el("div", "blk-note", b.note));
	const acts = actionButtons(b);
	if (acts.children.length) card.appendChild(acts);
	card.appendChild(provenance(b));
	return card;
}

function renderTable(b) {
	const wrap = el("div", "tbl-wrap");
	const t = el("table", "tbl");
	const perRow = (b.actions || []).filter((a) => a.per_row);
	const thead = el("thead"), hr = el("tr");
	for (const c of b.columns) hr.appendChild(el("th", c.type === "number" ? "num" : "", c.label));
	if (perRow.length) hr.appendChild(el("th", "", ""));
	thead.appendChild(hr);
	t.appendChild(thead);
	const tb = el("tbody");
	const dec = b.columns.map((c) => (c.type === "number" ? columnDecimals(b.rows, c.key) : 0));
	for (const r of b.rows) {
		const tr = el("tr");
		b.columns.forEach((c, i) => {
			const v = r[c.key];
			tr.appendChild(el("td", c.type === "number" ? "num" : "txt", c.type === "number" ? fmtCell(v, dec[i]) : v === null || v === undefined ? "" : String(v)));
		});
		if (perRow.length) {
			const td = el("td", "row-act");
			for (const a of perRow) {
				const btn = el("button", "btn tiny", a.label);
				btn.onclick = () => compose(rowPrompt(a.prompt, r), { send: !a.mutates });
				td.appendChild(btn);
			}
			tr.appendChild(td);
		}
		tb.appendChild(tr);
	}
	t.appendChild(tb);
	wrap.appendChild(t);
	if (!b.rows.length) wrap.appendChild(el("div", "dim", "(no rows)"));
	return wrap;
}

function renderCard(b) {
	const dl = el("dl", "fields");
	for (const f of b.fields) {
		dl.appendChild(el("dt", "", f.label));
		const dd = el("dd", "", typeof f.value === "number" ? fmtNum(f.value) : String(f.value));
		if (f.evidence) dd.appendChild(el("span", "evid", f.evidence)); // the source, visibly, not on hover
		dl.appendChild(dd);
	}
	return dl;
}

// ── chart: inline SVG line chart (dataviz rules: one axis, 2px lines, fixed
// categorical order, legend for ≥2 series, hover crosshair + tooltip, table view) ──
const NS = "http://www.w3.org/2000/svg";
const svgEl = (tag, attrs = {}) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v)); return n; };
const xNum = (x) => (typeof x === "number" ? x : Date.parse(x));
const fmtX = (b, x) => (b.x.type === "date" ? (typeof x === "number" ? new Date(x).toISOString().slice(0, 10) : x) : fmtNum(x));
function niceTicks(lo, hi, n) {
	if (!(hi > lo)) return [lo];
	const span = hi - lo, raw = span / n, mag = 10 ** Math.floor(Math.log10(raw));
	const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= n) || mag * 10;
	const out = [];
	for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10));
	return out;
}
function renderChart(b) {
	const wrap = el("div", "chart-wrap");
	const W = 640, H = 260, M = { l: 52, r: 14, t: 10, b: 28 };
	const fmt = b.y?.format;
	const pts = b.series.map((s) => s.points.filter((p) => p[1] !== null).map(([x, y]) => [xNum(x), y, x]));
	const xs = pts.flat().map((p) => p[0]), ys = pts.flat().map((p) => p[1]);
	const x0 = Math.min(...xs), x1 = Math.max(...xs), yLo = Math.min(...ys), yHi = Math.max(...ys);
	const yTicks = niceTicks(yLo, yHi, 5);
	const y0 = Math.min(yLo, yTicks[0]), y1 = Math.max(yHi, yTicks[yTicks.length - 1]);
	const sx = (x) => M.l + ((x - x0) / (x1 - x0 || 1)) * (W - M.l - M.r);
	const sy = (y) => M.t + (1 - (y - y0) / (y1 - y0 || 1)) * (H - M.t - M.b);
	const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart", role: "img", "aria-label": b.title });
	// recessive hairline grid + y labels (text wears text tokens, never the series color)
	for (const t of yTicks) {
		svg.appendChild(svgEl("line", { x1: M.l, x2: W - M.r, y1: sy(t), y2: sy(t), class: "grid" }));
		const lbl = svgEl("text", { x: M.l - 6, y: sy(t) + 3.5, class: "tick", "text-anchor": "end" }); lbl.textContent = fmtY(t, fmt); svg.appendChild(lbl);
	}
	const xTicks = b.x.type === "date" ? niceTicks(x0, x1, 6) : niceTicks(x0, x1, 6);
	for (const t of xTicks) {
		if (t < x0 || t > x1) continue;
		const lbl = svgEl("text", { x: sx(t), y: H - 8, class: "tick", "text-anchor": "middle" });
		lbl.textContent = b.x.type === "date" ? new Date(t).toISOString().slice(0, 7) : fmtNum(t);
		svg.appendChild(lbl);
	}
	svg.appendChild(svgEl("line", { x1: M.l, x2: W - M.r, y1: sy(y0), y2: sy(y0), class: "axis" }));
	// 2px lines, fixed series order → fixed slot color (color follows the entity)
	pts.forEach((sp, i) => {
		if (!sp.length) return;
		const d = sp.map((p, j) => `${j ? "L" : "M"}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join("");
		svg.appendChild(svgEl("path", { d, class: `series s${i + 1}`, fill: "none" }));
	});
	// hover layer: crosshair + nearest-x tooltip
	const cross = svgEl("line", { class: "cross", y1: M.t, y2: H - M.b, x1: 0, x2: 0, visibility: "hidden" });
	svg.appendChild(cross);
	const dots = pts.map((_, i) => { const c = svgEl("circle", { r: 4, class: `dot s${i + 1}`, visibility: "hidden" }); svg.appendChild(c); return c; });
	const tip = el("div", "chart-tip"); tip.hidden = true;
	const hit = svgEl("rect", { x: M.l, y: M.t, width: W - M.l - M.r, height: H - M.t - M.b, fill: "transparent" });
	svg.appendChild(hit);
	const nearest = (sp, xv) => { let best = sp[0]; for (const p of sp) if (Math.abs(p[0] - xv) < Math.abs(best[0] - xv)) best = p; return best; };
	hit.addEventListener("mousemove", (e) => {
		const r = svg.getBoundingClientRect(); const xv = x0 + ((e.clientX - r.left) / r.width * W - M.l) / (W - M.l - M.r) * (x1 - x0);
		const rows = pts.map((sp, i) => (sp.length ? [i, nearest(sp, xv)] : null)).filter(Boolean);
		if (!rows.length) return;
		const ax = rows[0][1][0];
		cross.setAttribute("x1", sx(ax)); cross.setAttribute("x2", sx(ax)); cross.setAttribute("visibility", "visible");
		rows.forEach(([i, p]) => { dots[i].setAttribute("cx", sx(p[0])); dots[i].setAttribute("cy", sy(p[1])); dots[i].setAttribute("visibility", "visible"); });
		tip.innerHTML = `<div class="tip-x">${fmtX(b, rows[0][1][2])}</div>` + rows.map(([i, p]) => `<div><span class="key s${i + 1}"></span>${b.series[i].label} <b>${fmtY(p[1], fmt)}</b></div>`).join("");
		tip.hidden = false;
		const px = (e.clientX - r.left) / r.width; tip.style.left = `${Math.min(px * 100, 70)}%`;
	});
	hit.addEventListener("mouseleave", () => { cross.setAttribute("visibility", "hidden"); dots.forEach((d) => d.setAttribute("visibility", "hidden")); tip.hidden = true; });
	const plot = el("div", "chart-plot"); plot.appendChild(svg); plot.appendChild(tip); wrap.appendChild(plot);
	// legend (always for ≥2 series; the title names a single series) + table view
	const foot = el("div", "chart-foot");
	if (b.series.length > 1) {
		const lg = el("div", "chart-legend");
		b.series.forEach((s, i) => { const it = el("span", "lg-item"); it.appendChild(el("span", `key s${i + 1}`)); it.appendChild(el("span", "", s.label)); lg.appendChild(it); });
		foot.appendChild(lg);
	}
	if (b.y?.label || b.x?.label) foot.appendChild(el("span", "dim", [b.y?.label, b.x?.label && `by ${b.x.label}`].filter(Boolean).join(" ")));
	const tbtn = el("button", "btn tiny", "table view");
	const tbl = el("div", "chart-table"); tbl.hidden = true;
	tbtn.onclick = () => {
		if (!tbl.children.length) {
			const t = el("table", "tbl"), hd = el("tr");
			hd.appendChild(el("th", "", b.x.label || "x"));
			for (const s of b.series) hd.appendChild(el("th", "num", s.label));
			t.appendChild(hd);
			const byX = new Map();
			b.series.forEach((s, i) => { for (const [x, y] of s.points) { if (!byX.has(x)) byX.set(x, []); byX.get(x)[i] = y; } });
			for (const [x, row] of byX) { const tr = el("tr"); tr.appendChild(el("td", "txt", String(x))); b.series.forEach((_, i) => tr.appendChild(el("td", "num", fmtY(row[i], fmt)))); t.appendChild(tr); }
			tbl.appendChild(t);
		}
		tbl.hidden = !tbl.hidden; tbtn.textContent = tbl.hidden ? "table view" : "chart view"; plot.hidden = !tbl.hidden;
	};
	foot.appendChild(tbtn);
	wrap.appendChild(foot);
	wrap.appendChild(tbl);
	const sum = el("ul", "chart-summary");
	for (const s of b.series) sum.appendChild(el("li", "", `${s.label}: ${summarizeSeries(s, fmt)}`));
	wrap.appendChild(sum);
	return wrap;
}

// ── the drawer (outcome cards over the transcript) ──
function newTurn(kind) {
	const t = el("div", `turn ${kind}`);
	$("turns").appendChild(t);
	return t;
}
function userTurn(text) {
	const t = newTurn("user");
	t.appendChild(el("div", "turn-text", text));
	scrollTurns();
	return t;
}
function agentTurn() {
	if (!currentTurn || currentTurn.dataset.kind !== "agent") {
		currentTurn = newTurn("agent");
		currentTurn.dataset.kind = "agent";
		currentTurn.appendChild(el("div", "turn-label", "agent's reading"));
		turnsCtx.container = currentTurn;
	}
	return currentTurn;
}
function scrollTurns() {
	const t = $("turns");
	t.scrollTop = t.scrollHeight;
}
function assistantText(text, streamingNow) {
	const t = agentTurn();
	if (!liveText || !liveText.isConnected) {
		liveText = el("div", "msg assistant md");
		t.appendChild(liveText);
	}
	liveText.dataset.raw = text;
	liveText.innerHTML = mdToHtml(text);
	liveText.classList.toggle("streaming", !!streamingNow);
	scrollTurns();
}
function appendHistory(m) {
	if (m.role === "user") {
		userTurn(contentBlocks(m.content).filter((b) => b.type === "text").map((b) => b.text).join("\n"));
		currentTurn = null; liveText = null;
	} else if (m.role === "assistant") {
		for (const b of m.content || []) {
			if (b.type === "text" && b.text.trim()) { liveText = null; assistantText(b.text, false); }
			else if (b.type === "toolCall") { agentTurn(); toolRow(turnsCtx, b.id, b.name, b.arguments); }
		}
		liveText = null;
	} else if (m.role === "toolResult") {
		agentTurn();
		finishToolRow(turnsCtx, m);
	}
}

// ── gate bar ──
function showGate(req) {
	const bar = $("gate-bar");
	if (bar.querySelector(`[data-ui-id="${CSS.escape(req.id)}"]`)) return;
	const wrap = el("div", "gate");
	wrap.dataset.uiId = req.id;
	const answer = async (body) => {
		// The card stays until the server confirms: a failed or refused answer must
		// not hide a dialog that is still pending in the child.
		wrap.classList.add("answering");
		let r;
		try { r = await postJson("/api/ui-response", { id: req.id, ...body }); } catch (e) { r = { ok: false, error: String(e.message || e) }; }
		wrap.classList.remove("answering");
		if (!r.ok) { toast(`answer not accepted: ${r.error || "dialog no longer open"}`, "error"); return; }
		wrap.remove();
		bar.hidden = !bar.children.length;
	};
	wrap.appendChild(buildDialog(req, answer));
	bar.appendChild(wrap);
	bar.hidden = false;
	toast(`the agent asks: ${stripAnsi(req.title || req.method).slice(0, 80)}`, "warning");
}
function dismissGate(id) {
	$("gate-bar").querySelector(`[data-ui-id="${CSS.escape(id)}"]`)?.remove();
	$("gate-bar").hidden = !$("gate-bar").children.length;
}
function clearGates(reason) {
	const bar = $("gate-bar");
	if (bar.children.length) toast(`pending dialogs dropped: ${reason}`, "warning");
	bar.innerHTML = "";
	bar.hidden = true;
}

// ── events ──
function handleEvent(e) {
	switch (e.type) {
		case "desk_hello": {
			// The snapshot is the truth for pending dialogs: drop cards it no longer
			// lists (answered elsewhere, timed out) and show the ones it does.
			const pending = new Set((e.dialogs || []).map((d) => d.id));
			for (const g of [...$("gate-bar").querySelectorAll(".gate")]) if (!pending.has(g.dataset.uiId)) g.remove();
			$("gate-bar").hidden = !$("gate-bar").children.length;
			for (const d of e.dialogs || []) showGate(d);
			if (e.state === "exited") setChip("exited");
			// A hello after the first is a RECONNECT: events were missed, so the stage
			// and the drawer are rebuilt from the ledger rather than trusted.
			if (hellos++ > 0) { setChip(streaming ? "running" : "idle"); replayLedger(true); }
			break;
		}
		case "agent_start": streaming = true; setChip("running"); break;
		case "agent_settled": streaming = false; setChip("idle"); liveText = null; replayLedger(); break;
		case "message_start": liveText = null; break;
		case "message_update": {
			const ame = e.assistantMessageEvent;
			if (!ame) break;
			if (ame.type === "text_delta") assistantText((liveText?.dataset.raw || "") + ame.delta, true);
			else if (ame.type === "toolcall_start") { liveText = null; agentTurn(); toolRow(turnsCtx, ame.id, ame.toolName); }
			break;
		}
		case "message_end":
			if (e.message?.role === "user") { /* optimistic bubble already drawn by send() */ }
			else if (e.message?.role === "assistant") { liveText?.classList.remove("streaming"); liveText = null; }
			break;
		case "tool_execution_start": agentTurn(); toolRow(turnsCtx, e.toolCallId, e.toolName, e.args ?? e.input); break;
		case "tool_execution_update": {
			const row = toolRow(turnsCtx, e.toolCallId, e.toolName);
			const texts = contentBlocks(e.partialResult?.content).filter((b) => b.type === "text").map((b) => b.text).join("\n");
			setToolStreaming(row, texts);
			break;
		}
		case "tool_execution_end": {
			agentTurn();
			const row = finishToolRow(turnsCtx, { toolCallId: e.toolCallId, toolName: e.toolName, content: e.result?.content, details: e.result?.details, isError: !!(e.isError || e.result?.isError) });
			const bs = e.result?.details?.blocks;
			if (Array.isArray(bs) && bs.length) {
				blocks = applyLiveBlocks(blocks, bs, e); // valid, stamped, and stamped BY THIS EVENT
				renderStage();
				const names = bs.filter((b) => b.produced_by).map((b) => b.title).join(", ");
				if (names) row.querySelector(".targ").textContent = `→ ${names}`;
			}
			// Refresh rule (design §3.3): a tool in the manifest's `mutating` list finished →
			// the app re-fetches its durable state. No diffing, no optimistic UI.
			if ((manifest?.mutating || []).includes(e.toolName))
				window.dispatchEvent(new CustomEvent("agent:changed", { detail: { tool: e.toolName, args: e.args ?? e.input ?? null, isError: !!(e.isError || e.result?.isError) } }));
			break;
		}
		case "extension_ui_request":
			if (["select", "confirm", "input", "editor"].includes(e.method)) showGate(e);
			else if (e.method === "notify") toast(stripAnsi(e.message || ""), e.notifyType || "info");
			break;
		case "desk_ui_resolved": dismissGate(e.id); break;
		case "desk_prompt_rejected": toast(`prompt rejected: ${e.error || "unknown"}`, "error"); break;
		case "desk_exit": streaming = false; setChip("exited"); clearGates(`session exited (${e.code})`); toast(`session exited (${e.code})`, "error"); break;
		case "auto_retry_start": setChip(`retry ${e.attempt}/${e.maxAttempts}`); break;
		case "extension_error": toast(`extension error: ${e.error || ""}`, "error"); break;
	}
}

// ── ledger replay (the ledger IS the stage) ──
// Full active-branch replay on attach and after every settled turn: sessions are
// small, and a delta cannot carry the ancestry the branch reducer needs. Blocks
// missed while the stream was down are picked up here.
async function replayLedger(force = false) {
	const r = await fetch("/api/entries").then((x) => x.json()).catch(() => null);
	if (!r || !Array.isArray(r.entries)) return;
	blocks = reduceEntries(r.entries, r.leafId);
	renderStage();
	const path = pathEntries(r.entries, r.leafId);
	// The drawer is rebuilt only when the branch CHANGED (fork/resume/switch): if the
	// old leaf is an ancestor of the new one the turn merely appended, and the live
	// rows already on screen are the truth. Rebuilding every turn would wipe them.
	const appended = leafId === null ? false : path.some((e) => e.id === leafId);
	if (force || (r.leafId !== leafId && !appended)) {
		// drawer history: the ACTIVE branch only (same ancestry as the stage)
		leafId = r.leafId;
		$("turns").innerHTML = "";
		turnsCtx.toolRows.clear();
		currentTurn = null; liveText = null;
		for (const en of path) if (en.type === "message" && en.message) appendHistory(en.message);
		currentTurn = null; liveText = null;
	} else leafId = r.leafId;
}

// ── composing (the UI is a prompt composer) ──
export function compose(text, { send = true } = {}) {
	const inp = $("input");
	if (!send) {
		inp.value = text;
		openDrawer(true);
		inp.focus();
		return;
	}
	sendPrompt(text);
}
async function sendPrompt(text) {
	text = text.trim();
	if (!text || !session) return;
	userTurn(text);
	currentTurn = null; liveText = null;
	const r = await postJson("/api/prompt", { message: text, mode: streaming ? "steer" : "prompt" }).catch((e) => ({ ok: false, error: String(e.message || e) }));
	if (!r.ok) toast(`not accepted: ${r.error || "?"}`, "error");
}
function openDrawer(open) {
	const d = $("drawer");
	const want = open === undefined ? d.classList.contains("collapsed") : open;
	d.classList.toggle("collapsed", !want);
	$("btn-drawer").textContent = want ? "chat ▾" : "chat ▸";
	try { localStorage.setItem("stage-drawer", want ? "open" : "closed"); } catch {}
}

// ── boot ──
async function boot() {
	manifest = await fetch("/api/manifest").then((r) => r.json());
	$("app-title").textContent = manifest.title;
	$("app-cwd").textContent = manifest.cwd.replace(/^\/(Users|home)\/[^/]+/, "~");
	document.title = `${manifest.title} — stage`;
	for (const [label, prompt] of (Array.isArray(manifest.quick) && manifest.quick.length ? manifest.quick : QUICK)) {
		const b = el("button", "btn", label);
		b.onclick = () => compose(prompt);
		$("quick").appendChild(b);
	}
	try { openDrawer(localStorage.getItem("stage-drawer") !== "closed"); } catch { openDrawer(true); }
	session = await postJson("/api/session", {}).catch(() => null);
	if (!session?.id) { setChip("no session"); toast("could not start the app session", "error"); return; }
	setChip("idle");
	stream = openEventStream("/api/events", handleEvent, () => setChip("disconnected"));
	await replayLedger();
}

$("btn-send").onclick = () => { sendPrompt($("input").value); $("input").value = ""; };
$("input").onkeydown = (e) => {
	if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("btn-send").click(); }
};
$("btn-abort").onclick = () => postJson("/api/abort", {}).catch(() => {});
$("btn-drawer").onclick = () => openDrawer();
document.addEventListener("keydown", (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") { e.preventDefault(); openDrawer(); } });
window.stage = {
	compose,
	get blocks() { return blocks; },
	disconnect() { stream?.close(); stream = null; setChip("disconnected"); },
	reconnect() { stream?.close(); stream = openEventStream("/api/events", handleEvent, () => setChip("disconnected")); },
};
boot();
