Feature: FEAT-002 · Resume decisions and next actions. Lane session-start-frontier, rows R-2606 to R-2613, plus the seal test. Class: hook. Builder: pi-worker (larger lane). Build session 1 of 1: the moved frontier checker, the frontier block lib and producer, the objective hook's second producer under a shared budget, and the pi extension.

Work in the lane worktree on feat/session-start-frontier. The plan of record is `docs/reviews/session-start-frontier-2026-10-22/must-meet.md`: read D1 to D11, the rows, what each test does, the tunables, the known limits and the wrong-code pairs first; then `plan-attack.md` (M1, M2, S1 to S9, N2 to N6, N10, N12 to N14) and `plan-draft.md` (its measurements). Where the draft and the must-meet disagree, the must-meet wins: there is no deliverables count line, no tree-check child process and no R-2614 (D10, D11). Follow packages/nana-pack/README.md's module rules. Do not edit HANDOFF, the session archive or the known-bug files.

Precedent:
- packages/nana-setup/claude/hooks/nana-adoption.mjs — one hook entry running two producers in a row.
- packages/nana-setup/lib/hook-producer.mjs — `launcherDefinitions`, `HOOK_PRODUCER_TIMEOUT_MS` and `runHookProducer`; gains an `args` option and a written-length return.
- packages/nana-pack/bin/nana-objective.mjs — the producer CLI shape.
- packages/nana-pack/bin/nana-adoption.mjs — imports inside the try, the `oneLine` failure path, the quoted-data framing.
- packages/nana-pack/extensions/nana-objective.ts — compute at `session_start`, inject at `before_agent_start`.
- packages/nana-pack/extensions/nana-rulings.ts — the `opts` seam, no `orderNanaSections`, and `causeFor` to move.
- packages/nana-knowledge/lib/hook.ts — the `NANA_ROLE` check.
- packages/nana-pack/bin/nana-frontier.mjs — the checker body to move into `lib/frontier-check.mjs`.
- packages/nana-pack/lib/handoff-asks.mjs — `splitOpenSection`; export `TAG`.
- packages/nana-pack/lib/frontier-config.mjs — `isNamed` and `LIVE_SECTION_NAMES`.
- packages/nana-pack/lib/adoption.mjs — `canonicalCwd` and `repoRootOf`.
- packages/nana-pack/lib/bounded-read.mjs — `readBounded`; gains `readFailureCause`.
- packages/nana-pack/lib/display.mjs — `promptText` and `promptPath`.
- packages/nana-pack/lib/rulings-config.mjs — the config module form.
- packages/nana-setup/lib/shared-memory-config.mjs — the 10,000 cap and the 9,000 budget.
- packages/nana-setup/tests/hook-deadlines.test.mjs — copied hooks, producer stubs and R-2011.
- packages/nana-pack/tests/objective-golden.test.mjs — hook stdout equals the extension section minus the tag line.
- packages/nana-pack/tests/rulings.test.mjs — the fake pi driven per reason.
- packages/nana-pack/tests/frontier.test.mjs — the frontier-baseline golden guarding the move.
- packages/nana-pack/tests/templates-render.test.mjs — the runtime inventory and matrix rows.
- packages/nana-knowledge/tests/hook.test.mjs — `delete process.env.NANA_ROLE` at the top.

1. Move the checker body into `packages/nana-pack/lib/frontier-check.mjs` with one-pass heading stacks and an exported Next section (D5, D6); `bin/nana-frontier.mjs` prints byte for byte as today. Move `causeFor` into `lib/bounded-read.mjs` as `readFailureCause` (D8). Export `TAG` from handoff-asks. Add `NEXT_SECTION_NAME`.
2. `lib/frontier-summary-config.mjs` (no imports), `lib/frontier-summary.mjs` and `bin/nana-frontier-summary.mjs` (D4, D7, D9).
3. `hook-producer.mjs`: the `frontier` definition built from the imported config names, the `args` option and the written-length return; `nana-objective.mjs` runs the second producer with `--max` (D2). No settings.json change.
4. `extensions/nana-frontier-summary.ts` (D3), registered as the other extensions are.
5. Tests with the must-meet's exact titles and `// req:` markers in the four test files, with every case "What each test does" lists; the listed existing-test edits. Rows R-2606 to R-2613 in FEAT-002 (SUB-005) with the must-meet's texts, `implemented` with evidence; CAP-01's R-873 and CAP-04's R-327 lines (D10). The docs the must-meet lists; regenerate AGENTS.md's marker region from the shared template.
6. Run the four new or changed test files, frontier, handoff-asks, rulings, objective-golden, hook-producers, hooks-closed-output, templates-render and the setup tests, then `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, then `npm run test:locked` before your last commit. Try these wrong versions, see each go red, then restore: pairs 3, 6, 13, 14, 17 and 18 of the must-meet's list.

Seat check: `node docs/reviews/session-start-frontier-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done:
- A Claude Code session and a pi session that start in a repository with a HANDOFF.md see its frontier block; launcher children see nothing; the objective stays whole under the hook cap.
- The frontier checker CLI prints exactly as before.
- map:check, req:tree, readme:check, the trace and the full suite are green; the seat check prints `0 missing`; the work is committed.

Report (at most 14 lines after the VERDICT line): the commit shas; the check results; each departure from the Precedent files with its reason; each existing test you edited and why; the wrong versions tried and their results; the full suite's summary line; map, readme, trace and seat-check status.
