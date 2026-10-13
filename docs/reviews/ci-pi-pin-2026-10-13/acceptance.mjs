// Seat acceptance for lane ci-pi-pin (frozen; written before the build, 2026-10-13). Run from the worktree root:
//   node docs/reviews/ci-pi-pin-2026-10-13/acceptance.mjs
// (A) reads .github/workflows/ci.yml like a reviewer; (B) installs CI's own pi line, expanded with ci.yml's env
// values, into a scratch prefix and checks the resolved tree, an import of pi's main entry, and the 18 test files
// the pi-codemode 1.2.0 drift broke; (C) a control: the same line WITHOUT the cutoff must reproduce the break.
// Network: two npm installs. Nothing is installed globally; every install uses --prefix under the OS temp folder.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const root = process.cwd();
let bad = 0, n = 0;
const out = (title, got, want) => {
	n++;
	const ok = JSON.stringify(got) === JSON.stringify(want);
	if (!ok) bad++;
	console.log(`${ok ? "ok  " : "MISS"} ${title}${ok ? "" : ` → ${JSON.stringify(got).slice(0, 300)} (want ${JSON.stringify(want)})`}`);
};
const SEALED = "2026-10-04T06:57:57Z";
const DRIFT_FILES = [
	"apps/desk/test/app-listener.test.mjs", "apps/desk/test/buffer-caps.test.mjs", "apps/desk/test/changes-endpoint.test.mjs",
	"apps/desk/test/crash-paths.test.mjs", "apps/desk/test/host-rule.test.mjs", "apps/desk/test/origin-rule.test.mjs",
	"apps/desk/test/pi-087-entries.test.mjs", "apps/desk/test/pi-session-parity.test.mjs", "apps/desk/test/prompt-detach.test.mjs",
	"apps/desk/test/spawn-and-persist.test.mjs", "apps/desk/test/stage-key-persistence.test.mjs", "apps/desk/test/teardown-invariants.test.mjs",
	"apps/desk/test/usage-line.test.mjs", "packages/nana-pack/tests/agent-dir-parity.test.mjs",
	"packages/nana-pack/tests/config-project-gate-fallback.test.mjs", "packages/nana-pack/tests/config-trust.test.mjs",
	"packages/nana-pack/tests/objective-golden.test.mjs", "packages/nana-pack/tests/post-edit-file-queue.test.mjs",
];

// (A) the workflow text
const ci = fs.readFileSync(path.join(root, ".github/workflows/ci.yml"), "utf8");
const live = ci.split("\n").filter((l) => !/^\s*#/.test(l));
const envBlock = /^env:\n((?:[ \t]+.*\n|\n)*?)(?=^\S)/m.exec(ci)?.[1] ?? "";
const val = (k) => new RegExp(`^\\s+${k}:\\s*"?([^"\\n]+?)"?\\s*$`, "m").exec(envBlock)?.[1] ?? null;
out("(a) PI_BEFORE is declared exactly once in the file", live.filter((l) => /^\s*PI_BEFORE:/.test(l)).length, 1);
out("(a) the workflow env holds PI_BEFORE, double-quoted, sealed value", /^\s+PI_BEFORE: "2026-10-04T06:57:57Z"\s*$/m.test(envBlock), true);
const installs = live.filter((l) => l.includes("@earendil-works/pi-coding-agent"));
out("(a) at least two pi install lines", installs.length >= 2, true);
out("(a) every pi install line ends with the cutoff flag", installs.every((l) => l.trimEnd().endsWith(' --before="${PI_BEFORE}"')), true);
out("(a) no npm_config_before anywhere in the workflow", live.some((l) => /npm_config_before/i.test(l)), false);
const npmrc = path.join(root, ".npmrc");
out("(a) no before line in a repository-root .npmrc", fs.existsSync(npmrc) && /^\s*before\s*=/m.test(fs.readFileSync(npmrc, "utf8")), false);

// (B) the suite job's own install line, expanded and pointed at a scratch prefix
const PI_VERSION = val("PI_VERSION"), PI_BEFORE = val("PI_BEFORE");
const suiteLine = installs.find((l) => /^\s*- run: npm i -g/.test(l)) ?? "";
const expand = (line, before) => line.replace(/^\s*- run:\s*/, "").replace(/\$\{PI_VERSION\}/g, PI_VERSION ?? "").replace(/\$\{PI_BEFORE\}/g, before ?? "");
const install = (cmd, prefix) => spawnSync("bash", ["-c", cmd.replace(/^npm i -g /, `npm i -g --prefix "${prefix}" `)], { encoding: "utf8", timeout: 10 * 60 * 1000 });
const tree = (prefix) => {
	const r = spawnSync("npm", ["ls", "--prefix", prefix, "-g", "--all", "--json"], { encoding: "utf8" });
	const seen = new Map();
	const walk = (deps) => { for (const [name, d] of Object.entries(deps ?? {})) { if (name.startsWith("@earendil-works/")) seen.set(name, d.version); walk(d.dependencies); } };
	try { walk(JSON.parse(r.stdout).dependencies); } catch {}
	return seen;
};
const importMain = (prefix) => spawnSync(process.execPath, ["-e", `import(${JSON.stringify(path.join(prefix, "lib/node_modules/@earendil-works/pi-coding-agent/dist/index.js"))}).then(()=>console.log("imported"),(e)=>{console.error(String(e));process.exit(1)})`], { encoding: "utf8" });
const envFor = (prefix) => {
	const e = { ...process.env };
	for (const k of Object.keys(e)) if (/^(NANA_|PI_CODING_AGENT_DIR$|npm_config_)/i.test(k)) delete e[k];
	return { ...e, PATH: `${path.join(prefix, "bin")}${path.delimiter}${e.PATH}`, npm_config_prefix: prefix };
};
const runFile = (rel, prefix) => {
	const file = path.join(root, rel);
	const cwd = rel.startsWith("apps/desk") ? path.join(root, "apps/desk") : path.join(root, "packages/nana-pack");
	return spawnSync(process.execPath, ["--experimental-strip-types", file], { cwd, env: envFor(prefix), encoding: "utf8", timeout: 5 * 60 * 1000 });
};

const pinned = fs.mkdtempSync(path.join(os.tmpdir(), "seat-pin-"));
const control = fs.mkdtempSync(path.join(os.tmpdir(), "seat-nopin-"));
try {
	out("(b) the suite install line was found", suiteLine.length > 0, true);
	const pi = install(expand(suiteLine, PI_BEFORE), pinned);
	out("(b) the pinned install exits 0", pi.status, 0);
	const t = tree(pinned);
	out("(b) the pinned tree holds pi-coding-agent", t.get("@earendil-works/pi-coding-agent"), "1.0.2");
	out("(b) every @earendil-works package in the pinned tree is 1.0.2 (at least eight)", t.size >= 8 && [...t.values()].every((v) => v === "1.0.2"), true);
	out("(b) pi's main entry imports from the pinned tree", importMain(pinned).status, 0);
	for (const rel of DRIFT_FILES) {
		const r = runFile(rel, pinned);
		out(`(b) ${rel} passes against the pinned tree`, r.status, 0);
	}

	// (C) control: the same line without the cutoff reproduces the break
	const noPin = expand(suiteLine, null).replace(/\s*--before="?"?\s*$/, "");
	const c = install(noPin, control);
	out("(c) the unpinned control install exits 0", c.status, 0);
	out("(c) the unpinned control resolves pi-codemode past 1.0.x", /^1\.[1-9]/.test(tree(control).get("@earendil-works/pi-codemode") ?? ""), true);
	const ci2 = importMain(control);
	out("(c) the unpinned control fails pi's import with the missing export", ci2.status !== 0 && /does not provide an export named/.test(ci2.stderr), true);
	out("(c) a drift file fails against the unpinned control", runFile("packages/nana-pack/tests/objective-golden.test.mjs", control).status !== 0, true);
} finally {
	fs.rmSync(pinned, { recursive: true, force: true });
	fs.rmSync(control, { recursive: true, force: true });
}

console.log(`cases: ${n - bad}/${n}`);
console.log(`ci-pi-pin acceptance: ${bad} mismatch(es)`);
process.exit(bad ? 1 : 0);
