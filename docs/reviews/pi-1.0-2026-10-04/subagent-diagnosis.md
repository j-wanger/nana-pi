# Subagent concurrency diagnosis — lane C (2026-10-04)

## Summary

Nothing in pi-subagents' installed defaults technically forces foreground, one-at-a-time
execution — background (`async`) is already the default when a call omits it, concurrency
caps are generous (20 children) or unlimited, and the packaged skill already tells the model
"use async by default, yield, let Pi wake you on completion." The gap is that the model
retains full discretion: nothing on this machine *forces* background. The only two real
`subagent` tool invocations in every session file on this machine (1,023 `.jsonl` files
scanned) both pass `async:false` explicitly and launch one child at a time — exactly Jake's
symptom — and both are a scripted desk e2e test, not organic use; there is no evidence either
way for how the model behaves in casual delegation. The fix is a seeded
`~/.pi/agent/extensions/subagent/config.json` that sets `forceTopLevelAsync:true` (a hard
override the model cannot opt out of at the top level) plus two spend caps, owned by
`nana-setup` the same way it already owns `nana-pack.json`. A version bump (0.64.0 → 0.75.0)
fixes two known upstream bugs but introduces one real, named regression: foreground children
lose nana-gate coverage from 0.65.0 onward — mitigated, not eliminated, by forcing async.

## 1. Root cause — what the evidence actually shows

**[V]** No organic `subagent` tool call exists anywhere on this machine.
`grep -rl '"name":[ ]*"subagent"' ~/.pi/agent/sessions/` across all 1,023 `.jsonl` session
files returns exactly two files, both under a directory named
`--private-var-folders-...-desk-subagent-e2e-Qg4v5j--` — a scripted `apps/desk` e2e test
fixture, not a real work session. Zero files anywhere contain a `bg_wait` tool call, a
`/subagents-*` slash command, `runs.all(`, or `runs.run(` — i.e. the fan-out/async-wait
surface has never been exercised organically, win or lose.

**[V]** In the only two real invocations that exist
(`~/.pi/agent/sessions/--private-var-folders-lg-h9m6nvvd2_9d7s3hyjvdlqxr0000gn-T-desk-subagent-e2e-Qg4v5j--/2026-09-09T13-03-10-572Z_01a08643-e0ec-71c1-998a-ba261ac68e25.jsonl`,
entries 7 and 9), the model called the plain single-child form
`{ "agent": "delegate", "task": "...", "async": false }` twice, sequentially, never in
parallel, never via `workflowScript`/`runs.all`. This is the exact shape of Jake's complaint
— one subagent, blocking — but it comes from a deterministic test prompt ("subagent go"),
not from natural delegation language, so it proves the *shape is reachable*, not that it is
the model's normal habit.

**[V]** The installed extension's own defaults already favor background. Source
(`~/.pi/agent/npm/node_modules/pi-subagents`, v0.64.0):
- `src/extension/config.ts:233-234` — `resolveAsyncByDefault(config) { return config.asyncByDefault !== false; }` — `asyncByDefault` is `true` unless explicitly set `false`.
- `src/runs/foreground/subagent-executor.ts:4078` — `const requestedAsync = params.async ?? asyncByDefault;` — an **omitted** `async` resolves to background.
- `src/runs/foreground/subagent-executor.ts:6885` — `const runsForeground = dispatchParams.clarify === true || (dispatchParams.async ?? deps.asyncByDefault) !== true;` — foreground only happens when the model explicitly sets `async:false` (or the rare, model-opt-in `clarify:true`). Nothing defaults to foreground.
- `docs/configuration.md` (installed copy) — `globalConcurrencyLimit` defaults to `20`; `maxActiveAsyncRunsPerSession` and `maxSubagentSpawnsPerSession` are **unlimited** by default. Concurrency is not the constraint — nothing caps it low.
- `~/.pi/agent/extensions/subagent/config.json` is **absent** (confirmed by `ls`), so every one of the above is running on bare upstream defaults, not a misconfiguration on this machine.

**[V]** The packaged skill already coaches the model correctly, at the *installed* version.
`~/.pi/agent/npm/node_modules/pi-subagents/skills/pi-subagents/SKILL.md:53,58-59`:
> "Use async/background by default. Set `async:false` only when the parent must block... yield
> after launching... let Pi wake the parent on completion; ordinary async subagents already
> have native completion notifications, so do not call `bg_wait()` merely because a child is
> active."

**[V]** pi's own engine supports genuine simultaneous fan-out at the substrate level, independent
of pi-subagents: pi 1.0.2, `docs/extensions.md:123` — "Tool calls from one assistant message
can run in parallel." Nothing requires the model to batch calls this way; it is exactly as
optional as Claude Code's own "send one message with multiple tool uses" convention.

**[V]** The native wake/queue mechanism Jake wants (target behaviour 3) is a real pi primitive,
not something pi-subagents invents: pi 1.0.2 `dist/core/extensions/types.d.ts:330-335` —
`pi.sendMessage(message, { triggerTurn?, deliverAs?: "steer" | "followUp" | "nextTurn" })` and
`pi.sendUserMessage(content, { deliverAs?: "steer" | "followUp" })`. A completion delivered
while the parent is idle triggers a turn immediately; delivered while the parent is busy, it
queues as a follow-up. This is the channel the "native completion notification" the skill
refers to rides on.

**[I] inferred synthesis.** Given (a) technical defaults already favor background/concurrency,
(b) the packaged skill already coaches the model correctly, and (c) the only real evidence
shows the opposite behaviour reachable under a scripted prompt — the most defensible read is
that nothing is *structurally* broken, but nothing *guarantees* the target behaviour either:
the model is free to pass `async:false` or to launch children one tool-call at a time instead
of through `runs.all`, and at least once, under test conditions, it did exactly that. "Maybe a
config issue" (Jake's own words) is roughly right: there is no config that forces the correct
behaviour today, so the correct behaviour is probabilistic, not guaranteed. The fix below
converts the top-level case from "model's choice" to "hard default."

## 2. The minimal fix

### Config — exact proposed `~/.pi/agent/extensions/subagent/config.json`

```json
{
  "asyncByDefault": true,
  "forceTopLevelAsync": true,
  "maxActiveAsyncRunsPerSession": 6,
  "maxSubagentSpawnsPerSession": 40
}
```

| Key | Value | Reason |
|---|---|---|
| `asyncByDefault` | `true` | Already the upstream default (`src/extension/config.ts:233-234`); declared explicitly so a future upstream default flip can't silently change behaviour here — chosen, not measured. |
| `forceTopLevelAsync` | `true` | The one key that converts "model's choice" into a hard floor: "Forces depth-0 internal single, parallel, and chain runs into background mode and bypasses launch UI by forcing `clarify:false`" (0.75.0 `docs/configuration.md:329-335`, identical wording in the installed 0.64.0 copy). This is what closes the exact gap the two real test invocations exposed — a model can no longer launch a top-level child in foreground even if it tries. |
| `maxActiveAsyncRunsPerSession` | `6` | Default is **unlimited**. Caps concurrently-active background runs comfortably above "2-3 at once" (Jake's framing) as a circuit breaker against runaway fan-out — chosen, not measured. |
| `maxSubagentSpawnsPerSession` | `40` | Default is **unlimited**. Last-resort cap on cumulative children per session; high enough not to interfere with this repo's own multi-round review-ladder usage (`pi-review`, worker/reviewer lanes) — chosen, not measured. |

**Deliberately NOT set:**
- `toolDescriptionMode` — leave unset. **[V]** 0.75.0 `docs/configuration.md:109`: "Explicit
  `\"compact\"` uses the same description without that extra metadata; `\"full\"` adds
  workflow and management detail, also without split metadata." Both explicit values drop the
  `promptSnippet`/`promptGuidelines` metadata that carries the async/yield coaching quoted
  above in §1. Only the *unset* default ships that guidance. Setting this key — even to `"full"`
  for apparent completeness — would silently remove the exact coaching the fix depends on.
- `globalConcurrencyLimit` — leave at its default `20`. Already far above any real need; no
  observed problem it would solve.
- `completionBatch`, `fleetView`, `asyncWidget` — leave at their (enabled/true) defaults; they
  already deliver target behaviours (3) and (4) without any configuration.

### Version — upgrade pi-subagents `0.64.0` → `0.75.0`

**[V]** Peer requirement: 0.75.0 needs `@earendil-works/pi-ai >=0.86.1`
(`pi-subagents-0.75.0/package.json`). Installed `pi-coding-agent` is `0.87.1`.
**[I]** inferred compatible (0.87.1 is newer than the 0.86.1 floor) but the bundled `pi-ai`
version was not independently read — a one-command check before landing the upgrade.

**[V]** Fixes both bugs the 2026-09-04 research addendum flagged:
- Stuck async widget: 0.75.0 `src/runs/shared/async-status-projection.js:77` —
  `function terminalState(state) { return state === "complete" || ... || state === "partial" ||
  ... || state === "rejected"; }` — the RPC/widget-facing snapshot projection now treats
  `partial` and `rejected` as terminal (the addendum's complaint was specifically that this
  predicate omitted them). Changelog corroborates: `CHANGELOG.md:362` region
  (0.68.0, 2026-09-15) "Remove expired partial and rejected jobs from the widget while
  preserving live nested children."
- RPC model/token parity gap: 0.75.0 `src/runs/shared/async-status-projection.d.ts:73,80` now
  declares `modelThinking?: string` and `tokens?: number` on the activity node — the addendum's
  complaint was that the RPC snapshot "carries state/turnCount/toolCount/currentTool only."
  **[I]** exact landing version between 0.65 and 0.75 not pinned; confirmed present by 0.75.0.
- **[V] residual not fully fixed:** `src/runs/background/async-retention.js:27` —
  `const TERMINAL_STATES = new Set(["complete", "failed", "stopped", "rejected"]);` — this
  *different* module's terminal set still excludes `partial`, even in 0.75.0. The widget-level
  fix is real; whether a `partial`-ending run is fully retired from retention bookkeeping is
  not verified here. Flagged, not resolved.

**[V] Desk compatibility — safe to upgrade.** `apps/desk/public/app.js:812-822` parses the
`PI_SUBAGENT_ASYNC_JSON:` prefix generically — it never checks a `"kind"` field (0.75.0 renamed
its internal snapshot kind string from the dash form desk's own test fixture uses,
`apps/desk/test/subagent-render.e2e.mjs:55` `"pi-subagents-async-status"`, to
`"pi-subagents.async-status-snapshot"` per 0.75.0's
`src/runs/shared/async-status-projection.js:6` `ASYNC_STATUS_SNAPSHOT_KIND` — irrelevant
because desk never reads that field). Desk also already carries its **own** defensive
`SUB_TERMINAL` set (`apps/desk/public/app.js:820`) including `partial`/`rejected` plus a 60s
linger-then-self-clear, independent of the upstream bug. The upgrade makes desk's defence
redundant, not broken.

**[!] Breaking change to carry:** 0.74.0 removed `workflowScript`/`workflowScriptPath` entirely.
`CHANGELOG.md` (0.74.0, 2026-09-30): the tool now takes one `workflow` field — `workflow:true`
runs a fenced ` ```js workflow ``` ` code block written in the same reply, a path-like string
loads a script file, any other string runs a named resource; calls that still pass the old
fields fail outright. **[V]** `grep -rn "workflowScript" --include=*.ts --include=*.mjs
--include=*.json .` across the whole nana-pi repo (outside `research/`, `docs/`, and
`node_modules`) returns nothing — no nana-pi-authored code, skill, or saved schedule depends
on the old field name. Clean to upgrade; the acceptance procedure below uses the new syntax.

**[!] Regression to carry knowingly — see §3.**

## 3. Gate and cost findings

**[V] Background children ARE gated by default; foreground children are NOT, and this got
worse with the version bump.**

- `docs/agents.md:457` (0.75.0, and worded identically as far back as it's checked):
  "Local foreground children are sessions inside the parent Pi process and never load the
  parent's ambient extensions... Background children are sessions inside the detached runner
  process and load the ambient extensions unless the agent sets `extensions` or the capability
  ceiling denies extensions."
- `packages/nana-pack/extensions/nana-gate.ts:1-13` registers as a standard `tool_call`-hooking
  extension, loaded via `"packages": [".../nana-pack", ...]` in `~/.pi/agent/settings.json` —
  i.e. it is an *ambient* extension from pi-subagents' point of view.
- **Conclusion:** a **background** (`async:true`) subagent child inherits nana-gate by default
  today, and continues to after the upgrade — bash/edit/write still get gated inside it. A
  **foreground** (`async:false`) child does not, and the exposure got *worse* with the version
  bump: `CHANGELOG.md:558` (0.65.0, 2026-09-04) — "Foreground children no longer load ambient
  extensions." The installed 0.64.0's own docs (`docs/agents.md:217,409` in the installed copy)
  describe ambient extensions as inherited without a foreground/background split, so on *this
  machine today*, a foreground child plausibly still gets nana-gate; **after** upgrading to
  0.75.0, it will not.
- **This is the plain regression the fix must carry.** `forceTopLevelAsync:true` closes most of
  it — it eliminates foreground at depth 0, which is where the only observed real usage sits —
  but its own documentation is explicit that "nested calls keep their own inherited settings"
  (0.75.0 `docs/configuration.md:335`), so a nested foreground child is not forced and would run
  ungated after the upgrade. No config in this package closes that residual; only the model
  choosing async at every depth does. Recorded as an open question in §5, not solved here.

**Cost bound:** `maxActiveAsyncRunsPerSession:6` and `maxSubagentSpawnsPerSession:40` (above) are
the two caps that actually bind, since both are unlimited today. `globalConcurrencyLimit`
(default 20) and per-call `usageBudget`/`toolBudget` (call-time, model-set, per the tool
reference's own "Budget guidance for writers") are left alone — no observed problem justifies
adding machinery there.

## 4. Ownership — who writes and verifies this file

**Recommendation: (a) `nana-setup` owns it**, extending the exact pattern it already uses for
`~/.pi/agent/nana-pack.json` (`packages/nana-setup/lib/steps.mjs:423-438` `stepPiConfig` /
`readPiPackConfig`, and the matching `doctor` check at
`packages/nana-setup/lib/doctor.mjs:193-197`):

1. Add `layout.subagentConfig` resolved through the shared `packages/nana-pack/lib/agent-dir.mjs`
   resolver (the same one `layout.piPackConfig` already uses), pointing at
   `<agent dir>/extensions/subagent/config.json`.
2. Add a seed file `packages/nana-setup/pi/subagent-config.seed.json` holding exactly the JSON
   in §2.
3. Add `stepSubagentConfig(layout, o)` using the existing `seedFile()` helper
   (`packages/nana-setup/lib/steps.mjs`) — create-if-absent, **never** overwrite an existing
   file, same policy `stepPiConfig` already follows for `nana-pack.json` — wired into `install()`.
4. Add a `doctor` check mirroring `readPiPackConfig`/`add(cfg ? OK : FAIL, ...)` that reads the
   file back and reports on presence plus the `forceTopLevelAsync` / `maxActiveAsyncRunsPerSession`
   keys specifically (the two that actually change behaviour), never silently rewriting a file a
   user has since hand-edited.

**Why (a) over (b) nana-pack or (c) something else — the subtraction test:** this is
*configuration for a third-party vendor extension nana-pi only consumes*, not nana-pi's own
runtime behaviour — nana-pack is the pack of extensions nana-pi *authors*. `nana-setup` already
owns exactly this shape of problem (seed-once, doctor-verifies, never clobber a hand edit) for
`~/.pi/agent/settings.json` and `nana-pack.json`. Extending that to a third seeded file is the
smallest addition to a proven mechanism. The alternative — nana-pack reaching into a sibling
extension's config file at every session start — adds a new runtime code path, a new failure
mode, and no existing precedent, to solve a problem that only needs to be solved once, at
install time.

## 5. Model guidance (item 5)

**Already shipped, with one caveat.** The packaged skill (§1) already tells the model to
default to async and to yield rather than poll — present even in the currently-installed
0.64.0, unchanged in substance in 0.75.0. The caveat is the `toolDescriptionMode` trap in §2:
leaving the key unset is what keeps that guidance attached to the tool description at all. No
nana-pi-authored prompt addition is proposed on top of this — with only two (test-only) data
points on how the model actually behaves, adding repo-level prose to fix a problem not yet
observed in the wild would fail the subtraction test. If the acceptance procedure below (or
real dogfood) shows the model still choosing foreground/sequential despite
`forceTopLevelAsync:true` closing the technical gap, that would be the trigger to add a
one-line steer in this repo's own instructions — not before.

## 6. Acceptance procedure (under 5 minutes)

**TUI:**
1. Install the config from §2 (or hand-write the file at
   `~/.pi/agent/extensions/subagent/config.json`); restart pi or `/reload`.
2. In the TUI, ask: "Launch three background subagents right now to review three different
   files in this repo in parallel; don't wait for them." (If the model doesn't batch them,
   that's itself a finding for §5 — not a config failure, since `forceTopLevelAsync` still
   guarantees each individual launch is backgrounded.)
3. Confirm the under-editor async widget / FleetView shows three running entries, and that the
   model's turn ends (the `>` prompt returns) without waiting — target (1)+(2).
4. Immediately type an unrelated message ("what's 2+2?"); confirm it's answered right away —
   proof the main agent is free, target (2).
5. Wait for completions; confirm each arrives as a chat notification that wakes/continues the
   session (or a single batched notification, per the default `completionBatch`) — target (3).
   If a message was sent mid-flight in step 4's follow-up, confirm a later completion queues
   rather than interrupting it.
6. Open FleetView (default keybinding or `/subagents-fleet`); confirm all three are visible, and
   stop one mid-run (`/subagents-stop <run-id>` or `subagent({action:"stop", id})`) — target (4).

**Scriptable / RPC variant:** reuse `apps/desk`, which already renders `PI_SUBAGENT_ASYNC_JSON`
over RPC (`apps/desk/public/app.js:810-880`) — open a desk session, send the same prompt from
step 2, and watch the rendered async widget and chat panel instead of the TUI. This reuses
existing instrumentation rather than standing up a bespoke RPC client.

## Open questions

1. Whether the model Jake actually drives (`gpt-5.6-sol`, default per
   `~/.pi/agent/settings.json`) reliably batches fan-out or uses `runs.all` once
   `forceTopLevelAsync` removes the foreground escape hatch — unverified; only the acceptance
   procedure above will tell.
2. Bundled `pi-ai` version inside installed `pi-coding-agent@0.87.1` was not independently read
   against pi-subagents 0.75.0's `>=0.86.1` peer floor — a one-command check before the actual
   version bump lands.
3. `async-retention.js`'s own terminal-state set still excludes `partial` as of 0.75.0 — whether
   that causes any residual cleanup/retention gap distinct from the (fixed) widget-level bug is
   not traced here.
4. Nested (non-depth-0) foreground children remain ungated by nana-gate after the version bump,
   and `forceTopLevelAsync` explicitly does not reach them. No config in pi-subagents closes
   this; whether nana-pi wants a stronger guarantee (e.g. a capability ceiling denying
   foreground entirely) is a follow-up decision, not resolved here.
5. This diagnosis is built on two scripted test invocations and zero organic ones — the root
   cause section's synthesis in §1 is explicitly marked inferred for exactly that reason. The
   single highest-risk claim to re-check after landing: that `forceTopLevelAsync:true` alone is
   sufficient to produce Claude-Code-like felt behaviour, as opposed to merely guaranteeing the
   technical precondition for it.

## Seat addendum (2026-10-04) — the organic session the worker missed, and the real cause

**Correction [V]:** §1's claim that both files containing a `subagent` call sit under the desk e2e
directory is wrong. One of the two is a real work session:
`~/.pi/agent/sessions/--Users-jwang-basketball-geek--/2026-09-03T19-13-44-151Z_*.jsonl` (Jake,
"use a 5.6 sol subagent to do a proper review", pi-subagents 0.64.0 installed that day). Re-derived
with a per-call scan (`scratchpad/scan.mjs`: every assistant `toolCall` whose name contains
`subagent`, or a `bash` command launching `pi -p`/`pi-worker`/`pi-review`/`claude -p`): 35 calls in
the whole store; 10 in that session, the rest in the e2e fixture and a nana-agent-loop tmp run.

**What actually happened in that session [V]:**
- 19:38:11 — `subagent {agent:"reviewer", async:true, model:"openai-codex/gpt-5.6-sol:high"}` →
  "The async run is detached and running in the background." The launch WAS background; the parent
  got control back at 19:38:16.
- 19:39:45, 19:41:37, 19:45:01 — three `subagent_supervisor_request` messages from the child:
  "my toolset has no shell/Git/test runner … Please provide outputs of: `git status --short`,
  `git diff --stat HEAD~2..HEAD` … `uv run pytest`", then the numstat / `git diff -w`, then
  `git show -s --format=full`. Plus a `subagent_control_notice` ("reviewer is waiting for a supervisor
  reply"). Each one started a parent turn in which the MAIN agent ran the git/test commands and
  replied (`subagent_supervisor reply`, 19:40:20 → 19:45:24). For ~6 minutes the main agent was the
  child's shell operator.
- 19:47:36 — `subagent-notify` "Background task completed: reviewer" woke the parent, which summarised.
  The native completion path worked.
- Only one child was ever launched per request — the model chose one; no cap stopped more.

**Why [V]:** the builtin `reviewer` agent (unchanged in 0.75.0, `agents/reviewer.md:4`) has
`tools: read, grep, find, ls, watchdog_diff, contact_supervisor` and its prompt says (`:57`) "Do not
use shell commands … Report any test command that a supervisor must run", and (`:65`) "If … you are
blocked or need a decision, use `contact_supervisor` with `reason: "need_decision"` and wait for the
reply." A review that needs a diff or a test run therefore cannot finish without pulling the parent
in, repeatedly. That — not foreground mode — is the "occupies the main agent" Jake felt on this machine.

**Consequence for the fix:** `forceTopLevelAsync` alone would not have changed that session at all
(it was already async). The fix must also stop review children from needing the parent for evidence:
either give the review role its own read-only evidence tools, or forbid evidence requests to the
supervisor and have gaps reported in the final result. "Only one at a time" is a model-choice +
guidance question, not a cap.
