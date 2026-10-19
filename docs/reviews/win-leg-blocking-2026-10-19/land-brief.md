# Review — win-leg-blocking (the Windows test run skips the desk and bench files it cannot pass, each with its reason), 2026-10-19 (Fable, the land reviewer)

Review `git diff b3f6ec2..HEAD` on `feat/win-leg-blocking` (main was `73f39d5` when this brief was written; `git
merge-base HEAD main` is `b3f6ec2`). The plan of record is `docs/reviews/win-leg-blocking-2026-10-19/must-meet.md`: four
checks, rows R-1380 to R-1383, plus the seat evidence it names. `plan-attack.md` holds the adversary's AMEND and its
probes; `build-brief-1.md` the one build. The seat's record is `seat-verify-d6b1bad.md`: CI per leg (the Windows log
beside it, `ci-windows-run-2.log`), the wrong-code pairs (`seat-mutate.mjs`, `seat-mutate-output-f74ab32.txt`, 6 of 6
red) and the independent check (`independent-check-d6b1bad.md`, run on f74ab32; its MUST F1 and its F2 fixed in 60f8362).

The code under review: `packages/nana-pack/lib/windows-skips-config.mjs` (new) and the one-line `skipReason` change in
`scripts/test.mjs`, the runner every land rests on. Judge whether the lane fails open (a file outside desk and bench
skipped on any platform, a failing file reported as anything but FAIL, a listed file started on win32, a skip off
win32), whether it leaves a harm the review standard lists, and whether anything main does today stopped working on
macOS or Linux.

Threat model: honest variation in our tools' output and the OS (platforms, temp-path spellings, npm layouts) is in scope;
deliberate forgery is out. Lane class: gate (the repo test runner).

Check: (1) each must-meet check fails on main's runner or on its named wrong form; (2) no fail-open; (3) no macOS or
Linux regression; (4) HANDOFF and the session entry are true; (5) any MUST.
