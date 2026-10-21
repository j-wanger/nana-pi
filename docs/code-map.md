# Code map

Generated — do not edit. `npm run map` rewrites it from the import graph and the
contract header at the top of each module; `npm run map:check` fails when this file
and the code disagree (G-009, G-010). `npm run map:impact <file...>` prints a
change's transitive callers and callees (G-011).

Covers `scripts`, `apps/desk`, `apps/bench`, `packages/nana-pack/lib`, `packages/nana-pack/bin`, `packages/nana-pack/extensions`, `packages/nana-knowledge/lib`, `packages/nana-knowledge/bin`, `packages/nana-knowledge/extensions`, `packages/nana-stage/lib`, `packages/nana-stage/extensions`, `packages/nana-setup/lib`, `packages/nana-setup/bin`, `packages/nana-setup/claude/hooks`, `packages/nana-pack/tests`, `packages/nana-knowledge/tests`, `packages/nana-stage/tests`, `packages/nana-setup/tests`, `apps/desk/test`, `apps/bench/test` — 373 modules, as declared in
`code-map.config.json`.

**Layer direction** (G-007): a module may import from its own layer or the one
directly after it, never an earlier one and never skipping one.

**Effects vocabulary** (G-004): `none` · `disk` · `database` · `network` · `process`, with an optional
parenthetical qualifier. Rendering into the DOM is an *output*, not an effect;
browser `localStorage` and `sessionStorage` count as `disk`.

1. **Apps and scripts** — The desk, the bench and this repo's own scripts — the entry points. They may import the packages; a package may not import them.
2. **Packages** — The pi extension pack, the knowledge pull, the staged-block layer and the setup bootstrap — the installable units. Within the layer imports are free (nana-pi ships as one package); nothing here may reach up into an app.

## Apps and scripts

The desk, the bench and this repo's own scripts — the entry points. They may import the packages; a package may not import them.

### `apps/bench/aggregate.mjs`

- **purpose** — Turn a study's recorded runs into per-family, per-profile summary statistics and a markdown report, without re-running or judging anything.
- **inputs** — argv[2] = study dir; that dir's study.json, schedule.json (optional) and results.jsonl
- **outputs** — exports stats/aggregate/toMarkdown/spendOf/costOf; as a CLI writes summary.json and summary.md into the study dir and prints one confirmation line
- **effects** — disk (reads the study dir, writes summary.json + summary.md), process (exits non-zero as a CLI)
- **errors** — throws Error when results.jsonl holds no parsable runs; CLI exit 1 with the message on stderr
- **callers** — `apps/bench/test/aggregate.test.mjs`
- **callees** — `apps/bench/lib/usage.mjs`

### `apps/bench/catch-ledger.mjs`

- **purpose** — CLI for the retroactive catch ledger — extract reviewer findings, label and match them with judge models, then build the kappa table and the pre-registered claims.
- **inputs** — argv subcommand (extract | label a|b|c [lane..] | match a|b [lane..] | build); env CATCH_REVIEWS (default docs/reviews) and CATCH_OUT (default apps/bench/studies/catch-ledger-2026-09-28); the review markdown corpus and any cached label/match jsonl under CATCH_OUT
- **outputs** — under CATCH_OUT: rows.jsonl, skipped.jsonl, reports.json, per-pass label-*.jsonl and match-*.jsonl caches, kappa-pairs.json, results.json, table.md; progress and claims JSON on stdout
- **effects** — disk (reads the corpus, writes and appends the ledger files), process (spawns the judge CLI, exits non-zero), network (judge model calls made by that child)
- **errors** — exit 2 on an unknown subcommand; exit 1 on any judge failure or a missing label (fail-closed); build writes the refusal instead of table.md when kappa(top-level class) < 0.6
- **callers** — —
- **callees** — `apps/bench/lib/catch-extract.mjs`, `apps/bench/lib/catch-judge.mjs`, `apps/bench/lib/catch-stats.mjs`

### `apps/bench/ext/bench-nested-usage.ts`

- **exempt** — content-pinned by study tool-profiles-2026-09-08 (pinnedSha ext:sidecar); a header would change a closed study's fingerprint
- **callers** — —
- **callees** — `apps/bench/lib/nested.mjs`

### `apps/bench/lib/agentdir.mjs`

- **purpose** — Prepare and verify the pi config directory the bench runs against, so a study never inherits the operator's agent settings.
- **inputs** — optional {dir, sourceDir, settings}; defaults ~/.pi/bench-agent and ~/.pi/agent; the operator's auth.json
- **outputs** — exports defaultSourceDir/defaultBenchDir/PINNED_SETTINGS/prepareAgentDir/verifyAuth/settingsFingerprintInput; creates the bench dir with pinned settings.json and an auth.json SYMLINK to the operator's credential file
- **effects** — disk (mkdir, writes settings.json, symlinks auth.json)
- **errors** — throws Error when the source auth.json is missing or the bench auth.json is not the expected symlink
- **callers** — `apps/bench/lib/plan.mjs`, `apps/bench/run.mjs`, `apps/bench/test/agentdir.test.mjs`
- **callees** — —

### `apps/bench/lib/catch-extract.mjs`

- **purpose** — Structurally extract reviewer findings from the markdown review corpus into rows, recording a reason for every item it does not turn into a row.
- **inputs** — a reviews root directory of tranche<N>-2026-09-28 dirs holding reviewer reports and fix briefs
- **outputs** — exports REPORT_RE/FIX_RE/listCorpus/answeredReport/splitOutsideTicks/refsOf/firstSentence/parseReport/extractCorpus; returns {rows, skipped, stats, fixBriefs} in memory
- **effects** — disk (reads the review markdown only)
- **errors** — none — unparsable items are returned in `skipped` with a reason; a missing reviews root surfaces as the underlying fs error
- **callers** — `apps/bench/catch-ledger.mjs`, `apps/bench/test/catch-ledger.test.mjs`
- **callees** — —

### `apps/bench/lib/catch-judge.mjs`

- **purpose** — The only place the catch ledger uses a model: the label and match prompts, their JSON schemas, the judge invocation and the validation of what comes back.
- **inputs** — {model, system, prompt, schema, budgetUsd, spawn} per call (spawn optional, default node:child_process spawnSync); env CATCH_JUDGE_BIN (default `claude`); row/report/fix-brief texts for prompt building
- **outputs** — exports MODELS and the label vocabularies (TOP/SUB/DISP/ORIGIN/RELATION/SURFACE/VALIDITY), GUIDE/MATCH_GUIDE, labelSchema/matchSchema, sha, callJudge, labelPrompt, validateLabels; callJudge returns {out, cost}
- **effects** — process (spawns the judge CLI with cwd the OS temp folder, 15 min timeout), network (the model call that child makes)
- **errors** — throws Error on judge unavailable, non-zero exit, non-JSON output, missing structured output, or a model other than the one requested; validateLabels throws on a bad or incomplete label set
- **callers** — `apps/bench/catch-ledger.mjs`, `apps/bench/test/catch-ledger.test.mjs`
- **callees** — —

### `apps/bench/lib/catch-stats.mjs`

- **purpose** — Pure deterministic arithmetic over the ledger's rows and stored labels: Cohen's kappa, seeded sampling, finding-equivalence graphs, the table and the pre-registered claims.
- **inputs** — in-memory rows, label objects, match records and stage hints — no files, no model
- **outputs** — exports cohensKappa/seededSample/canonSegments/samePath/sameBase/stageHints/matchGraph/components/buildLedger/componentSizes/table/claims/matchConfidence; returns plain objects and markdown strings
- **effects** — none
- **errors** — throws Error when kappa is given empty or unequal-length label vectors
- **callers** — `apps/bench/catch-ledger.mjs`, `apps/bench/test/catch-ledger.test.mjs`
- **callees** — —

### `apps/bench/lib/checkers.mjs`

- **purpose** — Deterministic bench checkers — every verdict is a regex, a string compare, a JSON walk, a filesystem predicate or a child-process exit code, never an LLM judge.
- **inputs** — a check spec {type: regex|exact|command|suite|file|all, ...} plus a run ctx (finalText, workspace dir, fixture paths); for `suite`, the signed verdict line the trusted evaluator wrote to fd 3
- **outputs** — exports stripComments/extractJson/hashTree/globMatch/fetchKey/selectSignedVerdict/judgeVerdict/runCheck/liveKeyOf/CHECKER_TYPES; runCheck returns {pass, detail, graderError?} and never throws
- **effects** — disk (reads the workspace, writes the nonce fd file it unlinks before spawning), process (spawnSync of the command under test and of the trusted evaluator)
- **errors** — none thrown — an oracle failure is reported as {graderError: true} so an infrastructure fault is never recorded as a wrong answer
- **callers** — `apps/bench/run.mjs`, `apps/bench/test/checkers.test.mjs`, `apps/bench/test/evaluator-hardening.test.mjs`, `apps/bench/test/study-tasks.test.mjs`
- **callees** — `apps/bench/lib/fixture.mjs`

### `apps/bench/lib/eval-module.mjs`

- **exempt** — content-pinned by study tool-profiles-2026-09-08 (pinnedSha trusted-evaluator)
- **callers** — —
- **callees** — —

### `apps/bench/lib/fixture.mjs`

- **purpose** — Build, hash, verify and materialize the frozen directories a bench task runs in, pinned by a sha256 manifest.
- **inputs** — CLI `build <src> <dest> [--exclude a,b,c]` or `hash <dir>`; as a library a source dir, a destination dir, mutation specs, study asset lists and before/after text
- **outputs** — exports listFiles/hashDir/verifyFixture/materialize/applyMutations/copyAssets/unifiedDiff/lineDiff; writes the materialized fixture tree and prints the manifest sha as a CLI
- **effects** — disk (reads the source tree, copies and mutates the destination tree)
- **errors** — verifyFixture rejects on a manifest sha mismatch naming the drifted file; CLI exit 1 on a failed command and exit 2 on a bad invocation
- **callers** — `apps/bench/lib/checkers.mjs`, `apps/bench/run.mjs`, `apps/bench/test/orchestration-paths.test.mjs`, `apps/bench/test/study-tasks.test.mjs`
- **callees** — —

### `apps/bench/lib/nested.mjs`

- **exempt** — content-pinned by study tool-profiles-2026-09-08 (pinnedSha ext:sidecar-lib)
- **callers** — `apps/bench/ext/bench-nested-usage.ts`, `apps/bench/test/nested.test.mjs`
- **callees** — —

### `apps/bench/lib/pi-exports.mjs`

- **purpose** — Resolve the installed pi packages and borrow pi's own public Usage and cost arithmetic instead of re-deriving it.
- **inputs** — env PI_BENCH_ENTRY, BENCH_PI_ROOT and PI_CODING_AGENT_DIR; root CI workflow pin and the pi binary path and package.json files found walking up from it
- **outputs** — exports PI_PACKAGE/PI_AI_PACKAGE/PI_MIN_VERSION/REQUIRED_PI_AI/REQUIRED_PI/compareVersions/piRootCandidates/loadPiExports/createPricer; returns {calculateCost, Usage-shaped helpers} and a pricer closure
- **effects** — disk (reads package.json while resolving, dynamic-imports the pi packages)
- **errors** — throws Error when pi cannot be resolved, is older than PI_MIN_VERSION, or is missing a required root export
- **callers** — `apps/bench/run.mjs`, `apps/bench/test/usage.test.mjs`
- **callees** — `packages/nana-setup/lib/pi-pin.mjs`

### `apps/bench/lib/plan.mjs`

- **purpose** — Decide what to run in what order and refuse to mix measurements: the study fingerprint, the seeded block schedule and resume over an existing results file.
- **inputs** — a study dir with study.json, tasks, fixture and extension contents, the pi version and pinned settings; an existing schedule.json and results.jsonl when resuming
- **outputs** — exports tupleKey/rng/shuffle/profilesFor/buildSchedule/filterPlan/loadOrCreateSchedule/OPERATIONAL_KEYS/studyFingerprint/fileSha/readJsonl/readResults/assertFingerprint; persists schedule.json and quarantines a torn results tail
- **effects** — disk (reads the study dir and results.jsonl, writes schedule.json and the quarantined tail)
- **errors** — assertFingerprint throws when a results file was written under a different fingerprint; readJsonl reports a torn tail rather than parsing it
- **callers** — `apps/bench/run.mjs`, `apps/bench/test/plan.test.mjs`
- **callees** — `apps/bench/lib/agentdir.mjs`

### `apps/bench/lib/profiles.mjs`

- **purpose** — Validate one pi tool/prompt profile and render it to the exact argv and env a measured run executes with.
- **inputs** — a profile object {name, tools, thinking, extensions, skills, ...}, the study, and a run ctx (fixture dir, agent dir, task prompt)
- **outputs** — exports ISOLATION_FLAGS/validateProfile/isPlaceholder/renderRun; renderRun returns {args, env} for the pi child
- **effects** — disk (existsSync checks on the extension and skill paths a profile names)
- **errors** — validateProfile throws Error naming the profile and the offending field; renderRun throws on an unsubstituted <placeholder> or an unknown tool or thinking level
- **callers** — `apps/bench/run.mjs`, `apps/bench/test/argv.test.mjs`
- **callees** — —

### `apps/bench/lib/usage.mjs`

- **purpose** — Parse a pi `--mode json` event stream into deterministic per-run metrics, keeping the run's own model spend strictly apart from what its tools spent.
- **inputs** — the raw stream text of one run plus an optional pricer; pi-ai Usage objects carried on message_end and tool results
- **outputs** — exports emptyUsage/addUsage/totalTokens/costTotal/costOfRecord/observedCostOfRecord/costUnknownReason/parseStream/incompleteReason; parseStream returns {tokens, nested, cost, finalText, settled, toolCalls, retries, compactions, errors}
- **effects** — none
- **errors** — none thrown — an unterminated or malformed stream is reported through `settled: false` and incompleteReason(), and an unpriceable run through costUnknownReason()
- **callers** — `apps/bench/aggregate.mjs`, `apps/bench/run.mjs`, `apps/bench/test/aggregate.test.mjs`, `apps/bench/test/nested.test.mjs`, `apps/bench/test/usage.test.mjs`
- **callees** — —

### `apps/bench/run.mjs`

- **purpose** — Execute a pre-registered study — spawn each pi run, grade it, and append exactly one JSON line per run with no retries.
- **inputs** — argv `<study-dir> [--smoke|--go] [--task id] [--profile name] [--rep n] [--keep]`; study.json, tasks, fixtures and schedule.json in that dir; env PI_BENCH_ENTRY and PATH; the prepared pi agent dir
- **outputs** — appends records to results.jsonl; writes each run's raw stream, stderr and workspace diff under the study dir; exports parseArgs/loadStudy/runChild/executeRun/registrationProbe/runPlan and the interrupt and budget helpers; progress on stdout
- **effects** — disk (study dir reads, evidence and results writes), process (spawns pi children, installs SIGINT handling, exits non-zero), network (the model calls those children make)
- **errors** — exit 1 on a bad invocation or a study that fails to load; a run failure is recorded as data (state fail | harness | grader) rather than thrown; the plan stops on the cumulative budget, on 3 consecutive systemic failures, on a child that did not die cleanly, or — once that run's record is on disk — on a graded run whose evidence could not be written
- **callers** — `apps/bench/test/integration.test.mjs`, `apps/bench/test/ops.test.mjs`, `apps/bench/test/orchestration-paths.test.mjs`, `apps/bench/test/plan.test.mjs`, `apps/bench/test/study-tasks.test.mjs`, `apps/bench/test/timeout.test.mjs`
- **callees** — `apps/bench/lib/agentdir.mjs`, `apps/bench/lib/checkers.mjs`, `apps/bench/lib/fixture.mjs`, `apps/bench/lib/pi-exports.mjs`, `apps/bench/lib/plan.mjs`, `apps/bench/lib/profiles.mjs`, `apps/bench/lib/usage.mjs`

### `apps/bench/test/agentdir.test.mjs`

- **purpose** — Pins the prepared agent dir — the study never runs against the operator's own settings, and it never runs without credentials
- **inputs** — lib/agentdir.mjs and a temp fake source agent dir
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp agent dirs and settings files; the real ~/.pi is never touched)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/bench/lib/agentdir.mjs`

### `apps/bench/test/aggregate.test.mjs`

- **purpose** — Pins the aggregate arithmetic on a fixed results file by hand — the medians, the denominators and the shared-task restriction every number in the summary rests on
- **inputs** — aggregate.mjs, lib/usage.mjs, and the fixed results and schedule fixtures under test/fixtures
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (reads the fixtures)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/bench/aggregate.mjs`, `apps/bench/lib/usage.mjs`

### `apps/bench/test/argv.test.mjs`

- **purpose** — Pins the rendered argv and profile validation flag by flag, because the argv IS the experiment
- **inputs** — lib/profiles.mjs and the shipped study's study.json
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (reads the study definition)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/bench/lib/profiles.mjs`

### `apps/bench/test/catch-ledger.test.mjs`

- **purpose** — Pins the catch ledger — structural extraction over the real review corpus, the kappa arithmetic, the matcher's stages, ledger uniqueness, and the judge's fail-closed contract with zero model calls
- **inputs** — lib/catch-extract.mjs, lib/catch-judge.mjs, lib/catch-stats.mjs, the docs/reviews corpus, and stub judge scripts run through node
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp dirs, ledger files, reads the review corpus), process (runs the stub judge scripts through node)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/bench/lib/catch-extract.mjs`, `apps/bench/lib/catch-judge.mjs`, `apps/bench/lib/catch-stats.mjs`, `apps/bench/test/tmp-dir.mjs`

### `apps/bench/test/checkers.test.mjs`

- **purpose** — Pins every checker type positive and negative, plus the grader-error boundary that keeps an oracle outage from being recorded as a wrong answer
- **inputs** — lib/checkers.mjs and temp workspaces and fixture trees
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp workspaces and fixture trees), process (spawns the commands a checker runs)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/bench/lib/checkers.mjs`, `apps/bench/test/tmp-dir.mjs`

### `apps/bench/test/evaluator-hardening.test.mjs`

- **purpose** — Every known way an untrusted module could manufacture a signed PASS for a wrong answer, each pinned as not-a-pass
- **inputs** — lib/checkers.mjs and untrusted modules written into temp dirs, each applying one attack patch
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp dirs, module sources and verdict files), process (spawns the evaluator and the untrusted module in their own processes)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/bench/lib/checkers.mjs`, `apps/bench/test/tmp-dir.mjs`

### `apps/bench/test/integration.test.mjs`

- **purpose** — Drives the integrated runner paths against stub children with no model calls — probe to evidence to ledger, and run to parse to evidence, including what survives when post-processing throws
- **inputs** — run.mjs, stub child executables, and temp run directories
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp run dirs, evidence and ledger files), process (spawns the stub children)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/bench/run.mjs`

### `apps/bench/test/nested.test.mjs`

- **purpose** — Pins nested-LLM-spend accounting against the four defects it had — own-call contamination, lost late usage, double counting, and a suppressed unmeasurable call
- **inputs** — lib/nested.mjs, lib/usage.mjs, and captured event-stream fixtures
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (reads the fixtures)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/bench/lib/nested.mjs`, `apps/bench/lib/usage.mjs`

### `apps/bench/test/ops.test.mjs`

- **purpose** — Pins the operational safety rails — when the runner stops on a non-model failure streak, and what it believes it has spent across a resume
- **inputs** — run.mjs, ledger fixtures in temp dirs, and a stub process tree
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp dirs and ledger files), process (spawns the stub process tree)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/bench/run.mjs`

### `apps/bench/test/orchestration-paths.test.mjs`

- **purpose** — Drives EVERY orchestration path at least once against stubs, so an undeclared identifier on a rarely-entered path fails here instead of after a paid call
- **inputs** — run.mjs, stub children, and temp study and run directories
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp run dirs, evidence, ledger and results files), process (spawns the stub children and signals the salvage path)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/bench/lib/fixture.mjs`, `apps/bench/run.mjs`

### `apps/bench/test/plan.test.mjs`

- **purpose** — Pins the schedule, the study fingerprint and resume — the three ways a study silently corrupts itself
- **inputs** — lib/plan.mjs, run.mjs loadStudy, and temp schedule and results files
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp dirs, schedule and results files)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/bench/lib/plan.mjs`, `apps/bench/run.mjs`

### `apps/bench/test/study-tasks.test.mjs`

- **purpose** — Pre-flight for the shipped study with no model calls — the fixture still matches its pin, every mutation applies, and the edit tasks discriminate against the known ways to game them
- **inputs** — lib/checkers.mjs, lib/fixture.mjs, run.mjs, and the shipped study dir with its pinned fixture
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp materialized workspaces; reads the study and fixture)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/bench/lib/checkers.mjs`, `apps/bench/lib/fixture.mjs`, `apps/bench/run.mjs`

### `apps/bench/test/timeout.test.mjs`

- **purpose** — Pins that the per-run timeout actually KILLS rather than merely stopping waiting, including a SIGTERM-ignoring child and its grandchild
- **inputs** — run.mjs runChild and a stub that ignores SIGTERM and spawns a grandchild
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp dirs and stub scripts), process (spawns the stub tree and signals it)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/bench/run.mjs`, `apps/bench/test/tmp-dir.mjs`

### `apps/bench/test/tmp-dir.mjs`

- **purpose** — Create test temporary roots and remove them when the test process exits.
- **inputs** — A mkdtemp prefix.
- **outputs** — The created temporary directory path.
- **effects** — disk (creates and removes temporary directories), process (registers exit cleanup)
- **errors** — Propagates directory creation errors and ignores cleanup errors.
- **callers** — `apps/bench/test/catch-ledger.test.mjs`, `apps/bench/test/checkers.test.mjs`, `apps/bench/test/evaluator-hardening.test.mjs`, `apps/bench/test/timeout.test.mjs`, `apps/bench/test/usage.test.mjs`
- **callees** — —

### `apps/bench/test/usage.test.mjs`

- **purpose** — Pins stream parsing — tokens, nested tokens, turns, per-tool counts, retries, terminal completion, dangling tool calls, final text and error detection
- **inputs** — lib/usage.mjs, lib/pi-exports.mjs, and captured or constructed event-stream fixtures
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (reads the fixtures)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/bench/lib/pi-exports.mjs`, `apps/bench/lib/usage.mjs`, `apps/bench/test/tmp-dir.mjs`

### `apps/desk/apps.mjs`

- **purpose** — Run one dedicated loopback listener per app manifest, each its own browser origin carrying only the routes a stage page needs.
- **inputs** — the apps dir of <name>.json manifests (default ~/.pi/agent/apps, DESK_APPS_DIR); the desk server's child primitives via `deps`; static `dirs` (kit stage page, /desk-client.mjs, /md.js, /blocks.mjs from packages/nana-stage, an optional manifest `page` dir); env HOME, DESK_READY_BOUND_MS, DESK_DATA_TIMEOUT_MS, DESK_DATA_OUTPUT_CAP
- **outputs** — exports verifiedBlocks/loadManifests/normalizeManifest/writeManifestSession/startAppListeners; usage lines through injected deps; serves each app's page plus /api/session, /api/events (SSE), /api/prompt, /api/ui-response, /api/abort, /api/entries, /api/manifest and POST /api/data/<key>; rewrites the manifest's `session` atomically after a spawn
- **effects** — disk (reads manifests, rewrites the manifest session file), process (spawns the app's pi child and the manifest's data commands), network (one 127.0.0.1 listener per app)
- **errors** — per-route JSON {error} at 400/403/404/409; a malformed manifest is skipped with a logged reason instead of throwing; a prompt is refused while the manifest's tools are not `ready`; a data command that fails, exceeds DESK_DATA_OUTPUT_CAP or times out is relayed as an error
- **callers** — `apps/desk/server.mjs`
- **callees** — `packages/nana-stage/lib/sign.mjs`

### `apps/desk/changes.mjs`

- **purpose** — Read-only git view of a live session's repository — the working tree against HEAD as one count per file, plus one file's unified diff.
- **inputs** — a live child's cwd and a repository-relative path; env DESK_GIT_TIMEOUT_MS, DESK_DIFF_CAP, DESK_UNTRACKED_TOTAL_CAP; `git` on PATH
- **outputs** — exports collectChanges/resolveInRoot/fileDiff, each returning {status, body}: {repo:false, reason} | {repo:true, root, files:[{path,status,added,removed,binary}], totals} | {path, diff, truncated}
- **effects** — disk (reads the repository and untracked files), process (spawn("git") with the path after `--`, never a shell)
- **errors** — {status:500, body:{error}} when git fails or exceeds DESK_GIT_TIMEOUT_MS; resolveInRoot returns {error} for an absent, absolute, NUL-bearing or `..`-escaping path, or one resolving outside the real repository root; an ambiguous spawn ENOENT becomes 200 {repo:false} with "git not found" or "working directory is gone"
- **callers** — `apps/desk/server.mjs`, `apps/desk/test/changes-endpoint.test.mjs`
- **callees** — —

### `apps/desk/pi-session.mjs`

- **purpose** — Resolve the single pi install the desk both spawns and imports, and expose pi's own session parser from that package root without ever rewriting a session file.
- **inputs** — env DESK_PI_BIN, DESK_PI_ROOT, PATH, npm_config_prefix, BUN_INSTALL, VOLTA_HOME; the pi binary and the package.json files found walking up from it
- **outputs** — exports PI_PACKAGE/PI_MIN_VERSION/parseSemver/compareSemver/sameVersion/resolvePiBin/piBinVersion/walkUpToPackage/piRootCandidates/resolvePiPackage/loadPiSession; loadPiSession returns {parseSessionEntries, migrateSessionEntries, CURRENT_SESSION_VERSION} from the same install the desk spawns
- **effects** — disk (reads package.json files and dynamic-imports the pi package), process (execFileSync of the pi binary for --version, 8 s timeout)
- **errors** — throws Error when no pi binary is found, when its package root cannot be resolved, when the version is below PI_MIN_VERSION, or when the imported install's version differs from the binary's
- **callers** — `apps/desk/server.mjs`, `apps/desk/test/app-listener.test.mjs`, `apps/desk/test/buffer-caps.test.mjs`, `apps/desk/test/changes-endpoint.test.mjs`, `apps/desk/test/crash-paths.test.mjs`, `apps/desk/test/pi-087-entries.test.mjs`, `apps/desk/test/pi-resolution.test.mjs`, `apps/desk/test/pi-rpc-contract.test.mjs`, `apps/desk/test/pi-session-parity.test.mjs`, `apps/desk/test/prompt-detach.test.mjs`, `apps/desk/test/spawn-and-persist.test.mjs`, `apps/desk/test/stage-key-persistence.test.mjs`, `apps/desk/test/teardown-invariants.test.mjs`, `apps/desk/test/usage-line.test.mjs`, `packages/nana-pack/tests/agent-dir-parity.test.mjs`
- **callees** — —

### `apps/desk/public/app.js`

- **purpose** — The desk page: it drives every view (rail, live transcript, composer, historical sessions, settings, spawn popover) against the desk's /api surfaces.
- **inputs** — the DOM of public/index.html; the /api/* JSON routes and the per-session SSE stream; keyboard, paste, scroll and visibility events; localStorage keys nana-code-theme, nana-code-rail, desk-collapsed and desk-append-sp
- **outputs** — renders the whole page and its dialogs; POSTs prompts, steers, bash, aborts, spawns, renames, title derivation, settings/mcp/nana-pack/agents/context-file writes and session exports; persists view preferences to localStorage
- **effects** — network (fetch and EventSource against the desk origin), disk (browser localStorage only)
- **errors** — none thrown to the host — a failed request surfaces as a toast or an inline error, and a response for a stage the user has left is dropped without painting
- **callers** — —
- **callees** — `apps/desk/public/changes.js`, `apps/desk/public/desk-client.mjs`, `apps/desk/public/md.js`

### `apps/desk/public/changes.js`

- **purpose** — Own the "files changed" bar above the composer and the floating, draggable diff window it opens.
- **inputs** — init({stale}) from app.js (the stage-staleness predicate), refresh(sessionId, generation) and clear(); /api/session/:id/changes and /changes/file?path=; pointer events; localStorage key nana-code-diffwin for the window position
- **outputs** — renders the changed-file bar and the diff window; returns nothing — app.js calls refresh()/clear() and reads no state back
- **effects** — network (fetch against the desk origin), disk (browser localStorage only)
- **errors** — none thrown — a response for a stage generation the user has left is dropped without painting, and a failed fetch leaves the bar in its previous state
- **callers** — `apps/desk/public/app.js`
- **callees** — `apps/desk/public/desk-client.mjs`

### `apps/desk/public/desk-client.mjs`

- **purpose** — The shared, DOM-id-free client core both the desk page and the stage host render with, so neither forks the other's rendering.
- **inputs** — explicit arguments only — a render ctx {container, toolRows, summarize?, decorate?}, message and tool-event objects, extension_ui_request payloads, and URLs for the transport helpers
- **outputs** — exports stripAnsi/el/contentBlocks/renderImage/argSummary/ARG_KEYS/toolActivity/activityVerb/parseSkillMessage/skillLabel/matchesUserEcho/toolRow/setToolStreaming/renderDiff/finishToolRow/buildDialog/openEventStream/postJson/rpcCall/JSON_HEADERS; returns detached DOM nodes, strings and parsed JSON
- **effects** — network (openEventStream opens an EventSource; postJson and rpcCall POST JSON)
- **errors** — rpcCall rejects with Error(r.error) when the RPC reports an error or !success; postJson resolves to the server's {error} body rather than rejecting; openEventStream reports transport failures through its onError callback and drops an unparsable event line silently; the render helpers throw nothing
- **callers** — `apps/desk/public/app.js`, `apps/desk/public/changes.js`, `apps/desk/test/live-feel.test.mjs`
- **callees** — —

### `apps/desk/public/md.js`

- **purpose** — Escape-first minimal markdown to HTML for agent replies: fences, headings, lists, blockquotes, rules and inline code, bold, italic and links.
- **inputs** — mdToHtml(text) — one markdown string
- **outputs** — an HTML string in which every character was escaped before any transform and inline code is carved out first so no other pattern fires inside it
- **effects** — none
- **errors** — none
- **callers** — `apps/desk/public/app.js`
- **callees** — —

### `apps/desk/public/stage/stage.js`

- **purpose** — The stage host page: stage, drawer and gate bar over one app listener, filling an app-owned layout from signed nana-blocks.
- **inputs** — the DOM of stage/index.html; /api/manifest, /api/session, /api/entries and the /api/events SSE stream on that app's own origin; /blocks.mjs for the reducer, /desk-client.mjs and /md.js; mouse and key events; localStorage key stage-drawer
- **outputs** — renders the stage blocks, the turns drawer and the gate bar; exports compose(text, {send}) and publishes window.stage for the app page; POSTs prompts, ui-responses and aborts to its listener; persists the drawer state to localStorage
- **effects** — network (fetch and EventSource against the app's own loopback origin), disk (browser localStorage only)
- **errors** — none thrown — a failed request, a rejected prompt, an extension_error or a session exit surfaces as an error toast and clears the open gates, and a reconnect (a second desk_hello) triggers a full replay instead of a partial paint
- **callers** — —
- **callees** — —

### `apps/desk/server.mjs`

- **purpose** — The desk's loopback HTTP server: static page, the /api surfaces over live `pi --mode rpc` children, and read/write access to pi's session and config files.
- **inputs** — HTTP requests on 127.0.0.1 (port DESK_PORT, default 7317); env DESK_APPS_DIR, DESK_KILL_GRACE_MS, DESK_MAX_PENDING_RPC, DESK_SSE_BUFFER_CAP, DESK_STDOUT_LINE_CAP, DESK_TAIL_BUDGET, PATH; pi's ACTIVE agent dir (sessions/, settings.json, mcp.json, nana-pack.json, agents/), per-project .pi/nana-pack.json and AGENTS.md-family files, app manifests, and public/ assets
- **outputs** — JSON responses and the per-session SSE stream (desk_hello then live RPC events); usage lines to stdout; spawned `pi --mode rpc` children and relayed RPC; writes session_info entries, settings.json, mcp.json, nana-pack.json, agents definitions and context files (each after a .bak copy); session HTML export; the startup URL on stdout
- **effects** — disk (session and config reads and writes), process (spawns pi, git, the native folder picker and headless title derivation; exits on signals), network (binds 127.0.0.1 only; the model calls its pi children make)
- **errors** — per-route JSON {error} at 400 (bad body or argument), 403 (Host/Origin rejection — a request must address the desk by a loopback name), 404 (unknown session, or a path resolving outside the sessions dir), 409 (refusals and lifecycle conflicts: a write through or below a symlink, a non-session file, a session file another process is writing, a dialog that is not open, a session that is not running), 500 (child or filesystem failure); exit 1 when the desk cannot start (pi unresolvable, port taken), exit 0 after draining children on SIGINT/SIGTERM
- **callers** — —
- **callees** — `apps/desk/apps.mjs`, `apps/desk/changes.mjs`, `apps/desk/pi-session.mjs`, `apps/desk/stage-keys.mjs`, `packages/nana-pack/lib/agent-dir.mjs`

### `apps/desk/stage-keys.mjs`

- **purpose** — Durable issuance record of the stage provenance keys the desk minted per pi session, so a desk restart or resume never blanks an existing stage.
- **inputs** — {dir (default ~/.pi/agent/nana-desk/stage-keys, DESK_STAGE_KEYS), knownSessionIds, sessionsRoot, log}; the per-session JSON records already on disk
- **outputs** — exports KEYS_PER_SESSION/defaultStageKeysDir/defaultSessionsRoot/StageKeyStore; keysFor(id) returns the session's keys most-recent-first, record(id,key) and seed(id,keys) write one 0600 file per session under a 0700 dir ({v:1, keys, updatedAt, sessionsRoot}, at most 8 keys)
- **effects** — disk (creates the store dir, reads a record on every call — the file is authority, not a cache — and rewrites one session's record per write)
- **errors** — none thrown — an invalid session id yields no keys, and a failed write is logged and held in `pending` so this desk still verifies its own blocks without overwriting another desk's record
- **callers** — `apps/desk/server.mjs`, `apps/desk/test/stage-key-persistence.test.mjs`
- **callees** — —

### `apps/desk/test/app-listener.test.mjs`

- **purpose** — Pins the per-app listeners — manifest validation at load, what a manifest exposes, and the pages and prompts each app port serves
- **inputs** — apps/desk/server.mjs, app manifests in a temp apps dir, packages/nana-stage/lib/blocks.mjs, and a stub `pi` first on PATH
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, apps dir and manifests), network (HTTP to the desk and app ports it binds), process (spawns the desk and the stub pi)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/desk/pi-session.mjs`, `apps/desk/test/tmp-dir.mjs`, `packages/nana-stage/lib/blocks.mjs`

### `apps/desk/test/buffer-caps.test.mjs`

- **purpose** — Pins the bounded-buffer property — no local producer can grow the desk process without bound or cost the operator the other sessions
- **inputs** — apps/desk/server.mjs with the four caps lowered by environment, a stub `pi` that floods, and an SSE client that stops reading
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME and apps dir), network (HTTP and SSE against the desk it binds), process (spawns the desk and the stub pi)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/desk/pi-session.mjs`, `apps/desk/test/tmp-dir.mjs`

### `apps/desk/test/changes-endpoint.test.mjs`

- **purpose** — Pins that the changes endpoints answer from git and that nothing a request names can reach outside the session's own work tree
- **inputs** — apps/desk/changes.mjs and apps/desk/server.mjs, temp git repositories, and a stub `pi` first on PATH
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, git repositories and work trees), network (HTTP to the desk it binds), process (spawns the desk, the stub pi and git)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/desk/changes.mjs`, `apps/desk/pi-session.mjs`, `apps/desk/test/tmp-dir.mjs`

### `apps/desk/test/crash-paths.test.mjs`

- **purpose** — Pins that nothing a request or a child can say takes the desk process down, wedges its event loop, or leaves a live pi process untracked
- **inputs** — apps/desk/server.mjs, hostile request targets, and a stub `pi` emitting hostile child events
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, apps dir and manifests), network (HTTP to the desk and app ports it binds), process (spawns the desk and the stub pi)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/desk/pi-session.mjs`, `apps/desk/test/tmp-dir.mjs`

### `apps/desk/test/host-rule.test.mjs`

- **purpose** — Pins that the Host rule defeats DNS rebinding on every route, including the reads the Origin rule cannot see
- **inputs** — apps/desk/server.mjs driven over raw sockets carrying attacker Host headers
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (a temp HOME and apps dir), network (raw loopback sockets to the desk it binds), process (spawns the desk; no pi child is ever spawned)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/desk/test/tmp-dir.mjs`

### `apps/desk/test/knowledge-home-isolation.test.mjs`

- **purpose** — Pin temporary knowledge-home isolation in every committed real-pi launcher.
- **inputs** — Real-process E2E harness and probe source files.
- **outputs** — PASS/FAIL checks for each launcher's child environment.
- **effects** — disk (reads committed test and review source files)
- **errors** — A missing or non-temporary knowledge-home assignment prints FAIL and exits nonzero.
- **callers** — —
- **callees** — —

### `apps/desk/test/live-feel.test.mjs`

- **purpose** — Pins the two pure pieces behind the live-feel surfaces — the activity line's verb derivation and the skill-expansion parser
- **inputs** — apps/desk/public/desk-client.mjs, imported in Node with no DOM
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — none
- **errors** — a failed check prints FAIL with the got and want values and the run exits 1
- **callers** — —
- **callees** — `apps/desk/public/desk-client.mjs`

### `apps/desk/test/origin-rule.test.mjs`

- **purpose** — Pins that every state-changing desk route rejects cross-origin browser requests and non-JSON bodies before doing anything, while reads stay open
- **inputs** — apps/desk/server.mjs on a test port
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — network (HTTP to the desk it binds), process (spawns the desk; no pi child is ever spawned)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — —

### `apps/desk/test/pi-087-entries.test.mjs`

- **purpose** — Pins the newer pi session entry kinds on the desk's read path — none reaches the page, all stay in the branch index, and the edited target is still rendered
- **inputs** — apps/desk/server.mjs, apps/desk/pi-session.mjs, and a session file written by pi's own SessionManager
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (a temp HOME and session files), network (HTTP to the desk it binds), process (spawns the desk and a stub pi)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/desk/pi-session.mjs`, `apps/desk/test/tmp-dir.mjs`

### `apps/desk/test/pi-resolution.test.mjs`

- **purpose** — Pins that the desk imports pi's session parser from the SAME install it spawns, against the synthetic layouts that made the old search return a confident wrong answer
- **inputs** — apps/desk/pi-session.mjs and synthetic pi install layouts under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, synthetic install trees and symlinks), process (sets HOME and DESK_PI_ROOT; nothing here starts a server)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/desk/pi-session.mjs`, `apps/desk/test/tmp-dir.mjs`

### `apps/desk/test/pi-rpc-contract.test.mjs`

- **purpose** — Drive installed pi RPC without model credentials and pin desk-consumed records.
- **inputs** — The desk pi resolver, installed pi executable and a throwaway extension.
- **outputs** — PASS/FAIL lines and a nonzero exit when the installed RPC contract drifts.
- **effects** — disk (isolated HOME, session directory and extension), process (spawns and stops pi).
- **errors** — Fails when resolution, startup, RPC records or bounded shutdown do not match.
- **callers** — —
- **callees** — `apps/desk/pi-session.mjs`, `apps/desk/test/tmp-dir.mjs`

### `apps/desk/test/pi-session-parity.test.mjs`

- **purpose** — The parity contract for reading sessions with pi's own parser — resolution ties the parser to the binary, the answers match the old parser on what a reader uses, and pi is the judge of the branch
- **inputs** — apps/desk/server.mjs, apps/desk/pi-session.mjs, and sessions written by pi's own SessionManager
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME and session files), network (HTTP to the desk it binds), process (spawns the desk and a stub pi)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/desk/pi-session.mjs`, `apps/desk/test/tmp-dir.mjs`

### `apps/desk/test/prompt-detach.test.mjs`

- **purpose** — Pins the prompt endpoint's DETACH contract — every answer carries a promptId, a detached prompt settles exactly once by event, and the outcome is kept for a client that attaches later
- **inputs** — apps/desk/server.mjs and a stub `pi` that holds its acceptance past the detach deadline
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME and apps dir), network (HTTP and SSE against the desk it binds), process (spawns the desk and the stub pi)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/desk/pi-session.mjs`, `apps/desk/test/tmp-dir.mjs`

### `apps/desk/test/spawn-and-persist.test.mjs`

- **purpose** — Pins three things only the desk gets to decide — the trust flag it sends pi, that title derivation runs tool-less on fenced attacker-influenceable text, and that an appended session_info chains to the current leaf
- **inputs** — apps/desk/server.mjs and a stub `pi` that records its argv, under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, settings and session files), network (HTTP to the desk it binds), process (spawns the desk and the stub pi)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/desk/pi-session.mjs`, `apps/desk/test/tmp-dir.mjs`

### `apps/desk/test/stage-key-persistence.test.mjs`

- **purpose** — Pins that stage signing keys survive a desk restart across four server runs, and that a forged or unknown-key block is still redacted
- **inputs** — apps/desk/server.mjs, apps/desk/stage-keys.mjs, nana-stage's lib/sign.mjs, and a stub `pi` that writes real session files with signed blocks
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, key store and session files), network (HTTP to the desk it binds), process (spawns the desk and the stub pi)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/desk/pi-session.mjs`, `apps/desk/stage-keys.mjs`, `apps/desk/test/tmp-dir.mjs`, `packages/nana-stage/lib/sign.mjs`

### `apps/desk/test/teardown-invariants.test.mjs`

- **purpose** — Pins that the desk never stops counting a child it cannot prove is gone, so every freed capacity slot corresponds to a process that really ended
- **inputs** — apps/desk/server.mjs, a stub `pi`, and the preload fixture that makes a kill fail the way EPERM does
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME and apps dir), network (HTTP to the desk it binds), process (spawns the desk and unkillable stub children, and signals them)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/desk/pi-session.mjs`, `apps/desk/test/tmp-dir.mjs`

### `apps/desk/test/tmp-dir.mjs`

- **purpose** — Create test temporary roots and remove them when the test process exits.
- **inputs** — A mkdtemp prefix.
- **outputs** — The created temporary directory path.
- **effects** — disk (creates and removes temporary directories), process (registers exit cleanup)
- **errors** — Propagates directory creation errors and ignores cleanup errors.
- **callers** — `apps/desk/test/app-listener.test.mjs`, `apps/desk/test/buffer-caps.test.mjs`, `apps/desk/test/changes-endpoint.test.mjs`, `apps/desk/test/crash-paths.test.mjs`, `apps/desk/test/host-rule.test.mjs`, `apps/desk/test/pi-087-entries.test.mjs`, `apps/desk/test/pi-resolution.test.mjs`, `apps/desk/test/pi-rpc-contract.test.mjs`, `apps/desk/test/pi-session-parity.test.mjs`, `apps/desk/test/prompt-detach.test.mjs`, `apps/desk/test/spawn-and-persist.test.mjs`, `apps/desk/test/stage-key-persistence.test.mjs`, `apps/desk/test/teardown-invariants.test.mjs`, `apps/desk/test/usage-line.test.mjs`
- **callees** — —

### `apps/desk/test/usage-line.test.mjs`

- **purpose** — Pins the desk usage line triggers, exact fields and privacy boundary.
- **inputs** — the desk server, a temporary HOME, an app manifest and a stub pi executable
- **outputs** — PASS/FAIL lines and a failing exit code when the usage contract changes
- **effects** — disk (temporary fixtures), process (desk and stub pi), network (ephemeral loopback listeners)
- **errors** — failed checks increment the failure count; unexpected errors fail the process
- **callers** — —
- **callees** — `apps/desk/pi-session.mjs`, `apps/desk/test/tmp-dir.mjs`

### `scripts/blast-radius.mjs`

- **purpose** — Draw a change's blast radius as one self-contained HTML page, from the code map and the git-diffed changed set against the merge base, with no script, no external reference and no machine-specific content.
- **inputs** — argv (--root <dir> --base <rev> --out <file>); the code map's config, modules and graph through scripts/code-map.mjs; working-tree git state read through the injected git runner (default scripts/requirements-moved.mjs's defaultGit)
- **outputs** — the HTML page written to <file>; one stdout line naming the per-column counts, the unmapped count and the out path
- **effects** — disk (reads module sources and code-map.config.json through the shim, creates the out file's folder and writes the page), process (runs read-only git commands: merge-base, diff, ls-files)
- **errors** — exit 2 for a usage error, naming --root, --base and --out; exit 1 for an unresolvable revision or no merge base, naming the cause, writing nothing
- **callers** — `packages/nana-pack/tests/blast-radius.test.mjs`
- **callees** — `packages/nana-pack/lib/blast-radius-config.mjs`, `scripts/code-map.mjs`, `scripts/requirements-moved.mjs`

### `scripts/code-map.mjs`

- **purpose** — Run the project template's code-map generator over this repo, adding the measured test files to --impact, so nana-pi's own map is produced by the tool it ships (G-004, G-007, G-009, G-010, G-011).
- **inputs** — argv (--write | --render | --check | --impact <file...>), code-map.config.json at the repo root, the modules under its roots, and for --impact, git and the runtime data file (NANA_RUNTIME_MAP_FILE override)
- **outputs** — docs/code-map.md on --write, the summary line plus problem list of --check, the transitive callers and callees plus the measured test files of --impact
- **effects** — disk (reads the config, the module sources and the runtime data file, writes the map), process (exits non-zero when --check or --write finds a problem; reads git for --impact's staleness check)
- **errors** — exit 1 with the problem list when a header is missing or malformed, an import breaks the layer direction, or the map is stale; a thrown Error for a bad config or an unknown mode
- **callers** — `packages/nana-pack/tests/code-map.test.mjs`, `packages/nana-pack/tests/requirement-rows.test.mjs`, `scripts/blast-radius.mjs`, `scripts/requirement-rows.mjs`
- **callees** — `packages/nana-pack/lib/runtime-map-config.mjs`, `packages/nana-pack/lib/runtime-map.mjs`

### `scripts/product-report.mjs`

- **purpose** — Builds a deterministic HTML product ledger from the requirements tree, HANDOFF asks, and repository provenance.
- **inputs** — REQUIREMENTS.md, HANDOFF.md, an optional assessment store, the HTML template, repository root, output or packet directory, injected git runner, and the runtime-map data file at its resolved path.
- **outputs** — A complete product ledger HTML file with ordered stage, deliverable and constraint metadata, deterministic assessment packets, an exported report model and renderer, or assessment-store problem strings.
- **effects** — disk (reads sources and store, writes the report or packets), process (queries git and reports CLI errors).
- **errors** — Refuses malformed ledgers, asks or stores, git failures, and output failures with named diagnostics.
- **callers** — `packages/nana-pack/tests/product-report.test.mjs`
- **callees** — `packages/nana-pack/lib/handoff-asks.mjs`, `packages/nana-pack/lib/runtime-map-config.mjs`, `packages/nana-pack/lib/runtime-map.mjs`, `scripts/requirements-trace.mjs`, `scripts/requirements-tree.mjs`

### `scripts/readme-check.mjs`

- **purpose** — Run the project template's README checker over this repo, so every command, path, flag and script name nana-pi's READMEs state is checked against the repo (G-012).
- **inputs** — argv (--check | --list), readme-check.config.json at the repo root, the READMEs it names, package.json and the files under scripts/
- **outputs** — the claim list on --list, the summary line plus problem list on either mode
- **effects** — disk (reads the READMEs, the files they name and the package metadata), process (exits non-zero when a README claim does not hold)
- **errors** — exit 1 with the problem list naming each README line whose claim fails; bad CLI arguments print usage to stderr and return status 2; a thrown Error for a bad config
- **callers** — `packages/nana-pack/tests/readme-check.test.mjs`
- **callees** — —

### `scripts/requirement-rows.mjs`

- **purpose** — List candidate requirement rows for files by joining the code map's test callers with the rail's markers.
- **inputs** — An injected import graph, traced marker map, status and requirement-cell lookups, or CLI file arguments.
- **outputs** — Direct and transitive-only candidate rows with an explicit uncertainty label.
- **effects** — disk and process
- **errors** — CLI exits nonzero when arguments or repo inputs are invalid.
- **callers** — `packages/nana-pack/tests/requirement-rows.test.mjs`
- **callees** — `scripts/code-map.mjs`, `scripts/requirements-trace.mjs`

### `scripts/requirements-lift-proof.mjs`

- **purpose** — Prove that a lifted ledger keeps every row and line of its input where a mapping places them.
- **inputs** — the input ledger text, a mapping object, the output ledger text, the general-engineering seed text, and { fromDefault }
- **outputs** — { problems, summary } from proveLift
- **effects** — none
- **errors** — never throws for a malformed lift output; a problem list names every mismatch found
- **callers** — `packages/nana-pack/tests/requirements-lift.test.mjs`, `scripts/requirements-lift.mjs`
- **callees** — `scripts/requirements-trace.mjs`, `scripts/requirements-tree.mjs`

### `scripts/requirements-lift.mjs`

- **purpose** — Lift a project's REQUIREMENTS.md into the requirements tree through a mapping, writing it only when proved and matching HEAD.
- **inputs** — argv (--root <dir> [--mapping <file> | --emit-mapping <file>] [--write | --verify <rev>]), the ledger, an optional mapping file, git, and the general-engineering seed
- **outputs** — the plan and proof lines on stdout, a written REQUIREMENTS.md or mapping file, or a named refusal on stderr
- **effects** — disk (reads the ledger, the mapping and the seed; writes REQUIREMENTS.md or a mapping file through a temp file and rename), process (runs git read-only; exit 0/1/2)
- **errors** — exit 2 for a usage error, naming --root; exit 1 for a named refusal (encoding, structure, a failed git gate, a failed proof); never a crash on honest input variation
- **callers** — `packages/nana-pack/tests/requirements-cap-kinds.test.mjs`, `packages/nana-pack/tests/requirements-lift.test.mjs`, `packages/nana-pack/tests/requirements-regroup.test.mjs`, `scripts/requirements-regroup.mjs`
- **callees** — `scripts/requirements-lift-proof.mjs`, `scripts/requirements-trace.mjs`, `scripts/requirements-tree.mjs`

### `scripts/requirements-moved.mjs`

- **purpose** — Report requirement-row changes by feature and capability placement or field changes since a revision's merge base with HEAD.
- **inputs** — argv (--root <dir> --base <rev>); REQUIREMENTS.md as committed at HEAD and at the merge base of <rev> and HEAD, read through git.
- **outputs** — One summary line, affected feature blocks, and, when capability placement or fields changed, a capabilities section with one line per change, on stdout; a named refusal on stderr.
- **effects** — process (runs read-only git commands: merge-base, rev-parse, cat-file -e, show)
- **errors** — exit 2 for a usage error, naming --root and --base; exit 1 for a read failure (an unresolvable revision, no merge base, or REQUIREMENTS.md absent at HEAD), naming the cause.
- **callers** — `packages/nana-pack/tests/requirements-moved.test.mjs`, `scripts/blast-radius.mjs`
- **callees** — `scripts/requirements-tree.mjs`

### `scripts/requirements-regroup.mjs`

- **purpose** — Check a regroup proposal against the lift and the regroup rules and write the packet its owner reviews.
- **inputs** — argv (--root <dir> --proposal <file> --out <page>), the ledger, the proposal JSON file, scripts/requirements-lift.mjs
- **outputs** — the review page written to <page> on success, or a named refusal on stderr with no page written
- **effects** — disk (reads the ledger and the proposal; writes <page> through a plain write, removing an earlier page of its own on failure), process (spawns the lift read-only, no shell; exit 0/1/2)
- **errors** — exit 2 for a usage error, naming --root, --proposal and --out; exit 1 for a named refusal (an --out collision, a lift problem, a regroup check); never a crash on honest input variation
- **callers** — `packages/nana-pack/tests/requirements-regroup.test.mjs`
- **callees** — `scripts/requirements-lift.mjs`, `scripts/requirements-trace.mjs`, `scripts/requirements-tree.mjs`

### `scripts/requirements-trace.mjs`

- **purpose** — Run the project template's requirements-trace rail over this repo, so every REQUIREMENTS.md row's status is measured against the `req:` markers nana-pi's suites carry.
- **inputs** — REQUIREMENTS.md at the repo root, every *.test.mjs under the six test roots named here, and the process environment
- **outputs** — the summary line, the `ears:` off-form line, one problem line per disagreement between a row's status, form or evidence and the markers, and the opt-in unclaimed-declaration listing
- **effects** — disk (reads REQUIREMENTS.md and the test sources), process (writes reports and sets a non-zero exit code when a row and the suite disagree)
- **errors** — exit 1 with the problem list; a thrown Error for a malformed requirements table, a bad requirement id or a marker that sits above no test call
- **callers** — `packages/nana-pack/tests/code-map.test.mjs`, `packages/nana-pack/tests/requirement-rows.test.mjs`, `packages/nana-pack/tests/requirements-trace.test.mjs`, `packages/nana-pack/tests/requirements-tree.test.mjs`, `packages/nana-pack/tests/requirements-unclaimed.test.mjs`, `scripts/product-report.mjs`, `scripts/requirement-rows.mjs`, `scripts/requirements-lift-proof.mjs`, `scripts/requirements-lift.mjs`, `scripts/requirements-regroup.mjs`, `scripts/requirements-tree.mjs`
- **callees** — —

### `scripts/requirements-tree.mjs`

- **purpose** — Validate the capability and feature structure of REQUIREMENTS.md and render its lifecycle and shared-requirement outline.
- **inputs** — REQUIREMENTS.md and, for the CLI, docs/requirements-tree.md.
- **outputs** — Parsed headings and tables, structural problem lists, and rendered outline Markdown.
- **effects** — disk (reads the ledger and optionally writes or checks the generated outline), process (CLI reports errors and exit status)
- **errors** — Named structural problems for misplaced rows, invalid purposes, duplicate IDs, invalid capability fields, lifecycle or sharing, nesting, or stale output.
- **callers** — `packages/nana-pack/tests/product-report.test.mjs`, `packages/nana-pack/tests/requirements-cap-kinds.test.mjs`, `packages/nana-pack/tests/requirements-lift.test.mjs`, `packages/nana-pack/tests/requirements-tree.test.mjs`, `packages/nana-pack/tests/templates-render.test.mjs`, `scripts/product-report.mjs`, `scripts/requirements-lift-proof.mjs`, `scripts/requirements-lift.mjs`, `scripts/requirements-moved.mjs`, `scripts/requirements-regroup.mjs`
- **callees** — `scripts/requirements-trace.mjs`

### `scripts/runtime-measure.mjs`

- **purpose** — Run the suite once under per-file coverage and write the runtime-map data file.
- **inputs** — the repo root, env (passed to the suite, with the coverage knob added), and injectable suite start, signal source, process listing and kill calls for tests
- **outputs** — the runtime data file (schema 1 JSON: tracked-file hashes and per-test label/seconds/ran) and the suite's own exit code
- **effects** — process (spawns git and the locked suite, forwards SIGINT/SIGTERM, lists and kills the suite's process tree), disk (a temp coverage folder under the OS temp folder, the runtime data file)
- **errors** — leaves earlier runtime data unchanged and exits non-zero when the suite's completion record is missing or disagrees with the records read, or when a stop signal arrives before the suite finishes; otherwise exits with the suite's own exit code
- **callers** — `packages/nana-pack/tests/runtime-map.test.mjs`
- **callees** — `packages/nana-pack/lib/runtime-map-config.mjs`, `packages/nana-pack/lib/runtime-map.mjs`

### `scripts/template-acceptance.mjs`

- **purpose** — Render and run every native check job for both templates and adoption modes at one immutable commit.
- **inputs** — CLI source/ref and injectable child-process runner.
- **outputs** — One failure report per failed command and a process exit status.
- **effects** — process (git, copier, and package-manager children), disk (temporary renders).
- **errors** — Missing tools, render failures, timeouts, or check failures return status 1.
- **callers** — `packages/nana-pack/tests/template-acceptance.test.mjs`, `scripts/template-release.mjs`
- **callees** — —

### `scripts/template-release.mjs`

- **purpose** — Gate a contained template commit before creating or pushing its next annotated version tag.
- **inputs** — CLI ref and push option, injectable Git runner, and injectable acceptance gate.
- **outputs** — Release status and a process exit code.
- **effects** — process (Git and acceptance children), disk (annotated Git tag).
- **errors** — Git, containment, gate, tag, or push failures return status 1.
- **callers** — `packages/nana-pack/tests/template-release.test.mjs`
- **callees** — `packages/nana-pack/lib/release-status.mjs`, `scripts/template-acceptance.mjs`

### `scripts/test-locked.mjs`

- **purpose** — Serialize unfiltered suite runs across worktrees while allowing filtered runs concurrently.
- **inputs** — Filter arguments, NANA_SUITE_LOCK_DIR, NANA_SUITE_JOBS, and an optional fixture command override.
- **outputs** — The invoked suite's exit code.
- **effects** — disk (lock directory), process (spawns npm or the injected command).
- **errors** — Propagates suite failures through the process exit code and reports lock errors.
- **callers** — —
- **callees** — `packages/nana-pack/lib/test-runner-config.mjs`

### `scripts/test.mjs`

- **purpose** — The canonical test runner — run every collected `*.test.mjs` file in its own process tree with a fresh temp HOME and report one line each.
- **inputs** — argv (--verbose, --self-test, --jobs=N, path substrings), env NANA_TEST_SELFTEST, NANA_TEST_TIMEOUT_MS, NANA_COVERAGE_DIR (runtime-map's coverage knob), PI_CODING_AGENT_DIR and CLAUDE_CONFIG_DIR, the test files directly under each package's tests/ dir, apps/desk/test and apps/bench/test (e2e, studies and fixture dirs excluded), the declared run-alone list (test-runner-config.mjs), and on win32 the declared Windows skip list (windows-skips-config.mjs)
- **outputs** — one PASS / FAIL / SKIP line per file with its check counts and timing, the first 20 failing lines of a red file in non-verbose mode, a totals line with warnings and the self-test verdict, and the exit code; with --jobs=N greater than 1 the same report apart from timings and file-block order, each file's shown output and result line written together as one block; while NANA_COVERAGE_DIR is set, also the knob line and, per file, a coverage folder with a path/label/seconds record, plus one completion record naming the collected file count
- **effects** — process (spawns each file as `node --experimental-strip-types` in its own group with a child env scrubbed of every ambient NANA_* but the NANA_TEST_* knobs, and of PI_CODING_AGENT_DIR and CLAUDE_CONFIG_DIR, kills that group or taskkills the tree on timeout, SIGINT or SIGTERM), disk (a mkdtemp scratch dir, a per-file temp HOME and the self-test fixtures, all removed on every exit path; while NANA_COVERAGE_DIR is set, a record and a completion file under that folder, never removed by this runner)
- **errors** — exit 1 when any file failed, timed out, died on a signal, matched nothing, or a self-test fixture missed its expected verdict; exit 130 on SIGINT and 143 on SIGTERM; exit 0 otherwise
- **callers** — —
- **callees** — `packages/nana-pack/lib/runtime-map-config.mjs`, `packages/nana-pack/lib/test-runner-config.mjs`, `packages/nana-pack/lib/windows-skips-config.mjs`

### `scripts/ts-syntax-check.mjs`

- **purpose** — Compile a TypeScript file as a module without evaluating its code.
- **inputs** — One TypeScript file path.
- **outputs** — Exit 0 for valid syntax or exit 1 with a filename-qualified error.
- **effects** — disk (reads the source file only).
- **errors** — Exits 1 for a missing argument, read failure, or syntax error.
- **callers** — —
- **callees** — —

## Packages

The pi extension pack, the knowledge pull, the staged-block layer and the setup bootstrap — the installable units. Within the layer imports are free (nana-pi ships as one package); nothing here may reach up into an app.

### `packages/nana-knowledge/bin/nana-knowledge.ts`

- **purpose** — The knowledge CLI — build, query, hook, status and prune over the local index.
- **inputs** — argv (`build [--rebuild]`, `query <text> [--limit N] [--json]`, `hook`, `status`, `prune`), hook JSON on stdin (up to STDIN_MAX_BYTES), and sources.json bytes plus the index
- **outputs** — build counts, source/root and index-damage markers, query hits or JSON, index/root status, and the hook pointer block on stdout; usage and query failures on stderr
- **effects** — disk (builds and reads the index, writes the shown files and pull.log), database, process (sets the exit code; `hook` arms a BUDGET_MS unref'd self-exit timer before touching stdin)
- **errors** — exit 2 on a bad or unknown invocation, 1 when `query` finds no index or cannot open/query it, and 0 otherwise — including reported index damage, source-file problems, every `hook` failure, and a build that lost the lock
- **callers** — —
- **callees** — `packages/nana-knowledge/lib/build.ts`, `packages/nana-knowledge/lib/db.ts`, `packages/nana-knowledge/lib/hook.ts`, `packages/nana-knowledge/lib/paths.ts`, `packages/nana-knowledge/lib/query.ts`, `packages/nana-knowledge/lib/sources.ts`

### `packages/nana-knowledge/extensions/nana-knowledge.ts`

- **purpose** — pi extension that injects the prompt's knowledge pointers by running the pull CLI out-of-process, fail-open.
- **inputs** — pi `before_agent_start` events (prompt), the session id from ctx.sessionManager, ctx.cwd, and bin/nana-knowledge.ts invoked through node
- **outputs** — a `nana-knowledge` custom message (display: true) carrying whatever the CLI printed, or nothing
- **effects** — process (spawns the CLI with the prompt on stdin under a TIMEOUT_MS deadline, then SIGKILLs it best-effort)
- **errors** — none — a spawn throw, ENOENT, non-zero exit, deadline kill, blown maxBuffer, a non-string prompt or a missing session id all yield no pointers
- **callers** — —
- **callees** — `packages/nana-knowledge/lib/tokenize.ts`

### `packages/nana-knowledge/lib/build.ts`

- **purpose** — Build or recover the knowledge index under an atomic build lock, re-indexing only files whose bytes changed.
- **inputs** — roots or a read/parse problem from sources.json, the `.md` files under readable roots (≤ MAX_FILE_BYTES, symlinks and SKIP_DIRS skipped), the existing `files` table, `rebuild`, and an optional recovery-lock test hook
- **outputs** — BuildStats (per-root counts, totals, preserved and removed rows, source and damage outcomes, timing and db size), the index's meta rows, the index age, and a doc count
- **effects** — disk (creates and releases build.lock and its reclaim lock, writes index.db and its WAL, deletes the db files on rebuild, prunes shown/ past its TTL), database (docs/files writes in 500-row transactions, a WAL truncate checkpoint)
- **errors** — BuildLockedError when another live builder holds the lock; unrecoverable node:sqlite errors; a sources problem or unreadable root/folder keeps its indexed rows
- **callers** — `packages/nana-knowledge/bin/nana-knowledge.ts`, `packages/nana-knowledge/lib/hook.ts`, `packages/nana-knowledge/tests/discovery.test.mjs`, `packages/nana-knowledge/tests/extension.test.mjs`, `packages/nana-knowledge/tests/hook.test.mjs`, `packages/nana-knowledge/tests/incremental-build.test.mjs`, `packages/nana-knowledge/tests/recover.test.mjs`, `packages/nana-knowledge/tests/render.test.mjs`, `packages/nana-knowledge/tests/unreadable-root.test.mjs`
- **callees** — `packages/nana-knowledge/lib/db.ts`, `packages/nana-knowledge/lib/parse.ts`, `packages/nana-knowledge/lib/paths.ts`, `packages/nana-knowledge/lib/sources.ts`

### `packages/nana-knowledge/lib/db.ts`

- **purpose** — Open and verify the node:sqlite knowledge database, create its FTS5 schema on the build path, and read or write the meta table.
- **inputs** — the database file path and {create, readonly}; node:sqlite imported dynamically with its SQLite ExperimentalWarning muted
- **outputs** — a Db handle (exec / prepare / close), index damage classification and validation, a meta value or null, and SCHEMA_VERSION
- **effects** — disk (mkdirs the parent and creates the database file on the create path), database (WAL pragmas, the docs/files/docs_fts schema and its triggers, meta upserts)
- **errors** — openDb rejects after closing a created handle when setup fails; checkIndex throws IndexDamageError or node:sqlite damage; getMeta swallows and returns null
- **callers** — `packages/nana-knowledge/bin/nana-knowledge.ts`, `packages/nana-knowledge/lib/build.ts`, `packages/nana-knowledge/lib/hook.ts`, `packages/nana-knowledge/lib/query.ts`, `packages/nana-knowledge/tests/discovery.test.mjs`, `packages/nana-knowledge/tests/hook.test.mjs`, `packages/nana-knowledge/tests/incremental-build.test.mjs`, `packages/nana-knowledge/tests/recover.test.mjs`, `packages/nana-knowledge/tests/unreadable-root.test.mjs`
- **callees** — —

### `packages/nana-knowledge/lib/hook.ts`

- **purpose** — One prompt-time knowledge pull — the block of pointers to print for a prompt, or nothing.
- **inputs** — the hook JSON on stdin as a string (prompt, session_id, cwd, source / hook_event_name), NANA_ROLE environment variable, the index at paths.db, and the per-session shown file
- **outputs** — HookResult {output, reason, hits} whose output is the `[nana:knowledge]` block (header plus one pointer line per hit, ≤ BLOCK_MAX_CHARS) or null; writes the session's shown keys and eligible outcome records to pull.log
- **effects** — disk (reads the index, writes shown/<session>.json, appends pull.log), database (the BM25 search), process (spawns a detached, unref'd rebuild when the index is older than STALE_MS)
- **errors** — none — every failure is a named reason instead of output: bad-json, bad-input, a skipReason, no-index(<freshness>), budget, db-open-failed, query-failed, no-hits, all-shown, empty-block, reviewer-role, worker-role
- **callers** — `packages/nana-knowledge/bin/nana-knowledge.ts`, `packages/nana-knowledge/tests/discovery.test.mjs`, `packages/nana-knowledge/tests/hook.test.mjs`, `packages/nana-knowledge/tests/recover.test.mjs`, `packages/nana-knowledge/tests/render.test.mjs`
- **callees** — `packages/nana-knowledge/lib/build.ts`, `packages/nana-knowledge/lib/db.ts`, `packages/nana-knowledge/lib/paths.ts`, `packages/nana-knowledge/lib/query.ts`, `packages/nana-knowledge/lib/tokenize.ts`, `packages/nana-pack/lib/display.mjs`

### `packages/nana-knowledge/lib/parse.ts`

- **purpose** — Turn one markdown file into indexable rows — a single row per article, or one row per `[uses:` ledger entry.
- **inputs** — a file path and that file's text content
- **outputs** — Row records {key, path, loc, title, body} — key is the path, plus `#L<line>` for a ledger entry — and the frontmatter/body split with the derived title
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-knowledge/lib/build.ts`, `packages/nana-knowledge/tests/ledger-parse.test.mjs`
- **callees** — —

### `packages/nana-knowledge/lib/paths.ts`

- **purpose** — The user-scope locations of the knowledge index, all under one deletable directory.
- **inputs** — env NANA_KNOWLEDGE_HOME (tests only) and os.homedir()
- **outputs** — the home dir plus the sources.json, index.db, shown/, pull.log and build.lock paths, and tildeify's `~`-collapsed display form
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-knowledge/bin/nana-knowledge.ts`, `packages/nana-knowledge/lib/build.ts`, `packages/nana-knowledge/lib/hook.ts`, `packages/nana-knowledge/lib/query.ts`, `packages/nana-knowledge/lib/sources.ts`, `packages/nana-knowledge/tests/recover.test.mjs`
- **callees** — —

### `packages/nana-knowledge/lib/query.ts`

- **purpose** — BM25 search over the index, rendered as the bounded pointer fields a prompt can carry safely.
- **inputs** — an open Db handle, the query text, and a row limit
- **outputs** — Hit records {key, path, display, loc, kind, title, snippet, score} whose every field is one line, capped (TITLE_MAX / DISPLAY_MAX / SNIPPET_MAX) and free of the literal FIELD_SEP, the display path exact or reversibly JSON-escaped
- **effects** — database (one SELECT over docs_fts joined to docs)
- **errors** — database prepare/query errors are thrown to the caller; a row that cannot be rendered loses only its own pointer
- **callers** — `packages/nana-knowledge/bin/nana-knowledge.ts`, `packages/nana-knowledge/lib/hook.ts`, `packages/nana-knowledge/tests/discovery.test.mjs`, `packages/nana-knowledge/tests/hook.test.mjs`, `packages/nana-knowledge/tests/incremental-build.test.mjs`, `packages/nana-knowledge/tests/recover.test.mjs`, `packages/nana-knowledge/tests/render.test.mjs`, `packages/nana-knowledge/tests/unreadable-root.test.mjs`
- **callees** — `packages/nana-knowledge/lib/db.ts`, `packages/nana-knowledge/lib/paths.ts`, `packages/nana-knowledge/lib/tokenize.ts`, `packages/nana-pack/lib/display.mjs`

### `packages/nana-knowledge/lib/sources.ts`

- **purpose** — Resolve which knowledge roots to index, seeding sources.json on first run and discovering roots by convention.
- **inputs** — sources.json bytes at paths.sources (`roots` plus an optional `discover` block), os.homedir(), and the directory entries of every configured parent
- **outputs** — the de-nested, de-duplicated root list (explicit roots first, then discovered ones), extra skip names, an unreadable or safe unparseable problem, its marker formatter, and root utilities
- **effects** — disk (reads sources.json, readdirs each parent and stats each candidate subdir; writes a seeded sources.json when the file is absent)
- **errors** — returns unreadable or safe unparseable source problems; missing sources seed as before, while a missing parent, missing subdir or unwritable home is skipped silently
- **callers** — `packages/nana-knowledge/bin/nana-knowledge.ts`, `packages/nana-knowledge/lib/build.ts`, `packages/nana-knowledge/tests/discovery.test.mjs`
- **callees** — `packages/nana-knowledge/lib/paths.ts`, `packages/nana-pack/lib/json-text.mjs`

### `packages/nana-knowledge/lib/tokenize.ts`

- **purpose** — Turn a prompt into FTS5 query tokens, and decide whether a prompt is worth a knowledge pull at all.
- **inputs** — arbitrary prompt text (callers slice it to PROMPT_MAX_CHARS first)
- **outputs** — lowercased alnum tokens, the meaningful (non-stopword, len>2, deduped) tokens, an OR-joined quoted FTS5 MATCH string, and a skip reason or null
- **effects** — none
- **errors** — none — a non-string prompt yields the skip reason `not-a-string`, alongside too-short, slash-command, harness-notification and too-few-tokens
- **callers** — `packages/nana-knowledge/extensions/nana-knowledge.ts`, `packages/nana-knowledge/lib/hook.ts`, `packages/nana-knowledge/lib/query.ts`, `packages/nana-knowledge/tests/extension.test.mjs`, `packages/nana-knowledge/tests/tokenize.test.mjs`
- **callees** — —

### `packages/nana-knowledge/tests/discovery.test.mjs`

- **purpose** — Pins knowledge roots BY CONVENTION — a repository under a configured parent is indexed with no edit to sources.json, and the things that are not knowledge stay out
- **inputs** — the discovery path in lib/ plus the build CLI, and temp parent directories holding fake repositories and worktrees
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp directories and markdown fixtures), process (spawns the build CLI)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-knowledge/lib/build.ts`, `packages/nana-knowledge/lib/db.ts`, `packages/nana-knowledge/lib/hook.ts`, `packages/nana-knowledge/lib/query.ts`, `packages/nana-knowledge/lib/sources.ts`, `packages/nana-knowledge/tests/tmp-dir.mjs`

### `packages/nana-knowledge/tests/extension.test.mjs`

- **purpose** — Pins that the pi extension is ONE thin wrapper around the hook CLI — fail-open on every child failure, never a reject out of before_agent_start, and no sqlite inside pi's process
- **inputs** — extensions/nana-knowledge.ts, bin/nana-knowledge.ts, and a temp NANA_KNOWLEDGE_HOME with a markdown source tree
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp home, source tree and index, plus a copied extension tree under td and the stub CLIs it writes), process (sets NANA_KNOWLEDGE_HOME, spawns the hook CLI and the copied extension's stub CLI)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-knowledge/lib/build.ts`, `packages/nana-knowledge/lib/tokenize.ts`, `packages/nana-knowledge/tests/tmp-dir.mjs`

### `packages/nana-knowledge/tests/hook.test.mjs`

- **purpose** — Pins that the prompt hook is fail-open, bounded and never repeats a pointer inside one session, since it runs on every prompt the owner types
- **inputs** — bin/nana-knowledge.ts, markdown sources and an index under a temp NANA_KNOWLEDGE_HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp home, source tree and index), process (sets NANA_KNOWLEDGE_HOME, spawns the hook CLI, kills the hook command's process group on POSIX and waits for one background build to finish)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-knowledge/lib/build.ts`, `packages/nana-knowledge/lib/db.ts`, `packages/nana-knowledge/lib/hook.ts`, `packages/nana-knowledge/lib/query.ts`, `packages/nana-knowledge/tests/tmp-dir.mjs`

### `packages/nana-knowledge/tests/incremental-build.test.mjs`

- **purpose** — Pins that the index build is incremental on CONTENT HASH rather than mtime, and that the things it must skip stay skipped
- **inputs** — the build and database modules under lib/, and a temp source tree under a temp NANA_KNOWLEDGE_HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp source tree), database (the temp sqlite index it builds), process (sets NANA_KNOWLEDGE_HOME)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-knowledge/lib/build.ts`, `packages/nana-knowledge/lib/db.ts`, `packages/nana-knowledge/lib/query.ts`, `packages/nana-knowledge/tests/tmp-dir.mjs`

### `packages/nana-knowledge/tests/ledger-parse.test.mjs`

- **purpose** — Pins that a line-oriented ledger indexes as one row per ENTRY — not per file, not per physical line — against a fixture mirroring the doctrine ledger exactly
- **inputs** — lib/parse.ts and a doctrine-shaped markdown fixture written to a temp dir
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (a temp fixture file)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-knowledge/lib/parse.ts`, `packages/nana-knowledge/tests/tmp-dir.mjs`

### `packages/nana-knowledge/tests/recover.test.mjs`

- **purpose** — Prove damaged knowledge indexes are rebuilt safely, reported without stacks, or preserved when sources cannot be parsed.
- **inputs** — Temporary profiles, article roots and indexes damaged as bytes, pages or incomplete SQLite schemas.
- **outputs** — Eleven PASS/FAIL/SKIP lines for R-2400 through R-2409, with exit 1 when any check fails.
- **effects** — disk (temporary sources and indexes), database (SQLite fixtures), process (spawns the CLI and a detached hook rebuild).
- **errors** — A failed or timed-out case prints FAIL; fixture and child-process errors are contained by that case.
- **callers** — —
- **callees** — `packages/nana-knowledge/lib/build.ts`, `packages/nana-knowledge/lib/db.ts`, `packages/nana-knowledge/lib/hook.ts`, `packages/nana-knowledge/lib/paths.ts`, `packages/nana-knowledge/lib/query.ts`, `packages/nana-knowledge/tests/tmp-dir.mjs`

### `packages/nana-knowledge/tests/render.test.mjs`

- **purpose** — Pins that every knowledge pointer reaches the prompt through nana-pack's ONE renderer, asserted on rendered output because titles and paths come from other people's repositories
- **inputs** — the knowledge query and render path under lib/, nana-pack's lib/display.mjs, and hostile titles, snippets and filenames in a temp source tree
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp source tree and index under a temp home), process (sets NANA_KNOWLEDGE_HOME)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-knowledge/lib/build.ts`, `packages/nana-knowledge/lib/hook.ts`, `packages/nana-knowledge/lib/query.ts`, `packages/nana-knowledge/tests/tmp-dir.mjs`

### `packages/nana-knowledge/tests/sources-file.test.mjs`

- **purpose** — Pin byte-mark decoding and safe index preservation and reporting when sources.json cannot be parsed or read.
- **inputs** — Temporary profiles, knowledge homes, article roots, marked JSON bytes, malformed JSON fixtures, and the knowledge CLI.
- **outputs** — Seven PASS/FAIL lines for sources-file behavior, with exit 1 when a check fails.
- **effects** — disk (temporary fixtures and indexes), process (spawns the CLI with isolated homes).
- **errors** — A failed check prints FAIL; an unexpected fixture or child-process failure makes its check fail.
- **callers** — —
- **callees** — `packages/nana-knowledge/tests/tmp-dir.mjs`, `packages/nana-pack/lib/json-text.mjs`

### `packages/nana-knowledge/tests/tmp-dir.mjs`

- **purpose** — Create test temporary roots and remove them when the test process exits.
- **inputs** — A mkdtemp prefix.
- **outputs** — The created temporary directory path.
- **effects** — disk (creates and removes temporary directories), process (registers exit cleanup)
- **errors** — Propagates directory creation errors and ignores cleanup errors.
- **callers** — `packages/nana-knowledge/tests/discovery.test.mjs`, `packages/nana-knowledge/tests/extension.test.mjs`, `packages/nana-knowledge/tests/hook.test.mjs`, `packages/nana-knowledge/tests/incremental-build.test.mjs`, `packages/nana-knowledge/tests/ledger-parse.test.mjs`, `packages/nana-knowledge/tests/recover.test.mjs`, `packages/nana-knowledge/tests/render.test.mjs`, `packages/nana-knowledge/tests/sources-file.test.mjs`, `packages/nana-knowledge/tests/unreadable-root.test.mjs`
- **callees** — —

### `packages/nana-knowledge/tests/tokenize.test.mjs`

- **purpose** — Pins what the prompt hook decides to search on and what it refuses to search on at all
- **inputs** — lib/tokenize.ts
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — none
- **errors** — a failed check prints FAIL and the run exits 1
- **callers** — —
- **callees** — `packages/nana-knowledge/lib/tokenize.ts`

### `packages/nana-knowledge/tests/unreadable-root.test.mjs`

- **purpose** — Pin status and build reporting for readable-file, missing and unreadable roots, including rebuild row loss.
- **inputs** — Temporary article and file roots, POSIX modes or Windows deny ACLs, and the knowledge build and CLI modules.
- **outputs** — PASS/FAIL/SKIP lines for unreadable and missing path behavior, with exit 1 when a check fails.
- **effects** — disk (temporary roots and index), database (temporary SQLite index), process (spawns the CLI and sets test homes).
- **errors** — A failed check prints FAIL; unsupported permission denial prints declared SKIPs; unexpected errors fail the run.
- **callers** — —
- **callees** — `packages/nana-knowledge/lib/build.ts`, `packages/nana-knowledge/lib/db.ts`, `packages/nana-knowledge/lib/query.ts`, `packages/nana-knowledge/tests/tmp-dir.mjs`

### `packages/nana-pack/bin/nana-adoption.mjs`

- **purpose** — Print the seat's session-start block of git repositories a session ran in that nobody has adopted.
- **inputs** — argv (`--cwd <dir>` accepted and unused), the tail of the journal named by lib/adoption.mjs adoptionSettings, and each claimed root's current state on disk
- **outputs** — `[nana:adoption]` plus the Markdown block on stdout (paths as code spans, at most SHOW rows, then a refused-entry count), an `ADOPTION UNAVAILABLE` line when the journal exists but cannot be read, and nothing when nothing is open
- **effects** — disk (reads the journal tail, stats each claimed root and its ancestors)
- **errors** — none — always exits 0; a journal or reader failure prints the ADOPTION UNAVAILABLE line instead of a stack
- **callers** — —
- **callees** — `packages/nana-pack/lib/adoption.mjs`, `packages/nana-pack/lib/display.mjs`

### `packages/nana-pack/bin/nana-frontier.mjs`

- **purpose** — Reports structural drift in a HANDOFF frontier without changing the document.
- **inputs** — a HANDOFF path, optional --today YYYY-MM-DD clock and optional --strict flag
- **outputs** — one file:line finding per issue followed by a summary; strict mode sets failure status
- **effects** — disk (reads the named HANDOFF)
- **errors** — unreadable input and malformed options or dates are reported; errors exit nonzero only in strict mode
- **callers** — —
- **callees** — `packages/nana-pack/lib/frontier-config.mjs`, `packages/nana-pack/lib/handoff-asks.mjs`

### `packages/nana-pack/bin/nana-land.mjs`

- **purpose** — Verify reviewed integration work, land it by fast-forward, and safely remove contained lane worktrees.
- **inputs** — merge or cleanup arguments, a home directory for the review ledger, and an injectable process runner.
- **outputs** — Named pure argument helpers and command results or printed CLI records.
- **effects** — process (runs git and a suite command), disk (git merge and worktree cleanup).
- **errors** — Invalid arguments, failed preconditions, suite failures, and git failures return a named refusal without continuing.
- **callers** — `packages/nana-pack/tests/land.test.mjs`
- **callees** — `packages/nana-pack/bin/review-round.mjs`, `packages/nana-pack/lib/real-path.mjs`, `packages/nana-pack/lib/release-status.mjs`

### `packages/nana-pack/bin/nana-objective.mjs`

- **purpose** — Print the objective block for a session cwd as the Claude Code SessionStart hook's producer.
- **inputs** — argv (`--cwd <dir>`, default process.cwd()), process.versions.node, and the user-scope objective settings read through lib/config.ts loadUserObjective
- **outputs** — `[nana:objective]` plus lib/objective.ts's block on stdout, and nothing at all when objective.enabled is false
- **effects** — disk (lib/objective.ts reads the objective files and the trust store)
- **errors** — none — always exits 0; a Node older than 22.18 or a failed dynamic import prints an `OBJECTIVE UNAVAILABLE` marker naming the cause
- **callers** — —
- **callees** — `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/objective.ts`

### `packages/nana-pack/bin/nana-roster.mjs`

- **purpose** — Resolve and print this machine's roster from the user-scope nana-pack.json.
- **inputs** — an agent dir (the CLI reads pi's active one) and its nana-pack.json, when present
- **outputs** — resolveRoster(agentDir) -> {ok:true, roster, source} | {ok:false, file, problem}; orderedRoster(roster) -> the roster with every slot in SLOT_PRINT_ORDER; the CLI prints one line per slot and a source line on stdout, or with --json one JSON object {roster: ...}, or the refusal on stderr
- **effects** — disk (reads the user-scope nana-pack.json; the CLI's `set` subcommand, dynamically loaded, replaces it and may write nana-pack.json.bak)
- **errors** — resolveRoster never throws; the CLI exits 1 on a refused roster or a refused `set`
- **callers** — `packages/nana-pack/bin/pi-worker.mjs`, `packages/nana-pack/extensions/nana-roster-notice.ts`, `packages/nana-pack/lib/roster-set.mjs`, `packages/nana-pack/tests/nana-roster-set.test.mjs`, `packages/nana-pack/tests/nana-roster.test.mjs`, `packages/nana-pack/tests/roster-notice.test.mjs`, `packages/nana-setup/claude/hooks/nana-roster-notice.mjs`
- **callees** — `packages/nana-pack/bin/worker-config.mjs`, `packages/nana-pack/lib/agent-dir.mjs`, `packages/nana-pack/lib/bounded-read.mjs`, `packages/nana-pack/lib/json-text.mjs`, `packages/nana-pack/lib/roster-set.mjs`

### `packages/nana-pack/bin/nana-writing.mjs`

- **purpose** — Report-only CLI over the writing checker: stdin or named files, four checks always, two more under --report, one summary line, exit 0 always.
- **inputs** — argv (paths, --report); stdin when no path is given; each named file's bytes
- **outputs** — stdout: one `<file>:<line>: <check>: <detail>` line per finding, then one `summary …` line; always exits 0 (R-750)
- **effects** — disk (reads each named file; reads stdin when no path is given)
- **errors** — none thrown for a finding — an unreadable file prints one `<file>:0: error: …` line and is otherwise skipped; always exits 0
- **callers** — —
- **callees** — `packages/nana-pack/lib/writing-check.mjs`

### `packages/nana-pack/bin/pi-review.mjs`

- **purpose** — Run a `pi` REVIEW under the liveness watchdog and the per-item round cap, recording the verdict only when a review was produced.
- **inputs** — argv (--out, --item, --tree, --role, --revision, --over-cap, --stall-secs, --retries, --poll, then `--` and the pi args), the user-scope review ledger, the reviewed tree's git revision, and prompts/review-standard.md
- **outputs** — the review text written to --out, a round recorded in the ledger, and the admission note, warnings and a SUCCESS, FAILED or unread-verdict line on stderr
- **effects** — disk (writes --out plus the ledger's reservation, tally and audit files), process (the watchdog's `pi` child, the reservation heartbeat, the exit code)
- **errors** — exit 1 when admission is refused (over the cap, a git failure, a bad --out, bad args, a missing, non-regular or blank review standard), when every attempt stalled or failed, when the round could not be recorded, or when its recorded verdict is empty; exit 0 otherwise
- **callers** — —
- **callees** — `packages/nana-pack/bin/pi-watchdog.mjs`, `packages/nana-pack/bin/review-round.mjs`, `packages/nana-pack/bin/review-shape.mjs`, `packages/nana-pack/bin/worker-config.mjs`, `packages/nana-pack/lib/real-path.mjs`

### `packages/nana-pack/bin/pi-watchdog.mjs`

- **purpose** — Start pi (on win32 through its npm Node entry) under a CPU-liveness watchdog that kills and retries attempts whose CPU time stays flat and cleans up child trees on termination signals.
- **inputs** — the launcher's argv before `--` (--out, --stall-secs, --retries, --poll) and the pi args after it, the child's CPU time from `ps` or the PowerShell TotalProcessorTime tick read, the caller's accept(text) predicate, and, on win32, PATH, PATHEXT and pi's npm package's `package.json`
- **outputs** — {ok, text, attempt} with captured output, signal-aborted status, parseCpuSample seconds/null, per-poll `cpu=…s` or `cpu=unreadable` flat=n/m, STALL and attempt lines on stderr, the RETRIES_NOTICE string, a parse {error}, and piLaunch's own `{command, args}` or `{refused}`
- **effects** — process (spawns pi detached per attempt with NANA_HANDOFF=off — by name, its located `.exe`/`.com`, or node with its entry on win32 — kills its process tree on a stall or signal, shells out to ps via execSync), disk (a mkdtemp dir per attempt holding the child's stdout and stderr; on win32 a PATH lookup, a `package.json` read and the entry's stat)
- **errors** — never throws — a bad invocation returns {error:'usage'} or a named message for a non-positive --stall-secs/--poll or a non-whole --retries, a spawn failure or stall returns ok:false with the partial text, and a win32 launch refusal is returned as `{refused}` and treated as a failed attempt
- **callers** — `packages/nana-pack/bin/pi-review.mjs`, `packages/nana-pack/bin/pi-worker.mjs`, `packages/nana-pack/bin/review-launch.mjs`, `packages/nana-setup/lib/pi-invocation.mjs`
- **callees** — `packages/nana-pack/bin/worker-config.mjs`, `packages/nana-pack/lib/win-command.mjs`

### `packages/nana-pack/bin/pi-worker.mjs`

- **purpose** — Run a pi worker under a liveness watchdog, with an optional fail-closed linked-worktree lane mode.
- **inputs** — argv (--out, watchdog knobs, optional lane options, then `--` and pi args), and in lane mode this machine's roster (the user-scope nana-pack.json in pi's active agent dir)
- **outputs** — worker output written to --out, SUCCESS / FAILED diagnostics on stderr, and in lane mode one `pi-worker: builder: …; source: …` line (`builder (larger lanes):` for a `--lane-size larger` launch whose largerBuilder slot is set, plain `builder:` when that slot is null and it falls back to the builder) on stderr before pi starts
- **effects** — disk (writes output), process (spawns and may kill the pi child process group)
- **errors** — exit 1 on bad args, invalid lane, an invalid or disallowed --lane-size, a refused roster, failed worker, or exceeded lane ceiling
- **callers** — —
- **callees** — `packages/nana-pack/bin/nana-roster.mjs`, `packages/nana-pack/bin/pi-watchdog.mjs`, `packages/nana-pack/bin/worker-config.mjs`, `packages/nana-pack/lib/agent-dir.mjs`

### `packages/nana-pack/bin/review-launch.mjs`

- **purpose** — Resolve a review command to its direct, Windows cmd.exe, or pi-specific launch.
- **inputs** — a child argv and injected platform, environment, cwd, file probes, text reader, and Node executable.
- **outputs** — a spawn command, arguments and optional options, or a named refusal.
- **effects** — disk (default Windows command, path existence and pi lookup probes).
- **errors** — lookup, absent Windows batch paths and unsafe Windows arguments return refusals; injected readers may throw.
- **callers** — `packages/nana-pack/bin/review-ledger.mjs`
- **callees** — `packages/nana-pack/bin/pi-watchdog.mjs`, `packages/nana-pack/bin/worker-config.mjs`, `packages/nana-pack/lib/win-command-config.mjs`, `packages/nana-pack/lib/win-command.mjs`

### `packages/nana-pack/bin/review-ledger.mjs`

- **purpose** — The review round cap as a hook for any launcher — `run` reserves a round around a command and records its verdict, `check` asks whether one would be admitted.
- **inputs** — argv (`run --item <slug> --out <file> [--tree <path>] [--role R] [--revision R] [--over-cap WHY] -- <cmd...>` or `check --item <slug> [--tree <path>] [--revision R]`), the reviewed tree's git state, the user-scope review ledger, review-launch.mjs's command resolver, and worker-config.mjs's REVIEWER_CHILD_ENV
- **outputs** — the child's stdout written to --out, a recorded round, the projection note on stdout for `check`, and the admission note, warnings, unread-verdict note, cannot-start line and refusals on stderr
- **effects** — process (resolves and spawns the review command with reviewer child env and stdout piped, runs the reservation heartbeat, sets the exit code), disk (writes --out and the ledger's lock, reservation, tally and audit files, including a best-effort cannot-start line)
- **errors** — exit 1 on a bad subcommand, a missing --out or `--`, a `--over-cap` on check, a refused admission or command start, an unwritable --out, a recorded empty verdict, or a non-zero / non-review-shaped result (only the latter returns the reservation with no round consumed); exit 0 otherwise
- **callers** — —
- **callees** — `packages/nana-pack/bin/review-launch.mjs`, `packages/nana-pack/bin/review-round.mjs`, `packages/nana-pack/bin/review-shape.mjs`, `packages/nana-pack/bin/worker-config.mjs`

### `packages/nana-pack/bin/review-round.mjs`

- **purpose** — The review round ledger — admit, project, complete and release one per-item review round under a user-scope lock.
- **inputs** — a launcher's own argv (--item, --tree, --revision, --role, --out, --over-cap), the reviewed tree's git state (common dir, HEAD, tracked and non-ignored untracked content, git config and attributes), stdout/stderr file identities, env NANA_REVIEW_RES_STALE_MS, and the ledger files under ~/.pi/agent
- **outputs** — an admission or refusal with its note and warning, a reservation file, a round appended to the tally, audit lines (rotated past LEDGER_MAX_BYTES), a heartbeat stopper, the projected round number, and completion results carrying the recorded verdict plus an unread-verdict note when it is empty
- **effects** — disk (an O_EXCL lock around every read-decide-write, reservation files, the never-rotated tally and the rotated audit log; a scratch index and object folder under the OS temp folder while deriving the working state, removed after each derivation), process (spawns git through spawnSync, runs a renewing heartbeat interval)
- **errors** — canonicalItem throws on a slug that is empty, over SLUG_MAX, holds a separator, `..` or a control character; admit / project / complete return {ok:false, message} for a missing --item, a tree outside git, an in-tree output redirect, an over-cap revision, a git failure, a tracked --out, a malformed tally line, a non-regular ledger or lock path, or a lost reservation
- **callers** — `packages/nana-pack/bin/nana-land.mjs`, `packages/nana-pack/bin/pi-review.mjs`, `packages/nana-pack/bin/review-ledger.mjs`, `packages/nana-pack/bin/review-timeline.mjs`, `packages/nana-pack/tests/agent-dir-config.test.mjs`, `packages/nana-pack/tests/land.test.mjs`, `packages/nana-pack/tests/review-round.test.mjs`, `packages/nana-pack/tests/review-timeline.test.mjs`, `packages/nana-setup/lib/state-manifest.mjs`, `packages/nana-setup/tests/state-manifest.test.mjs`
- **callees** — `packages/nana-pack/bin/review-shape.mjs`, `packages/nana-pack/lib/real-path.mjs`, `packages/nana-pack/lib/verdict-config.mjs`

### `packages/nana-pack/bin/review-shape.mjs`

- **purpose** — Decide whether produced output is review-shaped.
- **inputs** — the candidate review text
- **outputs** — true when a physical line begins with optional non-word characters followed by case-sensitive VERDICT
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-pack/bin/pi-review.mjs`, `packages/nana-pack/bin/review-ledger.mjs`, `packages/nana-pack/bin/review-round.mjs`
- **callees** — —

### `packages/nana-pack/bin/review-timeline.mjs`

- **purpose** — Print one lane's recorded review rounds, in ledger order, with the MUST findings a sent-back review's own recorded file states.
- **inputs** — argv (--item <slug> [--repo <path>]), the user-scope review ledger (tally and audit log, through readRounds/ledgerPaths), and the review files the audit log recorded
- **outputs** — markdown on stdout; one stderr message and exit 1 on bad input or nothing to print
- **effects** — disk (reads the ledger and recorded review files only)
- **errors** — exit 1 with one message, no stack, on a missing or blank --item, a non-git --repo, a malformed tally, or no recorded review for the selected item and repository
- **callers** — —
- **callees** — `packages/nana-pack/bin/review-round.mjs`, `packages/nana-pack/lib/bounded-read.mjs`, `packages/nana-pack/lib/review-findings.mjs`, `packages/nana-pack/lib/review-timeline-config.mjs`

### `packages/nana-pack/bin/worker-config.mjs`

- **purpose** — Define the sealed launcher values: the lane ceiling, Windows CPU tick scale, default builder and roster, and pi's npm package identity.
- **inputs** — none
- **outputs** — LANE_MAX_SECS, WIN_CPU_TICKS_PER_SECOND, LANE_DEFAULTS, ROSTER_DEFAULTS, ROSTER_SLOTS, NULLABLE_SLOTS, OPTIONAL_SLOTS, CLAUDE_CODE_SLOTS, CLAUDE_CODE_RUNTIME, CLAUDE_CODE_SUBAGENT_MODELS, SLOT_PRINT_ORDER, LANE_SIZE_SLOTS, LARGER_BUILDER_LABEL, THINKING_LEVELS, PI_PACKAGE, PI_BIN_NAME, REVIEWER_CHILD_ENV, NPM_DIRS, PI_MODEL_SHELL_ENV, SLOT_NULL_TOKENS, DEFAULT_THINKING_TOKEN
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-pack/bin/nana-roster.mjs`, `packages/nana-pack/bin/pi-review.mjs`, `packages/nana-pack/bin/pi-watchdog.mjs`, `packages/nana-pack/bin/pi-worker.mjs`, `packages/nana-pack/bin/review-launch.mjs`, `packages/nana-pack/bin/review-ledger.mjs`, `packages/nana-pack/lib/roster-notice.mjs`, `packages/nana-pack/lib/roster-set.mjs`, `packages/nana-pack/tests/fake-pi.mjs`, `packages/nana-pack/tests/nana-roster-set.test.mjs`, `packages/nana-pack/tests/nana-roster.test.mjs`, `packages/nana-pack/tests/pack-config-utf16.test.mjs`, `packages/nana-pack/tests/roster-notice.test.mjs`, `packages/nana-pack/tests/rulings.test.mjs`, `packages/nana-pack/tests/worker-lane.test.mjs`, `packages/nana-setup/tests/objective-path-shapes.test.mjs`, `packages/nana-setup/tests/pi-launch-limits.test.mjs`
- **callees** — —

### `packages/nana-pack/extensions/nana-gate.ts`

- **purpose** — Gate every bash or powershell command and every edit or write path against the session's ratcheted gate policy.
- **inputs** — pi `tool_call` and `session_start` events (toolName, input.command / input.path, reason), the gate block of the live config, and ctx (cwd, hasUI, ui)
- **outputs** — a {block, reason} verdict or undefined, an interactive Block / Allow once dialog showing the subject through the shared renderers, a running `gate ✓ N checked · M gated` status, and `gate_policy_widened` / `config_invalid` journal lines
- **effects** — disk (appends the journal, realpaths candidate paths via gate-paths), process (the adopted-policy map lives on globalThis so widening is seen across extension copies)
- **errors** — never throws — a failed policy load becomes a stopReason and a failed analysis becomes the hit `gate analysis failed`, and both block; headless hits block fail-closed
- **callers** — `packages/nana-pack/tests/agent-dir-config.test.mjs`, `packages/nana-pack/tests/bounded-read.test.mjs`, `packages/nana-pack/tests/display-surfaces.test.mjs`, `packages/nana-pack/tests/gate-config-robustness.test.mjs`, `packages/nana-pack/tests/gate-corpus.test.mjs`, `packages/nana-pack/tests/gate-policy-paths.test.mjs`, `packages/nana-pack/tests/gate-rm-inside.test.mjs`, `packages/nana-pack/tests/gate-rm-outside.test.mjs`, `packages/nana-pack/tests/gate-self-protection.test.mjs`, `packages/nana-pack/tests/gate-status.test.mjs`, `packages/nana-pack/tests/lane-write-guard.test.mjs`, `packages/nana-pack/tests/pipe-guard.test.mjs`
- **callees** — `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/gate-paths.ts`, `packages/nana-pack/lib/gate-rm-inside.ts`, `packages/nana-pack/lib/gate-rm-outside.ts`, `packages/nana-pack/lib/gate-shell.ts`, `packages/nana-pack/lib/gate-temp-roots.ts`, `packages/nana-pack/lib/objective.ts`, `packages/nana-pack/lib/pipe-guard.mjs`

### `packages/nana-pack/extensions/nana-handoff.ts`

- **purpose** — Carry a compaction summary across sessions through the user-scope handoff store, injecting it only into a fresh session in the same directory.
- **inputs** — pi `session_start` / `before_agent_start` / `session_compact` events (reason, compactionEntry.summary, systemPromptOptions.sections), the handoff config block, env NANA_HANDOFF, and the store file for the canonical cwd (or an ancestor's, or a configured path)
- **outputs** — a labelled handoff block in the nana-handoff system-prompt section (≤ INJECT_CAP) or a bounded pointer line (≤ POINTER_CAP) when it is stale, an ancestor's or a legacy repo file, the summary written atomically to the store, and journal lines (handoff_pickup_failed, handoff_skipped_role, handoff_legacy_ignored, handoff_legacy_write_refused, directory_unadopted)
- **effects** — disk (reads the store, writes it temp-file-plus-rename, lstats the configured path and the repo root, appends the journal)
- **errors** — never throws — every pickup or write failure, invalid UTF-8 included, degrades to no handoff plus one journal line
- **callers** — `packages/nana-pack/tests/adoption-producer.test.mjs`, `packages/nana-pack/tests/display-surfaces.test.mjs`, `packages/nana-pack/tests/handoff-artifact.test.mjs`, `packages/nana-pack/tests/handoff-staleness.test.mjs`, `packages/nana-pack/tests/handoff-store.test.mjs`, `packages/nana-pack/tests/handoff-symlink.test.mjs`, `packages/nana-pack/tests/handoff-trust.test.mjs`, `packages/nana-pack/tests/handoff-writer-role.test.mjs`, `packages/nana-pack/tests/writing-injection.test.mjs`
- **callees** — `packages/nana-pack/lib/adoption.mjs`, `packages/nana-pack/lib/bounded-read.mjs`, `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/display.mjs`, `packages/nana-pack/lib/prompt-sections.mjs`

### `packages/nana-pack/extensions/nana-lifecycle.ts`

- **purpose** — Journal session lifecycle events, surface compaction in the UI, and own the /reload-runtime command.
- **inputs** — pi `session_start`, `session_before_compact`, `session_compact`, `session_compact_failed` and `session_shutdown` events, the /reload-runtime invocation, the loaded config, and ctx (cwd, hasUI, ui)
- **outputs** — one JSONL journal line per event (ts, event, cwd, pid, reason), a dim `nana-pack ✓` footer status, compaction info/error notifications, and a reloaded runtime
- **effects** — disk (appends the journal through lib/config.ts), process (primeNanaTrust imports pi's trust module; ctx.reload() re-reads settings.json and re-discovers extensions, skills, prompts and context files)
- **errors** — none of its own — appendJournal is best-effort, and a ctx.reload() failure propagates to pi's command handler
- **callers** — `packages/nana-pack/tests/lifecycle-journal.test.mjs`, `packages/nana-pack/tests/lifecycle-reload.test.mjs`
- **callees** — `packages/nana-pack/lib/config.ts`

### `packages/nana-pack/extensions/nana-notify.ts`

- **purpose** — Notify the owner on the desktop when the agent settles, falling back in-app when the OS notifier fails.
- **inputs** — pi `agent_settled` and `ui_prompt_start` events, the notify config block (enabled, headless), ctx.mode, ctx.hasUI, and process.platform
- **outputs** — an osascript notification, a PowerShell toast or a TUI-only OSC 777 sequence, an in-app ctx.ui.notify on failure, and a `notify_fallback` journal line carrying the reason
- **effects** — process (spawns osascript or powershell.exe under NOTIFIER_TIMEOUT_MS), disk (appends the journal)
- **errors** — none — notifierFailure classifies a spawn failure, a non-zero exit, the deadline kill and a PowerShell error record printed on an exit-0 run, each as the fallback's reason
- **callers** — `packages/nana-pack/tests/notify-dispatch.test.mjs`, `packages/nana-pack/tests/notify-fallback.test.mjs`
- **callees** — `packages/nana-pack/lib/config.ts`

### `packages/nana-pack/extensions/nana-objective.ts`

- **purpose** — Inject the owner's standing objective and current priority into every pi session's system prompt.
- **inputs** — pi `session_start` (all five reasons) and `before_agent_start` events, the user-scope objective config block, and ctx (cwd, hasUI, ui)
- **outputs** — the objective block in the nana-objective system-prompt section, one journal line per producer event (objective_pickup / objective_unavailable), and a UI warning per notice
- **effects** — disk (lib/objective.ts reads the objective files and the trust store; appends the journal)
- **errors** — none — the handler swallows everything, and an unusable objective reaches the prompt as an `OBJECTIVE UNAVAILABLE` marker rather than silence
- **callers** — `packages/nana-pack/tests/objective-golden.test.mjs`, `packages/nana-pack/tests/objective-injection.test.mjs`, `packages/nana-pack/tests/writing-injection.test.mjs`
- **callees** — `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/objective.ts`, `packages/nana-pack/lib/prompt-sections.mjs`

### `packages/nana-pack/extensions/nana-post-edit.ts`

- **purpose** — Run the configured format, lint and test checks after a successful edit or write, feeding only failures back to the model.
- **inputs** — pi `tool_result` events for edit/write (input.path, isError), postEdit.commands config, pi's PYTHONUTF8 environment value and file-mutation queue, and ctx (cwd, signal, hasUI, ui)
- **outputs** — one bounded failure line per failing check appended to the tool result, a post-edit UI status naming the worst outcome, and `postedit_file_queue_unavailable` journal lines
- **effects** — process (spawns each check in a shell under its timeoutMs, then SIGTERM and SIGKILL over its tree), disk (appends the journal)
- **errors** — never throws — each check is classified checks_passed / checks_failed / error / timeout / not_run plus a `lock` refusal, and a malformed command entry or bad match regex is skipped
- **callers** — `packages/nana-pack/tests/display-surfaces.test.mjs`, `packages/nana-pack/tests/post-edit-file-queue.test.mjs`, `packages/nana-pack/tests/post-edit-hardening.test.mjs`, `packages/nana-pack/tests/post-edit-status.test.mjs`, `packages/nana-pack/tests/post-edit-utf8.test.mjs`
- **callees** — `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/display.mjs`, `packages/nana-pack/lib/gate-paths.ts`, `packages/nana-pack/lib/post-edit-config.mjs`, `packages/nana-pack/lib/win-command.mjs`

### `packages/nana-pack/extensions/nana-roster-notice.ts`

- **purpose** — Show the roster notice as one widget above the editor at every UI session start.
- **inputs** — pi `session_start` events (reason startup, new, resume, fork), pi's active agent dir, and the user-scope nana-pack.json there
- **outputs** — one widget, keyed WIDGET_KEY, holding the roster notice as its only line
- **effects** — disk (reads the user-scope nana-pack.json)
- **errors** — none — the handler swallows everything; it never throws and never notifies
- **callers** — `packages/nana-pack/tests/agent-dir-config.test.mjs`, `packages/nana-pack/tests/roster-notice.test.mjs`
- **callees** — `packages/nana-pack/bin/nana-roster.mjs`, `packages/nana-pack/lib/agent-dir.mjs`, `packages/nana-pack/lib/roster-notice-config.mjs`, `packages/nana-pack/lib/roster-notice.mjs`

### `packages/nana-pack/extensions/nana-rulings.ts`

- **purpose** — Append nana's standing rulings and stale-install guidance to every session's system prompt, rereading them at every session_start reason.
- **inputs** — pi `session_start` and `before_agent_start` events; an injectable agent dir; rulings, bounded-read and stale-copy helpers.
- **outputs** — rulings text or its unavailable marker in RULINGS_SECTION, plus a separate stale-copy section when the injected file is not this checkout's current file.
- **effects** — disk (bounded-reads the installed rulings and compares it with the shipped source)
- **errors** — none — the handler swallows everything; an unusable file injects the marker rather than throwing, hanging, or exhausting memory
- **callers** — `packages/nana-setup/tests/stale-copies.test.mjs`
- **callees** — `packages/nana-pack/lib/agent-dir.mjs`, `packages/nana-pack/lib/bounded-read.mjs`, `packages/nana-pack/lib/rulings-config.mjs`, `packages/nana-setup/lib/stale-copies-config.mjs`, `packages/nana-setup/lib/stale-copies.mjs`

### `packages/nana-pack/extensions/nana-writing.ts`

- **purpose** — Append the "Writing for Jake" rule to each enabled session's system prompt, reading config and the rule fresh at every session_start — the seventh pack extension.
- **inputs** — pi `session_start` (every reason) and `before_agent_start` events; user-scope writing.enabled; an injectable rule path (opts.rulePath, defaulting to the shipped rule); ctx (cwd)
- **outputs** — when writing.enabled is true, the rule block under "## Writing for Jake (nana)"; one journal line (writing_rule_unavailable) when the file is missing, not a regular file, unreadable, or when the bytes actually read are not valid UTF-8 — a bounded read never speaks to an unread remainder, so that is the full extent of the claim, not whole-file validation
- **effects** — disk (stats and bounded-reads the rule file; appends the journal)
- **errors** — none — the handler swallows everything; an unusable rule injects nothing rather than throwing, hanging or exhausting memory
- **callers** — —
- **callees** — `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/display.mjs`, `packages/nana-pack/lib/prompt-sections.mjs`, `packages/nana-pack/lib/writing-config.mjs`

### `packages/nana-pack/lib/adoption.mjs`

- **purpose** — The one adoption predicate — the handoff store's location, whether a repository root has been adopted, and which `directory_unadopted` reports are printable.
- **inputs** — a directory path, user-scope nana-pack.json in pi's active agent dir, os.homedir(), the tail of the adoption journal, and each root's own entries (`.git`, the objective file, AGENTS.md, docs/sessions, the dismissal marker), and the declared NANA_TEST_TEMP_ROOTS test seam (path-delimited; empty disables skipping)
- **outputs** — the store dir and the per-root store path, the adoption settings (journal path, objective file name), a root's state with its isAdopted verdict, the journal's tail lines, and the newest report per canonical root with a `dropped` count of refused claims
- **effects** — disk (reads nana-pack.json and the journal tail, lstats / stats the handed-in root and its ancestors)
- **errors** — tailLines rethrows the fs error for a journal that exists but is not a readable regular file (ENOTFILE for a non-file); an absent journal is [] and every other function is total
- **callers** — `packages/nana-pack/bin/nana-adoption.mjs`, `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/tests/adoption-producer.test.mjs`, `packages/nana-pack/tests/adoption-reader.test.mjs`, `packages/nana-pack/tests/agent-dir-config.test.mjs`, `packages/nana-pack/tests/display-surfaces.test.mjs`, `packages/nana-setup/tests/doctor-detail.test.mjs`
- **callees** — `packages/nana-pack/lib/agent-dir.mjs`, `packages/nana-pack/lib/bounded-read.mjs`, `packages/nana-pack/lib/display.mjs`, `packages/nana-pack/lib/json-text.mjs`

### `packages/nana-pack/lib/agent-dir.mjs`

- **purpose** — Resolve pi's ACTIVE agent dir exactly as pi does, and flag a PI_CODING_AGENT_DIR that stays cwd-relative.
- **inputs** — env PI_CODING_AGENT_DIR, os.homedir(), process.platform, process.cwd()
- **outputs** — the resolved agent dir, pi's normalizePath result for any input (win32 shell path, `~`, file://), and whether the configured value resolves per-process
- **effects** — none
- **errors** — none — every function is total and returns a value even when process.cwd() no longer exists
- **callers** — `apps/desk/server.mjs`, `packages/nana-pack/bin/nana-roster.mjs`, `packages/nana-pack/bin/pi-worker.mjs`, `packages/nana-pack/extensions/nana-roster-notice.ts`, `packages/nana-pack/extensions/nana-rulings.ts`, `packages/nana-pack/lib/adoption.mjs`, `packages/nana-pack/lib/gate-paths.ts`, `packages/nana-setup/claude/hooks/nana-roster-notice.mjs`, `packages/nana-setup/lib/paths.mjs`
- **callees** — —

### `packages/nana-pack/lib/blast-radius-config.mjs`

- **purpose** — Declare the blast-radius page's tunables with their provenance, so no inline literal at a point of use in scripts/blast-radius.mjs or its test drifts from these names.
- **inputs** — none
- **outputs** — COLUMN_IDS, COLUMN_TITLES, DATA_PATH_ATTR, DATA_COLUMN_ATTR, DATA_FROM_ATTR, DATA_TO_ATTR, DATA_UNMAPPED_ATTR, DATA_NO_LINKED_TEST_ATTR, NO_LINKED_TEST_LABEL, UNMAPPED_HEADING, MARGIN, NODE_HEIGHT, ROW_GAP, COLUMN_GUTTER, NODE_H_PADDING, MIN_NODE_WIDTH, CHAR_WIDTH, FONT_SIZE, HEADING_GAP, BG_LIGHT, BG_DARK, TEXT_LIGHT, TEXT_DARK, EDGE_LIGHT, EDGE_DARK, COLUMN_COLORS_LIGHT, COLUMN_COLORS_DARK, NO_LINKED_TEST_COLOR_LIGHT, NO_LINKED_TEST_COLOR_DARK
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-pack/tests/blast-radius.test.mjs`, `scripts/blast-radius.mjs`
- **callees** — —

### `packages/nana-pack/lib/bounded-read.mjs`

- **purpose** — Read a bounded number of bytes from a regular file without blocking on special files.
- **inputs** — a file path, optional byte limit, and Node filesystem constants
- **outputs** — a Buffer containing at most the requested limit plus one bytes
- **effects** — disk (opens and reads one file descriptor)
- **errors** — throws filesystem errors, ERR_NOT_REGULAR, or ERR_TOO_LARGE
- **callers** — `packages/nana-pack/bin/nana-roster.mjs`, `packages/nana-pack/bin/review-timeline.mjs`, `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/extensions/nana-rulings.ts`, `packages/nana-pack/lib/adoption.mjs`, `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/objective.ts`, `packages/nana-pack/lib/roster-set.mjs`, `packages/nana-pack/tests/bounded-read.test.mjs`
- **callees** — —

### `packages/nana-pack/lib/config.ts`

- **purpose** — Load, normalize and merge the nana-pack user and project config into a fully typed value no file bytes can make throw.
- **inputs** — <pi's active agent dir>/nana-pack.json (user scope) and <cwd>/.pi/nana-pack.json (project scope, nana-trusted only), pi's trust module and trust.json, and the extension ctx (cwd, isProjectTrusted, hasUI, ui, sessionManager)
- **outputs** — a NanaPackConfig (gate, postEdit, notify, journal, handoff, objective, writing, legacy receipts) with gate.stopReason set when a gate block is unusable, the resolved journal file path, compiled allow/extra/protected regexes, user-only objective and writing blocks, and safe shared parse-failure detail in a gate stop or the user-scope objective block
- **effects** — disk (reads both config files, lstats a symlinked one, reads pi's trust store, appends the journal), process (dynamically imports pi's trust module; keeps the per-session dedupe, trust decisions and last-valid gate on globalThis)
- **errors** — never throws — a malformed leaf falls back and is surfaced once per session as a `config_invalid` or `config_agent_dir_mismatch` journal line plus one UI warning, and a malformed gate block with no last-good policy yields gate.stopReason, which blocks every gated tool
- **callers** — `packages/nana-pack/bin/nana-objective.mjs`, `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/extensions/nana-lifecycle.ts`, `packages/nana-pack/extensions/nana-notify.ts`, `packages/nana-pack/extensions/nana-objective.ts`, `packages/nana-pack/extensions/nana-post-edit.ts`, `packages/nana-pack/extensions/nana-writing.ts`, `packages/nana-pack/tests/adoption-producer.test.mjs`, `packages/nana-pack/tests/agent-dir-config.test.mjs`, `packages/nana-pack/tests/config-display-text.test.mjs`, `packages/nana-pack/tests/config-normalize.test.mjs`, `packages/nana-pack/tests/config-trust.test.mjs`, `packages/nana-pack/tests/gate-survives-mutation.test.mjs`, `packages/nana-pack/tests/handoff-trust.test.mjs`, `packages/nana-pack/tests/objective-injection.test.mjs`, `packages/nana-pack/tests/post-edit-file-queue.test.mjs`, `packages/nana-pack/tests/post-edit-hardening.test.mjs`
- **callees** — `packages/nana-pack/lib/bounded-read.mjs`, `packages/nana-pack/lib/gate-paths.ts`, `packages/nana-pack/lib/json-text.mjs`, `packages/nana-pack/lib/objective.ts`

### `packages/nana-pack/lib/display.mjs`

- **purpose** — THE renderers for every repo-controlled string nana-pack puts into a prompt, the UI, Markdown or a file it writes.
- **inputs** — any value (string or not), an optional length cap, and an optional set of extra characters to treat as unsafe
- **outputs** — one bounded rendering per surface — promptPath/uiPath (one line, JSON-escaped when unsafe, ≤ PATH_CAP, middle-elided), promptText/uiText/fileField (controls, breaks and bidi marks replaced by a space), codeSpan (or null when it would close the span), locator ({text, escaped}, exact and never elided)
- **effects** — none
- **errors** — none — every renderer is total: an unprintable value renders as `[unprintable]`, and an unsafe code span is refused with null rather than escaped
- **callers** — `packages/nana-knowledge/lib/hook.ts`, `packages/nana-knowledge/lib/query.ts`, `packages/nana-pack/bin/nana-adoption.mjs`, `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/extensions/nana-post-edit.ts`, `packages/nana-pack/extensions/nana-writing.ts`, `packages/nana-pack/lib/adoption.mjs`, `packages/nana-pack/lib/objective.ts`, `packages/nana-pack/lib/roster-notice.mjs`, `packages/nana-pack/tests/display-surfaces.test.mjs`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/stale-copies.mjs`
- **callees** — —

### `packages/nana-pack/lib/frontier-config.mjs`

- **purpose** — Defines the sealed word budget, read window and section names for HANDOFF frontier reports.
- **inputs** — none
- **outputs** — HANDOFF_WORD_BUDGET, READ_WINDOW_BYTES, READ_WINDOW_LINES, LIVE_SECTION_NAMES, ARCHIVE_SECTION_NAMES
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-pack/bin/nana-frontier.mjs`, `packages/nana-pack/tests/frontier.test.mjs`, `packages/nana-pack/tests/writing-check.test.mjs`
- **callees** — —

### `packages/nana-pack/lib/gate-paths.ts`

- **purpose** — Resolve tool paths the way pi does, and recognise the POLICY files that sit on the gate's floor.
- **inputs** — a tool path or a shell command plus the session cwd, env PI_CODING_AGENT_DIR, and the filesystem (realpath, readlink and lstat of candidates, agent dirs and code-loading policy files)
- **outputs** — pi's resolution of an edit/write path, every candidate form of it, the policy file a candidate set or a command word lands on (or null), and pi's active trust store path
- **effects** — disk (realpath / readlink / lstat of candidate paths, agent dirs and code-loading policy files)
- **errors** — none — every function is total and degrades to the raw input or to null
- **callers** — `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/extensions/nana-post-edit.ts`, `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/gate-rm-inside.ts`, `packages/nana-pack/lib/objective.ts`, `packages/nana-pack/tests/agent-dir-config.test.mjs`, `packages/nana-pack/tests/agent-dir-parity.test.mjs`, `packages/nana-pack/tests/agent-dir-var-spellings.test.mjs`, `packages/nana-pack/tests/gate-policy-paths.test.mjs`, `packages/nana-pack/tests/gate-self-protection.test.mjs`, `packages/nana-pack/tests/post-edit-hardening.test.mjs`
- **callees** — `packages/nana-pack/lib/agent-dir.mjs`, `packages/nana-pack/lib/gate-shell.ts`

### `packages/nana-pack/lib/gate-rm-inside.ts`

- **purpose** — Decide whether a plain recursive/forced rm of literal relative targets strictly inside the session working directory may run with no approval, per Jake's 2026-10-10 ruling.
- **inputs** — a raw bash command string, the session cwd, an optional home override (default os.homedir()), env PI_CODING_AGENT_DIR (through gate-paths), and the filesystem (realpath and lstat of cwd, home, the active pi agent folder, every target and its intermediate parts, and the HEAD/objects/refs/.git entries along the cwd's ancestor walk and of each existing target part, for the bare-repository shape guard)
- **outputs** — rmInsideCwd(command, cwd, home?): true only when every guard below passes, false otherwise
- **effects** — disk (realpath and lstat of cwd, home, the active pi agent folder, each target's parts, and the HEAD/objects/refs/.git entries on the cwd's ancestor walk and each existing target part)
- **errors** — never throws — any unexpected error anywhere in the walk is treated as false
- **callers** — `packages/nana-pack/extensions/nana-gate.ts`
- **callees** — `packages/nana-pack/lib/gate-paths.ts`, `packages/nana-pack/lib/real-path.mjs`

### `packages/nana-pack/lib/gate-rm-outside.ts`

- **purpose** — Find readable non-recursive rm targets outside the working and accepted temp folders.
- **inputs** — shell segments, cwd, tool name, home, accepted temp roots, injected platform and environment, and the command's segmentable verdict
- **outputs** — a map from each rm segment with an outside target to that target's full path; gitBashPath and the Git Bash temp and drive constants
- **effects** — disk (canonicalizes the cwd, temp roots, cd folders, and target parents)
- **errors** — never throws; an internal failure marks the segment text as outside
- **callers** — `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/tests/gate-rm-outside.test.mjs`
- **callees** — `packages/nana-pack/lib/gate-shell.ts`, `packages/nana-pack/lib/gate-temp-roots.ts`, `packages/nana-pack/lib/real-path.mjs`

### `packages/nana-pack/lib/gate-shell.ts`

- **purpose** — Segment a shell command and name its destructive forms for nana-gate.
- **inputs** — a command string, or one Segment {text, piped} for segmentDanger
- **outputs** — quote-aware exec segments with a `segmentable` verdict, quote-unaware detection segments, shell tokens, and a Danger {reason, floor} or null
- **effects** — none
- **errors** — none — an unbalanced quote or an unsegmentable construct sets segmentable:false, and an internal failure comes back as the non-floor danger `unparseable segment`
- **callers** — `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/lib/gate-paths.ts`, `packages/nana-pack/lib/gate-rm-outside.ts`, `packages/nana-pack/tests/gate-rm-outside.test.mjs`
- **callees** — —

### `packages/nana-pack/lib/gate-temp-roots.ts`

- **purpose** — The one shared rule for which temp folders a gate's lane write boundary counts as writable: the OS temp folder and, on Windows, a differing TMP, except a drive or filesystem root, the home folder, or a folder above it — the home test by filesystem identity, so an alternate spelling of home (a macOS data-volume firmlink path) is still caught.
- **inputs** — acceptedTempRoots({platform, env, home, tmpdir}): every value injected, never read from process.env or the OS directly; isExcludedTempRoot(t, home) and within(parent, child) take plain path strings
- **outputs** — acceptedTempRoots(...): the accepted temp roots, each resolved to its on-disk spelling; isExcludedTempRoot(t, home): true when `t` is excluded; within(parent, child): true when `child` lies inside, or is, `parent`
- **effects** — disk (resolves each candidate and home through lib/real-path's realPath; stats `t` and home's ancestor chain up to the root, once each, for filesystem identity)
- **errors** — never throws — acceptedTempRoots returns [] on any internal failure, and a failed stat falls back to the text test
- **callers** — `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/lib/gate-rm-outside.ts`, `packages/nana-pack/tests/gate-rm-outside.test.mjs`, `packages/nana-pack/tests/lane-write-guard.test.mjs`
- **callees** — `packages/nana-pack/lib/real-path.mjs`

### `packages/nana-pack/lib/handoff-asks.mjs`

- **purpose** — Splits HANDOFF's Open for Jake section into raw entries with independent tag and title parses.
- **inputs** — HANDOFF Markdown text.
- **outputs** — Ordered ask entries with source lines, frontier tags, and report titles and bodies.
- **effects** — none
- **errors** — None; absent sections and unparseable tags or titles yield empty results.
- **callers** — `packages/nana-pack/bin/nana-frontier.mjs`, `packages/nana-pack/tests/handoff-asks.test.mjs`, `packages/nana-pack/tests/product-report.test.mjs`, `scripts/product-report.mjs`
- **callees** — —

### `packages/nana-pack/lib/json-text.mjs`

- **purpose** — Decode marked UTF-16 or UTF-8 JSON and turn syntax errors into safe, shared config-failure details.
- **inputs** — JSON bytes or text, optionally carrying one byte-order mark; a JSON.parse error; or a file and safe parse-failure classification.
- **outputs** — The parsed value, a safe parse-failure classification without parser text, and the shared repair sentences in config-failure detail.
- **effects** — none
- **errors** — parseJsonBytes and parseJsonText expose SyntaxError; jsonErrorPlace returns null when no place is reported.
- **callers** — `packages/nana-knowledge/lib/sources.ts`, `packages/nana-knowledge/tests/sources-file.test.mjs`, `packages/nana-pack/bin/nana-roster.mjs`, `packages/nana-pack/lib/adoption.mjs`, `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/objective.ts`, `packages/nana-pack/lib/roster-set.mjs`, `packages/nana-pack/tests/config-gate-fallback.test.mjs`, `packages/nana-pack/tests/config-project-gate-fallback.test.mjs`, `packages/nana-pack/tests/pack-config-utf16.test.mjs`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/project.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/pi-registration.test.mjs`
- **callees** — —

### `packages/nana-pack/lib/mutation-runner-config.mjs`

- **purpose** — Hold the mutation runner's tunables and contract values, each with its provenance.
- **inputs** — none
- **outputs** — SHARDS_DEFAULT, STAGGER_SECS_DEFAULT, FILE_TIMEOUT_MS, BASELINE_RETRIES, WORKTREE_REMOVE_RETRIES, WORKTREE_REMOVE_RETRY_MS, WORKTREE_LOCK_WAIT_MS, WORKTREE_LOCK_UNREADABLE_STALE_MS, WORKTREE_LOCK_WAIT_LIMIT_MS, WORKTREE_LOCK_RELEASE_WAIT_LIMIT_MS, DRAIN_MS, SCRATCH_PREFIX, MAIN_BRANCH, ENV_NAMES, LOCK_SUFFIX, WORKTREE_LOCK_BREAKER_SUFFIX, TABLE_HASH_ALGO, OVERRIDABLE, EXIT_REFUSED, EXIT_TABLE_FAULT, SIGNAL_EXITS, CHILD_NODE_ARGS, TASKKILL_ARGS, TS_CHECK_ARGS, NPM_COMMAND, NPM_KEYS, GLOBAL_PREFIX_KEY, logName
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-pack/lib/mutation-runner.mjs`, `packages/nana-pack/tests/mutation-runner-takeover.test.mjs`, `packages/nana-pack/tests/mutation-runner.test.mjs`, `packages/nana-setup/lib/bounded-spawn-child.mjs`
- **callees** — —

### `packages/nana-pack/lib/mutation-runner.mjs`

- **purpose** — Run a lane's mutation pair table in scratch worktrees of its tip, split across shard processes, and write one judged record.
- **inputs** — a lane table object (lane, self, tip, pairs, optional branch/declared/config), argv pair ids, SEAT_MUTATE_ env vars
- **outputs** — a judged record (console and optionally SEAT_MUTATE_OUT), the process exit code
- **effects** — disk (scratch git worktrees, the record, lock and takeover-breaker files, per-pair logs), process (spawns shard children and test-file children, applies signal handlers)
- **errors** — refuses before any worktree on a bad id, config key, shard count, stagger or unresolved tip (R-1240, R-1244); reports ANCHOR-MISS/SYNTAX/RED per pair; never throws out of runMutations
- **callers** — `packages/nana-pack/tests/mutation-runner-takeover.test.mjs`, `packages/nana-pack/tests/mutation-runner.test.mjs`
- **callees** — `packages/nana-pack/lib/mutation-runner-config.mjs`

### `packages/nana-pack/lib/objective-path.mjs`

- **purpose** — Resolve objective.path exactly once, so the objective producer, nana-setup's installer and its doctor can never disagree about which file governs.
- **inputs** — a raw objective.path value (any JSON type) and { home, agentDir, platform } — the home folder, pi's active agent dir, and the platform whose path flavour and tilde rules apply
- **outputs** — resolveObjectivePath(value, opts) — the absolute file path the resolver picks, as a string in the chosen platform's path flavour — and DEFAULT_OBJECTIVE_FILE ("nana-objective.md")
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-pack/lib/objective.ts`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/objective-path-shapes.test.mjs`
- **callees** — —

### `packages/nana-pack/lib/objective.ts`

- **purpose** — THE objective producer — resolve the governing objective file and render the exact block both runtimes print.
- **inputs** — the session cwd, the user-scope objective settings (path, projectFile and an optional safe configFailure classification), the nearest OBJECTIVE.md walking up from cwd, and pi's active agent dir with its trust store, that store's folder, permissions and lock
- **outputs** — ObjectiveResult {text, unavailable, events, notices} — the heading, an optional safe config-failure line, the **Objective and **Current priority lines (one physical line each, ≤ LINE_CAP), the provenance label, the precedence note and remedy, or an `OBJECTIVE UNAVAILABLE` marker; the whole text is ≤ OUTPUT_CAP and ends in exactly one newline
- **effects** — disk (bounded sync reads of at most FILE_READ_MAX bytes per file, plus lstat / stat / access of the objective files, the trust store, its folder and its lock)
- **errors** — none — produceObjective never throws; an unreadable or symlink-reached file, a missing line, invalid UTF-8 or an internal error each become a named marker plus a journal event and a UI notice
- **callers** — `packages/nana-pack/bin/nana-objective.mjs`, `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/extensions/nana-objective.ts`, `packages/nana-pack/lib/config.ts`, `packages/nana-pack/tests/adoption-producer.test.mjs`, `packages/nana-pack/tests/config-display-text.test.mjs`, `packages/nana-pack/tests/display-surfaces.test.mjs`, `packages/nana-pack/tests/objective-golden.test.mjs`, `packages/nana-pack/tests/pack-config-utf16.test.mjs`, `packages/nana-pack/tests/writing-injection.test.mjs`, `packages/nana-setup/tests/doctor-detail.test.mjs`, `packages/nana-setup/tests/fresh-machine.test.mjs`
- **callees** — `packages/nana-pack/lib/bounded-read.mjs`, `packages/nana-pack/lib/display.mjs`, `packages/nana-pack/lib/gate-paths.ts`, `packages/nana-pack/lib/json-text.mjs`, `packages/nana-pack/lib/objective-path.mjs`

### `packages/nana-pack/lib/pipe-guard.mjs`

- **purpose** — Detect when a later git commit reads a masking pipeline's exit status.
- **inputs** — a shell command string from bash, PowerShell, or another shell-like tool.
- **outputs** — verifierPipeReason and PowerShell comment/string spans.
- **effects** — none
- **errors** — none; non-string input is treated as an empty command.
- **callers** — `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/tests/pipe-guard-pwsh-oracle.test.mjs`, `packages/nana-pack/tests/pipe-guard.test.mjs`, `packages/nana-setup/lib/verifier-hook.mjs`, `packages/nana-setup/tests/verifier-pipe.test.mjs`
- **callees** — `packages/nana-pack/lib/pwsh-lexer-config.mjs`

### `packages/nana-pack/lib/post-edit-config.mjs`

- **purpose** — Define each post-edit check tunable once, with its provenance.
- **inputs** — none
- **outputs** — POST_EDIT_DEFAULT_TIMEOUT_MS, POST_EDIT_KILL_GRACE_MS, POST_EDIT_OUTPUT_CAP, POST_EDIT_FAILURE_CAP, POST_EDIT_COMMAND_CAP, POST_EDIT_LOCK_MESSAGE_CAP
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-pack/extensions/nana-post-edit.ts`, `packages/nana-pack/tests/post-edit-default-timeout.test.mjs`, `packages/nana-pack/tests/post-edit-hardening.test.mjs`, `packages/nana-pack/tests/post-edit-values-named.test.mjs`
- **callees** — —

### `packages/nana-pack/lib/prompt-sections.mjs`

- **purpose** — Rebuild prompt section order so Nana sections compose consistently regardless of extension load order.
- **inputs** — a pi before_agent_start event whose sections contain Nana and other named sections
- **outputs** — the same sections object with canonical Nana keys and foreign keys kept relatively ordered
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/extensions/nana-objective.ts`, `packages/nana-pack/extensions/nana-writing.ts`
- **callees** — —

### `packages/nana-pack/lib/pwsh-lexer-config.mjs`

- **purpose** — Define the PowerShell lexer alphabet and oracle run settings.
- **inputs** — none.
- **outputs** — quote sets, token enders, shell names, corpus settings, and timeout.
- **effects** — none
- **errors** — none.
- **callers** — `packages/nana-pack/lib/pipe-guard.mjs`, `packages/nana-pack/tests/pipe-guard-pwsh-oracle.test.mjs`, `packages/nana-pack/tests/pwsh-oracle.mjs`
- **callees** — —

### `packages/nana-pack/lib/real-path.mjs`

- **purpose** — The one canonical-path function the land and review tools key and compare folders by, so two spellings of one folder (case, an 8.3 short name, a link, a `\\?\` prefix or a Unicode form) resolve the same.
- **inputs** — a path string and, for realPath, an optional mustExist flag
- **outputs** — realPath(p, opts): the folder's native spelling on disk; gitPathKey(s): s normalized for a git-path compare; fileIdentity(p): the entry's exact bigint {dev, ino}, or null when unavailable
- **effects** — disk (reads: realpathSync.native / realpathSync walk up to an existing ancestor, bigint lstatSync)
- **errors** — with mustExist, realPath throws the native error when p is missing or when native and typed realpath both fail; otherwise realPath never throws, and fileIdentity never throws
- **callers** — `packages/nana-pack/bin/nana-land.mjs`, `packages/nana-pack/bin/pi-review.mjs`, `packages/nana-pack/bin/review-round.mjs`, `packages/nana-pack/lib/gate-rm-inside.ts`, `packages/nana-pack/lib/gate-rm-outside.ts`, `packages/nana-pack/lib/gate-temp-roots.ts`, `packages/nana-pack/tests/gate-rm-outside.test.mjs`, `packages/nana-pack/tests/land.test.mjs`, `packages/nana-pack/tests/real-path.test.mjs`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/hook-health.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/settings.mjs`, `packages/nana-setup/lib/stale-copies.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/lib/uninstall.mjs`, `packages/nana-setup/tests/checkout-converge.test.mjs`, `packages/nana-setup/tests/checkout-spelling.test.mjs`, `packages/nana-setup/tests/pi-registration.test.mjs`
- **callees** — —

### `packages/nana-pack/lib/release-status.mjs`

- **purpose** — Report local release lag and main divergence without changing Git state.
- **inputs** — A repository path and an injectable `(cwd, args) => spawnSync-result` runner.
- **outputs** — Release line, tag, template commit count, ahead/behind counts, and missing inputs.
- **effects** — process (spawns read-only git)
- **errors** — Missing or failed Git inputs become a status line and never escape as throws.
- **callers** — `packages/nana-pack/bin/nana-land.mjs`, `packages/nana-pack/tests/release-status.test.mjs`, `packages/nana-setup/lib/doctor.mjs`, `scripts/template-release.mjs`
- **callees** — —

### `packages/nana-pack/lib/review-findings.mjs`

- **purpose** — Read a review file's own verdict word and its MUST finding titles, by text alone.
- **inputs** — the review file's text
- **outputs** — verdictWordOf(text), mustTitlesOf(text)
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-pack/bin/review-timeline.mjs`
- **callees** — `packages/nana-pack/lib/review-timeline-config.mjs`

### `packages/nana-pack/lib/review-timeline-config.mjs`

- **purpose** — Tunables, contract words and fixed statements the review timeline prints, each with its provenance, so no inline literal carries review-timeline's behavior at its point of use.
- **inputs** — none
- **outputs** — SHORT_REVISION_CHARS, FINDING_MAX_CHARS, WORD_MUST, WORD_SHOULD, WORD_NOTE, WORD_SEND_BACK, REVIEW_TIMELINE_STATEMENTS, MARK_UNVERIFIED, MARK_NO_VERDICT, MISSING_FIELD
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-pack/bin/review-timeline.mjs`, `packages/nana-pack/lib/review-findings.mjs`, `packages/nana-pack/tests/review-timeline.test.mjs`
- **callees** — —

### `packages/nana-pack/lib/roster-notice-config.mjs`

- **purpose** — Define the sealed literals the roster notice composes from and the sources that show it.
- **inputs** — none
- **outputs** — NOTICE_PREFIX, DEFAULT_MARK, REFUSED_HEAD, REFUSAL_CUT, SIZE_LABELS, CLAUDE_CODE_MARK, WIDGET_KEY, CHANGE_POINTER, RELATIVE_DIR_TEXT, SHOW_SOURCES
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-pack/extensions/nana-roster-notice.ts`, `packages/nana-pack/lib/roster-notice.mjs`, `packages/nana-pack/tests/roster-notice.test.mjs`, `packages/nana-setup/claude/hooks/nana-roster-notice.mjs`, `packages/nana-setup/tests/roster-notice-hook.test.mjs`
- **callees** — —

### `packages/nana-pack/lib/roster-notice.mjs`

- **purpose** — Compose the one-line session-start roster notice from a roster result and the roster file.
- **inputs** — a roster resolver result ({ok:true, roster, source} | {ok:false, file, problem}), the roster file's path, and whether PI_CODING_AGENT_DIR stays cwd-relative for this process
- **outputs** — rosterNotice(result, file, relative) -> one line of display text
- **effects** — none
- **errors** — none — every branch returns a string; rosterNotice never throws
- **callers** — `packages/nana-pack/extensions/nana-roster-notice.ts`, `packages/nana-pack/tests/roster-notice.test.mjs`, `packages/nana-setup/claude/hooks/nana-roster-notice.mjs`
- **callees** — `packages/nana-pack/bin/worker-config.mjs`, `packages/nana-pack/lib/display.mjs`, `packages/nana-pack/lib/roster-notice-config.mjs`, `packages/nana-setup/lib/paths.mjs`

### `packages/nana-pack/lib/roster-set.mjs`

- **purpose** — Replace one roster slot in the user-scope nana-pack.json by renaming a fully written temporary file over the real target, keeping every other member and a backup.
- **inputs** — pi's active agent dir, the `set` command's slot and token arguments, and optionally an env object plus a writeTemp(fd, text) and a rename(from, to) seam for tests
- **outputs** — setRosterSlot(agentDir, args, opts) -> {ok:true, file, roster, previousTokens} | {ok:false, problem}
- **effects** — disk (reads the user-scope nana-pack.json, writes a temporary file in the real target's folder, may write nana-pack.json.bak in the agent dir, and replaces the user-scope nana-pack.json)
- **errors** — never throws; every failure, including a mid-write throw, is caught and returned as {ok:false, problem} naming the guard, the slot or field, or the file
- **callers** — `packages/nana-pack/bin/nana-roster.mjs`, `packages/nana-pack/tests/nana-roster-set.test.mjs`
- **callees** — `packages/nana-pack/bin/nana-roster.mjs`, `packages/nana-pack/bin/worker-config.mjs`, `packages/nana-pack/lib/bounded-read.mjs`, `packages/nana-pack/lib/json-text.mjs`

### `packages/nana-pack/lib/rulings-config.mjs`

- **purpose** — Every tunable the nana-rulings extension and nana-setup's install/doctor steps read, each defined once with its provenance, so no inline literal names the rulings file, its cap or its system-prompt section at a point of use.
- **inputs** — none — pure constants
- **outputs** — RULINGS_FILE, RULINGS_READ_CAP, RULINGS_HEADING, RULINGS_SECTION, RULINGS_UNAVAILABLE
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-pack/extensions/nana-rulings.ts`, `packages/nana-pack/tests/rulings.test.mjs`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/state-manifest.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/rulings-install.test.mjs`, `packages/nana-setup/tests/stale-copies.test.mjs`, `packages/nana-setup/tests/state-manifest.test.mjs`
- **callees** — —

### `packages/nana-pack/lib/runtime-map-config.mjs`

- **purpose** — Declare the runtime-map layer's tunables with their provenance.
- **inputs** — none
- **outputs** — RUNTIME_SCHEMA, COVERAGE_ENV, RECORD_FILE, COMPLETION_FILE, KNOB_LINE, DATA_FILE_ENV, DATA_SUBPATH, STOP_SIGNALS, STALE_MARK, NOTE_PREFIX, NOT_COUNTED, COVERAGE_PREFIX, SECONDS_DIGITS, STOP_WAIT_MS, TREE_LIST
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-pack/lib/runtime-map.mjs`, `packages/nana-pack/tests/runtime-map.test.mjs`, `packages/nana-pack/tests/test-runner.test.mjs`, `scripts/code-map.mjs`, `scripts/product-report.mjs`, `scripts/runtime-measure.mjs`, `scripts/test.mjs`
- **callees** — —

### `packages/nana-pack/lib/runtime-map.mjs`

- **purpose** — Read the runtime-map data file and say which measured test files executed given files, marking a drifted checkout stale.
- **inputs** — the runtime data file (schema 1 JSON), the current tracked-file list and content, and an optional NANA_RUNTIME_MAP_FILE override
- **outputs** — the resolved data-file path, a file's sha256 hash, the parsed data or a reason it could not be read, the checkout drift, and the formatted --impact runtime block
- **effects** — disk (reads a file to hash it or to load the runtime data), process (spawns git for the common directory; every effect is injectable for tests)
- **errors** — never throws from loadRuntime, hashFile or checkoutDrift; dataPath throws when git itself fails
- **callers** — `packages/nana-pack/tests/runtime-map.test.mjs`, `scripts/code-map.mjs`, `scripts/product-report.mjs`, `scripts/runtime-measure.mjs`
- **callees** — `packages/nana-pack/lib/runtime-map-config.mjs`

### `packages/nana-pack/lib/test-runner-config.mjs`

- **purpose** — Declare the test runner's parallel tunables and volume-dependent file preconditions.
- **inputs** — os.tmpdir(), or a caller-supplied temporary root for the checkout-spelling probe
- **outputs** — JOBS_FLAG, SUITE_JOBS, SUITE_JOBS_ENV, RUN_ALONE, checkoutSpellingSkipReason
- **effects** — disk (checkoutSpellingSkipReason creates and removes one temporary probe folder)
- **errors** — checkoutSpellingSkipReason propagates temporary-folder creation errors
- **callers** — `packages/nana-pack/tests/test-locked.test.mjs`, `packages/nana-pack/tests/test-runner-parallel.test.mjs`, `packages/nana-pack/tests/test-runner.test.mjs`, `scripts/test-locked.mjs`, `scripts/test.mjs`
- **callees** — —

### `packages/nana-pack/lib/verdict-config.mjs`

- **purpose** — Defines verdict-label look-alike folds and the diagnostic conditions for unread verdicts.
- **inputs** — none
- **outputs** — VERDICT_LOOKALIKE_FOLD and UNREAD_VERDICT_CONDITIONS frozen tables
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-pack/bin/review-round.mjs`, `packages/nana-pack/tests/review-ledger.test.mjs`
- **callees** — —

### `packages/nana-pack/lib/win-command-config.mjs`

- **purpose** — Centralize the Windows command vocabulary and supported executable suffixes.
- **inputs** — Windows command lookup and launch helpers.
- **outputs** — frozen PATHEXT, pi suffixes and cmd.exe internal command names.
- **effects** — none
- **errors** — none.
- **callers** — `packages/nana-pack/bin/review-launch.mjs`, `packages/nana-pack/lib/win-command.mjs`, `packages/nana-pack/tests/win-command.test.mjs`
- **callees** — —

### `packages/nana-pack/lib/win-command.mjs`

- **purpose** — Resolve and safely launch supported Windows commands, and conservatively identify absent cmd.exe commands.
- **inputs** — command names, argument arrays, injected environment/cwd/existence and optional ComSpec.
- **outputs** — absolute lookup paths, a default existence probe, spawnSync argument records/refusals, or a missing-command predicate.
- **effects** — disk
- **errors** — refusals are returned as values; lookup errors mean absent.
- **callers** — `packages/nana-pack/bin/pi-watchdog.mjs`, `packages/nana-pack/bin/review-launch.mjs`, `packages/nana-pack/extensions/nana-post-edit.ts`, `packages/nana-pack/tests/win-command.test.mjs`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/install-check.mjs`, `packages/nana-setup/lib/pi-invocation.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/install-check.test.mjs`, `packages/nana-setup/tests/pi-registration.test.mjs`
- **callees** — `packages/nana-pack/lib/win-command-config.mjs`

### `packages/nana-pack/lib/windows-skips-config.mjs`

- **purpose** — Declare the whole-file Windows test skips the runner (scripts/test.mjs) reads on win32.
- **inputs** — none
- **outputs** — WINDOWS_SKIPS
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-pack/tests/test-runner.test.mjs`, `scripts/test.mjs`
- **callees** — —

### `packages/nana-pack/lib/writing-check.mjs`

- **purpose** — The pure checks behind the writing checker: extract Markdown-aware prose blocks and find every length, passive-candidate, banned-word, verdict and identifier finding, plus the summary line.
- **inputs** — a label and its text (checkText); an array of per-input results (summaryLine); --report on/off
- **outputs** — per input, {label, findings, stats}; one aggregate summary line string over every input checked
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-pack/bin/nana-writing.mjs`, `packages/nana-pack/lib/writing-trial-extractor.mjs`, `packages/nana-pack/tests/writing-check.test.mjs`, `packages/nana-setup/tests/writing-rule.test.mjs`
- **callees** — `packages/nana-pack/lib/writing-config.mjs`

### `packages/nana-pack/lib/writing-config.mjs`

- **purpose** — Every tunable the writing checker reads, each defined once with its provenance (G-001, G-002), so no inline literal appears at a point of use.
- **inputs** — none — pure constants
- **outputs** — SENTENCE_CAP, PASSIVE, PASSIVE_EXCEPTIONS, VERDICT_WORDS, BANNED_WORDS, IDENTIFIER_CODE_SPAN, IDENTIFIER_PATH, MIN_SENTENCE_WORDS, WRITING_INJECT_CAP
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-pack/extensions/nana-writing.ts`, `packages/nana-pack/lib/writing-check.mjs`, `packages/nana-pack/tests/writing-check.test.mjs`, `packages/nana-pack/tests/writing-injection.test.mjs`
- **callees** — —

### `packages/nana-pack/lib/writing-trial-extractor.mjs`

- **purpose** — Recomputes baseline seat-session units and rule-attached after reports from Claude Code transcripts.
- **inputs** — Transcript JSONL files, a date window, mode, and optionally a private output directory.
- **outputs** — Corpus summaries, per-day verdict counts, optional private text corpus and hash manifest.
- **effects** — disk (reads transcripts and writes only to the explicitly selected output directory)
- **errors** — Invalid transcript lines are skipped; invalid arguments or output failures exit nonzero.
- **callers** — `packages/nana-pack/tests/writing-trial-extractor.test.mjs`
- **callees** — `packages/nana-pack/lib/writing-check.mjs`

### `packages/nana-pack/tests/adoption-producer.test.mjs`

- **purpose** — Pins the L5 adoption producer — `directory_unadopted` is journaled once per repository root per day, only for the shapes that qualify, and nothing about adoption reaches the prompt
- **inputs** — extensions/nana-handoff.ts, lib/adoption.mjs, a nana-pack.json journal config under a temp HOME, and throwaway git repositories
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, journal and repository fixtures under the OS temp dir), process (sets HOME and USERPROFILE, spawns git)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/lib/adoption.mjs`, `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/objective.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/adoption-reader.test.mjs`

- **purpose** — Pins the L5 adoption reader — the `[nana:adoption]` block is newest-first, capped at five plus a count, re-checked at print time, and silent when there is nothing to say
- **inputs** — bin/nana-adoption.mjs, the nana-adoption bash hook nana-setup installs, and a journal under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, journal, symlinked repository fixtures), process (sets HOME, spawns the reader CLI and the bash hook)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/lib/adoption.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/agent-dir-config.test.mjs`

- **purpose** — Pins that nana-pack's user-scope resources follow pi's active agent dir for an absolute, a relative and a tilde PI_CODING_AGENT_DIR, each naming a symlinked dir, that the stranded default file is never opened when no active config exists, and that no mismatch note or journal line fires when the active config is present or none is stranded
- **inputs** — extensions/nana-gate.ts, extensions/nana-roster-notice.ts, lib/config.ts, lib/adoption.mjs, lib/gate-paths.ts, node:module's createRequire and syncBuiltinESMExports, nana-pack.json at both agent dirs under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME and symlinked agent dirs), process (sets HOME and PI_CODING_AGENT_DIR, changes the process cwd, temporarily wraps node:fs's CommonJS read entry points to observe which files are opened)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/bin/review-round.mjs`, `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/extensions/nana-roster-notice.ts`, `packages/nana-pack/lib/adoption.mjs`, `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/gate-paths.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/agent-dir-hostile.test.mjs`

- **purpose** — Regression cases for the hostile agent-dir shapes — a symlinked policy file is enforced at its target, a dangling link stops rather than falling to the defaults, and a relative dir under a deleted cwd never throws
- **inputs** — extensions/nana-gate.ts, lib/config.ts, lib/gate-paths.ts, symlinked and dangling nana-pack.json / trust.json under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, symlinks, a deleted cwd), process (sets HOME and PI_CODING_AGENT_DIR, runs a shell through execFileSync)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/agent-dir-parity.test.mjs`

- **purpose** — Pins ONE agent-dir resolution across the desk, the pack and nana-setup — three processes with three different cwds agree, and the desk pins its resolved absolute dir into every child
- **inputs** — apps/desk/server.mjs, packages/nana-setup/bin/nana-setup.mjs, lib/agent-dir.mjs, a stub `pi` on PATH and a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME and install targets), network (HTTP to the desk it binds on an ephemeral port), process (sets HOME and PI_CODING_AGENT_DIR, spawns the desk, the installer and the stub pi)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/desk/pi-session.mjs`, `packages/nana-pack/lib/gate-paths.ts`, `packages/nana-pack/tests/tmp-dir.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/tests/stub-pi.mjs`

### `packages/nana-pack/tests/agent-dir-var-spellings.test.mjs`

- **purpose** — Pins that the agent-dir variable rule catches exactly the four documented balanced spellings, case-insensitively, for both policy files and both separators
- **inputs** — lib/gate-paths.ts and a temp dir standing in for the active agent dir
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (a temp dir), process (sets PI_CODING_AGENT_DIR)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/lib/gate-paths.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/blast-radius.test.mjs`

- **purpose** — Pin the blast-radius page's node set, column placement, edges, changed-set detection, unmapped list, no-linked-test label and determinism against a built git fixture.
- **inputs** — scripts/blast-radius.mjs and a fixture git repository built under the OS temp directory.
- **outputs** — PASS/FAIL lines for each marked assertion and a non-zero exit when any fails.
- **effects** — disk (creates a scratch git repository under the OS temp directory; never touches the repository this test runs in), process (spawns node and git as children)
- **errors** — A failed check prints its reason and exits non-zero.
- **callers** — —
- **callees** — `packages/nana-pack/lib/blast-radius-config.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`, `scripts/blast-radius.mjs`

### `packages/nana-pack/tests/bounded-read.test.mjs`

- **purpose** — Verifies the shared bounded reader refuses special files and enforces its sealed byte ceiling.
- **inputs** — packages/nana-pack/lib/bounded-read.mjs and temporary filesystem entries
- **outputs** — PASS/FAIL lines and a nonzero exit when a bounded-read contract is violated
- **effects** — disk (temporary files and FIFO)
- **errors** — a failed check is printed and makes the process exit nonzero
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/lib/bounded-read.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/ci-workflow.test.mjs`

- **purpose** — Pins root CI triggers, suite matrix, and gated release permissions and ordering.
- **inputs** — The root GitHub Actions workflow.
- **outputs** — PASS/FAIL lines and exit status.
- **effects** — disk (reads the workflow).
- **errors** — Failed checks exit nonzero.
- **callers** — —
- **callees** — —

### `packages/nana-pack/tests/code-map.test.mjs`

- **purpose** — Holds nana-pi to the code-map rule it ships — every mapped module carries a contract header, the map on disk is current, the layer direction holds, and a test module is covered like any other
- **inputs** — scripts/code-map.mjs, code-map.config.json, docs/code-map.md and the modules under the configured roots
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (reads this checkout; writes a scratch copy of one test module for the mutation check), process (runs the map CLI and a syntax check as child processes)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`, `scripts/code-map.mjs`, `scripts/requirements-trace.mjs`

### `packages/nana-pack/tests/config-display-text.test.mjs`

- **purpose** — Pins that every config diagnostic reaching a UI or the model is display text, so attacker-controlled STRUCTURE never survives into a notification, a block reason or a file
- **inputs** — lib/config.ts, extensions/nana-gate.ts, lib/display.mjs, and hostile nana-pack.json bytes under a temp HOME whose own path carries a newline
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME and hostile config files), process (sets HOME and USERPROFILE)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/objective.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/config-gate-fallback.test.mjs`

- **purpose** — Pins that a malformed USER gate block never widens the gate — mid-session the last valid policy is kept in memory, and a fresh process stops every gated tool class with the repair reason
- **inputs** — extensions/nana-gate.ts and malformed nana-pack.json files under fresh temp HOMEs
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOMEs and config files), process (sets HOME, spawns child node processes for the fresh-process cases)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/lib/json-text.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/config-handlers-malformed.test.mjs`

- **purpose** — Pins that every registered nana-pack handler survives every malformed user config without throwing, while the gate still blocks, the problem is journaled once, and post-edit and lifecycle keep working under five unrelated malformed blocks
- **inputs** — the eight extensions under extensions/, malformed nana-pack.json variants, a configured postEdit check on a.ts, and a fresh temp HOME and workspace per variant
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOMEs, config files and workspaces), process (sets HOME and USERPROFILE, spawns the configured postEdit checker as a child process)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/config-normalize.test.mjs`

- **purpose** — Pins that loadConfig never throws for any bytes and always returns a fully typed config, with the gate's conservative fallback and objective and writing kept user-only
- **inputs** — lib/config.ts and arbitrary nana-pack.json bytes under a fresh temp HOME per case
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOMEs and config files), process (sets HOME and USERPROFILE)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/lib/config.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/config-project-gate-fallback.test.mjs`

- **purpose** — Pins the PROJECT-scope mirror of the gate fallback — a nana-trusted project's malformed gate block keeps the last valid policy mid-session and stops conservatively in a fresh process
- **inputs** — extensions/nana-gate.ts, lib/config.ts, a nana-trusted temp project and pi's trust store under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, temp git projects, trust store), process (sets HOME, runs git and child node processes)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/lib/json-text.mjs`, `packages/nana-pack/tests/pi-install.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/config-trust.test.mjs`

- **purpose** — Pins that project-local nana-pack.json is honored only under nana-trust — a trust decision that was actually made — and fails closed when the trust API or pi's module is absent
- **inputs** — lib/config.ts, the required installed pi trust module, and temp projects under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, temp projects, pi settings fixtures), process (sets HOME, runs npm and git through execSync)
- **errors** — a failed check prints FAIL and the run exits 1; the pi locator throws with attempted locations when no pi install is found
- **callers** — —
- **callees** — `packages/nana-pack/lib/config.ts`, `packages/nana-pack/tests/pi-install.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/display-surfaces.test.mjs`

- **purpose** — Pins ONE renderer per surface — every renderer over the lane's hostile-input table, plus one probe per call site that a hostile value cannot change the STRUCTURE the consumer receives
- **inputs** — lib/display.mjs and its call sites across the extensions, hostile values from the lane's failure-mode list, and a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME and written surfaces), process (sets HOME, spawns the surfaces that run as child processes)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/extensions/nana-post-edit.ts`, `packages/nana-pack/lib/adoption.mjs`, `packages/nana-pack/lib/display.mjs`, `packages/nana-pack/lib/objective.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/fake-pi.mjs`

- **purpose** — Lay out a fake `pi` on win32 exactly the shape piLaunch (pi-watchdog.mjs) resolves an npm global install into, from a caller-supplied Node source body.
- **inputs** — a directory to hold the fake (meant to sit first on PATH) and the Node source text to run as pi's body; PI_PACKAGE and PI_BIN_NAME from worker-config.mjs
- **outputs** — the same directory, now holding pi.cmd, its npm package.json and the body as cli.js
- **effects** — disk (creates the directory if missing, writes three files under it)
- **errors** — none; a write failure throws through node:fs
- **callers** — `packages/nana-pack/tests/handoff-writer-role.test.mjs`, `packages/nana-pack/tests/immutable-review.test.mjs`, `packages/nana-pack/tests/land.test.mjs`, `packages/nana-pack/tests/path-spelling.test.mjs`, `packages/nana-pack/tests/review-ledger.test.mjs`, `packages/nana-pack/tests/review-standard.test.mjs`, `packages/nana-pack/tests/watchdog-cpu.test.mjs`, `packages/nana-pack/tests/watchdog-exit.test.mjs`, `packages/nana-pack/tests/worker-lane.test.mjs`
- **callees** — `packages/nana-pack/bin/worker-config.mjs`

### `packages/nana-pack/tests/frontier.test.mjs`

- **purpose** — Pins the report-only HANDOFF frontier checker against its read window, section order, rewritten and legacy fixtures, an injected date, and strict-mode exits.
- **inputs** — the frontier CLI, fixture HANDOFF files, this repository's HANDOFF.md, and temporary inputs
- **outputs** — named PASS/FAIL checks and a nonzero test exit when an assertion fails
- **effects** — disk (temporary input); process (spawns the CLI)
- **errors** — failed assertions are reported and cause exit 1
- **callers** — —
- **callees** — `packages/nana-pack/lib/frontier-config.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/gate-config-robustness.test.mjs`

- **purpose** — Pins that a malformed gate config never throws out of the tool_call handler, since a throw there is upstream-blocked and would wrongly refuse a benign edit
- **inputs** — extensions/nana-gate.ts and nana-pack.json files with null gate arrays under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME and config files), process (sets HOME and USERPROFILE)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/gate-corpus.test.mjs`

- **purpose** — The table-driven BLOCK / ALLOW corpus over the REAL registered gate handler, headless fail-closed with one interactive variant pinning the dialog
- **inputs** — extensions/nana-gate.ts with lib/gate-shell.ts and lib/gate-paths.ts, per-scenario nana-pack.json under a temp HOME, and a temp cwd
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, config files and cwd), process (sets HOME and USERPROFILE)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/gate-policy-paths.test.mjs`

- **purpose** — Pins that tool writes to the gate's own policy files and to pi's trust store are gated in every path form, because both are trust evidence for project-scope config
- **inputs** — extensions/nana-gate.ts and a temp HOME standing in for the default agent dir
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (a temp HOME), process (sets HOME and USERPROFILE)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/lib/gate-paths.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/gate-rm-inside.test.mjs`

- **purpose** — Pin the one rm exemption (R-1490), its six guard rows (R-1491 to R-1496) and the bare-repository guard rows (R-2240 to R-2243) over the REAL registered gate handler
- **inputs** — extensions/nana-gate.ts with lib/gate-rm-inside.ts, lib/gate-shell.ts, lib/gate-paths.ts and lib/real-path.mjs, a temp HOME, a temp cwd fixture tree, a temp git-fixture tree (built with git on PATH) and env PI_CODING_AGENT_DIR
- **outputs** — PASS/FAIL lines per row on stdout, a SKIP line when the case-changed HOME spelling does not exist on this filesystem, and exit 1 when any row fails
- **effects** — disk (temp HOME, cwd fixtures incl. three symlinks, config files, a temp git-fixture tree), process (sets HOME, USERPROFILE and PI_CODING_AGENT_DIR; spawns git)
- **errors** — a failed row prints FAIL with the cases that got the wrong verdict and the run exits 1; an unexpected throw propagates and fails the run, including a missing git
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/gate-rm-outside.test.mjs`

- **purpose** — Pin prompts for readable non-recursive rm targets outside the working and accepted temp folders, including Git Bash path readings, the POSIX /tmp root, and the inside and variable-led passes.
- **inputs** — the real nana-gate handler, gate-rm-outside, gate-shell, real-path, and one temporary fixture tree containing working, home, temp, outside, sibling, link and junction spellings
- **outputs** — 17 named PASS/FAIL checks: 14 plus 3 SKIP off Windows; 16 plus 1 SKIP on Windows when Git Bash is missing, and exit 1 when any requirement fails
- **effects** — disk (one temporary fixture tree and gate config), process (temporarily sets HOME, USERPROFILE and temp variables; spawns Git Bash for R-2497's cygpath/mount comparison)
- **errors** — unexpected failures reject through a per-case timeout and fail the process; assertion failures print FAIL
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/lib/gate-rm-outside.ts`, `packages/nana-pack/lib/gate-shell.ts`, `packages/nana-pack/lib/gate-temp-roots.ts`, `packages/nana-pack/lib/real-path.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/gate-self-protection.test.mjs`

- **purpose** — Pins the FLOOR — nana's policy files, pi's trust store and the Claude policy files are gated in every path and command form, and no allow pattern exempts them
- **inputs** — extensions/nana-gate.ts, lib/gate-paths.ts, and a temp HOME with symlinked policy files and an alternate agent dir
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, symlinks, policy fixtures), process (sets HOME and USERPROFILE)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/lib/gate-paths.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/gate-status.test.mjs`

- **purpose** — Pins the gate's per-session tally — published on every tool call it inspects, silent outside its scope, and never able to change or block a decision
- **inputs** — extensions/nana-gate.ts and a nana-pack.json under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME and config file), process (sets HOME and USERPROFILE)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/gate-survives-mutation.test.mjs`

- **purpose** — Pins that the gate survives its own config being rewritten mid-session by a write it never saw — loosening never applies without a reload, tightening applies at once, and a malformed block never falls back to defaults
- **inputs** — extensions/nana-gate.ts, user and project nana-pack.json rewritten underneath it with fs, and a nana-trusted temp project under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, config files, temp project), process (sets HOME, spawns fresh node processes for the restart cases)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/lib/config.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/git-only-path.mjs`

- **purpose** — Build a child PATH folder that resolves to git and nothing else, for CLI fixtures pinning a missing-tool outcome.
- **inputs** — A temporary directory to hold the POSIX symlink.
- **outputs** — The PATH folder a child process should use.
- **effects** — disk (POSIX: creates one symlink under the given directory); process (runs `which`/`where` to locate git)
- **errors** — Throws when git cannot be located, or when the resolved win32 git folder also holds uvx
- **callers** — `packages/nana-pack/tests/template-acceptance.test.mjs`, `packages/nana-pack/tests/template-release.test.mjs`
- **callees** — —

### `packages/nana-pack/tests/handoff-artifact.test.mjs`

- **purpose** — Pins the continuity path — compaction writes the handoff artifact to the user-scope store and the next fresh session picks it up, told to update it in place
- **inputs** — extensions/nana-handoff.ts, a nana-pack.json and the handoff store under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, config file, handoff store), process (sets HOME and USERPROFILE)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/handoff-asks.test.mjs`

- **purpose** — Pins Open for Jake entry splitting and the independent frontier-tag and report-title grammars.
- **inputs** — handoff-asks.mjs and temporary HANDOFF text.
- **outputs** — named PASS/FAIL checks and a nonzero exit when an assertion fails.
- **effects** — disk (writes fixtures under the OS temp directory).
- **errors** — failed assertions are reported and cause exit 1.
- **callers** — —
- **callees** — `packages/nana-pack/lib/handoff-asks.mjs`

### `packages/nana-pack/tests/handoff-staleness.test.mjs`

- **purpose** — Pins handoff provenance and staleness — a fresh file is injected in full with its provenance, and one older than the staleness window becomes a bounded pointer instead of text
- **inputs** — extensions/nana-handoff.ts, handoff files whose `Written:` header carries the injected clock, and the required installed pi path resolver
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME and handoff files), process (sets HOME)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/tests/pi-install.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/handoff-store.test.mjs`

- **purpose** — Pins the user-scope handoff store — written atomically, keyed per exact canonical directory so nothing borrows an ancestor's, and skipped by resume, fork and reload
- **inputs** — extensions/nana-handoff.ts, a nana-pack.json and the handoff store under a temp HOME, and throwaway repositories and worktrees
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, store files, repository fixtures), process (sets HOME, PI_CODING_AGENT_DIR for one block, spawns a child session)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/handoff-symlink.test.mjs`

- **purpose** — Pins that a custom handoff.path is never read or written THROUGH a symlink the repository controls, so no link target reaches the system prompt or gets overwritten
- **inputs** — extensions/nana-handoff.ts, a nana-pack.json naming a symlinked handoff path, and a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, symlinks and their targets), process (sets HOME and USERPROFILE)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/handoff-trust.test.mjs`

- **purpose** — Pins that a repository-committed `.pi/handoff.md` never reaches the system prompt even when pi calls the folder trusted — the session gets one bounded pointer and a journal line
- **inputs** — extensions/nana-handoff.ts, a committed legacy handoff file in a temp project, and a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, temp project, journal), process (sets HOME and USERPROFILE)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/lib/config.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/handoff-writer-role.test.mjs`

- **purpose** — Pins that a session whose launcher set NANA_HANDOFF=off neither picks up nor writes the handoff, and that the role is never inferred from the tool list or the UI
- **inputs** — extensions/nana-handoff.ts, bin/pi-review.mjs, a stub `pi` on PATH (./fake-pi.mjs on win32), a temp HOME and a scratch git repository
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, store files, a scratch git repository under the OS temp dir), process (sets HOME and NANA_HANDOFF, spawns pi-review with the stub pi on PATH, cwd the scratch repo)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/tests/fake-pi.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/immutable-review.test.mjs`

- **purpose** — Pins immutable pi-review snapshots, refusal before admission, child checkout identity and cleanup.
- **inputs** — pi-review.mjs, review-round.mjs, a fake pi executable and temporary git repositories.
- **outputs** — PASS/FAIL checks and a failing process status when a check is false.
- **effects** — disk (temporary repositories and worktrees), process (fake review launch).
- **errors** — failed assertions exit nonzero; unexpected process errors fail the test.
- **callers** — —
- **callees** — `packages/nana-pack/tests/fake-pi.mjs`, `packages/nana-pack/tests/launch-wait.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/land.test.mjs`

- **purpose** — Pins the land helper's review checks, suite-before-merge order and safe cleanup.
- **inputs** — nana-land.mjs and isolated temporary git repositories.
- **outputs** — PASS/FAIL lines and a nonzero exit when a land contract fails.
- **effects** — disk (temporary test repositories).
- **errors** — Failed checks exit nonzero; unexpected exceptions fail the process.
- **callers** — —
- **callees** — `packages/nana-pack/bin/nana-land.mjs`, `packages/nana-pack/bin/review-round.mjs`, `packages/nana-pack/lib/real-path.mjs`, `packages/nana-pack/tests/fake-pi.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/lane-write-guard.test.mjs`

- **purpose** — Pins the opt-in lane write boundary across traversal, symlink, missing-target, and unset-root cases.
- **inputs** — nana-gate, temporary worktree and outside directories
- **outputs** — named PASS/FAIL/SKIP checks
- **effects** — disk (fixtures under home, OS temp or /var/tmp), process (environment)
- **errors** — failed assertions exit nonzero
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/lib/gate-temp-roots.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/launch-wait.mjs`

- **purpose** — Waits for review-test launch records without assuming process startup or record writes are immediate.
- **inputs** — A record path, launcher-close promise, completeness predicate and optional wait timings.
- **outputs** — The first complete record text, or null after closure or the wait limit.
- **effects** — disk (record reads).
- **errors** — Record read errors other than ENOENT propagate.
- **callers** — `packages/nana-pack/tests/immutable-review.test.mjs`, `packages/nana-pack/tests/review-ledger.test.mjs`, `packages/nana-pack/tests/review-test-waits.test.mjs`
- **callees** — —

### `packages/nana-pack/tests/lifecycle-journal.test.mjs`

- **purpose** — Pins one journal line with cwd and pid for each lifecycle event, reasons on session and compaction lines, and only the allowed fields on compaction lines
- **inputs** — extensions/nana-lifecycle.ts and a nana-pack.json under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, config file and journal file), process (sets HOME and USERPROFILE)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-lifecycle.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/lifecycle-reload.test.mjs`

- **purpose** — Pins the `/reload-runtime` command the desk depends on — registered exactly once under a non-colliding name, carrying a description, and calling ctx.reload once
- **inputs** — extensions/nana-lifecycle.ts and a nana-pack.json under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME and config file), process (sets HOME and USERPROFILE)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-lifecycle.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/line-endings.test.mjs`

- **purpose** — Pin that this repository's `.gitattributes` checks out every text file as LF, whatever the cloning machine's `core.autocrlf` is (R-1320).
- **inputs** — this checkout, cloned locally into a temp folder with `core.autocrlf=true`
- **outputs** — PASS/FAIL lines on stdout, a non-zero exit when any check fails
- **effects** — disk (a local git clone under the OS temp directory, removed on process exit)
- **errors** — a FAIL line naming the file that still carries a CR byte
- **callers** — —
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/linked-launch.test.mjs`

- **purpose** — Pin that five command entry points exit and print the same whether started by their real checkout path or through a symlinked or junctioned link to that checkout, so a detached checkout reached through the OS temp folder's own link (macOS /var, a reviewer's worktree) cannot read a silent exit 0 as a real pass.
- **inputs** — scripts/requirements-moved.mjs, scripts/requirements-tree.mjs, scripts/requirement-rows.mjs, scripts/product-report.mjs and packages/nana-pack/bin/nana-roster.mjs, spawned by real path and through one link to the checkout root built under the OS temp directory.
- **outputs** — PASS/FAIL lines for each marked assertion and a non-zero exit when any fails.
- **effects** — disk (makes and removes one symlink/junction to the checkout root, inside its own mkdtemp folder; separate scratch directories under the OS temp directory for cwd, HOME and agent-dir fixtures), process (spawns node as a child, by real path and through the link)
- **errors** — A failed check prints its reason and exits non-zero.
- **callers** — —
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/mutation-runner-takeover.test.mjs`

- **purpose** — Pin exclusive and recoverable takeover of dead or old unreadable mutation-runner worktree-operation locks.
- **inputs** — ../lib/mutation-runner.mjs, ../lib/mutation-runner-config.mjs, and disposable lock fixtures under the OS temp directory
- **outputs** — three PASS/FAIL lines, one for each of R-2170 to R-2172, and a non-zero exit when any check fails
- **effects** — disk (temporary lock, marker and child-script files), process (spawns and safety-kills waiter children)
- **errors** — a FAIL line names the broken takeover case; unexpected case errors are captured into that line
- **callers** — —
- **callees** — `packages/nana-pack/lib/mutation-runner-config.mjs`, `packages/nana-pack/lib/mutation-runner.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/mutation-runner.test.mjs`

- **purpose** — Pin the shared mutation runner's scratch-worktree isolation, test-file run, timeout/drain, edit/syntax/containment refusals, baseline, judging, sharding, record, refusals, dry/log, lock, tip/table identity and config-merge contracts (R-1230 to R-1244, R-1770 to R-1779 and R-1960) against a disposable git fixture.
- **inputs** — ../lib/mutation-runner.mjs, ../lib/mutation-runner-config.mjs, and a throwaway git repository this file builds under the OS temp directory for every run
- **outputs** — PASS/FAIL lines for each marked check and a non-zero exit when any fails
- **effects** — disk (a throwaway git repo, scratch worktrees and records under the OS temp directory), process (spawns shard and test-file children; two checks send SIGTERM/SIGKILL to processes this file started)
- **errors** — a FAIL line naming the broken behaviour; a non-zero exit code
- **callers** — —
- **callees** — `packages/nana-pack/lib/mutation-runner-config.mjs`, `packages/nana-pack/lib/mutation-runner.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/nana-roster-set.test.mjs`

- **purpose** — Pin `nana-roster set`: slot replacement, every other member kept, every malformed input and on-disk file refused, the pi-model-shell guard, the atomic rename, the symlink case and the backup it leaves.
- **inputs** — nana-roster.mjs's resolveRoster/orderedRoster/formatRosterLines, lib/roster-set.mjs's setRosterSlot, worker-config.mjs's PI_MODEL_SHELL_ENV/SLOT_NULL_TOKENS/DEFAULT_THINKING_TOKEN/ CLAUDE_CODE_RUNTIME, and spawned nana-roster.mjs CLI runs under a temp HOME
- **outputs** — named PASS/FAIL checks
- **effects** — disk (temp fixtures), process (spawns the roster CLI)
- **errors** — failed assertions exit nonzero
- **callers** — —
- **callees** — `packages/nana-pack/bin/nana-roster.mjs`, `packages/nana-pack/bin/worker-config.mjs`, `packages/nana-pack/lib/roster-set.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/nana-roster.test.mjs`

- **purpose** — Pin the machine roster resolver and command: the sealed default, a valid machine roster, every refused shape, and the printed lines.
- **inputs** — nana-roster.mjs's resolveRoster/validateRosterShape/formatRosterLines, worker-config.mjs's ROSTER_DEFAULTS/LANE_DEFAULTS, and spawned nana-roster.mjs CLI runs under a temp HOME
- **outputs** — named PASS/FAIL checks
- **effects** — disk (temp fixtures), process (spawns the roster CLI)
- **errors** — failed assertions exit nonzero
- **callers** — —
- **callees** — `packages/nana-pack/bin/nana-roster.mjs`, `packages/nana-pack/bin/worker-config.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/notify-dispatch.test.mjs`

- **purpose** — Pins that the OS notifier is genuinely dispatched per platform with the right body only when a UI is attached or headless is opted in, and that no terminal escape code is ever written without an attached UI, even when the notifier fails
- **inputs** — extensions/nana-notify.ts with node:child_process execFile replaced by a recording stand-in, and a nana-pack.json under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME and config file), process (monkeypatches node:child_process execFile via require('node:child_process') + syncBuiltinESMExports — restored before exit; sets HOME and USERPROFILE; fakes process.platform within try/finally)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-notify.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/notify-fallback.test.mjs`

- **purpose** — Pins that a failing, erroring or hung OS notifier is reported rather than silently dropped, including the Windows toast path that swallowed its own errors
- **inputs** — extensions/nana-notify.ts and stub notifier executables under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, stub notifier scripts), process (sets HOME, spawns and kills the stub notifiers)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-notify.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/objective-golden.test.mjs`

- **purpose** — The golden corpus pinning that the Claude Code hook's stdout and the pi extension's injected text are byte-identical once the hook's tag line is removed, and that both say the right thing
- **inputs** — extensions/nana-objective.ts, the nana-objective hook, valid and malformed user config plus OBJECTIVE.md fixtures under a temp HOME, and the required installed pi trust module
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, objective fixtures, a symlinked hook), process (sets HOME, runs the bash hook with node on PATH)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-objective.ts`, `packages/nana-pack/lib/objective.ts`, `packages/nana-pack/tests/pi-install.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/objective-injection.test.mjs`

- **purpose** — Pins that the owner's objective and current priority reach every session's system prompt and that only the USER can say what they are or rename the per-repo file
- **inputs** — extensions/nana-objective.ts, OBJECTIVE.md fixtures, and nana-pack.json at both scopes under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, objective fixtures, config files), process (sets HOME and USERPROFILE)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-objective.ts`, `packages/nana-pack/lib/config.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/pack-config-utf16.test.mjs`

- **purpose** — Prove every user-facing nana-pack.json reader accepts marked UTF-16 and rejects unmarked, double-marked or odd-byte UTF-16.
- **inputs** — nana-gate, nana-objective and nana-roster child processes plus UTF-8, UTF-16LE and UTF-16BE temporary config fixtures
- **outputs** — PASS/FAIL lines per check, a Windows-only SKIP line, and exit 1 when any check fails
- **effects** — disk (temporary homes and config files), process (spawns Node and Windows PowerShell children)
- **errors** — failed assertions increment the failure count; child timeouts or launch failures are reported by their check
- **callers** — —
- **callees** — `packages/nana-pack/bin/worker-config.mjs`, `packages/nana-pack/lib/json-text.mjs`, `packages/nana-pack/lib/objective.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/path-spelling.test.mjs`

- **purpose** — Pins GP1-GP7 (W7c): the land and review tools treat two spellings of one folder — another letter case, an 8.3 short name, a link, a `\\?\` prefix or another Unicode form — as one folder.
- **inputs** — bin/review-ledger.mjs, bin/pi-review.mjs, bin/nana-land.mjs, bin/review-round.mjs, a fake pi on PATH, and temporary git repositories and worktrees built under a temporary HOME
- **outputs** — PASS/FAIL/SKIP lines per check on stdout, and a nonzero exit when any check fails
- **effects** — disk (temp HOME, git repositories, worktrees, symlinks/junctions, ledger files), process (spawns the review CLIs, a fake pi and git)
- **errors** — a failed check prints FAIL with the observed detail and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/tests/fake-pi.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/pi-install.mjs`

- **purpose** — Resolve the real installed pi package consistently for pack tests.
- **inputs** — DESK_PI_ROOT, npm global-root discovery, and the pi executable on PATH.
- **outputs** — The validated package root and the source used to resolve it.
- **effects** — process (runs npm or PATH lookup commands), disk (reads package metadata).
- **errors** — Throws an Error naming each candidate that could not be resolved.
- **callers** — `packages/nana-pack/tests/config-project-gate-fallback.test.mjs`, `packages/nana-pack/tests/config-trust.test.mjs`, `packages/nana-pack/tests/handoff-staleness.test.mjs`, `packages/nana-pack/tests/objective-golden.test.mjs`, `packages/nana-pack/tests/pi-install.test.mjs`, `packages/nana-pack/tests/post-edit-file-queue.test.mjs`, `packages/nana-pack/tests/post-edit-status.test.mjs`
- **callees** — —

### `packages/nana-pack/tests/pi-install.test.mjs`

- **purpose** — Pin the shared installed-pi locator's override, fallback, and diagnostic behavior.
- **inputs** — The pi-install helper and synthetic package/bin fixtures in the OS temp directory.
- **outputs** — PASS/FAIL checks and a nonzero exit when the locator contract breaks.
- **effects** — disk (writes temporary fixture metadata and links), process (temporarily changes locator env).
- **errors** — Failed assertions print FAIL and exit nonzero.
- **callers** — —
- **callees** — `packages/nana-pack/tests/pi-install.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/pipe-guard-pwsh-oracle.test.mjs`

- **purpose** — Compare the pipe guard's PowerShell spans with deterministic and live tokenizer oracles.
- **inputs** — the PowerShell scanner, generated corpus, injected runner fakes, and installed shells.
- **outputs** — PASS, FAIL, and SKIP lines plus a nonzero exit on any failed check.
- **effects** — disk, process
- **errors** — reports the first command behind an oracle or comparison failure.
- **callers** — —
- **callees** — `packages/nana-pack/lib/pipe-guard.mjs`, `packages/nana-pack/lib/pwsh-lexer-config.mjs`, `packages/nana-pack/tests/pwsh-oracle.mjs`

### `packages/nana-pack/tests/pipe-guard.test.mjs`

- **purpose** — Pins verifier-pipe classification and pi gate composition.
- **inputs** — the pure pipe guard and nana-gate tool_call handler.
- **outputs** — PASS/FAIL lines and a nonzero exit when any check fails.
- **effects** — none
- **errors** — an assertion failure exits nonzero.
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/lib/pipe-guard.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/post-edit-default-timeout.test.mjs`

- **purpose** — Pins that a post-edit command with no timeoutMs is armed at the pack's named default, POST_EDIT_DEFAULT_TIMEOUT_MS, read by name rather than an inline literal, and that the pack's post-edit configuration module seals that default at 30000 ms.
- **inputs** — a copy of extensions/nana-post-edit.ts and the whole lib/ directory (its post-edit-config.mjs retuned to 4321 in the copy only), a user nana-pack.json under a temp HOME with one command that sets no timeoutMs, and the real lib/post-edit-config.mjs
- **outputs** — PASS/FAIL lines per check on stdout, and exit code 1 when any check fails
- **effects** — disk (temp HOME, a temp copy of extensions/lib, a workspace file), process (sets HOME/USERPROFILE, runs one `node -e` checker command)
- **errors** — a failed check prints FAIL with the observed detail; an import or run failure is caught and reported as a failing check rather than propagating
- **callers** — —
- **callees** — `packages/nana-pack/lib/post-edit-config.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/post-edit-file-queue.test.mjs`

- **purpose** — Pins that a post-edit checker holds pi's per-file mutation queue while it runs and REFUSES to run when it cannot hold it, so no formatter overwrites a newer sibling edit
- **inputs** — extensions/nana-post-edit.ts, pi's file-mutation-queue module, and a temp HOME with a workspace and configured checkers
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, workspace files), process (sets HOME, runs the configured checker commands)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-post-edit.ts`, `packages/nana-pack/lib/config.ts`, `packages/nana-pack/tests/pi-install.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/post-edit-hardening.test.mjs`

- **purpose** — Pins that the post-edit checker ends a timed-out or aborted command's process tree on every platform
- **inputs** — extensions/nana-post-edit.ts and stub checkers that ignore signals, leak descendants or record a two-level process tree, under a temp HOME
- **outputs** — PASS/FAIL/SKIP lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, stub checker scripts), process (sets HOME and Windows PATH, spawns and kills the stub checkers and their descendants)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-post-edit.ts`, `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/gate-paths.ts`, `packages/nana-pack/lib/post-edit-config.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/post-edit-status.test.mjs`

- **purpose** — Pins that post-edit reports EVERY run through ctx.ui.setStatus, so a working hook never looks identical to an absent one
- **inputs** — extensions/nana-post-edit.ts, a nana-pack.json with passing and failing checkers, the installed pi queue module, and a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, workspace files), process (sets HOME, runs the configured checker commands and loads pi through its bundled jiti)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-post-edit.ts`, `packages/nana-pack/tests/pi-install.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/post-edit-utf8.test.mjs`

- **purpose** — Pin UTF-8 Python checker output and exact environment pass-through from the owner for post-edit checks.
- **inputs** — extensions/nana-post-edit.ts, Python 3.7 or later when available, node, and user-scope config under a temporary HOME.
- **outputs** — Four PASS/FAIL/SKIP verdict lines, Python discovery details, and exit 1 when a check fails.
- **effects** — disk (temporary HOME, workspaces, checker scripts and observations), process (runs post-edit checkers and temporarily changes locale variables).
- **errors** — Missing suitable Python fails its two checks naming candidates tried; watchdog expiry or a false assertion fails the run.
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-post-edit.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/post-edit-values-named.test.mjs`

- **purpose** — Pins that the post-edit checker reads its kill grace, output cap, failure cap, command cap and lock message cap BY NAME from lib/post-edit-config.mjs, so retuning any of the five there changes the check's behaviour with no other code change.
- **inputs** — a copy of extensions/nana-post-edit.ts and the whole lib/ directory (its post-edit-config.mjs retuned to 1234, 64, 37, 9 and 11 in the copy only), a stand-in @earendil-works/pi-coding-agent package under the copy's own node_modules, a user nana-pack.json under a temp HOME with one command per case, and the real lib/post-edit-config.mjs
- **outputs** — PASS/FAIL lines per check on stdout, and exit code 1 when any check fails
- **effects** — disk (temp HOME, a temp copy of extensions/lib plus its stand-in node_modules package, a workspace with checker script files), process (sets HOME/USERPROFILE, runs one `node -e` and two `node <script>` checker commands)
- **errors** — a failed check prints FAIL with the observed detail; an import or run failure is caught and reported as a failing check rather than propagating
- **callers** — —
- **callees** — `packages/nana-pack/lib/post-edit-config.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/product-report.test.mjs`

- **purpose** — Pins the product report's ledger, HANDOFF, git provenance, escaping, and deterministic output contracts.
- **inputs** — the product-report module and temporary repository fixtures.
- **outputs** — named PASS/FAIL checks for report behavior.
- **effects** — disk (temporary fixture repositories); process (git commands).
- **errors** — failed assertions set a nonzero test exit.
- **callers** — —
- **callees** — `packages/nana-pack/lib/handoff-asks.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`, `scripts/product-report.mjs`, `scripts/requirements-tree.mjs`

### `packages/nana-pack/tests/pwsh-oracle.mjs`

- **purpose** — Generate parse-clean PowerShell commands and obtain tokenizer spans from PowerShell.
- **inputs** — a seed and size, plus injected platform, spawn function, and temporary root.
- **outputs** — named corpus, shell-selection, oracle-runner, and span-comparison helpers.
- **effects** — disk, process
- **errors** — rejects on startup, timeout, parse, incomplete output, or span disagreement.
- **callers** — `packages/nana-pack/tests/pipe-guard-pwsh-oracle.test.mjs`
- **callees** — `packages/nana-pack/lib/pwsh-lexer-config.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/readme-check.test.mjs`

- **purpose** — Holds nana-pi to the README rule it ships (G-012): every command, path, flag and script name a shipped README states exists and runs as written.
- **inputs** — scripts/readme-check.mjs, readme-check.config.json, and the README files it lists
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (reads this checkout, writes throwaway fixtures under a temp dir), process (runs the readme-check CLI)
- **errors** — a failed check prints FAIL with the problem list and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`, `scripts/readme-check.mjs`

### `packages/nana-pack/tests/real-path.test.mjs`

- **purpose** — Prove realPath uses typed realpath after non-missing native failures without hiding a failure of both resolvers.
- **inputs** — realPath, mutable fs.realpathSync.native, and temporary paths containing a symlink loop and directory alias.
- **outputs** — PASS/FAIL lines and a summary; a nonzero exit when either requirement check fails.
- **effects** — disk (temporary paths only).
- **errors** — Fixture, precondition or assertion failures fail their check; the native realpath function is restored in finally.
- **callers** — —
- **callees** — `packages/nana-pack/lib/real-path.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/release-status.test.mjs`

- **purpose** — Pins release-status reporting, local Git command scope, and graceful missing-input behavior.
- **inputs** — release-status.mjs and temporary Git repositories.
- **outputs** — PASS/FAIL lines and a nonzero exit when a release-status contract fails.
- **effects** — disk (temporary test repositories).
- **errors** — Failed checks exit nonzero; unexpected exceptions fail the process.
- **callers** — —
- **callees** — `packages/nana-pack/lib/release-status.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/requirement-rows.test.mjs`

- **purpose** — Pins the candidate requirement rows lister's tiers, uncertainty label and unknown result.
- **inputs** — Synthetic import graphs, rail markers and the checkout's mapped source graph.
- **outputs** — PASS/FAIL lines for each R-649 clause.
- **effects** — disk (reads this checkout), process (runs the rows CLI)
- **errors** — A failed check is reported and makes this test process exit nonzero.
- **callers** — —
- **callees** — `scripts/code-map.mjs`, `scripts/requirement-rows.mjs`, `scripts/requirements-trace.mjs`

### `packages/nana-pack/tests/requirements-cap-kinds.test.mjs`

- **purpose** — Pin capability field parsing, validation, lift preservation, outline rendering and historical compatibility.
- **inputs** — scripts/requirements-tree.mjs, scripts/requirements-lift.mjs, git history, and ledger fixtures built under the OS temp directory.
- **outputs** — Eight PASS/FAIL lines and a non-zero exit when any check fails.
- **effects** — disk (creates ledger fixtures under the OS temp directory), process (spawns the lift and read-only git commands)
- **errors** — A failed check prints its reason and exits non-zero.
- **callers** — —
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`, `scripts/requirements-lift.mjs`, `scripts/requirements-tree.mjs`

### `packages/nana-pack/tests/requirements-lift.test.mjs`

- **purpose** — Pin the lift's dry run, proof, default mapping, supplied-mapping and git-gated write and verify behaviour against built fixtures.
- **inputs** — scripts/requirements-lift.mjs, scripts/requirements-lift-proof.mjs, templates/_shared/requirements-general.md, and ledger/mapping fixtures built by each test under the OS temp directory.
- **outputs** — PASS/FAIL lines for each marked assertion and a non-zero exit when any fails.
- **effects** — disk (creates fixtures and scratch git repositories under the OS temp directory; never touches a real project), process (spawns node and git as children)
- **errors** — A failed check prints its reason and exits non-zero.
- **callers** — —
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`, `scripts/requirements-lift-proof.mjs`, `scripts/requirements-lift.mjs`, `scripts/requirements-tree.mjs`

### `packages/nana-pack/tests/requirements-moved.test.mjs`

- **purpose** — Pin the tree movement report's row grouping, merge-base diffing, capability changes and shared-row annotations.
- **inputs** — scripts/requirements-moved.mjs, direct ledger texts and a fixture git repository built under the OS temp directory.
- **outputs** — PASS/FAIL lines for each marked assertion and a non-zero exit when any fails.
- **effects** — disk (creates a scratch git repository under the OS temp directory; never touches the repository this test runs in), process (spawns node and git as children)
- **errors** — A failed check prints its reason and exits non-zero.
- **callers** — —
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`, `scripts/requirements-moved.mjs`

### `packages/nana-pack/tests/requirements-regroup.test.mjs`

- **purpose** — Pin the regroup checker's refusals and its review page against a built fixture ledger and proposal.
- **inputs** — scripts/requirements-regroup.mjs, scripts/requirements-lift.mjs, scripts/requirements-tree.mjs, and a fixture ledger/proposal built by this file under the OS temp directory.
- **outputs** — PASS/FAIL lines for each marked assertion and a non-zero exit when any fails.
- **effects** — disk (creates fixtures and scratch files under the OS temp directory; never touches a real project), process (spawns node as a child)
- **errors** — A failed check prints its reason and exits non-zero.
- **callers** — —
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`, `scripts/requirements-lift.mjs`, `scripts/requirements-regroup.mjs`

### `packages/nana-pack/tests/requirements-trace.test.mjs`

- **purpose** — Holds nana-pi to the requirements-first rail it ships: an implemented row has a marked test behind it, a lesser row has no marker contradicting it, every cited test exists and carries the marker, the EARS form count and allowance behave on fixtures, and the shipped CLI really prints the report line after the summary line.
- **inputs** — scripts/requirements-trace.mjs, REQUIREMENTS.md, and the markers in the six test dirs npm test collects
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (reads this checkout; writes and removes scratch dirs under the OS temp dir for the EARS fixtures), process (spawns the real CLI once)
- **errors** — a failed check prints FAIL with the problem list and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`, `scripts/requirements-trace.mjs`

### `packages/nana-pack/tests/requirements-tree.test.mjs`

- **purpose** — Pins the capability-tree requirements on the real ledger and proves each structural rule and outline field rejects a broken fixture.
- **inputs** — REQUIREMENTS.md, docs/requirements-tree.md, scripts/requirements-tree.mjs and temporary ledger fixtures.
- **outputs** — PASS/FAIL lines for each marked assertion and a non-zero exit when any fails.
- **effects** — disk (reads repository files and creates fixtures under the OS temp directory)
- **errors** — A failed check prints its reason and exits non-zero.
- **callers** — —
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`, `scripts/requirements-trace.mjs`, `scripts/requirements-tree.mjs`

### `packages/nana-pack/tests/requirements-unclaimed.test.mjs`

- **purpose** — Pin the opt-in unclaimed-test listing shared by the TypeScript and Python requirements trace rails.
- **inputs** — the two template rails, nana-pi's trace shim and requirements skill, plus temporary TypeScript and Python fixture projects
- **outputs** — six PASS, FAIL or SKIP lines and exit 1 when a required contract check fails
- **effects** — disk (reads this checkout and writes temporary fixtures), process (runs Node and uvx child processes)
- **errors** — a failed check prints FAIL; Python-dependent checks SKIP only when uvx cannot resolve pytest unless CI requires it
- **callers** — —
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`, `scripts/requirements-trace.mjs`

### `packages/nana-pack/tests/review-launch.test.mjs`

- **purpose** — Pin review-ledger command-start failures and the injected Windows reviewer launch resolver.
- **inputs** — review-launch.mjs, review-ledger.mjs, injected Windows files and environment, and temporary git repositories.
- **outputs** — named PASS/FAIL/SKIP lines.
- **effects** — disk (OS-temp fixtures), process (git and review-ledger child runs).
- **errors** — failed assertions or fixture setup exit nonzero; a missing reviewLaunch export fails each resolver title.
- **callers** — —
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/review-ledger.test.mjs`

- **purpose** — Pins the per-item review ledger through REAL processes against real git repositories and worktrees, with each known bypass recorded here as a refusal
- **inputs** — bin/pi-review.mjs, bin/pi-worker.mjs, bin/review-ledger.mjs, bin/review-round.mjs, a stub `pi` on PATH, and temp git repositories under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, git repositories, worktrees, ledger files), process (spawns the review CLIs, the stub pi, git, and icacls on Windows)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/lib/verdict-config.mjs`, `packages/nana-pack/tests/fake-pi.mjs`, `packages/nana-pack/tests/launch-wait.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/review-round.test.mjs`

- **purpose** — Pins the review ROUND CAP as pure rules — a round is a distinct revision, the item slug is canonical, and the deprecated path helper keeps its contract
- **inputs** — bin/review-round.mjs
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — none
- **errors** — a failed check prints FAIL and the run exits 1; the helpers that must reject bad input are asserted to throw
- **callers** — —
- **callees** — `packages/nana-pack/bin/review-round.mjs`

### `packages/nana-pack/tests/review-standard.test.mjs`

- **purpose** — Pins the review standard's required verdict and MUST text, and pi-review's refusal before admission when the standard file is missing, not a regular file, or blank.
- **inputs** — packages/nana-pack/prompts/review-standard.md, a temporary copy of bin/, lib/verdict-config.mjs, lib/win-command.mjs, lib/win-command-config.mjs, lib/real-path.mjs and prompts/, a stub pi executable (./fake-pi.mjs on win32), and a temporary git repository.
- **outputs** — PASS/FAIL lines per check on stdout, and a nonzero exit when any check fails.
- **effects** — disk (a pack copy, a scratch HOME and a scratch git repository under the OS temp dir), process (spawns the copied pi-review.mjs against a stub pi)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/tests/fake-pi.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/review-test-waits.test.mjs`

- **purpose** — Pins complete, bounded launch-record waits and immutable-review's behavior under delayed launches and cleanup failure.
- **inputs** — launch-wait.mjs, immutable-review.test.mjs, a runtime preload and temporary folders.
- **outputs** — PASS/FAIL checks and a failing process status when a check is false.
- **effects** — disk (temporary preload and child roots), process (one immutable-review test child).
- **errors** — failed assertions exit nonzero; an unexpected setup or process error propagates.
- **callers** — —
- **callees** — `packages/nana-pack/tests/launch-wait.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/review-timeline.test.mjs`

- **purpose** — Pins the review timeline (R-1560 to R-1565, must-meet RT1 to RT6) through the real CLI against the real review ledger: grouping into rounds, MUST findings read from a sent-back review's own recorded file in each declared layout, the four cases where none can be read, the marks an unverified, over-cap, no-verdict or older line carries, no absolute path in the output, and no write to the ledger folder or any review folder.
- **inputs** — bin/review-timeline.mjs, bin/review-ledger.mjs, bin/review-round.mjs, a stub reviewer process, and temporary git repositories, HOMEs and review-output folders under the OS temp directory
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, git repositories and review-output folders under the OS temp directory; hand-crafted tally lines appended only to those temp ledgers), process (spawns bin/review-timeline.mjs and, through bin/review-ledger.mjs, a stub reviewer process)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/bin/review-round.mjs`, `packages/nana-pack/lib/review-timeline-config.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/roster-notice.test.mjs`

- **purpose** — Pin the roster notice's composition from a roster result and file, its sealed config, and (once both seats carry it) the hook/extension parity and the relative-agent-dir case in both seats.
- **inputs** — roster-notice.mjs's rosterNotice, roster-notice-config.mjs's sealed values, worker-config.mjs's ROSTER_DEFAULTS, nana-roster.mjs's resolveRoster, and temp agent dirs
- **outputs** — named PASS/FAIL checks
- **effects** — disk (temp fixtures)
- **errors** — failed assertions exit nonzero
- **callers** — —
- **callees** — `packages/nana-pack/bin/nana-roster.mjs`, `packages/nana-pack/bin/worker-config.mjs`, `packages/nana-pack/extensions/nana-roster-notice.ts`, `packages/nana-pack/lib/roster-notice-config.mjs`, `packages/nana-pack/lib/roster-notice.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`, `packages/nana-setup/lib/paths.mjs`

### `packages/nana-pack/tests/rulings.test.mjs`

- **purpose** — Pins that the installed rulings file reaches every session's system prompt on every session_start reason, that an unusable or oversized or non-regular installed file never crashes or hangs the process and instead yields one user-facing marker line, that the sealed read cap is pinned directly, and that the shipped rulings file itself names no owner, no work project and no model id, opens with the required scope sentence, and holds only dated bullets.
- **inputs** — extensions/nana-rulings.ts (production default via PI_CODING_AGENT_DIR, and an injected, disposable agentDir for every failure fixture — never the shipped file is written), lib/rulings-config.mjs, bin/worker-config.mjs (ROSTER_DEFAULTS, CLAUDE_CODE_SUBAGENT_MODELS), the shipped packages/nana-pack/rules/nana-rulings.md (read only), a temp HOME/agent dir, and (for the FIFO fixture) a Node subprocess with a time limit
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp dirs, disposable rulings-file fixtures only — the shipped file is read at most, never written), process (sets PI_CODING_AGENT_DIR; spawns one bounded Node subprocess for the FIFO fixture)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/bin/worker-config.mjs`, `packages/nana-pack/lib/rulings-config.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/runtime-map.test.mjs`

- **purpose** — Pin the runtime-map feature's nine must-meet rows (R-1271..R-1278) from OUTSIDE the measure command and the impact reader.
- **inputs** — the real scripts/runtime-measure.mjs, packages/nana-pack/lib/runtime-map.mjs and scripts/code-map.mjs, fixture git repositories this file builds, and the real checkout's own tracked files and hashes for the --impact fixtures
- **outputs** — one PASS / FAIL line per check and a non-zero exit when any check failed
- **effects** — process (spawns git, the copied test runner, the real code-map and runtime-measure CLIs, and fake multi-level process trees for the signal case), disk (temp git repositories and data files under one mkdtemp tree, removed at exit)
- **errors** — a FAIL line naming the broken behaviour; a non-zero exit code
- **callers** — —
- **callees** — `packages/nana-pack/lib/runtime-map-config.mjs`, `packages/nana-pack/lib/runtime-map.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`, `scripts/runtime-measure.mjs`

### `packages/nana-pack/tests/skill-claims.mjs`

- **purpose** — Judge path, package-script, flag, and nana-command claims on one declared surface.
- **inputs** — A surface name, its text, and the root directories against which its claims apply.
- **outputs** — Extracted claim counts, unjudged command heads, and categorized problems.
- **effects** — disk (reads package metadata and claimed source paths).
- **errors** — Invalid package metadata is treated as an empty declaration; claim failures are returned to the caller.
- **callers** — `packages/nana-pack/tests/skill-claims.test.mjs`, `packages/nana-pack/tests/templates-render.test.mjs`
- **callees** — —

### `packages/nana-pack/tests/skill-claims.test.mjs`

- **purpose** — Pin the surface inventory and checkout-only skill claim judgements.
- **inputs** — Skill and shared-section text plus the current repository tree.
- **outputs** — PASS/FAIL lines and claim accounting on stdout.
- **effects** — disk (reads checkout files and creates isolated temporary fixtures), process (exits non-zero on failed checks)
- **errors** — A failed contract check increments the failure count and exits 1.
- **callers** — —
- **callees** — `packages/nana-pack/tests/skill-claims.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/template-acceptance.test.mjs`

- **purpose** — Pins immutable-ref rendering, adopt fixture order, and fail-closed acceptance outcomes.
- **inputs** — Acceptance runner and injected child process results.
- **outputs** — PASS/FAIL lines and exit status.
- **effects** — disk (temporary fixture trees).
- **errors** — Failed checks exit nonzero.
- **callers** — —
- **callees** — `packages/nana-pack/tests/git-only-path.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`, `scripts/template-acceptance.mjs`

### `packages/nana-pack/tests/template-release.test.mjs`

- **purpose** — Pins gated template tag creation and tag-only pushes against isolated Git remotes.
- **inputs** — Release command and temporary repositories.
- **outputs** — PASS/FAIL lines and exit status.
- **effects** — disk (temporary Git repositories).
- **errors** — Failed checks exit nonzero.
- **callers** — —
- **callees** — `packages/nana-pack/tests/git-only-path.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`, `scripts/template-release.mjs`

### `packages/nana-pack/tests/templates-render.test.mjs`

- **purpose** — Pins that both project template modes render and that the requirements-first rail they ship is wired in each, including a first `--check` that passes with no dependencies installed
- **inputs** — the templates/ tree at the repository root and throwaway render targets under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, rendered projects), process (spawns the render and check commands in the rendered projects)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/tests/skill-claims.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`, `packages/nana-setup/lib/settings.mjs`, `scripts/requirements-tree.mjs`

### `packages/nana-pack/tests/templates-update.test.mjs`

- **purpose** — Verify that the template-owned Part G file survives rendering and copier updates while each project's rail reconciles its owned status cells.
- **inputs** — Copier templates, the shared Part G source, and the exported TypeScript rail over temporary project roots
- **outputs** — PASS/FAIL checks for rail source selection, status ownership, drift reporting, and template update behavior
- **effects** — disk (writes fixture projects under the OS temp directory), process (runs external copier commands when available)
- **errors** — Failed checks exit non-zero; unavailable optional Copier tooling is reported as SKIP
- **callers** — —
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/test-locked.test.mjs`

- **purpose** — Pin shared-machine suite locking using isolated child commands and lock directories.
- **inputs** — The locked runner, temporary command fixtures, and environment overrides.
- **outputs** — PASS or FAIL checks for serialization, filters, reclamation, and cleanup.
- **effects** — process (spawns fixture runners), disk (temporary fixtures and lock state).
- **errors** — Reports failed contract checks and exits non-zero.
- **callers** — —
- **callees** — `packages/nana-pack/lib/test-runner-config.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/test-runner-parallel.test.mjs`

- **purpose** — Pin the test runner's --jobs=N parallel-pool contract (R-1470..R-1475, R-1477) from OUTSIDE it.
- **inputs** — scripts/test.mjs and every packages/nana-pack/lib/*.mjs module its own import lines name (copied verbatim into each throwaway root, so the real bytes run, read from its source), the fixture test files this file writes, and env PROBE_OUT it hands each child
- **outputs** — one PASS / FAIL line per check and a non-zero exit when any check failed
- **effects** — process (runs the copied runner as a child per case; two cases leave a running process tree the runner must kill on signal, reaped here if it does not), disk (one mkdtemp tree holding every fixture root, removed at exit)
- **errors** — a FAIL line naming the broken runner behaviour; a non-zero exit code
- **callers** — —
- **callees** — `packages/nana-pack/lib/test-runner-config.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/test-runner.test.mjs`

- **purpose** — Pin the repo test runner's own contract (R-600..R-618) from OUTSIDE it — the runner is what every other test's verdict depends on, and until now nothing tested it.
- **inputs** — scripts/test.mjs (copied verbatim into each throwaway root, so the real bytes run), the fixture test files this file writes, and env OUTER_HOME / PROBE_OUT / TMPDIR it hands the child
- **outputs** — one PASS / FAIL line per check and a non-zero exit when any check failed
- **effects** — process (runs the copied runner as a child per case; one case leaves a detached grandchild, reaped here), disk (one mkdtemp tree holding every fixture root, removed at exit)
- **errors** — a FAIL line naming the broken runner behaviour; a non-zero exit code
- **callers** — —
- **callees** — `packages/nana-pack/lib/runtime-map-config.mjs`, `packages/nana-pack/lib/test-runner-config.mjs`, `packages/nana-pack/lib/windows-skips-config.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/tmp-dir.mjs`

- **purpose** — Create test temporary roots, removing them when the test process exits unless the caller opts out to clean the root up itself (one holding a symlink or junction that no generic recursive delete may ever meet).
- **inputs** — A mkdtemp prefix.
- **outputs** — The created temporary directory path.
- **effects** — disk (creates and removes temporary directories), process (registers exit cleanup)
- **errors** — Propagates directory creation errors and ignores cleanup errors.
- **callers** — `packages/nana-pack/tests/adoption-producer.test.mjs`, `packages/nana-pack/tests/adoption-reader.test.mjs`, `packages/nana-pack/tests/agent-dir-config.test.mjs`, `packages/nana-pack/tests/agent-dir-hostile.test.mjs`, `packages/nana-pack/tests/agent-dir-parity.test.mjs`, `packages/nana-pack/tests/agent-dir-var-spellings.test.mjs`, `packages/nana-pack/tests/blast-radius.test.mjs`, `packages/nana-pack/tests/bounded-read.test.mjs`, `packages/nana-pack/tests/code-map.test.mjs`, `packages/nana-pack/tests/config-display-text.test.mjs`, `packages/nana-pack/tests/config-gate-fallback.test.mjs`, `packages/nana-pack/tests/config-handlers-malformed.test.mjs`, `packages/nana-pack/tests/config-normalize.test.mjs`, `packages/nana-pack/tests/config-project-gate-fallback.test.mjs`, `packages/nana-pack/tests/config-trust.test.mjs`, `packages/nana-pack/tests/display-surfaces.test.mjs`, `packages/nana-pack/tests/frontier.test.mjs`, `packages/nana-pack/tests/gate-config-robustness.test.mjs`, `packages/nana-pack/tests/gate-corpus.test.mjs`, `packages/nana-pack/tests/gate-policy-paths.test.mjs`, `packages/nana-pack/tests/gate-rm-inside.test.mjs`, `packages/nana-pack/tests/gate-rm-outside.test.mjs`, `packages/nana-pack/tests/gate-self-protection.test.mjs`, `packages/nana-pack/tests/gate-status.test.mjs`, `packages/nana-pack/tests/gate-survives-mutation.test.mjs`, `packages/nana-pack/tests/handoff-artifact.test.mjs`, `packages/nana-pack/tests/handoff-staleness.test.mjs`, `packages/nana-pack/tests/handoff-store.test.mjs`, `packages/nana-pack/tests/handoff-symlink.test.mjs`, `packages/nana-pack/tests/handoff-trust.test.mjs`, `packages/nana-pack/tests/handoff-writer-role.test.mjs`, `packages/nana-pack/tests/immutable-review.test.mjs`, `packages/nana-pack/tests/land.test.mjs`, `packages/nana-pack/tests/lane-write-guard.test.mjs`, `packages/nana-pack/tests/lifecycle-journal.test.mjs`, `packages/nana-pack/tests/lifecycle-reload.test.mjs`, `packages/nana-pack/tests/line-endings.test.mjs`, `packages/nana-pack/tests/linked-launch.test.mjs`, `packages/nana-pack/tests/mutation-runner-takeover.test.mjs`, `packages/nana-pack/tests/mutation-runner.test.mjs`, `packages/nana-pack/tests/nana-roster-set.test.mjs`, `packages/nana-pack/tests/nana-roster.test.mjs`, `packages/nana-pack/tests/notify-dispatch.test.mjs`, `packages/nana-pack/tests/notify-fallback.test.mjs`, `packages/nana-pack/tests/objective-golden.test.mjs`, `packages/nana-pack/tests/objective-injection.test.mjs`, `packages/nana-pack/tests/pack-config-utf16.test.mjs`, `packages/nana-pack/tests/path-spelling.test.mjs`, `packages/nana-pack/tests/pi-install.test.mjs`, `packages/nana-pack/tests/pipe-guard.test.mjs`, `packages/nana-pack/tests/post-edit-default-timeout.test.mjs`, `packages/nana-pack/tests/post-edit-file-queue.test.mjs`, `packages/nana-pack/tests/post-edit-hardening.test.mjs`, `packages/nana-pack/tests/post-edit-status.test.mjs`, `packages/nana-pack/tests/post-edit-utf8.test.mjs`, `packages/nana-pack/tests/post-edit-values-named.test.mjs`, `packages/nana-pack/tests/product-report.test.mjs`, `packages/nana-pack/tests/pwsh-oracle.mjs`, `packages/nana-pack/tests/readme-check.test.mjs`, `packages/nana-pack/tests/real-path.test.mjs`, `packages/nana-pack/tests/release-status.test.mjs`, `packages/nana-pack/tests/requirements-cap-kinds.test.mjs`, `packages/nana-pack/tests/requirements-lift.test.mjs`, `packages/nana-pack/tests/requirements-moved.test.mjs`, `packages/nana-pack/tests/requirements-regroup.test.mjs`, `packages/nana-pack/tests/requirements-trace.test.mjs`, `packages/nana-pack/tests/requirements-tree.test.mjs`, `packages/nana-pack/tests/requirements-unclaimed.test.mjs`, `packages/nana-pack/tests/review-launch.test.mjs`, `packages/nana-pack/tests/review-ledger.test.mjs`, `packages/nana-pack/tests/review-standard.test.mjs`, `packages/nana-pack/tests/review-test-waits.test.mjs`, `packages/nana-pack/tests/review-timeline.test.mjs`, `packages/nana-pack/tests/roster-notice.test.mjs`, `packages/nana-pack/tests/rulings.test.mjs`, `packages/nana-pack/tests/runtime-map.test.mjs`, `packages/nana-pack/tests/skill-claims.test.mjs`, `packages/nana-pack/tests/template-acceptance.test.mjs`, `packages/nana-pack/tests/template-release.test.mjs`, `packages/nana-pack/tests/templates-render.test.mjs`, `packages/nana-pack/tests/templates-update.test.mjs`, `packages/nana-pack/tests/test-locked.test.mjs`, `packages/nana-pack/tests/test-runner-parallel.test.mjs`, `packages/nana-pack/tests/test-runner.test.mjs`, `packages/nana-pack/tests/ts-syntax-check.test.mjs`, `packages/nana-pack/tests/watchdog-cpu.test.mjs`, `packages/nana-pack/tests/watchdog-exit.test.mjs`, `packages/nana-pack/tests/win32-launch.test.mjs`, `packages/nana-pack/tests/worker-lane.test.mjs`, `packages/nana-pack/tests/writing-check.test.mjs`, `packages/nana-pack/tests/writing-injection.test.mjs`, `packages/nana-pack/tests/writing-trial-extractor.test.mjs`
- **callees** — —

### `packages/nana-pack/tests/ts-syntax-check.test.mjs`

- **purpose** — Pins the TypeScript syntax checker's compilation, diagnostics, and non-evaluation contract.
- **inputs** — The repository checker and temporary TypeScript fixtures.
- **outputs** — Named PASS/FAIL checks and a nonzero exit when an assertion fails.
- **effects** — disk (temporary fixtures); process (runs the checker in child processes).
- **errors** — Failed assertions are reported and cause exit 1.
- **callers** — —
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/watchdog-cpu.test.mjs`

- **purpose** — Pin culture-independent watchdog CPU reads, strict sample parsing, unreadable-sample stalls, and exit-during-read handling.
- **inputs** — pi-worker.mjs, pi-watchdog.mjs, worker-config.mjs, fake pi and CPU-reader executables, and temporary marker files.
- **outputs** — PASS/FAIL/SKIP lines for R-1890 through R-1893 and a nonzero status when a check fails.
- **effects** — disk (temporary fixtures and output files), process (pi-worker, fake pi, ps or PowerShell readers).
- **errors** — failed assertions or fixture time limits print FAIL and make the test exit nonzero.
- **callers** — —
- **callees** — `packages/nana-pack/tests/fake-pi.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/watchdog-exit.test.mjs`

- **purpose** — Pins that the watchdog ends an attempt the moment pi exits, by any code or by a signal the watchdog did not send, rather than at the next poll tick or on a close listener that may have already fired.
- **inputs** — bin/pi-review.mjs, bin/pi-worker.mjs, bin/pi-watchdog.mjs, a fake pi process, and temporary git repositories, worktrees and HOMEs under the OS temp directory
- **outputs** — PASS/FAIL lines per check on stdout, and a non-zero exit when any check fails
- **effects** — disk (temp HOME/agent dirs, git repositories, worktrees, capture files), process (spawns the launcher CLIs and the fake pi process, some of which self-terminate by signal)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/tests/fake-pi.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/win-command.test.mjs`

- **purpose** — Pins Windows command discovery, quoting, refusal and missing-command rules on every platform.
- **inputs** — pure helper/config modules and injected Windows paths.
- **outputs** — named PASS/FAIL checks and a nonzero exit on any mismatch.
- **effects** — process (Windows-only cmd.exe and where probes).
- **errors** — assertion mismatches set the process exit code.
- **callers** — —
- **callees** — `packages/nana-pack/lib/win-command-config.mjs`, `packages/nana-pack/lib/win-command.mjs`

### `packages/nana-pack/tests/win32-launch.test.mjs`

- **purpose** — Pin pi-watchdog's Node-entry Windows launcher: forced win32 against injected fake volumes on every leg, and a real npm-installed fake pi package on the Windows leg.
- **inputs** — pi-watchdog.mjs's piLaunch, injected win32 path/env/exists/isFile/readText fixtures, worker-config.mjs's PI_PACKAGE/PI_BIN_NAME, and, on win32, a real npm pack+install of a fake pi package plus pi-worker.mjs/pi-review.mjs/review-ledger.mjs child runs
- **outputs** — named PASS/FAIL/SKIP lines
- **effects** — disk (temp fixtures; on win32 a real npm global install under a temp prefix), process (on win32, npm pack/install and pi-worker/pi-review/review-ledger child processes)
- **errors** — a missing piLaunch export fails every forced title, not the whole file; failed assertions exit nonzero
- **callers** — —
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/windows-skip-lines.test.mjs`

- **purpose** — Pins that each check one of eight test files runs only off Windows prints its own SKIP line, naming the check and a reason, on the branch those files take on Windows.
- **inputs** — the eight test files must-meet.md's Design section names (docs/reviews/win-silent-skips-2026-10-19/must-meet.md), read as text from this checkout
- **outputs** — PASS/FAIL lines per file on stdout, and exit 1 when any file fails
- **effects** — none
- **errors** — a failing check prints the unmatched titles, or "no guarded check" with a hint to retire the row; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — —

### `packages/nana-pack/tests/worker-lane.test.mjs`

- **purpose** — Pins fail-closed lane verification, preamble delivery, and the sealed worker ceiling.
- **inputs** — pi-worker, a temporary git repository/worktree, and a stub pi executable
- **outputs** — named PASS/FAIL checks
- **effects** — disk (OS temp fixtures), process (git and worker subprocesses)
- **errors** — failed assertions exit nonzero
- **callers** — —
- **callees** — `packages/nana-pack/bin/worker-config.mjs`, `packages/nana-pack/tests/fake-pi.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/writing-check.test.mjs`

- **purpose** — Pins the writing checker, its Markdown-aware findings and summary, every sealed writing value, the always-zero CLI exit, and this repository's live HANDOFF sections against length and banned-word findings
- **inputs** — the writing checker CLI and pure functions, writing and frontier config values, this repository's HANDOFF.md, and disposable text fixtures
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (reads HANDOFF.md and writes a throwaway temp dir for multi-file cases), process (spawns the CLI)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/lib/frontier-config.mjs`, `packages/nana-pack/lib/writing-check.mjs`, `packages/nana-pack/lib/writing-config.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/writing-injection.test.mjs`

- **purpose** — Pins that the writing rule reaches every enabled session's system prompt, follows only the active user config's writing.enabled key on every session start, composes with nana-objective on the installed pi 1.0.2, cuts oversized blocks without splitting a surrogate pair, refuses unusable rule files, and bounds every rule read without touching the shipped rule file
- **inputs** — extensions/nana-writing.ts (with an injected, disposable rulePath — never the shipped file), extensions/nana-objective.ts, user and trusted-project nana-pack.json fixtures, a temp HOME, and bounded Node subprocesses
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, agent dirs, journal and disposable rule/config fixtures only — the shipped rule file is read at most, never written), process (sets HOME/USERPROFILE/PI_CODING_AGENT_DIR, clears the worker handoff override; spawns bounded Node subprocesses for config, FIFO and oversized-file fixtures; dynamically imports the installed pi package when present)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/extensions/nana-objective.ts`, `packages/nana-pack/lib/objective.ts`, `packages/nana-pack/lib/writing-config.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/writing-trial-extractor.test.mjs`

- **purpose** — Pins the writing-trial extractor's scope, units, rule treatment, scoring, and private manifest.
- **inputs** — Synthetic transcript directories and extractor pure functions.
- **outputs** — PASS/FAIL checks for each extractor contract.
- **effects** — disk (temporary transcript fixtures only)
- **errors** — Failed checks are counted and make the test process exit nonzero.
- **callers** — —
- **callees** — `packages/nana-pack/lib/writing-trial-extractor.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-setup/bin/install-check.mjs`

- **purpose** — Runs the isolated install-and-hooks rehearsal.
- **inputs** — Checkout and operating-system process launcher.
- **outputs** — One verdict line per measured item.
- **effects** — disk, process, network
- **errors** — Exits nonzero when any reported item is FAIL.
- **callers** — —
- **callees** — `packages/nana-setup/lib/install-check.mjs`

### `packages/nana-setup/bin/nana-setup.mjs`

- **purpose** — The nana-setup CLI parses argv, resolves one layout, runs its command and prints results.
- **inputs** — argv (`install` | `uninstall` | `doctor` | `project [dir]` | `state` | `trust <dir>`, trust store, plus --home, --claude-home, --pi-home, --paths, --desk, --name, --check, --not-a-project, --dry-run, --yes, -h/--help); process.cwd() for a defaulted project dir; whatever resolveLayout reads (HOME, CLAUDE_CONFIG_DIR, PI_CODING_AGENT_DIR, NANA_SETUP_PLATFORM); the step and check reports returned by lib/steps, lib/doctor, lib/project.
- **outputs** — stdout: the install root / claude home / pi home banner, a "<mark> <label> <status> <detail>" line per result (+ created|updated, · unchanged, – skipped, ✗ problem; ✓/✗/!/· for doctor), a closing summary and the "next:" hint; doctor and project --check use their command's dry run to say which missing rows it repairs, list every other label by hand, or combine those remedies; doctor's summary also names install's refusal or a failed repair prediction; stderr: the usage text and error messages; the stderr of doctor and project --check carries no muted warning; process.exitCode.
- **effects** — disk (through install / setupProject / dismissProject; doctor and project --check dry runs write nothing), process (the child processes those steps spawn; doctor's dry run may start `pi --version`; replaces the warning listeners for doctor and project --check; sets process.exitCode)
- **errors** — exit 2 for an unknown option or command, no command, a usage SetupError (including a relative ambient PI_CODING_AGENT_DIR or CLAUDE_CONFIG_DIR, a .nana-not-a-project marker, a missing parent directory, a pi trust store that cannot be loaded from npm's global folder); uninstall operational failures print ✗ and exit 1; exit 1 when any row is ✗ or, for doctor, any ✗/! row, and for an unexpected throw outside doctor's install dry-run prediction (stack on stderr); exit 0 otherwise
- **callers** — —
- **callees** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/npm-root.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/project.mjs`, `packages/nana-setup/lib/state-manifest.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/lib/trust-decision.mjs`, `packages/nana-setup/lib/uninstall.mjs`

### `packages/nana-setup/bin/stale-copies.mjs`

- **purpose** — Report unhealthy Claude Code hook links, rules, skills and hook settings for a home with a nana-setup adoption-hook install record.
- **inputs** — the default active-home layout, its Claude settings, shared hook-health rows, managed rule and skill lists, filesystem state and NANA_SETUP_PLATFORM.
- **outputs** — one stale-copy notice on stdout, including blocked skill paths to move, or no output when no install is recorded or every applicable item is current.
- **effects** — disk (reads installed and source files; runs install's skill step in dry-run mode), process (writes stdout).
- **errors** — unexpected failures reach the launcher, which emits the unavailable marker.
- **callers** — —
- **callees** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/hook-health.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/stale-copies.mjs`, `packages/nana-setup/lib/steps.mjs`

### `packages/nana-setup/claude/hooks/nana-adoption.mjs`

- **purpose** — Launch the canonical nana adoption and stale-copy producers for the active Claude project.
- **inputs** — Claude Code project environment and this entry's repository location.
- **outputs** — adoption and stale-copy output, or each producer's fail-open marker.
- **effects** — process (runs the adoption and stale-copy CLIs).
- **errors** — producer failures become unavailable markers; a stdout error, such as a reader that closed it, is ignored and the hook exits 0.
- **callers** — —
- **callees** — `packages/nana-setup/lib/hook-producer.mjs`

### `packages/nana-setup/claude/hooks/nana-objective.mjs`

- **purpose** — Launch the canonical nana objective producer for the active Claude project.
- **inputs** — Claude Code project environment and this entry's repository location.
- **outputs** — objective producer output or its fail-open marker.
- **effects** — process (runs the objective CLI).
- **errors** — producer failures become an unavailable marker; a stdout error, such as a reader that closed it, is ignored and the hook exits 0.
- **callers** — —
- **callees** — `packages/nana-setup/lib/hook-producer.mjs`

### `packages/nana-setup/claude/hooks/nana-roster-notice.mjs`

- **purpose** — Print the roster notice as SessionStart context and, on a session-start-like source or a source the hook could not read, also as the Claude Code user message.
- **inputs** — Claude Code SessionStart hook JSON stdin (optional), pi's active agent dir and the user-scope nana-pack.json there
- **outputs** — one JSON object on stdout: {systemMessage?, hookSpecificOutput: {hookEventName: "SessionStart", additionalContext}}; on a module load failure, or a throw other than while reading input, the unavailable notice in both fields with no path
- **effects** — disk (reads the user-scope nana-pack.json), process (reads stdin)
- **errors** — never throws; a load or other failure becomes the unavailable notice, and the hook always exits 0
- **callers** — `packages/nana-setup/tests/roster-notice-hook.test.mjs`
- **callees** — `packages/nana-pack/bin/nana-roster.mjs`, `packages/nana-pack/lib/agent-dir.mjs`, `packages/nana-pack/lib/roster-notice-config.mjs`, `packages/nana-pack/lib/roster-notice.mjs`, `packages/nana-setup/lib/shared-memory-input.mjs`

### `packages/nana-setup/claude/hooks/nana-shared-memory.mjs`

- **purpose** — Print the shared-memory index and self-heal the current Claude project memory link.
- **inputs** — Claude Code environment, bounded hook JSON stdin, and the shared MEMORY.md file.
- **outputs** — a bounded shared-memory header, optional note, index entries, and a fold line when entries are shortened or omitted.
- **effects** — disk, process (reads stdin, creates directories and a link, writes stdout).
- **errors** — all failures, including a stdout error such as a reader that closed it, are ignored and the hook exits 0.
- **callers** — —
- **callees** — `packages/nana-setup/lib/claude-config-home.mjs`, `packages/nana-setup/lib/project-key.mjs`, `packages/nana-setup/lib/shared-memory-config.mjs`, `packages/nana-setup/lib/shared-memory-input.mjs`

### `packages/nana-setup/claude/hooks/verifier-pipe.mjs`

- **purpose** — Run the verifier-pipe decision for one Claude Code Bash or PowerShell PreToolUse event.
- **inputs** — Claude Code PreToolUse JSON on stdin.
- **outputs** — a hit decision on stdout; errors produce a stderr diagnostic.
- **effects** — process (reads stdin and writes stdout/stderr).
- **errors** — malformed input and internal errors abstain with a stderr diagnostic; a stdout or stderr error, such as a reader that closed it, is ignored and the hook exits 0.
- **callers** — —
- **callees** — `packages/nana-setup/lib/verifier-hook.mjs`

### `packages/nana-setup/lib/bounded-spawn-child.mjs`

- **purpose** — Relay one bounded child launch and end its process tree at the deadline, on termination or when its parent dies.
- **inputs** — one JSON launch specification on stdin; TASKKILL_ARGS; relay parent-poll, settle and signal-grace limits; process.env and process.platform
- **outputs** — one JSON result line on stdout
- **effects** — process (spawns a detached POSIX group or Windows child, kills its tree when required, then exits)
- **errors** — launch and timeout failures are serialized as result.error; malformed specifications become coded relay errors
- **callers** — —
- **callees** — `packages/nana-pack/lib/mutation-runner-config.mjs`, `packages/nana-setup/lib/bounded-spawn.mjs`

### `packages/nana-setup/lib/bounded-spawn.mjs`

- **purpose** — Run a synchronous child launch through an independent POSIX relay that bounds output and ends the launched process tree at its deadline or when its parent dies.
- **inputs** — command, args and spawn options; bounded-spawn-child.mjs; process.env, process.pid and process.platform
- **outputs** — boundedSpawnSync result shaped like child_process.spawnSync; relay parent-poll, result-size, settle, signal-grace and backstop limits
- **effects** — process (synchronously starts the relay, detached on POSIX, and sends its launch specification on stdin)
- **errors** — launch, relay and timeout failures are returned in result.error with a code and never thrown
- **callers** — `packages/nana-setup/lib/bounded-spawn-child.mjs`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/pi-launch-limits.test.mjs`
- **callees** — —

### `packages/nana-setup/lib/claude-config-home.mjs`

- **purpose** — Select Claude Code's configured home with the same empty-value fallback in setup and its shared-memory hook.
- **inputs** — A home directory and env CLAUDE_CONFIG_DIR.
- **outputs** — CLAUDE_CONFIG_ENV and the configured value as given, or <home>/.claude when it is empty or unset.
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-setup/claude/hooks/nana-shared-memory.mjs`, `packages/nana-setup/lib/paths.mjs`
- **callees** — —

### `packages/nana-setup/lib/copy-record.mjs`

- **purpose** — Track the last bytes Windows install wrote to each managed copy so unchanged copies refresh without backups.
- **inputs** — An absolute record path; its regular-file JSON object; managed target paths and source bytes; { dryRun }.
- **outputs** — openCopyRecord(file) returning { unedited(target), remember(target, bytes), save(o) }; save rows labelled copy record.
- **effects** — disk (reads regular targets and the record; save writes the record through writeIfChanged).
- **errors** — Record read, parse and shape failures become an empty record; save catches every error and returns one SKIPPED row.
- **callers** — `packages/nana-setup/lib/steps.mjs`
- **callees** — `packages/nana-setup/lib/fsops.mjs`

### `packages/nana-setup/lib/doctor.mjs`

- **purpose** — Judge one machine and return an ordered check list covering its setup surfaces and memory links.
- **inputs** — a layout from resolveLayout; opts.projectDir (default process.cwd()), opts.releaseRepo and opts.runGit; NANA_SETUP_PLATFORM and PATH; `pi --version`; on disk — <claudeHome>/hooks, rules (incl. nana-personal.md and nana-rulings.md), skills, settings.json, the settings lock, nana-memory/shared/MEMORY.md, projects/<key>/memory, <piHome>/settings.json and nana-pack.json and the objective file it names, <piHome>/nana-rulings.md, cwd/.pi/nana-pack.json and pi's trust store, <piHome>/extensions/subagent/config.json, <piHome>/agents/reviewer.md, <piHome>/npm/node_modules/pi-subagents/package.json, pi's npm package.json, <piHome>/mcp.json, <knowledgeHome>/index.db, and the PATH_COMMANDS entries under <binDir>, including nana-writing; the LaunchAgents plist; `node -p process.versions.node` and `launchctl print`
- **outputs** — an array of { status, label, detail, installLabel? } rows, including a safe place and error-kind repair for invalid nana-pack JSON, a FAIL `pi objective.path` row (naming the value and the default file) only when that value is present and neither a string nor null, and a win32-only note row naming the Claude Code hooks' CLAUDE_CODE_EXEC_FLOOR; knowledgeIndexState(), memoryLinkState(); STATUS (ok | fail | note | warn); NODE_FLOOR ("22.18"); DESK_NODE_FLOOR ("22.19"); PI_SUBAGENTS_FLOOR ("0.75.0"); parsePlistValues(); nodeMeetsFloor(); versionAtLeast(); skillLinkState() { ok, detail }; projectFileState() { status, kind, detail }; packageSourceState(); firstOnPath(); winShimState()
- **effects** — disk (reads only), process (spawns node, a bounded pi --version process tree and launchctl to probe)
- **errors** — none thrown — a missing, unparseable or wrong-kind piece becomes a fail row, a cwd-relative PI_CODING_AGENT_DIR a warn row, and a posix-only piece on win32 a note row
- **callers** — `packages/nana-setup/bin/nana-setup.mjs`, `packages/nana-setup/bin/stale-copies.mjs`, `packages/nana-setup/lib/install-check.mjs`, `packages/nana-setup/tests/desk-service.test.mjs`, `packages/nana-setup/tests/doctor-detail.test.mjs`, `packages/nana-setup/tests/doctor-fix-line.test.mjs`, `packages/nana-setup/tests/doctor-knowledge.test.mjs`, `packages/nana-setup/tests/doctor-memory-links.test.mjs`, `packages/nana-setup/tests/doctor-package-source.test.mjs`, `packages/nana-setup/tests/doctor-release.test.mjs`, `packages/nana-setup/tests/doctor-runtime.test.mjs`, `packages/nana-setup/tests/doctor-trust.test.mjs`, `packages/nana-setup/tests/fresh-machine.test.mjs`, `packages/nana-setup/tests/install-check.test.mjs`, `packages/nana-setup/tests/install.test.mjs`, `packages/nana-setup/tests/linked-claude-folder.test.mjs`, `packages/nana-setup/tests/objective-path-shapes.test.mjs`, `packages/nana-setup/tests/pi-launch-limits.test.mjs`, `packages/nana-setup/tests/relative-agent-dir.test.mjs`, `packages/nana-setup/tests/rulings-install.test.mjs`, `packages/nana-setup/tests/settings-lock.test.mjs`, `packages/nana-setup/tests/skills-and-standards.test.mjs`, `packages/nana-setup/tests/stale-copies.test.mjs`, `packages/nana-setup/tests/verifier-pipe.test.mjs`, `packages/nana-setup/tests/win32-degrade.test.mjs`, `packages/nana-setup/tests/win32-hook-repair.test.mjs`
- **callees** — `packages/nana-pack/lib/display.mjs`, `packages/nana-pack/lib/json-text.mjs`, `packages/nana-pack/lib/real-path.mjs`, `packages/nana-pack/lib/release-status.mjs`, `packages/nana-pack/lib/rulings-config.mjs`, `packages/nana-pack/lib/win-command.mjs`, `packages/nana-setup/lib/bounded-spawn.mjs`, `packages/nana-setup/lib/hook-health.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/pi-invocation.mjs`, `packages/nana-setup/lib/project-key.mjs`, `packages/nana-setup/lib/settings-lock.mjs`, `packages/nana-setup/lib/settings.mjs`, `packages/nana-setup/lib/stale-copies.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/lib/win-shims.mjs`

### `packages/nana-setup/lib/fsops.mjs`

- **purpose** — The installer's non-destructive file primitives, each reporting the status of what it did instead of acting silently.
- **inputs** — target and source paths, file contents, { dryRun, copyInstead, unedited }, a Date for the backup stamp; the filesystem — linkFile and seedFile decide presence with lstat, never existsSync, so a dangling symlink reads as present and is left untouched (ensureDir and backupPath are the exceptions and use existsSync)
- **outputs** — { status, detail } with status one of CREATED | UPDATED | UNCHANGED | SKIPPED | PROBLEM; on disk: symlinks (linkFile), byte copies on a platform without symlinks, files written only when absent (seedFile), directories (ensureDir), content-compared writes (writeIfChanged), managed-copy refreshes, and <name>.bak-<YYYYMMDD> backups of anything replaced; writeBytesWithBackup() for byte renderings
- **effects** — disk (symlink, unlink, mkdir -p, temporary-file write, atomic rename, rename-to-backup; nothing under dryRun)
- **errors** — none typed — managed-copy refresh failures return PROBLEM; other unreadable sources or undeletable targets propagate the raw fs error; a symlink or directory in the way is returned as SKIPPED and never written through
- **callers** — `packages/nana-setup/lib/copy-record.mjs`, `packages/nana-setup/lib/project.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/desk-service.test.mjs`, `packages/nana-setup/tests/fsops.test.mjs`
- **callees** — —

### `packages/nana-setup/lib/hook-health.mjs`

- **purpose** — Judge Claude Code hook links and settings once for doctor and the session-start stale-copy producer.
- **inputs** — a nana-setup layout, parsed Claude settings or its read error, the active platform, checkout hook sources, and an optional checkout-root override for tests.
- **outputs** — hookLinkRows() and hookSettingsRows(), ordered labelled rows with health and actionable detail fields.
- **effects** — disk (reads links, hook targets and knowledge-hook targets).
- **errors** — filesystem or merge-simulation failures become unhealthy rows; a settings read error makes every settings row unhealthy.
- **callers** — `packages/nana-setup/bin/stale-copies.mjs`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/tests/win32-hook-repair.test.mjs`
- **callees** — `packages/nana-pack/lib/real-path.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/settings.mjs`, `packages/nana-setup/lib/stale-copies.mjs`, `packages/nana-setup/lib/steps.mjs`

### `packages/nana-setup/lib/hook-producer.mjs`

- **purpose** — Run a nana hook producer and emit its output or the stable fail-open marker.
- **inputs** — CLI path, marker text, cwd, environment and injectable process runner.
- **outputs** — producer stdout or the supplied marker on stdout.
- **effects** — process (spawns a child process and writes stdout).
- **errors** — spawn failures, signals, nonzero exits and a run past the time limit are represented by the marker; never thrown.
- **callers** — `packages/nana-setup/claude/hooks/nana-adoption.mjs`, `packages/nana-setup/claude/hooks/nana-objective.mjs`, `packages/nana-setup/tests/hook-deadlines.test.mjs`, `packages/nana-setup/tests/hook-producers.test.mjs`, `packages/nana-setup/tests/stale-copies.test.mjs`
- **callees** — `packages/nana-setup/lib/stale-copies-config.mjs`

### `packages/nana-setup/lib/install-check-config.mjs`

- **purpose** — Defines the independent sealed contract and tunables for the install check.
- **inputs** — None.
- **outputs** — Hook, environment, retry, known-red, doctor-note and filesystem-path contracts.
- **effects** — none
- **errors** — None.
- **callers** — `packages/nana-setup/lib/install-check-review.mjs`, `packages/nana-setup/lib/install-check-turn.mjs`, `packages/nana-setup/lib/install-check.mjs`, `packages/nana-setup/lib/readme-rehearsal.mjs`, `packages/nana-setup/tests/install-check.test.mjs`, `packages/nana-setup/tests/readme-rehearsal.test.mjs`
- **callees** — —

### `packages/nana-setup/lib/install-check-review.mjs`

- **purpose** — Provide the install check's deterministic offline pi-review response and record its observed review prompt.
- **inputs** — Pi's extension API, faux model requests and the sealed install-check review contracts.
- **outputs** — A fixture provider response ending in the sealed verdict line and one JSON record in the temporary home.
- **effects** — disk
- **errors** — Provider or record-write errors surface through pi's extension and review diagnostics.
- **callers** — —
- **callees** — `packages/nana-setup/lib/install-check-config.mjs`

### `packages/nana-setup/lib/install-check-turn.mjs`

- **purpose** — Provide the install check's deterministic offline pi turn and record its observed prompt and tool results.
- **inputs** — Pi's extension API and active tools, faux model requests and the sealed install-check turn contracts.
- **outputs** — A fixture provider response with Bash, write and optional PowerShell calls, plus one JSON record in the temporary home.
- **effects** — disk, process
- **errors** — Provider or record-write errors surface through pi's extension and turn diagnostics.
- **callers** — —
- **callees** — `packages/nana-setup/lib/install-check-config.mjs`

### `packages/nana-setup/lib/install-check.mjs`

- **purpose** — Implements pure install-check contracts and the isolated subprocess runner.
- **inputs** — Sealed configuration, process environment, platform, clock and spawn function.
- **outputs** — Child results, item judgments, environment construction and failure diagnostics.
- **effects** — disk, process
- **errors** — Child failures become item results; invalid hook shapes are reported as failures.
- **callers** — `packages/nana-setup/bin/install-check.mjs`, `packages/nana-setup/tests/install-check.test.mjs`, `packages/nana-setup/tests/readme-rehearsal.test.mjs`, `packages/nana-setup/tests/win-shims.test.mjs`, `packages/nana-setup/tests/win32-degrade.test.mjs`
- **callees** — `packages/nana-pack/lib/win-command.mjs`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/install-check-config.mjs`, `packages/nana-setup/lib/project-key.mjs`, `packages/nana-setup/lib/readme-rehearsal.mjs`, `packages/nana-setup/lib/stale-copies-config.mjs`

### `packages/nana-setup/lib/npm-root.mjs`

- **purpose** — Resolve npm's global package root through its platform-specific command shim.
- **inputs** — an optional platform name, environment, and spawn implementation.
- **outputs** — the child-process result from npm root -g.
- **effects** — process (starts npm with fixed arguments).
- **errors** — spawn failures are returned by the child-process implementation.
- **callers** — `packages/nana-setup/bin/nana-setup.mjs`, `packages/nana-setup/tests/project.test.mjs`, `packages/nana-setup/tests/restore.test.mjs`, `packages/nana-setup/tests/trust.test.mjs`
- **callees** — —

### `packages/nana-setup/lib/paths.mjs`

- **purpose** — The single resolver for every path the installer touches, so `install`, `doctor` and `project` can never disagree about where a piece lives.
- **inputs** — opts.home / opts.claudeHome / opts.piHome; os.homedir(); Claude-home resolver (CLAUDE_CONFIG_DIR, else ~/.claude); nana-pack's agent-dir resolver (PI_CODING_AGENT_DIR, else ~/.pi/agent) and its cwd-relative probe; nana-pack's RULINGS_FILE; process.cwd(); NANA_SETUP_PLATFORM; import.meta.url (for pkgRoot / repoRoot)
- **outputs** — pkgRoot, repoRoot, DESK_LABEL ("com.nana.pi-desk"); a layout object of absolute paths — base, claudeHome + claudeHomeSource + claudeHomeCwdRelative, hooksDir, rulesDir, skillsDir, projectsDir, sharedMemoryDir, claudeSettings, copyRecord, piHome + piHomeSource + piHomeCwdRelative, piSettings, piPackConfig, piObjective, piRulings, knowledgeHome (always under the layout BASE unless --pi-home/--home named it), subagentConfig, reviewerAgent, piSubagentsPackage, mcpConfig, deskLog, binDir, launchAgentsDir, plistPath, isRealHome; platform(); tildeify()
- **effects** — disk (one realPath read at import to canonicalize pkgRoot; all other work is path arithmetic and env/homedir reads)
- **errors** — none — it never throws; an unreadable cwd degrades to a descriptive placeholder string
- **callers** — `packages/nana-pack/lib/roster-notice.mjs`, `packages/nana-pack/tests/agent-dir-parity.test.mjs`, `packages/nana-pack/tests/roster-notice.test.mjs`, `packages/nana-setup/bin/nana-setup.mjs`, `packages/nana-setup/bin/stale-copies.mjs`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/hook-health.mjs`, `packages/nana-setup/lib/project.mjs`, `packages/nana-setup/lib/readme-rehearsal.mjs`, `packages/nana-setup/lib/stale-copies.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/lib/uninstall.mjs`, `packages/nana-setup/tests/doctor-detail.test.mjs`, `packages/nana-setup/tests/doctor-knowledge.test.mjs`, `packages/nana-setup/tests/doctor-memory-links.test.mjs`, `packages/nana-setup/tests/doctor-package-source.test.mjs`, `packages/nana-setup/tests/doctor-release.test.mjs`, `packages/nana-setup/tests/doctor-runtime.test.mjs`, `packages/nana-setup/tests/doctor-trust.test.mjs`, `packages/nana-setup/tests/fresh-machine.test.mjs`, `packages/nana-setup/tests/hooks-win32-exec.test.mjs`, `packages/nana-setup/tests/install-overlap.test.mjs`, `packages/nana-setup/tests/install.test.mjs`, `packages/nana-setup/tests/linked-claude-folder.test.mjs`, `packages/nana-setup/tests/objective-path-shapes.test.mjs`, `packages/nana-setup/tests/paths.test.mjs`, `packages/nana-setup/tests/pi-launch-limits.test.mjs`, `packages/nana-setup/tests/pi-registration.test.mjs`, `packages/nana-setup/tests/readme-rehearsal.test.mjs`, `packages/nana-setup/tests/restore.test.mjs`, `packages/nana-setup/tests/retired-artifacts.test.mjs`, `packages/nana-setup/tests/settings-merge.test.mjs`, `packages/nana-setup/tests/stale-copies.test.mjs`, `packages/nana-setup/tests/state-manifest.test.mjs`, `packages/nana-setup/tests/uninstall.test.mjs`, `packages/nana-setup/tests/verifier-pipe.test.mjs`, `packages/nana-setup/tests/win32-hook-repair.test.mjs`
- **callees** — `packages/nana-pack/lib/agent-dir.mjs`, `packages/nana-pack/lib/objective-path.mjs`, `packages/nana-pack/lib/real-path.mjs`, `packages/nana-pack/lib/rulings-config.mjs`, `packages/nana-setup/lib/claude-config-home.mjs`

### `packages/nana-setup/lib/pi-invocation.mjs`

- **purpose** — Choose the direct npm Node-entry or legacy command invocation for one setup pi launch.
- **inputs** — a located pi command and arguments; win32, environment, working directory, and injected path readers; pi's npm package.json
- **outputs** — { command, args, options } or { refused }
- **effects** — disk (on win32, reads pi's npm package manifest and stats its bin entry)
- **errors** — never throws for launch resolution; a refused direct launch falls back to winCommand's result
- **callers** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/steps.mjs`
- **callees** — `packages/nana-pack/bin/pi-watchdog.mjs`, `packages/nana-pack/lib/win-command.mjs`

### `packages/nana-setup/lib/pi-pin.mjs`

- **purpose** — Read the root CI pi version and cutoff and format a safe install hint.
- **inputs** — Checkout root and workflow text.
- **outputs** — CI_WORKFLOW, parsePiPin, readPiPin and pinPiInstall.
- **effects** — disk (readPiPin only)
- **errors** — Missing or malformed workflow data returns null; file read errors return null.
- **callers** — `apps/bench/lib/pi-exports.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/pi-install-pin.test.mjs`
- **callees** — —

### `packages/nana-setup/lib/project-key.mjs`

- **purpose** — Reproduce Claude Code's ~/.claude/projects/<key> directory name for a project path and report whether that project's memory dir carries the `shared` symlink.
- **inputs** — a project's absolute path; the layout's projectsDir and sharedMemoryDir; the filesystem (lstat + readlink of <projectsDir>/<key>/memory/shared); sharedLinkState's 4th arg optionally injects readlinkSync (a test seam — production callers never pass it)
- **outputs** — KEY_MAX (200); slug() and pathHash() strings; projectKey() (the slug, or 200 chars plus "-<base36 32-bit hash>"); projectMemoryDir() path; sharedLinkState() — "absent" | "not-a-symlink" | "linked" | "elsewhere"
- **effects** — disk (lstat and readlink only, read-only)
- **errors** — none — a missing or unreadable link reads as "absent"
- **callers** — `packages/nana-setup/claude/hooks/nana-shared-memory.mjs`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/install-check.mjs`, `packages/nana-setup/tests/doctor-memory-links.test.mjs`, `packages/nana-setup/tests/install-check.test.mjs`, `packages/nana-setup/tests/project-key.test.mjs`, `packages/nana-setup/tests/restore.test.mjs`, `packages/nana-setup/tests/shared-link-state.test.mjs`, `packages/nana-setup/tests/shared-memory-hook.test.mjs`, `packages/nana-setup/tests/shared-memory-input.test.mjs`
- **callees** — —

### `packages/nana-setup/lib/project.mjs`

- **purpose** — Seed and check per-project nana files while refreshing only the explicitly marked shared instructions region.
- **inputs** — the target dir; a layout (knowledgeHome, piPackConfig); { name, date, dryRun }; the templates/_shared seeds (OBJECTIVE.md, HANDOFF.md, docs/sessions/README.md, working-under-nana-pi.md); the user-scope nana-pack.json (for postEdit.commands) and the pack trust reader; NANA_SETUP_KNOWLEDGE_CLI, NANA_SETUP_KNOWLEDGE_DEADLINE_MS, NANA_SETUP_KNOWLEDGE_KILL_GRACE_MS
- **outputs** — setupProject() reports change and by-hand rows and checkProject() asynchronously reports readiness rows; on disk — `git init`, OBJECTIVE.md, HANDOFF.md, docs/sessions/README.md, docs/sessions/<YYYY-MM>.md, an AGENTS.md stub plus a one-line CLAUDE.md import (`@AGENTS.md`, every platform), .pi/nana-pack.json ({"postEdit":{"commands":[]}}), the .nana-not-a-project marker; also exports SHARED_DIR, today(), fillSeed(), monthHeader(), agentsStub(), PACK_STARTER, CLAUDE_IMPORT, BUILD_LOCK_MARK, REFRESH_DEADLINE_MS, REFRESH_KILL_GRACE_MS, RENAME_RETRY_ATTEMPTS, RENAME_RETRY_DELAY_MS
- **effects** — disk, process (`git init` / `git rev-parse`, an async `nana-knowledge build` with a parent-side deadline — SIGTERM then SIGKILL after the grace)
- **errors** — SetupError when the folder holds .nana-not-a-project, or when --not-a-project names a path that is not a git repository root; everything else is a row — SKIPPED for an odd seed entry or folder path, a nested-repo `git init`, a failed `git init`, a missing index, a held build lock, a build failure or the refresh deadline
- **callers** — `packages/nana-setup/bin/nana-setup.mjs`, `packages/nana-setup/tests/entry-guidance.test.mjs`, `packages/nana-setup/tests/project-working-region.test.mjs`, `packages/nana-setup/tests/project.test.mjs`
- **callees** — `packages/nana-pack/lib/json-text.mjs`, `packages/nana-setup/lib/fsops.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/steps.mjs`

### `packages/nana-setup/lib/readme-rehearsal.mjs`

- **purpose** — Rehearses the root README's platform checklist as written, in a second temporary home.
- **inputs** — A platform name, the root README text, the repo root's package.json repository field, a rehearsal home, a base environment and an injected spawn function.
- **outputs** — One readme-checklist judgment: { item, code, passed, detail }.
- **effects** — disk (creates the rehearsal home's folders, reads the root README and package.json), process (spawns the checklist's own commands through the injected spawn)
- **errors** — Never throws; a step that cannot run or match is reported as a failed judgment.
- **callers** — `packages/nana-setup/lib/install-check.mjs`, `packages/nana-setup/tests/fresh-machine.test.mjs`, `packages/nana-setup/tests/readme-rehearsal.test.mjs`
- **callees** — `packages/nana-setup/lib/install-check-config.mjs`, `packages/nana-setup/lib/paths.mjs`

### `packages/nana-setup/lib/retired.mjs`

- **purpose** — Describe only legacy artifacts whose exact captured file fingerprints permit safe retirement.
- **inputs** — home path and filesystem entries inspected with lstat.
- **outputs** — a list of relative paths, expected kinds, and exact provenance predicates.
- **effects** — disk (reads artifact contents; callers perform moves).
- **errors** — unreadable, linked, or mismatched artifacts are returned as unrecognized, never followed.
- **callers** — `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/retired-artifacts.test.mjs`
- **callees** — —

### `packages/nana-setup/lib/settings-lock.mjs`

- **purpose** — Name and inspect the settings lock and render its platform-specific manual removal commands.
- **inputs** — A settings file or lock path, a platform name, the lock's JSON bytes and the current time.
- **outputs** — SETTINGS_LOCK_NAME, settingsLockPath(), lockHolder() and removalCommands().
- **effects** — disk
- **errors** — An unreadable or corrupt lock is described with an unrecorded pid and time; other helpers do not throw.
- **callers** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/install-overlap.test.mjs`, `packages/nana-setup/tests/settings-lock.test.mjs`
- **callees** — `packages/nana-setup/lib/settings.mjs`

### `packages/nana-setup/lib/settings.mjs`

- **purpose** — Migrate the exact retired context hook and merge active nana hooks while preserving foreign entries, in shell form on POSIX and exec form on win32.
- **inputs** — a parsed settings object (the caller reads and writes the file); { hooksDir, repoRoot, platform }; the command strings and args already in settings.hooks
- **outputs** — shq() single-quoted paths; tokenize() argv or null; commandInvokes() boolean; entryInvokes() boolean; desiredHooks(); hookTargets(); knowledgeHookHealthy(); mergeRepoHooks(); validateShape(); hasHook(); mergeHooks() { settings (mutated in place), added labels, changed }; removeRetiredContextHook(); removeInstallerHooks(); installerTarget(); serialize() JSON text; WIN_VERIFIER_MATCHER; CLAUDE_CODE_EXEC_FLOOR
- **effects** — disk (reads only)
- **errors** — none thrown — validateShape returns the reason the shape cannot be extended, and any command that is unparseable or carries a shell operator reads as NOT installed
- **callers** — `packages/nana-pack/tests/templates-render.test.mjs`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/hook-health.mjs`, `packages/nana-setup/lib/settings-lock.mjs`, `packages/nana-setup/lib/stale-copies.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/lib/uninstall.mjs`, `packages/nana-setup/tests/hook-deadlines.test.mjs`, `packages/nana-setup/tests/hooks-win32-exec.test.mjs`, `packages/nana-setup/tests/install.test.mjs`, `packages/nana-setup/tests/settings-merge.test.mjs`, `packages/nana-setup/tests/uninstall.test.mjs`, `packages/nana-setup/tests/verifier-pipe.test.mjs`, `packages/nana-setup/tests/win32-degrade.test.mjs`, `packages/nana-setup/tests/win32-hook-repair.test.mjs`
- **callees** — `packages/nana-pack/lib/real-path.mjs`

### `packages/nana-setup/lib/shared-memory-config.mjs`

- **purpose** — Define the sealed output controls for the shared-memory hook.
- **inputs** — none
- **outputs** — The shared-memory output budget and trim mark.
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-setup/claude/hooks/nana-shared-memory.mjs`, `packages/nana-setup/tests/shared-memory-budget.test.mjs`
- **callees** — —

### `packages/nana-setup/lib/shared-memory-input.mjs`

- **purpose** — Read the bounded JSON payload supplied to a SessionStart hook (shared memory, roster notice).
- **inputs** — an injectable readable stream with an isTTY flag.
- **outputs** — null for a TTY, otherwise at most STDIN_CAP UTF-8 input bytes.
- **effects** — none (consumes only the supplied stream).
- **errors** — stream read failures propagate to the hook's fail-open boundary.
- **callers** — `packages/nana-setup/claude/hooks/nana-roster-notice.mjs`, `packages/nana-setup/claude/hooks/nana-shared-memory.mjs`, `packages/nana-setup/tests/shared-memory-input.test.mjs`
- **callees** — —

### `packages/nana-setup/lib/stale-copies-config.mjs`

- **purpose** — Declare the stable stale-copy notice prefixes and pi prompt-section key.
- **inputs** — none.
- **outputs** — STALE_PREFIX, STALE_UNAVAILABLE_PREFIX and STALE_SECTION.
- **effects** — none
- **errors** — none.
- **callers** — `packages/nana-pack/extensions/nana-rulings.ts`, `packages/nana-setup/lib/hook-producer.mjs`, `packages/nana-setup/lib/install-check.mjs`, `packages/nana-setup/lib/stale-copies.mjs`, `packages/nana-setup/tests/install-check.test.mjs`, `packages/nana-setup/tests/linked-claude-folder.test.mjs`, `packages/nana-setup/tests/stale-copies-slow.test.mjs`, `packages/nana-setup/tests/stale-copies.test.mjs`
- **callees** — —

### `packages/nana-setup/lib/stale-copies.mjs`

- **purpose** — Compare installed files with this checkout and render one shared stale-copy notice.
- **inputs** — installed and source paths, stale doctor labels, optional blocked skill paths, the active platform and package root, and the active Claude settings entry that records nana-setup's adoption-hook install.
- **outputs** — linkOk(), hasAdoptionInstallRecord() and staleNotice(labels, movePaths).
- **effects** — disk (lstat, realpath and byte reads).
- **errors** — comparison or settings-read failures return false; notice rendering is total.
- **callers** — `packages/nana-pack/extensions/nana-rulings.ts`, `packages/nana-setup/bin/stale-copies.mjs`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/hook-health.mjs`
- **callees** — `packages/nana-pack/lib/display.mjs`, `packages/nana-pack/lib/real-path.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/settings.mjs`, `packages/nana-setup/lib/stale-copies-config.mjs`

### `packages/nana-setup/lib/state-manifest.mjs`

- **purpose** — Defines the single classified inventory of nana state and its restoration provenance.
- **inputs** — resolveLayout-shaped absolute paths including the Windows copy record, ledgerPaths(home), nana-pack's RULINGS_FILE and steps' PATH_COMMANDS.
- **outputs** — sealed STATE_CLASSES and stateRows(layout), including every PATH_COMMANDS link and `.cmd` shim.
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-setup/bin/nana-setup.mjs`, `packages/nana-setup/lib/uninstall.mjs`, `packages/nana-setup/tests/restore.test.mjs`, `packages/nana-setup/tests/state-manifest.test.mjs`, `packages/nana-setup/tests/uninstall.test.mjs`
- **callees** — `packages/nana-pack/bin/review-round.mjs`, `packages/nana-pack/lib/rulings-config.mjs`, `packages/nana-setup/lib/steps.mjs`

### `packages/nana-setup/lib/steps.mjs`

- **purpose** — The install steps and the `install` sequencer link, seed, retire, merge or register one piece of the experience and report { label, status, detail }.
- **inputs** — a layout from resolveLayout; { dryRun, desk, afterTempWrite }; this package's own sources (claude/hooks, claude/rules, claude/rules/nana-personal.example.md, claude/memory/MEMORY.seed.md, pi/nana-pack.seed.json, pi/nana-objective.seed.md, pi/subagent-config.seed.json, pi/reviewer.seed.md, launchd/com.nana.pi-desk.plist.tmpl) and packages/nana-pack/skills and packages/nana-pack/rules (the writing rule and the rulings file); the live <claudeHome>/settings.json, <piHome>/nana-pack.json and <piHome>/settings.json; <claudeHome>/nana-setup-copies.json; pi's npm package.json; NANA_SETUP_PLATFORM
- **outputs** — an array of { label, status, detail }; on disk — symlinks in <claudeHome>/hooks and rules (copies on win32), a seeded nana-personal.md, the missing hook entries merged into <claudeHome>/settings.json; on win32 a copy record tracks the last installed bytes; install takes the O_EXCL .settings.json.nana-setup.lock before its first write and holds it through the PATH entries; the settings write's fsync'd temp-file rename preserves mode; <claudeHome>/nana-memory/shared/MEMORY.md, <piHome>/nana-pack.json, nana-objective.md and nana-rulings.md (link on POSIX, copy on win32), <piHome>/extensions/subagent/config.json, <piHome>/agents/reviewer.md, <knowledgeHome>/index.db, <binDir>/pi-review, pi-worker, nana-land, nana-setup and nana-writing, the desk plist (+ launchctl bootstrap/kickstart), per-package pi `packages` registrations, the win32 skill mirror's SKILL_COPY_MARKER (".nana-setup-copy") file; also exports HOOKS, CLAUDE_RULES, PACK_RULES_DIR, ruleSource, CLAUDE_SKILLS, PACK_SKILLS_DIR, PI_REVIEW_BIN, PI_WORKER_BIN, KNOWLEDGE_CLI, DESK_SERVER, NANA_LAND_BIN, NANA_SETUP_BIN, NANA_WRITING_BIN, PATH_COMMANDS, PI_INSTALL_HINT, PI_LAUNCH_LIMITS_MS, PRIVATE_RULE_SEED, SHARED_MEMORY_SEED, PI_PACK_SEED, PI_OBJECTIVE_SEED, SUBAGENT_CONFIG_SEED, REVIEWER_SEED, realpathSafe(), resolvePackageEntryPath(), REVIEWER_MARKER, firstBodyLine, directoryAncestorsAreSafe(), linkedSkillFolder(), SKILL_COPY_MARKER, ownSkillCopy(), SetupError and the helpers doctor reuses
- **effects** — disk, process (spawns `nana-knowledge build`, `launchctl print|bootout|bootstrap`, bounded `pi --version` / `pi install` process trees, `git rev-parse`)
- **errors** — SetupError — settings.json unreadable, not valid JSON, or a shape the merge will not edit; install cannot take its settings lock before its first write and hold it through the PATH entries; settings.json changed on disk during the run; a plist placeholder with no value. Every other failure is a row: PROBLEM for a non-regular nana-personal.md, or anything already sitting where the skill symlink belongs, SKIPPED for unsupported win32 pieces, a failed knowledge build or missing pi, and PROBLEM for a failed per-package `pi install` or launchctl bootstrap/kickstart
- **callers** — `packages/nana-setup/bin/nana-setup.mjs`, `packages/nana-setup/bin/stale-copies.mjs`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/hook-health.mjs`, `packages/nana-setup/lib/project.mjs`, `packages/nana-setup/lib/state-manifest.mjs`, `packages/nana-setup/lib/uninstall.mjs`, `packages/nana-setup/tests/desk-service.test.mjs`, `packages/nana-setup/tests/doctor-detail.test.mjs`, `packages/nana-setup/tests/doctor-memory-links.test.mjs`, `packages/nana-setup/tests/doctor-package-source.test.mjs`, `packages/nana-setup/tests/doctor-runtime.test.mjs`, `packages/nana-setup/tests/fresh-machine.test.mjs`, `packages/nana-setup/tests/install-overlap.test.mjs`, `packages/nana-setup/tests/install.test.mjs`, `packages/nana-setup/tests/linked-claude-folder.test.mjs`, `packages/nana-setup/tests/objective-path-shapes.test.mjs`, `packages/nana-setup/tests/pi-install-pin.test.mjs`, `packages/nana-setup/tests/pi-launch-limits.test.mjs`, `packages/nana-setup/tests/pi-registration.test.mjs`, `packages/nana-setup/tests/retired-artifacts.test.mjs`, `packages/nana-setup/tests/rulings-install.test.mjs`, `packages/nana-setup/tests/settings-merge.test.mjs`, `packages/nana-setup/tests/stale-copies.test.mjs`, `packages/nana-setup/tests/state-manifest.test.mjs`, `packages/nana-setup/tests/trust.test.mjs`, `packages/nana-setup/tests/uninstall.test.mjs`, `packages/nana-setup/tests/win32-degrade.test.mjs`, `packages/nana-setup/tests/writing-rule.test.mjs`
- **callees** — `packages/nana-pack/lib/json-text.mjs`, `packages/nana-pack/lib/objective-path.mjs`, `packages/nana-pack/lib/real-path.mjs`, `packages/nana-pack/lib/rulings-config.mjs`, `packages/nana-pack/lib/win-command.mjs`, `packages/nana-setup/lib/bounded-spawn.mjs`, `packages/nana-setup/lib/copy-record.mjs`, `packages/nana-setup/lib/fsops.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/pi-invocation.mjs`, `packages/nana-setup/lib/pi-pin.mjs`, `packages/nana-setup/lib/retired.mjs`, `packages/nana-setup/lib/settings-lock.mjs`, `packages/nana-setup/lib/settings.mjs`, `packages/nana-setup/lib/win-shims.mjs`

### `packages/nana-setup/lib/trust-decision.mjs`

- **purpose** — Apply trust confirmation and dry-run decisions before invoking the trust-store writer.
- **inputs** — yes/dryRun flags, an async confirmation callback, and a trust-store writer callback.
- **outputs** — whether trust was recorded and the decision label for CLI reporting.
- **effects** — process (invokes the supplied writer only after affirmative confirmation outside dry-run).
- **errors** — confirmation and writer errors propagate to the caller.
- **callers** — `packages/nana-setup/bin/nana-setup.mjs`, `packages/nana-setup/tests/trust.test.mjs`
- **callees** — —

### `packages/nana-setup/lib/uninstall.mjs`

- **purpose** — Removes only nana-setup-owned manifest pieces while preserving user state.
- **inputs** — resolved layout, manifest rows with seed sources and settings lock helpers.
- **outputs** — one result row per owned removable manifest piece and reported pi registrations.
- **effects** — disk, process (launchctl print only for the real home).
- **errors** — SetupError for unsafe preflight or concurrent settings changes.
- **callers** — `packages/nana-setup/bin/nana-setup.mjs`, `packages/nana-setup/tests/uninstall.test.mjs`
- **callees** — `packages/nana-pack/lib/real-path.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/settings.mjs`, `packages/nana-setup/lib/state-manifest.mjs`, `packages/nana-setup/lib/steps.mjs`

### `packages/nana-setup/lib/verifier-hook.mjs`

- **purpose** — Convert Claude Code PreToolUse input into an ask decision or fail-open abstention.
- **inputs** — parsed hook JSON (tool_name Bash or PowerShell) and optionally an injected pipe-reason predicate.
- **outputs** — an optional hook response and an optional diagnostic; runHook writes protocol output.
- **effects** — process (runHook writes stdout and stderr).
- **errors** — predicate failures become abstentions with diagnostic text.
- **callers** — `packages/nana-setup/claude/hooks/verifier-pipe.mjs`, `packages/nana-setup/tests/verifier-pipe.test.mjs`
- **callees** — `packages/nana-pack/lib/pipe-guard.mjs`

### `packages/nana-setup/lib/win-shims.mjs`

- **purpose** — Render extensionless sh and `.cmd` launchers for Windows PATH commands.
- **inputs** — An absolute Node bin file and the directory that will hold its shims.
- **outputs** — renderWinShims() returns byte-exact { sh, cmd } text; sealed suffix, line-ending and layout values.
- **effects** — none
- **errors** — Non-string or non-absolute inputs throw TypeError; path operations may throw their native errors.
- **callers** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/win-shims.test.mjs`, `packages/nana-setup/tests/win32-degrade.test.mjs`
- **callees** — —

### `packages/nana-setup/tests/agent-dir-consumers.test.mjs`

- **purpose** — Pins that widening the agent-dir resolution never splits a producer from its consumer — the installer's knowledge home matches the runtime default, and the rendered desk plist carries the directory the installer chose
- **inputs** — bin/nana-setup.mjs, lib/paths.mjs, the desk plist template, and throwaway --home / --claude-home targets
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway home layouts and rendered plists), process (spawns the installer CLI; launchctl is never called)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/checkout-converge.test.mjs`

- **purpose** — Prove install and uninstall converge same-checkout POSIX spellings without claiming foreign or customized resources.
- **inputs** — Copied checkout fixtures, linked and case spellings, nana-setup install and uninstall, and temporary homes and projects.
- **outputs** — PASS/FAIL/SKIP lines and a summary; a nonzero exit when any check fails.
- **effects** — disk (OS temporary fixtures only), process (bounded nana-setup child processes).
- **errors** — Fixture, child-process or assertion failures fail their awaited case within the chosen per-case limit.
- **callers** — —
- **callees** — `packages/nana-pack/lib/real-path.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/checkout-spelling.test.mjs`

- **purpose** — Prove setup treats honest second spellings of its checkout as the same checkout.
- **inputs** — A copied checkout fixture, nana-setup install/doctor/uninstall and stale-copies CLIs, native path spellings, and temporary homes.
- **outputs** — PASS/FAIL/SKIP lines and a summary; a nonzero exit when any check fails.
- **effects** — disk (temporary checkout, homes and projects only), process (spawns setup and spelling probes).
- **errors** — Fixture or assertion failures fail their case; every child process has a per-case timeout.
- **callers** — —
- **callees** — `packages/nana-pack/lib/real-path.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/claude-config-dir.test.mjs`

- **purpose** — Pin nana-setup install and doctor to Claude Code's configured home while keeping explicit flags authoritative and relative ambient paths safe.
- **inputs** — bin/nana-setup.mjs, CLAUDE_CONFIG_DIR, fresh temporary homes, and the shared pi stub.
- **outputs** — Seven PASS/FAIL lines and a nonzero exit when any requirement check fails.
- **effects** — disk (temporary homes only), process (spawns install and doctor under bounded cases).
- **errors** — A failed or timed-out case prints FAIL with its observations and makes the process exit nonzero.
- **callers** — —
- **callees** — `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/copy-record.test.mjs`

- **purpose** — Prove Windows managed copies refresh without backup noise while owner edits still get one backup.
- **inputs** — One temporary checkout copy, fresh temporary homes, the nana-setup install CLI, mutable rule and skill sources, and copy-record failure shapes.
- **outputs** — Eight PASS/FAIL requirement checks, optional read-only SKIP output under POSIX root, and a nonzero exit for failures.
- **effects** — disk (one copied checkout and temporary homes only), process (bounded nana-setup install children).
- **errors** — A failed assertion fails its requirement check; a child timeout or launch error is reported as that check's failure.
- **callers** — —
- **callees** — `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/desk-service.test.mjs`

- **purpose** — Pins that the desk launchd service is opt-in, rendered from the template with REAL resolved values, never bootstrapped from a test, and that a skipped plist write (a symlink in the way) makes zero launchctl calls
- **inputs** — lib/steps.mjs renderPlist/stepDesk, the plist template, bin/nana-setup.mjs, a throwaway --home, and (for the caller-level section) a stubbed `launchctl` script placed first on PATH
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway home layouts, rendered plists and a stub launchctl script), process (spawns the installer CLI, and — only via the PATH-stubbed fake — `launchctl`; the REAL launchctl is never called)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/fsops.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/doctor-detail.test.mjs`

- **purpose** — Pins that `doctor`'s detail text for each per-piece check agrees with the tick, cross or warning it prints — the private rule file, objective.projectFile, the Node floor, and the pi 1.0 subagent/MCP checks (subagent config, reviewer agent marker, pi-subagents version, mcp.json)
- **inputs** — lib/doctor.mjs, lib/paths.mjs, lib/steps.mjs, valid and malformed nana-pack JSON fixtures, and throwaway home layouts
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway home layouts, regular files, symlinks and directories)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/lib/adoption.mjs`, `packages/nana-pack/lib/objective.ts`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/doctor-fix-line.test.mjs`

- **purpose** — Pin doctor's final repair line, and the `PATH resolves pi-review` row's own advice, to the changes install's dry run can actually make.
- **inputs** — The nana-setup CLI, scratch homes and working folders, a pi stub, and PI_SUBAGENTS_FLOOR.
- **outputs** — PASS/FAIL lines for R-1990 through R-1997 and R-2320 through R-2325, and a final failure-count summary.
- **effects** — disk (temporary fixtures), process (runs install and doctor with sanitized environments).
- **errors** — Failed assertions print their observed output and make the test process exit nonzero.
- **callers** — —
- **callees** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/doctor-knowledge.test.mjs`

- **purpose** — Pins that doctor validates the knowledge database by opening it read-only and counting the expected docs table.
- **inputs** — doctor diagnose, setup path resolution, and temporary SQLite databases.
- **outputs** — PASS/FAIL lines and a nonzero process exit when any assertion fails.
- **effects** — disk (temporary SQLite databases).
- **errors** — a failed assertion prints FAIL and exits nonzero.
- **callers** — —
- **callees** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/doctor-memory-links.test.mjs`

- **purpose** — Pins two-tier doctor memory-link resolution by frontmatter name and its bounded issue output.
- **inputs** — memoryLinkState, the configured issue limit, and isolated memory tiers.
- **outputs** — PASS/FAIL lines and a nonzero exit when an assertion fails.
- **effects** — disk (temporary memory fixtures only).
- **errors** — failed assertions produce a nonzero exit.
- **callers** — —
- **callees** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/project-key.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/doctor-package-source.test.mjs`

- **purpose** — Pins doctor classification of pi package entries against the checkout supplying hooks and rules.
- **inputs** — doctor.mjs, steps.mjs, scratch pi settings and checkout fixtures.
- **outputs** — PASS/FAIL lines and a nonzero exit on failed checks.
- **effects** — disk (reads scratch settings and writes fixtures under the OS temp directory).
- **errors** — failed checks exit nonzero.
- **callers** — —
- **callees** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/doctor-quiet.test.mjs`

- **purpose** — Pin the selective muting of Node warnings in doctor and project --check while preserving unrelated warning output.
- **inputs** — The nana-setup CLI, scratch homes and projects, a pi stub, and a warning-emitting preload.
- **outputs** — PASS/FAIL lines and a summary with a nonzero exit when any check fails.
- **effects** — disk (temporary fixtures), process (spawns the CLI with sanitized environments).
- **errors** — Failed assertions print FAIL and make the test process exit nonzero.
- **callers** — —
- **callees** — `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/doctor-release.test.mjs`

- **purpose** — Pins doctor release status as informational for lagging and degraded checkouts.
- **inputs** — diagnose, release-status Git metadata, and isolated temporary repositories.
- **outputs** — PASS/FAIL lines and a nonzero exit when a doctor release row is not informational.
- **effects** — disk (temporary test repositories).
- **errors** — Failed checks exit nonzero; unexpected exceptions fail the process.
- **callers** — —
- **callees** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/doctor-runtime.test.mjs`

- **purpose** — Pins pi executable diagnostics and first-executable pi-review PATH resolution.
- **inputs** — doctor.mjs, steps.mjs, PATH fixtures and scratch layouts.
- **outputs** — PASS/FAIL lines and a nonzero exit on failed checks.
- **effects** — disk (creates executables and links under the OS temp directory), process environment (temporarily changes PATH/platform).
- **errors** — failed checks exit nonzero.
- **callers** — —
- **callees** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/doctor-trust.test.mjs`

- **purpose** — Pins doctor's project-trust warning and repair command for an untrusted project configuration.
- **inputs** — doctor diagnose, explicit setup layout, and a temporary project and home.
- **outputs** — PASS/FAIL lines and a nonzero process exit when any assertion fails.
- **effects** — disk (temporary project config and home).
- **errors** — a failed assertion prints FAIL and exits nonzero.
- **callers** — —
- **callees** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/entry-guidance.test.mjs`

- **purpose** — Pins the completion guidance each scaffold, adopt, copier and project path gives: ratification before trust, the adopt skills' closing project check, and adopt-structure step 4's marker fence and fallback commands.
- **inputs** — copier.yml, four pack skill files, nana-setup project CLI output, and the shared working file and project lib's WORKING_BEGIN/WORKING_END/agentsStub.
- **outputs** — PASS/FAIL lines and a nonzero process exit when any assertion fails.
- **effects** — disk (temporary project and home), process (runs the CLI).
- **errors** — a failed assertion prints FAIL and exits nonzero.
- **callers** — —
- **callees** — `packages/nana-setup/lib/project.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/fresh-machine.test.mjs`

- **purpose** — Pins the ordered fresh-machine README checklist and its sourced version values.
- **inputs** — README.md, doctor and step constants, CI workflow, resolved layout names, and the pack and doctor objective-path resolvers.
- **outputs** — PASS/FAIL lines and a nonzero exit on failed checks.
- **effects** — disk (reads repository documentation and source).
- **errors** — failed checks exit nonzero.
- **callers** — —
- **callees** — `packages/nana-pack/lib/objective.ts`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/readme-rehearsal.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/fsops.test.mjs`

- **purpose** — Pins writeIfChanged's non-destructive contract: a symlink (live or dangling) in the way is left untouched and reported SKIPPED, with no read targeting the link or its destination and no write through it
- **inputs** — lib/fsops.mjs writeIfChanged, throwaway scratch directories with real symlinks, and (for the no-read instrumentation) a global spy on fs.readFileSync installed via require('fs') + syncBuiltinESMExports()
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (a throwaway scratch dir, files and symlinks, removed on exit); process-global (readFileSync is monkeypatched and restored within a single synchronous call, via node:module's syncBuiltinESMExports)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/lib/fsops.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/hook-deadlines.test.mjs`

- **purpose** — Prove session-start hooks replace hung producer output with markers before their installed limit.
- **inputs** — Copied canonical hooks and launcher library, checkout hook metadata, and live or hung producer stubs.
- **outputs** — PASS/FAIL checks for adoption and objective hook deadline behavior.
- **effects** — disk (creates a throwaway checkout), process (spawns copied hooks and producer stubs).
- **errors** — A watchdog kills an over-limit hook; failed checks set a nonzero process exit code.
- **callers** — —
- **callees** — `packages/nana-setup/lib/hook-producer.mjs`, `packages/nana-setup/lib/settings.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/hook-producers.test.mjs`

- **purpose** — Pins fail-open producer launcher output and import safety of verifier hook logic.
- **inputs** — the launcher module and an open-stdin child process.
- **outputs** — PASS/FAIL checks for exact markers and prompt import completion.
- **effects** — process (spawns an isolated Node child).
- **errors** — failed checks set a nonzero process exit code.
- **callers** — —
- **callees** — `packages/nana-setup/lib/hook-producer.mjs`

### `packages/nana-setup/tests/hooks-closed-output.test.mjs`

- **purpose** — Prove Claude Code hooks fail open when their stdout or stderr reader closes.
- **inputs** — Six canonical scripts, their arguments and fixture inputs, stream closures, and throwaway homes.
- **outputs** — One PASS or FAIL check per closed-output contract and a nonzero exit when any check fails.
- **effects** — disk (creates throwaway hook and knowledge state), process (spawns Node hook children and an index build).
- **errors** — A watchdog kills an over-limit child; a failed check reports both exit codes and the first diagnostic line.
- **callers** — —
- **callees** — `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/hooks-win32-exec.test.mjs`

- **purpose** — Spawn every installed Claude Code hook entry exactly as Windows exec form does — no shell, real `node`, each entry's own args — and read the result.
- **inputs** — a detached git worktree of HEAD under a temp folder whose name carries a space and several shell-only characters; the real install and doctor CLIs; sample Claude Code event stdin
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (a detached worktree, a throwaway home and project, both removed at the end), process (spawns the installer, doctor and every hook entry with `shell: false`)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; this file is SKIPped on every leg but the Windows one (scripts/test.mjs SKIPS)
- **callers** — —
- **callees** — `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/settings.mjs`, `packages/nana-setup/tests/stub-pi.mjs`

### `packages/nana-setup/tests/install-check.test.mjs`

- **purpose** — Pins install-check configuration, pure matching, environment and reporting contracts.
- **inputs** — Sealed install-check values and injected process inputs.
- **outputs** — PASS/FAIL lines and a nonzero exit on failed checks.
- **effects** — process
- **errors** — Failed checks set a nonzero exit code.
- **callers** — —
- **callees** — `packages/nana-pack/lib/win-command.mjs`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/install-check-config.mjs`, `packages/nana-setup/lib/install-check.mjs`, `packages/nana-setup/lib/project-key.mjs`, `packages/nana-setup/lib/stale-copies-config.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/install-overlap.test.mjs`

- **purpose** — Prove one install holds its single settings lock through every shared, pi and PATH file step, while a competing install stops and the knowledge build runs after release.
- **inputs** — lib/steps.mjs install, lib/paths.mjs resolveLayout, the nana-setup CLI, a throwaway home with one tiny knowledge source, and process-global spies installed through CommonJS builtins plus syncBuiltinESMExports
- **outputs** — Four PASS/FAIL lines on stdout, observed overlap values on failure, and exit 1 when any check fails
- **effects** — disk, process
- **errors** — A failed contract check prints FAIL with its observations; unexpected setup errors are captured as the first install's throw so all four checks still report
- **callers** — —
- **callees** — `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/settings-lock.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/install.test.mjs`

- **purpose** — Pins that `install` is idempotent, additive, and never destroys what the owner wrote by hand
- **inputs** — bin/nana-setup.mjs, lib/settings.mjs, lib/steps.mjs, lib/doctor.mjs, and a throwaway --home
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway home layouts, settings files, symlinks), process (spawns the installer CLI)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/settings.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/linked-claude-folder.test.mjs`

- **purpose** — Pin install's and doctor's behavior for a Claude home or skills folder that is a link: no retired row for an absent path, a present retired artifact left untouched, and doctor's fix-by-hand guidance naming the folder to move.
- **inputs** — The nana-setup CLI, `bin/stale-copies.mjs`, scratch homes and working folders, a pi stub, and PI_SUBAGENTS_FLOOR.
- **outputs** — PASS/FAIL lines for R-2290 through R-2294 and a final SUMMARY line.
- **effects** — disk (temporary fixtures, including directory junctions/symlinks and file symlinks), process (runs install, doctor and stale-copies with sanitized environments).
- **errors** — Failed assertions print their observed output; the test process exits nonzero on any failure.
- **callers** — —
- **callees** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/stale-copies-config.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/objective-path-shapes.test.mjs`

- **purpose** — Pin the shared objective-path resolver: doctor and install never throw on a shaped objective.path, doctor's new ✗ row names the value and the default file only when the value is invalid, an empty string resolves to the default file everywhere, and the tilde-backslash rule expands only on win32.
- **inputs** — lib/objective-path.mjs, lib/doctor.mjs, lib/steps.mjs, lib/paths.mjs, bin/nana-setup.mjs, the nana-pack objective producer CLI, and throwaway --home layouts with a knowledge sources.json
- **outputs** — PASS/FAIL/SKIP lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway home layouts, nana-pack.json and objective-file fixtures), process (spawns the nana-setup and nana-objective CLIs)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/bin/worker-config.mjs`, `packages/nana-pack/lib/objective-path.mjs`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/paths.test.mjs`

- **purpose** — Pins resolveLayout's isRealHome guard (false whenever ANY explicit override — --home, --claude-home, --pi-home — is in force, even when --home resolves to the same path as the real home directory) and tildeify's case rule on a case-variant home path (R-1204)
- **inputs** — lib/paths.mjs resolveLayout and tildeify, NANA_SETUP_PLATFORM (the forced-platform seam), and os.homedir() (under the suite runner this is already a fresh per-file temp HOME, never the developer's real one — scripts/test.mjs scrubs it; resolveLayout itself touches no disk either way)
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — none (pure path arithmetic; nothing on disk is read or written)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/lib/paths.mjs`

### `packages/nana-setup/tests/pi-install-pin.test.mjs`

- **purpose** — Pins README and missing-pi install hints to CI's pi package version and cutoff.
- **inputs** — CI workflow, covered README files and temporary workflow fixtures.
- **outputs** — PASS/FAIL test lines.
- **effects** — disk (temporary OS fixtures only)
- **errors** — Failed assertions are reported and set a nonzero exit code.
- **callers** — —
- **callees** — `packages/nana-setup/lib/pi-pin.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/pi-launch-limits.test.mjs`

- **purpose** — Prove install, its dry run and doctor bound pi launches and end every process those launches start.
- **inputs** — steps.mjs, doctor.mjs, paths.mjs, and fake pi process trees under OS temporary directories
- **outputs** — PASS/FAIL/SKIP lines for eighteen requirement checks and exit 1 when any check fails
- **effects** — disk (temporary fixtures only), process (starts and signals fake pi process trees), process environment (temporarily changes PATH and PI_CODING_AGENT_DIR)
- **errors** — a failed or over-time check prints FAIL and makes the file exit nonzero
- **callers** — —
- **callees** — `packages/nana-pack/bin/worker-config.mjs`, `packages/nana-setup/lib/bounded-spawn.mjs`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/pi-registration.test.mjs`

- **purpose** — Pins the answer to whether nana-pi is already registered with pi, following pi's own matching rules, so the installer never adds a second root-level package entry
- **inputs** — lib/steps.mjs, lib/paths.mjs, and pi settings fixtures under a throwaway --home
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway home layouts and settings fixtures), process (spawns the installer CLI)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/lib/json-text.mjs`, `packages/nana-pack/lib/real-path.mjs`, `packages/nana-pack/lib/win-command.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/project-dismiss.test.mjs`

- **purpose** — Pins the `--not-a-project` marker — written at a repository root, honored by the adoption reader, and refused with a reason on a marked dir or a non-root
- **inputs** — bin/nana-setup.mjs, nana-pack's bin/nana-adoption.mjs, and throwaway git repositories
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway repositories, markers and a throwaway home), process (spawns the setup CLI, the reader and git)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/project-key.test.mjs`

- **purpose** — Pins the project-key mapping the shared-memory hook has to reproduce, including the truncation-plus-hash form, cross-checked against this machine's real project directories when they exist
- **inputs** — lib/project-key.mjs and the machine's ~/.claude/projects directory names when present
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (reads ~/.claude/projects when it exists; writes nothing)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/lib/project-key.mjs`

### `packages/nana-setup/tests/project-odd-seeds.test.mjs`

- **purpose** — Pin project setup and checks for odd seed entries, literal names, and dry-run repair prediction.
- **inputs** — bin/nana-setup.mjs and throwaway projects with a throwaway --home
- **outputs** — PASS/FAIL lines for exactly eight must-meet checks and a SUMMARY line
- **effects** — disk (OS temporary fixtures), process (spawns the nana-setup CLI)
- **errors** — A failed check prints FAIL and makes the test process exit 1.
- **callers** — —
- **callees** — `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/project-working-region.test.mjs`

- **purpose** — Pins marker-owned AGENTS refresh and region-only checking without touching bytes outside the region.
- **inputs** — project helpers, the shared working section, and temporary project folders.
- **outputs** — PASS/FAIL lines and a nonzero exit when an assertion fails.
- **effects** — disk (temporary project fixtures only).
- **errors** — failed assertions produce a nonzero exit.
- **callers** — —
- **callees** — `packages/nana-setup/lib/project.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/project.test.mjs`

- **purpose** — Pins that `nana-setup project` turns a blank folder into a nana project, never overwrites what a folder already has, and emits the same seeds the copier templates render
- **inputs** — bin/nana-setup.mjs, the shared templates, and throwaway target dirs with a throwaway --home
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway project dirs, seeds, symlinks, a throwaway home), process (spawns the setup CLI and git)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/lib/npm-root.mjs`, `packages/nana-setup/lib/project.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/readme-rehearsal.test.mjs`

- **purpose** — Pins the README rehearsal's parse grammar, answer rule, sandbox environment, output cap and stop-at-first-failure verdict.
- **inputs** — Synthetic checklist fixtures, a stub spawn and the sealed README_REHEARSAL contract.
- **outputs** — PASS/FAIL lines and a nonzero exit when any assertion fails.
- **effects** — disk (OS-temp fixture roots and homes).
- **errors** — A failed assertion exits nonzero.
- **callers** — —
- **callees** — `packages/nana-setup/lib/install-check-config.mjs`, `packages/nana-setup/lib/install-check.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/readme-rehearsal.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/realpath-fallback.test.mjs`

- **purpose** — Prove setup remains consistent when native realpath fails inside the checkout but typed realpath succeeds.
- **inputs** — This checkout's setup and stale-copy CLIs, a runtime-written preload, fresh temporary homes and projects, and POSIX/win32 setup forms.
- **outputs** — PASS/FAIL/SKIP lines and a summary; a nonzero exit when any requirement check fails.
- **effects** — disk (temporary homes, projects and preload only), process (bounded CLI, producer and preload-probe children).
- **errors** — Preconditions and assertions fail their check; every child process has a per-case timeout.
- **callers** — —
- **callees** — `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/relative-agent-dir.test.mjs`

- **purpose** — Pins that an AMBIENT relative PI_CODING_AGENT_DIR is refused by `install`, `project` and `project --check` with the cwd and the remedy named, while an explicit --pi-home is honoured and `doctor` warns
- **inputs** — bin/nana-setup.mjs with a relative PI_CODING_AGENT_DIR in the environment, throwaway home and project dirs, and lib/doctor.mjs's PI_SUBAGENTS_FLOOR
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway home and project dirs), process (sets PI_CODING_AGENT_DIR, spawns the setup CLI)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/restore.test.mjs`

- **purpose** — Exercises the documented state listing and complete restore using isolated temporary homes.
- **inputs** — setup CLI, state manifest, pi trust API and setup README.
- **outputs** — PASS/FAIL checks and process exit status.
- **effects** — disk (temporary fixture roots only), process (setup CLI and tar).
- **errors** — Failed checks increment the exit status.
- **callers** — —
- **callees** — `packages/nana-setup/lib/npm-root.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/project-key.mjs`, `packages/nana-setup/lib/state-manifest.mjs`, `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/retired-artifacts.test.mjs`

- **purpose** — Verifies safe retirement, provenance preservation, context-hook deregistration, and doctor visibility using isolated home trees.
- **inputs** — nana-setup CLI, retirement manifest and throwaway home fixtures.
- **outputs** — PASS/FAIL checks on stdout and a nonzero exit when an assertion fails.
- **effects** — disk (temporary homes, backups, settings and symlinks), process (installer/doctor subprocesses).
- **errors** — unexpected process or filesystem errors fail the test; assertion failures are counted.
- **callers** — —
- **callees** — `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/retired.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/roster-notice-hook.test.mjs`

- **purpose** — Pins the Claude Code roster notice SessionStart hook: its SessionStart context on every source, its systemMessage on a session-start-like or unreadable source only, and its fail-open unavailable notice when it cannot load its modules.
- **inputs** — claude/hooks/nana-roster-notice.mjs, its exported runRosterNoticeHook, and a throwaway HOME with PI_CODING_AGENT_DIR overridden
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway home and agent-dir layouts), process (runs and imports the Node hook)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1
- **callers** — —
- **callees** — `packages/nana-pack/lib/roster-notice-config.mjs`, `packages/nana-setup/claude/hooks/nana-roster-notice.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/rulings-install.test.mjs`

- **purpose** — Pins that install places nana-rulings.md in both pi's active agent dir and Claude Code's rules folder (a symlink on POSIX, a byte-equal copy on win32), and that doctor's `pi nana-rulings.md` row reads correctly for every shape: missing, a plain POSIX copy, a stale win32 copy, and after a real install.
- **inputs** — bin/nana-setup.mjs, lib/steps.mjs's ruleSource/PACK_RULES_DIR, the shipped nana-pack/lib/rulings-config.mjs RULINGS_FILE, and throwaway --home/--pi-home roots with --pi-home always OUTSIDE <home>/.pi/agent
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway home and pi-home layouts, symlinks, byte copies), process (spawns the installer CLI)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/lib/rulings-config.mjs`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/seat-rule.test.mjs`

- **purpose** — Pins that the seat guide opens with exactly one scope sentence and carries each of its ten rules exactly once, with no other bullet, numbered or not.
- **inputs** — packages/nana-setup/claude/rules/nana-seat.md
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (reads the guide file)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; a missing guide file reads as empty text, so every check below fails
- **callers** — —
- **callees** — —

### `packages/nana-setup/tests/settings-lock.test.mjs`

- **purpose** — Prove printed settings-lock removal commands execute safely and doctor reports a leftover lock with the same repairs.
- **inputs** — The nana-setup CLI, SETTINGS_LOCK_NAME, temporary home and sentinel fixtures, /bin/sh, cmd.exe and Windows PowerShell.
- **outputs** — PASS, FAIL or named SKIP lines for R-2081 through R-2085 and a final failure-count summary.
- **effects** — disk (temporary fixtures), process (runs nana-setup and the platform shells).
- **errors** — Failed assertions print their observed output and make the test process exit nonzero.
- **callers** — —
- **callees** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/settings-lock.mjs`, `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/settings-merge.test.mjs`

- **purpose** — Pins that the settings.json merge adds active hooks and removes only the exact retired hook — other people's hooks, keys and ordering survive, an unparsable or unrecognised file stops the installer before anything moves, and the write is atomic
- **inputs** — lib/settings.mjs, lib/steps.mjs, bin/nana-setup.mjs, and settings fixtures under a throwaway --home
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway home layouts, settings files and lock files), process (spawns the installer CLI)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/settings.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/shared-link-state.test.mjs`

- **purpose** — Pins sharedLinkState's no-error contract: a readlink failure on a confirmed symlink reads as "absent", never throws — proven both as a deterministic unit check and as a true base reproduction of the original race
- **inputs** — lib/project-key.mjs sharedLinkState, a throwaway home, an injected readlinkSync failure (the seam sharedLinkState's 4th arg adds), and — for the true reproduction — a global spy on fs.lstatSync installed via require('fs') + syncBuiltinESMExports()
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (a throwaway home, real project memory dirs and real symlinks, removed on exit); process-global (lstatSync is monkeypatched and restored within a single synchronous call, via node:module's syncBuiltinESMExports)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/lib/project-key.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/shared-memory-budget.test.mjs`

- **purpose** — Pin the shared-memory hook's bounded, structure-preserving index output.
- **inputs** — The shared-memory hook, its sealed output configuration, and generated throwaway indexes.
- **outputs** — PASS/FAIL lines for seven requirement checks and exit 1 when any check fails.
- **effects** — disk (temporary homes and indexes), process (runs the Node hook).
- **errors** — A failed check prints FAIL; unexpected fixture or process errors propagate.
- **callers** — —
- **callees** — `packages/nana-setup/lib/shared-memory-config.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/shared-memory-hook.test.mjs`

- **purpose** — Pins that the shared-memory SessionStart hook self-heals and is fail-open, since it runs in every session in every repository
- **inputs** — claude/hooks/nana-shared-memory.mjs, lib/project-key.mjs, and a throwaway HOME with CLAUDE_PROJECT_DIR overridden
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway home layouts, memory dirs and symlinks), process (runs the Node hook)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/lib/project-key.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/shared-memory-input.test.mjs`

- **purpose** — Pins the shared-memory hook's TTY guard and exact stdin byte bound.
- **inputs** — an injectable stream and the shared-memory input reader.
- **outputs** — PASS/FAIL checks for skipped TTY reads and bounded non-TTY reads.
- **effects** — none
- **errors** — failed checks set a nonzero process exit code.
- **callers** — —
- **callees** — `packages/nana-setup/lib/project-key.mjs`, `packages/nana-setup/lib/shared-memory-input.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/skills-and-standards.test.mjs`

- **purpose** — Pins that Claude Code gets the requirements skill and the standards rule from the SAME source pi reads — a symlink into the repository, never a copy that stops tracking a pull
- **inputs** — bin/nana-setup.mjs, the packaged requirements skill, the standards rule, and a throwaway --home
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway home layouts and symlinks), process (spawns the installer CLI)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/stale-copies-slow.test.mjs`

- **purpose** — Prove stale-copies remains reliable under slow installs and reports checker failures.
- **inputs** — stale-copies.test.mjs, child-process preloads, and temporary folders.
- **outputs** — PASS/FAIL lines and one Windows SKIP plus a summary; nonzero exit on failure.
- **effects** — disk (temporary fixtures only), process (meta-runs stale-copies).
- **errors** — failed child runs or unexpected fixture output fail their checks.
- **callers** — —
- **callees** — `packages/nana-setup/lib/stale-copies-config.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/stale-copies.test.mjs`

- **purpose** — Pin stale installed-copy notices for Claude Code and pi on POSIX and win32.
- **inputs** — nana-setup install and dry-run skill steps, in-process doctor, the adoption hook, the rulings extension, and temporary homes.
- **outputs** — PASS/FAIL/SKIP lines and a summary; a nonzero exit when any check fails.
- **effects** — disk (temporary homes only), process (spawns installer and hook CLIs; temporarily sets NANA_SETUP_PLATFORM).
- **errors** — unexpected fixture errors fail the test process; timed-out async handlers fail their case.
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-rulings.ts`, `packages/nana-pack/lib/rulings-config.mjs`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/hook-producer.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/stale-copies-config.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/state-manifest.test.mjs`

- **purpose** — Pins the state inventory, layout coverage, ledger parity, and secret classification.
- **inputs** — state manifest and setup layout APIs.
- **outputs** — PASS/FAIL checks and process exit status.
- **effects** — disk (temporary fixture for read-only CLI proof).
- **errors** — Failed checks increment the exit status.
- **callers** — —
- **callees** — `packages/nana-pack/bin/review-round.mjs`, `packages/nana-pack/lib/rulings-config.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/state-manifest.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/stub-pi.mjs`

- **purpose** — Put a harmless scratch pi executable first on PATH for tests that run doctor.
- **inputs** — the shared temporary-directory helper and process PATH.
- **outputs** — withPiStub, which runs one synchronous callback with a pi version stub on PATH.
- **effects** — disk (creates a temporary executable), process environment (temporarily sets PATH).
- **errors** — propagates temporary-directory and file creation errors.
- **callers** — `packages/nana-pack/tests/agent-dir-parity.test.mjs`, `packages/nana-setup/tests/claude-config-dir.test.mjs`, `packages/nana-setup/tests/desk-service.test.mjs`, `packages/nana-setup/tests/doctor-detail.test.mjs`, `packages/nana-setup/tests/doctor-fix-line.test.mjs`, `packages/nana-setup/tests/doctor-knowledge.test.mjs`, `packages/nana-setup/tests/doctor-memory-links.test.mjs`, `packages/nana-setup/tests/doctor-quiet.test.mjs`, `packages/nana-setup/tests/doctor-release.test.mjs`, `packages/nana-setup/tests/doctor-runtime.test.mjs`, `packages/nana-setup/tests/doctor-trust.test.mjs`, `packages/nana-setup/tests/hooks-win32-exec.test.mjs`, `packages/nana-setup/tests/install.test.mjs`, `packages/nana-setup/tests/linked-claude-folder.test.mjs`, `packages/nana-setup/tests/objective-path-shapes.test.mjs`, `packages/nana-setup/tests/pi-registration.test.mjs`, `packages/nana-setup/tests/relative-agent-dir.test.mjs`, `packages/nana-setup/tests/restore.test.mjs`, `packages/nana-setup/tests/retired-artifacts.test.mjs`, `packages/nana-setup/tests/rulings-install.test.mjs`, `packages/nana-setup/tests/settings-lock.test.mjs`, `packages/nana-setup/tests/skills-and-standards.test.mjs`, `packages/nana-setup/tests/stale-copies.test.mjs`, `packages/nana-setup/tests/uninstall.test.mjs`, `packages/nana-setup/tests/verifier-pipe.test.mjs`, `packages/nana-setup/tests/win32-degrade.test.mjs`, `packages/nana-setup/tests/win32-hook-repair.test.mjs`
- **callees** — `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/tmp-dir.mjs`

- **purpose** — Create test temporary roots and remove them when the test process exits.
- **inputs** — A mkdtemp prefix.
- **outputs** — The created temporary directory path.
- **effects** — disk (creates and removes temporary directories), process (registers exit cleanup)
- **errors** — Propagates directory creation errors and ignores cleanup errors.
- **callers** — `packages/nana-setup/tests/agent-dir-consumers.test.mjs`, `packages/nana-setup/tests/checkout-converge.test.mjs`, `packages/nana-setup/tests/checkout-spelling.test.mjs`, `packages/nana-setup/tests/claude-config-dir.test.mjs`, `packages/nana-setup/tests/copy-record.test.mjs`, `packages/nana-setup/tests/desk-service.test.mjs`, `packages/nana-setup/tests/doctor-detail.test.mjs`, `packages/nana-setup/tests/doctor-fix-line.test.mjs`, `packages/nana-setup/tests/doctor-knowledge.test.mjs`, `packages/nana-setup/tests/doctor-memory-links.test.mjs`, `packages/nana-setup/tests/doctor-package-source.test.mjs`, `packages/nana-setup/tests/doctor-quiet.test.mjs`, `packages/nana-setup/tests/doctor-release.test.mjs`, `packages/nana-setup/tests/doctor-runtime.test.mjs`, `packages/nana-setup/tests/doctor-trust.test.mjs`, `packages/nana-setup/tests/entry-guidance.test.mjs`, `packages/nana-setup/tests/fresh-machine.test.mjs`, `packages/nana-setup/tests/fsops.test.mjs`, `packages/nana-setup/tests/hook-deadlines.test.mjs`, `packages/nana-setup/tests/hooks-closed-output.test.mjs`, `packages/nana-setup/tests/install-check.test.mjs`, `packages/nana-setup/tests/install-overlap.test.mjs`, `packages/nana-setup/tests/install.test.mjs`, `packages/nana-setup/tests/linked-claude-folder.test.mjs`, `packages/nana-setup/tests/objective-path-shapes.test.mjs`, `packages/nana-setup/tests/pi-install-pin.test.mjs`, `packages/nana-setup/tests/pi-launch-limits.test.mjs`, `packages/nana-setup/tests/pi-registration.test.mjs`, `packages/nana-setup/tests/project-dismiss.test.mjs`, `packages/nana-setup/tests/project-odd-seeds.test.mjs`, `packages/nana-setup/tests/project-working-region.test.mjs`, `packages/nana-setup/tests/project.test.mjs`, `packages/nana-setup/tests/readme-rehearsal.test.mjs`, `packages/nana-setup/tests/realpath-fallback.test.mjs`, `packages/nana-setup/tests/relative-agent-dir.test.mjs`, `packages/nana-setup/tests/restore.test.mjs`, `packages/nana-setup/tests/retired-artifacts.test.mjs`, `packages/nana-setup/tests/roster-notice-hook.test.mjs`, `packages/nana-setup/tests/rulings-install.test.mjs`, `packages/nana-setup/tests/settings-lock.test.mjs`, `packages/nana-setup/tests/settings-merge.test.mjs`, `packages/nana-setup/tests/shared-link-state.test.mjs`, `packages/nana-setup/tests/shared-memory-budget.test.mjs`, `packages/nana-setup/tests/shared-memory-hook.test.mjs`, `packages/nana-setup/tests/shared-memory-input.test.mjs`, `packages/nana-setup/tests/skills-and-standards.test.mjs`, `packages/nana-setup/tests/stale-copies-slow.test.mjs`, `packages/nana-setup/tests/stale-copies.test.mjs`, `packages/nana-setup/tests/state-manifest.test.mjs`, `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/trust.test.mjs`, `packages/nana-setup/tests/uninstall.test.mjs`, `packages/nana-setup/tests/verifier-pipe.test.mjs`, `packages/nana-setup/tests/win-shims.test.mjs`, `packages/nana-setup/tests/win32-degrade.test.mjs`, `packages/nana-setup/tests/win32-hook-repair.test.mjs`
- **callees** — —

### `packages/nana-setup/tests/trust.test.mjs`

- **purpose** — Pins that the explicit trust command records through pi's ProjectTrustStore only after owner confirmation.
- **inputs** — bin/nana-setup.mjs, pi's installed trust-manager module, the shared PI_INSTALL_HINT, and temporary project and home roots.
- **outputs** — PASS/FAIL lines and a nonzero process exit when any assertion fails.
- **effects** — disk (temporary trust store and project), process (runs the setup CLI and resolves the installed pi package).
- **errors** — a failed assertion prints FAIL and exits nonzero; unexpected errors fail the test.
- **callers** — —
- **callees** — `packages/nana-setup/lib/npm-root.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/lib/trust-decision.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/uninstall.test.mjs`

- **purpose** — Pins uninstall's explicit confirmation, manifest-driven removal and settings preservation.
- **inputs** — nana-setup CLI and settings helpers with fixtures under tmpDir.
- **outputs** — PASS/FAIL lines and a nonzero exit on failure.
- **effects** — disk (OS temporary homes), process (spawns the CLI only against temporary homes).
- **errors** — failed checks exit nonzero; unexpected errors fail the test process.
- **callers** — —
- **callees** — `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/settings.mjs`, `packages/nana-setup/lib/state-manifest.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/lib/uninstall.mjs`, `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/verifier-pipe.test.mjs`

- **purpose** — Pins Claude hook decisions, setup wiring, doctor health, and declared runtime coverage.
- **inputs** — the canonical verifier hook, settings and doctor modules, and shared runtime documentation.
- **outputs** — PASS/FAIL lines and a nonzero exit when any check fails.
- **effects** — disk (throwaway home), process (runs the hook with fixture stdin).
- **errors** — an assertion failure exits nonzero.
- **callers** — —
- **callees** — `packages/nana-pack/lib/pipe-guard.mjs`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/settings.mjs`, `packages/nana-setup/lib/verifier-hook.mjs`, `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/win-shims.test.mjs`

- **purpose** — Prove the Windows PATH shim renderings preserve supported arguments, exit status, runtime lookup and self-rewrite safety.
- **inputs** — lib/win-shims.mjs, the host POSIX shell or Windows Git Bash, cmd.exe and Windows PowerShell, and temporary hostile-path fixtures.
- **outputs** — PASS, FAIL or named SKIP lines for the eight shim and PATH-resolution requirements.
- **effects** — disk (temporary callers, briefs, bins and shims), process (spawns shells and node through rendered shims).
- **errors** — each case is awaited under a timeout; a failed assertion prints FAIL and makes the process exit nonzero.
- **callers** — —
- **callees** — `packages/nana-setup/lib/install-check.mjs`, `packages/nana-setup/lib/win-shims.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/win32-degrade.test.mjs`

- **purpose** — Pins that on Windows every posix-only install step SAYS it skipped instead of failing, driven through the platform seam rather than by patching process.platform
- **inputs** — bin/nana-setup.mjs with NANA_SETUP_PLATFORM set to win32, lib/paths.mjs, and throwaway --home directories
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway home layouts and copied rule files), process (sets NANA_SETUP_PLATFORM, spawns the installer CLI)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/install-check.mjs`, `packages/nana-setup/lib/settings.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/lib/win-shims.mjs`, `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/win32-hook-repair.test.mjs`

- **purpose** — Pin Windows repair of POSIX installer hook settings while preserving owner look-alikes.
- **inputs** — nana-setup CLI, desired hook fixtures, the repository layout, and throwaway homes.
- **outputs** — PASS/FAIL lines for the fourteen repair checks and exit 1 when any check fails.
- **effects** — disk (throwaway home layouts), process (spawns install and doctor with forced win32).
- **errors** — A failed check prints its observed detail; unexpected setup or filesystem errors propagate.
- **callers** — —
- **callees** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/hook-health.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/settings.mjs`, `packages/nana-setup/tests/stub-pi.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/writing-rule.test.mjs`

- **purpose** — Pins the shared writing rule's source, sealed Check section, command spelling, and zero-finding result
- **inputs** — lib/steps.mjs's ruleSource/PACK_RULES_DIR, nana-pack's lib/writing-check.mjs, the shipped rule file, and the sealed Check text
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — none (reads the rule file)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/lib/writing-check.mjs`, `packages/nana-setup/lib/steps.mjs`

### `packages/nana-stage/extensions/nana-stage.ts`

- **purpose** — pi extension that validates, stamps, signs and journals the blocks any tool result carries, replacing the tool's text with the canonical rendering.
- **inputs** — pi `tool_result` events (toolName, toolCallId, input, content, details, structuredContent, isError), `session_start` for the readiness watcher, env NANA_STAGE_KEY and NANA_STAGE_EXPECT_TOOLS, and pi.getActiveTools()
- **outputs** — a patched tool result (canonical text + stamped blocks, or an isError rejection with every carrier stripped), one `nana-block` session entry per block, and a `nana-tools` UI status of waiting / ready / missing
- **effects** — disk (block entries appended to pi's session), process (reads then deletes both env vars so tool subprocesses never inherit the key)
- **errors** — none thrown — invalid or over-cap blocks come back as an isError tool result, and a watcher error downgrades the status and keeps polling
- **callers** — —
- **callees** — `packages/nana-stage/lib/blocks.mjs`, `packages/nana-stage/lib/sign.mjs`

### `packages/nana-stage/lib/blocks.mjs`

- **purpose** — The pure block contract — validate, render, extract and reduce the code-authored blocks a stage shows.
- **inputs** — block objects authored by app-tool code, a tool result's `details` carrier (details.blocks, for pi-extension tools) and/or its `structuredContent` carrier (structuredContent.structuredContent.blocks, for pi's built-in MCP tools), and session entries {id, parentId, type, customType, data}
- **outputs** — a validation verdict with its error list, the canonical model-visible text of a block (byte-capped), the stage's upserted block array for a leaf, and the tool_result patch plus the `nana-block` entries to append
- **effects** — none
- **errors** — never throws — validateBlock returns {ok:false, errors} (bad type, bad field, over MAX_TABLE_ROWS / MAX_CHART_POINTS_TOTAL / MAX_BLOCK_BYTES, an uninspectable block) and processToolResult returns an isError patch with the carrier stripped
- **callers** — `apps/desk/test/app-listener.test.mjs`, `packages/nana-stage/extensions/nana-stage.ts`, `packages/nana-stage/tests/blocks.test.mjs`
- **callees** — —

### `packages/nana-stage/lib/sign.mjs`

- **purpose** — HMAC-SHA256 provenance signature over a block's canonical JSON, so only the holder of the per-session key can put a block on a stage.
- **inputs** — the per-session key (NANA_STAGE_KEY, held by the caller) and a block object; `produced_by.sig` is excluded from the signed payload
- **outputs** — the 64-char hex signature (signBlock), a timing-safe boolean verdict (verifyBlock), and the canonical sorted-key JSON string (canonical)
- **effects** — none
- **errors** — none — a missing, non-string or wrong-length signature is a false verdict, never a throw
- **callers** — `apps/desk/apps.mjs`, `apps/desk/test/stage-key-persistence.test.mjs`, `packages/nana-stage/extensions/nana-stage.ts`, `packages/nana-stage/tests/blocks.test.mjs`
- **callees** — —

### `packages/nana-stage/tests/blocks.test.mjs`

- **purpose** — Pins the staged-block contract and the nana-stage hook logic — validation, rendering, extraction, reduction and signing, with their caps
- **inputs** — lib/blocks.mjs and lib/sign.mjs
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — none
- **errors** — a failed check prints FAIL with the observed value and the run exits 1
- **callers** — —
- **callees** — `packages/nana-stage/lib/blocks.mjs`, `packages/nana-stage/lib/sign.mjs`
