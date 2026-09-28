## Compatibility review

### C1. pi contracts consumed

- **Desk session parsing — unchanged:** `apps/desk/pi-session.mjs:54-58` imports the public root exports `parseSessionEntries`, `migrateSessionEntries`, and `CURRENT_SESSION_VERSION`; all remain exported in 0.87.1, and the session format remains version 3.
- **Desk CLI/RPC — unchanged:** `apps/desk/server.mjs:359-390` relies on `--mode rpc`, session/trust/tool/resource flags, strict JSONL, RPC responses, `extension_ui_request`, `queue_update`, and tool/lifecycle events. The commands it sends (`get_state`, session changes, prompt/steer/follow-up, bash, abort, naming, extension UI responses) remain documented in 0.87.1.
- **Desk session entries — changed and handled:** 0.86 adds persisted system-role messages and `usage`; 0.87 adds `context_edit`. The diff handles these in the transcript renderer.
- **Bench CLI/event stream — changed and handled:** `--mode json`, `message_end`, `agent_end`, `agent_settled`, retry/compaction/tool events, and JSONL framing remain unchanged. New cache-warm `entry_appended` usage is handled at `apps/bench/lib/usage.mjs:164-169`.
- **Bench imports — unchanged:** `ModelRuntime` from the coding-agent root and `calculateCost`/`Usage` fields from pi-ai’s root remain public. Usage field names used by `addUsage` are unchanged.
- **Pack extensions — unchanged:** `ExtensionAPI`, `tool_call`, `tool_result`, `session_start`, compaction events, `session_shutdown`, `before_agent_start`, `agent_settled`, `registerCommand`, `ctx.reload()`, `ctx.signal`, UI methods, trust/session context, and `withFileMutationQueue` remain available in 0.87.1.
- **Breaking changes not consumed:** no nana-pi use of `TranscriptContext`, custom-provider `streamSimple`, `context`, `context_with_system`, `shouldStopAfterTurn`, or `finishTurn` was found. `agent_settled` remains notification-only and is still the correct terminal marker.

### C2–C4. Versions, studies, and live service

- Leaving both `PI_MIN_VERSION` constants at 0.84.4 is reasonable: they are compatibility floors for unchanged exports, not the currently tested/pinned runtime.
- Keeping completed studies pinned to 0.84.4 is also correct scientifically. Editing an existing study’s pin would change its fingerprint and mix experiments. The bench should document that a 0.87 rerun means copying/amending into a new study, while reproducing the old study requires installing 0.84.4.
- Root `README.md:49,55` remains stale as already noted for the seat. `README.md:212` is explicitly historical (“at repo creation”), so it need not change.
- The running desk is temporarily hybrid: its in-memory parser is 0.84.4, while newly spawned children execute the replaced 0.87.1 binary. The old parser is permissive and still follows the parent chain, so no corruption or fatal parse failure is apparent, but it can expose the new entries as bare transcript rows until restart.

## Adversarial review

- Ran `node --experimental-strip-types apps/desk/test/pi-087-entries.test.mjs`: **11/11 passed**.
- The fixture is genuine `SessionManager`-serialized JSONL, not hand-written JSONL. However, the system message is supplied synthetically through generic `appendMessage`; usage/context edits use their canonical appenders.
- With the filtering line mentally removed, four checks fail: the three hidden-type checks and branch-equality-minus-hidden. Usage is tested both mid-branch and as leaf; `context_edit` is only mid-branch, and the system message is only near the branch root.
- Active-branch tracing is sound: `apps/desk/server.mjs:1094-1117` indexes every entry and chooses the final non-header entry as leaf before filtering rendered entries. A terminal `context_edit` therefore remains traceable.
- Cache-warm accounting does not double-count: pi’s warmer persists a standalone usage entry and does not emit that request as an assistant `message_end`. The six checks cover token/cost addition, diagnostics, nested separation, and rejection of a custom entry.
- The `subagent-render` failure has no plausible direct path from this diff: it uses a stub, `sessionFile:null`, and never reaches transcript parsing or a real cache warmer. A pre-existing `refreshStats`/resync ordering race is plausible.
- Stdin paths are safe:
  - desk RPC intentionally keeps stdin open;
  - desk one-shot print execution closes it at `apps/desk/server.mjs:1568`;
  - bench uses stdin `"ignore"` at `apps/bench/run.mjs:130`;
  - `pi-review` uses stdin `"ignore"` at `packages/nana-pack/bin/pi-review.mjs:100`;
  - nana-knowledge spawns Node, not pi.

## Findings

1. **HIGH — `research/pi-landscape-2026-09-01.md:363`** — The patch modifies `research/` despite the brief’s explicit `NOT: Do not touch research/`. The brief is internally contradictory because its facts/allowlist also request this addendum, but the prohibition is the stronger scope rule and the review brief explicitly treats this as forbidden. Resolve that contradiction or remove the hunk before landing.

2. **MEDIUM — `packages/nana-pack/README.md:5-8,59`** — The pack README was not updated to identify 0.87.1 as the tested host, and its only concrete compatibility statement still says “Verified against pi 0.84.4.” This was inside the worker’s allowlist and leaves the requested documentation pass incomplete. `apps/desk/README.md:65` also retains a current-looking 0.84.4 startup example.

3. **LOW — `apps/desk/server.mjs:1069-1074`; `apps/desk/README.md:510-516`** — “pi’s own TUI chat never renders” usage entries is too strong. In 0.87.1 the TUI renders `cache_warm` notices when `showCacheMissNotices` is enabled. The desk deliberately hides them unconditionally. Document this as default-TUI parity / a deliberate desk choice rather than exact TUI parity.

4. **LOW — `apps/desk/test/pi-087-entries.test.mjs:47-55`** — The regression test only proves `usage` works as the branch leaf. It does not test a leaf `context_edit` or system-role message, despite the broad “any of them can be pi’s leaf” claim. The implementation appears correct, but the claimed matrix is not fully pinned.

## Residuals to carry

- Add a documented “reproduce old pin vs fork/re-pin as a new study” path.
- Restart the live desk promptly after landing to end the 0.84-parser/0.87-child hybrid window.
- Root README updates remain with the seat.
- The one-off e2e timing flake remains unexplained but is not causally tied to this patch.

**VERDICT: BLOCK**
