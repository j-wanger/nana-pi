// Gate: the per-item review ledger (T2b + fix round after sol r1), executed through REAL processes
// — pi-review / pi-worker with a stub `pi` on PATH, and review-ledger run/check — against real git
// repositories and worktrees, under a temp HOME. Each sol r1 bypass is pinned as a refusal here.
// Run: node packages/nana-pack/tests/review-ledger.test.mjs
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
const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "review-ledger-test-")));
const stubs = path.join(tmp, "stubs");
const outs = path.join(tmp, "outs");
for (const d of [stubs, outs]) fs.mkdirSync(d, { recursive: true });
// the stub `pi`: STUB=verdict prints a verdict; fail = infra failure; stall = 0-CPU hang
fs.writeFileSync(path.join(stubs, "pi"),
	'#!/bin/sh\ncase "$STUB" in fail) echo "503 upstream" ; exit 1;; stall) exec sleep 30;; *) echo "VERDICT: LAND";; esac\n');
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
const piReview = (args, { stub = "verdict", cwd = A.d } = {}) =>
	spawnSync(process.execPath, [PI_REVIEW, "--poll", "1", "--stall-secs", "1", "--retries", "1", ...args, "--", "-p", "x"],
		{ cwd, env: env({ STUB: stub }), encoding: "utf8", timeout: 30000 });
const VERDICT_CMD = [process.execPath, "-e", "console.log('VERDICT: LAND')"];
const ledgerRun = (args, { cwd = A.d, cmd = VERDICT_CMD } = {}) =>
	spawnSync(process.execPath, [LEDGER_CLI, "run", ...args, "--out", out(), "--", ...cmd], { cwd, env: env(), encoding: "utf8", timeout: 30000 });
const ledgerCheck = (args, cwd = A.d) => spawnSync(process.execPath, [LEDGER_CLI, "check", ...args], { cwd, env: env(), encoding: "utf8" });
const noStack = (r) => !/\n\s+at .+:\d+:\d+/.test(r.stderr);
const reviewAt = (item, i, extra = [], r = A) => { r.at(i); return ledgerRun(["--item", item, ...extra], { cwd: r.d }); };

// 0. an old call site (no --item) fails LOUDLY; --worker is gone from the review command
{
	freshHome("0");
	const r = piReview(["--out", out()]);
	check("no --item → refused with the required-item message", r.status === 1 && /--item <slug> is REQUIRED/.test(r.stderr), r.stderr);
	const w = [1, 2, 3, 4, 5].map(() => piReview(["--item", "wk", "--worker", "--out", out()]));
	check("pi-review --worker ×5 (sol r1 #3): every one refused, the review never runs",
		w.every((x) => x.status === 1 && /--worker was removed/.test(x.stderr) && !/attempt 1/.test(x.stderr)), w[0].stderr);
	const nr = piReview(["--item", "no-rev", "--out", out()], { cwd: plain });
	check("no git HEAD and no --revision → refused", nr.status === 1 && /pass --revision/.test(nr.stderr), nr.stderr);
	const wk = spawnSync(process.execPath, [PI_WORKER, "--poll", "1", "--retries", "1", "--out", path.join(outs, "wp.md"), "--", "-p", "x"], { cwd: A.d, env: env(), encoding: "utf8", timeout: 30000 });
	check("pi-worker runs a worker under the watchdog (exit 0, output written)", wk.status === 0 && /VERDICT/.test(fs.readFileSync(path.join(outs, "wp.md"), "utf8")), wk.stderr);
	check("pi-worker touched no ledger file", !fs.existsSync(agent), fs.existsSync(agent) ? fs.readdirSync(agent).join(",") : "");
	const wki = spawnSync(process.execPath, [PI_WORKER, "--item", "x", "--out", out(), "--", "-p", "x"], { cwd: A.d, env: env(), encoding: "utf8" });
	check("pi-worker refuses review options (--item)", wki.status === 1 && /records nothing/.test(wki.stderr), wki.stderr);
	check("pi-worker source never imports the ledger API", !/admit|complete|review-ledger\.rounds/.test(fs.readFileSync(PI_WORKER, "utf8").replace(/^\/\/.*$/gm, "")));
}

// 1. arbitrary output names on one item: the 4th REVISION is refused, whatever the file is called
{
	freshHome("1");
	const names = ["sol-final.md", "r3b.md", "anything.md", "notes.md"];
	const rs = names.map((nm, i) => { A.at(i); return piReview(["--item", "four", "--role", "sol", "--out", path.join(outs, nm)]); });
	check("sol-final.md / r3b.md / anything.md on revisions 1-3 admitted", rs.slice(0, 3).every((r) => r.status === 0), rs.map((r) => r.stderr).join("\n"));
	check("notes.md on a 4th revision refused", rs[3].status === 1 && /round 4, over the cap of 3/.test(rs[3].stderr), rs[3].stderr);
	check("tally holds exactly 3 rounds, audit exactly 3 verdicts", roundsOf("four").length === 3 && verdictsOf("four").length === 3);
	const rec = roundsOf("four")[0];
	check("tally record {v,ts,kind:round,repo,item,revision(full sha),role,launcher}",
		rec.v === 1 && rec.kind === "round" && !Number.isNaN(Date.parse(rec.ts)) && rec.repo === `git:${fs.realpathSync(path.join(A.d, ".git"))}` &&
		rec.item === "four" && rec.revision === A.shas[0] && rec.role === "sol" && rec.launcher === "pi-review", JSON.stringify(rec));
	const viaLedger = reviewAt("four", 4, ["--role", "opus"]);
	check("switching launcher (review-ledger run) does not reset the count", viaLedger.status === 1 && /over the cap/.test(viaLedger.stderr), viaLedger.stderr);
}

// 2. a round is a REVISION: any number of reviews, any roles, on one revision = one round
{
	freshHome("2");
	A.at(0);
	const ten = Array.from({ length: 10 }, (_, i) => ledgerRun(["--item", "rev", "--role", `role${i}`]).status);
	check("ten verdicts under ten roles on one revision all admitted", ten.every((s) => s === 0), JSON.stringify(ten));
	check("…and they are ONE round (1 tally line, 10 audit verdicts)", roundsOf("rev").length === 1 && verdictsOf("rev").length === 10);
	A.at(1);
	const two = [ledgerRun(["--item", "rev", "--role", "sol"]).status, ledgerRun(["--item", "rev", "--role", "sol"]).status];
	check("two sol reviews of one revision (sol r1: consumed 2) = one round", JSON.stringify(two) === "[0,0]" && roundsOf("rev").length === 2);
	check("third revision admitted", reviewAt("rev", 2).status === 0);
	check("fourth revision refused", reviewAt("rev", 3).status === 1);
	check("re-reviewing an already-counted revision is admitted and earns nothing", reviewAt("rev", 1).status === 0 && roundsOf("rev").length === 3);
	A.at(2);
	const hs = ledgerRun(["--item", "rev", "--revision", A.shas[2].slice(0, 7)]);
	const head = ledgerRun(["--item", "rev", "--revision", "HEAD"]);
	check("--revision <short> and --revision HEAD resolve to the same full sha (no new round)", hs.status === 0 && head.status === 0 && roundsOf("rev").length === 3, hs.stderr + head.stderr);
	const other = ledgerRun(["--item", "rev", "--revision", A.shas[0]]);
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
	check("same slug, unrelated repo B: its own item (admitted)", reviewAt("shared", 0, [], B).status === 0 && roundsOf("shared").length === 4);
	// two worktrees of repo A share one item
	const W = path.join(tmp, "A-wt");
	gitIn(A.d, "worktree", "add", "-q", "--detach", W, A.shas[1]);
	A.at(0);
	ledgerRun(["--item", "wt"]);
	ledgerRun(["--item", "wt"], { cwd: W });
	A.at(2);
	ledgerRun(["--item", "wt"]);
	check("two worktrees: one repo identity in the tally", new Set(roundsOf("wt").map((r) => r.repo)).size === 1 && roundsOf("wt").length === 3);
	A.at(2, W);
	check("worktree W2 at A's already-counted revision: admitted, no new round", ledgerRun(["--item", "wt"], { cwd: W }).status === 0 && roundsOf("wt").length === 3);
	A.at(3, W);
	const w4 = ledgerRun(["--item", "wt"], { cwd: W });
	check("worktree W2 at a 4th revision: refused (the item is shared)", w4.status === 1 && /over the cap/.test(w4.stderr), w4.stderr);
	// outside git: --revision is the fallback, scoped to the directory
	check("outside git, --revision abc accepted", ledgerRun(["--item", "plain", "--revision", "abc"], { cwd: plain }).status === 0);
	check("outside git, the tally scope is path:<dir>", roundsOf("plain")[0]?.repo === `path:${plain}`);
}

// 4. stalls and infra failures consume nothing
{
	freshHome("4");
	A.at(0);
	const fail = piReview(["--item", "free", "--out", out()], { stub: "fail" });
	check("infra failure → exit 1", fail.status === 1);
	A.at(1);
	const stall = piReview(["--item", "free", "--out", out()], { stub: "stall" });
	check("stalled attempt → exit 1 (watchdog killed it)", stall.status === 1 && /STALL/.test(stall.stderr), stall.stderr);
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
	check("the in-flight review holds the last round (check says no)", ledgerCheck(["--item", "crash"]).status === 1);
	process.kill(-k.pid, "SIGKILL");
	await new Promise((r) => k.exitCode !== null || k.signalCode !== null ? r() : k.on("exit", r));
	const deadPid = spawnSync(process.execPath, ["-e", "console.log(process.pid)"], { encoding: "utf8" }).stdout.trim();
	fs.writeFileSync(path.join(agent, "review-ledger.lock"), deadPid);
	const r = ledgerRun(["--item", "crash"]);
	check("after SIGKILL + a dead-pid lock, the next review is admitted", r.status === 0, r.stderr);
	check("the crashed reservation was pruned, and the lock released", fs.readdirSync(resDir).length === 0 && !fs.existsSync(path.join(agent, "review-ledger.lock")));
	check("the crashed attempt consumed no round (3 rounds)", roundsOf("crash").length === 3);
}

// 7. reservation ownership (sol r1 #6): an expired-then-replaced reservation is not completable
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
	check("the audit log rotated twice (.1 holds only the 2nd generation; rot's verdicts are gone from it)",
		gen1.some((r) => r.item === "other0") && !gen1.some((r) => r.item === "rot") && !jsonl(auditFile).some((r) => r.item === "rot"));
	const r = reviewAt("rot", 3);
	check("after two rotations, item rot's 4th revision is still refused", r.status === 1 && /3 round\(s\) used/.test(r.stderr), r.stderr);
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
	fs.chmodSync(resDir, 0o555);
	A.at(1);
	const c = ledgerCheck(["--item", "ck"]);
	fs.chmodSync(resDir, 0o755);
	check("check with a read-only reservations dir succeeds (it writes nothing)", c.status === 0 && /would be round 2\/3/.test(c.stdout), c.stderr + c.stdout);
	const before = fs.readFileSync(tallyFile, "utf8");
	check("check changed neither the tally nor the reservations", before === fs.readFileSync(tallyFile, "utf8") && fs.readdirSync(resDir).length === 0);
	freshHome("11b");
	const c2 = ledgerCheck(["--item", "nothing"]);
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

// 13. a DIRTY tree is its own state of the work: HEAD + a digest of `git diff HEAD` (T2b fix r2)
{
	freshHome("13");
	const D = repo("D", 2);
	D.at(1);
	const f = path.join(D.d, "f");
	const rev = () => (roundsOf("dirty").at(-1) ?? {});
	fs.writeFileSync(f, "fix one");
	const r1 = ledgerRun(["--item", "dirty"], { cwd: D.d });
	const t1 = rev();
	check("dirty tree review → round 1, ledger line {revision:<sha>+diff:<16hex>, head:<sha>, diff:<16hex>}",
		r1.status === 0 && /round 1\/3/.test(r1.stderr) && roundsOf("dirty").length === 1 &&
		t1.head === D.shas[1] && /^[0-9a-f]{16}$/.test(t1.diff) && t1.revision === `${D.shas[1]}+diff:${t1.diff}`, r1.stderr + JSON.stringify(t1));
	fs.writeFileSync(f, "fix two");
	const r2 = ledgerRun(["--item", "dirty"], { cwd: D.d });
	check("edit a tracked file (uncommitted) → round 2", r2.status === 0 && /round 2\/3/.test(r2.stderr) && roundsOf("dirty").length === 2 && rev().diff !== t1.diff, r2.stderr);
	fs.writeFileSync(f, "fix one");
	const r3 = ledgerRun(["--item", "dirty"], { cwd: D.d });
	check("revert the edit → original revision recognised, no new round", r3.status === 0 && /round 1\/3/.test(r3.stderr) && /already counted/.test(r3.stderr) && roundsOf("dirty").length === 2, r3.stderr);
	fs.writeFileSync(path.join(D.d, "scratch.txt"), "untracked");
	const r4 = ledgerRun(["--item", "dirty"], { cwd: D.d });
	check("touch an untracked file → no new round", r4.status === 0 && /already counted/.test(r4.stderr) && roundsOf("dirty").length === 2, r4.stderr);
	gitIn(D.d, "commit", "-qam", "fix one");
	const r5 = ledgerRun(["--item", "dirty"], { cwd: D.d });
	check("commit the change → a new revision (clean sha, diff null), a new round",
		r5.status === 0 && /round 3\/3/.test(r5.stderr) && roundsOf("dirty").length === 3 && rev().revision === gitIn(D.d, "rev-parse", "HEAD") && rev().diff === null, r5.stderr + JSON.stringify(rev()));
	fs.writeFileSync(f, "fix three");
	const r6 = ledgerRun(["--item", "dirty", "--revision", "HEAD"], { cwd: D.d });
	check("explicit --revision HEAD on a dirty tree still carries the digest (4th state → refused)", r6.status === 1 && /round 4, over the cap/.test(r6.stderr), r6.stderr);
	gitIn(D.d, "checkout", "-q", "--", "f");
}

fs.rmSync(tmp, { recursive: true, force: true });
process.exit(fails);
