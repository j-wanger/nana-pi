# Review round 2 — verifier-pipe-commit-match, 2026-10-20 (Claude Opus 5.5, the final reviewer)

Feature: FEAT-010 · Guard risky commands and protected resources

Round 1 reviewed `fe6b7298`. The final reviewer said LAND with two SHOULDs (crafted-input cost; the if branch before else, a declared limit) and two NOTEs. The land reviewer sent it back with two MUSTs, each a command main asks on and the tip let through, reproduced by the seat through the predicate:
1. `set -e; (echo preparing; set +e; true); npm test | tail -5; git commit -m checked`: a `set +e` later inside a subshell turned outer errexit off.
2. `npm test | Select-Object -Last 5; if ("$?" -eq "True") { git commit -m checked }`: the PowerShell string scanner blanked `$?` inside double quotes, where PowerShell expands it.

This round reviews only what changed since round 1: `git diff fe6b7298..HEAD` on `feat/verifier-pipe-commit-match`. Main has not moved (`7aadbc99`).

- `af9c9934`, `68772d65` (with the build-6 pairs record) and `62aa2e41`: `build-brief-6.md` to `build-brief-8.md`.
- `9f155fd2` (build 6): `bashErrexitStates` walks the command once and restores the outer errexit state at the closer of every `( … )`, `$( … )`, unquoted backtick substitution (which `liveText` now reads as a group) and process substitution. The PowerShell string and here-string scanners keep `$?`, `${?}` and `$LASTEXITCODE` live inside an expandable string or here-string; a backtick escape or single quotes keep them literal. R-2350 and R-2351 widened to match.
- `71f3904d` and `3b503992` (builds 7 and 8, tests only): cases for a backtick substitution, a process substitution and an escaped `$?` in an expandable here-string after the pipeline. Build 7's first two cases came from a wrong seat brief and could not reach their sites; build 8 corrected them.
- The seat's pairs: 69 of 76 red on 9f155fd2 (E9 and X23 survived, unpinned); 71 of 76 red on 3b503992 (`seat-mutate-output-3b503992.txt`). K1, K8 and C1 survive as in round 1. F4 (the backtick left neighbour) is now equivalent on tested input; S26 (PowerShell `${?}`) is a spelling no row claims.
- The notes commit after it: HANDOFF and the session entry record round 1 and builds 6 to 8, with the final reviewer's crafted-input cost and real-home-folder notes as new residuals and the PowerShell 5.1 line corrected. CI run 39516274164 at 3b503992 reads 0 failing on all three legs: macOS 196 PASS, 0 FAIL, 2 SKIP of 198 files (8,169 checks pass, 36 skip); Ubuntu 195 PASS, 0 FAIL, 3 SKIP of 198 files (8,108 checks pass, 56 skip); Windows 180 PASS, 0 FAIL, 18 SKIP of 198 files (7,098 checks pass, 114 skip). The install check passes on macOS and Windows. The Windows leg's log is ci-windows-3b503992.log in this folder.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, run at 70b74fc8):

```
tree movement 7aadbc9..70b74fc: 10 rows in 2 features
FEAT-010 · Guard risky commands and protected resources
  R-982 implemented -> retired
  R-2350 new (implemented)
  R-2351 new (implemented)
  R-2352 new (implemented)
  R-2353 new (implemented)
  R-2354 new (implemented)
  R-2355 new (implemented)
  R-2356 new (implemented)
  R-2357 new (implemented)
FEAT-013 · Install and connect harness runtimes
  R-1064 text changed
```

Threat model and lane class as round 1: honest variation in commands agents and the owner write is in scope; deliberate forgery is out. Install, hook or gate lane: the Claude Code verifier hook and the pi gate share this predicate.

Check: (1) both round-1 MUSTs are closed, including their nearby forms (a set +e anywhere inside any of the four groups; `$?` in an expandable here-string or subexpression); (2) build 6 adds no new fail-open against main: no command main asks on and round 1's tip asked on now goes unasked, in either dialect; (3) the backtick group in `liveText` keeps git detection inside and beside backticks as before; (4) the widened rows say no more than their checks prove; (5) HANDOFF and the session entry are true; (6) any MUST.

Answer with the full review as your final message: MUST / SHOULD / NOTE, a score, and as the last line exactly `VERDICT: LAND` or `VERDICT: SEND-BACK`.
