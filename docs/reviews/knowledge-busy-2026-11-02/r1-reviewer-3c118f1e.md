I found one MUST: the new test file trips a suite check that main passes, so CI will be red on every leg. The fix itself works.

## Findings

**MUST — the new test turns the suite red on every leg** (`packages/nana-knowledge/tests/build-busy.test.mjs:80`)
- **Input:** that line calls `fs.mkdtempSync(path.join(os.tmpdir(), "nk-busy-"))` directly. The R-917 source check at `packages/nana-pack/tests/test-runner.test.mjs:666-672` fails any test file under `packages/*/tests` that does this.
- **Evidence:** CI run 41390908816 (10398568) failed the suite on ubuntu, macOS and Windows with "the source check detects direct mkdtemp calls…". On macOS and Windows that was the only failure. The line hasn't changed since cadd0b14. Running the same check against the files at 92175160 flags this one file and nothing else.
- **Consequence:** CI on 92175160 will fail on all three suite legs, including Windows, which blocks release. `nana-land` refuses to land, and a suite check that passes on main fails here.
- **Fix:** add `import { tmpDir } from "./tmp-dir.mjs";` and create the folder with `tmpDir(path.join(os.tmpdir(), "nk-busy-"))`. That helper is already in the folder.

**SHOULD — M2 (R-3591) already failed once on Linux CI.** At 10398568 the ubuntu leg reported `noPull=1, noRebuild=0`. That is the same `db.ts` as the tip. Windows CI passed 10 of 10 that run, with hooks taking 156–419 ms, and it passed 7 of 7 when I ran the file on this Mac. The Linux leg doesn't block release. Still, "every one of 10 runs" under churn on a busy runner can fail now and then. Record it as a FEAT-013 known bug.

**NOTE — dropping recovery's explicit 0 would go unnoticed.** Recovery's `openDb(paths.db, {})` now sets 100 ms first. If someone deleted the `PRAGMA busy_timeout=0` line, recovery would wait 100 ms, and the M3 recovery bound (`< BUILD_BUSY_TIMEOUT_MS / 2`) would still pass. The harm is small, because 100 ms is still fast.

**NOTE — the build's last checkpoint can now wait up to 5 s.** `wal_checkpoint(TRUNCATE)` in `buildOpen` now uses the 5 s timeout and may wait that long for readers, where main gave up at once. The build runs detached, so no prompt waits on it; it only holds `build.lock` a little longer.

**NOTE — the README's hook budget section doesn't mention the new waits** (`packages/nana-knowledge/README.md` ~180). It doesn't say a query can now wait up to 100 ms on a lock, or that a build can wait up to 5 s.

**NOTE — the Windows load run (M5) didn't pass.** Eight runs under 80 CPU-bound workers failed. The failures were mostly the objective, adoption and shared-memory hooks timing out, plus one R-1330 knowledge pull in run 1. R-1713 passed in every loaded run, and the session note reports all this honestly.

## Your questions

- **Hook budget under a long exclusive lock:** holds. The query open waits at most 100 ms each time it meets a lock, and `search` runs one statement, so at most about 200 ms in total. The hook's close doesn't wait for locks. M3 with a 3 s exclusive lock passes, and the mutation where the hook waits as long as a build (P3) fails it.
- **Recovery fails fast:** holds. It sets 0 again before `BEGIN IMMEDIATE`. The R-2403 checks are unedited and pass, and the mutation giving recovery the build's 5 s wait (P5) fails the M3 recovery check.
- **The build never waits forever:** holds. Each lock wait stops at 5 s. A busy error isn't treated as damage (`DAMAGE_CODES` is 1, 11, 26), so the build throws and releases its lock. The final checkpoint is the only busy error it swallows, and that wait is capped too. A build makes few lock attempts, far under the 10-minute lock TTL.
- **Nothing on the hook path can block a prompt:** holds. The hook never opens the index for writing. The pi extension runs the CLI rather than importing `db.ts`.
- **Evidence:** the main-code mutations fail on both platforms (8 of 8). `build-busy.test.mjs` passed 7 of 7 locally. Every install-check job passed on 695fcf6b. The suite legs on 695fcf6b were still running, and CI on 92175160 was still queued.

VERDICT: SEND-BACK
