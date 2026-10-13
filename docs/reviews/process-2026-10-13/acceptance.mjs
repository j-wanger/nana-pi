// Seat acceptance for lane process (frozen; written before the build, 2026-10-13). Run from the worktree root:
//   node docs/reviews/process-2026-10-13/acceptance.mjs
// Spec: CHANGE.md §5 "The seat's acceptance script", plus §2 rows R-1100–R-1111, §3 design, §4 scope.
// (a) committed text against the proposed files; (b) the install-check land step outside the shared region;
// (c) the worktree's pi-review against a stub pi (argv captured, ledger read); (d) the R-1106 refusal from temp
// copies of the pack's bin/, lib/ and prompts/; (e) README step 8 as written, against a scratch home; (f) rows and
// the tree check; (g) the branch diff against §4. POSIX only (the stubs are sh scripts). Every HOME, ledger, repo
// and pack copy lives under the OS temp folder; the real ~/.pi and ~/.claude are never read or written by a child.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const root = process.cwd();
const LANE = path.join(root, "docs/reviews/process-2026-10-13");
if (!fs.existsSync(path.join(LANE, "CHANGE.md"))) {
	console.error("run from the process worktree root: node docs/reviews/process-2026-10-13/acceptance.mjs");
	process.exit(2);
}
let bad = 0, n = 0;
const out = (title, got, want, detail = "") => {
	n++;
	const ok = JSON.stringify(got) === JSON.stringify(want);
	if (!ok) bad++;
	console.log(`${ok ? "ok  " : "MISS"} ${title}${ok ? "" : ` → ${JSON.stringify(got).slice(0, 300)} (want ${JSON.stringify(want)})${detail ? ` [${String(detail).replace(/\s+/g, " ").slice(0, 400)}]` : ""}`}`);
};
const read = (rel) => { try { return fs.readFileSync(path.join(root, rel)); } catch { return null; } };
const text = (rel) => read(rel)?.toString("utf8") ?? null;
const occurrences = (hay, needle) => { if (!needle) return 0; let k = 0, i = hay.indexOf(needle); while (i >= 0) { k++; i = hay.indexOf(needle, i + needle.length); } return k; };

const STANDARD = "packages/nana-pack/prompts/review-standard.md";
const PREAMBLE = "packages/nana-pack/prompts/builder-preamble.md"; // §3/§4: where pi-worker.mjs:92 reads it
const SHARED = "templates/_shared/working-under-nana-pi.md";
const BEGIN = "<!-- nana:working-under-nana-pi begin -->";
const END = "<!-- nana:working-under-nana-pi end -->";
const PI_REVIEW = path.join(root, "packages/nana-pack/bin/pi-review.mjs");
const SETUP = path.join(root, "packages/nana-setup/bin/nana-setup.mjs");

// ---------------------------------------------------------------- (a) committed text vs the proposed files
const proposedStandard = fs.readFileSync(path.join(LANE, "review-standard.proposed.md"));
const proposedPreamble = fs.readFileSync(path.join(LANE, "builder-preamble.proposed.md"));
const proposedBullets = fs.readFileSync(path.join(LANE, "shared-text.proposed.md"), "utf8");
out("(a) committed review standard is byte-equal to review-standard.proposed.md", read(STANDARD)?.equals(proposedStandard) ?? "absent", true);
out("(a) committed builder preamble is byte-equal to builder-preamble.proposed.md", read(PREAMBLE)?.equals(proposedPreamble) ?? "absent", true);
const shared = text(SHARED) ?? "";
out("(a) the shared file carries shared-text.proposed.md's bullets byte-equal, once, as whole lines", occurrences(shared, `\n${proposedBullets}`), 1);
const mainShared = spawnSync("git", ["show", `main:${SHARED}`], { cwd: root, encoding: "utf8" }).stdout ?? "";
const ladder = mainShared.split("\n").find((l) => l.startsWith("- Review ladder:")) ?? "\0";
const expectedShared = mainShared.replace(`${ladder}\n`, `${ladder}\n${proposedBullets}`);
out("(a) the shared file is main's copy with exactly those bullets inserted after the Review ladder bullet", mainShared.length > 0 && shared === expectedShared, true,
	`main ${mainShared.length} bytes, now ${shared.length}, expected ${expectedShared.length}`);
const agents = text("AGENTS.md") ?? "";
const b = agents.indexOf(`${BEGIN}\n`), e = agents.indexOf(`\n${END}`, b + 1);
const region = b < 0 || e < 0 ? null : agents.slice(b + BEGIN.length + 1, e + 1);
out("(a) AGENTS.md's shared region is byte-identical to the shared file", region === shared, true);
let link = null;
try { link = fs.lstatSync(path.join(root, "CLAUDE.md")).isSymbolicLink() ? fs.readlinkSync(path.join(root, "CLAUDE.md")) : "not a symlink"; } catch { link = "absent"; }
out("(a) CLAUDE.md is still a symlink to AGENTS.md", link, "AGENTS.md");

// ---------------------------------------------------------------- (b) R-1109: the install check outside the region
const outside = b < 0 || e < 0 ? agents : agents.slice(0, b) + agents.slice(e + END.length + 1);
const steps = (t) => t.split(/\n\s*\n/).flatMap((block) => block.split(/\n(?=\s*(?:[-*]|\d+\.)\s)/));
const installStep = (s) => /install[- ]check/i.test(s) && /macOS/.test(s) && /nana-land/.test(s);
const found = steps(outside).filter(installStep);
out("(b) AGENTS.md outside the shared markers carries one step: install check + macOS + nana-land (R-1109)", found.length, 1);
out("(b) the shared file names no install check (§3: it stays outside the markers)", /install[- ]check/i.test(shared), false);

// ---------------------------------------------------------------- shared harness for (c) and (d)
const scratch = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "process-accept-")));
const stubBin = path.join(scratch, "stub-bin");
fs.mkdirSync(stubBin);
const stubJs = path.join(scratch, "stub-pi.mjs");
fs.writeFileSync(stubJs, `import fs from "node:fs";
const argv = process.argv.slice(2);
if (argv[0] === "--version") { console.log("1.0.2"); process.exit(0); }
const file = process.env.ACCEPT_ARGV_FILE;
if (!file) { console.error("stub pi rejects " + argv[0]); process.exit(1); }
fs.writeFileSync(file, JSON.stringify(argv));
console.log("Stub review: no findings.");
console.log("VERDICT: LAND");
`);
fs.writeFileSync(path.join(stubBin, "pi"), `#!/bin/sh\nexec "${process.execPath}" "${stubJs}" "$@"\n`);
fs.chmodSync(path.join(stubBin, "pi"), 0o755);
const cleanEnv = () => { const env = { ...process.env }; for (const k of Object.keys(env)) if (/^(NANA_|GIT_|PI_CODING_AGENT_DIR$)/.test(k)) delete env[k]; return env; };
const envFor = (home, extra = {}) => ({ ...cleanEnv(), HOME: home, USERPROFILE: home, PI_CODING_AGENT_DIR: path.join(home, ".pi", "agent"), PATH: `${stubBin}${path.delimiter}${process.env.PATH}`, ...extra });
const newHome = (name) => { const h = path.join(scratch, `home-${name}`); fs.mkdirSync(h); return h; };
const repo = path.join(scratch, "repo");
fs.mkdirSync(repo);
const g = (...args) => spawnSync("git", ["-c", "user.name=seat", "-c", "user.email=seat@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd: repo, encoding: "utf8", env: cleanEnv() });
g("init", "-q", "-b", "main");
fs.writeFileSync(path.join(repo, "change.txt"), "a scratch change to review\n");
g("add", "change.txt");
g("commit", "-qm", "scratch");
const brief = path.join(scratch, "brief.md");
fs.writeFileSync(brief, "Caller brief: review the scratch change in change.txt.\n");
const review = (bin, home, item, argvFile) => spawnSync(process.execPath, [bin, "--out", path.join(scratch, `${item}.md`), "--item", item, "--retries", "0", "--stall-secs", "10", "--poll", "0.2",
	"--", "--append-system-prompt", brief, "-p", "Review the scratch change."], { cwd: repo, env: envFor(home, { ACCEPT_ARGV_FILE: argvFile }), encoding: "utf8", timeout: 120_000 });
const readArgv = (file) => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; } };
const appended = (argv) => (argv ?? []).flatMap((a, i, all) => (a === "--append-system-prompt" && i + 1 < all.length ? [{ i: i + 1, v: all[i + 1] }] : []));
const IMMUTABLE = "Your cwd is an immutable checkout of revision ";
const resDir = (home) => path.join(home, ".pi", "agent", "review-ledger.reservations");

try {
	// -------------------------------------------------------------- (c) R-1105: the worktree's pi-review against a stub pi
	const homeC = newHome("c");
	const argvC = path.join(scratch, "argv-c.json");
	const runC = review(PI_REVIEW, homeC, "process-acceptance-c", argvC);
	const argv = readArgv(argvC);
	out("(c) harness: the stub pi started and its argv was captured", Array.isArray(argv), true, runC.stderr);
	out("(c) pi-review exits 0 against the stub", runC.status, 0, runC.stderr);
	let rounds = [];
	try { rounds = fs.readFileSync(path.join(homeC, ".pi/agent/review-ledger.rounds.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)); } catch {}
	out("(c) the scratch home's ledger recorded a LAND round for the item", rounds.some((r) => r.item === "process-acceptance-c" && r.verdict === "LAND"), true, JSON.stringify(rounds));
	const standard = text(STANDARD);
	const want = standard?.trim() || null;
	const all = (argv ?? []).join("\0");
	const asp = appended(argv);
	const immutable = asp.filter((x) => x.v.startsWith(IMMUTABLE));
	out("(c) the immutable-checkout sentence is appended exactly once (R-974 kept)", immutable.length, 1);
	out("(c) the stub received the standard's text exactly once in its whole argv (R-1105)", want ? occurrences(all, want) : "standard file absent in the worktree", 1,
		`${asp.length} --append-system-prompt value(s)`);
	const std = asp.filter((x) => want && x.v.trim() === want);
	out("(c) that text is one --append-system-prompt value of its own (R-1105)", std.length, 1);
	out("(c) no argv element names the standard's path (R-1105)", (argv ?? []).filter((a) => a.includes("review-standard.md")).length, 0);
	out("(c) the standard is appended after the immutable-checkout sentence (R-1105)", std.length === 1 && immutable.length === 1 && std[0].i > immutable[0].i, true,
		`immutable at ${immutable[0]?.i}, standard at ${std[0]?.i}`);

	// -------------------------------------------------------------- (d) R-1106: refusal from a temp copy of the pack
	const pack = path.join(scratch, "pack-copy");
	for (const dir of ["bin", "lib", "prompts"]) fs.cpSync(path.join(root, "packages/nana-pack", dir), path.join(pack, dir), { recursive: true });
	const copyStandard = path.join(pack, "prompts", "review-standard.md");
	const copyBin = path.join(pack, "bin", "pi-review.mjs");
	// Control: with the proposed text in place the copy must run and start the stub, so no refusal below passes vacuously.
	fs.rmSync(copyStandard, { recursive: true, force: true });
	fs.writeFileSync(copyStandard, proposedStandard);
	const homeCtl = newHome("d-control");
	const argvCtl = path.join(scratch, "argv-d-control.json");
	const ctl = review(copyBin, homeCtl, "process-acceptance-d-control", argvCtl);
	out("(d) control: the pack copy with the standard present exits 0 and starts the stub", [ctl.status, fs.existsSync(argvCtl)], [0, true], ctl.stderr);
	const variants = [
		["missing", () => fs.rmSync(copyStandard, { recursive: true, force: true })],
		["a directory", () => { fs.rmSync(copyStandard, { recursive: true, force: true }); fs.mkdirSync(copyStandard); }],
		["blank", () => { fs.rmSync(copyStandard, { recursive: true, force: true }); fs.writeFileSync(copyStandard, " \r\n\t\r\n"); }],
	];
	for (const [label, arrange] of variants) {
		arrange();
		const slug = `process-acceptance-d-${label.replace(/\W+/g, "-")}`;
		const home = newHome(slug);
		const argvFile = path.join(scratch, `argv-${slug}.json`);
		const r = review(copyBin, home, slug, argvFile);
		out(`(d) standard ${label}: pi-review exits 1 (R-1106)`, r.status, 1, r.stderr);
		out(`(d) standard ${label}: stderr names the file`, /review-standard\.md/.test(r.stderr ?? ""), true, r.stderr);
		out(`(d) standard ${label}: no reservations directory in the scratch home`, fs.existsSync(resDir(home)), false);
		out(`(d) standard ${label}: no admission note on stderr`, /admitted as round/.test(r.stderr ?? ""), false);
		out(`(d) standard ${label}: the stub pi never started`, fs.existsSync(argvFile), false);
	}

	// -------------------------------------------------------------- (e) R-1111: README step 8 as written
	const readme = text("README.md") ?? "";
	const heading = "### Fresh machine (macOS), in order";
	const start = readme.indexOf(heading);
	const checklist = start < 0 ? "" : readme.slice(start + heading.length).split(/\n### /)[0];
	const step8 = [...checklist.matchAll(/^\s*(\d+)\.\s+(.+)$/gm)].find((m) => m[1] === "8")?.[2] ?? "";
	const commands = [...step8.matchAll(/`([^`]+)`/g)].map((m) => m[1]).filter((c) => /^nana-setup\s/.test(c));
	const kinds = commands.map((c) => c.split(/\s+/)[1]);
	out("(e) README step 8 runs a nana-setup trust command before nana-setup doctor (R-1111)",
		kinds.includes("trust") && kinds.includes("doctor") && kinds.indexOf("trust") < kinds.indexOf("doctor"), true, step8);
	const homeE = newHome("e");
	const envE = envFor(homeE);
	const install = spawnSync(process.execPath, [SETUP, "install", "--home", homeE], { cwd: root, env: envE, encoding: "utf8", timeout: 600_000 });
	out("(e) harness: nana-setup install --home <scratch> exits 0", install.status, 0, install.stderr);
	const adapt = (cmd) => {
		const words = cmd.split(/\s+/).map((w) => (w === "~/nana-pi" || w === "~/nana-pi/" ? root : w));
		return [SETUP, ...words.slice(1), "--home", homeE, ...(words[1] === "trust" ? ["--yes"] : [])];
	};
	// Run step 8's nana-setup commands in the README's order, each from the worktree (the step says "from ~/nana-pi").
	const ran = new Map();
	for (const cmd of commands) ran.set(cmd.split(/\s+/)[1], { cmd, r: spawnSync(process.execPath, adapt(cmd), { cwd: root, env: envE, encoding: "utf8", timeout: 300_000 }) });
	const trust = ran.get("trust"), doctor = ran.get("doctor")?.r ?? null;
	out("(e) step 8's trust command, adapted to the scratch home and --yes, exits 0", trust ? trust.r.status : "no trust command in step 8", 0, trust ? `${trust.cmd}: ${trust.r.stderr}` : step8);
	out("(e) harness: step 8's doctor ran from the worktree", doctor !== null, true, step8);
	out("(e) doctor from the worktree shows a ✓ project trust row (R-1111)", /^\s*✓ project trust\b/mu.test(doctor?.stdout ?? ""), true,
		(doctor?.stdout ?? "").split("\n").find((l) => l.includes("project trust")) ?? "no project trust row");
} finally {
	fs.rmSync(scratch, { recursive: true, force: true });
}

// ---------------------------------------------------------------- (f) rows R-1100..R-1111 and the tree
const reqLines = (text("REQUIREMENTS.md") ?? "").split("\n");
for (let id = 1100; id <= 1111; id++) {
	const rows = reqLines.filter((l) => new RegExp(`^\\|\\s*R-${id}\\s*\\|`).test(l));
	const cell = rows[0]?.split(/(?<!\\)\|/)[2] ?? "";
	out(`(f) R-${id} is one row with exactly one "shall"`, [rows.length, (cell.match(/\bshall\b/gi) ?? []).length], [1, 1]);
}
const tree = spawnSync(process.execPath, ["scripts/requirements-tree.mjs", "--check"], { cwd: root, encoding: "utf8" });
out("(f) node scripts/requirements-tree.mjs --check exits 0", tree.status, 0, tree.stderr);

// ---------------------------------------------------------------- (g) scope: the branch diff against §4
// §4 "In.", quoted: "The shared file; `AGENTS.md` (region, install-check step); `packages/nana-pack/` `prompts/review-standard.md`
// (new), `bin/pi-review.mjs`, `prompts/builder-preamble.md`, `README.md`; root `README.md` step 8; tests `templates-render`,
// `immutable-review`, `review-standard` (new), `worker-lane`, `fresh-machine`, `requirements-tree` (1,088 at `:38`, `:52`, `:53`);
// `REQUIREMENTS.md`, tree, code map; the seat's HANDOFF and session entry before the final round; `docs/reviews/process-2026-10-13/`."
const SCOPE = [
	"templates/_shared/working-under-nana-pi.md",
	"AGENTS.md",
	"packages/nana-pack/prompts/review-standard.md",
	"packages/nana-pack/bin/pi-review.mjs",
	"packages/nana-pack/prompts/builder-preamble.md",
	"packages/nana-pack/README.md",
	"README.md",
	"packages/nana-pack/tests/templates-render.test.mjs",
	"packages/nana-pack/tests/immutable-review.test.mjs",
	"packages/nana-pack/tests/review-standard.test.mjs",
	"packages/nana-pack/tests/worker-lane.test.mjs",
	"packages/nana-setup/tests/fresh-machine.test.mjs",
	"packages/nana-pack/tests/requirements-tree.test.mjs",
	"REQUIREMENTS.md",
	"docs/requirements-tree.md",
	"docs/code-map.md",
	"HANDOFF.md",
	"docs/sessions/2026-10.md",
];
const SCOPE_PREFIX = "docs/reviews/process-2026-10-13/";
const diff = spawnSync("git", ["diff", "--name-only", "main...HEAD"], { cwd: root, encoding: "utf8" });
const changed = diff.stdout.split("\n").filter(Boolean);
out("(g) git diff --name-only main...HEAD lists only §4 paths", diff.status === 0 ? changed.filter((p) => !SCOPE.includes(p) && !p.startsWith(SCOPE_PREFIX)) : `git exit ${diff.status}`, []);

console.log(`cases: ${n - bad}/${n}`);
console.log(`process acceptance: ${bad} mismatch(es)`);
process.exit(bad ? 1 : 0);
