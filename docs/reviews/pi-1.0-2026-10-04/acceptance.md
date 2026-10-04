# pi 1.0 adoption — post-merge acceptance (land-ruling §8), 2026-10-04

Verdict: VERIFIED on pi 1.0.2, except two screen-only items that need Jake in the TUI.

| Check | Result | Evidence |
|---|---|---|
| A1 versions, doctor, suite | PASS | pi 1.0.2, pi-subagents 0.75.0 (one pinned entry), doctor exit 0 "all good". `npm test` on main: 89/89 files, 5492 checks, on 0.87.1 before the upgrade AND on 1.0.2 after it. |
| A2 gate live in a background child | PASS, both halves | Journal: new `session_start` at 07:05:39, pid 17127, parent pid 17061, cwd nana-pi. The child's result: "nana-gate: dangerous command blocked (headless fail-closed): rm recursive/forced". `acceptance-a2.txt`. |
| A3 reviewer gathers its own evidence | PASS | The child ran `git status`, `git show`, `git diff` itself (run d8c68e12 events). `subagent_supervisor_request` in the parent session: 0. `acceptance-a3.txt`. |
| A4 depth | PARTIAL | Depth-0 launch works live (A2, A3, A5), which was the ruling's most-likely-wrong claim. A nested launch cannot be shown live, because no builtin agent carries the `subagent` tool. astra r1 proved the refusal by executing upstream code. `acceptance-a4.txt`. |
| A5 parallel, main agent free | PASS (scripted, RPC) | Three reviewers launched at 16.8 s as one workflow. The main turn ended at 18.2 s. "What is 2+2?" was answered at 19.4 s while all three ran. The children reported back at 46.7 s, 63.8 s and 64.8 s, and the main agent woke at 64.9 s. The driver's two TIMEOUT lines are a driver counting error (one workflow notice, not three task notices). `acceptance-a5.txt`. |
| A5 screen parts | NOT RUN | FleetView and `/subagents-stop` exist only in the TUI. That is Jake's five-minute check. |
| A6 handoff store | PASS | `~/.pi/agent/handoffs` absent before and after A2–A5. |

Found during acceptance:
- **The edge desk app loads pi-mcp-adapter by path** (`~/.pi/agent/apps/edge.json`), and nana-stage reads the adapter's result shape. Removing the adapter at user scope broke that app. Restored without re-registering it for every session: adapter 2.32.1 installed into `~/.pi/agent/apps/vendor/` and `edge.json` repointed (backup beside it). An RPC smoke load in `~/edge-screener` on pi 1.0.2 succeeded, with only the expected built-in MCP warning. The audit and both rulings missed this consumer.
- **Three reviewer findings in nana-setup, UNVERIFIED** (one model each, from A5): `project-key.mjs:50-56` readlinkSync can throw past the no-error contract; `paths.mjs:84` `--home "$HOME"` sets isRealHome; `fsops.mjs:142-150` writeIfChanged writes through a symlink. Candidates for a lane, not facts.
