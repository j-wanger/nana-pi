# realpath-strict-fallback — build brief 1

Feature: FEAT-015 · Diagnose the active environment. Class: install, hook or gate. Rows: R-2180 to R-2184 (the block runs to R-2189).
Work in the lane worktree on `feat/realpath-strict-fallback`, following `packages/nana-pack/prompts/builder-preamble.md`. Run single test files only. Do not edit HANDOFF.md or docs/sessions/.

## Change
1. `packages/nana-pack/lib/real-path.mjs`, in `realPath`'s catch: on a native error other than ENOENT/ENOTDIR, try `realpathSync(abs)` with or without `mustExist`. If that also throws, rethrow the native error under `mustExist` and return `abs` without it. Leave the missing-file branch and `canonicalizeMissing` alone. Update `@errors` and the doc comment ("with mustExist, throws"). Add one line to the top note: where the native lookup fails, the fallback's typed spelling is used, so spelling guarantees hold only where the native lookup works.
2. New `packages/nana-pack/tests/real-path.test.mjs` with the six-tag header. It runs in-process and restores `fs.realpathSync.native` in `finally`.
   - R-2180: for each of EISDIR, EIO, EPERM and UNKNOWN, patch the native lookup to throw that code. Expect `fs.realpathSync(p)` with and without mustExist.
   - R-2181: build `real/loopdir/{a->b, b->a}` and `alias -> real` (a junction on win32, "dir" elsewhere). First assert that the original native lookup and `fs.realpathSync` both throw on `alias/loopdir/a`; if one does not, fail the check and name it. Then expect realPath under mustExist to throw the native code, and realPath without it to return the path unchanged.
3. New `packages/nana-setup/tests/realpath-fallback.test.mjs` with the six-tag header. It carries R-2182 to R-2184.
   - Start the CLIs from this checkout with fresh temp homes and projects. Set HOME and USERPROFILE, delete PI_CODING_AGENT_DIR and pass `--home`, as checkout-spelling.test.mjs does.
   - Forms: POSIX plus forced win32 on POSIX hosts; native only on win32.
   - At run time, write the preload into the test's temp root, as doctor-fix-line.test.mjs does. Write the checkout's `fs.realpathSync.native` result and "EISDIR" into it as JSON literals. The preload wraps `fs.realpathSync.native`: it calls the original, then throws an error with code EISDIR when the result equals the root or starts with root plus `path.sep`. Start each failing run as `process.execPath` with `["--import", pathToFileURL(preload).href, cli, …]`. Use no environment variable and commit no fixture.
   - Preconditions inside every check, which FAIL it and never skip it: a child with the preload gets EISDIR from `fs.realpathSync.native(root)`; install under the preload exits 0; the control doctor shows at least one ✓ hook, settings or skill row.
   - Each check takes a fresh home and runs install under the failure, then the control run without the preload, then the run with it.
   - R-2182: compare doctor's row label and status (the checkout-spelling regex). R-2183: the producer's stdout is empty under the failure and in the control.
   - R-2184: write it as `process.platform !== "win32" ? check(…) : skip("R-2184 — uninstall is POSIX-only")`. Expect exit 0 and the same would-unlink rows as the control.
   - Put each `// req: R-nnnn` marker directly above the line that holds `check("R-nnnn: …",`.
4. READMEs, with no machine paths or names. Pack README, in the review-item key paragraph: one sentence on the typed-spelling fallback. Setup README: one known-limit sentence beside the earlier-spelling note, and a test-table row for `tests/realpath-fallback.test.mjs`.
5. REQUIREMENTS.md: add R-2180 to R-2184 with the must-meet's row text, status `implemented` and file::title evidence. Put R-2180 to R-2183 under FEAT-015 and R-2184 under FEAT-018 beside R-1985. Then run `npm run req:tree` and `npm run map`.

## Wrong code to try (each must turn the named checks red; revert after)
- W1: restore today's `if (mustExist) throw e;` before the fallback. Expect R-2180, R-2182, R-2183 and R-2184 red.
- W2: `try { return realpathSync(abs); } catch { return abs; }`. Expect R-2181 red.
- W3: fall back only when `e.code === "EISDIR"`. Expect R-2180 red.
- W4: leave real-path unchanged and add a JavaScript fallback only inside linkOk. Expect R-2182 and R-2184 red.
- W5: without mustExist, return `canonicalizeMissing(abs)` on an error other than a missing file. Expect R-2181 red.
- W6: make the preload a no-op. Expect every setup check to FAIL on its precondition.

## Done
- R-2180 to R-2184 pass on this Mac, and W1 to W6 each fail as listed.
- These pass alone: the two new files, checkout-spelling, path-spelling, stale-copies, uninstall, doctor-fix-line, land, review-round and gate-rm-inside.
- `npm run map:check`, `npm run readme:check` and `node scripts/requirements-trace.mjs` are green.

## Report (at most 10 lines)
Verdict. Commit sha. Diff stat. One PASS/FAIL/SKIP count line per test file run. W1 to W6 outcomes. The map, readme and trace checks. Anything changed outside this list, with the reason. Open questions.