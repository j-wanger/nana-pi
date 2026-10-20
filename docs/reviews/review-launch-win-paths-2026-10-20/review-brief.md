# Review — review-launch-win-paths (on Windows, review-ledger run refuses a .cmd or .bat reviewer path that names no file in the reviewed tree, and names the path it looked for), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-007 · Review a specific revision independently (SUB-008 · Run and stop an isolated reviewer)

Review `git diff 9552afb1..HEAD` on `feat/review-launch-win-paths` (main was `9552afb1` when this brief was written;
`git merge-base HEAD main` is `9552afb1`). The plan of record is
`docs/reviews/review-launch-win-paths-2026-10-20/must-meet.md`: three must-meet checks, rows R-2430 to R-2432.
`plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is the one build (6136c925). The seat's record is
`seat-verify-799872c1.md`. CI on draft pull request #145 runs at 6136c925. CI-PENDING. The record also holds the macOS
wrong-code pairs (`seat-mutate.mjs`; 8 of 8 red, 0 survived, record `seat-mutate-output-6136c925.txt`) and the
independent check (`independent-check-799872c1.md`: FINDINGS, no MUST, run on 6136c925; its one stale HANDOFF line is
rewritten in the seat's notes commit). R-2432 runs only on Windows; it stays `untested` behind its `req-candidate`
marker and waits on the Windows leg, and its two Windows-only pairs (W1, W2) have not run.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base; run at
799872c1, before the seat's notes commit):

```
tree movement 9552afb..799872c: 3 rows in 1 features
FEAT-007 · Review a specific revision independently
  R-2430 new (implemented)
  R-2431 new (implemented)
  R-2432 new (untested)
```

CAP-02 moves from 194 to 197 rows, FEAT-007 from 131 to 134 and SUB-008 from 44 to 47. No existing row's text
changed; R-2252's fixture gains the `.bat` it launches, with its assertions unchanged.

The code under review: `packages/nana-pack/bin/review-launch.mjs` (on win32, a `.cmd` or `.bat` path in any letter
case is resolved against the given folder and refused `no file at <resolved>` when no file is there; a present file
still starts through `winCommand` as written; the probe defaults to `defaultExists`),
`packages/nana-pack/bin/review-ledger.mjs` (the resolver now runs after admission with `{ cwd: adm.res.cwd }`, the
reviewed tree), and `packages/nana-pack/lib/win-command.mjs` (`defaultExists` exported, unchanged). Tests: three new
checks in `packages/nana-pack/tests/review-launch.test.mjs` (R-2430, R-2431, and R-2432 on Windows only) and R-2252's
fixture `.bat`. The pack README's Windows paragraph gains one sentence. The rest of the diff is the plan, the seat's
records, the generated code map and tree, HANDOFF and the session entry.

Judge whether review-ledger run on Windows now refuses a `.cmd` or `.bat` reviewer path that names no file in the
reviewed tree, with exit 1, the cannot-start line naming the resolved path on stderr and in --out, and no reservation
or round; whether a path that names a file, relative ones included, still starts through ComSpec with today's quoting;
whether `.exe`, `.com` and extensionless paths and every bare name start as on main (a bare name's relative PATH entry
is now read from the reviewed tree, a recorded residual); whether moving the resolver after admission can strand a
reservation or reorder what the user sees; whether macOS and Linux start every command exactly as main does; and
whether the tests' child processes stay inside the temp homes and folders they own.

Threat model: honest variation in our tools' output and the OS is in scope (a mistyped reviewer path, an upper-case
extension, a relative path with --tree set to another folder, a folder name with a space, a UNC path; macOS, Linux and
Windows; cmd.exe's quoting); deliberate forgery is out, such as a planted file or one deleted between the check and the
start. The plan's known limits are carried in HANDOFF as residuals.
Lane class: install, hook or gate — the land and review tools (review-ledger run and its launch resolver; pi-review is
unchanged).

Check: (1) the must-meet checks are not vacuous: each macOS pair turns its named check red (M1 to M8), and R-2432's
red half waits on the Windows leg (W1, W2 not yet run) — judge whether any must-meet check is still unproven; (2) no
fail-open: a round is recorded only on exit 0 with review-shaped output, a refused path consumes no round and leaves no
reservation, and the resolver cannot throw after admission; (3) the path check reads the reviewed tree, not the
launcher's folder, and keeps the word as written in the launch; (4) nothing main does today stopped working: a present
.cmd or .bat path, a .exe, an extensionless path, every bare name and pi on Windows, every command on macOS and Linux,
`check` and `report`, and pi-review; (5) the tests write only inside the temp folders and homes they own; (6) every
README command and path it names runs as written; (7) HANDOFF and the session entry are true, including the rewritten
final-review and launcher's-folder lines and the three new residuals; (8) any MUST.

## Seat, after CI (2026-10-20)

The Windows leg of run 39496386067 at 6136c925 printed `PASS Windows: review-ledger run resolves a relative .cmd reviewer path against --tree, …` (log line 4417) (review-launch.test.mjs 8 pass, 1 skip; log `ci-windows-6136c925.log`). The seat flipped R-2432's marker from `req-candidate` to `req:` and its row from untested to implemented; its evidence cell now cites that check; the earlier sentences saying it waits on the Windows leg are superseded. The two Windows-only pairs W1 and W2 still have not run (a carried line).
