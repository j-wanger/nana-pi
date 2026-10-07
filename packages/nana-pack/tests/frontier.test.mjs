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
	const reportOnlyError = spawnSync(process.execPath, [CLI, "--today", "invalid"], { encoding: "utf8" });
	const strictError = spawnSync(process.execPath, [CLI, "--today", "invalid", "--strict"], { encoding: "utf8" });
	// req: R-879
	check("CLI errors also exit 0 by default and nonzero in strict mode", reportOnlyError.status === 0 && strictError.status !== 0, `${reportOnlyError.status} / ${strictError.status}`);
}
if (fails) process.exitCode = 1;
