## Review: seat-memory-push-a, confirmation round 2 (`f410db62..ceece7c8`)

Both round-1 findings are closed, and `save` behaves as it does on main. I found no new MUST.

### The round-1 MUST is closed (requirements tree)
- `docs/requirements-tree.md` now lists R-3410 and R-3411 under CAP-01, FEAT-040 and SUB-023. The counts are now 410, 87 and 22.
- `node scripts/requirements-tree.mjs --check` reports 0 problems.
- `requirements-tree.test.mjs` passes with no failures.

### The round-1 SHOULD is closed (the 12-character minimum)
- The new refusal at `packages/nana-pack/tests/profile-store.test.mjs:109` runs before the second, ambiguous record is written. So the 11-character prefix `abcdef12345` matches only the project record, and only the length rule can refuse it.
- I checked this with mutations in a temporary clone outside the worktree:

  | Change | Result |
  |---|---|
  | Accept any length of hex prefix (`{12,}` → `+`) | The R-3411 test fails at line 109 |
  | Drop `.toLowerCase()` from the match | The R-3411 test fails on the uppercase retract |
  | Restore build 2's filter, which runs on `save` too | The R-3230 save test fails with "git failed" |

### `save` works as on main
- `p.id` exists only for `confirm`, `retract` and `supersede`. For those three, `parse` requires exactly one positional id. `init`, `show` and `sync` return before the filter line.
- For `save`, the targets list is now `[]`, so `previous` and `id` are both undefined. That matches main, where `states.find(r=>r.id===undefined)` found nothing. The rest of the save path is the same as main.
- One difference remains, and it came in round 1, not here: `save` now calls `readMemoryStore` before `validateProfileSave`. This only matters when that read throws. It reads project areas through `onUnparseable` without throwing, so it can throw only where `readProfileStore(dir)` already throws on main. `mergeMemory` also reads the whole store anyway. So the realistic behaviour is the same.
- `profile-store.test.mjs` passes 20 of 20 on the tip, including the R-3230 save test and its refusal messages.

### Other checks on the tip
- The requirements trace passes, with 0 rows off form.
- These also pass: `known-bugs.mjs --root .`, `deliverables.mjs`, `identity-scan.mjs --root .` (0 findings), `map:check` and `readme:check`.
- The worktree stayed clean, and the temporary clone is removed.

### NOTE
- **README line break.** `packages/nana-pack/README.md:126` leaves "Events" alone on its own line. It renders correctly; it is only wording.
- **No quote cap on project events.** This round-1 NOTE is still open. Project-record events skip the `PROFILE_LIMITS.quote` cap that `writeProfileEvent` enforces. It is not in the known-bugs file yet, so the seat may want to add a line.
- **The R-3411 test name** still says "12-hex prefixes", while the row now says "case-insensitive … at least 12 characters". The trace matches on the name, so nothing breaks.
- **CI.** Run 41347317381 on ceece7c8 was still in progress when I finished. `nana-land` will gate on it.

VERDICT: LAND
