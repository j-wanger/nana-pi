// The desk imports pi's session parser from the SAME install it spawns. This test
// drives that rule against synthetic install layouts, because the failure it guards
// is silent: import one pi, spawn another, and the desk renders sessions with a
// different build than the one writing them. Nothing here starts a server.
//
// Failure-first — every case below is a way the old "search the usual places"
// fallback returned a confident wrong answer:
//   1. a MANAGER SHIM (Volta) whose `pi` is a script, not a symlink into the package
//   2. a stale second copy under ~/.local or Homebrew alongside the live one
//   3. two installs of the same version that cannot be told apart
//   4. an executable that will not say what version it is
//   5. DESK_PI_ROOT pointing somewhere that is not the package (or not the same one)
//   6. an install below the minimum whose exports were never verified
// Synthetic versions are 9.9.x so the machine's real pi can never satisfy a case.
//
// Run: node apps/desk/test/pi-resolution.test.mjs   (exit 0 = all PASS)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { compareSemver, loadPiSession, PI_MIN_VERSION, PI_PACKAGE, parseSemver, resolvePiBin, resolvePiPackage, sameVersion, walkUpToPackage } from "../pi-session.mjs";

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, extra); if (!ok) fails++; };
const TD = fs.mkdtempSync(path.join(os.tmpdir(), "desk-pi-res-"));
const HOME0 = process.env.HOME;
const ROOT0 = process.env.DESK_PI_ROOT;

// an installed package at <prefix>/lib/node_modules/@earendil-works/pi-coding-agent
const install = (prefix, version, { withDist = false } = {}) => {
	const root = path.join(prefix, "lib", "node_modules", ...PI_PACKAGE.split("/"));
	fs.mkdirSync(root, { recursive: true });
	fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ name: PI_PACKAGE, version, main: "./dist/index.js" }));
	if (withDist) {
		fs.mkdirSync(path.join(root, "dist", "bundle"), { recursive: true });
		fs.writeFileSync(path.join(root, "dist", "bundle", "cli.js"), "#!/usr/bin/env node\n");
	}
	return root;
};
// a `pi` on PATH that is a SCRIPT, the way a version manager's shim is. Every shim
// records that it ran, so "this path spawns nothing" is checked against the file
// system rather than against the absence of a warning.
const RAN = path.join(TD, "ran");
const shim = (dir, body) => {
	fs.mkdirSync(dir, { recursive: true });
	const p = path.join(dir, "pi");
	fs.writeFileSync(p, `#!/usr/bin/env node\nrequire("node:fs").appendFileSync(${JSON.stringify(RAN)}, process.argv.slice(2).join(" ") + "\\n");\n${body}\n`, { mode: 0o755 });
	return p;
};
const ranCount = () => (fs.existsSync(RAN) ? fs.readFileSync(RAN, "utf-8").split("\n").filter(Boolean).length : 0);
const err = (fn) => {
	try {
		fn();
		return null;
	} catch (e) {
		return e.message;
	}
};

try {
	// ── 1. the normal case: the executable lives INSIDE the package ──
	const pkgRoot = install(path.join(TD, "npm-prefix"), "7.7.7", { withDist: true });
	const binDir = path.join(TD, "npm-prefix", "bin");
	fs.mkdirSync(binDir, { recursive: true });
	const linked = path.join(binDir, "pi");
	fs.symlinkSync(path.join(pkgRoot, "dist", "bundle", "cli.js"), linked);
	// walk-up reports the REAL path (macOS tmpdirs live under /private)
	const same = (a, b) => !!a && !!b && fs.realpathSync(a) === fs.realpathSync(b);
	check("walk-up finds the package that contains the executable", same(walkUpToPackage(linked), pkgRoot), String(walkUpToPackage(linked)));
	let r = resolvePiPackage(linked);
	check("…and that is what resolution returns, tied by construction", same(r.root, pkgRoot) && r.via === "PI_BIN walk-up", `${r.via} → ${r.root}`);
	check("…without asking the executable anything (it cannot even run)", r.version === "7.7.7", String(r.version));

	// ── 2. a SHIM: not inside any package, so the version it reports is the tie ──
	const shimHome = path.join(TD, "shim-home");
	process.env.HOME = shimHome;
	const live = install(path.join(shimHome, ".local"), "9.9.9");
	const stale = install(path.join(shimHome, ".npm-global"), "9.9.8"); // the trap: an older copy
	const shim999 = shim(path.join(TD, "shim-bin"), 'console.log("9.9.9")');
	check("a shim executable is inside no package", walkUpToPackage(shim999) === null);
	r = resolvePiPackage(shim999);
	check("the install whose version matches the shim wins", r.root === live && r.version === "9.9.9", `${r.via} → ${r.root}`);
	check("…and the stale copy is not it", r.root !== stale);

	// ── 3. two installs of the SAME version: unresolvable, so refuse ──
	fs.writeFileSync(path.join(stale, "package.json"), JSON.stringify({ name: PI_PACKAGE, version: "9.9.9" }));
	let m = err(() => resolvePiPackage(shim999));
	check("two indistinguishable installs → refuses instead of guessing", !!m && /more than one/.test(m), String(m).split("\n")[0]);
	check("…naming both directories", !!m && m.includes(live) && m.includes(stale));
	check("…and telling the operator about DESK_PI_ROOT", !!m && m.includes("DESK_PI_ROOT"));

	// ── 4. nothing matches what the executable reports ──
	const shim123 = shim(path.join(TD, "shim-bin-2"), 'console.log("9.1.2")');
	m = err(() => resolvePiPackage(shim123));
	check("no install matches the spawned pi's version → refuses", !!m && /no installed .* matches/.test(m), String(m).split("\n")[0]);
	check("…naming the version the executable reported", !!m && m.includes("9.1.2"));
	check("…and listing what was found instead, with versions", !!m && m.includes("9.9.9"));

	// ── 5. an executable that will not say what version it is ──
	const mute = shim(path.join(TD, "shim-mute"), "process.exit(1)");
	m = err(() => resolvePiPackage(mute));
	check("a shim that will not report a version → refuses (nothing can be tied)", !!m && /cannot tie/.test(m), String(m).split("\n")[0]);
	check("…naming the executable it could not tie", !!m && m.includes(mute));
	m = err(() => resolvePiPackage(path.join(TD, "no-such-pi")));
	check("a missing executable → the same refusal, not a lucky guess", !!m && /cannot tie/.test(m), String(m).split("\n")[0]);

	// ── 6. DESK_PI_ROOT: exclusive, and honest about a mismatch ──
	process.env.DESK_PI_ROOT = path.join(TD, "not-a-package");
	fs.mkdirSync(process.env.DESK_PI_ROOT, { recursive: true });
	m = err(() => resolvePiPackage(shim999));
	check("DESK_PI_ROOT that is not the package → refuses (no silent fallback)", !!m && /not a .* package directory/.test(m), String(m).split("\n")[0]);
	fs.writeFileSync(path.join(stale, "package.json"), JSON.stringify({ name: PI_PACKAGE, version: "9.9.8" }));
	process.env.DESK_PI_ROOT = stale;
	const ranBefore = ranCount();
	r = resolvePiPackage(shim999);
	check("DESK_PI_ROOT is used exclusively — nothing else is consulted", r.root === stale && r.via === "DESK_PI_ROOT", `${r.via} → ${r.root}`);
	check("…and it spawns nothing: the shim recorded no run", ranCount() === ranBefore, `${ranBefore} → ${ranCount()}`);
	check("…with nothing to warn about (a shim contradicts no package)", r.warnings.length === 0, r.warnings.join("; "));
	// the realistic way an override goes stale: a REAL binary inside ANOTHER package.
	// The override does not suspend the same-install invariant, so this REFUSES.
	m = err(() => resolvePiPackage(linked)); // linked lives in pkgRoot (7.7.7)
	check("an override that disagrees with the binary's own package → refuses", !!m && /would parse sessions with one install and spawn the other/.test(m), String(m).split("\n")[0]);
	check("…naming both installs", !!m && m.includes(stale) && m.includes(pkgRoot), String(m).split("\n")[0]);
	check("…and offering the two fixes: point the override at that package, or name the binary too",
		!!m && m.includes(`point DESK_PI_ROOT at ${fs.realpathSync(pkgRoot)}`) && m.includes("DESK_PI_BIN"), String(m).split("\n").slice(1).join(" | "));
	// naming BOTH halves is the one way they may differ: the operator owns it
	process.env.DESK_PI_BIN = linked;
	r = resolvePiPackage(resolvePiBin());
	check("…unless DESK_PI_BIN names the binary too, and then it is a warning", r.root === stale && r.warnings.length === 1, r.warnings.join("; "));
	check("…which still says both installs out loud", r.warnings[0]?.includes(stale) && r.warnings[0]?.includes(pkgRoot), r.warnings.join("; "));
	check("…and DESK_PI_BIN is the binary the desk will spawn", resolvePiBin() === linked, resolvePiBin());
	delete process.env.DESK_PI_BIN;
	delete process.env.DESK_PI_ROOT;

	// ── version semantics: identity for tying, precedence for the floor ──
	check("a prerelease sorts BELOW its release", compareSemver("0.84.4-beta.1", "0.84.4") === -1);
	check("…and above the previous patch", compareSemver("0.84.4-beta.1", "0.84.3") === 1);
	check("numeric prerelease identifiers compare numerically, not as text", compareSemver("1.0.0-2", "1.0.0-10") === -1);
	check("…and rank below alphanumeric ones", compareSemver("1.0.0-1", "1.0.0-alpha") === -1);
	check("a shorter prerelease is the lower one", compareSemver("1.0.0-alpha", "1.0.0-alpha.1") === -1);
	check("an unparsable version compares to NOTHING (never 'equal')", compareSemver("dev", "0.84.4") === null && compareSemver("", "0.84.4") === null && parseSemver("0.84") === null);
	check("tying is identity: the same version ties", sameVersion("0.84.4", "v0.84.4"));
	check("…a prerelease does NOT tie to its release", !sameVersion("0.84.4-beta.1", "0.84.4"));
	check("…nor does another build of the same version", !sameVersion("0.84.4+deadbeef", "0.84.4"));
	check("…and an unparsable version ties to nothing, including itself", !sameVersion("dev", "dev"));

	// ── 7. the version floor is a refusal, not a warning ──
	process.env.DESK_PI_ROOT = install(path.join(TD, "old-prefix"), "0.80.0");
	const old = await loadPiSession(shim999).then(() => null, (e) => e.message);
	check(`an install below ${PI_MIN_VERSION} refuses to load`, !!old && old.includes(`requires >= ${PI_MIN_VERSION}`), String(old).split("\n")[0]);
	check("…and says which version it found", !!old && old.includes("0.80.0"));
	// a PRERELEASE of the floor version is below it: the exports these three names
	// stand for need not exist yet in a beta of the release that introduced them
	process.env.DESK_PI_ROOT = install(path.join(TD, "beta-prefix"), `${PI_MIN_VERSION}-beta.1`);
	const beta = await loadPiSession(shim999).then(() => null, (e) => e.message);
	check(`${PI_MIN_VERSION}-beta.1 is BELOW ${PI_MIN_VERSION} and refuses too`, !!beta && beta.includes(`requires >= ${PI_MIN_VERSION}`), String(beta).split("\n")[0]);
	// a version that is not a version at all: refuse, showing the string
	process.env.DESK_PI_ROOT = install(path.join(TD, "weird-prefix"), "nightly");
	const weird = await loadPiSession(shim999).then(() => null, (e) => e.message);
	check("an unparsable version refuses rather than passing the floor", !!weird && /not a semantic version/.test(weird), String(weird).split("\n")[0]);
	check("…quoting the string it could not read", !!weird && weird.includes('"nightly"'), String(weird).split("\n")[0]);
	delete process.env.DESK_PI_ROOT;

	// ── 7b. an install that is new enough but no longer exports what we need ──
	// (the shape of an upstream that renames or drops one of the three)
	const gutted = install(path.join(TD, "gutted-prefix"), "9.9.9");
	fs.mkdirSync(path.join(gutted, "dist"), { recursive: true });
	fs.writeFileSync(path.join(gutted, "dist", "index.js"), "export const somethingElse = 1;\n");
	process.env.DESK_PI_ROOT = gutted;
	const gone = await loadPiSession(shim999).then(() => null, (e) => e.message);
	check("a pi missing the session exports refuses, naming each one", !!gone && /does not export/.test(gone) && ["parseSessionEntries", "migrateSessionEntries", "CURRENT_SESSION_VERSION"].every((n) => gone.includes(n)), String(gone).split("\n")[0]);
	delete process.env.DESK_PI_ROOT;

	// ── 8. the real machine: whatever pi is installed here resolves and ties ──
	process.env.HOME = HOME0;
	const realBin = resolvePiBin();
	r = resolvePiPackage(realBin);
	check("the machine's own pi resolves", !!r.root, `${r.via} → ${r.root} (${r.version})`);
	check("…tied to the binary the desk spawns, not merely found", r.via === "PI_BIN walk-up" || r.via === "DESK_PI_ROOT" || !!r.version, r.via);
} catch (e) {
	console.log("FAIL harness", e?.stack || e);
	fails++;
} finally {
	if (HOME0 === undefined) delete process.env.HOME; else process.env.HOME = HOME0;
	if (ROOT0 === undefined) delete process.env.DESK_PI_ROOT; else process.env.DESK_PI_ROOT = ROOT0;
	fs.rmSync(TD, { recursive: true, force: true });
}
console.log(fails ? `${fails} FAILED` : "all PASS");
process.exit(fails ? 1 : 0);
