/**
 * @module packages/nana-pack/tests/review-ledger.test.mjs
 * @purpose Pins the per-item review ledger's load-sensitive cases through REAL processes: concurrent launchers, crashed and expired reservations, signals, renewal and the completion race
 * @inputs bin/pi-review.mjs, bin/pi-worker.mjs, lib/review-run.mjs, bin/review-round.mjs, a stub `pi` on PATH, and temp git repositories under a temp HOME, all set up by review-ledger-fixture.mjs
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

// 5. two concurrent launchers on distinct revisions both record without losing a revision
{
	freshHome("5");
	const race = (item) => new Promise((resolve) => {
		const slow = [process.execPath, "-e", "setTimeout(()=>console.log('VERDICT: LAND'),1500)"];
		const trees = [2, 3].map((i) => { const d = path.join(tmp, `${item}-t${i}`); gitIn(A.d, "worktree", "add", "-q", "--detach", d, A.shas[i]); return d; });
		const kids = trees.map((d) => spawn(process.execPath, [LEDGER_CLI, "run", "--item", item, "--out", out(), "--", ...slow], { cwd: d, env: env(), stdio: ["ignore", "ignore", "pipe"] }));
		const codes = [];
		kids.forEach((k) => { let e = ""; k.stderr.on("data", (d) => (e += d)); k.on("exit", (c) => { codes.push({ c, e }); if (codes.length === 2) resolve(codes); }); });
	});
	const item = "race1";
	const codes = await race(item);
	const won = codes.filter((x) => x.c === 0).length;
	const lost = codes.filter((x) => x.c !== 0).length;
	// req: R-714
	check(`${item}: both concurrent reviews record without losing either revision`, won === 2 && lost === 0 && roundsOf(item).length === 2, `${JSON.stringify(codes)} compared: ${pathForms(path.join(A.d, ".git"))}`);
}

// 6. a crashed reservation (launcher SIGKILLed mid-review) does not wedge the item; nor does a dead lock
{
	freshHome("6");
	A.at(2);
	const hang = [process.execPath, "-e", "setTimeout(()=>{},60000)"];
	const k = spawn(process.execPath, [LEDGER_CLI, "run", "--item", "crash", "--out", out(), "--", ...hang], { cwd: A.d, env: env(), stdio: "ignore", detached: true });
	const t0 = Date.now();
	while (!(fs.existsSync(resDir) && fs.readdirSync(resDir).length) && Date.now() - t0 < 10000) await new Promise((r) => setTimeout(r, 50));
	await new Promise((r) => setTimeout(r, 200));
	A.at(3);
	// req: R-714
	check("the in-flight review remains visible to the locked store reader", /1 review\(s\) in flight/.test(ledgerCheck(["--item", "crash"]).stdout));
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
	check("the crashed attempt consumed no round (1 round)", roundsOf("crash").length === 1);
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
	check("…and the renewing review completes and is recorded (exit 0, round 1)", code === 0 && roundsOf("hb").some((x) => x.revision === H.shas[0]), kerr);
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
