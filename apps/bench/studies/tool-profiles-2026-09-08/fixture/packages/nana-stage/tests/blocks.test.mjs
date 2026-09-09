// Deterministic tests for the block contract + the nana-stage hook logic
// (design §6 deliverable 2). Zero-dep. Run: node packages/nana-stage/tests/blocks.test.mjs
import {
	validateBlock, renderBlockText, extractBlocks, stripCarrier, reduceEntries, applyLiveBlocks,
	processToolResult, rowPrompt, isStamp, consumable, pathEntries, MAX_TABLE_ROWS, ENTRY_TYPE, MAX_CHART_SERIES, MAX_CHART_POINTS, MAX_CHART_POINTS_TOTAL,
	MAX_TEXT_COL_WIDTH, MAX_BLOCK_TEXT_BYTES, MAX_RESULT_TEXT_BYTES, clampText,
} from "../lib/blocks.mjs";
import { signBlock, verifyBlock, canonical } from "../lib/sign.mjs";

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, extra); if (!ok) fails++; };
const NOW = () => "2026-09-04T00:00:00.000Z";

const table = () => ({
	id: "blk_board", type: "table", title: "2026-27 general board",
	scope: "reports/board-2026-27-general.md, consensus of 3 analysts, generated 2026-07",
	columns: [{ key: "rank", label: "#", type: "number" }, { key: "player", label: "Player" }, { key: "salary", label: "Salary", type: "number" }],
	rows: [{ rank: 1, player: "Nikola Jokić", salary: 59.0 }, { rank: 2, player: "Shai Gilgeous-Alexander", salary: 40.8 }],
	actions: [{ label: "Open card", prompt: "player_card Nikola Jokić" }],
});
const card = () => ({
	id: "blk_player_203999", type: "card", title: "Nikola Jokić", subtitle: "age 31 · DEN",
	scope: "basketball.sqlite 2025-26 Base PerGame; contracts through 2027-28",
	fields: [{ label: "PTS", value: 29.6 }, { label: "REB", value: 12.7, evidence: "player_season_stats" }],
	badges: ["C"], note: "no injury on file",
});
const ev = (details, extra = {}) => ({ toolName: "board_table", toolCallId: "call_1", input: { board: "general" }, content: [{ type: "text", text: "raw tool text" }], details, isError: false, ...extra });

// ── validateBlock ──
check("valid table", validateBlock(table()).ok);
check("valid card", validateBlock(card()).ok);
check("missing scope rejected", !validateBlock({ ...table(), scope: "" }).ok);
check("missing title rejected", !validateBlock({ ...card(), title: undefined }).ok);
check("reserved type rejected with a specific message", (validateBlock({ ...table(), type: "kpi" }).errors || []).some((m) => /reserved/.test(m)));

// ── chart (slice 2) ──
const chart = () => ({
	id: "blk_oos_amihud", type: "chart", title: "amihud_illiquidity — OOS growth of $1 vs SPY", kind: "line",
	scope: "reports/desk/oos-amihud_illiquidity.json; walk-forward OOS 2013-01-04→2026-05-29, weekly points, live vintage",
	x: { type: "date", label: "week" }, y: { label: "growth of $1", format: "number" },
	series: [
		{ key: "strat", label: "amihud (126, 25)", points: [["2013-01-04", 1], ["2013-01-11", 1.02], ["2013-01-18", 0.99]] },
		{ key: "spy", label: "SPY", points: [["2013-01-04", 1], ["2013-01-11", 1.01], ["2013-01-18", 1.015]] },
	],
});
check("valid chart", validateBlock(chart()).ok, JSON.stringify(validateBlock(chart())));
check("chart: unknown kind rejected", !validateBlock({ ...chart(), kind: "pie" }).ok);
check("chart: missing x rejected", !validateBlock({ ...chart(), x: undefined }).ok);
check("chart: empty series rejected", !validateBlock({ ...chart(), series: [] }).ok);
check(`chart: > ${MAX_CHART_SERIES} series rejected`, !validateBlock({ ...chart(), series: Array.from({ length: MAX_CHART_SERIES + 1 }, (_, i) => ({ key: `s${i}`, label: `S${i}`, points: [["2020-01-01", 1]] })) }).ok);
check(`chart: > ${MAX_CHART_POINTS} points rejected`, !validateBlock({ ...chart(), series: [{ key: "s", label: "S", points: Array.from({ length: MAX_CHART_POINTS + 1 }, (_, i) => [i, 1]) }], x: { type: "number" } }).ok);
check("chart: bad date x rejected", !validateBlock({ ...chart(), series: [{ key: "s", label: "S", points: [["2020/01/01", 1]] }] }).ok);
check("chart: impossible calendar date rejected (2026-99-99, 2026-02-30)", !validateBlock({ ...chart(), series: [{ key: "s", label: "S", points: [["2026-99-99", 1]] }] }).ok && !validateBlock({ ...chart(), series: [{ key: "s", label: "S", points: [["2026-02-30", 1]] }] }).ok && validateBlock({ ...chart(), series: [{ key: "s", label: "S", points: [["2024-02-29", 1]] }] }).ok);
check("chart: all-null series (nothing to draw) rejected", !validateBlock({ ...chart(), series: [{ key: "s", label: "S", points: [["2020-01-01", null], ["2020-01-02", null]] }] }).ok);
check(`chart: > ${MAX_CHART_POINTS_TOTAL} points across series rejected even when each series is under ${MAX_CHART_POINTS}`, !validateBlock({ ...chart(), x: { type: "number" }, series: [1, 2, 3].map((k) => ({ key: `s${k}`, label: `S${k}`, points: Array.from({ length: 900 }, (_, i) => [i, 1]) })) }).ok);
check("chart: a 2-series × 1000-point date chart fits the byte cap", validateBlock({ ...chart(), series: [1, 2].map((k) => ({ key: `s${k}`, label: `S${k}`, points: Array.from({ length: 1000 }, (_, i) => [new Date(Date.UTC(2013, 0, 4) + i * 7 * 86400000).toISOString().slice(0, 10), 1 + i * 0.0137]) })) }).ok);
check("chart: non-monotonic x rejected", !validateBlock({ ...chart(), series: [{ key: "s", label: "S", points: [["2020-02-01", 1], ["2020-01-01", 1]] }] }).ok);
check("chart: NaN y rejected, null y allowed", !validateBlock({ ...chart(), series: [{ key: "s", label: "S", points: [["2020-01-01", NaN]] }] }).ok && validateBlock({ ...chart(), series: [{ key: "s", label: "S", points: [["2020-01-01", null], ["2020-01-02", 1]] }] }).ok);
check("chart: number x-axis accepts numbers only", validateBlock({ ...chart(), x: { type: "number" }, series: [{ key: "s", label: "S", points: [[1, 1], [2, 2]] }] }).ok && !validateBlock({ ...chart(), x: { type: "number" }, series: [{ key: "s", label: "S", points: [["2020-01-01", 1]] }] }).ok);
check("chart: y.format must be number|percent", !validateBlock({ ...chart(), y: { format: "money" } }).ok);
{
	const t = renderBlockText(chart());
	check("chart text: a per-series summary, not the points", /^- amihud \(126, 25\): 3 points 2013-01-04 → 2013-01-18; first 1, last 0.99, min 0.99, max 1.02$/m.test(t) && !/1\.02.*1\.01.*1\.015/s.test(t.split("\n").slice(0, 3).join("\n")), t);
	check("chart text: names kind and axes", /^line chart, week → growth of \$1$/m.test(t), t);
	const pct = renderBlockText({ ...chart(), y: { label: "drawdown", format: "percent" } });
	check("chart text: percent format renders as %", /min 99\.0%, max 102\.0%/.test(pct), pct);
	const r = processToolResult(ev({ blocks: [chart()] }), { now: NOW });
	check("chart through the hook: stamped, entry appended, text is the summary", r.entries.length === 1 && r.entries[0].produced_by.tool === "board_table" && r.patch.content[0].text === renderBlockText(r.entries[0]));
}
check("unknown type rejected", !validateBlock({ ...table(), type: "widget" }).ok);
check("bad slot rejected", !validateBlock({ ...table(), slot: "top" }).ok);
check("table without columns rejected", !validateBlock({ ...table(), columns: [] }).ok);
check("table row not object rejected", !validateBlock({ ...table(), rows: [1] }).ok);
check(`table > ${MAX_TABLE_ROWS} rows rejected`, !validateBlock({ ...table(), rows: Array.from({ length: MAX_TABLE_ROWS + 1 }, () => ({ rank: 1 })) }).ok);
check("card field with object value rejected", !validateBlock({ ...card(), fields: [{ label: "x", value: { a: 1 } }] }).ok);
check("action without prompt rejected", !validateBlock({ ...table(), actions: [{ label: "x" }] }).ok);
check("per_row action on a card rejected", !validateBlock({ ...card(), actions: [{ label: "x", prompt: "y", per_row: true }] }).ok);
check("per_row action on a table accepted; rowPrompt substitutes", validateBlock({ ...table(), actions: [{ label: "Card", prompt: "player_card {player}", per_row: true }] }).ok && rowPrompt("player_card {player} #{rank} {missing}", table().rows[0]) === "player_card Nikola Jokić #1 {missing}");
check("oversize block (>64 KiB) rejected", !validateBlock({ ...card(), note: "x".repeat(70 * 1024) }).ok);
check("produced_by supplied by the tool does not fail validation (it is overwritten later)", validateBlock({ ...card(), produced_by: { tool: "forged" } }).ok);

// ── validateBlock NEVER throws: it runs in pi's tool_result handler, where a
//    thrown error BLOCKS the tool. Malformed input is a rejection, not a crash. ──
{
	const thrower = { ...card(), get boom() { throw new Error("hostile getter"); } };
	const cyclic = { ...card() }; cyclic.self = cyclic;
	const caught = (b) => { try { return validateBlock(b); } catch (e) { return { threw: String(e && e.message) }; } };
	check("a cyclic block is REJECTED, not thrown on", caught(cyclic).ok === false && /circular/i.test(caught(cyclic).errors.join(" ")), JSON.stringify(caught(cyclic)).slice(0, 120));
	check("a block with a throwing getter is REJECTED, not thrown on", caught(thrower).ok === false && /hostile getter/.test(caught(thrower).errors.join(" ")), JSON.stringify(caught(thrower)).slice(0, 120));
	check("a bigint anywhere is REJECTED, not thrown on (JSON.stringify would throw)", caught({ ...card(), fields: [{ label: "n", value: 1n }] }).ok === false && caught({ ...table(), rows: [{ rank: 1n }] }).ok === false && caught({ ...card(), actions: [{ label: "a", prompt: "p", extra: 1n }] }).ok === false);
}

// ── only JSON-durable scalars: a validated block must survive persist → replay ──
{
	const roundTrips = (b) => JSON.stringify(JSON.parse(JSON.stringify(b))) === JSON.stringify(b);
	for (const [what, v] of [["NaN", NaN], ["Infinity", Infinity], ["a function", () => 1], ["a symbol", Symbol("s")]]) {
		check(`card value ${what} rejected (silently mutates or vanishes on replay)`, !validateBlock({ ...card(), fields: [{ label: "x", value: v }] }).ok);
		check(`table cell ${what} rejected`, !validateBlock({ ...table(), rows: [{ rank: v }] }).ok);
	}
	check("null, strings, booleans and finite numbers stay legal in both", validateBlock({ ...card(), fields: [{ label: "x", value: null }, { label: "y", value: true }, { label: "z", value: -1.5 }] }).ok && validateBlock({ ...table(), rows: [{ rank: 1, player: "p", salary: null }, { rank: 2, player: "q", extra: false }] }).ok);
	check("a row key no column names is still checked (it rides rowPrompt and is persisted)", !validateBlock({ ...table(), rows: [{ rank: 1, _ref: () => "x" }] }).ok);
	check("undefined in a row is legal — indistinguishable from an absent key", validateBlock({ ...table(), rows: [{ rank: 1, player: undefined }] }).ok);
	check("what validates now round-trips through JSON unchanged", roundTrips(table()) && roundTrips(card()) && roundTrips(chart()));
}

// ── validation ⟷ render agreement: a block that validates must be renderable ──
// The stage draws `subtitle` and `badges` on EVERY block type, so they are checked
// for every type. `badges: {length: 2}` used to validate and then throw in the
// stage's `for…of`; a non-string badge used to paint "[object Object]".
check("badges: string[] enforced on table and chart, not only card", !validateBlock({ ...table(), badges: { length: 2 } }).ok && !validateBlock({ ...chart(), badges: ["ok", {}] }).ok && validateBlock({ ...table(), badges: ["NEW"] }).ok);
check("subtitle: string enforced on table and chart, not only card", !validateBlock({ ...table(), subtitle: 42 }).ok && !validateBlock({ ...chart(), subtitle: ["x"] }).ok && validateBlock({ ...chart(), subtitle: "weekly" }).ok);
// The other half of the same rule: shapes the renderers DO handle stay legal.
{
	const sparse = { ...table(), rows: [{ rank: 1 }, { player: "no rank, no salary" }] };
	check("a row missing a column's key stays legal and renders an empty cell", validateBlock(sparse).ok && renderBlockText(sparse).includes("no rank, no salary"));
	const halfNull = { ...chart(), series: [chart().series[0], { key: "n", label: "N", points: [["2013-01-04", null], ["2013-01-11", null]] }] };
	check("an all-null series beside a drawable one stays legal (summarised, not rejected)", validateBlock(halfNull).ok && /N: 2 points, no values/.test(renderBlockText(halfNull)));
	const onePoint = { ...chart(), series: [{ key: "s", label: "S", points: [["2013-01-04", 1]] }] };
	check("a single-point series stays legal (degenerate axis is the renderer's job)", validateBlock(onePoint).ok);
}

// ── renderBlockText: deterministic, carries scope, note, actions ──
const t1 = renderBlockText(table());
check("table text has title, scope, header, rows", t1.includes("## 2026-27 general board") && t1.includes("scope: reports/") && t1.includes("Player") && t1.includes("Shai Gilgeous-Alexander"));
check("table text is byte-stable", t1 === renderBlockText(table()));
const c1 = renderBlockText(card());
check("card text has fields, badge, note, evidence", c1.includes("PTS") && c1.includes("[C]") && c1.includes("note: no injury") && c1.includes("(player_season_stats)"));

// ── the model-facing rendering is BOUNDED (the 64 KiB cap bounds JSON, not text) ──
{
	const bytes = (s) => new TextEncoder().encode(s).length;
	// one wide cell × 500 rows of padding: 57 KiB of JSON rendered ~22 MB of context
	const wideCell = "W".repeat(45000);
	const wide = {
		...table(), columns: [{ key: "player", label: "Player" }, { key: "rank", label: "#", type: "number" }],
		rows: [{ player: wideCell, rank: 1 }, ...Array.from({ length: 499 }, (_, i) => ({ player: "x", rank: i + 2 }))],
	};
	check("padded-table fixture is a VALID block (under the 64 KiB JSON cap)", validateBlock(wide).ok, JSON.stringify(validateBlock(wide).errors || []).slice(0, 160));
	const wt = renderBlockText(wide);
	check(`one wide cell no longer pads every row: text ≤ ${MAX_BLOCK_TEXT_BYTES} bytes`, bytes(wt) <= MAX_BLOCK_TEXT_BYTES, `${bytes(wt)} bytes`);
	check("the width cap loses no data: the wide cell is still printed whole", wt.includes(wideCell));
	// many columns: the width cap alone cannot bound it, so the byte cap cuts — and says so
	const cols = Array.from({ length: 12 }, (_, i) => ({ key: `c${i}`, label: `c${i}` }));
	const many = {
		...table(), columns: cols,
		rows: [Object.fromEntries(cols.map((c) => [c.key, "y".repeat(MAX_TEXT_COL_WIDTH)])), ...Array.from({ length: 499 }, () => ({ c11: "z" }))],
	};
	check("wide-grid fixture is a VALID block", validateBlock(many).ok, JSON.stringify(validateBlock(many).errors || []).slice(0, 160));
	const mt = renderBlockText(many);
	check(`block text is hard-bounded at ${MAX_BLOCK_TEXT_BYTES} bytes`, bytes(mt) <= MAX_BLOCK_TEXT_BYTES, `${bytes(mt)} bytes`);
	check("truncation is announced in the text, never silent", /truncated at \d+ bytes/.test(mt));
	// the bound is on the whole tool result too — one call may return many blocks
	const manyBlocks = processToolResult(ev({ blocks: [1, 2, 3, 4, 5].map((n) => ({ ...many, id: `blk_many_${n}` })) }), { now: NOW });
	check(`tool-result text is hard-bounded at ${MAX_RESULT_TEXT_BYTES} bytes`, bytes(manyBlocks.patch.content[0].text) <= MAX_RESULT_TEXT_BYTES, `${bytes(manyBlocks.patch.content[0].text)} bytes`);
	check("ordinary blocks render byte-identically under the caps", renderBlockText(table()) === t1 && renderBlockText(card()) === c1);
	const multi = "é".repeat(200) + "🎉".repeat(100);
	check("clampText holds the byte bound on multi-byte text, marker or not", [10, 120, 401, 1e6].every((cap) => bytes(clampText(multi, cap, "x")) <= cap) && clampText("short", 100, "x") === "short");
	// A cap under the notice's own length takes the silent-cut path, which is the
	// only way to drive the boundary logic exactly. U+FFFD is 3 bytes: a cut at 6
	// lands right after the second one, and it must SURVIVE (it is real text, not
	// the decoder's marker for a byte sequence that got sliced in half).
	check("a genuine U+FFFD ending exactly on the cut is kept", clampText("\uFFFD".repeat(30), 6, "t") === "\uFFFD\uFFFD", JSON.stringify(clampText("\uFFFD".repeat(30), 6, "t")));
	// 3-byte U+FFFD then 4-byte emoji: a cut at 5 splits the emoji → back up to 3.
	check("a cut inside a 4-byte sequence backs up to the character boundary", clampText("\uFFFD" + "🎉".repeat(5), 5, "t") === "\uFFFD", JSON.stringify(clampText("\uFFFD" + "🎉".repeat(5), 5, "t")));
	check("every cut decodes as valid UTF-8 (no lone replacement char invented)", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].every((cap) => { const o = clampText("\uFFFD" + "🎉".repeat(5), cap, "t"); return bytes(o) <= cap && o === new TextDecoder("utf-8", { fatal: true }).decode(new TextEncoder().encode(o)); }));
}

// ── extractBlocks / stripCarrier ──
check("extension carrier found", extractBlocks({ blocks: [table()] }).where === "blocks");
check("mcp carrier found", extractBlocks({ mcpResult: { structuredContent: { blocks: [table()] } } }).where === "mcpResult");
check("mcp omission summary → overflow", extractBlocks({ mcpResult: { omitted: ["structuredContent"], summary: {} } }).overflow === true);
check("no carrier → null", extractBlocks({ diff: "x" }).blocks === null && extractBlocks(undefined).blocks === null);
const stripped = stripCarrier({ blocks: [1], mcpResult: { structuredContent: { blocks: [1], other: 2 } }, diff: "d" });
check("stripCarrier removes both carriers, keeps the rest", stripped.blocks === undefined && stripped.mcpResult.structuredContent.blocks === undefined && stripped.mcpResult.structuredContent.other === 2 && stripped.diff === "d");

// ── processToolResult: the hook logic ──
check("non-block tool result is untouched (null)", processToolResult(ev({ diff: "x" })) === null);

const ok = processToolResult(ev({ blocks: [table(), card()], other: 1 }), { now: NOW });
check("valid: one entry per block, in order", ok.entries.length === 2 && ok.entries[0].id === "blk_board" && ok.entries[1].id === "blk_player_203999");
check("valid: produced_by stamped from the event incl. args", ok.entries[0].produced_by.tool === "board_table" && ok.entries[0].produced_by.args.board === "general" && ok.entries[0].produced_by.toolCallId === "call_1" && ok.entries[0].produced_by.at === NOW());
check("valid: patch details.blocks are the stamped blocks (carrier replaced)", ok.patch.details.blocks === ok.entries && ok.patch.details.other === 1);
check("valid: content is exactly the canonical rendering, tool text dropped", ok.patch.content.length === 1 && ok.patch.content[0].text === `${renderBlockText(ok.entries[0])}\n\n${renderBlockText(ok.entries[1])}` && !ok.patch.content[0].text.includes("raw tool text"));
check("valid: defaults slot=main show=true", ok.entries[0].slot === "main" && ok.entries[0].show === true);

const forged = processToolResult(ev({ blocks: [{ ...card(), produced_by: { tool: "forged", args: {}, toolCallId: "x", at: "1999" } }] }), { now: NOW });
check("tool-supplied produced_by is overwritten", forged.entries[0].produced_by.tool === "board_table" && forged.entries[0].produced_by.at === NOW());

const hidden = processToolResult(ev({ blocks: [{ ...card(), show: false }] }), { now: NOW });
check("show:false is recorded and flagged hidden, text says so", hidden.entries[0].show === false && hidden.patch.content[0].text.includes("hidden"));

const bad = processToolResult(ev({ blocks: [table(), { ...card(), scope: "" }], diff: "keep" }), { now: NOW });
check("malformed: isError, no entries", bad.patch.isError === true && bad.entries.length === 0);
check("malformed: content is a text-part array naming the block index + reason", Array.isArray(bad.patch.content) && /blocks\[1\].*scope/.test(bad.patch.content[0].text));
check("malformed: carrier stripped, other details kept", bad.patch.details.blocks === undefined && bad.patch.details.diff === "keep");

const notArr = processToolResult(ev({ blocks: { id: "x" } }));
check("blocks not an array → error", notArr.patch.isError === true);

const mcpOk = processToolResult(ev({ mcpResult: { structuredContent: { blocks: [card()] }, server: "fp" } }), { now: NOW });
check("mcp path: blocks extracted, stamped, carrier moved to details.blocks", mcpOk.entries.length === 1 && mcpOk.patch.details.blocks.length === 1 && mcpOk.patch.details.mcpResult.structuredContent.blocks === undefined);

const over = processToolResult(ev({ mcpResult: { omitted: ["structuredContent"] } }));
check("mcp overflow → error naming the cap", over.patch.isError === true && /detailsMaxBytes/.test(over.patch.content[0].text));

// ── reduceEntries: leafId ancestry, upsert by id, abandoned branches ignored, only stamped ──
const stamp = (b) => ({ ...b, produced_by: { tool: "t", args: {}, toolCallId: "c", at: NOW() } });
const entries = [
	{ id: "e1", parentId: null, type: "message" },
	{ id: "e2", parentId: "e1", type: "custom", customType: ENTRY_TYPE, data: stamp({ ...table(), title: "v1" }) },
	{ id: "e3", parentId: "e2", type: "custom", customType: ENTRY_TYPE, data: stamp(card()) },
	{ id: "e4", parentId: "e2", type: "custom", customType: ENTRY_TYPE, data: stamp({ ...card(), title: "ABANDONED BRANCH" }) }, // branch off e2
	{ id: "e5", parentId: "e3", type: "custom", customType: ENTRY_TYPE, data: stamp({ ...table(), title: "v2" }) }, // same id as e2 → replaces
	{ id: "e6", parentId: "e5", type: "custom", customType: ENTRY_TYPE, data: { ...card(), id: "unstamped" } }, // no produced_by → ignored
	{ id: "e7", parentId: "e6", type: "custom", customType: "other", data: { id: "x" } },
];
const stage = reduceEntries(entries, "e7");
check("reducer: two blocks on the leaf path", stage.length === 2, JSON.stringify(stage.map((b) => b.id)));
check("reducer: same id replaced in place, ORDER of first appearance kept", stage[0].id === "blk_board" && stage[0].title === "v2" && stage[1].id === "blk_player_203999");
check("reducer: abandoned branch excluded", !stage.some((b) => b.title === "ABANDONED BRANCH"));
check("reducer: unstamped entry ignored", !stage.some((b) => b.id === "unstamped"));
check("reducer: leaf on the abandoned branch shows that branch", reduceEntries(entries, "e4").some((b) => b.title === "ABANDONED BRANCH"));
check("reducer: null leafId → last entry", reduceEntries(entries, null).length === 2);
check("reducer: byte-stable over a fixture", JSON.stringify(reduceEntries(entries, "e7")) === JSON.stringify(reduceEntries(entries, "e7")));
const live = applyLiveBlocks(stage, [stamp({ ...card(), title: "live update" }), { ...table(), id: "nope" }]);
check("applyLiveBlocks: upsert stamped only", live.length === 2 && live.find((b) => b.id === "blk_player_203999").title === "live update");

// ── strictness: reducers consume only VALID + STAMPED blocks; live blocks must belong to their event ──
check("isStamp: needs tool/toolCallId/at/args", isStamp({ tool: "t", toolCallId: "c", at: "x", args: {} }) && !isStamp({ tool: "t" }) && !isStamp({}));
check("consumable: malformed but stamped block rejected", !consumable(stamp({ ...card(), scope: "" })));
check("reducer: a stamped-but-malformed ledger entry never reaches the stage", reduceEntries([{ id: "a", parentId: null, type: "custom", customType: ENTRY_TYPE, data: stamp({ ...card(), fields: [] }) }], "a").length === 0);
check("reducer: produced_by:{} (forged shape) rejected", reduceEntries([{ id: "a", parentId: null, type: "custom", customType: ENTRY_TYPE, data: { ...card(), produced_by: {} } }], "a").length === 0);
const evt = { toolCallId: "c", toolName: "t" };
check("live: block stamped by another call is dropped", applyLiveBlocks([], [stamp(card())], { toolCallId: "other", toolName: "t" }).length === 0);
check("live: block stamped by this event is applied", applyLiveBlocks([], [stamp(card())], evt).length === 1);
check("live: malformed stamped block dropped", applyLiveBlocks([], [stamp({ ...card(), title: "" })], evt).length === 0);
check("pathEntries: active branch only, root first", pathEntries(entries, "e7").map((e) => e.id).join(",") === "e1,e2,e3,e5,e6,e7");

// ── signing: only the key holder can mint a block a server will pass through ──
const KEY = "0123456789abcdef0123456789abcdef";
const signed = processToolResult(ev({ blocks: [card()] }), { now: NOW, sign: (b) => signBlock(KEY, b) });
check("signed: sig present and verifies", typeof signed.entries[0].produced_by.sig === "string" && verifyBlock(KEY, signed.entries[0]));
check("signed: tampering the data breaks the sig", !verifyBlock(KEY, { ...signed.entries[0], title: "x" }));
check("signed: tampering the stamp breaks the sig", !verifyBlock(KEY, { ...signed.entries[0], produced_by: { ...signed.entries[0].produced_by, tool: "forged" } }));
check("signed: wrong key fails", !verifyBlock("f".repeat(32), signed.entries[0]));
check("signed: unsigned block fails", !verifyBlock(KEY, stamp(card())));
check("canonical: key order independent", canonical({ b: 1, a: [2, { d: 1, c: 2 }] }) === canonical({ a: [2, { c: 2, d: 1 }], b: 1 }));
check("unsigned processing (no key) still stamps", processToolResult(ev({ blocks: [card()] }), { now: NOW }).entries[0].produced_by.sig === undefined);

process.exit(fails ? 1 : 0);
