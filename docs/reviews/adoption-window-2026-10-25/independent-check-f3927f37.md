# adoption-window · independent check at f3927f37

Checker: the lane's one independent check, Claude Code, 2026-10-25. Class: hook lane. Threat model: honest variation in our tools' output, files and environment is in scope. That covers a journal over the cap, a 7-day window longer than the cap, an absent journal or a directory in its place, `journal.enabled: false`, `PI_CODING_AGENT_DIR` set, and parallel appends during the read. Deliberate forgery is out.

**Result: MATERIAL none.** Both readers ran for real from their own checkouts against a copy of this machine's journal: main's at `~/nana-pi` 4af28b0f and the lane's at f3927f37. With a 6-day-old report pushed 320 KiB back, main's reader missed it and the lane's listed it with no cut line. Past the 4 MiB cap with no line older than 7 days in the read, the lane printed exactly one cut line. It named the cap and the time this check computed on its own. The adoption producer took 44 ms with the real journal and 52 ms past the cap, against its 2,500 ms limit. Six NOTEs follow.

## Setup

```
S=<scratch>/indep-aw                  # under the session scratchpad
journal path: lib/adoption.mjs adoptionSettings() -> piAgentDir()/nana-journal.jsonl
  (PI_CODING_AGENT_DIR unset, user nana-pack.json sets no journal key) -> ~/.pi/agent/nana-journal.jsonl
cp <real journal> $S/agent/nana-journal.jsonl     # read-only copy; 1,870,529 bytes, about 9,340 lines
mkdir -p $S/fixture-repo/.git                     # a .git entry is all repoRootOf needs; no git command ran
env for every reader run: PI_CODING_AGENT_DIR=$S/agent NANA_TEST_TEMP_ROOTS=""
```

The scratchpad sits under `/private/tmp`, which the production reader treats as a temp root. So every run set `NANA_TEST_TEMP_ROOTS=""`. Each run printed the expected stderr warning `[nana:adoption] warning: NANA_TEST_TEMP_ROOTS is set (test seam) …`, on both sides.

Driver files in `<scratch>/indep-aw`:

- `drive.mjs <step>`: `setup`, `baseline`, `report`, `grow` and `synth`. Each step spawns `packages/nana-pack/bin/nana-adoption.mjs` from each checkout 11 times. It records exit, stdout shape, cut lines and wall time (min, median, max). `expectedOldest()` finds the oldest time checked without the lane's code. It takes the file's last 4 MiB, drops the first partial segment and parses the first dated whole line.
- `hook.mjs real|scratch`: imports each side's own `packages/nana-setup/lib/hook-producer.mjs` and runs `runHookProducer(hookProducerConfig("adoption", repo))` 15 times with the hook deadline. That is the call the SessionStart hook entry makes. It then spawns each side's whole hook entry, `packages/nana-setup/claude/hooks/nana-adoption.mjs`, once.
- `eq.mjs`: compares `tailLines` from both libraries on the real journal and lists each library's exports.
- Raw results: `out-baseline.json`, `out-report.json`, `out-grow.json`, `out-synth.json`. Paths in them are redacted to `<scratch>` and `<fixture>`.

The real journal was not modified. Its first 1,870,010 bytes hashed the same before and after the check (sha256 prefix `099ac542fa66c49e`). Its size stayed at 1,870,529 from the copy to the end. Under `~/.pi/agent`, only two pi session transcripts changed during the check. Running pi sessions wrote them; the reader opens the journal read-only. The scratch agent folder was deleted at the end.

## Side by side

All runs exited 0. Times are warm medians of 11 spawns of the reader CLI, min to max in brackets.

| Scenario | Journal size | main | lane |
|---|---|---|---|
| Baseline: the real copy, untouched | 1,870,529 | empty stdout · 36.7 ms (35.3–39.1) | empty stdout · 43.8 ms (41.5–45.7) |
| A 6-day-old report for the fixture, then 327,813 bytes of filler dated within the last minute. Report start to end of file: 328,074 bytes, at least the 327,680 needed (asserted first) | 2,198,603 | empty stdout: **misses the report** · 36.2 ms (35.0–37.3) | block listing the fixture (`has: nothing · last session 2026-10-19`), **no cut line** · 46.7 ms (45.6–48.4) |
| Grown past the cap: 4,718,767 more bytes of filler dated evenly over the last two days. The last 4 MiB holds no line older than 7 days (checked) | 6,917,370 | empty stdout · 36.4 ms (35.1–39.9) | exactly one line after the tag: `ADOPTION WINDOW CUT: only the journal's last 4194304 bytes were read, back to 2026-10-23T19:26:14.973Z; older reports are not listed.` Both the cap and the time match `expectedOldest()`. The 6-day report is now outside the read and is not listed · 52.1 ms (49.6–59.5) |
| Same file plus a fresh open report 1 hour old | ~6.9 MB | block listing the fixture | the same block, a blank line, then the cut line as the last line, printed once |
| The plan's variant: a synthesized 5 MiB journal whose lines all fall within two days | 5,243,087 | empty stdout · 37.8 ms | exactly one cut line naming 4194304 and `2026-10-23T23:42:27.069Z`, which matches `expectedOldest()` · 52.4 ms |

Edge runs, both sides, from a scratch agent folder:

- Absent journal: both printed nothing.
- A directory in the journal's place: both printed `ADOPTION UNAVAILABLE: journal unreadable (ENOTFILE).`
- `journal.enabled: false`: both printed nothing.
- Concurrent appends: an appender wrote about 200 lines every millisecond while the lane's reader ran 20 times over a 5 to 10 MB file. All 20 runs exited 0 with no UNAVAILABLE line, and each printed exactly one cut line.

## The SessionStart hook producer

Each side's own `runHookProducer` ran 15 times with the 4,000 ms deadline. The per-producer limit is 2,500 ms.

| Journal | main median (min–max) | lane median (min–max) | lane output |
|---|---|---|---|
| The real journal (real environment, nothing overridden) | 36.9 ms (34.5–41.5) | 43.7 ms (41.7–50.4) | empty on both, no UNAVAILABLE |
| The 5 MiB synthesized copy | 36.7 ms (34.5–51.9) | 51.9 ms (49.3–63.8) | tag line and cut line, 150 characters; no UNAVAILABLE |

The lane's slowest run, 63.8 ms, is about 2.6% of the limit. The whole hook entry, the adoption producer then the stale-copy producer, took 126 ms on main and 133 ms on the lane with the real journal. Past the cap it took 125 ms on main and 144 ms on the lane. Both exited 0 and wrote nothing to stderr.

## Main's paths

- `tailLines` returned identical arrays from both libraries on the real journal. That held at the default 256 KiB (1,324 lines) and at 0, 1, 100, 4,096 and 1,048,576 bytes. The handoff extension's 24-hour duplicate check reads through `tailLines`, so it is unchanged.
- The import lines of `lib/adoption.mjs`, at lines 22–29 and anywhere else in the file, are byte-identical to main's. The lane's library exports main's 15 names plus `windowLines`.
- On the real journal, `windowLines` with the 4 MiB cap returned every line with `cut: null`, because the file is under the cap.
- The lane's own test files passed when run directly: `adoption-reader.test.mjs` with 56 PASS checks, including R-2850 to R-2852 and the seal, and `adoption-producer.test.mjs` with 62 PASS checks.

## Findings

1. **NOTE**: the cost is small and within budget. With the real journal, the reader adds about 7 ms (36.7 to 43.8 ms median), because it now reads all 1.87 MB instead of 256 KiB. Past the cap it adds about 15 ms (36.4 to 52.1 ms). The worst producer run was 63.8 ms against 2,500 ms.
2. **NOTE**: the owner sees no change today. The real journal holds 4 unadopted reports, and the newest is 20 days old, so neither side lists anything. Main is already partly blind, though: today's 7-day window needs 309,756 bytes, and the 256 KiB tail reaches back only to 2026-10-19T22:45Z. A report from the window's oldest day would be dropped on main and listed by the lane, as the second scenario showed.
3. **NOTE**: the whole hook entry's stdout differed between sides with the real journal (164 against 697 characters). The adoption part was empty on both, so the lane did not cause the difference. The stale-copy producer, which this lane does not touch, caused it. Run from the worktree, that producer compares the installed hooks and rules, which point at main's checkout, with the worktree's copies, and reports many as stale. Main's own entry printed one stale notice that was already there. This comes from running the hook from a worktree, not from the change.
4. **NOTE**: the coverage check looks only at the read's first dated whole line. That matches the plan's coverage rule and its known limit on out-of-order timestamps. I did not exercise out-of-order timestamps against the real journal. The plan measured 0 backward steps.
5. **NOTE**: Windows was not run, because no Windows machine was available. The lane adds no path handling: `readTail` is `tailLines`' old body, it reads the same path, and it opens the file read-only as before. Windows behaviour is inferred to be unchanged, including a pi session holding the journal open for append.
6. **NOTE**: the copy was not atomic against live appends. The real journal grew by 519 bytes between my size check and the copy. The prefix hash shows the original's existing bytes were not changed. Nothing in this check depends on the copy's last line being whole.
