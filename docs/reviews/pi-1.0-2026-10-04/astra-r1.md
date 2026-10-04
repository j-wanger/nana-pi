# Review: `feat/pi-1.0` against `main`

Reviewed the full diff: `c0a7849..0ba4a2e`. No repository files changed.

## Findings, ranked

### 1. MUST — A malformed config’s prescribed fix cannot fix it

**Location:** `packages/nana-setup/lib/doctor.mjs:242–243`

Doctor tells users with an unparseable existing config to run `nana-setup install`. Install deliberately preserves that file.

**Executed evidence:** In a temporary home, wrote `{ bad`, called `diagnose()`, then `stepSubagentConfig()`:

```text
pi subagent config: fail
… run `nana-setup install` to seed it

remedy install step:
status: unchanged
detail: already present, left untouched

after: { bad
```

This leaves the migration loop open precisely where doctor is supposed to close it. Existing valid objects missing keys get useful manual-edit instructions; malformed files do not.

**Smallest fix:** Distinguish absent from present-but-invalid. Recommend install only for absence; otherwise name the file and instruct the owner to repair its JSON and required keys, preserving existing settings. Test the remedy, not merely `/unreadable/`.

### 2. MUST — JSON `null` crashes doctor instead of producing a failure row

**Location:** `packages/nana-setup/lib/doctor.mjs:244`

Parsing succeeds for `null`, then `subCfg.forceTopLevelAsync` throws.

**Executed evidence:** Temporary-home `diagnose()` with config containing `null`:

```text
null THREW Cannot read properties of null (reading 'forceTopLevelAsync')
```

Consequently doctor stops checking the rest of the machine. This contradicts the module’s declared wrong-kind-to-failure behavior and the intended config-floor diagnostic.

**Smallest fix:** Validate that the parsed value is a non-null, non-array object before accessing keys. Return a failure row with an actionable repair instruction. Add `null`, array and scalar cases.

### 3. MUST — Newly implemented rows overclaim their evidence and violate the one-`shall` rule

**Locations:** `REQUIREMENTS.md:812–814`; `packages/nana-setup/tests/doctor-detail.test.mjs:158–175`; `packages/nana-setup/tests/install.test.mjs:104–107`

- **R-362 has two `shall`s.** Its missing/unparseable tests assert only failure status and `/missing/` or `/unreadable/`; they do not assert the promised key or fix. Its unparseable remedy is actually ineffective—finding 1.
- **R-363 has two `shall`s.** “reviewer agent seeded when absent” checks only the first body marker through the implementation’s own `firstBodyLine()`. A file containing only the marker would pass without being the seed or a discoverable reviewer.
- **R-364 omits the existing absent-package test from its evidence citations.** Its cited version tests do not pin the absent-package clause.

**Smallest fix:** Give each row one `shall`, strengthen the missing evidence assertions, and cite the absent-package test. For reviewer seeding, compare the installed bytes with the complete seed; separately pin valid frontmatter/tools. Until corrected, R-362 and R-363 should not be represented as fully pinned.

### 4. SHOULD — “Every top-level launch is backgrounded and therefore gated” is broader than upstream guarantees

**Locations:** `packages/nana-pack/README.md:448–452`; `packages/nana-setup/pi/reviewer.seed.md:17–21`

The ordinary model-driven launch path does force async, but upstream retains an explicit foreground exception.

**Source evidence, pi-subagents 0.75.0:**

```js
// src/runs/background/top-level-async.js:1–4
if (params.foregroundOnly || !(depth === 0 && forceTopLevelAsync))
    return params;
```

`src/slash/delegation-adapters.js:170–189` constructs delegation execution parameters with:

```js
async: false,
foregroundOnly: true,
```

Furthermore, `src/runs/shared/child-tool-plan.js:271–273` disables ambient extensions when a capability ceiling denies them or an explicit `extensions` override exists. Background execution alone therefore does not prove nana-gate loaded.

**Smallest fix:** Narrow the prose to ordinary internal tool launches under the seeded configuration and default extension inheritance. Record the foreground-only delegation and explicit-extension exceptions. No runtime expansion is needed in this lane.

### 5. NOTE — Scope additions are reasonable, but require the landing ruler’s acknowledgment

**Locations:** `readme-check.config.json:50–57`; the three seat-modified test fixtures

The two new external-path declarations accurately identify generated user-scope resources. They do not exempt source files or broadly disable checking. **Technically approve this scope exception; Fable should explicitly ratify it**, because it was outside the worker allowlist.

The `desk-service`, `skills-and-standards` and `win32-degrade` changes only supply the newly required vendor manifest in throwaway homes. No assertions were deleted or relaxed. All three tests passed when executed. They remain fixture tests—not proof that the vendor package actually loads.

**Smallest fix:** Record the scope approval; no code change needed.

## Verification of the principal claims

### Reviewer discovery and shadowing: verified

Upstream source establishes:

- `src/shared/utils.js:80–88`: agent directory honors `PI_CODING_AGENT_DIR`.
- `src/agents/agents.js:2647,2668–2674`: scans `<agent dir>/agents`, alongside other user directories.
- `src/agents/agent-selection.js:1–20`: precedence is builtin → package → user → project.
- `src/agents/frontmatter.js:61–73`: frontmatter requires leading `---`.
- `src/agents/agents.js:1892–1895`: missing `name` or `description` skips the definition.

I ran the unpacked **0.75.0 discovery implementation** against a temporary agent directory containing the committed seed. The unpacked package lacked dependencies, so the successful run used a Node resolution hook supplying missing dependencies from the installed package; vendor source remained untouched.

Result:

```text
name: reviewer
description: Versatile review specialist for code diffs, plans, proposed solutions,
             codebase health, and PR/issue validation
source: user
tools: read, grep, find, ls, bash, watchdog_diff
systemPromptMode: replace
filePath: <temporary agent dir>/agents/reviewer.md
```

Prepending the marker before the frontmatter produced:

```text
marker at byte 0: builtin
tools: read, grep, find, ls, watchdog_diff, contact_supervisor
```

**The marker relocation is necessary and correct.** The seed shadows the builtin, not higher-priority project definitions or subsequent user overrides.

### `maxSubagentDepth: 1`: verified

`src/shared/types.js:174–200` defines parent depth as zero, child depth as parent + 1, and blocking as `depth >= maxDepth`.

Executed the upstream functions:

```text
parent { blocked: false, depth: 0, maxDepth: 1 }
child  { blocked: true,  depth: 1, maxDepth: 1 }
```

`src/runs/foreground/subagent-executor.js:6799–6812` applies this guard and returns:

```text
Nested subagent call blocked (depth=1, max=1).
```

The ruling’s most-likely-wrong claim is **correct**: parents can launch children; children cannot delegate further under this limit.

### Reviewer prompt and supervisor tool: coherent

`src/intercom/intercom-bridge.js:171–192` adds `contact_supervisor` to the agent’s tools when the bridge is active, then appends coordination instructions. The default bridge configuration uses `mode: "always"`.

Thus omitting the tool from frontmatter does **not** reliably remove it at runtime. Keeping body guidance restricting its use to genuine decisions is coherent and matches the ruling.

The opening ownership/gate paragraph really enters the child’s system prompt: discovery returned it in `systemPrompt`, and `src/runs/shared/child-launch.js:228–230` passes that prompt as a replacement. It is not merely documentation. The review persona still follows it; the main correction needed is the overbroad runtime assertion in finding 4.

### Seed-if-absent and existing user files

`stepSubagentConfig()` and `stepReviewerAgent()` use the existing `seedFile()` helper. `lib/fsops.mjs:114–130` preserves existing entries, including symlinks and directories.

Executed install tests confirmed:

- Both resources appear when absent.
- Existing config and reviewer bytes remain unchanged.
- Dry-run behavior remains intact.

An existing `{}` config receives a failure naming `forceTopLevelAsync` and instructing a manual fix. That closes the missing-key case without rewriting. The malformed-file case remains broken.

An unmarked user-owned reviewer receiving ✗ is **consistent with the explicit architecture contract**: doctor checks nana ownership, not equivalence of arbitrary custom reviewers. Install correctly preserves that file. The diagnostic should not be interpreted as proof that the user’s reviewer is functionally defective.

### Version location and absent-package behavior: verified

Doctor reads:

```text
<active agent dir>/npm/node_modules/pi-subagents/package.json
```

Pi 1.0.2’s `dist/core/package-manager.js:1738,1777` uses precisely that user-scope npm prefix and package location. Nana’s new paths derive from the existing active-agent-directory resolver.

Executed absent-package result:

```text
status: fail
label: pi pi-subagents
detail: not installed — fix: `pi install npm:pi-subagents@0.75.0`
```

The 0.64.0 rejection and 0.75.0 acceptance tests passed. Installation remains a deliberate operator action.

### MCP warning: verified

Pi 1.0.2 `dist/core/mcp-servers.js:112` defaults exposure to `"codemode"`; `dist/extensions/mcp/index.js:202,380,878` establishes default-on auto-enable and checks it before activating codemode.

Tests passed for omitted exposure, explicit direct exposure, `autoEnableCodemode:false`, and absent config.

## Requirement-by-requirement evidence audit

| Row | Clauses pinned by cited tests | Assessment |
|---|---|---|
| **R-360** | `subagent config seeded when absent`: installed JSON equals seed JSON. `existing subagent config.json byte-identical after install`: pre-existing content survives. | Behavior-based, adequately pinned for ordinary files. One `shall`. |
| **R-361** | `subagent seed: exactly the three keys and values`: exact key set and literal values, including depth 1. | Good independent contract assertion. One `shall`. |
| **R-362** | Missing/unparseable tests: failure status and broad error category only. False async/depth-2 tests: failure and relevant key. Byte-identical test: doctor does not rewrite wrong config. | Fix-text and missing/unparseable key promises unpinned; one remedy violated. Two `shall`s. |
| **R-363** | Seed test: marker only. Preservation test: existing bytes survive. Doctor tests: absent/unmarked produce failure. | Complete seed identity is unpinned; marker/parser helper mirrors implementation. Two `shall`s. |
| **R-364** | Floor test: literal 0.75.0. Old-version test: rejection plus install command. Floor-version test: acceptance. | Absent-package test exists and passes but must be cited. One `shall`. |
| **R-365** | Default-server test: warning names server and both keys. Direct-exposure test: acceptance. Additional uncited tests exercise auto-enable off and absence. | Behavior-based coverage. One `shall`. |

## Commands and acceptance status

- `pi --version` → **0.87.1**.
- Five changed setup test files executed individually → **all passed**.
- `npm run map:check` → **0 problems**.
- `npm run readme:check` → **5 missing-path problems**.
- `npm test` → **87 PASS, 1 FAIL, 1 SKIP; 5380 checks passed, 2 failed**. Sole failing file: `packages/nana-pack/tests/readme-check.test.mjs`.

The README failures concern absent `apps/bench/.ext`, `apps/bench/.ext/pi-web-access`, and knowledge-package `node_modules`. A clean archive of `main` reproduced these same missing-path failures, plus the archive’s absent `.git`. They are environment prerequisites, not regressions introduced by this diff.

**Not verified:** full suite on pi 1.0.2; live model reviewer self-service; live child gate interception; TUI responsiveness/fan-out; handoff mtime acceptance. Those remain the seat’s A1–A6 checks, not completed acceptance.

**VERDICT: BLOCK — 7/10.**
