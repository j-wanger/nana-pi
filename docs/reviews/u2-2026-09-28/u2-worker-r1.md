All six contract items are in and `npm test` exits 0. On `main`, the agent can edit the config that governs it when `PI_CODING_AGENT_DIR` is set; on the branch that is refused.

**Commit:** `c602c68` on `lane/u2-agent-dir` (off `ab01f1a`), not pushed.

**`npm test`:** `72 files: 71 PASS, 0 FAIL, 1 SKIP · checks: 4558 pass, 0 fail, 6 skip`, exit 0. The skip is the existing `apps/bench/test/study-tasks.test.mjs`.

**Trace check:** pi's `getAgentDir()` (in `dist/config.js`, around line 418) uses `PI_CODING_AGENT_DIR` expanded for `~` only, else `~/.pi/agent`. `settings.json`, `auth.json`, `models.json`, themes, tools and bin all hang off it. The seat's trace holds.

**Before → after, per contract item:**
1. **User config path:** was hardcoded `~/.pi/agent/nana-pack.json`; now `<piAgentDir()>/nana-pack.json`. The file header and README are updated.
2. **Policy floor:** was `altTrustStores()`, covering only `trust.json` and only when the env var is set. Now `activeDirPolicyFiles()` covers `trust.json` and `nana-pack.json`, in the active dir and at its realpath, whether or not the env var is set. The existing shape regexes are kept.
   - I also added `AGENT_DIR_VAR_RE` to the shell check. It catches `$PI_CODING_AGENT_DIR/`, `${…}`, `%…%` and `$env:…` followed by `nana-pack.json` or `trust.json`. Without it, `printf x > "$PI_CODING_AGENT_DIR/nana-pack.json"` got past the shell check.
3. **Mismatch note:** there was none, so the config was dropped silently. Now there is a new `config_agent_dir_mismatch` event: one journal line and one UI note per session, through the existing `surface()` path, naming both paths. The default file is not read and the gate is not stopped.
4. **`computeDecided`:** fallback was the hardcoded `~/.pi/agent`; now it falls back to `piAgentDir()`.
5. **Journal and receipts defaults:** were `~/.pi/agent/…`; now `piAgentDir()/…`. An explicit `journal.path` or `receipts.dir` still wins.
6. **`review-round.mjs`:** the one comment is added and the README says the ledger always stays in `~/.pi/agent`. Behaviour is unchanged.

**Probe for bypass B:** I ran the new `tests/agent-dir-config.test.mjs` against a `git archive ab01f1a` copy of `packages/nana-pack`.
- **On `main`:** 72 FAIL / 29 PASS. Edits, writes and `tee` to `$H/abs-agent/nana-pack.json` and its realpath `$H/real-absolute/nana-pack.json` were all allowed. The active config's `extraPatterns`/`protectedPaths` were not enforced (bypass A), and the stale default config was read in the missing-dir and file-as-dir cases.
- **On the branch:** 101/101 PASS.
- Coverage is the absolute, relative and tilde values, each pointing at a symlinked agent dir, for (a) through (d). There are also rows for a missing dir, a file as the dir, and the env var unset (behaviour unchanged).

**Existing test changed:** `gate-self-protection.test.mjs` wrote its user config to `~/.pi/agent` while `PI_CODING_AGENT_DIR=ALT` was set, so it depended on the old hardcoded path. I now write it to `ALT/nana-pack.json`. No assertion was removed or weakened, and it passes 101/101.

**Residuals:**
- `settings.json` and `auth.json` in the active dir are protected only by the shape regexes in `nana-gate.ts`, which I'm not allowed to edit. So `~/myagent/settings.json` is not on the floor. This needs a follow-up item.
- A shell `cd <agentdir> && … > nana-pack.json` is still not caught. This is the same residual already documented for `~/.pi/agent`.
- `loadUserObjective()` (used by `bin/nana-objective.mjs`) now reads the active dir's config too. That follows from item 1, but it changes behaviour for the Claude Code hook.
- The floor now also covers the realpath of a symlinked default `~/.pi/agent`. This only ever blocks more, never less.

**Scope:** nothing outside the allowlist.
```
 packages/nana-pack/README.md                       |  20 +++-
 packages/nana-pack/bin/review-round.mjs            |   1 +
 packages/nana-pack/lib/config.ts                   |  25 +++-
 packages/nana-pack/lib/gate-paths.ts               |  24 ++--
 packages/nana-pack/lib/receipts.ts                 |   6 +-
 packages/nana-pack/tests/agent-dir-config.test.mjs | 133 +++++++++
 .../nana-pack/tests/gate-self-protection.test.mjs  |   5 +-
 7 files changed, 191 insertions(+), 23 deletions(-)
```
Excluding tests: 5 files, about 76 lines changed. Spend was about $1.3 of the $12 budget.

**Claim most likely wrong:** that the relative case matches pi. `piAgentDir()` resolves against this process's `process.cwd()`, which I assumed is the same cwd pi resolves against. If the gate ever runs in a process whose cwd differs from pi's start folder (a desk or RPC host that has changed directory), the config it finds and the floor would point at a different dir than pi's.

VERDICT: DONE
