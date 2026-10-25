# adoption-window · must-meet of record (seat, 2026-10-25)

Feature: FEAT-014 · Create or adopt a project workspace

Written by the seat from the planner's draft (`plan-draft.md`, this folder) and one adversary pass (`plan-attack.md`, this folder; 0 MUST, 9 SHOULD, 4 NOTE). The seat took SHOULD 2 to 9 and NOTE 10 to 13. It took SHOULD 1's conclusion (drop part two) but not its question to the owner: the owner's pick named only the journal tail, and R-076 and the pack README promise the line, so the drop is a known limit. SHOULD 7 cut the draft's R-2853, so this lane has three rows. Plans get no review round. Where this file and the draft differ, this file holds.

The owner's decision, 2026-10-25: "Build the four (Recommended)". The owner lifted the 2026-10-24 pause for four page-free lanes from the artifact assessment (artifact-readers, adoption-window, knowledge-freeze-notice, review-texts-durable). The page stays frozen until the owner's readability discussion.

Spend line: the current priority (since 2026-10-23), every artifact made by an existing run and read by code. A-025's one code tie, the seat's adoption block, drops reports silently today: it reads only the journal's last 256 KiB, and the 7-day window needed 307,397 bytes on 2026-10-25. This lane repairs that tie.

Main is 61671be0 (impact-artifacts landed). Every file:line below was re-opened there and holds. The adversary read main d3cf9a0d; nothing it cites moved.

Stakes: low blast, reversible. The change touches one session-start producer and one read path, and writes nothing. One sharp edge: `packages/nana-pack/lib/adoption.mjs` loads in eight places besides the reader. They are the handoff pi extension (`extensions/nana-handoff.ts:75`); through `lib/frontier-summary.mjs:10`, the objective hook's frontier producer (`bin/nana-frontier-summary.mjs:15`) and the nana-frontier-summary pi extension (`extensions/nana-frontier-summary.ts:10`); through `packages/nana-setup/lib/stale-copies.mjs:13`, the stale-copy producer in this same SessionStart hook (`packages/nana-setup/bin/stale-copies.mjs:15`, `packages/nana-setup/claude/hooks/nana-adoption.mjs:18`), the nana-rulings pi extension (`extensions/nana-rulings.ts:35`), doctor (`packages/nana-setup/lib/doctor.mjs:45`), hook-health (`packages/nana-setup/lib/hook-health.mjs:14`) and the install check (through doctor, `packages/nana-setup/lib/install-check.mjs:13`). A load failure there would blank the frontier block, the stale-copy notices and the rulings section, and break doctor. So the lane adds no import to `lib/adoption.mjs`. No test pins that; the review brief asks the reviewer to confirm its import lines (`:22-29`) are byte-unchanged.

Threat model: honest variation in our tools' output, files and environment is in scope; deliberate forgery is out, such as a hand-planted report line or a forged timestamp chosen to hide a cut. A finding outside this model is a residual. The honest variations:

- a journal larger than the read cap, and a 7-day window longer than the cap;
- a journal under 256 KiB, of exactly the cap, absent, empty, a directory, or unreadable (EACCES);
- a whole line with no `ts` (test fixtures, older writers), or a line that is not JSON, before the first dated line;
- a torn first line at the cut, a multibyte character split at the cut, a torn last line from a concurrent append;
- one line longer than the cap, so the read holds no whole line;
- parallel pi sessions appending during the read (power mode runs many review and worker children);
- timestamps a few milliseconds out of order between parallel writers;
- a user-scope absolute `journal.path`, `journal.enabled: false`, or `PI_CODING_AGENT_DIR` set;
- Windows: a pi session holding the journal open for append while the reader reads.

## Measurement (read-only, this machine, 2026-10-25; the adversary rebuilt every figure)

- The journal (`adoptionSettings()`: `~/.pi/agent/nana-journal.jsonl`) is 1,865,706 bytes, 9,312 lines, 2026-09-01 to 2026-10-25. Every line carries a parseable `ts`; no timestamp steps backwards.
- The 7-day window needed 307,397 bytes; the 256 KiB tail reached back only to 2026-10-19T22:45Z. The largest 7-day window in its history is 1,077,570 bytes (the week ending 2026-10-13T19:08Z). The largest 24-hour window is 284,377 bytes.
- Read cost: `tailLines` plus `recentReports`, warm, 1.3 ms at 256 KiB and 15 to 17 ms for a full 4 MiB read of a scratch copy. Cold: importing `lib/adoption.mjs` 6 to 8 ms, reading the whole file 5.2 to 7.5 ms, the reader 41 ms end to end.
- `config_project_ignored` is 383,120 of the 1,865,706 bytes (957 lines: 766 from temp roots, 142 from lane worktrees).

## Seat decisions

- **One read up to the cap, then a coverage check.** The reader reads the journal's last min(size, cap) bytes once. A stepwise read from 256 KiB would read twice on nearly every run today, to save about 10 ms at the cap.
- **Coverage rule.** The window is covered when the read starts at the journal's first byte, or when a whole line in the read parses as JSON with a `ts` that `Date.parse` accepts at or before the window's start. That matches `recentReports`' `t > sinceMs` boundary (`lib/adoption.mjs:203`) and its `Date.parse(e.ts)` reading (`:198`). Otherwise the reader prints one cut line (R-2851).
- **The shared read (adversary SHOULD 2, an in-module extraction).** `tailLines`' body (`lib/adoption.mjs:144-168`) becomes a private `readTail(file, bytes)` in the same module that returns `{ lines, start }`. `tailLines(file, bytes = TAIL_BYTES)` returns `readTail(file, bytes).lines`, so its signature, default and output stay byte for byte, and the handoff extension's 24-hour dedup (`extensions/nana-handoff.ts:381`, R-146) is untouched. A new export `windowLines(file, sinceMs, maxBytes)` calls `readTail(file, maxBytes)` once and returns its whole lines with a `cut` field, as `recentReports` carries `dropped` (`:216-217`): `null` when the window is covered, else `{ oldest }`, the first dated whole line's time as `toISOString()`, or `null` when the read holds none. An absent journal gives `[]` with `cut: null`; any other read failure throws as `tailLines` does. No second stat, no copy of the read.
- **One window start.** The bin computes `sinceMs = Date.now() - ADOPTION_WINDOW_MS` once and passes the same value to `windowLines` and to `recentReports`.
- **Where the cut line goes.** It is the reader's last line under the `[nana:adoption]` tag, after any block and refused-entry count. It joins `out` as the count line does (`bin/nana-adoption.mjs:78`: a blank line before it when `out` already holds lines) and goes out in the one tagged write (`:79`). It prints even when nothing is open, because a cut window is something to report; R-153's silence for "nothing to report" stays true.
- **No new import in `lib/adoption.mjs`.** `windowLines` takes the cap and the window start as required arguments. The bin imports `adoption-config.mjs` inside its existing `try` (`bin/nana-adoption.mjs:36-38`), so a config load failure prints `ADOPTION UNAVAILABLE: reader failed (...)` as today.
- **Tunables in a new `packages/nana-pack/lib/adoption-config.mjs`** (six-tag header, effects none, no imports), the per-feature config form of `lib/frontier-summary-config.mjs`. No adoption config module exists today.
  - `JOURNAL_WINDOW_READ_MAX_BYTES` = `4 * 1024 * 1024`. Measured 2026-10-25: the 7-day window needed 307,397 bytes that day and 1,077,570 at its largest; a full 4 MiB read took 15 to 17 ms warm and the cold reader 41 ms end to end. The binding limit is the 2,500 ms per-producer limit (`HOOK_PRODUCER_TIMEOUT_MS`, `packages/nana-setup/lib/hook-producer.mjs:23`), inside the 4,000 ms deadline (`HOOK_DEADLINE_MS`, `:28`) that the adoption producer shares with the stale-copy producer, which runs after it (`packages/nana-setup/claude/hooks/nana-adoption.mjs:17-18`). Chosen: about 3.9 times the largest week, so a heavier power week still fits. Sealed.
  - `ADOPTION_WINDOW_MS` = `7 * 86_400_000`. Contract: R-151's "last 7 days". It moves out of the bin's inline `WINDOW_MS` (`bin/nana-adoption.mjs:31`), because the cut check and the report filter share it. Sealed.
  - `ADOPTION_WINDOW_CUT_PREFIX` = `ADOPTION WINDOW CUT:`. Contract (R-2851): the reader's uppercase marker form, as `ADOPTION UNAVAILABLE:` (`bin/nana-adoption.mjs:52`). Sealed.
  - `TAIL_BYTES` stays at `lib/adoption.mjs:35`, and the seal now pins it at 256 KiB (adversary SHOULD 3): the shortest wrong build retunes it to the cap and passes every other check.
- **Part two dropped: child sessions keep writing `config_project_ignored`.** The owner's pick named only the journal tail. R-076 requires "exactly one config_project_ignored journal line" per session (`REQUIREMENTS.md:868`, pinned at `packages/nana-pack/tests/config-trust.test.mjs:175-177`), and the pack README promises the announcement is "never silent" (`packages/nana-pack/README.md:622-623`). After this lane those bytes no longer hide reports; they cost growth only. A known limit, not a question to the owner.
- **No other code changes.** No change to the handoff extension, `lib/config.ts`, the hook entry, `hook-producer.mjs`, install, doctor, the journal writers or the artifact registry.
- **Headers and map.** `lib/adoption.mjs`'s `@outputs` gains the window read; `bin/nana-adoption.mjs`'s `@inputs` gains the config and the journal's last `JOURNAL_WINDOW_READ_MAX_BYTES`, and its `@outputs` the cut line. `npm run map` and `node scripts/requirements-tree.mjs --write` are regenerated.
- **README, no row.** One sentence in the pack README's adoption paragraph (`packages/nana-pack/README.md:948`): the reader reads at most the journal's last `JOURNAL_WINDOW_READ_MAX_BYTES`, and when that stops short of 7 days its last line, `ADOPTION WINDOW CUT: ...`, names the cap and the oldest time checked. The readme check does not test this prose; it is written, not pinned.
- **HANDOFF (adversary NOTE 11).** `HANDOFF.md:15-16` still say no lane is building and the pause is on. The first of the four lanes to reach its final round carries that update, written by the seat.

## Must-meet rows (FEAT-014, SUB-016)

All tests go in `packages/nana-pack/tests/adoption-reader.test.mjs`, under its temp HOME harness (`:18-37`, `NANA_TEST_TEMP_ROOTS` set empty at `:26`), and spawn the real reader with the real cap. Fixture lines are ASCII, so characters equal bytes. Every assertion except the seal imports the cap, the window and the prefix from `adoption-config.mjs` and never writes their literals. Retuning the cap rescales every fixture. The rows go after R-2765 at the end of SUB-016's table (`REQUIREMENTS.md:1413`).

- **R-2850.** WHEN the journal is no larger than the journal read cap, the adoption reader shall list every open report inside the 7-day window, the journal's first line included, and print no cut line.
  - Test: `R-2850: a journal of exactly the read cap lists the open report on its first line, six days old, and prints no cut line`.
  - Fixture (adversary SHOULD 4): the journal's first line is a report 6 days old for root A. Then `session_start` filler lines dated evenly from 6 days ago to now. The last line is a report 1 hour old for root B. The last filler line is padded so the journal is exactly `JOURNAL_WINDOW_READ_MAX_BYTES` bytes; the test asserts that size before it runs the reader.
  - Expect: exit 0; B then A listed; no line starting with the prefix.
  - Red: today's 256 KiB tail (A missing); any fixed read shorter than the cap (A torn and dropped); a cut line for a journal read from its first byte (coverage judged by time only, and A is newer than the window start); a cut line for a journal of exactly the cap (an over-cap test of `size >= cap`).
- **R-2851.** IF the journal is larger than the journal read cap and no whole line in its last cap bytes parses as JSON with a `ts` that `Date.parse` accepts at or before the 7-day window's start, THEN the adoption reader shall end its stdout, under the `[nana:adoption]` tag, with exactly one line `<ADOPTION_WINDOW_CUT_PREFIX> only the journal's last <cap> bytes were read, back to <ISO>; older reports are not listed.`, where `<ISO>` is the first dated whole line's `ts` as `toISOString()`, or with `<ADOPTION_WINDOW_CUT_PREFIX> only the journal's last <cap> bytes were read, and they hold no dated line; reports may be missing.` when there is none, and exit 0.
  - `<cap>` is `JOURNAL_WINDOW_READ_MAX_BYTES` written as a plain decimal integer. The test builds both expected lines from the imported prefix and cap.
  - Test: `R-2851: a seven-day window longer than the read cap prints one cut line naming the cap and the oldest time checked, with or without open roots`.
  - Case (a), built by construction (adversary SHOULD 5 and 6): the journal is the cap plus about 1 MiB. Every filler line is one fixed byte length, a `session_start` line with `ts` first, dated within the last two days. The line that straddles offset `size - cap` is a JSON line written with its `ts` last, dated 8 days ago. The next line is a marker with a known `ts` 40 hours ago. The journal's first and last lines carry other times. Nothing is open. The test asserts that `size - cap` falls strictly inside the straddling line, then expects stdout exactly the tag line and the cut line naming the marker's `ts`.
  - Case (b): the same recipe with an open report 1 hour old for a fixture root among the lines after the marker. Expect the block, then a blank line, then the same cut line as stdout's last line, and the prefix exactly once.
  - Case (c): the journal is one line with no `ts`, longer than the cap. Expect stdout exactly the tag line and the `no dated line` form.
  - Red: silence when nothing is open (today's behaviour); the line before the block, or twice; the time from the journal's first or last line, or from the straddling line; the straddling fragment dated by a pattern read of `ts`, so no cut line prints; `Invalid Date` or `NaN` in the line; the cap's number wrong (`TAIL_BYTES`, or the journal's size); a throw shown as `ADOPTION UNAVAILABLE`; exit 1; the cap ignored (the whole file read, so no cut line or the journal's first line named).
- **R-2852.** WHEN the journal is larger than the journal read cap and a whole line in its last cap bytes parses as JSON with a `ts` that `Date.parse` accepts at or before the 7-day window's start, the adoption reader shall print no cut line, whatever undated lines come before that line in the read.
  - Test: `R-2852: a journal over the read cap whose read reaches a line older than seven days prints no cut line, even after undated lines`.
  - Case (a): a journal over the cap whose last cap bytes start with whole lines dated 8 days ago and end with an open report 1 hour old. Expect the block naming that root and no line starting with the prefix.
  - Case (b): a journal over the cap whose read starts with undated lines (JSON with no `ts`, and one line that is not JSON), then one line dated 8 days ago, then lines dated within two days; nothing open. Expect empty stdout. The test asserts that the 8-day line starts after offset `size - cap`.
  - Red: a cut line whenever the file exceeds the cap (size, not time); a cut line when the read's first whole line is undated (coverage judged from that line only); coverage judged from the journal's first line instead of the read's.

Three rows, R-2850 to R-2852, each `untested` then `implemented`. R-2853 to R-2857 stay unused. Existing rows R-146, R-151, R-153, R-154 and R-812 keep their wording and tests; every existing reader fixture is under the cap, so it reads from byte 0 and prints no cut line. The builder confirms `adoption-reader.test.mjs` and `adoption-producer.test.mjs` still pass.

Seal: one test with no row of its own, marked `req: R-146 R-151 R-2850 R-2851 R-2852`, titled `seal: the adoption reader reads at most 4 MiB of the journal for a 7-day window, its cut line starts ADOPTION WINDOW CUT:, and the producer's tail stays 256 KiB`. It asserts `JOURNAL_WINDOW_READ_MAX_BYTES === 4 * 1024 * 1024`, `ADOPTION_WINDOW_MS === 7 * 86_400_000`, `ADOPTION_WINDOW_CUT_PREFIX === "ADOPTION WINDOW CUT:"` and `TAIL_BYTES === 256 * 1024` against their literals, as `packages/nana-pack/tests/build-records.test.mjs:315-316` does.

## Precedent

- Tail read (open, fstat, absent as empty, `ENOTFILE`, whole lines, torn first line dropped): `packages/nana-pack/lib/adoption.mjs:144-168` `tailLines`. In-module extraction (adversary SHOULD 2): its body becomes the private `readTail(file, bytes)` returning `{ lines, start }`; `tailLines` wraps it unchanged and `windowLines` calls it. Nothing is copied.
- A result array carrying a field: `packages/nana-pack/lib/adoption.mjs:216-217` (`Object.assign(reports, { dropped })`); `cut` rides on `windowLines`' lines the same way.
- The window boundary and the `ts` parse: `packages/nana-pack/lib/adoption.mjs:186-218` `recentReports`, `Date.parse(e.ts)` at `:198`, `t > sinceMs` at `:203`.
- Reader output: `packages/nana-pack/bin/nana-adoption.mjs:43-80`; the unavailable marker at `:52`, the refused-entry count line and its blank-line join at `:78`, the one tagged write at `:79`.
- Imports inside the reader's `try`: `packages/nana-pack/bin/nana-adoption.mjs:36-38`.
- Config form, with `chosen`, `measured` and `contract` provenance and "Sealed" notes: `packages/nana-pack/lib/frontier-summary-config.mjs:1-28`.
- Large-journal fixture (2 MiB of 1 KiB lines): `packages/nana-pack/tests/adoption-producer.test.mjs:255-262`.
- Reader harness (temp HOME, `run`, `line`, `repo`): `packages/nana-pack/tests/adoption-reader.test.mjs:18-37`; R-153's empty-output cases at `:39-51`.
- Seal test form: `packages/nana-pack/tests/build-records.test.mjs:315-316`.
- Hook path and deadlines: `packages/nana-setup/claude/hooks/nana-adoption.mjs:17-18`; `packages/nana-setup/lib/hook-producer.mjs:23`, `:28` and `:39-41`; the launcher trims only trailing newlines (`:63`), so the cut line arrives whole.
- Install check: `packages/nana-setup/lib/install-check.mjs:507` runs the adoption hook in a scratch home and asserts only that the project is named and no `ADOPTION UNAVAILABLE`; its pi session row reads the journal itself (`:414-418`). This lane does not change either.

No private helper moves to a shared module. `readTail` stays private in `lib/adoption.mjs`; no helper gains a caller outside its module.

## Class and builder

A hook lane: it changes the producer the Claude Code SessionStart hook runs, and a module that three pi extensions, the frontier and stale-copy producers, doctor and the install check load. The ladder:

- the roster's final reviewer;
- the land reviewer, or the seat's `seat-land.md` in this folder when the roster prints `land: seat`;
- the seat's wrong-code pairs, one per red case above plus `TAIL_BYTES` retuned to the cap (the seal goes red), and the mutation runner after any seat change to code or tests;
- one independent check;
- the local macOS install check (`node packages/nana-setup/bin/install-check.mjs`) before the land.

Size small: `pi-worker --lane-size small`, one session. The seat pushes the draft pull request at build 1 and reads its Windows leg before the review brief. The review brief carries the stakes line's importer list and asks the reviewer to confirm `lib/adoption.mjs`'s import lines are byte-unchanged.

The independent check (adversary SHOULD 8): copy the real journal into a scratch HOME, never touching the original. Set `NANA_TEST_TEMP_ROOTS=""` for both readers, or put the fixture repository outside the temp folder (the production reader skips temp roots, `lib/adoption.mjs:39-44`, R-640); with the variable set, its stderr warning is expected. Append a report 6 days old for that repository to the copy, then append at least `TAIL_BYTES` + 64 KiB of filler dated now. Assert that byte distance first. Only then require main's reader to miss the report and the worktree's to list it with no cut line. Then run a synthesized 5 MiB journal whose lines all fall within two days, and check for exactly one cut line naming the cap and the first dated whole line's time.

## Page effect

This lane adds no page or desk code. The page shows data only: FEAT-014's own row list gains R-2850 to R-2852 (`scripts/product-report.mjs:344-352`, inferred from the code), SUB-016 goes from 34 to 37 rows (`docs/requirements-tree.md:166`), and the row totals rise by three. No artifact, deliverable or Reads line changes.

## Overlap

artifact-readers, knowledge-freeze-notice and review-texts-durable can build alongside this lane: no code file is shared, and their row IDs (R-2830 to R-2836, R-2860 to R-2867, R-2870 to R-2877) do not meet this lane's R-2850 to R-2852. `REQUIREMENTS.md` (artifact-readers adds `Read by:` lines in FEAT-014's span, just above SUB-016), `docs/requirements-tree.md`, `docs/code-map.md` and `HANDOFF.md` collide only at merge. Whichever lands second, and each lane after it, merges main, regenerates `docs/requirements-tree.md` and `docs/code-map.md`, and takes a confirmation round.

## Known limits (the seat writes them before the final round)

- R-151's "last 7 days" holds only up to the cap; past it, the cut line says how far back the reader looked, and reports older than that time are still not listed.
- The cut line names the read's first dated whole line, so out-of-order timestamps could misstate the oldest time checked (0 backward steps measured).
- `readTail`, like `tailLines` before it, drops the read's first segment whenever it starts past byte 0 (`lib/adoption.mjs:159`). When the cap lands exactly on a line start, that segment is a whole line, and coverage is judged from the next line; an unneeded cut line prints only if the dropped line was the read's only line at or before the window start.
- A future-dated first line, from a clock set back, counts as newer than the window start, so the cut line can name a future time.
- Once the journal passes 4 MiB, every seat session start reads 4 MiB (15 to 17 ms warm on a scratch copy).
- The journal still grows with no cap or rotation, about 300 to 700 KB a week lately; this lane does not touch its writers.
- The producer's 24-hour duplicate check still reads 256 KiB, and one measured day needed 284,377 bytes. A heavy day can write a second line per root; the reader still lists each root once. The seat records this as one line in FEAT-014's known-bug file.
- Part two of the assessment's lane is not built. Child sessions still write `config_project_ignored`, about a fifth of the journal's bytes, because R-076 and the pack README keep it. A guard in `surface()` (`packages/nana-pack/lib/config.ts:460-472`) plus a narrowed R-076 would cut it.
- No test pins that `lib/adoption.mjs` gains no import; the reviewer confirms it by reading.
- The A-025 Artifact line's writer list and the state inventory's journal path under `PI_CODING_AGENT_DIR` stay as the assessment found them.
- The journal's failure and security events still have no code reader.
