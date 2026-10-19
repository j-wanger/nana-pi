# Independent check — gate-rm-workdir at d6f0613 (2026-10-19)

VERDICT: HOLDS

Private clone of d6f0613 at <tmp>/gate-rm-workdir-check.kEQ9m6/lane, with a temp HOME and temp folder under it. Main baseline is 4be0b79 in a sibling worktree. Probe scripts are probe.mjs, probe2.mjs and probe3.cjs in that temp folder, run against the real registered handler.

PROBES
1. `node --experimental-strip-types packages/nana-pack/tests/gate-rm-inside.test.mjs`
   Output: 7 PASS (R-1490 to R-1496), "all PASS". Verdict: OK.
2. Same command on the retargeted tests: gate-corpus, gate-survives-mutation, display-surfaces, requirements-tree.
   Output: 227 / 38 / 181 / 89 PASS, all green. The counts match the plan. The retarget diff only changes `x` to `../x` and `build` to `../build`; no assertion was dropped. Verdict: OK.
3. `node scripts/code-map.mjs --check` and `node scripts/readme-check.mjs`
   Output: "0 problem(s)" (294 modules), and "693 claims checked; 0 problem(s)". Verdict: OK.
4. probe A: cwd is a real git repo with `.git` at its top. Commands: `rm -rf dist node_modules`, `rm -rf packages/a/dist`, `rm -f build/out.log`, `rm -r build`.
   Output: ALLOW headless every time, and ALLOW interactive with "dialogs+0". Verdict: OK, the feature works in a normal repo.
5. probe B: nested repos.
   - `rm -rf repo-wt/lane1` (worktree with a `.git` file) -> BLOCK.
   - `rm -rf vendor/sub` -> BLOCK.
   - `rm -rf repo` run from the parent folder -> BLOCK.
   - `rm -rf vendor` (holds `vendor/sub/.git`) -> ALLOW.
   - `rm -rf origin.git` (bare repo) -> ALLOW; main gives BLOCK.
   Verdict: gap, see finding 1.
6. probe C: cwd spelled in a different letter case (macOS).
   - Uppercased HOME with `rm -rf work` -> BLOCK.
   - Uppercased parent of HOME with `rm -rf home` -> BLOCK.
   - Uppercased repo with `rm -rf dist` -> ALLOW.
   - cwd `/tmp` (a link to <tmp>) with `rm -rf x` -> ALLOW.
   Verdict: OK.
7. probe D: different spellings of the pi agent folder.
   - `PI_CODING_AGENT_DIR=~/work/agent`, cwd work: `rm -rf agent` -> BLOCK, `rm -rf agent/extensions` -> BLOCK, `rm -rf repo/dist` -> ALLOW.
   - Trailing slash on the variable: `rm -rf agent` -> BLOCK.
   - Agent folder reached through a symlink: `rm -rf realagent` and `rm -rf realagent/sessions` -> BLOCK.
   - Variable in upper case: `rm -rf agent` -> BLOCK.
   Verdict: OK. piAgentDir expands `~` the same way pi's getAgentDir does.
8. probe E: mixed targets and unusual shapes, cwd repo.
   - These all give BLOCK: `rm -rf dist agentlink`, `rm -rf dist vendor/sub`, `rm -rfv dist .git`, `rm -rf dist ../repo-wt`, `"rm -rf dist\nrm -rf ../x"`, `RM -rf dist`, `rm -rf dist #`.
   - `rm -rf dist/` gives ALLOW.
   Verdict: OK. One bad target sends the whole command to the prompt.
9. probe F: tool name.
   - powershell tool with `rm -rf dist` -> BLOCK headless, and 1 dialog interactive.
   - Tool names `Bash` and `bash_exec` -> ALLOW. Main does the same: the handler at nana-gate.ts:283 returns early for any tool other than bash, powershell, edit or write.
   Verdict: OK, no change from main.
10. probe2: the same handler call on main and on the lane.
    - Floors and policy files give BLOCK on both: `rm -rf agent/auth.json` and `rm -f agent/auth.json` (agent folder set by the variable), `rm -rf agent`, and cwd agent with `rm -rf extensions`.
    - `rm -rf ../x` gives BLOCK on both.
    - `rm x` and `rm -f ../x` give ALLOW on both.
    - `rm -rf dist` gives BLOCK on main and ALLOW on the lane. That is the intended change.
    Verdict: OK. Nothing main does today stopped working.
11. Installed pi bash tool: `pi --version` gives 1.0.2. In `dist/core/tools/bash.js`, the input schema has only `command` and `timeout`. The tool spawns a new shell per call in `ctx?.cwd || cwd`. No per-call cwd argument can bypass the cwd the gate checks. Verdict: OK.
12. probe3: the module's own `inside`, `isFsRoot` and `hasDotPart` code, evaluated with Windows path rules.
    - Agent folder on another drive (`D:\pi\agent`) does not count as inside `C:\proj\build` -> false.
    - Case-folded containment `C:\Proj\AGENT\ext` inside `c:\proj\agent` -> true.
    - Sibling folder `agent-evil` -> false.
    - `C:\` and a network share root are filesystem roots -> true.
    - `\.pi\` counts as a dot-named part -> true.
    Verdict: OK. Native win32 was not run.
13. `gh run list --branch feat/gate-rm-workdir` and `gh run list --commit d6f0613`
    Output: no runs. Verdict: Windows is unverified, see finding 2.

FINDINGS
1. Known bug (not MUST). Two kinds of target now run with no prompt; main asked for both (probe 5):
   - a folder that holds a git repo one level or more down, e.g. `rm -rf vendor` where vendor/sub has a committed repo;
   - a bare repository, e.g. `rm -rf origin.git`.
   The plan lists the nested-repo case as known limit 4. The pack README limits leave out both cases, and the plan does not name the bare-repo target at all; it only covers a bare repo as the cwd. Fix by adding them to the README's Known limits text in <worktrees>/gate-rm-workdir/packages/nana-pack/README.md.
   This is not MUST because the deletion stays inside the working directory, which the owner's 2026-10-10 ruling allows.
2. Known bug, ladder status. The gate ladder in the plan requires Windows CI on the fix commit, and no CI run exists for d6f0613. Three things stay unproven until then: Node reporting a junction as a link, Git Bash behaviour, and the Windows path spellings.
3. Process residual. HANDOFF.md is unchanged from 4be0b79 to d6f0613. The plan says the seat must add one Open-for-the-owner line about plain `rm` and `rm -f` still passing outside the working directory. That line must land in the reviewed change before the final round.

No MUST findings:
- The floor, named policy files, extraPatterns and protectedPaths still stop an exempt-shaped command.
- The powershell tool and compound commands keep today's verdict.
- No test writes outside the temp folders.
- The lane makes no install or hook changes.

---

Seat note: the checker ran on d6f0613, build 1. Build 2 (0862220) added both targets of finding 1 to the pack README's known limits and changed no product code. CI run 39273742604 on c636e46 settles finding 2: the Windows leg passes the new test's 7 checks, its junction cases included. This lane's seat-notes commit adds the HANDOFF line finding 3 asks for. The seat's record is `seat-verify-c636e46.md`.
