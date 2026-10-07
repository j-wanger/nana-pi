/**
 * @module packages/nana-pack/tests/frontier.test.mjs
 * @purpose Pins the report-only HANDOFF frontier checker against rewritten and legacy fixtures, structural findings, an injected date, and strict-mode exits.
 * @inputs the frontier CLI, fixture HANDOFF files, and temporary oversized input
 * @outputs named PASS/FAIL checks and a nonzero test exit when an assertion fails
 * @effects disk (temporary input); process (spawns the CLI)
 * @errors failed assertions are reported and cause exit 1
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { HANDOFF_WORD_BUDGET } from "../lib/frontier-config.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = fileURLToPath(new URL("../bin/nana-frontier.mjs", import.meta.url));
const rewritten = path.join(HERE, "fixtures/frontier/rewritten.md");
const legacy = path.join(HERE, "fixtures/frontier/legacy.md");
const frozenRewrite = path.join(HERE, "fixtures/frontier/handoff-2026-10-06.md");
let fails = 0;
const check = (name, ok, detail = "") => {
	console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail);
	if (!ok) fails++;
};
const run = (file, extra = []) => spawnSync(process.execPath, [CLI, "--today", "2026-10-06", file, ...extra], { encoding: "utf8" });

// req: R-873
check("seal: HANDOFF word budget is 1,200", HANDOFF_WORD_BUDGET === 1200);

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
	check("each bullet or numbered Open for Jake entry without a tag is reported", r.stdout.split("open-tag:").length - 1 === 2, r.stdout);
}
{
	const r = spawnSync(process.execPath, [CLI, "--today", "2026-10-07", frozenRewrite], { encoding: "utf8" });
	// req: R-877
	check("frozen 2026-10-06 rewrite passes on 2026-10-07", r.status === 0 && !r.stdout.includes("overdue-date:"), r.stdout);
}
{
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nana-frontier-"));
	const file = path.join(dir, "nested.md");
	fs.writeFileSync(file, [
		"## Next", "### Phase", "- LANDED by 2026-10-06", "- Follow-up due 2026-10-05.", "",
		"## Open for Jake", "### Decision", "- Choose an option without a tag.", "",
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
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nana-frontier-"));
	const file = path.join(dir, "dates.md");
	fs.writeFileSync(file, [
		"## Next", "- Ruling recorded 2026-10-01.", "- Adopted since 2026-10-02.",
		"- Migration due 2026-10-06 through 2026-10-09.", "- Review due 2026-10-04 through 2026-10-05.", "",
	].join("\n"));
	const r = run(file);
	// req: R-877
	check("due dates use range ends and ignore ruling, since, and range-start dates", r.stdout.split("overdue-date:").length - 1 === 1 && r.stdout.includes("2026-10-05"), r.stdout);
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
	fs.writeFileSync(multilineTag, "## Open for Jake\n- decision\n[optional, since 2026-10-06]\n");
	const tagResult = run(multilineTag);
	// req: R-878
	check("Open tags on continuation lines count", !tagResult.stdout.includes("open-tag:"), tagResult.stdout);
	for (const badSince of ["2026-99-99", "2026-10-07"]) {
		fs.writeFileSync(multilineTag, `## Open for Jake\n- decision\n[optional, since ${badSince}]\n`);
		const badTagResult = run(multilineTag);
		// req: R-878
		check(`Open tag rejects invalid or future since date ${badSince}`, badTagResult.stdout.includes("open-tag:"), badTagResult.stdout);
	}
	fs.rmSync(dir, { recursive: true, force: true });
}
{
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nana-frontier-"));
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
	for (const mode of [[], ["--strict"]]) {
		const badDate = spawnSync(process.execPath, [CLI, ...mode, "--today", "2026-02-30", legacy], { encoding: "utf8" });
		const missingFile = path.join(os.tmpdir(), `frontier-missing-${process.pid}.md`);
		const unreadable = spawnSync(process.execPath, [CLI, ...mode, "--today", "2026-10-06", missingFile], { encoding: "utf8" });
		// req: R-879
		check(`malformed date follows ${mode.length ? "strict" : "default"} error policy`, badDate.status === (mode.length ? 1 : 0) && badDate.stderr.includes("invalid --today date"), `${badDate.status}: ${badDate.stderr}`);
		// req: R-879
		check(`unreadable input follows ${mode.length ? "strict" : "default"} error policy`, unreadable.status === (mode.length ? 1 : 0) && unreadable.stdout.includes(":0: error:"), `${unreadable.status}: ${unreadable.stdout}`);
	}
}
if (fails) process.exitCode = 1;
