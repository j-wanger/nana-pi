# External fact-check — lift plan, seat draft 1 (`plan-lift/CHANGE.md`)

Checked from outside the plan, read-only, at `main` `d9cf0bc`. "Ran" means run on this Mac (Node v22.22.2, git 2.50.1 Apple) in
`plan-lift/fx/`. INFERRED means neither read in the repo nor run. Sources are listed at the end.

## Top three

1. **An ANSI or mixed-encoding ledger fails open: the proof passes while row bytes change.** The plan proves at the
   decoded-string level (`CHANGE.md:98-99`, `:107-114`). The ledger refusal list has a NUL check but no U+FFFD or round-trip
   check (`CHANGE.md:38`; `requirements-tree.mjs:423-427`). The threat model names an ANSI *mapping* only (`CHANGE.md:23`).
   Ran: a row with the cp1252 byte `0xE9` decodes to U+FFFD with no NUL. `Buffer.from(text,"utf8")` then differs from the
   raw bytes (43 → 45 bytes). The lift would write `EF BF BD` into that row and still print "rows kept byte-identical".
   This is honest variation, not forgery. Windows PowerShell 5.1 `Add-Content` appends in ANSI to a UTF-8 file with no BOM.
   `Set-Content` on a new or empty file is ANSI too [MS-enc]. Real ledgers carry non-ASCII in many rows (Ran: work-project 154/365,
   basketball-geek 25/171, trading-zone 28/197, yokai-world 826/1106). **Fix:** refuse a ledger whose raw bytes differ from
   the re-encoded text. That test is exact, with no false positives; add it to R-1167 and to T22, and add a mutation.
2. **The gate is per checkout, and the skill sends the run to a fresh worktree where the gate always passes.** The flow
   runs the dry run and `--write` "in a lane worktree of the project" (`CHANGE.md:129-131`; `research-design.md:44-45`).
   `git diff --quiet HEAD` in a new worktree never sees edits in the main checkout or in another lane's worktree. So the
   threat-model case "a ledger with uncommitted edits" (`CHANGE.md:23`) has no mechanism on the recommended path, and
   R-1169's "report uncommitted ledger edits" has nothing to report. basketball-geek's six uncommitted rows sit in its main
   checkout. They would surface only at land, through `nana-land`'s clean-main check (`nana-land.mjs:26-29`), after the
   whole lane, or later as the other session's merge conflict. **Fix (cheap, deterministic):** run `git worktree list --porcelain`,
   then `diff --quiet HEAD -- <ledger>` in each listed worktree, and refuse or name every dirty one. Pin it in R-1164 and T9.
3. **On Windows, a backslash in `<rev>:<path>` makes `--verify`, and any mapping outside the root folder, fail.** Verify reads
   `HEAD:./<path>` for the mapping (`CHANGE.md:124`). The plan does not say how `<path>` is formed. Node's `path.relative`
   on win32 returns `\`, and git's `<rev>:<path>` accepts `/` only. Ran on this Mac: `HEAD:./sub\m.json` gives "does not
   exist in 'HEAD'". The same Windows bug is documented in other projects [git-bs1][git-bs2]. Ran: `ls-files` on a path
   outside the repo exits 128 ("outside repository"). Drive-letter case mismatches on Windows give the same error
   (INFERRED). T28 (`CHANGE.md:180`) does not say that its mapping sits in a subfolder. The Windows leg is non-blocking
   (`ci.yml:50`), and `nana-land` reads no CI result. **Fix:** require the mapping inside `--root`. Pass git a root-relative,
   `/`-joined path. Give T10 and T28 a mapping in a subfolder.

## Cross-platform

- **PowerShell 5.1 and 7.** `"$HOME/nana-pi/…"` expands in both. The mixed `\` and `/` result is fine for Node (INFERRED).
  5.1's `-Encoding UTF8` always writes a BOM [MS-enc], and so does Notepad's "UTF-8 with BOM". Ran: `JSON.parse` on a BOM'd
  mapping throws `Unexpected token`. `research-code.md:92` says "Strip a BOM before JSON.parse", but the plan dropped it:
  §3.2, R-1167 and T25 never name a mapping BOM. The result fails closed, with an unnamed reason.
- **Git Bash.** CI runs `shell: bash` on `windows-latest` (`ci.yml:52-53`), which is Git Bash. Spawned tests call `node`
  directly, so no PowerShell form runs anywhere before land. Plan residual 7 admits this (`CHANGE.md:239`).
- **CRLF and BOM when writing.** The segment split lines up with `parseLedger`'s split (`requirements-tree.mjs:61`),
  including a lone CR. The BOM is kept. S10 (generated lines take the first line's ending, `CHANGE.md:228`) gives a mixed file
  when line 1's ending differs from the body's. That is harmless under autocrlf. Under `-text` it is a visible diff. Minor.
- **Atomic replace on Windows.** libuv's rename is `MoveFileExW(MOVEFILE_REPLACE_EXISTING)`. It fails with EPERM while any
  handle has the target open [bun-pr]. Node will not retry: nodejs/node#29481 was closed as wontfix, pointing at
  graceful-fs [node-29481]. graceful-fs retries EPERM/EACCES/EBUSY for up to 60 s, because Defender and the indexer lock
  newly written files [gfs][wfa-227]. Residual 6 (`CHANGE.md:236`) names an open editor. Most editors close the file after
  reading (INFERRED). The likelier cause is a scanner, or OneDrive, locking the fresh temp file. Refusing is safe but will
  be flaky. Add a bounded retry as a tunable with provenance, or name "retry" in the refusal text.
- **Node.** Type stripping is on by default from 22.18.0 [node-22.18], so the plan's floor is right. CI pins major 22, the
  latest patch (`ci.yml:34,62`). No `package.json` has an `engines` field (grep). On older Node, the import of the `.ts` rail
  (`requirements-trace.mjs:21`) throws before `main`. That is a stack trace, not the named refusal §3.6 promises (INFERRED).

## Git "matches HEAD" (all Ran in scratch unless marked)

- With no commit yet (an unborn HEAD), `diff --quiet HEAD` exits 128, both untracked and staged. Untracked `ls-files
  --error-unmatch` exits 1. The tool must treat any status other than 0, and `status === null` (git not on PATH), as a refusal.
  T9 lists neither an unborn HEAD nor a missing git (`CHANGE.md:162`). The skill should say "commit the ledger first".
- A stat-only change (`touch`) leaves `diff --quiet HEAD --` at 0, so there is no false refusal. The autocrlf=true clean
  CRLF case agrees with the plan's own run (`research-design.md:29`).
- Safer-autocrlf: a blob committed with CRLF stays CRLF on re-add. Verify still matches, because both sides are blobs
  (INFERRED, not run). `-text` with a CRLF working copy over an LF blob refuses, which is correct. `eol=` is unrun (`CHANGE.md:217`).
- GitHub's Windows runners default `core.autocrlf=true` [gha-crlf], so test temp repos inherit it on the Windows leg only.
  Existing tests pin a git identity but never autocrlf (grep over `packages/nana-pack/tests`). Each git test other than
  T11 should pin `core.autocrlf=false`, or the two legs test different things.

## Both seats, from the skill text alone

- One SKILL.md reaches both seats (`steps.mjs:58`). It is a copy on Windows (`steps.mjs:217-226`), which residual 7 covers.
- The skill description (`SKILL.md:3`) has no lift, tree, regroup or "feature tree" word, and R-1169 edits only the §4 body.
  An ask like "turn this repo into a feature tree" may not load the skill in either seat (INFERRED).
- Claude Code on Windows uses Git Bash, or else falls back to its PowerShell tool [cc-win]. With no Git for Windows, git may
  be missing, and `--write` then refuses. That is correct only if a missing git is handled (see above).
- The flow's guard against "uncommitted edits" is blind in a worktree (top issue 2). `$HOME/nana-pi` assumes the checkout's
  location. That is pre-existing (tree residual 13).

## Scope against the owner's words

Traced to the owner (`HANDOFF.md:29,78-79`) and the tree sketch (`tree CHANGE.md:210`): applying a mapping, the mechanical default,
proof by default, `--write` after the yes while the ledger matches HEAD, reserved G nodes, and head and tail
(`research-adopt.md:58-64`). The separate proof module follows req-tree's standard. Scope creep:
1. `--verify <rev>` (R-1168, T28). Neither the owner nor the sketch asks for it. It is a third mode with blob reads and the Windows
   path bug in top issue 3. The reviewer can rerun the dry run at the base instead.
2. A mapping applied to a ledger that already has a tree, with move lines (R-1166 "with or without a tree", R-1162, T20).
   This is regroup-lane work pulled forward; HANDOFF:78 says "to a flat ledger". It is also the plan's own claim most likely wrong.
3. `--emit-mapping` (R-1162, T2, T19). It is not in the sketch. It builds the regroup's interface ahead of that lane.
4. A committed mapping that matches HEAD (R-1164, R-1168). The sketch's HEAD condition names the ledger only. This adds a
   new committed file to every project.
5. `PROBLEM_LINE_CAP` and T26: an output cap nobody asked for. The cost is low.
6. The main-guard realpath fix and T3. They fix tree residual 6 for the new script only. Small and defensible.
7. Skill procedure beyond "after the owner's yes": the lane worktree, the reviewer's `--verify`, and "lift when no lane edits
   the ledger". The first item is the cause of top issue 2.

## Sources
- [MS-enc] https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_character_encoding?view=powershell-5.1
- [node-22.18] https://github.com/nodejs/node/releases/tag/v22.18.0
- [node-29481] https://github.com/nodejs/node/issues/29481 · [bun-pr] https://github.com/oven-sh/bun/pull/43997 · [gfs] https://github.com/isaacs/node-graceful-fs · [wfa-227] https://github.com/npm/write-file-atomic/issues/227
- [git-bs1] https://github.com/AIClarityAU/minspec/pull/2451 · [git-bs2] https://github.com/TheJustinSunPrize/awards/issues/864 · [gha-crlf] https://github.com/actions/checkout/issues/135 · [cc-win] https://docs.anthropic.com/en/docs/claude-code/setup
