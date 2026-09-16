### A. Stage-generation rule

**FINDING (MED) — `apps/desk/public/app.js:618`**  
The activity interval captures its generation, but a stale callback calls the global `stopActivity()` rather than merely retiring itself. If an old interval callback is already queued when the user switches sessions, and the new session starts activity before that callback executes, the stale callback can clear the new session’s timer and activity DOM. Changes fetches, reload/resource continuations, and focus handlers otherwise guard page effects correctly; reload bookkeeping is confined to its captured session object as documented.

### B. Server safety of the new endpoints

**FINDING (HIGH) — `apps/desk/changes.mjs:219-220`, `apps/desk/changes.mjs:173-177`**  
`collectChanges()` performs up to 1,000 synchronous `lstatSync`/`readFileSync` operations of up to 1 MiB each on the single Node event loop. A repository with 1,000 large untracked files can therefore synchronously read roughly 1 GiB on every refresh or `agent_settled`, freezing all sessions despite the stated bounds. Git subprocesses themselves are shell-free, time- and output-capped, and missing Git, deleted cwd, non-repositories, and no-HEAD repositories degrade without throwing.

**FINDING (MED) — `apps/desk/changes.mjs:273-275`**  
The per-file untracked path does not uphold “untracked symlinks never read”: `resolveInRoot()` accepts a symlink whose target remains inside the repository, then `newFileDiff()` uses `statSync` and `readFileSync` on the resolved target. There is also a check/read race for a regular path replaced by a symlink after `realpathSync`. Outside-root symlinks present during validation are rejected, and pathspecs and argument-array `spawn()` prevent traversal and shell injection. Both routes run after the global Host check; Origin checking intentionally applies only to state-changing methods.

### C. Reload correctness

**FINDING (HIGH) — `apps/desk/public/app.js:1043`, `apps/desk/public/app.js:2293`**  
A prompt can race an existing reload. `send()` awaits `checkResources()`, but `checkResources()` immediately returns when `S.reloading` is already true, allowing the user prompt to be posted while `/reload-runtime` is still executing `ctx.reload()`. This occurs naturally if the user sends during a manual or focus-triggered reload. Additionally, the prompt endpoint may return `{pending:true}` after five seconds, after which `runReload()` immediately reads commands even though reload may still be running. Mid-turn gains detected normally are deferred, failed enumerations do not become empty baselines, and successful reloads re-baseline before another check, so the ordinary path does not loop. `/reload-runtime` is safe in the TUI and does not collide with built-in `/reload`.

### D. Skill collapse

**FINDING (MED) — `apps/desk/public/desk-client.mjs:105-118`**  
The parser uses the first `\n</skill>` rather than the final wrapper close. A real skill body containing that text can either fail collapse or misclassify the remaining body as arguments when followed by a blank line. Separately, any genuine user message manually matching the wrapper shape is collapsed as though it were a skill invocation; there is no provenance check. Pi’s normal argument-present/absent forms and CRLF inside the skill body work because Pi supplies LF wrapper delimiters. Tolerant echo matching does not break explicit-rejection restoration, but canonically identical skill submissions from another tab—including whitespace variants Pi trims—can consume the optimistic bubble, extending the existing identical-content limitation.

### E. Thinking card / activity line

**PASS — `apps/desk/public/app.js:606-637`, `apps/desk/public/app.js:892-901`, `apps/desk/public/app.js:1177-1190`, `apps/desk/public/app.js:1335-1341`**  
Apart from the stale-timer cross-stage issue in A, normal cleanup is complete: `clearStage()`, `agent_settled`, and `desk_exit` stop the interval; polling `get_state` stops it when a turn ends without `agent_settled`; thinking cards own no timers and are replaced or removed by message/history rendering. `handleEvent()` records bottom-pinned state before rendering and restores it afterward.

### F. Tests

**FINDING (MED) — `apps/desk/test/changes-endpoint.test.mjs:1-336`, `apps/desk/test/reload.e2e.mjs:1-253`, `apps/desk/test/live-feel.test.mjs:1-110`**  
The tests cover happy-path rendering, stale changes responses, endpoint routing, basic traversal, caps, deferred reload, and normal skill wrappers, but they miss the important adverse invariants above: queued stale activity ticks, prompt-during-reload, reloads exceeding the server’s five-second prompt wait, cumulative synchronous untracked reads, inside-root untracked symlinks/check-read races, and embedded closing tags or wrapper-shaped genuine messages.

The `session-races.e2e.mjs` change is a real determinism fix rather than a wider timing wait. In those scenarios, the marked first history bubble can only be replaced by `renderMessages()`; the initial read has already produced that bubble and no unrelated rebuild is pending. Therefore `waitRebuilt()` cannot be satisfied merely by receiving the reconnect hello or another RPC response—the reconnect history read must have answered and rebuilt the pane.

### G. README/contract drift

**FINDING (MED) — `apps/desk/README.md:171`, `apps/desk/README.md:567`**  
“What it does” correctly says reload requires nana-pack, but Known Limits says `/reload` is “the only path for a session with no nana-pack loaded”; in code that command sends nothing and instructs the user to restart. The reload section also promises enumeration “at most once per 3 s per session,” while settings changes invoke `checkResources({force:true})` and bypass that throttle. The activity, thinking, skill-collapse, changes, and stage-generation behavior is otherwise documented in the appropriate sections.

## VERDICT: BLOCK

### BLOCK/HIGH findings to fix before landing

1. **B:** Replace the possible ~1 GiB of synchronous untracked-file reads on the event loop with bounded asynchronous/concurrent work or a much smaller aggregate budget.
2. **C:** Serialize prompt submission with in-progress resource checks/reloads, and do not treat a detached `{pending:true}` reload command as completed.

### MED/LOW findings that may land as-is

1. **A:** A queued stale activity interval can clear a new session’s activity.
2. **B:** The file endpoint follows inside-root untracked symlinks and has a check/read race.
3. **D:** Skill parsing mishandles embedded `</skill>` text and can collapse wrapper-shaped genuine content.
4. **F:** Adversarial and concurrency coverage is incomplete.
5. **G:** Reload requirements and throttle behavior contradict the README.
