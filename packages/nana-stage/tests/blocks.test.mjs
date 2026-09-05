// Deterministic tests for the block contract + the nana-stage hook logic
// (design §6 deliverable 2). Zero-dep. Run: node packages/nana-stage/tests/blocks.test.mjs
import {
	validateBlock, renderBlockText, extractBlocks, stripCarrier, reduceEntries, applyLiveBlocks,
	processToolResult, rowPrompt, isStamp, consumable, pathEntries, MAX_TABLE_ROWS, ENTRY_TYPE, MAX_CHART_SERIES, MAX_CHART_POINTS,
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

// ── renderBlockText: deterministic, carries scope, note, actions ──
const t1 = renderBlockText(table());
check("table text has title, scope, header, rows", t1.includes("## 2026-27 general board") && t1.includes("scope: reports/") && t1.includes("Player") && t1.includes("Shai Gilgeous-Alexander"));
check("table text is byte-stable", t1 === renderBlockText(table()));
const c1 = renderBlockText(card());
check("card text has fields, badge, note, evidence", c1.includes("PTS") && c1.includes("[C]") && c1.includes("note: no injury") && c1.includes("(player_season_stats)"));

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
