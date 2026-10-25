# knowledge-freeze-notice · plan draft (planner, 2026-10-25)

Feature: FEAT-003 · Index and connect existing knowledge sources

Why FEAT-003 and not FEAT-004: the owner learns that FEAT-003's own sources config (A-052) is broken and its index (A-004) is frozen. The rows that already define that state and its markers sit in FEAT-003 (R-2370 to R-2376, R-2407 to R-2409). The two code readers sit in FEAT-004 (the pull) and FEAT-015 (doctor); the ledger records them as Reads lines.

Source of the decision: the owner's pick on 2026-10-25, "Build the four", after the artifact consumer assessment (`<scratch>/assess/out/report.md` section 3b, A-004 and A-052; section 7, lane 7). The assessment's critic confirmed the freeze by reading the code.

Spend line: the current priority since 2026-10-23: every artifact made by an existing run and read by code. This lane gives A-052 its first code readers outside its own feature, and it shows A-004's age in doctor.

Stakes: high blast, reversible. Every eligible prompt in Claude Code and pi, and every doctor run, passes through the change. Nothing is written, migrated or retuned, so one revert undoes it.

Threat model: honest variation in our tools' output, files and environment is in scope. Concretely:

- a sources.json with a single-backslash Windows path, a missing comma, a trailing comma, or no bytes (read mid-save);
- a folder at the sources.json path, the unreadable stand-in the sources-file tests already use on all three platforms;
- a good sources.json saved plain, UTF-8-marked or UTF-16LE/BE-marked, which must read as good;
- a sources.json that parses with the wrong shape (`{"roots": 5}`), which the build reads as no roots and does not call a problem;
- an absent sources.json, on a fresh machine before the first build or after a hand deletion;
- an index that is absent, fresh, older than one hour, or random bytes, while the file is broken;
- the pull reached from Claude Code (hook JSON on stdin) and from pi (the extension spawns the same CLI);
- doctor under `--home` and on the real home, over a docs-only index with no meta table (R-675's fixture), and over a non-numeric `built_at`;
- CRLF line ends and Windows path forms in the doctor detail.

Deliberate forgery is out, such as a sources.json crafted to smuggle prompt text. The notice carries no file text anyway. A finding outside this model is a residual.

## What the code does today (main d3cf9a0d, every line read)

- `loadSources` reads sources.json, returns no roots plus a `problem` when it cannot be read or parsed, and writes a seeded file when it is absent (`packages/nana-knowledge/lib/sources.ts:166-198`, seed write `:175-182`).
- With a problem, the build keeps every row through the preserved branch (`packages/nana-knowledge/lib/build.ts:408-415`). It still writes `built_at` and checkpoints (`:420-424`), so the index file's mtime moves.
- The pull starts a build only when the index file is at least `STALE_MS` old (`packages/nana-knowledge/lib/hook.ts:32`, `:51-55`). That build's output goes nowhere (`stdio: "ignore"`, `:59-63`).
- So a broken file freezes the index: no root is scanned, new and changed files are never indexed, deleted files keep their rows, and the pull stays silent.
- Doctor's knowledge row only counts the docs table (`packages/nana-setup/lib/doctor.mjs:70-79`, row `:644-647`). Only a hand-run `build` or `status` shows the mark (`packages/nana-knowledge/bin/nana-knowledge.ts:46`, `:123-124`).
- The known-bug file already records both gaps (`docs/known-bugs/FEAT-003.md:25-26`).

What R-2371 to R-2374 already promise: a build removes no row (R-2371), the build command prints the UNPARSEABLE line (R-2372), status marks the file (R-2373), and a rebuild keeps the index (R-2374). R-2375 covers an unreadable file at build. R-2408 pins that a build over a broken file still refreshes a healthy index's age. Nothing promises that the pull or doctor tells anyone. This lane adds only that.

## Seat decisions

- **Keep R-2408: `built_at` still advances on a failed parse.** The sources-unparseable lane chose this on 2026-10-20 ("the meta rows still refresh, so the hook does not start a doomed build on every prompt"), and R-2408 pins it. Stopping the refresh would start one detached build per eligible prompt past the hour. Each would scan nothing, fix nothing and print to no one. The freeze is a silence problem, not a retry problem. The notice costs one small file read and no process. The one thing retry would buy is a rescan on the first prompt after a repair; the notice tells the owner to run `nana-knowledge build` instead.
- **The pull reads sources.json itself, never through `loadSources`.** `loadSources` writes the file when it is absent. A flag the build writes into the index would lag up to an hour and needs a build change. A direct read shows the notice on the next prompt after the file breaks and drops it on the next prompt after the repair.
- **One notice line, first, outside the block.** The line is the `[nana:knowledge]` header, `sources.json`, the marker status prints, and `SOURCES_FROZEN_CLAUSE`. The pointer block follows unchanged, so R-217's N+1 lines and R-222's 2000-character budget still hold for the block. The line is code text and integers only, so it needs no escaping, and it names no path.
- **The notice prints on every eligible pull while the file is broken, whatever the pull finds.** That includes no hits, no index, all pointers shown and an index that cannot be opened. That last state is the worst: R-2407 keeps a damaged index while the file is broken, so pulls fail silently until repair. Role and skip checks still come first, so builders, reviewers and skipped prompts get nothing.
- **No per-session dedup of the notice (subtraction).** The state is rare, and repeating it is the pressure to fix it. The shown file stays a set of pointer keys. This is the decision the seat may most want to change; see the summary.
- **pull.log is unchanged.** A notice pull logs the reason it would log with a good file; no new reason and no new field, because nothing reads one.
- **Doctor gets a `knowledge sources` row.** It is ok when the file parses, a note when it is absent (the mcp.json precedent), and a fail carrying the marker and `SOURCES_FROZEN_CLAUSE` when it is broken. The label is distinct from install's `knowledge index` dry-run row, so doctor's last line says to fix it by hand.
- **Doctor's `knowledge index` row adds the build age.** It reads `built_at` from the meta table it already opens and words it as status does (`built 2.5h ago`). It says `no build time recorded` when the value is missing or not a number. The row's status still follows R-675 alone. Doctor judges no age as too old: a threshold would be a new tunable nobody asked for.
- **One shared reader, in a new `.mjs` module.** The read-and-classify step of `loadSources`, the formatter `formatSourcesProblem` and its two marker constants move to `packages/nana-knowledge/lib/sources-file.mjs`. The pull and doctor are second callers, so they import it (the 2026-10-22 ruling); `loadSources` and the build command call it too. It must be `.mjs` and import only `node:fs` and `json-text.mjs`: doctor cannot import `.ts`, because it has to run on a Node below the type-stripping floor to report that floor (`doctor.mjs:117-120`, `:135-136`).
- **The new edge nana-setup to nana-knowledge is allowed.** The code map has one packages layer whose imports are free (`code-map.config.json` layers). Doctor already imports nana-pack's modules the same way. The known-bug remark that sharing "would cross a package boundary" (`docs/known-bugs/FEAT-015.md:43`) does not match the map's rule. The new module must not import `paths.ts`, `sources.ts` or `node:sqlite`; the builder shows its map callees are `json-text.mjs` alone.
- **Not in this lane:** a sources-mtime trigger that would rebuild right after an edit; a size cap on the read; status's own seeding of an absent file; `nana-setup project`'s refresh summary; listing missing roots in doctor; A-052's Artifact maker line, which the artifact-readers lane rewords; the wrong-shape purge; `loadRoots` dropping the problem.
- **Ledger edits (written, not pinned):** FEAT-004 gains `Reads: A-052 · packages/nana-knowledge/lib/hook.ts`, and FEAT-015 gains `Reads: A-052 · packages/nana-setup/lib/doctor.mjs`. The tree and the code map are regenerated. If artifact-readers lands first, the builder rebases these two lines onto its ledger.
- **README (written, not pinned):** the knowledge README's sources.json paragraph (`packages/nana-knowledge/README.md:79-84`) says every pull prints the notice and doctor shows a ✗ row. The setup README's knowledge row (`packages/nana-setup/README.md:58`) names the sources row and the build age.
- **Known bugs (the seat, before the final round):** the seat rewrites `docs/known-bugs/FEAT-003.md:25` to keep only the project summary part. It removes `:26`, and it notes on `:48` that pulls now print the notice.

## Must-meet rows (FEAT-003)

Tests for R-2860, R-2861 and the seal go in `packages/nana-knowledge/tests/sources-file.test.mjs`. They call `runHook` in-process, switching homes as `recover.test.mjs` does, with an injected no-op `spawnFn` so no build seeds or refreshes anything. They reuse the file's fixtures F1 to F4 and its folder stand-in. Tests for R-2862 and R-2863 go in `packages/nana-setup/tests/doctor-knowledge.test.mjs`.

- **R-2860.** IF sources.json exists but does not parse or cannot be read, THEN every knowledge pull that passes the role and skip checks shall print as its first output line one notice holding the `[nana:knowledge]` header, `sources.json`, the marker the status command prints for that file and `SOURCES_FROZEN_CLAUSE`, followed by the pointer block when the pull has one, whether it finds pointers, finds none, has no index, has shown them all, or cannot open or query the index.
  - Test: `R-2860: a pull with an unparseable or unreadable sources.json prints one frozen-index notice line first, with or without pointers`.
  - Cases: F1 over a built index whose article matches the prompt gives the notice, then lines equal to `renderBlock` of the same hits, reason `ok`. F3 gives the manual advice and no place. F4 and the folder (UNREADABLE) each give the notice. A prompt with no hits, a home with no index.db, the same prompt again in one session and an index of random bytes each give the notice alone. The expected marker is cut from `status` stdout for the same file.
  - More cases: reviewer role, worker role and a too-short prompt give null output. The hook command over F1 prints the notice as stdout's first line, exits 0 and leaves stderr empty. Each pull.log line names the same reason as the same pull with a good file.
  - Red: the notice only when hits exist; the notice after the block or inside its budget, so a pointer drops; a marker worded apart from status (place or advice differs); the parser's message or any file text in the line; the notice for a role or a skipped prompt; a new pull.log reason; the line printed twice; a read error that throws out of `runHook`.
- **R-2861.** WHILE sources.json parses or is absent, a knowledge pull shall print no notice line and shall leave sources.json absent or byte for byte as it found it.
  - Test: `R-2861: a pull with a parsing or absent sources.json prints no notice and never creates or rewrites the file`.
  - Cases: plain, UTF-8-marked and UTF-16LE-marked good files, each over a fresh index; `{"roots": 5}`; an absent file over a fresh index. Each output starts with the block header or is null, and the bytes, or the absence, are unchanged after the pull.
  - Red: the pull calls `loadSources`, which seeds the absent file; the pull parses UTF-8 text with `JSON.parse`, so marked files read as broken; a notice keyed on "no roots", so the wrong-shape file prints it; a notice for an absent file.
- **R-2862.** WHEN doctor runs, it shall return one `knowledge sources` row that is ok when sources.json parses, a note that the next build seeds it when it is absent, and a fail holding the UNPARSEABLE or UNREADABLE marker the status command prints and `SOURCES_FROZEN_CLAUSE` when it does not parse or cannot be read, and shall leave the file absent or byte for byte as it found it.
  - Test: `R-2862: doctor's knowledge sources row is ok for a parsing file, a note for an absent one and a fail naming the marker and the frozen index for a broken one, and never writes the file`.
  - Cases: plain and UTF-16LE-marked good files give ok. F1 gives a fail holding `UNPARSEABLE at line 3, column 19 (no roots read, rows kept).` and `FORWARD_SLASH_ADVICE`, as R-2373's test spells it. F3 gives a fail with `MANUAL_JSON_ADVICE` and no file text. The folder gives a fail holding `UNREADABLE (no roots read, rows kept)`. An absent file gives a note and stays absent. One case has no index.db and still gets the row.
  - Red: doctor ports `loadSources`' seed, so the absent file or its folder appears; doctor parses UTF-8 text, so the UTF-16 file fails; an ok or note for a broken file; the parser's message in the detail; a marker worded apart, so the place is missing; the row reusing the `knowledge index` label; the row missing without an index; a throw out of `diagnose`.
- **R-2863.** WHEN doctor's `knowledge index` row counts the docs table, its detail shall also give the age of the index's `built_at` value in hours in status's form, or `no build time recorded` when that value is missing or not a number, and the row's status shall follow R-675 alone.
  - Test: `R-2863: doctor's knowledge index row gives the built_at age in hours and stays ok when no build time is recorded`.
  - Cases: an index with docs and `built_at` 2.5 hours before an injected clock, and a file mtime set a day earlier, gives `built 2.5h ago` with the docs count. R-675's docs-only fixture with no meta table stays ok with `no build time recorded`. A `built_at` of `abc` gives the same words. A corrupt file still fails as R-675 says.
  - Red: the age from the file's mtime; a missing meta table turning the row to fail; minutes, or wording apart from status's `built 2.5h ago`; `NaN` in the detail; the docs count dropped from the detail.

Four rows, R-2860 to R-2863, each `untested` then `implemented`. R-2864 to R-2867 stay free.

One seal test with no row, naming R-2860 and R-2862: `seal: the frozen-index clause reads "The knowledge index is frozen until sources.json is repaired; then run nana-knowledge build."`. Every other assertion imports `SOURCES_FROZEN_CLAUSE` by name.

Tunables, in `packages/nana-knowledge/lib/sources-file.mjs` with provenance beside each: `SOURCES_FROZEN_CLAUSE` (contract, R-2860 and R-2862, sealed); `UNPARSEABLE_MARKER` and `UNREADABLE_MARKER` move unchanged with their contract note (R-2372, R-2375). No numeric tunable is added. The hour unit and one decimal follow status's existing form.

Existing tests stay unchanged. The builder confirms that R-2370 to R-2376, R-2407 to R-2409, discovery's R-240 seed checks, R-675's three checks, R-217, R-222, R-225, R-231 and the extension's R-233 checks still pass. The builder also reports a notice pull's `ms` in pull.log next to the same pull with a good file. That is a measurement, not a row.

## Precedent

- Read-and-classify step: `packages/nana-knowledge/lib/sources.ts:166-189` (`loadSources`' read, the ENOENT split and the parse). It moves into `readSourcesFile(file)` in the new module, minus the seed. `loadSources` calls it and seeds only on "absent".
- Marker formatter and constants: `sources.ts:151-163`. They move unchanged. `bin/nana-knowledge.ts:19` then imports `formatSourcesProblem` from the new module.
- A `.ts` module importing a shared `.mjs`: `sources.ts:25-30` (json-text) and `hook.ts:24` (display). nana-setup importing one: `doctor.mjs:26`.
- Why `.mjs` and not `.ts`: `doctor.mjs:117-120` (a rule restated because nana-setup cannot import `.ts`) and `:135-136` (`NODE_FLOOR`).
- Bytes read and safe parse in doctor: `doctor.mjs:312-324` (`piPackConfigState`: `parseJsonBytes`, `jsonParseFailure`).
- Absent file as a note row: `doctor.mjs:597-598` (mcp.json).
- Index row and its injected database class: `doctor.mjs:70-79` and `:644-647`. `knowledgeIndexState` gains an injected `now`, beside its existing `DatabaseSync` seam.
- Age wording: `bin/nana-knowledge.ts:134` (reads `built_at`) and `:145-146` (`built ${ageH}h ago`, one decimal). Doctor restates the meta query and the one-line wording, as it restates the docs count, because it cannot import `db.ts`. This is a declared departure, with `doctor.mjs:117-120` as precedent.
- Notice placement and header: `hook.ts:39` (`HEADER`) and `:105-128` (`renderBlock`, untouched). The role and skip returns stay first (`:159-168`); the read goes after them and before `ensureFreshIndex` (`:170`).
- Repair advice: `packages/nana-pack/lib/json-text.mjs:17-19` (`FORWARD_SLASH_ADVICE`, `MANUAL_JSON_ADVICE`), imported by name.
- pi path, unchanged: `packages/nana-knowledge/extensions/nana-knowledge.ts:115` and `:170` inject the CLI's stdout as one message.
- Tests: `sources-file.test.mjs:19-22` (F1 to F4) and `:36-42` (`run`); its R-2373 check at `:123`, for the exact marker. `recover.test.mjs:18` (in-process `runHook`) and `:54-59` (`activate`). `hook.test.mjs:41-42` (`payload`, `noSpawn`). `doctor-knowledge.test.mjs` (R-675's fixture and `ProbeDatabase`, whose `prepare` already answers any query).
- Registry: `REQUIREMENTS.md:377` (FEAT-004's A-004 Reads line) and `:1531` (FEAT-015's A-004 Reads line).

One private helper moves to a shared module: `loadSources`' read-and-classify step, with `formatSourcesProblem` and its markers, into `packages/nana-knowledge/lib/sources-file.mjs`. No other helper moves.

## Class and builder

A hook lane under the AGENTS.md ladder. It changes the Claude Code UserPromptSubmit hook's output and, through the same CLI, the pi extension's injected message. It also changes nana-setup doctor. So it gets the final reviewer, the land reviewer, the seat's wrong-code pairs (the red cases above), one independent check and the local macOS install check before `nana-land`. The mutation runner re-runs after any seat change.

The small builder, one session (`pi-worker --lane-size small`). The seat pushes the draft pull request at build 1's tip and reads its Windows leg before the review brief. The folder-as-file read error and the doctor detail's path form are the Windows-sensitive parts.

The independent check runs the worktree's hook CLI and doctor against a scratch knowledge home. It breaks sources.json the four ways and reads the notice in both the Claude Code form (hook JSON on stdin) and the pi form (`makePull`). It repairs the file, sees the notice vanish on the next pull and the index rescan after `nana-knowledge build`, and reads both doctor rows.

## Known limits (the seat writes them before the final round)

- The notice repeats on every eligible pull while the file stays broken; there is no per-session dedup.
- After a repair the notice stops at once, but the index rescans only at the next build: within an hour, or at once by hand.
- While the file is broken, builds still refresh the index age (R-2408), so doctor's age looks fresh beside the ✗ sources row.
- A file that parses with the wrong shape still reads as no roots, purges rows and gets no notice.
- A pull that lands during an editor's save can read an empty file and print the notice once.
- The pull reads the whole sources.json on every eligible prompt, with no size cap.
- Builders and reviewers never see the notice, by the 2026-10-09 ruling on automatic pulls.
- Doctor shows the index age but calls no age too old.
- Doctor does not list missing roots; status still does.
- `status` and `build` still seed an absent sources.json through `loadSources`.
- `nana-setup project`'s refresh summary still shows no marker.
