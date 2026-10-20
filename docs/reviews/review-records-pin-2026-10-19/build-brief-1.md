# Lane review-records-pin: build brief 1 (feat/review-records-pin, based on current main)

Feature: FEAT-007 · Review a specific revision independently. Class: ordinary (tests only). Read `must-meet.md` here first.

**Builder: a Claude Sonnet subagent in `~/nana-pi-wt/review-records-pin`. Follow `packages/nana-pack/prompts/builder-preamble.md`.**
- Run single test files only. Do not push or run the full suite.
- Do not edit `HANDOFF.md`, `docs/sessions/`, or anything under `packages/nana-pack/bin` or `packages/nana-pack/lib`.
- If a check fails because of ledger code, stop and report.

**Rows first (REQUIREMENTS.md, SUB-010).**
- Add R-1840 after R-723, and R-1841 and R-1842 after R-844, with status `planned` and the text from `must-meet.md`.
- Retire R-723: "superseded by R-1840, <date>: every ledger path included the reservation folder, a directory by design; R-1841 holds the symlink case and R-852 the lock folder".
- Retire R-844: "superseded by R-1841 and R-1842, <date>: restated with its subject, the lock path included, and the unwritable folder as its own row".
- Take no other ID. Run `npm run req:tree`. Add no leaf total.

**Tests (`packages/nana-pack/tests/review-ledger.test.mjs`).** Each `// req: R-…` sits directly above a `check("<title>", …` line, with titles exactly as in `must-meet.md`.
- Section 9:
  - Put marker R-843 on the corrupted-line check.
  - Write `ls[0]`, then the incomplete record. Capture the run as `inc` and keep R-853's check on it.
  - Add R-855's check: status 1, `/rounds\.jsonl:2: malformed record/`, noStack.
- Section 10: declare `const AT_ONCE_MS = 3000;` with a `chosen:` comment above it.
  - R-1841: loop over the four names, the lock added. A case fails unless it has status 1, `/symlink/`, the target still "", no "admitted", noStack and ms < AT_ONCE_MS. Make one check with the failures as detail, and remove the three per-name checks.
  - R-1840: loop over the tally, the audit and the previous audit, each made a folder. A case fails unless it has status 1, stderr including `<name> is not a regular file`, no "admitted" and noStack. Make one check.
  - R-1842: replace the read-only check and its win32 SKIP.
    - Apply chmod 0o555, or on win32 `spawnSync("icacls", [agent, "/deny", "*S-1-1-0:(WD)"])`.
    - A plain write into the folder must throw (`blocked`). Then time `reviewAt`.
    - Undo in `finally`: chmod 0o755, or `icacls agent /remove:d *S-1-1-0`.
    - Pass only with blocked, status 1, `/must be writable/`, no "admitted", noStack and ms < AT_ONCE_MS.
    - When not blocked, the detail starts "the folder stayed writable; ".
  - R-852: add the marker, retitle it to drop "(<3s)", add no-"admitted", and replace 3000 with AT_ONCE_MS.
- Section 20, R-725:
  - Before the untracked run, write `new-out.md` holding exactly "VERDICT: LAND\n", the text VERDICT_CMD prints.
  - Retitle the check. Assert status 0, the WARNING, one round, not unverified, and revision equal to `gitIn(O.d, "rev-parse", "HEAD")`.
  - Put marker R-845 on the ignored check and on the outside check.
- Header `@effects`: "process (spawns the review CLIs, the stub pi, git, and icacls on Windows)". Then run `npm run map`.
- Flip the eight rows to `implemented`, with evidence `packages/nana-pack/tests/review-ledger.test.mjs::<title>`. R-845 cites both checks. Report R-1842's win32 arm and R-1841's lock case as unverified until Windows CI.

**Wrong code to try.** Edit a scratch copy of review-round.mjs or review-ledger.mjs, never the assertion. Restore after each and record the result.
- Try W1, W1b, W2, W3, W4, W5, W5a, W7, W8, W9, W9b and W10 to W12, as `must-meet.md` lists them.
- W3 takes about 45 s and W8 about 25 s.
- Each must red exactly its listed checks. W5a must stay green.

## Done
- `node packages/nana-pack/tests/review-ledger.test.mjs` gives 165 PASS, 0 FAIL, 0 SKIP on macOS.
- `node scripts/requirements-trace.mjs` exits 0 with `ears: 0`.
- `node packages/nana-pack/tests/requirements-tree.test.mjs` passes.
- `npm run map:check` and `npm run readme:check` are clean.
- The seat runs Windows CI. Expected: 162 PASS, 1 SKIP.
  - "The folder stayed writable" means the deny is the test's limit: restore a win32 SKIP naming the measured cause.
  - Blocked, but the ledger hangs or prints a stack: that is a ledger bug. Stop; the seat opens a review-tools lane.

## Report (at most 10 lines; first line `VERDICT: DONE | PARTIAL | BLOCKED`)
Give commit SHAs, the PASS/FAIL/SKIP counts, each W result, the rows flipped and retired, and anything not done.