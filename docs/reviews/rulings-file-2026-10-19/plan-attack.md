# rulings-file — the adversary's verdict (AMEND), 2026-10-19

AMEND. The mechanism is sound and every red-today claim holds on probes. Nine changes are needed before the build.

Probes (2026-10-19, fresh mktemp folders with a temp HOME, repo untouched):
- A: `install --home H --pi-home P` exits 0. Neither P nor H/.claude/rules holds a nana-rulings.md.
- B: `doctor` on that home under NANA_SETUP_PLATFORM=win32 prints no rulings row.
- C: `readBounded(file, 8192)` behaves as the plan assumes in every case: missing, directory, FIFO (0 ms, no hang), exactly at the cap, one byte over, invalid UTF-8, BOM and dangling link.
- D: a scoped seed draft is 2,392 bytes with 19 dated bullets. It holds no identity word and no model word.

Amendments:
1. The brief told the builder "Never run the full suite". That line belonged to the planner. The builder preamble requires a green full suite on the last commit, and nana-land needs the suite on the reviewed tip. Done now says `npm run test:locked`.
2. Subtraction: drop the prompt-sections.mjs change. orderNanaSections leaves a non-nana key where it is, R-641's order stays true, and no test would pin a new position.
3. New R-1418, a scope sentence. Builders and reviewers in both runtimes receive the file. This is verified: this planner is a Claude Code subagent and its context carries all four installed rules. Seat-only rulings would otherwise steer builders, such as "pushing another branch or opening a draft PR needs no approval" and "lane counts". This follows the seat guide's R-1141.
4. R-1411 narrowed. "Cannot be read" was dropped because no test can pin it: chmod does nothing on Windows and root reads anything on Linux CI. "Empty" was added. "Naming the cause" moved from the row to the brief. The marker now speaks to the user, so a pi builder child is not told to run `nana-setup install` itself.
5. The R-1412 test uses `--pi-home P` outside H/.pi/agent. Otherwise code that hard-codes `<base>/.pi/agent` would pass.
6. R-1415 lists only words the tracked tree already holds: Jake (496 files), jwang, AML and aml-desk. Adding the given name (0 files), the email (0 files) or work-domain phrases would publish them in a public test file, against the owner's 10-16 ruling.
7. R-1417 matches whole words, because "sol" sits inside "resolve" and "console". The row now defines "short name" as the last hyphen part of each model id. R-1416 is narrowed to the shape the test checks: "a date", not "its ruling's date".
8. The seed is repo-scoped. Claude rules load in every project on the machine, so nana-pi-only rulings start with "In nana-pi,". These are the desk freeze, pushing main, the install check and Windows testing. The seat owns the seed text in the must-meet and checks it before the build, not after it.
9. File list: root package.json and root README.md also say "eight extensions" (lines 11 and 170). docs/requirements-tree.md must be regenerated with `npm run req:tree`. prompt-sections.mjs is removed from the list.

Kept: the agent-dir install plus the extension, as the owner ruled ("install to user level .pi folder"). Reading the pack file directly would drop R-1412, R-1414 and the stale-copy limit. I recorded that option as considered and rejected rather than overriding the ruling. The Claude rules link replacing the hook is correct and verified. The lane class is right.

Files the build touches:
- New: packages/nana-pack/rules/nana-rulings.md, extensions/nana-rulings.ts, lib/rulings-config.mjs, tests/rulings.test.mjs, packages/nana-setup/tests/rulings-install.test.mjs.
- Edited: packages/nana-pack/README.md and package.json; root package.json and README.md; packages/nana-setup/lib/steps.mjs, paths.mjs, doctor.mjs and state-manifest.mjs; packages/nana-setup/tests/state-manifest.test.mjs, uninstall.test.mjs and restore.test.mjs; packages/nana-setup/README.md; REQUIREMENTS.md (FEAT-001).
- Regenerated: docs/requirements-tree.md and docs/code-map.md.
- Written by the seat: HANDOFF.md, docs/sessions/2026-10.md and docs/reviews/rulings-file-2026-10-19/.

Conflicts:
- win-review-paths also edits packages/nana-pack/README.md and docs/code-map.md. Its README hunks are in the review and land section, and this lane edits the extension table. Expect a clean text merge, then regenerate the map.
- clean-revision edits REQUIREMENTS.md (R-1370 to R-1377), docs/requirements-tree.md and requirements-tree.test.mjs. Regenerate the outline after merging main, and meet any new tree check.
- win-objective-golden: no overlap. No ID overlap with any lane.

Seat notes:
(a) This machine's roster prints "largerBuilder: none, source: default". By AGENTS.md the builder is then the roster builder (pi luna through pi-worker), not a Claude Sonnet subagent. Setting Sonnet needs largerBuilder set with Jake's yes.
(b) The relayed user request ("turn off land verification and hooks that require my confirmation until then... power mode") is not handled here. This read-only planner changed nothing. If the seat applies it, it may change this lane's ladder. It may also contradict the seeded 10-10 ruling (an independent reviewer accepts every revision that reaches main). Reconcile the seed with Jake's answer before the build.

Most likely wrong: that the scope sentence keeps a builder or reviewer from acting on a seat-only ruling, for example pushing its branch because the ruling says it needs no approval. This is inferred. No test can pin how a model reads it.

Planning incident: the workflow's planners share one session scratchpad. My "probe-dir.txt" handoff file was overwritten by another planner. One seed draft (seed.md) landed in that planner's folder (plan.70E1qu). I verified its content and removed exactly that file. My own probe folders were plan.th3YNx, which someone else removed, and plan.ZVvO5S, which I left in place. My writes to the shared probe-dir.txt may have pointed another planner at my folder. No repository, ~/.pi or ~/.claude file was touched, and git status stayed clean.
