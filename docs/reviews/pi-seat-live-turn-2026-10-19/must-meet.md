# Must-meet · pi-seat-live-turn

Feature: FEAT-015 · Diagnose the active environment
Lane subject: the install check runs one live pi seat turn.
Falsifiable sentence: after a fresh install, the install check prints FAIL unless one real pi print-mode turn in the fixture home shows the objective, rulings, writing and knowledge injections in the model request and nana-gate's block on a scripted bash call.

Class: ordinary.
- The lane changes the install check only. It changes no install, uninstall or doctor code, no Claude Code hook, no shipped pi extension, no gate policy and no land or review tool.
- The new fixture extension loads only through `-e` in the install check. It sits in no pi package manifest (R-1796).
- Precedent: readme-install and win-install-shape were ordinary lanes.
- The owner's 10-12 ruling still applies: the seat runs the install check on macOS before the land. The seat also reads CI's Windows install-check leg on the reviewed tip.

Threat model: in scope is honest variation in pi's output, the Windows launch, pi-subagents' output and runner speed. A forged record file or RPC stream is out.
Rows go in FEAT-015's own table, after R-1096.

## Design
- New `packages/nana-setup/lib/install-check-turn.mjs`: a pi extension with the six-tag header. Its default export is the pi entry point.
  - It imports `fauxProvider`, `fauxAssistantMessage`, `fauxToolCall` and `getCurrentSystemPrompt` from the ROOT `@earendil-works/pi-ai`. pi aliases that root to its own copy for every extension. The `/providers/faux` subpath does not resolve outside pi's package.
  - It registers the sealed provider and model.
  - Request 1: record the system prompt and the user-message texts, then call the sealed tool with `SAMPLE_INPUTS.verifier.bashHit`.
  - Request 2: record each tool result `{toolName, isError, text}`, then answer with plain text.
  - It writes the record as JSON to `<os.homedir()>/<PI_TURN.record>`.
- `install-check.mjs` runs the turn after `pi session`.
  - It launches through `piRun`, so win32 goes through findPi and winCommand.
  - It runs from the fixture project with the base environment and the sealed timeout. With no NANA_ROLE set, the owner's 10-09 knowledge ruling holds.
  - The spawn adapter already ends stdin, which pi -p needs.
  - One exported pure judge returns `{passed, code, detail}` from the record, stderr, exit status and token.
- `pi session`:
  - The spawn gets the sealed output cap.
  - One exported pure reader parses the JSON lines and skips non-JSON ones (a truncated tail, CRLF).
  - It returns the first `extension_error`, or the first extension UI request whose notify message, widget lines or status text holds the unavailable word in any letter case.
- `hook adoption`: the line also fails on a line that starts with STALE_PREFIX or STALE_UNAVAILABLE_PREFIX. Both are imported from stale-copies-config.mjs, never copied.
- Sealed in install-check-config.mjs, each with provenance:
  - PI_TURN: the item, fixture path, provider, model, argument list, tool name, record file, rulings heading, writing section tag, knowledge marker, gate block prefix and extension-error prefix;
  - SPAWN_TIMEOUT_MS.turn;
  - PI_SESSION: the unavailable word and the output cap.

## Must-meet (all in packages/nana-setup/tests/install-check.test.mjs)
| Row | Requirement | Test title | Red today |
|---|---|---|---|
| R-1790 | WHEN install has exited 0, the install check shall run one pi turn from the fixture project with the base environment, the sealed turn arguments followed by the sample prompt and the run token, and the sealed turn timeout, launched as the pi session is launched on each platform, and print one `pi turn` result line. | pi turn: one turn runs from the fixture project with the base environment, the sealed arguments, prompt, run token and timeout, through winCommand on win32, and prints one pi turn line | stub run of main: no `-p` spawn, no `pi turn` line |
| R-1791 | The install check shall report `pi turn` as PASS only when the turn exits 0 and its record shows the first request's system prompt holding the run token, the sealed rulings heading and the sealed writing section tag, and a user message that starts with the sealed knowledge marker and names the fixture note's file. | pi turn: a nonzero exit or a missing record, run token, rulings heading, writing section or knowledge message each fails the pi turn line, and a full record passes | no `pi turn` line |
| R-1792 | The install check shall report `pi turn` as PASS only when the turn's record holds a bash tool result marked as an error whose text starts with the sealed gate block text. | pi turn: a missing bash tool result, one not marked as an error, or one without the gate block text each fails the pi turn line | no `pi turn` line |
| R-1793 | IF the turn's stderr holds a line that starts with the sealed extension-error prefix, or its recorded system prompt holds the stale prefix or the stale-check unavailable prefix, THEN the install check shall report `pi turn` as FAIL naming the first such finding. | pi turn: an extension error on stderr or a stale line in the system prompt fails the pi turn line though every expected text is present | no `pi turn` line |
| R-1794 | IF the pi session's stdout, read up to the sealed session output cap, holds an `extension_error` event or an extension UI request whose notice, widget or status text holds the sealed unavailable word in any letter case, THEN the install check shall report `pi session` as FAIL naming that event. | pi session: an extension_error event or an unavailable notice, widget or status fails the pi session line though get_commands lists reload-runtime, and the session spawn carries the sealed output cap | stub run: PASS pi session for an extension_error line, an `objective unavailable:` notify and a roster-unavailable widget |
| R-1795 | IF the adoption hook's stdout holds a line that starts with the stale prefix or the stale-check unavailable prefix, THEN the install check shall report `hook adoption` as FAIL. | adoption: a stale line or a stale-check unavailable line fails though the output names the project | stub run: PASS hook adoption for both lines |
| R-1796 | The install-check fixture extension shall sit under packages/nana-setup at its sealed path, outside every extension directory that a pi package manifest in the checkout lists. | fixture: the turn's fixture extension sits under packages/nana-setup outside every pi package manifest's extension directories | the file is absent on main |

Pin (not must-meet): `pin R-1790 to R-1796: the turn's sealed fixture path, provider, model, arguments, tool, record file, timeout and expected texts, and the session's unavailable word and output cap`.

## Probes (macOS, pi 1.0.2, temporary home after nana-setup install, 2026-10-19)
1. A faux turn with `--offline -e <fixture> --provider --model --no-session -p` exited 0 in 0.66 s.
   - The record held the token, `## Standing rulings (nana)` and `<nana-writing>`.
   - The knowledge pointer was the second user message. It named ~/notes/docs/install-check.md, with --no-session.
   - The bash result had isError true and read `nana-gate: verifier pipe blocked (headless fail-closed): ...`.
2. A throwing handler wrote `Extension error (<path>): <msg>` on stderr, and pi still exited 0. A broken import in an extension made pi exit 1.
3. The planner's run with the rulings file removed: pi exited 0. The heading was gone and `RULINGS UNAVAILABLE:` was present, so the `<nana-rulings>` tag alone cannot judge the turn.
4. RPC session stdout:
   - With pi-subagents 0.75.0 it was 21,699 bytes. One widget event followed the 20,970-byte response, past the default 10,001-character cap.
   - No "unavailable" appeared anywhere.
   - Without pi-subagents it was 8,882 bytes.
5. A stub run of main's runInstallCheck gave the red-today results quoted in the table.

## Known limits
- The suite stubs pi and the record. The fixture's own scripting is proven only by real install-check runs: macOS locally, and CI on macOS and Windows. Linux runs no install check.
- Windows is inferred from pi's platform-independent alias map until CI's Windows leg runs. This fixture is the repo's first runtime import of a pi package.
- The knowledge pull has a 2 s budget. On a cold Windows runner, a slow pull would fail `pi turn` (inferred).
- Only the bash tool and the headless gate path run. The PowerShell tool and the UI confirm path do not.
- `<nana-writing>` is how pi 1.0.2 renders the section tag. If pi changes it, the line fails loudly.
- A non-nana notice holding the unavailable word also fails the session line.
- R-1794 and R-1795 may expose an existing Windows defect on the first CI run. If they do, record it; never loosen the check.
- If the gate fails to block, the turn runs the hit sample in the temporary fixture project.
