/**
 * @module packages/nana-setup/tests/writing-rule.test.mjs
 * @purpose Pins that pi's agent-dir AGENTS.md is linked to the writing rule when absent, left untouched (install exit 1) when it is a foreign file, and that doctor reads the same state
 * @inputs lib/steps.mjs's stepWritingRule and WRITING_RULE_SRC, bin/nana-setup.mjs, and a throwaway temp dir / --home
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (throwaway temp dirs and homes, symlinks), process (spawns the installer CLI for the exit-code case)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Gate: pi's agent-dir AGENTS.md is NOT nana-owned (unlike CLAUDE_RULES) — a user's own file
// there must survive install untouched, reported ✗, with install exiting 1 (R-373, R-374). Every
// run goes into a throwaway temp dir or --home; nothing touches the real machine.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const pkg = path.resolve(new URL("..", import.meta.url).pathname);
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const { stepWritingRule, WRITING_RULE_SRC } = await import(new URL("../lib/steps.mjs", import.meta.url).href);
const { diagnose } = await import(new URL("../lib/doctor.mjs", import.meta.url).href);
const { resolveLayout } = await import(new URL("../lib/paths.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : (extra ?? ""));
	if (!ok) fails++;
};

const tmps = [];
function tempDir() {
	const td = fs.mkdtempSync(path.join(os.tmpdir(), "nana-writing-rule-"));
	tmps.push(td);
	return td;
}

/* --- unit: stepWritingRule directly over a bare piHome -------------------------------- */
{
	const piHome = tempDir();
	const target = path.join(piHome, "AGENTS.md");
	const [r] = stepWritingRule({ piHome }, {});
	const st = fs.lstatSync(target);
	const linked = r.status === "created" && st.isSymbolicLink() && path.resolve(path.dirname(target), fs.readlinkSync(target)) === WRITING_RULE_SRC;
	// req: R-373
	check("pi AGENTS.md is a symlink to the writing rule", linked, JSON.stringify(r));

	// second run: idempotent, unchanged
	const [r2] = stepWritingRule({ piHome }, {});
	check("a second run is unchanged", r2.status === "unchanged");
}

{
	const piHome = tempDir();
	const target = path.join(piHome, "AGENTS.md");
	fs.mkdirSync(piHome, { recursive: true });
	fs.writeFileSync(target, "# My own instructions\nNothing to do with nana.\n");
	const before = fs.readFileSync(target, "utf8");
	const [r] = stepWritingRule({ piHome }, {});
	// req: R-374
	check("a foreign AGENTS.md is untouched and install exits 1", r.status === "problem" && fs.readFileSync(target, "utf8") === before, JSON.stringify(r));
	check("no backup was written beside it", !fs.readdirSync(piHome).some((f) => f.includes(".bak-")));
}

/* --- CLI: the foreign-file case flips install's own exit code to 1 -------------------- */
{
	const home = tempDir();
	fs.mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	fs.writeFileSync(path.join(home, ".pi", "agent", "AGENTS.md"), "# Not nana's\n");
	const r = spawnSync(process.execPath, [cli, "install", "--home", home], { encoding: "utf8" });
	// req: R-374
	check("install reports ✗ on the foreign AGENTS.md and exits 1", r.status === 1 && /✗ pi AGENTS\.md \(writing rule\)/.test(r.stdout), r.stdout);
}

/* --- doctor ------------------------------------------------------------------------- */
{
	const home = tempDir();
	const layout = resolveLayout({ home });
	const before = diagnose(layout).find((c) => c.label === "pi AGENTS.md (writing rule)");
	// req: R-375
	check("doctor ✓ linked, ✗ missing", before.status === "fail", JSON.stringify(before));

	stepWritingRule(layout, {});
	const after = diagnose(layout).find((c) => c.label === "pi AGENTS.md (writing rule)");
	// req: R-375
	check("doctor ✓ linked, ✗ missing (after creating)", after.status === "ok", JSON.stringify(after));
}

for (const td of tmps) fs.rmSync(td, { recursive: true, force: true });
process.exit(fails);
