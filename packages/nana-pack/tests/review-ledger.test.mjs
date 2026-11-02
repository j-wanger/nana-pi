/**
 * @module packages/nana-pack/tests/review-ledger.test.mjs
 * @purpose Pins the per-item review ledger's load-sensitive cases through REAL processes: concurrent launchers, crashed and expired reservations, signals, renewal and the completion race
 * @inputs bin/pi-review.mjs, bin/pi-worker.mjs, bin/review-ledger.mjs, bin/review-round.mjs, a stub `pi` on PATH, and temp git repositories under a temp HOME, all set up by review-ledger-fixture.mjs
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, git repositories, worktrees, ledger files), process (spawns the review CLIs, the stub pi, git, and icacls on Windows)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Run: node packages/nana-pack/tests/review-ledger.test.mjs
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { awaitLaunchRecord } from "./launch-wait.mjs";
import { tmp, outs, bin, PI_REVIEW, PI_WORKER, LEDGER_CLI, mod, home, agent, auditFile, resDir, freshHome, env, pathForms, jsonl, roundsOf, verdictsOf, check, gitIn, repo, A, B, out, ledgerRun, ledgerCheck, reviewAt, finish } from "./review-ledger-fixture.mjs";

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
		check(`${item}: exactly one of two concurrent launchers wins the last round`, won === 1 && lost === 1 && roundsOf(item).length === 3, `${JSON.stringify(codes)} compared: ${pathForms(path.join(A.d, ".git"))}`);
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
	// req: R-714 R-3455
	check("the in-flight review holds the last round (check says no)", ledgerCheck(["--item", "crash"]).status === 1);
	// win32: a negative pid is not a process-group signal there (libuv's uv_kill → OpenProcess(-pid)
	// fails, ESRCH); taskkill /T reaches the same tree (k plus its hung grandchild) instead.
	if (process.platform === "win32") spawnSync("taskkill", ["/T", "/F", "/PID", String(k.pid)]);
	else process.kill(-k.pid, "SIGKILL");
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
	let signalDetails = "";
	for (const [launcher, sig, expected] of [["review", "SIGINT", 130], ["review", "SIGTERM", 143], ["review", "SIGHUP", 129], ["worker", "SIGINT", 130], ["worker", "SIGTERM", 143], ["worker", "SIGHUP", 129]]) {
		freshHome(`signal-${launcher}-${sig}`);
		const childPidFile = path.join(tmp, `signal-${launcher}-${sig}.pid`);
		const script = launcher === "review" ? PI_REVIEW : PI_WORKER;
		const args = launcher === "review" ? ["--item", "signal", "--out", out()] : ["--out", out()];
		const k = spawn(process.execPath, [script, ...args, "--poll", "1", "--stall-secs", "20", "--retries", "0", "--", "-p", "x"],
			{ cwd: A.d, env: env({ STUB: "ignorer", CHILD_PID: childPidFile }), stdio: ["ignore", "ignore", "pipe"] });
		const exited = new Promise((r) => k.once("exit", r));
		let stderr = ""; k.stderr.on("data", (d) => { stderr += d; });
		const pidRecord = await awaitLaunchRecord(childPidFile, { closed: exited, isComplete: (text) => /^\d+\n$/.test(text) });
		const grandchildPid = Number(pidRecord?.trim());
		if (k.exitCode === null && k.signalCode === null) process.kill(k.pid, sig);
		const code = await exited;
		let grandchildAlive = pidRecord !== null; try { process.kill(grandchildPid, 0); } catch { grandchildAlive = false; }
		const reservationReleased = launcher !== "review" || fs.readdirSync(resDir).length === 0;
		if (pidRecord === null) signalDetails += `${launcher} ${sig}: no pid record\n`;
		signalsCleaned &&= pidRecord !== null && code === expected && !grandchildAlive && reservationReleased;
	}
	// req: R-623
	check("watchdog signals reap children, release review reservations and preserve signal exit codes", signalsCleaned, signalDetails);
} else {
	console.log("SKIP watchdog signals reap children, release review reservations and preserve signal exit codes — Windows has no POSIX signal to a process group");
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
	check("while a renewing review runs past its stale window, another admission sees it in flight", other.ok && /1 review\(s\) in flight/.test(other.note), `${other.note ?? other.message} compared: ${pathForms(path.join(H.d, ".git"))}`);
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
	const script = `const m = await import(${JSON.stringify(pathToFileURL(path.join(bin, "review-round.mjs")).href)});` +
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

finish();
