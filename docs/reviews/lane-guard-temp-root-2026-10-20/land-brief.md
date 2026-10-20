# Review — lane-guard-temp-root (a temp folder setting that names a drive root, the home folder or a folder above home no longer opens that place to lane writes, and on Windows TMP counts under the same rule), 2026-10-20 (pi gpt-6-astra, the land reviewer)

Feature: FEAT-006 · Launch builders with execution limits

Review `git diff 72abe19a..HEAD` on `feat/lane-guard-temp-root` (main was `72abe19a` when this brief was written; `git
merge-base HEAD main` is `72abe19a`). The plan of record is `docs/reviews/lane-guard-temp-root-2026-10-20/must-meet.md`:
four must-meet checks, rows R-2270 to R-2273, plus narrowed text for R-1430 and R-1431. `plan-attack.md` holds the
adversary's AMEND; `build-brief-1.md` is build 1 (350f9ce0); build 2 (3cc260b8) only flips R-2273's marker and row. The
seat's record is `seat-verify-3cc260b8.md`: CI run 39439600129 at 350f9ce0, 0 failing files on macOS, Ubuntu and
Windows (`ci-windows-350f9ce0.log` beside it; R-2273 passes on Windows), the macOS wrong-code pairs (`seat-mutate.mjs`;
11 of 14 red; P2, P9 and P11 survive, declared), the Windows-only pairs on a scratch Windows CI job (4 of 4 red,
`seat-mutate-win-output-61684fb3.txt`; P2 and P9 red there) and the independent check (`independent-check-3cc260b8.md`:
HOLDS, no MUST, run on 350f9ce0). The final reviewer's brief is `review-brief.md`. CI has not run on 3cc260b8; the land
runs the locked suite on the reviewed tip.

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

The code under review: `laneWriteHit` in `packages/nana-pack/extensions/nana-gate.ts`, which judges every edit and write
a lane builder makes, and the new `packages/nana-pack/lib/gate-temp-roots.ts` it now calls. While NANA_WORKTREE_ROOT is
set, the guard counts the OS temp folder, plus a differing TMP on Windows, as writable unless it resolves to a drive or
filesystem root, the home folder or a folder above home; `/tmp` stays writable on macOS and Linux, and the refusal reason
is unchanged. The module returns no temp roots on an internal failure, and the gate's own catch refuses. The test file's
import-time HOME moves to its home fixture.

Judge whether the lane fails open: a temp variable value, in any honest spelling, that still leaves a drive root, home or
a folder above home writable to a lane; a Windows TMP counted without the root and home exclusions; or a check that
passes with the change removed. Judge whether it leaves a harm the review standard lists, such as a lane builder's
ordinary temp output or lane files refused on any platform, or a test writing outside its temp folders and fixtures.
Judge whether anything main does today stopped working: the ordinary temp layout on macOS and Linux, Windows' default
TEMP inside home, `/tmp` on macOS and Linux, temp and lane folders typed in another spelling, home, at-sign and file URL
targets, a session with no NANA_WORKTREE_ROOT, and both CI install-check legs.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known limit: a HOME inside
the OS temp folder turns off OS-temp lane output on macOS and Windows, failing closed, and the test file run alone with
HOME under TMPDIR turns two older checks red (the independent check's finding 1); the module's `within(parent, child)`
takes its arguments in the opposite order to the gate's private `within(target, root)`, beside a duplicate resolve
helper (finding 2); a broad temp folder such as a mount point still counts; on macOS and Linux only the temp folder Node
picks counts; a temp variable typed through home's data-volume firmlink path is not read as home (inferred); the refusal
does not say a temp folder was set aside; no macOS or Linux check sets home through a link (P9), and no check sets a temp
path that is a text prefix of home without holding it (P11). The macOS pairs and the independent check ran on macOS;
CI and the scratch Windows pair job are the only Linux and native Windows runs.

Threat model: honest variation in our tools' output and the OS is in scope (temp variables and their spellings, the
home location, TEMP and TMP on Windows, macOS, Linux and Windows layouts); deliberate forgery is out, such as a builder
that rewrites its own environment. The guard is advisory by load path.
Lane class: install, hook or gate — the pi extension nana-gate's lane write guard, plus the new shared
`lib/gate-temp-roots.ts`.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.
