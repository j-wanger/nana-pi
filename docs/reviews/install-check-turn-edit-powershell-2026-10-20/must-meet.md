# Must-meet · install-check-turn-edit-powershell

Feature: FEAT-015 · Diagnose the active environment
Falsifiable sentence: after a fresh install, the install check prints FAIL unless its live pi turn's write result carries the failure line of a configured failing post-edit check holding the run token. On Windows it also prints FAIL unless nana-gate blocks pi's powershell tool on the PowerShell verifier sample.

Class: ordinary.
- The lane changes the install check only: its library, config, test-only fixture extension, test file and README section. It changes no install, uninstall or doctor code, no Claude Code hook, no shipped extension, no gate policy and no land or review tool.
- The fixture loads only through `-e` and sits in no package manifest (R-1796). pi-seat-live-turn, which created it, was ordinary. The seat confirms, because a literal reading of "a pi extension" could reclassify the lane.
- The lane touches packages/nana-setup, so the seat runs the install check on macOS before nana-land and reads CI's Windows install-check leg on the reviewed tip.

Threat model: honest variation in pi's output, post-edit's failure-line text, the Windows shell and launch, Node install paths and runner speed is in scope. A forged record file or config is out.
Rows go in FEAT-015's table directly after R-1796.

## Design
- install-check-config.mjs gets two sealed exports directly after PI_TURN, provenance beside every value. PI_TURN stays byte-equal, so the R-1790 pin is untouched.
  - PI_TURN_EDIT: item `pi post-edit`; tool `write`; file `install-check-post-edit.txt`; match `install-check-post-edit\.txt$`; placeholder `{file}` and failure lead `- check ` (contract: nana-post-edit). Exit code 3, chosen because cmd's 1 and a shell's 126, 127 and 9009 read as could-not-run. Source `process.stdout.write(require('fs').readFileSync(process.argv[1],'utf8'));process.exitCode=<code>`, built from the code. The judged exit text `exited <code>` is built from the code too, never a second literal.
  - PI_TURN_POWERSHELL: item `pi powershell gate`; tool `powershell`; platforms `["win32"]`; tool list `["--tools","read,bash,edit,write,powershell"]` (contract: pi 1.0.2 cli.md and windows.md; the tool is off by default and --tools replaces the selection).
- install-check.mjs:
  - Under okay(install), after the objective and memory writes, read `<home>/.pi/agent/nana-pack.json`. Only when it parses as a plain object (not an array, not null), set `postEdit` to the old postEdit when that is a plain object, with `commands` replaced by the one command `"<process.execPath>" -e "<source>" <placeholder>`. Keep every other top-level key and write the file back. A missing, unparseable or non-object file stays as install left it, so doctor still judges install's file.
  - On the PowerShell platforms the tool list goes BEFORE PI_TURN's mapped arguments. R-1790's "sealed arguments followed by one prompt" still holds.
  - Two exported pure judges, judgePiPostEdit({record, token}) and judgePiPowerShell({record}). Each FAIL detail names the first missing condition. After `pi turn`, print `pi post-edit` on every platform, then `pi powershell gate` on the PowerShell platforms only. A timed-out turn reports `timeout` on both.
- install-check-turn.mjs: request 1 records as today, then returns ONE assistant message: the bash hit; a write of the sealed file whose content is the user message that starts with the sample prompt (else ""); and, only when `pi.getActiveTools()` holds the PowerShell tool, a powershell call with SAMPLE_INPUTS.verifier.powershellHit. Request 2 is unchanged.
- packages/nana-setup/README.md, Install check paragraph: the check sets one failing post-edit command in the temporary home's nana-pack.json; the scripted turn writes a file, and that check's failure line must reach the write result. On Windows the turn enables pi's powershell tool, and nana-gate must block the PowerShell sample. Drop "does not cover the PowerShell tool"; keep the UI confirmation exclusion.

## Must-meet (packages/nana-setup/tests/install-check.test.mjs, inserted directly after the `pin R-1790 to R-1796` check)
| Row | Requirement | Test title | Red today |
|---|---|---|---|
| R-2000 | WHEN install has exited 0 and the installed user-scope nana-pack.json parses as a JSON object, the install check shall, before the pi turn, set that file's post-edit commands to exactly one command whose match hits the sealed write file and whose run makes the running Node print that file and exit with the sealed exit code, keeping every other top-level key. | pi post-edit config: before the turn, the installed nana-pack.json keeps its other keys and holds one post-edit command that matches only the fixture file and, run as nana-post-edit runs it, makes the running node print the file and exit with the sealed code | Red: today nothing writes postEdit (grep of install-check.mjs on main; the planner's stub run on linux and win32 saw no postEdit at the turn spawn). |
| R-2001 | IF the installed user-scope nana-pack.json is missing or does not parse as a JSON object, THEN the install check shall leave it as install left it. | pi post-edit config: a missing, unparseable or non-object installed nana-pack.json is left as install left it | GREEN today: nothing writes the file. Wrong code: write the block unconditionally, or create a missing file. |
| R-2002 | WHEN the pi turn has run, the install check shall print one `pi post-edit` result line, which is PASS only when the turn's record holds a write tool result not marked as an error with a line that starts with the sealed post-edit failure lead and holds the exit text built from the sealed exit code and the run token. | pi post-edit: one line per run, PASS only when a write result not marked as an error holds a check line with the sealed exit text and the run token | Red: no `pi post-edit` line today. |
| R-2003 | The install check shall put the sealed tool list, which names the powershell tool, before the sealed turn arguments on win32 and on no other platform. | pi turn tools: on win32 the sealed tool list naming powershell comes before the sealed turn arguments, and linux and darwin carry no tool list | Red: the win32 turn arguments hold no `--tools` today. |
| R-2004 | The install check shall print one `pi powershell gate` result line on win32 and none on any other platform, PASS only when the turn's record holds a powershell tool result marked as an error whose text starts with the sealed gate block text. | pi powershell gate: win32 prints one line, PASS only when an errored powershell result starts with the gate block text, and linux and darwin print none | Red: no such line today. |

Pin (not must-meet): `pin R-2000 to R-2004: the post-edit item, tool, fixture file, match, placeholder, failure lead, check source and exit code, and the PowerShell item, tool, platforms and tool list`.
Cross-platform: no test skips. R-2000's test substitutes the placeholder as nana-post-edit does on the host, so the Windows suite leg runs the command through real cmd.exe with `"%NANA_PI_FILE%"`.

## Probes (pi 1.0.2, macOS, temp clone of main, temp HOME, 2026-10-20)
1. `nana-setup install` into a temp HOME seeded `{"objective":{"projectFile":"OBJECTIVE.md"}}`. After the designed merge, a real offline faux turn with the installed packages, pi-subagents 0.75.0 and the tool list exited 0 with empty stderr. Results in call order: bash gate block (isError); write `Successfully wrote to install-check-post-edit.txt` then `[nana-post-edit] 1 check(s) failed ...` then `- check "<node>" -e "..." "<abs>" exited 3: <prompt> <token>` (isError false); powershell `nana-gate: verifier pipe blocked (headless fail-closed): ...` (isError). Doctor then read `✓ pi nana-pack.json`.
2. Without the tool list, the active tools were read, bash, edit, write and pi-subagents' three; the fixture made no powershell call.
3. Without the gate, macOS pi answers a powershell call with `The powershell tool is only available on Windows.`
4. The composed command through spawnSync with shell:true and a quoted path: status 3, stdout equal to the file's text. Dropping the placeholder: status 1, empty stdout.

## Known limits
- The suite stubs pi and the record. The fixture's new calls are proven only by real install-check runs: the seat's on macOS, and CI's on macOS and Windows. Linux runs no install check.
- On Windows, the live write, the tool list through the pi.cmd shim and the gate on powershell stay inferred until CI's Windows install-check leg runs.
- On Windows the tool list replaces pi's selection, so pi-subagents' and MCP tools are off in that turn.
- macOS pi 1.0.2 also takes powershell in --tools and the gate fires there. The check runs it on Windows only, because pi documents the tool as Windows-only.
- Not covered: post-edit's silent pass, timeout, could-not-run and lock paths, and the UI confirm path.
- pi-worker sets NANA_WORKTREE_ROOT, and R-1071's override list keeps it. The gate's lane write boundary then blocks the fixture write and `pi post-edit` fails. Seat and CI runs do not set it.
- On macOS or Linux, a Node path holding `"`, `$` or a backtick breaks the command.
- R-1072's checklist test seeds no nana-pack.json, so its "writes only" title understates the new edit. R-2000's test covers that edit.
- A rewording of post-edit's failure line fails `pi post-edit` loudly.
- If the gate fails to block on Windows, the PowerShell sample runs inside the temporary project.
- The lane closes the PowerShell half of HANDOFF's pi-seat-live-turn residual. The approval dialog stays unchecked, and the seat edits HANDOFF.
