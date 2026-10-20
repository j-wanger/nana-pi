# Build brief — hook-deadlines

Feature: FEAT-013 · Install and connect harness runtimes. Worktree `~/nana-pi-wt/hook-deadlines` on `feat/hook-deadlines`, from main cdf4b098 or newer. Rows R-2010–R-2015 only, text verbatim from must-meet.md. Follow `packages/nana-pack/prompts/builder-preamble.md`. Run single test files only. Never edit HANDOFF.md or docs/sessions/.

## Change
1. `packages/nana-setup/lib/hook-producer.mjs`: export `HOOK_PRODUCER_TIMEOUT_MS = 1500` with the provenance comment from must-meet.md (chosen 2026-10-20, R-2013). Add `timeout: HOOK_PRODUCER_TIMEOUT_MS` to the spawnSync options; change nothing else in the function. Header `@errors`: a run past the limit also becomes the marker.
2. `packages/nana-setup/claude/hooks/verifier-pipe.mjs`: add `process.stderr.on("error", () => {});` with a `// R-2014` comment beside the stdout guard. Header `@errors` names stderr too.
3. Leave `nana-knowledge.ts`, `nana-adoption.mjs` and `nana-objective.mjs` untouched.
4. `packages/nana-setup/README.md`: one sentence after the Runtime dependencies paragraph on the objective hook. A session-start producer still running at the launcher's 1500 ms limit is stopped, and its unavailable line prints instead; a producer in a wait no signal ends, such as a hung network mount, is not stopped, and Claude Code's 5 s hook limit then drops the hook's output. Add no tests-table row: the table is not exhaustive, and two in-flight lanes add rows there.
5. `REQUIREMENTS.md`: the six rows after R-1944 in SUB-012. Flip each to implemented, citing its test, once it passes. Then `npm run req:tree` and `npm run map`.

## Tests (`// req:` directly above a one-line `check("title", …`)
- New `packages/nana-setup/tests/hook-deadlines.test.mjs` with the six-tag header:
  - Root `fs.realpathSync.native(tmpDir(...))`; `fs.cpSync` the checkout's `packages/nana-setup/claude/hooks` and `packages/nana-setup/lib` into it.
  - Stubs at `packages/nana-pack/bin/nana-adoption.mjs`, `packages/nana-setup/bin/stale-copies.mjs` and `packages/nana-pack/bin/nana-objective.mjs`. A hung stub writes `PARTIAL\n`, then waits on a timer of a named `STUB_HANG_MS` (chosen about 30 s, longer than the watchdog). A live stub prints one known line.
  - Import `hookProducerConfig` and `desiredHooks` from the checkout, never the copy. Expected text is `hookProducerConfig(name, root).marker`. The limit is the `timeout` × 1000 of the "SessionStart adoption" or "SessionStart objective" entry.
  - Spawn each hook with `CLAUDE_PROJECT_DIR` set to the root and `HOME` and `USERPROFILE` set to a temp home. A named `CASE_LIMIT_MS` watchdog (chosen about 15 s) kills the hook; elapsed time runs from spawn to close.
  - R-2010 `adoption hook prints its marker and the stale-copy output when the adoption producer hangs`: output equals the adoption marker plus the stub line; exit 0.
  - R-2011 `adoption hook prints both markers before its installed limit when both producers hang`: output equals both markers in order; exit 0; elapsed under the limit.
  - R-2012 `objective hook prints its marker before its installed limit when its producer hangs`: output equals the marker; exit 0; elapsed under the limit.
- `packages/nana-setup/tests/hook-producers.test.mjs`, R-2013 `launcher starts the objective, adoption and stale-copy producers with a 1500 ms time limit`: for each of the three names, an injected `run` captures `options.timeout === 1500`. This is the only literal; everything else imports the name.
- `packages/nana-setup/tests/hooks-closed-output.test.mjs`: let `run` take a script path, its args, an env and the stream to close; update `@purpose` and `@inputs`.
  - R-2014 `verifier hook ignores a closed stderr and exits 0`: input `not json`. The open run exits 0 and its stderr matches `/nana verifier-pipe:/`; the run with stderr closed exits 0.
  - R-2015 `knowledge pull hook ignores a closed stdout and exits 0`: in a temp `NANA_KNOWLEDGE_HOME`, write `sources.json` naming one folder that holds one markdown file ("Review round cap"); build with `node packages/nana-knowledge/bin/nana-knowledge.ts build`. For the knowledge runs only, set that home and delete `NANA_ROLE`. Give each run its own `session_id`. The open run's stdout holds `[nana:knowledge]`; the closed run exits 0 with empty stderr.

## Wrong code to try first (each must turn its test red)
W1 no `timeout` (today) → R-2010, R-2011, R-2012, R-2013. W2 on ETIMEDOUT print `result.stdout` → R-2010, R-2012. W3 limit 3000 → R-2011 (6.0 s in a probe), R-2013. W4 `process.exit(0)` after the first producer in the adoption hook → R-2010. W5 no stderr listener → R-2014. W6 the knowledge CLI ends with `process.exitCode = code` → R-2015. W7 the timeout only when `cli` is the adoption producer → R-2011, R-2012, R-2013.

## Done
All six checks pass in the three touched files, and each wrong code above was seen red. The other checks in the two edited test files, stale-copies, adoption-reader and objective-golden still pass. `npm run map:check`, `npm run readme:check` and `node scripts/requirements-trace.mjs` exit 0. CI is green on macOS, Linux and Windows.

## Report (≤ 10 lines)
VERDICT line; commits; the six titles with PASS; W1–W7 with the test that went red; map, readme and trace exit codes; any existing test edited; R-2011's elapsed time on Windows CI if the log shows it.
