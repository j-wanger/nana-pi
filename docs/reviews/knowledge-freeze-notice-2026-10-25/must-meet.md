# knowledge-freeze-notice · must-meet of record (seat, 2026-10-25)

Feature: FEAT-003 · Index and connect existing knowledge sources

Written by the seat from the planner's draft (`plan-draft.md`, this folder) and one adversary pass (`plan-attack.md`, this folder; 1 MUST, 5 SHOULD, 10 NOTE). The seat took every finding: MUST 1 as option A, whose clause names the user and so also answers SHOULD 5; SHOULD 2, 3, 4 and 6 as written; NOTE 7 and 9 to 15 as written; NOTE 8 as the draft's choice to keep the repeat; NOTE 16 as a line in the seat's report. Plans get no review round. Where this file, the draft and the attack differ, this file holds.

The owner's decision, 2026-10-25: "Build the four (Recommended)". The owner lifted the 2026-10-24 pause for four page-free lanes from the artifact assessment: artifact-readers, adoption-window, knowledge-freeze-notice and review-texts-durable. The page stays frozen until the owner's readability discussion. The assessment listed this lane under FEAT-004; the draft moved it to FEAT-003, whose rows already define the broken-file state (R-2370 to R-2376, R-2407 to R-2409) and whose span registers A-052 (`REQUIREMENTS.md:298`). The seat keeps FEAT-003 and its report says so.

Spend line: the current priority (since 2026-10-23), every artifact made by an existing run and read by code. This lane gives A-052, the knowledge sources config, its first code readers outside its own feature, and shows A-004's age in doctor.

Stakes: high blast, reversible. Every eligible prompt in Claude Code and pi, and every doctor run, passes through the change. Nothing is written, migrated or retuned, so one revert undoes it.

Main is 61671be0 (impact-artifacts landed). Every file:line below was re-read there.

## What the code does today

- `loadSources` reads sources.json, returns no roots plus a `problem` when the file cannot be read or parsed, and writes a seeded file when it is absent (`packages/nana-knowledge/lib/sources.ts:165-189`; the ENOENT split at `:172`; the seed write at `:175-182`).
- With a problem, the build keeps every row (`packages/nana-knowledge/lib/build.ts:408-415`) and still writes `built_at` and checkpoints (`:420-424`), so the index file's mtime moves (R-2408).
- The pull starts a build only when the index file is at least `STALE_MS` old (`packages/nana-knowledge/lib/hook.ts:32`, `:51-55`, mtime from `build.ts:433-435`), and that build's output goes nowhere (`hook.ts:57-69`, `stdio: "ignore"`).
- So a broken file freezes the index: no root is scanned, new and changed files are never indexed, deleted files keep their rows, and the pull stays silent.
- Doctor's knowledge row only counts the docs table (`packages/nana-setup/lib/doctor.mjs:70-79`, row `:644-647`). Only a hand-run `build` or `status` shows the marker (`packages/nana-knowledge/bin/nana-knowledge.ts:46`, `:123-124`).
- The known-bug file records both gaps (`docs/known-bugs/FEAT-003.md:25-26`).

R-2371 to R-2375 promise that a build removes no row, that build and status print the marker, and that a rebuild keeps the index. Nothing promises that the pull or doctor tells anyone. This lane adds only that.

## Threat model

In scope, honest variation in our tools' output, files and environment:

- a sources.json with a single-backslash Windows path, a missing comma, a trailing comma, or no bytes (read mid-save);
- a folder at the sources.json path, the unreadable stand-in the sources-file tests already use on all three platforms;
- a good sources.json saved plain, UTF-8-marked, UTF-16LE-marked or with CRLF line ends, which must read as good;
- a sources.json that parses with the wrong shape (`{"roots": 5}`), which the build reads as no roots and does not call a problem;
- an absent sources.json, on a fresh machine before the first build or after a hand deletion;
- an index that is absent, fresh, older than one hour, or random bytes, while the file is broken;
- the pull reached from Claude Code (hook JSON on stdin) and from pi (the extension spawns the same CLI);
- doctor under `--home` and on the real home, over a docs-only index with no meta table (R-675's fixture), and over a `built_at` that is not a number, is 0, or lies in the future;
- Windows path forms in the doctor detail.

Out: deliberate forgery, such as a sources.json crafted to smuggle prompt text. The notice carries no file text anyway. A finding outside this model is a residual.

## Seat decisions

- **The clause names the user and no command (adversary MUST 1, option A; SHOULD 5).** `nana-knowledge` is not a PATH command (`packages/nana-setup/lib/steps.mjs:89-95`), and the notice reaches agents in every project. `SOURCES_FROZEN_CLAUSE` is "The knowledge index is frozen until the user repairs sources.json; the next build after the repair rescans it." That holds by `STALE_MS` and R-2408. In Claude Code the notice's reader is the model, so the clause says who must act. Doctor's fail detail adds a rescan command built from `KNOWLEDGE_CLI` (`steps.mjs:96`, which doctor already imports from at `doctor.mjs:34`): `` `node <KNOWLEDGE_CLI> build` ``, with the path in double quotes when it holds a space. Putting nana-knowledge on PATH is install-lane scope.
- **Keep R-2408: `built_at` still advances on a failed parse.** The sources-unparseable lane chose this on 2026-10-20, and R-2408 pins it. Stopping the refresh would start one detached build per eligible prompt past the hour, each scanning nothing and printing to no one. The freeze is a silence problem, not a retry problem.
- **The pull reads sources.json itself, never through `loadSources`,** which writes the file when it is absent. A flag the build writes into the index would lag up to an hour. A direct read shows the notice on the next prompt after the file breaks and drops it on the next prompt after the repair.
- **One notice line, first, outside the block.** The line is the `[nana:knowledge]` header, `sources.json` and `frozenNotice(problem)`. The pointer block follows unchanged, so R-222's 2000-character budget still holds for the block. The line is code text and integers only, needs no escaping, and names no path.
- **"Marker" has one meaning (NOTE 14):** the whole `formatSourcesProblem` output, as status prints it after the path, for example `UNPARSEABLE at line 3, column 19 (no roots read, rows kept). ` followed by the repair advice. `frozenNotice(problem)` is the marker, one space and `SOURCES_FROZEN_CLAUSE`. It lives in the new shared module, and the pull and doctor both import it, so the two surfaces cannot drift.
- **The notice prints on every pull that parses its input and passes the role and skip checks while the file is broken (SHOULD 4),** whatever the pull finds: hits, no hits, no index, all shown, past its budget, or an index that cannot be opened or queried. Role, `bad-json`, `bad-input` and skip returns stay first and print nothing.
- **No per-session dedup (NOTE 8).** The state is rare, and repeating it is the pressure to fix it. The line runs about 310 characters with the forward-slash advice. The shown file stays a set of pointer keys.
- **pull.log is unchanged.** A notice pull logs the reason and hits it would log with a good file; no new reason and no new field.
- **Doctor gets a `knowledge sources` row** through an exported `knowledgeSourcesState(file)` beside `knowledgeIndexState` (NOTE 10), returning `{ status, detail }` as `projectFileState` does. It is ok when the file parses (`{"roots": 5}` included, NOTE 11), a note when it is absent, and a fail carrying `frozenNotice(problem)` and the rescan command when it is broken. Every detail leads with the file path. The label differs from install's `knowledge index` dry-run row (`steps.mjs:786-791`), so doctor's last line sends the fail to "fix by hand".
- **Doctor's `knowledge index` row adds the build age.** `knowledgeIndexState(dbPath, DatabaseSync, now)` reads `built_at` from the database it already opens and words it as status does (`built 2.5h ago`, one decimal). It says `no build time recorded` when the value is missing, not a positive finite number, or later than now (NOTE 9). The row's status follows R-675 alone. Doctor judges no age too old: a threshold would be a new tunable nobody asked for.
- **One shared reader, in a new `.mjs` module.** The read-and-classify step of `loadSources`, `formatSourcesProblem` and its two marker constants move to `packages/nana-knowledge/lib/sources-file.mjs`, which also holds `SOURCES_FROZEN_CLAUSE` and `frozenNotice`. Its purpose sentence: "Read sources.json into a parsed value or a safe problem, and word that problem." It imports only `node:fs` and `../../nana-pack/lib/json-text.mjs`. It must be `.mjs`: doctor cannot import `.ts`, because it runs below the type-stripping floor to report that floor (`doctor.mjs:116-121`, `:135-136`). The `SourcesProblem` type stays in sources.ts and describes what the reader returns.
- **The nana-setup to nana-knowledge edge is allowed.** The code map has one packages layer whose imports are free (`code-map.config.json`). The known-bug remark that sharing "would cross a package boundary" (`docs/known-bugs/FEAT-015.md:43`) does not match the map's rule.
- **Rows the notice would make false are amended (SHOULD 3), with no test change.** R-225 (`REQUIREMENTS.md:393`) ends: "; R-2860's frozen-index notice is the one exception to printing nothing." R-217 (`:381`) ends: "; R-2860's frozen-index notice line, when it prints, comes before the block and is the one exception to that line count." Their tests run with a good file and stay as they are.
- **Ledger Reads lines name the caller and the helper (NOTE 7),** as `REQUIREMENTS.md:377` and `:1534` do. FEAT-004 gains `Reads: A-052 · packages/nana-knowledge/lib/hook.ts, packages/nana-knowledge/lib/sources-file.mjs` after `:377`. FEAT-015 gains `Reads: A-052 · packages/nana-setup/lib/doctor.mjs, packages/nana-knowledge/lib/sources-file.mjs` between the A-025 and A-053 lines (`:1541-1542`). R-217's pull deliverables and R-341's doctor deliverable (`:105-106`, `:1082`) do not gain A-052 in `built from:`; the artifact-readers lane decides that (SHOULD 6).
- **Header edits (SHOULD 3).** hook.ts (`:1-14`): the purpose and outputs name the notice line before the block; inputs gain sources.json bytes at `paths.sources`; effects gain the read; errors and the line-14 contract comment say a failure reason can come with the notice line. sources.ts drops the marker formatter from its outputs (`:7-8`). doctor.mjs gains `<knowledgeHome>/sources.json` in its inputs (`:10`) and `knowledgeSourcesState()` in its outputs (`:15`). sources-file.test.mjs's "Seven PASS/FAIL lines" (`:5`) becomes ten. doctor-knowledge.test.mjs's purpose covers the sources row and the age.
- **README (written, not pinned).** `packages/nana-knowledge/README.md`: the sources.json paragraph (`:79-84`) says every eligible pull prints the notice and doctor shows a ✗ row; the hook paragraph (`:155-156`) says a notice line can come before the block; the fail-open bullet (`:173-174`) names the notice as the one exception to printing nothing. `packages/nana-setup/README.md:58` names the sources row and the build age.
- **Not in this lane:** a sources-mtime trigger that would rebuild right after an edit; a size cap on the read; status's and build's seeding of an absent file; `nana-setup project`'s refresh summary; listing missing roots in doctor; A-052's `Artifact:` line, which the artifact-readers lane rewords; the wrong-shape purge; `loadRoots` dropping the problem; putting nana-knowledge on PATH.
- **Known bugs (the seat, before the final round):** the seat cuts `docs/known-bugs/FEAT-003.md:25` to the project summary part, removes `:26`, and notes on `:48` that pulls now print the notice.

## Must-meet rows (FEAT-003)

R-2860, R-2861 and the seal go in `packages/nana-knowledge/tests/sources-file.test.mjs`. They call `runHook` in-process, switching homes as `recover.test.mjs` does with `NANA_ROLE` deleted, and pass a no-op `spawnFn` so no build seeds or refreshes anything. They reuse F1 to F4 and the folder stand-in. R-2862 and R-2863 go in `packages/nana-setup/tests/doctor-knowledge.test.mjs`. Their file cases call `knowledgeSourcesState` and `knowledgeIndexState` directly; one `diagnose` case covers the label, a home with no index and the no-write check.

- **R-2860.** IF sources.json exists but does not parse or cannot be read, THEN every knowledge pull that parses its input and passes the role and skip checks shall print as its first output line one notice holding the `[nana:knowledge]` header, `sources.json`, the file's marker as the status command prints it and `SOURCES_FROZEN_CLAUSE`, followed by the pointer block when the pull has one, whether it finds pointers, finds none, has no index, has shown them all, runs past its budget, or cannot open or query the index.
  - Test: `R-2860: a pull with an unparseable or unreadable sources.json prints one frozen-index notice line first, with or without pointers`.
  - Cases: F1 over a built index whose article matches the prompt gives the notice, then lines equal to `renderBlock` of the same hits, reason `ok`. F3 gives the manual advice and no place. F4 and the folder (UNREADABLE) each give the notice. A prompt with no hits, a home with no index.db, the same prompt again in one session, an index of random bytes, and a pull past its budget before retrieval (`budgetMs: -1`, as `hook.test.mjs:195`) each give the notice alone, with reasons `no-hits`, `no-index(spawned)`, `all-shown`, `db-open-failed` or `query-failed`, and `budget`. The expected marker is cut from `status` stdout for the same file.
  - More cases: reviewer role, worker role, a too-short prompt, bad JSON and a JSON non-object each give null output. The hook command over F1 and a fresh index, given the payload as `input` with `NANA_ROLE` removed from its environment, prints the notice as stdout's first line, exits 0 and leaves stderr empty. Each logged notice pull's pull.log line has exactly R-231's keys and the HookResult's reason; for the hit and no-hit prompts, a twin pull with a good file in a fresh session gives the same reason.
  - Red: the notice only when hits exist; the notice after the block or inside its budget, so a pointer drops; a budget return left silent; a marker worded apart from status (place or advice differs); the parser's message or any file text in the line; the notice for a role, bad input or a skipped prompt; a new pull.log reason or field; the line printed twice; a read error that throws out of `runHook`.
- **R-2861.** WHILE sources.json parses or is absent, a knowledge pull shall print no notice line, and its own read of the file shall neither create nor change it (a build the pull starts still seeds an absent file, as today).
  - Test: `R-2861: a pull with a parsing or absent sources.json prints no notice, and its own read never creates or rewrites the file`.
  - Cases: plain, UTF-8-marked, UTF-16LE-marked and CRLF good files, each over a fresh index; `{"roots": 5}`; an absent file over a fresh index. Each output starts with the block header or is null, and the bytes, or the absence, are unchanged after the pull.
  - Red: the pull calls `loadSources`, which seeds the absent file; the read step writes the file; the pull parses text with `JSON.parse`, so marked files read as broken; a notice keyed on "no roots", so the wrong-shape file prints it; a notice for an absent file.
- **R-2862.** WHEN doctor runs, it shall return one `knowledge sources` row whose detail leads with the sources.json path and that is ok when the file parses, a note that the next build seeds it when the file is absent, and a fail holding the file's marker as the status command prints it, `SOURCES_FROZEN_CLAUSE` and a rescan command that runs the knowledge CLI by its path when the file does not parse or cannot be read, and doctor shall leave the file absent or byte for byte as it found it.
  - Test: `R-2862: doctor's knowledge sources row is ok for a parsing file, a note for an absent one and a fail naming the marker, the frozen index and a rescan command for a broken one, and never writes the file`.
  - Cases (`knowledgeSourcesState`): plain and UTF-16LE-marked good files and `{"roots": 5}` give ok. F1 gives a fail holding `UNPARSEABLE at line 3, column 19 (no roots read, rows kept).` and `FORWARD_SLASH_ADVICE`, as R-2373's test spells it. F3 gives a fail with `MANUAL_JSON_ADVICE` and no file text. The folder gives a fail holding `UNREADABLE (no roots read, rows kept)`. Each fail holds `SOURCES_FROZEN_CLAUSE` and `node <KNOWLEDGE_CLI> build`, the path quoted when it holds a space. An absent file in a folder that does not exist gives a note, and neither the file nor its folder appears. Each detail starts with the file path, and each existing file's bytes are unchanged. Case (`diagnose`): a home with no index.db and no sources.json gets one `knowledge sources` note row, distinct from the `knowledge index` row, and the file stays absent.
  - Red: doctor ports `loadSources`' seed, so the absent file or its folder appears; doctor parses text, so the UTF-16 file fails; a wrong-shape file failed; an ok or note for a broken file; the parser's message in the detail; a marker worded apart, so the place is missing; the rescan command named as `nana-knowledge build`, or missing; the detail not led by the path; the row reusing the `knowledge index` label; the row missing without an index; a throw out of `diagnose`.
- **R-2863.** WHEN doctor's `knowledge index` row counts the docs table, its detail shall also give the age of the index's `built_at` value as status words it (`built 2.5h ago`), or `no build time recorded` when that value is missing, not a positive finite number, or later than now, and the row's status shall follow R-675 alone.
  - Test: `R-2863: doctor's knowledge index row gives the built_at age in hours and stays ok when no build time is recorded`.
  - Cases (`knowledgeIndexState` with an injected `now`): an index with docs and `built_at` 2.5 hours before `now`, its file mtime set a day earlier, gives `built 2.5h ago` with the docs count. R-675's docs-only fixture with no meta table stays ok with `no build time recorded`. A `built_at` of `abc`, of `0`, and one hour after `now` each give the same words. R-675's three checks stay as they are.
  - Red: the age from the file's mtime; a missing meta table turning the row to fail; minutes, or wording apart from status's; `NaN`, a negative age or about 490,000 hours in the detail; the docs count dropped from the detail.

Four rows, R-2860 to R-2863, after R-2409 (`REQUIREMENTS.md:341`), each `untested` then `implemented`. R-2864 to R-2867 stay free.

One seal test with no row, naming R-2860 and R-2862: `seal: the frozen-index clause reads "The knowledge index is frozen until the user repairs sources.json; the next build after the repair rescans it."`. Every other assertion imports `SOURCES_FROZEN_CLAUSE` by name. Red: a clause that names no actor ("until sources.json is repaired"); a clause that names `nana-knowledge build`.

Tunables, in `packages/nana-knowledge/lib/sources-file.mjs` with provenance beside each: `SOURCES_FROZEN_CLAUSE` (contract, R-2860 and R-2862, sealed; the seat's wording 2026-10-25); `UNPARSEABLE_MARKER` and `UNREADABLE_MARKER` move unchanged with their contract note (R-2372, R-2375). No numeric tunable is added. The hour unit and one decimal follow status's existing form.

Existing tests stay unchanged. The builder confirms that R-2370 to R-2376, R-2407 to R-2409, discovery's R-240 seed checks, R-675's three checks, R-217, R-222, R-225, R-231 and the extension's R-233 checks still pass. The builder reports a notice pull's `ms` in pull.log beside the same pull with a good file: a measurement, not a row.

## Precedent

- Read-and-classify step: `packages/nana-knowledge/lib/sources.ts:165-189` (the read, the ENOENT split at `:172` and the parse at `:184-189`). It moves into `readSourcesFile(file)` in the new module, minus the seed; `loadSources` calls it with `paths.sources` and seeds only on "absent".
- Marker formatter and constants: `sources.ts:151-163`. They move unchanged. `packages/nana-knowledge/bin/nana-knowledge.ts:19` then imports `formatSourcesProblem` from the new module (used at `:38`, `:46` and `:124`).
- `frozenNotice(problem)`: `packages/nana-pack/lib/json-text.mjs:51-57` (`configFailureDetail`, one shared detail joiner both callers import).
- A `.ts` module importing a shared `.mjs`: `sources.ts:25-30` and `hook.ts:24`. nana-setup importing one: `doctor.mjs:26`.
- Why `.mjs`: `doctor.mjs:116-121` (a rule restated because nana-setup cannot import `.ts` on its Node floor) and `:135-136` (`NODE_FLOOR`).
- Doctor state function and shape: `doctor.mjs:70-79` (`knowledgeIndexState`, its injected `DatabaseSync`), `:123-133` (`projectFileState`'s `{ status, kind, detail }`), `:312-324` (`piPackConfigState`, a doctor-side file read that never throws).
- Absent file as a note row: `doctor.mjs:597-598` (mcp.json).
- Index row: `doctor.mjs:644-647`. The sources row goes right after it.
- Rescan command: `steps.mjs:96` (`KNOWLEDGE_CLI`), run by `stepKnowledge` at `:793`.
- Age wording: `nana-knowledge.ts:134` (reads `built_at`) and `:145-146` (`built ${ageH}h ago`, one decimal). Doctor restates the meta query (`packages/nana-knowledge/lib/db.ts:130-133`) and the one-line wording, as it restates the docs count, because it cannot import `db.ts`. This is a declared departure, with `doctor.mjs:116-121` as precedent.
- Notice placement: `hook.ts:39` (`HEADER`), `:105-128` (`renderBlock`, untouched), `:141-158` (`finish` and `none`, which carry the notice so every later return prints it first). The role, input and skip returns stay first (`:159-168`); the read goes after `:168` and before `ensureFreshIndex` at `:170`.
- Repair advice: `json-text.mjs:17-19` (`FORWARD_SLASH_ADVICE`, `MANUAL_JSON_ADVICE`), imported by name.
- pi path, unchanged: `packages/nana-knowledge/extensions/nana-knowledge.ts:115-116` and `:170` inject the CLI's stdout as one message.
- Tests: `sources-file.test.mjs:19-22` (F1 to F4), `:24-34` (`fixture`), `:36-42` (`run`, which passes no stdin and spreads `process.env`), `:58-63` (byte marks from numeric codes), `:94-101` (the folder stand-in), `:123` (R-2373's exact marker). `recover.test.mjs:18` (in-process `runHook`), `:25-27` and `:54-59` (`activate`, `NANA_ROLE` deleted). `hook.test.mjs:41-42` (`payload`, `noSpawn`) and `:195` (the pre-retrieval budget). `doctor-knowledge.test.mjs:28-37` (R-675's fixture; `ProbeDatabase` at `:35`, whose `prepare` answers any query with `{ n: 0 }`).
- Registry: `REQUIREMENTS.md:377` and `:1534` (Reads lines naming a caller and its helper).
- Declined: `packages/nana-pack/lib/bounded-read.mjs` (`BOUNDED_READ_CAP`, the hook-time config reader, as at `packages/nana-pack/lib/adoption.mjs:95`). The lane keeps `readFileSync` so that the build, status, the pull and doctor classify the same file through one read; a cap would give the pull a fourth outcome the build does not have (NOTE 15).

One private helper moves to a shared module: `loadSources`' read-and-classify step, with `formatSourcesProblem` and its markers, into `packages/nana-knowledge/lib/sources-file.mjs` (the 2026-10-22 ruling: the pull and doctor are its second and third callers). No other helper moves.

## Page effect

This lane adds no page or desk code. The page shows, as data: A-052's Artifacts card going from `Read in: none` (`scripts/product-report.mjs:877`) to two `Read in:` lines (R-2799); four new FEAT-003 rows; the amended R-217 and R-225 texts; and changed outline `Reads:` lines for FEAT-004 and FEAT-015 (R-2796, `docs/requirements-tree.md` regenerated). The deliverable count line does not move, because no `Made by:` claim names A-052. The desk's `⧉ nana-knowledge` bubble shows the notice, and it now appears on no-hit turns that showed nothing before.

## Overlap

Three sibling lanes run beside this one: artifact-readers, adoption-window and review-texts-durable. Artifact-readers also declares a reader for A-052 and rewords its entry; this lane adds only the two Reads lines above. Whichever lane lands second merges main and regenerates `docs/requirements-tree.md` and `docs/code-map.md`.

## Class and builder

A hook lane under the AGENTS.md ladder: it changes the Claude Code UserPromptSubmit hook's output and, through the same CLI, the pi extension's injected message, and it changes nana-setup doctor. It gets the final reviewer (Opus), the land reviewer (astra), the seat's wrong-code pairs (the red cases above), one independent check and the local macOS install check before `nana-land`. The roster names a land model, so no seat-land file is due. The mutation runner re-runs after any seat change.

The small builder, one session (`pi-worker --lane-size small`). The seat pushes the draft pull request at build 1's tip and reads its Windows leg before the review brief. The folder-as-file read error, the CRLF file and the doctor detail's path form are the Windows-sensitive parts.

The independent check runs the worktree's hook CLI and doctor against a scratch knowledge home. It breaks sources.json four ways and reads the notice in the Claude Code form (hook JSON on stdin) and the pi form (`makePull`). It runs doctor's rescan command exactly as doctor prints it. It repairs the file, sees the notice vanish on the next pull and the index rescan after that command, and reads both doctor rows.

## Known limits (the seat writes them before the final round)

- The notice repeats on every eligible pull while the file stays broken; there is no per-session dedup.
- After a repair the notice stops at once, but the index rescans only at the next build: within an hour, or at once by hand.
- While the file is broken, builds still refresh the index age (R-2408), so doctor's age looks fresh beside the ✗ sources row.
- A file that parses with the wrong shape still reads as no roots, purges rows and gets no notice.
- A pull that lands during an editor's save can read an empty or briefly locked file and print the notice once.
- The pull reads the whole sources.json on every eligible prompt, with no size cap.
- The CLI's own deadline (`nana-knowledge.ts:92-97`) exits with nothing printed, so a pull stopped at 1.5 s drops the notice.
- In Claude Code the notice reaches the model; the owner sees it only through the model or the transcript view (inferred from Claude Code's hook docs, not checked).
- The notice names sources.json but not its folder; doctor and status show the full path.
- If a regular file sits where the knowledge folder should be, POSIX reads UNREADABLE (a notice) and Windows reads absent (no notice). No test uses that stand-in.
- Builders and reviewers never see the notice, by the 2026-10-09 ruling on automatic pulls.
- Doctor shows the index age but calls no age too old.
- Doctor's rescan command builds the knowledge home the CLI resolves, not one named by `--home` or `--pi-home`, and needs Node 22.18 or later.
- nana-knowledge is not on PATH, so the notice names no command.
- Doctor does not list missing roots; status still does.
- `status` and `build` still seed an absent sources.json through `loadSources`.
- `nana-setup project`'s refresh summary still shows no marker.
- R-217's pull deliverables and R-341's doctor deliverable do not list A-052 in `built from:`; the artifact-readers lane decides.
- R-2863 sits in FEAT-003, while R-675, doctor's knowledge-row contract, sits in FEAT-015 (`REQUIREMENTS.md:1655`).
