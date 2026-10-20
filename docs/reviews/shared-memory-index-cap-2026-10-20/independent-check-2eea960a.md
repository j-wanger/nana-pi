# Independent check — shared-memory-index-cap at e5b95409 (2026-10-20)

VERDICT: HOLDS

Setup: a private clone at e5b95409 under <tmp>, a temp HOME for every probe, and made-up entry names. Probe 1 used a temp copy of the live shared index and reports only counts. "main" means the hook from 9552afb1, copied beside the tip hook.

Probe 0, the lane's own checks: `node tests/shared-memory-budget.test.mjs` and five other related files, then `scripts/code-map.mjs --check`, `scripts/readme-check.mjs` and `requirements-moved.mjs --base 9552afb1`.
- Output: budget 7/7 PASS; shared-memory-hook 43/43; shared-memory-input 3/3; hooks-closed-output 7/7; hook-producers 11/11; hook-deadlines 3/3.
- Map: 0 problems. README: 729 claims checked, 0 problems. R-2340 to R-2346 are new and implemented. No nana-budget temp folders were left.
- HOLDS.

Probe 1, the live index shape (62 entries, 12,932 bytes): `env -i HOME=<tmp>/h1 CLAUDE_PROJECT_DIR=... node main-hook.mjs` and then `node nana-shared-memory.mjs`.
- Output: main printed 12,752 chars. The tip printed 8,942 chars with all 62 entries. It cut 60 descriptions to one common length of 66 and left 2 whole. No cut line had a broken prefix.
- Last line: `index shortened to fit the hook output cap: 60 of 62 entries shortened, 0 left out; full index: <tmp>/MEMORY.md`. HOLDS.

Probe 2, under budget: a CRLF index with non-entry lines (`  - nested`, `* [..]`) and an emoji. Compared with `cmp` against main, then again with `.claude/projects` as a symlink so the note line prints.
- Output: `plain: identical (410 bytes)` and `note: identical (475 bytes)`. HOLDS.

Probe 3, over budget with the note line: 70 entries of 150 to 357 description chars, in the symlinked home.
- Output: `chars=8998`. Line 2 is `self-heal skipped: symlinked path component`. All 70 entries printed. The last line says `70 of 70 entries shortened, 0 left out`. HOLDS.

Probe 4, mid-budget cuts: a title holding `]` (`- [Pear [old] rule](pear.md)`) and a link holding `)` (`(fig_(draft).md)`), among 60 entries of 200 chars.
- Output: `chars=8941`. The Pear line printed whole at 231 chars, as the plan states. The Fig line was cut after its link (`135 cut`), and the link stayed intact. HOLDS.

Probe 5, too many entries to fit even with descriptions removed: 200 entries with about 45-char titles, plus the `)` link at entry 2.
- Output: `chars=8995 entries=121`. The first 121 entries printed in order. The last line says `121 of 200 entries shortened, 79 left out`.
- The Fig line printed as `- [Fig notes](fig_(draft)…`, so its link is broken. Known bug, F1.

Probe 6, reader closes early: `(run hook 2>err; echo exit) | head -c 50`, and again with `| true`, on the 200-entry index.
- Output: `hook exit=0` and `stderr bytes=0` both times. HOLDS.

Probe 7, run the way install wires it: hook symlinked as `<tmp>/.claude/hooks/nana-shared-memory.mjs` and run with `sh -c "node '<link>'"`.
- Output: `exit=0 chars=8995 link=shared`. The new config module loads through the link, and self-heal still creates the link. HOLDS.

Probe 8, a CLAUDE_CONFIG_DIR of 883 chars with the live-shaped index.
- Output: `chars=8979 entries=62 foldEndsWithIdx=true`. HOLDS.

Probe 9, one line at budget + 1.
- Output: main printed `chars=9001`. The tip printed `chars=9000` and ended with `1 of 1 entries shortened, 0 le…`. HOLDS.

Probe 10, run time: 500 entries of 1,000-char descriptions, about 0.5 MB.
- Output: main took 80 ms and printed 515,591 chars. The tip took 74 ms and printed 8,981 chars, with `298 of 500 entries shortened, 202 left out`. That is far under the hook's 5 s timeout. HOLDS.

Not run: win32. The hook has no win32 branch, and the new test uses the same spawn environment as the existing hook test, which runs on Windows. The Windows result is unverified until the lane's CI leg reads it.

Cleanup: <tmp> removed, worktree clean at e5b95409, and no probe process left running.

F1, known bug: a link holding `)` gets a partial head, ending at its first `)`. When descriptions are cut to nothing, the trim mark lands inside the link (`- [Fig notes](fig_(draft)…`; probe 5).
- The plan's known-limits line is wrong on one half. It says a link holding `)` makes the whole line its head, so the line is "never shortened, only dropped whole".
- That holds for a `]` in a title (probe 4), but not for a `)` in a link. The residual must say so.
- Today's memory file names hold no parentheses, so the live index does not hit this.

F2, known bug in the handoff file, not a harm: HANDOFF at the tip carries nothing for this lane. It has no landed line and none of the plan's known limits as residuals. The limits are:
- astral text, if Claude Code counts bytes;
- the newest trailing entries dropped once titles alone overflow (about 125 entries at today's title length; probe 5 dropped 79 of 200);
- a header longer than the budget;
- the `]` and `)` head cases from F1, with the corrected wording.

The land checklist puts these in the reviewed change before the final round.

No HANDOFF line becomes untrue. Lines 607 and 608 (closed reader: exit 0, link still repaired) hold, per probes 6 and 7. Line 746 (no time limit of its own) and line 390 (stale-copy scope) are unchanged.

No MUST findings: no data loss, no write outside the temp folder, no broken hook or install, no fail-open in the land or gate tools, and under-budget output matches main byte for byte.
