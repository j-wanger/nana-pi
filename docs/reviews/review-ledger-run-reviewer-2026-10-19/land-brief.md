# Review — review-ledger-run-reviewer (review-ledger run starts its review command as a reviewer, and starts pi on Windows), 2026-10-19 (Fable, the land reviewer)

Feature: FEAT-007 · Review a specific revision independently

Review `git diff 22ccd849..HEAD` on `feat/review-ledger-run-reviewer` (main was `22ccd849` when this brief was written;
`git merge-base HEAD main` is `22ccd849`). The plan of record is
`docs/reviews/review-ledger-run-reviewer-2026-10-19/must-meet.md`: four must-meet checks, rows R-1720 to R-1723.
`plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is the build. The seat's record is
`seat-verify-ac1fbda.md`: CI run 39319256526 on macOS, Ubuntu and Windows (`ci-windows-run-1.log` beside it), the macOS
wrong-code pairs (`seat-mutate.mjs`, `seat-mutate-output-ac1fbdac.txt`: 7 of 7 red, 0 survived, three declared items),
the Windows-only pairs run in place on CI's Windows leg (`seat-mutate-win.mjs`, `win-pairs.mjs`,
`seat-mutate-win-output-ac1fbdac.txt`: 3 of 3 red) and the independent check (`independent-check-ac1fbda.md`: HOLDS,
no MUST). The final reviewer's brief is `review-brief.md`. After CI the seat merged main 22ccd849 (b43745f3); only the
generated requirements tree conflicted, and the seat's merge helper regenerated it.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 22ccd84..b43745f: 4 rows in 1 features
FEAT-007 · Review a specific revision independently
  R-1720 new (implemented)
  R-1721 new (implemented)
  R-1722 new (implemented)
  R-1723 new (implemented)
```

The code under review: `packages/nana-pack/bin/review-ledger.mjs`, which every hand-run reviewer goes through. A first
word of exactly `pi` now resolves through pi-watchdog's `piLaunch` before admission; on Windows that starts npm's `pi`
entry with the running Node, and a refusal exits 1 with nothing reserved. Every command now starts with
`{ ...process.env, ...REVIEWER_CHILD_ENV }`, the sealed value in `bin/worker-config.mjs`. `bin/pi-review.mjs` spreads
the same value into its child env, which should leave its effective env unchanged. The pack and knowledge READMEs name
review-ledger run beside pi-review. The four new checks sit in `tests/review-ledger.test.mjs` and
`tests/win32-launch.test.mjs`; no existing check changed.

Judge whether the lane fails open: a round recorded for a command that never ran, a refused launch that still reserves
or consumes a round, a verdict recorded from output the reviewer did not write, or a review child that still gets the
knowledge pull or writes a handoff. Judge whether it leaves a harm the review standard lists: a broken review tool on
any platform, data lost or corrupted (the ledger's reservation, round, tally or audit files, or a tracked `--out`), or a
test writing outside its temp folders and temp homes. Judge whether anything main does today stopped working:
review-ledger run with a non-pi command (`claude -p`, `node`, an absolute path), its `check` and `report` subcommands,
a POSIX run with no pi on PATH, the unread-verdict notice and its exit codes, the round cap, and pi-review's child env
and arguments. The two variables now reach every descendant of the review command, as they already did under
pi-review. Judge whether that, and the plan's known limits that HANDOFF records (other Windows commands still start by
name; pi resolves against the launcher's folder, not `--tree`), are harms the standard lists or known limits.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux and Windows; pi's install
layout: an npm global shim, a `.exe`, and refused layouts such as Volta; the caller's environment: a builder's
`NANA_ROLE=worker`, a stray `NANA_HANDOFF`); deliberate forgery is out. `NANA_ROLE=reviewer` stays a context-isolation
convenience, not a boundary. Lane class: install, hook or gate — the land and review tools (review-ledger run, plus a
one-line pi-review change).

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.
