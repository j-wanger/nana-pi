Feature: FEAT-008 · Integrate and clean up reviewed changes

# Review brief 2: tool-fix-2 (confirmation round)

Review only `git diff 17612c1c..4fc8599e` on feat/tool-fix-2. Round 1 sent the lane back on one MUST. CI on 17612c1c (run 42826448231) confirmed it: `windows-selected` failed `lane-watcher.test.mjs` and also `lane-checks.test.mjs`.

Build 2:
1. MUST: `cleanLane` passes `platform` to `processStartedAt`; R-2726 asserts the fake receives `ps` arguments.
2. Round 1 SHOULD 2 and NOTE 5: profile detail also redacts the Git Bash short-name form, a short-name home after an earlier drive path, a short-name home before a quote, doubled backslashes, and the values of `sig`, `X-Amz-Signature`, `X-Amz-Credential`, `auth`, `#access_token=` and an `Authorization:` header. The privacy test covers each.
3. Round 1 SHOULD 3: `lane-checks.test.mjs` is restored exactly to main's version (8ea0c140), removing the process recorder that failed on Windows; one known-bug line in FEAT-006 records the remaining reused-ID risk in its teardown.
4. NOTE 4: restart recovery prints its `flake:` and `green after rerun` lines once.
5. NOTE 6: roster readers ignore `effort` on non-reviewer slots with one warning; `nana-roster set` still refuses it.

Seat re-ran on 4fc8599e: `lane-watcher.test.mjs` with `process.platform` forced to `win32` passes (R-2726 and R-2727); `profile-store-guards` passes; `git diff 8ea0c140 HEAD -- packages/nana-pack/tests/lane-checks.test.mjs` is empty.

Questions:
- Is the MUST closed, and does the Windows leg now pass both failing files?
- Can the profile detail still print a home path or secret in a spelling a Windows or POSIX git message would plausibly use?
- Does ignoring a stray `effort` on reading hide a roster mistake the owner needs to see?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.

Put exactly one verdict line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, as the last line, and no other line starting with "Verdict".
