# Review — claude-config-dir (install and doctor use the Claude folder that CLAUDE_CONFIG_DIR names, a relative value makes install stop, and the test runner scrubs the variable), 2026-10-20 (pi gpt-6-astra, the land reviewer)

Feature: FEAT-013 · Install and connect harness runtimes (SUB-011 · Select the active runtime and home; R-2396 sits
under FEAT-031 · Run checks reliably and without contaminating work)

Review `git diff 9552afb1..HEAD` on `feat/claude-config-dir` (the lane branched from main `9552afb1`; `git merge-base
HEAD main` is `9552afb1`). The plan of record is `docs/reviews/claude-config-dir-2026-10-20/must-meet.md`: eight
must-meet checks, rows R-2390 to R-2394 and R-2396 to R-2398 (R-2395 is not used). `plan-attack.md` holds the
adversary's AMEND; `build-brief-1.md` to `build-brief-3.md` are the three builds (build 1 53cba519 and 58fe4374, build 2
d9a5bdfb, build 3 5bdb9db6). The seat's record is `seat-verify-b394373c.md`. CI run 39499885423 on draft pull request
#148 at b394373c reads 0 failing on all three legs: macOS 193 PASS, 0 FAIL, 2 SKIP of 195 files (8,008 checks pass, 35
skip); Ubuntu 192 PASS, 0 FAIL, 3 SKIP (7,947 pass, 55 skip); Windows 177 PASS, 0 FAIL, 18 SKIP (6,936 pass, 114 skip).
The install check passes on macOS and Windows. The Windows leg's log is `ci-windows-b394373c.log` in this folder. The
record also holds the macOS wrong-code pairs (`seat-mutate.mjs`; 18 of 19 red on 5bdb9db6, P8 declared equivalent) and
the independent check (`independent-check-b394373c.md`: HOLDS over eleven probes on build 1, 58fe4374, no MUST, three
known bugs). Nobody re-ran the independent check on builds 2 and 3. The final reviewer's brief is `review-brief.md`.
The land runs the locked suite on the reviewed tip, and the local macOS install check runs before the land.

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

The code under review: `packages/nana-setup/lib/paths.mjs` `resolveLayout`, which every install, dry run, doctor,
uninstall, state and session-start stale check resolves its Claude folder through, now reads CLAUDE_CONFIG_DIR when
neither `--claude-home` nor `--home` is given, through the new shared `lib/claude-config-home.mjs`, which the Claude
Code SessionStart shared-memory hook now imports too. `bin/nana-setup.mjs` refuses a relative value with exit 2 in
install and in doctor's install prediction, and the install banner names a non-default source. `scripts/test.mjs`
scrubs the variable from every test file's environment.

Judge whether the lane fails open: install or its dry run writing anywhere for a relative value; install writing into
the variable's folder when a flag names another; doctor reading ✓ for a folder install did not write, or telling the
owner to run an install that will refuse; the hook reading a different folder than before for any value; a suite or
direct test run writing into the caller's real Claude folder; or a must-meet check that passes with the change
removed. Judge whether it leaves a harm the review standard lists, such as a broken install or hook on any platform, a
lost settings key or memory file, or a test writing outside its temp homes. Judge whether anything main does today
stopped working: with no variable set, install's output and home tree, its dry run, doctor's rows and last line,
uninstall, the stale check, the hook, and all three CI legs. The declared behaviour change: the banner now ends
`  (from --claude-home)` or `  (from --home)` when a flag sets the folder, where main printed no source.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known bug: a direct run
of `stale-copies.test.mjs` with the variable set goes red (6 checks), because the adoption hook's child now inherits it
and that file does not scrub it, while the runner does; the seeded shared-memory index still says it lives under
`~/.claude`, since filling the folder in at install broke uninstall in build 2; a machine installed before the lane
that then sets the variable gets a new empty shared-memory index, with its old memories left in `<home>/.claude` and
not mentioned; a value set only in Claude Code's settings env block or a desktop launch is not seen; `state --paths`
refuses a folder outside home; the state manifest still lists the login file at `<home>/.claude.json`; uninstall and
state do not refuse a relative value; doctor shows no ! row for one; the pi gate's Claude settings pattern and the
writing-trial extractor's default root still match only a folder named `.claude`. The pairs and the independent check
ran on macOS only, so CI is the only Linux and native Windows run.

Threat model: honest variation in our tools' output and the OS is in scope (CLAUDE_CONFIG_DIR unset, empty, absolute,
absolute with a trailing separator, relative, a `~/` literal, a drive path on win32, a linked folder; set by Claude
Code in its hook and tool children; on macOS, Linux and Windows); deliberate forgery is out.
Lane class: install, hook or gate — nana-setup install and doctor and their layout resolver, plus the Claude Code
SessionStart shared-memory hook.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.

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
