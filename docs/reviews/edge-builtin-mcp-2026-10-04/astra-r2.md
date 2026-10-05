## Round 2 review

The acquired-lock fix and general-spawn regression test work. Deployment still has an unsafe transition window, and unreadable-lock remedies overstate what inspection established.

### MUST — Quiesce the desk before changing either checkout

**Locations:** `docs/reviews/edge-builtin-mcp-2026-10-04/worker-report.md:411–421`; `apps/desk/apps.mjs:177–182,285–305`.

The corrected steps now cover the manifest cache, old `spawnChild()`, and manifest writeback. However, they prohibit spawning only **between manifest replacement and restart**. The incompatible transition begins at the first merge.

A child spawned after nana-pi updates but before the restart can combine:

- the running listener’s retained adapter manifest;
- the running server’s old `spawnChild()`;
- freshly loaded nana-stage, which no longer recognizes adapter results.

**Executed evidence:**

- Loaded a temporary adapter manifest, replaced its file, and confirmed the retained object still named the adapter.
- Called `writeManifestSession()` and confirmed it restored the old tools/extensions.
- Passed the same adapter-shaped block result through pre-lane and current stage processors: the former produced **one entry**; the latter returned **`null`**, leaving it unprocessed.

There is also an outstanding-writeback window: a spawn begun before step 3 can finish its awaited `get_state` afterward. “Create no session in between” does not drain that operation.

**Smallest fix:** Stop/quiesce the desk before either checkout changes, confirm pending children/writebacks have stopped, update both checkouts and the manifest, then start and verify. Keep adapter removal last. No hot-reload implementation is needed.

### MUST — Unreadable folders need uncertainty-aware remedies

**Locations:** `packages/nana-pack/lib/objective.ts:305–313,496–500`; `packages/nana-pack/tests/objective-golden.test.mjs:1086–1134`.

Treating a fresh unreadable folder as potentially held is correct. Reusing the existing held-lock remedy is not sufficient for every folder newly entering that classification.

**Executed evidence against installed pi 1.0.2:**

| Fixture | `trustRecord()` | Pi’s actual lookup |
|---|---|---|
| Fresh unreadable **non-empty** folder | `store locked` | `ELOCKED` |
| Same obstruction represented with stale mtime | `lock path obstructed` | `ENOTEMPTY` |
| Stale unreadable **empty** folder, affirmative record | `lock path obstructed` | Reclaimed successfully; returned `true` |

For the fresh non-empty case, the remedy says to wait and restart, then run `/trust` if the label remains. That fallback cannot clear the obstruction: aging changes `ELOCKED` into `ENOTEMPTY`.

For the stale empty case, the remedy positively claims both lookup and `/trust` fail and says to move the folder aside first. My actual lookup succeeded without that repair.

The conservative classification is defensible. Turning “cannot establish emptiness” into a definite failure or a definite recovery sequence is not.

**Smallest fix:** Distinguish uncertain unreadable-folder advice:

- Never move a fresh/future-dated potentially held lock.
- After waiting, re-evaluate the diagnosis rather than prescribing `/trust` regardless.
- For a stale unreadable folder, explain that reclaimability is unknown; do not claim pi necessarily fails.
- Add non-empty unreadable and affirmative-record stale-empty fixtures asserting the remedy, not merely its classification.

### SHOULD — The pack README contradicts the new stale-folder behavior

**Location:** `packages/nana-pack/README.md:740–743`.

It says a stale “empty-or-unreadable” folder counts as usable, with an unreadable non-empty exception. The implementation classifies **every unreadable stale folder** as obstructed; it cannot determine that exception.

**Evidence:** The stale-empty execution above returned `lock path obstructed`. The new golden fixture explicitly pins that classification.

**Smallest fix:** State the distinction between pi’s possible reclamation and nana’s conservative inability to establish emptiness. Align this paragraph with the corrected remedy.

## Round-1 closure

### R-760’s held-lock protection — closed

I independently acquired installed pi’s proper-lockfile lock using:

```js
process.umask(0o444);
lockfile.lockSync(dir, { realpath: false, lockfilePath: lock });
```

The folder had mode `333`; listing threw `EACCES`. `trustRecord()` returned `store locked`, and `trustRemedy()` prohibited removal. Pi’s lookup threw `ELOCKED`; releasing the acquired lock removed it successfully.

The future-dated unreadable fixture also stayed protected.

Restoring the old unreadable-folder classification produced **18 failing checks**, including the acquired-lock regression. R-760’s widened normative sentence matches this evidence. The remaining remedy defects concern what to do beyond that protection, not a recurrence of the original unsafe-removal bug.

**Hook parity:** All **1,157 objective checks passed**, including the real hook versus registered pi-extension handler byte comparisons.

**Cannot `lstat`:** Removing search permission from the containing agent directory made `lstat(lock)` throw `EACCES`. The earlier folder-access check returned `folder not writable`, named the agent directory, and warned that repair might require additional rights. Pi also threw `EACCES`.

**Win32, source inspection only:** The production classification has no platform-specific branch; a successful `lstat` followed by failed listing takes the same conservative path. The new chmod fixtures explicitly skip Windows. Native ACL behavior remains unverified; POSIX execution does not establish it.

### Aggregate-bound disclosure — closed

**Locations:** `packages/nana-stage/README.md:52–61`; `packages/nana-stage/lib/blocks.mjs:368–374`; `docs/agent-frontend-design-2026-09-04.md:120–128`.

The former assurance is replaced with the actual limitation: individual blocks and rendered text are bounded; block count and aggregate structured bytes are not.

My fresh 200-card probe produced **200 accepted entries and a 12,053,787-byte patch**, without an error. The revised disclosures describe that behavior accurately. No additional cap is required to close this documentation finding.

### General spawn path and R-944 — closed

**Locations:** `apps/desk/test/spawn-and-persist.test.mjs:268–286`; `REQUIREMENTS.md:910`; `apps/desk/README.md:572–575`.

The new test exercises `approve:false` without manifest trust. It accepts `builtin:mcp` while refusing a real project extension and `builtin:../x`.

I repeated the mutation that calls `refuseProject()` on the builtin branch:

- Existing app-listener suite: **75 passed**, still green.
- New general-spawn suite: **red**, including rejected builtin acceptance and missing expected argv.

The widened “a session’s resources” wording now matches the shared implementation and evidence.

## Executed verification

| Check | Result |
|---|---:|
| Objective goldens | 1,157 passed |
| Spawn-and-persist | 120 passed |
| App listeners | 75 passed |
| Stage blocks | 116 passed |
| Requirements trace/EARS | Passed; zero off-form rows |
| Code map | Passed; zero problems |
| README checker | Five declared missing-path findings |

Both mutations were restored; the working tree is clean. I did not rerun the full suites or model-driven edge e2e in this round. No live desk, machine configuration, or live checkout was changed.

VERDICT: BLOCK — 8/10
