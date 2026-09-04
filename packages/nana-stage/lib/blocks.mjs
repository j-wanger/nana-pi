// blocks.mjs — the block contract (design: docs/agent-frontend-design-2026-09-04.md §3.1).
//
// Pure ESM, zero deps, runs in the browser, in node tests, and inside the pi
// extension. Four jobs, each a pure function:
//   validateBlock       schema + size caps at the boundary
//   renderBlockText     the canonical text a model reads (== what the stage shows)
//   extractBlocks       find the block carrier in a tool result's details
//   reduceEntries       session entries → the stage (leafId ancestry, upsert by id)
//
// Who authors what: everything but `produced_by` is app-tool code; `produced_by`
// is stamped by nana-stage from the tool event. The model never touches a block.

export const BLOCK_TYPES = new Set(["table", "card"]);
export const RESERVED_TYPES = new Set(["kpi", "chart", "timeline", "graph"]);
export const SLOTS = new Set(["main", "side", "modal"]);
export const COLUMN_TYPES = new Set(["text", "number", "date"]);
export const MAX_BLOCK_BYTES = 64 * 1024;
export const MAX_TABLE_ROWS = 500;
export const ENTRY_TYPE = "nana-block";

const isStr = (v) => typeof v === "string";
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

// → { ok: true } | { ok: false, errors: string[] }
export function validateBlock(b) {
	const errors = [];
	const err = (m) => errors.push(m);
	if (!isObj(b)) return { ok: false, errors: ["block must be an object"] };
	if (!isStr(b.id) || !b.id) err("id: required string");
	if (RESERVED_TYPES.has(b.type)) err(`type: '${b.type}' is reserved, not implemented`);
	else if (!BLOCK_TYPES.has(b.type)) err(`type: must be one of ${[...BLOCK_TYPES].join("|")}`);
	if (!isStr(b.title) || !b.title.trim()) err("title: required string");
	if (!isStr(b.scope) || !b.scope.trim()) err("scope: required — one sentence: what data, what period, how fresh, from where");
	if (b.note !== undefined && !isStr(b.note)) err("note: string if present");
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
		else b.rows.forEach((r, i) => { if (!isObj(r)) err(`rows[${i}]: object`); });
	} else if (b.type === "card") {
		if (b.subtitle !== undefined && !isStr(b.subtitle)) err("card.subtitle: string if present");
		if (!Array.isArray(b.fields) || !b.fields.length) err("card.fields: non-empty array");
		else b.fields.forEach((f, i) => {
			if (!isObj(f) || !isStr(f.label)) err(`fields[${i}]: {label, value}`);
			else if (f.value === undefined || isObj(f.value) || Array.isArray(f.value)) err(`fields[${i}].value: scalar`);
			else if (f.evidence !== undefined && !isStr(f.evidence)) err(`fields[${i}].evidence: string`);
		});
		if (b.badges !== undefined && (!Array.isArray(b.badges) || !b.badges.every(isStr))) err("card.badges: string[]");
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

export function renderBlockText(b) {
	const out = [`## ${b.title}`, `scope: ${b.scope}`];
	if (b.type === "table") {
		const cols = b.columns;
		const dec = cols.map((c) => (c.type === "number" ? columnDecimals(b.rows, c.key) : 0));
		const rows = b.rows.map((r) => cols.map((c, i) => (c.type === "number" ? fmtCell(r[c.key], dec[i]) : cell(r[c.key]))));
		const widths = cols.map((c, i) => Math.max(c.label.length, ...rows.map((r) => r[i].length)));
		const line = (cells) => cells.map((s, i) => (cols[i].type === "number" ? s.padStart(widths[i]) : s.padEnd(widths[i]))).join("  ").trimEnd();
		out.push(line(cols.map((c) => c.label)));
		out.push(widths.map((w) => "-".repeat(w)).join("  "));
		for (const r of rows) out.push(line(r));
		if (!rows.length) out.push("(no rows)");
	} else if (b.type === "card") {
		if (b.subtitle) out.push(b.subtitle);
		if (b.badges?.length) out.push(`[${b.badges.join("] [")}]`);
		const w = Math.max(...b.fields.map((f) => f.label.length));
		for (const f of b.fields) out.push(`${f.label.padEnd(w)}  ${cell(f.value)}${f.evidence ? `  (${f.evidence})` : ""}`);
	}
	if (b.note) out.push(`note: ${b.note}`);
	if (b.actions?.length) out.push(`actions: ${b.actions.map((a) => (a.per_row ? `${a.label} (per row)` : a.label)).join(" · ")}`);
	return out.join("\n");
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

// ── the stage reducer ──
// entries: session entries (RPC get_entries or the session file), each with
// {id, parentId, type, customType?, data?}. Walk parentId ancestry from leafId
// (null → last entry), then fold nana-block entries on that path in order,
// upserting by block id. Abandoned branches never reach the stage.
export function reduceEntries(entries, leafId) {
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
	path.reverse();
	const blocks = new Map();
	for (const e of path) {
		if (e.type !== "custom" || e.customType !== ENTRY_TYPE) continue;
		const b = e.data;
		if (!isObj(b) || !isStr(b.id) || !isObj(b.produced_by)) continue; // only stamped blocks
		blocks.set(b.id, b); // Map keeps first-insertion order → replace IN PLACE
	}
	return [...blocks.values()];
}

// Apply one live tool event's stamped blocks onto a block array (same upsert).
export function applyLiveBlocks(current, blocks) {
	const m = new Map(current.map((b) => [b.id, b]));
	for (const b of blocks || []) {
		if (!isObj(b) || !isStr(b.id) || !isObj(b.produced_by)) continue;
		m.set(b.id, b); // in place
	}
	return [...m.values()];
}

// ── the hook logic, pure (nana-stage.ts is a thin adapter over this) ──
// event: {toolName, toolCallId, input, content, details, isError}
// → null (not a block result) | { patch, entries } where patch is the tool_result
//   return value and entries are the nana-block data objects to append, in order.
export function processToolResult(event, { now = () => new Date().toISOString() } = {}) {
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
		stamped.push({
			...rest,
			slot: rest.slot || "main",
			show: rest.show !== false,
			produced_by: { tool: event.toolName, args: event.input ?? {}, toolCallId: event.toolCallId, at: now() },
		});
	}
	const text = stamped.filter((b) => b.show).map(renderBlockText).join("\n\n") || "(blocks hidden: show=false)";
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
