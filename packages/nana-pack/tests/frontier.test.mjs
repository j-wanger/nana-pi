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
let fails = 0;
const check = (name, ok, detail = "") => {
	console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail);
	if (!ok) fails++;
};
const run = (file, extra = []) => spawnSync(process.execPath, [CLI, "--today", "2026-10-06", file, ...extra], { encoding: "utf8" });

// req: R-873
check("seal: HANDOFF word budget is 1,200", HANDOFF_WORD_BUDGET === 1200);

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
	const liveHandoff = path.resolve(HERE, "../../../HANDOFF.md");
	const r = spawnSync(process.execPath, [CLI, "--today", "2026-10-07", liveHandoff], { encoding: "utf8" });
	// req: R-877
	check("live rewritten HANDOFF passes on 2026-10-07", r.status === 0 && !r.stdout.includes("overdue-date:"), r.stdout);
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
}
if (fails) process.exitCode = 1;
