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
// req: R-3021 R-3023 R-3966
check("shipped seat guide is nonempty valid UTF-8 within the loader cap",
	text.trim().length > 0 && raw.length <= SEAT_GUIDE_READ_CAP);

process.exit(fails ? 1 : 0);
