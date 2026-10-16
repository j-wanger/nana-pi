### MUST

1. **A relative agent directory can make the notice show a different builder from the one the lane starts.**  
   `packages/nana-pack/lib/agent-dir.mjs:67-82`; `packages/nana-pack/bin/pi-worker.mjs:96-106`

   A relative `PI_CODING_AGENT_DIR` resolves against each process’s cwd. The notice may resolve it in the seat’s project, while `pi-worker` resolves it in the lane worktree. Honest files can therefore produce lineup A in the notice and launch lineup B. The plan explicitly includes relative values in scope, but L15 tests parity only for one roster file. Residual 18 does not close the wrong-lineup failure. Add a cross-cwd contract and test that either preserves one resolved roster or refuses before presenting an operational lineup.

### SHOULD

2. **The notice deliberately omits a field that determines which model actually runs.**  
   `packages/nana-pack/bin/nana-roster.mjs:118-124`; `packages/nana-pack/bin/pi-worker.mjs:98-106`

   Pi launches with both provider and model, while R-1195 requires the notice to ignore provider. Two honest providers can expose the same model ID, making materially different lineups indistinguishable. Either show a safe provider label or narrow the claim from “lineup” to the model names.

3. **Showing `scout` does not earn its cost because no seat route starts it.**  
   `packages/nana-pack/bin/worker-config.mjs:19-33`; `packages/nana-pack/bin/pi-worker.mjs:96-106`

   R-1194 and L1 require every configured scout to appear, but the repository has no scout launcher or shared rule. A user can reasonably read the notice as an active lineup. Omit scout until it has behavior, or state that it is configured but unused.

The revised rows otherwise have corresponding tests, and I found no additional existing check missing from the census.

VERDICT: SEND-BACK
