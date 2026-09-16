// changes.js — the "files changed" bar above the composer and the floating diff
// window it opens. Owns ALL of it: app.js calls refresh()/clear() and nothing
// else, and nothing here touches the transcript, the editor or `L`.
//
// Stage generation: every call carries the generation it was asked in, and a
// response for a stage the user has left is dropped without painting (the same
// rule the rest of the page follows — see the desk README, "Contract notes
// (page races)"). Refreshes coalesce the way resync() does: one fetch in
// flight per stage, and at most one follow-up however many asked while it ran.
//
// The window is deliberately NOT a <dialog>: it floats over the page so the
// session stays usable — you can keep typing with a diff open.

import { el, renderDiff } from "./desk-client.mjs";

const POS_KEY = "nana-code-diffwin";
const minus = (n) => `−${n}`; // U+2212, not a hyphen: it lines up with +

let deps = { stale: () => false };
export function init(d) {
	deps = { ...deps, ...d };
}

// One module state, cleared with the stage.
let sessionId = null;
let stageGen = -1;
let data = null; // last {repo, root, files, totals}
let expanded = false;
let busy = false; // a /changes fetch is in flight for `stageGen`
let again = false; // …and something asked for a fresher one while it ran
let seq = 0; // only the NEWEST fetch may clear `busy` — an old stage's answer must not
let win = null; // the open floating window, or null

const bar = () => document.getElementById("changes-bar");

// ── the bar ──
function buildBar() {
	const root = bar();
	if (root.dataset.built) return root;
	root.dataset.built = "1";
	const head = el("div", "cg-head");
	const sum = el("button", "cg-summary");
	sum.type = "button";
	sum.setAttribute("aria-expanded", "false");
	sum.innerHTML = `<span class="cg-caret">▸</span><span class="cg-files"></span><span class="cg-add"></span><span class="cg-del"></span>`;
	sum.onclick = () => setExpanded(!expanded);
	const busyDot = el("span", "cg-busy dim", "…");
	busyDot.hidden = true;
	const ref = el("button", "cg-refresh quiet", "↻");
	ref.type = "button";
	ref.title = "Re-read the working tree";
	ref.onclick = () => refresh(sessionId, stageGen);
	head.append(sum, busyDot, el("span", "spacer"), ref);
	const list = el("div", "cg-list");
	list.hidden = true;
	root.append(head, list);
	return root;
}

function setExpanded(on) {
	expanded = on;
	const root = buildBar();
	root.querySelector(".cg-list").hidden = !on;
	root.querySelector(".cg-caret").textContent = on ? "▾" : "▸";
	root.querySelector(".cg-summary").setAttribute("aria-expanded", String(on));
}

function paint() {
	const root = buildBar();
	const files = data?.repo ? data.files || [] : [];
	if (!files.length) {
		root.hidden = true;
		closeWindow();
		return;
	}
	root.hidden = false;
	const t = data.totals || { files: files.length, added: 0, removed: 0 };
	const n = data.omitted ? `${t.files}+ files changed` : `${t.files} file${t.files === 1 ? "" : "s"} changed`;
	root.querySelector(".cg-files").textContent = n;
	root.querySelector(".cg-add").textContent = `+${t.added}`;
	root.querySelector(".cg-del").textContent = minus(t.removed);

	const list = root.querySelector(".cg-list");
	list.innerHTML = "";
	for (const f of files) {
		const row = el("button", `cg-row st-${f.status === "??" ? "new" : f.status}`);
		row.type = "button";
		row.title = f.path;
		const st = el("span", "cg-st", f.status);
		const p = el("span", "cg-path", f.path);
		// zero is not worth a column: a delete reads `D old.js −40`, not `+0 −40`
		const add = el("span", "cg-add", f.binary ? "bin" : f.added ? `+${f.added}` : "");
		const del = el("span", "cg-del", f.binary || !f.removed ? "" : minus(f.removed));
		row.append(st, p, el("span", "spacer"), add, del);
		row.onclick = () => openFile(f.path);
		list.appendChild(row);
	}
	if (data.omitted) list.appendChild(el("div", "cg-more dim", `… and ${data.omitted} more (not listed)`));
	setExpanded(expanded);
}

// ── the public surface ──
export function clear() {
	sessionId = null;
	stageGen = -1;
	data = null;
	expanded = false;
	busy = false;
	again = false;
	closeWindow();
	const root = bar();
	if (root) {
		root.hidden = true;
		if (root.dataset.built) root.querySelector(".cg-list").innerHTML = "";
	}
}

export async function refresh(id, gen) {
	if (!id || deps.stale(gen)) return;
	if (busy && gen === stageGen) {
		again = true;
		return;
	}
	sessionId = id;
	stageGen = gen;
	busy = true;
	again = false;
	const my = ++seq;
	setBusy(true);
	let body = null;
	try {
		body = await fetch(`/api/session/${id}/changes`).then((r) => r.json());
	} catch {
		body = null; // a desk that went away: leave the last picture alone
	}
	if (my === seq) busy = false;
	if (deps.stale(gen)) return; // an answer for a session we have left is never painted
	setBusy(false);
	if (body && !body.error) {
		data = body;
		paint();
		if (win) syncWindow(gen);
	}
	if (again) refresh(id, gen);
}

function setBusy(on) {
	const root = bar();
	if (root?.dataset.built) root.querySelector(".cg-busy").hidden = !on;
}

// ── the floating diff window ──
function readPos() {
	try {
		const p = JSON.parse(localStorage.getItem(POS_KEY) || "null");
		if (p && Number.isFinite(p.left) && Number.isFinite(p.top)) return p;
	} catch {}
	return null;
}
function savePos(left, top) {
	try {
		localStorage.setItem(POS_KEY, JSON.stringify({ left, top }));
	} catch {}
}
// A remembered position from a bigger window must not park it off-screen.
function place(node, pos) {
	const w = node.offsetWidth || 560;
	const left = Math.min(Math.max(8, pos?.left ?? Math.round((innerWidth - w) / 2)), Math.max(8, innerWidth - w - 8));
	const top = Math.min(Math.max(8, pos?.top ?? Math.round(innerHeight * 0.18)), Math.max(8, innerHeight - 60));
	node.style.left = `${left}px`;
	node.style.top = `${top}px`;
}

function buildWindow() {
	const node = el("div", "diffwin");
	node.setAttribute("role", "dialog");
	node.setAttribute("aria-label", "File diff");
	node.tabIndex = -1;
	const head = el("div", "diffwin-head");
	const prev = el("button", "quiet dw-nav", "◀");
	const next = el("button", "quiet dw-nav", "▶");
	prev.type = next.type = "button";
	prev.title = "Previous file";
	next.title = "Next file";
	const path = el("span", "dw-path");
	const count = el("span", "dw-count dim");
	const ref = el("button", "quiet", "↻");
	ref.type = "button";
	ref.title = "Re-read this diff";
	const x = el("button", "quiet", "✕");
	x.type = "button";
	x.title = "Close (Esc)";
	head.append(prev, next, path, count, el("span", "spacer"), ref, x);
	const body = el("div", "diffwin-body");
	const note = el("div", "dw-note dim");
	note.hidden = true;
	const pre = el("pre", "tdiff");
	body.append(note, pre);
	node.append(head, body);
	document.body.appendChild(node);

	const w = { node, head, path, count, pre, note, prev, next, file: null };
	prev.onclick = () => step(-1);
	next.onclick = () => step(1);
	ref.onclick = () => loadDiff(w.file, stageGen);
	x.onclick = closeWindow;
	dragBy(head, node);
	place(node, readPos());
	return w;
}

// Drag by the header with pointer events: capture keeps the drag alive even if
// the cursor outruns the node. Buttons in the header keep their own clicks.
function dragBy(handle, node) {
	handle.addEventListener("pointerdown", (e) => {
		if (e.button !== 0 || e.target.closest("button")) return;
		const r = node.getBoundingClientRect();
		const dx = e.clientX - r.left;
		const dy = e.clientY - r.top;
		handle.setPointerCapture(e.pointerId);
		const move = (ev) => {
			const left = Math.min(Math.max(0, ev.clientX - dx), Math.max(0, innerWidth - 60));
			const top = Math.min(Math.max(0, ev.clientY - dy), Math.max(0, innerHeight - 40));
			node.style.left = `${left}px`;
			node.style.top = `${top}px`;
		};
		const up = () => {
			handle.removeEventListener("pointermove", move);
			handle.removeEventListener("pointerup", up);
			handle.removeEventListener("pointercancel", up);
			const r2 = node.getBoundingClientRect();
			savePos(Math.round(r2.left), Math.round(r2.top));
		};
		handle.addEventListener("pointermove", move);
		handle.addEventListener("pointerup", up);
		handle.addEventListener("pointercancel", up);
		e.preventDefault();
	});
}

function closeWindow() {
	win?.node.remove();
	win = null;
}

function fileList() {
	return data?.repo ? data.files || [] : [];
}

function openFile(rel) {
	if (!win) win = buildWindow();
	loadDiff(rel, stageGen);
	win.node.focus();
}

function step(delta) {
	const files = fileList();
	const i = files.findIndex((f) => f.path === win?.file);
	const next = files[i + delta];
	if (next) loadDiff(next.path, stageGen);
}

// The bar just refreshed: keep the open window honest about the same file, or
// close it if that file no longer differs from HEAD.
function syncWindow(gen) {
	if (!win?.file) return;
	if (!fileList().some((f) => f.path === win.file)) return closeWindow();
	loadDiff(win.file, gen);
}

async function loadDiff(rel, gen) {
	if (!rel || !win || deps.stale(gen)) return;
	const w = win;
	const id = sessionId;
	w.file = rel;
	const files = fileList();
	const i = files.findIndex((f) => f.path === rel);
	const f = files[i];
	w.path.textContent = rel;
	w.count.textContent = f ? [f.added == null ? null : `+${f.added}`, f.removed ? minus(f.removed) : null].filter(Boolean).join(" ") : "";
	w.prev.disabled = i <= 0;
	w.next.disabled = i < 0 || i >= files.length - 1;
	w.note.hidden = false;
	w.note.textContent = "reading…";
	let body = null;
	try {
		body = await fetch(`/api/session/${id}/changes/file?path=${encodeURIComponent(rel)}`).then((r) => r.json());
	} catch {}
	// stale stage, a window closed under the fetch, or a second file chosen
	// while it was out: none of them may paint. The last click wins — an earlier
	// diff still in flight comes back to `w.file !== rel` and drops.
	if (deps.stale(gen) || win !== w || w.file !== rel) return;
	if (!body || body.error) {
		w.note.hidden = false;
		w.note.textContent = body?.error || "could not read the diff";
		w.pre.hidden = true;
		return;
	}
	w.note.hidden = !body.truncated;
	if (body.truncated) w.note.textContent = "diff truncated — this file is larger than the desk will send";
	renderDiff(w.pre, body.diff || "");
}

// Capture phase, so Esc closes the diff window BEFORE app.js's own Escape
// handler (reclaim queue + abort the turn) ever sees it.
document.addEventListener(
	"keydown",
	(e) => {
		if (e.key !== "Escape" || !win) return;
		e.stopPropagation();
		e.preventDefault();
		closeWindow();
	},
	true,
);
