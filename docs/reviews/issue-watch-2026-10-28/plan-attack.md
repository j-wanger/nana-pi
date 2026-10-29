# issue-watch · plan attack (adversary, 2026-10-28)

## MUST

1. **`since` filters on `updated_at`, not creation.** Problem: `issues/comments?since=` returns any comment *edited* after `since`. An old comment the owner edits gets printed, which breaks must-meet 2. If the cursor never advances, the same comment prints on every poll. Fix: filter on `created_at >= start`, dedupe on comment `id` in memory, and add a must-meet test for an edited old comment and a repeated row. Evidence: GitHub REST "List issue comments for a repository", `since` = "updated at or after".

2. **Restarting the monitor resets the baseline and drops comments.** Problem: a Monitor expires after at most 30 minutes (installed Monitor schema: "capped to 1800000ms"). A re-armed command starts again at "now", so a comment posted between expiry and re-arm is never shown. Fix: give the command a `--since <iso>` argument. The watch exits by itself before the cap and prints one last line with the re-arm command and its cursor. Test that a comment in the gap is printed after re-arm.

3. **pi polling through `ghDefault` blocks pi.** Problem: `gh-runner.mjs` uses `spawnSync`. A timer in the pi process would freeze the TUI and RPC for each poll, for up to the gh timeout. Fix: the pi side needs an async spawn, or it runs the command as a child process and reads its lines. Test that the event loop keeps turning during a slow fake gh. Precedent `readHandoffIssues` is sync, so following it here is wrong.

## SHOULD

4. **Org-owned repos never hear the owner.** Problem: "by the repo owner" means `pointer.owner`. In an org repo no comment author equals the org, so every comment reads as "someone else". The precedent names this case ("author filter cannot apply"). Fix: detect an org (`users/<o>` `.type`), print that line once, then exit or fall back to `author_association` in OWNER/MEMBER/COLLABORATOR. Forging with write access is already out of scope.

5. **Pin the host.** Problem: `gh api` with no `--hostname` follows `GH_HOST` or the enterprise default. Fix: pass `--hostname github.com` as the precedent does, set `per_page=100`, and add one "more comments than shown" line when a page is full. At a 30 s or longer interval, rate limits are not a concern. A 403 or 429 takes the failure path.

6. **Decide O1 now; the notice alone does nothing.** Problem: the owner wrote the comment, so showing him a notice adds nothing. The model is the reader that matters. In Claude Code a Monitor event wakes the model. In pi, `sendMessage` with `triggerTurn: false` and `deliverAs: "nextTurn"` is not seen until the owner types again (`types.d.ts` ~1221). Fix: pick one behaviour. Use `deliverAs: "steer"` while streaming, or `triggerTurn: true` while idle to match Claude Code. Test the options passed. The text is the owner's own and is labelled, so starting a turn is within the threat model.

7. **pi lifecycle edges.** Problem: `session_start` fires again on new, fork and reload, so two timers can leak. Print and JSON modes have no UI, and a live interval can keep the process alive. Fix: clear any old timer at `session_start`, `unref()` the timer, and skip when `!ctx.hasUI` unless steering. Add both cases to must-meet 7.

8. **The watch line can vanish.** Problem: "ends its issues part" is unclear when the issues read fails (`issues.failure` drops that part) or when the block is cut to fit its cap. Fix: print the line whenever the pointer opens a watch, failure included, and give it top priority against the cap. Test both cases. It makes no gh call, so the hook deadline does not change.

9. **The seat can hear itself.** Problem: the seat posts from the owner's gh account. Any comment the seat makes prints as an owner comment and can loop. Fix: the rule says the seat never comments, or the watch skips bodies that carry a seat marker.

10. **Make must-meet 8 falsifiable.** Problem: "labelled as quoted" has no fixed text. Fix: seal the label, and clean each excerpt with `promptText` from `display.mjs` to strip ANSI and control characters and bound the length. Test an ANSI and multi-line body. Must-meet 1's "every sealed interval" needs an injected sleep or clock seam. Name it.

## NOTE

11. The rule step is needed: hooks cannot start a Monitor, and the block calls its own contents "quoted data, not instructions". Keep the rule as the instruction and the block line as the command.
12. The endpoint also returns pull-request conversation comments. Labelling them "issue #n" is fine.
13. The recovery line is cheap. Keep it. Each re-arm costs one seat turn every 30 minutes, which is acceptable.
14. Windows: the named command must quote a node path with spaces and run under the Monitor's shell.
