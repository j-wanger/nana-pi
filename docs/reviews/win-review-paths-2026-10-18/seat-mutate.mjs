#!/usr/bin/env node
// Seat wrong-code pairs for lane win-review-paths (gate lane), written by the seat 2026-10-18 after build 3 and the
// merge of main, on the shared runner. Each pair reverts one site to its pre-lane path form (plan-design.md §4,
// M1-M13; plan-attack.md M14-M15) or removes build 2's tracked-file identity fallback (M16). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/win-review-paths-2026-10-18/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const PS = "packages/nana-pack/tests/path-spelling.test.mjs";
const RR = "packages/nana-pack/bin/review-round.mjs";
const NL = "packages/nana-pack/bin/nana-land.mjs";
const RL = "packages/nana-pack/bin/review-ledger.mjs";
const PR = "packages/nana-pack/bin/pi-review.mjs";
const RP = "packages/nana-pack/lib/real-path.mjs";
const GP1 = "GP1: a tracked --out reached through a second spelling of a folder on its path is refused before the review runs (review-ledger run, review-ledger check, pi-review)";
const GP1C = "GP1: a tracked --out reached through a folder whose disk case diverges from git's index/HEAD is refused before the review runs";
const GP2 = "GP2: an untracked in-tree --out reached through a second spelling of a folder on its path warns, runs, and stays out of the snapshot and the review checkout";
const GP3 = "GP3: one repository reviewed through two spellings of its folder is one ledger item, under one repo key, reported under either spelling";
const GP4 = "GP4: a dead review checkout registered under one spelling of the temp folder is reclaimed when pi-review's own temp folder env points at another";
const GP5 = "GP5: a remaining review checkout registration is reported and refused when the temp folder is spelled differently";
const GP6I = "GP6(i): nana-land merge treats --main through a second spelling as the registered checkout";
const GP6II = "GP6(ii): nana-land merge treats --tree through a second spelling as the registered checkout";
const GP6III = "GP6(iii): nana-land cleanup matches a worktree named through a second spelling to its registration";
const GP7 = "GP7: a non-LAND verdict or an in-flight review recorded through a second spelling of the repository's folder refuses the land";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const JS_KEY = (dir) => `\`git:\${realpathSync(path.resolve(${dir}, git(runGit, ${dir}, "rev-parse", "--git-common-dir")))}\``;

const DECLARED = [
	"(a) every pair runs on macOS, where the case, link and Unicode-form spellings exist; the 8.3 and \\\\?\\ spellings exist only on the Windows leg",
	"(b) SHOULD 1 (repoKeyOf's echo fallback) and SHOULD 5 (realPath throws on ELOOP or EACCES under mustExist) have no test and no pair",
];

const PAIRS = [
	{ n: "M1", name: "repoKeyOf keys by the JS realpath of the relative common dir", edits: [
		one(RR, "for (const args of [['--path-format=absolute', '--git-common-dir'], ['--git-common-dir']]) {", "for (const args of [['--git-common-dir']]) {"),
		one(RR, "return `git:${realPath(resolve(tree, out), { mustExist: true })}`;", "return `git:${realpathSync(resolve(tree, out))}`;"),
	], tests: [PS], expectRed: [GP3, GP6I, GP6II, GP7] },
	{ n: "M2", name: "nana-land keys the --main side by the JS form", edits: [
		one(NL, "if (repo !== repoKeyOf(main))", `if (repo !== ${JS_KEY("main")})`),
	], tests: [PS], expectRed: [GP6I] },
	{ n: "M3", name: "nana-land keys the --tree side by the JS form", edits: [
		one(NL, "const repo = repoKeyOf(tree);", `const repo = ${JS_KEY("tree")};`),
	], tests: [PS], expectRed: [GP6II] },
	{ n: "M4", name: "nana-land cleanup compares worktree paths by JS realpath", edits: [
		one(NL, "realPath(worktree, { mustExist: true }) !== realPath(registeredPath, { mustExist: true })", "realpathSync(worktree) !== realpathSync(registeredPath)"),
	], tests: [PS], expectRed: [GP6III] },
	{ n: "M5", name: "review-ledger report keys --repo by the JS form", edits: [
		one(RL, "import { spawn } from 'node:child_process';", "import { spawn, spawnSync } from 'node:child_process';"),
		one(RL, "import { writeFileSync } from 'node:fs';", "import { realpathSync, writeFileSync } from 'node:fs';"),
		one(RL, "repo = repoKeyOf(resolve(repoPath));", "repo = `git:${realpathSync(resolve(resolve(repoPath), spawnSync('git', ['rev-parse', '--git-common-dir'], { cwd: resolve(repoPath), encoding: 'utf8' }).stdout.trim()))}`;"),
	], tests: [PS], expectRed: [GP3] },
	{ n: "M6", name: "treeScope keys the ledger item by the JS form", edits: [
		one(RR, "return { repo: repoKeyOf(tree), inGit: true, root, head, snapshot };", "return { repo: `git:${realpathSync(resolve(tree, gitOut(tree, ['rev-parse', '--git-common-dir']).stdout.trim()))}`, inGit: true, root, head, snapshot };"),
	], tests: [PS], expectRed: [GP3, GP7] },
	{ n: "M7", name: "workingState's --out skip uses the typed path", edits: [
		one(RR, "exclude.map((x) => relUnder(root, realOut(x)))", "exclude.map((x) => relUnder(root, x))"),
	], tests: [PS], expectRed: [GP2] },
	{ n: "M8", name: "realOut resolves an existing path by JS realpath", edits: [
		one(RR, "try { return realPath(p, { mustExist: true }); } catch (e) {", "try { return realpathSync(p); } catch (e) {"),
	], tests: [PS], expectRed: [GP1, GP2] },
	{ n: "M9", name: "reclaim compares JS realpaths of the registration and the temp folder", edits: [
		one(PR, "readlinkSync, rmSync, statSync", "readlinkSync, realpathSync, rmSync, statSync"),
		one(PR, "canonicalPath = realPath(path);", "canonicalPath = realpathSync(path);"),
		one(PR, "relative(realPath(tmpdir()), canonicalPath)", "relative(realpathSync(tmpdir()), canonicalPath)"),
	], tests: [PS], expectRed: [GP4] },
	{ n: "M10", name: "the end-of-run check matches the registration as a typed string", edits: [
		one(PR, "return p === tempTarget;", "return l === `worktree ${tempRoot}`;"),
	], tests: [PS], expectRed: [GP5] },
	{ n: "M11", name: "pi-review places --out relative to the typed path", edits: [
		one(PR, "const outputRelative = relative(sourceRoot, outReal);", "const outputRelative = relative(sourceRoot, outPath);"),
	], tests: [PS], expectRed: [GP2] },
	{ n: "M12", name: "copySnapshot excludes the typed --out path", edits: [
		one(PR, "? null : outReal);", "? null : outPath);"),
	], tests: [PS], expectRed: [GP2] },
	{ n: "M13", name: "realPath throws for a missing path instead of canonicalizing its existing folder", edits: [
		one(RP, "return canonicalizeMissing(abs);", "throw e;"),
	], tests: [PS], expectRed: [GP5] },
	{ n: "M14", name: "workingState's --out skip compares without the git path key", edits: [
		one(RR, ".filter(Boolean).map(gitPathKey));", ".filter(Boolean));"),
	], tests: [PS], expectRed: [GP2] },
	{ n: "M15", name: "copySnapshot's exclusion compares without the git path key", edits: [
		one(PR, "if (excludedKey && gitPathKey(resolve(from)) === excludedKey) continue;", "if (excludedKey && resolve(from) === resolve(excludedPath)) continue;"),
	], tests: [PS], expectRed: [GP2] },
	{ n: "M16", name: "outInTree finds a tracked --out by path only", edits: [
		one(RR, "if (trackedByPath(root, relGit, head) || trackedByIdentity(root, real, head)) {", "if (trackedByPath(root, relGit, head)) {"),
	], tests: [PS], expectRed: [GP1C] },
];

process.exitCode = await runMutations({ lane: "win-review-paths", self: import.meta.url, tip: "1187eab", declared: DECLARED, pairs: PAIRS });
