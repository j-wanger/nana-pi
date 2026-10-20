# Review — lane-guard-temp-root (a temp folder setting that names a drive root, the home folder or a folder above home no longer opens that place to lane writes, and on Windows TMP counts under the same rule), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-006 · Launch builders with execution limits

Review `git diff 72abe19a..HEAD` on `feat/lane-guard-temp-root` (main was `72abe19a` when this brief was written; `git
merge-base HEAD main` is `72abe19a`). The plan of record is `docs/reviews/lane-guard-temp-root-2026-10-20/must-meet.md`:
four must-meet checks, rows R-2270 to R-2273, plus narrowed text for R-1430 and R-1431. `plan-attack.md` holds the
adversary's AMEND; `build-brief-1.md` is build 1 (350f9ce0), with the seat's amendment that puts the rule in one shared
module; build 2 (3cc260b8) only flips R-2273's marker to `req:` and its row to implemented. The seat's record is
`seat-verify-3cc260b8.md`: CI run 39439600129 on draft pull request #132 at 350f9ce0, 0 failing files on macOS, Ubuntu
and Windows (`ci-windows-350f9ce0.log` beside it; lane-write-guard passes 17 on Windows, R-2273 included), the macOS
wrong-code pairs (`seat-mutate.mjs`; 11 of 14 red on 350f9ce0, record `seat-mutate-output-350f9ce0.txt`; P2, P9 and P11
survive, declared), the Windows-only pairs on a scratch Windows CI job (`seat-mutate-win.mjs`, `win-pairs.mjs`; 4 of 4
red, record `seat-mutate-win-output-61684fb3.txt`; P2 and P9 red there), and the independent check
(`independent-check-3cc260b8.md`: HOLDS, no MUST, run on 350f9ce0). CI has not run on 3cc260b8; the land runs the
locked suite on the reviewed tip.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base; run at
3cc260b8, before the seat's notes commit):

```
tree movement 72abe19..3cc260b: 6 rows in 1 features
FEAT-006 · Launch builders with execution limits
  R-1430 text changed
  R-1431 text changed
  R-2270 new (implemented)
  R-2271 new (implemented)
  R-2272 new (implemented)
  R-2273 new (implemented)
```

CAP-02 moves from 190 to 194 rows and FEAT-006 from 41 to 45. R-1430's and R-1431's tests do not change.

The code under review: the new `packages/nana-pack/lib/gate-temp-roots.ts` (`acceptedTempRoots({ platform, env, home,
tmpdir })`: the OS temp folder, plus `TMP` on win32, each resolved through `lib/real-path`'s `realPath` with a
`path.resolve` fallback, minus a drive or filesystem root, the resolved home and a folder above it; `[]` on any internal
failure; also `isExcludedTempRoot` and `within(parent, child)` for the rm-outside-asks lane), and `laneWriteHit` in
`packages/nana-pack/extensions/nana-gate.ts`, which calls it and keeps `/tmp` as its own rule on macOS and Linux. Tests:
four checks in `packages/nana-pack/tests/lane-write-guard.test.mjs` (R-2273 runs only on Windows), and the file's
import-time HOME and USERPROFILE move from the worktree to its home fixture. The pack README's lane-launch paragraph
changes with it. The rest of the diff is the plan, the seat's records, the generated code map and tree, HANDOFF and the
session entry.

Judge whether, while NANA_WORKTREE_ROOT is set, a temp variable naming a drive root, the home folder or a folder above
home in any honest spelling (letter case, a link, a trailing slash, `..`, an 8.3 short name) now opens nothing outside
the lane; whether a temp folder inside home (the Windows default), `/tmp` on macOS and Linux, the ordinary temp layout
and every lane file stay writable; whether on Windows a differing TMP counts under the same rule as TEMP; whether
`acceptedTempRoots` never throws and needs no NANA_WORKTREE_ROOT; and whether the tests' writes stay inside the temp
folders and fixtures they own.

Threat model: honest variation in our tools' output and the OS is in scope (temp variables and their spellings, the
home location, TEMP and TMP on Windows, macOS, Linux and Windows layouts); deliberate forgery is out, such as a builder
that rewrites its own environment. The guard is advisory by load path.
Lane class: install, hook or gate — the pi extension nana-gate's lane write guard, plus the new shared
`lib/gate-temp-roots.ts`.

Check: (1) the must-meet checks are not vacuous: each macOS pair turns its named check red (P1, P3, P3b, P4, P5, P5b,
P8, P10, P12, P13, P14), the Windows pairs P2, P6, P7 and P9 turn theirs red on the Windows leg, and P11 differs only by
a wrong refusal — judge whether any must-meet check is still unproven; (2) no fail-open: no temp-variable value leaves a
root, home or a folder above home writable, and a failure inside the module or the gate refuses rather than allows;
(3) nothing main does today stopped working: the ordinary layout, `/tmp` on macOS and Linux, Windows' default TEMP inside
home, temp and lane spellings (R-1431, R-1432), R-1433's home, at-sign and file URL targets, and a session with no
NANA_WORKTREE_ROOT — and judge the independent check's finding 1 (a HOME inside the OS temp folder loses OS-temp output,
failing closed) as a known bug or a listed harm; (4) the tests write only inside the temp folders and fixtures they own,
and R-2270 creates nothing under the drive root; (5) every README sentence the lane changed is true; (6) HANDOFF and the
session entry are true, including the removed win-gate-tmp line, the seven new residuals, the owner's rulings line, the
three removed open asks to the owner and the seat items from other lanes; (7) any MUST.
