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
const { desiredHooks } = await import(new URL("../../nana-setup/lib/settings.mjs", import.meta.url).href);
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
const run = (cmd, args, cwd) => spawnSync(cmd, args, { cwd, encoding: "utf-8", timeout: 240_000 });
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
			"| Claude Code seat | SessionStart `nana-objective.mjs` and `nana-adoption.mjs` hooks | `nana-shared-memory.mjs` hook; Claude shared-memory index and auto-memory | Both Claude rules | Shared nana-writing rule | UserPromptSubmit `nana-knowledge.ts hook` | No nana command gate | Bash PreToolUse Node hook `verifier-pipe.mjs` | No nana per-edit checks | Claude-owned summary; no nana HANDOFF producer | No nana notify |",
			"| pi TUI or desk session | `nana-objective` extension | No shared auto-memory | Neither rule; requirements-first arrives through AGENTS and the requirements skill | `nana-writing` extension | `nana-knowledge` extension (`before_agent_start`) | `nana-gate` extension | `nana-gate` shared predicate for bash and PowerShell | `nana-post-edit` extension; configured checks, if any | `nana-lifecycle` journal; `nana-handoff` extension on compaction | `nana-notify` extension |",
			"| pi reviewer/worker child (`NANA_HANDOFF=off`) | `nana-objective` extension | No shared auto-memory | Neither rule | `nana-writing` extension | Disabled by `NANA_ROLE=reviewer` or `NANA_ROLE=worker` | `nana-gate` extension | `nana-gate` shared predicate for bash and PowerShell | `nana-post-edit` extension; configured checks, if any | Disabled by `NANA_HANDOFF=off` | `nana-notify` extension |",
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
	// req: R-684
	check("three front doors carry one identical scoped platform claim", support.every((lines) => lines.length === 1) && support.every((lines) => lines[0] === support[0]?.[0]) && ["macOS tested", "Linux runs in hosted CI", "suite leg is non-blocking", "no recorded machine install", "the pack runs on native Windows but is untested", "no Claude Code hook except the knowledge pull", "none of its PATH commands", "review and builder launchers are unavailable", "launchd is macOS-only"].every((phrase) => support[0]?.[0].includes(phrase)) && !frontDoors.some(hasBroadWindowsParity) && hasBroadWindowsParity(competingWindowsClaim));
	// req: R-685
	check("desk matrix states nana resources for every spawn class and the terminal trust step",
		desk.includes("Default desk spawn | Pi defaults: installed skills and extensions, including nana-pack where installed. Objective, writing, knowledge, gate, post-edit, handoff, lifecycle, and notify are present only when their extensions are installed and loaded.") &&
		desk.includes("Narrowed desk spawn | Only checked skills and extensions are passed; `--no-skills` / `--no-extensions` disables the rest, including nana-pack unless explicitly re-added. Each nana surface (objective, writing, knowledge, gate, post-edit, handoff, lifecycle, notify) is available only if its extension is in the checked set.") &&
		desk.includes("Current basketball and edge children list their app extension, nana-stage, and builtin MCP, not nana-pack: they receive no objective, writing, knowledge, gate, post-edit, handoff, lifecycle, or notify unless a manifest explicitly lists the relevant extension.") &&
		desk.includes("`/trust` is TUI-only: open the project in pi's terminal, run `/trust`, then restart the session."));
}
checkInstructionContracts();

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
	for (const [language, spec] of Object.entries(LANGS)) {
		// ---------------------------------------------------------------- scaffold
		const { dest, ok, out: log } = render(language, { ...spec.answers, adopt: "false" });
		try {
			// req: R-737
			check(`${language}: copier renders the template`, ok, log.slice(-800));
			if (!ok) continue;
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

const updateGuide = fs.readFileSync(path.join(REPO, "README.md"), "utf8").match(/- \*\*Generated project\*\*([\s\S]*?)(?=\n- \*\*)/)?.[1] ?? "";
const adoptUpdateSkills = ["adopt-py", "adopt-ts"].map((name) => fs.readFileSync(path.join(REPO, "packages/nana-pack/skills", name, "SKILL.md"), "utf8"));
// req: R-590
check("generated project update guidance is generic with adopted-project qualification", /run `uvx copier update --conflict inline` inside the\s+project/.test(updateGuide) && /For adopted projects, convert\s+decorator markers first; never use `--conflict rej`/.test(updateGuide) && adoptUpdateSkills.every((text) => /--conflict inline/.test(text) && /never `--conflict rej`/.test(text)));

fs.rmSync(NANA_HOME, { recursive: true, force: true });
console.log(`claims: ${skillClaimsExtracted} extracted, ${skillUnjudged.length} command claims not judged (heads: ${[...new Set(skillUnjudged)].join(", ") || "none"})`);
console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
