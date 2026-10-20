# Review — claude-config-dir (install and doctor use the Claude folder that CLAUDE_CONFIG_DIR names, a relative value makes install stop, and the test runner scrubs the variable), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-013 · Install and connect harness runtimes (SUB-011 · Select the active runtime and home; R-2396 sits
under FEAT-031 · Run checks reliably and without contaminating work)

Review `git diff 9552afb1..HEAD` on `feat/claude-config-dir` (the lane branched from main `9552afb1`; `git merge-base
HEAD main` is `9552afb1`). The plan of record is `docs/reviews/claude-config-dir-2026-10-20/must-meet.md`: eight
must-meet checks, rows R-2390 to R-2394 and R-2396 to R-2398 (R-2395 is not used). `plan-attack.md` holds the
adversary's AMEND; `build-brief-1.md` (with the seat's amendments at its end) to `build-brief-3.md` are the three
builds: build 1 53cba519 and 58fe4374, build 2 d9a5bdfb, build 3 5bdb9db6. The seat's record is
`seat-verify-b394373c.md`. CI run 39499885423 on draft pull request #148 at b394373c reads 0 failing on all three legs:
macOS 193 PASS, 0 FAIL, 2 SKIP of 195 files (8,008 checks pass, 35 skip); Ubuntu 192 PASS, 0 FAIL, 3 SKIP (7,947 pass,
55 skip); Windows 177 PASS, 0 FAIL, 18 SKIP (6,936 pass, 114 skip), with claude-config-dir 7 pass there. The install
check passes on macOS and Windows. The Windows leg's log is `ci-windows-b394373c.log` in this folder. The record also
holds the macOS wrong-code pairs (`seat-mutate.mjs`; 16 of 18 red on 58fe4374 with P4 and P8 surviving; 18 of 19 red on
5bdb9db6, P4 now red and P8 declared equivalent; records `seat-mutate-output-58fe4374.txt` and
`seat-mutate-output-5bdb9db6.txt`) and the independent check (`independent-check-b394373c.md`: HOLDS over eleven probes
on build 1, 58fe4374, no MUST, three known bugs, now HANDOFF residuals). Nobody re-ran the independent check on builds
2 and 3. The land runs the locked suite on the reviewed tip, and the local macOS install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base; run at
b394373c, before the seat's notes commit):

```
tree movement 9552afb..b394373: 8 rows in 2 features
FEAT-013 · Install and connect harness runtimes
  R-2390 new (implemented)
  R-2391 new (implemented)
  R-2392 new (implemented)
  R-2393 new (implemented)
  R-2394 new (implemented)
  R-2397 new (implemented)
  R-2398 new (implemented)
FEAT-031 · Run checks reliably and without contaminating work
  R-2396 new (implemented)
```

CAP-04 moves from 523 to 530 rows, FEAT-013 from 195 to 202 and SUB-011 from 17 to 24; CAP-07 from 318 to 319 and
FEAT-031 from 95 to 96. No existing row changed.

The code under review: the new `packages/nana-setup/lib/claude-config-home.mjs` (`CLAUDE_CONFIG_ENV` and
`claudeConfigHome(home, env)`: the value as given when not empty, else `<home>/.claude`), which the shared-memory hook
(`claude/hooks/nana-shared-memory.mjs`, one expression and one import) and `lib/paths.mjs` now share. `resolveLayout`
reads the variable only when neither `--claude-home` nor `--home` is given, resolves a relative value against the cwd
without throwing, and adds `claudeHomeSource` and `claudeHomeCwdRelative`. `bin/nana-setup.mjs` adds
`refuseCwdRelativeClaudeHome` (exit 2) in `runInstall` and in doctor's install prediction, and the banner's claude
home line names its source unless it is the default. `scripts/test.mjs` SCRUB adds the variable, and three test files
delete it from their child env for a direct run. Tests: the new `packages/nana-setup/tests/claude-config-dir.test.mjs`
(seven checks) and one check in `packages/nana-pack/tests/test-runner.test.mjs`. The setup README's usage line, a new
paragraph and its Tests paragraph change with it. Build 3 leaves the shared-memory seed and `stepSharedMemory` exactly
as on main. The rest of the diff is the plan, the seat's records, the generated code map and tree, HANDOFF and the
session entry.

Judge whether, with an absolute CLAUDE_CONFIG_DIR and no flag, install writes every Claude piece into that folder and
nothing under `<home>/.claude`, and doctor checks that folder; whether a relative value makes install and its dry run
exit 2 before any write, and doctor's summary names the refusal; whether an empty value means `<home>/.claude` as the
hook reads it; whether either flag always beats the variable, a relative one included; whether the hook's output is
unchanged for every value; and whether the tests' child processes stay inside the temp homes they own, under the
runner and in a direct run of the three edited files. The declared behaviour change: the banner now ends
`  (from --claude-home)` or `  (from --home)` when a flag sets the folder, where main printed no source; the plan had
said every other banner stays byte-identical, and build 2 changed that at the seat's brief. No row names the flag
source; R-2392's check carries it.

Threat model: honest variation in our tools' output and the OS is in scope (CLAUDE_CONFIG_DIR unset, empty, absolute,
absolute with a trailing separator, relative, a `~/` literal, a drive path on win32, a linked folder; set by Claude
Code in its hook and tool children; on macOS, Linux and Windows); deliberate forgery is out.
Lane class: install, hook or gate — nana-setup install and doctor and their layout resolver, plus the Claude Code
SessionStart shared-memory hook.

Check: (1) the must-meet checks are not vacuous: each pair named in the seat's record turns its check red (18 of 19 on
5bdb9db6; P8 declared equivalent) — judge whether any must-meet check is still unproven; (2) no fail-open: a relative
value never reaches a write in install or its dry run, and doctor never tells the owner to run an install that will
refuse; (3) nothing main does today stopped working: with no variable, install, its dry run, doctor, uninstall, the
stale check and the hook behave as on main, on all three CI legs; (4) the shared-memory hook's import resolves through
its installed link and from the checkout on Windows; (5) no test writes outside the temp folders it owns; (6) every
README sentence the lane changed is true; (7) HANDOFF and the session entry are true, including the Landed line, the
narrowed stale-check line and the eleven new residuals; (8) any MUST.

## Chain note (the seat, after this brief was written)

Since `c16fe037`, the seat merged `fed7d7f9`, the shared-memory-index-cap lane's reviewed tip. Lanes land in order; each land is a fast-forward of main, so `fed7d7f9` becomes main before this lane lands. Review this lane's own change as `git diff fed7d7f9...HEAD` (three dots: against the merge base) and the merge itself as `git show --remerge-diff 8a8aa7b1` (the merge commit) if your git supports it; the generated tree, code map and R-291 leaf total were regenerated by the seat's merge helper. Tree movement now (`node scripts/requirements-moved.mjs --root . --base fed7d7f9`):

```
tree movement fed7d7f..8a8aa7b: 8 rows in 2 features
FEAT-013 · Install and connect harness runtimes
  R-2390 new (implemented)
  R-2391 new (implemented)
  R-2392 new (implemented)
  R-2393 new (implemented)
  R-2394 new (implemented)
  R-2397 new (implemented)
  R-2398 new (implemented)
FEAT-031 · Run checks reliably and without contaminating work
  R-2396 new (implemented)
```
