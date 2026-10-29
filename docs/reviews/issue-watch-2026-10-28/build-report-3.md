VERDICT: DONE

## Commit and scope

One fix commit on `feat/issue-watch`, following the green locked full suite below.
The checkout began at `f0e32c24`, the review-record commit after the brief's `9c9980f4`.
The three production files matched build 2 (`3ebcf093`) before the tests ran.
No new requirement IDs or sealed tunables. R-2990–R-2999 and R-682 remain implemented.
No HANDOFF, known-bug file, session archive, issue or desk file changed.

## Fixes and tests

All three new cases live in `packages/nana-pack/tests/issue-watch.test.mjs`.
Each case uses the existing awaited harness and eight-second per-case limit.

1. **Cursor floor — R-2990, R-2992.**
   File: `packages/nana-pack/lib/issue-watch.mjs`.
   Clamp each successful cursor to the starting floor and previous cursor as well as GitHub's overlapping watermark.
   Test: `R-2992: three bounded runs keep old edited comments behind the starting floor`.
   It simulates GitHub's updated_at filter across three complete bounded runs.
   The owner edits day-old C five minutes into run one; hour-old Y belongs to issue eight.
   No run prints either comment; all poll cursors remain monotonic and every restart carries the final cursor.
   Wrong/right pair: unchanged build 2 prints Y during the third run (exit 1); fixed code passes (exit 0).
   Evidence: `build-3-wrong-cursor.txt` and `build-3-targeted.txt` beside this report.

2. **pi delivery — R-2997.**
   Files: `packages/nana-pack/lib/issue-watch.mjs`, `packages/nana-pack/extensions/nana-frontier-summary.ts`.
   Mark an owner id delivered only after the receiver returns successfully.
   The extension catches a thrown send, shows one warning until a send succeeds, and rethrows to preserve retry state.
   Notification failures cannot escape; the next poll retries the comment.
   Test: `R-2997: pi retries thrown owner deliveries and shows one notice until success`.
   Two failed sends produce two attempts, no delivered message and exactly one warning.
   The next successful send delivers once; a later poll does not resend it.
   Wrong/right pair: unchanged build 2 records only one attempt and no notice (exit 1); fixed code passes (exit 0).
   Evidence: `build-3-wrong-delivery.txt` and `build-3-targeted.txt`.
   Verified locally against pi 1.0.2: ExtensionAPI.sendMessage and ui.notify return void.

3. **Over-cap notice — R-2995.**
   File: `packages/nana-pack/lib/frontier-summary.mjs`.
   Restore the existing omission notice, followed by the watch command, rather than returning the command alone.
   Test: `R-2995: over-cap block keeps the omission notice before the watch line`.
   It asserts both lines exactly, including their order, for LF and CRLF pointers with trailing space/tab and no final newline.
   Wrong/right pair: unchanged build 2 returns only the watch line (exit 1); fixed code passes (exit 0).
   Evidence: `build-3-wrong-cap.txt` and `build-3-targeted.txt`.

The three wrong-code runs preceded all production edits; assertions were never inverted.
No seat script was run, imported or copied by the new tests. Fixtures remain in OS temporary directories.

## Existing tests changed

Only three existing cases changed, all in `packages/nana-pack/tests/issue-watch.test.mjs`:

- `R-2992: GitHub cursor survives a 3 second fast clock and an 800 ms late comment`: two cursor expectations now stay at the explicit starting floor.
- `R-2990: pinned polls dedupe new comments ignore edits clean excerpts and warn at a full page`: the request now uses the starting floor.
- `R-2995: session block prioritizes the runnable monitor command on success failure and cap pressure`: the tiny-budget expectation now includes the omission notice.

I deleted or renamed no existing case. I added exactly three tests.

## Contract, precedent and known bugs

`REQUIREMENTS.md` records the floor, retry/notice and omission contracts before the tests and code.
`packages/nana-pack/README.md` declares the same behavior for consumers.
`docs/code-map.md` reflects the extension's warning output header.
All four named precedent files were read before design; the existing helpers remain imports, not copies.

Departures from build 2's precedent are only the requested corrections:

- Cursor calculation now clamps to the run floor and prior cursor; GitHub time and overlap remain unchanged.
- Owner dedupe registration moves after delivery; outsider and seat notices still dedupe as before.
- The extension adds a guarded ui.notify warning because its ignored emit callback previously hid delivery failure.
- The over-cap fallback restores the main-path notice and appends the command.
  Like the existing omission fallback, these required lines can exceed a very small requested remaining budget.
  The existing tiny-budget case pins that behavior; the new over-cap case also checks a budget that fits both lines.

I moved or copied no private helper. I fixed no unrelated known bug.
Only thrown owner deliveries change the pi visibility limitation: these now show a UI warning.
Other gh failure lines and outsider notices still do not reach pi's model.
Fetch-cap loss, early-kill restart behavior, shell quoting and the historical seat-pair coverage note remain unchanged.

## Commands and exit codes

All exit codes were read independently, without a pipeline before a commit.

- Three separate `NANA_TEST_CASE='<new title prefix>' node --experimental-strip-types packages/nana-pack/tests/issue-watch.test.mjs` runs on unchanged build 2: **1 each**.
- `npm test -- issue-watch frontier-summary frontier-golden handoff-issues frontier-hook hook-producers`: **0**.
  `6 files: 6 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 58 pass, 0 fail, 0 skip · 10.5s`.
- `npm run map:impact -- packages/nana-pack/lib/issue-watch.mjs packages/nana-pack/extensions/nana-frontier-summary.ts packages/nana-pack/lib/frontier-summary.mjs`: **0**, before production edits.
- `npm run map`: **0**, log `build-3-map.txt`.
- `env -u NANA_WORKTREE_ROOT -u NANA_ROLE -u NANA_HANDOFF node packages/nana-setup/bin/install-check.mjs`: **0** on macOS.
  Log: `build-3-install-check.txt`. The environment cleanup follows build 2's successful invocation.
- `npm run test:locked`: **0**, plain foreground command, output on screen, machine-wide lock held by the runner.
  `231 files: 229 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8638 pass, 0 fail, 44 skip · 592.5s`.
  Full-suite output was not redirected or backgrounded, as the brief requires.
- `npm run map:check`: **0**, 458 modules, 0 problems.
- `npm run readme:check`: **0**, 784 claims, 0 problems.
- `node --experimental-strip-types scripts/requirements-trace.mjs`: **0**, 2106 rows; 1864 implemented and traced; EARS 0 off form.
- `node scripts/requirements-tree.mjs --root .`: **0**, 0 problems; 39 features.
- `node scripts/known-bugs.mjs --root .`: **0**, names=0 sizes=0.
- `node scripts/identity-scan.mjs`: **0** before staging; **1** on first staged evidence scan (four logs contained absolute home paths).
  I replaced those home/worktree prefixes with placeholders, preserving assertion output and line numbers; the staged rescan passed with **0** findings.
- `git diff --check`: **0**.
- `node scripts/lane-class.mjs --root . --files <changed code and contract paths>`: **0**, `hook: packages/nana-pack/extensions/nana-frontier-summary.ts — pi extension`.
- `nana-writing --report <this report>`: **0**; the mandated verdict form and identifiers remain because builder reports are technical records, exempt from owner-prose rules.

The named seat checks are rerun on the final commit before delivery.
The commit includes long targeted, wrong-code and install output beside this report.

## Not done

No hosted Windows run, CI request, push, review launch or land; the brief requests local checks only.
No live GitHub reads or writes. No open question blocks the three fixes.
