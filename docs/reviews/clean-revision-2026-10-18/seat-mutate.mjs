#!/usr/bin/env node
// Seat wrong-code pairs for lane clean-revision (gate lane), written by the seat 2026-10-19 on tip 57e542b, on the
// shared runner. M1-M12 are the adversary's twelve (plan-attack.md "Wrong-code pairs"), each anchored on the current
// workingState; M13-M16 revert the other sites the lane changed that a named check pins (gitOut's env overlay, the
// add's nested-repository exclusions, the clean decision's nested records, the builder's identity-based --out reset).
// Re-run 2026-10-19 on tip 77289a0 (build 2 + merge of main a0e0a69): M2/M4/M5/M8/M11/M14 re-anchored on build 2's
// scratchGit calls; M17-M19 each drop one of the three -c overlays scratchGit pins (R-1378, R-1375).
// Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/clean-revision-2026-10-18/seat-mutate.mjs
import { execFileSync } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const TIP = "68a6327";
const BASE = "1103da1"; // the merge of win-review-paths into this branch: today's raw workingState
const RL = "packages/nana-pack/tests/review-ledger.test.mjs";
const IR = "packages/nana-pack/tests/immutable-review.test.mjs";
const LT = "packages/nana-pack/tests/land.test.mjs";
const PS = "packages/nana-pack/tests/path-spelling.test.mjs";
const RR = "packages/nana-pack/bin/review-round.mjs";

const R1370 = "lost committed exec bit retains plain HEAD";
const R1371 = "CRLF checkout retains plain HEAD";
const R1372 = "normalized checkout review lands its exact tip";
const R1373 = "normalized dirty copies share one snapshot";
const R1374 = "normalized dirty review reproduces exactly";
const R1375 = "snapshot derivation leaves git metadata unchanged";
const R1376 = "cached removal of normalized content retains plain HEAD";
const R1377 = "scratch objects resolve a linked repository with special path characters";
const R1378 = "clean checkout under core.autocrlf and core.safecrlf retains plain HEAD";
const R835 = "collapse: an untracked file is part of the state (≠ clean)";
const R712 = "corrupt index → refused, the message names git's error, no stack, no round";
const CHECK_REFUSES = "check refuses too";
const OUT_SNAPSHOT = "the review's own --out file inside the tree is excluded from its snapshot";
const OUT_STABLE = "a review whose --out lands inside the reviewed tree is stable (its own output is excluded)";
const OUT_DRAFT = "an untracked ..draft.md is in-tree: warns, and is excluded from the snapshot (verdict verified)";
const SUB_DISTINCT = "collapse: two different dirty submodule contents (both render '-dirty') → distinct";
const SUB_SHA = "the full sha-256 is retained (64 hex)";
const RM_CACHED = "split: `git rm --cached` (index only; the file is unchanged on disk) → still the clean sha";
const TWO_WT = "two worktrees: one repo identity in the tally";
const NESTED = "nested repository is refused before admission and consumes no round";
const GP2C = "GP2: an untracked in-tree --out under a folder whose disk case diverges from git's index/HEAD stays out of the snapshot and the review checkout";

const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

// M1: the whole workingState function at TIP, replaced by the one at BASE (read from git, byte for byte).
const HERE = dirname(fileURLToPath(import.meta.url));
const FN_START = "export function workingState(root, exclude = []) {";
const FN_END = "/** `abs` relative to `root` as a git path";
const fnAt = (rev) => {
	const text = execFileSync("git", ["-C", HERE, "show", `${rev}:${RR}`], { encoding: "utf8" });
	const from = text.indexOf(FN_START), to = text.indexOf(FN_END, from);
	if (from < 0 || to < 0) throw new Error(`seat-mutate table: workingState not found at ${rev}`);
	return text.slice(from, to);
};

const ADD_A = "scratchGit(['add', '-A', '--', ':/', ";
const RETURN_SNAP = "    return { head, snapshot: clean ? null : sha256(`tree ${tree}\\0`, ...recs) };";
const CLEAN = "    const clean = !recs.length && tree === headTree;";
// Raw bytes and the fs execute bit of every path the scratch index lists after the add (the pre-lane record form).
const RAW_RECS = String.raw`    const rawRecs = nulList(gitOut(root, ['ls-files', '-z'], { env }).stdout).sort(byteOrder).map((p) => {
      let st; try { st = lstatSync(join(root, p)); } catch { return ''; }
      const bytes = st.isSymbolicLink() ? readlinkSync(join(root, p)) : st.isFile() ? readFileSync(join(root, p)) : 'dir';
      return (st.mode & 0o100 ? '100755' : '100644') + ' ' + sha256(bytes) + '\t' + p + '\0';
    });`;
const IDENTITY_RESET = [
	"      const toReset = candidates.filter((p) => {",
	"        const id = fileIdentity(join(root, p));",
	"        return id && skipIds.some((s) => s.id.dev === id.dev && s.id.ino === id.ino);",
	"      });",
].join("\n");
const NESTED_LIST = [
	"  const nested = nulList(gitOut(root, ['ls-files', '-z', '--others', '--exclude-standard']).stdout)",
	"    .filter((p) => p.endsWith('/')).map((p) => p.slice(0, -1));",
].join("\n");
const READ_TREE = "    scratchGit(['read-tree', head]);";

const DECLARED = [
	"(a) every pair runs on macOS; writeAlternates' forward-slash form and R-1377's ';' path character matter only on the Windows leg, so neither has a macOS pair",
	"(b) no test and no pair: the scratch folder's removal in finally, writeAlternates' newline refusal, and the 'new' record for an untracked nested repository that has commits (immutable-review's nested refusal never reads the revision)",
	`(c) M1 replaces the lane's workingState with the one at ${BASE}, read from git when the table loads`,
	"(d) M7 is the adversary's 'resolve objects relative to the linked worktree incorrectly'; omitting the alternates file outright fails every derivation and has no pair of its own",
];

const PAIRS = [
	{ n: "M1", name: "restore today's raw implementation", edits: [
		one(RR, fnAt(TIP), fnAt(BASE)),
	], tests: [RL, LT], expectRed: [R1370, R1371, R1373, R1376, R1372] },
	{ n: "M2", name: "copy the real index instead of seeding HEAD", edits: [
		one(RR, READ_TREE, "    writeFileSync(env.GIT_INDEX_FILE, readFileSync(resolve(root, gitOut(root, ['rev-parse', '--git-path', 'index']).stdout.trim())));"),
	], tests: [IR, RL], expectRed: [R1374, R1376] },
	{ n: "M3", name: "keep raw hashes for dirty states", edits: [
		one(RR, RETURN_SNAP, `${RAW_RECS}\n    return { head, snapshot: clean ? null : sha256(...rawRecs, ...recs) };`),
	], tests: [RL], expectRed: [R1373] },
	{ n: "M4", name: "force core.autocrlf=false during the add", edits: [
		one(RR, ADD_A, "scratchGit(['-c', 'core.autocrlf=false', 'add', '-A', '--', ':/', "),
	], tests: [RL, LT], expectRed: [R1371, R1373, R1376, R1372] },
	{ n: "M5", name: "force core.fileMode=true during the add", edits: [
		one(RR, ADD_A, "scratchGit(['-c', 'core.fileMode=true', 'add', '-A', '--', ':/', "),
	], tests: [RL, LT], expectRed: [R1370, R1373, R1372] },
	{ n: "M6", name: "remove scratch object isolation", edits: [
		one(RR, "const env = { GIT_INDEX_FILE: join(scratch, 'index'), GIT_OBJECT_DIRECTORY: scratchObjects };", "const env = { GIT_INDEX_FILE: join(scratch, 'index') };"),
	], tests: [RL], expectRed: [R1375] },
	{ n: "M7", name: "alternates name the linked worktree's own git dir", edits: [
		one(RR, "gitOut(root, ['rev-parse', '--git-path', 'objects']).stdout.trim()", "join(gitOut(root, ['rev-parse', '--git-dir']).stdout.trim(), 'objects')"),
	], tests: [RL], expectRed: [R1377, TWO_WT] },
	{ n: "M8", name: "add -u instead of add -A", edits: [
		one(RR, ADD_A, "scratchGit(['add', '-u', '--', ':/', "),
	], tests: [RL], expectRed: [R835] },
	{ n: "M9", name: "remove the --out reset after the add", edits: [
		one(RR, "    if (skipIds.length) {", "    if (false) {"),
	], tests: [RL], expectRed: [OUT_SNAPSHOT, OUT_STABLE, OUT_DRAFT] },
	{ n: "M10", name: "remove the recursive submodule record", edits: [
		one(RR, "if (sub.snapshot) recs.push(`sub ${sub.head}+snap:${sub.snapshot}\\t${p}\\0`);", "void sub;"),
	], tests: [RL], expectRed: [SUB_DISTINCT, SUB_SHA] },
	{ n: "M11", name: "stop reading the real index first", edits: [
		one(RR, NESTED_LIST, "  let nested = [];"),
		one(RR, READ_TREE, `${READ_TREE}\n    nested = nulList(gitOut(root, ['ls-files', '-z', '--others', '--exclude-standard'], { env }).stdout)\n      .filter((p) => p.endsWith('/')).map((p) => p.slice(0, -1));`),
	], tests: [RL], expectRed: [R712, CHECK_REFUSES] },
	{ n: "M12", name: "real-index porcelain decides clean, raw hash when dirty", edits: [
		one(RR, `${CLEAN}\n${RETURN_SNAP}`, [
			"    const porcelain = nulList(gitOut(root, ['--no-optional-locks', 'status', '--porcelain', '-z', '--untracked-files=all']).stdout)",
			"      .map((e) => e.slice(3)).filter((p) => {",
			"        const id = fileIdentity(join(root, p));",
			"        return !(id && skipIds.some((s) => s.id.dev === id.dev && s.id.ino === id.ino));",
			"      });",
			"    const clean = !recs.length && !porcelain.length;",
			RAW_RECS,
			"    return { head, snapshot: clean ? null : sha256(...rawRecs, ...recs) };",
		].join("\n")),
	], tests: [RL], expectRed: [R1376, R1373, RM_CACHED, OUT_SNAPSHOT] },
	{ n: "M13", name: "gitOut drops the scratch env overlay", edits: [
		one(RR, "maxBuffer: 1 << 30, env: env ? { ...process.env, ...env } : process.env });", "maxBuffer: 1 << 30, env: process.env });"),
	], tests: [RL], expectRed: [R1375] },
	{ n: "M14", name: "the add keeps untracked nested repositories", edits: [
		one(RR, "':/', ...nested.map((p) => `:(top,literal,exclude)${p}`)]);", "':/']);"),
	], tests: [IR], expectRed: [NESTED] },
	{ n: "M15", name: "the clean decision ignores nested records", edits: [
		one(RR, CLEAN, "    const clean = tree === headTree;"),
	], tests: [RL], expectRed: [SUB_DISTINCT, SUB_SHA] },
	{ n: "M16", name: "the --out reset matches by spelling, not file identity", edits: [
		one(RR, IDENTITY_RESET, "      const toReset = candidates.filter((p) => skip.has(gitPathKey(p)));"),
	], tests: [PS], expectRed: [GP2C] },
	{ n: "M17", name: "scratchGit drops the core.safecrlf=false overlay", edits: [
		one(RR, "'-c', 'core.safecrlf=false', ", ""),
	], tests: [RL], expectRed: [R1378] },
	{ n: "M18", name: "scratchGit drops the core.splitIndex=false overlay", edits: [
		one(RR, "'-c', 'core.splitIndex=false', ", ""),
	], tests: [RL], expectRed: [R1375] },
	{ n: "M19", name: "scratchGit drops the core.hooksPath overlay", edits: [
		one(RR, ", '-c', `core.hooksPath=${emptyHooks}`", ""),
	], tests: [RL], expectRed: [R1375] },
];

process.exitCode = await runMutations({ lane: "clean-revision", self: import.meta.url, tip: TIP, declared: DECLARED, pairs: PAIRS });
