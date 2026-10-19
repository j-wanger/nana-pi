# win-stale-copies — plan attack (one adversary)

Verdict: AMEND

AMEND. The design holds, and every red-today claim reproduced on a clone of main 6b3e432 with a temp HOME. POSIX probe: after removing one rule link, pointing another elsewhere and replacing a third with a byte-equal file, the installed adoption hook printed nothing and exited 0. Doctor marked all three rules failed. win32-simulated probe: after changing the standards, rulings and SKILL.md copies, the hook printed nothing, while in-process diagnose() listed the rule nana-standards.md, rule nana-rulings.md, skill requirements and pi nana-rulings.md rows as failed. The rulings extension set only the nana-rulings key, with no stale text. Cost: the hook takes about 87 ms today, and a node start that imports doctor.mjs takes about 65 ms, so the 5 s hook timeout is not at risk.

Amendments:
(1) Drop the readBounded change to linkOk. linkOk already checks isFile before it reads, so a FIFO never blocks. pi reaches linkOk only after buildBlock has read the file under its 8192-byte cap, and Claude Code loads the rule file itself anyway. No test pinned the bound, so it was untested behaviour. With it gone, the doctor change is a pure move.
(2) R-1601 now also forbids the unavailable line. Before, a checker that crashed on a healthy install, for example on native Windows, passed R-1601. The install check would not catch it either, because it reads only the adoption conditions.
(3) The unavailable prefix was "INSTALL CHECK UNAVAILABLE". The repo already has a tool called the install check, so the prefix is renamed to the stale-copy check.
(4) R-1603 is narrowed to the launcher, which is all its test drives. R-1600 already proves the hook wires the launcher in.
(5) "names each such row" is removed from R-1600, because R-1602 already pins the exact label set. R-1600 and R-1602 now say "WHEN the adoption hook runs", which is what the tests run, not "a Claude Code session starts".
(6) R-1604 and R-1605 move out of rulings.test.mjs into the new stale-copies test. That file shares the install and in-process diagnose() harness, so the rows' "doctor would mark" clause is actually tested. In the plan the R-1604 fixtures were hand-made and never compared against doctor. rulings.test.mjs is no longer touched.
(7) The command's path is double-quoted, so a home folder with a space still pastes.
(8) The feature sentence now says the line reaches the agent, not the screen.
(9) R-1602 must also check that doctor's failed set is not empty, so the comparison cannot pass vacuously.

Lane class is right: the lane changes a Claude Code hook, a pi extension and doctor. Builder: complex lane, so pi-worker with the sol builder. No step writes outside the lane worktree or the temp folder. The one claim most likely wrong: that the person ever sees the line. It reaches the agent as session context or a system-prompt section, and nothing pins that the agent relays it.

Files the build touches:
- New: packages/nana-setup/lib/stale-copies.mjs, packages/nana-setup/lib/stale-copies-config.mjs, packages/nana-setup/bin/stale-copies.mjs, packages/nana-setup/tests/stale-copies.test.mjs.
- Changed code: packages/nana-setup/lib/hook-producer.mjs, packages/nana-setup/claude/hooks/nana-adoption.mjs, packages/nana-setup/lib/doctor.mjs (linkOk move only), packages/nana-pack/extensions/nana-rulings.ts.
- Records and docs: packages/nana-pack/tests/requirements-tree.test.mjs (R-291 total), REQUIREMENTS.md, docs/requirements-tree.md, docs/code-map.md, packages/nana-setup/README.md, packages/nana-pack/README.md.

Conflicts: no in-flight lane touches the hook wrapper, hook-producer.mjs, nana-rulings.ts or the new modules. REQUIREMENTS.md, the tree, the R-291 total and the code map are regenerated at merge; audit-open-questions also edits REQUIREMENTS.md. packages/nana-setup/README.md is also edited by win-leg-flip (Support line) and readme-install (install checklist). Those are different sections, so the merge should be textual. In this slate, bom-pack-config, install-honest-report and win-path-commands edit doctor.mjs. This lane only deletes linkOk there and adds one import. If one of them lands first and changes linkOk, carry that change into stale-copies.mjs. If one changes doctor's rule or skill rows, re-run R-1602. This lane does not edit steps.mjs.
