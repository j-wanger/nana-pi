/**
 * @module packages/nana-pack/tests/review-ledger.test.mjs
 * @purpose Pins the per-item review ledger through REAL processes against real git repositories and worktrees, with each known bypass recorded here as a refusal
 * @inputs bin/pi-review.mjs, bin/pi-worker.mjs, bin/review-ledger.mjs, bin/review-round.mjs, a stub `pi` on PATH, and temp git repositories under a temp HOME
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, git repositories, worktrees, ledger files), process (spawns the review CLIs, the stub pi and git)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Gate: the per-item review ledger (T2b + fix round after sol r1), executed through REAL processes
// — pi-review / pi-worker with a stub `pi` on PATH, and review-ledger run/check — against real git
// repositories and worktrees, under a temp HOME. Each sol r1 bypass is pinned as a refusal here.
// Run: node packages/nana-pack/tests/review-ledger.test.mjs
import { tmpDir } from "./tmp-dir.mjs";
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const bin = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin");
const PI_REVIEW = path.join(bin, "pi-review.mjs");
const PI_WORKER = path.join(bin, "pi-worker.mjs");
const LEDGER_CLI = path.join(bin, "review-ledger.mjs");
const mod = await import(path.join(bin, "review-round.mjs"));
const tmp = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "review-ledger-test-")));
const stubs = path.join(tmp, "stubs");
const outs = path.join(tmp, "outs");
for (const d of [stubs, outs]) fs.mkdirSync(d, { recursive: true });
// the stub `pi`: STUB=verdict prints a verdict; fail = infra failure; stall = 0-CPU hang;
// plain = an ordinary worker reply with NO review token, counting its invocations in $COUNT
fs.writeFileSync(path.join(stubs, "pi"),
	'#!/bin/sh\n[ -z "$INVOKED" ] || echo invoked >> "$INVOKED"\ncase "$STUB" in fail) echo "503 upstream" ; exit 1;; stall) exec sleep 30;; sleeper) echo $$ > "$CHILD_PID"; exec sleep 30;; ignorer) trap "" INT TERM HUP; sleep 30 & echo $! > "$CHILD_PID"; wait;; plain) echo run >> "$COUNT"; echo "Implemented the change; edited src/a.ts.";; plain-review) printf "%s" "$STUB_TEXT";; *) echo "VERDICT: LAND";; esac\n');
fs.chmodSync(path.join(stubs, "pi"), 0o755);

let home, agent, tallyFile, auditFile, resDir;
const freshHome = (name) => {
	home = path.join(tmp, "home-" + name);
	agent = path.join(home, ".pi", "agent");
	tallyFile = path.join(agent, "review-ledger.rounds.jsonl");
	auditFile = path.join(agent, "review-ledger.jsonl");
	resDir = path.join(agent, "review-ledger.reservations");
	fs.mkdirSync(home, { recursive: true });
};
const env = (extra = {}) => ({ ...process.env, HOME: home, USERPROFILE: home, PATH: `${stubs}:${process.env.PATH}`, ...extra });
const jsonl = (f) => (fs.existsSync(f) ? fs.readFileSync(f, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse) : []);
const roundsOf = (item) => jsonl(tallyFile).filter((r) => r.item === item);
const verdictsOf = (item) => jsonl(auditFile).filter((r) => r.kind === "verdict" && r.item === item);

let fails = 0;
const check = (n, ok, info = "") => { console.log(ok ? "PASS" : "FAIL", n, ok ? "" : info); if (!ok) fails++; };

// a git repository with n commits; at(i) detaches HEAD at commit i
const gitIn = (cwd, ...a) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], { cwd, encoding: "utf8" }).stdout.trim();
function repo(name, n = 6) {
	const d = path.join(tmp, name);
	fs.mkdirSync(d);
	gitIn(d, "init", "-q");
	const shas = [];
	for (let i = 0; i < n; i++) {
		fs.writeFileSync(path.join(d, "f"), `${name}${i}`);
		gitIn(d, "add", "f");
		gitIn(d, "commit", "-qm", `c${i}`);
		shas.push(gitIn(d, "rev-parse", "HEAD"));
	}
	return { d, shas, at: (i, cwd = d) => gitIn(cwd, "checkout", "-q", "--detach", shas[i]) };
}
const A = repo("A"), B = repo("B");
const plain = path.join(tmp, "plain"); // NOT a git repo: --revision is the fallback there
fs.mkdirSync(plain);

let n = 0;
const out = () => path.join(outs, `o${++n}.md`);
const piReview = (args, { stub = "verdict", cwd = A.d, extra = "", extraEnv = {} } = {}) =>
	spawnSync(process.execPath, [PI_REVIEW, "--poll", "1", "--stall-secs", "1", "--retries", "0", ...args, "--", "-p", "x"],
		{ cwd, env: env({ STUB: stub, STUB_TEXT: extra, ...extraEnv }), encoding: "utf8", timeout: 30000 });
const VERDICT_CMD = [process.execPath, "-e", "console.log('VERDICT: LAND')"];
const ledgerRun = (args, { cwd = A.d, cmd = VERDICT_CMD, extraEnv = {}, outFile = out() } = {}) =>
	spawnSync(process.execPath, [LEDGER_CLI, "run", ...args, "--out", outFile, "--", ...cmd], { cwd, env: env(extraEnv), encoding: "utf8", timeout: 30000 });
const ledgerCheck = (args, cwd = A.d) => spawnSync(process.execPath, [LEDGER_CLI, "check", ...args], { cwd, env: env(), encoding: "utf8" });
const noStack = (r) => !/\n\s+at .+:\d+:\d+/.test(r.stderr);
const reviewAt = (item, i, extra = [], r = A) => { r.at(i); return ledgerRun(["--item", item, ...extra], { cwd: r.d }); };

// 0. an old call site (no --item) fails LOUDLY; --worker is gone from the review command
{
	freshHome("0");
	const r = piReview(["--out", out()]);
	check("no --item → refused with the required-item message", r.status === 1 && /--item <slug> is REQUIRED/.test(r.stderr), r.stderr);
	const w = [1, 2, 3, 4, 5].map(() => piReview(["--item", "wk", "--worker", "--out", out()]));
	// req: R-854
	check("pi-review --worker ×5 (sol r1 #3): every one refused, the review never runs",
		w.every((x) => x.status === 1 && /--worker was removed/.test(x.stderr) && !/attempt 1/.test(x.stderr)), w[0].stderr);
	const nr = piReview(["--item", "no-rev", "--out", out()], { cwd: plain });
	// req: R-624
	check("outside git without --tree → refused", nr.status === 1 && /run from the reviewed tree or pass --tree/.test(nr.stderr), nr.stderr);
	const wk = spawnSync(process.execPath, [PI_WORKER, "--poll", "1", "--retries", "1", "--out", path.join(outs, "wp.md"), "--", "-p", "x"], { cwd: A.d, env: env(), encoding: "utf8", timeout: 30000 });
	// req: R-732
	check("pi-worker runs a worker under the watchdog (exit 0, output written)", wk.status === 0 && /VERDICT/.test(fs.readFileSync(path.join(outs, "wp.md"), "utf8")), wk.stderr);
	// req: R-732
	check("pi-worker touched no ledger file", !fs.existsSync(agent), fs.existsSync(agent) ? fs.readdirSync(agent).join(",") : "");
	const captureRoot = path.join(tmp, "watchdog-captures");
	fs.mkdirSync(captureRoot);
	const captureEnv = { TMPDIR: captureRoot, TEMP: captureRoot, TMP: captureRoot };
	freshHome("captures");
	const captureRuns = [
		piReview(["--item", "capture-success", "--out", out()], { extraEnv: captureEnv }),
		piReview(["--item", "capture-failure", "--out", out()], { stub: "fail", extraEnv: captureEnv }),
		piReview(["--item", "capture-stall", "--out", out()], { stub: "stall", extraEnv: captureEnv }),
	];
	// req: R-919
	check("pi-watchdog removes capture directories after success, child failure and stall", captureRuns[0].status === 0 && captureRuns[1].status === 1 && captureRuns[2].status === 1 && fs.readdirSync(captureRoot).length === 0, JSON.stringify(captureRuns.map((r) => ({ status: r.status, stderr: r.stderr }))));
	const wki = spawnSync(process.execPath, [PI_WORKER, "--item", "x", "--out", out(), "--", "-p", "x"], { cwd: A.d, env: env(), encoding: "utf8" });
	// req: R-733
	check("pi-worker refuses review options (--item)", wki.status === 1 && /records nothing/.test(wki.stderr), wki.stderr);
	// req: R-732
	check("pi-worker source never imports the ledger API", !/admit|complete|review-ledger\.rounds/.test(fs.readFileSync(PI_WORKER, "utf8").replace(/^\/\/.*$/gm, "")));
}

// 1. arbitrary output names on one item: the 4th REVISION is refused, whatever the file is called
{
	freshHome("1");
	const names = ["sol-final.md", "r3b.md", "anything.md", "notes.md"];
	const rs = names.map((nm, i) => { A.at(i); return piReview(["--item", "four", "--role", "sol", "--out", path.join(outs, nm)]); });
	check("sol-final.md / r3b.md / anything.md on revisions 1-3 admitted", rs.slice(0, 3).every((r) => r.status === 0), rs.map((r) => r.stderr).join("\n"));
	check("notes.md on a 4th revision refused", rs[3].status === 1 && /round 4, over the cap of 3/.test(rs[3].stderr), rs[3].stderr);
	// req: R-971
	check("tally holds exactly 3 rounds, audit exactly 3 verdicts", roundsOf("four").length === 3 && verdictsOf("four").length === 3);
	const rec = roundsOf("four")[0];
	check("tally record {v,ts,kind:round,repo,item,revision(full sha),role,launcher}",
		rec.v === 1 && rec.kind === "round" && !Number.isNaN(Date.parse(rec.ts)) && rec.repo === `git:${fs.realpathSync(path.join(A.d, ".git"))}` &&
		rec.item === "four" && rec.revision === A.shas[0] && rec.role === "sol" && rec.launcher === "pi-review", JSON.stringify(rec));
	const viaLedger = reviewAt("four", 4, ["--role", "opus"]);
	// req: R-971
	// req: R-729 R-841
	check("switching launcher (review-ledger run) does not reset the count", viaLedger.status === 1 && /over the cap/.test(viaLedger.stderr), viaLedger.stderr);
}

// 2. a round is a REVISION: any number of reviews, any roles, on one revision = one round
{
	freshHome("2");
	A.at(0);
	const ten = Array.from({ length: 10 }, (_, i) => ledgerRun(["--item", "rev", "--role", `role${i}`]).status);
	// req: R-972
	check("ten verdicts under ten roles on one revision all admitted", ten.every((s) => s === 0), JSON.stringify(ten));
	// req: R-972
	// req: R-729
	check("…and they are ONE round (1 tally line, 10 audit verdicts)", roundsOf("rev").length === 1 && verdictsOf("rev").length === 10);
	const tallyBeforeRead = fs.readFileSync(tallyFile, "utf8");
	// req: R-969 R-992
	check("completed round records verdict and readRounds filters without mutation", roundsOf("rev")[0]?.verdict === "LAND" &&
		mod.readRounds(home, { item: "rev", repo: roundsOf("rev")[0]?.repo }).length === 1 && mod.readRounds(home, { item: "missing" }).length === 0 &&
		fs.readFileSync(tallyFile, "utf8") === tallyBeforeRead, JSON.stringify({ row: roundsOf("rev")[0], read: mod.readRounds(home, { item: "rev" }) }));
	A.at(1);
	const two = [ledgerRun(["--item", "rev", "--role", "sol"]).status, ledgerRun(["--item", "rev", "--role", "sol"]).status];
	check("two sol reviews of one revision (sol r1: consumed 2) = one round", JSON.stringify(two) === "[0,0]" && roundsOf("rev").length === 2);
	// req: R-972
	check("new revision earns a round regardless of role", reviewAt("rev", 2, ["--role", "land-reviewer"]).status === 0 && roundsOf("rev").length === 3);
	// req: R-840
	check("fourth revision refused", reviewAt("rev", 3).status === 1);
	check("re-reviewing an already-counted revision is admitted and earns nothing", reviewAt("rev", 1).status === 0 && roundsOf("rev").length === 3);
	A.at(2);
	const hs = ledgerRun(["--item", "rev", "--revision", A.shas[2].slice(0, 7)]);
	const head = ledgerRun(["--item", "rev", "--revision", "HEAD"]);
	// req: R-713
	check("--revision <short> and --revision HEAD resolve to the same full sha (no new round)", hs.status === 0 && head.status === 0 && roundsOf("rev").length === 3, hs.stderr + head.stderr);
	const other = ledgerRun(["--item", "rev", "--revision", A.shas[0]]);
	// req: R-713
	check("--revision naming a different commit than HEAD is refused (revision derives from HEAD)", other.status === 1 && /derived from HEAD/.test(other.stderr), other.stderr);
	const unres = ledgerRun(["--item", "rev2", "--revision", "no-such-rev"]);
	check("unresolvable --revision inside git refused", unres.status === 1 && /not a commit/.test(unres.stderr), unres.stderr);
}

// 3. identity: canonical slug, repository scope, worktrees share
{
	freshHome("3");
	for (let i = 0; i < 3; i++) reviewAt("CaseItem", i);
	check("'caseitem' after 3 rounds of 'CaseItem' refused (one item)", reviewAt("caseitem", 3).status === 1);
	for (let i = 0; i < 3; i++) reviewAt("scope one", i);
	check("'scope  one' after 3 rounds of 'scope one' refused", reviewAt(" Scope  ONE ", 3).status === 1);
	for (const bad of ["../item", "a/b", "..", "x".repeat(50000)]) {
		const r = ledgerRun(["--item", bad]);
		check(`--item ${JSON.stringify(bad.slice(0, 10))}${bad.length > 10 ? "…" : ""} refused, no stack`, r.status === 1 && /item/.test(r.stderr) && noStack(r), r.stderr);
	}
	for (let i = 0; i < 3; i++) reviewAt("shared", i);
	// req: R-705
	check("same slug, unrelated repo B: its own item (admitted)", reviewAt("shared", 0, [], B).status === 0 && roundsOf("shared").length === 4);
	// two worktrees of repo A share one item
	const W = path.join(tmp, "A-wt");
	gitIn(A.d, "worktree", "add", "-q", "--detach", W, A.shas[1]);
	A.at(0);
	ledgerRun(["--item", "wt"]);
	ledgerRun(["--item", "wt"], { cwd: W });
	A.at(2);
	ledgerRun(["--item", "wt"]);
	// req: R-705
	check("two worktrees: one repo identity in the tally", new Set(roundsOf("wt").map((r) => r.repo)).size === 1 && roundsOf("wt").length === 3);
	A.at(2, W);
	check("worktree W2 at A's already-counted revision: admitted, no new round", ledgerRun(["--item", "wt"], { cwd: W }).status === 0 && roundsOf("wt").length === 3);
	A.at(3, W);
	const w4 = ledgerRun(["--item", "wt"], { cwd: W });
	// req: R-705
	check("worktree W2 at a 4th revision: refused (the item is shared)", w4.status === 1 && /over the cap/.test(w4.stderr), w4.stderr);
	// req: R-624
	check("outside git refuses admission unless --tree names a reviewed repository",
		ledgerRun(["--item", "plain", "--revision", "abc"], { cwd: plain }).status === 1 &&
		/run from the reviewed tree or pass --tree/.test(ledgerRun(["--item", "plain", "--revision", "abc"], { cwd: plain }).stderr));
	const scratch = path.join(tmp, "scratch"); fs.mkdirSync(scratch);
	A.at(0); B.at(5);
	const viaTreeOut = out();
	const viaTree = ledgerRun(["--item", "tree-scope", "--tree", A.d], { cwd: B.d,
		cmd: [process.execPath, "-e", "console.log('VERDICT: '+process.cwd())"], outFile: viaTreeOut });
	// req: R-621 R-705
	check("scratch launcher cwd with --tree uses the reviewed repository scope",
		viaTree.status === 0 && roundsOf("tree-scope")[0]?.repo === `git:${fs.realpathSync(path.join(A.d, ".git"))}` &&
		roundsOf("tree-scope")[0]?.revision === A.shas[0] && A.shas[0] !== B.shas[5] &&
		fs.readFileSync(viaTreeOut, "utf8").trim() === `VERDICT: ${A.d}`, viaTree.stderr);
	const piTree = piReview(["--item", "pi-tree-scope", "--tree", A.d, "--out", out()], { cwd: scratch });
	// req: R-621
	check("pi-review --tree succeeds from a non-git scratch cwd", piTree.status === 0 && roundsOf("pi-tree-scope")[0]?.repo === `git:${fs.realpathSync(path.join(A.d, ".git"))}`, piTree.stderr);
	const nestedLauncher = path.join(A.d, "nested-launcher"), nestedTree = path.join(A.d, "nested-tree");
	fs.mkdirSync(nestedLauncher); fs.mkdirSync(nestedTree);
	const marker = path.join(tmp, "child-cwd-marker");
	const cwdCommand = [process.execPath, "-e", `require('fs').writeFileSync(${JSON.stringify(marker)}, process.cwd()); console.log('VERDICT: '+process.cwd())`];
	const nestedOut = out(), selectedOut = out();
	const fromNestedLauncher = ledgerRun(["--item", "cwd-default"], { cwd: nestedLauncher, cmd: cwdCommand, outFile: nestedOut });
	const fromSelectedTree = ledgerRun(["--item", "cwd-tree", "--tree", nestedTree], { cwd: nestedLauncher, cmd: cwdCommand, outFile: selectedOut });
	// req: R-729
	check("review-ledger child executes from selected directory, not repository root",
		fromNestedLauncher.status === 0 && fromSelectedTree.status === 0 &&
		fs.readFileSync(nestedOut, "utf8").trim() === `VERDICT: ${nestedLauncher}` &&
		fs.readFileSync(selectedOut, "utf8").trim() === `VERDICT: ${nestedTree}` &&
		fs.readFileSync(marker, "utf8") === nestedTree, `${fromNestedLauncher.stderr}\n${fromSelectedTree.stderr}`);
	const legacy = { v: 1, kind: "round", repo: "path:/legacy/scratch", item: "legacy", revision: "old-revision" };
	fs.mkdirSync(agent, { recursive: true }); fs.appendFileSync(tallyFile, JSON.stringify(legacy) + "\n");
	// req: R-622
	check("legacy path-keyed tally rows remain readable", ledgerCheck(["--item", "legacy"], A.d).status === 0 &&
		jsonl(tallyFile).some((r) => r.repo === legacy.repo && r.item === legacy.item && r.revision === legacy.revision));
}

// 4. regular stdout/stderr redirection into either tracked or untracked reviewed files refuses admission
{
	freshHome("redirect");
	let redirectsRefused = true;
	for (const [kind, target, stdioSlot] of [["tracked stdout", path.join(A.d, "f"), 1], ["untracked stderr", path.join(A.d, "redirect.log"), 2]]) {
		if (kind.includes("untracked")) fs.writeFileSync(target, "untouched");
		const invoked = path.join(tmp, `${kind.replaceAll(" ", "-")}.invoked`);
		const before = fs.readFileSync(target);
		for (const [launcher, args] of [["pi-review", [PI_REVIEW, "--item", `redirect-${kind}`]], ["review-ledger", [LEDGER_CLI, "run", "--item", `redirect-ledger-${kind}`]]]) {
			const fd = fs.openSync(target, "r+");
			const stdio = ["ignore", "pipe", "pipe"]; stdio[stdioSlot] = fd;
			const childCommand = launcher === "review-ledger"
				? [process.execPath, "-e", `require('fs').writeFileSync(${JSON.stringify(invoked)}, 'started'); console.log('VERDICT: LAND')`]
				: ["-p", "x"];
			const r = spawnSync(process.execPath, [...args, "--out", out(), "--", ...childCommand],
				{ cwd: A.d, env: env({ STUB: "verdict", INVOKED: invoked }), encoding: "utf8", stdio });
			fs.closeSync(fd);
			const msg = stdioSlot === 2 ? fs.readFileSync(target, "utf8") : (r.stderr || "");
			redirectsRefused &&= r.status === 1 && msg.includes(`redirect the review log outside the reviewed tree (${path.basename(target)})`) &&
				!fs.existsSync(invoked) && (stdioSlot === 2 || fs.readFileSync(target).equals(before));
		}
	}
	// req: R-620
	check("tracked stdout and untracked stderr redirects into the reviewed tree are refused through both launchers", redirectsRefused);
}

// 5. reject incomplete review-shaped outputs through both launch paths
{
	freshHome("shape");
	const rejected = ["I am still finding the relevant files; will continue.", "Context limit reached before I could land on a verdict.", "verdict: LAND", "xVERDICT: LAND"];
	const accepted = "--- VERDICT: LAND";
	let piRejects = true, ledgerRejects = true, piAccepts = true, ledgerAccepts = true;
	for (const [i, text] of rejected.entries()) {
		const pi = piReview(["--item", `shape-pi-${i}`, "--out", out()], { stub: "plain-review", cwd: A.d, extra: text });
		piRejects &&= pi.status === 1 && /FAILED/.test(pi.stderr);
		const via = ledgerRun(["--item", `shape-ledger-${i}`], { cwd: A.d,
			cmd: [process.execPath, "-e", `process.stdout.write(${JSON.stringify(text)})`] });
		ledgerRejects &&= via.status === 1 && /no verdict/.test(via.stderr);
	}
	const piAllowed = piReview(["--item", "shape-pi-allowed", "--out", out()], { stub: "plain-review", cwd: A.d, extra: accepted });
	piAccepts &&= piAllowed.status === 0;
	const ledgerAllowed = ledgerRun(["--item", "shape-ledger-allowed"], { cwd: A.d,
		cmd: [process.execPath, "-e", `process.stdout.write(${JSON.stringify(accepted)})`] });
	ledgerAccepts &&= ledgerAllowed.status === 0;
	const prefixed = ledgerRun(["--item", "shape-prefixed-verdict"], { cwd: A.d,
		cmd: [process.execPath, "-e", `process.stdout.write(${JSON.stringify("- VERDICT: BLOCK")})`] });
	// req: R-969
	check("prefixed verdict accepted by shape predicate is extracted into the recorded round",
		prefixed.status === 0 && roundsOf("shape-prefixed-verdict")[0]?.verdict === "BLOCK", JSON.stringify(roundsOf("shape-prefixed-verdict")));
	// req: R-701
	check("pi-review enforces the case-sensitive verdict line boundary", piRejects && piAccepts);
	// req: R-701
	check("review-ledger enforces the case-sensitive verdict line boundary", ledgerRejects && ledgerAccepts);
}

// 6. stalls and infra failures consume nothing
{
	freshHome("4");
	A.at(0);
	const fail = piReview(["--item", "free", "--out", out()], { stub: "fail" });
	// req: R-701
	check("infra failure → exit 1", fail.status === 1);
	A.at(1);
	const stall = piReview(["--item", "free", "--out", out()], { stub: "stall" });
	// req: R-700
	check("stalled attempt → exit 1 (watchdog killed it)", stall.status === 1 && /STALL/.test(stall.stderr), stall.stderr);
	// req: R-716
	check("no reservation left behind, no round counted", fs.readdirSync(resDir).length === 0 && roundsOf("free").length === 0);
	const after = [2, 3, 4, 5].map((i) => reviewAt("free", i).status);
	check("…so the item still has all 3 rounds, and the 4th is refused", JSON.stringify(after) === "[0,0,0,1]", JSON.stringify(after));
}

// 5. two concurrent launchers on two NEW revisions cannot both take the last round (3 trials)
{
	freshHome("5");
	const race = (item) => new Promise((resolve) => {
		for (const i of [0, 1]) reviewAt(item, i);
		const slow = [process.execPath, "-e", "setTimeout(()=>console.log('VERDICT: LAND'),1500)"];
		const trees = [2, 3].map((i) => { const d = path.join(tmp, `${item}-t${i}`); gitIn(A.d, "worktree", "add", "-q", "--detach", d, A.shas[i]); return d; });
		const kids = trees.map((d) => spawn(process.execPath, [LEDGER_CLI, "run", "--item", item, "--out", out(), "--", ...slow], { cwd: d, env: env(), stdio: ["ignore", "ignore", "pipe"] }));
		const codes = [];
		kids.forEach((k) => { let e = ""; k.stderr.on("data", (d) => (e += d)); k.on("exit", (c) => { codes.push({ c, e }); if (codes.length === 2) resolve(codes); }); });
	});
	for (const item of ["race1", "race2", "race3"]) {
		const codes = await race(item);
		const won = codes.filter((x) => x.c === 0).length;
		const lost = codes.filter((x) => x.c === 1 && /in flight|over the cap/.test(x.e)).length;
		// req: R-714
		check(`${item}: exactly one of two concurrent launchers wins the last round`, won === 1 && lost === 1 && roundsOf(item).length === 3, JSON.stringify(codes));
	}
}

// 6. a crashed reservation (launcher SIGKILLed mid-review) does not wedge the item; nor does a dead lock
{
	freshHome("6");
	for (const i of [0, 1]) reviewAt("crash", i);
	A.at(2);
	const hang = [process.execPath, "-e", "setTimeout(()=>{},60000)"];
	const k = spawn(process.execPath, [LEDGER_CLI, "run", "--item", "crash", "--out", out(), "--", ...hang], { cwd: A.d, env: env(), stdio: "ignore", detached: true });
	const t0 = Date.now();
	while (!(fs.existsSync(resDir) && fs.readdirSync(resDir).length) && Date.now() - t0 < 10000) await new Promise((r) => setTimeout(r, 50));
	await new Promise((r) => setTimeout(r, 200));
	A.at(3);
	// req: R-714
	check("the in-flight review holds the last round (check says no)", ledgerCheck(["--item", "crash"]).status === 1);
	process.kill(-k.pid, "SIGKILL");
	await new Promise((r) => k.exitCode !== null || k.signalCode !== null ? r() : k.on("exit", r));
	const deadPid = spawnSync(process.execPath, ["-e", "console.log(process.pid)"], { encoding: "utf8" }).stdout.trim();
	fs.writeFileSync(path.join(agent, "review-ledger.lock"), deadPid);
	const r = ledgerRun(["--item", "crash"]);
	// req: R-700
	check("after SIGKILL + a dead-pid lock, the next review is admitted", r.status === 0, r.stderr);
	check("the crashed reservation was pruned, and the lock released", fs.readdirSync(resDir).length === 0 && !fs.existsSync(path.join(agent, "review-ledger.lock")));
	// req: R-716
	check("the crashed attempt consumed no round (3 rounds)", roundsOf("crash").length === 3);
}

// 7. termination signals kill and reap both wrapper children; reviews release reservations
if (process.platform !== "win32") {
	let signalsCleaned = true;
	for (const [launcher, sig, expected] of [["review", "SIGINT", 130], ["review", "SIGTERM", 143], ["review", "SIGHUP", 129], ["worker", "SIGINT", 130], ["worker", "SIGTERM", 143], ["worker", "SIGHUP", 129]]) {
		freshHome(`signal-${launcher}-${sig}`);
		const childPidFile = path.join(tmp, `signal-${launcher}-${sig}.pid`);
		const script = launcher === "review" ? PI_REVIEW : PI_WORKER;
		const args = launcher === "review" ? ["--item", "signal", "--out", out()] : ["--out", out()];
		const k = spawn(process.execPath, [script, ...args, "--poll", "1", "--stall-secs", "20", "--retries", "0", "--", "-p", "x"],
			{ cwd: A.d, env: env({ STUB: "ignorer", CHILD_PID: childPidFile }), stdio: ["ignore", "ignore", "pipe"] });
		let stderr = ""; k.stderr.on("data", (d) => { stderr += d; });
		for (let i = 0; i < 200 && !fs.existsSync(childPidFile); i++) await new Promise((r) => setTimeout(r, 25));
		const grandchildPid = Number(fs.readFileSync(childPidFile, "utf8").trim());
		process.kill(k.pid, sig);
		const code = await new Promise((r) => k.once("exit", r));
		let grandchildAlive = true; try { process.kill(grandchildPid, 0); } catch { grandchildAlive = false; }
		const reservationReleased = launcher !== "review" || fs.readdirSync(resDir).length === 0;
		signalsCleaned &&= code === expected && !grandchildAlive && reservationReleased;
	}
	// req: R-623
	check("watchdog signals reap children, release review reservations and preserve signal exit codes", signalsCleaned);
}

// 8. reservation ownership (sol r1 #6): an expired-then-replaced reservation is not completable
{
	freshHome("7");
	for (const i of [0, 1]) reviewAt("exp", i);
	A.at(2);
	const a = mod.admit(["--item", "exp"], { launcher: "test", home, cwd: A.d });
	for (const f of fs.readdirSync(resDir)) { const t = new Date(Date.now() - 13 * 3600e3); fs.utimesSync(path.join(resDir, f), t, t); }
	A.at(3);
	const b = mod.admit(["--item", "exp"], { launcher: "test", home, cwd: A.d });
	check("the expired reservation is pruned; a replacement is admitted as round 3", a.ok && b.ok && /round 3\/3/.test(b.note), b.note ?? b.message);
	const ca = mod.complete(a.res, "a.md", { home });
	const cb = mod.complete(b.res, "b.md", { home });
	check("complete(expired A) refused, NOT recorded", ca.ok === false && /NOT recorded/.test(ca.message), JSON.stringify(ca));
	check("complete(B) recorded; the item has 3 rounds, never 4", cb.ok && roundsOf("exp").length === 3 && verdictsOf("exp").length === 3);
	check("completing B twice is refused (its reservation was consumed)", mod.complete(b.res, "b.md", { home }).ok === false);
	const forged = mod.complete({ ...b.res, id: "forged-1" }, "f.md", { home });
	check("a forged reservation id records nothing", forged.ok === false && roundsOf("exp").length === 3);
	A.at(4);
	const fut = mod.admit(["--item", "fut", "--role", "x"], { launcher: "test", home, cwd: A.d });
	for (const f of fs.readdirSync(resDir)) { const t = new Date(Date.now() + 24 * 3600e3); fs.utimesSync(path.join(resDir, f), t, t); }
	const pf = mod.project(["--item", "fut"], { home, cwd: A.d });
	check("a future-dated reservation is stale (does not hold a round)", fut.ok && pf.ok && /0 round\(s\) used/.test(pf.note), pf.note ?? pf.message);
}

// 8. the tally survives audit-log rotation — twice (sol r1 #4)
{
	freshHome("8");
	for (let i = 0; i < 3; i++) reviewAt("rot", i);
	const pad = (JSON.stringify({ v: 1, kind: "noise", pad: "x".repeat(200) }) + "\n").repeat(6000); // ~1.4 MB
	for (let g = 0; g < 2; g++) { fs.appendFileSync(auditFile, pad); reviewAt(`other${g}`, 0); }
	const gen1 = jsonl(auditFile + ".1");
	// req: R-722
	check("the audit log rotated twice (.1 holds only the 2nd generation; rot's verdicts are gone from it)",
		gen1.some((r) => r.item === "other0") && !gen1.some((r) => r.item === "rot") && !jsonl(auditFile).some((r) => r.item === "rot"));
	const r = reviewAt("rot", 3);
	// req: R-722
	check("after two rotations, item rot's 4th revision is still refused", r.status === 1 && /3 round\(s\) used/.test(r.stderr), r.stderr);
	// req: R-721
	check("the tally never rotates", !fs.existsSync(tallyFile + ".1") && roundsOf("rot").length === 3);
}

// 9. malformed tally → admission refused with the line number (sol r1 #7)
{
	freshHome("9");
	for (let i = 0; i < 3; i++) reviewAt("mal", i);
	const ls = fs.readFileSync(tallyFile, "utf8").split("\n");
	ls[1] = ls[1].slice(0, 25);
	fs.writeFileSync(tallyFile, ls.join("\n"));
	const r = reviewAt("mal", 4);
	check("a corrupted round line refuses admission with file:line", r.status === 1 && /rounds\.jsonl:2: malformed record/.test(r.stderr) && noStack(r), r.stderr);
	fs.writeFileSync(tallyFile, ls.filter((_, i) => i !== 1).join("\n"));
	check("…deleting the line is the documented repair (2 rounds left → admitted)", reviewAt("mal", 4).status === 0);
	fs.writeFileSync(tallyFile, JSON.stringify({ v: 1, kind: "round", item: "x" }) + "\n");
	// req: R-853
	check("a record missing repo/revision is malformed too", reviewAt("mal", 5).status === 1);
}

// 10. non-regular ledger paths, unwritable dir, lock-as-directory: refused with a message, no stack
{
	for (const name of ["review-ledger.jsonl", "review-ledger.rounds.jsonl", "review-ledger.jsonl.1"]) {
		freshHome(`10-${name}`);
		fs.mkdirSync(agent, { recursive: true });
		const target = path.join(tmp, `target-${name}`);
		fs.writeFileSync(target, "");
		fs.symlinkSync(target, path.join(agent, name));
		const r = reviewAt("sym", 0);
		check(`${name} as a symlink: refused BEFORE the review, target untouched, no stack`,
			r.status === 1 && /symlink/.test(r.stderr) && fs.readFileSync(target, "utf8") === "" && !/admitted/.test(r.stderr) && noStack(r), r.stderr);
	}
	freshHome("10-ro");
	fs.mkdirSync(agent, { recursive: true });
	fs.chmodSync(agent, 0o555);
	const ro = reviewAt("ro", 0);
	fs.chmodSync(agent, 0o755);
	check("read-only ledger directory: refused with a clear message, no stack", ro.status === 1 && /must be writable/.test(ro.stderr) && noStack(ro), ro.stderr);
	freshHome("10-lockdir");
	fs.mkdirSync(path.join(agent, "review-ledger.lock"), { recursive: true });
	const t0 = Date.now();
	const ld = reviewAt("ld", 0);
	check("lock path is a directory: refused at once (<3s) with a message, no stack",
		ld.status === 1 && /lock path .* is not a regular file/.test(ld.stderr) && Date.now() - t0 < 3000 && noStack(ld), ld.stderr);
}

// 11. check is a locked, NON-mutating projection (sol r1 #9)
{
	freshHome("11");
	reviewAt("ck", 0);
	// T2b r5 (astra): capture BEFORE check, so the equality below can fail. A live reservation is
	// planted (this process owns it) so "check prunes/adds nothing" is observable, not vacuous.
	fs.writeFileSync(path.join(resDir, "held.json"), JSON.stringify({ id: "held", pid: process.pid, repo: "x", item: "other", revision: "r" }));
	const tallyBefore = fs.readFileSync(tallyFile, "utf8");
	const auditBefore = fs.readFileSync(auditFile, "utf8");
	const resBefore = fs.readdirSync(resDir).sort().join(",");
	fs.chmodSync(resDir, 0o555);
	A.at(1);
	const c = ledgerCheck(["--item", "ck"]);
	fs.chmodSync(resDir, 0o755);
	// req: R-726
	check("check with a read-only reservations dir succeeds (it writes nothing)", c.status === 0 && /would be round 2\/3/.test(c.stdout), c.stderr + c.stdout);
	// req: R-726
	check("check changed neither the tally, the audit nor the reservations (captured before check)",
		tallyBefore.length > 0 && tallyBefore === fs.readFileSync(tallyFile, "utf8") && auditBefore === fs.readFileSync(auditFile, "utf8") &&
		resBefore === "held.json" && fs.readdirSync(resDir).sort().join(",") === resBefore);
	fs.rmSync(path.join(resDir, "held.json"));
	freshHome("11b");
	const c2 = ledgerCheck(["--item", "nothing"]);
	// req: R-726
	check("check on a machine with no ledger creates nothing", c2.status === 0 && !fs.existsSync(agent), c2.stderr);
}

// 12. --over-cap: a flag is not a reason; a real reason is recorded with a timestamp
{
	freshHome("12");
	for (let i = 0; i < 3; i++) reviewAt("over", i);
	A.at(3);
	const spoof = piReview(["--item", "over", "--out", out(), "--over-cap", "--retries", "1"]);
	check("--over-cap --retries is refused (a flag is not a reason)", spoof.status === 1 && /--over-cap needs a value/.test(spoof.stderr), spoof.stderr);
	const blank = piReview(["--item", "over", "--out", out(), "--over-cap", "  "]);
	check("--over-cap '  ' is refused", blank.status === 1);
	check("no override was recorded by the spoofs", !jsonl(auditFile).some((l) => l.kind === "override"));
	const ok = piReview(["--item", "over", "--out", out(), "--over-cap", "instrumented X"]);
	const ov = jsonl(auditFile).filter((l) => l.kind === "override" && l.item === "over");
	check("--over-cap 'instrumented X' runs", ok.status === 0, ok.stderr);
	check("the override is recorded with reason, round and timestamp",
		ov.length === 1 && ov[0].reason === "instrumented X" && ov[0].round === 4 && !Number.isNaN(Date.parse(ov[0].ts)), JSON.stringify(ov));
	check("the over-cap round carries the override in the tally", roundsOf("over").at(-1)?.override === "instrumented X" && roundsOf("over").length === 4);
}

// 13. a DIRTY tree is its own state of the work: HEAD + the full sha256 of a content snapshot (fix r3)
{
	freshHome("13");
	const D = repo("D", 2);
	D.at(1);
	const f = path.join(D.d, "f");
	const rev = () => (roundsOf("dirty").at(-1) ?? {});
	fs.writeFileSync(f, "fix one");
	const r1 = ledgerRun(["--item", "dirty"], { cwd: D.d });
	const t1 = rev();
	// req: R-708
	check("dirty tree review → round 1, ledger line {revision:<sha>+snap:<64hex>, head:<sha>, snapshot:<64hex>}",
		r1.status === 0 && /round 1\/3/.test(r1.stderr) && roundsOf("dirty").length === 1 &&
		t1.head === D.shas[1] && /^[0-9a-f]{64}$/.test(t1.snapshot) && t1.revision === `${D.shas[1]}+snap:${t1.snapshot}`, r1.stderr + JSON.stringify(t1));
	fs.writeFileSync(f, "fix two");
	const r2 = ledgerRun(["--item", "dirty"], { cwd: D.d });
	check("edit a tracked file (uncommitted) → round 2", r2.status === 0 && /round 2\/3/.test(r2.stderr) && roundsOf("dirty").length === 2 && rev().snapshot !== t1.snapshot, r2.stderr);
	fs.writeFileSync(f, "fix one");
	const r3 = ledgerRun(["--item", "dirty"], { cwd: D.d });
	// req: R-711
	check("revert the edit → original revision recognised, no new round", r3.status === 0 && /round 1\/3/.test(r3.stderr) && /already counted/.test(r3.stderr) && roundsOf("dirty").length === 2, r3.stderr);
	gitIn(D.d, "add", "f");
	const r4 = ledgerRun(["--item", "dirty"], { cwd: D.d });
	// req: R-710
	check("stage the same content → the same revision (index state is not work state), no new round", r4.status === 0 && /already counted/.test(r4.stderr) && roundsOf("dirty").length === 2, r4.stderr);
	gitIn(D.d, "commit", "-qm", "fix one");
	const r5 = ledgerRun(["--item", "dirty"], { cwd: D.d });
	// req: R-708
	check("commit the change → a new revision (clean sha, snapshot null), a new round",
		r5.status === 0 && /round 3\/3/.test(r5.stderr) && roundsOf("dirty").length === 3 && rev().revision === gitIn(D.d, "rev-parse", "HEAD") && rev().snapshot === null, r5.stderr + JSON.stringify(rev()));
	fs.writeFileSync(f, "fix three");
	const r6 = ledgerRun(["--item", "dirty", "--revision", "HEAD"], { cwd: D.d });
	// req: R-713
	check("explicit --revision HEAD on a dirty tree still carries the snapshot (4th state → refused)", r6.status === 1 && /round 4, over the cap/.test(r6.stderr), r6.stderr);
	gitIn(D.d, "checkout", "-q", "--", "f");
}

// 14. pi-worker (sol r2 #13): exit 0 + non-empty output is success; no review shape; NO retry by default
{
	freshHome("14");
	const count = path.join(tmp, "worker-count");
	const wo = path.join(outs, "worker-plain.md");
	const w = spawnSync(process.execPath, [PI_WORKER, "--poll", "1", "--out", wo, "--", "-p", "x"], { cwd: A.d, env: env({ STUB: "plain", COUNT: count }), encoding: "utf8", timeout: 30000 });
	// req: R-734
	check("a worker reply with NO review token succeeds (exit 0, output written)", w.status === 0 && /Implemented the change/.test(fs.readFileSync(wo, "utf8")) && /SUCCESS on attempt 1/.test(w.stderr), w.stderr);
	check("…and ran exactly once (zero retries)", fs.readFileSync(count, "utf8").trim().split("\n").length === 1 && !/retrying/.test(w.stderr), fs.readFileSync(count, "utf8"));
	const wf = spawnSync(process.execPath, [PI_WORKER, "--poll", "1", "--out", path.join(outs, "wf.md"), "--", "-p", "x"], { cwd: A.d, env: env({ STUB: "fail" }), encoding: "utf8", timeout: 30000 });
	// req: R-735
	check("a failing worker is NOT retried by default (1 attempt, exit 1)", wf.status === 1 && /attempt 1\/1/.test(wf.stderr) && !/attempt 2/.test(wf.stderr), wf.stderr);
	const wr = spawnSync(process.execPath, [PI_WORKER, "--poll", "1", "--retries", "1", "--out", path.join(outs, "wr.md"), "--", "-p", "x"], { cwd: A.d, env: env({ STUB: "fail" }), encoding: "utf8", timeout: 30000 });
	check("--retries 1 opts in explicitly, with a mutation warning (2 attempts)", wr.status === 1 && /REPEATS any file mutations/.test(wr.stderr) && /attempt 2\/2/.test(wr.stderr), wr.stderr);
	const plainReview = piReview(["--item", "shape", "--out", out()], { stub: "plain" });
	// req: R-701
	check("pi-review still requires review shape (the same plain reply is no verdict)", plainReview.status === 1 && roundsOf("shape").length === 0, plainReview.stderr);
	const wd = fs.readFileSync(path.join(bin, "pi-watchdog.mjs"), "utf8").replace(/^\/\/.*$/gm, "");
	check("pi-watchdog imports no ledger or review module", !/import[^;]*(review-round|review-shape|review-ledger)/.test(wd) && !/reviewShaped/.test(wd));
}

// 15. a git failure REFUSES admission, naming the git error (sol r2 #10)
{
	freshHome("15");
	const G = repo("G", 1);
	fs.writeFileSync(path.join(G.d, ".git", "index"), "garbage");
	const r = ledgerRun(["--item", "gitfail"], { cwd: G.d });
	// req: R-712
	check("corrupt index → refused, the message names git's error, no stack, no round",
		r.status === 1 && /git ls-files .*failed .*index/i.test(r.stderr) && /admission refused/.test(r.stderr) && noStack(r) && roundsOf("gitfail").length === 0, r.stderr);
	const c = ledgerCheck(["--item", "gitfail"], G.d);
	check("check refuses too", c.status === 1 && /failed/.test(c.stderr), c.stderr);
}

// 16. the snapshot is a working-state identity (sol r2 #11): every collapse is distinct, every split is one
{
	const revOf = (d) => mod.resolveRevision(undefined, mod.treeScope(d), d);
	const rendered = (d) => spawnSync("git", ["diff", "HEAD", "--binary", "--no-color"], { cwd: d }).stdout.toString();
	const S = repo("S", 1);
	const clean = revOf(S.d);
	// req: R-708
	check("clean tree → the bare HEAD sha", clean === S.shas[0], clean);
	// --- collapses (rendered diff text is identical; the snapshot must differ)
	fs.writeFileSync(path.join(S.d, "new.txt"), "n");
	const withUntracked = revOf(S.d);
	// req: R-835
	check("collapse: an untracked file is part of the state (≠ clean)", withUntracked !== clean && rendered(S.d) === "", withUntracked);
	fs.rmSync(path.join(S.d, "new.txt"));
	check("…and removing it returns to the clean sha", revOf(S.d) === clean);

	const E = repo("E", 0);
	fs.writeFileSync(path.join(E.d, ".gitattributes"), "* text=auto\n");
	fs.writeFileSync(path.join(E.d, "t.txt"), "l1\nl2\n");
	gitIn(E.d, "add", "."); gitIn(E.d, "commit", "-qm", "lf");
	const eLF = revOf(E.d);
	fs.writeFileSync(path.join(E.d, "t.txt"), "l1\r\nl2\r\n");
	// req: R-709
	check("collapse: CRLF vs LF under text=auto (git diff empty) → distinct", eLF === gitIn(E.d, "rev-parse", "HEAD") && revOf(E.d) !== eLF && rendered(E.d) === "", rendered(E.d));

	const M = repo("M", 1);
	gitIn(M.d, "config", "core.fileMode", "false");
	fs.chmodSync(path.join(M.d, "f"), 0o755);
	// req: R-709
	check("collapse: chmod +x under core.fileMode=false (git diff empty) → distinct", revOf(M.d) !== M.shas[0] && rendered(M.d) === "");
	fs.chmodSync(path.join(M.d, "f"), 0o644);
	check("…chmod back → the clean sha", revOf(M.d) === M.shas[0]);

	const F = repo("F", 0);
	gitIn(F.d, "config", "filter.strip.clean", "sed -e 's/#.*//'");
	gitIn(F.d, "config", "filter.strip.smudge", "cat");
	fs.writeFileSync(path.join(F.d, ".gitattributes"), "*.c filter=strip\n");
	fs.writeFileSync(path.join(F.d, "x.c"), "a\n");
	gitIn(F.d, "add", "."); gitIn(F.d, "commit", "-qm", "c");
	fs.writeFileSync(path.join(F.d, "x.c"), "a#one\n"); const f1 = revOf(F.d), d1 = rendered(F.d);
	fs.writeFileSync(path.join(F.d, "x.c"), "a#two\n"); const f2 = revOf(F.d), d2 = rendered(F.d);
	check("collapse: two contents one clean filter maps to the same blob (same rendered diff) → distinct", d1 === d2 && f1 !== f2 && f1.startsWith(gitIn(F.d, "rev-parse", "HEAD") + "+snap:"), `${d1 === d2} ${f1} ${f2}`);

	const Sub = repo("Sub", 1), P = repo("P", 1);
	spawnSync("git", ["-c", "protocol.file.allow=always", "-c", "user.name=t", "-c", "user.email=t@t", "submodule", "add", "-q", Sub.d, "sub"], { cwd: P.d });
	gitIn(P.d, "commit", "-qm", "sub");
	const pClean = revOf(P.d);
	check("a clean submodule at its recorded commit → the bare HEAD sha", pClean === gitIn(P.d, "rev-parse", "HEAD"), pClean);
	fs.writeFileSync(path.join(P.d, "sub", "f"), "dirty one"); const s1 = revOf(P.d), sd1 = rendered(P.d);
	fs.writeFileSync(path.join(P.d, "sub", "f"), "dirty two"); const s2 = revOf(P.d), sd2 = rendered(P.d);
	check("collapse: two different dirty submodule contents (both render '-dirty') → distinct", sd1 === sd2 && /-dirty/.test(sd1) && s1 !== s2 && s1 !== pClean, sd1);
	gitIn(path.join(P.d, "sub"), "checkout", "-q", "--", "f");
	check("…submodule restored → the clean sha", revOf(P.d) === pClean);
	// req: R-708
	check("the full sha-256 is retained (64 hex)", /\+snap:[0-9a-f]{64}$/.test(s1), s1);

	// --- splits (one content state; the revision must not move)
	const T = repo("T", 1);
	fs.writeFileSync(path.join(T.d, "f"), "changed");
	fs.writeFileSync(path.join(T.d, "added.txt"), "brand new");
	const unstaged = revOf(T.d);
	gitIn(T.d, "add", "-N", "added.txt"); const intent = revOf(T.d);
	gitIn(T.d, "add", "f", "added.txt"); const staged = revOf(T.d);
	check("split: modified + new file — unstaged, intent-to-add, fully staged → ONE revision", unstaged === intent && intent === staged && unstaged !== T.shas[0], [unstaged, intent, staged].join(" "));
	for (const [k, v] of [["diff.noprefix", "true"], ["diff.mnemonicPrefix", "true"], ["color.ui", "always"], ["core.quotePath", "false"], ["diff.renames", "copies"]]) gitIn(T.d, "config", k, v);
	// req: R-709
	check("split: diff.noprefix / mnemonicPrefix / color.ui / quotePath / renames set → same revision", revOf(T.d) === staged);
	fs.writeFileSync(path.join(T.d, ".git", "info", "exclude"), "*.log\nbuild/\n");
	fs.writeFileSync(path.join(T.d, "debug.log"), "noise"); fs.mkdirSync(path.join(T.d, "build")); fs.writeFileSync(path.join(T.d, "build", "o"), "x");
	// req: R-836
	check("split: ignored files (*.log, build/) do not change the revision", revOf(T.d) === staged);
	fs.writeFileSync(path.join(T.d, "debug.log"), "more noise");
	check("…nor does editing an ignored file", revOf(T.d) === staged);
	const later = new Date(Date.now() + 5000); fs.utimesSync(path.join(T.d, "f"), later, later);
	// req: R-836
	check("split: touching a file (mtime only) does not change the revision", revOf(T.d) === staged);
	const U = repo("U", 1);
	gitIn(U.d, "rm", "-q", "--cached", "f");
	check("split: `git rm --cached` (index only; the file is unchanged on disk) → still the clean sha", revOf(U.d) === U.shas[0], revOf(U.d));
	const outInTree = path.join(U.d, "review-out.md");
	fs.writeFileSync(outInTree, "VERDICT: LAND");
	check("the review's own --out file inside the tree is excluded from its snapshot",
		mod.resolveRevision(undefined, mod.treeScope(U.d, { exclude: [outInTree] }), U.d) === U.shas[0]);
}

// 17. completion re-derives the revision (sol r2 #12): a tree edited mid-review is not credited
{
	freshHome("17");
	const K = repo("K", 1);
	const editThenVerdict = [process.execPath, "-e", `require('fs').writeFileSync(${JSON.stringify(path.join(K.d, "f"))}, 'edited mid-review'); console.log('VERDICT: LAND')`];
	const r = ledgerRun(["--item", "drift"], { cwd: K.d, cmd: editThenVerdict });
	const t = roundsOf("drift"), au = jsonl(auditFile).filter((x) => x.item === "drift");
	// req: R-717
	check("edit during the review → exit 1, 'changed during the review', verdict NOT recorded as valid",
		r.status === 1 && /changed during the review/.test(r.stderr) && !au.some((x) => x.kind === "verdict"), r.stderr);
	check("…the round IS consumed for the admitted revision (tally: unverified, completedAs = the new state)",
		t.length === 1 && t[0].revision === K.shas[0] && t[0].unverified === true && /\+snap:[0-9a-f]{64}$/.test(t[0].completedAs) &&
		au.some((x) => x.kind === "verdict-unverified"), JSON.stringify(t));
	// req: R-716
	check("…and no reservation is left behind", fs.readdirSync(resDir).length === 0);
	gitIn(K.d, "checkout", "-q", "--", "f");
	const inTreeOut = path.join(K.d, "sol-r1.md");
	const ok = ledgerRun(["--item", "stable"], { cwd: K.d, outFile: inTreeOut });
	check("a review whose --out lands inside the reviewed tree is stable (its own output is excluded)", ok.status === 0 && roundsOf("stable")[0]?.revision === K.shas[0] && !roundsOf("stable")[0]?.unverified, ok.stderr);
	fs.rmSync(inTreeOut);
}

// 18. reservations renew (sol r2 #15): a live renewing owner never expires; a non-renewing one is reclaimed
{
	freshHome("18");
	const STALE = "1000"; // the window, shortened for the test (production default 10 min, heartbeat every 1/5)
	const H = repo("H", 4);
	H.at(0);
	const slow = [process.execPath, "-e", "setTimeout(()=>console.log('VERDICT: LAND'),4000)"];
	const kid = spawn(process.execPath, [LEDGER_CLI, "run", "--item", "hb", "--out", out(), "--", ...slow], { cwd: H.d, env: env({ NANA_REVIEW_RES_STALE_MS: STALE }), stdio: ["ignore", "ignore", "pipe"] });
	let kerr = ""; kid.stderr.on("data", (d) => (kerr += d));
	const done = new Promise((r) => kid.on("exit", r));
	await new Promise((r) => setTimeout(r, 2500)); // 2.5× the stale window, still running
	process.env.NANA_REVIEW_RES_STALE_MS = STALE;
	const HW = path.join(tmp, "H-wt"); // another worktree of H: the running review's tree is left alone
	gitIn(H.d, "worktree", "add", "-q", "--detach", HW, H.shas[1]);
	const other = mod.admit(["--item", "hb"], { launcher: "test", home, cwd: HW }); // admission PRUNES stale reservations
	// req: R-714
	check("while a renewing review runs past its stale window, another admission sees it in flight", other.ok && /1 review\(s\) in flight/.test(other.note), other.note ?? other.message);
	const code = await done;
	// req: R-729
	check("…and the renewing review completes and is recorded (exit 0, round 1)", code === 0 && roundsOf("hb").some((x) => x.revision === H.shas[0]), kerr);
	// `other` is held by this (live) test process but never renewed → reclaimed after the window
	await new Promise((r) => setTimeout(r, 1300));
	const pr = mod.project(["--item", "hb"], { home, cwd: HW });
	check("a live but NON-renewing owner is reclaimed after the window (0 in flight)", pr.ok && /0 review\(s\) in flight/.test(pr.note), pr.note ?? pr.message);
	check("…and its late completion records nothing", mod.complete(other.res, "late.md", { home }).ok === false && roundsOf("hb").length === 1);
	// the old 12 h lease: a reservation last touched 13 h ago is revived by one renewal
	H.at(2);
	const old = mod.admit(["--item", "hb"], { launcher: "test", home, cwd: H.d });
	for (const fn of fs.readdirSync(resDir)) { const t = new Date(Date.now() - 13 * 3600e3); fs.utimesSync(path.join(resDir, fn), t, t); }
	check("renew() refreshes a reservation older than the old 12 h lease", mod.renew(old.res, { home }) === true &&
		/1 review\(s\) in flight/.test(mod.project(["--item", "hb"], { home, cwd: H.d }).note ?? ""));
	check("…and completes", mod.complete(old.res, "o.md", { home }).ok === true && roundsOf("hb").length === 2);
	check("renew() of a consumed reservation returns false", mod.renew(old.res, { home }) === false);
	delete process.env.NANA_REVIEW_RES_STALE_MS;
}

// 19. completion TOCTOU (sol r3 MED): the revision is derived UNDER the lock. Race forced by holding
// the ledger lock (this live pid in the lock file), starting complete() in a child process so it
// blocks on the lock, editing the tree while it waits, then releasing the lock.
{
	freshHome("19");
	const L = repo("L", 1);
	const res = mod.admit(["--item", "toctou", "--out", path.join(outs, "toctou.md")], { launcher: "test", home, cwd: L.d });
	check("toctou: admitted at the clean HEAD", res.ok && res.res.revision === L.shas[0], res.message);
	const lockFile = path.join(agent, "review-ledger.lock");
	fs.writeFileSync(lockFile, String(process.pid)); // a LIVE holder: the child must wait, never take it over
	const script = `const m = await import(${JSON.stringify(path.join(bin, "review-round.mjs"))});` +
		`const c = m.complete(${JSON.stringify(res.res)}, "toctou.md", { home: ${JSON.stringify(home)} });` +
		`process.stdout.write(JSON.stringify(c));`;
	let cout = "";
	const kid = spawn(process.execPath, ["--input-type=module", "-e", script], { env: env(), stdio: ["ignore", "pipe", "inherit"] });
	kid.stdout.on("data", (c) => (cout += c));
	const exited = new Promise((r) => kid.on("close", r));
	await new Promise((r) => setTimeout(r, 1500)); // the child is now blocked on the lock (pre-fix it had already derived)
	const blocked = kid.exitCode === null;
	fs.writeFileSync(path.join(L.d, "f"), "edited while completion waits on the lock");
	fs.unlinkSync(lockFile);
	await exited;
	const c = JSON.parse(cout || "{}");
	const t = roundsOf("toctou"), au = jsonl(auditFile).filter((x) => x.item === "toctou");
	// req: R-837
	check("toctou: the completion was blocked on the lock when the tree was edited", blocked);
	// req: R-717
	check("toctou: an edit made while completion waits on the lock → verdict recorded UNVERIFIED, not valid",
		c.ok === false && /changed during the review/.test(c.message) && t.length === 1 && t[0].unverified === true &&
		au.some((x) => x.kind === "verdict-unverified") && !au.some((x) => x.kind === "verdict"), cout + JSON.stringify(t));
}

// 20. --out inside the reviewed tree (sol r3 ruling): tracked → refused; untracked → warns; ignored / outside → silent
{
	freshHome("20");
	const O = repo("O", 1);
	fs.writeFileSync(path.join(O.d, ".gitignore"), "*.log\n");
	gitIn(O.d, "add", ".gitignore"); gitIn(O.d, "commit", "-qm", "ignore");
	const tracked = ledgerRun(["--item", "outt"], { cwd: O.d, outFile: path.join(O.d, "f") });
	// req: R-724
	check("a TRACKED --out is refused before the review runs (file untouched, nothing reserved)",
		tracked.status === 1 && /TRACKED file/.test(tracked.stderr) && fs.readFileSync(path.join(O.d, "f"), "utf8") === "O0" &&
		roundsOf("outt").length === 0 && noStack(tracked), tracked.stderr);
	const viaSub = pathRel => ledgerRun(["--item", "outt"], { cwd: path.join(O.d), outFile: pathRel });
	const trackedRel = viaSub("./sub/../f");
	check("…also when spelled through ../ (resolved)", trackedRel.status === 1 && /TRACKED file/.test(trackedRel.stderr), trackedRel.stderr);
	gitIn(O.d, "rm", "-q", "--cached", "f");
	const headOnly = mod.admit(["--item", "outt", "--out", path.join(O.d, "f")], { launcher: "test", home, cwd: O.d });
	check("…and a path tracked in HEAD but removed from the index", headOnly.ok === false && /TRACKED/.test(headOnly.message), headOnly.message);
	gitIn(O.d, "reset", "-q");
	const untracked = ledgerRun(["--item", "outu"], { cwd: O.d, outFile: path.join(O.d, "new-out.md") });
	check("an untracked in-tree --out WARNS and the review still runs",
		untracked.status === 0 && /WARNING: --out .* inside the reviewed tree/.test(untracked.stderr) && roundsOf("outu").length === 1, untracked.stderr);
	fs.rmSync(path.join(O.d, "new-out.md"));
	const ignored = ledgerRun(["--item", "outi"], { cwd: O.d, outFile: path.join(O.d, "r.log") });
	check("an ignored in-tree --out is silent", ignored.status === 0 && !/WARNING/.test(ignored.stderr), ignored.stderr);
	const outside = ledgerRun(["--item", "outo"], { cwd: O.d });
	check("an --out outside the tree is silent", outside.status === 0 && !/WARNING/.test(outside.stderr), outside.stderr);
	const chk = ledgerCheck(["--item", "outt", "--out", path.join(O.d, "f")], O.d);
	// req: R-724
	check("review-ledger check refuses a tracked --out too", chk.status === 1 && /TRACKED/.test(chk.stderr), chk.stderr);
	// T2b r5 (astra MUST): an --out that is ITSELF a symlink resolves through its leaf. Before the fix
	// the parent alone was resolved, the link (outside the tree) passed, and the review overwrote f.
	const fBytes = fs.readFileSync(path.join(O.d, "f"));
	const link = path.join(outs, "link-to-f.md"), chain = path.join(outs, "chain-to-f.md");
	fs.symlinkSync(path.join(O.d, "f"), link);
	fs.symlinkSync(path.basename(link), chain);
	for (const [label, o] of [["a symlinked --out aimed at a tracked file", link], ["…through a chain of two links", chain]]) {
		const s = ledgerRun(["--item", "outs"], { cwd: O.d, outFile: o });
		check(`${label} is refused BEFORE the review (target byte-identical, nothing reserved or counted)`,
			s.status === 1 && /TRACKED file/.test(s.stderr) && !/admitted/.test(s.stderr) &&
			fs.readFileSync(path.join(O.d, "f")).equals(fBytes) && roundsOf("outs").length === 0 && fs.readdirSync(resDir).length === 0 && noStack(s), s.stderr);
	}
	const dangling = path.join(outs, "dangling.md");
	fs.symlinkSync(path.join(O.d, "made-by-link.md"), dangling);
	check("a dangling --out link is resolved to where the write would land (in-tree → warns)",
		/inside the reviewed tree/.test(mod.outInTree(fs.realpathSync(O.d), dangling) ?? ""));
	// "..notes.md" is a legitimate in-tree name: the check is by path SEGMENT, not string prefix
	fs.writeFileSync(path.join(O.d, "..notes.md"), "NOTES\n");
	gitIn(O.d, "add", "..notes.md"); gitIn(O.d, "commit", "-qm", "dotdot");
	const dd = ledgerRun(["--item", "outd"], { cwd: O.d, outFile: path.join(O.d, "..notes.md") });
	// req: R-724
	check("a TRACKED file named ..notes.md is in-tree and refused (file untouched)",
		dd.status === 1 && /TRACKED file/.test(dd.stderr) && fs.readFileSync(path.join(O.d, "..notes.md"), "utf8") === "NOTES\n" && roundsOf("outd").length === 0, dd.stderr);
	const du = ledgerRun(["--item", "outdu"], { cwd: O.d, outFile: path.join(O.d, "..draft.md") });
	check("an untracked ..draft.md is in-tree: warns, and is excluded from the snapshot (verdict verified)",
		du.status === 0 && /WARNING: --out .* inside the reviewed tree/.test(du.stderr) && roundsOf("outdu").length === 1 && !roundsOf("outdu")[0].unverified, du.stderr);
	fs.rmSync(path.join(O.d, "..draft.md"));
	check("relUnder: by segment", typeof mod.relUnder === "function" && mod.relUnder("/r", "/r/..notes.md") === "..notes.md" && mod.relUnder("/r", "/r/../x") === null &&
		mod.relUnder("/r", "/r") === null && mod.relUnder("/r", "/r/a/..b") === "a/..b");
}

// 22. the audit is bounded on EVERY append path (T2b r5, astra MUST): a FAILED over-cap launch
// appends its override and must rotate too. Before the fix only a completed verdict rotated.
{
	freshHome("22");
	for (let i = 0; i < 3; i++) reviewAt("aud", i);
	A.at(3);
	fs.writeFileSync(auditFile, '{"v":1,"kind":"pad"}\n'.repeat(Math.ceil((mod.LEDGER_MAX_BYTES + 1) / 21)));
	const FAIL_CMD = [process.execPath, "-e", "process.exit(1)"];
	const sizes = [];
	for (let i = 0; i < 3; i++) {
		const f = ledgerRun(["--item", "aud", "--over-cap", `retry ${i}`], { cwd: A.d, cmd: FAIL_CMD });
		sizes.push([f.status, fs.statSync(auditFile).size]);
	}
	const rotated = path.join(agent, "review-ledger.jsonl.1");
	// req: R-722
	check("repeated FAILED over-cap launches: the audit rotates (never above the cap), overrides still recorded",
		sizes.every(([st, sz]) => st === 1 && sz <= mod.LEDGER_MAX_BYTES) && fs.existsSync(rotated) &&
		jsonl(auditFile).filter((l) => l.kind === "override" && l.item === "aud").length === 3 && roundsOf("aud").length === 3, JSON.stringify(sizes));
}

// 23. round metadata and report are read-only; absent legacy fields render as dashes
{
	freshHome("23");
	A.at(0);
	const launch = ledgerRun(["--item", "report-item", "--role", "sol", "--over-cap", "not actually over cap"], {
		cmd: [process.execPath, "-e", "console.log('VERDICT: LAND')", "--", "--provider", "anthropic", "--model", "claude-test-1"],
	});
	const current = roundsOf("report-item")[0];
	const before = fs.readFileSync(tallyFile, "utf8");
	const report = spawnSync(process.execPath, [LEDGER_CLI, "report", "--item", "report-item"], { cwd: A.d, env: env(), encoding: "utf8" });
	const repoReport = spawnSync(process.execPath, [LEDGER_CLI, "report", "--repo", A.d, "--item", "report-item"], { cwd: A.d, env: env(), encoding: "utf8" });
	const reportTally = fs.readFileSync(tallyFile, "utf8");
	for (let i = 0; i < 3; i++) reviewAt("report-over-cap", i);
	A.at(3);
	const overCap = ledgerRun(["--item", "report-over-cap", "--over-cap", "approved exception"], { cwd: A.d });
	const overCapRow = roundsOf("report-over-cap").at(-1);
	const overCapReport = spawnSync(process.execPath, [LEDGER_CLI, "report", "--item", "report-over-cap"], { cwd: A.d, env: env(), encoding: "utf8" });
	// req: R-970
	check("report records metadata, omits unused override reasons, and reports real over-cap reason read-only",
		launch.status === 0 && current.provider === "anthropic" && current.model === "claude-test-1" &&
		Date.parse(current.startedAt) <= Date.parse(current.endedAt) && Number.isFinite(current.durationMs) && current.attempts === 1 &&
		current.role === "sol" && current.overCap === null &&
		/^report-item \| [a-f0-9]{12} \| sol \| claude-test-1 \| \d+ms \| 1 \| LAND \| -\n$/.test(report.stdout) &&
		report.status === 0 && repoReport.status === 0 && repoReport.stdout === report.stdout && reportTally === before &&
		overCap.status === 0 && overCapRow?.overCap === "approved exception" && /\| approved_exception\n$/.test(overCapReport.stdout),
		JSON.stringify({ current, report: report.stdout, repoReport: repoReport.stdout, overCapRow, overCapReport: overCapReport.stdout }));
	const legacy = { v: 1, kind: "round", repo: current.repo, item: "legacy-report", revision: A.shas[1], role: "reviewer" };
	fs.appendFileSync(tallyFile, JSON.stringify(legacy) + "\n");
	const oldReport = spawnSync(process.execPath, [LEDGER_CLI, "report", "--item", "legacy-report"], { cwd: A.d, env: env(), encoding: "utf8" });
	// req: R-970
	check("legacy rounds print - for every unavailable report field", oldReport.status === 0 &&
		oldReport.stdout === `legacy-report | ${A.shas[1].slice(0, 12)} | reviewer | - | - | - | - | -\n`, oldReport.stdout);
}

const trustText = fs.readFileSync(path.join(bin, "..", "README.md"), "utf8").replace(/\s+/g, " ");
// req: R-971
// req: R-972
check("Trust model declares wrapper-only formal rounds, supplemental reviews and revision-based counting",
	trustText.includes("Formal review rounds are admitted only through `pi-review` or `review-ledger run`. Agent-tool and hand-run reviews are supplemental and earn no round") &&
	trustText.includes("Any number of reviews, by any roles, on one revision is one round") &&
	trustText.includes("A land ruling on the revision the last round reviewed consumes nothing; a land review of a new revision is a round like any other"));

// 21. --retries contract notice (sol r3 LOW): printed only when the flag is explicit
{
	freshHome("21");
	const NOTICE = /note — --retries \d+ = \d+ re-attempt\(s\) after the first/;
	const explicit = piReview(["--item", "rt", "--out", out()]); // the helper passes --retries 0
	const implicit = spawnSync(process.execPath, [PI_REVIEW, "--poll", "1", "--stall-secs", "1", "--item", "rt2", "--out", out(), "--", "-p", "x"],
		{ cwd: A.d, env: env({ STUB: "verdict" }), encoding: "utf8", timeout: 30000 });
	check("pi-review: explicit --retries → one-line notice", explicit.status === 0 && (explicit.stderr.match(new RegExp(NOTICE, "g")) ?? []).length === 1, explicit.stderr);
	check("pi-review: no --retries → no notice", implicit.status === 0 && !NOTICE.test(implicit.stderr), implicit.stderr);
	const wk = (extra) => spawnSync(process.execPath, [PI_WORKER, "--poll", "1", "--stall-secs", "1", ...extra, "--out", out(), "--", "-p", "x"],
		{ cwd: A.d, env: env({ STUB: "plain", COUNT: path.join(tmp, "count21") }), encoding: "utf8", timeout: 30000 });
	const we = wk(["--retries", "1"]), wi = wk([]);
	// req: R-735
	check("pi-worker: explicit --retries → notice; default → none",
		we.status === 0 && NOTICE.test(we.stderr) && wi.status === 0 && !NOTICE.test(wi.stderr), we.stderr + wi.stderr);
	check("…a pi arg named --retries (after --) is not the flag", !NOTICE.test(spawnSync(process.execPath,
		[PI_WORKER, "--poll", "1", "--stall-secs", "1", "--out", out(), "--", "-p", "--retries", "3"],
		{ cwd: A.d, env: env({ STUB: "plain", COUNT: path.join(tmp, "count21") }), encoding: "utf8", timeout: 30000 }).stderr));
}

fs.rmSync(tmp, { recursive: true, force: true });
process.exit(fails);
