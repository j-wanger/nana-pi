# Architecture ruling — pi 1.0 adoption + subagent behaviour (2026-10-04)

Ruler: Fable (read-only; this file is the only write). Inputs: CLAUDE.md, `compat-audit.md`,
`subagent-diagnosis.md` incl. the seat addendum, Jake's ask, the ground-truth packages
(pi-coding-agent 1.0.2, pi-subagents 0.75.0, pi-mcp-adapter 5.0.0), `packages/nana-setup/lib/*`,
`REQUIREMENTS.md`. `[V]` = read by me; `[I]` = inferred, to be verified in acceptance.

Stakes: high-blast (every pi session on the machine), reversible (seed files + one package pin).

## 0. The frame, corrected

Jake's symptom has two causes and neither is a concurrency cap. [V] The one organic session was
already a background launch; the parent was occupied because the builtin `reviewer` has no shell and
its prompt tells it to ask the supervisor for `git`/test output (`agents/reviewer.md:4,57,65`). "Only
one child" was the model's choice under a one-child request — no cap was hit. So the fix is (i) make
background the floor so the foreground escape hatch is gone, (ii) give the review role its own
evidence shell and forbid evidence asks, (iii) match Claude Code's depth model. Spend caps are not
part of the fix.

## 1. Subagent behaviour

**1a. Config — three keys, not four.** Seed `<agent dir>/extensions/subagent/config.json` as:

```json
{ "asyncByDefault": true, "forceTopLevelAsync": true, "maxSubagentDepth": 1 }
```

- `forceTopLevelAsync: true` [V] 0.75.0 `docs/configuration.md:329-335`: forces depth-0 single,
  parallel and chain runs into background and bypasses launch UI. This is the one key that turns
  "model's choice" into a floor. Reason: it is the only mechanism that cannot be opted out of by a
  model passing `async:false`.
- `asyncByDefault: true` [V] already the default (`:221-227`). Kept because it is the only key that
  reaches a nested call whose `async` is omitted (forceTopLevelAsync does not), and an omitted-async
  nested child running background is the one that loads nana-gate. One line, zero risk.
- `maxSubagentDepth: 1` [V] `:472-478` (default 2). Reason: Claude Code's model is exactly this —
  a subagent cannot spawn subagents — AND it closes the only ungated path (see 1c) without a
  capability-ceiling extension. [I] that depth 1 means "the parent's children exist, children cannot
  fan out" — acceptance step A4 confirms.
- **Dropped: `maxActiveAsyncRunsPerSession: 6`, `maxSubagentSpawnsPerSession: 40`.** Subtraction
  test fails on both. [V] `:405-423`: active slots release only on "observed process-terminal proof";
  unknown proof RETAINS the slot; the abandoned-slot reclaim is 20 min and applies only to failed runs
  with a dead PID. [V] `:383-403`: spawn claims "are never released or refunded". Both introduce a
  session-blocking failure mode (leaked slots / exhausted budget → every launch refused until
  restart) to guard against runaway fan-out that no session on this machine has ever shown. Jake's
  complaint is the opposite of runaway. `globalConcurrencyLimit` 20 and per-call budgets remain.
  Changes my mind: one measured session where children fanned out beyond what was asked.
- **Leave unset:** `toolDescriptionMode` [V] `:103-110` — any explicit value drops the
  `promptSnippet`/`promptGuidelines` that carry the async/yield coaching. `intercomBridge` — default
  `always`; the reviewer fix below is a prompt rule, not a bridge switch (a bridge off would also
  silence genuine decision asks).

**1b. Review role — a nana-owned `reviewer.md` that shadows the builtin.** [V] `docs/agents.md:37`:
"Builtins load at the lowest priority, so a user or project agent with the same name overrides
them" — documented precedence, not a hack. Seed `<agent dir>/agents/reviewer.md` (if absent) from
`packages/nana-setup/pi/reviewer.seed.md`: the upstream reviewer persona and output format, with
`tools: read, grep, find, ls, bash, watchdog_diff` and three rule changes — run read-only evidence
commands (`git status/diff/show/log`, the project's test command) yourself; never ask the
supervisor for command output or file contents, a gap is reported in the final review under
"Could not verify"; `contact_supervisor` only for a genuine decision the task cannot settle.
Reason: a settings `agentOverrides.reviewer` can change `tools` [V] `:231` but the replaced prompt
still says "Do not use shell commands… Report any test command that a supervisor must run" — a
contradiction the model resolves by asking again; the fix must change the prompt, and a reviewed
markdown file in the repo is the honest place for a prompt. The shell is instructed-read-only, not
sandboxed: it is a leaf (depth 1) running under nana-gate in the runner process (1c) — say exactly
that in the file header. Changes my mind: upstream reviewer gaining an evidence shell → retire the
seed; or the pi-subagents bridge re-adding `contact_supervisor` and the model still asking despite
the rule → then `intercomBridge.mode: "off"`.

**1c. Nested-children gating — cap, do not accept.** [V] `docs/agents.md:457`: foreground children
never load ambient extensions (nana-gate absent); background children do. [V] `CHANGELOG` 0.65.0.
With `forceTopLevelAsync` every depth-0 child is background (gated), and with `maxSubagentDepth: 1`
no nested child exists, so no foreground child exists on a nana-setup machine. Record in the pack
README Known limits: a hand-edited config reopens it; the gate is advisory either way (CLAUDE.md).
[I] One adjacent contract to check, not to fix now: a background child is a second nana-pack
session in the SAME cwd — handoff store key `sha256(cwd)` and desktop notify are shared with the
parent. Short children do not compact, so the store is safe in practice; acceptance A6 checks the
store's mtime. Record as a Known-limits line; a `NANA_HANDOFF=off` for subagent children is a
follow-up if A6 ever moves.

**1d. Main-agent guidance — none now.** [V] the packaged skill (0.75.0 `SKILL.md:69-82`) already
says async by default, yield, let completions wake the parent. Adding repo prose for a behaviour
observed zero times organically fails the subtraction test. The 5-minute TUI run (A5 step 2) is the
measurement; if the model serialises three requested children, one line goes in the seat's user
`AGENTS.md`, not in nana-pi.

**1e. Version — 0.75.0, pinned: `npm:pi-subagents@0.75.0`.** [V] 0.75.0 CHANGELOG: "Background
subagents work on Pi 1.0.0 again. In 0.74.0 they failed to start" — so pi 1.0.2 adoption REQUIRES
≥ 0.75.0; this is a hard coupling, not a nice-to-have. [V] peer `pi-ai >= 0.86.1` is satisfied by
both 0.87.1 and 1.0.2. Pinned because the seeded keys and the gate analysis above are verified
against 0.75.0 only, and pi-subagents shipped two behaviour-changing breaks in one month (0.65
foreground extensions, 0.74 `workflowScript` removal); `pi update --extensions` on a floating entry
would move the floor under the seed. [V] `packages.md:38`: versioned npm specs are pinned; `:127`
pi identifies npm packages by name. [I] `pi install npm:pi-subagents@0.75.0` replaces rather than
duplicates the existing unpinned entry — the seat checks `settings.json` has one entry after.
Changes my mind: upstream declaring config keys semver-stable.

## 2. Ownership

nana-setup, seed-if-absent via the existing `seedFile()` (`lib/fsops.mjs:114`), exactly the
`stepPiConfig` pattern (`lib/steps.mjs:423-438`), two new seeds under `packages/nana-setup/pi/`.
Never merge keys into an existing file: [V] `seedFile` leaves a present file UNCHANGED, and that is
the policy (R-306, R-309). A user who already has `config.json` without the load-bearing keys gets
**doctor ✗ naming the key and the fix**, not a rewrite — same as `pi objective.projectFile` today.

Doctor reports ✗ on: `pi subagent config` — file missing or unparseable, or `forceTopLevelAsync`
not `true`, or `maxSubagentDepth` not `1` (`asyncByDefault` is default-true upstream; a user
setting it `false` reads `!`, not ✗); `pi reviewer agent` — `<agent dir>/agents/reviewer.md`
absent or missing the nana marker line (first line `<!-- nana-setup reviewer seed -->`); `pi
pi-subagents` — `<agent dir>/npm/node_modules/pi-subagents/package.json` absent or version
< 0.75.0, fix text `pi install npm:pi-subagents@0.75.0`. Doctor reports `!` on: `pi mcp.json` —
any server without an `exposure` key while `autoEnableCodemode` is not `false` (codemode will
auto-enable on connect, [V] `mcp.md:204,228`).

**install does NOT run `pi install npm:…`** — that is a network fetch plus third-party install
code, a new class of effect for an installer that today only links, seeds and registers a local
path; doctor names the command, the seat runs it. Changes my mind: the ✗ sitting unfixed for a week.

## 3. MCP — drop pi-mcp-adapter, use pi's built-in MCP

Subtraction test: one configured server (`memory`). The adapter is ~100 source modules whose
advantages ([V] README 19-60: lazy start across many servers, proxy-tool token savings, forms/UI,
semantic search) are for fleets of servers, not one. [V] adapter 5.0.0 `peerDependencies`
`pi-ai: ^0.84.1 || … || ^0.99.0` — pi 1.0.2 ships `pi-ai ^1.0.2`: the author has NOT declared
1.0 compatibility (comparison "as of Pi 0.99.2"); the audit live-tested only 2.32.1 under 1.0.2.
[V] 5.0.0 also writes `"-builtin:mcp"` into the user `settings.json` on first start — a
third-party package mutating a file nana-setup treats as user-owned. The built-in's one advantage
is the one we want: [V] `mcp.md:250` every MCP call goes through pi's `tool_call` pipeline as its
own tool (`mcp__memory__*`), so nana-gate sees the real tool name, not an `mcp` proxy.

Seat applies: `pi remove npm:pi-mcp-adapter`; in `~/.pi/agent/mcp.json` set `"exposure":
"direct"` on `memory` (tools declared like builtins, no codemode activation) and
`"autoEnableCodemode": false` beside `mcpServers` (one key; prevents a future `pi mcp add` from
silently enabling a QuickJS scripting tool); confirm `settings.json` has no `-builtin:mcp`
(currently none [V]). Residual, one line in `packages/nana-stage/README.md`: the MCP block path
(R-263) targets the adapter's `details.mcpResult.structuredContent.blocks` shape; blocks over
built-in MCP are not stamped. R-263 stays `implemented` (its WHERE clause is still true when the
adapter is present). Changes my mind: a second server with a large tool list, a server needing
elicitation/UI, or Jake measuring token cost on `memory`.

## 4. pi 1.0.2 adoption specifics

- **Global npm stays.** `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.0.2` (prior
  art d845c5f). [V] 1.0.1 CHANGELOG: `pi update` on npm installs "recommends migrating to the
  managed installation" — that moves pi out of `npm root -g`, which the desk (R-401), nana-setup
  and seven tests resolve through. The managed installer is a separate lane with `DESK_PI_ROOT`
  plumbing. Write "upgrade pi with npm, never `pi update`" into the nana-setup README.
- **No pi version floor in doctor.** Nothing in nana-pi needs a 1.0 API; the desk already carries
  its own import floor (`PI_MIN_VERSION` 0.84.4). The load-bearing floor is pi-subagents ≥ 0.75.0
  (§2). A second pi floor would be a duplicate tunable with a different meaning.
- **`npm root -g` tests: residual, not now.** It is seven, not six (add
  `apps/desk/test/spawn-and-persist.test.mjs`). After the global upgrade the suite runs against
  1.0.2 directly; the patch only serves a future scratch-install lane. One HANDOFF line.
- **TUI: leave upstream defaults** (fullscreen, revised `dark`). Jake's feel call; the revert is
  `"tuiMode": "regular"`. Pin nothing.

## 5. Requirements (installer block; next free id R-360)

| ID | Falsifiable sentence | Pin |
|---|---|---|
| R-360 | In the pi agent dir, extensions/subagent/config.json shall be seeded from the nana-setup seed only when absent and never rewritten afterwards. | `install.test.mjs::subagent config seeded when absent`, `::existing subagent config.json byte-identical after install` |
| R-361 | The subagent seed shall set exactly asyncByDefault true, forceTopLevelAsync true and maxSubagentDepth 1 and no other key. | `doctor-detail.test.mjs::subagent seed: exactly the three keys and values` (imports the seed; the sealed values live in the seed file only) |
| R-362 | doctor shall read ✗ on the subagent config line when the file is missing or unparseable or forceTopLevelAsync is not true or maxSubagentDepth is not 1, naming the key and the fix, and shall never rewrite the file. | `doctor-detail.test.mjs::subagent config: ${case} reads ✗ naming the key`, `::doctor leaves a wrong config.json byte-identical` |
| R-363 | In the pi agent dir, agents/reviewer.md shall be seeded from the nana-setup seed only when absent, and doctor shall read ✗ when it is absent or lacks the nana marker line. | `install.test.mjs::reviewer agent seeded when absent`, `::existing reviewer.md untouched`, `doctor-detail.test.mjs::reviewer agent: absent / unmarked reads ✗` |
| R-364 | doctor shall read ✗ when the installed pi-subagents package is absent or below 0.75.0, naming pi install npm:pi-subagents@0.75.0 as the fix. | `doctor-detail.test.mjs::pi-subagents 0.64.0 reads ✗ with the pin`, `::0.75.0 reads ✓`, `::PI_SUBAGENTS_FLOOR is 0.75.0` |
| R-365 | WHERE mcp.json exists, doctor shall read ! when any server has no exposure key while autoEnableCodemode is not false, naming both keys. | `doctor-detail.test.mjs::mcp.json: codemode-default server reads !`, `::direct exposure reads ✓` |

Existing rows: none change. R-409 (pi 0.86/0.87 entries), R-510 (pi version in fingerprint),
R-401/R-403 (desk resolution) hold under 1.0.2 per the audit. R-263 keeps its status; residual in
README (§3). Known-limits lines (pack README: foreground children ungated / shared cwd; nana-stage
README: adapter shape) are README claims, so `readme:check` must stay green.

## 6. Build scope (Sonnet worker)

**Allowlist** — `REQUIREMENTS.md` (rows R-360–R-365 only) ·
`packages/nana-setup/pi/subagent-config.seed.json` (new) · `packages/nana-setup/pi/reviewer.seed.md`
(new) · `packages/nana-setup/lib/paths.mjs` · `packages/nana-setup/lib/steps.mjs` ·
`packages/nana-setup/lib/doctor.mjs` · `packages/nana-setup/tests/install.test.mjs` ·
`packages/nana-setup/tests/doctor-detail.test.mjs` · `packages/nana-setup/README.md` ·
`packages/nana-pack/README.md` (Known limits only) · `packages/nana-stage/README.md` (one residual
line) · `HANDOFF.md` (frontier lines) · `docs/code-map.md` by `npm run map` only, never by hand.

**Order:** rows land `planned` → tests with `// req:` markers, red → code → rows flip
`implemented` with each cited test named → READMEs → `npm run map` → `npm test`, `npm run
map:check`, `npm run readme:check` green on the installed 0.87.1 (the seat re-runs on 1.0.2).
Tunables (`0.75.0` floor, the three seed values) defined once with provenance (this ruling, date)
and imported by name in tests.

**Must not touch:** `~/.pi`, `~/.claude`, `~/.pi/agent/mcp.json`, `settings.json`;
`packages/nana-pack/{extensions,lib,bin}`; `apps/desk`; the seven `npm root -g` tests;
`templates/`; `docs/sessions/` (seat's). No `pi install`, no `npm i -g`.

**Seat applies after landing:** `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.0.2`
· `pi remove npm:pi-mcp-adapter` · `pi install npm:pi-subagents@0.75.0` (then confirm ONE
pi-subagents entry in `settings.json`) · edit `mcp.json` per §3 · `node
packages/nana-setup/bin/nana-setup.mjs install` · `… doctor` exit 0 · restart the desk.

**Acceptance:**
- A1 `pi --version` → 1.0.2; `node -p "require('$HOME/.pi/agent/npm/node_modules/pi-subagents/package.json').version"` → 0.75.0; doctor exit 0; `npm test` green on 1.0.2 (baseline to diff: 88 PASS / 1 SKIP on 0.87.1 per the audit).
- A2 **gate live in a background child (mechanical):** in pi (nana-pi cwd), launch one `delegate` child with task "run `rm -rf /tmp/nana-gate-probe` and report the tool result verbatim". Then (i) `tail ~/.pi/agent/nana-journal.jsonl` shows a new `session_start` line, `cwd` = this repo, `pid` ≠ the TUI's pid, `ts` after the launch — nana-pack loaded in the runner process; (ii) the child's result quotes `nana-gate: … blocked (headless fail-closed)` [V] `nana-gate.ts:291` — the gate ran, not merely loaded. Both or fail.
- A3 **reviewer self-serves evidence:** "use a reviewer subagent to review the last commit". The child's result contains `git show`/`git diff` output it ran itself; `grep -c subagent_supervisor_request <session>.jsonl` = 0.
- A4 **depth:** launch a `delegate` whose task is to launch a subagent; result reports fan-out blocked at the depth cap (exact wording [I]).
- A5 **5-minute TUI:** "launch three background subagents to review three files in parallel; don't wait" → FleetView shows three, the `>` prompt returns, "what's 2+2?" is answered at once, completions arrive as notifications, `/subagents-fleet` lists three, `/subagents-stop <id>` stops one. If the model serialises → §1d one-line steer, not a config change.
- A6 **shared-cwd residual:** `stat -f %m ~/.pi/agent/handoffs/$(printf %s "$PWD" | shasum -a 256 | cut -c1-64).md` unchanged across A2–A5.

## The claim most likely wrong

That `maxSubagentDepth: 1` leaves depth-0 children launchable (not "no children at all") — the doc
says "controls nested delegation" and the default is 2, which reads as parent → child → grandchild;
if A4 shows children refused at depth 0, set it to 2 and record nested-foreground as the residual
instead.
