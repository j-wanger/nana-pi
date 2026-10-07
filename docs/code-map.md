# Code map

Generated — do not edit. `npm run map` rewrites it from the import graph and the
contract header at the top of each module; `npm run map:check` fails when this file
and the code disagree (G-009, G-010). `npm run map:impact <file...>` prints a
change's transitive callers and callees (G-011).

Covers `scripts`, `apps/desk`, `apps/bench`, `packages/nana-pack/lib`, `packages/nana-pack/bin`, `packages/nana-pack/extensions`, `packages/nana-knowledge/lib`, `packages/nana-knowledge/bin`, `packages/nana-knowledge/extensions`, `packages/nana-stage/lib`, `packages/nana-stage/extensions`, `packages/nana-setup/lib`, `packages/nana-setup/bin`, `packages/nana-pack/tests`, `packages/nana-knowledge/tests`, `packages/nana-stage/tests`, `packages/nana-setup/tests`, `apps/desk/test`, `apps/bench/test` — 179 modules, as declared in
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
- **inputs** — {model, system, prompt, schema, budgetUsd} per call; env CATCH_JUDGE_BIN (default `claude`); row/report/fix-brief texts for prompt building
- **outputs** — exports MODELS and the label vocabularies (TOP/SUB/DISP/ORIGIN/RELATION/SURFACE/VALIDITY), GUIDE/MATCH_GUIDE, labelSchema/matchSchema, sha, callJudge, labelPrompt, validateLabels; callJudge returns {out, cost}
- **effects** — process (spawnSync of the judge CLI with cwd /tmp, 15 min timeout), network (the model call that child makes)
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
- **inputs** — env PI_BENCH_ENTRY, BENCH_PI_ROOT and PI_CODING_AGENT_DIR; the pi binary path and the package.json files found walking up from it
- **outputs** — exports PI_PACKAGE/PI_AI_PACKAGE/PI_MIN_VERSION/REQUIRED_PI_AI/REQUIRED_PI/compareVersions/piRootCandidates/loadPiExports/createPricer; returns {calculateCost, Usage-shaped helpers} and a pricer closure
- **effects** — disk (reads package.json while resolving, dynamic-imports the pi packages)
- **errors** — throws Error when pi cannot be resolved, is older than PI_MIN_VERSION, or is missing a required root export
- **callers** — `apps/bench/run.mjs`, `apps/bench/test/usage.test.mjs`
- **callees** — —

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
- **errors** — exit 1 on a bad invocation or a study that fails to load; a run failure is recorded as data (state fail | harness | grader) rather than thrown; the plan stops on the cumulative budget, on 3 consecutive systemic failures, or on a child that did not die cleanly
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
- **inputs** — lib/catch-extract.mjs, lib/catch-judge.mjs, lib/catch-stats.mjs, the docs/reviews corpus, and stub judge executables
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp dirs, ledger files, reads the review corpus), process (spawns the stub judge executables)
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
- **callers** — `apps/bench/test/catch-ledger.test.mjs`, `apps/bench/test/checkers.test.mjs`, `apps/bench/test/evaluator-hardening.test.mjs`, `apps/bench/test/timeout.test.mjs`
- **callees** — —

### `apps/bench/test/usage.test.mjs`

- **purpose** — Pins stream parsing — tokens, nested tokens, turns, per-tool counts, retries, terminal completion, dangling tool calls, final text and error detection
- **inputs** — lib/usage.mjs, lib/pi-exports.mjs, and captured or constructed event-stream fixtures
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (reads the fixtures)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `apps/bench/lib/pi-exports.mjs`, `apps/bench/lib/usage.mjs`

### `apps/desk/apps.mjs`

- **purpose** — Run one dedicated loopback listener per app manifest, each its own browser origin carrying only the routes a stage page needs.
- **inputs** — the apps dir of <name>.json manifests (default ~/.pi/agent/apps, DESK_APPS_DIR); the desk server's child primitives via `deps`; static `dirs` (kit stage page, /desk-client.mjs, /md.js, /blocks.mjs from packages/nana-stage, an optional manifest `page` dir); env HOME, DESK_READY_BOUND_MS, DESK_DATA_TIMEOUT_MS, DESK_DATA_OUTPUT_CAP
- **outputs** — exports verifiedBlocks/loadManifests/normalizeManifest/writeManifestSession/startAppListeners; serves each app's page plus /api/session, /api/events (SSE), /api/prompt, /api/ui-response, /api/abort, /api/entries, /api/manifest and POST /api/data/<key>; rewrites the manifest's `session` atomically after a spawn
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
- **callers** — `apps/desk/server.mjs`, `apps/desk/test/app-listener.test.mjs`, `apps/desk/test/buffer-caps.test.mjs`, `apps/desk/test/changes-endpoint.test.mjs`, `apps/desk/test/crash-paths.test.mjs`, `apps/desk/test/pi-087-entries.test.mjs`, `apps/desk/test/pi-resolution.test.mjs`, `apps/desk/test/pi-session-parity.test.mjs`, `apps/desk/test/prompt-detach.test.mjs`, `apps/desk/test/spawn-and-persist.test.mjs`, `apps/desk/test/stage-key-persistence.test.mjs`, `apps/desk/test/teardown-invariants.test.mjs`, `packages/nana-pack/tests/agent-dir-parity.test.mjs`
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
- **outputs** — JSON responses and the per-session SSE stream (desk_hello then live RPC events); spawned `pi --mode rpc` children and relayed RPC; writes session_info entries, settings.json, mcp.json, nana-pack.json, agents definitions and context files (each after a .bak copy); session HTML export; the startup URL on stdout
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

- **purpose** — Pin temporary knowledge-home isolation in every real-pi desk E2E harness.
- **inputs** — The real-pi E2E harness sources in this test directory.
- **outputs** — PASS/FAIL checks for each harness's child environment.
- **effects** — disk (reads test source files)
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
- **callers** — `apps/desk/test/app-listener.test.mjs`, `apps/desk/test/buffer-caps.test.mjs`, `apps/desk/test/changes-endpoint.test.mjs`, `apps/desk/test/crash-paths.test.mjs`, `apps/desk/test/host-rule.test.mjs`, `apps/desk/test/pi-087-entries.test.mjs`, `apps/desk/test/pi-resolution.test.mjs`, `apps/desk/test/pi-session-parity.test.mjs`, `apps/desk/test/prompt-detach.test.mjs`, `apps/desk/test/spawn-and-persist.test.mjs`, `apps/desk/test/stage-key-persistence.test.mjs`, `apps/desk/test/teardown-invariants.test.mjs`
- **callees** — —

### `scripts/code-map.mjs`

- **purpose** — Run the project template's code-map generator over this repo, so nana-pi's own map is produced by the tool it ships (G-004, G-007, G-009, G-010, G-011).
- **inputs** — argv (--write | --render | --check | --impact <file...>), code-map.config.json at the repo root, and the modules under its roots
- **outputs** — docs/code-map.md on --write, the summary line plus problem list of --check, the transitive callers and callees of --impact
- **effects** — disk (reads the config and the module sources, writes the map), process (exits non-zero when --check or --write finds a problem)
- **errors** — exit 1 with the problem list when a header is missing or malformed, an import breaks the layer direction, or the map is stale; a thrown Error for a bad config or an unknown mode
- **callers** — `packages/nana-pack/tests/code-map.test.mjs`
- **callees** — —

### `scripts/readme-check.mjs`

- **purpose** — Run the project template's README checker over this repo, so every command, path, flag and script name nana-pi's READMEs state is checked against the repo (G-012).
- **inputs** — argv (--check | --list), readme-check.config.json at the repo root, the READMEs it names, package.json and the files under scripts/
- **outputs** — the claim list on --list, the summary line plus problem list on either mode
- **effects** — disk (reads the READMEs, the files they name and the package metadata), process (exits non-zero when a README claim does not hold)
- **errors** — exit 1 with the problem list naming each README line whose claim fails; bad CLI arguments print usage to stderr and return status 2; a thrown Error for a bad config
- **callers** — `packages/nana-pack/tests/readme-check.test.mjs`
- **callees** — —

### `scripts/requirements-trace.mjs`

- **purpose** — Run the project template's requirements-trace rail over this repo, so every REQUIREMENTS.md row's status is measured against the `req:` markers nana-pi's suites carry.
- **inputs** — REQUIREMENTS.md at the repo root and every *.test.mjs under the six test roots named here
- **outputs** — the summary line, the `ears:` off-form line, plus one problem line per disagreement between a row's status, form or evidence and the markers
- **effects** — disk (reads REQUIREMENTS.md and the test sources), process (exits non-zero when a row and the suite disagree)
- **errors** — exit 1 with the problem list; a thrown Error for a malformed requirements table, a bad requirement id or a marker that sits above no test call
- **callers** — `packages/nana-pack/tests/requirements-trace.test.mjs`
- **callees** — —

### `scripts/test.mjs`

- **purpose** — The canonical test runner — run every collected `*.test.mjs` file in its own process tree with a fresh temp HOME and report one line each.
- **inputs** — argv (--verbose, --self-test, path substrings), env NANA_TEST_SELFTEST and NANA_TEST_TIMEOUT_MS, and the test files directly under each package's tests/ dir, apps/desk/test and apps/bench/test (e2e, studies and fixture dirs excluded)
- **outputs** — one PASS / FAIL / SKIP line per file with its check counts and timing, the first 20 failing lines of a red file in non-verbose mode, a totals line with warnings and the self-test verdict, and the exit code
- **effects** — process (spawns each file as `node --experimental-strip-types` in its own group with a child env scrubbed of every ambient NANA_* but the NANA_TEST_* knobs, and of PI_CODING_AGENT_DIR, kills that group or taskkills the tree on timeout, SIGINT or SIGTERM), disk (a mkdtemp scratch dir, a per-file temp HOME and the self-test fixtures, all removed on every exit path)
- **errors** — exit 1 when any file failed, timed out, died on a signal, matched nothing, or a self-test fixture missed its expected verdict; exit 130 on SIGINT and 143 on SIGTERM; exit 0 otherwise
- **callers** — —
- **callees** — —

## Packages

The pi extension pack, the knowledge pull, the staged-block layer and the setup bootstrap — the installable units. Within the layer imports are free (nana-pi ships as one package); nothing here may reach up into an app.

### `packages/nana-knowledge/bin/nana-knowledge.ts`

- **purpose** — The knowledge CLI — build, query, hook, status and prune over the local index.
- **inputs** — argv (`build [--rebuild]`, `query <text> [--limit N] [--json]`, `hook`, `status`, `prune`), hook JSON on stdin for `hook` (read to at most STDIN_MAX_BYTES), and sources.json plus the index
- **outputs** — per-root build counts and totals, query hits or their JSON, the index/roots status, and the hook's pointer block — all on stdout; usage, the lock message and `no index` on stderr
- **effects** — disk (builds and reads the index, writes the shown files and pull.log), database, process (sets the exit code; `hook` arms a BUDGET_MS unref'd self-exit timer before touching stdin)
- **errors** — exit 2 on a bad or unknown invocation, 1 when `query` finds no index, 0 otherwise — including every `hook` failure (fail-open) and a build that lost the lock
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

- **purpose** — Build the knowledge index incrementally under an atomic build lock, re-indexing only files whose bytes changed.
- **inputs** — the roots from sources.json, the `.md` files under them (≤ MAX_FILE_BYTES, symlinks and SKIP_DIRS skipped), the existing `files` table as the stat/hash cache, and the `rebuild` option
- **outputs** — BuildStats (per-root files/rows/skipped, reindexed, unchanged, removed, preserved, missingRoots, ms, dbBytes), the index's meta rows, the index age in ms, and a doc count
- **effects** — disk (creates and releases build.lock and its reclaim lock, writes index.db and its WAL, deletes the db files on rebuild, prunes shown/ past its TTL), database (docs/files writes in 500-row transactions, a WAL truncate checkpoint)
- **errors** — BuildLockedError when another live builder holds the lock; node:sqlite's own throws on an unusable database; an unreadable source file or missing root is skipped, never purged
- **callers** — `packages/nana-knowledge/bin/nana-knowledge.ts`, `packages/nana-knowledge/lib/hook.ts`, `packages/nana-knowledge/tests/discovery.test.mjs`, `packages/nana-knowledge/tests/extension.test.mjs`, `packages/nana-knowledge/tests/hook.test.mjs`, `packages/nana-knowledge/tests/incremental-build.test.mjs`, `packages/nana-knowledge/tests/render.test.mjs`
- **callees** — `packages/nana-knowledge/lib/db.ts`, `packages/nana-knowledge/lib/parse.ts`, `packages/nana-knowledge/lib/paths.ts`, `packages/nana-knowledge/lib/sources.ts`

### `packages/nana-knowledge/lib/db.ts`

- **purpose** — Open the node:sqlite knowledge database, create its FTS5 schema on the build path, and read or write the meta table.
- **inputs** — the database file path and {create, readonly}; node:sqlite imported dynamically with its SQLite ExperimentalWarning muted
- **outputs** — a Db handle (exec / prepare / close), a meta value or null, and SCHEMA_VERSION
- **effects** — disk (mkdirs the parent and creates the database file on the create path), database (WAL pragmas, the docs/files/docs_fts schema and its triggers, meta upserts)
- **errors** — openDb rejects with whatever node:sqlite throws (absent file, unreadable, locked); getMeta swallows and returns null
- **callers** — `packages/nana-knowledge/bin/nana-knowledge.ts`, `packages/nana-knowledge/lib/build.ts`, `packages/nana-knowledge/lib/hook.ts`, `packages/nana-knowledge/lib/query.ts`, `packages/nana-knowledge/tests/discovery.test.mjs`, `packages/nana-knowledge/tests/incremental-build.test.mjs`
- **callees** — —

### `packages/nana-knowledge/lib/hook.ts`

- **purpose** — One prompt-time knowledge pull — the block of pointers to print for a prompt, or nothing.
- **inputs** — the hook JSON on stdin as a string (prompt, session_id, cwd, source / hook_event_name), the index at paths.db, and the per-session shown file
- **outputs** — HookResult {output, reason, hits} whose output is the `[nana:knowledge]` block (header plus one pointer line per hit, ≤ BLOCK_MAX_CHARS) or null; writes the session's shown keys and one JSON line to pull.log
- **effects** — disk (reads the index, writes shown/<session>.json, appends pull.log), database (the BM25 search), process (spawns a detached, unref'd rebuild when the index is older than STALE_MS)
- **errors** — none — every failure is a named reason instead of output: bad-json, bad-input, a skipReason, no-index(<freshness>), budget, db-open-failed, no-hits, all-shown, empty-block
- **callers** — `packages/nana-knowledge/bin/nana-knowledge.ts`, `packages/nana-knowledge/tests/hook.test.mjs`, `packages/nana-knowledge/tests/render.test.mjs`
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
- **callers** — `packages/nana-knowledge/bin/nana-knowledge.ts`, `packages/nana-knowledge/lib/build.ts`, `packages/nana-knowledge/lib/hook.ts`, `packages/nana-knowledge/lib/query.ts`, `packages/nana-knowledge/lib/sources.ts`
- **callees** — —

### `packages/nana-knowledge/lib/query.ts`

- **purpose** — BM25 search over the index, rendered as the bounded pointer fields a prompt can carry safely.
- **inputs** — an open Db handle, the query text, and a row limit
- **outputs** — Hit records {key, path, display, loc, kind, title, snippet, score} whose every field is one line, capped (TITLE_MAX / DISPLAY_MAX / SNIPPET_MAX) and free of the literal FIELD_SEP, the display path exact or reversibly JSON-escaped
- **effects** — database (one SELECT over docs_fts joined to docs)
- **errors** — none — a failing MATCH yields no hits, and a row that cannot be rendered loses only its own pointer
- **callers** — `packages/nana-knowledge/bin/nana-knowledge.ts`, `packages/nana-knowledge/lib/hook.ts`, `packages/nana-knowledge/tests/discovery.test.mjs`, `packages/nana-knowledge/tests/incremental-build.test.mjs`, `packages/nana-knowledge/tests/render.test.mjs`
- **callees** — `packages/nana-knowledge/lib/db.ts`, `packages/nana-knowledge/lib/paths.ts`, `packages/nana-knowledge/lib/tokenize.ts`, `packages/nana-pack/lib/display.mjs`

### `packages/nana-knowledge/lib/sources.ts`

- **purpose** — Resolve which knowledge roots to index, seeding sources.json on first run and discovering roots by convention.
- **inputs** — sources.json at paths.sources (`roots` plus an optional `discover` block), os.homedir(), and the directory entries of every configured parent
- **outputs** — the de-nested, de-duplicated root list (explicit roots first, then discovered ones) with the extra skip names, plus DEFAULT_DISCOVER and SKIP_DIRS
- **effects** — disk (reads sources.json, readdirs each parent and stats each candidate subdir; writes a seeded sources.json when the file is absent)
- **errors** — none — bad JSON yields no roots, and a missing parent, missing subdir or unwritable home is skipped silently
- **callers** — `packages/nana-knowledge/bin/nana-knowledge.ts`, `packages/nana-knowledge/lib/build.ts`, `packages/nana-knowledge/tests/discovery.test.mjs`
- **callees** — `packages/nana-knowledge/lib/paths.ts`

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
- **callees** — `packages/nana-knowledge/lib/build.ts`, `packages/nana-knowledge/lib/db.ts`, `packages/nana-knowledge/lib/query.ts`, `packages/nana-knowledge/lib/sources.ts`, `packages/nana-knowledge/tests/tmp-dir.mjs`

### `packages/nana-knowledge/tests/extension.test.mjs`

- **purpose** — Pins that the pi extension is ONE thin wrapper around the hook CLI — fail-open on every child failure, never a reject out of before_agent_start, and no sqlite inside pi's process
- **inputs** — extensions/nana-knowledge.ts, bin/nana-knowledge.ts, and a temp NANA_KNOWLEDGE_HOME with a markdown source tree
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp home, source tree and index), process (sets NANA_KNOWLEDGE_HOME, spawns the hook CLI)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-knowledge/lib/build.ts`, `packages/nana-knowledge/lib/tokenize.ts`, `packages/nana-knowledge/tests/tmp-dir.mjs`

### `packages/nana-knowledge/tests/hook.test.mjs`

- **purpose** — Pins that the prompt hook is fail-open, bounded and never repeats a pointer inside one session, since it runs on every prompt the owner types
- **inputs** — bin/nana-knowledge.ts, markdown sources and an index under a temp NANA_KNOWLEDGE_HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp home, source tree and index), process (sets NANA_KNOWLEDGE_HOME, spawns the hook CLI)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-knowledge/lib/build.ts`, `packages/nana-knowledge/lib/hook.ts`, `packages/nana-knowledge/tests/tmp-dir.mjs`

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

### `packages/nana-knowledge/tests/render.test.mjs`

- **purpose** — Pins that every knowledge pointer reaches the prompt through nana-pack's ONE renderer, asserted on rendered output because titles and paths come from other people's repositories
- **inputs** — the knowledge query and render path under lib/, nana-pack's lib/display.mjs, and hostile titles, snippets and filenames in a temp source tree
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp source tree and index under a temp home), process (sets NANA_KNOWLEDGE_HOME)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-knowledge/lib/build.ts`, `packages/nana-knowledge/lib/hook.ts`, `packages/nana-knowledge/lib/query.ts`, `packages/nana-knowledge/tests/tmp-dir.mjs`

### `packages/nana-knowledge/tests/tmp-dir.mjs`

- **purpose** — Create test temporary roots and remove them when the test process exits.
- **inputs** — A mkdtemp prefix.
- **outputs** — The created temporary directory path.
- **effects** — disk (creates and removes temporary directories), process (registers exit cleanup)
- **errors** — Propagates directory creation errors and ignores cleanup errors.
- **callers** — `packages/nana-knowledge/tests/discovery.test.mjs`, `packages/nana-knowledge/tests/extension.test.mjs`, `packages/nana-knowledge/tests/hook.test.mjs`, `packages/nana-knowledge/tests/incremental-build.test.mjs`, `packages/nana-knowledge/tests/ledger-parse.test.mjs`, `packages/nana-knowledge/tests/render.test.mjs`
- **callees** — —

### `packages/nana-knowledge/tests/tokenize.test.mjs`

- **purpose** — Pins what the prompt hook decides to search on and what it refuses to search on at all
- **inputs** — lib/tokenize.ts
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — none
- **errors** — a failed check prints FAIL and the run exits 1
- **callers** — —
- **callees** — `packages/nana-knowledge/lib/tokenize.ts`

### `packages/nana-pack/bin/nana-adoption.mjs`

- **purpose** — Print the seat's session-start block of git repositories a session ran in that nobody has adopted.
- **inputs** — argv (`--cwd <dir>` accepted and unused), the tail of the journal named by lib/adoption.mjs adoptionSettings, and each claimed root's current state on disk
- **outputs** — `[nana:adoption]` plus the Markdown block on stdout (paths as code spans, at most SHOW rows, then a refused-entry count), an `ADOPTION UNAVAILABLE` line when the journal exists but cannot be read, and nothing when nothing is open
- **effects** — disk (reads the journal tail, stats each claimed root and its ancestors)
- **errors** — none — always exits 0; a journal or reader failure prints the ADOPTION UNAVAILABLE line instead of a stack
- **callers** — —
- **callees** — `packages/nana-pack/lib/adoption.mjs`, `packages/nana-pack/lib/display.mjs`

### `packages/nana-pack/bin/nana-objective.mjs`

- **purpose** — Print the objective block for a session cwd as the Claude Code SessionStart hook's producer.
- **inputs** — argv (`--cwd <dir>`, default process.cwd()), process.versions.node, and the user-scope objective settings read through lib/config.ts loadUserObjective
- **outputs** — `[nana:objective]` plus lib/objective.ts's block on stdout, and nothing at all when objective.enabled is false
- **effects** — disk (lib/objective.ts reads the objective files and the trust store)
- **errors** — none — always exits 0; a Node older than 22.18 or a failed dynamic import prints an `OBJECTIVE UNAVAILABLE` marker naming the cause
- **callers** — —
- **callees** — `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/objective.ts`

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
- **inputs** — argv (--out, --item, --tree, --role, --revision, --over-cap, --stall-secs, --retries, --poll, then `--` and the pi args), the user-scope review ledger, and the reviewed tree's git revision
- **outputs** — the review text written to --out, a round recorded in the ledger, and the admission note, warnings and a SUCCESS / FAILED line on stderr
- **effects** — disk (writes --out plus the ledger's reservation, tally and audit files), process (the watchdog's `pi` child, the reservation heartbeat, the exit code)
- **errors** — exit 1 when admission is refused (over the cap, a git failure, a bad --out, bad args), when every attempt stalled or failed, or when the round could not be recorded; exit 0 otherwise
- **callers** — —
- **callees** — `packages/nana-pack/bin/pi-watchdog.mjs`, `packages/nana-pack/bin/review-round.mjs`, `packages/nana-pack/bin/review-shape.mjs`

### `packages/nana-pack/bin/pi-watchdog.mjs`

- **purpose** — Run `pi` under a CPU-liveness watchdog that kills and retries attempts whose CPU time stays flat and cleans up child trees on termination signals.
- **inputs** — the launcher's argv before `--` (--out, --stall-secs, --retries, --poll) and the pi args after it, the child's CPU seconds from `ps` or PowerShell, and the caller's accept(text) predicate
- **outputs** — {ok, text, attempt} with captured output, signal-aborted status, per-poll `cpu=…s flat=n/m`, STALL and attempt lines on stderr, the RETRIES_NOTICE string, or a parse {error}
- **effects** — process (spawns `pi` detached per attempt with NANA_HANDOFF=off, kills its process tree on a stall or signal, shells out to ps via execSync), disk (a mkdtemp dir per attempt holding the child's stdout and stderr)
- **errors** — never throws — a bad invocation returns {error:'usage'} or a named message for a non-positive --stall-secs/--poll or a non-whole --retries, and a spawn failure or stall returns ok:false with the partial text
- **callers** — `packages/nana-pack/bin/pi-review.mjs`, `packages/nana-pack/bin/pi-worker.mjs`
- **callees** — —

### `packages/nana-pack/bin/pi-worker.mjs`

- **purpose** — Run a `pi` WORKER under the liveness watchdog, touching no review ledger and not retrying by default.
- **inputs** — argv (--out, --stall-secs, --retries, --poll, then `--` and the pi args)
- **outputs** — the worker's output written to --out (partial output included), plus usage, the explicit-retries notices and a SUCCESS / FAILED line on stderr
- **effects** — disk (writes --out), process (the watchdog's `pi` child and this process's exit code)
- **errors** — exit 1 on bad args, on any review-only flag (--item, --role, --revision, --over-cap, --worker) and when every attempt failed; exit 0 when an attempt produced output
- **callers** — —
- **callees** — `packages/nana-pack/bin/pi-watchdog.mjs`

### `packages/nana-pack/bin/review-ledger.mjs`

- **purpose** — The review round cap as a hook for any launcher — `run` reserves a round around a command and records its verdict, `check` asks whether one would be admitted.
- **inputs** — argv (`run --item <slug> --out <file> [--tree <path>] [--role R] [--revision R] [--over-cap WHY] -- <cmd...>` or `check --item <slug> [--tree <path>] [--revision R]`), the reviewed tree's git state, and the user-scope review ledger
- **outputs** — the child's stdout written to --out, a recorded round, the projection note on stdout for `check`, and the admission note, warnings and refusals on stderr
- **effects** — process (spawns the review command with stdout piped, runs the reservation heartbeat, sets the exit code), disk (writes --out and the ledger's lock, reservation, tally and audit files)
- **errors** — exit 1 on a bad subcommand, a missing --out or `--`, a `--over-cap` on check, a refused admission, an unwritable --out, or a non-zero / non-review-shaped result (the reservation is returned and no round consumed); exit 0 otherwise
- **callers** — —
- **callees** — `packages/nana-pack/bin/review-round.mjs`, `packages/nana-pack/bin/review-shape.mjs`

### `packages/nana-pack/bin/review-round.mjs`

- **purpose** — The review round ledger — admit, project, complete and release one per-item review round under a user-scope lock.
- **inputs** — a launcher's own argv (--item, --tree, --revision, --role, --out, --over-cap), the reviewed tree's git state (common dir, HEAD, tracked and non-ignored untracked content), stdout/stderr file identities, env NANA_REVIEW_RES_STALE_MS, and the ledger files under ~/.pi/agent
- **outputs** — an admission or refusal with its note and warning, a reservation file, a round appended to the tally, audit lines (rotated past LEDGER_MAX_BYTES), a heartbeat stopper, and the projected round number
- **effects** — disk (an O_EXCL lock around every read-decide-write, reservation files, the never-rotated tally and the rotated audit log), process (spawns git through spawnSync, runs a renewing heartbeat interval)
- **errors** — canonicalItem throws on a slug that is empty, over SLUG_MAX, holds a separator, `..` or a control character; admit / project / complete return {ok:false, message} for a missing --item, a tree outside git, an in-tree output redirect, an over-cap revision, a git failure, a tracked --out, a malformed tally line, a non-regular ledger or lock path, or a lost reservation
- **callers** — `packages/nana-pack/bin/pi-review.mjs`, `packages/nana-pack/bin/review-ledger.mjs`, `packages/nana-pack/tests/agent-dir-config.test.mjs`, `packages/nana-pack/tests/review-round.test.mjs`
- **callees** — `packages/nana-pack/bin/review-shape.mjs`

### `packages/nana-pack/bin/review-shape.mjs`

- **purpose** — Decide whether produced output is review-shaped.
- **inputs** — the candidate review text
- **outputs** — true when a physical line begins with optional non-word characters followed by case-sensitive VERDICT
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-pack/bin/pi-review.mjs`, `packages/nana-pack/bin/review-ledger.mjs`, `packages/nana-pack/bin/review-round.mjs`
- **callees** — —

### `packages/nana-pack/extensions/nana-gate.ts`

- **purpose** — Gate every bash or powershell command and every edit or write path against the session's ratcheted gate policy.
- **inputs** — pi `tool_call` and `session_start` events (toolName, input.command / input.path, reason), the gate block of the live config, and ctx (cwd, hasUI, ui)
- **outputs** — a {block, reason} verdict or undefined, an interactive Block / Allow once dialog showing the subject through the shared renderers, a running `gate ✓ N checked · M gated` status, and `gate_policy_widened` / `config_invalid` journal lines
- **effects** — disk (appends the journal, realpaths candidate paths via gate-paths), process (the adopted-policy map lives on globalThis so widening is seen across extension copies)
- **errors** — never throws — a failed policy load becomes a stopReason and a failed analysis becomes the hit `gate analysis failed`, and both block; headless hits block fail-closed
- **callers** — `packages/nana-pack/tests/agent-dir-config.test.mjs`, `packages/nana-pack/tests/display-surfaces.test.mjs`, `packages/nana-pack/tests/gate-config-robustness.test.mjs`, `packages/nana-pack/tests/gate-corpus.test.mjs`, `packages/nana-pack/tests/gate-policy-paths.test.mjs`, `packages/nana-pack/tests/gate-self-protection.test.mjs`, `packages/nana-pack/tests/gate-status.test.mjs`
- **callees** — `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/gate-paths.ts`, `packages/nana-pack/lib/gate-shell.ts`, `packages/nana-pack/lib/objective.ts`

### `packages/nana-pack/extensions/nana-handoff.ts`

- **purpose** — Carry a compaction summary across sessions through the user-scope handoff store, injecting it only into a fresh session in the same directory.
- **inputs** — pi `session_start` / `before_agent_start` / `session_compact` events (reason, compactionEntry.summary, systemPromptOptions.sections), the handoff config block, env NANA_HANDOFF, and the store file for the canonical cwd (or an ancestor's, or a configured path)
- **outputs** — a labelled handoff block in the nana-handoff system-prompt section (≤ INJECT_CAP) or a bounded pointer line (≤ POINTER_CAP) when it is stale, an ancestor's or a legacy repo file, the summary written atomically to the store, and journal lines (handoff_pickup_failed, handoff_skipped_role, handoff_legacy_ignored, handoff_legacy_write_refused, directory_unadopted)
- **effects** — disk (reads the store, writes it temp-file-plus-rename, lstats the configured path and the repo root, appends the journal)
- **errors** — never throws — every pickup or write failure, invalid UTF-8 included, degrades to no handoff plus one journal line
- **callers** — `packages/nana-pack/tests/adoption-producer.test.mjs`, `packages/nana-pack/tests/display-surfaces.test.mjs`, `packages/nana-pack/tests/handoff-artifact.test.mjs`, `packages/nana-pack/tests/handoff-staleness.test.mjs`, `packages/nana-pack/tests/handoff-store.test.mjs`, `packages/nana-pack/tests/handoff-symlink.test.mjs`, `packages/nana-pack/tests/handoff-trust.test.mjs`, `packages/nana-pack/tests/handoff-writer-role.test.mjs`, `packages/nana-pack/tests/writing-injection.test.mjs`
- **callees** — `packages/nana-pack/lib/adoption.mjs`, `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/display.mjs`, `packages/nana-pack/lib/prompt-sections.mjs`

### `packages/nana-pack/extensions/nana-lifecycle.ts`

- **purpose** — Journal session lifecycle events, surface compaction in the UI, and own the /reload-runtime command.
- **inputs** — pi `session_start`, `session_before_compact`, `session_compact`, `session_compact_failed` and `session_shutdown` events, the /reload-runtime invocation, the loaded config, and ctx (cwd, hasUI, ui)
- **outputs** — one JSONL journal line per event (ts, event, cwd, pid, reason), a dim `nana-pack ✓` footer status, compaction info/error notifications, and a reloaded runtime
- **effects** — disk (appends the journal through lib/config.ts), process (primeNanaTrust imports pi's trust module; ctx.reload() re-reads settings.json and re-discovers extensions, skills, prompts and context files)
- **errors** — none of its own — appendJournal is best-effort, and a ctx.reload() failure propagates to pi's command handler
- **callers** — `packages/nana-pack/tests/lifecycle-reload.test.mjs`
- **callees** — `packages/nana-pack/lib/config.ts`

### `packages/nana-pack/extensions/nana-notify.ts`

- **purpose** — Notify the owner on the desktop when the agent settles, falling back in-app when the OS notifier fails.
- **inputs** — pi `agent_settled` and `ui_prompt_start` events, the notify config block (enabled, headless), ctx.mode, ctx.hasUI, and process.platform
- **outputs** — an osascript notification, a PowerShell toast or a TUI-only OSC 777 sequence, an in-app ctx.ui.notify on failure, and a `notify_fallback` journal line carrying the reason
- **effects** — process (spawns osascript or powershell.exe under NOTIFIER_TIMEOUT_MS), disk (appends the journal)
- **errors** — none — notifierFailure classifies a spawn failure, a non-zero exit, the deadline kill and a PowerShell error record printed on an exit-0 run, each as the fallback's reason
- **callers** — `packages/nana-pack/tests/notify-fallback.test.mjs`
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
- **inputs** — pi `tool_result` events for edit/write (input.path, isError), the postEdit.commands and receipts config, pi's file-mutation queue, and ctx (cwd, signal, hasUI, ui)
- **outputs** — one bounded failure line per failing check appended to the tool result, a post-edit UI status naming the worst outcome, one content-bound receipt per check, and `postedit_file_queue_unavailable` journal lines
- **effects** — process (spawns each check in a shell under its timeoutMs, then SIGTERM and SIGKILL over its tree), disk (hashes the declared inputs before and after, writes receipts, appends the journal)
- **errors** — never throws — each check is classified checks_passed / checks_failed / error / timeout / not_run plus a `lock` refusal, and a malformed command entry or bad match regex is skipped
- **callers** — `packages/nana-pack/tests/display-surfaces.test.mjs`, `packages/nana-pack/tests/post-edit-file-queue.test.mjs`, `packages/nana-pack/tests/post-edit-hardening.test.mjs`, `packages/nana-pack/tests/post-edit-status.test.mjs`, `packages/nana-pack/tests/receipt-binding.test.mjs`
- **callees** — `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/display.mjs`, `packages/nana-pack/lib/gate-paths.ts`, `packages/nana-pack/lib/receipts.ts`

### `packages/nana-pack/extensions/nana-writing.ts`

- **purpose** — Append the "Writing for Jake" rule to every session's system prompt, read fresh at every session_start so a reload picks up an edit — the seventh pack extension.
- **inputs** — pi `session_start` (every reason) and `before_agent_start` events; an injectable rule path (opts.rulePath, defaulting to the shipped packages/nana-pack/rules/nana-writing.md); ctx (cwd)
- **outputs** — the rule block appended under "## Writing for Jake (nana)"; one journal line (writing_rule_unavailable) when the file is missing, not a regular file, unreadable, or when the bytes actually read are not valid UTF-8 — a bounded read never speaks to an unread remainder, so that is the full extent of the claim, not whole-file validation
- **effects** — disk (stats and bounded-reads the rule file; appends the journal)
- **errors** — none — the handler swallows everything; an unusable rule injects nothing rather than throwing, hanging or exhausting memory
- **callers** — —
- **callees** — `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/prompt-sections.mjs`, `packages/nana-pack/lib/writing-config.mjs`

### `packages/nana-pack/lib/adoption.mjs`

- **purpose** — The one adoption predicate — the handoff store's location, whether a repository root has been adopted, and which `directory_unadopted` reports are printable.
- **inputs** — a directory path, user-scope nana-pack.json in pi's active agent dir, os.homedir(), the tail of the adoption journal, and each root's own entries (`.git`, the objective file, AGENTS.md, docs/sessions, the dismissal marker), and the declared NANA_TEST_TEMP_ROOTS test seam (path-delimited; empty disables skipping)
- **outputs** — the store dir and the per-root store path, the adoption settings (journal path, objective file name), a root's state with its isAdopted verdict, the journal's tail lines, and the newest report per canonical root with a `dropped` count of refused claims
- **effects** — disk (reads nana-pack.json and the journal tail, lstats / stats the handed-in root and its ancestors)
- **errors** — tailLines rethrows the fs error for a journal that exists but is not a readable regular file (ENOTFILE for a non-file); an absent journal is [] and every other function is total
- **callers** — `packages/nana-pack/bin/nana-adoption.mjs`, `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/tests/adoption-producer.test.mjs`, `packages/nana-pack/tests/adoption-reader.test.mjs`, `packages/nana-pack/tests/display-surfaces.test.mjs`
- **callees** — `packages/nana-pack/lib/agent-dir.mjs`, `packages/nana-pack/lib/display.mjs`

### `packages/nana-pack/lib/agent-dir.mjs`

- **purpose** — Resolve pi's ACTIVE agent dir exactly as pi does, and flag a PI_CODING_AGENT_DIR that stays cwd-relative.
- **inputs** — env PI_CODING_AGENT_DIR, os.homedir(), process.platform, process.cwd()
- **outputs** — the resolved agent dir, pi's normalizePath result for any input (win32 shell path, `~`, file://), and whether the configured value resolves per-process
- **effects** — none
- **errors** — none — every function is total and returns a value even when process.cwd() no longer exists
- **callers** — `apps/desk/server.mjs`, `packages/nana-pack/lib/adoption.mjs`, `packages/nana-pack/lib/gate-paths.ts`, `packages/nana-setup/lib/paths.mjs`
- **callees** — —

### `packages/nana-pack/lib/config.ts`

- **purpose** — Load, normalize and merge the nana-pack user and project config into a fully typed value no file bytes can make throw.
- **inputs** — <pi's active agent dir>/nana-pack.json (user scope) and <cwd>/.pi/nana-pack.json (project scope, nana-trusted only), pi's trust module and trust.json, and the extension ctx (cwd, isProjectTrusted, hasUI, ui, sessionManager)
- **outputs** — a NanaPackConfig (gate, postEdit, notify, journal, handoff, objective, receipts) with gate.stopReason set when a gate block is unusable, the resolved journal file path, compiled allow/extra/protected regexes, and the user-scope objective block alone
- **effects** — disk (reads both config files, lstats a symlinked one, reads pi's trust store, appends the journal), process (dynamically imports pi's trust module; keeps the per-session dedupe, trust decisions and last-valid gate on globalThis)
- **errors** — never throws — a malformed leaf falls back and is surfaced once per session as a `config_invalid` or `config_agent_dir_mismatch` journal line plus one UI warning, and a malformed gate block with no last-good policy yields gate.stopReason, which blocks every gated tool
- **callers** — `packages/nana-pack/bin/nana-objective.mjs`, `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/extensions/nana-lifecycle.ts`, `packages/nana-pack/extensions/nana-notify.ts`, `packages/nana-pack/extensions/nana-objective.ts`, `packages/nana-pack/extensions/nana-post-edit.ts`, `packages/nana-pack/extensions/nana-writing.ts`, `packages/nana-pack/lib/receipts.ts`, `packages/nana-pack/tests/adoption-producer.test.mjs`, `packages/nana-pack/tests/agent-dir-config.test.mjs`, `packages/nana-pack/tests/config-display-text.test.mjs`, `packages/nana-pack/tests/config-normalize.test.mjs`, `packages/nana-pack/tests/config-trust.test.mjs`, `packages/nana-pack/tests/gate-survives-mutation.test.mjs`, `packages/nana-pack/tests/handoff-trust.test.mjs`, `packages/nana-pack/tests/objective-injection.test.mjs`, `packages/nana-pack/tests/post-edit-file-queue.test.mjs`, `packages/nana-pack/tests/post-edit-hardening.test.mjs`, `packages/nana-pack/tests/receipt-binding.test.mjs`
- **callees** — `packages/nana-pack/lib/gate-paths.ts`, `packages/nana-pack/lib/objective.ts`

### `packages/nana-pack/lib/display.mjs`

- **purpose** — THE renderers for every repo-controlled string nana-pack puts into a prompt, the UI, Markdown or a file it writes.
- **inputs** — any value (string or not), an optional length cap, and an optional set of extra characters to treat as unsafe
- **outputs** — one bounded rendering per surface — promptPath/uiPath (one line, JSON-escaped when unsafe, ≤ PATH_CAP, middle-elided), promptText/uiText/fileField (controls, breaks and bidi marks replaced by a space), codeSpan (or null when it would close the span), locator ({text, escaped}, exact and never elided)
- **effects** — none
- **errors** — none — every renderer is total: an unprintable value renders as `[unprintable]`, and an unsafe code span is refused with null rather than escaped
- **callers** — `packages/nana-knowledge/lib/hook.ts`, `packages/nana-knowledge/lib/query.ts`, `packages/nana-pack/bin/nana-adoption.mjs`, `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/extensions/nana-post-edit.ts`, `packages/nana-pack/lib/adoption.mjs`, `packages/nana-pack/lib/objective.ts`, `packages/nana-pack/tests/display-surfaces.test.mjs`
- **callees** — —

### `packages/nana-pack/lib/gate-paths.ts`

- **purpose** — Resolve tool paths the way pi does, and recognise the POLICY files that sit on the gate's floor.
- **inputs** — a tool path or a shell command plus the session cwd, env PI_CODING_AGENT_DIR, and the filesystem (realpath, readlink and lstat of the candidates, of both agent dirs and of their policy files)
- **outputs** — pi's resolution of an edit/write path, every candidate form of it, the policy file a candidate set or a command word lands on (or null), and pi's active trust store path
- **effects** — disk (realpath / readlink / lstat of candidate paths, the agent dirs and their nana-pack.json and trust.json)
- **errors** — none — every function is total and degrades to the raw input or to null
- **callers** — `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/extensions/nana-post-edit.ts`, `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/objective.ts`, `packages/nana-pack/lib/receipts.ts`, `packages/nana-pack/tests/agent-dir-config.test.mjs`, `packages/nana-pack/tests/agent-dir-parity.test.mjs`, `packages/nana-pack/tests/agent-dir-var-spellings.test.mjs`, `packages/nana-pack/tests/gate-self-protection.test.mjs`, `packages/nana-pack/tests/post-edit-hardening.test.mjs`
- **callees** — `packages/nana-pack/lib/agent-dir.mjs`

### `packages/nana-pack/lib/gate-shell.ts`

- **purpose** — Segment a shell command and name its destructive forms for nana-gate.
- **inputs** — a command string, or one Segment {text, piped} for segmentDanger
- **outputs** — quote-aware exec segments with a `segmentable` verdict, quote-unaware detection segments, the dequoted tokens, and a Danger {reason, floor} or null
- **effects** — none
- **errors** — none — an unbalanced quote or an unsegmentable construct sets segmentable:false, and an internal failure comes back as the non-floor danger `unparseable segment`
- **callers** — `packages/nana-pack/extensions/nana-gate.ts`
- **callees** — —

### `packages/nana-pack/lib/objective.ts`

- **purpose** — THE objective producer — resolve the governing objective file and render the exact block both runtimes print.
- **inputs** — the session cwd, the user-scope objective settings (path, projectFile), the nearest OBJECTIVE.md walking up from cwd, and pi's active agent dir with its trust store, that store's folder, permissions and lock
- **outputs** — ObjectiveResult {text, unavailable, events, notices} — the heading, the **Objective and **Current priority lines (one physical line each, ≤ LINE_CAP), the provenance label, the precedence note and remedy, or an `OBJECTIVE UNAVAILABLE` marker; the whole text is ≤ OUTPUT_CAP and ends in exactly one newline
- **effects** — disk (bounded sync reads of at most FILE_READ_MAX bytes per file, plus lstat / stat / access of the objective files, the trust store, its folder and its lock)
- **errors** — none — produceObjective never throws; an unreadable or symlink-reached file, a missing line, invalid UTF-8 or an internal error each become a named marker plus a journal event and a UI notice
- **callers** — `packages/nana-pack/bin/nana-objective.mjs`, `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/extensions/nana-objective.ts`, `packages/nana-pack/lib/config.ts`, `packages/nana-pack/tests/adoption-producer.test.mjs`, `packages/nana-pack/tests/config-display-text.test.mjs`, `packages/nana-pack/tests/display-surfaces.test.mjs`, `packages/nana-pack/tests/objective-golden.test.mjs`, `packages/nana-pack/tests/writing-injection.test.mjs`, `packages/nana-setup/tests/doctor-detail.test.mjs`
- **callees** — `packages/nana-pack/lib/display.mjs`, `packages/nana-pack/lib/gate-paths.ts`

### `packages/nana-pack/lib/prompt-sections.mjs`

- **purpose** — Rebuild prompt section order so Nana sections compose consistently regardless of extension load order.
- **inputs** — a pi before_agent_start event whose sections contain Nana and other named sections
- **outputs** — the same sections object with canonical Nana keys and foreign keys kept relatively ordered
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/extensions/nana-objective.ts`, `packages/nana-pack/extensions/nana-writing.ts`
- **callees** — —

### `packages/nana-pack/lib/receipts.ts`

- **purpose** — Record and read content-bound evidence that a configured post-edit check ran over specific file bytes.
- **inputs** — the nana-pack config (receipts.enabled, receipts.dir), the repo root and checker template as keys, a CheckReceipt to store, and the declared input files' bytes
- **outputs** — the receipts dir and per-(repo, checker) receipt path, a sha256 digest over the sorted declared inputs with their per-file entries, the receipt JSON on disk, the parsed receipt, and a `current` / `stale` freshness verdict
- **effects** — disk (reads and realpaths the declared inputs, mkdirs the receipt dir, writes and reads the receipt JSON)
- **errors** — none — a write failure is swallowed (best-effort by design), an unreadable or vanished input yields null or `stale`, and a status outside the enum is forced to not_run
- **callers** — `packages/nana-pack/extensions/nana-post-edit.ts`, `packages/nana-pack/tests/agent-dir-config.test.mjs`, `packages/nana-pack/tests/post-edit-file-queue.test.mjs`, `packages/nana-pack/tests/post-edit-hardening.test.mjs`, `packages/nana-pack/tests/receipt-binding.test.mjs`
- **callees** — `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/gate-paths.ts`

### `packages/nana-pack/lib/writing-check.mjs`

- **purpose** — The pure checks behind the writing checker: extract Markdown-aware prose blocks and find every length, passive-candidate, banned-word, verdict and identifier finding, plus the summary line.
- **inputs** — a label and its text (checkText); an array of per-input results (summaryLine); --report on/off
- **outputs** — per input, {label, findings, stats}; one aggregate summary line string over every input checked
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-pack/bin/nana-writing.mjs`, `packages/nana-pack/tests/writing-check.test.mjs`, `packages/nana-setup/tests/writing-rule.test.mjs`
- **callees** — `packages/nana-pack/lib/writing-config.mjs`

### `packages/nana-pack/lib/writing-config.mjs`

- **purpose** — Every tunable the writing checker reads, each defined once with its provenance (G-001, G-002), so no inline literal appears at a point of use.
- **inputs** — none — pure constants
- **outputs** — SENTENCE_CAP, PASSIVE, PASSIVE_EXCEPTIONS, VERDICT_WORDS, BANNED_WORDS, IDENTIFIER_CODE_SPAN, IDENTIFIER_PATH, MIN_SENTENCE_WORDS, WRITING_INJECT_CAP
- **effects** — none
- **errors** — none
- **callers** — `packages/nana-pack/extensions/nana-writing.ts`, `packages/nana-pack/lib/writing-check.mjs`, `packages/nana-pack/tests/writing-check.test.mjs`, `packages/nana-pack/tests/writing-injection.test.mjs`
- **callees** — —

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

- **purpose** — Pins that nana-pack's user-scope resources follow pi's active agent dir for an absolute, a relative and a tilde PI_CODING_AGENT_DIR, each naming a symlinked dir
- **inputs** — extensions/nana-gate.ts, lib/config.ts, lib/gate-paths.ts, nana-pack.json at both agent dirs under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME and symlinked agent dirs), process (sets HOME and PI_CODING_AGENT_DIR, changes the process cwd)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/bin/review-round.mjs`, `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/gate-paths.ts`, `packages/nana-pack/lib/receipts.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

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
- **callees** — `apps/desk/pi-session.mjs`, `packages/nana-pack/lib/gate-paths.ts`, `packages/nana-pack/tests/tmp-dir.mjs`, `packages/nana-setup/lib/paths.mjs`

### `packages/nana-pack/tests/agent-dir-var-spellings.test.mjs`

- **purpose** — Pins that the agent-dir variable rule catches exactly the four documented balanced spellings, case-insensitively, for both policy files and both separators
- **inputs** — lib/gate-paths.ts and a temp dir standing in for the active agent dir
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (a temp dir), process (sets PI_CODING_AGENT_DIR)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/lib/gate-paths.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/code-map.test.mjs`

- **purpose** — Holds nana-pi to the code-map rule it ships — every mapped module carries a contract header, the map on disk is current, the layer direction holds, and a test module is covered like any other
- **inputs** — scripts/code-map.mjs, code-map.config.json, docs/code-map.md and the modules under the configured roots
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (reads this checkout; writes a scratch copy of one test module for the mutation check), process (runs the map CLI and a syntax check as child processes)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`, `scripts/code-map.mjs`

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
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/config-handlers-malformed.test.mjs`

- **purpose** — Pins that every registered nana-pack handler survives every malformed user config without throwing, while the gate still blocks and the problem is journaled once
- **inputs** — the seven extensions under extensions/, malformed nana-pack.json variants, and a fresh temp HOME and workspace per variant
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOMEs, config files and workspaces), process (sets HOME and USERPROFILE)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/config-normalize.test.mjs`

- **purpose** — Pins that loadConfig never throws for any bytes and always returns a fully typed config, with the user gate block the one leaf that never falls back to a default
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
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/config-trust.test.mjs`

- **purpose** — Pins that project-local nana-pack.json is honored only under nana-trust — a trust decision that was actually made — and fails closed when the trust API or pi's module is absent
- **inputs** — lib/config.ts, the REAL installed pi trust module when it can be located, and temp projects under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, temp projects, pi settings fixtures), process (sets HOME, runs npm and git through execSync)
- **errors** — a failed check prints FAIL and the run exits 1; the pi-dependent cases report a skip rather than a pass when no pi install is found
- **callers** — —
- **callees** — `packages/nana-pack/lib/config.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/display-surfaces.test.mjs`

- **purpose** — Pins ONE renderer per surface — every renderer over the lane's hostile-input table, plus one probe per call site that a hostile value cannot change the STRUCTURE the consumer receives
- **inputs** — lib/display.mjs and its call sites across the extensions, hostile values from the lane's failure-mode list, and a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME and written surfaces), process (sets HOME, spawns the surfaces that run as child processes)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/extensions/nana-post-edit.ts`, `packages/nana-pack/lib/adoption.mjs`, `packages/nana-pack/lib/display.mjs`, `packages/nana-pack/lib/objective.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

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
- **callees** — `packages/nana-pack/extensions/nana-gate.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

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

### `packages/nana-pack/tests/handoff-artifact.test.mjs`

- **purpose** — Pins the continuity path — compaction writes the handoff artifact to the user-scope store and the next fresh session picks it up, told to update it in place
- **inputs** — extensions/nana-handoff.ts, a nana-pack.json and the handoff store under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, config file, handoff store), process (sets HOME and USERPROFILE)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/handoff-staleness.test.mjs`

- **purpose** — Pins handoff provenance and staleness — a fresh file is injected in full with its provenance, and one older than the staleness window becomes a bounded pointer instead of text
- **inputs** — extensions/nana-handoff.ts, handoff files whose `Written:` header carries the injected clock, and the installed pi path resolver when it can be located
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME and handoff files), process (sets HOME, runs execSync to locate pi)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/handoff-store.test.mjs`

- **purpose** — Pins the user-scope handoff store — written atomically, keyed per exact canonical directory so nothing borrows an ancestor's, and skipped by resume, fork and reload
- **inputs** — extensions/nana-handoff.ts, a nana-pack.json and the handoff store under a temp HOME, and throwaway repositories and worktrees
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, store files, repository fixtures), process (sets HOME, spawns a child session)
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
- **inputs** — extensions/nana-handoff.ts, bin/pi-review.mjs, a stub `pi` on PATH, and a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, store files), process (sets HOME and NANA_HANDOFF, spawns pi-review with the stub pi on PATH)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/lifecycle-reload.test.mjs`

- **purpose** — Pins the `/reload-runtime` command the desk depends on — registered exactly once under a non-colliding name, carrying a description, and calling ctx.reload once
- **inputs** — extensions/nana-lifecycle.ts and a nana-pack.json under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME and config file), process (sets HOME and USERPROFILE)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-lifecycle.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

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
- **inputs** — extensions/nana-objective.ts, the nana-objective bash hook, and OBJECTIVE.md fixtures under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, objective fixtures, a symlinked hook), process (sets HOME, runs the bash hook with node on PATH)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-objective.ts`, `packages/nana-pack/lib/objective.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/objective-injection.test.mjs`

- **purpose** — Pins that the owner's objective and current priority reach every session's system prompt and that only the USER can say what they are or rename the per-repo file
- **inputs** — extensions/nana-objective.ts, OBJECTIVE.md fixtures, and nana-pack.json at both scopes under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, objective fixtures, config files), process (sets HOME and USERPROFILE)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-objective.ts`, `packages/nana-pack/lib/config.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/post-edit-file-queue.test.mjs`

- **purpose** — Pins that a post-edit checker holds pi's per-file mutation queue while it runs and REFUSES to run when it cannot hold it, so no formatter overwrites a newer sibling edit
- **inputs** — extensions/nana-post-edit.ts, pi's file-mutation-queue module, and a temp HOME with a workspace and configured checkers
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, workspace files, receipts), process (sets HOME, runs the configured checker commands)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-post-edit.ts`, `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/receipts.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/post-edit-hardening.test.mjs`

- **purpose** — Pins that the post-edit checker is bounded — a SIGTERM-ignoring checker and a descendant holding the pipe both end in a recorded timeout with the process really gone
- **inputs** — extensions/nana-post-edit.ts and stub checkers that ignore signals or leak descendants, under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, stub checker scripts, receipts), process (sets HOME, spawns and kills the stub checkers and their descendants)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-post-edit.ts`, `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/gate-paths.ts`, `packages/nana-pack/lib/receipts.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/post-edit-status.test.mjs`

- **purpose** — Pins that post-edit reports EVERY run through ctx.ui.setStatus, so a working hook never looks identical to an absent one
- **inputs** — extensions/nana-post-edit.ts, a nana-pack.json with passing and failing checkers, and a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, workspace files, receipts), process (sets HOME, runs the configured checker commands)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-post-edit.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/readme-check.test.mjs`

- **purpose** — Holds nana-pi to the README rule it ships (G-012): every command, path, flag and script name a shipped README states exists and runs as written.
- **inputs** — scripts/readme-check.mjs, readme-check.config.json, and the README files it lists
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (reads this checkout, writes throwaway fixtures under a temp dir), process (runs the readme-check CLI)
- **errors** — a failed check prints FAIL with the problem list and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`, `scripts/readme-check.mjs`

### `packages/nana-pack/tests/receipt-binding.test.mjs`

- **purpose** — Pins that a post-edit check leaves a CONTENT-BOUND receipt for both pass and fail with a distinct status for a checker that could not run, and that staleness is detectable by re-reading the workspace
- **inputs** — extensions/nana-post-edit.ts, the receipts helper, and a temp HOME with a workspace
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, workspace files, receipt files), process (sets HOME and USERPROFILE)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-post-edit.ts`, `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/receipts.ts`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/requirements-trace.test.mjs`

- **purpose** — Holds nana-pi to the requirements-first rail it ships: an implemented row has a marked test behind it, a lesser row has no marker contradicting it, every cited test exists and carries the marker, the EARS form count and allowance behave on fixtures, and the shipped CLI really prints the report line after the summary line.
- **inputs** — scripts/requirements-trace.mjs, REQUIREMENTS.md, and the markers in the six test dirs npm test collects
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (reads this checkout; writes and removes scratch dirs under the OS temp dir for the EARS fixtures), process (spawns the real CLI once)
- **errors** — a failed check prints FAIL with the problem list and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`, `scripts/requirements-trace.mjs`

### `packages/nana-pack/tests/review-ledger.test.mjs`

- **purpose** — Pins the per-item review ledger through REAL processes against real git repositories and worktrees, with each known bypass recorded here as a refusal
- **inputs** — bin/pi-review.mjs, bin/pi-worker.mjs, bin/review-ledger.mjs, bin/review-round.mjs, a stub `pi` on PATH, and temp git repositories under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, git repositories, worktrees, ledger files), process (spawns the review CLIs, the stub pi and git)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/review-round.test.mjs`

- **purpose** — Pins the review ROUND CAP as pure rules — a round is a distinct revision, the item slug is canonical, and the deprecated path helper keeps its contract
- **inputs** — bin/review-round.mjs
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — none
- **errors** — a failed check prints FAIL and the run exits 1; the helpers that must reject bad input are asserted to throw
- **callers** — —
- **callees** — `packages/nana-pack/bin/review-round.mjs`

### `packages/nana-pack/tests/templates-render.test.mjs`

- **purpose** — Pins that both project template modes render and that the requirements-first rail they ship is wired in each, including a first `--check` that passes with no dependencies installed
- **inputs** — the templates/ tree at the repository root and throwaway render targets under a temp HOME
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, rendered projects), process (spawns the render and check commands in the rendered projects)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/test-runner.test.mjs`

- **purpose** — Pin the repo test runner's own contract (R-600..R-618) from OUTSIDE it — the runner is what every other test's verdict depends on, and until now nothing tested it.
- **inputs** — scripts/test.mjs (copied verbatim into each throwaway root, so the real bytes run), the fixture test files this file writes, and env OUTER_HOME / PROBE_OUT / TMPDIR it hands the child
- **outputs** — one PASS / FAIL line per check and a non-zero exit when any check failed
- **effects** — process (runs the copied runner as a child per case; one case leaves a detached grandchild, reaped here), disk (one mkdtemp tree holding every fixture root, removed at exit)
- **errors** — a FAIL line naming the broken runner behaviour; a non-zero exit code
- **callers** — —
- **callees** — `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/tmp-dir.mjs`

- **purpose** — Create test temporary roots and remove them when the test process exits.
- **inputs** — A mkdtemp prefix.
- **outputs** — The created temporary directory path.
- **effects** — disk (creates and removes temporary directories), process (registers exit cleanup)
- **errors** — Propagates directory creation errors and ignores cleanup errors.
- **callers** — `packages/nana-pack/tests/adoption-producer.test.mjs`, `packages/nana-pack/tests/adoption-reader.test.mjs`, `packages/nana-pack/tests/agent-dir-config.test.mjs`, `packages/nana-pack/tests/agent-dir-hostile.test.mjs`, `packages/nana-pack/tests/agent-dir-parity.test.mjs`, `packages/nana-pack/tests/agent-dir-var-spellings.test.mjs`, `packages/nana-pack/tests/code-map.test.mjs`, `packages/nana-pack/tests/config-display-text.test.mjs`, `packages/nana-pack/tests/config-gate-fallback.test.mjs`, `packages/nana-pack/tests/config-handlers-malformed.test.mjs`, `packages/nana-pack/tests/config-normalize.test.mjs`, `packages/nana-pack/tests/config-project-gate-fallback.test.mjs`, `packages/nana-pack/tests/config-trust.test.mjs`, `packages/nana-pack/tests/display-surfaces.test.mjs`, `packages/nana-pack/tests/gate-config-robustness.test.mjs`, `packages/nana-pack/tests/gate-corpus.test.mjs`, `packages/nana-pack/tests/gate-policy-paths.test.mjs`, `packages/nana-pack/tests/gate-self-protection.test.mjs`, `packages/nana-pack/tests/gate-status.test.mjs`, `packages/nana-pack/tests/gate-survives-mutation.test.mjs`, `packages/nana-pack/tests/handoff-artifact.test.mjs`, `packages/nana-pack/tests/handoff-staleness.test.mjs`, `packages/nana-pack/tests/handoff-store.test.mjs`, `packages/nana-pack/tests/handoff-symlink.test.mjs`, `packages/nana-pack/tests/handoff-trust.test.mjs`, `packages/nana-pack/tests/handoff-writer-role.test.mjs`, `packages/nana-pack/tests/lifecycle-reload.test.mjs`, `packages/nana-pack/tests/notify-fallback.test.mjs`, `packages/nana-pack/tests/objective-golden.test.mjs`, `packages/nana-pack/tests/objective-injection.test.mjs`, `packages/nana-pack/tests/post-edit-file-queue.test.mjs`, `packages/nana-pack/tests/post-edit-hardening.test.mjs`, `packages/nana-pack/tests/post-edit-status.test.mjs`, `packages/nana-pack/tests/readme-check.test.mjs`, `packages/nana-pack/tests/receipt-binding.test.mjs`, `packages/nana-pack/tests/requirements-trace.test.mjs`, `packages/nana-pack/tests/review-ledger.test.mjs`, `packages/nana-pack/tests/templates-render.test.mjs`, `packages/nana-pack/tests/test-runner.test.mjs`, `packages/nana-pack/tests/writing-check.test.mjs`, `packages/nana-pack/tests/writing-injection.test.mjs`
- **callees** — —

### `packages/nana-pack/tests/writing-check.test.mjs`

- **purpose** — Pins the writing checker: stdin and file labelling with correct per-line numbers, the four always-on checks (banned outside a code span), the two --report-only checks with whole-word verdict/identifier handling, Markdown-aware splitting, the summary's exact shape and cross-file verdict share, one seal per exported config value, and the always-0 exit — plus astra r1's four CLI mutations and an unpinned passive precision/recall fixture
- **inputs** — the writing checker CLI (spawned) and its pure functions (imported directly)
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (a throwaway temp dir for the multi-file cases), process (spawns the CLI)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/lib/writing-check.mjs`, `packages/nana-pack/lib/writing-config.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-pack/tests/writing-injection.test.mjs`

- **purpose** — Pins that the writing rule reaches every session's system prompt, composes with nana-objective on the installed pi 1.0.2 (a distinctive base, the objective and the writing block each once, in order), that an unusable or oversized or non-regular rule never crashes or hangs the process, that the UTF-8 tail fix strips only a genuine read-boundary split and never a malformed byte, that the read ceiling is pinned directly, and that none of this ever touches the real shipped rule file
- **inputs** — extensions/nana-writing.ts (with an injected, disposable rulePath — never the shipped file), extensions/nana-objective.ts, a temp HOME, and (for the two resource-failure fixtures) a Node subprocess with a time limit
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (temp HOME, journal, disposable rule-file fixtures only — the shipped rule file is read at most, never written), process (sets HOME/USERPROFILE; spawns bounded Node subprocesses for the FIFO and oversized-file fixtures; dynamically imports the installed pi package when present)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/extensions/nana-objective.ts`, `packages/nana-pack/lib/objective.ts`, `packages/nana-pack/lib/writing-config.mjs`, `packages/nana-pack/tests/tmp-dir.mjs`

### `packages/nana-setup/bin/nana-setup.mjs`

- **purpose** — The nana-setup CLI: parse argv, resolve one layout, run the install / doctor / project command it names, and print one marked line per piece.
- **inputs** — argv (`install` | `doctor` | `project [dir]`, plus --home, --claude-home, --pi-home, --desk, --name, --check, --not-a-project, --dry-run, --yes, -h/--help); process.cwd() for a defaulted project dir; whatever resolveLayout reads (HOME, PI_CODING_AGENT_DIR, NANA_SETUP_PLATFORM); the step and check reports returned by lib/steps, lib/doctor, lib/project.
- **outputs** — stdout: the install root / claude home / pi home banner, a "<mark> <label> <status> <detail>" line per result (+ created|updated, · unchanged, – skipped, ✗ problem; ✓/✗/!/· for doctor), a closing summary and the "next:" hint; stderr: the usage text and error messages; process.exitCode.
- **effects** — disk (through install / setupProject / dismissProject), process (the child processes those steps spawn; sets process.exitCode)
- **errors** — exit 2 for an unknown option or command, no command, a SetupError (including a relative ambient PI_CODING_AGENT_DIR, a .nana-not-a-project marker, a missing parent directory); exit 1 when any row is ✗ or, for doctor, any ✗/! row, and for an unexpected throw (stack on stderr); exit 0 otherwise
- **callers** — —
- **callees** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/project.mjs`, `packages/nana-setup/lib/steps.mjs`

### `packages/nana-setup/lib/doctor.mjs`

- **purpose** — Judge one machine and return an ordered check list covering the Node floors, Claude Code, auto-memory, pi resource registration and user config, the knowledge index, PATH and desk service.
- **inputs** — a layout from resolveLayout; opts.projectDir (default process.cwd()); NANA_SETUP_PLATFORM and PATH; on disk — <claudeHome>/hooks, rules (incl. nana-personal.md), skills, settings.json, nana-memory/shared/MEMORY.md, projects/<key>/memory/shared, <piHome>/settings.json and nana-pack.json and the objective file it names, <piHome>/extensions/subagent/config.json, <piHome>/agents/reviewer.md, <piHome>/npm/node_modules/pi-subagents/package.json, <piHome>/mcp.json, <knowledgeHome>/index.db, <binDir>/pi-review, the LaunchAgents plist; `node -p process.versions.node` and `launchctl print`
- **outputs** — an array of { status, label, detail } rows; STATUS (ok | fail | note | warn); NODE_FLOOR ("22.18"); DESK_NODE_FLOOR ("22.19"); PI_SUBAGENTS_FLOOR ("0.75.0"); parsePlistValues(); nodeMeetsFloor(); versionAtLeast(); skillLinkState() { ok, detail }; projectFileState() { status, kind, detail }
- **effects** — disk (reads only), process (spawns node and launchctl to probe)
- **errors** — none thrown — a missing, unparseable or wrong-kind piece becomes a fail row, a cwd-relative PI_CODING_AGENT_DIR a warn row, and a posix-only piece on win32 a note row
- **callers** — `packages/nana-setup/bin/nana-setup.mjs`, `packages/nana-setup/tests/desk-service.test.mjs`, `packages/nana-setup/tests/doctor-detail.test.mjs`, `packages/nana-setup/tests/install.test.mjs`, `packages/nana-setup/tests/skills-and-standards.test.mjs`, `packages/nana-setup/tests/win32-degrade.test.mjs`
- **callees** — `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/project-key.mjs`, `packages/nana-setup/lib/settings.mjs`, `packages/nana-setup/lib/steps.mjs`

### `packages/nana-setup/lib/fsops.mjs`

- **purpose** — The installer's non-destructive file primitives, each reporting the status of what it did instead of acting silently.
- **inputs** — target and source paths, file contents, { dryRun, copyInstead }, a Date for the backup stamp; the filesystem — linkFile and seedFile decide presence with lstat, never existsSync, so a dangling symlink reads as present and is left untouched (ensureDir and backupPath are the exceptions and use existsSync)
- **outputs** — { status, detail } with status one of CREATED | UPDATED | UNCHANGED | SKIPPED | PROBLEM; on disk: symlinks (linkFile), byte copies on a platform without symlinks, files written only when absent (seedFile), directories (ensureDir), content-compared writes (writeIfChanged) and <name>.bak-<YYYYMMDD> backups of anything replaced
- **effects** — disk (symlink, unlink, mkdir -p, writeFile, rename-to-backup; nothing under dryRun)
- **errors** — none typed — an unreadable source or an undeletable target propagates the raw fs error; a symlink or directory in the way is returned as SKIPPED and never written through
- **callers** — `packages/nana-setup/lib/project.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/desk-service.test.mjs`, `packages/nana-setup/tests/fsops.test.mjs`
- **callees** — —

### `packages/nana-setup/lib/paths.mjs`

- **purpose** — The single resolver for every path the installer touches, so `install`, `doctor` and `project` can never disagree about where a piece lives.
- **inputs** — opts.home / opts.claudeHome / opts.piHome; os.homedir(); nana-pack's agent-dir resolver (PI_CODING_AGENT_DIR, else ~/.pi/agent) and its cwd-relative probe; process.cwd(); NANA_SETUP_PLATFORM; import.meta.url (for pkgRoot / repoRoot)
- **outputs** — pkgRoot, repoRoot, DESK_LABEL ("com.nana.pi-desk"); a layout object of absolute paths — base, claudeHome, hooksDir, rulesDir, skillsDir, projectsDir, sharedMemoryDir, claudeSettings, piHome + piHomeSource + piHomeCwdRelative, piSettings, piPackConfig, piObjective, knowledgeHome (always under the layout BASE unless --pi-home/--home named it), subagentConfig, reviewerAgent, piSubagentsPackage, mcpConfig, deskLog, binDir, launchAgentsDir, plistPath, isRealHome; platform(); tildeify()
- **effects** — none (pure path arithmetic plus env and homedir reads; nothing on disk is read or written)
- **errors** — none — it never throws; an unreadable cwd degrades to a descriptive placeholder string
- **callers** — `packages/nana-pack/tests/agent-dir-parity.test.mjs`, `packages/nana-setup/bin/nana-setup.mjs`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/project.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/doctor-detail.test.mjs`, `packages/nana-setup/tests/paths.test.mjs`, `packages/nana-setup/tests/pi-registration.test.mjs`, `packages/nana-setup/tests/settings-merge.test.mjs`
- **callees** — `packages/nana-pack/lib/agent-dir.mjs`

### `packages/nana-setup/lib/project-key.mjs`

- **purpose** — Reproduce Claude Code's ~/.claude/projects/<key> directory name for a project path and report whether that project's memory dir carries the `shared` symlink.
- **inputs** — a project's absolute path; the layout's projectsDir and sharedMemoryDir; the filesystem (lstat + readlink of <projectsDir>/<key>/memory/shared); sharedLinkState's 4th arg optionally injects readlinkSync (a test seam — production callers never pass it)
- **outputs** — KEY_MAX (200); slug() and pathHash() strings; projectKey() (the slug, or 200 chars plus "-<base36 32-bit hash>"); projectMemoryDir() path; sharedLinkState() — "absent" | "not-a-symlink" | "linked" | "elsewhere"
- **effects** — disk (lstat and readlink only, read-only)
- **errors** — none — a missing or unreadable link reads as "absent"
- **callers** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/tests/project-key.test.mjs`, `packages/nana-setup/tests/shared-link-state.test.mjs`, `packages/nana-setup/tests/shared-memory-hook.test.mjs`
- **callees** — —

### `packages/nana-setup/lib/project.mjs`

- **purpose** — Make one folder a nana project — and check one — by seeding, idempotently and without overwriting, the per-project files the machine-level mechanisms read.
- **inputs** — the target dir; a layout (knowledgeHome, piPackConfig); { name, date, dryRun }; the templates/_shared seeds (OBJECTIVE.md, HANDOFF.md, docs/sessions/README.md, working-under-nana-pi.md); the user-scope nana-pack.json (for postEdit.commands); NANA_SETUP_KNOWLEDGE_CLI, NANA_SETUP_KNOWLEDGE_DEADLINE_MS, NANA_SETUP_KNOWLEDGE_KILL_GRACE_MS, NANA_SETUP_PLATFORM
- **outputs** — setupProject() / checkProject() report arrays ({ label, status, detail } and { label, ok, detail }); on disk — `git init`, OBJECTIVE.md, HANDOFF.md, docs/sessions/README.md, docs/sessions/<YYYY-MM>.md, an AGENTS.md stub plus a relative CLAUDE.md symlink (a copy on win32), .pi/nana-pack.json ({"postEdit":{"commands":[]}}), the .nana-not-a-project marker; also exports SHARED_DIR, today(), fillSeed(), monthHeader(), agentsStub(), PACK_STARTER, BUILD_LOCK_MARK, REFRESH_DEADLINE_MS, REFRESH_KILL_GRACE_MS
- **effects** — disk, process (`git init` / `git rev-parse`, an async `nana-knowledge build` with a parent-side deadline — SIGTERM then SIGKILL after the grace)
- **errors** — SetupError when the folder holds .nana-not-a-project, or when --not-a-project names a path that is not a git repository root; everything else is a row — SKIPPED for a nested-repo `git init`, a failed `git init`, a missing index, a held build lock, a build failure or the refresh deadline
- **callers** — `packages/nana-setup/bin/nana-setup.mjs`
- **callees** — `packages/nana-setup/lib/fsops.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/steps.mjs`

### `packages/nana-setup/lib/settings.mjs`

- **purpose** — Merge the nana hook entries into Claude Code settings while preserving foreign hooks and repairing recognized stale knowledge targets.
- **inputs** — a parsed settings object (the caller reads and writes the file); { hooksDir, repoRoot }; the command strings already in settings.hooks
- **outputs** — shq() single-quoted paths; tokenize() argv or null; commandInvokes() boolean; desiredHooks(); knowledgeHookHealthy(); mergeKnowledgeHook(); validateShape(); hasHook(); mergeHooks() { settings (mutated in place), added labels, changed }; serialize() JSON text
- **effects** — disk (reads only)
- **errors** — none thrown — validateShape returns the reason the shape cannot be extended, and any command that is unparseable or carries a shell operator reads as NOT installed
- **callers** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/install.test.mjs`, `packages/nana-setup/tests/settings-merge.test.mjs`
- **callees** — —

### `packages/nana-setup/lib/steps.mjs`

- **purpose** — The install steps and the `install` sequencer: each step links, seeds, merges or registers one piece of the experience and reports { label, status, detail }.
- **inputs** — a layout from resolveLayout; { dryRun, desk, afterTempWrite }; this package's own sources (claude/hooks, claude/rules, claude/rules/nana-personal.example.md, claude/memory/MEMORY.seed.md, pi/nana-pack.seed.json, pi/nana-objective.seed.md, pi/subagent-config.seed.json, pi/reviewer.seed.md, launchd/com.nana.pi-desk.plist.tmpl) and packages/nana-pack/skills and packages/nana-pack/rules (the writing rule); the live <claudeHome>/settings.json, <piHome>/nana-pack.json and <piHome>/settings.json; NANA_SETUP_PLATFORM
- **outputs** — an array of { label, status, detail }; on disk — symlinks in <claudeHome>/hooks and rules (copies on win32), a seeded nana-personal.md, the missing hook entries merged into <claudeHome>/settings.json via an O_EXCL .settings.json.nana-setup.lock and a fsync'd temp-file rename that preserves mode, <claudeHome>/nana-memory/shared/MEMORY.md, <piHome>/nana-pack.json and nana-objective.md, <piHome>/extensions/subagent/config.json, <piHome>/agents/reviewer.md, <knowledgeHome>/index.db, <binDir>/pi-review, the desk plist (+ launchctl bootstrap/kickstart), per-package pi `packages` registrations; also exports HOOKS, CLAUDE_RULES, PACK_RULES_DIR, ruleSource, CLAUDE_SKILLS, PACK_SKILLS_DIR, PI_REVIEW_BIN, KNOWLEDGE_CLI, DESK_SERVER, REVIEWER_MARKER, firstBodyLine, SetupError and the helpers doctor reuses
- **effects** — disk, process (spawns `nana-knowledge build`, `launchctl print|bootout|bootstrap`, `pi --version` / `pi install`, `git rev-parse`)
- **errors** — SetupError — settings.json unreadable, not valid JSON, or a shape the merge will not edit; the settings lock already held; settings.json changed on disk during the run; a plist placeholder with no value. Every other failure is a row: PROBLEM for a non-regular nana-personal.md, or anything already sitting where the skill symlink belongs, SKIPPED for win32, a failed knowledge build or missing pi, and PROBLEM for a failed per-package `pi install` or launchctl bootstrap/kickstart
- **callers** — `packages/nana-setup/bin/nana-setup.mjs`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/project.mjs`, `packages/nana-setup/tests/desk-service.test.mjs`, `packages/nana-setup/tests/doctor-detail.test.mjs`, `packages/nana-setup/tests/install.test.mjs`, `packages/nana-setup/tests/pi-registration.test.mjs`, `packages/nana-setup/tests/settings-merge.test.mjs`, `packages/nana-setup/tests/writing-rule.test.mjs`
- **callees** — `packages/nana-setup/lib/fsops.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/settings.mjs`

### `packages/nana-setup/tests/agent-dir-consumers.test.mjs`

- **purpose** — Pins that widening the agent-dir resolution never splits a producer from its consumer — the installer's knowledge home matches the runtime default, and the rendered desk plist carries the directory the installer chose
- **inputs** — bin/nana-setup.mjs, lib/paths.mjs, the desk plist template, and throwaway --home / --claude-home targets
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway home layouts and rendered plists), process (spawns the installer CLI; launchctl is never called)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/desk-service.test.mjs`

- **purpose** — Pins that the desk launchd service is opt-in, rendered from the template with REAL resolved values, never bootstrapped from a test, and that a skipped plist write (a symlink in the way) makes zero launchctl calls
- **inputs** — lib/steps.mjs renderPlist/stepDesk, the plist template, bin/nana-setup.mjs, a throwaway --home, and (for the caller-level section) a stubbed `launchctl` script placed first on PATH
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway home layouts, rendered plists and a stub launchctl script), process (spawns the installer CLI, and — only via the PATH-stubbed fake — `launchctl`; the REAL launchctl is never called)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/fsops.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/doctor-detail.test.mjs`

- **purpose** — Pins that `doctor`'s detail text for each per-piece check agrees with the tick, cross or warning it prints — the private rule file, objective.projectFile, the Node floor, and the pi 1.0 subagent/MCP checks (subagent config, reviewer agent marker, pi-subagents version, mcp.json)
- **inputs** — lib/doctor.mjs, lib/paths.mjs, lib/steps.mjs, and throwaway home layouts
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway home layouts, regular files, symlinks and directories)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-pack/lib/objective.ts`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/fsops.test.mjs`

- **purpose** — Pins writeIfChanged's non-destructive contract: a symlink (live or dangling) in the way is left untouched and reported SKIPPED, with no read targeting the link or its destination and no write through it
- **inputs** — lib/fsops.mjs writeIfChanged, throwaway scratch directories with real symlinks, and (for the no-read instrumentation) a global spy on fs.readFileSync installed via require('fs') + syncBuiltinESMExports()
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (a throwaway scratch dir, files and symlinks, removed on exit); process-global (readFileSync is monkeypatched and restored within a single synchronous call, via node:module's syncBuiltinESMExports)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/lib/fsops.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/install.test.mjs`

- **purpose** — Pins that `install` is idempotent, additive, and never destroys what the owner wrote by hand
- **inputs** — bin/nana-setup.mjs, lib/settings.mjs, lib/steps.mjs, lib/doctor.mjs, and a throwaway --home
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway home layouts, settings files, symlinks), process (spawns the installer CLI)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/lib/settings.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/paths.test.mjs`

- **purpose** — Pins resolveLayout's isRealHome guard: false whenever ANY explicit override (--home, --claude-home, --pi-home) is in force, even when --home resolves to the same path as the real home directory
- **inputs** — lib/paths.mjs resolveLayout, and os.homedir() (under the suite runner this is already a fresh per-file temp HOME, never the developer's real one — scripts/test.mjs scrubs it; resolveLayout itself touches no disk either way)
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — none (pure path arithmetic; nothing on disk is read or written)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/lib/paths.mjs`

### `packages/nana-setup/tests/pi-registration.test.mjs`

- **purpose** — Pins the answer to whether nana-pi is already registered with pi, following pi's own matching rules, so the installer never adds a second root-level package entry
- **inputs** — lib/steps.mjs, lib/paths.mjs, and pi settings fixtures under a throwaway --home
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway home layouts and settings fixtures), process (spawns the installer CLI)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/steps.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

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

### `packages/nana-setup/tests/project.test.mjs`

- **purpose** — Pins that `nana-setup project` turns a blank folder into a nana project, never overwrites what a folder already has, and emits the same seeds the copier templates render
- **inputs** — bin/nana-setup.mjs, the shared templates, and throwaway target dirs with a throwaway --home
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway project dirs, seeds, symlinks, a throwaway home), process (spawns the setup CLI and git)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/relative-agent-dir.test.mjs`

- **purpose** — Pins that an AMBIENT relative PI_CODING_AGENT_DIR is refused by `install`, `project` and `project --check` with the cwd and the remedy named, while an explicit --pi-home is honoured and `doctor` warns
- **inputs** — bin/nana-setup.mjs with a relative PI_CODING_AGENT_DIR in the environment, and throwaway home and project dirs
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway home and project dirs), process (sets PI_CODING_AGENT_DIR, spawns the setup CLI)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/settings-merge.test.mjs`

- **purpose** — Pins that the settings.json merge ADDS and nothing else — other people's hooks, keys and ordering survive, an unparsable or unrecognised file stops the installer before anything moves, and the write is atomic
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

### `packages/nana-setup/tests/shared-memory-hook.test.mjs`

- **purpose** — Pins that the shared-memory SessionStart hook self-heals and is fail-open, since it runs in every session in every repository
- **inputs** — claude/hooks/nana-shared-memory.sh, lib/project-key.mjs, and a throwaway HOME with CLAUDE_PROJECT_DIR overridden
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway home layouts, memory dirs and symlinks), process (runs the bash hook)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/lib/project-key.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/skills-and-standards.test.mjs`

- **purpose** — Pins that Claude Code gets the requirements skill and the standards rule from the SAME source pi reads — a symlink into the repository, never a copy that stops tracking a pull
- **inputs** — bin/nana-setup.mjs, the packaged requirements skill, the standards rule, and a throwaway --home
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway home layouts and symlinks), process (spawns the installer CLI)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/tmp-dir.mjs`

- **purpose** — Create test temporary roots and remove them when the test process exits.
- **inputs** — A mkdtemp prefix.
- **outputs** — The created temporary directory path.
- **effects** — disk (creates and removes temporary directories), process (registers exit cleanup)
- **errors** — Propagates directory creation errors and ignores cleanup errors.
- **callers** — `packages/nana-setup/tests/agent-dir-consumers.test.mjs`, `packages/nana-setup/tests/desk-service.test.mjs`, `packages/nana-setup/tests/doctor-detail.test.mjs`, `packages/nana-setup/tests/fsops.test.mjs`, `packages/nana-setup/tests/install.test.mjs`, `packages/nana-setup/tests/pi-registration.test.mjs`, `packages/nana-setup/tests/project-dismiss.test.mjs`, `packages/nana-setup/tests/project.test.mjs`, `packages/nana-setup/tests/relative-agent-dir.test.mjs`, `packages/nana-setup/tests/settings-merge.test.mjs`, `packages/nana-setup/tests/shared-link-state.test.mjs`, `packages/nana-setup/tests/shared-memory-hook.test.mjs`, `packages/nana-setup/tests/skills-and-standards.test.mjs`, `packages/nana-setup/tests/win32-degrade.test.mjs`
- **callees** — —

### `packages/nana-setup/tests/win32-degrade.test.mjs`

- **purpose** — Pins that on Windows every posix-only install step SAYS it skipped instead of failing, driven through the platform seam rather than by patching process.platform
- **inputs** — bin/nana-setup.mjs with NANA_SETUP_PLATFORM set to win32, lib/paths.mjs, and a throwaway --home
- **outputs** — PASS/FAIL lines per check on stdout, and exit 1 when any check fails
- **effects** — disk (throwaway home layouts and copied rule files), process (sets NANA_SETUP_PLATFORM, spawns the installer CLI)
- **errors** — a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
- **callers** — —
- **callees** — `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/tests/tmp-dir.mjs`

### `packages/nana-setup/tests/writing-rule.test.mjs`

- **purpose** — Pins that ~/.claude/rules/nana-writing.md is a symlink into the pack's own copy (not nana-setup's), and that the rule itself passes its own checker with zero findings
- **inputs** — lib/steps.mjs's ruleSource/PACK_RULES_DIR, nana-pack's lib/writing-check.mjs, the shipped rule file
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
