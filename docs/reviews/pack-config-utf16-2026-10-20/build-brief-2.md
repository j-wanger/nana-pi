# Build brief 2 · pack-config-utf16

Feature: FEAT-015 · Diagnose the active environment. Class: install, hook or gate. Same builder, worktree and branch; the tip includes the seat's merge of main c203f485 and its pairs records. Threat model unchanged.

## Why a second build

1. **R-2237 passed on Windows.** CI run 39414266878 at 961f76d1 printed, on the Windows leg, `PASS R-2237: on Windows, a nana-pack.json written by Windows PowerShell's Out-File and > turns the objective off`. That is the proof the row's `req-candidate` marker was waiting for (precedent R-2082/R-2083).
2. **Off Windows, the R-2237 check passes vacuously.** `windowsProof` starts as `true`, and on macOS and Linux the file prints `SKIP R-2237: …` and then runs `check("R-2237: …", windowsProof, …)`, which prints `PASS R-2237: …`. Once the marker reads `// req:`, that row would count as passing on every platform without checking anything.

## Change

1. `packages/nana-pack/tests/pack-config-utf16.test.mjs`, the R-2237 block only: off win32, record a skip and run no check; on win32, run the real check. Use the repo's skip form (for example `const skip = (n, why) => console.log("SKIP", n, "—", why);` as in runtime-map.test.mjs, or the `process.platform !== "win32" ? skip(...) : check(...)` shape other files use), so the summary counts it as a skip. Do not default `windowsProof` to `true`. Keep the check's title byte-identical.
2. In the same file, change `// req-candidate: R-2237 (Windows only; becomes req: when the Windows CI leg passes it)` to `// req: R-2237`, on its own line directly above the `check(` call.
3. `REQUIREMENTS.md`, R-2237's row: status `implemented`, evidence `` `packages/nana-pack/tests/pack-config-utf16.test.mjs::R-2237: on Windows, a nana-pack.json written by Windows PowerShell's Out-File and > turns the objective off` ``. Do not change its requirement text. Then `npm run req:tree`.
4. If scripts/test.mjs or the trace needs anything for a file whose last check is a platform skip, check the runner accepts it (the file still passes other checks, so it is not an all-SKIP file).
5. Change nothing else. Do not edit HANDOFF.md or docs/sessions/.

## Run (single files only; no full suite, no loops of a test file)

- `node packages/nana-pack/tests/pack-config-utf16.test.mjs` on macOS: R-2230, R-2231, R-2232 and R-2236 PASS; R-2237 prints SKIP and no PASS line; exit 0.
- Wrong version to try, restored after: keep the vacuous default `windowsProof = true` and the trailing check — the file must print PASS for R-2237 on macOS again (this is the bug, shown for the report).
- `node scripts/requirements-trace.mjs`, `npm run map:check`, `npm run readme:check`, `node --experimental-strip-types packages/nana-pack/tests/requirements-tree.test.mjs`: all exit 0.

## Report (10 lines or fewer)

DONE or BLOCKED, the tip SHA, the files changed, and the macOS output lines for R-2237.
