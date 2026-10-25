# adoption-window · plan draft (planner, 2026-10-25)

Feature: FEAT-014 · Create or adopt a project workspace

Confirmed: the adoption reader's rows R-143 to R-157 sit in FEAT-014's SUB-016 (`REQUIREMENTS.md:1375`), and FEAT-014 already carries `Reads: A-025` for both adoption modules (`REQUIREMENTS.md:1372`).

Source of the decision: the owner's pick on 2026-10-25, "Build the four", after the artifact consumer assessment (`<scratch>/assess/out/report.md` section 3b, entry A-025; candidate lane 2 in section 7).

Spend line: the current priority since 2026-10-23, every artifact made by an existing run and read by code. A-025's one code tie, the seat's adoption block, drops reports silently today. This lane repairs that tie.

Stakes: low blast, reversible. The change touches one seat session-start block and one read path, and writes nothing. One sharp edge: `lib/adoption.mjs` is imported by the handoff pi extension, so a load failure there would stop that extension in every pi session. The seat decision "No new import" keeps that module unchanged in what it loads.

Threat model: honest variation in our tools' output, files and environment is in scope. Deliberate forgery is out, such as a hand-planted report line or a forged timestamp chosen to hide a cut. A finding outside this model is a residual. The concrete honest variations:

- a journal larger than the read cap, and a 7-day window longer than the cap;
- a journal under 256 KiB, absent, empty, a directory, or unreadable (EACCES);
- a whole line with no `ts` (test fixtures, older writers) before the first dated line;
- a torn first line at the cut, a multibyte character split at the cut, a torn last line from a concurrent append;
- one line longer than the cap, so the read holds no whole line;
- parallel pi sessions appending during the read (power mode runs many review and worker children);
- timestamps a few milliseconds out of order between parallel writers;
- a user-scope absolute `journal.path`, `journal.enabled: false`, or `PI_CODING_AGENT_DIR` set;
- Windows: a pi session holding the journal open for append while the reader reads.

## Measurement (read-only, this machine, 2026-10-25)

The journal path comes from `adoptionSettings()`: `~/.pi/agent/nana-journal.jsonl` (no `PI_CODING_AGENT_DIR`, no user `journal.path`). The script is `<scratch>/aw-measure.mjs`; it only reads.

- Size 1,865,706 bytes, 9,312 lines, 2026-09-01T18:45Z to 2026-10-25T03:49Z. Every line carries a parseable `ts`; no timestamp steps backwards.
- The 7-day window needs 307,397 bytes now. The 256 KiB tail reaches back only to 2026-10-19T22:45Z.
- The largest 7-day window in the journal's history is 1,077,570 bytes (the week ending 2026-10-13T19:08Z).
- The largest 24-hour window is 284,377 bytes (to 2026-10-12T18:27Z), over the producer's 256 KiB dedup tail.
- Bytes per week, newest first: 307,397; 702,082; 599,127; 46,953; 31,243; 94,477; 61,859; 22,568.
- `tailLines` plus `recentReports`, warm process, macOS: 1.3 ms at 256 KiB; 5.8 ms for the whole 1.87 MB file; 15 to 17 ms for a full 4 MiB read of a scratch copy (three journals joined). The hook deadline is 4,000 ms (`packages/nana-setup/lib/hook-producer.mjs:28`).
- Event mix by bytes: `objective_pickup` 24.9%, `config_project_ignored` 20.5% (957 lines: 766 from temp roots, 142 from lane worktrees, 49 elsewhere), `session_start` 18.4%, `session_shutdown` 18.2%, `handoff_skipped_role` 15.5%. `directory_unadopted`: 4 lines, all dated 2026-10-04 or 2026-10-05.

## Seat decisions

- **One read up to the cap, then a coverage check.** The reader reads the journal's last min(size, cap) bytes once through the existing tail read. A stepwise read starting at 256 KiB would fall short today (307,397 bytes needed), so nearly every run would read twice. A full 4 MiB read cost 15 to 17 ms, against a 4,000 ms deadline. This meets the owner's "read back until the window is covered" by behaviour, not by a loop.
- **Coverage rule.** The window is covered when the read starts at the journal's first byte, or when the read's first dated whole line is at or before the window's start. That matches `recentReports`' `t > sinceMs` boundary. Undated lines before it are skipped. Otherwise the reader prints one cut line naming the cap in bytes and that first dated line's time, or `no dated line`.
- **Where the cut line goes.** It is the reader's last line, under the `[nana:adoption]` tag, after any block and refused-entry count. It prints even when nothing is open, because a cut window is something to report; R-153's silence for "nothing to report" stays true.
- **No new import in `lib/adoption.mjs` (stakes).** The new window read is one export beside `tailLines`, taking the file, the window start and the cap as required arguments. The bin imports the new config module inside its existing `try` (`bin/nana-adoption.mjs:36-38`), so a config load failure prints `ADOPTION UNAVAILABLE`. The handoff extension's import chain is unchanged.
- **`tailLines` stays byte for byte.** Its signature, its `TAIL_BYTES` default and its output do not change. So the handoff extension's 24-hour dedup (`extensions/nana-handoff.ts:381`, R-146) and R-146's tail test are untouched.
- **Tunables in a new `packages/nana-pack/lib/adoption-config.mjs`** (six-tag header, effects none):
  - `JOURNAL_WINDOW_READ_MAX_BYTES` = 4 MiB. Provenance, measured 2026-10-25: the 7-day window needed 307,397 bytes that day and 1,077,570 at its largest; a full 4 MiB read took 15 to 17 ms. Chosen: about 3.9 times that peak, so a heavier power week still fits. Sealed.
  - `ADOPTION_WINDOW_MS` = 7 days. Contract: R-151's "last 7 days". It moves out of the bin's inline `WINDOW_MS` (`bin/nana-adoption.mjs:31`), because the cut check and the report filter must share it. Sealed.
  - `ADOPTION_WINDOW_CUT_PREFIX` = `ADOPTION WINDOW CUT:`. Contract: the reader's uppercase marker form, as `ADOPTION UNAVAILABLE:` (`bin/nana-adoption.mjs:52`). Sealed.
  - `TAIL_BYTES` stays where it is (`lib/adoption.mjs:35`): this lane does not touch its caller.
- **Part two dropped: stop writing `config_project_ignored` in child sessions.** No code reads the event; a grep finds only its writer (`lib/config.ts:556`) and tests. But it has a contract reader. R-076 requires "exactly one config_project_ignored journal line" per session (`REQUIREMENTS.md:868`), pinned by `config-trust.test.mjs:175-177`. The pack README promises the announcement is "never silent" (`packages/nana-pack/README.md:622-623`). In a headless review child the journal line is that announcement's only trace. Cutting it would narrow R-076 and edit `loadConfig` in `lib/config.ts`, the gate's config loader, which is not small. After part one, those bytes no longer hide reports below the cap; they cost growth only (383,120 of 1,865,706 bytes). By the owner's rule, a reader exists, so this part is dropped.
- **No other code changes.** No change to the handoff extension, the hook entry (`packages/nana-setup/claude/hooks/nana-adoption.mjs`), install, doctor, the journal writers or the artifact registry.
- **Headers and map.** `lib/adoption.mjs`'s `@outputs` gains the window read; `bin/nana-adoption.mjs`'s `@inputs` gains the config and its `@outputs` the cut line. The code map is regenerated for the new module.
- **README, no row.** One sentence in the pack README's adoption paragraph (`packages/nana-pack/README.md:948`): the reader reads at most the journal's last `JOURNAL_WINDOW_READ_MAX_BYTES`, and when that stops short of 7 days, one `ADOPTION WINDOW CUT:` line names the cap and the oldest time checked. The readme check does not test this prose; it is written, not pinned.

## Must-meet rows (FEAT-014, SUB-016)

All tests go in `packages/nana-pack/tests/adoption-reader.test.mjs`. R-2850 to R-2852 spawn the reader with the real cap under the existing temp HOME harness, writing filler lines to pass the cap. R-2853 calls the library in-process with an injected small cap. Every assertion imports the cap, the window and the prefix from `adoption-config.mjs`; none writes the literal.

- **R-2850.** WHEN the adoption reader runs and the journal holds an open `directory_unadopted` report inside the 7-day window more than 256 KiB before the journal's end, with the journal no larger than the journal read cap, the reader shall list that report's root.
  - Test: `R-2850: a report six days old that sits more than 256 KiB before the journal's end is still listed`.
  - Fixture: a report 6 days old for root A, then about 1 MiB of `session_start` filler dated evenly from 6 days ago to now, then a report 1 hour old for root B.
  - Expect: B then A listed, and no cut line.
  - Red: today's 256 KiB tail (A missing); a fixed read size below the cap; a cut line printed for a journal read from its first byte.
- **R-2851.** IF the journal is larger than the journal read cap and the first dated whole line in its last cap bytes is newer than the 7-day window's start, THEN the adoption reader shall print, as its last line under the `[nana:adoption]` tag, exactly one line starting with the cut prefix that names the cap in bytes and that line's time in ISO form, or `no dated line` when the read holds no dated whole line, and exit 0.
  - Test: `R-2851: a seven-day window longer than the read cap prints one cut line naming the cap and the oldest time checked, with or without open roots`.
  - Cases: (a) cap plus 1 MiB of filler dated within the last two days, nothing open: stdout is exactly the tag and the cut line; (b) the same plus one open report near the end: the block, then the cut line last; (c) one undated line longer than the cap: the tag and the cut line with `no dated line`. The expected time is computed from the fixture.
  - Red: silence when nothing is open (today's behaviour); the line before the block or twice; the time from the journal's first or last line; `Invalid Date` or `NaN`; a throw shown as `ADOPTION UNAVAILABLE`; exit 1.
- **R-2852.** WHEN the adoption reader's journal read starts at the journal's first byte, or its first dated whole line is at or before the 7-day window's start, the reader shall print no cut line.
  - Test: `R-2852: a journal read from its first byte, or one whose read reaches a line older than seven days, prints no cut line`.
  - Cases: (a) a journal under the cap holding only undated lines, nothing open: empty stdout; (b) a journal over the cap whose last cap bytes start with lines dated 8 days ago and end with a fresh open report: the block and no cut line; (c) a journal over the cap whose read starts with undated lines, then a line dated 8 days ago: no cut line.
  - Red: a cut line whenever the file exceeds the cap (size, not time); a cut line when the first whole line is undated; the torn first line taken as the first dated line; a cut line for a small undated journal.
- **R-2853.** WHEN the adoption window read runs on a journal larger than its cap, it shall return only whole lines from the journal's last cap bytes, dropping the line the cap cuts, whatever window start it is given.
  - Test: `R-2853: the window read returns whole lines from the last cap bytes only, whatever the window asks for`.
  - Cases: an injected 64 KiB cap on a 1 MiB journal of 1 KiB dated lines, with a window start before every line: the joined lines fit the cap, every line is whole, and a cut is reported; an absent journal returns no lines and no cut; a directory throws as `tailLines` does.
  - Red: the cap ignored (whole file read); the window start extending the read past the cap; the torn first line kept; cap plus one byte read; an absent journal throwing.

Four rows, R-2850 to R-2853, each `untested` then `implemented`. R-2854 to R-2857 stay unused. Existing rows R-146, R-151, R-153 and R-154 keep their wording and tests; the builder confirms they still pass.

Seal: one test with no row of its own, marked `req: R-151 R-2850 R-2851`, titled `seal: the adoption reader reads at most 4 MiB of the journal for a 7-day window, and its cut line starts ADOPTION WINDOW CUT:`. It asserts the three constants against their literals, as `build-records.test.mjs:315-316` does.

## Precedent

- Tail read (open, fstat, absent as empty, `ENOTFILE`, whole lines, torn first line dropped): `packages/nana-pack/lib/adoption.mjs:144-168` `tailLines`. The window read calls it; it is not copied.
- A result array carrying a count: `packages/nana-pack/lib/adoption.mjs:216-217` (`Object.assign(reports, { dropped })`). The window read's cut can ride on its lines the same way.
- The window boundary and `ts` parse: `packages/nana-pack/lib/adoption.mjs:186-218` `recentReports`, `t > sinceMs` at `:203`.
- Reader output: `packages/nana-pack/bin/nana-adoption.mjs:43-80`. The unavailable marker is at `:52`, the refused-entry count line at `:78`, and the one tagged write at `:79`. The cut line joins `out` after the count line.
- Imports inside the reader's `try`: `packages/nana-pack/bin/nana-adoption.mjs:36-38`.
- Config form, with `chosen`, `measured` and `contract` provenance and "Sealed" notes: `packages/nana-pack/lib/frontier-summary-config.mjs:1-28`.
- Large-journal fixture (2 MiB of 1 KiB lines): `packages/nana-pack/tests/adoption-producer.test.mjs:255-262`.
- Reader harness (temp HOME, `run`, `line`): `packages/nana-pack/tests/adoption-reader.test.mjs:18-37`; R-153's empty-output cases at `:39-51`.
- Seal test form: `packages/nana-pack/tests/build-records.test.mjs:315-316`.
- Hook path and deadline: `packages/nana-setup/claude/hooks/nana-adoption.mjs:17`; `packages/nana-setup/lib/hook-producer.mjs:28` and `:39-41`.
- Install check: `packages/nana-setup/lib/install-check.mjs:507` runs the adoption hook in a scratch home. Its pi session row reads the journal itself (`:414-418`), so this lane does not affect that row.

No private helper moves to a shared module. The window read lives beside `tailLines` in the same module and calls it; no helper gains a caller outside its module.

## Class and builder

A hook lane: it changes the producer the Claude Code SessionStart hook runs, and a module the handoff pi extension imports. The ladder:

- the roster's final reviewer;
- the land reviewer, or the seat's `seat-land.md` when the roster prints `land: seat`;
- the seat's wrong-code pairs, one per red case above, and the mutation runner after any seat change;
- one independent check;
- the local macOS install check (`node packages/nana-setup/bin/install-check.mjs`) before the land.

Size small: `pi-worker --lane-size small`, one session. The seat pushes the draft pull request at build 1 and reads its Windows leg before the review brief.

The independent check copies the real journal into a scratch HOME, never touching the original. It inserts a report 6 days old at its time position. Main's reader must miss the report, and the worktree's must list it. It then runs a synthesized 5 MiB journal and checks for exactly one cut line.

## Known limits

- The cut check reads only the read's first dated line, so out-of-order timestamps could misstate the oldest time checked (0 backward steps measured).
- Past the cap, reports older than the oldest time checked are still not listed; the cut line says so but cannot show them.
- Once the journal passes 4 MiB, every seat session start reads 4 MiB (15 to 17 ms measured on a scratch copy).
- The journal still grows with no cap or rotation, about 300 to 700 KB a week lately; this lane does not touch its writers.
- The producer's 24-hour duplicate check still reads 256 KiB, and one measured day needed 284,377 bytes. A heavy day can write a second line per root; the reader still lists each root once. The seat records this as one line in FEAT-014's known-bug file.
- Child sessions still write `config_project_ignored`, a fifth of the journal's bytes, because R-076 and the pack README keep it.
- The A-025 Artifact line's writer list and the state inventory's journal path under `PI_CODING_AGENT_DIR` stay as the assessment found them.
- The journal's failure and security events still have no code reader.
