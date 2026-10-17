# Lane mutate-runner — build brief 1 (2026-10-17 · feat/mutate-runner · tip after the seat's plan commit)

**Builder: Claude Sonnet 5**, the larger-lane builder, a subagent in this worktree (`~/nana-pi-wt/mutate-runner`). Build
the frozen plan, `CHANGE.md` in this folder as seat revision 5 leaves it: every row in §2, every check in §5.1 and every
existing-check change in §5.2, the design in §3 (3.1–3.9), the README section of §3.7. Do not build anything §3.9 cuts
or §6 "Later lanes" lists. Do not write or run §5.3's pairs: the seat runs them afterwards with its own old-form runner.

**Order.** Requirement rows first (§2 text verbatim, the 15 new rows `planned` in FEAT-031), then the tests with the
exact titles `seat-titles.mjs` lists, each with its `// req:` marker directly above the check, each seen FAIL before the
code (a stub module whose exports throw is fine); then the code. A row flips to `implemented`, with its Evidence cell
citing its titles, in the commit that turns its tests green. Commit after each group: (1) the 15 rows `planned`, the
regenerated tree and R-291's leaf total; (2) the config module and the new test file with all 26 titles red; (3) scratch
worktrees, one test file's run, cleanup and the parent's dead-shard cleanup (R-1230 to R-1234); (4) edits, syntax, path
containment, baseline and judging (R-1235 to R-1237); (5) split, record, refusals, dry and logs, the record lock, tip and
table identity, the merged config (R-1238 to R-1244); (6) the pack README section, the regenerated code map, and the
port with its two records (Done 3).

**Points the plan sets that are easy to miss.**
- Build-brief rules 1 to 5 under §5.2 bind: in the test file, `tmpDir` only and no `mkdtempSync(` text anywhere, bare
  PASS lines, fixture tables run with an environment built from scratch, no quoted relative specifier the code map reads
  and no fixture line that starts with `//` then `req:`; in the two modules and the port, the agent-dir variable name
  only inside quotes, never at a line end and never read from `process.env`.
- Concurrency is proved by rendezvous marks, never timing (M15, M23); M24's drift comes from a fixture table that reads
  `SEAT_MUTATE_SHARD`. Point each fixture run's `TMPDIR` at a check-owned folder, so leftover scans stay local.
- Tunables live in `lib/mutation-runner-config.mjs` with provenance; checks import names, and only M20 holds literals. A
  fixture table's `config` names only the `OVERRIDABLE` keys it changes.

**Rules.** Work only in this worktree. Run only the test files you touch, each with `node scripts/test.mjs <file>`, in
the foreground, each tool call under 5 minutes; never the full suite (`npm test`, `npm run test:locked`), never a
background command. Never touch the real home folder, `~/.claude` or `~/.pi`; every test and fixture uses temporary
homes and folders. Never write a person's name, a provider, gateway or machine name, or an absolute home path. Do not
touch the seat's files (`CHANGE.md`, `CHANGE-draft3.md`, `seat-titles.mjs`, this brief, the critiques, fact-checks,
research and plan-review files), `HANDOFF.md`, `docs/sessions/`, or anything §3.8 forbids. Commit per group with explicit
paths (never `git add -A` or `.`), message prefix `mutate-runner: `, ending
`Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`; push to `origin feat/mutate-runner` after each commit.

## Done
1. The touched test files green; the new file's time on its own run in the report (budget 60 s; over it, name the checks
   that cost it).
2. `node docs/reviews/mutate-runner-2026-10-17/seat-titles.mjs 1` → `seat-titles 1: 0 missing`.
3. Equivalence, §5.4 item 2 (A2). Write `docs/reviews/mutate-runner-2026-10-17/seat-mutate-port.mjs`: the constants,
   titles, DECLARED lines and 71 pairs of `docs/reviews/roster-notice-2026-10-16/seat-mutate.mjs` unchanged, plus one
   `runMutations` call with `self: import.meta.url`, `tip: "f5c2d3c"` and no `config`; no checkout path. From the
   worktree root, run it twice in the foreground, one after the other, each call with the tool's 10-minute limit:
   `SEAT_MUTATE_TIP=f5c2d3c SEAT_MUTATE_SHARDS=1 SEAT_MUTATE_OUT=docs/reviews/mutate-runner-2026-10-17/seat-mutate-port-output-1.txt node docs/reviews/mutate-runner-2026-10-17/seat-mutate-port.mjs 2>&1 | tail -5`,
   then the same with no `SEAT_MUTATE_SHARDS` and `-output-5.txt`. Each record must match the committed
   `docs/reviews/roster-notice-2026-10-16/seat-mutate-output-f5c2d3c.txt` line for line on verdicts: per pair in table
   order the same id, verdict word (`RED` or `GREEN`) and named count (`k/m named` or `(no named case)`), and the same
   RESULT counts, 71/71 red, 55 exactly their named titles, 4 with a named title green, 15 with an unnamed red, 0
   survived. Name any pair that differs with its titles and trace it to a §3.3 row, or report it as a bug. A run past 10
   minutes is stopped and reported as PARTIAL.
4. `node scripts/requirements-tree.mjs --check`; `node scripts/code-map.mjs --check`; `npm run -s readme:check`;
   `node scripts/requirements-trace.mjs`. Commit, push.

## Report
≤ 25 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each group with the red you saw first; the touched
test files' summary lines and the new file's time; seat-titles' last line; both port RESULT lines, their wall times and
any pair that differs; the last line of each Done 4 check; the one claim most likely wrong.
