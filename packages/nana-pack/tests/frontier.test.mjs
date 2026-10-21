/**
 * @module packages/nana-pack/tests/frontier.test.mjs
 * @purpose Pins the report-only HANDOFF frontier checker against its read window, section order, rewritten and legacy fixtures, an injected date, and strict-mode exits.
 * @inputs the frontier CLI, fixture HANDOFF files, this repository's HANDOFF.md, and temporary inputs
 * @outputs named PASS/FAIL checks and a nonzero test exit when an assertion fails
 * @effects disk (temporary input); process (spawns the CLI)
 * @errors failed assertions are reported and cause exit 1
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { ARCHIVE_SECTION_NAMES, HANDOFF_WORD_BUDGET, LIVE_SECTION_NAMES, READ_WINDOW_BYTES, READ_WINDOW_LINES } from "../lib/frontier-config.mjs";
import { tmpDir } from "./tmp-dir.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = fileURLToPath(new URL("../bin/nana-frontier.mjs", import.meta.url));
const rewritten = path.join(HERE, "fixtures/frontier/rewritten.md");
const legacy = path.join(HERE, "fixtures/frontier/legacy.md");
const frozenRewrite = path.join(HERE, "fixtures/frontier/handoff-2026-10-06.md");
const preRewrite = path.join(HERE, "fixtures/frontier/handoff-pre-rewrite.md");
let fails = 0;
const check = (name, ok, detail = "") => {
	console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail);
	if (!ok) fails++;
};
const run = (file, extra = []) => spawnSync(process.execPath, [CLI, "--today", "2026-10-06", file, ...extra], { encoding: "utf8" });
{
  const golden = JSON.parse(fs.readFileSync(path.join(HERE, "fixtures/frontier-baseline.json"), "utf8"));
  const dir = tmpDir(path.join(os.tmpdir(), "frontier-baseline-"));
  const inputs = {
    current: fs.readFileSync(path.join(HERE, "fixtures/frontier/handoff-current-2026-10-11.md"), "utf8"),
    noTitle: "## Open for the owner\n- [optional, since 2026-10-10] no grammar here\n",
    continuation: "## Open for the owner\n- decision\n[optional, since 2026-10-10]\n",
    missing: "## Open for the owner\n- decision with no tag\n",
    future: "## Open for the owner\n- [blocking, since 2026-10-12] future\n",
    fenced: "## Open for the owner\n```md\n- [blocking, since 2026-10-12] fenced\n```\n",
  };
  for (const [name, text] of Object.entries(inputs)) {
    const file = path.join(dir, `${name}.md`);
    fs.writeFileSync(file, text);
    const actual = spawnSync(process.execPath, [CLI, "--today", "2026-10-11", file], { encoding: "utf8" });
    const stdout = actual.stdout.replaceAll(dir + path.sep, "<fixture>/");
    // golden captured from the unmodified frontier CLI before the shared splitter change
    check(`frontier golden: ${name} output is byte-identical`, actual.status === golden[name].status && stdout === golden[name].stdout && actual.stderr === golden[name].stderr, stdout);
  }
}

// req: R-873
check("seal: HANDOFF word budget is 1,200", HANDOFF_WORD_BUDGET === 1200);
// req: R-2471 R-2472
check("seal: HANDOFF read window is 51,200 bytes", READ_WINDOW_BYTES === 51200);
// req: R-2471 R-2472
check("seal: HANDOFF read window is 2,000 lines", READ_WINDOW_LINES === 2000);

{
	const dir = tmpDir(path.join(os.tmpdir(), "nana-frontier-open-prefix-"));
	const findingKinds = [];
	for (const name of ["Avery", "Rowan"]) {
		const file = path.join(dir, `${name}.md`);
		const lines = [
			"## Landed",
			"- archived",
			`## Open for ${name}\t`,
			"- LANDED; deadline 2026-10-05.",
			...Array(READ_WINDOW_LINES + 1).fill("continuation "),
		];
		fs.writeFileSync(file, lines.join("\r\n"));
		const output = run(file).stdout;
		findingKinds.push([...new Set([...output.matchAll(/: ([a-z-]+):/g)].map((match) => match[1]))].sort());
	}
	const required = ["open-tag", "misplaced-landed", "overdue-date", "section-order", "read-window"];
	// req: R-2515
	check("an Open for heading with any name gets every live-section check", JSON.stringify(findingKinds[0]) === JSON.stringify(findingKinds[1]) && required.every((kind) => findingKinds[0].includes(kind)), JSON.stringify(findingKinds));
	fs.rmSync(dir, { recursive: true, force: true });
}

{
	const rootLayout = fs.readFileSync(path.resolve(HERE, "../../../AGENTS.md"), "utf8");
	const packReadme = fs.readFileSync(path.resolve(HERE, "../README.md"), "utf8");
	check("CLI inventory names nana-frontier without stale ordinals", rootLayout.includes("nana-frontier") && packReadme.includes("nana-frontier") && !packReadme.includes("The ninth CLI"));
}

{
	const r = run(rewritten);
	// req: R-873 R-874 R-875 R-876 R-877 R-878
	check("rewritten HANDOFF passes each structural check", r.status === 0 && !/\b(?:word-budget|landed-entry|misplaced-landed|broken-reference|overdue-date|open-tag):/.test(r.stdout), r.stdout);
}
{
	const r = run(legacy);
	// req: R-874
	check("Landed section reports every multi-line entry", r.stdout.split("landed-entry:").length - 1 === 2, r.stdout);
	// req: R-875
	check("LANDED marker under Next is reported", r.stdout.includes("misplaced-landed:"), r.stdout);
	// req: R-876
	check("unresolvable item-of-Next reference is reported", r.stdout.includes("broken-reference:"), r.stdout);
	// req: R-877
	check("past explicit date is reported against injected clock", r.stdout.includes("overdue-date:"));
	// req: R-878
	check("each bullet or numbered Open for the owner entry without a tag is reported", r.stdout.split("open-tag:").length - 1 === 2, r.stdout);
}
{
	const r = spawnSync(process.execPath, [CLI, "--today", "2026-10-07", frozenRewrite], { encoding: "utf8" });
	// req: R-877
	check("frozen 2026-10-06 rewrite reports only its three section-order findings on 2026-10-07", r.status === 0 && r.stdout.includes("summary words=1038 budget=1200 findings=3") && r.stdout.split("section-order:").length - 1 === 3, r.stdout);
}
{
	const dir = tmpDir(path.join(os.tmpdir(), "nana-frontier-"));
	const file = path.join(dir, "parenthetical-heading.md");
	fs.writeFileSync(file, [
		"## Open for the owner (each ask: blocking, optional or parked, and since when)",
		"- LANDED without a tag; deadline 2026-10-05.",
	].join("\n"));
	const r = run(file);
	// req: R-875
	check("LANDED is detected under the real parenthetical Open for the owner heading", r.stdout.includes("misplaced-landed:"), r.stdout);
	// req: R-877
	check("overdue dates are detected under the real parenthetical Open for the owner heading", r.stdout.includes("overdue-date:") && r.stdout.includes("2026-10-05"), r.stdout);
	// req: R-878
	check("missing tags are detected under the real parenthetical Open for the owner heading", r.stdout.includes("open-tag:"), r.stdout);
	fs.rmSync(dir, { recursive: true, force: true });
}
{
	const r = spawnSync(process.execPath, [CLI, "--today", "2026-10-07", preRewrite], { encoding: "utf8" });
	// req: R-873 R-875 R-878
	check("frozen pre-rewrite HANDOFF reports 15 findings and key drift categories", r.stdout.includes("summary words=3782 budget=1200 findings=15") && r.stdout.includes("word-budget:") && r.stdout.split("misplaced-landed:").length - 1 === 3 && r.stdout.split("open-tag:").length - 1 === 8, r.stdout);
}
{
	const dir = tmpDir(path.join(os.tmpdir(), "nana-frontier-"));
	const file = path.join(dir, "prose.md");
	fs.writeFileSync(file, "## Next\nA status note is due 2026-10-05.\n## Open for the owner\nA decision is due 2026-10-04.\n");
	const r = run(file);
	// req: R-877
	check("due cues in non-list Next and Open for the owner prose are scanned", r.stdout.split("overdue-date:").length - 1 === 2, r.stdout);
	fs.rmSync(dir, { recursive: true, force: true });
}
{
	const dir = tmpDir(path.join(os.tmpdir(), "nana-frontier-"));
	const file = path.join(dir, "fence.md");
	fs.writeFileSync(file, "## Where things stand\nExample:\n```md\n## Next\n- LANDED due 2026-10-05\n```\n## Open for the owner\n- Real choice [blocking, since 2026-10-06]\n");
	const r = run(file);
	// req: R-874 R-875 R-877
	check("fenced examples do not create headings or findings", !/(landed-entry|misplaced-landed|overdue-date):/.test(r.stdout), r.stdout);
	fs.rmSync(dir, { recursive: true, force: true });
}
{
	const dir = tmpDir(path.join(os.tmpdir(), "nana-frontier-"));
	const file = path.join(dir, "nested-number.md");
	fs.writeFileSync(file, "## Next\n1. First\n2. Second\n   3. Nested only\n## Where things stand\nSee item 3 of Next.\n");
	const r = run(file);
	// req: R-876
	check("nested numbered sub-items cannot resolve item-of-Next references", r.stdout.includes("broken-reference:") && r.stdout.includes("item 3 of Next"), r.stdout);
	fs.rmSync(dir, { recursive: true, force: true });
}
{
	const dir = tmpDir(path.join(os.tmpdir(), "nana-frontier-"));
	const file = path.join(dir, "nested.md");
	fs.writeFileSync(file, [
		"## Next", "### Phase", "- LANDED by 2026-10-06", "- Follow-up due 2026-10-05.", "",
		"## Open for the owner", "### Decision", "- Choose an option without a tag.", "",
	].join("\n"));
	const r = run(file);
	// req: R-875
	check("nested Next heading remains in the enclosing section", r.stdout.includes("misplaced-landed:"), r.stdout);
	// req: R-877
	check("nested Next heading retains overdue due-date detection", r.stdout.includes("overdue-date:"), r.stdout);
	// req: R-878
	check("nested Open heading retains the untagged entry check", r.stdout.includes("open-tag:"), r.stdout);
	fs.rmSync(dir, { recursive: true, force: true });
}
{
	const dir = tmpDir(path.join(os.tmpdir(), "nana-frontier-"));
	const file = path.join(dir, "dates.md");
	fs.writeFileSync(file, [
		"## Next", "- Ruling recorded 2026-10-01.", "- Adopted since 2026-10-02.",
		"- Migration due 2026-10-06 through 2026-10-09.", "- Review due 2026-10-04 through 2026-10-05.", "",
	].join("\n"));
	const r = run(file);
	// req: R-877
	check("due dates use range ends and ignore ruling, since, and range-start dates", r.stdout.split("overdue-date:").length - 1 === 1 && r.stdout.includes("2026-10-05"), r.stdout);
	const mixed = path.join(dir, "mixed-history-future.md");
	fs.writeFileSync(mixed, "## Next\n- Written by the owner (adopted 2026-10-06); review on 2026-10-20.\n");
	const mixedResult = spawnSync(process.execPath, [CLI, "--today", "2026-10-07", mixed], { encoding: "utf8" });
	// req: R-877
	check("historical parenthetical date before a future due cue is not overdue", !mixedResult.stdout.includes("overdue-date:"), mixedResult.stdout);
	const cues = ["due", "deadline", "by", "until", "verdict on", "review on"];
	for (const cue of cues) {
		const cueFile = path.join(dir, `${cue.replaceAll(" ", "-")}.md`);
		fs.writeFileSync(cueFile, `## Next\n- Review ${cue} 2026-10-05.\n`);
		const cueResult = run(cueFile);
		// req: R-877
		check(`overdue date cue is recognized: ${cue}`, cueResult.stdout.includes("overdue-date:") && cueResult.stdout.includes("2026-10-05"), cueResult.stdout);
	}
	const lazy = path.join(dir, "lazy.md");
	fs.writeFileSync(lazy, "## Landed\n- first line\nlazy continuation\n");
	const lazyResult = run(lazy);
	// req: R-874
	check("Landed entries include lazy continuation lines", lazyResult.stdout.includes("landed-entry:"), lazyResult.stdout);
	const multilineTag = path.join(dir, "tag.md");
	fs.writeFileSync(multilineTag, "## Open for the owner\n- decision\n[optional, since 2026-10-06]\n");
	const tagResult = run(multilineTag);
	// req: R-878
	check("Open tags on continuation lines count", !tagResult.stdout.includes("open-tag:"), tagResult.stdout);
	for (const badSince of ["2026-99-99", "2026-10-07"]) {
		fs.writeFileSync(multilineTag, `## Open for the owner\n- decision\n[optional, since ${badSince}]\n`);
		const badTagResult = run(multilineTag);
		// req: R-878
		check(`Open tag rejects invalid or future since date ${badSince}`, badTagResult.stdout.includes("open-tag:"), badTagResult.stdout);
	}
	fs.rmSync(dir, { recursive: true, force: true });
}
{
	const dir = tmpDir(path.join(os.tmpdir(), "nana-frontier-"));
	const file = path.join(dir, "large.md");
	fs.writeFileSync(file, `${"frontier ".repeat(1201)}\n`);
	const r = run(file);
	// req: R-873
	check("word budget reports a document over 1,200 words", r.stdout.includes("word-budget:") && r.stdout.includes("words=1201"), r.stdout);
	fs.rmSync(dir, { recursive: true, force: true });
}
{
	const r = run(legacy);
	// req: R-879
	check("findings are report-only by default", r.status === 0 && r.stdout.includes("summary"), `${r.status}: ${r.stdout}`);
}
{
	const r = run(legacy, ["--strict"]);
	// req: R-879
	check("strict mode exits nonzero when findings exist", r.status !== 0, `${r.status}: ${r.stdout}`);
	const reportOnlyError = spawnSync(process.execPath, [CLI, legacy, legacy], { encoding: "utf8" });
	const strictError = spawnSync(process.execPath, [CLI, "--strict", legacy, legacy], { encoding: "utf8" });
	// req: R-879
	check("extra operands follow the strict-aware error policy", reportOnlyError.status === 0 && strictError.status !== 0, `${reportOnlyError.status} / ${strictError.status}`);
	const missingFile = path.join(os.tmpdir(), `frontier-missing-${process.pid}.md`);
	const defaultBadDate = spawnSync(process.execPath, [CLI, "--today", "2026-02-30", legacy], { encoding: "utf8" });
	const strictBadDate = spawnSync(process.execPath, [CLI, "--strict", "--today", "2026-02-30", legacy], { encoding: "utf8" });
	const defaultUnreadable = spawnSync(process.execPath, [CLI, "--today", "2026-10-06", missingFile], { encoding: "utf8" });
	const strictUnreadable = spawnSync(process.execPath, [CLI, "--strict", "--today", "2026-10-06", missingFile], { encoding: "utf8" });
	// req: R-879
	check("malformed date follows default error policy", defaultBadDate.status === 0 && defaultBadDate.stderr.includes("invalid --today date"), `${defaultBadDate.status}: ${defaultBadDate.stderr}`);
	// req: R-879
	check("malformed date follows strict error policy", strictBadDate.status === 1 && strictBadDate.stderr.includes("invalid --today date"), `${strictBadDate.status}: ${strictBadDate.stderr}`);
	// req: R-879
	check("unreadable input follows default error policy", defaultUnreadable.status === 0 && defaultUnreadable.stdout.includes(":0: error:"), `${defaultUnreadable.status}: ${defaultUnreadable.stdout}`);
	// req: R-879
	check("unreadable input follows strict error policy", strictUnreadable.status === 1 && strictUnreadable.stdout.includes(":0: error:"), `${strictUnreadable.status}: ${strictUnreadable.stdout}`);
}
{
	const dir = tmpDir(path.join(os.tmpdir(), "nana-frontier-window-"));
	const runText = (name, text) => {
		const file = path.join(dir, name);
		fs.writeFileSync(file, text);
		return run(file).stdout;
	};
	const n = Math.ceil(READ_WINDOW_BYTES / 1203) + 1;
	const bytesText = ["## Where things stand", "- state", "## Next", "### Detail", ...Array(n).fill(`- ${"é".repeat(600)}`), "## Open for the owner", "- **[optional, since 2026-10-01] Ask.** body"].join("\n");
	const bytesOutput = runText("bytes.md", bytesText);
	const m = READ_WINDOW_LINES + 100;
	const linesOutput = runText("lines.md", ["## Where things stand", ...Array(m).fill("- s"), "## Next", "1. step"].join("\n"));
	const smallOutput = runText("small.md", "## Where things stand\n- s\n## Next\n1. n\n");
	const readLines = (output) => output.split("\n").filter((line) => line.includes(": read-window:")).map((line) => Number(/:(\d+):/.exec(line)?.[1]));
	// req: R-2471
	check("R-2471: a live section that ends past the read window in bytes or in lines is reported as read-window", JSON.stringify(readLines(bytesOutput)) === JSON.stringify([3, 5 + n]) && JSON.stringify(readLines(linesOutput)) === JSON.stringify([1, m + 2]) && readLines(smallOutput).length === 0, `${bytesOutput}\n${linesOutput}`);
	const k = Math.ceil(READ_WINDOW_BYTES / 1003) + 1;
	const bigText = `## Next\n${Array(k).fill(`- ${"é".repeat(500)}\n`).join("")}`;
	const bigOutput = runText("big-bytes.md", bigText);
	const manyOutput = runText("many-lines.md", Array(READ_WINDOW_LINES + 1).fill("- s\n").join(""));
	const atLimitOutput = runText("at-limit.md", Array(READ_WINDOW_LINES).fill("- s\n").join(""));
	const sizes = (output) => output.split("\n").filter((line) => line.includes(": file-size:"));
	// req: R-2472
	check("R-2472: a document over the read window in bytes or in lines gets one file-size finding with its byte and line counts", sizes(bigOutput).length === 1 && sizes(bigOutput)[0].includes(`bytes=${Buffer.byteLength(bigText)}`) && sizes(bigOutput)[0].includes(`lines=${k + 1}`) && sizes(manyOutput).length === 1 && sizes(manyOutput)[0].includes(`lines=${READ_WINDOW_LINES + 1}`) && sizes(atLimitOutput).length === 0, `${bigOutput}\n${manyOutput}`);
	fs.rmSync(dir, { recursive: true, force: true });
}
{
	const dir = tmpDir(path.join(os.tmpdir(), "nana-frontier-order-"));
	const cases = {
		"after-landed.md": ["# HANDOFF", "## Landed", "- 2026-10-21: one line.", "## Where things stand", "- state", "## Next", "1. step", "## Open for the owner", "- **[optional, since 2026-10-01] Ask.** body"],
		"after-residuals.md": ["## Where things stand", "- state", "## Carried residuals (live; one line each)", "- residual", "## Next", "1. step"],
		"between.md": ["## Landed", "## Where things stand", "## Carried residuals", "## Next"],
		"frontier-first.md": ["## Where things stand", "## Next", "## Open for the owner", "## Landed (one line each)", "## Carried residuals"],
	};
	const outputs = {};
	for (const [name, lines] of Object.entries(cases)) {
		const file = path.join(dir, name);
		fs.writeFileSync(file, lines.join("\n"));
		outputs[name] = run(file).stdout;
	}
	const sectionFindings = (output) => output.split("\n").filter((line) => line.includes(": section-order:"));
	const lineNumbers = (output) => sectionFindings(output).map((line) => Number(/:(\d+):/.exec(line)?.[1]));
	// req: R-2470
	check("R-2470: a Where things stand, Next or Open for the owner heading after a Landed or Carried residuals heading is reported as section-order", JSON.stringify(lineNumbers(outputs["after-landed.md"])) === JSON.stringify([4, 6, 8]) && sectionFindings(outputs["after-landed.md"]).every((line) => line.includes("comes after Landed at line 2")) && JSON.stringify(lineNumbers(outputs["after-residuals.md"])) === JSON.stringify([5]) && sectionFindings(outputs["after-residuals.md"])[0].includes("comes after Carried residuals at line 3") && JSON.stringify(lineNumbers(outputs["between.md"])) === JSON.stringify([2, 4]) && sectionFindings(outputs["between.md"]).every((line) => line.includes("comes after Landed at line 1")) && sectionFindings(outputs["frontier-first.md"]).length === 0, Object.values(outputs).join("\n"));
	fs.rmSync(dir, { recursive: true, force: true });
}
{
	const dir = tmpDir(path.join(os.tmpdir(), "nana-frontier-control-"));
	const file = path.join(dir, "control.md");
	const k = Math.ceil(READ_WINDOW_BYTES / 1003) + 1;
	fs.writeFileSync(file, ["## Landed", ...Array(k).fill(`- ${"x".repeat(1000)}`), "## Next", "1. step"].join("\n"));
	const control = run(file).stdout;
	const repository = run(path.resolve(HERE, "../../../HANDOFF.md")).stdout;
	// req: R-2473
	check("R-2473: this repository's HANDOFF.md gets no section-order or read-window finding", control.includes("section-order:") && control.includes("read-window:") && !repository.includes("section-order:") && !repository.includes("read-window:"), `${control}\n${repository}`);
	// req: R-2504
	check("R-2504: this repository's HANDOFF.md gets no file-size finding", control.includes("file-size:") && !repository.includes("file-size:"), `${control}\n${repository}`);
	fs.rmSync(dir, { recursive: true, force: true });
}
if (fails) process.exitCode = 1;
