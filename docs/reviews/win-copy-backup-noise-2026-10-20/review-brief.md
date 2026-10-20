# Review — win-copy-backup-noise (on Windows, install refreshes nana's unedited rule, skill and pi rulings copies with no dated backup, through a temporary file and a rename), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-018 · Update or remove managed components safely

Review `git diff 5ef07f7f..HEAD` on `feat/win-copy-backup-noise` (main was `5ef07f7f` when this brief was written; `git
merge-base HEAD main` is `5ef07f7f`). Main was `72abe19a` when the lane branched; the seat merged `5ef07f7f`, the
objective-path-shapes land tip, at `3889e33f`. The plan of record is
`docs/reviews/win-copy-backup-noise-2026-10-20/must-meet.md`: six must-meet checks, rows R-2310 to R-2313, R-2315 and
R-2316, plus R-954's extended install-coverage check; R-2314 is unused. `plan-attack.md` holds the adversary's AMEND.
`build-brief-1.md` is build 1 (dfe54123). `build-brief-2.md` is build 2 (04f09334), written after the independent
check; it adds R-2317 and R-2318. The seat's record is `seat-verify-04f09334.md`: CI, the wrong-code pairs
(`seat-mutate.mjs`; 19 of 19 red on dfe54123 and 21 of 21 red on 04f09334, 0 survived, records
`seat-mutate-output-*.txt`) and the independent check (`independent-check-04f09334.md`, run on dfe54123).

CI is not green. CI run 39443531519 on draft pull request #135 at 04f09334 (`ci-windows-04f09334.log` beside the
record) fails one file on macOS, Ubuntu and Windows: `packages/nana-pack/tests/requirements-tree.test.mjs`, the same
five R-291 checks on each leg (macOS 188 PASS, 1 FAIL, 2 SKIP of 191 files; Ubuntu 187 PASS, 1 FAIL, 3 SKIP; Windows
172 PASS, 1 FAIL, 18 SKIP). Build 2 added R-2317 and R-2318 without regenerating the requirements tree. The seat's
merge 3889e33f ran the merge helper, which regenerated it, and that test file then passes 93 of 93 locally. Every
other file passes on all three legs; on native Windows copy-record passes 8 of 8. install-check passes on macOS and
Windows. CI has not run on 3889e33f; the land runs the locked suite on the reviewed tip, and the local macOS install
check runs before the land.

The independent check ran on build 1 only. Its verdict was FINDINGS: one MUST (a read-only unedited managed copy
crashed install, where main backs it up and finishes) and two known bugs (the in-place refresh wrote through a hard
link and was not atomic). Build 2 answers all three; R-2317 and R-2318 pin the first two, and the pairs M20 and M21
turn them red. No independent check ran on build 2, so judge its replace-and-fallback path directly.

Tree movement (`node scripts/requirements-moved.mjs --root . --base 5ef07f7f`, run at 3889e33f):

```
tree movement 5ef07f7..3889e33: 8 rows in 1 features
FEAT-018 · Update or remove managed components safely
  R-2310 new (implemented)
  R-2311 new (implemented)
  R-2312 new (implemented)
  R-2313 new (implemented)
  R-2315 new (implemented)
  R-2316 new (implemented)
  R-2317 new (implemented)
  R-2318 new (implemented)
```

CAP-04 moves from 500 to 508 rows and FEAT-018 from 25 to 33. No existing row's text changed; R-954's evidence
(FEAT-017) gains the install-coverage check. The merge commit 3889e33f also carries the regenerated requirements tree
that build 2 left stale.

The code under review: the new `packages/nana-setup/lib/copy-record.mjs` (`openCopyRecord(file)`: the record at
`layout.copyRecord`, `<claude home>/nana-setup-copies.json`, maps each absolute target to the sha256 of the bytes
install wrote there; it is read only as a regular file, any failure gives an empty record, and `save` never throws).
`packages/nana-setup/lib/fsops.mjs` `writeBytesWithBackup` gains an optional `unedited` predicate, passed through
`linkFile` on `copyInstead`. A regular file that passes is refreshed with no backup: build 2 writes a `wx` temporary
file `.<name>.nana-refresh-<pid>-<ms>` beside the copy and renames it over the copy; a failed rename removes the
temporary file and falls back to main's backup branch; a copy it cannot refresh is a PROBLEM row, and install goes on.
`packages/nana-setup/lib/steps.mjs`: the three win32 copy sites (`stepRules`, the `linkSkill` file loop,
`stepPiConfig`'s rulings copy) pass the predicate and remember what they wrote; `install()` opens the record at the
start of `fileSteps` on win32 and saves it at the end. `lib/paths.mjs` adds the layout key and `lib/state-manifest.mjs`
the inventory row (kind "file"). Tests: the new `packages/nana-setup/tests/copy-record.test.mjs` (R-2310 to R-2313,
R-2315 to R-2318, every case with the platform forced to win32 off Windows), the R-954 change in
`state-manifest.test.mjs`, and `doctor-fix-line.test.mjs`, whose injected read failure moves from the copy's second
read to its third. The setup README's install table, its "Never destroys a file it replaces" bullet, its skill-mirror
sentence and its test table change with it. The rest of the diff is the plan, the seat's records, the generated code
map and tree, HANDOFF and the session entry.

Judge whether, on Windows, install refreshes a rule copy, a skill mirror file and the pi rulings copy with no backup
only when the copy's bytes equal what install last wrote there; whether an owner-edited, unrecorded or unreadable copy
still gets exactly one dated backup first; whether an absent, broken or wrong-shaped record fails safe to backups;
whether a record that cannot be saved leaves one skipped row and install finishing; and whether macOS and Linux open,
read and write no record. Judge build 2's path directly: the temporary file beside the copy, its name (could it
collide, be loaded as a rule or a skill file, or be left behind), its cleanup when the rename fails, the rename over a
read-only or hard-linked copy on Windows and on POSIX, and the fallback's backup and its PROBLEM row. R-2317 simulates
the Windows rename refusal with an `--import` shim on every platform, the Windows leg included, so no run proves the
real Windows refusal or the real fallback there. Judge whether the `doctor-fix-line` count change keeps its check
honest, and whether the tests' child processes stay inside the temp homes and the copied checkout they own.

Threat model: honest variation in our tools' output and the OS is in scope (the platform forced to win32 on macOS and
Linux, native Windows CI, CRLF checkouts, a record that is absent, unparseable, not an object, a directory or
read-only, homes installed before the record existed, owner edits, read-only or hard-linked copies, two checkouts
installing into one home); deliberate forgery is out, such as a forged record entry or a sha256 collision.
Lane class: install, hook or gate — the fsops backup primitive, install's win32 copy steps, the copy record and the
state inventory.

Check: (1) the must-meet checks are not vacuous: each pair named in the seat's record turns its check red, M20 and
M21 included, and R-2317's shim does not hide a case the real Windows rename would fail; (2) no fail-open: no copy the
owner edited loses its bytes without a backup, under any record state; (3) build 2's temporary file, rename and
fallback are sound on Windows and POSIX, and nothing they leave behind is loaded as a rule or a skill; (4) the one CI
failure is only the stale generated tree, and the merge's regeneration fixes it; (5) nothing main does today stopped
working, on any of the three CI legs, including the POSIX symlink path, the PATH launchers and the merge of main
5ef07f7f, which also changed `steps.mjs` and `paths.mjs`; (6) the tests write only inside the temp homes and the
copied checkout they own; (7) HANDOFF and the session entry are true, including the reworded rulings-file and
win-path-commands lines, the removed win-claude-skills backups line and the eight new residuals; (8) any MUST.

## Chain note (the seat, after this brief was written)

Since `891df21e`, the seat merged main `2cc63e65`, which brought linked-claude-folder-remedy (landed at 2cc63e65). Lanes land by fast-forward, so all of it is main before this lane lands. Review this lane's own change as `git diff 2cc63e65...HEAD` (three dots: against the merge base) and the merge itself as `git show --remerge-diff c61b6641` (the merge commit) if your git supports it; the generated tree, code map and R-291 leaf total were regenerated by the seat's merge helper. Tree movement now (`node scripts/requirements-moved.mjs --root . --base 2cc63e65`):

```
tree movement 2cc63e6..c61b664: 8 rows in 1 features
FEAT-018 · Update or remove managed components safely
  R-2310 new (implemented)
  R-2311 new (implemented)
  R-2312 new (implemented)
  R-2313 new (implemented)
  R-2315 new (implemented)
  R-2316 new (implemented)
  R-2317 new (implemented)
  R-2318 new (implemented)
```
