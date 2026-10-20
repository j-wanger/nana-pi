# Seat checks — knowledge-sources-unparseable build 1, tip c87c69d5 (2026-10-20)

- Build 1 is one commit, 51d65cf8, by a pi gpt-5.6-sol builder (`pi-worker --lane-size larger`), from main 9552afb1
  with the plan at e6a63af5 (`must-meet.md`, `plan-attack.md`: one adversary, AMEND; `build-brief-1.md`). c87c69d5
  adds only the seat's pairs table and record. Rows R-2370 to R-2376 read implemented; `requirements-moved --base
  9552afb1` lists all seven as new and implemented, in FEAT-003.
- CI runs on draft pull request #143 at 51d65cf8 (c87c69d5 is not pushed; it changes no code). CI run 39496158186 at 51d65cf8 reads 0 failing on all three legs: macOS 193 PASS, 0 FAIL, 2 SKIP of 195 files (8,007 checks pass, 35 skip); Ubuntu 192 PASS, 0 FAIL, 3 SKIP of 195 files (7,946 checks pass, 55 skip); Windows 177 PASS, 0 FAIL, 18 SKIP of 195 files (6,935 checks pass, 114 skip). The install check passes on macOS and Windows. The Windows leg's log is ci-windows-51d65cf8.log in this folder.
- The seat's wrong-code pairs (`seat-mutate.mjs`, the shared mutation runner, macOS, Node 22.22.2, one shard, merge
  base 9552afb1) on 51d65cf8 (`seat-mutate-output-51d65cf8.txt`): 24 of 24 red, 0 survived. Baselines:
  sources-file 7 PASS, discovery 37 PASS, 0 FAIL each.
  - 23 pairs turn exactly their named checks red. Each of the build brief's W1 to W11 has one: W1 S2, W2 B4, W3 B2,
    W4 S7, W5 S8, W6 S3, W7 C3, W8 S4, W9 C2, W10 S5, W11 S10. S1, S6, B1, B3 and C1 put back main's form.
  - S4 (W8: a missing sources.json treated as unreadable, so never seeded) prints no FAIL line. Under it no seed file
    is written, so discovery.test.mjs throws reading that file before its first seed check prints. The named check "a
    freshly seeded sources.json carries the discover block" reads NOT REACHED, and the file's CRASH line is the red,
    as the seat declared before the run (DECLARED (c)). The discovery file fails, so the suite would catch W8.
  - The record's tally reads "2 with a named title green" for one such pair. The runner counts S4 twice: once for its
    unreached named check, once for having no named match. HANDOFF already carries that double count
    (objective-path-shapes). The red and survived counts are right.
  - Declared without a pair: the json-text import, the problem type and field, the three module headers, the index
    age refresh under a sources problem (no must-meet row pins it), and status UNREADABLE (a plan known limit).
- The independent check (`independent-check-c87c69d5.md`, run on 51d65cf8): HOLDS over twelve probes. Its test runs,
  one file at a time, read 0 fail (sources-file 7, discovery 37, incremental-build 30, unreadable-root 7, hook 98);
  code map 0 problems; readme-check 728 claims, 0 problems. P11 shows main 9552afb1 drops both rows on an unreadable
  sources.json. P3 covers status UNREADABLE and P7 the hook's background build and age refresh, which no check pins.
  - Findings: none at MUST.
  - Known bug, not lane-caused: a sources.json that parses with the wrong shape still purges every row, as on main
    (P9; plan known limit). Recorded as a HANDOFF residual in this commit.
  - Note: the untracked `seat-mutate.mjs`. Settled in c87c69d5, which commits it with its record.
  - Its HANDOFF note: this commit adds the Landed line and the residual lines. The "Ten planned lanes" ask is dropped
    now, since the owner answered it; knowledge-index recovery waits for this land under Next.
  - Windows: the changed lines have no platform branch and the test file no skip, so Windows proof rests on CI.
- At c87c69d5 plus these notes: the trace reads 1,674 rows, 1,437 implemented and traced, 0 rows off form; map:check
  reads 365 modules, 0 problems.
- The local macOS install check runs before the land; the seat has not run it yet.
