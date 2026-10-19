# adopt-structure-markers — must-meet

Feature: FEAT-014 · Create or adopt a project workspace (SUB-018 · Adopt or update shared working structure)
Class: ordinary. The lane changes skill text, one test file, the ledger and the generated maps. It touches no install, hook, gate, land or review tool, so it gets one final reviewer.
Threat model: in scope is an agent that follows the skill honestly, from either seat, on macOS, Linux or Windows, typing the fallback into bash, zsh, PowerShell or cmd. Honest changes over time to the shared file's text and to the template render are also in scope. A hand-forged or misspelt marker is out of scope.

## Feature, falsifiable
An agent that follows adopt-structure step 4, from the canonical shared file or from the throwaway-render fallback, leaves the root AGENTS.md with exactly one marked working region. `nana-setup project <dir> --check` reads that region as ✓, and a later `nana-setup project <dir>` refreshes it.

## Why (probed on main 22ccd849)
- Step 4 copies the shared file verbatim with no markers. The close then reads `! AGENTS.md working region  markers absent or malformed`.
- `project` skips that region, so the project never takes a later shared change. The shared file's own last line already speaks of "this marker region".
- The fallback `node -e` slices from the `## Working under nana-pi` heading to the end of the file. It drops the begin marker but keeps the end marker and anything the render puts after it.

## Design
- Step 4 keeps "VERBATIM", the four `../../../../templates/_shared/` mentions and the R-591 sentence ("Only when this canonical path is absent on disk may you render a throwaway scaffold").
- Step 4 gains a three-line ```markdown fence: the begin marker, one placeholder line for the shared file's contents, and the end marker. No blank line goes inside it.
- The prose tells the agent to write the lines inside the fence, not the fence itself, because the check ignores markers inside a fence. It also says the markers let `nana-setup project <dir>` refresh the section and let `--check` read ✓.
- Re-adoption: an unmarked copy runs from its `## Working under nana-pi` heading through the last line that came from the shared file. The agent replaces that copy with the marked block and never adds a second copy. The project's own lines after it stay below the end marker. When the end is unclear, the agent asks the owner.
- When the markers are already there, the agent replaces only the lines between them. Projects adopted before the markers existed are fixed the same way.
- Fallback: both `node -e` lines print from the start of the begin-marker line through the end of the end-marker line, and nothing after it.
- The search strings are `'nana:working-under-nana-pi begin'` and `'nana:working-under-nana-pi end'`, never `'<!--…'`, because interactive bash expands `!-` as history (probed: `event not found`).
- Outside the readFileSync argument, the JS carries no `$`, backtick, `%` or `"`, no `!` except before `=`, and no backslash except in `\n`. Every listed shell then hands node the same text.
- The tests go in `packages/nana-setup/tests/entry-guidance.test.mjs`, which already pins the adopt skills' close (R-1670). They import WORKING_BEGIN, WORKING_END and agentsStub by name from `packages/nana-setup/lib/project.mjs`. No marker literal appears in the test.
- The lane changes no project.mjs, template, shared file, skill-claims or README. The only extracted skill claim that changes is the `node -e` line, which skill-claims leaves unjudged (probed by diffing the extracted claims).

## Must-meet
| Row | Requirement | Test (packages/nana-setup/tests/entry-guidance.test.mjs::) | Red today |
|---|---|---|---|
| R-1780 | WHEN an agent copies the shared working file into the root AGENTS.md inside adopt-structure step 4's marker block, `nana-setup project <dir> --check` shall read ✓ for the AGENTS.md working region. | adopt-structure step 4 marked block passes the working region project check | prototype FAIL: step 4 has no markdown fence |
| R-1781 | IF the root AGENTS.md already holds an unmarked copy of the working section, THEN adopt-structure step 4 shall direct the agent to replace that copy with the marked block and never add a second copy. | adopt-structure step 4 replaces an unmarked working section instead of adding a second copy | prototype FAIL: neither phrase is in step 4 |
| R-1782 | WHEN the canonical shared path is absent on disk, each adopt-structure step 4 fallback command, typed in its own shell, shall print only the rendered marked block, from its begin marker line through its end marker line. | adopt-structure fallback commands print only the marked working block | prototype FAIL: both lines print from the heading to the end of the file |

Test shapes (normalise CRLF to LF first; use one temp root and remove it before exit):
- R-1780:
  1. Step 4 is the text from `\n4. **` to `\n5. **`. Find its ```markdown fence and de-indent it by the fence's own indent.
  2. The fence's first and last lines must equal WORKING_BEGIN and WORKING_END, with exactly one other non-blank line.
  3. Replace that line with the shared file's text and keep any blank lines. Put `# demo` on top and write the result as AGENTS.md in a temp folder (no git needed).
  4. Spawn `nana-setup project <dir> --check --home <temp>`. The test passes only when the working-region line starts with ✓.
- R-1781: step 4, with whitespace collapsed, includes "replace that copy with the marked block" and "never add a second copy".
- R-1782:
  1. Find every `node -e "…"` line in step 4. Exactly two are expected: bash and PowerShell.
  2. For each, take out the readFileSync path argument. The rest must hold no `$`, backtick, `%` or `"`, no `!` that is not followed by `=`, and no backslash that is not followed by `n`.
  3. Swap the argument for JSON.stringify(fixture). The fixture is `agentsStub("demo")` plus a trailing `## …` section and one project line.
  4. Run the line with node. Its stdout must equal WORKING_BEGIN + "\n" + shared + WORKING_END + "\n".
  5. No platform skips it, because the assertion in step 2 keeps the JS shell-neutral.

## Evidence (temp clone of main 22ccd849)
- All three prototype tests FAIL on today's skill and PASS with a candidate step-4 edit.
- Each wrong-code case turned its test red:
  - blank line under the begin marker: R-1780 (`✗ differs`)
  - misspelt end marker: R-1780
  - `'<!--'` search string in the bash line: R-1782 (shell-special `!`)
  - `\\n` in the bash line: R-1782
  - the plan-v1 slice from the begin line to the end of the file: R-1782 (trailing section printed)
  - "never add a second copy" removed: R-1781
- The candidate bash line printed bytes identical to the expected block under bash -c, bash -i -c, zsh -c and zsh -i -c. Interactive bash reading `"x<!--y"` says `event not found`, while `"a!==b"` runs fine.
- CLI on main: an unmarked copy reads `!`. The exact marked block reads `✓ matches shared section`. A blank line after the begin marker or before the end marker reads `✗ differs`.
- With the candidate, entry-guidance and skill-claims pass. The R-591, R-929 and R-592 skill pins pass when evaluated directly; project.test.mjs stopped earlier, at its pi trust-store import, under the probe's temp HOME. The trace reads `ears: 0 rows off form` with the three rows added.

## Known limits (residuals)
- Projects adopted without markers keep reading ! until they are re-adopted or wrapped once. The skill says how, and there is no automatic migration.
- `--check` does not see an unmarked duplicate left beside the marked block. R-1781 pins only the wording.
- An agent that also copies the fence lines gets `!`, because markers inside a fence do not count. Only the prose guards against this.
- The PowerShell and cmd lines were not run in those shells, since this machine has no PowerShell. Their sameness rests on the character assertion.
- No test here covers a refresh after a shared-file change; R-986 covers that. R-1782's fixture is agentsStub, not a copier render, and templates-render owns the render.
- Out of scope: the empty post-edit list `!` at the same close, and step 8's "where nana-setup is not on PATH, as on Windows" wording, which win-path-commands may make stale.
- The tests read the skill's text. They cannot prove that an agent obeys it.