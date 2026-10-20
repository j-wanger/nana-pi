# Independent check — pack-config-utf16 at 961f76d1 (2026-10-20)

VERDICT: HOLDS

Setup: private clone at $P=<tmp> with the lane at 961f76d1 and main at c203f485. Every probe used a temp HOME under $P. "PS5.1-shape" means FF FE or FE FF, a 4-space pretty print, CRLF line endings and a trailing CRLF.

Must-meet and adjacent tests (single files, lane tip):
- pack-config-utf16 5/0 (R-2237 SKIP on macOS), adoption-reader 45/0, doctor-detail 72/0, project 124/0.
- project.test needed NPM_CONFIG_PREFIX=<home>/.local. With the temp HOME, `npm root -g` pointed at the hermes node, which has no pi. That is an environment issue, not a lane issue.
- nana-roster 18/0, nana-roster-set 8/0, config-gate-fallback 38/0, gate-config-robustness 4/0, config-handlers-malformed 99/0, objective-golden 1280/0, roster-notice 16/0, adoption-producer 62/0, agent-dir-config 100/0, config-project-gate-fallback 27/0.
- `code-map --check`: 0 problems. `readme-check`: 720 claims, 0 problems.

Probes:
1. Gate on a PS5.1-shape user file with a non-ASCII pattern (`gate-child.mjs <repo>`; commands "terraform destroy", "echo naïve-rm now", "ls").
   - main LE/BE: all three "BLOCK: user nana-pack.json gate block is malformed".
   - lane utf8, utf8bom, LE, BE: `terraform` BLOCK by pattern, `naïve-rm` BLOCK by pattern, `ls` allow. Identical to main's UTF-8 result. HOLDS.
2. Gate fail-closed for a broken UTF-16 file (LE plus one stray byte, and LE with no mark).
   - lane: all three commands "BLOCK: … gate block is malformed — repair it". Same as main, so not fail-open. HOLDS.
3. Gate with win32 forced (`process.platform` set to win32, tool "powershell") on a PS5.1 LE file.
   - lane: `terraform` and `naïve-rm` BLOCK by pattern, `ls` allow. Odd-byte file: all BLOCK malformed. Main LE: all BLOCK malformed. HOLDS.
4. UTF-8 regression check, main vs lane. Inputs: 12 files (plain, BOM+CRLF, two BOMs, trailing comma, empty, `null`, a raw Latin-1 byte, a lone FE, a lone FF, a backslash path, a lone BOM, a lone FF FE). Each ran through nana-objective, `nana-roster --json` and the nana-roster-notice hook, with outputs diffed.
   - Only one line differs: the FF FE-only file. Its refusal text changed from `Unexpected token '�'` to `Unexpected end of JSON input`, and it is still refused. Every UTF-8 input gives byte-identical output. HOLDS.
5. `nana-setup doctor` rows (nana-pack.json and objective), main vs lane, over the same 12 files plus PS5.1 LE, BE, odd-byte and BOM files and a CRLF file with a trailing comma.
   - Only the UTF-16 inputs differ. LE and BE go from "✗ … UNPARSEABLE" to "✓", and objective.projectFile goes from the default to "GOALS.md".
   - The broken UTF-16 file now reports "at line 4, column 3", the same as its UTF-8 twin. Main gave no place. The odd-byte file stays ✗ with "Repair the JSON by hand". HOLDS.
6. `nana-roster set reviewer p r2 high` on a PS5.1 BE file and a PS5.1 LE file. Each file had mode 600 and carried `note: "rocket 🚀 café"` and an unknown gate block.
   - Both: rc=0, `.bak` byte-equal to the original, new file starts `7b 0a` (UTF-8), mode stays 600, the note round-trips, no temp file left behind, and the follow-up read shows "reviewer: p r2 high". HOLDS.
7. Claude Code nana-objective hook.
   - User file BE with `enabled:false`: main prints 1985 bytes plus UNPARSEABLE; lane prints 0 bytes.
   - Project `.pi/nana-pack.json` LE with `enabled:false`: main and lane both print the objective (1775 bytes), so project config still cannot turn it off.
   - User file LE with `projectFile` GOALS.md: main prints OBJECTIVE plus UNPARSEABLE; lane prints GOALS. HOLDS.
8. Install's objective seed (`stepPiConfig` with dryRun) on a PS5.1 LE file whose objective.path points at a real repo's OBJECTIVE.md.
   - main: "pi nana-objective.md | created | would create", a stray seed.
   - lane: "unchanged | not needed — objective.path already points at HOME/repo/OBJECTIVE.md".
   - nana-pack.json is byte-unchanged in both. HOLDS.
9. Claude Code nana-roster-notice hook on a PS5.1 BE file.
   - main: "roster refused: invalid JSON".
   - lane: "roster: builder b medium, reviewer r, land seat". HOLDS.

Findings: none at MUST level. No new known bugs.

Notes:
- R-2237 (real Windows PowerShell 5.1) prints SKIP on macOS, so this check did not verify it. It stays unverified until the Windows CI leg passes it.
- The frozen desk still reads a UTF-16 file as unreadable (plan known limit 2). Its save path warns that the file is unreadable and keeps a backup before it writes (`backupWrite` in `apps/desk/server.mjs`), so the change loses no data.
- A UTF-16 file has half the room under the 1 MiB bounded-read cap. No realistic config gets near it.
- Process slip: one of my commands wrote a 61-byte probe file at <tmp>/null. It was my own content, and I deleted it right away.
- The worktree <worktrees>/pack-config-utf16 is untouched: status is clean and HEAD is 961f76d1.