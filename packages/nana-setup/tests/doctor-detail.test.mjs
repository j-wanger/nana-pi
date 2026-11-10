/**
 * @module packages/nana-setup/tests/doctor-detail.test.mjs
 * @purpose Pins that `doctor`'s detail text for each per-piece check agrees with the tick, cross or
 *  warning it prints — the private rule file, objective.projectFile, the Node floor, and the pi 1.0
 *  subagent/MCP checks (subagent config, reviewer agent marker, pi-subagents version, mcp.json)
 * @inputs lib/doctor.mjs, lib/paths.mjs, lib/steps.mjs, valid and malformed nana-pack JSON fixtures, and throwaway home layouts
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (throwaway home layouts, regular files, symlinks and directories)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Gate: `doctor`'s detail text for rules/nana-personal.md agrees with its ✓/✗.
// Four layouts, each in a throwaway --home; nothing touches the real machine.
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { withPiStub } from "./stub-pi.mjs";

const { diagnose } = await import(new URL("../lib/doctor.mjs", import.meta.url).href);
const diagnoseWithPi = (...args) => withPiStub(() => diagnose(...args));
const { resolveLayout } = await import(new URL("../lib/paths.mjs", import.meta.url).href);
const { CONFIG_FAILURE_PREFIX, FORWARD_SLASH_ADVICE, MANUAL_JSON_ADVICE, displayPath } = await import(new URL("../../nana-pack/lib/objective.ts", import.meta.url).href);

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

const tmps = [];
/** A temp home whose rules dir holds nana-personal.md in the given shape (or not at all). */
function layoutWith(shape) {
	const home = tmpDir(path.join(os.tmpdir(), "nana-doctor-detail-"));
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
const personalCheck = (layout) => diagnoseWithPi(layout, { projectDir: layout.base }).find((c) => c.label === "rule nana-personal.md");

try {
	{
		const c = personalCheck(layoutWith("file"));
		// req: R-342
		check("regular file: ✓", c?.status === "ok", JSON.stringify(c));
		// req: R-342
		check("regular file: detail does NOT say 'not a regular file'", !/not a regular file/.test(c?.detail ?? ""), JSON.stringify(c));
		check("regular file: detail does not ask for a replacement", !/replace/.test(c?.detail ?? ""), JSON.stringify(c));
	}
	{
		const c = personalCheck(layoutWith("symlink"));
		// req: R-342
		check("symlink: ✗", c?.status === "fail", JSON.stringify(c));
		// exact string pinned by install.test.mjs (doctor + install share it)
		// req: R-342
		check("symlink: the exact existing message", c?.detail === "private rule is a symlink — replace with a regular file", JSON.stringify(c));
	}
	{
		const c = personalCheck(layoutWith("dir"));
		// req: R-342
		check("directory: ✗", c?.status === "fail", JSON.stringify(c));
		// req: R-342
		check("directory: detail says 'not a regular file'", /not a regular file/.test(c?.detail ?? ""), JSON.stringify(c));
	}
	{
		const c = personalCheck(layoutWith("absent"));
		// req: R-342
		check("absent: ✗", c?.status === "fail", JSON.stringify(c));
		// req: R-342
		check("absent: detail says it is missing", /missing/.test(c?.detail ?? ""), JSON.stringify(c));
		// req: R-341
		check("absent: detail names the fix (`nana-setup install`)", /nana-setup install/.test(c?.detail ?? ""), JSON.stringify(c));
	}

	{
		const layout = layoutWith("file");
		fs.mkdirSync(path.dirname(layout.piPackConfig), { recursive: true });
		const target = path.join(layout.base, "configured-objective.md");
		fs.writeFileSync(target, "**Objective:** configured\n");
		const text = JSON.stringify({ objective: { path: target, projectFile: "GOALS.md" } }, null, 2).replace(/\n/g, "\r\n");
		fs.writeFileSync(layout.piPackConfig, text);
		const labels = ["pi nana-pack.json", "pi objective.projectFile", "pi objective file"];
		const plain = diagnoseWithPi(layout, { projectDir: layout.base }).filter((row) => labels.includes(row.label));
		fs.writeFileSync(layout.piPackConfig, `\uFEFF${text}`);
		const marked = diagnoseWithPi(layout, { projectDir: layout.base }).filter((row) => labels.includes(row.label));
		const result = (rows) => rows.filter(row => labels.includes(row.label)).map(({ label, status, detail }) => ({ label, status, detail }));
		// req: R-1580
		check("doctor reads a nana-pack.json saved with a byte-order mark and CRLF as it reads the same file without one", plain.find((row) => row.label === "pi nana-pack.json")?.status === "ok" && JSON.stringify(result(marked)) === JSON.stringify(result(plain)), `${layout.piPackConfig}: ${JSON.stringify({ plain: result(plain), marked: result(marked) })}`);
		fs.writeFileSync(layout.piPackConfig, text);
		const utf8Rows = result(diagnoseWithPi(layout, { projectDir: layout.base }));
		fs.writeFileSync(layout.piPackConfig, Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, "utf16le")]));
		const utf16Rows = result(diagnoseWithPi(layout, { projectDir: layout.base }));
		// req: R-2233
		check("doctor reads a UTF-16LE nana-pack.json as it reads the same JSON saved as UTF-8", utf8Rows.find((row) => row.label === "pi nana-pack.json")?.status === "ok" && JSON.stringify(utf16Rows) === JSON.stringify(utf8Rows), `${layout.piPackConfig}: ${JSON.stringify({ utf8Rows, utf16Rows })}`);
	}

	const malformedConfigFixtures = [
		[String.raw`{
  "objective": { "enabled": false, "path": "C:\Users\me\umbrella-zq7\OBJECTIVE.md" }
}
`, FORWARD_SLASH_ADVICE, "line 2, column 48"],
		[`\uFEFF${String.raw`{
  "objective": { "enabled": false, "path": "C:\Users\me\umbrella-zq7\OBJECTIVE.md" }
}
`.replace(/\n/g, "\r\n")}`, FORWARD_SLASH_ADVICE, "line 2, column 48"],
		[`{ "objective": { "path": "control-zq7
character" } }`, FORWARD_SLASH_ADVICE, true],
		[`{ "objective": { "path": C:/umbrella-zq7/OBJECTIVE.md } }`, MANUAL_JSON_ADVICE, false],
		[`{ "objective": { "path": "trailing-zq7", } }`, MANUAL_JSON_ADVICE, true],
	];
	const malformedConfigRows = malformedConfigFixtures.map(([fixture, advice, place]) => {
		const layout = layoutWith("file");
		fs.mkdirSync(path.dirname(layout.piPackConfig), { recursive: true });
		fs.writeFileSync(layout.piPackConfig, fixture);
		const row = diagnoseWithPi(layout, { projectDir: layout.base }).find((candidate) => candidate.label === "pi nana-pack.json");
		const placeOk = typeof place === "string"
			? row?.detail.includes(place)
			: place
				? / at line \d+, column \d+\./.test(row?.detail ?? "")
				: !/line \d/.test(row?.detail ?? "");
		const otherAdvice = advice === FORWARD_SLASH_ADVICE ? MANUAL_JSON_ADVICE : FORWARD_SLASH_ADVICE;
		return row?.status === "fail" && row.detail.startsWith(CONFIG_FAILURE_PREFIX) && row.detail.includes(displayPath(layout.piPackConfig)) && row.detail.includes(advice) && !row.detail.includes(otherAdvice) && placeOk && !row.detail.includes("zq7") && !row.detail.includes("Bad escaped") && !row.detail.includes("Bad control") && !row.detail.includes("Unexpected token");
	});
	// req: R-1972
	check("doctor names an unparseable nana-pack.json's file and the error-kind repair, never the file's text", malformedConfigRows.every(Boolean), JSON.stringify(malformedConfigRows));

	const unicodeEscapeRows = [
		String.raw`{ "objective": { "path": "D:\umbrella-zq7\OBJECTIVE.md" } }`,
		String.raw`{ "objective": { "path": "c:\users\me\umbrella-zq7\OBJECTIVE.md" } }`,
	].map((fixture) => {
		const layout = layoutWith("file");
		fs.mkdirSync(path.dirname(layout.piPackConfig), { recursive: true });
		fs.writeFileSync(layout.piPackConfig, fixture);
		const row = diagnoseWithPi(layout, { projectDir: layout.base }).find((candidate) => candidate.label === "pi nana-pack.json");
		return row?.status === "fail" && row.detail.startsWith(CONFIG_FAILURE_PREFIX) && row.detail.includes(displayPath(layout.piPackConfig)) && / at line 1, column \d+\./.test(row.detail) && row.detail.includes(FORWARD_SLASH_ADVICE) && !row.detail.includes(MANUAL_JSON_ADVICE) && !row.detail.includes("zq7") && !row.detail.includes("Bad Unicode");
	});
	// req: R-2091
	check("doctor gives the forward-slash repair for a pasted path with a backslash before u, never the file's text", unicodeEscapeRows.every(Boolean), JSON.stringify(unicodeEscapeRows));

	// doctor's rule must agree with the producer's (config.ts refuses exactly these)
	{
		const { isBareFileName } = await import(new URL("../../nana-pack/lib/objective.ts", import.meta.url).href);
		const { projectFileState } = await import(new URL("../lib/doctor.mjs", import.meta.url).href);
		const sample = ["OBJECTIVE.md", "PLAN.md", "a..b", ".hidden", "../x", "x/y", "x\\y", "docs\\OBJECTIVE.md", ".", "..", "/x"];
		const disagree = sample.filter((s) => (projectFileState(s).kind !== "invalid") !== isBareFileName(s));
		// req: R-343
		check("doctor's projectFile rule matches the producer's isBareFileName", disagree.length === 0, JSON.stringify(disagree));
	}
} finally {
	for (const t of tmps) fs.rmSync(t, { recursive: true, force: true });
}

console.log(fails ? `FAILED ${fails}` : "ALL PASS");
process.exit(fails ? 1 : 0);
