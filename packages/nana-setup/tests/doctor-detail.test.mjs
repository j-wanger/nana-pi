// Gate: `doctor`'s detail text for rules/nana-personal.md agrees with its ✓/✗.
// Four layouts, each in a throwaway --home; nothing touches the real machine.
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const { diagnose } = await import(new URL("../lib/doctor.mjs", import.meta.url).href);
const { resolveLayout } = await import(new URL("../lib/paths.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

const tmps = [];
/** A temp home whose rules dir holds nana-personal.md in the given shape (or not at all). */
function layoutWith(shape) {
	const home = fs.mkdtempSync(path.join(os.tmpdir(), "nana-doctor-detail-"));
	tmps.push(home);
	const layout = resolveLayout({ home });
	fs.mkdirSync(layout.rulesDir, { recursive: true });
	const personal = path.join(layout.rulesDir, "nana-personal.md");
	if (shape === "file") fs.writeFileSync(personal, "# private\n");
	if (shape === "dir") fs.mkdirSync(personal);
	if (shape === "symlink") {
		const elsewhere = path.join(home, "private-notes.md");
		fs.writeFileSync(elsewhere, "# private\n");
		fs.symlinkSync(elsewhere, personal);
	}
	return layout;
}
const personalCheck = (layout) => diagnose(layout, { projectDir: layout.base }).find((c) => c.label === "rule nana-personal.md");

try {
	{
		const c = personalCheck(layoutWith("file"));
		check("regular file: ✓", c?.status === "ok", JSON.stringify(c));
		check("regular file: detail does NOT say 'not a regular file'", !/not a regular file/.test(c?.detail ?? ""), JSON.stringify(c));
		check("regular file: detail does not ask for a replacement", !/replace/.test(c?.detail ?? ""), JSON.stringify(c));
	}
	{
		const c = personalCheck(layoutWith("symlink"));
		check("symlink: ✗", c?.status === "fail", JSON.stringify(c));
		// exact string pinned by install.test.mjs (doctor + install share it)
		check("symlink: the exact existing message", c?.detail === "private rule is a symlink — replace with a regular file", JSON.stringify(c));
	}
	{
		const c = personalCheck(layoutWith("dir"));
		check("directory: ✗", c?.status === "fail", JSON.stringify(c));
		check("directory: detail says 'not a regular file'", /not a regular file/.test(c?.detail ?? ""), JSON.stringify(c));
	}
	{
		const c = personalCheck(layoutWith("absent"));
		check("absent: ✗", c?.status === "fail", JSON.stringify(c));
		check("absent: detail says it is missing", /missing/.test(c?.detail ?? ""), JSON.stringify(c));
		check("absent: detail names the fix (`nana-setup install`)", /nana-setup install/.test(c?.detail ?? ""), JSON.stringify(c));
	}

	// objective.projectFile: default / rename / INVALID are three distinct verdicts (T2a astra land MUST 2).
	// Driven through diagnose() with a real ~/.pi/agent/nana-pack.json, so the ✓/✗ is the one doctor prints.
	const pfCheck = (value) => {
		const layout = layoutWith("file");
		fs.mkdirSync(path.dirname(layout.piPackConfig), { recursive: true });
		const objective = value === undefined ? {} : { projectFile: value };
		fs.writeFileSync(layout.piPackConfig, JSON.stringify({ objective }));
		return diagnose(layout, { projectDir: layout.base }).find((c) => c.label === "pi objective.projectFile");
	};
	{
		const c = pfCheck("OBJECTIVE.md");
		check("projectFile \"OBJECTIVE.md\": ✓ the default, not a rename", c?.status === "ok" && /the default name/.test(c.detail) && !/renamed/.test(c.detail), JSON.stringify(c));
	}
	for (const v of [undefined, null, false, ""]) {
		const c = pfCheck(v);
		check(`projectFile ${JSON.stringify(v)}: ✓ the default`, c?.status === "ok" && /the default name/.test(c.detail), JSON.stringify(c));
	}
	{
		const c = pfCheck("PLAN.md");
		check("projectFile \"PLAN.md\": ✓ a rename", c?.status === "ok" && c.detail === '"PLAN.md" (per-repo file renamed from OBJECTIVE.md)', JSON.stringify(c));
	}
	for (const v of ["../OBJECTIVE.md", "docs/OBJECTIVE.md", "docs\\OBJECTIVE.md", "/abs/OBJECTIVE.md", ".", ".."]) {
		const c = pfCheck(v);
		check(`projectFile ${JSON.stringify(v)}: ✗ invalid, reason + fallback named, never "renamed"`,
			c?.status === "fail" && /is invalid/.test(c.detail) && /no path separator, not "\." or "\.\."/.test(c.detail) &&
				/uses OBJECTIVE\.md/.test(c.detail) && !/renamed/.test(c.detail), JSON.stringify(c));
	}
	{
		const c = pfCheck(42);
		check("projectFile 42 (non-string): ✗ invalid with the fallback", c?.status === "fail" && /is invalid/.test(c.detail) && /uses OBJECTIVE\.md/.test(c.detail), JSON.stringify(c));
	}
	// doctor's rule must agree with the producer's (config.ts refuses exactly these)
	{
		const { isBareFileName } = await import(new URL("../../nana-pack/lib/objective.ts", import.meta.url).href);
		const { projectFileState } = await import(new URL("../lib/doctor.mjs", import.meta.url).href);
		const sample = ["OBJECTIVE.md", "PLAN.md", "a..b", ".hidden", "../x", "x/y", "x\\y", ".", "..", "/x"];
		const disagree = sample.filter((s) => (projectFileState(s).kind !== "invalid") !== isBareFileName(s));
		check("doctor's projectFile rule matches the producer's isBareFileName", disagree.length === 0, JSON.stringify(disagree));
	}
	// Node floor: the objective hook's CLI imports .ts unflagged (type stripping, default from 22.18)
	{
		const { nodeMeetsFloor, NODE_FLOOR } = await import(new URL("../lib/doctor.mjs", import.meta.url).href);
		check("NODE_FLOOR is 22.18", NODE_FLOOR === "22.18");
		check("node floor: 22.17.1 fails, 22.18.0 / 22.22.2 / v24.0.0 pass, 21.9.0 fails",
			!nodeMeetsFloor("22.17.1") && nodeMeetsFloor("22.18.0") && nodeMeetsFloor("22.22.2") && nodeMeetsFloor("v24.0.0") && !nodeMeetsFloor("21.9.0"));
	}
} finally {
	for (const t of tmps) fs.rmSync(t, { recursive: true, force: true });
}

console.log(fails ? `FAILED ${fails}` : "ALL PASS");
process.exit(fails ? 1 : 0);
