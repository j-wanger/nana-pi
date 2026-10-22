# precedent-first: plan attack (adversary, 2026-10-22, main 7d0ab92b)

Verdict: the plan holds in shape. Its brief grammar has two M findings: it is a new parser where one already exists, and it fails on this repo's own brief style. Counts: M 2, S 6, N 5.

## M (must change the plan)

M1. The grammar refuses the lane's own Precedent section. I ran design item 3's rules (pf-plan-draft.md:33) on the draft's section (:10-27) against main's HEAD tree. 2 of 17 entries are refused: `packages/nana-pack/lib/rulings-config.mjs,` (:22) and `packages/nana-pack/tests/worker-lane.test.mjs:43-54,` (:24). A comma follows the path, so the `:N-M` strip misses and the token keeps the comma. This is honest variation: 77 of 378 recorded build briefs have a bullet whose path is followed by `,` or `;`.
  Change: after removing backticks, strip trailing `,` `;` `.` `)` and then the line suffix. Add a trailing-comma case to R-2580's table, and a pair "no trailing-punctuation strip".

M2. Wrapped bullets fail open, and a parser for this already exists. Item 3 ends the section at "the first line that is neither blank nor a bullet". So an indented continuation line ends the section, and every entry after it is never checked; the launch goes ahead. 109 of 378 recorded build briefs have a wrapped top-level bullet. The section is also not fence-aware, so a fenced example `Precedent:` (this lane's own briefs will quote the form) becomes the header.
  The nearest mechanism is packages/nana-pack/lib/handoff-asks.mjs:11-48: a fence-aware heading scan, an `isNamed` section match (frontier-config.mjs:33-40), list items `-` `*` `+` and numbered, and continuation lines joined to their entry. The draft's Precedent list does not name it.
  Change: pull that scan out into a shared section reader, add the plain `Precedent:` label form (seat briefs use plain labels such as `Steps:` and `Done:`), and parse Precedent with it. Add an R-2579 case: a bad path after a wrapped entry is still named. Add a pair "the section ends at the first non-bullet line".

## S

S1. The Claude subagent path is a quarter of the record, not an edge case. 96 of 378 recorded build briefs went to a Claude Sonnet subagent, and 88 of those never mention the preamble. That path gets no check, no known bugs and no new preamble line. Item 11's seat-brief.mjs is already the CLI in all but name. Ship it as `packages/nana-pack/bin/brief-check.mjs` over the lib, run with `node` from the checkout (no PATH shim, so nana-setup stays untouched and the class stays ordinary). The audit proposed exactly this (the seat's 2026-10-22 audit). Change the open item's default from `later` to `now`.

S2. The known-bug prompt arrives with no framing. The preamble's only known-bug line forbids editing the folder (builder-preamble.md:7). Its other lines say "A findings list is closures only" (:9) and "no other new test" (:16). A third system prompt full of open defects, with nothing saying what to do with them, invites scope creep. Extend R-2582's line, or add one pinned line: the feature's known bugs follow the brief; fix none the brief does not name; report any that the change touches.

S3. HEAD in the lane, not on main. Refusing a precedent that landed on main after the lane branched is right, because the builder works only in its worktree (builder-preamble.md:6). But "is not tracked at HEAD" does not say which HEAD, so the seat will read it as a typo. Name the worktree's short sha and add "merge main if it landed there". The opposite case also passes: a file deleted or moved on main after the branch point is still at the lane's HEAD. The threat model (pf-plan-draft.md:6) claims moved and deleted files are in scope. Scope that claim to the lane's HEAD in the known limits.

S4. Git failure has no row and no test. Item 4 says a git failure refuses, but no row pins that. The fail-open pair (catch, then pass) would pass every listed test. Add an R-2579 case: delete the fixture HEAD's loose tree object, so `ls-tree` exits non-zero while `rev-parse` still works; expect `cannot list paths tracked at HEAD` and no spawn marker.

S5. R-2578 is wider than its test. The row says the refusal names "the Precedent section and its two entry forms" (pf-plan-draft.md:46). The test checks only "naming Precedent" (:47). Assert both `- <path>` and `- none: <reason>`, or narrow the row.

S6. Missing wrong-code pairs (the fixture changes are cheap):
  - The index instead of HEAD (`git ls-files`): add a file that is staged but not committed. Only an untracked file is in the list today.
  - A whole-tree `startsWith` with no `/` boundary: add a partial-segment entry such as `packages/nana-pa`.
  - The `git mv` case must commit the move. An uncommitted move leaves the old path at HEAD, so correct code passes it and the case goes red for the wrong reason.
  - Falling back to `unplaced.md` when the feature has no file: the R-2581 fixture commits only FEAT-006.md, so this wrong code passes. Commit `docs/known-bugs/unplaced.md` too.

## N

N1. Folder entries make the output unbounded. `- .` lists 3,757 paths (215,034 bytes) and passes, which is vacuous. pi-worker ships to every project, and execFileSync's default 1 MiB buffer throws in a large repo, which gives a misleading "cannot list" refusal. Use non-recursive `ls-tree` (one line per named file or folder, checked here) or a fixed maxBuffer. MAX_GIT_BUFFER (scripts/requirements-moved.mjs:19) cannot be imported from packages.
N2. Known-bug size today: the largest file is FEAT-013.md at 46,035 bytes (about 11.5k tokens), then FEAT-015.md at 32,528. All 27 files total 243,018 bytes. Each file sits under READ_WINDOW_BYTES (51,200), so nothing overflows now. Growth has no bound, because known-bugs.mjs only reports size (scripts/known-bugs.mjs:3). A cheap guard uses the existing window: past READ_WINDOW_BYTES, attach nothing and print the path and size.
N3. R-2509 pins only KNOWN_BUGS_DIR (templates-render.test.mjs:418-420), not UNPLACED_FILE (pf-plan-draft.md:66 claims both). pi-worker does not use UNPLACED_FILE. Move it only for cohesion, and say so.
N4. R-2580 quotes `pi-worker: precedent: <N> checked at HEAD`, but item 5 prints that text plus `; known bugs: …` on the same line. Make the row say "starts with". Also say whether N counts `none:` entries.
N5. Seat practice holds elsewhere. Briefs written in scratch work: `--brief` resolves absolute paths (pi-worker.mjs:93, :96), and entries resolve against the worktree root. The seat commits the plan of record and build brief 1 in the lane before build 1 (59524a6e), so docs/reviews entries are tracked at launch. Confirmation-round briefs go through pi-review and are untouched. The class is ordinary by AGENTS.md's list. IDs from R-2578 up are free: the highest in-flight ID is R-2577, in the ci-jobs worktree. Two in-flight lanes (claude-review-launcher, review-outputs-kept) edit the shared template and AGENTS.md, but other bullets than Plans, so the merge risk is low. The trackedAtHead anchor is :59-62, not :55-58 (pf-plan-draft.md:16).
