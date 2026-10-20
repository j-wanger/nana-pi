# Build brief: knowledge-index-pins
Feature: FEAT-003 · Index and connect existing knowledge sources
Class: ordinary. Threat model: honest variation in tools, platforms (macOS, Linux, Windows) and configs is in scope; forgery is out.
Builder: a Claude Sonnet subagent (simple lane).
- Work in ~/nana-pi-wt/knowledge-index-pins on feat/knowledge-index-pins, from current main (1c539a0e or newer).
- Follow packages/nana-pack/prompts/builder-preamble.md.
- Commit only tests and REQUIREMENTS.md: no lib/, HANDOFF.md or docs/sessions/ change.
- Run single test files only.

## Change
1. tests/incremental-build.test.mjs: add two blocks before the final `fs.rmSync(td, …)`.
   - Each block gets its own temp NANA_KNOWLEDGE_HOME and root under td.
   - Write sources.json BEFORE each build.
   - Restore NANA_KNOWLEDGE_HOME to `home` afterwards.
   a. Walker block.
      - The root holds keep.md, .git/inside.md and notes/raw/scrape.md.
      - It also holds `linked`, a link to a folder under td outside the root that holds linked.md.
      - Make the link with fs.symlinkSync(outside, link, process.platform === "win32" ? "junction" : "dir").
      - Build once, then read that root's docs paths relative to the root. Use path.relative and path.join, no "/" literals.
      - Both checks also require keep.md to be indexed.
   b. Fast-path block.
      - Write same.md and set its atime and mtime to a whole second T. Build.
      - Rewrite it with same-length bytes (oldtoken becomes newtoken) and set the mtime back to T. Build again.
      - Assert reindexed 0, unchanged 1, oldtoken found and newtoken not found.
2. Markers only, as stacked `// req:` lines directly above the existing check call. Make no other edit to an existing test.
   - incremental-build: R-204 under the existing R-201 marker of "first build rows = 2 articles + 2 ledger entries".
   - ledger-parse: R-882 above "fenced template lines are not rows". R-204 above "3-physical-line entry folds into one row", "numbered entry line is a row" and "bullet without [uses:] is not a row".
   - discovery: R-211 and R-884 above "repo with .git DIR contributes each convention subdir it has". R-211 above "a git WORKTREE (.git file) counts as a repo". R-884 above "discovered roots are articles, and marked".
   - hook: R-232 above "three sequential lock attempts in one process: exactly one wins", "the lock file records the owning pid", "release leaves a lock owned by ANOTHER pid alone" and "build() fails fast while another builder holds the lock".
3. REQUIREMENTS.md:
   - Flip R-235, R-203, R-236, R-204, R-882, R-211, R-884 and R-232 to implemented.
   - Each Evidence cell is the backticked repo-relative file::title list of its markers.
   - Add no rows and touch no other row.
4. Run node scripts/requirements-trace.mjs, node scripts/requirements-tree.mjs --check, npm run map:check and npm run readme:check. All are expected green, with no code-map change. If map:check is red, run npm run map and commit docs/code-map.md.

## New check titles
Use the exact text. The `check("title", …` call goes on the line directly under its marker.
- incremental-build.test.mjs::the walker skips a .git folder and a nested raw folder under an articles root (R-235)
- incremental-build.test.mjs::the walker skips a linked folder under an articles root (a junction on Windows) (R-203)
- incremental-build.test.mjs::a file whose size and mtime are unchanged is not read: same-length new bytes stay unindexed (R-236)

## Wrong code to try
For each one: break lib/ in the worktree, run the file, then restore with git checkout before the next try. Commit no lib/ change.
- SKIP_DIRS without ".git", then without "raw": R-235 red each time.
- Delete only `if (e.isSymbolicLink()) continue;`: expected GREEN. Record it and change nothing.
- Directory test via fs.statSync(p).isDirectory(), which follows links: R-203 red.
- Fast-path condition replaced by `false`: R-236 red.
- rowsFor always parseArticle: "first build rows = 2 articles + 2 ledger entries" red.
- Fence toggle removed: "fenced template lines are not rows" red.
- Digit entries dropped: "numbered entry line is a row" red.
- Continuations not folded: "3-physical-line entry folds into one row" red.
- Only a .git folder counts: WORKTREE red. Only a .git file counts: DIR red.
- discovered:true dropped: "discovered roots are articles, and marked" red.
- `break` after the first subdir: DIR red.
- "w" instead of "wx": exactly-one and fail-fast red.
- No pid in the lock: owning-pid red.
- Release removes any lock: ANOTHER-pid red.
- build() skips the acquire step: fail-fast red.

## Done
- The four files pass alone.
- Every wrong code gives the stated result.
- The four step-4 checks are green.
- The eight rows are flipped.
- If a new check is red on today's code, stop and report; touch no lib/.
- The seat, not the builder, reads incremental-build on the Windows CI leg before the final review.

## Report (at most 10 lines)
Verdict; commits; files; each row with its check titles and PASS; the path of a committed docs/reviews/knowledge-index-pins-<date>/builder-mutations.md holding the wrong-code table; the link-skip-line result; the step-4 statuses; anything red on main.