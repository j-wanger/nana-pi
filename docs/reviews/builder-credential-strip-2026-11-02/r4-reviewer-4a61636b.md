The merge keeps the lane's behaviour and rows as round 3 accepted them. It brings main in whole, including the rows and ruling main deleted. I found no MUST and no harm the review standard lists.

I reviewed `git diff 3dbb388b HEAD` and ran `git show --remerge-diff` on the merge commit `ae825c89`, then compared each side against the merge base `6dc5953c`.

## What I checked

- **Files:** HEAD differs from main (`68a616bc`) only in files this lane changed, plus the `merge-4-*` records and `review-brief-4.md`. Every lane file still differs from main. Main's own files keep main's content, including what main deleted.
- **Requirements:** the set of rows in the merge is exactly the base, plus both sides' additions, minus both sides' removals:
  - Lane: R-3436, R-3437 and R-3660 to R-3667.
  - Main: 33 rows added and 12 removed, including its new R-1140 wording.
  - Nothing is missing, nothing extra, no ID appears twice.
  - R-3660 to R-3667 sit where the lane put them, under FEAT-006. Git's automatic merge had misplaced them and the resolution moved them back.
- **`pi-worker.mjs`:** main's `workerEnv`/`prepareWorker` refactor is kept. The lane's credential strip still reaches all three places it covered:
  - the plain-mode default env (line 95), unchanged;
  - the pi lane builder;
  - the Claude lane builder, via `sealed` (line 215). That env flows into `childEnv` and the Claude settings carry, as before.

  The only change is key order: the credential keys now come after the `BASH_*` keys. They are `GIT_*`, `SSH_ASKPASS` and `GCM_INTERACTIVE`, which can't collide with `NANA_*`, `BASH_*` or `CLAUDE_CODE_DISABLE_AUTO_MEMORY`. So the values are the same.
- **Rulings:** main's 2026-11-02 roster-slot ruling is kept. The lane's 2026-11-02 CI ruling replaces the old 2026-11-01 one, which the lane meant to retire. `AGENTS.md`, the pack README and `templates/_shared/working-under-nana-pi.md` merged automatically; each side's changes come through with identical content.
- **Sessions archive:** base 257 entries, plus 1 from the lane and 2 from main, gives 260. Every lane and main entry is in HEAD unchanged.
- **Test runs on HEAD:** all passed.
  - The touched tests (credential-strip, credential-gate, worker-claude, worker-lane, rulings, rulings-install, context-anatomy): 146 pass, 3 skip, 0 fail.
  - Main's tests (hive-city, nana-roster, nana-roster-set, roster-notice, requirements-tree, seat-rule, templates-render, roster-notice-hook, anatomy-seat): 384 pass, 0 fail.
  - `map:check`, `readme:check`, the requirements trace and the tree check all exit 0. The worktree stayed clean.

## Findings

- **SHOULD (record as a FEAT-006 known bug):** children started with main's new `pi-worker --slot` get no credential strip. This covers the scout, planner, adversary and checker.
  - At `packages/nana-pack/bin/pi-worker.mjs:134` the role env comes only from `workerEnv`. Then `prepareWorker` (line 408) replaces the stripped default `childEnv`.
  - Realistic case: a seat runs `pi-worker --slot planner …` on a Mac with the osxkeychain helper. That child's `git push` or `git fetch` to an HTTPS remote can use stored credentials, which plain `pi-worker -- …` children can no longer do.
  - The merge correctly kept main's behaviour, and its report says so. No lane row covers role children (R-3660 says "builder"). pi role children still get the gate floor, because `NANA_ROLE=worker`.
- **NOTE:** the Claude builder's settings file now lists its env keys in a different order. `worker-claude.test.mjs` compares the serialized text, so its expected `sealedEnv()` was reordered to match. No key or value changed.
- **NOTE:** in the sessions archive, main's 2026-11-03 entry now sits above the lane's 2026-11-02 entry, which is newest-first order. The text of both entries is unchanged.

VERDICT: LAND
