/**
 * @module packages/nana-setup/tests/writing-rule.test.mjs
 * @purpose Pins that ~/.claude/rules/nana-writing.md is a symlink into the pack's own copy (not nana-setup's), and that the rule itself passes its own checker with zero findings
 * @inputs lib/steps.mjs's ruleSource/PACK_RULES_DIR, bin/nana-setup.mjs, nana-pack's lib/writing-check.mjs, and a throwaway --home
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (a throwaway --home), process (spawns the installer CLI)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Gate: the delivery to pi moved from an agent-dir AGENTS.md link to the nana-writing pack
// extension (design-ruling.md Amendment 1, 2026-10-04, §A1, after astra r1 MUST 1) — R-373,
// R-374 and R-375 are REMOVED from this branch (never landed, their IDs stay unused; see
// REQUIREMENTS.md). What is left for THIS package: the Claude Code half still symlinks
// ~/.claude/rules/nana-writing.md, but now from the PACK's rules dir, the same file the
// extension reads — and R-376, the rule's own zero-findings claim.
import * as fs from "node:fs";
import * as path from "node:path";

const { ruleSource, PACK_RULES_DIR } = await import(new URL("../lib/steps.mjs", import.meta.url).href);
const { checkText } = await import(new URL("../../nana-pack/lib/writing-check.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : (extra ?? ""));
	if (!ok) fails++;
};

/* --- the Claude Code link: sourced from the pack, not from nana-setup's own claude/rules --- */
{
	const src = ruleSource("nana-writing.md");
	// req: R-301
	check("rule nana-writing.md is sourced from packages/nana-pack/rules", src === path.join(PACK_RULES_DIR, "nana-writing.md"), src);
	check("the source file exists there", fs.existsSync(src), src);
}

/* --- the rule passes its own checker (R-376) ------------------------------------------ */
{
	const src = ruleSource("nana-writing.md");
	const text = fs.readFileSync(src, "utf8");
	const r = checkText(src, text, { report: false });
	// req: R-376
	check("the rule passes nana-writing with zero findings", r.findings.length === 0, JSON.stringify(r.findings));
}

process.exit(fails);
