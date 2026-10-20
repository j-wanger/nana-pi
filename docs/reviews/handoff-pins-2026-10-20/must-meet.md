# handoff-pins: must-meet

Feature: FEAT-002 · Resume decisions and next actions

The feature in one sentence: on every CI leg, the pi seat's compaction handoff keeps eight promises that no tagged test names today. The store stays at ~/.pi/agent/handoffs when PI_CODING_AGENT_DIR points elsewhere. No .gitignore appears beside the store file. Only the exact lowercase off marks a non-writer. Any other value, or none, writes and picks up as normal. The injected body is the raw first 8000 UTF-16 code units, behind the provenance lines. A handoff.path shaped like .pi/handoff.md is refused in any letter case, and also when its parent folder links to a .pi folder. A handoff.path reached through a link is journaled and warned.

Class: ordinary. The lane changes tests, rows and the map. It changes no extension, install, hook, gate or land-tool code.

Threat model: honest variation is in scope. That covers macOS, Linux and Windows on Node 22, a marker typed in another case or with a stray space, and an absolute PI_CODING_AGENT_DIR. It also covers a handoff.path typed in upper case, or reached through a folder link or junction. Deliberate forgery is out, such as a link swapped between the check and the open. The symlink refusal is advisory by design.

## Design
- Pin, not change. Each check is new, with its title on the line directly under its `// req:` marker. Every check runs on every platform with no skip, because a junction needs no privilege. No title has quotes, backticks or pipes.
- R-830 goes in handoff-store block (b). R-244 goes in a new block in handoff-store. It copies the live user config into an absolute temp agent folder, then sets PI_CODING_AGENT_DIR to that folder. A finally block restores the variable's prior value.
- R-138 and R-807 go in handoff-writer-role, after the existing no-marker check. One loop runs over unset, on, OFF, Off, " off" and "off ". Each pass runs a compaction and then a fresh session. Two checks read the loop's results. NANA_HANDOFF is deleted before the pi-review spawn.
- R-189 goes in handoff-artifact. It first resets the user config so no handoff.path is set. It uses a fresh real-path temp folder and a fresh set of handlers. The body is a 12-unit prefix holding a tab and a newline, then 4500 astral characters: 9012 units. The cut at 8000 falls between two pairs, so a later fix that stops splitting pairs stays green.
- R-248 and R-880 go in handoff-trust, with the session cwd in another folder. That way the symlink refusal cannot stand in for the legacy refusal.
- R-245 goes in handoff-symlink. The journal is on, hasUI is true, and notify(message, level) calls are captured.
- R-880 and R-245 use a junction on win32 and a dir symlink elsewhere. Each link is unlinked in a finally block.
- Every row already exists, so R-2100 to R-2109 stay unused.
- Flipping these eight rows closes FEAT-002's last unready own rows. The product-report check "rejects solid ratings with unready own rows" stamps FEAT-002 from the live ledger, so it goes red (probed: 1 FAIL). Fix the fixture, not the check. In that block, set one FEAT-002 own row to untested in the fixture's own ledger copy, then commit before stamping. The planned-own-row block beside it already works this way. The fix adds no check and changes no marker.

## Must-meet
| Row | Requirement (verbatim) | Test (file::title) | Wrong code that reds it (probed) |
|---|---|---|---|
| R-244 | WHERE PI_CODING_AGENT_DIR is set, the handoff store shall stay ~/.pi/agent/handoffs. | `packages/nana-pack/tests/handoff-store.test.mjs::agent dir: with PI_CODING_AGENT_DIR set elsewhere, the summary is written to and picked up from ~/.pi/agent/handoffs, and no handoffs folder appears in the agent dir` | W5 |
| R-830 | No .gitignore shall be created beside the default store's handoff file. | `packages/nana-pack/tests/handoff-store.test.mjs::b: no .gitignore written beside the default store file` | W6 |
| R-138 | Only the exact lowercase value off shall be honored as the NANA_HANDOFF non-writer marker. | `packages/nana-pack/tests/handoff-writer-role.test.mjs::marker: OFF, Off and off with a leading or trailing space journal no handoff_skipped_role` | W1, W2, W2b, W3, W4 |
| R-807 | WHEN NANA_HANDOFF is unset, or set to a value other than the exact lowercase off, the session shall pick up and write the handoff exactly as it would with no marker at all. | `packages/nana-pack/tests/handoff-writer-role.test.mjs::marker: unset, on, OFF, Off and off with a leading or trailing space each write the summary and a fresh session picks it up` | W1, W2, W2b, W3, W4 |
| R-189 | The handoff summary body shall remain raw payload behind its provenance framing, capped at 8000 UTF-16 code units. | `packages/nana-pack/tests/handoff-artifact.test.mjs::cap: a 9012-unit body is injected raw as its first 8000 UTF-16 code units, after the Source and Provenance lines` | W7 to W12 |
| R-248 | The .pi/handoff.md refusal shall match case-insensitively. | `packages/nana-pack/tests/handoff-trust.test.mjs::case: a handoff.path ending .PI/HANDOFF.MD is never injected and never written, journaled as a legacy refusal` | W13, W14, W15 |
| R-880 | The .pi/handoff.md refusal shall still hold after resolving the parent's real path. | `packages/nana-pack/tests/handoff-trust.test.mjs::real path: a handoff.path whose parent is a link to a .pi folder is never injected and never written, journaled as a legacy refusal` | W16 |
| R-245 | A refused symlinked handoff.path shall journal handoff_symlink_refused and warn in the UI. | `packages/nana-pack/tests/handoff-symlink.test.mjs::g: a handoff.path reached through a linked folder journals handoff_symlink_refused and warns in the UI at pickup and at compaction` | W17 to W20 |

## Red today
Nothing is red today. This is a pin lane, and the code meets every row. The adversary drafted all eight checks in a temp clone of main 385c633f, with a temp HOME, on macOS with Node 22.22.2. All eight passed. Each wrong version was applied alone and then restored. Each one turned its own check red and left every existing check green in handoff-writer-role, -store, -artifact, -trust, -symlink, -staleness and -asks.
- W1: the marker test case-folds at both sites. W2: it trims at both sites. W2b: it trims at the write site only. W3: it case-folds at the write site only. W4: it case-folds at the pickup site only.
- W5: storeDir returns piAgentDir()/handoffs. W6: compaction writes a .gitignore beside the store file when no custom path is set.
- W7: INJECT_CAP is 9000. W8: INJECT_CAP is 7999. W9: the body is cut by code points. W10: the body goes through promptText. W11: there is no cap. W12: the raw file text is cut before parsing.
- W13: isLegacyShape drops both toLowerCase calls. W14: it drops the basename toLowerCase only. W15: it drops the parent toLowerCase only. W16: the realpath-of-the-parent fallback returns false.
- W17: no read-site handoff_symlink_refused. W18: no write-site handoff_symlink_refused. W19: no write-site warning. W20: the read-site warning is sent at level info.
- Product-report fixture: with the flips and no fixture fix, 1 FAIL. With the fix, 0 FAIL, with or without the flips. With the solid rule removed, both R-1024 checks are red.
- Native Windows and Linux runs are inferred. The PR's CI legs are the evidence.

## Known limits
- Found, not fixed: the cut can split a surrogate pair, which leaves a lone high surrogate in the prompt. R-189 does not forbid this. The fix is head() in lib/display.mjs, an extension change for a later lane. The seat records it as a HANDOFF residual.
- INJECT_CAP has no provenance comment beside it. The R-189 check pins it through the row's literal 8000. This is a residual for the extension's next lane.
- R-245 is pinned through a linked parent folder. The file-link case keeps its existing R-134 and R-806 checks.

## Conflicts
No in-flight lane touches these six test files or these eight rows. Every lane shares REQUIREMENTS.md, the tree and the map. Their REQUIREMENTS.md hunks sit outside the FEAT-002 lines, so regenerate the map and the tree after merging main. Within the slate, pack-config-agent-dir-pins must not take R-244 or handoff-store.test.mjs. config-advice-fixes may change lib/config.ts messages, and no check here asserts on them. The build waits for no lane.