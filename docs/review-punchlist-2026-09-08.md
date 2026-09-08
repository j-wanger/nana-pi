# nana-pi pre-close review punch-list (2026-09-08)

Four independent **gpt-6-astra** reviews, one per angle: security & trust · extension
correctness & cross-platform · desk robustness · product coherence & docs.

**Confidence caveat:** items marked FIXED were seat-verified (tests load-bearing, renders
checked). OPEN items are **astra-reported, not all line-by-line seat-verified** — treat as
strong leads to confirm before fixing. This is a personal localhost tool: severities are
"if nana-pi is shared / used broadly," not "personal happy-path breaks today."

## Fixed this session (seat-verified) — commit 6803024 (+ 99f7438, faaf3c5)
- Starter stub shadowing (gate/handoff keys removed; postEdit-only; skip if user-scope commands exist).
- Canonical AGENTS.md: navigation corrected to pi's cwd+ancestors-only loading; gate-scope wording narrowed.
- post-edit feeds back on timeout/error status (trapped-timeout no longer silent to the model).
- Malformed config no longer crashes/blocks: compileRegexes non-array guard; post-edit skips non-string run / non-integer|negative timeoutMs (exec ERR_OUT_OF_RANGE).
- receipt test win32 guard; new gate-config-robustness test; pack README inventory.

## OPEN — Security (SEV-high first)
- **[high] Background title-derivation agents keep full `read/bash/edit/write`** with attacker-influenceable historical request text interpolated into the prompt → code-exec / exfil during a "metadata-only" op (`--no-extensions` removes the gate, not the tools). `apps/desk/server.mjs:~796`.
- **[high] nana-handoff follows symlinks in UNTRUSTED projects** — a committed `.pi/handoff.md` symlink reads e.g. an SSH key into the next prompt, then compaction overwrites the target. `nana-handoff.ts:~52,100`.
- **[high] stage.js chart-label → `innerHTML` XSS** — a label carried through a tool result executes with app-origin authority (read entries, submit prompts, answer dialogs). `apps/desk/public/stage/stage.js:~205`.
- **[high] DNS-rebind on GET reads** — no Host check; exposes `/api/settings` (MCP creds), transcripts, live events same-origin after rebinding. `server.mjs:~1071`.
- [med] context-file/agents saves + `.bak` follow destination symlinks (redirect writes outside project); global-vs-project resource mislabel lets a repo substitute a "global" package.

## OPEN — Desk robustness (SEV-high first)
- **[high] Malformed request URL crashes the server** — `new URL()` throws outside the async error boundary → unhandled rejection terminates Node. Also child stdout valid-JSON `null` crashes the event handler. `server.mjs:~1068,250`; `apps.mjs:~244`.
- **[high] Child stdin `EPIPE` crashes the server** — no stdin error listener; async EPIPE escapes the write try/catch. `server.mjs:~300,312`.
- **[high] `/api/transcript` ancestry has no cycle detection** — a self-referential `parentId` loops forever, wedging all HTTP + child-event processing. `server.mjs:~500`.
- **[high] Historical rename severs resumed context** — appended `session_info` with `parentId:null` makes pi treat it as the leaf → empty context on resume; title derivation takes this path too. `server.mjs:~843`.
- [med] teardown removes the child before confirming termination (orphans outside MAX_CHILDREN); config writes clobber on read-error→`{}` + swallowed backup failure; UTF-8 split across chunks corrupts prompts/signed blocks; unbounded SSE/RPC/data buffers (memory exhaustion); client races (session-switch paints wrong pane, SSE reconnect misses history, bash echo-before-fetch, dedup fails on expanded prompts); one malformed manifest aborts desk startup.

## OPEN — Extensions (SEV-high first)
- **[high] Timeout-ignore HANG** — a checker that ignores SIGTERM leaves `run()` pending forever (Node's exec doesn't escalate to SIGKILL); win32 doesn't tree-kill the checker's descendants. `nana-post-edit.ts`. (Fix: SIGKILL escalation after a grace window + tree-kill.)
- **[high] Formatter concurrent-write race** — post-edit formatters run outside pi's file-mutation queue; a read-modify-write can overwrite a newer edit. Receipt before/after detects some, prevents none.
- [med] **stage state loss on restart** (3 of 4 reviewers) — a new signing key per spawn redacts previously valid ledger blocks after any desk/child restart; post-edit path-resolution mismatch (raw `{file}` to shell + hashed differently than pi's normalized target); `$&`/`$'` in a filename corrupt the `replaceAll` substitution; stage JSON that passes validation throws in render; block size-cap doesn't bound model-facing output (~25MB from a padded table under the 64KB cap).

## OPEN — Coherence / docs
- [med] **Unchecking "Trust project" in the desk UI doesn't deny** (2 reviewers) — omits `approve` instead of sending `-na`; saved trust / `defaultProjectTrust:always` still loads project config. `app.js:~1902`.
- [med] adopt-ts "keep your linter" still installs the biome post-edit preset (biome rewrites files anyway); CI backstop doesn't enforce the advertised size caps (only post-edit does).
- [low] README TS prereqs omit `uv` (needed for `uvx copier`); PowerShell/cmd `&&` chains + the adopt-structure `sed`/unix-path fallback aren't native-shell safe.

## Design note (addressed in docs, decision open)
- Per-folder AGENTS.md load only when a session's cwd is in/below that folder (pi = cwd+ancestors, never descendants — verified in 0.84.4 `resource-loader.js`). Docs now carry the read-on-demand baseline + cwd-rooted-subagent option. Open: whether per-folder authoring earns its place, or guidance should push "start pi in the folder."

## Recommendation
The **desk security + crash cluster** is a real hardening pass, not a close-out patch — scope it as its own effort (the desk is a localhost control plane: spawn/bash/config over pi RPC). The extension high-sev items (timeout hang, formatter race) are smaller and closer to the just-landed evidence work.
