/**
 * @module packages/nana-pack/tests/review-ledger-launch.test.mjs
 * @purpose Pins the per-item review ledger's launch contract through REAL processes: the required item, four revisions, one revision one round, the verdict corpus and malformed verdicts, and stalls
 * @inputs bin/pi-review.mjs, bin/pi-worker.mjs, bin/review-ledger.mjs, bin/review-round.mjs, a stub `pi` on PATH, and temp git repositories under a temp HOME, all set up by review-ledger-fixture.mjs
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, git repositories, worktrees, ledger files), process (spawns the review CLIs, the stub pi, git, and icacls on Windows)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Run: node packages/nana-pack/tests/review-ledger-launch.test.mjs
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { tmp, outs, PI_WORKER, mod, home, agent, tallyFile, resDir, freshHome, env, pathForms, jsonl, roundsOf, verdictsOf, check, repo, A, plain, out, piReview, ledgerRun, reviewAt, finish } from "./review-ledger-fixture.mjs";

// 0. an old call site (no --item) fails LOUDLY; --worker is gone from the review command
{
	freshHome("0");
	const r = piReview(["--out", out()]);
	check("no --item → refused with the required-item message", r.status === 1 && /--item <slug> is REQUIRED/.test(r.stderr), r.stderr);
	const w = [1, 2, 3, 4, 5].map(() => piReview(["--item", "wk", "--worker", "--out", out()]));
	// req: R-854
	check("pi-review --worker ×5 (sol r1 #3): every one refused, the review never runs",
		w.every((x) => x.status === 1 && /--worker was removed/.test(x.stderr) && !/attempt 1/.test(x.stderr)), w[0].stderr);
	freshHome("wrapper-formal");
	const wrapped = ledgerRun(["--item", "wrapped-formal"]);
	// req: R-971 R-3455
	check("review-ledger run earns a counted round", wrapped.status === 0 && roundsOf("wrapped-formal").length === 1, wrapped.stderr);
	freshHome("ledger-role");
	const roleOut = out();
	const roleRun = ledgerRun(["--item", "ledger-role"], {
		outFile: roleOut,
		extraEnv: { NANA_ROLE: "worker", NANA_HANDOFF: "on" },
		cmd: [process.execPath, "-e", "console.log('role=' + process.env.NANA_ROLE + ' handoff=' + process.env.NANA_HANDOFF); console.log('VERDICT: LAND')"],
	});
	// req: R-1720
	check("review-ledger run starts its command with NANA_ROLE=reviewer and NANA_HANDOFF=off over a caller's worker role",
		roleRun.status === 0 && /^role=reviewer handoff=off\r?$/m.test(fs.readFileSync(roleOut, "utf8")), roleRun.stderr);
	freshHome("ledger-pi");
	const ledgerPi = ledgerRun(["--item", "ledger-pi"], { cmd: ["pi", "-p", "x"] });
	// req: R-1721
	check("review-ledger run -- pi starts pi and records its round", ledgerPi.status === 0 && roundsOf("ledger-pi").length === 1, ledgerPi.stderr);
	freshHome("0");
	const nr = piReview(["--item", "no-rev", "--out", out()], { cwd: plain });
	// req: R-624
	check("outside git without --tree → refused", nr.status === 1 && /run from the reviewed tree or pass --tree/.test(nr.stderr), nr.stderr);
	const wk = spawnSync(process.execPath, [PI_WORKER, "--poll", "1", "--retries", "1", "--out", path.join(outs, "wp.md"), "--", "-p", "x"], { cwd: A.d, env: env(), encoding: "utf8", timeout: 30000 });
	// req: R-2603
	check("pi-worker runs a worker under the watchdog (exit 0, output written)", wk.status === 0 && /VERDICT/.test(fs.readFileSync(path.join(outs, "wp.md"), "utf8")), wk.stderr);
	// req: R-2603
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
	// req: R-2603
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
		rec.v === 2 && rec.kind === "round" && !Number.isNaN(Date.parse(rec.ts)) && rec.repo === `git:${fs.realpathSync.native(path.join(A.d, ".git"))}` &&
		rec.item === "four" && rec.revision === A.shas[0] && rec.role === "sol" && rec.launcher === "pi-review", `${JSON.stringify(rec)} compared: ${pathForms(path.join(A.d, ".git"))}`);
	const viaLedger = reviewAt("four", 4, ["--role", "opus"]);
	// req: R-971
	// req: R-729 R-841
	check("switching launcher (review-ledger run) does not reset the count", viaLedger.status === 1 && /over the cap/.test(viaLedger.stderr), `${viaLedger.stderr} compared: ${pathForms(path.join(A.d, ".git"))}`);
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
	check("…and they are ONE round (10 v2 verdict records, 10 audit verdicts)", roundsOf("rev").length === 1 && jsonl(tallyFile).filter((r) => r.item === "rev").length === 10 && jsonl(tallyFile).filter((r) => r.item === "rev").every((r) => r.v === 2) && verdictsOf("rev").length === 10);
	const tallyBeforeRead = fs.readFileSync(tallyFile, "utf8");
	// req: R-969 R-992
	check("completed round records verdict and readRounds filters without mutation", roundsOf("rev")[0]?.verdict === "LAND" &&
		mod.readRounds(home, { item: "rev", repo: roundsOf("rev")[0]?.repo }).length === 10 && mod.readRounds(home, { item: "missing" }).length === 0 &&
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

{
	freshHome("verdict-corpus"); A.at(0);
	const accepted = ["VERDICT: LAND", "# VERDICT: LAND", "**VERDICT:** LAND", "VERDICT: LAND.", "VERDICT: LAND (9/10)", "VERDICT: LAND — 9/10", "**VERDICT: LAND — 9/10.**", "VERDICT: LAND  ", "VERDICT: LAND-WITH-FIXES", "VERDICT: LAND\r\n", "VERDICT: LAND\n\n", "VERDICT: LAND\n \t\n", "> - **VERDICT:** LAND"];
	let ok = true;
	const problems = [];
	for (const [i, text] of accepted.entries()) {
		const result = ledgerRun(["--item", `corpus-${i}`], { cmd: [process.execPath, "-e", `process.stdout.write(${JSON.stringify(text)})`] });
		const passed = result.status === 0 && jsonl(tallyFile).at(-1)?.verdict === (text.includes("LAND-WITH-FIXES") ? "LAND-WITH-FIXES" : "LAND");
		if (!passed) problems.push(`${JSON.stringify(text)}: ${result.status} ${result.stderr}`);
		ok &&= passed;
	}
	const text = "VERDICT: LAND | FIX-FIRST | BLOCK\r\nVERDICT: SEND-BACK\r\n";
	const final = ledgerRun(["--item", "corpus-final"], { cmd: [process.execPath, "-e", `process.stdout.write(${JSON.stringify(text)})`] });
	const finalPassed = final.status === 1 && jsonl(tallyFile).at(-1)?.item === "corpus-final" && jsonl(tallyFile).at(-1)?.verdict === null;
	const quoted = "Example from the review:\n    VERDICT: LAND\n    Correction: VERDICT: SEND-BACK\nMore findings.\nVERDICT: SEND-BACK\n";
	const quotedResult = ledgerRun(["--item", "corpus-quoted"], { cmd: [process.execPath, "-e", `process.stdout.write(${JSON.stringify(quoted)})`] });
	const quotedPassed = quotedResult.status === 0 && jsonl(tallyFile).at(-1)?.verdict === "SEND-BACK";
	// req: R-969
	check("complete records the LAND corpus forms and final SEND-BACK", ok && finalPassed && quotedPassed, problems.join("; ") || final.stderr || quotedResult.stderr || JSON.stringify(jsonl(tallyFile).at(-1)));
}

{
	freshHome("verdict-malformed"); A.at(0);
	const malformed = ["VERDICT: LAND | FIX-FIRST | BLOCK", "VERDICT: LAND (fixes pending)", "VERDICT: LAND — Fixes: none.", "VERDICT: LAND, with fixes", "VERDICT: L_A_N_D", "VERDICT: L*A*N*D", "VERDICT: LA`ND", "VERDICT: LAND!", "VERDICT: LAND...", "VERDICT: LAND - 9/10", "VERDICT: LAND – 9/10", "VERDICT: LAND (9.5/10)", "VERDICT: LAND\nCorrection: VERDICT: SEND-BACK", "VERDICT: SEND-BACK\n```\nVERDICT: LAND\n```", "VERDICT: LAND\nVΕRDICT: SEND-BACK", "拒否: VERDICT: LAND", "→ VERDICT: LAND", "VERDICT: LAND\nprose after verdict"];
	let empty = true;
	const problems = [];
	for (const [i, text] of malformed.entries()) {
		const result = ledgerRun(["--item", `malformed-${i}`], { cmd: [process.execPath, "-e", `process.stdout.write(${JSON.stringify(text)})`] });
		const passed = result.status === 1 && jsonl(tallyFile).at(-1)?.item === `malformed-${i}` && jsonl(tallyFile).at(-1)?.verdict === null;
		if (!passed) problems.push(`${JSON.stringify(text)}: ${result.status} ${result.stderr} ${JSON.stringify(jsonl(tallyFile).at(-1))}`);
		empty &&= passed;
	}
	// req: R-1010
	check("complete records an empty verdict for malformed verdict suffixes", empty, problems.join("; "));
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

finish();
