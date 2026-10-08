/**
 * @module packages/nana-setup/tests/relative-agent-dir.test.mjs
 * @purpose Pins that an AMBIENT relative PI_CODING_AGENT_DIR is refused by `install`, `project` and `project --check` with the cwd and the remedy named, while an explicit --pi-home is honoured and `doctor` warns
 * @inputs bin/nana-setup.mjs with a relative PI_CODING_AGENT_DIR in the environment, and throwaway home and project dirs
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (throwaway home and project dirs), process (sets PI_CODING_AGENT_DIR, spawns the setup CLI)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// U2 fix round 2 (sol r2 HIGH): an AMBIENT relative PI_CODING_AGENT_DIR resolves against each
// process's own cwd, so a normal `install` would seed <setup-cwd>/rel/nana-pack.json that pi started
// anywhere else never reads. `install` refuses it (naming the dir, the cwd and the remedy); an
// explicit `--pi-home` is honoured; `doctor` warns (`!`, the cwd named) and never says "all good".
// U2 fix round 3 (sol r3 HIGH): `project` and `project --check` read the user-scope config too, so
// they refuse on the same terms.
// Nothing here touches the real machine: HOME is a temp dir, and the refusal writes nothing.
import { tmpDir } from "./tmp-dir.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const pkg = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const cli = path.join(pkg, "bin", "nana-setup.mjs");

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

const HOME = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "nana-setup-rel-")));
const CWD = path.join(HOME, "somewhere");
fs.mkdirSync(CWD);
const REL = "rel-agent";
const resolved = path.join(CWD, REL);
const env = { ...process.env, HOME, USERPROFILE: HOME, PI_CODING_AGENT_DIR: REL };
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { cwd: CWD, env, encoding: "utf-8" });

try {
	// ── install, ambient relative, no flag → refusal, nothing written ──
	for (const args of [["install"], ["install", "--dry-run"]]) {
		const r = run(...args);
		const out = r.stdout + r.stderr;
		// req: R-345
		check(`${args.join(" ")}: ambient relative value exits non-zero`, r.status !== 0 && r.status !== null, `status ${r.status}\n${out}`);
		// req: R-345
		check(`${args.join(" ")}: names the resolved dir`, out.includes(resolved), out);
		// req: R-345
		check(`${args.join(" ")}: says it is specific to the current working directory`, out.includes("specific to the current working directory") && out.includes(CWD), out);
		// req: R-345
		check(`${args.join(" ")}: gives the remedy`, out.includes("--pi-home <absolute dir>") && /absolute path/.test(out), out);
	}
	// req: R-345
	check("the refusal wrote no nana-pack.json anywhere", !fs.existsSync(resolved) && !fs.existsSync(path.join(HOME, ".pi")) && !fs.existsSync(path.join(HOME, ".claude")));

	// ── install with an explicit --pi-home (the user's decision) → proceeds, into exactly that dir ──
	const explicit = path.join(HOME, "explicit-agent");
	fs.mkdirSync(path.join(explicit, "nana-knowledge"), { recursive: true });
	fs.writeFileSync(path.join(explicit, "nana-knowledge", "sources.json"), JSON.stringify({ roots: [] }));
	const ok = run("install", "--pi-home", explicit);
	check("install --pi-home <abs> succeeds despite the ambient relative value", ok.status === 0, ok.stdout + ok.stderr);
	check("…and seeds nana-pack.json in the --pi-home dir", fs.existsSync(path.join(explicit, "nana-pack.json")));
	check("…and nothing in the ambient-relative dir", !fs.existsSync(resolved));
	const relExplicit = run("install", "--pi-home", REL, "--dry-run");
	check("an explicit RELATIVE --pi-home is not refused (resolved as given)", !/specific to the current working directory/.test(relExplicit.stdout + relExplicit.stderr) && relExplicit.stdout.includes(REL), relExplicit.stdout + relExplicit.stderr);

	// ── project / project --check: the same refusal (sol r3 HIGH) ──
	// `project` reads the user-scope pi config to decide whether to write a project one, so under an
	// ambient relative value it would read <setup-cwd>/rel-agent and could seed a project config that
	// shadows the real user-scope postEdit checks.
	const target = path.join(HOME, "a-project");
	fs.mkdirSync(target, { recursive: true });
	for (const args of [["project", target], ["project", target, "--dry-run"], ["project", target, "--check"]]) {
		const r = run(...args);
		const out = r.stdout + r.stderr;
		// req: R-345
		check(`${args.join(" ")}: ambient relative value exits non-zero`, r.status !== 0 && r.status !== null, `status ${r.status}\n${out}`);
		// req: R-345
		check(`${args.join(" ")}: names the resolved dir and the cwd`, out.includes(resolved) && out.includes(CWD), out);
		// req: R-345
		check(`${args.join(" ")}: gives the remedy`, out.includes("--pi-home <absolute dir>"), out);
	}
	// req: R-345
	check("the project refusal created nothing in the target", !fs.existsSync(path.join(target, ".pi")) && !fs.existsSync(path.join(target, "AGENTS.md")), fs.readdirSync(target).join(","));
	const pOk = run("project", target, "--pi-home", path.join(HOME, "explicit-agent"), "--dry-run");
	check("project --pi-home <abs> is not refused", !/specific to the current working directory/.test(pOk.stdout + pOk.stderr), pOk.stdout + pOk.stderr);

	// ── doctor, ambient relative, even with a seeded file there → warning, never healthy ──
	fs.mkdirSync(resolved, { recursive: true });
	fs.copyFileSync(path.join(explicit, "nana-pack.json"), path.join(resolved, "nana-pack.json"));
	const d = run("doctor");
	check("doctor still runs (not a refusal) and reads the cwd-relative file", d.stdout.includes(`✓ pi nana-pack.json`) || d.stdout.includes(path.join(resolved, "nana-pack.json")), d.stdout + d.stderr);
	const warnLine = d.stdout.split("\n").find((l) => l.trim().startsWith("!"));
	check("doctor prints a ! warning line naming the cwd it resolved against", !!warnLine && warnLine.includes(CWD) && /relative/.test(warnLine), d.stdout);
	check("doctor never says 'all good' with the warning", !d.stdout.includes("all good"), d.stdout);
// req: R-341
	check("doctor exits non-zero with the warning", d.status === 1, `status ${d.status}`);
	const dx = spawnSync(process.execPath, [cli, "doctor", "--pi-home", explicit], { cwd: CWD, env, encoding: "utf-8" });
	check("doctor --pi-home <abs>: no cwd-specific warning", !dx.stdout.split("\n").some((l) => l.trim().startsWith("!")), dx.stdout);
} finally {
	fs.rmSync(HOME, { recursive: true, force: true });
}
console.log(fails ? `${fails} FAIL` : "all PASS");
process.exit(fails);
