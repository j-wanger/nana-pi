**Review: bench-study-scratch, round 1, at aecc5ca5 against main fc06e29d**

**Scope.** I read the test diff, the three new requirement rows, the regenerated tree, the six known-bug files, the HANDOFF change and the session entry. I ran the test file, and checked all three wrong versions in throwaway copies under the OS temp folder.

**Does the test still touch a shipped study? No.**
- Section 11 now passes `studyDir: outDir`, an empty scratch folder under `root`. `root` comes from `mkdtemp` in the OS temp folder, and `finally` removes it.
- `absoluteStudy` resolves `fixture.dir` and `sidecarExtension` against the shipped folder.
- The trailing `fs.rm` of the shipped `raw/code-bugfix` is gone.
- `executeRun` uses the fixture through `verifyFixture`, `hashDir` and `materialize`, and I found no write in any of them. The write-capable code in `lib/fixture.mjs` sits behind its `build` subcommand.
- The workspace-diff read for the R-533 check now goes through `outDir`.
- No other test in the suite writes into `apps/bench/studies`:
  - `catch-ledger.test` copies its study to temp and sets `CATCH_OUT`.
  - `argv`, `plan`, `study-tasks` and `identity-scan` only read.
  - So R-2772 should not flake under `--jobs=4`.
- A clean run of `orchestration-paths.test.mjs` exits 0. R-2770, R-2771, R-2772, the three shipped c7 checks and the R-533 diff check all PASS.

**Do the three checks fail for the wrong versions they name? Yes, each one.**
1. **Wrong version 1** (`studyDir` set back to the shipped study): R-2770 FAILs and the file exits 1.
2. **Wrong version 2** (an `fs.rm` of the scratch `raw/code-bugfix` before the checks): R-2771 FAILs.
3. **Wrong version 3** (a listing without folders, tested with a folder made and removed inside the shipped study):
   - With the files-only listing, R-2772 PASSes, so a files-only check would miss it.
   - With the shipped listing, in a clean copy, R-2772 FAILs.
   - This confirms by running what the seat had confirmed only by reading.

**Findings**
- **NOTE.** Under wrong version 1, R-2772 never runs. The scratch-path read of `workspace.diff` throws ENOENT first, and the error goes up through `try/finally`. The plan says R-2772 turns red on CI. In fact the file fails earlier, through R-2770 and the thrown error. Detection still holds; only the plan's wording is off.
- **NOTE.** The `rec.evidence ===` part of the R-2770 check is a constant. All the check's strength comes from the evidence files existing on disk under the scratch folder. That is the right design, as the adversary's S4 says.
- **NOTE.** The FEAT-039 known-bug line says the page is written "before nana-land checks the reviews". `nana-land.mjs` checks review records once before the suite runs. It checks them again under the lock after the suite and before the merge. The consequence still holds: a refusal after the suite, from a changed main or source tip or a failed re-check, leaves a page for a tip that never landed. The wording could say "before nana-land's final review re-check".

**Known-bug lines I checked against the code**
- **FEAT-034:** the main checkout's tool-profiles `raw/` has no `code-bugfix` folder, and 12 records in `results.jsonl` point into `raw/code-bugfix/...`. True.
- **FEAT-017:** `state-manifest.mjs` names `apps/desk/lib/stage-keys.mjs`, but the module is `apps/desk/stage-keys.mjs`. It also lists handoffs as pi-owned and disposable. Both true.
- **FEAT-001:** R-019 requires each objective pickup to be journaled. I found no `objective_pickup` journaling under the setup Claude hooks or the pack's `bin/`. Consistent with the line, though I did not run the hook.
- **FEAT-002 and FEAT-024:** I did not check these. Both are already marked "inferred" or "read, not run", which is honest.

**Records.** The tree movement matches the three new rows. The old 10-23 Landed line moved word for word into the session archive.

No MUST stands.

VERDICT: LAND
