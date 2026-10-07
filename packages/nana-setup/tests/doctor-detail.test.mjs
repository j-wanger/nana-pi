/**
 * @module packages/nana-setup/tests/doctor-detail.test.mjs
 * @purpose Pins that `doctor`'s detail text for each per-piece check agrees with the tick, cross or
 *  warning it prints — the private rule file, objective.projectFile, the Node floor, and the pi 1.0
 *  subagent/MCP checks (subagent config, reviewer agent marker, pi-subagents version, mcp.json)
 * @inputs lib/doctor.mjs, lib/paths.mjs, lib/steps.mjs, and throwaway home layouts
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (throwaway home layouts, regular files, symlinks and directories)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Gate: `doctor`'s detail text for rules/nana-personal.md agrees with its ✓/✗.
// Four layouts, each in a throwaway --home; nothing touches the real machine.
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const { diagnose, PI_SUBAGENTS_FLOOR, DESK_NODE_FLOOR, parsePlistValues } = await import(new URL("../lib/doctor.mjs", import.meta.url).href);
const { pkgRoot, resolveLayout } = await import(new URL("../lib/paths.mjs", import.meta.url).href);
const { REVIEWER_MARKER, renderPlist, DESK_SERVER } = await import(new URL("../lib/steps.mjs", import.meta.url).href);

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

{
	const home = fs.mkdtempSync(path.join(os.tmpdir(), "nana-doctor-hook-target-"));
	tmps.push(home);
	const layout = resolveLayout({ home });
	fs.mkdirSync(layout.claudeHome, { recursive: true });
	fs.writeFileSync(layout.claudeSettings, JSON.stringify({ hooks: { UserPromptSubmit: [{ hooks: [{ type: "command", command: "NODE_NO_WARNINGS=1 node /missing-clone/packages/nana-knowledge/bin/nana-knowledge.ts hook" }] }] } }));
	const c = diagnose(layout, { projectDir: home }).find((row) => row.label === "settings UserPromptSubmit knowledge pull");
	const outside = path.join(home, "outside", "nana-knowledge.ts");
	fs.mkdirSync(path.dirname(outside), { recursive: true });
	fs.writeFileSync(outside, "// test target\n");
	const validTarget = path.resolve(pkgRoot, "..", "nana-knowledge", "bin", "nana-knowledge.ts");
	fs.writeFileSync(layout.claudeSettings, JSON.stringify({ hooks: { UserPromptSubmit: [{ hooks: [
		{ type: "command", command: `NODE_NO_WARNINGS=1 node '${validTarget}' hook` },
		{ type: "command", command: `NODE_NO_WARNINGS=1 node '${outside}' hook` },
	] }] } }));
	const outsideCheck = diagnose(layout, { projectDir: home }).find((row) => row.label === "settings UserPromptSubmit knowledge pull");
	// req: R-393
	check("doctor rejects missing and out-of-repo absolute knowledge-hook targets", c?.status === "fail" && /target is missing/.test(c.detail) && outsideCheck?.status === "fail" && /does not resolve inside/.test(outsideCheck.detail), `${JSON.stringify(c)} ${JSON.stringify(outsideCheck)}`);
}

{
	// req: R-650
	check("desk Node floor is pinned at 22.19", DESK_NODE_FLOOR === "22.19");
	const sample = '<key>ProgramArguments</key><array><string>/node</string><string>/desk/server.mjs</string></array><key>PATH</key><string>/bin</string>';
	const parsed = parsePlistValues(sample);
	// req: R-651
	check("doctor parses ProgramArguments[0] as the service executable", parsed.programArguments[0] === "/node");
}

if (process.platform === "darwin") {
	const home = fs.mkdtempSync(path.join(os.tmpdir(), "nana-doctor-desk-running-"));
	tmps.push(home);
	const original = resolveLayout({ home });
	const layout = { ...original, isRealHome: true };
	fs.mkdirSync(path.dirname(layout.plistPath), { recursive: true });
	fs.writeFileSync(layout.plistPath, renderPlist({ LABEL: "com.nana.pi-desk", NODE: process.execPath, SERVER: DESK_SERVER, WORKDIR: pkgRoot, PATH: "/bin", LOG: path.join(home, "desk.log") }));
	const stub = path.join(home, "launchctl");
	fs.writeFileSync(stub, `#!/bin/sh\nprintf 'state = running\\n'\n`);
	fs.chmodSync(stub, 0o755);
	const savedPath = process.env.PATH;
	process.env.PATH = `${home}:${savedPath}`;
	try {
		const c = diagnose(layout, { projectDir: home }).find((row) => row.label === "desk service");
		// req: R-399
		check("doctor requires running launchctl state and a valid plist Node", c?.status === "ok" && c.detail.includes("Node "), JSON.stringify(c));
	} finally { process.env.PATH = savedPath; }
}

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
		// req: R-343
		check("projectFile \"OBJECTIVE.md\": ✓ the default, not a rename", c?.status === "ok" && /the default name/.test(c.detail) && !/renamed/.test(c.detail), JSON.stringify(c));
	}
	for (const v of [undefined, null, false, ""]) {
		const c = pfCheck(v);
		// req: R-343
		check(`projectFile ${JSON.stringify(v)}: ✓ the default`, c?.status === "ok" && /the default name/.test(c.detail), JSON.stringify(c));
	}
	{
		const c = pfCheck("PLAN.md");
		check("projectFile \"PLAN.md\": ✓ a rename", c?.status === "ok" && c.detail === '"PLAN.md" (per-repo file renamed from OBJECTIVE.md)', JSON.stringify(c));
	}
	for (const v of ["../OBJECTIVE.md", "docs/OBJECTIVE.md", "docs\\OBJECTIVE.md", "/abs/OBJECTIVE.md", ".", ".."]) {
		const c = pfCheck(v);
		// req: R-343
		check(`projectFile ${JSON.stringify(v)}: ✗ invalid, reason + fallback named, never "renamed"`,
			c?.status === "fail" && /is invalid/.test(c.detail) && /no path separator, not "\." or "\.\."/.test(c.detail) &&
				/uses OBJECTIVE\.md/.test(c.detail) && !/renamed/.test(c.detail), JSON.stringify(c));
	}
	{
		const c = pfCheck(42);
		// req: R-343
		check("projectFile 42 (non-string): ✗ invalid with the fallback", c?.status === "fail" && /is invalid/.test(c.detail) && /uses OBJECTIVE\.md/.test(c.detail), JSON.stringify(c));
	}
	// doctor's rule must agree with the producer's (config.ts refuses exactly these)
	{
		const { isBareFileName } = await import(new URL("../../nana-pack/lib/objective.ts", import.meta.url).href);
		const { projectFileState } = await import(new URL("../lib/doctor.mjs", import.meta.url).href);
		const sample = ["OBJECTIVE.md", "PLAN.md", "a..b", ".hidden", "../x", "x/y", "x\\y", ".", "..", "/x"];
		const disagree = sample.filter((s) => (projectFileState(s).kind !== "invalid") !== isBareFileName(s));
		// req: R-343
		check("doctor's projectFile rule matches the producer's isBareFileName", disagree.length === 0, JSON.stringify(disagree));
	}
	// Node floor: the objective hook's CLI imports .ts unflagged (type stripping, default from 22.18)
	{
		const { nodeMeetsFloor, NODE_FLOOR } = await import(new URL("../lib/doctor.mjs", import.meta.url).href);
		// req: R-344
		check("NODE_FLOOR is 22.18", NODE_FLOOR === "22.18");
		// req: R-344
		check("node floor: 22.17.1 fails, 22.18.0 / 22.22.2 / v24.0.0 pass, 21.9.0 fails",
			!nodeMeetsFloor("22.17.1") && nodeMeetsFloor("22.18.0") && nodeMeetsFloor("22.22.2") && nodeMeetsFloor("v24.0.0") && !nodeMeetsFloor("21.9.0"));
	}

	// pi subagent config (R-361, R-362): the sealed keys live in the seed file ONLY — this test
	// imports it rather than restating the values.
	{
		const seed = JSON.parse(fs.readFileSync(path.join(pkgRoot, "pi", "subagent-config.seed.json"), "utf8"));
		const exactlyTheThreeKeys =
			JSON.stringify(Object.keys(seed).sort()) === JSON.stringify(["asyncByDefault", "forceTopLevelAsync", "maxSubagentDepth"]) &&
			seed.asyncByDefault === true && seed.forceTopLevelAsync === true && seed.maxSubagentDepth === 1;
		// req: R-361
		check("subagent seed: exactly the three keys and values", exactlyTheThreeKeys, JSON.stringify(seed));
	}
	const subagentCheck = (contentOrAbsent) => {
		const home = fs.mkdtempSync(path.join(os.tmpdir(), "nana-doctor-detail-"));
		tmps.push(home);
		const layout = resolveLayout({ home });
		if (contentOrAbsent !== undefined) {
			fs.mkdirSync(path.dirname(layout.subagentConfig), { recursive: true });
			fs.writeFileSync(layout.subagentConfig, contentOrAbsent);
		}
		return { c: diagnose(layout, { projectDir: layout.base }).find((x) => x.label === "pi subagent config"), layout };
	};
	{
		const { c } = subagentCheck(undefined);
		const namesTheFix = c?.status === "fail" && /missing/.test(c.detail) && c.detail.includes("run `nana-setup install` to seed it");
		// req: R-362
		check("subagent config: missing file reads ✗ naming nana-setup install as the fix", namesTheFix, JSON.stringify(c));
	}
	// astra r1 MUST 1 / r2 MUST 1: a PRESENT-but-invalid file must never be told "run
	// nana-setup install" — seedFile() never rewrites a file that already exists, so that
	// remedy cannot fix it. Every present-but-invalid case below is pinned on all three halves
	// (astra r2 MUST 1a): it names the file's own PATH, it prints the literal required values
	// (not merely "the required values"), and it does NOT recommend install.
	for (const [label, bad] of [
		["unparseable", "{ not json"],
		["null", "null"],
		["an array", "[]"],
		["a number", "42"],
		["a string", '"x"'],
	]) {
		const { c, layout } = subagentCheck(bad);
		const namesPath = c?.detail.includes(layout.subagentConfig);
		const namesValues = c?.detail.includes("forceTopLevelAsync: true") && c.detail.includes("maxSubagentDepth: 1");
		const neverInstall = !c?.detail.includes("run `nana-setup install`");
		// req: R-366
		check(`subagent config: ${label} reads ✗ naming the path and the literal required values, never install (no crash)`, c?.status === "fail" && namesPath && namesValues && neverInstall, JSON.stringify(c));
	}
	{
		const { c, layout } = subagentCheck(JSON.stringify({ asyncByDefault: true, forceTopLevelAsync: false, maxSubagentDepth: 1 }));
		const namesKeyAndValue = /forceTopLevelAsync/.test(c?.detail) && c.detail.includes("forceTopLevelAsync: true");
		const neverInstall = !c?.detail.includes("run `nana-setup install`");
		// req: R-367
		check("subagent config: forceTopLevelAsync false reads ✗ naming the key and its required value, never install", c?.status === "fail" && namesKeyAndValue && neverInstall && c.detail.includes(layout.subagentConfig), JSON.stringify(c));
	}
	{
		// astra r2 MUST 1b: snapshot the bytes we WROTE, not a disk re-read taken after any
		// diagnose() call — subagentCheck() itself already ran diagnose() once to produce `c`,
		// so a disk re-read here would miss a rewrite on that very first call.
		const written = JSON.stringify({ asyncByDefault: true, forceTopLevelAsync: true, maxSubagentDepth: 2 });
		const { c, layout } = subagentCheck(written);
		const namesKeyAndValue = /maxSubagentDepth/.test(c?.detail) && c.detail.includes("maxSubagentDepth: 1");
		const neverInstall = !c?.detail.includes("run `nana-setup install`");
		// req: R-368
		check("subagent config: maxSubagentDepth 2 reads ✗ naming the key and its required value, never install", c?.status === "fail" && namesKeyAndValue && neverInstall && c.detail.includes(layout.subagentConfig), JSON.stringify(c));
		// req: R-369
		check("doctor never rewrote the file, including on its very first diagnose() call", fs.readFileSync(layout.subagentConfig, "utf8") === written, fs.readFileSync(layout.subagentConfig, "utf8"));
	}
	{
		const { c } = subagentCheck(JSON.stringify({ asyncByDefault: false, forceTopLevelAsync: true, maxSubagentDepth: 1 }));
		check("subagent config: asyncByDefault false reads ! (warn), not ✗", c?.status === "warn", JSON.stringify(c));
	}
	{
		const { c } = subagentCheck(JSON.stringify({ asyncByDefault: true, forceTopLevelAsync: true, maxSubagentDepth: 1 }));
		check("subagent config: the seed's own shape reads ✓", c?.status === "ok", JSON.stringify(c));
	}

	// pi mcp.json: the same shape defence (astra r1 MUST 2), checked here for the spots the
	// existing R-365 tests below do not reach — a non-object top level, a non-object mcpServers,
	// and a non-object SERVER ENTRY (astra r2 SHOULD 3: pi's own validateMcpServerConfig rejects
	// one outright, so doctor must fail it too, named, before it ever reaches the exposure check).
	const mcpShapeCheck = (content) => {
		const home = fs.mkdtempSync(path.join(os.tmpdir(), "nana-doctor-detail-"));
		tmps.push(home);
		const layout = resolveLayout({ home });
		fs.mkdirSync(path.dirname(layout.mcpConfig), { recursive: true });
		fs.writeFileSync(layout.mcpConfig, content);
		return diagnose(layout, { projectDir: layout.base }).find((x) => x.label === "pi mcp.json");
	};
	for (const [label, bad] of [["null", "null"], ["an array", "[]"], ["a number", "7"]]) {
		const c = mcpShapeCheck(bad);
		check(`mcp.json: parses to ${label} reads ✗, not a crash`, c?.status === "fail" && /must hold a JSON object/.test(c.detail), JSON.stringify(c));
	}
	{
		const c = mcpShapeCheck(JSON.stringify({ mcpServers: "oops" }));
		check("mcp.json: mcpServers as a string reads ✗, not a crash", c?.status === "fail" && /mcpServers must be an object/.test(c.detail), JSON.stringify(c));
	}
	for (const [label, bad] of [["null", null], ["an array", []], ["a number", 42], ["a string", "x"], ["false", false]]) {
		const c = mcpShapeCheck(JSON.stringify({ mcpServers: { memory: bad, real: { command: "x", exposure: "direct" } } }));
		// req: R-372
		check(`mcp.json: server entry "memory" as ${label} reads ✗ naming the server, before the exposure check`, c?.status === "fail" && /\bmemory\b/.test(c.detail) && /must be an object/.test(c.detail), JSON.stringify(c));
	}

	// pi reviewer agent — doctor's absent/unmarked split (R-370, R-371). The install-side seeding
	// promise (R-363) and the full-byte/independent-frontmatter pins live in install.test.mjs,
	// which checks the INSTALLED artifact; these check doctor's reaction to arbitrary content.
	const reviewerCheck = (body) => {
		const home = fs.mkdtempSync(path.join(os.tmpdir(), "nana-doctor-detail-"));
		tmps.push(home);
		const layout = resolveLayout({ home });
		if (body !== undefined) {
			fs.mkdirSync(path.dirname(layout.reviewerAgent), { recursive: true });
			fs.writeFileSync(layout.reviewerAgent, body);
		}
		return diagnose(layout, { projectDir: layout.base }).find((x) => x.label === "pi reviewer agent");
	};
	{
		const c = reviewerCheck(undefined);
		const namesTheFix = c?.status === "fail" && /missing/.test(c.detail) && c.detail.includes("run `nana-setup install` to seed it");
		// req: R-370
		check("reviewer agent: absent reads ✗ naming nana-setup install as the fix", namesTheFix, JSON.stringify(c));
	}
	{
		const c = reviewerCheck("---\nname: reviewer\ndescription: x\n---\n\nNo marker here.\n");
		// astra r1 MUST 1's split applies here too: install never overwrites a PRESENT file, so
		// an unmarked-but-present reviewer.md must not be told to run install either.
		const repairsByHand = c?.status === "fail" && /nana marker/.test(c.detail) && c.detail.includes("repair it by hand");
		// req: R-371
		check("reviewer agent: unmarked reads ✗ instructing a manual repair, not a bare install", repairsByHand, JSON.stringify(c));
	}
	{
		const c = reviewerCheck(`---\nname: reviewer\ndescription: x\n---\n\n${REVIEWER_MARKER}\n\nBody.\n`);
		check("reviewer agent: marked reads ✓", c?.status === "ok", JSON.stringify(c));
	}
	{
		// astra r2 MUST 1c: the marker present ANYWHERE in the body is not the same as it being
		// the REQUIRED first body line — a doctor that merely scanned for the string instead of
		// checking its position would wrongly pass this.
		const c = reviewerCheck(`---\nname: reviewer\ndescription: x\n---\n\nSome other first line.\n\n${REVIEWER_MARKER}\n`);
		const repairsByHand = c?.status === "fail" && /nana marker/.test(c.detail) && c.detail.includes("repair it by hand");
		// req: R-371
		check("reviewer agent: marker present but NOT on the first body line reads ✗", repairsByHand, JSON.stringify(c));
	}

	// pi-subagents version floor (R-364)
	const subagentsVersionCheck = (version) => {
		const home = fs.mkdtempSync(path.join(os.tmpdir(), "nana-doctor-detail-"));
		tmps.push(home);
		const layout = resolveLayout({ home });
		if (version !== undefined) {
			fs.mkdirSync(path.dirname(layout.piSubagentsPackage), { recursive: true });
			fs.writeFileSync(layout.piSubagentsPackage, JSON.stringify({ name: "pi-subagents", version }));
		}
		return diagnose(layout, { projectDir: layout.base }).find((x) => x.label === "pi pi-subagents");
	};
	{
		// req: R-364
		check("PI_SUBAGENTS_FLOOR is 0.75.0", PI_SUBAGENTS_FLOOR === "0.75.0");
		const bad = subagentsVersionCheck("0.64.0");
		// req: R-364
		check("pi-subagents 0.64.0 reads ✗ with the pin", bad?.status === "fail" && bad.detail.includes(`pi install npm:pi-subagents@${PI_SUBAGENTS_FLOOR}`), JSON.stringify(bad));
		const good = subagentsVersionCheck(PI_SUBAGENTS_FLOOR);
		// req: R-364
		check("pi-subagents 0.75.0 reads ✓", good?.status === "ok", JSON.stringify(good));
		const absent = subagentsVersionCheck(undefined);
		// req: R-364
		check("pi-subagents: absent reads ✗ with the same pin", absent?.status === "fail" && absent.detail.includes(`pi install npm:pi-subagents@${PI_SUBAGENTS_FLOOR}`), JSON.stringify(absent));
	}

	// mcp.json: codemode-default exposure (R-365)
	const mcpCheck = (content) => {
		const home = fs.mkdtempSync(path.join(os.tmpdir(), "nana-doctor-detail-"));
		tmps.push(home);
		const layout = resolveLayout({ home });
		if (content !== undefined) {
			fs.mkdirSync(path.dirname(layout.mcpConfig), { recursive: true });
			fs.writeFileSync(layout.mcpConfig, content);
		}
		return diagnose(layout, { projectDir: layout.base }).find((x) => x.label === "pi mcp.json");
	};
	{
		const warn = mcpCheck(JSON.stringify({ mcpServers: { memory: { command: "x" } } }));
		const namesServerExposureAndFlag = warn?.status === "warn" && /memory/.test(warn.detail) && /exposure/.test(warn.detail) && /autoEnableCodemode/.test(warn.detail);
		// req: R-365
		check("mcp.json: codemode-default server reads !", namesServerExposureAndFlag, JSON.stringify(warn));
	}
	{
		const ok1 = mcpCheck(JSON.stringify({ mcpServers: { memory: { command: "x", exposure: "direct" } } }));
		// req: R-365
		check("mcp.json: direct exposure reads ✓", ok1?.status === "ok", JSON.stringify(ok1));
	}
	{
		const ok2 = mcpCheck(JSON.stringify({ mcpServers: { memory: { command: "x" } }, autoEnableCodemode: false }));
		// req: R-365
		check("mcp.json: autoEnableCodemode false reads ✓ even without exposure", ok2?.status === "ok", JSON.stringify(ok2));
	}
	{
		const absent = mcpCheck(undefined);
		check("mcp.json: absent reads a note, not a failure", absent?.status === "note", JSON.stringify(absent));
	}
} finally {
	for (const t of tmps) fs.rmSync(t, { recursive: true, force: true });
}

console.log(fails ? `FAILED ${fails}` : "ALL PASS");
process.exit(fails ? 1 : 0);
