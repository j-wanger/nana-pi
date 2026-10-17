# Lane runtime-map — build brief 1 (2026-10-17 · feat/runtime-map · tip after the seat's must-meet commit)

**Builder: Claude Sonnet 5**, the larger-lane builder, a subagent in this worktree. This lane runs under the owner's
2026-10-17 feature-first ruling: build the feature to its nine must-meet tests and nothing more.

**What to build.** `must-meet.md` in this folder is the plan of record: its nine rows (R-1270 to R-1278, text verbatim)
and its nine tests MM1 to MM9, with the exact titles `seat-titles.mjs` lists. Take each part's shape from `CHANGE.md`
§3 (3.1 the runner knob, 3.2 the measure command and `npm run map:measure`, 3.3 the data file, 3.4 the impact lines,
3.5 modules, 3.6 config read by name), and its seat amendment 1 at the end: the measure command starts test-locked in a
process group of its own (detached on POSIX) and never signals a group that holds a process outside the suite's tree.
Build only what the nine tests need. Where §3 designs a part none of them needs (Windows path rules beyond
`fileURLToPath`'s own, link and native-path root forms, the knob refusal, schema and unreadable-data notes, per-line
stale marks), leave it out, unless it is a few lines that the design puts in the path of a must-meet test anyway.
Write no test beyond the nine, and do not edit an existing runner check's assertions (MM1 says so). `CHANGE.md` §3.8's
"What NOT to do" still holds.

**Order.** Rows first, `planned`, under the feature `must-meet.md` names (FEAT-031 for R-1270, FEAT-029 for the rest).
Then the nine tests, each with its `// req:` marker directly above the check, red before the code. Then the code. A row
flips to `implemented`, with its Evidence cell citing its title, in the commit that turns its test green. Commit after
each group: (1) the config module and the runner knob, MM1; (2) the measure command and `map:measure`, MM2, MM6, MM8,
MM9; (3) the impact lines in the code-map shim, MM3, MM4, MM5, MM7; (4) the README's two sentences, R-291's leaf total
(the base total plus nine), and the regenerated `docs/code-map.md` and `docs/requirements-tree.md`.

**Rules.** Work only in this worktree. Run only the test files you touch, in the foreground
(`node scripts/test.mjs <file>`), each tool call under 5 minutes. Never run the full suite, `npm test`,
`npm run test:locked` or `npm run map:measure` on this repo; a measurement is a full suite run. Never run a background
command. Never write the real home folder, `~/.claude` or `~/.pi`: every test uses temporary homes and temporary
fixture repositories, and every check that runs the impact command or the measure command against a fixture sets the
data-file override, except MM9, which runs with no override inside its own fixture clone. Never write a person's name or
a provider or machine name. Repo hygiene tests scan `docs/reviews/` and the tests: never write
`process.env.PI_CODING_AGENT_DIR`, and never end a line with `PI_CODING_AGENT_DIR`. Do not touch the seat's files
(`CHANGE.md`, `must-meet.md`, `adversary.md`, `seat-titles.mjs`, the other records in this folder), `HANDOFF.md` or
`docs/sessions/`. Commit with explicit paths, prefix `runtime-map: `, ending
`Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`. Push to `origin feat/runtime-map` after each commit.

## Done
The touched test files are green, and the two test files' added seconds are measured. Then
`node docs/reviews/runtime-map-2026-10-17/seat-titles.mjs 1` → `seat-titles 1: 0 missing`,
`node scripts/requirements-tree.mjs --check`, `node scripts/code-map.mjs --check`, `npm run -s readme:check` and
`node scripts/requirements-trace.mjs`. Commit, push.

## Report
≤ 20 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each group with the red you saw first; the
touched test files' summary lines and seconds; the last line of each Done command; any §3 part you built that no test
needs, and why; the one claim most likely wrong.
