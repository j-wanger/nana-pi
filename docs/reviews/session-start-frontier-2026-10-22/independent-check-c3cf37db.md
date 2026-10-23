# Independent check — session-start-frontier at c3cf37db (2026-10-22)

One independent check for this hook lane: a fresh Claude Code agent, read-only on the repo, every probe in a fresh temp folder with a temp HOME and USERPROFILE and `NANA_ROLE`, `PI_CODING_AGENT_DIR`, `CLAUDE_CONFIG_DIR` and `PI_CODING_AGENT_SESSION_DIR` unset. Its question: does the feature work for a seat starting a session, and does the change cause a material harm.

MATERIAL: none

- **This repo's HANDOFF in a fixture repo, run from a subfolder through the real hook:** exit 0 in 172 ms, 2,353 characters. The objective comes first, then one `[nana:frontier]` block: Next 6, asks 24 (1 blocking, 21 optional, 2 parked), check line `findings=1 (word-budget 1)`. Over 20 runs the hook averages 164 ms, against 118 ms on main.
- **Objective part unchanged:** across 6 sessions (subfolder, deep long path, linked worktree, no HANDOFF, folder with spaces, HANDOFF as a folder), the hook's output before `[nana:frontier]` matches main's whole output byte for byte. With `objective.enabled: false`, only the frontier block prints.
- **Long objective:** long umbrella and project lines (cut at 1,500), a deep untrusted path and a config-failure line. The objective alone is 8,663 or 8,845 characters; the hook total is 8,743 or 8,925 (frontier "omitted" line), under the 10,000 cap. The objective stays whole.
- **Both producers hung (copied hook, stubs that never exit):** both markers print in order, exit 0, 3,040 ms, under the 5 s limit. With the frontier producer cut by its limit (the dense 900 KB files below), the hook ends in about 1,650 ms with the frontier marker.
- **Launcher roles:** `NANA_ROLE=worker` and `reviewer` print no frontier block through the hook (objective still prints). The producer alone prints 0 bytes, exit 0. `Worker` prints the block, as the plan says.
- **HANDOFF variants through the producer** (all exit 0, 43–55 ms): CRLF, UTF-8 BOM and a symlink give the same block as LF. A folder, a FIFO (no hang), UTF-16 and a file of 1 MiB + 1 byte each give the heading plus one `FRONTIER UNAVAILABLE` line naming the cause and path. An empty file gives both `none found` lines plus the check line. A missing file or a dangling link gives 0 bytes. Outside a repo, the folder's own HANDOFF prints. In a real `git worktree add` subfolder, the linked worktree's title shows, not the main checkout's.
- **900 KB HANDOFF with 12,991 headings:** producer 314 ms, hook 426 ms.
- **Steering and control text:** U+2028/2029/0085, ESC sequences, tab/VT/FF/NUL, U+202E/U+2066, a 600-character title, a fake `[nana:objective]` title, and a folder name with a newline and U+202E. Every output line is free of control and bidi characters. Titles are capped at 160 characters plus `- `. The path prints as an escaped JSON string.
- **pi extension (fake pi):** 9 folders × 3 roles × 5 reasons = 135 cases. Each section equals the producer's output minus the tag line, or is absent when the producer prints nothing. A second `session_start` after an edit shows the new title; after deleting the file no section is set. A null or bad ctx does not throw. pi 1.0.2's loader calls `factory(api)` only, so the `opts` default is safe.
- **Frontier CLI, lane against main:** 636 inputs (the 14 local HANDOFF files, the lane's own copy, 5 fixtures, CRLF/BOM/empty, scale and 900 KB files, and 600 fuzz files), each under 3 option sets (plain, `--strict`, the invalid date `2026-02-30`), plus one missing file. All 1,908 runs gave identical stdout, stderr and exit codes.
- **Lane tests:** frontier-summary, frontier-golden, frontier-hook, hook-deadlines and frontier all pass.

NOTE: picking which titles fit is quadratic in the item count. Producer times: 51 KB with 828–1,885 items, 121–231 ms; 200 KB with 7,247 items, 1.8 s; 900 KB with 15,301 items, 3.6 s; 900 KB with 14,239 items, 8.7 s; 900 KB with 31,452 items, 27 s. The Claude hook stops at 1.5 s and prints the marker; the pi extension has no limit, so pi's session start blocks for that long. The plan's "1 MiB reads well under a second" holds for headings, not for list items. The largest local seat-written HANDOFF is 24 KB.

NOTE: when the objective exceeds 9,000 characters, `--max` goes negative and the omitted line reads "frontier block omitted: -518 characters left after the objective". Cosmetic.

NOTE: the hook goes over 10,000 characters only if the objective tops about 9,910; the lane adds at most about 90 characters there. The objective's own 12,000 cap is older than this lane.

NOTE: a bold lead holding U+2028 or U+2029 fails the `.+?` match, so that title prints with its `**` marks, still clean and on one line.

NOTE: 7 of the 14 local HANDOFF files show "Next: none found" (their Next is missing or a paragraph, as D5 intends); 6 show no asks (the known seed `## Open` limit).

NOTE: Windows was not probed.

The seat recorded each NOTE that describes behaviour as a FEAT-002 known-bug line.
