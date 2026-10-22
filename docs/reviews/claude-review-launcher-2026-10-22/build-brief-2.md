Feature: FEAT-007 · Review a specific revision independently. Lane claude-review-launcher, rows R-2561 and R-2564. Class: install, hook or gate (a review tool). Builder: pi-worker (larger lane). Build session 2: one Windows test fix the seat found in CI.

Work in the lane worktree on feat/claude-review-launcher. Build 1 is 158659d5; the lane has since merged main (76ef0f39) and gained the seat's notes (8bf85a08). Do not edit HANDOFF, the session archive or the known-bug files.

Precedent:
- packages/nana-pack/tests/claude-review.test.mjs — the R-2561 fixture (the brief path at about :132-139) and R-2564's Windows case (about :182-200).
- packages/nana-pack/tests/win32-launch.test.mjs — how an existing test keeps its Windows fixtures to names Windows accepts.

F1 (must fix). The CI Windows leg at 130fe3a3 (run 39805845207, `docs/reviews/claude-review-launcher-2026-10-22/ci-windows-130fe3a3.txt`) ends claude-review.test.mjs after its first check: writing R-2561's brief fixture `brief folder/review "quote" and apostrophe's.md` fails with ENOENT, because Windows refuses `"` in a file name. The file then exits 1, so R-2564, the Windows-only claude.cmd case, never ran there.

1. Keep R-2561's brief path holding a space and an apostrophe on every platform, and add the `"` to the file name only where the platform accepts it (not win32). The quoting characters in the brief's text stay on every platform; R-2564 already carries `"`, `%`, `!` and line breaks on standard input.
2. Change nothing else. Run `node packages/nana-pack/tests/claude-review.test.mjs` on this Mac, then `npm run test:locked` before your last commit. Try this wrong version, see it go red, then restore: R-2561's brief path without its space.

Seat check: `node docs/reviews/claude-review-launcher-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done:
- R-2561's fixture is a file name Windows accepts; on macOS the test file passes whole; the full suite is green; the work is committed. The seat pushes and reads the Windows leg.

Report (at most 8 lines after the VERDICT line): the commit sha; the fixture change; each departure from the Precedent files with its reason; the wrong version tried; the full suite's summary line; the seat-check status.
