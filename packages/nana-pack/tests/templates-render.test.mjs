/**
 * @module packages/nana-pack/tests/templates-render.test.mjs
 * @purpose Pins that both project template modes render and that the requirements-first rail they ship is wired in each, including a first `--check` that passes with no dependencies installed
 * @inputs the templates/ tree at the repository root and throwaway render targets under a temp HOME
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, rendered projects), process (spawns the render and check commands in the rendered projects)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
import { tmpDir } from "./tmp-dir.mjs";
import { EXEMPTIONS, SURFACES, judgeClaims, staleExemptions } from "./skill-claims.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { checkTree, readRequirementRows } from "../../../scripts/requirements-tree.mjs";
// The project templates render in BOTH modes, and the requirements-first rail they ship is
// wired in both:
//   * scaffold — REQUIREMENTS.md with the example row `implemented`, the trace rail, the
//     code-map generator, the seed map; `--check` passes in a FRESH scaffold with NO
//     dependencies installed (both generators are stdlib/node-only by design — that is what
//     makes them runnable from the post-edit gate on the first edit, before `pnpm install` /
//     `uv sync`), and it covers src, scripts AND the test dir, so a header dropped in
//     tests/ fails too.
//   * adopt — the same rail and generator land, every Part G row starts `untested`, no row
//     claims `implemented`, the test markers arrive as `req-candidate:`, and the placeholder
//     map makes the first `--check` fail NAMING the one command that fixes it; after that
//     command `--check` is green.
// Needs `uvx copier`; without it every row SKIPs. Temp HOME.
// Run: node --experimental-strip-types <this file>
const { desiredHooks, CLAUDE_CODE_EXEC_FLOOR } = await import(new URL("../../nana-setup/lib/settings.mjs", import.meta.url).href);
const NANA_HOME = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "nana-home-")));
process.env.HOME = NANA_HOME;
process.env.USERPROFILE = NANA_HOME;

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
let fails = 0;
let skillClaimsExtracted = 0;
const skillUnjudged = [];
const reportedStaleExemptions = new Set();
const check = (n, ok, why = "") => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : why);
	if (!ok) fails++;
};
const skip = (n, why) => console.log("SKIP", n, "—", why);
const run = (cmd, args, cwd, extraEnv) => spawnSync(cmd, args, { cwd, encoding: "utf-8", timeout: 240_000, ...(extraEnv ? { env: { ...process.env, ...extraEnv } } : {}) });
const out = (r) => `${r.stdout ?? ""}${r.stderr ?? ""}`;

/** `uvx copier`, if this machine has it. */
function copierAvailable() {
	const probe = run("uvx", ["copier", "--version"], REPO);
	return probe.status === 0 ? probe.stdout.trim() : null;
}

/** Render one template from THIS checkout into a temp dir. */
function render(language, answers) {
	const dest = tmpDir(path.join(os.tmpdir(), `nana-tpl-${language}-`));
	const args = ["copier", "copy", "--trust", "--vcs-ref", "HEAD", "--defaults", "-d", `language=${language}`];
	for (const [k, v] of Object.entries(answers)) args.push("-d", `${k}=${v}`);
	args.push(REPO, dest);
	const r = run("uvx", args, REPO);
	return { dest, ok: r.status === 0, out: out(r) };
}

/** Rewrite every file under `dir` to CRLF line endings, in place — a Windows editor's save,
 *  reproducible on any platform (R-1321). Binary files (none expected in a fresh render) are
 *  left alone. */
function rewriteToCrlf(dir) {
	const visit = (d) => {
		for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
			const full = path.join(d, entry.name);
			if (entry.isDirectory()) {
				if (entry.name !== "node_modules" && entry.name !== ".git") visit(full);
				continue;
			}
			const buf = fs.readFileSync(full);
			if (buf.includes(0)) continue; // binary; skip defensively
			const text = buf.toString("utf8");
			const crlf = text.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n");
			if (crlf !== text) fs.writeFileSync(full, crlf);
		}
	};
	visit(dir);
}

/** `uv`, if this machine has it and can add pytest — the one dependency Python's trace rail
 *  needs that its dependency-free siblings (code-map, readme-check) do not, since
 *  `tests/conftest.py` imports pytest at module load. `--no-project` never touches the rendered
 *  project's own lock; same network allowance as `copierAvailable()`'s `uvx` and the ruff/biome
 *  probes below, so a cold machine fetches it once same as they do. */
function pytestAvailable() {
	const probe = run("uv", ["run", "--no-project", "--with", "pytest", "python3", "-c", "import pytest"], REPO);
	return probe.status === 0;
}

/** `uvx --with pytest pytest`, the resolvable-pytest probe for the R-1360 cp1252 check below.
 *  Separate from `pytestAvailable()`'s `uv run --no-project ... python3` probe, which SKIPs on
 *  Windows (no `python3` in uv's Windows environment, win-template-tests log line 4633) while
 *  `uvx --with pytest pytest` runs there too (the update leg). */
function uvxPytestAvailable() {
	return run("uvx", ["--with", "pytest", "pytest", "--version"], REPO).status === 0;
}

/** R-1360: a scaffolded or adopted Python project's requirements-trace, code-map and
 *  readme-check tests run their own child Python processes, and pass when those children
 *  write their output in cp1252 — the Windows default a user who sets no PYTHONIOENCODING
 *  gets. Forces the same decode mismatch on macOS/Linux with PYTHONIOENCODING=cp1252 and a
 *  Latin-1 locale, in a real pytest run against the actual render. Returns `{ available:
 *  false }` when uvx cannot resolve pytest, so the caller SKIPs (or FAILs under
 *  NANA_TEST_REQUIRE_COPIER=1) rather than guessing "unresolvable" from the real run's exit
 *  code (uv and pytest both use exit 2 too); the caller does its own `check(` so the row's
 *  marker sits directly above a literal call, this file's own trace-rail convention.
 *  `deselect` carries test ids this render's state fails for a reason the cp1252 fix does
 *  not touch (adopt mode's own self-tests — see the adopt call site below); it is empty for
 *  the scaffold render, which starts in a state where every test applies. */
function runCp1252(dest, deselect = []) {
	if (!uvxPytestAvailable()) return { available: false };
	const args = ["--with", "pytest", "pytest", "-o", "addopts=", "-p", "no:cacheprovider", "tests/test_requirements_trace.py", "tests/test_code_map.py", "tests/test_readme_check.py"];
	for (const id of deselect) args.push("--deselect", id);
	const r = run(
		"uvx",
		args,
		dest,
		// PYTHONDONTWRITEBYTECODE keeps this render's own file list clean for the checks
		// that run after this one (a later check compares the render's whole file list
		// against the skill's declared list; a stray `__pycache__` would fail it).
		{ PYTHONIOENCODING: "cp1252", LC_ALL: "en_US.ISO8859-1", PYTHONDONTWRITEBYTECODE: "1" },
	);
	return { available: true, ok: r.status === 0, tail: out(r).slice(-800) };
}

/** Python's `backslashreplace` escape for one code point (R-1440 to R-1442's comparator):
 *  lowercase hex, `\xHH` up to U+00FF, `\uHHHH` up to U+FFFF, else `\UHHHHHHHH`. */
function pyBackslashEscape(codePoint) {
	if (codePoint <= 0xff) return `\\x${codePoint.toString(16).padStart(2, "0")}`;
	if (codePoint <= 0xffff) return `\\u${codePoint.toString(16).padStart(4, "0")}`;
	return `\\U${codePoint.toString(16).padStart(8, "0")}`;
}

/** The code points `TextDecoder("windows-1252")` decodes bytes 0x00–0xFF to — the cp1252
 *  "has" set the must-meet's comparator defines "lacks" against. */
const CP1252_CODE_POINTS = new Set(
	[...new TextDecoder("windows-1252").decode(Uint8Array.from({ length: 256 }, (_, i) => i))].map((ch) => ch.codePointAt(0)),
);

/** Whether an encoding lacks a code point, per the must-meet's comparator: ascii lacks
 *  0x80 and above; cp1252 lacks whatever `CP1252_CODE_POINTS` does not hold. */
const ENCODING_LACKS = {
	ascii: (codePoint) => codePoint >= 0x80,
	cp1252: (codePoint) => !CP1252_CODE_POINTS.has(codePoint),
};

/** Decode one encoding's raw stdout bytes the way the must-meet's comparator does: ascii's
 *  backslashreplace output is pure ASCII bytes, so UTF-8 decodes it unchanged; cp1252's
 *  output mixes ASCII escapes with raw cp1252 bytes, so it needs the windows-1252 decoder. */
const ENCODING_DECODE = {
	ascii: (buf) => buf.toString("utf-8"),
	cp1252: (buf) => new TextDecoder("windows-1252").decode(buf),
};

/** The UTF-8 stdout rewritten with each character `encoding` lacks written as its Python
 *  escape — the expected stdout for that encoding's run (R-1440 to R-1442's comparator). */
function expectedUnderEncoding(utf8Text, encoding) {
	const lacks = ENCODING_LACKS[encoding];
	return [...utf8Text].map((ch) => {
		const codePoint = ch.codePointAt(0);
		return lacks(codePoint) ? pyBackslashEscape(codePoint) : ch;
	}).join("");
}

/** One command's raw stdout as a Buffer under one `PYTHONIOENCODING`, with NO `encoding`
 *  option — `run()`'s own `encoding: "utf-8"` would mangle cp1252 bytes before the
 *  comparator ever saw them (R-1440 to R-1443's fixture). */
function runRawStdout(cmd, args, cwd, pythonIoEncoding) {
	return spawnSync(cmd, args, { cwd, timeout: 60_000, env: { ...process.env, PYTHONIOENCODING: pythonIoEncoding } });
}

/** One command's comparator across ascii and cp1252 against its own UTF-8 run (R-1440 to
 *  R-1442): the exit equals the UTF-8 exit, and the decoded stdout equals the UTF-8 stdout
 *  with each character the encoding lacks written as its Python escape. Returns `{ ok, why,
 *  utf8Stdout }` so the caller can also pin R-1443 off the same UTF-8 run. On FAIL, `why`
 *  names the encoding, both exits and the stderr tail. */
function compareAcrossEncodings(cmd, args, cwd) {
	const utf8 = runRawStdout(cmd, args, cwd, "utf-8");
	const utf8Stdout = (utf8.stdout ?? Buffer.alloc(0)).toString("utf-8");
	let ok = true;
	const why = [];
	for (const encoding of ["ascii", "cp1252"]) {
		const r = runRawStdout(cmd, args, cwd, encoding);
		const decoded = ENCODING_DECODE[encoding](r.stdout ?? Buffer.alloc(0));
		const expected = expectedUnderEncoding(utf8Stdout, encoding);
		const exitOk = r.status === utf8.status;
		const textOk = decoded === expected;
		if (!exitOk || !textOk) {
			ok = false;
			why.push(`${encoding}: exit ${r.status} vs utf-8 exit ${utf8.status}; stderr tail: ${(r.stderr ?? Buffer.alloc(0)).toString("utf-8").slice(-400)}`);
		}
	}
	return { ok, why: why.join(" | "), utf8Stdout };
}

/** Call the rendered project's own trace-rail `check()` directly, with no test framework
 *  installed: TypeScript's `tests/requirements-trace.ts` has no dependency of its own (dynamic
 *  `import()` under this runner's `--experimental-strip-types`); Python's `tests/conftest.py`
 *  needs pytest only to import, so it runs through `pytestAvailable()`'s ephemeral interpreter.
 *  Returns `{ problems }`, `{ unavailable }` when uv/pytest could not be resolved on this
 *  machine (an environment gap, not a CRLF regression — the caller SKIPs rather than fails
 *  on this one), or `{ error }` for every other failure. */
async function traceProblems(language, dest) {
	if (language === "typescript") {
		const { check: traceCheck } = await import(pathToFileURL(path.join(dest, "tests/requirements-trace.ts")).href);
		return { problems: traceCheck(dest).problems };
	}
	if (!pytestAvailable()) return { unavailable: "uv could not resolve pytest to import tests/conftest.py's check() with" };
	const script = ["import sys", "sys.path.insert(0, 'tests')", "from pathlib import Path", "import conftest", "result = conftest.check(Path('.'))", "print('TRACE_PROBLEMS', len(result[2]))", "print('\\n'.join(result[2]))"].join("\n");
	const r = run("uv", ["run", "--no-project", "--with", "pytest", "python3", "-c", script], dest);
	if (r.status !== 0 || !/TRACE_PROBLEMS 0/.test(out(r))) return { error: out(r).slice(-800) };
	return { problems: [] };
}

/** Strip the module's leading contract header: a JSDoc block, or a Python docstring. */
function listedAdoptFiles(skill) {
	const section = skill.match(/Files written by an adopt render into an empty folder:\n([\s\S]*?)(?:\n\n|$)/)?.[1] ?? "";
	return [...section.matchAll(/^\s*- `([^`]+)`/gm)].map((m) => m[1]);
}
function emittedFiles(root) {
	const files = [];
	const visit = (dir) => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) visit(full);
			else if (entry.isFile()) files.push(path.relative(root, full).split(path.sep).join("/"));
		}
	};
	visit(root);
	return files.sort();
}

function dropHeader(file) {
	const src = fs.readFileSync(file, "utf-8");
	const stripped = file.endsWith(".py")
		? src.replace(/^"""[\s\S]*?"""\n/, "")
		: src.replace(/^\/\*\*[\s\S]*?\*\/\n/, "");
	if (stripped === src) throw new Error(`no header found in ${file}`);
	fs.writeFileSync(file, stripped);
}

const RAIL = {
	typescript: [
		"tests/requirements-trace.ts",
		"tests/requirements-trace.test.ts",
		"tests/code-map.test.ts",
		"tests/readme-check.test.ts",
	],
	python: [
		"tests/conftest.py",
		"tests/test_requirements_trace.py",
		"tests/test_code_map.py",
		"tests/test_readme_check.py",
	],
};

const LANGS = {
	typescript: {
		answers: { project_name: "Tpl TS", description: "A rendered TypeScript project." },
		scaffoldOnly: ["src/index.ts", "tests/smoke.test.ts", "tests/AGENTS.md", "README.md"],
		files: [
			"REQUIREMENTS.md",
			"code-map.config.json",
			"scripts/code-map.mjs",
			"scripts/readme-check.mjs",
			"docs/code-map.md",
		],
		checkCmd: [process.execPath, ["scripts/code-map.mjs", "--check"]],
		writeCmd: [process.execPath, ["scripts/code-map.mjs"]],
		marker: "// req: R-001",
		markerIn: "tests/smoke.test.ts",
		headerDropIn: "tests/smoke.test.ts",
		markedRail: "tests/code-map.test.ts",
		readmeCmd: [process.execPath, ["scripts/readme-check.mjs"]],
		readmeMutations: [
			["a command that is not a script", "pnpm build", "pnpm nope", "'pnpm nope' is not a script in package.json"],
			["a path that does not exist", "code-map.config.json", "code-map.gone.json", "'code-map.gone.json' does not exist"],
			["a missing test section", "## Test", "## Afterword", "no heading for how to test it"],
			["an undocumented script", "pnpm format", "pnpm lint", "script 'format' is not documented in any README"],
		],
	},
	python: {
		answers: { project_name: "Tpl PY", description: "A rendered Python project.", package_name: "tpl_py" },
		scaffoldOnly: ["src/tpl_py/__init__.py", "tests/test_smoke.py", "tests/AGENTS.md", "README.md"],
		files: [
			"REQUIREMENTS.md",
			"code-map.config.json",
			"scripts/code_map.py",
			"scripts/readme_check.py",
			"docs/code-map.md",
		],
		checkCmd: ["python3", ["scripts/code_map.py", "--check"]],
		writeCmd: ["python3", ["scripts/code_map.py"]],
		marker: "# req: R-001",
		markerIn: "tests/test_smoke.py",
		headerDropIn: "tests/test_smoke.py",
		markedRail: "tests/test_code_map.py",
		readmeCmd: ["python3", ["scripts/readme_check.py"]],
		readmeMutations: [
			["a command naming a file that is gone", "scripts/code_map.py", "scripts/gone.py", "'scripts/gone.py' does not exist"],
			["a path that does not exist", "code-map.config.json", "code-map.gone.json", "'code-map.gone.json' does not exist"],
			["a missing test section", "## Test", "## Afterword", "no heading for how to test it"],
			["an undocumented script", "scripts/readme_check.py", "scripts/code_map.py", "script 'readme_check.py' is not documented in any README"],
		],
	},
};

/**
 * The Part G block arrived through the shared include with its ids unrenumbered: the SET of
 * ids is exactly G-001..G-022, each appearing once. R-737 promises stable ids, not table
 * order — astra r1 MUST 3 ruled the explicit split-placement rule wins (directly after the
 * origin), so split-born rows now sit interleaved among G1-G4, not in sequence; the check
 * below compares SORTED arrays and keeps its own duplicate check, rather than requiring the
 * unsorted array to already read G-001, G-002, G-003, ….
 */
function partG(language, dest, mode) {
	const reqs = fs.readFileSync(path.join(dest, "REQUIREMENTS.md"), "utf-8");
	const gIds = [...reqs.matchAll(/^\|\s*(G-(?:[0-9]{3}|[1-9][0-9]{3}))\s*\|/gm)].map((m) => m[1]);
	const wantG = Array.from({ length: 22 }, (_, i) => `G-${String(i + 1).padStart(3, "0")}`);
	const noDupes = gIds.length === new Set(gIds).size;
	const sorted = [...gIds].sort();
	// req: R-737
	check(`${language} ${mode}: Part G ships G-001..G-022 unrenumbered`,
		noDupes && `${sorted}` === `${wantG}`,
		`got ${gIds} (sorted ${sorted}, duplicates: ${!noDupes})`);
	// req: R-737
	check(`${language} ${mode}: no jinja survives into REQUIREMENTS.md`, !/\{[{%]/.test(reqs), "an unrendered tag is left");
	// req: R-1153
	check(`${language} ${mode}: REQUIREMENTS.md's organization section comes from the one shared source`,
		reqs.split(SHARED_ORGANIZATION).length - 1 === 1,
		"the organization text is missing, altered or duplicated");
	return reqs;
}

const CHECKER_SKILL_CMD = 'node "$HOME/nana-pi/scripts/requirements-tree.mjs" --root .';
const REPORT_SKILL_CMD = 'node "$HOME/nana-pi/scripts/product-report.mjs" --root .';
const LIFT_SKILL_CMD = 'node "$HOME/nana-pi/scripts/requirements-lift.mjs" --root .';
const LIFT_SCRIPT = "scripts/requirements-lift.mjs";
const REGROUP_SKILL_CMD = 'node "$HOME/nana-pi/scripts/requirements-regroup.mjs" --root . --proposal <file> --out <page>';
const REGROUP_SCRIPT = "scripts/requirements-regroup.mjs";
// R-1153: the "How this file is organized" section is single-sourced from this file and
// pulled into both languages, both modes, with a Jinja include — never hand-duplicated.
const SHARED_ORGANIZATION = fs.readFileSync(path.join(REPO, "templates", "_shared", "requirements-organization.md"), "utf-8");
const collapse = (s) => (s ?? "").replace(/\s+/g, " ");

/** R-1150 to R-1153: the rendered REQUIREMENTS.md starts life as a requirements tree. */
function treeChecks(language, mode, reqs) {
	const tree = checkTree(reqs);
	const caps = tree.parsed.headings.filter((h) => h.id?.startsWith("CAP-"));
	const feats = tree.parsed.headings.filter((h) => h.id?.startsWith("FEAT-"));
	// req: R-1150
	check(`${language} ${mode}: REQUIREMENTS.md passes the requirements tree checker`,
		tree.problems.length === 0 && caps.some((h) => h.id !== "CAP-90") && feats.some((h) => h.id !== "FEAT-900"),
		tree.problems.join("; "));

	const feat900 = tree.parsed.headings.find((h) => h.id === "FEAT-900");
	const under900 = (heading) => { for (let h = heading; h; h = h.parent) if (h === feat900) return true; return false; };
	const rows = readRequirementRows(tree.parsed);
	const gRows = rows.filter((r) => r.id.startsWith("G-"));
	const rRows = rows.filter((r) => r.id.startsWith("R-"));
	const RESERVED_SUBGROUPS = ["SUB-900", "SUB-901", "SUB-902", "SUB-903", "SUB-904"];
	const subgroups = tree.parsed.headings.filter((h) => h.parent === feat900).map((h) => h.id);
	// req: R-1151
	check(`${language} ${mode}: every G row is homed in FEAT-900 under CAP-90 with no R row`,
		Boolean(feat900) && feat900.parent?.id === "CAP-90" && gRows.length === 22 && gRows.every((r) => under900(r.heading)) && !rRows.some((r) => under900(r.heading)) &&
		[...subgroups].sort().join(",") === RESERVED_SUBGROUPS.join(",") && gRows.every((r) => RESERVED_SUBGROUPS.includes(r.heading?.id)),
		`feat900=${feat900?.id} parent=${feat900?.parent?.id} gRows=${gRows.length} strayR=${rRows.filter((r) => under900(r.heading)).map((r) => r.id)} subgroups=${subgroups.join(",")}`);

	if (mode === "adopt") {
		const productFeat = feats.find((h) => h.id !== "FEAT-900");
		const productRows = rows.filter((r) => { for (let h = r.heading; h; h = h.parent) if (h === productFeat) return true; return false; });
		// req: R-1152
		check(`${language} adopt: the product feature is proposed and holds no row`,
			Boolean(productFeat) && productFeat.status === "proposed" && productRows.length === 0,
			`${productFeat?.id}: status=${productFeat?.status} rows=${productRows.length}`);
	}

	const flat = collapse(reqs);
	// req: R-1153
	check(`${language} ${mode}: REQUIREMENTS.md says how rows are grouped, where a new row goes, who decides and how to check`,
		["capability → feature → subgroup", "Add each new row to the table of the feature it serves", "The project owner decides every change to the tree", CHECKER_SKILL_CMD].every((p) => flat.includes(p)),
		flat.slice(0, 200));
}

/**
 * The Requirement cell text of every G-id in templates/_shared/requirements-general.md,
 * stripped of the Jinja `{%- set -%}` statement lines (which produce no output and carry
 * no `|`-delimited row shape).
 */
function sharedPartGRequirementText() {
	const shared = fs.readFileSync(path.join(REPO, "templates", "_shared", "requirements-general.md"), "utf-8");
	const text = new Map();
	for (const m of shared.matchAll(/^\|\s*(G-(?:[0-9]{3}|[1-9][0-9]{3}))\s*\|([^|]+)\|/gm)) text.set(m[1], m[2].trim());
	return text;
}

/** R-756: nana-pi's own Part G Requirement cells must read byte-identical to the shared file's. */
function checkNanaPiPartGMirrorsTheSharedFile() {
	const nanaPi = fs.readFileSync(path.join(REPO, "REQUIREMENTS.md"), "utf-8");
	const own = new Map();
	for (const m of nanaPi.matchAll(/^\|\s*(G-(?:[0-9]{3}|[1-9][0-9]{3}))\s*\|([^|]+)\|/gm)) own.set(m[1], m[2].trim());
	const shared = sharedPartGRequirementText();
	const mismatched = [...shared].filter(([id, text]) => own.get(id) !== text).map(([id]) => id);
	// req: R-756
	check("nana-pi Part G mirrors templates/_shared/requirements-general.md",
		mismatched.length === 0,
		`mismatched: ${mismatched}`,
	);
}
checkNanaPiPartGMirrorsTheSharedFile();

/** Extracts the exact bytes owned by the shared-section markers. */
function markerBlock(text) {
	const begin = "<!-- nana:working-under-nana-pi begin -->\n";
	const end = "\n<!-- nana:working-under-nana-pi end -->";
	const start = text.indexOf(begin);
	const stop = text.indexOf(end, start + begin.length);
	return start < 0 || stop < 0 ? null : text.slice(start + begin.length, stop + 1);
}

function checkAgentsMdMirrorsWorkingUnderNanaPi() {
	const agents = fs.readFileSync(path.join(REPO, "AGENTS.md"), "utf-8");
	const shared = fs.readFileSync(path.join(REPO, "templates", "_shared", "working-under-nana-pi.md"), "utf-8");
	const block = markerBlock(agents);
	// req: R-859
	check("AGENTS.md marker-owned section is byte-identical to the shared file", block === shared);
	const prefix = agents.slice(0, agents.indexOf("<!-- nana:working-under-nana-pi begin -->"));
	const paragraph = prefix.trimEnd().split(/\n\s*\n/).at(-1) ?? "";
	// req: R-859
	check("AGENTS.md shared section follows a complete paragraph", prefix.endsWith("\n\n") && /[.!?]$/.test(paragraph));
	// req: R-966
	check("working pattern names lane launcher and keeps local overrides after marker region", block.includes("pi-worker --lane <name> --brief <file>") && block.includes("overrides belong in that project's own section AFTER this marker region"));
	const packReadme = fs.readFileSync(path.join(REPO, "packages", "nana-pack", "README.md"), "utf8");
	// req: R-966
	check("pack README documents lane preamble, write gap, ceiling, and trust notice", packReadme.includes("prompts/builder-preamble.md") && packReadme.includes("bash or another process") && packReadme.includes("28,800 seconds") && packReadme.includes("trust: none for"));

	// Mutation, in memory only (the real AGENTS.md is never touched): dropping one byte from the middle
	// of the marker region (both markers intact) must flip the SAME predicate, proving the check is live rather than vacuously true.
	const at = agents.indexOf("<!-- nana:working-under-nana-pi begin -->\n") + "<!-- nana:working-under-nana-pi begin -->\n".length + 10;
	const mutated = agents.slice(0, at) + agents.slice(at + 1);
	// req: R-859
	check("…and a one-byte drift is caught, not silently passed (mutation)", markerBlock(mutated) !== shared);
}
checkAgentsMdMirrorsWorkingUnderNanaPi();

const RUNTIME_INVENTORY_TEXT = {
	"nana-objective.mjs": "nana-objective.mjs",
	"nana-adoption.mjs": "nana-adoption.mjs",
	"nana-shared-memory.mjs": "nana-shared-memory.mjs",
	"verifier-pipe.mjs": "verifier-pipe.mjs",
	"nana-knowledge.ts hook": "nana-knowledge.ts hook",
	"nana-objective": "`nana-objective`",
	"nana-writing": "`nana-writing`",
	"nana-notify": "`nana-notify`",
	"nana-lifecycle": "`nana-lifecycle`",
	"nana-gate": "`nana-gate`",
	"nana-post-edit": "`nana-post-edit`",
	"nana-handoff": "`nana-handoff`",
	"nana-knowledge": "`nana-knowledge`",
	"nana-roster-notice.mjs": "nana-roster-notice.mjs",
	"nana-roster-notice": "`nana-roster-notice`",
};

function runtimeInventory() {
	const hooks = desiredHooks({ hooksDir: "/hooks", repoRoot: REPO }).map(({ marker }) => marker);
	const extensions = ["packages/nana-pack/extensions", "packages/nana-knowledge/extensions"]
		.flatMap((directory) => fs.readdirSync(path.join(REPO, directory), { withFileTypes: true })
			.filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
			.map((entry) => path.basename(entry.name, ".ts")));
	return [...hooks, ...extensions];
}

function runtimeInventoryDocumented(inventory, matrix) {
	return inventory.every((item) => RUNTIME_INVENTORY_TEXT[item] && matrix.includes(RUNTIME_INVENTORY_TEXT[item]));
}

function startupRequirementsScopeValid(text) {
	return text.split(/(?<=[.!?])\s+|\n+/).every((sentence) => {
		if (!/REQUIREMENTS\.md/i.test(sentence) || !/\b(?:read|open|consult|load)\b/i.test(sentence)) return true;
		return /\b(?:affected\s+rows?|rows?\s+by\s+ID|by\s+ID|grep|lookup|requirements skill)\b/i.test(sentence);
	});
}

function hasBroadWindowsParity(text) {
	return /\b(?:everything|all)\b.{0,60}\b(?:works?|working|supported|parity)\b.{0,60}\b(?:PowerShell|cmd|Windows)\b/i.test(text);
}

function checkInstructionContracts() {
	const shared = fs.readFileSync(path.join(REPO, "templates", "_shared", "working-under-nana-pi.md"), "utf-8");
	const soul = fs.readFileSync(path.join(REPO, "packages/nana-setup/claude/rules/nana-soul.md"), "utf-8");
	const desk = fs.readFileSync(path.join(REPO, "apps/desk/README.md"), "utf-8");
	const frontDoors = ["README.md", "AGENTS.md", "packages/nana-setup/README.md"].map((file) =>
		fs.readFileSync(path.join(REPO, file), "utf-8"));
	const support = frontDoors.map((text) => [...text.matchAll(/^Support:.*$/gm)].map((match) => match[0]));
	// req: R-680 R-985
	check("shared runtime matrix declares four runtime surfaces, ten capabilities, and the discovered source inventory",
		runtimeInventoryDocumented(runtimeInventory(), shared) && !runtimeInventoryDocumented([...runtimeInventory(), "unmapped-extension-fixture"], shared) &&
		["Claude Code seat", "pi TUI or desk", "pi reviewer/worker child", "Codex"].every((v) => shared.includes(v)) &&
		["Objective", "Shared memory", "nana-soul / nana-standards", "Writing rule", "Knowledge pull", "Gate", "Verifier pipe", "Post-edit", "Compaction summary", "Notify"].every((v) => shared.includes(v)) &&
		[
			"| Claude Code seat | SessionStart `nana-objective.mjs` and `nana-adoption.mjs` hooks | `nana-shared-memory.mjs` hook; Claude shared-memory index and auto-memory | Both Claude rules | Shared nana-writing rule | UserPromptSubmit `nana-knowledge.ts hook` | No nana command gate | PreToolUse Node hook `verifier-pipe.mjs` (matcher `Bash` on macOS and Linux, `Bash\\|PowerShell` on Windows) | No nana per-edit checks | Claude-owned summary; no nana HANDOFF producer | No nana notify; SessionStart `nana-roster-notice.mjs` hook shows the roster notice |",
			"| pi TUI or desk session | `nana-objective` extension | No shared auto-memory | Neither rule; requirements-first arrives through AGENTS and the requirements skill | `nana-writing` extension | `nana-knowledge` extension (`before_agent_start`) | `nana-gate` extension | `nana-gate` shared predicate for bash and PowerShell | `nana-post-edit` extension; configured checks, if any | `nana-lifecycle` journal; `nana-handoff` extension on compaction | `nana-notify` extension; `nana-roster-notice` extension shows the roster notice as a widget |",
			"| pi reviewer/worker child (`NANA_HANDOFF=off`) | `nana-objective` extension | No shared auto-memory | Neither rule | `nana-writing` extension | Disabled by `NANA_ROLE=reviewer` or `NANA_ROLE=worker` | `nana-gate` extension | `nana-gate` shared predicate for bash and PowerShell | `nana-post-edit` extension; configured checks, if any | Disabled by `NANA_HANDOFF=off` | `nana-notify` extension; `nana-roster-notice` extension runs but shows nothing (no UI) |",
			"| Codex | Unsupported; no nana runtime contract | Not specified | Not specified | Not specified | Not specified | Not specified | Not specified | Not specified | Not specified | Not specified |",
		].every((v) => shared.includes(v)));

	const startup = "At startup, read `HANDOFF.md`, look up affected `REQUIREMENTS.md` rows by ID (grep or the requirements skill), and read the landscape doc only for pi API questions.";
	const rootStartup = "Startup: read `HANDOFF.md`; look up only affected `REQUIREMENTS.md` rows by ID (grep or requirements skill). Read the landscape document only for pi API questions.";
	const startupFiles = [
		shared,
		fs.readFileSync(path.join(REPO, "AGENTS.md"), "utf-8"),
		fs.readFileSync(path.join(REPO, "templates/python/template/AGENTS.md.jinja"), "utf-8"),
		fs.readFileSync(path.join(REPO, "templates/typescript/template/AGENTS.md.jinja"), "utf-8"),
	];
	const contradictoryStartup = `${shared}\nAt startup, read REQUIREMENTS.md.`;
	// req: R-681
	check("startup guidance scopes every requirements read to row lookup", shared.includes(startup) && startupFiles[1].includes(rootStartup) && startupFiles.every(startupRequirementsScopeValid) && !startupRequirementsScopeValid(contradictoryStartup));
	// req: R-682
	check("soul continuity rule records carry before reports and session boundaries", /Before an OPEN, YOUR CALL, or BLOCKED final report/.test(soul) && /every unresolved item and every open question to Jake on one HANDOFF line each/.test(soul) && /before `\/clear` or ending a session/.test(soul) && /no unrecorded carry/.test(soul));
	// req: R-683
	check("shared working pattern names generic defaults and local overrides", ["~/<repo>-wt/<lane>", "feat/<lane>", "docs/reviews/<lane>-<date>/", "pi-worker", "pi-review", "three rounds", "different model lineage", "Land checklist", "overrides belong in that project's own section AFTER this marker region"].every((v) => shared.includes(v)));
	const competingWindowsClaim = `${frontDoors[0]}\neverything here works in PowerShell or cmd`;
	const canonicalSupport = `Support: macOS tested; Linux and Windows run in hosted CI, where their suite legs are non-blocking; Linux has no recorded machine install; on Windows the Claude Code hooks run from the checkout and need Claude Code ${CLAUDE_CODE_EXEC_FLOOR} or later, none of the pack's PATH commands are linked, and the review and builder launchers run through node from the checkout with an npm-installed pi; launchd is macOS-only.`;
	// req: R-684
	check("three front doors carry one identical scoped platform claim", support.every((lines) => lines.length === 1 && lines[0] === canonicalSupport) && !frontDoors.some(hasBroadWindowsParity) && hasBroadWindowsParity(competingWindowsClaim));
	// req: R-1126
	check("shared working pattern makes the pattern the default with the machine roster",
		shared.includes("a change that touches code with tests goes through the pattern") &&
		shared.includes("questions and one-line fixes get a direct answer") &&
		shared.includes('node "$HOME/nana-pi/packages/nana-pack/bin/nana-roster.mjs"') &&
		shared.includes('node "$HOME/nana-pi/packages/nana-pack/bin/pi-worker.mjs"') &&
		shared.includes('node "$HOME/nana-pi/packages/nana-pack/bin/pi-review.mjs"'));
	// req: R-1127
	check("R-1127: the shared seat land review applies in an install, hook or gate lane when the roster sets no land model",
		shared.includes("in an install, hook or gate lane, when the roster sets no land model") &&
		shared.includes("docs/reviews/<lane>-<date>/seat-land.md") &&
		shared.includes("before the final round") &&
		shared.includes("the independent slice review still covers every land"));
	// R-1128 reads the two bullets from the shared file itself (not a literal copy in this test), so
	// an edit to the shared file's bullet text that the R-1126/R-1127 title checks do not cover still
	// shows nana-soul stale: the extracted bullet changes while nana-soul's copy does not.
	const sharedBullet = (label) => { const m = new RegExp(`^- ${label}:.*$`, "m").exec(shared); return m ? m[0] : null; };
	const defaultPatternBullet = sharedBullet("Default pattern");
	const seatLandBullet = sharedBullet("Seat land review");
	// req: R-1128
	check("nana-soul carries the shared default-pattern and seat land review bullets",
		Boolean(defaultPatternBullet) && Boolean(seatLandBullet) &&
		soul.replace(/\r/g, "").includes(defaultPatternBullet) && soul.replace(/\r/g, "").includes(seatLandBullet));
	const SEAT_GUIDE_POINTER = "- Seat guide: while a builder or reviewer runs, the seat does not read or judge its partial work, and it acts when the run completes. The full guide is `$HOME/nana-pi/packages/nana-setup/claude/rules/nana-seat.md`; Claude Code loads it as a rule.";
	const seatGuideBullets = [...shared.matchAll(/^- Seat guide:.*$/gm)].map((m) => m[0]);
	// req: R-1142
	check("shared working pattern carries one seat-guide bullet",
		seatGuideBullets.length === 1 && seatGuideBullets[0] === SEAT_GUIDE_POINTER,
		JSON.stringify(seatGuideBullets));
	const seatGuideNamedPath = /`\$HOME\/nana-pi\/([^`]+)`/.exec(seatGuideBullets[0] ?? "")?.[1] ?? null;
	// req: R-1142
	check("seat-guide bullet names a guide file present in this checkout",
		seatGuideNamedPath !== null && fs.existsSync(path.join(REPO, seatGuideNamedPath)),
		seatGuideNamedPath ?? "no bullet found");
	const largerLanesBullets = [...shared.matchAll(/^- Larger lanes:.*$/gm)].map((m) => m[0]);
	// req: R-1193
	check("shared working pattern sends a larger or riskier lane to the roster's larger-lane builder, a pi entry through lane size larger and a Claude Code entry as a subagent in the lane worktree",
		largerLanesBullets.length === 1 &&
		largerLanesBullets[0].includes("pi-worker --lane-size larger") &&
		largerLanesBullets[0].includes("a Claude Code entry as a Claude Code subagent in the lane worktree") &&
		largerLanesBullets[0].includes("pi-worker --lane-size small") &&
		// the routing itself, not just the three substrings in any order or attribution — an
		// inverted bullet (swapped entry kinds, or swapped lane sizes) must fail this.
		/a pi entry through `pi-worker --lane-size larger`,\s*a Claude Code entry as a Claude Code subagent in the lane worktree;\s*a small lane goes through `pi-worker --lane-size small`/.test(largerLanesBullets[0]),
		JSON.stringify(largerLanesBullets));
	// req: R-1213
	check("shared working pattern says a seat that cannot start the larger-lane builder stops and asks the user",
		largerLanesBullets.length === 1 && largerLanesBullets[0].includes("stops and asks the user rather than starting another") &&
		// the trigger, not only the consequence: it must be a seat that CANNOT START the builder.
		/A seat that cannot start that builder stops and asks the user rather than starting another\./.test(largerLanesBullets[0]),
		JSON.stringify(largerLanesBullets));
	// req: R-1214
	check("shared working pattern says the builder builds every lane when the roster sets no larger-lane builder",
		largerLanesBullets.length === 1 && largerLanesBullets[0].includes("With no `largerBuilder`, the builder builds every lane."),
		JSON.stringify(largerLanesBullets));
	// req: R-685
	check("desk matrix states nana resources for every spawn class and the terminal trust step",
		desk.includes("Default desk spawn | Pi defaults: installed skills and extensions, including nana-pack where installed. Objective, writing, knowledge, gate, post-edit, handoff, lifecycle, notify, and roster notice are present only when their extensions are installed and loaded.") &&
		desk.includes("Narrowed desk spawn | Only checked skills and extensions are passed; `--no-skills` / `--no-extensions` disables the rest, including nana-pack unless explicitly re-added. Each nana surface (objective, writing, knowledge, gate, post-edit, handoff, lifecycle, notify, roster notice) is available only if its extension is in the checked set.") &&
		desk.includes("Current basketball and edge children list their app extension, nana-stage, and builtin MCP, not nana-pack: they receive no objective, writing, knowledge, gate, post-edit, handoff, lifecycle, notify, or roster notice unless a manifest explicitly lists the relevant extension.") &&
		desk.includes("`/trust` is TUI-only: open the project in pi's terminal, run `/trust`, then restart the session."));
	// req: R-1100
	check("shared working pattern requires a threat model per plan",
		shared.includes("Every plan names its threat model") &&
		shared.includes("honest variation in our tools' output is in scope") &&
		shared.includes("deliberate forgery is out") &&
		shared.includes("a finding outside the model is a residual"));
	// req: R-1101
	// req: R-1300
	check("R-1300: the shared working pattern gives an ordinary lane one final reviewer, defines install, hook and gate lanes, and says plans get no review round",
		shared.includes("Review ladder: an ordinary lane gets one final reviewer, the roster's reviewer.") &&
		shared.includes("An install, hook or gate lane also gets the land reviewer, the seat's wrong-code pairs and one independent check.") &&
		shared.includes("An install, hook or gate lane changes nana-setup install, uninstall or doctor") &&
		shared.includes("Plans get no review round") && !shared.includes("plan-review round") && !shared.includes("only a named fail-open bug reopens the plan"));
	// req: R-1102
	check("shared working pattern freezes edits after an all-LAND review",
		shared.includes("Once every reviewer says LAND, nothing more is edited"));
	// req: R-1103
	check("shared working pattern ships urgent fixes alone",
		shared.includes("Urgent fixes ship alone and are hardened in a later lane"));
	// req: R-1104
	check("shared working pattern states the review bar for seats",
		shared.includes("`pi-review` appends the review standard to every review it runs") &&
		shared.includes("A review with no MUST finding says LAND") &&
		shared.includes("LAND-WITH-FIXES is retired") &&
		shared.includes("A confirmation round reviews only the change since the last round"));
	const agentsMd = frontDoors[1];
	const sharedBegin = "<!-- nana:working-under-nana-pi begin -->";
	const sharedEnd = "<!-- nana:working-under-nana-pi end -->";
	const sb = agentsMd.indexOf(sharedBegin), se = agentsMd.indexOf(sharedEnd);
	const insideSharedRegion = sb >= 0 && se >= 0 ? agentsMd.slice(sb, se) : "";
	const outsideSharedRegion = sb < 0 || se < 0 ? agentsMd : agentsMd.slice(0, sb) + agentsMd.slice(se + sharedEnd.length);
	// req: R-1109
	check("AGENTS.md carries the macOS install check outside the shared region",
		// one step, scoped to its own line (seat mutation run 2026-10-13: phrases matched anywhere outside the region
		// let "on macOS", "before `nana-land`" and "or a hook" be deleted with this check green)
		outsideSharedRegion.replace(/\r/g, "").split("\n").filter((line) => line.startsWith("Land checklist, nana-pi only (Jake, 2026-10-12): ")).length === 1 &&
		outsideSharedRegion.replace(/\r/g, "").split("\n").some((line) =>
			line.startsWith("Land checklist, nana-pi only (Jake, 2026-10-12): ") &&
			line.includes("a lane that touches `packages/nana-setup/` or a hook runs `node packages/nana-setup/bin/install-check.mjs` locally on macOS before `nana-land`")) &&
		!/install[- ]check/i.test(insideSharedRegion) &&
		fs.existsSync(path.join(REPO, "packages/nana-setup/bin/install-check.mjs")));
}
checkInstructionContracts();

/** R-1154 to R-1156: the skills that author REQUIREMENTS.md point at the tree, not the flat sections. */
function checkRequirementsSkillTreeText() {
	const CARVE = "A ledger without a requirements tree keeps its numbered sections; its next step is a lift into the tree, with every row kept byte-identical, then a regroup into capabilities and features that the owner approves.";
	const reqSkill = collapse(fs.readFileSync(path.join(REPO, "packages/nana-pack/skills/requirements/SKILL.md"), "utf8"));
	// req: R-1154
	check("requirements skill directs every row into the feature it serves, keeps a flat ledger's sections and names the owner",
		["The project owner decides every change to the tree", "the table of the feature it serves", CARVE].every((p) => reqSkill.includes(p)) &&
		!["Jake decides", "In this ledger,", "the numbered sections the worker must cover", "at the end as its own Part"].some((p) => reqSkill.includes(p)));
	const FIVE = ["scaffold-py", "scaffold-ts", "adopt-py", "adopt-ts", "adopt-structure"];
	// req: R-1155
	check("scaffold and adopt skills direct rows into the feature each serves, keep a flat ledger's sections and name no Part G",
		FIVE.every((name) => {
			const t = collapse(fs.readFileSync(path.join(REPO, "packages/nana-pack/skills", name, "SKILL.md"), "utf8"));
			return t.includes("the table of the feature it serves") && t.includes(CARVE) && !t.includes("Part G");
		}));
	// req: R-1156
	check("requirements skill names the tree check and the product report with a project root",
		[CHECKER_SKILL_CMD, REPORT_SKILL_CMD].every((p) => reqSkill.includes(p)));
	// req: R-1169
	check("requirements skill names the lift's dry run, the owner's yes before --write, a clean ledger in every worktree, never discarding another session's lines, and only flags the lift has",
		checkLiftSkillText(reqSkill));
	// req: R-1180
	check("requirements skill's regroup paragraph names the regroup check, what the agent reads, a review of every placement and every purpose, outcome and section reason, the owner's yes before --write, --verify with --mapping and gaps as proposed features, and only flags the regroup has",
		checkRegroupSkillText());
}

/**
 * R-1180: the requirements skill's description names "regroup", one paragraph holds the regroup
 * check as `node "$HOME/nana-pi/scripts/requirements-regroup.mjs" --root . --proposal <file>
 * --out <page>`, what the agent reads, that a reviewer of another model lineage (or a
 * same-family reviewer named as such) checks every row's placement and every purpose, outcome
 * and section reason before the owner sees the page, that `--write` runs only after the owner's
 * yes with the proposal committed, the reviewer's `--verify <base> --mapping <proposal>`, a gap
 * as a `proposed` feature with no rows, the old "name no regroup command" clause is gone, and
 * the paragraph shows no flag outside the regroup's or the lift's own source (T17's own phrase
 * check mirrors the acceptance oracle so a wrapped line cannot hide one).
 */
function checkRegroupSkillText() {
	const skillRaw = fs.readFileSync(path.join(REPO, "packages/nana-pack/skills/requirements/SKILL.md"), "utf8");
	const reqSkill = collapse(skillRaw);
	const frontmatter = skillRaw.split(/^---$/m)[1] ?? "";
	const description = /^description:(.*)$/m.exec(frontmatter)?.[1] ?? "";
	if (!/\bregroup\b/i.test(description)) return false;
	if (reqSkill.includes("name no regroup command")) return false;
	if (reqSkill.includes("Regroup the lifted tree")) return false;
	const paras = skillRaw.split(/\n\s*\n/);
	const rgParas = paras.filter((p) => collapse(p).includes(REGROUP_SKILL_CMD));
	if (rgParas.length !== 1) return false;
	const para = collapse(rgParas[0]);
	const phrases = [
		"every row's placement", "every purpose, outcome and section reason", "lineage", "same-family",
		"only after the owner's yes", "--write", "committed", "--verify <base> --mapping <proposal>", "proposed", "with no rows",
		"req:", "@purpose", "code map", "README", "OBJECTIVE.md", "HANDOFF",
		"flat or lifted", "regroup.read", "regroup.reasons", "regroup.placed", "regroup.evidence", "regroup.review",
	];
	if (!phrases.every((p) => para.includes(p))) return false;
	if ((para.match(/--verify <base>(?! --mapping)/g) ?? []).length > 0) return false;
	const FLAG = /(?<![\w-])--[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?![\w-])/g;
	const wholeFlag = (src, f) => new RegExp(`(?<![\\w-])${f}(?![\\w-])`).test(src ?? "");
	const regroupSource = fs.readFileSync(path.join(REPO, REGROUP_SCRIPT), "utf8");
	const liftSource = fs.readFileSync(path.join(REPO, LIFT_SCRIPT), "utf8");
	const spans = [...rgParas[0].matchAll(/`([^`]+)`/g)].map((m) => m[1]);
	const inSpan = [...new Set(spans.filter((s) => s.includes("requirements-regroup.mjs")).flatMap((s) => s.match(FLAG) ?? []))];
	const outside = [...new Set([...spans.filter((s) => !s.includes("requirements-regroup.mjs") && (s.includes("requirements-lift.mjs") || !/\.(?:mjs|cjs|js|ts|py)\b/.test(s))), rgParas[0].replace(/`[^`]*`/g, " ")].flatMap((s) => s.match(FLAG) ?? []))];
	if (!["--root", "--proposal", "--out"].every((f) => inSpan.includes(f))) return false;
	if (!inSpan.every((f) => wholeFlag(regroupSource, f))) return false;
	if (!outside.every((f) => wholeFlag(liftSource, f))) return false;
	return true;
}

/**
 * R-1169: the requirements skill names the lift's dry run exactly, says --write runs only after
 * the owner's yes while the ledger matches HEAD in every worktree, says the seat tells the owner
 * about uncommitted edits and never discards another session's lines, and shows the lift no flag
 * its own source lacks (seat-titles.mjs T29; the collapsed-whitespace phrases mirror the acceptance
 * oracle so a wrapped line cannot hide one).
 */
function checkLiftSkillText(reqSkill) {
	const phrases = [LIFT_SKILL_CMD, "only after the owner's yes", "matches HEAD in every worktree", "never commit, stash or discard another session's lines"];
	if (!phrases.every((p) => reqSkill.includes(p))) return false;
	if (!/uncommitted[^.]*\btell the owner\b/i.test(reqSkill) && !/\breports? uncommitted ledger edits to the owner\b/i.test(reqSkill)) return false;
	const liftSource = fs.readFileSync(path.join(REPO, LIFT_SCRIPT), "utf8");
	const skillRaw = fs.readFileSync(path.join(REPO, "packages/nana-pack/skills/requirements/SKILL.md"), "utf8");
	const FLAG = /(?<![\w-])--[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?![\w-])/g;
	const liftParas = skillRaw.split(/\n\s*\n/).filter((p) => /requirements-lift\.mjs|\blift\b/i.test(p));
	const liftFlags = [...new Set(liftParas.flatMap((p) => {
		const spans = [...p.matchAll(/`([^`]+)`/g)].map((m) => m[1]).filter((s) => s.includes("requirements-lift.mjs") || !/\.(?:mjs|cjs|js|ts|py)\b/.test(s));
		return [...spans, p.replace(/`[^`]*`/g, " ")].flatMap((s) => s.match(FLAG) ?? []);
	}))];
	if (!liftFlags.includes("--root") || !liftFlags.includes("--write")) return false;
	const wholeFlag = (f) => new RegExp(`(?<![\\w-])${f}(?![\\w-])`).test(liftSource);
	return liftFlags.every(wholeFlag);
}
checkRequirementsSkillTreeText();

const version = copierAvailable();
if (!version) {
	const required = process.env.NANA_TEST_REQUIRE_COPIER === "1";
	for (const surface of Object.keys(SURFACES)) {
		if (required) check(surface, false, "NANA_TEST_REQUIRE_COPIER=1 but uvx copier is unavailable");
		else skip(surface, "uvx copier unavailable");
	}
	for (const language of Object.keys(LANGS)) {
		const title = `${language}: renders and the code map checks`;
		if (required) check(title, false, "NANA_TEST_REQUIRE_COPIER=1 but uvx copier is unavailable");
		else skip(title, "uvx copier is not available on this machine");
	}
} else {
	let crlfOk = true;
	const crlfWhy = [];
	for (const [language, spec] of Object.entries(LANGS)) {
		// ---------------------------------------------------------------- scaffold
		const { dest, ok, out: log } = render(language, { ...spec.answers, adopt: "false" });
		try {
			// req: R-737
			check(`${language}: copier renders the template`, ok, log.slice(-800));
			if (!ok) continue;
			if (language === "python") {
				const cp1252 = runCp1252(dest);
				if (!cp1252.available) {
					const title = `${language} scaffold: requirements-trace, code-map and readme-check tests pass under a cp1252 Python environment`;
					if (process.env.NANA_TEST_REQUIRE_COPIER === "1") check(title, false, "NANA_TEST_REQUIRE_COPIER=1 but uvx could not resolve pytest");
					else skip(title, "uvx could not resolve pytest");
				} else {
					// req: R-1360
					check(`${language} scaffold: requirements-trace, code-map and readme-check tests pass under a cp1252 Python environment`, cp1252.ok, cp1252.tail);
				}
			}
			const currentTarget = { name: `${language}-scaffold`, root: dest };
			const declaredKey = `${language}-scaffold`;
			const sharedText = fs.readFileSync(path.join(REPO, "templates/_shared/working-under-nana-pi.md"), "utf8");
			if (language === "python") {
				const requirementsText = fs.readFileSync(path.join(REPO, "packages/nana-pack/skills/requirements/SKILL.md"), "utf8");
				// req: R-629
				check("requirements: a misspelled code-map flag is rejected", judgeClaims({ surface: "requirements", root: REPO, targets: [currentTarget], text: requirementsText.replace("scripts/code_map.py --impact", "scripts/code_map.py --impakt") }).flagProblems.some((p) => p.includes("--impakt")));
			}
			const skillNames = Object.keys(SURFACES).filter((name) => name !== "templates/_shared/working-under-nana-pi.md" && SURFACES[name].includes(declaredKey));
			const allSkillClaimProblems = { paths: [], commands: [], flags: [] };
			for (const surface of [...skillNames, "templates/_shared/working-under-nana-pi.md"]) {
				const text = surface === "templates/_shared/working-under-nana-pi.md"
					? sharedText
					: fs.readFileSync(path.join(REPO, "packages/nana-pack/skills", surface, "SKILL.md"), "utf8");
				const result = judgeClaims({ surface, root: REPO, targets: [currentTarget], text });
				allSkillClaimProblems.paths.push(...result.pathProblems);
				allSkillClaimProblems.commands.push(...result.commandProblems);
				allSkillClaimProblems.flags.push(...result.flagProblems);
				for (const entry of staleExemptions(surface, text)) {
					const key = `${entry.surface}:${entry.kind}:${entry.text}`;
					if (!reportedStaleExemptions.has(key)) console.log(`STALE exemption ${entry.surface} ${entry.kind} '${entry.text}'`);
					reportedStaleExemptions.add(key);
				}
				if (language === "python" && declaredKey === "python-scaffold") {
					if (surface === "scaffold-py") for (const entry of EXEMPTIONS.filter((item) => !item.reason.trim())) check("claim exemption has a reason", false, `${entry.surface} ${entry.text}`);
					for (const entry of staleExemptions(surface, text)) console.log(`STALE exemption ${entry.surface} ${entry.kind} '${entry.text}'`);
				}
				skillClaimsExtracted += result.claims;
				skillUnjudged.push(...result.unjudgedCommands);
				// req: R-598 R-599 R-629
				check(`${language} scaffold: all declared skill claims resolve independently for ${surface}`,
					![...result.pathProblems, ...result.commandProblems, ...result.flagProblems].length,
					[...result.pathProblems, ...result.commandProblems, ...result.flagProblems].join("\\n"));
				if (surface === "scaffold-py") {
					// req: R-598
					check("scaffold-py: a removed code-map path is rejected", judgeClaims({ surface, root: REPO, targets: [currentTarget], text: text.replace("scripts/code_map.py", "scripts/gone.py") }).pathProblems.length > 0);
				}
				if (surface === "scaffold-ts") {
					// req: R-599
					check("scaffold-ts: an unknown package script is rejected", judgeClaims({ surface, root: REPO, targets: [currentTarget], text: text.replace("pnpm map:check", "pnpm map:chek") }).commandProblems.some((p) => p.includes("not a script")));
				}
				if (surface === "scaffold-ts") {
					// req: R-599
					check("scaffold-ts: an inline pnpm separator mutation is rejected", judgeClaims({ surface, root: REPO, targets: [currentTarget], text: text.replace("pnpm map:check", "pnpm map:check -- <files>") }).commandProblems.some((p) => p.includes("separator")));
				}
				if (surface === "templates/_shared/working-under-nana-pi.md") {
					// req: R-598
					check(`${language} scaffold: a removed shared HANDOFF path is rejected`, judgeClaims({ surface, root: REPO, targets: [currentTarget], text: text.replace("HANDOFF.md", "HANDOF.md") }).pathProblems.length > 0);
				}
			}
			if (language === "python") {
				// req: R-598
				check("python scaffold: all declared skill paths resolve independently", allSkillClaimProblems.paths.length === 0, allSkillClaimProblems.paths.join("\n"));
				// req: R-599
				check("python scaffold: all declared package-script commands resolve independently", allSkillClaimProblems.commands.length === 0, allSkillClaimProblems.commands.join("\n"));
				// req: R-629
				check("python scaffold: all declared flags and subcommands resolve independently", allSkillClaimProblems.flags.length === 0, allSkillClaimProblems.flags.join("\n"));
			} else {
				// req: R-598
				check("typescript scaffold: all declared skill paths resolve independently", allSkillClaimProblems.paths.length === 0, allSkillClaimProblems.paths.join("\n"));
				// req: R-599
				check("typescript scaffold: all declared package-script commands resolve independently", allSkillClaimProblems.commands.length === 0, allSkillClaimProblems.commands.join("\n"));
				// req: R-629
				check("typescript scaffold: all declared flags and subcommands resolve independently", allSkillClaimProblems.flags.length === 0, allSkillClaimProblems.flags.join("\n"));
			}

			const renderedAgents = fs.readFileSync(path.join(dest, "AGENTS.md"), "utf-8");
			const renderedPrefix = renderedAgents.slice(0, renderedAgents.indexOf("<!-- nana:working-under-nana-pi begin -->"));
			const renderedParagraph = renderedPrefix.trimEnd().split(/\n\s*\n/).at(-1) ?? "";
			// req: R-859
			check(`${language}: rendered AGENTS.md marker region matches shared bytes and follows a paragraph`,
				markerBlock(renderedAgents) === fs.readFileSync(path.join(REPO, "templates/_shared/working-under-nana-pi.md"), "utf-8") &&
				renderedPrefix.endsWith("\n\n") && /[.!?]$/.test(renderedParagraph));

			const want = [...spec.files, ...RAIL[language], ...spec.scaffoldOnly];
			const missing = want.filter((f) => !fs.existsSync(path.join(dest, f)));
			// req: R-738
			check(`${language}: the requirements-first files all land`, missing.length === 0, `missing: ${missing}`);

			const reqs = partG(language, dest, "scaffold");
			treeChecks(language, "scaffold", reqs);
			check(`${language}: the example product row is implemented`, /^\|\s*R-001\s*\|.*\|\s*implemented\s*\|/m.test(reqs), "R-001 is not implemented");
			// req: R-630
			check(`${language}: rendered policy config has the protected filename`, fs.existsSync(path.join(dest, ".pi", "nana-pack.json")));

			// the scaffolded smoke test carries the marker for the example row
			const smoke = fs.readFileSync(path.join(dest, spec.markerIn), "utf-8");
			// req: R-738
			check(`${language}: the smoke test carries the trace marker`, smoke.includes(spec.marker), spec.markerIn);
			const rail = fs.readFileSync(path.join(dest, spec.markedRail), "utf-8");
			check(
				`${language}: the rail self-test carries real req: markers`,
				new RegExp(`^${language === "python" ? "# " : "// "}req: G-`, "m").test(rail) && !/\{[{%]/.test(rail),
				spec.markedRail,
			);

			// the generators are dependency-free: --check passes with nothing installed
			const [cmd, args] = spec.checkCmd;
			const r = run(cmd, args, dest);
			// req: R-738
			check(`${language}: the code map checks clean with no deps installed`, r.status === 0, out(r).slice(-800));
			// req: R-738
			check(`${language}: the check covers src, scripts and tests`,
				/8 modules over src/.test(out(r)) && /0 problem\(s\)/.test(out(r)),
				out(r).slice(-400),
			);

			// --impact names what its own blast-radius walk still cannot see: in a fresh
			// scaffold the trace-rail library module (tests/requirements-trace, TS; and —
			// a separate, pre-existing gap — every Python test importing a script by its
			// sys.path bare name) carries no detected callee, so it is untraced by design,
			// not by a bug this lane introduces.
			const impactRun = run(cmd, [args[0], "--impact", spec.markerIn], dest);
			const expectedUntraced =
				language === "python"
					? "untraced tests: 4 of 5 test modules import no mapped module (a test that only starts a process is not linked)"
					: "untraced tests: 1 of 5 test modules import no mapped module (a test that only starts a process is not linked)";
			// req: R-861 R-862
			check(`${language}: --impact prints the untraced-test count for a fresh scaffold`,
				impactRun.status === 0 && out(impactRun).includes(expectedUntraced),
				out(impactRun).slice(-600),
			);

			// A fresh scaffold's own lint/format gates pass with no edits — NOT a pinned
			// clause of R-858 (see REQUIREMENTS.md: the row stays untested). These checks
			// still catch a real regression on a machine that HAS the tools, but they are
			// not full proof of the row for three reasons: (1) they SKIP, silently to the
			// rail, when uvx/ruff/biome cannot be resolved — sol r1's own PATH-with-only-
			// Node probe showed both languages SKIP and the suite still exits 0; (2) they
			// invoke `uvx ruff` / `pnpm dlx @biomejs/biome` directly, not the rendered
			// project's own installed commands (`uv run ruff` / `pnpm lint`); (3) a marker
			// here would claim more than that gap allows. The manual fresh-render evidence
			// (both languages, scaffold + adopt, with the project's own installed commands)
			// is recorded in the row's Evidence cell instead.
			if (language === "python") {
				const probe = run("uvx", ["ruff", "--version"], REPO);
				if (probe.status === 0) {
					const lint = run("uvx", ["ruff", "check", "."], dest);
					check(`${language}: a fresh scaffold passes ruff check with no edits`, lint.status === 0, out(lint).slice(-1000));
					const fmt = run("uvx", ["ruff", "format", "--check", "."], dest);
					check(`${language}: a fresh scaffold is ruff-format clean with no edits`, fmt.status === 0, out(fmt).slice(-1000));
				} else {
					skip(`${language}: a fresh scaffold passes its own lint/format gates`, "uvx ruff is not resolvable on this machine");
				}
			} else {
				const probe = run("pnpm", ["dlx", "@biomejs/biome", "--version"], REPO);
				if (probe.status === 0) {
					const lint = run("pnpm", ["dlx", "@biomejs/biome", "check", "."], dest);
					check(`${language}: a fresh scaffold passes biome check with no edits`, lint.status === 0, out(lint).slice(-1000));
				} else {
					skip(`${language}: a fresh scaffold passes its own lint/format gates`, "pnpm dlx @biomejs/biome is not resolvable on this machine");
				}
			}

			// the README passes its own check on day one, with nothing installed
			const [rcmd, rargs] = spec.readmeCmd;
			const readme = run(rcmd, rargs, dest);
			check(
				`${language}: the scaffolded README passes readme-check with no deps installed`,
				readme.status === 0 && /0 problem\(s\)/.test(out(readme)),
				out(readme).slice(-600),
			);
			const listed = run(rcmd, [...rargs, "--list"], dest);
			check(`${language}: readme-check --list prints its claims`, /^command: /m.test(out(listed)), out(listed).slice(-300));

			// a README claim the project no longer honours fails (G-012)
			for (const [name, from, to, expected] of spec.readmeMutations) {
				const file = path.join(dest, "README.md");
				const before = fs.readFileSync(file, "utf-8");
				fs.writeFileSync(file, before.replace(from, to));
				const broken = run(rcmd, rargs, dest);
				check(
					`${language}: readme-check catches ${name}`,
					broken.status === 1 && out(broken).includes(expected),
					out(broken).slice(-500),
				);
				fs.writeFileSync(file, before);
			}

			// "every module" includes the test dir: a header dropped there fails the check
			dropHeader(path.join(dest, spec.headerDropIn));
			const dropped = run(cmd, args, dest);
			check(
				`${language}: a header dropped in tests/ fails the check`,
				dropped.status === 1 && out(dropped).includes(`${spec.headerDropIn}: no contract header`),
				out(dropped).slice(-600),
			);
		} finally {
			fs.rmSync(dest, { recursive: true, force: true });
		}

		// ------------------------------------------------------------------- adopt
		const adopt = render(language, { ...spec.answers, adopt: "true" });
		try {
			check(`${language} adopt: copier renders the template`, adopt.ok, adopt.out.slice(-800));
			if (!adopt.ok) continue;
			if (language === "python") {
				// An adopt render deliberately skips the README/map starters (copier.yml's
				// adopt help text), so test_this_project_headers_and_map_are_current and
				// test_this_project_readme_passes fail here under ANY encoding (verified
				// against the default encoding too) — a pre-existing adopt-mode gap, not the
				// cp1252 decode mismatch this check pins. Deselect only those two.
				const cp1252 = runCp1252(adopt.dest, [
					"tests/test_code_map.py::test_this_project_headers_and_map_are_current",
					"tests/test_readme_check.py::test_this_project_readme_passes",
				]);
				if (!cp1252.available) {
					const title = `${language} adopt: requirements-trace, code-map and readme-check tests pass under a cp1252 Python environment`;
					if (process.env.NANA_TEST_REQUIRE_COPIER === "1") check(title, false, "NANA_TEST_REQUIRE_COPIER=1 but uvx could not resolve pytest");
					else skip(title, "uvx could not resolve pytest");
				} else {
					// req: R-1360
					check(`${language} adopt: requirements-trace, code-map and readme-check tests pass under a cp1252 Python environment`, cp1252.ok, cp1252.tail);
				}
			}
			const dir = adopt.dest;
			const adoptTarget = { name: `${language}-adopt`, root: dir };
			const adoptKey = `${language}-adopt`;
			const sharedText = fs.readFileSync(path.join(REPO, "templates/_shared/working-under-nana-pi.md"), "utf8");
			const adoptSkillNames = Object.keys(SURFACES).filter((name) => name !== "templates/_shared/working-under-nana-pi.md" && SURFACES[name].includes(adoptKey));
			const allAdoptSkillClaimProblems = { paths: [], commands: [], flags: [] };
			for (const surface of [...adoptSkillNames, "templates/_shared/working-under-nana-pi.md"]) {
				const text = surface === "templates/_shared/working-under-nana-pi.md"
					? sharedText
					: fs.readFileSync(path.join(REPO, "packages/nana-pack/skills", surface, "SKILL.md"), "utf8");
				const result = judgeClaims({ surface, root: REPO, targets: [adoptTarget], text });
				allAdoptSkillClaimProblems.paths.push(...result.pathProblems);
				allAdoptSkillClaimProblems.commands.push(...result.commandProblems);
				allAdoptSkillClaimProblems.flags.push(...result.flagProblems);
				for (const entry of staleExemptions(surface, text)) {
					const key = `${entry.surface}:${entry.kind}:${entry.text}`;
					if (!reportedStaleExemptions.has(key)) console.log(`STALE exemption ${entry.surface} ${entry.kind} '${entry.text}'`);
					reportedStaleExemptions.add(key);
				}
				skillClaimsExtracted += result.claims;
				skillUnjudged.push(...result.unjudgedCommands);
				// req: R-598 R-599 R-629
				check(`${language} adopt: all declared skill claims resolve independently for ${surface}`,
					![...result.pathProblems, ...result.commandProblems, ...result.flagProblems].length,
					[...result.pathProblems, ...result.commandProblems, ...result.flagProblems].join("\\n"));
				if (surface === "adopt-ts") {
					// req: R-598
					check("adopt-ts: a removed code-map test path is rejected", judgeClaims({ surface, root: REPO, targets: [adoptTarget], text: text.replace("tests/code-map.test.ts", "tests/gone.test.ts") }).pathProblems.length > 0);
				}
			}
			if (language === "python") {
				// req: R-598
				check("python adopt: all declared skill paths resolve independently", allAdoptSkillClaimProblems.paths.length === 0, allAdoptSkillClaimProblems.paths.join("\n"));
				// req: R-599
				check("python adopt: all declared package-script commands resolve independently", allAdoptSkillClaimProblems.commands.length === 0, allAdoptSkillClaimProblems.commands.join("\n"));
				// req: R-629
				check("python adopt: all declared flags and subcommands resolve independently", allAdoptSkillClaimProblems.flags.length === 0, allAdoptSkillClaimProblems.flags.join("\n"));
			} else {
				// req: R-598
				check("typescript adopt: all declared skill paths resolve independently", allAdoptSkillClaimProblems.paths.length === 0, allAdoptSkillClaimProblems.paths.join("\n"));
				// req: R-599
				check("typescript adopt: all declared package-script commands resolve independently", allAdoptSkillClaimProblems.commands.length === 0, allAdoptSkillClaimProblems.commands.join("\n"));
				// req: R-629
				check("typescript adopt: all declared flags and subcommands resolve independently", allAdoptSkillClaimProblems.flags.length === 0, allAdoptSkillClaimProblems.flags.join("\n"));
			}

			const skillName = language === "python" ? "adopt-py" : "adopt-ts";
			const skill = fs.readFileSync(path.join(REPO, "packages/nana-pack/skills", skillName, "SKILL.md"), "utf8");
			const skillFiles = listedAdoptFiles(skill).sort();
			const renderedFiles = emittedFiles(dir);
			// req: R-590
			check(`${language} adopt: skill file list exactly matches emitted files`, skillFiles.length > 0 && JSON.stringify(skillFiles) === JSON.stringify(renderedFiles), `listed-only: ${skillFiles.filter((f) => !renderedFiles.includes(f))}; render-only: ${renderedFiles.filter((f) => !skillFiles.includes(f))}`);
			const conditionalSeeds = ["OBJECTIVE.md", "HANDOFF.md", "REQUIREMENTS.md", "docs/sessions/README.md", "docs/code-map.md"];
			// req: R-590
			check(`${language} adopt: all copier-preserved files are marked written only when absent`, conditionalSeeds.every((file) => skill.includes(`- \`${file}\` (written only when absent)`)), `missing conditional label: ${conditionalSeeds.filter((file) => !skill.includes(`- \`${file}\` (written only when absent)`))}`);
			if (language === "typescript") {
				const scripts = Object.keys(JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8")).scripts);
				// req: R-590
				check("typescript adopt: every rendered package script is named in adopt-ts", scripts.length > 0 && scripts.every((script) => skill.includes(`\`${script}\``)), `unnamed: ${scripts.filter((script) => !skill.includes(`\`${script}\``))}`);
				// req: R-590
				check("typescript adopt: workspace build permission is valid YAML", /```yaml\n\s*allowBuilds:\n\s+esbuild: true\n\s*```/.test(skill) && !/allowBuilds: esbuild: true/.test(skill));
			}

			const missing = [...spec.files, ...RAIL[language]].filter((f) => !fs.existsSync(path.join(dir, f)));
			check(`${language} adopt: the rail and the generator land too`, missing.length === 0, `missing: ${missing}`);
			const present = spec.scaffoldOnly.filter((f) => fs.existsSync(path.join(dir, f)));
			check(`${language} adopt: no scaffold starters are written`, present.length === 0, `present: ${present}`);

			const reqs = partG(language, dir, "adopt");
			treeChecks(language, "adopt", reqs);
			check(`${language} adopt: no row claims implemented`, !/^\|\s*[RG]-(?:[0-9]{3}|[1-9][0-9]{3})\s*\|.*\|\s*implemented\s*\|/m.test(reqs), "a row claims implemented");
			const statuses = [...reqs.matchAll(/^\|\s*G-(?:[0-9]{3}|[1-9][0-9]{3})\s*\|.*\|\s*(\w+)\s*\|/gm)].map((m) => m[1]);
			check(`${language} adopt: every Part G row starts untested`, statuses.length === 22 && statuses.every((s) => s === "untested"), `got ${statuses}`);
			check(`${language} adopt: no product row is invented`, !/^\|\s*R-(?:[0-9]{3}|[1-9][0-9]{3})\s*\|/m.test(reqs), "an R row was emitted");
			check(`${language} adopt: the confirm-the-statuses blockquote is gone`, !/ADOPTED rather than scaffolded/.test(reqs), "the old blockquote survives");

			// the self-tests arrive unmarked, so an untested Part G row is not contradicted
			const rail = fs.readFileSync(path.join(dir, spec.markedRail), "utf-8");
			const markerRe = language === "python" ? /^# req: /m : /^\/\/ req: /m;
			check(`${language} adopt: the rail self-test carries req-candidate, not req:`, rail.includes("req-candidate:") && !markerRe.test(rail), spec.markedRail);
			check(`${language} adopt: no jinja survives into the rail self-test`, !/\{[{%]/.test(rail), spec.markedRail);

			// the placeholder map fails the FIRST check and names the command that fixes it
			const [cmd, args] = spec.checkCmd;
			const first = run(cmd, args, dir);
			const firstOut = out(first);
			check(
				`${language} adopt: the first --check fails and names the regenerate command`,
				first.status === 1 && /run '[^']+'/.test(firstOut) && /docs\/code-map\.md is stale/.test(firstOut),
				firstOut.slice(-600),
			);
			const [wcmd, wargs] = spec.writeCmd;
			const wrote = run(wcmd, wargs, dir);
			check(`${language} adopt: the documented command generates the map`, wrote.status === 0, out(wrote).slice(-400));
			const second = run(cmd, args, dir);
			check(`${language} adopt: --check is green after that ONE command`, second.status === 0, out(second).slice(-600));
		} finally {
			fs.rmSync(adopt.dest, { recursive: true, force: true });
		}

		// --------------------------------------------------------- R-1321: CRLF rewrite
		const crlf = render(language, { ...spec.answers, adopt: "false" });
		try {
			if (!crlf.ok) {
				crlfOk = false;
				crlfWhy.push(`${language}: copier would not render (CRLF fixture): ${crlf.out.slice(-400)}`);
			} else {
				rewriteToCrlf(crlf.dest);
				const [cmd, args] = spec.checkCmd;
				const mapRun = run(cmd, args, crlf.dest);
				const [rcmd, rargs] = spec.readmeCmd;
				const readmeRun = run(rcmd, rargs, crlf.dest);
				const trace = await traceProblems(language, crlf.dest);
				const mapOk = mapRun.status === 0 && /0 problem\(s\)/.test(out(mapRun));
				const readmeOk = readmeRun.status === 0 && /0 problem\(s\)/.test(out(readmeRun));
				if (!mapOk) crlfWhy.push(`${language} code-map (CRLF): ${out(mapRun).slice(-400)}`);
				if (!readmeOk) crlfWhy.push(`${language} readme-check (CRLF): ${out(readmeRun).slice(-400)}`);
				if (trace.unavailable) skip(`${language}: the trace script also passes on the CRLF rewrite`, trace.unavailable);
				else if (trace.error || trace.problems.length) crlfWhy.push(`${language} trace (CRLF): ${trace.error ?? JSON.stringify(trace.problems)}`);
				if (!mapOk || !readmeOk || (!trace.unavailable && (trace.error || trace.problems.length))) crlfOk = false;
			}
		} finally {
			fs.rmSync(crlf.dest, { recursive: true, force: true });
		}
	}
	// req: R-1321
	check("R-1321: each template's code-map, readme-check and trace scripts pass on a rendered project rewritten to CRLF", crlfOk, crlfWhy.join(" | "));

	// -------------------------------------------- R-1440 to R-1443: cp1252/ascii output
	// Python only: an extra scaffold render carrying a non-ASCII fixture (a README path
	// claim and a module path neither ASCII nor cp1252 holds), removed in `finally`.
	const encFixture = render("python", { ...LANGS.python.answers, adopt: "false" });
	try {
		if (!encFixture.ok) {
			// req: R-1440
			check("python: the readme check prints every line under ASCII and cp1252 output", false, encFixture.out.slice(-800));
			// req: R-1441
			check("python: the code map check prints every line under ASCII and cp1252 output", false, encFixture.out.slice(-800));
			// req: R-1442
			check("python: the code map impact view prints every line under ASCII and cp1252 output", false, encFixture.out.slice(-800));
			// req: R-1443
			check("python: the readme check and code map print a non-ASCII path unescaped under UTF-8 output", false, encFixture.out.slice(-800));
		} else {
			const readmeFile = path.join(encFixture.dest, "README.md");
			fs.appendFileSync(readmeFile, "\nSee `docs/λ-notes.md` and `docs/gone.md`.\n");
			fs.writeFileSync(path.join(encFixture.dest, "src/tpl_py/modλ.py"), '"""no header"""\n');

			const py = LANGS.python.checkCmd[0];
			const readmeCheckCmp = compareAcrossEncodings(py, ["scripts/readme_check.py"], encFixture.dest);
			const readmeListCmp = compareAcrossEncodings(py, ["scripts/readme_check.py", "--list"], encFixture.dest);
			// req: R-1440
			check("python: the readme check prints every line under ASCII and cp1252 output", readmeCheckCmp.ok && readmeListCmp.ok, [readmeCheckCmp.why, readmeListCmp.why].filter(Boolean).join(" || "));

			const mapCheckCmp = compareAcrossEncodings(py, ["scripts/code_map.py", "--check"], encFixture.dest);
			// req: R-1441
			check("python: the code map check prints every line under ASCII and cp1252 output", mapCheckCmp.ok, mapCheckCmp.why);

			// Literal string, not path.join: the fixture names a forward-slash path.
			const mapImpactCmp = compareAcrossEncodings(py, ["scripts/code_map.py", "--impact", "src/tpl_py/modλ.py"], encFixture.dest);
			// req: R-1442
			check("python: the code map impact view prints every line under ASCII and cp1252 output", mapImpactCmp.ok, mapImpactCmp.why);

			const utf8Runs = [readmeCheckCmp, readmeListCmp, mapCheckCmp, mapImpactCmp];
			// req: R-1443
			check("python: the readme check and code map print a non-ASCII path unescaped under UTF-8 output", utf8Runs.every((r) => r.utf8Stdout.includes("λ")), utf8Runs.map((r) => r.utf8Stdout.includes("λ")).join(","));
		}
	} finally {
		fs.rmSync(encFixture.dest, { recursive: true, force: true });
	}
}

const updateGuide = fs.readFileSync(path.join(REPO, "README.md"), "utf8").match(/- \*\*Generated project\*\*([\s\S]*?)(?=\n- \*\*)/)?.[1] ?? "";
const adoptUpdateSkills = ["adopt-py", "adopt-ts"].map((name) => fs.readFileSync(path.join(REPO, "packages/nana-pack/skills", name, "SKILL.md"), "utf8"));
// req: R-590
check("generated project update guidance is generic with adopted-project qualification", /run `uvx copier update --conflict inline` inside the\s+project/.test(updateGuide) && /For adopted projects, convert\s+decorator markers first; never use `--conflict rej`/.test(updateGuide) && adoptUpdateSkills.every((text) => /--conflict inline/.test(text) && /never `--conflict rej`/.test(text)));

fs.rmSync(NANA_HOME, { recursive: true, force: true });
console.log(`claims: ${skillClaimsExtracted} extracted, ${skillUnjudged.length} command claims not judged (heads: ${[...new Set(skillUnjudged)].join(", ") || "none"})`);
console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
