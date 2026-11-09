/**
 * @module packages/nana-setup/tests/seat-rule.test.mjs
 * @purpose Check that the shipped seat guide fits its loader and retains the brief checklist.
 * @inputs packages/nana-setup/claude/rules/nana-seat.md and builder-preamble.md
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (reads the guide and preamble)
 * @errors Missing inputs throw; failed checks exit 1.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { SEAT_GUIDE_READ_CAP } from "../../nana-pack/lib/rulings-config.mjs";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const raw = fs.readFileSync(path.join(ROOT, "packages/nana-setup/claude/rules/nana-seat.md"));
const text = new TextDecoder("utf-8", { fatal: true }).decode(raw).replace(/\r/g, "");
let fails = 0;
const check = (name, ok) => {
	console.log(ok ? "PASS" : "FAIL", name);
	if (!ok) fails++;
};

// The loader's injection and refusal paths are exercised in rulings.test.mjs.
// req: R-3021 R-3023
check("shipped seat guide is nonempty valid UTF-8 within the loader cap",
	text.trim().length > 0 && raw.length <= SEAT_GUIDE_READ_CAP);

const BRIEF_RULE = "- A brief names the following checks.";
const BRIEF_CHECKS = [
	"  Name the new requirement ID range.",
	"  Name only Precedent files tracked at the lane's current tip.",
	"  Name the tests and known-bug lines a removal lane may delete.",
	"  Require whole-part commits for large lanes.",
	"  Export CI logs when the builder must read a failure.",
	"  Commit the review brief before the first push.",
	"  Serialize lanes sharing `templates/_shared/working-under-nana-pi.md`, `AGENTS.md`, `packages/nana-setup/claude/rules/nana-seat.md`, `code-map.config.json`, `packages/nana-pack/tests/code-map-launch.test.mjs` or `REQUIREMENTS.md`.",
];
const TRACE_CHECK = "  Name `node scripts/requirements-trace.mjs` among every brief's seat checks, including small fix briefs.";

// req: R-3898
check("M5: one brief checklist names the seven build lessons", text.split(BRIEF_RULE).length === 2 &&
	text.includes([BRIEF_RULE, ...BRIEF_CHECKS].join("\n")));
// req: R-3901
check("M8: brief authority and builder scope agree on named known-bug removals", (() => {
	const preamble = fs.readFileSync(path.join(ROOT, "packages/nana-pack/prompts/builder-preamble.md"), "utf8");
	return text.includes(BRIEF_CHECKS[2]) &&
		preamble.includes("- Remove only the known-bug lines your brief names; never make any other edit under `docs/known-bugs/`.") &&
		!preamble.includes("Never edit `HANDOFF.md` or `docs/known-bugs/`");
})());
// req: R-3904
check("M11: every brief including small fixes names the requirements trace seat check",
	text.includes([BRIEF_RULE, ...BRIEF_CHECKS, TRACE_CHECK].join("\n")));
process.exit(fails ? 1 : 0);
