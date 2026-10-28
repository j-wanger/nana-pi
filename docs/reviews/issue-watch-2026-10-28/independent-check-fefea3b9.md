# issue-watch · independent check at fefea3b9

Verdict: no MUST. 3 SHOULD, 6 NOTE. The feature works for its user on a user-owned repo. Harness and scratch files: `<scratch>` (`harness.mjs`, `pisim.mjs`, `live.txt`).

## What passed (run, not read)

- Live run on j-wanger/nana-pi: silent, exit 0 after 1500.04 s, last line a correct `--since "2026-10-28T22:46:10.999Z"` restart command that runs as printed. `--since` one hour back printed both real #248 comments.
- Resume (fake seam): comments 400 ms before and 200 ms after the run end both arrived once, in run 2.
- Edited old comment: nothing. Another person: no text. `J-Wanger` counts as owner. CRLF, ESC, U+202E, U+2028, NUL: one clean line.
- gh missing, signed out, four failures then success: one failure line, one `recovered.` line. No pointer: one line, exit 0, no gh. Bad arguments exit 2. Worker role: silent.
- Session start vs main: byte-identical for no pointer, no HANDOFF, list asks and nana-agent-loop, under every role. nana-pi gains exactly one line. Timing unchanged (0.60 s vs 0.53 s); no new gh call.
- pi (simulated host): two `session_start`s left one watch; outsider text never reached `sendMessage`; no calls after `session_shutdown`, on load, without UI, or as worker or reviewer. Timer path is async spawn only. pi 1.0.2 steers when streaming and starts a turn when idle; the message reaches the model as a user-role message.
- `issue-watch.test.mjs`: 13 PASS.

## SHOULD

1. **The cursor follows the local clock, so comments can be lost silently.** `cursor = through = floor(local now) − 1 ms`, and any row created at or before the cursor is skipped forever. Harness with the local clock 3 s ahead of GitHub: 56 of 60 comments delivered (one lost per poll). With 800 ms between a comment's `created_at` and the API showing it: 0 of 1 delivered. This Mac is within 0.3 s of GitHub's `Date` header and 0.02 s of NTP, so the risk is on drifting machines and in the API's write-to-visible lag (size unmeasured). Fix: move the cursor to the newest `created_at` actually seen, or base it on the response `Date` header.
2. **On an org-owned repo, the owner's comments read as someone else's (inferred).** The owner test is `author_association === "OWNER"`. In the latest 100 comments of each of two org repos, no comment showed OWNER. On earendil-works/pi the maintainer shows COLLABORATOR or MEMBER, and on cli/cli it shows MEMBER. The adversary's suggested fallback (MEMBER/COLLABORATOR) was not taken. This fails closed: text is hidden, and the someone-else line still shows.
3. **Self-echo is not recorded.** The plan says it "stays a known bug", but no `docs/known-bugs/` file mentions it. The evidence is live: the #248 comment "Decided 2026-10-28: … The seat plans it after the issue-watch lane." is a seat-written post, and it is delivered as an owner comment. In pi, `triggerTurn: true` makes each seat-posted comment start a turn. That could loop if the model replies again. Record the bug at least.

## NOTE

1. Burst of 150 in one poll: 100 delivered, 50 lost, with one "more comments than shown" line. The cursor still advances past them. The plan accepts this, but the line does not say any were dropped.
2. Failure lines do not name the cause. Signed out, rate limited and HTTP 502 all print `gh failed.`, and gh's stderr detail is dropped.
3. In pi, `emit` is a no-op. The pi seat never hears about another person's comment, a gh failure, or the fetch cap.
4. SIGTERM or SIGINT stops the watch without printing a restart line. If Claude Code kills it early, the seat has only the session-start command (no `--since`), so comments in the gap are lost.
5. Windows quoting, checked in bash only (no pwsh here). `\\server\share` becomes `\server\share`. A root of `C:\` produces `"C:\"`, which leaves the quote open. Under PowerShell, `\$` does not escape `$`. All three paths are unlikely in practice. `$HOME/nana-pi` assumes the usual checkout path, as the other rules do.
6. The pi message reuses customType `nana-frontier`, the same name as the system-prompt section. This is harmless, but it may confuse a renderer or a filter later.
