# pi-seat-live-turn — plan attack (one adversary)

Verdict: AMEND

AMEND. The lane is worth building and the core design holds up under live probes. The fixes below tighten the tests and the brief. The design itself is unchanged.

Probes. Each ran in a fresh mktemp folder: a --no-hardlinks clone at 22ccd849, plus a temporary HOME installed with nana-setup install. The folder is now deleted, and the repo is unchanged and clean.
1. Live macOS faux turn: exit 0 in 0.66 s.
   - The record held the token, the `## Standing rulings (nana)` heading and the `<nana-writing>` tag.
   - The knowledge pointer arrived as the second user message and named ~/notes/docs/install-check.md. This was WITH --no-session; the planner had not shown that.
   - The bash result had isError true and started `nana-gate: verifier pipe blocked (headless fail-closed):`.
   - The fixture sat outside pi's package and imported root pi-ai. pi's loader aliases that specifier to pi-ai/compat, which re-exports faux.
2. A throwing handler printed `Extension error (<path>): <msg>` on stderr and pi still exited 0. A broken import made pi exit 1.
3. Real RPC session output:
   - With pi-subagents 0.75.0: 21,699 bytes of stdout, including a 20,970-byte get_commands response.
   - One setWidget event came AFTER that response. So the default 10,001-character cap would lose a late extension_error. The cap raise is justified.
   - The word "unavailable" appeared nowhere, so R-1794 has no false positive today on macOS.
   - Without pi-subagents: 8,882 bytes.
4. Stub run of main's runInstallCheck: an extension_error line, an `objective unavailable:` notice, a roster-unavailable widget, an adoption stale line and an adoption stale-unavailable line each gave PASS. There was no `pi turn` line and no -p call. R-1790 to R-1795 are red today. R-1796 is red only because the file is absent.

Amendments.
(a) R-1790 was wider than its test: it listed every flag and named a timeout the test did not assert. It now says "the sealed turn arguments ... and the sealed turn timeout, launched as the pi session is launched". The test now covers win32 through winCommand. The pin holds the argument list.
(b) The brief now names an existing-test break the plan missed. In the R-1079 test "pi launch: on win32 ...", the `/--mode/` filter matches the turn's `--model`, so its count of 3 fails.
(c) R-1794's row says the output is kept up to the cap, but no test checked the cap. The test now asserts that the session spawn carries it.
(d) New wrong-code pairs:
   - judging rulings by the `<nana-rulings>` tag, which stays when RULINGS UNAVAILABLE replaces the text;
   - ignoring the exit status;
   - ignoring toolName;
   - not passing the session cap;
   - launching the turn on win32 without winCommand.
(e) The tool name is now sealed. The note's file name gets one shared name instead of a third inline literal.
(f) "Stdin is ended" needs no new code: createSpawnAdapter already ends stdin on every spawn.
(g) The builder no longer pushes or waits on CI. Recent briefs have the seat open the draft PR and read the legs.
(h) The feature line now uses the feature's own name.
(i) The most-likely-wrong claim changed:
   - Dropped: stdin EOF through cmd.exe. The RPC session already relies on it and passes on CI's Windows leg.
   - Dropped: Git Bash timing. CI has Git Bash.
   - Added: this fixture is the repo's first runtime import of a pi package (every other pi import is type-only). So the alias is unproven on Windows.
   - Added: the knowledge extension's 2 s pull budget on a cold Windows runner.

Kept:
- Class ordinary. The readme-install and win-install-shape precedents apply, and the fixture loads only through -e. R-1796 keeps it out of every pi package manifest.
- R-1794 and R-1795. R-1795 closes the recorded residual "the install check does not read the new lines". Both are cheap and deterministic.

Conflicts:
- Must wait for win-path-commands. Its branch edits install-check.mjs (PATH key, lines 192-222), DOCTOR_NOTES in install-check-config.mjs, the R-1072 writes-only test, the setup README, REQUIREMENTS.md and the regenerated docs. It is in seat checks, so the wait is short.
- stale-copies-hooks has no branch yet. Its rows (R-1600 to R-1606 territory) also sit in FEAT-015's table. The lane that lands second merges main and regenerates the tree and the map. Seat: if that plan adds its own install-check stale-line row, drop R-1795 here.
- pwsh-lexer-oracle rewrites liveText in pipe-guard.mjs, but the turn seals only nana-gate's prefix. No wait.
- No overlap with review-ledger-run-reviewer, mutation-runner-win-prune or adopt-structure-markers beyond regenerated docs.

Notes for the seat:
- Today's power-mode memory says Sonnet builders. The task's rule names pi sol for complex lanes. Confirm the builder.
- The planner reports one accidental `git pull -q` in the main checkout. The checkout is clean at 22ccd849 now.

Most likely wrong: that pi's loader resolves the root `@earendil-works/pi-ai` import for this fixture on CI's Windows leg. If it does not, pi prints "Failed to load extension" and `pi turn` FAILs with that stderr line.
