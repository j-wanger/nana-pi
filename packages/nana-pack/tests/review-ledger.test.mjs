// Gate: the per-item review ledger (T2b), executed through REAL processes — pi-review with a stub
// `pi` on PATH, and review-ledger run — under a temp HOME. Run: node packages/nana-pack/tests/review-ledger.test.mjs
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const bin = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin");
const PI_REVIEW = path.join(bin, "pi-review.mjs");
const LEDGER_CLI = path.join(bin, "review-ledger.mjs");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "review-ledger-test-"));
const home = path.join(tmp, "home");
const work = path.join(tmp, "work"); // NOT a git repo: --revision must be explicit here
const stubs = path.join(tmp, "stubs");
for (const d of [home, work, stubs, path.join(work, "r4")]) fs.mkdirSync(d, { recursive: true });
// the stub `pi`: STUB=verdict prints a verdict; fail = infra failure; stall = 0-CPU hang
fs.writeFileSync(path.join(stubs, "pi"),
	'#!/bin/sh\ncase "$STUB" in fail) echo "503 upstream" ; exit 1;; stall) exec sleep 30;; *) echo "VERDICT: LAND";; esac\n');
fs.chmodSync(path.join(stubs, "pi"), 0o755);
const env = (extra = {}) => ({ ...process.env, HOME: home, USERPROFILE: home, PATH: `${stubs}:${process.env.PATH}`, ...extra });
const ledgerFile = path.join(home, ".pi", "agent", "review-ledger.jsonl");
const resDir = path.join(home, ".pi", "agent", "review-ledger.reservations");
const lines = () => (fs.existsSync(ledgerFile) ? fs.readFileSync(ledgerFile, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse) : []);
const verdictsFor = (item) => lines().filter((r) => r.kind === "verdict" && r.item === item);

let fails = 0;
const check = (n, ok, info = "") => { console.log(ok ? "PASS" : "FAIL", n, ok ? "" : info); if (!ok) fails++; };

const piReview = (args, stub = "verdict", cwd = work) =>
	spawnSync(process.execPath, [PI_REVIEW, "--poll", "1", "--stall-secs", "1", "--retries", "1", ...args, "--", "-p", "x"],
		{ cwd, env: env({ STUB: stub }), encoding: "utf8", timeout: 30000 });
const VERDICT_CMD = [process.execPath, "-e", "console.log('VERDICT: LAND')"];
const ledgerRun = (args, cmd = VERDICT_CMD) =>
	spawnSync(process.execPath, [LEDGER_CLI, "run", ...args, "--", ...cmd], { cwd: work, env: env(), encoding: "utf8", timeout: 30000 });
const ledgerCheck = (args) => spawnSync(process.execPath, [LEDGER_CLI, "check", ...args], { cwd: work, env: env(), encoding: "utf8" });
const out = (n) => path.join(work, n);

// 0. an old call site (no --item) fails LOUDLY, never runs uncapped
{
	const r = piReview(["--out", out("sol-r1.md")]);
	check("no --item → refused with the required-item message", r.status === 1 && /--item <slug> is REQUIRED/.test(r.stderr), r.stderr);
	const w = piReview(["--out", out("wp-a-r1.md"), "--worker"]);
	check("a worker launch without --item is refused too", w.status === 1 && /REQUIRED/.test(w.stderr), w.stderr);
	const n = piReview(["--item", "no-rev", "--out", out("x.md")]);
	check("no git HEAD and no --revision → refused", n.status === 1 && /pass --revision/.test(n.stderr), n.stderr);
}

// 1. the four-name bypass: arbitrary names, one item → the fourth is refused
{
	const names = ["sol-final.md", "r3b.md", "r4/out.md", "anything.md"];
	const rs = names.map((n) => piReview(["--item", "four", "--revision", "abc123", "--role", "sol", "--out", out(n)]));
	check("sol-final.md / r3b.md / r4/out.md admitted (rounds 1-3)", rs.slice(0, 3).every((r) => r.status === 0), rs.map((r) => r.stderr).join("\n"));
	check("anything.md (the 4th verdict) refused", rs[3].status === 1 && /round 4, over the cap of 3/.test(rs[3].stderr), rs[3].stderr);
	check("ledger holds exactly 3 verdicts for the item", verdictsFor("four").length === 3);
	const rec = verdictsFor("four")[0];
	check("record shape {v,ts,kind,item,revision,role,out,launcher}",
		rec.v === 1 && !Number.isNaN(Date.parse(rec.ts)) && rec.item === "four" && rec.revision === "abc123" && rec.role === "sol" && rec.out.endsWith("sol-final.md") && rec.launcher === "pi-review", JSON.stringify(rec));
	const viaClaude = ledgerRun(["--item", "four", "--revision", "zzz", "--role", "opus", "--out", out("claude-out.md")]);
	check("switching launcher (review-ledger run) does not reset the count", viaClaude.status === 1 && /over the cap/.test(viaClaude.stderr), viaClaude.stderr);
}

// 2. sol + astra on one revision = one round; the cap spans revisions
{
	const run = (rev, role) => ledgerRun(["--item", "pair", "--revision", rev, "--role", role, "--out", out(`p-${rev}-${role}.md`)]).status;
	const got = [run("x", "sol"), run("x", "astra"), run("y", "sol"), run("z", "sol"), run("z", "astra")];
	check("sol@x astra@x sol@y sol@z astra@z all admitted (3 rounds)", got.every((s) => s === 0), JSON.stringify(got));
	check("a 4th revision is refused", run("w", "sol") === 1);
	check("the same role twice on one revision is a new round (refused at cap)", run("z", "sol") === 1);
}

// 3. stalls, infra failures and worker launches consume nothing
{
	const fail = piReview(["--item", "free", "--revision", "r1", "--out", out("f.md")], "fail");
	check("infra failure → exit 1", fail.status === 1);
	const stall = piReview(["--item", "free", "--revision", "r1", "--out", out("s.md")], "stall");
	check("stalled attempt → exit 1 (watchdog killed it)", stall.status === 1 && /STALL/.test(stall.stderr), stall.stderr);
	const workers = [1, 2, 3, 4].map((i) => piReview(["--item", "free", "--worker", "--out", out(`wp-${i}-r1.md`)], "verdict", path.dirname(bin)));
	check("4 worker launches through pi-review succeed", workers.every((r) => r.status === 0), workers.map((r) => r.stderr).join("\n"));
	check("worker launches are logged (kind=worker) but no verdict counted",
		lines().filter((r) => r.kind === "worker" && r.item === "free").length === 4 && verdictsFor("free").length === 0);
	const nobodyLeft = fs.readdirSync(resDir).length === 0;
	check("no reservation left behind by the failed/stalled attempts", nobodyLeft);
	const after = ["a", "b", "c", "d"].map((rev) => ledgerRun(["--item", "free", "--revision", rev, "--out", out(`free-${rev}.md`)]).status);
	check("…so the item still has all 3 rounds, and the 4th is refused", JSON.stringify(after) === "[0,0,0,1]", JSON.stringify(after));
	const head = piReview(["--item", "headrev", "--out", out("h.md")], "verdict", path.dirname(bin));
	const sha = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: bin, encoding: "utf8" }).stdout.trim();
	check("revision defaults to the reviewed tree's git HEAD", head.status === 0 && verdictsFor("headrev")[0]?.revision === sha, head.stderr);
}

// 4. two concurrent launchers cannot both take the last slot (3 trials)
{
	const race = (item) => new Promise((resolve) => {
		for (const rev of ["p1", "p2"]) ledgerRun(["--item", item, "--revision", rev, "--out", out(`${item}-${rev}.md`)]);
		const slow = [process.execPath, "-e", "setTimeout(()=>console.log('VERDICT: LAND'),1500)"];
		const kids = ["c1", "c2"].map((rev) => spawn(process.execPath, [LEDGER_CLI, "run", "--item", item, "--revision", rev, "--out", out(`${item}-${rev}.md`), "--", ...slow], { cwd: work, env: env(), stdio: ["ignore", "ignore", "pipe"] }));
		const codes = [];
		kids.forEach((k) => { let e = ""; k.stderr.on("data", (d) => (e += d)); k.on("exit", (c) => { codes.push({ c, e }); if (codes.length === 2) resolve(codes); }); });
	});
	for (const item of ["race1", "race2", "race3"]) {
		const codes = await race(item);
		const won = codes.filter((x) => x.c === 0).length;
		const lost = codes.filter((x) => x.c === 1 && /in flight|over the cap/.test(x.e)).length;
		check(`${item}: exactly one of two concurrent launchers wins the last slot`, won === 1 && lost === 1 && verdictsFor(item).length === 3, JSON.stringify(codes));
	}
}

// 5. a crashed reservation (launcher SIGKILLed mid-review) does not wedge the item; nor does a dead lock
{
	for (const rev of ["k1", "k2"]) ledgerRun(["--item", "crash", "--revision", rev, "--out", out(`crash-${rev}.md`)]);
	const hang = [process.execPath, "-e", "setTimeout(()=>{},60000)"];
	const k = spawn(process.execPath, [LEDGER_CLI, "run", "--item", "crash", "--revision", "k3", "--out", out("crash-k3.md"), "--", ...hang], { cwd: work, env: env(), stdio: "ignore", detached: true });
	const t0 = Date.now();
	while (!fs.readdirSync(resDir).length && Date.now() - t0 < 10000) await new Promise((r) => setTimeout(r, 50));
	check("the in-flight review holds the last slot", ledgerCheck(["--item", "crash", "--revision", "k4"]).status === 1);
	process.kill(-k.pid, "SIGKILL"); // our own group: the launcher and its hanging child
	await new Promise((r) => k.exitCode !== null || k.signalCode !== null ? r() : k.on("exit", r));
	const deadPid = spawnSync(process.execPath, ["-e", "console.log(process.pid)"], { encoding: "utf8" }).stdout.trim();
	fs.writeFileSync(path.join(home, ".pi", "agent", "review-ledger.lock"), deadPid); // a crashed lock holder too
	const r = ledgerRun(["--item", "crash", "--revision", "k4", "--out", out("crash-k4.md")]);
	check("after SIGKILL + a dead-pid lock, the next review is admitted", r.status === 0, r.stderr);
	check("the crashed reservation was pruned, and the lock released", fs.readdirSync(resDir).length === 0 && !fs.existsSync(path.join(home, ".pi", "agent", "review-ledger.lock")));
	check("the crashed attempt consumed no round (3 verdicts)", verdictsFor("crash").length === 3);
}

// 6. --over-cap: a flag is not a reason; a real reason is recorded with a timestamp
{
	for (const rev of ["o1", "o2", "o3"]) ledgerRun(["--item", "over", "--revision", rev, "--out", out(`over-${rev}.md`)]);
	const spoof = piReview(["--item", "over", "--revision", "o4", "--out", out("over-o4.md"), "--over-cap", "--retries", "1"]);
	check("--over-cap --retries is refused (a flag is not a reason)", spoof.status === 1 && /--over-cap needs a value/.test(spoof.stderr), spoof.stderr);
	const blank = piReview(["--item", "over", "--revision", "o4", "--out", out("over-o4.md"), "--over-cap", "  "]);
	check("--over-cap '  ' is refused", blank.status === 1);
	check("no override was recorded by the spoofs", !lines().some((l) => l.kind === "override"));
	const ok = piReview(["--item", "over", "--revision", "o4", "--out", out("over-o4.md"), "--over-cap", "instrumented X"]);
	const ov = lines().filter((l) => l.kind === "override" && l.item === "over");
	check("--over-cap 'instrumented X' runs", ok.status === 0, ok.stderr);
	check("the override is recorded with reason, round and timestamp",
		ov.length === 1 && ov[0].reason === "instrumented X" && ov[0].round === 4 && !Number.isNaN(Date.parse(ov[0].ts)), JSON.stringify(ov));
	check("the over-cap verdict carries the override", verdictsFor("over").at(-1)?.override === "instrumented X");
}

fs.rmSync(tmp, { recursive: true, force: true });
process.exit(fails);
