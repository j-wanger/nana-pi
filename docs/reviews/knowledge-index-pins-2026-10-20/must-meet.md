# knowledge-index-pins: must-meet

Feature: FEAT-003 · Index and connect existing knowledge sources
Class: ordinary. The lane changes tests and REQUIREMENTS.md only: no lib/, hook or extension change. If a new check is red on main on any platform, the fix is in lib/. The lane then becomes a hook lane, because the knowledge hook starts this build. It then gets the land reviewer, wrong-code pairs and one independent check.
Threat model: honest variation in our tools' output, platforms (macOS, Linux, Windows) and configs is in scope. Deliberate forgery of files, links or lock contents is out.

Feature sentence: on macOS, Linux and Windows the knowledge build skips .git, raw and linked folders under a root. It turns a declared ledger into one row per [uses: entry outside code fences. It does not read a file whose size and mtime are unchanged. Each listed subdir of a discovered repo becomes a marked articles root. Exactly one builder holds the build lock.

## Design
- Pin lane. It covers eight existing untested rows, adds no product code and no new rows. The R-2030 to R-2039 block stays unused.
- Three new checks go at the end of incremental-build.test.mjs, before its cleanup. Each block has its own temp NANA_KNOWLEDGE_HOME and root, so the file's existing counts stay independent. Each block writes sources.json before it builds; with none, the build seeds from the real home folder.
- The other five rows get markers on existing checks only. The adversary's change: the planned build-level checks in ledger-parse are dropped. The probe showed that every wrong code they catch already fails an existing check. A build that ignores the ledger kind fails 8 incremental-build checks, including "first build rows = 2 articles + 2 ledger entries". The ledger-parse header, its imports and docs/code-map.md stay unchanged: map:check passed with no regeneration.
- The linked folder: fs.symlinkSync(outside, link, process.platform === "win32" ? "junction" : "dir"). The setup tests already use this, and a junction needs no admin rights. The target sits in the test temp folder, outside the walked root.
- Paths are compared with path.join and path.relative, never "/" literals.
- Fast-path proof:
  1. Set the file's mtime to a whole second T, then build.
  2. Rewrite it with bytes of the same length and set the mtime back to T.
  3. Build again. The old token stays searchable and the new one does not.

## Must-meet tests (packages/nana-knowledge/tests/)
Every row is already met on main (pin lane), so no check can be red today. The last column names the wrong code that turns each check red; all of it was probed in a temp clone of main 6f07daee on macOS.

| Row | Requirement (existing text) | Test file::title | Wrong code that turns it red |
|---|---|---|---|
| R-235 | The walker shall skip .git and raw directories. | NEW incremental-build.test.mjs::the walker skips a .git folder and a nested raw folder under an articles root | SKIP_DIRS without ".git"; also without "raw" (each alone). Red only here. |
| R-203 | The walker shall skip symlinked directories. | NEW incremental-build.test.mjs::the walker skips a linked folder under an articles root (a junction on Windows) | The walk follows links: the directory test uses fs.statSync(p), or the link branch stats and pushes the target. Deleting only the link-skip line stays GREEN (see limits). |
| R-236 | WHILE a file's size and mtime are unchanged since the last build, the build shall not read its content. | NEW incremental-build.test.mjs::a file whose size and mtime are unchanged is not read: same-length new bytes stay unindexed | Fast path off (condition false). The existing "second no-op build re-indexes nothing" stays green under it. |
| R-204 | WHERE a root is declared ledger, the build shall emit one row per entry — a line starting -  or a digit that contains [uses: plus its indented continuations. | MARKERS on incremental-build.test.mjs::first build rows = 2 articles + 2 ledger entries; ledger-parse.test.mjs::3-physical-line entry folds into one row; ::numbered entry line is a row; ::bullet without [uses:] is not a row | rowsFor always parseArticle fails first-build-rows (and 7 more). Digits dropped fails numbered. Continuations not folded fails 3-physical-line. [uses: not required fails bullet-without. |
| R-882 | WHERE a root is declared ledger, the build shall exclude lines inside fenced code blocks from becoming rows. | MARKER on ledger-parse.test.mjs::fenced template lines are not rows | Fence toggle removed. |
| R-211 | WHERE a discover block is configured, an immediate child of a listed parent holding a .git directory or a git-worktree .git file shall count as a repo. | MARKERS on discovery.test.mjs::repo with .git DIR contributes each convention subdir it has; ::a git WORKTREE (.git file) counts as a repo | Only a .git folder counts: WORKTREE red. Only a .git file counts: DIR red. |
| R-884 | WHERE a discover block is configured, each listed subdir a counted repo has shall become an articles root marked discovered. | MARKERS on discovery.test.mjs::repo with .git DIR contributes each convention subdir it has; ::discovered roots are articles, and marked | Break after a repo's first subdir: DIR red. discovered:true dropped, or kind "ledger": marked red. |
| R-232 | Every build path shall take build.lock atomically with its pid inside, removed only by its owner. | MARKERS on hook.test.mjs::three sequential lock attempts in one process: exactly one wins; ::the lock file records the owning pid; ::release leaves a lock owned by ANOTHER pid alone; ::build() fails fast while another builder holds the lock | "w" for "wx": exactly-one and fail-fast red. No pid in the lock: owning-pid red. Release removes any lock: ANOTHER-pid red. build() skips the acquire step: fail-fast red. |

Probe with all eight rows flipped:
- The trace rail, the tree check, map:check and readme:check each exit 0.
- requirements-moved reports no tree movement.
- The four files each pass on their own.

## Known limits
- Windows junction (the claim most likely to be wrong): libuv's Windows directory listing marks a reparse point as a link before it tests for a folder. That was read in the source, not run. The Windows CI leg is the proof; a red there is a real bug in lib/build.ts and reclasses the lane.
- A Windows "dir" symlink needs Developer Mode or admin rights and is not tested.
- The link-skip line is redundant today: a listed link is neither file nor folder, so deleting that line alone stays green. The pin catches only code that follows links.
- A root that is itself a link is followed: an explicit root, or a discovered repo's linked docs folder. R-203 covers only folders the walk meets under a root.
- The R-236 check sees re-indexing, not the read itself. A build that read the bytes and discarded them would stay green.
- R-206 gap (found by probe, outside this lane): a fast path keyed on size alone passes the whole file, because R-206's content-change check uses an edit of a different length. The seat records it.
- R-882's own evidence is parse-level. The build's use of the ledger parser is pinned under R-204 (first build rows). A build that ignored the ledger kind fails R-201 and R-204 checks, not R-882's.
- R-211 "immediate child": no check places a repo two levels down.
- The R-884 "articles, and marked" check passes on an empty list; the DIR check supplies the non-empty half.
- R-232 "every build path": --rebuild and the hook's background build both go through build(), which is the only path exercised.
- Left untested; the seat records each in HANDOFF:
  - R-894: the row says a lock past the TTL is reclaimed, but the code keeps a live owner's lock however old. Reword it before pinning.
  - R-215: its no-invention check tests only root kinds, and its seed reads the real home folder.
  - R-885: its parents value falls back to [], not to defaults, so the row wording is wrong. A non-array subdirs under valid parents never runs.
  - R-200, R-881 and R-209: outside the index slice.