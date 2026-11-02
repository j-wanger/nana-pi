The lane can land. I found no MUST: the golden retry can't hide a real byte difference, and the R-1713 check passes and fails on exactly the same condition as before.

**Does it work for the seat or builder?**
- **Golden corpus:** every retrying case now gets up to two more hook runs when its output holds either producer's "producer failed" line. The final run is the one compared byte for byte, and its follow-up checks read that same run. That covers the CI failures listed in `ci-fail-lines.txt`, including the path-payload and "product still governs" checks.
- **R-1713:** the tip's Windows CI run (41386581336) prints both states. `built_at` moved and the rebuild came 227 ms after the hook returned. So the next failure will show whether a build failed (`built_at` unchanged), never ran, or still holds `build.lock`.

**Do the changed checks still fail on wrong code?**
- **The retry can't pass a real difference.**
  - `runWithRetry` returns only the last attempt.
  - The hook writes nothing between attempts; neither producer CLI nor `objective.ts` writes files.
  - A retry fires only on the two exact marker lines. I tested the real `isLoadMarker` against realistic hook output:

| Output | Retries? |
|---|---|
| Objective marker alone | yes |
| Objective marker, then frontier marker | yes |
| Real block, then frontier marker | yes |
| Objective marker with CRLF line ends | yes |
| Real block only | no |
| `file not found` | no |
| Marker built from another repo root | no |
| Frontier tag followed by some other unavailable line | no |

- **Mutation run on this Mac:** a temp copy made with `git archive`, with `HOOK_PRODUCER_TIMEOUT_MS = 1`.
  - All 157 byte-identical checks failed: 144 after 2 retries and 13 with 0 retries. All 13 were T17 cases. None passed.
  - The tightened `CLAUDE_PROJECT_DIR` control also failed, as it should.
- **R-1713:** the pass condition, the title and `REBUILD_DEADLINE_MS` are unchanged in the diff. The state is read once before the hook and once after the wait, never while polling. The before-read closes before the hook starts, and nothing later in the file uses the knowledge home.

**Harms:** none found. `knowledge-state.mjs` only reads (stat calls and a read-only database open). The retry helper writes nothing, and the lane-folder scripts use temp homes and remove them. I ran this Mac's checks on the unchanged tip, except the mutation, which ran in a temp copy I have since deleted:
- `objective-golden.test.mjs` passed: 1,280 checks, exit 0, 32 s.
- `map:check` found 0 problems.
- The requirements, known-bug and code-map tests passed: 7 files.
- Every CI job on 2a1479f6 is green, including `suite (windows-latest)`.

**Findings (none blocks the land):**
1. **SHOULD: the stricter control can now flake under load.** The `CLAUDE_PROJECT_DIR` control (`objective-golden.test.mjs:692-694`) now needs `file not found` but still runs the hook once, with no retry. On main, a "producer failed" marker passed it without testing anything. On a loaded Windows runner that run now fails, and that is the symptom this lane removes elsewhere. It is about one hook run in roughly 140 per file, so the risk is small. Fix: run the control through `runWithRetry` with the same `isLoad`.
2. **SHOULD: no suite test checks the new parts directly.**
   - R-3540 and R-3541 cite checks that still pass with the new code removed.
   - `m2-retry.mjs` tests its own predicate, not `isLoadMarker`.
   - The Windows mutation only produces the "both markers" case.
   - If the objective marker's wording changes, the marker search finds nothing and the objective-only case quietly stops retrying. The corpus would then flake as it does on main; it would not start always passing.
   - The plan's named pins do fail with the feature removed, so this is a gap in what the suite covers.
3. **NOTE: the T17 exclusion is keyed on the label text `"T17 "`.** It also drops the retry from two T17 cases that refresh no lock (stale unreadable EMPTY and NON-empty). Keying it on whether a `refreshLock` is passed would be tighter. The plan already names T17 under load as a residual.
4. **NOTE: an occasional producer crash would be hidden from the golden corpus.** The retry treats it as load. The corpus doesn't test producer crashes, but the trade-off isn't written down anywhere.
5. **NOTE: an old record is gone.** FEAT-013's old line 202 (R-1713 failed once at 7d03134b) was replaced, not updated. `ci-fail-lines.txt` keeps the later five failures.
6. **NOTE: no HANDOFF or session-note change.** The land checklist wants these in the reviewed change before the final round. If the seat adds them, they need their own review coverage.

VERDICT: LAND
