Round 6 is committed as `c6e7d7d`. All four MUSTs are fixed, and `npm test` exits 0: 71 files, 70 PASS, 0 FAIL, 1 SKIP; 4377 checks pass, 0 fail, 6 skipped.

**How pi's `/trust` works** (installed pi, `~/.local/lib/node_modules/@earendil-works/pi-coding-agent/dist`):
- **Resolve:** `config.js:421-428` `getAgentDir()` returns `PI_CODING_AGENT_DIR` with `~` expanded; a relative value stays relative. `main.js:458,564` builds the store from it, and `trust-manager.js:173` resolves it against the directory pi was started in (`paths.js:82-86`). `/trust` (`interactive-mode.js:2529` → `:4298-4308`) records the session cwd.
- **Read:** `trust-manager.js:178-182` reads the store while holding the lock (`:70-93` throws on bad JSON or bad values), then takes the nearest record for the folder or a parent (`:20-33`).
- **Lock:** `:105-142` first creates the store's folder, then `proper-lockfile` creates `<store>.lock` as a directory (`lockfile.js:25-97`; stale after 10 s, `:208`). If something is already there and is recent, pi retries 10× then throws `ELOCKED`; if it is stale, pi deletes it as a directory and retries. So only an absent path or an empty folder can ever be taken.
- **Write:** `:187-200` then `:94-104` create the folder and write the file in place, under the same lock.

**The MUSTs:**
1. **Remedy moved the store.** Before, the label said "start pi in `/repo`", which with a relative override writes to `/repo/agent`. Now every remedy names the store that must receive the decision. With a relative override it also gives `PI_CODING_AGENT_DIR=<absolute agent dir>` and explains why (new helper `piAgentDirIsCwdRelative()` in `lib/gate-paths.ts`). Test T16 runs the whole sequence with both runtimes and pi's own write:
   - The nested session is labelled.
   - The old advice writes `<product>/agent/trust.json`, and the nested session is still labelled.
   - Following the new advice with the printed path writes the active store.
   - The original nested session, restarted as it was, is no longer labelled, and pi's `get()` returns `true` there too.
2. **Blocked lock path.** Before, a valid store with a `true` record returned vouched. Now `lockObstruction()` checks `trust.json.lock`: a file, a link or a non-empty folder means "lock path obstructed". That labels even a recorded `true`, and the remedy names the lock path and what occupies it. An empty folder counts as usable. Test T17 covers 3 kinds × with/without a record, and checks that pi's `get()` and `set()` both throw. A stale empty lock folder stays unlabelled, and pi agrees.
3. **Dangling link.** Before, it was treated as a missing folder and got ordinary `/trust` advice. Now a broken link on the agent-dir path is reported as "dangling link" and named in the remedy. I checked separately that Node's recursive `mkdir` fails with `ENOENT` through such a link. Test T18 covers a broken link as the agent dir and above it, and checks that pi's `set()` throws `ENOENT`.
4. **Docs.** `AGENTS.md` now states the umbrella default under the active agent dir and covers the new cases. The README's clearing language is now conditional, including "only while pi itself can read it". The removal advice says to re-check and back up first, since removal discards declines too. Both remedy and docs now say `/trust` also makes pi load the folder's project resources.

**Tests actually catch it:** with the lock and dangling-link checks switched off, 34 checks fail. With the path pin switched off, T16 fails; that run also crashed the test file, so I guarded T16 to fail without crashing.

**Size and checkpoint:** this round changed 5 files (+238/−51). The lane is still 11 files (+855/−36), so no new files this round; the lane was already past its ceiling. I stopped here rather than take on anything further. What remains, as a checkpoint:
- The deny-policy defect at `config.ts:276` (astra rates it HIGH) is a separate item needing its own fix.
- Behaviour on ACL-controlled folders, read-only volumes, root and Windows is still unverified; a test harness for that would be a separate lane.

**Remaining gaps:**
- An empty lock folder with a future or fresh timestamp counts as usable, but pi would throw `ELOCKED` on it.
- A `trust.json` that is itself a broken link is not diagnosed.
- The folder-writability check is a pre-check, not proof that pi can create the lock.
- Under a relative override, the Claude hook resolves the agent dir against its own working directory; the tests only check that when the hook runs in the session folder.

**Claim most likely wrong:** that "empty folder = usable" is pi's real behaviour. A freshly left lock folder makes pi throw for about 10 s, and one dated in the future blocks it indefinitely, while we would report the record as vouched.

VERDICT: DONE
