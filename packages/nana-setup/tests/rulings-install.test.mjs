/**
 * @module packages/nana-setup/tests/rulings-install.test.mjs
 * @purpose Pins that install places nana-rulings.md in both pi's active agent dir and Claude
 *  Code's rules folder (a symlink on POSIX, a byte-equal copy on win32), and that doctor's
 *  `pi nana-rulings.md` row reads correctly for every shape: missing, a plain POSIX copy, a
 *  stale win32 copy, and after a real install.
 * @inputs bin/nana-setup.mjs, lib/steps.mjs's ruleSource/PACK_RULES_DIR, the shipped
 *  nana-pack/lib/rulings-config.mjs RULINGS_FILE, and throwaway --home/--pi-home roots with
 *  --pi-home always OUTSIDE <home>/.pi/agent
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (throwaway home and pi-home layouts, symlinks, byte copies), process (spawns the
 *  installer CLI)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected
 *  throw propagates and fails the run
 */
// rulings-file lane (2026-10-19), precedent writing-rule.test.mjs / install.test.mjs. Every run
// goes into throwaway --home/--pi-home roots; nothing touches the real machine. Checks match
// ONLY the rulings-named rows (must-meet.md: "Match only the rulings rows, not the exit code") —
// other rows (pi executable, project trust, pi-pack config, …) are left unseeded and unchecked.
import { tmpDir } from "./tmp-dir.mjs";
import { withPiStub } from "./stub-pi.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const pkg = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const { ruleSource } = await import(new URL("../lib/steps.mjs", import.meta.url).href);
const { PI_SUBAGENTS_FLOOR } = await import(new URL("../lib/doctor.mjs", import.meta.url).href);
const { RULINGS_FILE } = await import(new URL("../../nana-pack/lib/rulings-config.mjs", import.meta.url).href);

const SRC = ruleSource(RULINGS_FILE);

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : (extra ?? ""));
	if (!ok) fails++;
};

const tmps = [];
/** A fresh --home H and --pi-home P, P always a SEPARATE temp root, never <H>/.pi/agent (must-
 *  meet.md: otherwise code that hard-codes `<base>/.pi/agent` would still pass). Seeds just
 *  enough (a knowledge sources.json, a floor-version pi-subagents package) that install and
 *  doctor run to completion without crashing on an unrelated missing piece. */
function freshRoots() {
	const H = tmpDir(path.join(os.tmpdir(), "rulings-install-home-"));
	const P = tmpDir(path.join(os.tmpdir(), "rulings-install-pihome-"));
	tmps.push(H, P);
	fs.mkdirSync(path.join(P, "nana-knowledge"), { recursive: true });
	fs.writeFileSync(path.join(P, "nana-knowledge", "sources.json"), JSON.stringify({ roots: [] }));
	const subagentsDir = path.join(P, "npm", "node_modules", "pi-subagents");
	fs.mkdirSync(subagentsDir, { recursive: true });
	fs.writeFileSync(path.join(subagentsDir, "package.json"), JSON.stringify({ name: "pi-subagents", version: PI_SUBAGENTS_FLOOR }));
	return { H, P };
}
const run = (args, env) => {
	const invoke = () => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", env: { ...process.env, ...env } });
	return args[0] === "doctor" ? withPiStub(invoke) : invoke();
};
const win32Env = process.platform === "win32" ? {} : { NANA_SETUP_PLATFORM: "win32" };
const lstatSafe = (p) => {
	try {
		return fs.lstatSync(p);
	} catch {
		return null;
	}
};

/* ========================================================================================
 * R-1412 — install places nana-rulings.md in pi's active agent dir: a symlink on POSIX, a
 * byte-equal copy on win32.
 * ======================================================================================== */
{
	const { H, P } = freshRoots();
	run(["install", "--home", H, "--pi-home", P]);
	const target = path.join(P, RULINGS_FILE);
	const st = lstatSafe(target);
	const ok = Boolean(st?.isSymbolicLink() && (() => { try { return fs.realpathSync(target) === fs.realpathSync(SRC); } catch { return false; } })());
	// req: R-1412
	check("install places nana-rulings.md in the pi agent dir (link on POSIX, byte-equal copy on win32)",
		ok,
		JSON.stringify({ exists: Boolean(st), isSymlink: st?.isSymbolicLink() ?? null }),
	);
}
{
	const { H, P } = freshRoots();
	run(["install", "--home", H, "--pi-home", P], win32Env);
	const target = path.join(P, RULINGS_FILE);
	const st = lstatSafe(target);
	const ok = Boolean(st?.isFile() && !st.isSymbolicLink() && fs.readFileSync(target).equals(fs.readFileSync(SRC)));
	// req: R-1412
	check("install places nana-rulings.md in the pi agent dir (link on POSIX, byte-equal copy on win32)",
		ok,
		JSON.stringify({ exists: Boolean(st), isSymlink: st?.isSymbolicLink() ?? null }),
	);
}

/* ========================================================================================
 * R-1413 — install places nana-rulings.md in Claude Code's rules folder: a symlink on POSIX,
 * a byte-equal copy on win32.
 * ======================================================================================== */
{
	const { H, P } = freshRoots();
	run(["install", "--home", H, "--pi-home", P]);
	const target = path.join(H, ".claude", "rules", RULINGS_FILE);
	const st = lstatSafe(target);
	const ok = Boolean(st?.isSymbolicLink() && (() => { try { return fs.realpathSync(target) === fs.realpathSync(SRC); } catch { return false; } })());
	// req: R-1413
	check("install places nana-rulings.md in the Claude rules folder (link on POSIX, byte-equal copy on win32)",
		ok,
		JSON.stringify({ exists: Boolean(st), isSymlink: st?.isSymbolicLink() ?? null }),
	);
}
{
	const { H, P } = freshRoots();
	run(["install", "--home", H, "--pi-home", P], win32Env);
	const target = path.join(H, ".claude", "rules", RULINGS_FILE);
	const st = lstatSafe(target);
	const ok = Boolean(st?.isFile() && !st.isSymbolicLink() && fs.readFileSync(target).equals(fs.readFileSync(SRC)));
	// req: R-1413
	check("install places nana-rulings.md in the Claude rules folder (link on POSIX, byte-equal copy on win32)",
		ok,
		JSON.stringify({ exists: Boolean(st), isSymlink: st?.isSymbolicLink() ?? null }),
	);
}

/* ========================================================================================
 * R-1414 — doctor's `pi nana-rulings.md` row: ✗ missing, ✗ a plain POSIX copy, ✗ a stale
 * win32 copy, ✓ after a real install. Each sub-case matches ONLY this row, not the exit code.
 * ======================================================================================== */
{
	const { H, P } = freshRoots();
	const missing = run(["doctor", "--home", H, "--pi-home", P]);
	// req: R-1414
	check("doctor marks pi nana-rulings.md ✗ when missing, a POSIX copy or a stale win32 copy, and ✓ after install",
		/✗ pi nana-rulings\.md/.test(missing.stdout),
		missing.stdout,
	);

	run(["install", "--home", H, "--pi-home", P]);
	const afterInstall = run(["doctor", "--home", H, "--pi-home", P]);
	// req: R-1414
	check("doctor marks pi nana-rulings.md ✗ when missing, a POSIX copy or a stale win32 copy, and ✓ after install",
		/✓ pi nana-rulings\.md/.test(afterInstall.stdout),
		afterInstall.stdout,
	);

	// a plain, byte-equal COPY in place of the link (the posix shape doctor must refuse)
	const target = path.join(P, RULINGS_FILE);
	fs.unlinkSync(target);
	fs.writeFileSync(target, fs.readFileSync(SRC));
	const posixCopy = run(["doctor", "--home", H, "--pi-home", P]);
	// req: R-1414
	check("doctor marks pi nana-rulings.md ✗ when missing, a POSIX copy or a stale win32 copy, and ✓ after install",
		/✗ pi nana-rulings\.md/.test(posixCopy.stdout),
		posixCopy.stdout,
	);
}
{
	// win32: a STALE copy (content no longer matches the pack source) reads ✗
	const { H, P } = freshRoots();
	run(["install", "--home", H, "--pi-home", P], win32Env);
	const target = path.join(P, RULINGS_FILE);
	fs.writeFileSync(target, "stale content, no longer the pack source\n");
	const stale = run(["doctor", "--home", H, "--pi-home", P], win32Env);
	// req: R-1414
	check("doctor marks pi nana-rulings.md ✗ when missing, a POSIX copy or a stale win32 copy, and ✓ after install",
		/✗ pi nana-rulings\.md/.test(stale.stdout),
		stale.stdout,
	);
}

for (const td of tmps) {
	try {
		fs.rmSync(td, { recursive: true, force: true });
	} catch {
		/* best effort cleanup */
	}
}
process.exit(fails);
