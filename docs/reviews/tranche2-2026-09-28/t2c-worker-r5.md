Round 4 is committed as **`20a8694`** on `lane/t2c-provenance-label`, not pushed. The label now reads pi's active trust store, and a stale default store can no longer hide it. `npm test` passes.

- **Reproduced at `2fc8e07`, then fixed:**
  - Affirmative in the overridden store, default store absent. Before: `{"vouched":false,"store":".../home/.pi/agent/trust.json"}`. After: `{"vouched":true,"store":".../alt/trust.json"}`.
  - Decline in the overridden store, stale `true` in the default (the fail-open). Before: `{"vouched":true,…home/.pi/agent/trust.json}`. After: `{"vouched":false,"store":".../alt/trust.json"}`.
  - Putting the old store path back makes 56 checks fail, including "default true, active false: LABELLED".
- **Shared resolution:** `piAgentDir()` and `piTrustStorePath()` now live in `gate-paths.ts` and follow pi's own code: the env var, `~` expansion, `file://`, and a relative value resolved against the process's working directory. Both the gate's `altTrustStores()` and `trustRecord()` use it. The gate had its own gap: it did not expand `~`. With the old gate code, the new tilde check fails ("the gate protects the store the label reads"); now it passes.
- **Parent cases** (each text ends "…, then start pi in <dir> itself (not a subfolder), run /trust there, and restart the session."):
  - **Path is not a folder** (`~/.pi/agent` is a file, the override is a file, or a file sits above it): "pi's trust store belongs at S, but O is not a folder, so /trust cannot create the store — move O aside first (check what it holds before you do)". O is the path that exists.
  - **Folder or volume not writable:** "…but the folder O is not writable (another owner, its permissions, or a read-only volume), so /trust cannot record a decision — make that folder writable first (this may need rights you do not have)". A folder problem takes priority over a store problem.
  - **Store present but not writable:** "the trust store S is not writable, … make that file writable first (on a read-only volume or another owner's file this may need rights you do not have)".
  - **Owned by another user:** now says "have it repaired or removed first (this may need rights you do not have…)".
  - **Other store problems:** still say "repair or remove it first". Each case's exact text and its `object` are pinned in the tests.
- **Wording fixes:**
  - The README now says pi's rewrite *can* shrink a valid oversized store below the cap.
  - `AGENTS.md` and the README say "pi's active trust store" and mention `PI_CODING_AGENT_DIR`.
  - `project.mjs:309` and the two templates now say the label "names the next step it can see", not that it always says how to clear it.
- **`npm test`:** 71 files, 70 PASS, 0 FAIL, 1 SKIP; 4228 checks pass, 6 skip. The objective test alone has 842 PASS, 0 FAIL. New tests cover every default/active combination (absolute and `~` forms), a relative override, pi's own `/trust` writing the active store, and each parent case.
- **Residuals:**
  - The read-only volume case is untested; it relies on the same write check reporting a read-only file system.
  - `objectivePath()` still uses the default `~/.pi/agent` for `nana-objective.md`. That was out of scope.
  - The advice can go stale if the store changes after it is read (once per session).
  - `nana-setup trust <dir>` is still deferred.
- **Claim most likely wrong:** with an affirmative store in a folder that is *not writable*, we clear the label, but pi's `get()` takes a lock in that folder and would throw. pi would then treat the project as untrusted, so the two disagree. I did not change the check because the brief limits this round to which store is read, and I have no test for this case.

VERDICT: DONE
