# Independent check — knowledge-sources-unparseable at 51d65cf8 (2026-10-20)

VERDICT: HOLDS
Setup: a private clone at 51d65cf8 under <tmp>. Each probe used a temp HOME and NANA_KNOWLEDGE_HOME, with two made-up articles (zebracorn in a.md, quokkafish in b.md) and one good build first. The clone is removed, no probe process is left, and the worktree is untouched.

Tests (`node tests/<f>.test.mjs`, one file at a time):
- sources-file exit=0, 7 pass, 0 fail. discovery exit=0, 37 pass. incremental-build exit=0, 30 pass. unreadable-root exit=0, 7 pass. hook exit=0, 98 pass. extension and render: all pass. Verdict: holds.
- `code-map.mjs --check`: 0 problems. `readme-check.mjs`: 728 claims checked, 0 problems. `requirements-moved --base 9552afb1`: R-2370 to R-2376 are new and implemented. Verdict: holds.

Probes:
P1. sources.json re-saved Notepad-style (UTF-8 mark, CRLF, pretty-printed), then build and query zebracorn.
  `00000000: efbb bf7b 0d0a ...` / `files 2 · rows 2 · ... removed 0` / `- Alpha — <tmp>/probes/p1/root/a.md`. Verdict: holds.
P2. PowerShell 5 Out-File form (UTF-16LE mark, CRLF), then build, query and status.
  `fffe 7b00 0d00 0a00` / `root 2 files 2 rows` / `- Beta — .../b.md` / status `ok   articles <tmp>/probes/p2/root`. Verdict: holds.
P3. `chmod 000 sources.json` (EACCES on macOS), then build, `build --rebuild`, status and query.
  build: `<tmp>/.../sources.json  UNREADABLE (no roots read, rows kept)` / `files 2 · rows 2 · removed 0 · preserved 2` / `[exit 0]`
  rebuild: same marker, `preserved 2`. status: `sources <tmp>/.../sources.json  UNREADABLE (no roots read, rows kept)` / `2 files · 2 rows`. Query still hits Alpha. Verdict: holds. This also covers status UNREADABLE, which no test pins.
P4. File cut off mid-save (first 25 bytes). While it was broken, b.md was deleted and c.md (narwhalbee) was added. Then the good file was restored.
  broken: `UNPARSEABLE at line 1, column 26 (no roots read, rows kept). Repair the JSON by hand.` / `preserved 2`. quokkafish still hits, narwhalbee gives `(no hits)`.
  repaired: `reindexed 1 · unchanged 1 · removed 1`. quokkafish gives `(no hits)` and narwhalbee hits Gamma. Verdict: holds. Repair resumes purging and adding.
P5. A sentinel string in a trailing-comma file, then a missing-comma file. stdout and stderr of build and status were grepped.
  `grep -c SENTINEL` → `0` / `UNPARSEABLE (no roots read, rows kept). Repair the JSON by hand.` / `UNPARSEABLE at line 1, column 34 ...`. Verdict: holds. No file text leaks.
P6. Lowercase `c:\users\me\notes` (a bad Unicode escape).
  `UNPARSEABLE at line 1, column 24 (no roots read, rows kept). Write paths in this file with forward slashes ...` / `preserved 2`. Verdict: holds.
P7. The Claude Code hook on a 2h-old index with an empty sources.json. The hook got real UserPromptSubmit JSON on stdin.
  The hook printed the pointer block with Alpha and Beta, `[hook exit 0]`. The background build ran: `db mtime before 15:00:00` → `after 17:00:52`.
  status: `UNPARSEABLE ... Repair the JSON by hand.` / `2 files · 2 rows · built 0.0h ago`. Leftover processes: `0`. Verdict: holds. Rows survive the hook's build, and the age refresh stops a build on every prompt.
P8. UTF-16LE with no mark.
  `UNPARSEABLE at line 1, column 2 (no roots read, rows kept). Repair the JSON by hand.` / `preserved 2`. Verdict: holds, as the plan's known limit says.
P9. Top-level `null`, then `{"roots":[]}`.
  Both give `files 0 · rows 0 · removed 2`. Verdict: holds as documented. null purging is the plan's known limit, and an empty list purging is R-2376 as designed.
P10. status with no sources.json.
  `sources <tmp>/probes/p10/kh/sources.json` with no marker, and the file is seeded. Verdict: holds. The seed path is unchanged.
P11. Main 9552afb1 on the P3 input (same code taken from git archive).
  `files 2 · rows 2` → `files 0 · rows 0 · ... removed 2`. Verdict: confirms the lane fixes a real loss on main.
P12. sources.json as a symlink to a folder.
  `UNREADABLE (no roots read, rows kept)` / `preserved 2`. Verdict: holds.
win32: the changed lib and bin lines have 0 platform branches, and the test file has 0 platform guards or skips. The only Windows-shaped inputs are the encodings (P1, P2) and the paths (P6), all probed on macOS. Windows proof rests on CI.

Main uses checked:
- `nana-setup project` takes the last stdout line containing "files ". The new marker line comes before the totals line, so its summary is unchanged.
- No other reader parses the status first line. state-manifest only lists the file.
- The new `../nana-pack/lib/json-text.mjs` import reaches the hook through build.ts. The hook already imports `../nana-pack/lib/display.mjs`, so the repo-layout dependency is not new. The README names both files.
- For any file that parsed on main, decoding is the same as main's: plain UTF-8, no mark.

HANDOFF on the tip:
- The lane makes no line untrue.
- The tip has no dated entry for this lane and no residual lines yet. The seat must add them before the final round, carrying the must-meet known limits.
- After the land, the seat must update the frontier line "Ten planned lanes" ("Knowledge-index recovery should build after the knowledge-sources lane lands"). Its wait ends then.

Findings: none at MUST.
- Known bug, not lane-caused: a sources.json with the wrong shape (null, a misspelt key, roots not an array) still purges every row, as on main. The plan records it as a known limit, and P9 confirms it.
- Note, not a finding: `git status` in the worktree shows one untracked seat file, `docs/reviews/knowledge-sources-unparseable-2026-10-20/seat-mutate.mjs`. `nana-land` needs a clean checkout, so the seat must commit or remove it before landing.
