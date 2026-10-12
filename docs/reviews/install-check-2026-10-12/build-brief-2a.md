# Lane install-check — build brief 2a (2026-10-12 · feat/install-check · worktree ~/nana-pi-wt/install-check)

**Builder: pi gpt-6-luna.** Build 2 is split into fresh sessions of at most three items (seat rule,
2026-10-12). This session has TWO items. Finish both; nothing else. The contract is `CHANGE.md` here.

## Where build 1 left it (seat's read of `6253bed` and CI run 38282268513)
- Every FAIL line on the Windows run printed no reason (`FAIL pi session`, `FAIL hook knowledge pull`), and
  the retained home was on the runner, so nobody can triage from the log. That is the gap this session closes.
- Seat triage of `FAIL hook knowledge pull` on Windows, from the code: main installs that entry in shell form;
  the sealed win32 form is exec (cc R-1050), so `mapHookEntries` gives `wrong-form`. Expected until
  cc-hooks-windows lands. Do not add it to the known-red list — the seat seals that list at land.
- `FAIL pi session` on Windows has no known cause. The plan expected PASS (inferred).

## Item 1 — a reason on every FAIL and XFAIL line (R-1070, R-1080)
- Every FAIL and XFAIL line ends ` — <code>: <reason>`. `<code>` is the code `classifyResult` judged
  (`missing-entry`, `wrong-form`, `no-output`, `note-row`, `bad-shape`, `extra-entry`, `unexpected-pass`,
  `timeout`, `exit`, …). `<reason>` is ONE line of at most 200 characters naming what was seen: the exit status
  or signal, `timed out after <n> ms` with the measured duration, the last non-empty stderr line, or the marker
  that was missing (for example `no [nana:objective] line`, `journal has no directory_unadopted for <project>`,
  `reload-runtime not in get_commands output`). Never a multi-line dump; collapse whitespace.
- An XFAIL line also names its entry's owner row and expiry: ` — missing-entry: … (known red, R-1057, until 2026-10-24)`.
- The doctor detail is the offending row's label with its padding collapsed, not the raw padded row.
- PASS lines are unchanged. The first lines (resolved paths) are unchanged. The acceptance script reads the
  line START only, so the suffix does not break it.
- Tests in `packages/nana-setup/tests/install-check.test.mjs`, each with `// req:` above it, wrong code first:
  a FAIL with a timeout shows the duration; a FAIL with a non-zero exit shows the status and the last stderr
  line; a multi-line stderr becomes one line ≤ 200 chars; an XFAIL shows code, owner and expiry; a PASS line
  carries no suffix. Put the formatting in a pure exported function in `lib/install-check.mjs` and test that.

## Item 2 — triage the Windows `pi session` FAIL (R-1079)
- Commit item 1, push (the draft PR #4 runs CI on push), wait for the `install-check (windows-latest)` job
  (poll no faster than every 60 s), and read the `pi session` reason.
- Find the root cause. Reproduce what you can on this Mac with `NANA_SETUP_PLATFORM` NOT set (the check
  ignores it) — reason from the code and the log for the Windows-only parts.
  - If the cause is in THIS lane's code (the check), fix the class, add a test that fails on the wrong code,
    push again and confirm the Windows line changes.
  - If the cause is in pi, nana-pack, nana-setup or the knowledge package (outside this lane), do NOT fix it.
    Stop and report the root cause with the evidence (the log line, the code line).
- Report every other FAIL line on that Windows run with its reason, verbatim.

## Rules (unchanged from brief 1, and these)
- Wrong code first; mutation pairs break code, never assertions. No suite test runs, imports or copies a
  seat script. Do not touch the cc-hooks-windows lane's files (`settings.mjs`, `steps.mjs`, `doctor.mjs`,
  the hook scripts, `pipe-guard.mjs`, R-1050–R-1069). New IDs only from R-1070–R-1089 (R-1085 onward if you
  must split). Commit with explicit paths; message file under `$TMPDIR`. Keep gate-trigger text out of
  command strings.
- **Do not report DONE until these all pass on your last commit:** `npm run req:tree`, `npm run map:check`,
  `npm run readme:check`, `npm run test:locked` (0 failed), and from the worktree root
  `node docs/reviews/install-check-2026-10-12/acceptance.mjs > docs/reviews/install-check-2026-10-12/acceptance-output.txt 2>&1`
  exiting 0. Commit the output file.

## Report
≤ 30 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; the `test:locked` summary line; the LAST
TWO LINES of `acceptance-output.txt` verbatim; the CI run ID and every Windows `install-check` item line
verbatim; the `pi session` root cause with its evidence, and whether you fixed it or it is outside the lane;
the one claim most likely wrong.
