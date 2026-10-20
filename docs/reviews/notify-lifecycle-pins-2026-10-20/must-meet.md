# notify-lifecycle-pins — must-meet

Feature: FEAT-023 · Inspect changes and receive useful notices

Sentence: when the agent settles with a UI (TUI or RPC), the pack starts osascript on macOS or a PowerShell toast on Windows, or writes one OSC 777 sequence in a Linux TUI, each with the body Ready for input; a run without a UI starts no notifier unless notify.headless is true and writes no escape code; each of the five session lifecycle events leaves one journal line with the session cwd and the process pid, and the start and shutdown lines carry pi's reason.

Class: ordinary. Two new test files and the requirement files; no extension, install, hook, gate, land or review code changes. One final reviewer; no install check.

Threat model: honest variation is in scope: the platform (macOS, Windows and Linux legs), the pi mode (tui, rpc, print, json), notify.headless (absent, false, true), and a notifier that succeeds or fails. Deliberate forgery is out.

## Design
- No real notifier starts. notify-dispatch swaps node:child_process `execFile` through `createRequire` plus `syncBuiltinESMExports` before it imports the extension (precedent: shared-link-state, fsops, doctor-fix-line) and fakes `process.platform` as notify-fallback does. lib/config.ts reads no platform, so the fake reaches only the dispatch. Every check runs on all three legs with no skip.
- The stand-in records `(file, args)` and calls back on `setImmediate`: a clean run, or an Error with `code: 1` for R-818.
- stdout is swapped only around the handler call and two `setImmediate` turns, and restored before any `check()`. notify-fallback's first block prints its own check lines into its capture; do not copy that.
- Contexts follow pi 1.0.2's bindings: interactive mode binds mode tui and rpc mode binds mode rpc, both with a UI (the desk runs rpc); print and json mode bind none, so `hasUI` is false and `ctx.ui` is pi's no-op UI object, not undefined. The no-UI fixture keeps a recording `ui` object for that reason.
- lifecycle-journal drives the five real handlers once each with a distinct pi reason per event, reads a temp `journal.path`, and filters lines by event name (loadConfig may add `config_*` lines).
- Both files: user-scope config under a temp HOME and USERPROFILE; `PI_CODING_AGENT_DIR` deleted.

## R-162 is wider than the code (verified)
pi 1.0.2's types give session_before_compact, session_compact and session_compact_failed a `reason` (manual, threshold, overflow). nana-lifecycle journals a reason only for start and shutdown; the probe read `undefined` on all three compaction lines. Split, as the 2026-10-04 EARS batches split rows: R-162 narrows to five lines with cwd and pid; R-2140 takes the start and shutdown reasons; R-2141 records compaction reasons as violated. Alternative for the seat: the three-line fix in nana-lifecycle.ts makes R-162 whole but turns this into an extension lane.

## Must-meet tests
| Row | Requirement (EARS) | Test (file::title) | Red on |
|---|---|---|---|
| R-162 (narrowed) | The lifecycle extension shall journal one line for each session_start, session_before_compact, session_compact, session_compact_failed and session_shutdown event, carrying the session cwd and the process pid. | `packages/nana-pack/tests/lifecycle-journal.test.mjs::journal: each of the five lifecycle events leaves one line with the session cwd and this pid` | W1–W5 |
| R-2140 (new) | WHEN pi emits session_start or session_shutdown, the lifecycle extension shall journal the event's reason on that event's line. | `packages/nana-pack/tests/lifecycle-journal.test.mjs::journal: the session_start and session_shutdown lines carry pi's reason` | W6, W7 |
| R-166 | WHEN the agent settles and waits for input, a working OS notifier shall be used. (unchanged) | `packages/nana-pack/tests/notify-dispatch.test.mjs::settle: with a UI, macOS starts osascript once with the Ready for input notification` | W8–W10, W16 |
| R-166 | same row | `packages/nana-pack/tests/notify-dispatch.test.mjs::settle: with a UI, Windows starts powershell.exe once with a Ready for input toast` | W10, W11, W16 |
| R-166 | same row | `packages/nana-pack/tests/notify-dispatch.test.mjs::settle: on Linux, the TUI gets one OSC 777 Ready for input sequence and no process starts` | W18 |
| R-173 | Headless notifications shall be opt-in via notify.headless. (unchanged) | `packages/nana-pack/tests/notify-dispatch.test.mjs::headless: a run without a UI starts the notifier only when notify.headless is true` | W8, W12, W13, W17 |
| R-818 | No terminal escape codes shall be written without an attached UI. (unchanged) | `packages/nana-pack/tests/notify-dispatch.test.mjs::headless: a run without a UI writes no escape code, even when the notifier fails` | W14, W15 |

R-2141 (new, violated, no test): WHEN pi emits session_before_compact, session_compact or session_compact_failed, the lifecycle extension shall journal the event's reason on that event's line. Evidence cell: `split from R-162 2026-10-20: pi 1.0.2 gives each compaction event a reason (manual, threshold or overflow), and the three compaction handlers in nana-lifecycle.ts journal none, though its header lists reason among each line's fields; the fix changes a pi extension, so it waits for an extension lane`.

These are pins: all seven checks pass on today's code. Red means the wrong code below, probed in a temp clone of main 31b95f34.

## Wrong code probed
Existing suites: lifecycle-reload and config-handlers-malformed for W1–W7, notify-fallback for W8–W18.

| Wrong code | New check red | Existing suite |
|---|---|---|
| W1 drop `pid` from the log line | R-162 | green |
| W2 drop the session_compact_failed line | R-162 | green |
| W3 `cwd: process.cwd()` | R-162 | green |
| W4 session_start logged twice | R-162 | green |
| W5 session_compact logged as session_before_compact | R-162 | green |
| W6 shutdown line without reason | R-2140 | green |
| W7 start reason fixed to "startup" | R-2140 | green |
| W8 darwin branch emptied | R-166 macOS, R-173 | green |
| W9 osascript title and body swapped | R-166 macOS | green |
| W10 darwin and win32 notifiers swapped | R-166 macOS and Windows | red |
| W11 toast built without the body text | R-166 Windows | green |
| W12 headless guard removed | R-173 | red by exit code only |
| W13 lib/config.ts default notify.headless true | R-173 | green |
| W14 fallback writes OSC 777 when there is no UI | R-818 | green |
| W15 OSC guard `ctx.mode !== "rpc"` | R-818 | red by exit code only |
| W16 headless guard keyed on `ctx.mode !== "tui"`, not hasUI | R-166 macOS and Windows (rpc case) | red by exit code only |
| W17 headless guard keyed on `!ctx.ui`, not hasUI | R-173 | red by exit code only |
| W18 Linux OSC 777 branch removed | R-166 Linux | red by exit code only |

Rails with the six rows applied (probed): trace exit 0 with 0 rows off EARS form; `npm run req:tree` then tree check 0; `npm run map` then map:check 0; readme:check 0; requirements-moved lists the six FEAT-023 rows with R-162 "text changed"; requirement-rows, requirements-trace, requirements-tree, requirements-unclaimed, line-endings and code-map tests pass.

## Known limits
- Inferred, unverified: the toast uses app id 'pi', which no Start-menu shortcut registers; current Windows may drop it with no error, so neither a toast nor the fallback appears. CI cannot see a toast. Owner check in a Windows PowerShell window: (1) `Get-StartApps | Where-Object AppID -eq 'pi'`; (2) run the extension's toast script with app id 'pi', noting toast, exit code and stderr; (3) repeat with the AppID `Get-StartApps *PowerShell*` lists; (4) let a pi TUI session settle and look for a toast and a notify_fallback line. A toast only in (3) names the app id; a fix lane follows.
- The pins prove the command line the extension builds, not that the OS shows anything.
- notify-fallback's R-642 "headless opt-in" check pairs mode tui with hasUI false, which pi 1.0.2 never binds, and asserts an OSC write that R-818's text forbids. An SDK host could bind that pair. Residual for HANDOFF.
- notify-fallback's four `prompt:` checks print into their own stdout capture, so a FAIL there shows no line; the run still exits non-zero (W12, W15–W18). R-173's and R-818's old notes name a hasUI guard on the OSC write that the code does not have; the cites replace them.
- pi emits ui_prompt_start only from a bound UI, so the R-173 check fires agent_settled only.