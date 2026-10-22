Feature: FEAT-006 · Launch builders with execution limits. Lane precedent-first, rows R-2582, R-2583, R-2584 and R-2585, plus the seat's finding F1 on build 1. Class: ordinary. Builder: pi-worker (larger lane). Build session 2 of 2: the label-section fix, the two preamble lines, the plan sentence, brief-check, the ruling and the docs.

Work in the lane worktree on feat/precedent-first. Read `docs/reviews/precedent-first-2026-10-22/must-meet.md` again first: Amendment 1, D6 to D9, rows R-2582 to R-2585 and what their tests do, and the known limits. Build 1 is f3c4a763.

Precedent:
- packages/nana-pack/lib/markdown-list-sections.mjs — build 1's shared scanner; F1 changes only its label-section end.
- packages/nana-pack/bin/pi-worker.mjs — build 1's precedent and known-bug step, which brief-check must share rather than copy.
- packages/nana-pack/prompts/builder-preamble.md — the Scope lines the two new lines join.
- packages/nana-pack/tests/worker-lane.test.mjs — `RULE_LINE` and `preambleOnce`, and R-2510's new preamble line with its own row.
- packages/nana-pack/tests/templates-render.test.mjs — R-1100's Plans-bullet check and R-859's byte-identical AGENTS region.
- packages/nana-pack/rules/nana-rulings.md — the rulings file and its line form.

F1 (must fix). The seat ran build 1's reader on this lane's own `build-brief-1.md`, which has a plain `Precedent:` list, a blank line, then numbered steps. The reader took steps 1 to 4 as entries, so pi-worker would refuse the brief, naming "Move", "brief-precedent.mjs", "Update" and "Run". Amendment 1 sets the rule: a label section ends at the first blank line after its first entry. A heading section and handoff-asks keep their behaviour. Add the amendment's case to R-2580's table (label, blank line, numbered steps; passes; N counts only the bullets).

1. Move build 1's precedent and known-bug step out of pi-worker into one lib function that takes the brief path, the worktree root and an injected git runner, and returns the refusal or the launch line plus the known-bug path. pi-worker and the new `packages/nana-pack/bin/brief-check.mjs --brief <file> --tree <worktree>` both call it (D7, R-2585). brief-check prints exactly what pi-worker prints for that brief and worktree, exits 1 or 0 to match, and starts nothing.
2. Two lines under Scope in `packages/nana-pack/prompts/builder-preamble.md` (D6, R-2582, R-2583), each with its `RULE_LINE` entry.
3. The shared template's Plans bullet gains D8's sentence (R-2584); the Larger-lanes bullet's Claude Code clause gains the brief-check run (D7). Regenerate AGENTS.md's marker region so R-859 holds, and add D8's sentence to AGENTS.md's local brief section. Add D8's ruling line to `packages/nana-pack/rules/nana-rulings.md`.
4. `packages/nana-pack/README.md`: the lane-mode paragraph (the refusal, the launch line, the third prompt) and a short brief-check section with its command. Regenerate the code map.
5. Tests with the must-meet's exact titles and `// req:` markers for R-2582 to R-2585, with every case "What each test does" lists. Flip R-2582 to R-2585 to `implemented` with evidence. Run the changed test files, `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, then `npm run test:locked` before your last commit. Try these wrong versions, see each go red, then restore: the label section continuing past a blank line; brief-check with its own copy of the check; brief-check exiting 0 on a refusal; either preamble line missing; the Plans sentence missing.
6. Run brief-check on both of this lane's build briefs against the worktree: both must pass. Paste its two launch lines in your report.

Seat check: `node docs/reviews/precedent-first-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done:
- A plain `Precedent:` list followed by a blank line and numbered steps passes, and both lane briefs pass brief-check.
- pi-worker and brief-check share one check; the preamble, the template, AGENTS.md, the ruling and the README say what the must-meet says.
- map:check, req:tree, readme:check, the trace and the full suite are green; the seat check prints `0 missing`; the work is committed.

Report (at most 12 lines after the VERDICT line): the commit shas; F1's fix; the check results; each departure from the Precedent files with its reason; the wrong versions tried; brief-check's two launch lines; the full suite's summary line; map, readme, trace and seat-check status.
