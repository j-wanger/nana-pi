// The changes endpoints answer from git, and nothing a request names can reach
// outside the session's own work tree.
//
// Two halves, both zero-dep (`node <file>`, exit 0 = PASS):
//   A. `changes.mjs` driven directly against temp repositories — the git
//      semantics (baseline, statuses, counts, untracked, no-HEAD, non-repo),
//      the path rejections, and the diff cap.
//   B. the REAL server with a stub `pi` first on PATH, so the ROUTES are
//      covered too: the JSON a browser gets, 404 for a session that is not
//      live, and the loopback Host rule applying to these two GETs like every
//      other endpoint.
//
// Commits are made with `git -c user.name=… -c user.email=…` so the machine's
// own git config cannot change the outcome.
//
// Run: node apps/desk/test/changes-endpoint.test.mjs
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { resolvePiBin, resolvePiPackage } from "../pi-session.mjs";

let fails = 0;
const check = (n, ok, extra = "") => {
	console.log(ok ? "PASS" : "FAIL", n, extra);
	if (!ok) fails++;
};
const TD = fs.mkdtempSync(path.join(os.tmpdir(), "desk-changes-"));
const git = (cwd, ...args) =>
	execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], { cwd, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
const write = (p, s) => {
	fs.mkdirSync(path.dirname(p), { recursive: true });
	fs.writeFileSync(p, s);
};

// changes.mjs reads its caps per CALL, which is what lets one process check both
// sides of the diff cap (A5) without a second import.
const { collectChanges, fileDiff, resolveInRoot } = await import("../changes.mjs");
const byPath = (body) => Object.fromEntries((body.files || []).map((f) => [f.path, f]));

// ── A1. an ordinary repository: modified / added / deleted / renamed / untracked ──
const repo = path.join(TD, "repo");
fs.mkdirSync(repo);
git(repo, "init", "-q", ".");
write(path.join(repo, "keep.txt"), "a\nb\nc\n");
write(path.join(repo, "old.txt"), "x\ny\n");
write(path.join(repo, "sub/deep.txt"), "deep\n");
write(path.join(repo, "gone.txt"), "1\n2\n3\n4\n");
git(repo, "add", "-A");
git(repo, "commit", "-qm", "one");
write(path.join(repo, "keep.txt"), "a\nb\nc\nd\n"); // +1
git(repo, "mv", "old.txt", "renamed.txt"); // staged rename
fs.rmSync(path.join(repo, "gone.txt")); // -4, unstaged delete
write(path.join(repo, "new.md"), "one\ntwo\nthree\n"); // untracked, +3
write(path.join(repo, "staged.txt"), "s1\ns2\n"); // staged add, +2
git(repo, "add", "staged.txt");
fs.writeFileSync(path.join(repo, "blob.bin"), Buffer.from([0x00, 0x01, 0x02, 0x00])); // untracked, NUL-bearing

{
	const r = await collectChanges(repo);
	const f = byPath(r.body);
	check("repo: 200 and repo:true", r.status === 200 && r.body.repo === true, JSON.stringify(r.body).slice(0, 120));
	check("repo: root is the work tree", r.body.root === fs.realpathSync(repo), `${r.body.root} vs ${fs.realpathSync(repo)}`);
	check("modified file: M +1 −0", f["keep.txt"]?.status === "M" && f["keep.txt"].added === 1 && f["keep.txt"].removed === 0, JSON.stringify(f["keep.txt"]));
	check("staged add is A, counted", f["staged.txt"]?.status === "A" && f["staged.txt"].added === 2, JSON.stringify(f["staged.txt"]));
	check("unstaged delete is D, counted", f["gone.txt"]?.status === "D" && f["gone.txt"].removed === 4, JSON.stringify(f["gone.txt"]));
	check("staged rename is R at its NEW path", f["renamed.txt"]?.status === "R" && !f["old.txt"], Object.keys(f).join(","));
	check("untracked file is ?? and its lines are counted", f["new.md"]?.status === "??" && f["new.md"].added === 3, JSON.stringify(f["new.md"]));
	check("untracked binary is flagged, not counted", f["blob.bin"]?.binary === true && f["blob.bin"].added === null, JSON.stringify(f["blob.bin"]));
	check("paths are posix and root-relative", (r.body.files || []).every((x) => !x.path.includes("\\") && !path.isAbsolute(x.path)), "");
	check("files are sorted by path", JSON.stringify(r.body.files.map((x) => x.path)) === JSON.stringify(r.body.files.map((x) => x.path).slice().sort()), "");
	const t = r.body.totals;
	check("totals count the rows we returned", t.files === r.body.files.length, JSON.stringify(t));
	check("totals sum added/removed", t.added === 1 + 2 + 3 && t.removed === 4, JSON.stringify(t));
}

// ── A2. a subdirectory cwd still reports the WHOLE repository, root-relative ──
{
	const r = await collectChanges(path.join(repo, "sub"));
	check("a subdirectory cwd sees the whole repo", byPath(r.body)["keep.txt"]?.added === 1, JSON.stringify(r.body.files?.map((f) => f.path)));
}

// ── A3. per-file diffs ──
{
	const tracked = await fileDiff(repo, "keep.txt");
	check("tracked diff is a unified diff of the change", tracked.status === 200 && /^diff --git/.test(tracked.body.diff) && tracked.body.diff.includes("+d"), JSON.stringify(tracked.body).slice(0, 140));
	check("tracked diff is not truncated", tracked.body.truncated === false, String(tracked.body.truncated));
	const untracked = await fileDiff(repo, "new.md");
	check("untracked diff is synthesized against /dev/null", untracked.status === 200 && untracked.body.diff.startsWith("--- /dev/null\n+++ b/new.md\n@@ -0,0 +1,3 @@\n+one"), JSON.stringify(untracked.body.diff));
	const deleted = await fileDiff(repo, "gone.txt");
	check("a DELETED file still diffs (its realpath cannot be checked)", deleted.status === 200 && deleted.body.diff.includes("+++ /dev/null"), JSON.stringify(deleted.body).slice(0, 140));
}

// ── A4. path rejection ──
{
	const root = fs.realpathSync(repo);
	const cases = [
		["empty", ""],
		["a NUL byte", "keep\0.txt"],
		["absolute posix", "/etc/passwd"],
		["a .. segment", "../outside.txt"],
		["a .. segment mid-path", "sub/../../outside.txt"],
		["a backslash .. segment", "sub\\..\\..\\outside.txt"],
	];
	for (const [name, p] of cases) check(`path rejected: ${name}`, !!resolveInRoot(root, p).error, JSON.stringify(resolveInRoot(root, p)));
	check("a plain relative path is accepted", resolveInRoot(root, "sub/deep.txt").exists === true, JSON.stringify(resolveInRoot(root, "sub/deep.txt")));

	// a symlink INSIDE the repo pointing out of it: no `..`, no absolute path,
	// and it resolves outside — realpath is the only thing that catches it
	const outside = path.join(TD, "outside-secret.txt");
	fs.writeFileSync(outside, "secret\n");
	fs.symlinkSync(outside, path.join(repo, "escape.txt"));
	check("path rejected: a symlink that resolves outside the root", !!resolveInRoot(root, "escape.txt").error, JSON.stringify(resolveInRoot(root, "escape.txt")));
	const viaLink = await fileDiff(repo, "escape.txt");
	check("the endpoint refuses that symlink with 400", viaLink.status === 400, JSON.stringify(viaLink));
	fs.rmSync(path.join(repo, "escape.txt"));

	// an untracked SYMLINK is listed but never READ: its target's line count
	// would be a fact from outside the work tree
	fs.symlinkSync(outside, path.join(repo, "peek.txt"));
	const listed = byPath((await collectChanges(repo)).body)["peek.txt"];
	check("an untracked symlink is listed but not counted", listed && listed.added === null, JSON.stringify(listed));
	fs.rmSync(path.join(repo, "peek.txt"));

	// …and the PER-FILE endpoint refuses one too, even when the target is inside
	// the root — realpath cannot catch that (the resolved path IS inside), so the
	// untracked branch lstats the path as given before it reads anything.
	fs.symlinkSync(path.join(repo, "keep.txt"), path.join(repo, "inside-link.txt"));
	const inside = await fileDiff(repo, "inside-link.txt");
	check("the file endpoint refuses an untracked symlink inside the root", inside.status === 409 && /symlink/.test(inside.body.error || ""), JSON.stringify(inside));
	fs.rmSync(path.join(repo, "inside-link.txt"));

	const bad = await fileDiff(repo, "../outside-secret.txt");
	check("the endpoint refuses `..` with 400 and reads nothing", bad.status === 400 && !JSON.stringify(bad.body).includes("secret"), JSON.stringify(bad));
	if (process.platform === "win32") check("path rejected: a drive letter", !!resolveInRoot(root, "C:\\Windows\\win.ini").error, "");
	else check("path rejected: a drive letter", !!resolveInRoot(root, "C:\\Windows\\win.ini").error, JSON.stringify(resolveInRoot(root, "C:\\Windows\\win.ini")));
}

// ── A5. the diff cap ──
{
	const big = path.join(TD, "bigrepo");
	fs.mkdirSync(big);
	git(big, "init", "-q", ".");
	write(path.join(big, "seed.txt"), "seed\n");
	git(big, "add", "-A");
	git(big, "commit", "-qm", "seed");
	const many = Array.from({ length: 4000 }, (_, i) => `line ${i}`).join("\n") + "\n";
	write(path.join(big, "grown.txt"), many); // untracked: the synthesized path
	write(path.join(big, "seed.txt"), many); // tracked: git's own diff
	process.env.DESK_DIFF_CAP = "2048";
	const t = await fileDiff(big, "seed.txt");
	check("tracked diff past the cap is truncated", t.status === 200 && t.body.truncated === true, JSON.stringify(t.body).slice(0, 80));
	check("tracked diff past the cap is cut AT the cap", t.body.diff.length <= 2048, String(t.body.diff.length));
	const u = await fileDiff(big, "grown.txt");
	check("synthesized diff past the cap is truncated", u.status === 200 && u.body.truncated === true && u.body.diff.length <= 2048, `${u.body.truncated} ${u.body.diff.length}`);
	delete process.env.DESK_DIFF_CAP;
	const full = await fileDiff(big, "seed.txt");
	check("the cap is read per call, so the default returns the whole diff", full.body.truncated === false && full.body.diff.length > 2048, `${full.body.truncated} ${full.body.diff.length}`);
}

// ── A6. a repository with NO commits yet ──
{
	const fresh = path.join(TD, "nohead");
	fs.mkdirSync(fresh);
	git(fresh, "init", "-q", ".");
	write(path.join(fresh, "staged.txt"), "one\ntwo\n");
	write(path.join(fresh, "loose.txt"), "u\n");
	git(fresh, "add", "staged.txt");
	const r = await collectChanges(fresh);
	const f = byPath(r.body);
	check("no-HEAD: still repo:true", r.status === 200 && r.body.repo === true, JSON.stringify(r.body).slice(0, 120));
	check("no-HEAD: a staged file is A, diffed against the empty tree", f["staged.txt"]?.status === "A" && f["staged.txt"].added === 2, JSON.stringify(f["staged.txt"]));
	check("no-HEAD: an untracked file is still ??", f["loose.txt"]?.status === "??" && f["loose.txt"].added === 1, JSON.stringify(f["loose.txt"]));
	const d = await fileDiff(fresh, "staged.txt");
	check("no-HEAD: that file still has a diff", d.status === 200 && d.body.diff.includes("+one"), JSON.stringify(d.body).slice(0, 120));
}

// ── A7. a cwd that is not a git work tree ──
{
	const plain = path.join(TD, "plain");
	fs.mkdirSync(plain);
	fs.writeFileSync(path.join(plain, "a.txt"), "hi\n");
	const r = await collectChanges(plain);
	check("a non-repo cwd answers repo:false, not an error", r.status === 200 && r.body.repo === false && !r.body.error, JSON.stringify(r.body));
	const d = await fileDiff(plain, "a.txt");
	check("the file endpoint says so with 409", d.status === 409, JSON.stringify(d));
}

// ── A8. no git on PATH ──
{
	const savedPath = process.env.PATH;
	process.env.PATH = path.join(TD, "empty-bin");
	fs.mkdirSync(process.env.PATH, { recursive: true });
	const r = await collectChanges(repo);
	process.env.PATH = savedPath;
	check("no git on PATH: repo:false with a reason, never a throw", r.status === 200 && r.body.repo === false && r.body.reason === "git not found", JSON.stringify(r.body));
}

// ── A9. a cwd that no longer exists (the worktree was removed under a session) ──
{
	const r = await collectChanges(path.join(TD, "never-existed"));
	check("a vanished cwd says so, and is not blamed on git", r.status === 200 && r.body.repo === false && r.body.reason === "working directory is gone", JSON.stringify(r.body));
}

// ── A10. the AGGREGATE untracked read budget ──
// The per-file 1 MiB cap bounds one file; nothing bounded the sum, so 1000
// untracked files could be a gigabyte read per refresh. Past the budget a file
// is still a row — it just has no number, and the body says so.
{
	const many = path.join(TD, "budget");
	fs.mkdirSync(many);
	git(many, "init", "-q", ".");
	write(path.join(many, "seed.txt"), "seed\n");
	git(many, "add", "-A");
	git(many, "commit", "-qm", "seed");
	const block = `${Array.from({ length: 100 }, (_, i) => `line ${i}`).join("\n")}\n`;
	const names = ["a", "b", "c", "d", "e", "f"].map((n) => `u-${n}.txt`);
	for (const n of names) write(path.join(many, n), block);
	const size = Buffer.byteLength(block);

	process.env.DESK_UNTRACKED_TOTAL_CAP = String(size * 2 + 1); // admits exactly two
	const r = await collectChanges(many);
	delete process.env.DESK_UNTRACKED_TOTAL_CAP;
	const f = byPath(r.body);
	check("budget: the answer says it is partial, and why", r.body.partial === true && /budget/.test(r.body.partialReason || ""), JSON.stringify(r.body.partialReason));
	check("budget: every untracked file is still a row", names.every((n) => !!f[n]), Object.keys(f).join(","));
	check("budget: the files inside the budget are counted", f["u-a.txt"]?.added === 100 && f["u-b.txt"]?.added === 100, JSON.stringify([f["u-a.txt"], f["u-b.txt"]]));
	check(
		"budget: the ones past it are listed with no count, and are not called binary",
		names.slice(2).every((n) => f[n]?.added === null && f[n]?.binary === false),
		JSON.stringify(names.slice(2).map((n) => f[n])),
	);
	check("budget: the totals are the sum of what WAS counted", r.body.totals.added === 200 && r.body.totals.files === names.length, JSON.stringify(r.body.totals));

	const full = await collectChanges(many);
	check("budget: read per call, so the default counts them all", full.body.totals.added === 600 && !full.body.partial, `${JSON.stringify(full.body.totals)} partial=${full.body.partial}`);
}

// ── A11. the untracked read does not wedge the event loop ──
// The bug: up to 1000 synchronous lstat+readFileSync of 1 MiB each, on the one
// thread that serves every other session. A timer that keeps ticking THROUGH the
// collect is the only evidence those sessions were still being served.
{
	const heavy = path.join(TD, "heavy");
	fs.mkdirSync(heavy);
	git(heavy, "init", "-q", ".");
	write(path.join(heavy, "seed.txt"), "seed\n");
	git(heavy, "add", "-A");
	git(heavy, "commit", "-qm", "seed");
	const chunk = `${"x".repeat(99)}\n`.repeat(2048); // 200 KiB, 2048 lines
	const N = 40; // 8 MiB, under the default budget so every one is read
	for (let i = 0; i < N; i++) write(path.join(heavy, `big-${String(i).padStart(3, "0")}.txt`), chunk);

	// The threshold is RELATIVE: the same ticker is run against an idle loop first,
	// in this process, so a loaded machine moves both numbers and the assertion
	// still means "this collect did not hold the loop". And a tick count, because
	// a collect too fast to be ticked through would pass while measuring nothing.
	// The ticker asks for 1 ms and the floor is TWO ticks: a 5 ms ticker needing
	// five of them wanted ~25 ms of collect, which a fast machine can beat.
	const ticker = () => {
		const st = { worst: 0, ticks: 0, last: Date.now() };
		const h = setInterval(() => {
			const now = Date.now();
			st.worst = Math.max(st.worst, now - st.last);
			st.last = now;
			st.ticks++;
		}, 1);
		st.stop = () => clearInterval(h);
		return st;
	};
	const idle = ticker();
	await new Promise((r) => setTimeout(r, 200));
	idle.stop();

	const busy = ticker();
	const t0 = Date.now();
	const r = await collectChanges(heavy);
	busy.stop();
	const took = Date.now() - t0;
	const f = byPath(r.body);
	check(`loop: all ${N} untracked files are counted`, Object.keys(f).length === N && f["big-000.txt"]?.added === 2048, `${Object.keys(f).length} rows, ${JSON.stringify(f["big-000.txt"])}`);
	check("loop: …and nothing is partial at 8 MiB", !r.body.partial, String(r.body.partialReason));
	check("loop: the collect was long enough to measure", busy.ticks >= 2, `${busy.ticks} ticks over ${took} ms`);
	check(
		"loop: the event loop kept ticking through the collect",
		busy.worst < Math.max(100, 8 * idle.worst),
		`worst gap ${busy.worst} ms over ${took} ms (idle worst ${idle.worst} ms, ${busy.ticks} ticks)`,
	);
}

// ── A12. the budget is charged against BYTES READ, not a stale lstat size ──
// The bug: the walk allocated each file the size `lstat` reported, then read the
// PATH with no limit at all. A file that grew in between defeated the per-file
// cap and the aggregate budget together, and its line count was a number for a
// file nobody had measured. The bound is now decided from the DESCRIPTOR's own
// fstat, so a file that grew past what is left of the budget is refused there —
// the walk's stale allocation buys it nothing.
//
// Forced, not hoped for: `fs.promises` is instrumented for this case only — the
// lstat grows the file it was just asked about (the race, made to happen every
// time), and every read is tallied so the assertion is about bytes, not rows.
{
	const raced = path.join(TD, "raced");
	fs.mkdirSync(raced);
	git(raced, "init", "-q", ".");
	write(path.join(raced, "seed.txt"), "seed\n");
	git(raced, "add", "-A");
	git(raced, "commit", "-qm", "seed");
	const grow = path.join(raced, "grow.txt");
	write(grow, "one\ntwo\n"); // 8 bytes — what the walk will be told
	write(path.join(raced, "small.txt"), "a\n");
	const BUDGET = 64;

	const fsp = fs.promises;
	const realLstat = fsp.lstat, realOpen = fsp.open, realReadFile = fsp.readFile;
	let bytesRead = 0;
	fsp.lstat = async (p, ...rest) => {
		const st = await realLstat(p, ...rest);
		// …and now it is 200 lines, after the size was taken and before any read
		if (String(p).endsWith("grow.txt")) fs.writeFileSync(grow, `${Array.from({ length: 200 }, (_, i) => `grew ${i}`).join("\n")}\n`);
		return st;
	};
	fsp.open = async (...a) => {
		const fh = await realOpen(...a);
		const read = fh.read.bind(fh);
		fh.read = async (...ra) => {
			const r = await read(...ra);
			bytesRead += r.bytesRead;
			return r;
		};
		return fh;
	};
	fsp.readFile = async (...a) => {
		const b = await realReadFile(...a);
		bytesRead += b.length;
		return b;
	};
	let r;
	try {
		process.env.DESK_UNTRACKED_TOTAL_CAP = String(BUDGET);
		r = await collectChanges(raced);
	} finally {
		fsp.lstat = realLstat;
		fsp.open = realOpen;
		fsp.readFile = realReadFile;
		delete process.env.DESK_UNTRACKED_TOTAL_CAP;
	}
	const f = byPath(r.body);
	check("raced: a file that grew under the read is listed with NO count", f["grow.txt"] && f["grow.txt"].added === null, JSON.stringify(f["grow.txt"]));
	check("raced: …and the answer says it is partial, and why", r.body.partial === true && /budget/.test(r.body.partialReason || ""), JSON.stringify(r.body.partialReason));
	check("raced: the bytes actually read never exceed the budget", bytesRead <= BUDGET, `${bytesRead} bytes read against a ${BUDGET}-byte budget`);
	check("raced: a file that did not move is still counted", f["small.txt"]?.added === 1, JSON.stringify(f["small.txt"]));
}

// ── A12b. a file that SHRINKS between the fstat and the read ──
// Growth after the fstat is invisible by construction: nothing past the bound is
// read, so the count is of the bytes that were read and claims nothing more. The
// other direction IS visible — the read comes up short — and a prefix's line
// count would be a number for a file nobody measured, so it is not given one.
// Forced by truncating the file inside the fstat itself, which is exactly the
// window the race has.
{
	const shrink = path.join(TD, "shrink");
	fs.mkdirSync(shrink);
	git(shrink, "init", "-q", ".");
	write(path.join(shrink, "seed.txt"), "seed\n");
	git(shrink, "add", "-A");
	git(shrink, "commit", "-qm", "seed");
	const moving = path.join(shrink, "moving.txt");
	write(moving, `${Array.from({ length: 50 }, (_, i) => `line ${i}`).join("\n")}\n`);
	write(path.join(shrink, "still.txt"), "a\nb\n");

	const fsp = fs.promises;
	const realOpen = fsp.open;
	fsp.open = async (p, ...rest) => {
		const fh = await realOpen(p, ...rest);
		if (!String(p).endsWith("moving.txt")) return fh;
		const stat = fh.stat.bind(fh);
		fh.stat = async (...a) => {
			const st = await stat(...a); // …and now it is 4 bytes, before a byte is read
			fs.writeFileSync(moving, "one\n");
			return st;
		};
		return fh;
	};
	let r;
	try {
		r = await collectChanges(shrink);
	} finally {
		fsp.open = realOpen;
	}
	const f = byPath(r.body);
	check("shrink: a file read shorter than its own fstat gets NO count", f["moving.txt"] && f["moving.txt"].added === null, JSON.stringify(f["moving.txt"]));
	check("shrink: …and the answer says a file changed under the read", r.body.partial === true && /changed under the read/.test(r.body.partialReason || ""), JSON.stringify(r.body.partialReason));
	check("shrink: a file that did not move is still counted", f["still.txt"]?.added === 2, JSON.stringify(f["still.txt"]));
}

// ── A13. a symlink swapped in AFTER the check, before the read ──
// The per-file check is `lstat` on the path as given; the read used to follow
// whatever that path pointed at by the time it ran. The read now goes through a
// descriptor opened O_NOFOLLOW, so the swap is refused at the open. Instrumented
// at `fs.promises.open` — the swap lands exactly in the window it has to.
if (process.platform !== "win32") {
	const secret = path.join(TD, "outside-secret.txt"); // written in A4
	const swap = path.join(repo, "swapme.txt");
	const fsp = fs.promises;
	const realOpen = fsp.open;
	fsp.open = (p, ...rest) => {
		if (String(p).endsWith("swapme.txt") && !fs.lstatSync(swap).isSymbolicLink()) {
			fs.rmSync(swap);
			fs.symlinkSync(secret, swap);
		}
		return realOpen(p, ...rest);
	};
	try {
		fs.writeFileSync(swap, "mine\n");
		const one = await fileDiff(repo, "swapme.txt");
		check("swap: the diff window refuses a path that became a symlink after the check", one.status === 409 && /symlink/.test(one.body.error || ""), JSON.stringify(one));
		check("swap: …and nothing from the target is in the answer", !JSON.stringify(one.body).includes("secret"), JSON.stringify(one.body));

		fs.rmSync(swap);
		fs.writeFileSync(swap, "mine\n");
		const list = byPath((await collectChanges(repo)).body)["swapme.txt"];
		check("swap: the file list lists it and counts nothing", !!list && list.added === null, JSON.stringify(list));
	} finally {
		fsp.open = realOpen;
		fs.rmSync(swap, { force: true });
	}
}

// ── A14. the PER-FILE cap, to the byte ──
// The old read asked for `limit + 1` bytes, because one byte past the bound is
// how "there is more than that" was learned — so a file of exactly the cap cost
// a byte more than the cap, and a file handed the last of the budget cost a byte
// more than the budget. Pinned at the boundary: exactly the cap counts, one byte
// more is refused WITHOUT being read, and the whole refresh reads exactly the
// budget it was given. The byte tally is the assertion — rows would not see it.
{
	const CAP = 1024 * 1024; // UNTRACKED_BYTE_CAP, fixed in changes.mjs
	const edge = path.join(TD, "edge");
	fs.mkdirSync(edge);
	git(edge, "init", "-q", ".");
	write(path.join(edge, "seed.txt"), "seed\n");
	git(edge, "add", "-A");
	git(edge, "commit", "-qm", "seed");
	const atCap = `${"x".repeat(1023)}\n`.repeat(1024); // exactly 1 MiB, 1024 lines
	write(path.join(edge, "at-cap.txt"), atCap);
	write(path.join(edge, "over-cap.txt"), `${atCap}!`); // one byte more

	const fsp = fs.promises;
	const realOpen = fsp.open;
	let bytesRead = 0;
	fsp.open = async (...a) => {
		const fh = await realOpen(...a);
		const read = fh.read.bind(fh);
		fh.read = async (...ra) => {
			const rr = await read(...ra);
			bytesRead += rr.bytesRead;
			return rr;
		};
		return fh;
	};
	let r;
	try {
		process.env.DESK_UNTRACKED_TOTAL_CAP = String(CAP); // room for exactly the at-cap file
		r = await collectChanges(edge);
	} finally {
		fsp.open = realOpen;
		delete process.env.DESK_UNTRACKED_TOTAL_CAP;
	}
	const f = byPath(r.body);
	check("edge: a file of exactly the per-file cap is counted", f["at-cap.txt"]?.added === 1024, JSON.stringify(f["at-cap.txt"]));
	check("edge: one byte past the cap is a row with no count", f["over-cap.txt"]?.added === null && f["over-cap.txt"]?.binary === true, JSON.stringify(f["over-cap.txt"]));
	check("edge: …and the refresh read exactly the budget, no probe byte", bytesRead === CAP, `${bytesRead} bytes read against a ${CAP}-byte budget`);
}

// ── A15. the AGGREGATE boundary, to the byte ──
{
	const sum = path.join(TD, "sum");
	fs.mkdirSync(sum);
	git(sum, "init", "-q", ".");
	write(path.join(sum, "seed.txt"), "seed\n");
	git(sum, "add", "-A");
	git(sum, "commit", "-qm", "seed");
	const body = `${"y".repeat(99)}\n`.repeat(10); // 1000 bytes, 10 lines
	const names = ["s-a.txt", "s-b.txt", "s-c.txt", "s-d.txt", "s-e.txt"];
	for (const n of names) write(path.join(sum, n), body);
	const BUDGET = 5000; // exactly the five of them

	process.env.DESK_UNTRACKED_TOTAL_CAP = String(BUDGET);
	const exact = await collectChanges(sum);
	fs.appendFileSync(path.join(sum, "s-c.txt"), "!"); // one byte more, in the middle of the set
	const overBy1 = await collectChanges(sum);
	delete process.env.DESK_UNTRACKED_TOTAL_CAP;
	const fe = byPath(exact.body), fo = byPath(overBy1.body);
	check("sum: files summing to exactly the budget are all counted", names.every((n) => fe[n]?.added === 10) && !exact.body.partial, JSON.stringify(names.map((n) => fe[n]?.added)));
	const uncounted = names.filter((n) => fo[n]?.added === null);
	check("sum: one byte more anywhere flips exactly one file", uncounted.length === 1, JSON.stringify(uncounted));
	check("sum: …the LAST in path order, not whichever read landed first", uncounted[0] === "s-e.txt", JSON.stringify(uncounted));
	check("sum: …and the answer says the budget did it", overBy1.body.partial === true && /budget/.test(overBy1.body.partialReason || ""), JSON.stringify(overBy1.body.partialReason));
}

// ── A16. the budget under the POOL: who gets the last of it is not a race ──
// 40 files against a budget for exactly 25: 25 counted however the pool
// interleaves, and they are the first 25 in PATH order, because the walk that
// hands out shares is one synchronous pass over the list — not eight workers
// asking "is there room?" in whatever order their stats happen to land.
{
	const pool = path.join(TD, "pool");
	fs.mkdirSync(pool);
	git(pool, "init", "-q", ".");
	write(path.join(pool, "seed.txt"), "seed\n");
	git(pool, "add", "-A");
	git(pool, "commit", "-qm", "seed");
	const body = `${"z".repeat(199)}\n`.repeat(5); // 1000 bytes, 5 lines
	const N = 40, ADMIT = 25;
	const names = Array.from({ length: N }, (_, i) => `p-${String(i).padStart(2, "0")}.txt`);
	for (const n of names) write(path.join(pool, n), body);

	process.env.DESK_UNTRACKED_TOTAL_CAP = String(1000 * ADMIT);
	const r = await collectChanges(pool);
	delete process.env.DESK_UNTRACKED_TOTAL_CAP;
	const f = byPath(r.body);
	const counted = names.filter((n) => f[n]?.added === 5);
	check(`pool: a budget for ${ADMIT} counts exactly ${ADMIT} of ${N}`, counted.length === ADMIT, `${counted.length} counted`);
	check("pool: …and they are the first ones in path order", counted.join(",") === names.slice(0, ADMIT).join(","), counted.join(","));
	check("pool: …and the rest are rows with no number", names.slice(ADMIT).every((n) => f[n] && f[n].added === null), JSON.stringify(names.slice(ADMIT).map((n) => f[n]?.added)));
}

// ── A17. eight workers, one budget, every file growing under the walk ──
// The walk hands out shares from the lstat sizes; the DESCRIPTOR is where the
// real size turns up, and that is the only place left to stop a file that grew.
// If the budget were charged after each read instead of before it, all eight
// workers would read the same untouched `budget − spent` while they sat in
// their reads — and all eight would spend it. Forced: every file grows the
// moment its size is taken, and the reads are slowed so all eight are in flight
// together. What is asserted is the byte tally, which rows cannot show.
{
	const race = path.join(TD, "race8");
	fs.mkdirSync(race);
	git(race, "init", "-q", ".");
	write(path.join(race, "seed.txt"), "seed\n");
	git(race, "add", "-A");
	git(race, "commit", "-qm", "seed");
	const grown = `${"w".repeat(99)}\n`.repeat(10); // 1000 bytes, 10 lines, once grown
	const names = Array.from({ length: 8 }, (_, i) => `g-${i}.txt`);
	for (const n of names) write(path.join(race, n), "tiny\n"); // 5 bytes to the walk
	const BUDGET = 1000; // …and room for exactly ONE of them at its real size

	const fsp = fs.promises;
	const realLstat = fsp.lstat, realOpen = fsp.open;
	let bytesRead = 0;
	fsp.lstat = async (p, ...rest) => {
		const st = await realLstat(p, ...rest); // the size the walk allocates from
		if (/g-\d\.txt$/.test(String(p))) fs.writeFileSync(String(p), grown);
		return st;
	};
	fsp.open = async (...a) => {
		const fh = await realOpen(...a);
		const read = fh.read.bind(fh);
		fh.read = async (...ra) => {
			await new Promise((res) => setTimeout(res, 5)); // hold every worker in its read at once
			const rr = await read(...ra);
			bytesRead += rr.bytesRead;
			return rr;
		};
		return fh;
	};
	let r;
	try {
		process.env.DESK_UNTRACKED_TOTAL_CAP = String(BUDGET);
		r = await collectChanges(race);
	} finally {
		fsp.lstat = realLstat;
		fsp.open = realOpen;
		delete process.env.DESK_UNTRACKED_TOTAL_CAP;
	}
	const f = byPath(r.body);
	check("race8: eight reads in flight spend the budget ONCE", bytesRead <= BUDGET, `${bytesRead} bytes read against a ${BUDGET}-byte budget`);
	check("race8: …so exactly one of the eight is counted", names.filter((n) => f[n]?.added === 10).length === 1, JSON.stringify(names.map((n) => f[n]?.added)));
	check("race8: …and the other seven are rows with no number", names.filter((n) => f[n]?.added === null).length === 7, JSON.stringify(names.map((n) => f[n]?.added)));
}

// ══ B. the routes, through the real server ══════════════════════════════════
const freePort = () =>
	new Promise((resolve) => {
		const s = net.createServer();
		s.listen(0, "127.0.0.1", () => {
			const { port } = s.address();
			s.close(() => resolve(port));
		});
	});
const PORT = await freePort();
const BASE = `http://127.0.0.1:${PORT}`;
const SERVER = new URL("../server.mjs", import.meta.url).pathname;
// The stub `pi` goes first on PATH, and no package contains it — so the desk is
// told which install to parse sessions with, the way the other tests do.
const PI_ROOT = process.env.DESK_PI_ROOT || resolvePiPackage(resolvePiBin()).root;
const binDir = path.join(TD, "bin");
fs.mkdirSync(binDir, { recursive: true });
fs.writeFileSync(
	path.join(binDir, "pi"),
	`#!/usr/bin/env node
let buf = "";
process.stdin.on("data", (c) => {
	buf += c; let nl;
	while ((nl = buf.indexOf("\\n")) >= 0) {
		const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
		if (!line.trim()) continue;
		let cmd; try { cmd = JSON.parse(line); } catch { continue; }
		process.stdout.write(JSON.stringify({ type: "response", id: cmd.id, command: cmd.type, success: true, data: {} }) + "\\n");
	}
});
process.stdin.on("end", () => process.exit(0));
`,
	{ mode: 0o755 },
);

// A raw request; `fetch` cannot forge a Host header, and that is the header the
// desk's DNS-rebind rule is about.
const raw = (port, method, target, host) =>
	new Promise((resolve) => {
		const s = net.connect(port, "127.0.0.1", () => s.write(`${method} ${target} HTTP/1.1\r\nHost: ${host}\r\nConnection: close\r\n\r\n`));
		let out = "";
		s.on("data", (c) => (out += c));
		s.on("close", () => resolve({ status: Number(out.split(" ")[1]) || 0, body: out.slice(out.indexOf("\r\n\r\n") + 4) }));
		s.on("error", (e) => resolve({ status: 0, body: `ERR ${e.code}` }));
		setTimeout(() => { s.destroy(); resolve({ status: 0, body: "(timeout)" }); }, 5000);
	});

const server = spawn("node", [SERVER], {
	env: {
		...process.env,
		DESK_PI_ROOT: PI_ROOT,
		HOME: TD,
		DESK_PORT: String(PORT),
		DESK_APPS_DIR: path.join(TD, "no-apps"),
		PATH: `${binDir}${path.delimiter}${process.env.PATH}`,
	},
	stdio: ["ignore", "pipe", "pipe"],
	detached: true,
});
let log = "";
server.stdout.on("data", (c) => (log += c));
server.stderr.on("data", (c) => (log += c));
const stop = async () => {
	if (server.exitCode === null && server.signalCode === null) {
		const gone = new Promise((r) => server.once("exit", r));
		try { process.kill(-server.pid, "SIGTERM"); } catch { try { server.kill("SIGTERM"); } catch {} }
		await Promise.race([gone, new Promise((r) => setTimeout(r, 4000))]);
		try { process.kill(-server.pid, "SIGKILL"); } catch {}
	}
};

try {
	for (let i = 0; i < 80; i++) {
		try { await fetch(`${BASE}/api/live`); break; } catch { await new Promise((r) => setTimeout(r, 250)); }
		if (i === 79) throw new Error(`server never came up: ${log}`);
	}
	const spawned = await fetch(`${BASE}/api/spawn`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ cwd: repo }),
	}).then((r) => r.json());
	if (!spawned.id) throw new Error(`spawn failed: ${JSON.stringify(spawned)} ${log}`);

	{
		const r = await fetch(`${BASE}/api/session/${spawned.id}/changes`);
		const body = await r.json();
		check("route: /changes answers 200 with the file list", r.status === 200 && body.repo === true && body.files.length > 0, JSON.stringify(body).slice(0, 140));
		check("route: the totals match the module's", byPath(body)["keep.txt"]?.added === 1, JSON.stringify(byPath(body)["keep.txt"]));
	}
	{
		const r = await fetch(`${BASE}/api/session/${spawned.id}/changes/file?path=keep.txt`);
		const body = await r.json();
		check("route: /changes/file answers the unified diff", r.status === 200 && body.diff.includes("+d"), JSON.stringify(body).slice(0, 140));
	}
	{
		const r = await fetch(`${BASE}/api/session/${spawned.id}/changes/file?path=${encodeURIComponent("../outside-secret.txt")}`);
		const body = await r.json();
		check("route: a `..` path is 400 and leaks nothing", r.status === 400 && !JSON.stringify(body).includes("secret"), `${r.status} ${JSON.stringify(body)}`);
	}
	{
		const r = await fetch(`${BASE}/api/session/nosuch/changes`);
		check("route: an unknown session is 404", r.status === 404, String(r.status));
		const r2 = await fetch(`${BASE}/api/session/nosuch/changes/file?path=a.txt`);
		check("route: an unknown session is 404 on the file route too", r2.status === 404, String(r2.status));
	}
	{
		// The loopback Host rule covers these GETs like every other endpoint.
		// Through a RAW socket: `fetch` refuses to send a forged Host header, so a
		// rebinding attempt can only be spelled on the wire.
		for (const [name, target] of [
			["/changes", `/api/session/${spawned.id}/changes`],
			["/changes/file", `/api/session/${spawned.id}/changes/file?path=keep.txt`],
		]) {
			const bad = await raw(PORT, "GET", target, `evil.example:${PORT}`);
			check(`route: the Host rule applies to ${name}`, bad.status === 403, String(bad.status));
			check(`route: …and it says nothing about the tree`, !/keep\.txt|repo/.test(bad.body), bad.body.slice(0, 120));
			const good = await raw(PORT, "GET", target, `127.0.0.1:${PORT}`);
			check(`route: a loopback Host still works on ${name}`, good.status === 200, String(good.status));
		}
	}
	{
		await fetch(`${BASE}/api/session/${spawned.id}`, { method: "DELETE" });
		for (let i = 0; i < 40; i++) {
			const live = await fetch(`${BASE}/api/live`).then((r) => r.json());
			if (!live.some((c) => c.id === spawned.id)) break;
			await new Promise((r) => setTimeout(r, 100));
		}
		const r = await fetch(`${BASE}/api/session/${spawned.id}/changes`);
		check("route: a session that is no longer live is 404", r.status === 404, String(r.status));
	}
} catch (e) {
	console.log("FAIL harness:", e.message, "\n--- server log ---\n", log.slice(-2000));
	fails++;
}

await stop();
fs.rmSync(TD, { recursive: true, force: true });
console.log(fails ? `${fails} FAILED` : "ALL PASS");
process.exit(fails ? 1 : 0);
