# gate-rm-bare-repo — build brief 1

Feature: FEAT-010 · Guard risky commands and protected resources. Class: install, hook or gate.
Builder: a Claude Sonnet subagent in ~/nana-pi-wt/gate-rm-bare-repo on feat/gate-rm-bare-repo, from main 6f0098a8 or newer. Follow packages/nana-pack/prompts/builder-preamble.md, and read must-meet.md first. Run single test files only. Never edit HANDOFF.md or docs/sessions/.

## Change
1. `packages/nana-pack/lib/gate-rm-inside.ts`:
   - Add contract consts beside PLAIN_RM for the HEAD file name, the folder names objects and refs, and the `.git` entry name. Cite git's is_git_directory and R-2240/R-2241.
   - Add `lstatOrNull(p)`: ENOENT/ENOTDIR → null, and any other error rethrown (the outer catch makes it false).
   - Add `isBareShape(dir)`: HEAD `isFile()`, and objects and refs each `isDirectory()`, lstat only. Both sites below use this one function.
   - Add step 3b after the cwd guards: `for (dir = cwdReal; ; dir = dirname(dir)) { any .git entry → break; isBareShape → return false; fs root → break }`. Test `.git` FIRST at each level.
   - In step 5, after `if (st.isSymbolicLink()) return false;`, add `if (st.isDirectory() && isBareShape(cur)) return false;`.
   - Update the header @inputs/@effects and the rmInsideCwd doc comment. Do not touch real-path.mjs or nana-gate.ts.
2. `packages/nana-pack/tests/gate-rm-inside.test.mjs`: add four checks. Put each `// req: R-224x` directly above a one-line `check("<exact title>", …`, with the titles from the must-meet table. Update the file header: @purpose rows, @inputs git on PATH, @effects process (spawns git).
   - Put all new fixtures under one new `tmpDir(...)` root and leave cleanup to tmpDir's exit hook, with no explicit rmSync. CWD, HOME and OUTSIDE stay untouched.
   - Run git through `execFileSync("git", ["-c","user.name=t","-c","user.email=t@example.invalid","-c","init.defaultBranch=main","-c","commit.gpgsign=false", ...])`. Use an env with every `GIT_*` variable removed, and pipe stdio. A missing git fails the file, never skips it.
   - R-2240: cwd `<root>/work`. Run `git init --bare vault` and `git init --bare repos/mirror.git` there (forward slash). Cases: `rm -rf vault`, `vault/objects`, `vault/refs/heads`, `repos/mirror.git/objects`.
   - R-2241 and R-2242 setup: `<root>/src` with `git init` and `commit --allow-empty`. Then run `git clone --bare src proj.git`, `git -C proj.git worktree add wt` and `git -C proj.git branch topic`, and mkdir `wt/build` and `wt/src/gen`.
   - R-2241 cases: in proj.git, `rm -rf objects` and `rm -rf refs`; in proj.git/refs, `rm -rf heads`; in proj.git/refs/heads, `rm -rf topic`; in proj.git/worktrees, `rm -rf wt`.
   - R-2242 cases: in proj.git/wt, `rm -rf build`; in proj.git/wt/src, `rm -rf gen`; in `<root>/both`, `rm -rf build`. Make `both` with `git init`, then write a HEAD file and mkdir objects/, refs/ and build/ at its top.
   - R-2243: five look-alikes under `<root>/look`, each also holding an empty `x/`: onlyhead (HEAD), objrefs (objects/, refs/), headobj, headrefs, and headdir (HEAD/ as a folder, objects/, refs/). Test each one as the target from `look` (`rm -rf <name>`) and as the cwd (`rm -rf x`).
   - "Asks": every case is BLOCK headless, and the interactive run shows exactly one dialog per case. "Unasked": ALLOW headless and interactive with zero dialogs, as in R-1490. A FAIL prints the wrong cases.
3. `packages/nana-pack/README.md`, exemption paragraph: add the guard to the "still asks" list. Replace the two bare-repository known limits with the must-meet's limits. Say "the owner", never a name.
4. `REQUIREMENTS.md`: add rows R-2240 to R-2243 right after R-1496, with the must-meet text verbatim. Mark each implemented with its test once it passes. Then run `npm run req:tree`, `npm run map`, `npm run map:check` and `npm run readme:check`.

## Wrong code to try (each must turn the named check red; restore after)
- W1 drop the step-5 line → R-2240
- W2 drop the 3b shape test → R-2241
- W3 drop the 3b `.git` stop → R-2242
- W4 `.git` tested only at the cwd → R-2242
- W5 `objects || refs` → R-2243
- W7 step-5 test on the full target only → R-2240
- W8 3b tests the cwd only → R-2241
- W9 HEAD of any type → R-2243
- W10 drop refs, W11 drop objects, W12a drop HEAD → R-2243 each
- W13 shape tested before `.git` at each level → R-2242
- W14 walk capped at two levels → R-2241
- W15 step-5 test on the first part only → R-2240
- W16 3b tests HEAD alone → R-2243
- W17 `.git` stop only when it is a folder → R-2242

Declared survivor: W12 accepts links for objects/refs, so it asks more.

## Done
- `node --experimental-strip-types packages/nana-pack/tests/gate-rm-inside.test.mjs` reads all PASS: 7 old checks and 4 new.
- R-2240 and R-2241 FAIL on main's gate-rm-inside.ts.
- gate-corpus.test.mjs and requirements-trace.test.mjs pass. map:check and readme:check are green. No new check prints SKIP.

## Report (≤ 10 lines)
Commit SHA · files changed · each new check's PASS/FAIL on the fix and on main's module · each wrong-code result (red check or survivor) · map, readme and trace results · anything off-brief.