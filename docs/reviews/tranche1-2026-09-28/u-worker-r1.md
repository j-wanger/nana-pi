# Lane U report: pi upgraded to 0.87.1 and compatibility fixed

The upgrade needed three compat fixes, each in a file on the allowlist, and **none in the extensions**. `npm test` exits 0, 10 of 11 desk e2e files passed on the final run (the 11th failed one check, then passed 3 reruns), `pi --version` prints 0.87.1, and doctor says all good. Committed as `6c4d01d` on `lane/pi-upgrade-0.87` (not pushed).

**Global upgrade (rollback: `@0.84.4`):** `npm i -g @earendil-works/pi-coding-agent@0.87.1`. Before that, `npm ls -g` showed 0.84.4 under `/Users/jwang/.local/lib`. `lane/l4-test-path` was already on main, so nothing needed merging.

## Before and after
| suite | baseline on 0.84.4 | final on 0.87.1 |
|---|---|---|
| `npm test` | 55 files: 54 PASS, 1 SKIP (`study-tasks`), 2382 checks, exit 0 | 56 files: 55 PASS, same SKIP, 2399 checks, exit 0. Superset: the extra file is my new test. |
| desk e2e with no model (the other 3 of the 14 need a model) | 11/11 exit 0 (checks: 21/35/20/35/46/9/10/30/11/13/7) | 10/11 exit 0. `subagent-render` failed 1 check ("post-compaction meter shows estimate"), then passed 3/3 reruns (13 PASS each). That test sets `sessionFile: null`, so it never reaches the code I changed; I take it as a timing flake. |
| doctor (run from `~/nana-pi`) | all good | all good |

Doctor run from the worktree lists 6 missing items because it checks install paths against the worktree. That is expected, and it doesn't pin any pi version.

## What broke and the fix for each
All three came from checking real 0.87.1 behaviour. The existing tests passed on 0.87.1 without changes, but they did not cover these entry and event types.
1. **Desk showed new session entry types as bare rows.** 0.86 writes the prompt and tool setup as a `role:"system"` message and cache-warm spend as `usage` entries; 0.87 adds `context_edit`. The page drew the last two as bare `— usage —` / `— context_edit —` rows. pi's own terminal UI draws none of the three by default.
   - Fix: `server.mjs` `isPiBookkeeping` leaves them out of `/api/transcript` entries but still uses them to trace the active branch (any of them can be the last entry the next message chains to).
   - Test: `apps/desk/test/pi-087-entries.test.mjs` (11 checks) uses a session written by pi's own `SessionManager`. With the fix disabled, 4 checks fail.
2. **Bench under-counted cost.** Cache warming is on by default in 0.87.1 (`"streaming"`). Its spend reaches `--mode json` output as an `entry_appended` event, not as an assistant message, so the bench missed it.
   - Fix: `usage.mjs` adds it to the run's own `tokens` and reports a new `diagnostics.usageEntries` count (`run.mjs`).
   - Test: 6 new checks in `usage.test.mjs`. No existing assertion was changed.
3. **Documentation:** the desk and bench README Dependencies rows now say 0.87.1, plus a desk contract note. The research doc has a dated addendum at the end.

Still unchanged and re-checked on 0.87.1: the imported pi functions still exist and the session format is still version 3. pi's rule for the last entry of a session is the same, and `agent_settled` is still the end-of-run marker. `nana-notify` and `nana-post-edit` needed no changes.

## What the settle-gate lane can rely on (read from 0.87.1 types and source)
- `pi.on("agent_before_settle", h)`. The event has `{type, entries, continue, context:{contextEntries, contextMessages, llmMessages, pendingMessages, canContinue}, outcome:"completed"|"aborted"|"error"}`.
- A handler returns `{entries?, continue?}`. The entries it can add are `custom`, `custom_message`, `context_edit` or `compaction` drafts. The usual pattern is `{entries:[...event.entries, draft], continue:true}`.
- Handlers run in load order. Each one sees the previous handler's `entries` and `continue`, and the context is rebuilt after each.
- If a handler throws, pi reports an extension error and keeps the previous values.
- If any entry is invalid, pi drops all entries and forces `continue:false`.
- If `continue:true` is returned while `canContinue` is false, pi reports an error and settles anyway. An abort during the handler also settles.
- **pi has no loop guard.** It keeps looping (`agent.continue()` → `_runBeforeSettleBoundary`) for as long as the handler returns `continue:true`, so the gate must count its own continuations.
- `agent_settled` only notifies. A run requested from it is deferred until all settled handlers finish.
- `turn_end` is also actionable. It adds `turnIndex`, `message`, `toolResults`, `messageEntryId` and `toolResultEntryIds`.
- `context_edit` is `{targetId, replacement|null}`. `null` hides the target from the model; the latest edit on the branch wins. It changes only what the model sees next, never the saved history, and `sessionManager.appendContextEdit(id, null)` exists.

## Live smoke test
`pi -p … "say ok"` from a temp dir printed `ok`, exit 0. The journal got `session_start` and `objective_pickup`, then `session_shutdown`.
- The brief's command as written hung: stdin was an open pipe, and pi waited for it to close. I killed my own PID and reran with `</dev/null`.
- The objective heading is **not** stored in the 0.87.1 session file. A second small model call confirmed the model still receives it (it answered "YES" and quoted the heading). The pi docs confirm that a returned `systemPrompt` replaces the prompt for that run but is not recorded in the session file.

## `git diff --stat`
8 files, +180/−9: bench README 18, `usage.mjs` 11, `run.mjs` 2, `usage.test.mjs` 18, desk README 20, `server.mjs` 12, the new test 95, research addendum 13.

## Left open
- **Version minimums left at 0.84.4.** `PI_MIN_VERSION` stays 0.84.4 in `pi-session.mjs` and `bench/lib/pi-exports.mjs` (the second isn't on my allowlist). Raising it would stop the desk starting after a rollback to 0.84.4, and the functions it imports haven't changed.
- **Files outside the allowlist still say 0.84.4:** root `README.md:49,55` and several "verified against 0.84.4" comments.
- **Bench study pins:** past bench study files still pin `pinnedPiVersion` 0.84.4, so re-running them will now abort. That's by design; no re-runs were in scope.
- **Pack README:** it has no version row. Its line 59 skill-trust claim was verified on 0.84.4 and I haven't re-checked it.
- **Live desk service:** `com.nana.pi-desk` still has 0.84.4 loaded in memory. It switches to 0.87.1 on its next restart, which I didn't do.
- **Objective and handoff injection:** both still replace the whole system prompt. The 0.87 docs prefer editing prompt sections, which keeps the prompt cache warm; that's a possible follow-up, not a break.

**Claim most likely wrong:** that the `subagent-render` failure is a flake. It failed once and passed 3 reruns, and its session file is null, but I didn't find the root cause.

VERDICT: DONE
