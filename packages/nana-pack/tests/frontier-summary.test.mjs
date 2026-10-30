/**
 * @module packages/nana-pack/tests/frontier-summary.test.mjs
 * @purpose Pin the frontier block's parsing, checker parity, bounds, role silence, read failures and sealed values.
 * @inputs Disposable HANDOFF repositories, the frontier summary library and CLI, checker fixtures and configuration constants.
 * @outputs PASS/FAIL checks for R-2607 through R-2611 and the frontier seal.
 * @effects disk (temporary fixtures), process (runs the frontier producer and checker CLIs).
 * @errors Failed checks set a nonzero exit code; every subprocess has a per-case timeout.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { BOUNDED_READ_CAP } from "../lib/bounded-read.mjs";
import { promptPath } from "../lib/display.mjs";
import { frontierSummary } from "../lib/frontier-summary.mjs";
import { FRONTIER_HEADING, FRONTIER_OUTPUT_CAP, FRONTIER_SECTION, FRONTIER_TAG, FRONTIER_TITLE_CAP, FRONTIER_UNAVAILABLE } from "../lib/frontier-summary-config.mjs";
import { tmpDir } from "./tmp-dir.mjs";
import * as frontierValues from "../lib/frontier-summary-config.mjs";

delete process.env.NANA_ROLE;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PRODUCER = path.join(ROOT, "packages/nana-pack/bin/nana-frontier-summary.mjs");
const CHECKER = path.join(ROOT, "packages/nana-pack/bin/nana-frontier.mjs");
const TODAY = "2026-10-22";
const CASE_LIMIT_MS = 8_000;
const TEST_HOME = tmpDir(path.join(os.tmpdir(), "frontier-summary-home-"));
let failures = 0;
const check = (title, ok, detail = "") => {
	console.log(ok ? "PASS" : "FAIL", `${title}${ok || !detail ? "" : ` — ${detail}`}`);
	if (!ok) failures++;
};
const repo = (name, text, { git = true } = {}) => {
	const root = tmpDir(path.join(os.tmpdir(), `${name}-`));
	if (git) fs.mkdirSync(path.join(root, ".git"));
	if (text !== null) fs.writeFileSync(path.join(root, "HANDOFF.md"), text);
	return root;
};
const run = (cli, args, env = {}) => spawnSync(process.execPath, [cli, ...args], {
	encoding: "utf8",
	timeout: CASE_LIMIT_MS,
	env: { ...process.env, HOME: TEST_HOME, USERPROFILE: TEST_HOME, ...env },
});
const block = (text, opts = {}) => {
	const root = repo("frontier-summary", text, { git: opts.git ?? true });
	return { root, text: frontierSummary({ cwd: root, today: TODAY, env: opts.env ?? {}, max: opts.max }) };
};
const lines = (text) => text?.split("\n") ?? [];

{
	const fixtures = [];
	fixtures.push(block([
		"# Handoff", "## Next", "1. **First title.** body", "   - nested item", "2. **Second title:** body", "## Landed", "- not live",
		"## Open for the owner (each ask)", "- **[parked, since 2026-10-01] Parked ask.** body", "- **[blocking, since 2026-10-02] Blocking ask.** body",
		"- [optional, since 2026-10-03] Untitled optional", "- no tag fallback", "  [blocking, since 2026-10-04]", "```md", "## Next", "- fenced", "```",
	].join("\n")).text);
	fixtures.push(block("## NEXT \t\n- Plain bullet title\t").text);
	fixtures.push(block("## Next (now)\n- Current\n### Next (later)\n- Nested heading item\n## Landed\n### Next steps\n- Archived item\n").text);
	fixtures.push(block("## Open for Morgan (decide)\n- [blocking, since 2026-10-01] Tagged without title\n").text);
	fixtures.push(block("```md\n## Next\n- fenced only\n```\n## Landed\n- not live\n").text);
	fixtures.push(block("## Open\n- seed item\n").text);
	fixtures.push(block("").text);
	const main = fixtures[0];
	const expectedInOrder = [
		"- First title", "- Second title", "- [blocking, since 2026-10-02] Blocking ask", "- [blocking, since 2026-10-04] no tag fallback",
		"- [optional, since 2026-10-03] Untitled optional", "- [parked, since 2026-10-01] Parked ask",
	];
	let at = -1;
	const ordered = expectedInOrder.every((needle) => { const next = main.indexOf(needle, at + 1); if (next < 0) return false; at = next; return true; });
	const withoutPath = (value) => value.replace(/^Read from .* at session start\./m, "Read from <path> at session start.");
	const crlf = block("## Next\r\n1. **CRLF title.** body\r\n## Open for the owner\r\n- **[optional, since 2026-10-01] CRLF ask.** body\r\n").text;
	const lf = block("## Next\n1. **CRLF title.** body\n## Open for the owner\n- **[optional, since 2026-10-01] CRLF ask.** body\n").text;
	const bom = block(`\uFEFF## Next\n- BOM title\n`).text;
	const plainBom = block("## Next\n- BOM title\n").text;
	const ok = ordered && !main.includes("nested item") && !main.includes("not live") && !main.includes("fenced") &&
		fixtures[1].includes("- Plain bullet title") && fixtures[2].split("- Nested heading item").length === 2 && !fixtures[2].includes("Archived item") &&
		fixtures[3].includes("[blocking, since 2026-10-01] Tagged without title") && !fixtures[4].includes("fenced only") &&
		fixtures[5].includes("Open for the owner: none found.") && fixtures[6].includes("Next: none found.") && fixtures[6].includes("Open for the owner: none found.") &&
		withoutPath(crlf) === withoutPath(lf) && withoutPath(bom) === withoutPath(plainBom);
	// req: R-2607
	check("R-2607: Next titles and ask tags and titles are listed in block order, and nested items, fences and other sections are not", ok, main ?? "null");
}

{
	const fixtureTexts = {
		current: fs.readFileSync(path.join(ROOT, "packages/nana-pack/tests/fixtures/frontier/handoff-current-2026-10-11.md"), "utf8"),
		noTitle: "## Open for the owner\n- [optional, since 2026-10-10] no grammar here\n",
		continuation: "## Open for the owner\n- decision\n[optional, since 2026-10-10]\n",
		missing: "## Open for the owner\n- decision with no tag\n",
		future: "## Open for the owner\n- [blocking, since 2026-10-12] future\n",
		fenced: "## Open for the owner\n```md\n- [blocking, since 2026-10-12] fenced\n```\n",
		rewritten: fs.readFileSync(path.join(ROOT, "packages/nana-pack/tests/fixtures/frontier/rewritten.md"), "utf8"),
		legacy: fs.readFileSync(path.join(ROOT, "packages/nana-pack/tests/fixtures/frontier/legacy.md"), "utf8"),
		frozen: fs.readFileSync(path.join(ROOT, "packages/nana-pack/tests/fixtures/frontier/handoff-2026-10-06.md"), "utf8"),
		preRewrite: fs.readFileSync(path.join(ROOT, "packages/nana-pack/tests/fixtures/frontier/handoff-pre-rewrite.md"), "utf8"),
		tabs: "## Next\n- first\tpart\ncontinued line\n## Open for the owner\n- ask\n[optional, since 2026-10-10]\n",
	};
	let ok = true;
	const detail = [];
	for (const [name, source] of Object.entries(fixtureTexts)) {
		const root = repo(`frontier-check-${name}`, source);
		const handoff = path.join(root, "HANDOFF.md");
		const summary = frontierSummary({ cwd: root, today: TODAY, env: {} });
		const cli = run(CHECKER, ["--today", TODAY, handoff]);
		const cliLines = cli.stdout.trimEnd().split("\n");
		const summaryLine = cliLines.at(-1);
		const counts = [];
		for (const line of cliLines.slice(0, -1)) {
			const kind = /: ([a-z-]+):/.exec(line)?.[1];
			if (!kind) continue;
			const found = counts.find((entry) => entry.kind === kind);
			if (found) found.count++;
			else counts.push({ kind, count: 1 });
		}
		const suffix = counts.length ? ` (${counts.map(({ kind, count }) => `${kind} ${count}`).join(", ")})` : "";
		const expected = `Frontier check: ${summaryLine}${suffix}`;
		const actual = lines(summary).filter((line) => line.startsWith("Frontier check:")).at(-1);
		if (cli.status !== 0 || actual !== expected || lines(summary).at(-2) !== expected) { ok = false; detail.push(`${name}: ${JSON.stringify({ expected, actual, status: cli.status })}`); }
	}
	// req: R-2608
	check("R-2608: the block ends with the frontier checker's own summary line and counts", ok, detail.join(" | "));
}

{
	const hostile = block([
		"## Next", `- ${"A".repeat(500)}`, "- tab\tmark\u202Ereverse\u2028line", "- **## heading ** inside:** body",
		"## Open for the owner", ...Array.from({ length: 300 }, (_, i) => `- **[${i < 3 ? "blocking" : i % 3 === 0 ? "optional" : i % 3 === 1 ? "parked" : "optional"}, since 2026-10-01] Ask ${i} ${"x".repeat(80)}.** body`),
	].join("\n")).text;
	const longNext = block(["## Next", ...Array.from({ length: 40 }, (_, i) => `- Next ${i} ${"n".repeat(120)}`), "## Open for the owner", ...Array.from({ length: 3 }, (_, i) => `- **[blocking, since 2026-10-01] Must decide ${i}.** body`)].join("\n")).text;
	const maxed = block(["## Next", ...Array.from({ length: 80 }, (_, i) => `- Item ${i} ${"z".repeat(100)}`)].join("\n"), { max: 1200 }).text;
	const tiny = block("## Next\n- one\n", { max: 8 }).text;
	const titleLines = lines(hostile).filter((line) => line.startsWith("- "));
	const cut = /…and (\d+) more titles not shown \((\d+) Next, (\d+) asks\)\./.exec(hostile ?? "");
	const displayed = titleLines.length;
	const total = 303;
	const renderedTitles = titleLines.map((line) => /^- \[/.test(line) ? line.replace(/^- \[(?:(?:blocking|optional|parked), since \d{4}-\d{2}-\d{2}|no tag)\] /, "") : line.slice(2));
	const clean = renderedTitles.every((title) => title.length <= FRONTIER_TITLE_CAP && !/[\u0000-\u001f\u007f-\u009f\u2028\u2029\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/.test(title));
	const oneDataLine = lines(hostile).filter((line) => line.includes("heading")).length === 1;
	const blockingFirst = [0, 1, 2].every((i) => hostile.includes(`[blocking, since 2026-10-01] Ask ${i}`)) && [0, 1, 2].every((i) => longNext.includes(`[blocking, since 2026-10-01] Must decide ${i}`));
	const ok = hostile.length <= FRONTIER_OUTPUT_CAP && maxed.length <= 1200 && clean && oneDataLine && blockingFirst &&
		Boolean(cut) && Number(cut?.[1]) === total - displayed && Number(cut?.[2]) + Number(cut?.[3]) === Number(cut?.[1]) &&
		hostile.includes("Frontier check:") && maxed.includes("Frontier check:") && tiny === "frontier block omitted: 8 characters left after the objective\n";
	// req: R-2609
	check("R-2609: the block stays within its caps, renders each title as one clean line, keeps blocking asks first and counts the titles it left out", ok, JSON.stringify({ hostile: hostile?.length, maxed: maxed?.length, cut: cut?.slice(1), displayed, tiny }));
}

{
	const missingRepo = repo("frontier-missing", null);
	const outside = repo("frontier-outside", null, { git: false });
	const roleRepo = repo("frontier-role", "## Next\n- visible\n");
	const cases = [
		run(PRODUCER, ["--cwd", missingRepo]), run(PRODUCER, ["--cwd", outside]),
		run(PRODUCER, ["--cwd", roleRepo], { NANA_ROLE: "worker" }), run(PRODUCER, ["--cwd", roleRepo], { NANA_ROLE: "reviewer" }),
	];
	const control = run(PRODUCER, ["--cwd", roleRepo], { NANA_ROLE: "Worker" });
	const ok = cases.every((result) => result.status === 0 && result.stdout === "" && !result.signal) && control.status === 0 && control.stdout.startsWith(`${FRONTIER_TAG}\n`);
	// req: R-2610
	check("R-2610: no HANDOFF.md or a reviewer or worker role gives no output and exit 0", ok, JSON.stringify([...cases.map((r) => ({ status: r.status, out: r.stdout })), { control: control.stdout }]));
}

{
	const fixtures = [];
	const directory = repo("frontier-dir", null); fs.mkdirSync(path.join(directory, "HANDOFF.md")); fixtures.push([directory, "a directory"]);
	const utf16 = repo("frontier-utf16", null); fs.writeFileSync(path.join(utf16, "HANDOFF.md"), Buffer.from([0xff, 0xfe, 0x23, 0x00])); fixtures.push([utf16, "not valid UTF-8"]);
	const over = repo("frontier-over", null); fs.writeFileSync(path.join(over, "HANDOFF.md"), Buffer.alloc(BOUNDED_READ_CAP + 1, 0x61)); fixtures.push([over, `larger than ${BOUNDED_READ_CAP} bytes`]);
	if (process.platform !== "win32") {
		const fifo = repo("frontier-fifo", null);
		const made = spawnSync("mkfifo", [path.join(fifo, "HANDOFF.md")], { timeout: CASE_LIMIT_MS });
		if (made.status === 0) fixtures.push([fifo, "not a regular file"]);
	}
	const results = fixtures.map(([root, cause]) => {
		const result = run(PRODUCER, ["--cwd", root]);
		const file = path.join(root, "HANDOFF.md");
		const outLines = result.stdout.trimEnd().split("\n");
		return { root, cause, result, ok: result.status === 0 && !result.signal && outLines[0] === FRONTIER_TAG && outLines[1] === FRONTIER_HEADING && outLines.length === 3 && outLines[2].startsWith(FRONTIER_UNAVAILABLE) && outLines[2].includes(cause) && outLines[2].includes(promptPath(path.join(fs.realpathSync.native(root), "HANDOFF.md"))) };
	});
	// req: R-2611
	check("R-2611: an unreadable HANDOFF.md gives one FRONTIER UNAVAILABLE line naming its cause and path", results.every((entry) => entry.ok), JSON.stringify(results.map(({ cause, result }) => ({ cause, status: result.status, out: result.stdout, signal: result.signal }))));
}

// req: R-2606 R-2609 R-2612
check("seal: the frontier block's tag is [nana:frontier], its pi section is nana-frontier and its caps are 4,000 and 160 characters", FRONTIER_TAG === "[nana:frontier]" && FRONTIER_SECTION === "nana-frontier" && FRONTIER_OUTPUT_CAP === 4000 && FRONTIER_TITLE_CAP === 160);

{
	const pointer = "## Next\nThe live next items are the open issues labelled `next` at https://github.com/example/project/issues.\n## Open for the owner\nThe owner's open questions are the open issues labelled `ask` at https://github.com/example/project/issues.\n";
	const root = repo("frontier-main-ci", pointer);
	const render = (opts = {}) => frontierSummary({ cwd: root, env: {}, readIssues: () => ({ items: [] }), ...opts });
	const before = render();
	fs.mkdirSync(path.join(root, ".github/workflows"), { recursive: true });
	fs.writeFileSync(path.join(root, ".github/workflows/ci.yml"), "name: ci\n");
	const variants = [pointer, pointer.replaceAll("\n", "\r\n"), pointer.trimEnd() + " \t"];
	const blocks = variants.map((text) => { fs.writeFileSync(path.join(root, "HANDOFF.md"), text); return render(); });
	const omitted = render({ max: 1 });
	const seat = fs.readFileSync(path.join(ROOT, "packages/nana-setup/claude/rules/nana-seat.md"), "utf8");
	const ok = !before.includes("nana-main-ci") && blocks.every((text) => text.includes("nana-main-ci.mjs") && text.length <= FRONTIER_OUTPUT_CAP && text.indexOf("nana-main-ci.mjs") > text.indexOf("nana-issue-watch.mjs")) &&
		render({ env: { NANA_ROLE: "reviewer" } }) === null && render({ env: { NANA_ROLE: "worker" } }) === null && omitted.startsWith("frontier block omitted:") && omitted.includes("nana-main-ci.mjs") &&
		/session start/.test(seat) && /after each land.*main run finishes/.test(seat) && /--post.*red/.test(seat);
	// req: R-3184
	check("R-3184: the bounded and omitted seat blocks name main CI beside issue watch only with its workflow and the rule requires both runs", ok, JSON.stringify({ before, blocks, omitted }));
}
// req: R-3184
check("seal R-3184: the runnable main CI command prefix", frontierValues.MAIN_CI_COMMAND_PREFIX === 'node "$HOME/nana-pi/packages/nana-pack/bin/nana-main-ci.mjs"');

if (failures) process.exitCode = 1;
