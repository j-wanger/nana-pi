/**
 * @module packages/nana-pack/tests/review-ledger-state.test.mjs
 * @purpose Pins the per-item review ledger's identity, tally, audit, snapshot, completion and report through REAL processes against real git repositories
 * @inputs bin/pi-review.mjs, bin/pi-worker.mjs, bin/review-ledger.mjs, bin/review-round.mjs, a stub `pi` on PATH, and temp git repositories under a temp HOME, all set up by review-ledger-fixture.mjs
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, git repositories, worktrees, ledger files), process (spawns the review CLIs, the stub pi, git, and icacls on Windows)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Run: node packages/nana-pack/tests/review-ledger-state.test.mjs
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { tmp, outs, bin, PI_REVIEW, PI_WORKER, LEDGER_CLI, mod, home, agent, tallyFile, auditFile, resDir, freshHome, env, pathForms, jsonl, roundsOf, check, gitIn, repo, A, B, plain, out, piReview, VERDICT_CMD, ledgerRun, ledgerCheck, noStack, reviewAt, finish } from "./review-ledger-fixture.mjs";

// 3. identity: canonical slug, repository scope, worktrees share
{
	freshHome("3");
	for (let i = 0; i < 3; i++) reviewAt("CaseItem", i);
	check("'caseitem' after 3 rounds of 'CaseItem' refused (one item)", reviewAt("caseitem", 3).status === 1);
	for (let i = 0; i < 3; i++) reviewAt("scope one", i);
	check("'scope  one' after 3 rounds of 'scope one' refused", reviewAt(" Scope  ONE ", 3).status === 1);
	// chosen 20000: over SLUG_MAX (128, so still refused) and under Windows' 32,767-character
	// command-line limit (CreateProcess), so the refusal is observed rather than a spawn error.
	for (const bad of ["../item", "a/b", "..", "x".repeat(20000)]) {
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
	check("two worktrees: one repo identity in the tally", new Set(roundsOf("wt").map((r) => r.repo)).size === 1 && roundsOf("wt").length === 3,
		`repos=${JSON.stringify(roundsOf("wt").map((r) => r.repo))} compared: ${pathForms(path.join(A.d, ".git"))} vs ${pathForms(path.join(W, ".git"))}`);
	A.at(2, W);
	check("worktree W2 at A's already-counted revision: admitted, no new round", ledgerRun(["--item", "wt"], { cwd: W }).status === 0 && roundsOf("wt").length === 3);
	A.at(3, W);
	const w4 = ledgerRun(["--item", "wt"], { cwd: W });
	// req: R-705
	check("worktree W2 at a 4th revision: refused (the item is shared)", w4.status === 1 && /over the cap/.test(w4.stderr), `${w4.stderr} compared: ${pathForms(path.join(A.d, ".git"))}`);
	// req: R-624
	check("outside git refuses admission unless --tree names a reviewed repository",
		ledgerRun(["--item", "plain", "--revision", "abc"], { cwd: plain }).status === 1 &&
		/run from the reviewed tree or pass --tree/.test(ledgerRun(["--item", "plain", "--revision", "abc"], { cwd: plain }).stderr));
	const scratch = path.join(tmp, "scratch"); fs.mkdirSync(scratch);
	A.at(0); B.at(5);
	const viaTreeOut = out();
	const viaTree = ledgerRun(["--item", "tree-scope", "--tree", A.d], { cwd: B.d,
		cmd: [process.execPath, "-e", "console.log(process.cwd()); console.log('VERDICT: LAND')"], outFile: viaTreeOut });
	// req: R-621 R-705
	check("scratch launcher cwd with --tree uses the reviewed repository scope",
		viaTree.status === 0 && roundsOf("tree-scope")[0]?.repo === `git:${fs.realpathSync.native(path.join(A.d, ".git"))}` &&
		roundsOf("tree-scope")[0]?.revision === A.shas[0] && A.shas[0] !== B.shas[5] &&
		fs.realpathSync.native(fs.readFileSync(viaTreeOut, "utf8").split(/\r?\n/)[0]) === fs.realpathSync.native(A.d), viaTree.stderr);
	const piTree = piReview(["--item", "pi-tree-scope", "--tree", A.d, "--out", out()], { cwd: scratch });
	// req: R-621
	check("pi-review --tree succeeds from a non-git scratch cwd", piTree.status === 0 && roundsOf("pi-tree-scope")[0]?.repo === `git:${fs.realpathSync.native(path.join(A.d, ".git"))}`, `${piTree.stderr} compared: ${pathForms(path.join(A.d, ".git"))}`);
	const nestedLauncher = path.join(A.d, "nested-launcher"), nestedTree = path.join(A.d, "nested-tree");
	fs.mkdirSync(nestedLauncher); fs.mkdirSync(nestedTree);
	const marker = path.join(tmp, "child-cwd-marker");
	const cwdCommand = [process.execPath, "-e", `require('fs').writeFileSync(${JSON.stringify(marker)}, process.cwd()); console.log(process.cwd()); console.log('VERDICT: LAND')`];
	const nestedOut = out(), selectedOut = out();
	const fromNestedLauncher = ledgerRun(["--item", "cwd-default"], { cwd: nestedLauncher, cmd: cwdCommand, outFile: nestedOut });
	const fromSelectedTree = ledgerRun(["--item", "cwd-tree", "--tree", nestedTree], { cwd: nestedLauncher, cmd: cwdCommand, outFile: selectedOut });
	// req: R-729
	check("review-ledger child executes from selected directory, not repository root",
		fromNestedLauncher.status === 0 && fromSelectedTree.status === 0 &&
		fs.readFileSync(nestedOut, "utf8").split(/\r?\n/)[0] === nestedLauncher &&
		fs.readFileSync(selectedOut, "utf8").split(/\r?\n/)[0] === nestedTree &&
		fs.readFileSync(marker, "utf8") === nestedTree, `${fromNestedLauncher.stderr}\n${fromSelectedTree.stderr}`);
	const legacy = { v: 1, kind: "round", repo: "path:/legacy/scratch", item: "legacy", revision: "old-revision" };
	fs.mkdirSync(agent, { recursive: true }); fs.appendFileSync(tallyFile, JSON.stringify(legacy) + "\n");
	// req: R-622
	check("legacy path-keyed tally rows remain readable", ledgerCheck(["--item", "legacy"], A.d).status === 0 &&
		jsonl(tallyFile).some((r) => r.repo === legacy.repo && r.item === legacy.item && r.revision === legacy.revision));
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
	// req: R-843 R-3455
	check("a corrupted round line refuses admission with file:line", r.status === 1 && /rounds\.jsonl:2: malformed record/.test(r.stderr) && noStack(r), r.stderr);
	fs.writeFileSync(tallyFile, ls.filter((_, i) => i !== 1).join("\n"));
	check("…deleting the line is the documented repair (2 rounds left → admitted)", reviewAt("mal", 4).status === 0);
	fs.writeFileSync(tallyFile, ls[0] + "\n" + JSON.stringify({ v: 1, kind: "round", item: "x" }) + "\n");
	const inc = reviewAt("mal", 5);
	// req: R-853
	check("a record missing repo/revision is malformed too", inc.status === 1);
	// req: R-855
	check("an incomplete round line refuses admission naming file:line", inc.status === 1 && /rounds\.jsonl:2: malformed record/.test(inc.stderr) && noStack(inc), inc.stderr);
}

// 10. non-regular ledger paths, unwritable dir, lock-as-directory: refused with a message, no stack
{
	// chosen: a fifth of the ledger's 15s lock wait (LOCK_WAIT_MS, review-round.mjs); the 5s orphan
	// takeover (LOCK_ORPHAN_MS) lands well past it, so AT_ONCE_MS pins "refused before any wait or
	// takeover", not just "refused eventually".
	const AT_ONCE_MS = 3000;
	const LEDGER_NAMES = ["review-ledger.jsonl", "review-ledger.rounds.jsonl", "review-ledger.jsonl.1"];
	{
		const failures = [];
		for (const name of [...LEDGER_NAMES, "review-ledger.lock"]) {
			freshHome(`10-sym-${name}`);
			fs.mkdirSync(agent, { recursive: true });
			const target = path.join(tmp, `target-${name}`);
			fs.writeFileSync(target, "");
			fs.symlinkSync(target, path.join(agent, name));
			const t0 = Date.now();
			const r = reviewAt("sym", 0);
			const ms = Date.now() - t0;
			const ok = r.status === 1 && /symlink/.test(r.stderr) && fs.readFileSync(target, "utf8") === "" &&
				!/admitted/.test(r.stderr) && noStack(r) && ms < AT_ONCE_MS;
			if (!ok) failures.push(`${name} (${ms}ms): ${r.stderr}`);
		}
		// req: R-1841
		check("every ledger file as a symlink is refused at once before the review, target untouched, no stack", failures.length === 0, failures.join("; "));
	}
	{
		const failures = [];
		for (const name of LEDGER_NAMES) {
			freshHome(`10-dir-${name}`);
			fs.mkdirSync(agent, { recursive: true });
			const target = path.join(agent, name);
			fs.mkdirSync(target, { recursive: true });
			const r = reviewAt("dir", 0);
			const ok = r.status === 1 && r.stderr.includes(`${target} is not a regular file`) && !/admitted/.test(r.stderr) && noStack(r);
			if (!ok) failures.push(`${name}: ${r.stderr}`);
		}
		// req: R-1840
		check("every ledger data file that is a directory is refused before the review, naming the path, no stack", failures.length === 0, failures.join("; "));
	}
	{
		freshHome("10-ro");
		fs.mkdirSync(agent, { recursive: true });
		const isWin = process.platform === "win32";
		let blocked = false;
		let skipReason = null;
		try {
			if (isWin) {
				// CI on d023b052 (Windows leg) found a bare deny on the generic Everyone SID
				// (*S-1-1-0) did not hold there: the runner's account is an administrator and
				// the probe write below still succeeded, so the review was admitted. Strip
				// inherited ACEs first (no stray inherited allow left to out-rank the deny),
				// then deny the CURRENT user's own SID — not a group — the write-type rights
				// directly, granting back only read/traverse so the review process can still
				// stat the folder.
				const who = spawnSync("whoami", ["/user", "/fo", "csv", "/nh"], { encoding: "utf8" });
				const sidRaw = (who.stdout ?? "").trim().split(",").pop()?.replace(/"/g, "").trim();
				const sid = /^S-1-\d+(-\d+)+$/.test(sidRaw ?? "") ? sidRaw : null;
				spawnSync("icacls", [agent, "/inheritance:r"]);
				const denyTo = sid ?? "*S-1-1-0";
				if (sid) spawnSync("icacls", [agent, "/grant", `${sid}:(RX)`]);
				spawnSync("icacls", [agent, "/deny", `${denyTo}:(OI)(CI)(W,AD,WD)`]);
			} else fs.chmodSync(agent, 0o555);
			try { fs.writeFileSync(path.join(agent, "probe.txt"), "x"); } catch { blocked = true; }
			if (isWin && !blocked) skipReason = "the hosted runner's account still writes through a per-user deny after /inheritance:r";
			if (skipReason) {
				console.log(`SKIP an unwritable ledger directory is refused at once before the review, saying it must be writable, no stack — ${skipReason}`);
			} else {
				const t0 = Date.now();
				const ro = reviewAt("ro", 0);
				const ms = Date.now() - t0;
				// req: R-1842
				check("an unwritable ledger directory is refused at once before the review, saying it must be writable, no stack",
					blocked && ro.status === 1 && /must be writable/.test(ro.stderr) && !/admitted/.test(ro.stderr) && noStack(ro) && ms < AT_ONCE_MS,
					blocked ? ro.stderr : `the folder stayed writable; ${ro.stderr}`);
			}
		} finally {
			if (isWin) spawnSync("icacls", [agent, "/reset"]);
			else fs.chmodSync(agent, 0o755);
		}
	}
	freshHome("10-lockdir");
	fs.mkdirSync(path.join(agent, "review-ledger.lock"), { recursive: true });
	const t0 = Date.now();
	const ld = reviewAt("ld", 0);
	// req: R-852
	check("lock path is a directory: refused at once with a message, no stack",
		ld.status === 1 && /lock path .* is not a regular file/.test(ld.stderr) && !/admitted/.test(ld.stderr) && Date.now() - t0 < AT_ONCE_MS && noStack(ld), ld.stderr);
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
		ov.length === 1 && ov[0].reason === "instrumented X" && ov[0].round === 4 && !Number.isNaN(Date.parse(ov[0].ts)), `${JSON.stringify(ov)} compared: ${pathForms(path.join(A.d, ".git"))}`);
	check("the over-cap round carries the override in the tally", roundsOf("over").at(-1)?.override === "instrumented X" && roundsOf("over").length === 4,
		`rounds=${JSON.stringify(roundsOf("over"))} compared: ${pathForms(path.join(A.d, ".git"))}`);
}

// Repo A as the original file left it for the blocks below: the redirect block's untracked log
// (now in review-ledger-verdicts) stays in its work tree.
fs.writeFileSync(path.join(A.d, "redirect.log"), "untouched");
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

	// clean-revision (W7c amend, 2026-10-18): a checkout git itself calls clean now retains plain
	// HEAD (R-1370, R-1371, R-1373), reversing the collapse checks these replace (R-709's dated note).
	const Mx = repo("Mx", 1); // commits "f" as a plain 100644 file
	gitIn(Mx.d, "update-index", "--chmod=+x", "f"); // a committed mode, never chmod on disk
	gitIn(Mx.d, "commit", "-qm", "exec");
	const mxHead = gitIn(Mx.d, "rev-parse", "HEAD");
	gitIn(Mx.d, "config", "core.fileMode", "false");
	fs.chmodSync(path.join(Mx.d, "f"), 0o644); // the committed exec bit is lost on disk
	const mxLsTree = gitIn(Mx.d, "ls-tree", "HEAD", "--", "f");
	const mxDiffQuiet = spawnSync("git", ["diff", "--quiet", "HEAD", "--"], { cwd: Mx.d }).status;
	// req: R-1370
	check("lost committed exec bit retains plain HEAD",
		/^100755/.test(mxLsTree) && mxDiffQuiet === 0 && revOf(Mx.d) === mxHead,
		`lsTree=${mxLsTree} diffQuiet=${mxDiffQuiet} rev=${revOf(Mx.d)} head=${mxHead}`);

	const Cr = repo("Cr", 0);
	fs.writeFileSync(path.join(Cr.d, "t.txt"), "l1\nl2\n");
	gitIn(Cr.d, "add", "."); gitIn(Cr.d, "commit", "-qm", "lf");
	const crHead = gitIn(Cr.d, "rev-parse", "HEAD");
	gitIn(Cr.d, "config", "core.autocrlf", "true");
	fs.rmSync(path.join(Cr.d, "t.txt"));
	gitIn(Cr.d, "checkout", "--", "t.txt"); // git itself writes the CRLF bytes back
	const crBytes = fs.readFileSync(path.join(Cr.d, "t.txt"));
	const crDiffQuiet = spawnSync("git", ["diff", "--quiet", "HEAD", "--"], { cwd: Cr.d }).status;
	// req: R-1371
	check("CRLF checkout retains plain HEAD",
		crBytes.includes(0x0d) && crDiffQuiet === 0 && revOf(Cr.d) === crHead,
		`bytes=${JSON.stringify(crBytes.toString())} diffQuiet=${crDiffQuiet} rev=${revOf(Cr.d)} head=${crHead}`);
	gitIn(Cr.d, "rm", "-q", "--cached", "t.txt"); // index-only removal; the CRLF checkout stays on disk
	const rcBytes = fs.readFileSync(path.join(Cr.d, "t.txt"));
	// req: R-1376
	check("cached removal of normalized content retains plain HEAD",
		rcBytes.includes(0x0d) && revOf(Cr.d) === crHead,
		`bytes=${JSON.stringify(rcBytes.toString())} rev=${revOf(Cr.d)} head=${crHead}`);

	const M = repo("M", 1);
	gitIn(M.d, "config", "core.fileMode", "false");
	fs.chmodSync(path.join(M.d, "f"), 0o755);
	fs.chmodSync(path.join(M.d, "f"), 0o644);
	check("…chmod back → the clean sha", revOf(M.d) === M.shas[0]);

	const V = repo("V", 0);
	fs.writeFileSync(path.join(V.d, "t.txt"), "orig\n");
	gitIn(V.d, "add", "."); gitIn(V.d, "commit", "-qm", "base");
	gitIn(V.d, "config", "core.autocrlf", "true");
	gitIn(V.d, "config", "core.fileMode", "false");
	const vSnaps = [];
	for (const eol of ["\n", "\r\n"]) {
		for (const mode of [0o644, 0o755]) {
			fs.writeFileSync(path.join(V.d, "t.txt"), `orig${eol}edited${eol}`);
			fs.chmodSync(path.join(V.d, "t.txt"), mode);
			vSnaps.push(revOf(V.d));
		}
	}
	fs.chmodSync(path.join(V.d, "t.txt"), 0o644);
	// req: R-1373
	check("normalized dirty copies share one snapshot",
		new Set(vSnaps).size === 1 && /\+snap:[0-9a-f]{64}$/.test(vSnaps[0]), JSON.stringify(vSnaps));

	// R-1375 (clean-revision build 3, round 1 review): the scratch add -A re-hashes every file
	// against a stat-less index, so git FRESHENS (touches the mtime of, never adds, removes or
	// resizes) an object it would write that already exists in the real store reached through the
	// alternates file — a clean derivation touches every unchanged blob and tree, and a dirty one
	// touches every OTHER, unedited file's blob too. No git setting turns freshening off, so mtime
	// is never compared here; only the entry SET and each entry's size and mode are.
	const gitFolderSnapshot = (gitDir) => {
		const out = [];
		const walk = (dir) => {
			for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
				const full = path.join(dir, entry.name);
				const st = fs.lstatSync(full);
				out.push(`${path.relative(gitDir, full)}\t${st.size}\t${st.mode}`);
				if (entry.isDirectory()) walk(full);
			}
		};
		walk(gitDir);
		return out.sort().join("\n");
	};
	// Each fixture commits a SECOND, never-edited file, then derives a CLEAN revision (every file,
	// including the untouched one, already matches HEAD — the case that most exercises freshening)
	// and then a DIRTY one (only "f" edited; "untouched.txt" stays untouched).
	const Gm = repo("Gm", 1);
	fs.writeFileSync(path.join(Gm.d, "untouched.txt"), "never edited\n");
	gitIn(Gm.d, "add", "untouched.txt"); gitIn(Gm.d, "commit", "-qm", "untouched");
	const gmGitDir = path.join(Gm.d, ".git");
	const gmBase = gitFolderSnapshot(gmGitDir);
	revOf(Gm.d); // clean
	const gmClean = gitFolderSnapshot(gmGitDir);
	fs.writeFileSync(path.join(Gm.d, "f"), "metadata-dirty");
	revOf(Gm.d); // dirty
	const gmDirty = gitFolderSnapshot(gmGitDir);

	// F2 (clean-revision build 2): core.splitIndex=true must not leave a sharedindex.* file in the REAL .git.
	const Sx = repo("Sx", 1);
	fs.writeFileSync(path.join(Sx.d, "untouched.txt"), "never edited\n");
	gitIn(Sx.d, "add", "untouched.txt"); gitIn(Sx.d, "commit", "-qm", "untouched");
	gitIn(Sx.d, "config", "core.splitIndex", "true");
	const sxGitDir = path.join(Sx.d, ".git");
	const sxBase = gitFolderSnapshot(sxGitDir);
	revOf(Sx.d); // clean
	const sxClean = gitFolderSnapshot(sxGitDir);
	fs.writeFileSync(path.join(Sx.d, "f"), "split-index-dirty");
	revOf(Sx.d); // dirty
	const sxDirty = gitFolderSnapshot(sxGitDir);

	// F3 (clean-revision build 2): the repository's own post-index-change hook must not run during derivation.
	const Hk = repo("Hk", 1);
	fs.writeFileSync(path.join(Hk.d, "untouched.txt"), "never edited\n");
	gitIn(Hk.d, "add", "untouched.txt"); gitIn(Hk.d, "commit", "-qm", "untouched");
	const hookLog = path.join(tmp, "hook-outside-git.log");
	const hkHooksDir = path.join(Hk.d, ".git", "hooks");
	fs.writeFileSync(path.join(hkHooksDir, "post-index-change"), `#!/bin/sh\necho ran >> "${hookLog}"\n`);
	fs.chmodSync(path.join(hkHooksDir, "post-index-change"), 0o755);
	const hkGitDir = path.join(Hk.d, ".git");
	const hkBase = gitFolderSnapshot(hkGitDir);
	revOf(Hk.d); // clean
	const hkClean = gitFolderSnapshot(hkGitDir);
	fs.writeFileSync(path.join(Hk.d, "f"), "hook-dirty");
	revOf(Hk.d); // dirty
	const hkDirty = gitFolderSnapshot(hkGitDir);
	const hookRan = fs.existsSync(hookLog);

	// req: R-1375
	check("snapshot derivation leaves git metadata unchanged",
		gmBase === gmClean && gmBase === gmDirty && sxBase === sxClean && sxBase === sxDirty &&
			hkBase === hkClean && hkBase === hkDirty && !hookRan,
		`clean-changed:${gmBase !== gmClean} dirty-changed:${gmBase !== gmDirty} ` +
			`splitIndex-clean-changed:${sxBase !== sxClean} splitIndex-dirty-changed:${sxBase !== sxDirty} ` +
			`hook-clean-changed:${hkBase !== hkClean} hook-dirty-changed:${hkBase !== hkDirty} hookRan:${hookRan}`);

	const Cs = repo("Cs", 0);
	fs.writeFileSync(path.join(Cs.d, "t.txt"), "line1\nline2\n");
	gitIn(Cs.d, "add", "."); gitIn(Cs.d, "commit", "-qm", "base");
	const csHead = gitIn(Cs.d, "rev-parse", "HEAD");
	gitIn(Cs.d, "config", "core.autocrlf", "true");
	gitIn(Cs.d, "config", "core.safecrlf", "true");
	const csStatus = spawnSync("git", ["status", "--porcelain"], { cwd: Cs.d, encoding: "utf8" }).stdout;
	// req: R-1378
	check("clean checkout under core.autocrlf and core.safecrlf retains plain HEAD",
		csStatus === "" && revOf(Cs.d) === csHead,
		`status=${JSON.stringify(csStatus)} rev=${revOf(Cs.d)} head=${csHead}`);

	const specialBase = path.join(tmp, "special dir;日本語");
	fs.mkdirSync(specialBase, { recursive: true });
	const specialMain = path.join(specialBase, "main");
	fs.mkdirSync(specialMain);
	gitIn(specialMain, "init", "-q", "-b", "main");
	fs.writeFileSync(path.join(specialMain, "f"), "base\n");
	gitIn(specialMain, "add", "f"); gitIn(specialMain, "commit", "-qm", "base");
	const specialHead = gitIn(specialMain, "rev-parse", "HEAD");
	const specialWt = path.join(tmp, "special-wt");
	gitIn(specialMain, "worktree", "add", "-q", "--detach", specialWt, specialHead);
	const specialCleanRev = revOf(specialWt);
	fs.writeFileSync(path.join(specialWt, "f"), "dirty content");
	const specialDirtyRev = revOf(specialWt);
	const ordMain = path.join(tmp, "OrdSpecial");
	fs.mkdirSync(ordMain);
	gitIn(ordMain, "init", "-q", "-b", "main");
	fs.writeFileSync(path.join(ordMain, "f"), "base\n");
	gitIn(ordMain, "add", "f"); gitIn(ordMain, "commit", "-qm", "base");
	fs.writeFileSync(path.join(ordMain, "f"), "dirty content");
	const ordDirtyRev = revOf(ordMain);
	const snapOf = (rev) => String(rev).split("+snap:")[1];
	// req: R-1377
	check("scratch objects resolve a linked repository with special path characters",
		specialCleanRev === specialHead && !!snapOf(specialDirtyRev) && snapOf(specialDirtyRev) === snapOf(ordDirtyRev),
		`clean=${specialCleanRev} head=${specialHead} specialDirty=${specialDirtyRev} ordDirty=${ordDirtyRev}`);

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
		mod.resolveRevision(undefined, mod.treeScope(U.d, { exclude: [outInTree] }), U.d) === U.shas[0],
		`compared: ${pathForms(outInTree)}`);
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
	check("a review whose --out lands inside the reviewed tree is stable (its own output is excluded)", ok.status === 0 && roundsOf("stable")[0]?.revision === K.shas[0] && !roundsOf("stable")[0]?.unverified, `${ok.stderr} compared: ${pathForms(path.join(K.d, ".git"))}`);
	fs.rmSync(inTreeOut);
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
		roundsOf("outt").length === 0 && noStack(tracked), `${tracked.stderr} compared: ${pathForms(path.join(O.d, "f"))}`);
	const viaSub = pathRel => ledgerRun(["--item", "outt"], { cwd: path.join(O.d), outFile: pathRel });
	const trackedRel = viaSub("./sub/../f");
	check("…also when spelled through ../ (resolved)", trackedRel.status === 1 && /TRACKED file/.test(trackedRel.stderr), `${trackedRel.stderr} compared: ${pathForms(path.join(O.d, "f"))}`);
	gitIn(O.d, "rm", "-q", "--cached", "f");
	const headOnly = mod.admit(["--item", "outt", "--out", path.join(O.d, "f")], { launcher: "test", home, cwd: O.d });
	check("…and a path tracked in HEAD but removed from the index", headOnly.ok === false && /TRACKED/.test(headOnly.message), `${JSON.stringify(headOnly)} compared: ${pathForms(path.join(O.d, "f"))}`);
	gitIn(O.d, "reset", "-q");
	// Seeded with the exact text VERDICT_CMD prints, as a leftover from an earlier run of the same
	// review would read (GP2/R-1351 does the same for the second-spelling case): only with real
	// content present at admission does excluding it from the snapshot make an observable difference.
	fs.writeFileSync(path.join(O.d, "new-out.md"), "VERDICT: LAND\n");
	const untracked = ledgerRun(["--item", "outu"], { cwd: O.d, outFile: path.join(O.d, "new-out.md") });
	const untrackedRounds = roundsOf("outu");
	// req: R-725
	check("an untracked in-tree --out warns, the review still runs, and the output stays out of its snapshot",
		untracked.status === 0 && /WARNING: --out .* inside the reviewed tree/.test(untracked.stderr) &&
		untrackedRounds.length === 1 && !untrackedRounds[0].unverified && untrackedRounds[0].revision === gitIn(O.d, "rev-parse", "HEAD"),
		`${untracked.stderr} compared: ${pathForms(path.join(O.d, "new-out.md"))} rounds=${JSON.stringify(untrackedRounds)}`);
	fs.rmSync(path.join(O.d, "new-out.md"));
	const ignored = ledgerRun(["--item", "outi"], { cwd: O.d, outFile: path.join(O.d, "r.log") });
	// req: R-845
	check("an ignored in-tree --out is silent", ignored.status === 0 && !/WARNING/.test(ignored.stderr), ignored.stderr);
	const outside = ledgerRun(["--item", "outo"], { cwd: O.d });
	// req: R-845
	check("an --out outside the tree is silent", outside.status === 0 && !/WARNING/.test(outside.stderr), outside.stderr);
	const chk = ledgerCheck(["--item", "outt", "--out", path.join(O.d, "f")], O.d);
	// req: R-724
	check("review-ledger check refuses a tracked --out too", chk.status === 1 && /TRACKED/.test(chk.stderr), `${chk.stderr} compared: ${pathForms(path.join(O.d, "f"))}`);
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
			fs.readFileSync(path.join(O.d, "f")).equals(fBytes) && roundsOf("outs").length === 0 && fs.readdirSync(resDir).length === 0 && noStack(s), `${s.stderr} compared: ${pathForms(o)}`);
	}
	const dangling = path.join(outs, "dangling.md");
	fs.symlinkSync(path.join(O.d, "made-by-link.md"), dangling);
	check("a dangling --out link is resolved to where the write would land (in-tree → warns)",
		/inside the reviewed tree/.test(mod.outInTree(fs.realpathSync.native(O.d), dangling) ?? ""));
	// "..notes.md" is a legitimate in-tree name: the check is by path SEGMENT, not string prefix
	fs.writeFileSync(path.join(O.d, "..notes.md"), "NOTES\n");
	gitIn(O.d, "add", "..notes.md"); gitIn(O.d, "commit", "-qm", "dotdot");
	const dd = ledgerRun(["--item", "outd"], { cwd: O.d, outFile: path.join(O.d, "..notes.md") });
	// req: R-724
	check("a TRACKED file named ..notes.md is in-tree and refused (file untouched)",
		dd.status === 1 && /TRACKED file/.test(dd.stderr) && fs.readFileSync(path.join(O.d, "..notes.md"), "utf8") === "NOTES\n" && roundsOf("outd").length === 0, `${dd.stderr} compared: ${pathForms(path.join(O.d, "..notes.md"))}`);
	const du = ledgerRun(["--item", "outdu"], { cwd: O.d, outFile: path.join(O.d, "..draft.md") });
	check("an untracked ..draft.md is in-tree: warns, and is excluded from the snapshot (verdict verified)",
		du.status === 0 && /WARNING: --out .* inside the reviewed tree/.test(du.stderr) && roundsOf("outdu").length === 1 && !roundsOf("outdu")[0].unverified, `${du.stderr} compared: ${pathForms(path.join(O.d, "..draft.md"))}`);
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
	const second = ledgerRun(["--item", "report-item", "--role", "astra"], { cmd: [process.execPath, "-e", "console.log('VERDICT: SEND-BACK')"] });
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
		/^report-item \| [a-f0-9]{12} \| sol \| claude-test-1 \| \d+ms \| 1 \| LAND \| -\nreport-item \| [a-f0-9]{12} \| astra \| - \| \d+ms \| 1 \| SEND-BACK \| -\n$/.test(report.stdout) &&
		second.status === 0 && report.status === 0 && repoReport.status === 0 && repoReport.stdout === report.stdout && reportTally === before &&
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

finish();
