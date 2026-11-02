Feature: FEAT-006 · Launch builders with execution limits

Lane precedent-line-parse. Class: ordinary. Builder: pi-worker (small lane). Build session 2, on branch tip 9f398b20 after build 1 stopped BLOCKED (`build-1-blocked.md` in this folder). The block was right. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH. The laptop is memory-limited: run test files one at a time.

Build to the plan of record, `plan.md` in this folder. Its new "Revision 3" section resolves your block and overrides Revision 2 wherever they differ: the final selection order, the final refusal text, and the test-edit rule. Everything else in `build-brief-1.md` still applies: rows R-3716 to R-3719, M1 to M4 as Revision 2 states them minus the dropped bare-folder case, the constraints, "Show your work", "Done when" and the report.

Changes from build brief 1:
- `docs/known-bugs/FEAT-006.md` may gain exactly one line: "- Precedent check (precedent-line-parse, plan attack): a bullet whose first word is a tracked folder name and that holds no backticked path passes the Precedent check."
- Existing worker-lane and brief-check assertions should stay true unedited. If one compares a whole refusal line exactly, update it to the new line and list it. The R-2580 bare `tracked` fixture stays unchanged.

Standing authorization: when a Precedent file has a private helper this lane needs, export it from its own module (never copy, never move it) and report each export as a departure.

Commit, do not push, and stop. Report the full tip.

## Precedent

- `packages/nana-pack/lib/brief-precedent.mjs`: `entryText`, `normalizeEntry`, `checkPrecedent` and `checkBriefForLaunch`.
- `packages/nana-pack/lib/brief-config.mjs`: the `PRECEDENT_*` values.
- `packages/nana-pack/tests/worker-lane.test.mjs`: `defaultBriefText` and R-2579 to R-2581, R-2616 to R-2620.
- `packages/nana-pack/tests/brief-check.test.mjs`.
