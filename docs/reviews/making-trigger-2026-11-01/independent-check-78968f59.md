FAIL: one material problem. A torn store file breaks seat saves and starts a daily spend loop. Everything else holds.

Evidence: the lane tests pass under a scratch HOME (memory-run, memory-run-seals, land, profile-sync, profile-store, memory-shaping). Two throwaway probes used the synthetic fixture. No real profile, transcript or model was touched.

## MUST

**M1. One unreadable JSON file under the profile clone's `projects/` breaks `nana-profile save` and makes every later run spend, then report "busy".**
- Where: `profile-store.mjs:40-41` (`exclusiveJson` opens with `wx`, then writes). A kill or an ENOSPC between those two calls leaves an empty or partial file, and nothing removes it.
- Readers: `readProfileStore` (`profile-store.mjs:60`) and `readMemoryFiles` (`memory-store.mjs:43`) throw on bad JSON. `mergeMemory` (`memory-store.mjs:47`) reads every project area, and seat saves now go through `mergeMemory(saved:true)` (`nana-profile.mjs`, save path).
- Probe, step 1: make once, then plant `projects/<id>/records/torn/<stamp>-aa.json` holding `{"id":"torn","cla`.
- Probe, step 2: `nana-profile save` gave exit 1 and printed `profile refused: git failed`, which is misleading. The same save works without the file.
- Probe, step 3: each later `make` called the model and then reported `memory: busy; done 0; pending 1`. `makeMemory:110` maps every error inside the second lock to busy or collision, so the same units go out again on every land, up to the day cap of 1M tokens per day.
- Probe, step 4: an empty file under `seen/` gave `status: memory: failed` on every run. Saves still worked in that case.
- Why it is in scope: the plan's threat model lists "a run killed at logout or shutdown". Background writes now happen at every land, so this is a new exposure for the owner's clone.
- Cheap fix: write to a temp file, then `link` it exclusively and unlink the temp. Or have the project-area readers skip and count unparseable files. Do not map a merge-phase throw to "busy".

## SHOULD

**S1. A run can outlive `MAX_RUN_MS`, and a second run can take over its lock** (`memory-run.mjs:96`, `acquireMemoryLock:31`).
- `beforeCall` only checks that elapsed time is under `MAX_RUN_MS`. A call that starts at 104 min runs for up to 5 more minutes, and then the merge follows.
- A second run can take over the "stale" live lock in that window. It re-sends the same units, which costs spend. `mergeMemory`'s unit-key check prevents duplicate records.
- Fix: check `elapsed + TIMEOUT_MS <= MAX_RUN_MS`.

**S2. If any clone-lock holder overlaps the second lock attempt, the whole run's spend is thrown away** (`memory-run.mjs:101`, `waitMs:0`).
- Probe: a lock grabbed during the model call gave `busy; done 0`. The next run re-sent the unit. No unit was lost, but the tokens were.
- A short wait for this local-only step would avoid it.

## NOTE

- **Land verdict:** the land is safe. `runLand` calls the starter only on `code===0` with a `feat/<lane>` branch, catches any throw, and only appends one fixed line.
- **Starter cost:** the starter does synchronous local reads only (pointer, root commits, run files). Its git calls go through `profileGit`'s timeout. It has no network step and nothing that can hang.
- **Tests:** they cannot start a real run. The CLI land tests use branch `integration`, so no lane is found. `scripts/test.mjs` scrubs `NANA_*` and `PI_CODING_AGENT_DIR` and fakes HOME. Under `CI`, `startMemory` and `runMemory` exit before any read.
- **Network outside the clone lock:** fetch and push both run outside it. A concurrent `nana-profile sync` can still fail once with "not pushed" if both fetches race on the `refs/remotes/origin/<branch>` lock. It is transient and loses nothing.
- **Malformed replies:** a malformed reply marks its batch done as unclassified, so a transient truncation drops up to one batch. This is the plan's stated choice.
- **Owner text:** none reaches stdout, stderr, run files, land output or the checkout. The starter's stdio is `ignore`. The runner is `claude` only, because `RUNNER` is sealed and has no environment override, and its child gets `NANA_ROLE=worker`.
- **Windows:** the starter spawns detached with `windowsHide`, and so do the grandchildren. No console window is expected. `spawnSync("claude")` will not start `claude.cmd`, so every Windows run fails and leaves units pending. That is the plan's assumption A6, and the land line shows it as failed.
- **Store paths:** paths are bounded by `PROFILE_PATH_POLICY` and the 16-character folder id.
- **Remembered land requests:** these are written to the clone's git dir and never pruned. The lane set grows without bound, but the cost stays small.
