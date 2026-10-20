# Review — post-edit-timeout-name (a post-edit check with no time limit of its own gets the pack's named default, read by name), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-030 · Get trustworthy feedback after edits

Review `git diff 15703d8d..HEAD` on `feat/post-edit-timeout-name` (`git merge-base HEAD main` is `15703d8d`; main is
`54433844` when this brief was written). The lane branched from main `1b54211c`, and its builder merged main
`15703d8d` (the pi-probe-timeout land tip) at `5db4d8e4`, as its brief asked; `1b54211c..15703d8d` is pi-probe-timeout,
already on main, and is not under review. The plan of record is
`docs/reviews/post-edit-timeout-name-2026-10-20/must-meet.md`: two must-meet checks, rows R-2150 to R-2151.
`plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is the one build (dbcd6db4). The seat's record is
`seat-verify-eba75dca.md`: CI run 39399379115 on draft pull request #118 at eba75dca, 0 failing files on all three
legs (the Windows suite log `ci-windows-eba75dca.log` beside it), the wrong-code pairs (`seat-mutate.mjs`;
`seat-mutate-output-eba75dca.txt`, 8 of 8 red, 0 survived) and the independent check (`independent-check-eba75dca.md`:
HOLDS, no MUST, 10 probes; its stale HANDOFF line is dropped, and its wrong null claim in the plan is recorded in the
seat's record). The local macOS install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base 15703d8d`, the merge base):

```
tree movement 15703d8..9284d1e: 2 rows in 1 features
FEAT-030 · Get trustworthy feedback after edits
  R-2150 new (implemented)
  R-2151 new (implemented)
```

CAP-07 moves from 307 to 309 rows and FEAT-030 from 54 to 56. No existing row changed.

The code under review: the new `packages/nana-pack/lib/post-edit-config.mjs` (six-tag header, one export
`POST_EDIT_DEFAULT_TIMEOUT_MS = 30_000`, its `chosen` provenance) and, in `packages/nana-pack/extensions/nana-post-edit.ts`,
one import of that name beside the other lib imports and `c.timeoutMs ?? POST_EDIT_DEFAULT_TIMEOUT_MS` in place of
`c.timeoutMs ?? 30_000`. Tests: the new `packages/nana-pack/tests/post-edit-default-timeout.test.mjs` (R-2150 copies the
extension and the whole lib folder into a temp folder, retunes the copy's export to 4321, imports the copy and records
every timer one passing check arms; R-2151 seals 30000).

Judge whether a post-edit command that sets no `timeoutMs` now gets its deadline from the named setting, whether
retuning that one name changes the deadline with no other code change, whether every `timeoutMs` a command can set
(absent, 0, a positive integer, a malformed value) behaves as on main, and whether pi's own loader resolves the new
import, run with `-e` and as an installed pack, on macOS, Linux and native Windows.

Threat model: honest variation in our tools' output and the OS is in scope (a command with no `timeoutMs`, with 0,
with a positive integer or with a malformed value; pi's jiti loader and Node's native import; a pack or temp folder
with spaces, non-ASCII letters or a Windows short name; macOS, Linux and native win32); deliberate forgery is out (a
hand-edited copy of the pack, a forged config module).
Lane class: install, hook or gate — a pi extension, `nana-post-edit.ts`.

Check: (1) the two must-meet checks are not vacuous: R-2150 fails on main's inline literal (W1), with no default (W2,
W3), in seconds (W6) and with a local copy of the name (W8), and R-2151 fails on a retuned seal (W4); (2) nothing main
does today stopped working: a command's own `timeoutMs`, R-1702's zero, the R-095 timeout chip, the kill paths,
pi's file queue under its real loader, and the install check's live post-edit turn on both CI legs; (3) an installed
pack does not load the new lib file as an extension; (4) the test writes only inside the temp folders it owns,
restores `setTimeout` and cleans up; (5) HANDOFF and the session entry are true, including the dropped
post-edit-win-pin residual and the lane's three new residuals; (6) any MUST.
