Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane signal-test-race. Class: ordinary (tests only). Builder: pi-worker (small lane). Build session 4, on branch tip cf2d4290. Round 2 said LAND, but the tip's CI failed on macOS (run 41367446804): `packages/nana-pack/tests/worker-claude.test.mjs` printed R-2803 through R-2691 as PASS, then the whole file ended with `exit SIGKILL` after 21.2 s, during the R-2693 startup-signal cases this lane changed. Main's earlier macOS failure in run 41362285370 was an R-2693 assertion failure, not a kill, so this lane's change turned a flaky failure into a killed file.

## Precedent

- `packages/nana-pack/tests/worker-claude.test.mjs` as on `origin/main` (`startupSignalCase`, `waitFor`, `stopFixtureBuilder`, `killWorkerTree`)
- `packages/nana-pack/tests/test-locked.test.mjs` (this lane's marker waits)

Report each departure.

## Build

Find why the file is killed, and fix it in the test only. Read the CI log with `gh run view 41367446804 --log-failed` first. Suspects to rule in or out, with evidence: (a) a signal or group kill in `startupSignalCase` or `stopFixtureBuilder` reaching the test process itself; (b) the new `WC_HOLD_FILE`, which nothing ever writes, keeping fake pi alive until the 10 s `--max-secs` ceiling on each retry, so three attempts outlast a 20 s limit. Whatever the cause, each R-2693 attempt that does not deliver its signal must end its worker at once rather than wait for the ceiling, and the four cases together must finish well inside the file's limits. Keep R-2693's assertion unchanged. Change no product code.

Reproduce under load before and after: run `node packages/nana-pack/tests/worker-claude.test.mjs` ten times while `npm test -- --jobs=4` runs on this Mac, and record both counts in `build-4-load.txt` in this folder. Update this lane's session entry with one sentence on the cause.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Ten runs under load pass after the fix, and `build-4-load.txt` records the cause and both counts. Both test files, `npm run map:check`, `npm run readme:check` and `node scripts/identity-scan.mjs --root .` pass. Do not run the locked full suite; CI is the suite. Push and stop.
