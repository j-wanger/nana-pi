# adopt-closes-check — must-meet

Feature: FEAT-014 · Create or adopt a project workspace (row homed in SUB-021 · Check readiness and ratify the objective)
Class: ordinary. The lane changes the text of three pack skills, the pack README's two adopt rows and one test file. It touches no nana-setup install, uninstall, doctor or project code, and no hook, extension, gate, land or review tool. The adopt skills reach pi through the pack's package registration, so a pull delivers them; no install step.
Threat model: honest variation is in scope. That covers Python, TypeScript and structure-only adoptions, fresh and re-run adoptions, and CRLF skill text. It also covers macOS, Linux and Windows shells, including Windows, where `nana-setup` is not on PATH today. Deliberate forgery is out of scope.

Feature sentence: every adopt skill's last step runs the project check and calls the adoption ready only when the check exits 0. Otherwise the step reports every ✗ and ! line and runs a repair only with the owner's yes.

## Design
- adopt-py and adopt-ts gain step 10, "Close on the project check", after the commit step. In adopt-structure, step 8 becomes "Close on the project check, then report" and keeps its report list.
- The step runs `nana-setup project <dir> --check`, which writes nothing. Where `nana-setup` is not on PATH (Windows today: install skips that link on win32), the step runs the same check through node from the checkout. That form follows the AGENTS.md precedent for pi-worker and pi-review, so the lane waits on no other lane.
- The adoption is ready only on exit 0. Otherwise the agent reports every ✗ and ! line with the repair the check names.
- The agent runs a repair only with the owner's yes, so it never records trust on its own. adopt-py and adopt-ts commit any file a repair writes, by its own path.
- The project check itself does not change, which keeps the lane ordinary.
- The pack README's adopt rows say that each skill closes on the check.
- Split out by the adversary: the planned tree-checker line names the headings a lift left "Not yet sorted:". It is a different feature (FEAT-028), it runs at a different moment, and this closing step never runs it. It becomes its own lane, and its design and fixtures carry over unchanged.

## Must-meet tests
| Row | Requirement | Test (file::title) | Red today |
|---|---|---|---|
| R-1670 | The adopt-py, adopt-ts and adopt-structure skills shall each end with a step that runs `nana-setup project <dir> --check`, or its `node` form where `nana-setup` is not on PATH, calls the adoption ready only when the check exits 0, and otherwise reports every ✗ and ! line, running a repair only with the owner's yes. | `packages/nana-setup/tests/entry-guidance.test.mjs::R-1670: adopt-py, adopt-ts and adopt-structure each end on the project check, ready only on exit 0, repairs only with the owner's yes` | RED. The adversary ran this check against main's skills in a temp clone. It FAILED for all three skills, each missing all five parts. Today's last steps are "9. Commit", "9. Commit" and "8. Report". |

Probe evidence (temp clone, temp home):
- With the brief's step text, the new check passed. These checks were green:
  - entry-guidance: 14 PASS.
  - skill-claims: all passed.
  - project.test.mjs: 121 PASS.
  - templates-render: 168 PASS.
  - The trace had 0 rows off form; tree --check, map:check (after `npm run map`) and readme:check all exited 0.
- Each of these wrong-code variants turned the check red:
  - the closing step placed before the commit step;
  - adopt-structure left on a plain Report;
  - the owner's-yes sentence dropped;
  - the node form dropped.
- On a fresh Python adoption rendered from the clone, `project --check` exited 1. It printed ✗ for the month log (repair: `nana-setup project <dir>`) and ! for trust (repair: `nana-setup trust <dir>`).
- The test only reads text and checks that one file exists, so it runs on every platform with no skip.

## Known limits
- Every fresh adoption closes not ready. The month log reads ✗ until `nana-setup project <dir>` runs, and trust reads ! until the owner trusts the folder. This is honest and intended.
- adopt-structure copies the shared section without the nana markers, so its close also reads ! on the working region. It also reads ! on its empty post-edit list. Fixing step 4 belongs to a separate lane.
- The project check does not read the objective's DRAFT lines, so an unratified objective can still close ready. Teaching the check this would make the lane an install lane.
- The step is advisory skill text: nothing forces an agent to run it. The test pins the text, not the agent's behaviour.
- The node form assumes the checkout sits at `$HOME/nana-pi`, as AGENTS.md and the requirements skill already assume. Nobody has run it in a Windows pi session.
- The "First two steps" lists still name a bare `nana-setup trust <dir>`. That command fails on Windows until `nana-setup` is on PATH there. This lane leaves the lists alone.
- Until the split-out FEAT-028 lane lands, a lifted tree that nobody regrouped still passes the tree checker silently.