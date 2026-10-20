# Review — win-copy-backup-noise (on Windows, install refreshes nana's unedited rule, skill and pi rulings copies with no dated backup, through a temporary file and a rename), 2026-10-20 (pi gpt-6-astra, the land reviewer)

Feature: FEAT-018 · Update or remove managed components safely

Review `git diff 5ef07f7f..HEAD` on `feat/win-copy-backup-noise` (main was `5ef07f7f` when this brief was written; `git
merge-base HEAD main` is `5ef07f7f`). Main was `72abe19a` when the lane branched; the seat merged `5ef07f7f`, the
objective-path-shapes land tip, at `3889e33f`. The plan of record is
`docs/reviews/win-copy-backup-noise-2026-10-20/must-meet.md`: six must-meet checks, rows R-2310 to R-2313, R-2315 and
R-2316, plus R-954's extended install-coverage check. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md`
and `build-brief-2.md` are the two builds (dfe54123; 04f09334, which adds R-2317 and R-2318). The seat's record is
`seat-verify-04f09334.md`: CI run 39443531519 at 04f09334 (`ci-windows-04f09334.log` beside it), the wrong-code pairs
(`seat-mutate.mjs`; 19 of 19 red on dfe54123, 21 of 21 red on 04f09334, 0 survived, macOS with the platform forced to
win32) and the independent check (`independent-check-04f09334.md`, run on dfe54123). The final reviewer's brief is
`review-brief.md`.

CI is not green. It fails one file on macOS, Ubuntu and Windows: `requirements-tree.test.mjs`, the same five R-291
checks, because build 2 added R-2317 and R-2318 without regenerating the requirements tree. The seat's merge 3889e33f
ran the merge helper, which regenerated it, and that file then passes 93 of 93 locally. Every other file passes on all
three legs; on native Windows copy-record passes 8 of 8, and install-check passes on macOS and Windows. CI has not run
on 3889e33f; the land runs the locked suite on the reviewed tip, and the local macOS install check runs before the
land.

The independent check ran on build 1 only: FINDINGS, one MUST (a read-only unedited copy crashed install, where main
backs it up and finishes) and two known bugs (the in-place refresh wrote through a hard link and was not atomic).
Build 2 answers all three, and the pairs M20 and M21 pin it. No independent check ran on build 2, so judge its
replace-and-fallback path directly.

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

The merge commit 3889e33f also carries the regenerated requirements tree that build 2 left stale.

The code under review: on Windows only, install now keeps a record (`<claude home>/nana-setup-copies.json`, new
`packages/nana-setup/lib/copy-record.mjs`) of the sha256 of the bytes it last wrote to each rule copy, skill mirror
file and the pi rulings copy. `packages/nana-setup/lib/fsops.mjs` `writeBytesWithBackup` refreshes a regular copy that
still matches its record with no backup: build 2 writes a temporary file beside it and renames it over the copy; a
failed rename removes the temporary file and falls back to main's backup branch; a copy it cannot refresh is a PROBLEM
row, and install goes on. Every other copy still gets main's dated backup first. `lib/steps.mjs` wires the three win32
copy sites and opens and saves the record in `install()`; `lib/state-manifest.mjs` inventories it. macOS and Linux
open, read and write no record.

Judge whether the lane fails open: an owner-edited copy replaced without a backup under any record state (absent,
unparseable, wrong shape, a directory, read-only, a symlink); a record save or a refresh that throws past install's
remaining steps; a temporary file left where Claude Code or pi would load it as a rule or a skill; or a check that
passes with the change removed (R-2317 simulates the Windows rename refusal with a shim on every platform, the Windows
leg included, so the real Windows refusal and fallback are not run). Judge whether it leaves a harm the review
standard lists, such as an owner's bytes lost, a broken install on any platform, or a test writing outside its temp
homes and copied checkout. Judge whether anything main does today stopped working: the POSIX symlink path, the PATH
launchers' backups, install's dry run, the state inventory and uninstall, the nana-setup tests on all three CI legs,
and both CI install-check legs.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known bug: backups
already on disk stay, and a home already stale at land time gets one last round of backups; a home reached through
another spelling of its path backs up once; the win32 skill row still prints "N files copied" and names no backup; no
test pins that the save happens inside the lock; Windows has no uninstall, so the record stays, and uninstall on POSIX
leaves a planted one; that Claude Code ignores a JSON file at the Claude folder root is inferred; no run proves the
real Windows rename refusal or fallback; a crash between the temporary write and the rename leaves a hidden temporary
file that nothing removes. The pairs and the independent check ran on macOS only, so CI is the only Linux and native
Windows run.

Threat model: honest variation in our tools' output and the OS is in scope (the platform forced to win32 on macOS and
Linux, native Windows CI, CRLF checkouts, every record state above, homes installed before the record existed, owner
edits, read-only or hard-linked copies, two checkouts installing into one home); deliberate forgery is out, such as a
forged record entry or a sha256 collision.
Lane class: install, hook or gate — the fsops backup primitive, install's win32 copy steps, the copy record and the
state inventory.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.
