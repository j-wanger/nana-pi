# Review — doctor-path-row-remedy (doctor gives the pi-review PATH row to install when the bin folder is already on PATH and only the launcher is missing), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-015 · Diagnose the active environment

Review `git diff 5ef07f7f..HEAD` on `feat/doctor-path-row-remedy` (main was `5ef07f7f` when this brief was written;
`git merge-base HEAD main` is `5ef07f7f`). Main was `72abe19a` when the lane branched; the seat merged `5ef07f7f`, the
objective-path-shapes land tip, at `333767cf`, and that lane has since landed by fast-forward. The plan of record is
`docs/reviews/doctor-path-row-remedy-2026-10-20/must-meet.md`: six must-meet checks, rows R-2320 to R-2325.
`plan-attack.md` holds the adversary's AMEND (six amendments); `build-brief-1.md` is build 1 (452cd604). Build 2
(a63d9ecf, no brief file) moved each new check's title onto its `check(` line after CI's first run failed the
requirements trace, and changed nothing else. The seat's record is `seat-verify-a63d9ecf.md`: CI run 39442784960 on
draft pull request #133 at a63d9ecf, 0 failing files on macOS, Ubuntu and Windows (`ci-windows-a63d9ecf.log` beside
it; doctor-fix-line passes 15 on native Windows, all six new checks among them), the macOS wrong-code pairs
(`seat-mutate.mjs`; 12 of 12 red on 452cd604, record `seat-mutate-output-452cd604.txt`), the Windows-only pairs on a
scratch Windows CI job (`seat-mutate-win.mjs`; 3 of 4 red, W2 a declared survivor, record
`seat-mutate-win-output-3005686b.txt`) and the independent check (`independent-check-a63d9ecf.md`: HOLDS, no MUST, ten
probes, run on 452cd604). CI has not run on 333767cf or the notes commit. The seat ran the must-meet file on 333767cf
(14 checks PASS); the land runs the locked suite on the reviewed tip, and the local macOS install check runs before the
land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base 5ef07f7f`; run at 333767cf, before the seat's notes
commit):

```
tree movement 5ef07f7..333767c: 6 rows in 1 features
FEAT-015 · Diagnose the active environment
  R-2320 new (implemented)
  R-2321 new (implemented)
  R-2322 new (implemented)
  R-2323 new (implemented)
  R-2324 new (implemented)
  R-2325 new (implemented)
```

CAP-04 moves from 500 to 506 rows and FEAT-015 from 138 to 144. No existing row's text changed; R-1993's check now reads
its by-hand list through the shared `byHand` helper, with the same meaning.

The code under review: `packages/nana-setup/lib/doctor.mjs` `diagnose`, the PATH section's win32 and POSIX branches.
Each finds `binAt`, the first PATH entry equal to the bin folder (win32: `;` split with findOnPath's trim and quote
strip, `path.win32.resolve` lowercased on both sides; POSIX: `path.delimiter` split, `path.resolve`). `installFixes`
holds when the row is wrong, `binAt >= 0` and no pi-review resolves from the entries before `binAt` (POSIX
`firstOnPath` over the slice; win32 `findOnPath` with an env of only PATH and PATHEXT). Then the detail says the bin
folder is on PATH and to run `nana-setup install`, and the row carries installLabel `PATH pi-review`, which install's
dry run maps as before. `nana-setup.mjs`, `steps.mjs` and `fsops.mjs` are unchanged. Tests: R-2320 to R-2325 and the
helpers `runOnPath`, `byHandOf`, `byHand`, `toInstall` and `pathRowDetail` in
`packages/nana-setup/tests/doctor-fix-line.test.mjs`. The setup README's dry-run paragraph changes with it. The rest of
the diff is the plan, the seat's records, the generated code map and tree, HANDOFF and the session entry.

Judge whether doctor gives the row to install exactly when the bin folder is a PATH entry (in any letter case on
Windows), no earlier entry holds a pi-review, and the launcher is wrong; whether every other case keeps main's detail
and by-hand listing; whether the new advice fixes the row (install recreates the launcher, and doctor then shows ✓);
whether install's dry run, not the label alone, still decides the last line; whether the healthy home and every exit
code stay as on main; and whether the tests' child processes stay inside the temp homes and folders they own, with
PATH restored after each run.

Threat model: honest variation in our tools' output and the OS is in scope (the bin folder on or off PATH, another
pi-review before or after it, a Windows Path entry in another letter case, padded or quoted; macOS, Linux and Windows);
deliberate forgery is out, such as a pi-review planted to fool the lookup.
Lane class: install, hook or gate — nana-setup doctor's `PATH resolves pi-review` row and its last line.

Check: (1) the must-meet checks are not vacuous: each macOS pair turns its named check red (M1 to M12), W1, W3 and W4
turn R-2324, R-2325 and R-2320 red on the Windows leg, and W2 is a declared survivor (CI spells the key PATH) — judge
whether any must-meet check is still unproven; (2) both branches match R-2320 to R-2325, including the letter-case
compare, the slice before `binAt` and the lookup env with no spread of `process.env`; (3) nothing main does today
stopped working: the healthy row, the off-PATH row and its by-hand listing (R-1993, R-2322), doctor's other last-line
forms (R-1990 to R-1997), exit codes, doctor-runtime and win-shims; (4) the tests write only inside the temp folders
and homes they own and restore PATH; (5) the README sentence is true as written; (6) HANDOFF and the session entry are
true, including the removed doctor-fix-line line and the eight new residuals; (7) any MUST.
