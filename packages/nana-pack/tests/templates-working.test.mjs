/**
 * @module packages/nana-pack/tests/templates-working.test.mjs
 * @purpose Run extracted core contract guards on every land.
 * @inputs Real modules and isolated fixtures.
 * @outputs Original requirement-tagged PASS/FAIL checks.
 * @effects disk (temporary fixtures), process (bounded fixture children).
 * @errors Failed checks exit nonzero.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { WORKING_SECTION_CHAR_CAP } from "../../nana-setup/lib/working-config.mjs";
import { tmpDir } from "./tmp-dir.mjs";
import { buildSeatGuideBlock } from "../extensions/nana-rulings.ts";
import { SEAT_GUIDE_FILE, SEAT_GUIDE_HEADING } from "../lib/rulings-config.mjs";
const REPO = fileURLToPath(new URL("../../../", import.meta.url));
let fails = 0;
const check = (name, ok) => { console.log(ok ? "PASS" : "FAIL", name); if (!ok) fails++; };
/** Extracts the exact bytes owned by the shared-section markers. */
export function markerBlock(text) {
	const begin = "<!-- nana:working-under-nana-pi begin -->\n";
	const end = "\n<!-- nana:working-under-nana-pi end -->";
	const start = text.indexOf(begin);
	const stop = text.indexOf(end, start + begin.length);
	return start < 0 || stop < 0 ? null : text.slice(start + begin.length, stop + 1);
}


if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
{
	const agents = fs.readFileSync(path.join(REPO, "AGENTS.md"), "utf8");
	const shared = fs.readFileSync(path.join(REPO, "templates/_shared/working-under-nana-pi.md"), "utf8");
	const block = markerBlock(agents);
	// req: R-3965
	check("M1: shared working section fits its character cap", shared.length <= WORKING_SECTION_CHAR_CAP);
	const agentDir = tmpDir(path.join(os.tmpdir(), "agents-trim-guide-"));
	try {
		const source = path.join(REPO, "packages/nana-setup/claude/rules/nana-seat.md");
		fs.copyFileSync(source, path.join(agentDir, SEAT_GUIDE_FILE));
		const guide = fs.readFileSync(source, "utf8");
		// req: R-3966
		check("M2: shipped seat guide loads in full for a pi seat", buildSeatGuideBlock(agentDir) === `${SEAT_GUIDE_HEADING}\n\n${guide}`);
	} finally {
		fs.rmSync(agentDir, { recursive: true, force: true });
	}
	// req: R-3896
	check("M3: narrative and session-archive references are removed", (() => {
		const handoff = fs.readFileSync(path.join(REPO, "HANDOFF.md"), "utf8");
		const seed = fs.readFileSync(path.join(REPO, "templates/_shared/HANDOFF.md"), "utf8");
		const scope = fs.readFileSync(path.join(REPO, "packages/nana-pack/prompts/builder-preamble.md"), "utf8").split(/\r?\nTests[ \t]*\r?\n/)[0];
		return [handoff, seed, agents].every((text) =>
			!/narrative lives in `docs\/sessions\/`/i.test(text) &&
			!text.includes("(this repo's narrative, newest first)")) && !scope.includes("session archives");
	})());
}
function checkAgentsMdMirrorsWorkingUnderNanaPi() {
	const agents = fs.readFileSync(path.join(REPO, "AGENTS.md"), "utf-8");
	const shared = fs.readFileSync(path.join(REPO, "templates", "_shared", "working-under-nana-pi.md"), "utf-8");
	const block = markerBlock(agents);
	// req: R-859 R-3895 R-3665
	check("AGENTS.md marker-owned section is byte-identical to the shared file", block === shared);
	const prefix = agents.slice(0, agents.indexOf("<!-- nana:working-under-nana-pi begin -->"));
	const paragraph = prefix.trimEnd().split(/\n\s*\n/).at(-1) ?? "";
	// req: R-859
	check("AGENTS.md shared section follows a complete paragraph", prefix.endsWith("\n\n") && /[.!?]$/.test(paragraph));
}
checkAgentsMdMirrorsWorkingUnderNanaPi();

if (fails) process.exitCode = 1;
}
