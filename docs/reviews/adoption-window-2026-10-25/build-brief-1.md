Feature: FEAT-014 · Create or adopt a project workspace. Lane adoption-window. Class: hook. Builder: pi-worker (small lane). Build session 1.

Work in the lane worktree on feat/adoption-window. The spec is `docs/reviews/adoption-window-2026-10-25/must-meet.md`; read it whole. `plan-draft.md` and `plan-attack.md` beside it are its inputs; where they differ, the must-meet holds. In particular the must-meet drops the draft's R-2853 and the draft's part two: do not touch `config_project_ignored` or its writer. Do not edit HANDOFF.md, `docs/sessions/`, `docs/known-bugs/`, `scripts/product-report.mjs`, `docs/product-report/`, or any file in a review folder. Also leave alone: `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/lib/config.ts`, every file under `packages/nana-setup/`, the import lines and `TAIL_BYTES` of `packages/nana-pack/lib/adoption.mjs`, the Artifact and Reads lines in REQUIREMENTS.md, and every existing row's wording and test.

Precedent:
- packages/nana-pack/lib/adoption.mjs — `tailLines`, the tail read (absent as empty, `ENOTFILE`, whole lines, torn first line dropped). Its body moves into a private `readTail(file, bytes)` in the same module that returns `{ lines, start }`; `tailLines` wraps it unchanged and `windowLines` calls it. Also `recentReports`: the `Date.parse(e.ts)` reading, the `t > sinceMs` boundary, and the `Object.assign(reports, { dropped })` form that `cut` follows.
- packages/nana-pack/bin/nana-adoption.mjs — the imports inside the `try`, the `ADOPTION UNAVAILABLE` marker, the refused-entry count line with its blank-line join, and the one tagged write.
- packages/nana-pack/lib/frontier-summary-config.mjs — the config module form and its chosen, measured and contract provenance comments with "Sealed" notes.
- packages/nana-pack/tests/adoption-reader.test.mjs — the temp HOME harness (`run`, `line`, `repo`, `NANA_TEST_TEMP_ROOTS` set empty) and R-153's empty-output cases.
- packages/nana-pack/tests/adoption-producer.test.mjs — the large-journal fixture and R-146's tail test, which must stay green unchanged.
- packages/nana-pack/tests/build-records.test.mjs — the seal test form.
- packages/nana-setup/lib/hook-producer.mjs — the per-producer limit and the shared deadline that the cap's provenance cites; read only.

The one extraction is `readTail`, inside `lib/adoption.mjs`. No private helper moves to a shared module, and no helper gains a caller outside its module.

The task:
1. Rows R-2850 to R-2852 at the end of SUB-016's table (after R-2765), worded as in the must-meet, `implemented` once their tests pass, and the seal test.
2. `packages/nana-pack/lib/adoption-config.mjs`, with the six-tag header, no imports, and `JOURNAL_WINDOW_READ_MAX_BYTES`, `ADOPTION_WINDOW_MS` and `ADOPTION_WINDOW_CUT_PREFIX` carrying the provenance the must-meet gives.
3. `packages/nana-pack/lib/adoption.mjs`: the private `readTail`; `tailLines` unchanged in signature, default and output; the new export `windowLines(file, sinceMs, maxBytes)` with its `cut` field, as the must-meet's seat decisions say; no new import; `@outputs` gains the window read.
4. `packages/nana-pack/bin/nana-adoption.mjs`: import the config inside the existing `try`; `ADOPTION_WINDOW_MS` replaces the inline `WINDOW_MS`; one `sinceMs` goes to both `windowLines` and `recentReports`; the cut line, in R-2851's exact text, is stdout's last line, joined to `out` as the count line is; `@inputs` and `@outputs` updated.
5. One sentence in the pack README's adoption paragraph, as the must-meet says; `npm run map` and `node scripts/requirements-tree.mjs --write` regenerated.

Test literals: build journal lines with `JSON.stringify`, as the harness's `line()` does, and end or join them with one constant `const NL = String.fromCharCode(10)`. Write no new backslash escape inside any string or template literal, and leave every existing escape in the file exactly as it is; the seat diff-checks escapes. Write the seal's title in double quotes, so its apostrophe needs no escape. Keep fixture text ASCII, so a line's length is its byte count. Each fixture asserts its own offsets and sizes before it runs the reader, as the must-meet says.

Try each must-meet row's red cases by hand, see the named check turn red, restore, and say so in your report; do not commit them.

Checks before your one commit: `node packages/nana-pack/tests/adoption-reader.test.mjs` alone; `node packages/nana-pack/tests/adoption-producer.test.mjs` alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; the demo below; `npm run test:locked`, with its output kept out of the worktree; then `git status --short` must print nothing.

Demo: make a scratch HOME outside the worktree with a synthesized 5 MiB `.pi/agent/nana-journal.jsonl` whose lines all fall within the last two days. Run `node packages/nana-pack/bin/nana-adoption.mjs` with HOME and USERPROFILE set to it and PI_CODING_AGENT_DIR unset. Confirm stdout is the tag line and exactly one cut line naming the cap and the first dated whole line's time. Then cut that journal to 1 MiB and confirm stdout is empty.

Seat check: `node docs/reviews/adoption-window-2026-10-25/seat-titles.mjs all` must print `0 missing`.

Done: the three rows, their tests and the seal exist and pass; `tailLines`' output is unchanged and R-146's tail test is green; the reader lists reports up to the cap and prints one cut line past it; `lib/adoption.mjs` gains no import; the map, readme, trace and tree checks are green; the full suite is green; the seat check prints `0 missing`; `git status --short` is empty; and the work is committed.

Report (at most 10 lines after the VERDICT line): the commit sha; the rows; each red case's hand check; the demo's two outputs; whether `git diff main -- packages/nana-pack/lib/adoption.mjs` touches any import line; the full suite's summary line; map, readme, trace, tree and seat-check status; any departure from the must-meet, with its reason.
