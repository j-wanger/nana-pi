# issue-watch wrong-code pairs (seat, 2026-10-28)

Clone of <worktree> at fefea3b9. Harness: pairs.mjs (beside this file); raw output: pairs-out.txt.
Tests per pair: nana-pack issue-watch, handoff-issues, frontier-summary, frontier-golden, frontier; nana-setup frontier-hook, hook-producers, seat-rule.
Baseline: all eight green before the run; clone clean (git status empty) after every revert.
None repeats the builder's 20 pairs in mutation-check.mjs.

| Pair | Must-meet | Wrong code | Result | Failing test |
|---|---|---|---|---|
| A | R-2990 | filter on updated_at not created_at | RED | issue-watch R-2990, R-2991, R-2992, R-2993, R-2997 |
| B | R-2990 | cursor never advances (repeats each poll) | RED | issue-watch R-2990, R-2992, R-2993 |
| C | R-2991 | outsider notice carries comment text | RED | issue-watch R-2991 |
| D | R-2991 | org type typo, falls back to login match | RED | issue-watch R-2991 |
| E | R-2991 | case-sensitive owner login | RED | issue-watch R-2991 |
| F | R-2992 | --since ignored, cursor resets to now | RED | issue-watch R-2990, R-2992, R-2993 |
| G | R-2992 | restart line prints starting since, not live cursor | RED | issue-watch R-2992 |
| H | R-2992 | run ends 10 min after the 25-min seal (past the 30-min cap) | RED | issue-watch R-2992 (case limit) |
| I | R-2993 | failure line always says "gh failed" | GREEN | none |
| J | R-2993 | no recovery line | RED | issue-watch R-2993 |
| K | R-2993 | cursor advances on a failed poll | RED | issue-watch R-2993 |
| L | R-2997 | default runner is the synchronous spawnSync gh | GREEN | none |
| M | R-2997 | session_shutdown handler removed | RED | issue-watch R-2997 |
| N | R-2997 | extension excludes only reviewers (worker watches) | RED | issue-watch R-2997 |
| O | R-2996 | CLI role guard removed | GREEN | none |
| P | R-2995 | watch line shown for an unreadable pointer | GREEN | none |
| Q | R-2995 | watch line dropped when the issues read fails | RED | issue-watch R-2995; handoff-issues R-2973 |
| R | R-2990/R-2998 | quoted-comment label removed | RED | issue-watch R-2990, R-2997 |
| S | R-2990 | control characters kept (slice, no promptText) | RED | issue-watch R-2990 |
| T | R-2990 | full-page warning `>` not `>=` | RED | issue-watch R-2990 |
| U | R-2997 | pi (continuous) watch keeps the end timer | RED | issue-watch R-2997 |
| V | R-2992 | CLI poll timer unref'd | GREEN | none |

17 red, 5 green.

## Green pairs: exact wrong code that passed

- I (R-2993, "one line naming the cause"), packages/nana-pack/lib/issue-watch.mjs:58:
  `if (!result.ok) throw new Error("gh failed");`
  Why undetected: the R-2993 assertion is `/Issue watch: (cannot start gh|gh failed|timeout|unreadable output)/` for every state, so any cause passes.
- L (R-2997, "asynchronous gh call, never a blocking one"), issue-watch.mjs:14 and :34:
  `import { ghResult, ghFromEnvironment } from "./gh-runner.mjs";`
  `runGh = ghFromEnvironment(env, { timeoutMs: ISSUES_READ_LIMIT_MS })`
  Why undetected: every watch and extension test injects runGh, so the default runner is never exercised. Effect (inferred, not run in pi): each 30 s poll blocks pi's event loop for up to 1.5 s, and stop cannot abort the child.
- O (R-2996 "a builder or reviewer never runs it"; plan 6/8 children), packages/nana-pack/bin/nana-issue-watch.mjs:20:
  `if (true) {`
  Confirmed by hand: with NANA_ROLE=worker and an opted-in project, the mutant CLI keeps polling; restored code exits 0 at once. The rule pins the sentence, so this guard is defence in depth.
- P (R-2995, "every other project gets today's block, byte for byte"), packages/nana-pack/lib/frontier-summary.mjs:106:
  `const watchLine = pointer ? \`Issue watch background monitor: ${watchCommand(root)}\` : null;`
  Confirmed by hand: a HANDOFF whose Open section holds `https://github.com/example` (the R-2994 malformed fixture) gains a watch line; the watch it names then prints "no issues pointer". No R-2995 or golden case uses an unreadable pointer.
- V (R-2992/R-2990, the CLI must keep polling until its run time), issue-watch.mjs:51:
  `const later = (fn, delay) => { const timer = clock.setTimeout(fn, delay); timer?.unref?.(); return timer; };`
  Confirmed by hand with a fake gh: the mutant CLI exits 13 after its first poll with no output and no restart line (unsettled top-level await); restored code keeps running. Tests use a fake clock and only run the CLI on a non-opted project.
