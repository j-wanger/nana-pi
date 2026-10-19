# bom-pack-config — plan attack (one adversary)

Verdict: AMEND

AMEND. The design holds, but three of the planned tests can pass on today's code unless the brief says how to check them. I fixed that and tightened two rows.

What I confirmed (fresh clone of main f29827a under a temporary HOME, deleted afterwards; the repo is untouched):
- P1–P4 are red today, as the plan says. doctor shows ✗, the projectFile row falls back to the default name, and install creates nana-objective.md. `project` seeds the file that hides the user's commands. `--check` reports an empty command set, and the hook prints nothing.
- P5 is red, but only if the test reads the right file. In all three cases (enabled false, journal.path set, GOALS.md present), today's code writes the line to the DEFAULT journal; the configured journal stays empty.
- I applied the planned change in the clone: one new module and three call-site edits. doctor-detail, install, project, adoption-reader and adoption-producer each passed whole. `map:check` found 0 problems.
- I tried the wrong code. Stripping every leading mark, calling trim(), and removing every mark each made doctor accept a boundary file it should reject, so R-1586 catches all three.
- The plan's list of readers is complete. The roster, the roster-notice hook and the objective hook already strip one mark. The three sites in the plan are the only raw nana-pack.json readers outside the frozen desk.
- No in-flight worktree touches steps.mjs, doctor.mjs, project.mjs, adoption.mjs or the five test files. IDs R-1580 to R-1589 are unused, and no lane appends after R-399.

What I changed:
1. R-1585 brief: every case now counts lines in both the configured journal and the default journal. If the test reads only the configured journal, as the file's helper does, the enabled-false and GOALS.md cases pass on today's code.
2. R-1584 brief: the test uses a fresh root that only the configured journal records. A root the default journal also records would let today's fallback pass. The title now starts "hook:" because the test runs the hook.
3. R-1580 brief: both runs use one layout, because the detail text names the config path. The test also asserts the unmarked row is ✓, so two equal failures cannot pass.
4. R-1582 brief: the test now asserts the reason text the row promises.
5. I dropped the instruction to unset PI_CODING_AGENT_DIR in the project tests. `--home` already ignores it, and an existing test (R-674) pins that.
6. Leaf total: today's main is 1,278, so the total becomes 1,285 with these rows. The plan said 1,285 "on today's main".
7. R-1586 row: I removed "as pi's config reader does". The test never runs pi's reader, so the row claimed more than its test checks.
8. Class wording: "the seat's land reviewer" instead of naming astra. Power mode has Fable doing land review until Tue 2pm.
9. Fixtures build JSON with JSON.stringify and then add the mark, so Windows backslashes are escaped.
10. Known limit 6 now also notes that R-309 lives in FEAT-013.
11. I cut the brief from about 70 lines to 32, under the 50-line cap.

I kept the shared module. Three inline strips would match config.ts, but the project.mjs site would then have no test against the multi-mark wrong code. One parser lets the doctor boundary test cover all three sites, for about 12 lines.

I kept the lane class: install + hook. doctor and install change, and adoption.mjs sits behind both a Claude Code hook and a pi extension.

I kept the larger builder, since an install + hook lane counts as riskier.

The claim most likely wrong: that the owner's real failure is a UTF-8 byte-order mark. PowerShell 5.1's `Set-Content -Encoding UTF8` is documented to write one, but nobody has seen the owner's file. If his tools write UTF-16 instead, this lane fixes nothing he hits, and pi rejects that file too. The HANDOFF residual says doctor and the adoption hook fail on a marked file, which supports the UTF-8 reading.

Files the build touches:
- new <repo>/packages/nana-pack/lib/json-text.mjs
- <repo>/packages/nana-setup/lib/steps.mjs
- <repo>/packages/nana-pack/lib/adoption.mjs
- <repo>/packages/nana-setup/lib/project.mjs
- tests: doctor-detail, install and project under packages/nana-setup/tests; adoption-reader, adoption-producer and requirements-tree under packages/nana-pack/tests
- REQUIREMENTS.md, docs/requirements-tree.md, docs/code-map.md
- seat only: docs/reviews/bom-pack-config-2026-10-19/, HANDOFF.md, docs/sessions/

Conflicts: all are mechanical. Every lane regenerates the code map and the requirements tree and bumps the R-291 total. This lane lands before install-honest-report and win-path-commands, which also edit steps.mjs. It changes only readPiPackConfig's body and one import there.
