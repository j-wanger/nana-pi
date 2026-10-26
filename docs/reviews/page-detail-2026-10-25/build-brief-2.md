Feature: FEAT-039 · See the product and its decisions in one report. Lane page-detail. Class: ordinary. Builder: pi-worker (larger lane). Build session 2.

Work in the lane worktree on feat/page-detail. Session 1 built most of the lane and stopped BLOCKED with its work uncommitted in this worktree: rows R-2930 to R-2933 added, eight rows reworded, R-2800 retired, existing-test edits 8a to 8n and 9 made, eight helpers moved, and product-detail.test.mjs and product-overview.test.mjs passing. One clause stopped it, rightly. Build brief 1's step 8f told R-2542's check to assert that `#FEAT-052` shows no `deliverable-block`. But that fixture's FEAT-052 homes R-5100, which CAP-51 lists as a deliverable (`packages/nana-pack/tests/product-report.test.mjs:1155-1156`), so R-2932 requires R-5100's block there. The clause meant to say that FEAT-052, which shares R-5000 and R-5001 through `Also applies:`, shows neither of their blocks. That was the seat's error. Keep all of session 1's work, make that one change, finish the remaining steps of build brief 1, and commit. Do not edit HANDOFF.md, `docs/sessions/`, `docs/known-bugs/`, nana-land.mjs or the review tools, `templates/`, `packages/nana-setup/`, any checker other than session 1's `readerKind` change in `scripts/deliverables.mjs`, or any review-folder file except `docs/reviews/page-detail-2026-10-25/build-1-checks.md`.

Precedent:
- packages/nana-pack/tests/product-report.test.mjs:1155-1191 — R-2542's case; the `#FEAT-052` clause at `:1191` is the one this session changes.
- docs/reviews/page-detail-2026-10-25/build-brief-1.md — the steps, red cases, checks, Done and Report this session completes.

No private helper moves to a shared module beyond the eight session 1 reported (feature, stage, code, manual, park, page, commitCode, artifactFlowLedger into `report-fixtures.mjs`); report any other.

The task:
1. In R-2542's case, replace the clause `!renderHtmlAt(fs.readFileSync(out, "utf8"), "#FEAT-052").nodes.some((node) => node.attrs?.class === "deliverable-block")` with one that asserts `#FEAT-052` shows no `deliverable-block` whose `h3` text starts with `R-5000 ` or `R-5001 `. Do not assert anything about R-5100's block in this case; R-2932's check owns homed blocks. Its title and every other clause stay. R-2542's row text and evidence stay as session 1 left them (the must-meet's text).
2. Finish build brief 1's remaining steps: 10 (SKILL.md), 11 (the pack README), 12 (`npm run map` and `npm run req:tree`, headers current), 13 (the evidence file), every hand red case not yet run (tried, seen red and restored; do not commit them), and the real-page render with its counts and sizes.
3. If another existing assertion outside build brief 1's steps 8 and 9 breaks, stop and report it again, with the check's title and its failure output.

Checks before your one commit: build brief 1's focused `npm test --` list; then `npm run test:locked` whole, with its output kept out of the worktree; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`, and `node scripts/requirements-tree.mjs --root .` must still print `deliverables: 21 of 21 made and read by code, 21 more parked`; `node scripts/known-bugs.mjs --root .`; then `git status --short` must print nothing after the commit. Keep every escape sequence in test literals intact. Do not run the install check. Do not push.

Seat check: `node docs/reviews/page-detail-2026-10-25/seat-titles.mjs all` must print `0 missing`.

Commit once, with explicit paths, covering session 1's files and this session's changes: every file `git status --short` lists.

Done: R-2542's check asserts only that the shared rows' blocks stay off FEAT-052; build brief 1's Done holds in full.

Report (at most 20 lines after the VERDICT line): build brief 1's Report items, plus this session's step 1 change.
