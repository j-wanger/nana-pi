/**
 * @module packages/nana-pack/tests/templates-render.test.mjs
 * @purpose Pins that both project template modes render and that the requirements-first rail they ship is wired in each, including a first `--check` that passes with no dependencies installed
 * @inputs the templates/ tree at the repository root and throwaway render targets under a temp HOME
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, rendered projects), process (spawns the render and check commands in the rendered projects)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
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
const NANA_HOME = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), "nana-home-")));
process.env.HOME = NANA_HOME;
process.env.USERPROFILE = NANA_HOME;

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
let fails = 0;
const check = (n, ok, why = "") => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : why);
	if (!ok) fails++;
};
const skip = (n, why) => console.log("SKIP", n, "—", why);
const run = (cmd, args, cwd) => spawnSync(cmd, args, { cwd, encoding: "utf-8", timeout: 240_000 });
const out = (r) => `${r.stdout ?? ""}${r.stderr ?? ""}`;

/** `uvx copier`, if this machine has it. */
function copierAvailable() {
	const probe = run("uvx", ["copier", "--version"], REPO);
	return probe.status === 0 ? probe.stdout.trim() : null;
}

/** Render one template from THIS checkout into a temp dir. */
function render(language, answers) {
	const dest = fs.mkdtempSync(path.join(os.tmpdir(), `nana-tpl-${language}-`));
	const args = ["copier", "copy", "--trust", "--vcs-ref", "HEAD", "--defaults", "-d", `language=${language}`];
	for (const [k, v] of Object.entries(answers)) args.push("-d", `${k}=${v}`);
	args.push(REPO, dest);
	const r = run("uvx", args, REPO);
	return { dest, ok: r.status === 0, out: out(r) };
}

/** Strip the module's leading contract header: a JSDoc block, or a Python docstring. */
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
	const gIds = [...reqs.matchAll(/^\|\s*(G-\d{3})\s*\|/gm)].map((m) => m[1]);
	const wantG = Array.from({ length: 22 }, (_, i) => `G-${String(i + 1).padStart(3, "0")}`);
	const noDupes = gIds.length === new Set(gIds).size;
	const sorted = [...gIds].sort();
	// req: R-737
	check(`${language} ${mode}: Part G ships G-001..G-022 unrenumbered`,
		noDupes && `${sorted}` === `${wantG}`,
		`got ${gIds} (sorted ${sorted}, duplicates: ${!noDupes})`);
	// req: R-737
	check(`${language} ${mode}: no jinja survives into REQUIREMENTS.md`, !/\{[{%]/.test(reqs), "an unrendered tag is left");
	return reqs;
}

/**
 * The Requirement cell text of every G-id in templates/_shared/requirements-general.md,
 * stripped of the Jinja `{%- set -%}` statement lines (which produce no output and carry
 * no `|`-delimited row shape).
 */
function sharedPartGRequirementText() {
	const shared = fs.readFileSync(path.join(REPO, "templates", "_shared", "requirements-general.md"), "utf-8");
	const text = new Map();
	for (const m of shared.matchAll(/^\|\s*(G-\d{3})\s*\|([^|]+)\|/gm)) text.set(m[1], m[2].trim());
	return text;
}

/** R-756: nana-pi's own Part G Requirement cells must read byte-identical to the shared file's. */
function checkNanaPiPartGMirrorsTheSharedFile() {
	const nanaPi = fs.readFileSync(path.join(REPO, "REQUIREMENTS.md"), "utf-8");
	const own = new Map();
	for (const m of nanaPi.matchAll(/^\|\s*(G-\d{3})\s*\|([^|]+)\|/gm)) own.set(m[1], m[2].trim());
	const shared = sharedPartGRequirementText();
	const mismatched = [...shared].filter(([id, text]) => own.get(id) !== text).map(([id]) => id);
	// req: R-756
	check("nana-pi Part G mirrors templates/_shared/requirements-general.md",
		mismatched.length === 0,
		`mismatched: ${mismatched}`,
	);
}
checkNanaPiPartGMirrorsTheSharedFile();

/**
 * R-859: AGENTS.md's Layout bullet calls `templates/_shared/working-under-nana-pi.md`
 * "the canonical section below" — true only if AGENTS.md's own "Working under nana-pi"
 * section (CLAUDE.md is a symlink to AGENTS.md, so this covers both) reads byte-identical
 * to that shared file, which every template's AGENTS.md.jinja also {% include %}s.
 */
function checkAgentsMdMirrorsWorkingUnderNanaPi() {
	const agents = fs.readFileSync(path.join(REPO, "AGENTS.md"), "utf-8");
	const shared = fs.readFileSync(path.join(REPO, "templates", "_shared", "working-under-nana-pi.md"), "utf-8");
	// req: R-859
	check("AGENTS.md's Working under nana-pi section is byte-identical to the shared file", agents.endsWith(shared));

	// Mutation, in a scratch copy only (the real AGENTS.md is never touched): dropping the
	// final byte must flip the SAME predicate from true to false, proving the check is live
	// rather than vacuously true.
	const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "nana-agents-mutation-"));
	try {
		const mutatedPath = path.join(scratch, "AGENTS.md");
		fs.writeFileSync(mutatedPath, agents.slice(0, -1));
		const stillMatches = fs.readFileSync(mutatedPath, "utf-8").endsWith(shared);
		// req: R-859
		check("…and a one-byte drift is caught, not silently passed (mutation)", !stillMatches);
	} finally {
		fs.rmSync(scratch, { recursive: true, force: true });
	}
}
checkAgentsMdMirrorsWorkingUnderNanaPi();

const version = copierAvailable();
if (!version) {
	for (const language of Object.keys(LANGS)) {
		skip(`${language}: renders and the code map checks`, "uvx copier is not available on this machine");
	}
} else {
	for (const [language, spec] of Object.entries(LANGS)) {
		// ---------------------------------------------------------------- scaffold
		const { dest, ok, out: log } = render(language, { ...spec.answers, adopt: "false" });
		try {
			// req: R-737
			check(`${language}: copier renders the template`, ok, log.slice(-800));
			if (!ok) continue;

			const want = [...spec.files, ...RAIL[language], ...spec.scaffoldOnly];
			const missing = want.filter((f) => !fs.existsSync(path.join(dest, f)));
			// req: R-738
			check(`${language}: the requirements-first files all land`, missing.length === 0, `missing: ${missing}`);

			const reqs = partG(language, dest, "scaffold");
			check(`${language}: the example product row is implemented`, /^\|\s*R-001\s*\|.*\|\s*implemented\s*\|/m.test(reqs), "R-001 is not implemented");

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
			// req: R-946 R-947
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
			const dir = adopt.dest;

			const missing = [...spec.files, ...RAIL[language]].filter((f) => !fs.existsSync(path.join(dir, f)));
			check(`${language} adopt: the rail and the generator land too`, missing.length === 0, `missing: ${missing}`);
			const present = spec.scaffoldOnly.filter((f) => fs.existsSync(path.join(dir, f)));
			check(`${language} adopt: no scaffold starters are written`, present.length === 0, `present: ${present}`);

			const reqs = partG(language, dir, "adopt");
			check(`${language} adopt: no row claims implemented`, !/^\|\s*[RG]-\d{3}\s*\|.*\|\s*implemented\s*\|/m.test(reqs), "a row claims implemented");
			const statuses = [...reqs.matchAll(/^\|\s*G-\d{3}\s*\|.*\|\s*(\w+)\s*\|/gm)].map((m) => m[1]);
			check(`${language} adopt: every Part G row starts untested`, statuses.length === 22 && statuses.every((s) => s === "untested"), `got ${statuses}`);
			check(`${language} adopt: no product row is invented`, !/^\|\s*R-\d{3}\s*\|/m.test(reqs), "an R row was emitted");
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
	}
}

fs.rmSync(NANA_HOME, { recursive: true, force: true });
console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
