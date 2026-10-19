# Lane win-review-paths — build brief 1 (2026-10-18 · feat/win-review-paths · tip after the seat's plan commit)

**Builder: Claude Sonnet 5**, a subagent in this worktree. A **gate lane**: it changes `nana-land`, `pi-review`,
`review-round` and `review-ledger`. The must-meet is GP1 to GP7 in `must-meet.md`, one planned row each (R-1350 to
R-1356, already in `REQUIREMENTS.md`; the leaf total in the R-291 check is already 1,220), plus the evidence GP8. Flip
each row to `implemented`, with its test as evidence, when that test passes.

Read first: `must-meet.md`, then `plan-design.md` (the design, the site table, the GP tests, the wrong-code pairs) and
`plan-attack.md` (the adversary; its amended plan wins where the two disagree), then `plan-inventory.md` for any site's
detail. The design's probes and prototype lived in the seat's scratch folder, which you cannot rely on; rebuild what you
need inside this worktree's temp folders.

**The design you build** (the attack's amended plan):
1. New `packages/nana-pack/lib/real-path.mjs` (six-tag header; effects: disk reads) exporting
   `realPath(p, { mustExist = false } = {})`: `fs.realpathSync.native(path.resolve(p))` on every platform. On ENOENT or
   ENOTDIR without `mustExist`, canonicalize the deepest existing folder and append the rest unchanged; with
   `mustExist`, throw as `realpathSync` does. On any other native error, return `fs.realpathSync` (today's result). No
   case folding. Also export `gitPathKey(s)`: `s.normalize("NFC")` on darwin, `s` elsewhere.
2. One key builder exported from `review-round.mjs`, `repoKeyOf(tree)`: `git:` plus `realPath` of
   `git rev-parse --path-format=absolute --git-common-dir` run in `tree`, falling back to resolving the relative
   `--git-common-dir` against `tree` when git rejects the flag (prior art: `packages/nana-setup/lib/steps.mjs:841`). The
   ledger key (`review-round` treeScope), `nana-land`'s key and its `--tree`/`--main` common-dir check, and
   `review-ledger report --repo` all call it.
3. Every site in the design's site table, plus the attack's additions: the review root (`review-round.mjs:161`) and
   `pi-review`'s source root (`:72`) go through `realPath`, so no compare mixes two path functions; `gitPathKey` on both
   sides of the in-tree `--out` skip and of the checkout's exclusion compare; reclaim and the end-of-run cleanup check
   keep a `try/catch` that falls back to `resolve` for an unreadable entry; `runCleanup` removes and prints git's
   registered path.
4. `packages/nana-pack/README.md` (around line 98): the item key is the native real path of the git common dir (the
   folder's spelling on disk), so two spellings of one folder share the item. Keep every command the README names
   working.

**The tests.** One new file, `packages/nana-pack/tests/path-spelling.test.mjs` (six-tag header, static imports, one
`req:` marker above each check), built as the design's §3 says, with the attack's changes: an `otherSpellings` helper
that builds each second spelling itself (case flip, plus drive letter on win32, only where the volume is
case-insensitive, else a printed SKIP; the 8.3 short name on win32 through the FileSystemObject as
`win32-launch.test.mjs:310-337` does, else a printed SKIP; a link — a symlink on POSIX, a junction on win32; `\\?\` on
win32 for GP1; on darwin an NFD-stored folder reached by its NFC spelling and the reverse). Each check runs every
available spelling, passes only if all pass, and prints the kind and both paths. On win32 the fake pi comes from
`tests/fake-pi.mjs`; on POSIX a `#!/bin/sh` stub. GP5 uses the lock setup on every platform (the fake pi runs
`git worktree lock` on its own cwd; the test unlocks and prunes afterwards) — no git shim, no Windows skip. GP3 adds the
canonical-spelling report leg; GP7 adds the in-flight leg. Use `git config core.autocrlf false` in every repo the file
makes, and temp HOME and USERPROFILE.

**GP8 evidence work.** Move `land.test.mjs`'s Windows test fixes here (from the review-tools lane's cut,
`docs/reviews/win-review-tests-2026-10-18/plan-cut.md`, LANE 1's land.test list): `git config core.autocrlf false` in `repo()` before the first commit; the `:499` repo-root path through
`fileURLToPath`; every `node -e "..."` written with double quotes; the suite command `true` replaced by
`node -e "process.exit(0)"`. Do not resolve any existing test's temp root to its long name — the point is that the tools
now handle the short one. Every existing test file's macOS counts must equal `macos-baseline.txt` here.

**Rules.** Work only in this worktree; in the foreground, through `npm test -- <file>` on this Mac; each call under 5
minutes; never the full suite or a background command; no test writes this checkout; never the real home folder,
`~/.claude` or `~/.pi`; no person's, provider's or machine's name; never `process.env.PI_CODING_AGENT_DIR` or a line
ending in `PI_CODING_AGENT_DIR`; the seven must-meet tests are the only new tests; do not touch `HANDOFF.md`,
`docs/sessions/` or the seat's files. Run `npm run map` after adding the modules and commit the map. Commit with explicit
paths, prefix `win-review-paths: `, ending `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`; push to
`origin feat/win-review-paths` after each commit.

## Done
The new file green on macOS; every touched existing file's macOS count equal to `macos-baseline.txt`; `land`,
`immutable-review`, `review-ledger`, `review-round` and `worker-lane` green on macOS; the rows flipped; the code-map, trace
and README checks. The seat then writes the wrong-code pairs, runs the independent check, opens a draft pull request and
reads the Windows leg.

## Report
≤ 14 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; the new file's macOS line; each touched file's
macOS line before and after; each site changed; what you could not prove on macOS; the one claim most likely wrong on
Windows.
