# Seat checks — review-launch-win-paths build 1, tip 799872c1 (2026-10-20)

- Build, by a pi gpt-5.6-sol builder through pi-worker (one build): 6136c925 (`build-brief-1.md`), on the plan at
  4053e523 (`must-meet.md`; `plan-attack.md`, one adversary, AMEND). The lane branched from main 9552afb1, which is
  still main and the merge base. On win32, `reviewLaunch` now resolves a `.cmd` or `.bat` path, in any letter case,
  against the folder it is given; when no file is there it returns `no file at <resolved>`, and a present file still
  starts through `winCommand` with the word as written. `.exe`, `.com` and extensionless paths are unchanged.
  `review-ledger run` now calls the resolver after admission with the reviewed tree (`adm.res.cwd`), so a refusal
  goes through `cannotStart`. `lib/win-command.mjs` exports its existing `defaultExists`, the resolver's default
  probe. R-2252's fixture gains the `.bat` it launches; the pack README's Windows paragraph gains one sentence.
  799872c1 adds the seat's pairs. Per the builder's report, it ran single-file checks only, as its brief asked.
- CI on draft pull request #145 runs at 6136c925 (799872c1 adds only the seat's pairs). CI run 39496386067 at 6136c925 reads 0 failing on all three legs: macOS 192 PASS, 0 FAIL, 2 SKIP of 194 files (8,002 checks pass, 36 skip); Ubuntu 191 PASS, 0 FAIL, 3 SKIP of 194 files (7,941 checks pass, 56 skip); Windows 176 PASS, 0 FAIL, 18 SKIP of 194 files (6,931 checks pass, 114 skip). The install check passes on macOS and Windows. The Windows leg's log is ci-windows-6136c925.log in this folder. The seat fills each
  leg's figures before the final review. Main's known failures do not count against the lane: Ubuntu path spelling
  GP1 and GP2 before main ca27d86, and a pull request run's R-291 leaf-total merge artifact; Windows main reads 0 FAIL
  since 4be0b79, with the desk files as declared skips.
- R-2432 runs only on Windows. It stays `untested` behind its `req-candidate` marker and waits on the Windows leg: the
  seat flips it only after reading its PASS line there.
- The seat's wrong-code pairs (`seat-mutate.mjs`, the shared mutation runner, macOS, Node 22.22.2, one shard, merge
  base 9552afb1) on 6136c925 (`seat-mutate-output-6136c925.txt`, commit 799872c1): 8 of 8 red, each exactly on its
  named titles, 0 survived; baseline review-launch 7 PASS, 0 FAIL. M1 to M8 run against the test's injected win32 file
  map:
  - M1 (main's form: no existence check), M5 (extension compared without folding case) and M6 (the refusal leaves
    out the resolved path) turn R-2430 red.
  - M2 (the path read unresolved) and M8 (a present .cmd launched as resolved, not as written) turn R-2431 red.
  - M3 (resolved against the process's own folder) turns R-2430 and R-2431 red.
  - M4 (every .cmd or .bat path refused) turns R-2252 and R-2431 red.
  - M7 (a missing .exe or extensionless path refused too) turns R-2252 red.
  - Declared before the run: (a) W1 (main's form: the resolver before admission with the launcher's folder, plan
    wrong code 7) and W2 (the resolver's probe with no default) reach only R-2432, so the table adds them only on
    win32; neither has run, and no record of them is in this folder. (b) No pair for the `defaultExists` export, the
    two header lines, the README sentence or R-2252's fixture `.bat`. (c) M8 edits the launch line the lane left
    unchanged, because launching the resolved path is the new check's obvious wrong form.
- Independent check (`independent-check-799872c1.md`, filed under this tip's name): it ran on 6136c925 in a private
  clone with a temp HOME for every probe. FINDINGS, no MUST: the code works and causes no harm.
  - On macOS: review-launch R-2250 to R-2253, R-2430, R-2431 and R-2255 PASS, R-2432 and R-2254 SKIP; review-ledger
    165 pass; win-command 47 pass, 1 skip; win32-launch 5 pass, 8 skip; code map 0 problems.
  - Seven probes hold. The real CLI on macOS starts a relative path and refuses a missing .cmd exactly as main does.
    With the CLI forced to win32, a relative .cmd present only in the launcher's folder is refused `no file at
    <tree>\other dir\review.cmd`, exit 1, the line in --out, no reservation or round. A bare name not on PATH reads as
    on main. The forced-win32 resolver keeps the word as written, refuses a mixed-case missing path and a missing UNC
    path, starts a present path with a space, resolves `..` against the given folder, and leaves `.exe` and
    extensionless paths unchecked. `defaultExists` returns false for a folder named `dir.cmd`, a missing file and a
    name holding NUL, with no throw, so no reservation can be stranded. It infers that R-2432 passes on Windows.
  - Its findings and how each was settled:
    1. Known bug: HANDOFF's carried line for review-ledger-run-win-launch's final review was untrue on the tip; it
       said a mistyped .cmd or .bat path ends as no verdict and a fix was in planning. Settled in this notes commit:
       the line now says such a path ends with a refusal naming the path looked for. The landed line and the
       residuals it asked for are added: a .cmd removed between the check and the start, relative PATH entries
       read from the reviewed tree (the review-ledger-run-reviewer launcher's-folder line, rewritten), and R-2432
       waiting on the Windows leg.
    2. Known bug, low: review-ledger-run-win-launch's Windows mutation runner (`seat-mutate-win.mjs`) anchors on
       `const launch = reviewLaunch(child);`, which no longer exists, so re-running it would fail to apply. CI does
       not run it. Recorded as a HANDOFF residual.
  - Not exercised: real cmd.exe on Windows (R-2432), and a drive-relative `C:review.cmd` with the tree on another
    drive, outside the threat model.
- HANDOFF: one Landed line. Two carried lines change: review-ledger-run-win-launch's final-review line (finding 1)
  and review-ledger-run-reviewer's launcher's-folder line, which now says the lookup reads from the reviewed tree.
  Three new residuals name this lane: a .cmd removed between the check and the start, R-2432 and W1 and W2 waiting
  on the Windows leg, and the earlier lane's stale Windows mutation runner.
- Land reviewer: pi gpt-6-astra reviews the land through pi-review, so the seat writes no `seat-land.md`.
- Rows: R-2430 and R-2431 read `implemented`; R-2432 reads `untested`, evidence `written; Windows-leg-only`. At
  799872c1 (no code or row changed by the notes): `node scripts/requirements-trace.mjs` reads `requirements: 1670
  total (1432 implemented · 1 planned · 37 retired · 194 untested · 6 violated); 1432 traced by tests` and `ears: 0
  rows off form (allowance 0)`; `npm run map:check` reads 364 modules, 0 problems; `npm run readme:check` reads 727
  claims, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge base 9552afb1, run at 799872c1):
  ```
  tree movement 9552afb..799872c: 3 rows in 1 features
  FEAT-007 · Review a specific revision independently
    R-2430 new (implemented)
    R-2431 new (implemented)
    R-2432 new (untested)
  ```
  CAP-02 moves from 194 to 197 rows, FEAT-007 from 131 to 134 and SUB-008 from 44 to 47. No existing row's text
  changed.
- Not in this record: the Windows pairs W1 and W2, and a seat-run locked full suite, which the land runs on the
  reviewed tip. No install check: the lane changes no nana-setup code and no hook.

## Seat, after CI (2026-10-20)

The Windows leg of run 39496386067 at 6136c925 printed `PASS Windows: review-ledger run resolves a relative .cmd reviewer path against --tree, …` (log line 4417) (review-launch.test.mjs 8 pass, 1 skip; log `ci-windows-6136c925.log`). The seat flipped R-2432's marker from `req-candidate` to `req:` and its row from untested to implemented; its evidence cell now cites that check; the earlier sentences saying it waits on the Windows leg are superseded. The two Windows-only pairs W1 and W2 still have not run (a carried line).
