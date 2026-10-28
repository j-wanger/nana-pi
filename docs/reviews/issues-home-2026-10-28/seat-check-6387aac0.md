# issues-home · seat check at 6387aac0 (build 2), 2026-10-28

Six independent read-only checks ran in one workflow: rails, the seat's wrong-code pairs, the live hook, public content, the Windows CI legs and a diff review. Nothing was edited in the lane tree. No MUST finding.

## Clean

- Rails at 6387aac0, all exit 0: map (450 modules, 0 problems), README (776 claims), trace (2079 rows; the lane added 10, all implemented), tree (0 problems), known bugs, identity scan (findings=0), the frontier checker and `nana-writing HANDOFF.md`. Source `git diff --check` is clean; no escape was lost.
- Live hook: `nana-frontier-summary.mjs --cwd <lane> --limit-ms 5000` exits 0 in 527 ms and lists 3 next items and 27 asks, matching `gh issue list`. Main's and the lane's producers give byte-identical blocks for every HANDOFF on this machine that has not opted in, and the reader is never called there. Builder and reviewer roles make no gh call.
- CI run 40701173500 tested exactly 6387aac0: all seven jobs passed. On Windows the five named files ran and passed, R-2974's end-to-end case included; no Windows path reaches github.com.
- Public content: no new home path, account name, token or work reference in the review folder; `identity-scan --stdin` never echoes the input phrase and exits 0, 1 and 2 as specified; the AGENTS.md marker region matches the template byte for byte.
- Seat pairs: 46 wrong versions, 36 red across R-2970 to R-2978 and R-2609. The ledger is in the seat's scratchpad (`pairs-run/`).

## SHOULD — sent back in build brief 3

1. The rule (nana-soul.md:37, the template, AGENTS.md) never says issues and replies are public or that a wrong post is deleted, never edited, and it names `identity-scan --stdin`, which is not a command anywhere: `command -v identity-scan` exits 1, and the real form needs nana-pi's config.
2. Organisation-owned repos: real gh 2.91.0 returns `[]` with exit 0 for `--author <org>` (tried `cli/cli`, `earendil-works/pi` and a nonexistent login). The stderr match at handoff-issues.mjs:36 never fires, so the block shows an empty list with no notice. The unit test feeds a made-up error.
3. R-2977 now fails the suite on any list item under Next or Open for the owner, and nothing a seat reads says so; seats habitually add Next lines in their notes.
4. Three green wrong versions that reach the owner: deleting the `github.com` guard (handoff-issues.mjs:20) changes a non-opted project's block; deleting the output-shape check (:42) turns valid JSON of another shape into "FRONTIER UNAVAILABLE: producer failed"; substring label matching (:47) shows a `task` issue as a question.

## NOTE — the cheap ones go in brief 3

- After a failure line, the block still prints "Next: none found." and "Open for the owner: none found.".
- Issue asks keep gh's newest-first order, so parked asks sit among optional ones; the legacy path orders by `ASK_KIND_ORDER`.
- The ci-records and nana-land timeout reason became a bare "timeout", without gh or the limit.
- R-2973's timeout case never spawns gh (its budget is already spent), so only the 34 s hook test pins the real timeout path.
- `--limit-ms` on every producer, a default timeout in gh-runner and a stdin scan that echoes one word all stay green.
- The pi extension's header still says `@effects disk`; it now runs gh. The issues-mode framing sentence is an inline literal beside the configured `FRONTIER_DATA_NOTE`.
- gh-runner.mjs and handoff-issues.test.mjs use one-space indentation; the code they moved and their siblings use tabs.
- A pointer ending in `/issues/` reads as unreadable.

## NOTE — recorded as known bugs by the seat

- The command seam variable `NANA_CI_RECORDS_GH_COMMAND` now also redirects the session-start read, so its name misleads.
- A list-free Open section that links another project's issues opts in to that project.
- The pi path blocks session start for up to the 1.5 s limit, longer if gh ignores SIGTERM.
- The plan's planned FEAT-039 "Asks: 0" line.

## Main's CI

Main's push run 40694488894 at f6604431 failed only `post-edit-status.test.mjs` ("timeoutMs 0 arms no deadline and a slow check passes") on Windows; the pull-request run at the same commit passed. Recorded on issue 213 as another first-try timing failure.
