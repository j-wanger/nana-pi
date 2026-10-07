/**
 * @module packages/nana-pack/tests/readme-check.test.mjs
 * @purpose Holds nana-pi to the README rule it ships (G-012): every command, path, flag and script name a shipped README states exists and runs as written.
 * @inputs scripts/readme-check.mjs, readme-check.config.json, and the README files it lists
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (reads this checkout, writes throwaway fixtures under a temp dir), process (runs the readme-check CLI)
 * @errors a failed check prints FAIL with the problem list and the run exits 1; an unexpected throw propagates and fails the run
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
// nana-pi under its own rule (G-012): every README this repo ships is a contract — every
// command, path, flag and script name it states exists and runs as written, each one says what
// the project is and how to install, run and test it, and every script the repo ships is
// documented somewhere. The checker is the template's — scripts/readme-check.mjs is a shim over
// templates/typescript/template/scripts/readme-check.mjs — reading readme-check.config.json.
//
// Reads this checkout only — no temp HOME needed, no network, no model.
// Run: node --experimental-strip-types <this file>
const { REPO_ROOT, checkProject, loadConfig } = await import(
	new URL("../../../scripts/readme-check.mjs", import.meta.url).href
);

let fails = 0;
const check = (n, ok, why = "") => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : why);
	if (!ok) fails++;
};

const { claims, problems, line } = checkProject();
console.log(line);

// req: G-012
check("every README this repo ships holds its claims", problems.length === 0, `\n  ${problems.join("\n  ")}`);
check("the READMEs make checkable claims at all", claims.length > 100, `${claims.length} claims`);

const readmes = loadConfig(REPO_ROOT).readmes;
check(
	"every package and app README is in the checked set",
	readmes.length === 7 && readmes.includes("packages/nana-stage/README.md"),
	readmes.join(", "),
);

const cli = spawnSync(process.execPath, [path.join(REPO_ROOT, "scripts", "readme-check.mjs"), "--check"], {
	cwd: REPO_ROOT,
	encoding: "utf-8",
});
check("scripts/readme-check.mjs --check exits 0", cli.status === 0, `${cli.stdout ?? ""}${cli.stderr ?? ""}`);

const config = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "readme-check.config.json"), "utf-8"));
const external = new Map(config.externalPaths.map((entry) => [entry.path, entry.reason]));
// req: R-655
check("install-produced README paths are declared external with reasons", ["node_modules", "apps/bench/.ext", "apps/bench/.ext/pi-web-access"].every((item) => external.get(item)?.trim().length > 0));

const invalidModes = [["--check", "--list"], ["--bogus"]].map((args) => {
	const result = spawnSync(process.execPath, [path.join(REPO_ROOT, "scripts", "readme-check.mjs"), ...args], { cwd: REPO_ROOT, encoding: "utf-8" });
	const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
	return { args, ok: result.status === 2 && output.includes("Usage:") && output.includes("--list"), output };
});
// req: R-656
check("CLI rejects unknown and multiple modes with usage", invalidModes.every((result) => result.ok), invalidModes.map((result) => `${result.args.join(" ")}: ${result.output.slice(-300)}`).join("\n"));

const skill = fs.readFileSync(path.join(REPO_ROOT, "packages/nana-pack/skills/requirements/SKILL.md"), "utf-8");
// req: R-657
check("requirements skill documents runner-specific map commands", skill.includes("pnpm map:impact <files>") && skill.includes("npm run map:impact -- <files>") && skill.includes("uv run python scripts/code_map.py --impact <files>") && !skill.includes("map:impact -- <changed-files>"));

const rootReadme = fs.readFileSync(path.join(REPO_ROOT, "README.md"), "utf-8");
const rootPackage = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf-8"));
const packPackage = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "packages/nana-pack/package.json"), "utf-8"));
const seven = ["gate", "post-edit", "lifecycle", "notify", "handoff", "objective", "writing"];
// req: R-658
check("front-door descriptions name both runtimes and all seven extensions", rootReadme.includes("UserPromptSubmit") && rootReadme.includes("before_agent_start") && [rootReadme, rootPackage.description, packPackage.description].every((text) => seven.every((name) => text.includes(name))));

const objective = fs.readFileSync(path.join(REPO_ROOT, "AGENTS.md"), "utf-8").split("## Working under nana-pi")[0];
// req: R-659
check("repo objective contract accurately documents the opt-out", /user-scope `objective\.enabled: false` turns the objective off/.test(objective) && /project config cannot/i.test(objective));

// A command the README names INLINE is a claim too (G-012): `npm test` in a sentence is the
// same promise as the same line in a fence. The mutation runs through the real CLI in a
// scratch root — every repo entry symlinked, README.md mutated and scripts/ COPIED so the
// shim resolves its root to the scratch instead of back here through the symlink.
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "nana-readme-inline-"));
try {
	for (const entry of fs.readdirSync(REPO_ROOT)) {
		if (entry === "README.md" || entry === "scripts" || entry === ".git") continue;
		fs.symlinkSync(path.join(REPO_ROOT, entry), path.join(scratch, entry));
	}
	fs.cpSync(path.join(REPO_ROOT, "scripts"), path.join(scratch, "scripts"), { recursive: true });
	const lines = fs.readFileSync(path.join(REPO_ROOT, "README.md"), "utf-8").split("\n");
	const i = lines.findIndex((l) => l.includes("`npm test`"));
	check("the root README names `npm test` inline", i >= 0, "no inline `npm test` left to mutate");
	lines[i] = lines[i].replace("`npm test`", "`npm nope`");
	fs.writeFileSync(path.join(scratch, "README.md"), lines.join("\n"));
	const broken = spawnSync(process.execPath, [path.join(scratch, "scripts", "readme-check.mjs"), "--check"], {
		cwd: scratch,
		encoding: "utf-8",
	});
	const log = `${broken.stdout ?? ""}${broken.stderr ?? ""}`;
	const want = `README.md:${i + 1}: 'npm nope' is not a script in package.json`;
	// req: G-012
	check("breaking an inline command in README.md fails the check", broken.status === 1 && log.includes(want), log.slice(-500));
} finally {
	fs.rmSync(scratch, { recursive: true, force: true });
}

console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
