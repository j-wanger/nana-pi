/**
 * @module packages/nana-setup/tests/writing-rule.test.mjs
 * @purpose Pins the shared writing rule's source, sealed Check section, command spelling, and zero-finding result
 * @inputs lib/steps.mjs's ruleSource/PACK_RULES_DIR, nana-pack's writing checker and title prefix, the shipped rule file, and the sealed Check text
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects none (reads the rule file)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Gate: the delivery to pi moved from an agent-dir AGENTS.md link to the nana-writing pack
// extension (design-ruling.md Amendment 1, 2026-10-04, §A1, after astra r1 MUST 1) — R-373,
// R-374 and R-375 are REMOVED from this branch (never landed, their IDs stay unused; see
// REQUIREMENTS.md). What is left for THIS package: the Claude Code half still symlinks
// ~/.claude/rules/nana-writing.md, but now from the PACK's rules dir, the same file the
// extension reads — plus R-2502's sealed Check section and R-376's zero-findings claim.
import * as fs from "node:fs";

const { ruleSource } = await import(new URL("../lib/steps.mjs", import.meta.url).href);
const { checkText } = await import(new URL("../../nana-pack/lib/writing-check.mjs", import.meta.url).href);
/** Preserved role-neutral title contract; this is its only surviving reader. */
const RULE_TITLE = "# Nana — Writing for";

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : (extra ?? ""));
	if (!ok) fails++;
};

/* --- the rule's sealed check and its own checker result ------------------------------- */
{
	const src = ruleSource("nana-writing.md");
	const text = fs.readFileSync(src, "utf8");
	const r = checkText(src, text, { report: false });
	// req: R-376
	check("the rule passes nana-writing with zero findings", text.startsWith(`${RULE_TITLE} the owner\n`) && r.findings.length === 0 && !text.includes("~/") && !text.includes("node "), JSON.stringify(r.findings));
}

process.exit(fails);
