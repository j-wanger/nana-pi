# Review — review-ledger-run-reviewer (review-ledger run starts its review command as a reviewer, and starts pi on Windows), 2026-10-19 (Opus, the final reviewer)

Feature: FEAT-007 · Review a specific revision independently

Review `git diff 22ccd849..HEAD` on `feat/review-ledger-run-reviewer` (main was `22ccd849` when this brief was written;
`git merge-base HEAD main` is `22ccd849`). The plan of record is
`docs/reviews/review-ledger-run-reviewer-2026-10-19/must-meet.md`: four must-meet checks, rows R-1720 to R-1723.
`plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is the build. The seat's record is
`seat-verify-ac1fbda.md`: CI run 39319256526 on all three legs (the Windows log `ci-windows-run-1.log` beside it), the
macOS wrong-code pairs (`seat-mutate.mjs`, `seat-mutate-output-ac1fbdac.txt`: 7 of 7 red, 0 survived, three declared
items), the Windows-only pairs run in place on CI's Windows leg (`seat-mutate-win.mjs`, `win-pairs.mjs`,
`seat-mutate-win-output-ac1fbdac.txt`: 3 of 3 red) and the independent check (`independent-check-ac1fbda.md`: HOLDS,
no MUST, three findings, each settled as the record says). After CI the seat merged main 22ccd849 (b43745f3); only the
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

R-1125's evidence cell also changed (it now names `review-ledger run -- pi`); its requirement text did not.

The code under review: `packages/nana-pack/bin/review-ledger.mjs` (a first word of exactly `pi` resolves through
pi-watchdog's `piLaunch` before admission, and a refusal exits 1 with nothing reserved; every command now starts with
`{ ...process.env, ...REVIEWER_CHILD_ENV }`), `bin/worker-config.mjs` (the sealed `REVIEWER_CHILD_ENV`),
`bin/pi-review.mjs` (its child env spreads the same value; effective env unchanged), the pack README's launcher, Windows
and non-writer-role lines, the knowledge README's launcher-roles line, and the four new checks in
`tests/review-ledger.test.mjs` and `tests/win32-launch.test.mjs`. No existing check changed.

Judge whether review-ledger run now gives its review command `NANA_ROLE=reviewer` and `NANA_HANDOFF=off` over any value
the caller set, and passes every other variable through (R-1720); whether `review-ledger run -- pi` starts the pi PATH
resolves and records its round (R-1721); whether on Windows it starts the npm package's `pi` entry with the running Node
and the arguments unchanged (R-1722), and a refused launch starts nothing and leaves no round or reservation (R-1723).
Judge too whether each check would fail with that behaviour removed: the builder's four tries and the seat's seven
pairs cover macOS; on Windows, CI shows all four checks pass, and the seat's three Windows pairs show the red half.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux and Windows; pi's install
layout: an npm global shim, a `.exe`, and refused layouts such as Volta; the caller's environment: a builder's
`NANA_ROLE=worker`, a stray `NANA_HANDOFF`); deliberate forgery is out. `NANA_ROLE=reviewer` stays a context-isolation
convenience, not a boundary. Lane class: install, hook or gate — the land and review tools (review-ledger run, plus a
one-line pi-review change).

Check: (1) the four must-meet checks are not vacuous: R-1720 fails when the caller's environment wins or only one
variable is set, R-1721 fails without `process.env` or with the win32 launch on every platform, and R-1722 and R-1723
fail on Windows against the old by-name launch; (2) the reviewer env replaces only the two variables, and PATH and every
other variable still reach the command; (3) a refused pi launch exits before admission, leaving no reservation, round or
`--out`; (4) on macOS and Linux a first-word `pi` still starts pi by name with its arguments unchanged, and every other
command starts as on main; (5) pi-review's effective child env and arguments are unchanged; (6) the README sentences
match the code and the plan's known limits; (7) the new checks write only inside their temp folders and temp homes;
(8) HANDOFF and the session entry are true; (9) any MUST.
