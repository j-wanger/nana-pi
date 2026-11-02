# Plan: builder-drop (2026-11-02, revision 2 after plan-attack.md)

Lane `builder-drop`, worktree `~/nana-pi-wt/builder-drop`, branch `feat/builder-drop`, base `origin/main` `7c4e7e19`.

**Split.** The attack's fixes push one lane well past eight must-meets, so the work is now two lanes, built in order:

1. `builder-drop` (this plan): the replay harness. It holds no study values and gives no verdict. It isolates each
   run, rebuilds a past first attempt's context with one kind removed, grades it by a frozen test manifest, journals
   spend before it is paid, and records the measures. Eight must-meets.
2. `builder-drop-study` (outlined below; planned after this lane lands): the pre-registered study. It holds the lane
   draw, the grading manifests, the control pilot, the power simulation, the verdict rule, the cap and the committed
   `PREREG.md`. Its own planner run writes its must-meets.

Lane class: `ordinary` (`node scripts/lane-class.mjs --root . --files apps/bench/replay.mjs,apps/bench/lib/replay.mjs,apps/bench/lib/replay-config.mjs,apps/bench/lib/replay-isolation.mjs,apps/bench/lib/replay-context.mjs,apps/bench/lib/replay-grade.mjs,apps/bench/lib/replay-journal.mjs,apps/bench/lib/replay-errors.mjs,apps/bench/ext/replay-context.ts,apps/bench/test/replay.test.mjs,scripts/test-locked.mjs,apps/bench/README.md,REQUIREMENTS.md,docs/known-bugs/FEAT-045.md,docs/code-map.md,docs/requirements-tree.md`, re-run for revision 2).
One final reviewer, the roster's reviewer. No wrong-code pairs, no land reviewer, no install check.

Stakes: this lane spends nothing, but it is the boundary every paid run trusts. The harms, in the seat's order:
- a replay reading the future (landed tests, later attempts) or touching a live worktree;
- a control that differs from a treatment in more than the dropped kind;
- grader failures erasing real failures;
- spend past the cap, or a tuple paid twice;
- a measure that rewards an unusable build;
- private text in git.

T1 to T8 each pin one of these by behaviour, not by flags.

IDs: new FEAT-045 under CAP-08, rows R-3600 to R-3619 (R-3600 to R-3607 here; the study lane takes R-3610 onward),
artifact A-101. On the base, `REQUIREMENTS.md` tops out at FEAT-043, R-3474 and A-098. In-flight worktrees claim
FEAT-044, A-099, A-100 and rows up to R-3579 (grep over `~/nana-pi-wt/*/docs/reviews/*/plan.md` and
`REQUIREMENTS.md`, 2026-11-02). The seat may move the range at merge time.

## Purpose

Agreed reading (owner, 2026-11-02): "go ahead with the drop test whenever theres a free lane, our goal is to craft the
builder (and eventually every role)'s context with craft and design, so this should really be the focus of our work,
as without it, we lack understanding of what context matters, which really drives the memory and knowledge pull design
as well", then "can we start the builder test lane now?". Current priority: craft each role's context by design,
builder first, measured by drop tests. Appetite: a replay harness and a test registered before any result is seen.
It drops or stages one kind of builder context at a time, starting with the tool list and lessons, and gives a
verdict per kind.

Owner additions the same day:
- "we should track build time, tokens spent, tool-calls, and the regular evals thats used for evaluating agents for
  these builds" (T5; measures named in the study outline).
- "also need to track error types in the build process, failed tool calls vs syntax failures, vs failures that would
  be saved by precedents etc" (T8).

This is builder-anatomy's "Slice 2, replay harness" (`docs/reviews/builder-anatomy-2026-11-01/plan.md`, Later
slices). That plan is grounding for the decisions it records, revised here where the attack showed them unsafe: a
temp HOME is not isolation, a landed tree is not a frozen grader, and a soft budget is not a cap.

**What the replay measures, stated plainly.** The control is a re-run, not the original build. Every arm, control
included, runs in the same new replay environment: an isolated clone at the build's start tip, a sandbox, a pinned
builder model and the first attempt's context. The estimand is a context kind's effect on builds inside that replay
environment. It carries over to production context design only as far as the control pilot (study lane) shows the
replay environment reproduces ordinary builds. The study's report says this in its first line.

This lane's feature, as one falsifiable sentence:

> Run a past first build's context, whole or with one kind removed, in a sandbox that can reach only that build's start
> tree, grade the result against a frozen test manifest, and record one row per run with its cost journalled before it
> is paid.

Evidence today (counts only, `anatomy-counts.md` and `labeller-counts.md`): builders read about ten times what is
pushed. Reads outside the repo are the largest pulled class (100M chars). Two oversize units sit in every build: the
skills listing (20,388 chars) and the added-tools block (4,564). Lessons is reliably labelled (κ 0.82 against
consensus); tools is not (κ 0.58).

## Assumptions

- A1. Isolation is a kernel boundary, not a temp HOME. On macOS the harness runs pi under `sandbox-exec` with a
  generated Seatbelt profile. Reads under the real HOME are denied except for an allow-list. Writes are denied
  everywhere except the run's own folder. Probe on this machine, 2026-11-02: a denied subtree refused `cat`, a
  symlink into it and a `node` read, and a write to `$HOME` was refused. The allow-list holds:
  - the run's clone, temp HOME and temp folder;
  - the prepared agent dir;
  - the credential file;
  - the global pi and Node installs;
  - system paths.

  Other replay runs, validation clones, the private store, `~/nana-pi*`, `~/.pi/agent/sessions` and `~/.claude` are
  outside it. Linux and Windows have no backend: `run` refuses there with `replay: no isolation backend`. Tests that
  need the live sandbox SKIP off macOS, as `agentdir`'s mode check does on win32. Docker is the named alternative
  (`docs/containerization.md`). Its daemon is not running on this machine, and it would copy the OAuth credential,
  which the bench README warns rotates.
- A2. The network stays open, because pi needs its provider. The repo is public, so a builder could fetch landed code.
  The harness narrows that path in three ways. The child env has no `GH_TOKEN` and `GITHUB_TOKEN`. `gh` is absent from
  the sandbox PATH. A git config maps the repo's remote URLs to an invalid host. After each run, the stream audit flags
  any command or URL naming the repo's remote host as `leak-suspect`. That run is excluded from the primary and
  counted (T1). A network read through another path stays possible: a residual detected by the audit, not prevented.
- A3. The control is the first attempt's context as recorded, rebuilt byte for byte after declared substitutions only.
  The recorded system message is read from the build's first-attempt session file (`anatomy-sessions.mjs` groups
  attempts; replay takes attempt 0 only). The instruction is that session's first user message. Later attempts,
  custom messages, context edits and compactions are excluded. Declared substitutions:
  - the original worktree path becomes the clone path;
  - `~/nana-pi`, `$HOME/nana-pi` and the absolute main-checkout path become the clone path, because the start tree is
    the historical copy of what they pointed to;
  - the `cwd` section value becomes the clone path.

  The temp HOME holds a `nana-pi` link to the clone, so `$HOME/nana-pi` in a shell resolves inside the sandbox.
- A4. The prompt reaches pi in its recorded section order through a bench extension, `ext/replay-context.ts`, loaded
  with an explicit `-e` (explicit paths load under `--no-extensions`). In `before_agent_start` it sets the recorded
  sections from a private JSON file named by an env variable. The precedent is pi's `prompt-customizer.ts`. The
  builder checks on pi 1.4.0 that it can set the preamble. If it cannot, the fallback is `--system-prompt` for the
  joined front sections plus the extension for the custom sections after `cwd`. Either way T2 pins the outcome: the
  run's own session file must record a system message equal to the expected bytes. That makes the order residual of
  revision 1 testable rather than argued.
- A5. Production feedback is restored where it is part of a build. The clone's own nana-gate and nana-post-edit
  extensions, at the start tip, load through explicit `-e`. The user-scope `nana-pack.json` is copied into the
  prepared agent dir. pi's auto-retry and compaction settings are copied from the user's settings, not pinned off,
  because builds ran with them. Retries and compactions are counted in each row. The bench's no-retry rule still holds
  for tuples. Any further difference from a historical build goes in the study's fidelity inventory:
  - no remote;
  - no lane watcher;
  - a sandboxed filesystem;
  - the pinned model.
- A6. The sandbox keeps the machine suite lock. The child env sets `NANA_SUITE_LOCK_DIR` to the real lock folder, and
  the profile allows writes to it. A replay builder's locked suite therefore waits for other suites. This is the one
  shared write outside the run folder.
- A7. The grader runs only after the builder's whole process tree has exited and been confirmed dead. The overlay comes
  from a frozen grading manifest, which the study lane builds per lane. It lists:
  - the overlay files, with hashes;
  - each check's file-qualified id;
  - its row weight;
  - its class (fail-to-pass or pass-to-pass);
  - the public interface the first brief fixed: module paths, exports and CLI commands.

  This lane takes the manifest as input and enforces it. It does not decide which checks belong.
- A8. Each hidden test file runs directly as `node <file>`, in its own process group, with a fresh temp HOME as
  `scripts/test.mjs` gives one. Its full stdout and exit status are captured apart from any runner summary. A check id
  is `<file>#<PASS|FAIL line text>#<occurrence>`. Text is CRLF-normalized, and the manifest's declared volatile spans
  (durations, temp paths) are masked. A run's check outcomes come in four kinds:
  - `pass`;
  - `fail` (a FAIL line for that id);
  - `not-run` (missing after the file exited nonzero or crashed);
  - `grader-broken` (spawn failure, grader timeout, or the file killed by the harness).
- A9. Grading failures are split by cause (attack M2). These are model failures and score as failing:
  - a syntax error in the builder's code;
  - a missing module or export that the manifest's interface names;
  - a missing implementation.

  An import of a path or export the manifest does not name is `grader-incompatible`, the hidden test's own
  assumption. `grader-incompatible` and `grader-broken` runs are excluded from means but kept in the row. Every
  report prints them with worst-case and best-case bounds (scored 0 and scored 1).
- A10. Spend is journalled, and the cap is hard up to a documented overshoot. Before launch, the journal durably
  records a `start` line with the tuple, the manifest hash and the reserved allowance. The child's stream is priced
  as it arrives through `parseStream`. A run whose running cost passes its kill limit is killed. The overshoot is at
  most one model turn, and the README says so. A `start` line with no `end` line is an interrupted tuple. Resume
  never re-pays it automatically: it stays `interrupted`, with the partial spend from its saved stream, until the seat
  deletes it by hand. If spend cannot be priced (cost null), it is charged at the full allowance, so unknown never
  counts as zero. The reviewer step is optional and journalled the same way. A failed review is `missing`, never zero
  findings.
- A11. Machine exclusion is detection and abort, not a mutual lock (attack M10; pi-worker is not changed here). Before
  each run, during it (polled every `BUSY_POLL_MS`) and before each grading or validation step, the harness checks two
  things. A build-record start with no end line counts as busy, unless the pid in that start record is dead; then it
  is stale and ignored. A suite lock held by a live pid other than a replay child also counts as busy. A busy check
  during a run kills the run's tree. The tuple is recorded `aborted: busy` with its spend, and no automatic re-pay
  follows. A second replay invocation on the same private folder is refused by an exclusive pid lock file there. The
  seat still starts no build while a replay runs; detection covers the seat forgetting.
- A12. This lane's tunables are harness defaults with provenance in `replay-config.mjs`:
  - `BUSY_POLL_MS`;
  - the stall and ceiling defaults;
  - the error-class patterns;
  - the volatile-span masks;
  - the Seatbelt allow-list.

  Study values come from `study.json` and are sealed in the study lane, not here (attack S15):
  - model;
  - repeats;
  - allowances;
  - cap;
  - margin;
  - lanes.
- A13. Anatomy's `assembleParts` is unchanged (attack S15). The replay renderer in `replay-context.mjs` reads the
  same stored spans. It applies a drop to the selected attempt's parts and rejoins the `addendum` from its split parts
  with no separators added. It removes a heading or table header only when every unit under it was removed. The two
  FEAT-042 known bugs stay recorded for anatomy.
- A14. Private data stays private. Clones, streams, prompts, test output, reviewer replies and rows live in a
  `privateFolder` outside any checkout. Only counts, lane names, start tips, arm names, hashes and class names print.

## Open choices

- O1. Module split inside `apps/bench/lib/` as forecast, with each module single-purpose and `replay.mjs` thin.
- O2. Separate `replay.mjs` importing bench libraries, not an extension of `run.mjs`. `parseStream`, `readJsonl`, the
  fingerprint helper, `prepareAgentDir`/`verifyAuth` and `rng`/`shuffle` are imported, never copied.
- O3. File formats in the private folder: JSONL journal and rows, a JSON run manifest. The report's JSON layout is
  counts only.
- O4. The error-class message patterns. Each carries provenance: the pi 1.4.0 source line for tool errors (for
  example `dist/core/tools/edit.js`: "Could not find the exact text", "Found N occurrences"), Node error codes for
  load and permission failures, and the test line format.
- O5. Whether the stream audit's remote-host match also covers the GitHub web host and raw-content host. The default
  is yes.

## Questions for the owner

The owner is away. The seat decides these with an astra consult. Each default is the one this planner defends. All
three bind the study lane; none changes this lane's code.

Question: How large is the first paid round, and what may it spend?
Default: a control-only pilot first, 10 drawn lanes × 2 control runs (about USD 33); then, only if the pilot passes its bar and the power simulation shows 10 lanes can detect a 0.2 harm, 10 lanes × 3 arms (control, no tool list, no lessons) × 3 repeats, with reviews on one repeat per lane and arm, about USD 205 in all under a USD 400 hard cap.
What the default gains and misses: the pilot buys proof that the replay environment yields usable controls before any treatment spend, and ten lanes give the exact paired test room to decide; it misses lanes that never landed, which have no frozen grader, and so says nothing about them.
Cost of a wrong guess: hard to undo; money spent does not come back, and an underpowered round must be paid again.
If answered otherwise: `study.json` changes before `PREREG.md` is committed; no harness code changes.

Question: What does "the tool list" arm remove?
Default: the three tool-listing sections pi wrote into the recorded prompt (the skills listing, pi's `tools` section and pi's `docs` section); the tool schemas stay because pi sends them from `-t`, and tool-labelled lines in briefs and AGENTS.md stay.
What the default gains and misses: a structural cut needs no label (tools labels fail agreement at κ 0.58) and covers the 20k skills listing; it misses command lines inside AGENTS.md and briefs, which a model-label cut would remove.
Cost of a wrong guess: hard to undo; a third of the treatment spend answers a question the owner did not ask.
If answered otherwise: the arm's section list in `study.json` changes, or the arm uses the label path T2 already pins.

Question: Which builder model runs every replay?
Default: openai-codex gpt-6.1-sol, thinking medium (the roster's small-lane builder today), pinned in `study.json` for the whole study whatever the roster later says.
What the default gains and misses: the verdicts describe the builder that will receive the redesigned context; it misses a cost anchor, since only one medium build is recorded (USD 0.59), which gpt-6-luna (122 builds, median USD 0.03) would give.
Cost of a wrong guess: hard to undo once runs start, since a model change invalidates every row; easy before.
If answered otherwise: one pinned value in `study.json` changes; a second model doubles the runs.

## Feature

Feature: FEAT-045 · Test which builder context changes builds

Purpose line: Replay past first builds with one kind of context removed, in a sandbox that reaches only the start
tree, grade them by frozen test manifests, and give each kind a verdict by a rule fixed before any paid run.

Under CAP-08, beside FEAT-042. This lane: rows R-3600 to R-3607. Artifact line: `A-101 · builder replay journal and
rows · user-home store: ~/<private --out folder>/journal.jsonl and rows.jsonl · manual: the seat runs node
apps/bench/replay.mjs run by hand with a private folder outside any git checkout; synthetic runs use OS temp`. Read by:
`code: apps/bench/replay.mjs` (`run` on resume, `report`).

Commands this lane adds:
```
node apps/bench/replay.mjs render   --contexts <anatomy-store> --labels <labels> --build <id> --arm <arm.json> --out <private-folder>
node apps/bench/replay.mjs run      --study <study-dir> --repo <repo> --contexts <store> --labels <labels> --out <private-folder> [--smoke] [--go]
node apps/bench/replay.mjs grade    --manifest <grading.json> --tree <private-clone> --out <private-folder>
node apps/bench/replay.mjs errors   --sessions <sessions-root>
node apps/bench/replay.mjs rows     --in <private-folder>
```
`run` with no `--go` prints the schedule, argv, sandbox profile hash and reserved spend, and spends nothing. An arm is
`{ "name", "dropSections": [...] }`, `{ "name", "dropLabel": "<function>" }` or `{ "name": "control" }`. The study
lane's `report` reads `rows`.

## Threat model

In scope, honest variation in our own tools' output:
- model nondeterminism; a builder that stalls, loops, hits the ceiling, exits early or spawns long-lived children;
- stored instructions that name absolute paths outside the clone, live checkouts and `~/.pi`;
- a builder that runs `git clone`, `gh` or `curl` against the public repo because its instructions mention GitHub;
- sessions with two attempts, context edits, compactions, CRLF, non-ASCII text, missing or extra sections;
- hidden tests with duplicate check names, dynamic text, early crashes, skipped checks and nested runner output;
- imports of an unnamed path (an incompatible test), as distinct from a missing named export (a model failure);
- pi streams with torn lines, cache-warm usage entries, a null cost, no `agent_settled`;
- a kill mid-run or mid-append; a dead-pid build record or suite lock; a build starting mid-run; two replay
  invocations at once;
- a reviewer reply that fails its schema or times out.

Out of scope, deliberate forgery: a builder that detects the replay and games it, hand-edited journals or rows, a
forged build record, a test written to print PASS lines it did not earn, a sandbox escape exploit. A finding outside
this model is a residual. Named residuals:
- network reads by a route the audit does not match (A2);
- gate and post-edit at their start-tip versions, which may differ from the versions that actually ran;
- macOS-only paid runs;
- builds before 2026-10-22, which have no build record.

## Precedent

- `apps/bench/run.mjs`, `apps/bench/lib/plan.mjs` (`rng`, `shuffle`, `readJsonl` torn-tail quarantine, the study
  fingerprint helper): resumable one-row-per-tuple runs with no retry. Imported. The replay manifest passes its extra
  hashes through the fingerprint helper rather than re-deriving one (attack M11).
- `apps/bench/run.mjs` interrupt salvage (`run-error: interrupted` with partial tokens and `cost: null`): the model
  for the journal's interrupted tuple. Followed.
- `apps/bench/lib/usage.mjs` (`parseStream`, `incompleteReason`, `costOfRecord`) and
  `packages/nana-pack/lib/pi-usage.mjs`: tokens, cost, turns, tool counts and completion, including on a partial
  stream for the kill limit. Imported.
- `apps/bench/lib/agentdir.mjs` (`prepareAgentDir`, `verifyAuth`): the prepared agent dir and shared credential.
  Imported, with retry and compaction settings copied from the source settings (A5) instead of `PINNED_SETTINGS`.
- `apps/bench/lib/profiles.mjs`: the argv and env builder shape. Followed; the replay env is built from an explicit
  allow-list, not inherited (attack M1).
- `apps/bench/ext/bench-nested-usage.ts`: a bench-owned pi extension loaded by `-e`. The form for
  `ext/replay-context.ts`. pi's `examples/extensions/prompt-customizer.ts` shows setting
  `event.systemPromptOptions.sections` in `before_agent_start`.
- `apps/bench/lib/checkers.mjs` (the grader-error boundary, and its rule that a module import error is a model
  failure, lines 216–225): followed for A9's split.
- `apps/bench/lib/anatomy-sessions.mjs` (attempt grouping, first system and user message), `anatomy-labels.mjs`
  (`readLabels`), `anatomy-measures.mjs` (`distinctUnits`, `normalize`): imported by the renderer. `assembleParts` is
  not changed (A13).
- `apps/bench/lib/anatomy-pulls.mjs`: pulls by class. It reads session entries; the replay normalizes JSON-mode events
  into the same tool-call shape first (attack S13) and then imports it.
- `scripts/test.mjs`: the per-file process-group spawn, temp HOME and tree kill (lines 145–163). Followed for A8. Its
  summary is not parsed.
- `scripts/test-locked.mjs` (`DEFAULT_LOCK_DIR`, the pid file): the busy check. The builder exports the lock path
  from there for a second caller (ruling 2026-10-22), the one change outside `apps/bench`.
- `packages/nana-pack/lib/build-records.mjs` (`readBuildLedger`; start records carry `pid`) and
  `packages/nana-pack/lib/lane-lock.mjs`: open-build detection with stale-pid handling. Imported.
- `packages/nana-pack/lib/claude-transcript.mjs` (`privateFolder` in maker mode): output guard. Imported.
- `scripts/memory-shape-runners.mjs` (`createRunner`): the optional isolated Claude reviewer with cost. Imported.
- `apps/bench/test/integration.test.mjs` and `apps/bench/test/anatomy-labels.test.mjs`: stub-child runs, synthetic
  stores and sentinel-privacy assertions. Followed in `apps/bench/test/replay.test.mjs`.

Map searches run: "replay a past lane from its start commit in a fresh repo", "run pi with isolated agent dir and
prepared settings", "parse pi json stream tokens cost tool calls turns", "seeded block schedule resume fingerprint",
"hidden test checker copy files after model exits", "paired sign flip test decision", "classify tool call errors from
session", "check whether a lane is building or suite lock held", "fixed reviewer count MUST findings",
"pre-registration study verdict". From the results I added `test-locked.mjs`, `scripts/test.mjs`, `lane-lock.mjs` and
`memory-replay.mjs`, the last for the study lane. No search found a sandbox wrapper or an error classifier; both are
new. Move: the suite-lock path export.

## Outside precedent

SWE-bench (MIT), borrow. It replays real repository tasks from the base commit in an isolated environment. It applies
gold tests only after the agent finishes, validates FAIL_TO_PASS and PASS_TO_PASS sets against the gold patch, and
logs per-test status from a parsed test log. This lane takes the after-exit overlay, the per-check status log and the
validated check classes, which come as manifest input. It does not adopt the Docker harness (A1).

Other public references:
- OpenAI Codex CLI's macOS Seatbelt sandbox (Apache-2.0), borrow: deny-by-default writes with an allow-listed
  workspace through `sandbox-exec`, the same mechanism as A1.
- pi's own containerization guide (`docs/containerization.md`), skip for now: Docker is the stronger boundary, but its
  daemon is not running here and it copies the OAuth credential.
- The study lane's measure references (pass@k, τ-bench pass^k, cost per resolved task, SWE-agent trajectory length)
  stay in its outline below.

## Must-meet

Eight tests, one row each in FEAT-045, all in `apps/bench/test/replay.test.mjs`, on synthetic fixtures with a stub pi
and a stub Claude. Live-sandbox cases run on macOS and SKIP elsewhere; the rest run on macOS, Linux and the Windows
CI leg. No test calls a model or spends. No seal test: this lane holds no study value (A12).

- T1 (R-3600). A run cannot read the future or touch anything outside its own folder. WHEN `replay run` starts a
  child, it shall start it under the generated sandbox profile with an env built from the allow-list only. Proves:
  the isolation the replay's validity rests on. Pins, with the real sandbox on macOS and a stub "builder" script in
  place of pi:
  - reads by absolute path, by `$HOME/...`, through a symlink planted in the clone, and from `node -e` all fail for:
    a sentinel file in a fake live checkout, a sibling replay's folder, the validation folder and a fake sessions
    folder;
  - a write to the fake live checkout fails, and a write in the clone succeeds;
  - `git rev-list --all` in the clone counts 1 and `git remote` is empty;
  - the grading overlay is absent from the clone until the stub's process tree, including a spawned grandchild, is
    confirmed dead;
  - a stub stream holding `git clone https://github.com/<repo>` marks the row `leak-suspect`;
  - off macOS, `run --go` exits nonzero with `replay: no isolation backend`.
- T2 (R-3601). Control is the recorded first attempt; an arm differs only by its kind. WHEN `replay render` builds an
  arm, it shall take attempt 0's system message and first user message only. It applies only the declared
  substitutions (A3), removes only the arm's sections or the units whose model label is the arm's function, rejoins
  `addendum` parts without added separators, and drops a heading or table header only when every unit under it was
  dropped. WHEN a run ends, it shall compare the run's own session system message with the expected bytes and mark a
  mismatch `harness: prompt-mismatch`. Proves: the control and treatment arms differ only in the dropped kind.
  Pins:
  - the control render equals the fixture session's recorded first system message, byte for byte, after
    substitutions;
  - a two-attempt fixture's attempt-2 sentinel and a later custom message's sentinel are absent from every arm;
  - an `addendum` split into preamble, brief and known-bugs rejoins exactly;
  - `dropSections` removes exactly those sections' bytes;
  - `dropLabel: lessons` removes a unit whose model label is lessons and keeps one whose rule label is lessons but
    model label is not;
  - an empty heading elsewhere survives;
  - an all-dropped table leaves no header row;
  - a stub pi whose session records a reordered prompt yields `prompt-mismatch`.
- T3 (R-3602). Checks are counted by stable ids, and broken code is not excused. WHEN `replay grade` runs a manifest,
  it shall copy only the manifest's overlay files after hash checks, run each file directly, and record each manifest
  check as `pass`, `fail`, `not-run` or `grader-broken` by A8. It shall score a missing named export, a syntax error
  and a missing implementation as failures. It shall mark an import of an unnamed path `grader-incompatible`. It
  shall print the worst-case and best-case bounds. Proves: grader faults are separated from model faults without
  erasing either. Pins:
  - two files with the same check text get distinct ids;
  - CRLF and a masked duration give the same id;
  - an early crash marks the remaining checks `not-run`;
  - a SKIP line is not a pass;
  - a nested runner's PASS line inside a check's output is not a check;
  - a builder file with a syntax error scores its checks as `fail`;
  - a missing manifest-named export is `fail`;
  - an import of an unnamed helper is `grader-incompatible`;
  - an overlay file whose hash differs refuses the grade with `replay: overlay mismatch`.
- T4 (R-3603). Spend is journalled before it is paid, and a tuple is never paid twice. WHEN `run --go` admits a
  tuple, it shall append a durable `start` line with the reserved allowance before spawning. It shall refuse to admit
  a tuple when spent plus reserved spend plus the allowance would pass the study cap. It shall kill a child whose
  running priced cost passes the kill limit. It shall charge a null-cost run at its full allowance. It shall leave a
  `start` with no `end` as `interrupted` with the partial spend from its saved stream, and skip it on resume. Proves:
  the cap holds within one turn's overshoot and crash recovery cannot double-pay. Pins:
  - a cap that admits two of three tuples stops before the third, with the journal showing why;
  - a stub stream crossing the kill limit is killed and its cost recorded;
  - a null-cost run is charged at its allowance;
  - a harness killed after `start` and before `end` resumes without spawning that tuple;
  - the smoke run and a reviewer call each count against the cap;
  - a failed review is `missing`, never `0`.
- T5 (R-3604). Every run gets one row of the measures. WHEN a tuple ends, it shall append one row holding:
  - lane, arm, repeat and the run-manifest hash;
  - every manifest check's outcome;
  - tokens by pi-ai Usage bucket and `totalTokens`, and cost from `parseStream` (or null with a reason);
  - wall time, turns, tool calls by tool, retries and compactions;
  - pulls by class and function, through `anatomy-pulls.mjs` after normalization;
  - the outcome: `settled`, `stall`, `ceiling`, `aborted: busy`, `launch-refused`, `leak-suspect` or
    `harness: prompt-mismatch`;
  - error-class counts (T8);
  - reviewer MUST count and cost when a review ran, else `missing`.

  The harness shall kill the whole child process tree at a stall or the ceiling before grading. Proves: the owner's
  time, tokens, tool calls and outcome measures exist for every run, and a stall grades as a run outcome, not a
  grader error. Pins:
  - one stub run's row, field for field;
  - a stub that stops emitting events gives `stall`, and its grandchild is dead before grading starts;
  - a stub stream in session-entry form and one in JSON-event form give the same tool and pull counts.
- T6 (R-3605). A replay stops when the machine gets busy, and two replays cannot share a folder. IF an open build
  record with a live pid exists, or the suite lock is held by a live non-replay pid, THEN `run` shall not start a
  child; `grade` shall not start a test; and a running child shall be killed within one `BUSY_POLL_MS`, with the
  tuple recorded `aborted: busy` and not re-paid. Proves: a replay yields to a live lane even when the lane starts
  after the replay began. Pins:
  - a live-lane stub record written after admission aborts the running stub within one poll;
  - a dead-pid open record and a dead-pid lock are ignored;
  - a second `run` on the same folder exits nonzero with `replay: folder in use`;
  - `grade` waits under the same check.
- T7 (R-3606). Any change to an input refuses to mix rows. WHEN `run` resumes a folder, IF the run manifest differs,
  THEN it shall refuse naming the changed input. The run manifest holds hashes of:
  - each rendered arm prompt;
  - the labels file and the context store record for each build;
  - the selected attempt;
  - each grading manifest and its overlay files;
  - the harness module files and the extension;
  - the sandbox profile;
  - the pi version;
  - `study.json`, including repeats and allowances;
  - the pre-registration file and its commit.

  Proves: one study identity means one intervention and one grader. Pins one refusal each for:
  - a changed labels file;
  - a changed context;
  - a changed overlay file;
  - changed repeats;
  - an edited pre-registration;
  - an uncommitted pre-registration (`replay: pre-registration not committed`).
- T8 (R-3607). Errors are counted in three separate layers by fixed rules. WHEN the classifier reads a run's events or
  a stored session, it shall count:
  - failed tool calls, once per call id, by tool and kind: `edit-mismatch`, `edit-not-unique`, `read-missing`,
    `bash-nonzero`, `bash-timeout`, `tool-other`;
  - diagnostics found in a failed call's own output, at most one per call by fixed precedence: `syntax`,
    `module-load`, `assertion`, `test-crash`, `test-timeout`, `lock`, `permission`, `network`, `no-remote`, else
    `unclassified`;
  - process outcomes from T5.

  It shall not count a successful call's output: a passing `grep`, a `cat` of a file containing "SyntaxError", or a
  red test the builder ran before writing code are not errors. It shall print the unclassified rate. It shall
  report `precedent-touch` (a failed call on a path the brief's Precedent names) in a column marked `proxy, not
  causal`. WHEN `replay errors` runs over a sessions folder, it shall print the same counts, split by build number,
  counts only. Proves: error types are measured the same way in replays and in the 600 past builds. Pins:
  - exact counts on a fixture with one of each class;
  - one call with two diagnostic matches counts once, by precedence;
  - the three negative cases count zero;
  - one call id seen twice counts once;
  - session form and event form give equal counts;
  - sentinel text in an error message is absent from all output.

Expected changes outside the new files (a forecast, not a limit):
- `REQUIREMENTS.md`: FEAT-045 under CAP-08, with A-101 and its Read by line.
- `apps/bench/README.md`: a "Builder context replay" section naming the five subcommands, the sandbox and its macOS
  scope, the journal and the cap's overshoot statement, the busy rule and how to test. Every command it names must
  run. Also the Layout block.
- `scripts/test-locked.mjs`: the lock-path export.
- The code map, runtime map and requirements tree, regenerated.

Grep tests and checkers for the bench README's Layout block, the CAP-08 deliverables lines and `DEFAULT_LOCK_DIR`
before editing them. No existing test should change.

## Lane 2 outline: `builder-drop-study` (planned after this lane lands)

Its own planner run writes the plan. These decisions are recorded now, so the attack's study findings are not lost:

- Grading manifests per lane (attack M8): built from the first brief, not the landed tree. Checks map to rows through
  the `req:` marker above their test call (the trace rail's association). A check whose row the first brief does not
  name is excluded, with a reason. Helpers in the overlay are audited, and a helper holding production logic is
  excluded, with a reason. The manifest is validated twice on the landed tip and once on the start tip; checks that
  vary between runs are flaky and excluded. Every exclusion is listed.
- Selection flow (attack S12): candidates → landed → valid manifest → drawn → graded, by stratum and arm, with a
  reason count at each step. The report's first line says verdicts apply only to eligible landed lanes in the replay
  environment.
- Control pilot (attack M4): control-only runs on every drawn lane before any treatment spend. Bar: control mean
  primary ≥ 0.5, and at least 60% of lanes with one resolved control run. Below the bar the study stops and reports
  `replay environment unfit`, with the fidelity inventory (A5).
- Deciding measure (attack M7): usable success per run. A run scores 0 when any pass-to-pass check fails or the run's
  outcome is not `settled`. Otherwise it scores the row-weighted fail-to-pass fraction, each row weighing equally,
  however many PASS lines it prints. Raw fail-to-pass fraction and resolved are diagnostics.
- Verdict order (attack M6), checked top-down, first match wins:
  1. `undecided: missing outcomes` when the verdict flips between the worst-case and best-case bounds of excluded
     runs;
  2. `undecided: too few lanes`;
  3. `undecided: control unfit` when control's lane mean is below the pilot bar;
  4. `undecided: noisy control` when control's within-lane range exceeds the margin;
  5. `needed`, by the one-sided exact sign-flip at α 0.05, Holm-corrected across the kinds tested;
  6. `no harm seen` only when the pre-registered upper confidence bound of the mean harm is below the margin;
  7. `undecided: insufficient precision` otherwise.

  `better without` is exploratory, not a verdict.
- Statistics (attack S14): fraction differences go to `signFlip` as exact `{n, d}` BigInt rationals built from check
  counts and repeat counts. Continuous secondaries (cost, tokens, time, turns) are descriptive: medians and paired
  differences, no p values. Power simulation: before treatment spend, a seeded simulation with lane-varying harms
  (pilot variance) prints the probability of `needed` at harm 0.2 and of `no harm seen` at harm 0. The lane count
  is fixed from it, up to the cap.
- Secondaries kept from the owner's addition, all deterministic:
  - resolved and pass@1 as c/n over repeats (Chen et al. 2021, human-eval, MIT);
  - pass^3 (τ-bench, MIT);
  - cost per resolved run (Kapoor et al. 2024, "AI Agents That Matter");
  - turns, tool calls and pulls (SWE-agent trajectory length, MIT);
  - error-class differences by arm;
  - grader-error and leak-suspect rates.
- Counterfactual error classes ("saved by precedent", "by a lesson", "by the tool list"): the causal measure is each
  error class's drop-against-control difference. `precedent-touch` stays a proxy. A blinded hand audit of 50 baseline
  error events checks the classifier's precision and unclassified rate before the replay counts are read. Any model
  labelling of errors stays outside the grading path, checked for agreement as the anatomy labeller was.
- Reviewer (attack N16): a supplementary audit on one repeat per lane and arm, given the brief, the diff and read
  access to the clone; `missing` when it fails; never in a verdict.
- Seals: model, repeats, allowances, kill limit, cap, margin, α, minimum lanes and pilot bar, in the study config,
  each pinned by a seal test naming its row.

## Cost estimate and schedule (for the study lane; the owner's go comes there)

Formula: total = (P + L × A × R) × b + V × r + s, with an enforced cap.
- P: pilot control runs; L: lanes; A: arms including control; R: repeats.
- V: reviewed runs; b and r: per-run builder and reviewer cost; s: one smoke run.

Each admitted run reserves its allowance, b at p90 plus the kill-limit margin, before launch (T4).

Where b comes from: the build-record ledger (`.git/nana/build-records.jsonl`, `end` lines' `cost`, pi's
`calculateCost` sum), read on 2026-11-02:

| Builder (thinking, slot) | Builds | Median USD | p90 USD | Max USD | Median min | p90 min |
|---|---|---|---|---|---|---|
| gpt-6.1-sol (medium, small) | 1 | 0.59 | 0.59 | 0.59 | 6 | 6 |
| gpt-6.1-sol (high, larger) | 70 | 1.64 | 3.23 | 5.17 | 56 | 118 |
| gpt-6-luna (high, small) | 122 | 0.03 | 0.10 | 0.32 | 15 | 52 |

The medium setting has one recorded build, so planning uses the high setting: median USD 1.64, p90 USD 3.23. Inferred,
not measured: medium costs no more than high. Reviewer cost is recorded nowhere; the planning figure is USD 0.75,
inferred, under a per-review cap of USD 1.50. Kill limit per builder run: USD 6, above the recorded maximum of 5.17.

Default study: P 20 (10 lanes × 2), L 10, A 3, R 3, V 30.
- Estimate: (20 + 90) × 1.64 + 30 × 0.75 + 1.64 ≈ USD 205.
- p90 ceiling: 110 × 3.23 + 30 × 1.50 + 3.23 ≈ USD 404, so the hard cap is USD 400.
- Overshoot: at most one model turn of the run in flight when the cap binds.
- Pilot alone: about USD 33.

All figures are pi's and Claude's list-price equivalents. The builder runs on an openai-codex login and the reviewer
on a Claude login. Inferred: subscription quota may absorb part of the cash cost. The smoke run's measured cost
replaces b, and the seat restates the estimate before the owner's go.

Machine time: 110 runs at 30 to 56 minutes is about 55 to 100 hours, serial. The seat starts `run --go` when no lane
is building, typically overnight, and starts no build while it runs. T6 aborts a run if a build starts anyway. Expect
about eight to twelve nights; the pilot alone takes about two.

## Seat steps for this lane (free, before the final round; counts only, after the identity scan)

1. `replay errors` over `~/.pi/agent/sessions` into `docs/reviews/builder-drop-2026-11-02/error-baseline.md`. This
   is the cheap half the owner asked about, and it belongs here: it uses the same classifier the replay rows use, it
   needs no spend, and it shows which error classes are frequent enough to read in a study.
2. One live-sandbox probe on this Mac with a stub builder (T1's cases against the real home), with the result in the
   lane notes. This is the seat's own check that the allow-list lets pi start; no model call is made.

## Disposition of the attack (plan-attack.md)

- M1 (isolation): taken. A Seatbelt sandbox with an allow-list and a filtered env replaces the temp HOME (A1). The
  network path is narrowed and audited (A2). Grading waits for a dead tree (A7). T1 pins reads, writes, symlinks,
  sibling runs and the overlay's timing.
- M2 (import failures): taken. Causes are split; named-interface failures are model failures (A9). Incompatible and
  broken runs carry worst and best bounds (T3). The study's first verdict check uses those bounds.
- M3 (check identity): taken. Files run directly, ids are file-qualified with occurrence and masks, and there are
  four outcome kinds (A8, T3).
- M4 (control is a new environment): taken. The estimand is stated in Purpose: control is a re-run. Gate, post-edit,
  retries and compaction are restored (A5). The fidelity inventory and control pilot are in the study outline.
- M5 (attempt leakage): taken. Attempt 0 only, `addendum` rejoined without separators, exact comparison with the
  run's own recorded prompt (A3, A4, T2).
- M6 (verdict order): taken in the study outline. Adequacy, missingness and noise come first; `no harm seen` needs an
  upper bound below the margin; a power simulation runs before treatment spend; six lanes became a pilot.
- M7 (deciding measure): taken in the study outline. Usable success is gated on pass-to-pass and a settled outcome,
  and rows weigh equally.
- M8 (landed-tip grader): taken. Manifests come from the first brief's rows and interface, with a helper audit and
  listed exclusions (study outline). This lane enforces overlay hashes (T3).
- M9 (spend cap): taken. Journal before spawn, reserved allowances, a priced kill limit, unknown cost charged in full,
  interrupted tuples never re-paid, overshoot stated as one turn (A10, T4).
- M10 (busy): taken, with the absolute claim withdrawn. Detection before and during runs, grading and validation;
  stale pids ignored; a folder lock; whole-tree kill (A11, T5, T6).
- M11 (fingerprint): taken. A replay manifest of every causal and grading input, passed through the shared
  fingerprint helper, with refusals pinned per input (T7).
- S12 (survivor selection): taken in the study outline. A selection flow by stratum and arm, a scope statement in the
  report's first line, and bounds for excluded runs.
- S13 (taxonomy): taken. Three layers, call-id dedup, precedence, negative fixtures, both input formats, an
  unclassified rate, `precedent-touch` marked non-causal (T8). The blinded hand audit is in the study outline.
- S14 (statistics API): taken in the study outline. Exact rationals for fractions, no p values for continuous
  secondaries, Holm across kinds, one pre-registered direction.
- S15 (behaviour over machinery): taken. The study seals moved to the study lane (A12). T1 and T2 test inaccessible
  data and preserved context directly. `assembleParts` is unchanged, and a replay renderer is added (A13).
- N16 (reviewer and blanket p values): taken. The reviewer is optional in the harness and a supplementary subset audit
  in the study. A failed review is `missing`. Blanket secondary p values are dropped.

## Owner questions — decided by the seat with an astra consult (2026-11-02)

The owner, away until 07:00 EST, said: "make your best judgment and then consult with pi Astra when you need me". The seat asked astra (pi, gpt-6-astra, read-only); the question and answer are `owner-consult-question.md` and `owner-consult-astra.md` in this folder. All three defaults stand. Two conditions go to the study lane: register an 80% power threshold for both planned decisions before the pilot, using the corrected verdict rule, and keep headroom under the cap for a one-turn overshoot; describe the tool-list arm as removing three listings (skills, tools section, docs section), not tool access. The owner can reverse any of this at 07:00.
