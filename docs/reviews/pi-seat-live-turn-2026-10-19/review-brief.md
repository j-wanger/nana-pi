# Review — pi-seat-live-turn (the install check runs one real pi print-mode turn in a fresh install and fails unless the model request holds the objective, rulings, writing and knowledge injections and nana-gate blocks a scripted bash call; the pi session and adoption lines fail on extension errors, unavailable notices and stale lines), 2026-10-19 (Opus, the lane's one final reviewer)

Feature: FEAT-015 · Diagnose the active environment

Review `git diff c827fcf8..HEAD` on `feat/pi-seat-live-turn` (main was `c827fcf8` when the lane branched; `git
merge-base HEAD main` is `c827fcf8`; main has since moved to `f0d6da24`, the knowledge-pull-fail-open-pin land, so a
merge of main and a confirmation round follow before the land). The plan of record is
`docs/reviews/pi-seat-live-turn-2026-10-19/must-meet.md` (rows R-1790 to R-1796, new in FEAT-015's own table after
R-1096), with `plan-attack.md` (the adversary's AMEND), `build-brief-1.md` and `build-brief-2.md` beside it. Build 1 is
`0a88cbea`; build 2 is `ee2cb4c9`, which joins the prompt and the run token into one argument after the seat's real
install check failed the turn. The seat's record `seat-verify-ee2cb4c.md` holds CI run 39344704047 (0 failing files on
macOS, Ubuntu and Windows; both install-check jobs print `PASS pi turn`) and the seat's real macOS install check before
and after build 2, with the Windows suite log and the Windows install-check log beside it.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main` at ee2cb4c; the seat's notes commit changes
no row): seven rows added, all implemented; none retired, re-statused or reworded. R-1070's text is unchanged; its
evidence gains the R-1791 check.

```
tree movement c827fcf..ee2cb4c: 7 rows in 1 features
FEAT-015 · Diagnose the active environment
  R-1790 new (implemented)
  R-1791 new (implemented)
  R-1792 new (implemented)
  R-1793 new (implemented)
  R-1794 new (implemented)
  R-1795 new (implemented)
  R-1796 new (implemented)
```

The change under review: a new pi extension fixture `packages/nana-setup/lib/install-check-turn.mjs`, loaded only
through `-e`; the turn, `judgePiTurn` and `readPiSessionEvents` in `install-check.mjs`; the stale-line test on `hook
adoption`; `PI_TURN`, `PI_SESSION` and `SPAWN_TIMEOUT_MS.turn` in `install-check-config.mjs`; the setup README's
install-check section; tests, rows, the tree and the code map. Judge whether the turn proves what R-1790 to R-1793 say
for a real fresh install: the turn runs from the fixture project with the base environment and no `NANA_ROLE`, through
winCommand on win32, with exactly one prompt argument holding the prompt and the run token; and the judge passes only on
exit 0, the run token, the rulings heading and the writing tag in the first request's system prompt, a knowledge user
message naming the note file, and an errored bash result that starts with the gate's block text. Judge whether an
extension error on stderr or a stale line in the prompt fails the line even when every expected text is present.
Judge whether R-1794's reader can miss an `extension_error` or an unavailable notice, widget or status within the
sealed cap, or crash on a truncated or CRLF line, and whether R-1795 reads both stale prefixes from their one shared
home. Judge whether R-1796's check would catch the fixture registered in any pi package manifest in the checkout, and
whether the fixture can load into a user's real pi session. Judge whether the three existing-test edits the brief named
(the recording run's knowledge stub, the R-1072 writes-only list, the R-1079 win32 filter) keep those tests as strict as
before. Judge whether the setup README's install-check section is true, and whether its dropped sentence (a Windows
green result is not a substitute for the owner's Windows machine rehearsal) loses a true limit.

Threat model: honest variation in our tools' output and the OS in scope: macOS, Linux and Windows on Node 22; pi
1.0.2's print-mode and RPC output, pi-subagents' output, a cold or slow CI runner, the Windows launch through cmd.exe.
Deliberate forgery out (a forged record file, a forged RPC stream, a hostile extension). Lane class: ordinary — the
lane changes the install check only; no install, uninstall or doctor code, no Claude Code hook, no shipped pi extension
(the fixture sits in no pi package manifest), no gate policy, no land or review tool. The owner's 2026-10-12 rule still
applies: the seat runs the install check on macOS before the land, and CI's Windows install-check leg must pass on the
reviewed tip.

Check: (1) the must-meet checks are not vacuous: each reds on the wrong-code shapes the plan names (worker environment,
a dropped or split prompt argument and win32 without winCommand for R-1790; knowledge looked for in the system prompt,
rulings judged by the `<nana-rulings>` tag and an ignored exit status for R-1791; an ignored isError or toolName or any
tool text for R-1792; a skipped stderr scan and a single stale prefix for R-1793; a case-sensitive or notify-only match,
a bare parse of a truncated line and no session cap for R-1794; one stale prefix for R-1795; the fixture's folder in a
manifest for R-1796), and each row is no wider than its checks; (2) the mocked suite and the real turn agree: nothing in
the unit tests' stubs hides a launch shape that the real pi rejects, as the split prompt was hidden in build 1; (3) the
turn writes only inside the temporary home and fixture project, and a gate that fails to block runs its sample there
only; (4) nothing else changed: no install, doctor, hook, shipped extension or gate code, and the regenerated tree and
code map match a fresh run; (5) the plan's known limits are recorded as HANDOFF residuals, and none of them hides a bug
that stops the feature; (6) HANDOFF and the session entry are true; (7) any MUST.
