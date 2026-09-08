// blocks.mjs — the block contract (design: docs/agent-frontend-design-2026-09-04.md §3.1).
//
// Pure ESM, zero deps, runs in the browser, in node tests, and inside the pi
// extension. Four jobs, each a pure function:
//   validateBlock       schema + size caps at the boundary
//   renderBlockText     the canonical text a model reads (== the stage, to a byte cap)
//   extractBlocks       find the block carrier in a tool result's details
//   reduceEntries       session entries → the stage (leafId ancestry, upsert by id)
//
// Who authors what: everything but `produced_by` is app-tool code; `produced_by`
// is stamped by nana-stage from the tool event. The model never touches a block.

export const BLOCK_TYPES = new Set(["table", "card", "chart"]);
export const RESERVED_TYPES = new Set(["kpi", "timeline", "graph"]);
// chart (added for slice 2, the edge desk): line series over a date or number
// x-axis. Code-authored like every block; the model reads a per-series summary.
export const CHART_KINDS = new Set(["line"]);
export const CHART_X_TYPES = new Set(["date", "number"]);
export const MAX_CHART_SERIES = 4;
export const MAX_CHART_POINTS = 1000; // per series
export const MAX_CHART_POINTS_TOTAL = 2400; // all series — keeps a date-x chart under MAX_BLOCK_BYTES
// A real calendar date: parses AND round-trips (2026-99-99 does not).
export const isIsoDate = (x) => {
	if (!isStr(x) || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return false;
	const t = Date.parse(x + "T00:00:00Z");
	return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === x;
};
export const SLOTS = new Set(["main", "side", "modal"]);
export const COLUMN_TYPES = new Set(["text", "number", "date"]);
export const MAX_BLOCK_BYTES = 64 * 1024;
export const MAX_TABLE_ROWS = 500;
export const ENTRY_TYPE = "nana-block";
// MAX_BLOCK_BYTES bounds the block's JSON, NOT the text the model reads: column
// padding multiplies one wide cell across every row, so a 64 KiB-legal 500-row
// table used to render ~25 MB of context. Padding stops at MAX_TEXT_COL_WIDTH
// (a longer cell is printed whole, its row just runs ragged — no data is lost),
// and the byte caps below are the hard bound behind that.
export const MAX_TEXT_COL_WIDTH = 80;
export const MAX_BLOCK_TEXT_BYTES = 2 * MAX_BLOCK_BYTES; // one block's rendering
export const MAX_RESULT_TEXT_BYTES = 4 * MAX_BLOCK_BYTES; // one tool result's rendering

const isStr = (v) => typeof v === "string";
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
// A value that survives persist → replay unchanged AND renders the same on both
// sides. bigint throws in JSON.stringify; symbol/function are silently dropped;
// NaN/Infinity come back as null — each makes a validated block non-durable.
const isScalar = (v) => v === null || typeof v === "string" || typeof v === "boolean" || (typeof v === "number" && Number.isFinite(v));

// → { ok: true } | { ok: false, errors: string[] }
// NEVER throws: this runs inside pi's `tool_result` handler, where a thrown error
// BLOCKS the tool. A block that cannot even be inspected (a cycle, a throwing
// getter or toJSON) is a rejection like any other, reported to the model.
export function validateBlock(b) {
	try { return validateBlockBody(b); } catch (e) { return { ok: false, errors: [`block could not be validated: ${e?.message || e}`] }; }
}
function validateBlockBody(b) {
	const errors = [];
	const err = (m) => errors.push(m);
	if (!isObj(b)) return { ok: false, errors: ["block must be an object"] };
	if (!isStr(b.id) || !b.id) err("id: required string");
	if (RESERVED_TYPES.has(b.type)) err(`type: '${b.type}' is reserved, not implemented`);
	else if (!BLOCK_TYPES.has(b.type)) err(`type: must be one of ${[...BLOCK_TYPES].join("|")}`);
	if (!isStr(b.title) || !b.title.trim()) err("title: required string");
	if (!isStr(b.scope) || !b.scope.trim()) err("scope: required — one sentence: what data, what period, how fresh, from where");
	if (b.note !== undefined && !isStr(b.note)) err("note: string if present");
	// subtitle/badges are rendered on EVERY block type (renderBlock head), so they
	// are checked here, not in the card branch: a table carrying badges:{length:2}
	// used to validate and then throw in the stage's `for…of`.
	if (b.subtitle !== undefined && !isStr(b.subtitle)) err("subtitle: string if present");
	if (b.badges !== undefined && (!Array.isArray(b.badges) || !b.badges.every(isStr))) err("badges: string[] if present");
	if (b.slot !== undefined && !SLOTS.has(b.slot)) err(`slot: must be one of ${[...SLOTS].join("|")}`);
	if (b.show !== undefined && typeof b.show !== "boolean") err("show: boolean if present");
	if (b.evidence !== undefined) {
		if (!Array.isArray(b.evidence)) err("evidence: array if present");
		else b.evidence.forEach((e, i) => { if (!isObj(e) || !isStr(e.label) || !isStr(e.ref)) err(`evidence[${i}]: {label, ref} strings`); });
	}
	if (b.actions !== undefined) {
		if (!Array.isArray(b.actions)) err("actions: array if present");
		else b.actions.forEach((a, i) => {
			if (!isObj(a) || !isStr(a.label) || !isStr(a.prompt)) err(`actions[${i}]: {label, prompt} strings`);
			else if (a.mutates !== undefined && typeof a.mutates !== "boolean") err(`actions[${i}].mutates: boolean`);
			else if (a.per_row !== undefined && typeof a.per_row !== "boolean") err(`actions[${i}].per_row: boolean`);
			else if (a.per_row && b.type !== "table") err(`actions[${i}].per_row: only on table blocks`);
		});
	}
	if (b.type === "table") {
		if (!Array.isArray(b.columns) || !b.columns.length) err("table.columns: non-empty array");
		else b.columns.forEach((c, i) => {
			if (!isObj(c) || !isStr(c.key) || !isStr(c.label)) err(`columns[${i}]: {key, label} strings`);
			else if (c.type !== undefined && !COLUMN_TYPES.has(c.type)) err(`columns[${i}].type: text|number|date`);
		});
		if (!Array.isArray(b.rows)) err("table.rows: array");
		else if (b.rows.length > MAX_TABLE_ROWS) err(`table.rows: ${b.rows.length} > ${MAX_TABLE_ROWS} — paginate`);
		else b.rows.forEach((r, i) => {
			if (!isObj(r)) { err(`rows[${i}]: object`); return; }
			// every value, not only the ones `columns` names: extra keys ride rowPrompt
			// templates and are persisted with the rest. undefined == an absent key.
			for (const [k, v] of Object.entries(r)) if (v !== undefined && !isScalar(v)) err(`rows[${i}].${k}: null, a string, a boolean or a finite number`);
		});
	} else if (b.type === "card") {
		if (!Array.isArray(b.fields) || !b.fields.length) err("card.fields: non-empty array");
		else b.fields.forEach((f, i) => {
			if (!isObj(f) || !isStr(f.label)) err(`fields[${i}]: {label, value}`);
			else if (!isScalar(f.value)) err(`fields[${i}].value: null, a string, a boolean or a finite number`);
			else if (f.evidence !== undefined && !isStr(f.evidence)) err(`fields[${i}].evidence: string`);
		});
	} else if (b.type === "chart") {
		if (!CHART_KINDS.has(b.kind)) err(`chart.kind: must be one of ${[...CHART_KINDS].join("|")}`);
		if (!isObj(b.x) || !CHART_X_TYPES.has(b.x.type)) err("chart.x: {type: date|number, label?}");
		else if (b.x.label !== undefined && !isStr(b.x.label)) err("chart.x.label: string if present");
		if (b.y !== undefined) {
			if (!isObj(b.y)) err("chart.y: object if present");
			else {
				if (b.y.label !== undefined && !isStr(b.y.label)) err("chart.y.label: string if present");
				if (b.y.format !== undefined && !["number", "percent"].includes(b.y.format)) err("chart.y.format: number|percent");
			}
		}
		if (!Array.isArray(b.series) || !b.series.length) err("chart.series: non-empty array");
		else if (b.series.length > MAX_CHART_SERIES) err(`chart.series: ${b.series.length} > ${MAX_CHART_SERIES} — facet into another block`);
		else if (b.series.reduce((n, s) => n + (Array.isArray(s?.points) ? s.points.length : 0), 0) > MAX_CHART_POINTS_TOTAL) err(`chart: more than ${MAX_CHART_POINTS_TOTAL} points across series — downsample`);
		else if (!b.series.some((s) => Array.isArray(s?.points) && s.points.some((p) => Array.isArray(p) && typeof p[1] === "number" && Number.isFinite(p[1])))) err("chart: no finite y value in any series — nothing to draw");
		else b.series.forEach((s, i) => {
			if (!isObj(s) || !isStr(s.key) || !isStr(s.label)) { err(`series[${i}]: {key, label, points}`); return; }
			if (!Array.isArray(s.points) || !s.points.length) { err(`series[${i}].points: non-empty array`); return; }
			if (s.points.length > MAX_CHART_POINTS) { err(`series[${i}].points: ${s.points.length} > ${MAX_CHART_POINTS} — downsample`); return; }
			let prev = null;
			for (let j = 0; j < s.points.length; j++) {
				const pt = s.points[j];
				if (!Array.isArray(pt) || pt.length !== 2) { err(`series[${i}].points[${j}]: [x, y]`); return; }
				const [x, y] = pt;
				const xv = b.x?.type === "date" ? (isIsoDate(x) ? x : null) : (typeof x === "number" && Number.isFinite(x) ? x : null);
				if (xv === null) { err(`series[${i}].points[${j}]: x must be ${b.x?.type === "date" ? "a real YYYY-MM-DD date" : "a finite number"}`); return; }
				if (prev !== null && xv < prev) { err(`series[${i}].points[${j}]: x must be non-decreasing`); return; }
				prev = xv;
				if (y !== null && (typeof y !== "number" || !Number.isFinite(y))) { err(`series[${i}].points[${j}]: y must be a finite number or null`); return; }
			}
		});
	}
	if (!errors.length) {
		const bytes = new TextEncoder().encode(JSON.stringify(b)).length;
		if (bytes > MAX_BLOCK_BYTES) err(`block is ${bytes} bytes > ${MAX_BLOCK_BYTES} — paginate`);
	}
	return errors.length ? { ok: false, errors } : { ok: true };
}

// ── canonical text (what the model reads; identical information to the stage) ──
const cell = (v) => (v === null || v === undefined ? "" : typeof v === "number" ? fmtNum(v) : String(v));
// Natural scalar rendering, at most 2 decimals, no trailing zeros (25 → "25",
// 3.1 → "3.1", 0.5761 → "0.58"). Tables use columnDecimals for per-column consistency.
export function fmtNum(n) {
	if (!Number.isFinite(n)) return String(n);
	return Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(2)));
}

// Decimals to show for a numeric column: the most any value in it needs (cap 2),
// so 1.3 and 4 render as 1.3 / 4.0 side by side instead of 1.30 / 4.
export function columnDecimals(rows, key) {
	let d = 0;
	for (const r of rows) {
		const v = r[key];
		if (typeof v !== "number" || !Number.isFinite(v)) continue;
		const m = String(v).match(/\.(\d+)$/);
		if (m) d = Math.max(d, Math.min(2, m[1].length));
	}
	return d;
}
export function fmtCell(v, decimals) {
	if (v === null || v === undefined) return "";
	if (typeof v !== "number") return String(v);
	return Number.isFinite(v) ? v.toFixed(decimals) : String(v);
}

// Cut `text` to `maxBytes`, announcing the cut so the model never reads a silently
// shortened block. The byte bound holds even for a cap too small to hold the notice
// — there the cut is silent, by necessity.
export function clampText(text, maxBytes, what) {
	const buf = new TextEncoder().encode(text);
	if (buf.length <= maxBytes) return text;
	// Back up to a real character boundary (a UTF-8 sequence is at most 4 bytes) by
	// asking a strict decoder. Deleting a trailing replacement char instead would eat
	// a GENUINE U+FFFD that ends exactly on the cut.
	const cut = (n) => {
		const dec = new TextDecoder("utf-8", { fatal: true });
		for (let end = Math.max(0, Math.min(n, buf.length)); end >= 0 && end > n - 4; end--) {
			try { return dec.decode(buf.slice(0, end)); } catch { /* split sequence: drop a byte */ }
		}
		return "";
	};
	const marker = `\n… ${what} truncated at ${maxBytes} bytes; the stage holds the full block`;
	const room = maxBytes - new TextEncoder().encode(marker).length;
	return room > 0 ? cut(room) + marker : cut(maxBytes);
}

export function renderBlockText(b) {
	const out = [`## ${b.title}`, `scope: ${b.scope}`];
	if (b.type === "table") {
		const cols = b.columns;
		const dec = cols.map((c) => (c.type === "number" ? columnDecimals(b.rows, c.key) : 0));
		const rows = b.rows.map((r) => cols.map((c, i) => (c.type === "number" ? fmtCell(r[c.key], dec[i]) : cell(r[c.key]))));
		const widths = cols.map((c, i) => Math.min(MAX_TEXT_COL_WIDTH, Math.max(c.label.length, ...rows.map((r) => r[i].length))));
		const line = (cells) => cells.map((s, i) => (cols[i].type === "number" ? s.padStart(widths[i]) : s.padEnd(widths[i]))).join("  ").trimEnd();
		out.push(line(cols.map((c) => c.label)));
		out.push(widths.map((w) => "-".repeat(w)).join("  "));
		for (const r of rows) out.push(line(r));
		if (!rows.length) out.push("(no rows)");
	} else if (b.type === "card") {
		if (b.subtitle) out.push(b.subtitle);
		if (b.badges?.length) out.push(`[${b.badges.join("] [")}]`);
		const w = Math.min(MAX_TEXT_COL_WIDTH, Math.max(...b.fields.map((f) => f.label.length)));
		for (const f of b.fields) out.push(`${f.label.padEnd(w)}  ${cell(f.value)}${f.evidence ? `  (${f.evidence})` : ""}`);
	} else if (b.type === "chart") {
		// The model reads a summary, not the points: same facts the stage draws.
		const axis = `${b.x.label || "x"} → ${b.y?.label || "y"}${b.y?.format === "percent" ? " (%)" : ""}`;
		out.push(`${b.kind} chart, ${axis}`);
		for (const s of b.series) out.push(`- ${s.label}: ${summarizeSeries(s, b.y?.format)}`);
	}
	if (b.note) out.push(`note: ${b.note}`);
	if (b.actions?.length) out.push(`actions: ${b.actions.map((a) => (a.per_row ? `${a.label} (per row)` : a.label)).join(" · ")}`);
	return clampText(out.join("\n"), MAX_BLOCK_TEXT_BYTES, `block ${b.id}`);
}

// One line of facts per series: span, first/last, min/max. Shared by the text
// rendering and the stage's table view so both say the same thing.
export function fmtY(v, format) {
	if (v === null || v === undefined || !Number.isFinite(v)) return "–";
	return format === "percent" ? `${(v * 100).toFixed(1)}%` : fmtNum(v);
}
export function summarizeSeries(s, format) {
	const ys = s.points.map((p) => p[1]).filter((y) => typeof y === "number" && Number.isFinite(y));
	if (!ys.length) return `${s.points.length} points, no values`;
	const first = s.points[0], last = s.points[s.points.length - 1];
	return `${s.points.length} points ${first[0]} → ${last[0]}; first ${fmtY(first[1], format)}, last ${fmtY(last[1], format)}, min ${fmtY(Math.min(...ys), format)}, max ${fmtY(Math.max(...ys), format)}`;
}

// Per-row actions carry a prompt template; `{key}` is replaced by the row's cell.
export function rowPrompt(template, row) {
	return template.replace(/\{([a-z0-9_]+)\}/gi, (m, k) => (row[k] === undefined || row[k] === null ? m : String(row[k])));
}

// ── carrier extraction ──
// pi-extension tools:  details.blocks
// MCP tools (adapter, directToolResultDetails:"bounded"): details.mcpResult.structuredContent.blocks;
// over the adapter cap the raw result is replaced by an omission summary → reported as `overflow`.
export function extractBlocks(details) {
	if (!isObj(details)) return { blocks: null, where: null };
	if (details.blocks !== undefined) return { blocks: details.blocks, where: "blocks" };
	const m = details.mcpResult;
	if (isObj(m)) {
		const sc = m.structuredContent;
		if (isObj(sc) && sc.blocks !== undefined) return { blocks: sc.blocks, where: "mcpResult" };
		if (m.omitted !== undefined || (isObj(sc) && sc.omitted !== undefined) || m.summary !== undefined)
			return { blocks: null, where: "mcpResult", overflow: true };
	}
	return { blocks: null, where: null };
}

// Remove every block carrier from a details object (failure path: the invalid
// blocks must not ride tool_execution_end into the live stage).
export function stripCarrier(details) {
	if (!isObj(details)) return details;
	const d = { ...details };
	delete d.blocks;
	if (isObj(d.mcpResult) && isObj(d.mcpResult.structuredContent)) {
		const sc = { ...d.mcpResult.structuredContent };
		delete sc.blocks;
		d.mcpResult = { ...d.mcpResult, structuredContent: sc };
	}
	return d;
}

// A stamp is what nana-stage writes: tool, args, toolCallId, at (+ sig when keyed).
export function isStamp(p) {
	return isObj(p) && isStr(p.tool) && isStr(p.toolCallId) && isStr(p.at) && isObj(p.args);
}
// Every block a page consumes passes the same validator the boundary used, plus the stamp.
export function consumable(b) {
	return isObj(b) && isStamp(b.produced_by) && validateBlock(b).ok;
}

// Entries on the active branch: walk parentId ancestry from leafId (null → last
// entry) to the root. Abandoned branches are excluded. Shared by the stage
// reducer and the drawer history.
export function pathEntries(entries, leafId) {
	const byId = new Map();
	for (const e of entries) if (e && e.id) byId.set(e.id, e);
	let leaf = leafId ? byId.get(leafId) : entries[entries.length - 1];
	const path = [];
	const seen = new Set();
	while (leaf && !seen.has(leaf.id)) {
		seen.add(leaf.id);
		path.push(leaf);
		leaf = leaf.parentId ? byId.get(leaf.parentId) : null;
	}
	return path.reverse();
}

// ── the stage reducer ──
// entries: session entries (RPC get_entries or the session file), each with
// {id, parentId, type, customType?, data?}. Walk parentId ancestry from leafId
// (null → last entry), then fold nana-block entries on that path in order,
// upserting by block id. Abandoned branches never reach the stage.
export function reduceEntries(entries, leafId) {
	const blocks = new Map();
	for (const e of pathEntries(entries, leafId)) {
		if (e.type !== "custom" || e.customType !== ENTRY_TYPE) continue;
		const b = e.data;
		if (!consumable(b)) continue; // malformed or unstamped never reaches the stage
		blocks.set(b.id, b); // Map keeps first-insertion order → replace IN PLACE
	}
	return [...blocks.values()];
}

// Apply one live tool event's blocks onto a block array (same upsert). A live
// block must be stamped BY THIS EVENT: tool and toolCallId must match, so a
// carrier re-injected by a later handler under a different call is dropped.
export function applyLiveBlocks(current, blocks, event) {
	const m = new Map(current.map((b) => [b.id, b]));
	for (const b of blocks || []) {
		if (!consumable(b)) continue;
		if (event && (b.produced_by.toolCallId !== event.toolCallId || b.produced_by.tool !== event.toolName)) continue;
		m.set(b.id, b); // in place
	}
	return [...m.values()];
}

// ── the hook logic, pure (nana-stage.ts is a thin adapter over this) ──
// event: {toolName, toolCallId, input, content, details, isError}
// → null (not a block result) | { patch, entries } where patch is the tool_result
//   return value and entries are the nana-block data objects to append, in order.
export function processToolResult(event, { now = () => new Date().toISOString(), sign = null } = {}) {
	const { blocks, where, overflow } = extractBlocks(event.details);
	if (overflow) {
		return {
			patch: {
				isError: true,
				content: [{ type: "text", text: `nana-stage: ${event.toolName} returned blocks over the MCP adapter details cap (outputGuard.detailsMaxBytes); paginate the query or raise the cap.` }],
				details: stripCarrier(event.details),
			},
			entries: [],
		};
	}
	if (blocks === null || blocks === undefined) return null;
	if (!Array.isArray(blocks)) {
		return { patch: fail(event, [`${where}: blocks must be an array`]), entries: [] };
	}
	const stamped = [];
	for (let i = 0; i < blocks.length; i++) {
		const v = validateBlock(blocks[i]);
		if (!v.ok) return { patch: fail(event, v.errors.map((m) => `blocks[${i}] ${m}`)), entries: [] };
		const { produced_by: _ignored, ...rest } = blocks[i];
		const b = {
			...rest,
			slot: rest.slot || "main",
			show: rest.show !== false,
			produced_by: { tool: event.toolName, args: isObj(event.input) ? event.input : {}, toolCallId: event.toolCallId, at: now() },
		};
		if (sign) b.produced_by.sig = sign(b);
		stamped.push(b);
	}
	// Bounded per block AND over the whole result: a tool may return many blocks.
	const text = clampText(stamped.filter((b) => b.show).map(renderBlockText).join("\n\n") || "(blocks hidden: show=false)", MAX_RESULT_TEXT_BYTES, `${event.toolName} result text`);
	const details = stripCarrier(event.details);
	return {
		patch: { content: [{ type: "text", text }], details: { ...details, blocks: stamped } },
		entries: stamped,
	};
}

function fail(event, errors) {
	return {
		isError: true,
		content: [{ type: "text", text: `nana-stage rejected the blocks from ${event.toolName}: ${errors.join("; ")}` }],
		details: stripCarrier(event.details),
	};
}
