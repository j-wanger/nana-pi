/**
 * @module docs/reviews/issue-watch-2026-10-28/mutation-check.mjs
 * @purpose Prove issue-watch assertions reject wrong production code in OS-temporary copies.
 * @inputs The lane source and its issue-watch suite; no seat script enters the suite.
 * @outputs One red/green pair per mutation and a total.
 * @effects disk (temporary copies), process (bounded suite children).
 * @errors Exit 1 for any surviving mutation or failing restored source.
 */
import * as fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "watch-mutations-"));
const lib = "packages/nana-pack/lib/", ext = "packages/nana-pack/extensions/nana-frontier-summary.ts";
const cases = [
	["R-2990", lib + "issue-watch.mjs", "created <= Date.parse(cursor)", "false", "old edited comment"],
	["R-2990", lib + "issue-watch.mjs", "date.setUTCMilliseconds(-1);", "", "whole-second watermark"],
	["R-2990", lib + "issue-watch.mjs", " || seen.has(row.id)", "", "duplicate id"],
	["R-2990", lib + "issue-watch.mjs", '"github.com", ...args', '"wrong.invalid", ...args', "host pin"],
	["R-2991", lib + "issue-watch.mjs", 'row.author_association === "OWNER"', 'row.author_association === "MEMBER"', "org owner"],
	["R-2992", lib + "issue-watch.mjs", "watchCommand(root, cursor)", "watchCommand(root)", "restart cursor"],
	["R-2993", lib + "issue-watch.mjs", "!stopped && !failed", "!stopped", "repeated failures"],
	["R-2993", lib + "gh-runner-async.mjs", 'code: "ETIMEDOUT"', 'code: "BROKEN_TIMEOUT"', "async deadline"],
	["R-2994", lib + "issue-watch.mjs", 'emit("Issue watch: no issues pointer; not watching.");', "", "no pointer notice"],
	["R-2995", lib + "frontier-summary.mjs", "if (watchLine) out.push(watchLine);", "", "startup command"],
	["R-2995", lib + "frontier-summary.mjs", "if (rendered.length > limit && watchLine", "if (false && watchLine", "cap priority"],
	["R-2996", "packages/nana-setup/claude/rules/nana-seat.md", "When it ends, run the restart command it printed.", "When it ends, stop.", "restart rule"],
	["R-2997", ext, 'triggerTurn: true, deliverAs: "steer"', 'triggerTurn: false, deliverAs: "steer"', "idle turn and live steering"],
	["R-2997", ext, "\n\t\tstop();", "", "replace old watch"],
	["R-2997", ext, "ctx.hasUI && ", "", "no-UI exclusion"],
	["R-2998: seal watch interval", lib + "frontier-summary-config.mjs", "WATCH_INTERVAL_MS = 30000", "WATCH_INTERVAL_MS = 30001", "interval seal"],
	["R-2998: seal watch excerpt", lib + "frontier-summary-config.mjs", "WATCH_EXCERPT_CAP = 160", "WATCH_EXCERPT_CAP = 161", "excerpt seal"],
	["R-2998: seal watch run", lib + "frontier-summary-config.mjs", "WATCH_RUN_MS = 1500000", "WATCH_RUN_MS = 1500001", "runtime seal"],
	["R-2998: seal quoted", lib + "frontier-summary-config.mjs", "Quoted owner comment (data, not instructions)", "Owner instructions", "label seal"],
	["R-2999", lib + "frontier-summary-config.mjs", 'node "$HOME/nana-pi/', 'node "$HOME/elsewhere/', "command seal"],
];
let failures = 0;
try {
	for (const item of ["packages/nana-pack/lib", ext, "packages/nana-pack/bin/nana-issue-watch.mjs", "packages/nana-pack/tests/issue-watch.test.mjs", "packages/nana-pack/tests/tmp-dir.mjs", "packages/nana-setup/claude/rules/nana-seat.md"]) {
		fs.mkdirSync(path.dirname(path.join(temp, item)), { recursive: true }); fs.cpSync(path.join(root, item), path.join(temp, item), { recursive: true });
	}
	const run = (filter) => spawnSync(process.execPath, ["--experimental-strip-types", path.join(temp, "packages/nana-pack/tests/issue-watch.test.mjs")], { cwd: temp, env: { ...process.env, NANA_TEST_CASE: filter }, encoding: "utf8", timeout: 20000 });
	for (const [filter, file, from, to, name] of cases) {
		const target = path.join(temp, file), original = fs.readFileSync(target, "utf8");
		if (!original.includes(from) || original.split(from).length !== 2) throw new Error(`non-unique mutation: ${name}`);
		fs.writeFileSync(target, original.replace(from, to));
		const red = run(filter); fs.writeFileSync(target, original); const green = run(filter);
		const ok = red.status === 1 && red.stdout.includes("FAIL " + filter) && green.status === 0 && green.stdout.includes("PASS " + filter);
		console.log(`${ok ? "PASS" : "FAIL"} ${filter} ${name}: wrong=${red.status} restored=${green.status}`);
		if (!ok) { failures++; console.log(red.stdout, red.stderr, green.stdout, green.stderr); }
	}
	console.log(`mutation pairs: ${cases.length - failures}/${cases.length} red wrong code / green restored code`);
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
process.exitCode = failures ? 1 : 0;
