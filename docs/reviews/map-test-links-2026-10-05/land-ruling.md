# Land ruling — map-test-links (Fable, read-only, 2026-10-05)

Ruled on `bcfa9eb` vs main `bb92cc7`, after astra r3 (cap spent). **RULING: LAND — 8/10. No MUSTs.**

Verified independently: code-map test (38 checks), requirements rail (802 rows, 0 off form),
`map:check` (172 modules, 0 problems), templates-render (both languages, scaffold + adopt);
recount 245 edges, 95 test modules, 13 untraced; fresh renders TS vitest 80/80 + biome clean,
Python pytest 59/59; all 12 lost-import inputs from astra r2/r3 resolve on HEAD; the three
whitespace positions astra r3 found unpinned each fail their own fixture under mutation; no
non-test consumer parses `--impact` output.

Answers: (1) the branch does what Jake asked and nothing more — the G-007 test filter and a
`biome-ignore` are forced consequences; (2) every astra r3 finding is closed; the pre-existing
spurious-edge class is the one recorded residual and does not block; (3) status is honest except
the ID-block sentence; (4) subtracting both filters was right — the class is pre-existing on main,
changed 0 edges here, and the repo already handles it with `ignore`; (5) nothing breaks a fresh
render or `map:check`; a new project's first `--impact` reads 1 of 5 (TS) / 4 of 5 (Python)
untraced, expected and recorded in Open question 11.

Residuals (seat, at land):
1. FIXED at land: the ID-block sentence now says R-860 to R-864 consumed, R-863/R-864 retired.
2. FIXED at land: Open question 12 names the remedy — the `ignore` list in `code-map.config.json`.
3. FIXED at land: Open question 10 names the TypeScript spellings in the silent class
   (`String(new URL(…))`, `.toString()`, `fileURLToPath(new URL(…))`).
4. RECORDED: R-862's executing evidence needs `uvx copier` on the machine (same as R-858).
5. RECORDED: the G-007 repo-shape test skips test-root modules on the from side; today that
   excludes one edge, `agent-dir-parity.test.mjs → apps/desk/pi-session.mjs`.
6. RECORDED: template changes reach new projects only at the next `v*` tag.

Notes kept: R-862 evidence SKIPs wholesale without `uvx copier`; `code_map.py` `untraced_tests`
docstring has a stray blank line (cosmetic). Fable's least-sure claim: the Open question 12 line
number.
