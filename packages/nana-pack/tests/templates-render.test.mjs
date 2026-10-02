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

/** The Part G block arrived through the shared include with its ids unrenumbered. */
function partG(language, dest, mode) {
	const reqs = fs.readFileSync(path.join(dest, "REQUIREMENTS.md"), "utf-8");
	const gIds = [...reqs.matchAll(/^\|\s*(G-\d{3})\s*\|/gm)].map((m) => m[1]);
	const wantG = Array.from({ length: 12 }, (_, i) => `G-${String(i + 1).padStart(3, "0")}`);
	// req: R-737
	check(`${language} ${mode}: Part G ships G-001..G-012 unrenumbered`, `${gIds}` === `${wantG}`, `got ${gIds}`);
	// req: R-737
	check(`${language} ${mode}: no jinja survives into REQUIREMENTS.md`, !/\{[{%]/.test(reqs), "an unrendered tag is left");
	return reqs;
}

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
			check(`${language} adopt: every Part G row starts untested`, statuses.length === 12 && statuses.every((s) => s === "untested"), `got ${statuses}`);
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
