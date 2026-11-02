Round 2 closes the round 1 MUST and both SHOULDs, and the preamble now says one thing about pushing. I'm still sending it back: the tip fails two suite checks on every CI leg, and main passes both.

**Answers to the brief's questions**

- **The round 1 MUST is closed.** When the ledger's child is `claude` (including `.exe`/`.cmd` forms), the ledger now writes private sealed flag settings with the same carry function claude-review uses. Those settings override a credential helper or askpass that Claude's user or project settings name. The new `ledger-claude` case covers all six fixture routes. It fails with the fix disabled (`build-2-ledger-mutation.txt`) and passes on this tip, which I re-ran on macOS.
  - claude-review's settings file already holds every control, so the ledger keeps it unchanged, along with its byte log.
  - Settings a caller supplies keep their other fields, and the sealed env is applied last.
  - The temp folder is cleaned on exit, on signals, and by the Windows watcher. That watcher only removes the folder: no build record, no lock.
  - I found no new way for a child to read a stored credential.
- **SHOULD 1 (README push line) is closed.** `README.md:318` now matches the rule, and M5's scan now covers the root README.
- **SHOULD 2 (gate forms) is closed.** All five named forms are blocked and the named near-misses stay allowed. I checked this with a probe through the real gate.
- **The preamble is consistent on pushing.** The only push instruction is `builder-preamble.md:35`, "Do not push; the seat pushes after verifying". The credential sentence has no push clause. R-3650 pins it word for word and passes. R-3650's row never needed the removed clause.

**MUST: the suite fails on two checks that pass on main**

Main's CI is green at the merge base 6dc5953c. On this lane's tip, two checks fail on every platform:

1. **`test-runner.test.mjs`, check "the source check detects direct mkdtemp calls…" (R-917).** Both new test files import with single quotes: `import { tmpDir } from './tmp-dir.mjs';` (`credential-gate.test.mjs:13`, `credential-strip.test.mjs:15`). The source check at `test-runner.test.mjs:669` looks for the exact double-quoted line.
2. **`context-anatomy.test.mjs:118` (R-3211).** Its exact comparison of claude-review's settings env now also finds the credential controls this lane adds on purpose: `GIT_CONFIG_*`, `GIT_ASKPASS`, `SSH_ASKPASS`, `GIT_TERMINAL_PROMPT` and `GCM_INTERACTIVE`. The test's expected value is out of date.

- **Evidence:** CI run 41408207482 at e50afc24 failed the suite on macOS, Ubuntu and Windows with exactly these two checks, and run 41407399243 at 3289f566 failed the same way. I reproduced both on macOS at 8bfa9071. CI for this tip is still queued.
- **How this happened:** both failures date from build 1 and were already red at round 1, so strictly they sit outside round 2's diff. Round 2 edited both credential test files but left the imports. The builder found the R-3211 failure (`build-2-compat.txt`) and passed it to you, because brief 2 did not allow that file.
- **Consequence:** `nana-land` refuses this tip while its CI is red. Landing it anyway would turn main's suite red, and the Windows suite leg blocks release.
- **Fix:** two small edits. Switch both imports to double quotes, and add the credential controls to R-3211's expected env. Each needs its own confirmation round.

**SHOULD / NOTE (known-bug lines, do not block)**

- **SHOULD:** the gate still allows three nearby forms, which I confirmed with the probe: `git credential-store --file x get`, `gh auth status -t` (the short form of `--show-token`), and `git credential-cache get`.
- **NOTE:** the ledger spots Claude only by the name of the command. `npx claude …`, `node <path>/cli.js` or an `env` prefix skip the sealing. Arguments after a `--` would also make the appended `--settings` part of the prompt text.
- **NOTE:** direct `review-ledger run -- claude` reviewers now get claude-review's ancestor `claudeMdExcludes` and `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`. Brief 2 asked for this, but the pack README's credential section doesn't state this new behavior for direct runs.
- **NOTE:** M5's banned-phrase check `Push with plain git push` has no backticks, so it would not have caught main's "Push with plain `git push`" sentence. R-3650's word-for-word pin covers that now.

**Checks I ran**

- `credential-strip`, `credential-gate` and `worker-lane` tests: pass, 75 checks.
- `test-runner.test.mjs`: 52 pass, 1 fail (R-917).
- `context-anatomy.test.mjs`: 10 pass, 1 fail (R-3211).

VERDICT: SEND-BACK
