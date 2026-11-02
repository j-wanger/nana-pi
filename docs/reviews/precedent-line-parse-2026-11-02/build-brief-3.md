Feature: FEAT-006 · Launch builders with execution limits

Lane precedent-line-parse. Class: ordinary. Builder: pi-worker (small lane). Build session 3, on branch tip 320efe5f after build 2. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH. Run test files one at a time.

The plan of record is unchanged (`plan.md` in this folder, Revision 3 final). The seat verified build 2 by reading `corpus.txt`. It found 22 bullets that main accepts and build 2 refuses. The seat's rule was that bullets accepted today behave exactly as now, so these are regressions. The 85 refused bullets that build 2 newly accepts are the intended fix.

Standing authorization: when a Precedent file has a private helper this lane needs, export it from its own module (never copy, never move it) and report each export as a departure.

## Build

1. MUST, 16 bullets: backticked-first spans holding several line references now refuse.
   - Example: `` `scripts/ci-records.mjs:19-30, :44-67`: … ``. Main took `scripts/ci-records.mjs`; build 2 takes the whole span `scripts/ci-records.mjs:19-30, :44-67`.
   - Fix: a code span's chosen value is the span's first whitespace-separated token. Trailing punctuation and the `:line` suffix are then stripped as today.
   - This drops Revision 2's "a span with inner spaces keeps them". A path with a space inside a code span is not supported; record that in the plan's residuals, in the report, not as a known-bug line. Change M1's inner-space case to pin this behaviour: the first token is chosen.
2. MUST, 6 bullets: a bare first token with a line suffix is treated as prose.
   - Example: `REQUIREMENTS.md:788-791 — R-2573 … at `:727``. Main took `REQUIREMENTS.md`; build 2 takes the first code span (`:727`, or `Feature: FEAT-nnn · <label>`).
   - Fix: decide whether the first token is path-shaped after removing trailing punctuation and the `:line` suffix, the same normalization the chosen value gets.
3. Re-run `corpus.mjs` into `corpus.txt`. Its summary must count outcome changes by direction and kind. Required:
   - 0 changes from accepted to refused, overall;
   - every change from refused to accepted listed, as now.
   Add one literal M3 fixture for each of the two regression shapes above.

Change nothing else.

## Done when

- `corpus.txt` shows 0 changes from accepted to refused.
- Green, run one at a time: `brief-check.test.mjs`, `worker-lane.test.mjs`, `planner-prompt.test.mjs` and `test-runner.test.mjs`; the known-bug-digest and anatomy-sessions tests build 2 ran; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `node scripts/known-bugs.mjs --root .`; and `node scripts/identity-scan.mjs --root .` after `git add`.
- Commit explicit paths on `feat/precedent-line-parse`.

Report the two fixes, the new corpus counts by direction, and each departure. Commit, do not push, and stop. Report the full tip.

## Precedent

- `packages/nana-pack/lib/brief-precedent.mjs`: build 2's selection code and `normalizeEntry`.
- `packages/nana-pack/tests/brief-check.test.mjs`: build 2's M1 to M4 checks.
