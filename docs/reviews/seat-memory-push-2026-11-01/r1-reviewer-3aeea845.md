## Review: seat-memory-push-a (`origin/main...f410db62`)

**The feature works.** A seat can retract or confirm a record by the short id it sees, and a builder or reviewer can no longer read or change the profile through `nana-profile`. The lane still has to go back, because the suite now fails on the tip.

### What I checked
- **Role refusal (R-3410).** The `NANA_ROLE !== undefined` check is the first statement in `runProfile` (`packages/nana-pack/bin/nana-profile.mjs:64`). It runs before parsing the arguments, before `init`, and before `resolveProfile`. So `show`, `sync` and `init`, which used to get past it, now refuse. The new test also replaces the pointer with bad JSON and still gets the role refusal, which proves the pointer is never read. Nothing else calls `runProfile` under a role: the fixtures strip every `NANA_*` variable, and `memory-run` and `nana-memory` import only `resolveProfile`.
- **Prefix lookup (R-3411).** The lookup reads both areas through `readMemoryStore` and needs exactly one match and at least 12 hex characters (`nana-profile.mjs:93-95`). An unknown, ambiguous or short prefix refuses before `commitProfile`, so nothing is written. A project record's event goes through `writeMemoryFile` into `projects/<folder>/events/<id>/`, and `commitProfile` stages that folder. `PROFILE_LAYOUT.events` and `STORE_LAYOUT.events` are both `events`. `readMemoryStore` hides the retracted project record, which the test asserts.
- **Wrong area through a shared id.** I checked whether a profile id and a project id could ever be the same, which would send the event to the wrong area. They can't: project ids hash evidence plus claim (`lib/memory-making.mjs:49`), and profile ids hash the claim alone.
- **Unchanged behaviour for a seat.** A full 64-hex id still matches exactly one record. Profile events still go through `writeProfileEvent`. `show` is untouched. The existing R-3230 to R-3234 tests pass.
- **Mutations**, run in a temp copy outside the worktree:

  | Change | Result |
  |---|---|
  | Restore the old check that let `show` and `sync` through | A1 fails |
  | Refuse only a non-empty role | A1 fails |
  | Write every event to the profile area | A2 fails |
  | Accept the first match instead of a unique one | A2 fails |
  | Remove the 12-character minimum | A2 **still passes** (SHOULD below) |

- `map:check` and `readme:check` pass, and the worktree stayed clean.

### MUST
1. **The requirements tree was not regenerated, so the suite fails on the tip.**
   - **Cause:** `docs/requirements-tree.md:67` still says SUB-023 has `Rows: 20 · IDs: R-3230–R-3249`. It does not list the new R-3410 and R-3411.
   - **Failure:** `packages/nana-pack/tests/requirements-tree.test.mjs` fails five R-291 checks: the committed outline differs from a fresh render, and the counts and IDs are off for CAP-01, FEAT-040 and SUB-023.
   - **Evidence:** it fails locally, and in CI run 41343316046 on the macOS and Ubuntu suite legs. Main's CI at the merge base b757e4d passed.
   - **Consequence:** something main does today, a green suite, no longer works. `nana-land` will refuse this tip, and the "tree check" in the build brief's Done-when list was not met.
   - **Fix:** run `npm run req:tree`, commit the result, then hold a confirmation round on the new tip.

### SHOULD
- **The test does not check the 12-character minimum on its own.** In the A2 test (`profile-store.test.mjs:120-123`), the short prefix `project.slice(0,11)` also matches the second record, so it is refused as ambiguous whatever the length check does. Removing `{12,}` keeps the test green. Record this as a known-bug line.

### NOTE
- **No quote cap on project events.** Retract, confirm and supersede for a project record skip the `PROFILE_LIMITS.quote` cap that `writeProfileEvent` enforces (`nana-profile.mjs:104,115`).
- **README id wording.** The README says the 12-hex id is "the claim's SHA-256 prefix". That holds for profile records only; project ids hash evidence plus claim.
- **Uppercase prefixes.** The prefix regex ignores case, but `startsWith` does not, so an uppercase prefix is refused as unknown. It is harmless, but the case flag is misleading.
- **Unrelated Ubuntu failure.** The Ubuntu leg also failed `worker-claude.test.mjs` (R-2720, the pi-worker SIGKILL `tree` case). This lane did not cause it, and macOS passed it.
- **Windows not seen.** The Windows suite leg was still running when I finished.

VERDICT: SEND-BACK
