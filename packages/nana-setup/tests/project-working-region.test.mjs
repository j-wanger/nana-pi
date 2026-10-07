/**
 * @module packages/nana-setup/tests/project-working-region.test.mjs
 * @purpose Pins marker-owned AGENTS refresh and region-only checking without touching bytes outside the region.
 * @inputs project helpers, the shared working section, and temporary project folders.
 * @outputs PASS/FAIL lines and a nonzero exit when an assertion fails.
 * @effects disk (temporary project fixtures only).
 * @errors failed assertions produce a nonzero exit.
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { agentsStub, checkProject, refreshWorkingRegion, WORKING_BEGIN, WORKING_END, SHARED_DIR } from "../lib/project.mjs";

const root = tmpDir(path.join(os.tmpdir(), "nana-region-"));
const shared = fs.readFileSync(path.join(SHARED_DIR, "working-under-nana-pi.md"), "utf8");
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail); if (!ok) fails++; };
let fails = 0;
const make = (body) => { const dir = path.join(root, `p${fs.readdirSync(root).length}`); fs.mkdirSync(dir); fs.writeFileSync(path.join(dir, "AGENTS.md"), body); return dir; };

{
	const prefix = "outside-before\r\n";
	const suffix = "outside-after\r\n";
	const stale = `${prefix}${WORKING_BEGIN}\r\nstale\r\n${WORKING_END}\r\n${suffix}`;
	const dir = make(stale);
	const refresh = refreshWorkingRegion(dir);
	const result = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
	// req: R-986
	check("refresh changes only the marked bytes and retains CRLF surrounding bytes", refresh.status === "created" && result.startsWith(prefix) && result.endsWith(suffix) && result.includes(shared.replace(/\n/g, "\r\n")), result);
	// req: R-989
	check("check accepts the refreshed region", (await checkProject(dir)).find((c) => c.label === "AGENTS.md working region")?.ok === true);
	fs.appendFileSync(path.join(dir, "AGENTS.md"), "outside mutation\n");
	// req: R-989
	check("outside edits do not change the region check", (await checkProject(dir)).find((c) => c.label === "AGENTS.md working region")?.ok === true);
}

{
	const dir = make(`${WORKING_BEGIN}\n${shared}${WORKING_END}\n`);
	// req: R-986
	check("matching region is unchanged", refreshWorkingRegion(dir).status === "unchanged");
	fs.writeFileSync(path.join(dir, "AGENTS.md"), `${WORKING_BEGIN}\nold\n${WORKING_END}\n`);
	const before = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
	// req: R-987
	check("dry run reports without writing", refreshWorkingRegion(dir, { dryRun: true }).detail.includes("would refresh") && fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8") === before);
}

{
	const malformedCases = [];
	for (const [title, body] of [
		["no markers", "unmarked old instructions\n"],
		["one marker", `${WORKING_BEGIN}\nold\n`],
		["duplicates", `${WORKING_BEGIN}\n${WORKING_BEGIN}\n${WORKING_END}\n`],
		["reversed", `${WORKING_END}\n${WORKING_BEGIN}\n`],
		["markers only inside a fenced block", `\`\`\`md\n${WORKING_BEGIN}\n${WORKING_END}\n\`\`\`\n`],
	]) {
		const dir = make(body);
		const before = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
		const result = refreshWorkingRegion(dir);
		check(`${title} markers are reported and left untouched`, result.status === "skipped" && result.detail.includes("wrap the section once") && fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8") === before);
		malformedCases.push(result.status === "skipped" && result.detail.includes("wrap the section once") && fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8") === before);
		if (title === "no markers") {
			// req: R-989
			check("missing markers are a ! note", (await checkProject(dir)).find((c) => c.label === "AGENTS.md working region")?.note === true);
		}
	}
	// req: R-987
	check("all invalid marker layouts are refused without writes", malformedCases.length === 5 && malformedCases.every(Boolean));
}

{
	const dir = path.join(root, "linked"); fs.mkdirSync(dir);
	const external = path.join(root, "external.md");
	const victim = `${WORKING_BEGIN}\nstale victim section\n${WORKING_END}\n`;
	fs.writeFileSync(external, victim);
	fs.symlinkSync(external, path.join(dir, "AGENTS.md"));
	const result = refreshWorkingRegion(dir);
	// req: R-987
	check("symlinked AGENTS is reported and left alone", result.status === "skipped" && result.detail.includes("symlink") && fs.readFileSync(external, "utf8") === victim);
}

{
	const stub = agentsStub("fixture");
	// req: R-988
	check("new stub has exact delimiters", stub.includes(`${WORKING_BEGIN}\n${shared}${WORKING_END}\n`));
	const dir = make(`${WORKING_BEGIN}\nold\n${WORKING_END}\n`);
	const mismatch = (await checkProject(dir)).find((c) => c.label === "AGENTS.md working region");
	// req: R-989
	check("check fails and names the project refresh fix when region differs", mismatch?.ok === false && /differs — fix: nana-setup project /.test(mismatch.detail));
}

console.log(`${fails ? "FAIL" : "PASS"} summary: ${fails} failures`);
process.exit(fails ? 1 : 0);
