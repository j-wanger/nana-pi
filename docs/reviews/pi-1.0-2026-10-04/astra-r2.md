# Round 2 review — `feat/pi-1.0`

Reviewed `0ba4a2e..1c4a369` as new code and rechecked the round-1 findings. No worktree files changed.

## Findings, ranked

### 1. MUST — The requirements/evidence fix remains incomplete

**Locations:** `REQUIREMENTS.md:815–820`; `packages/nana-setup/tests/doctor-detail.test.mjs:167–192,246–250`

Three newly split rows still contain **two `shall`s**:

```text
R-366: 2
R-367: 2
R-368: 2
```

Additionally:

- **R-366:** tests promise to pin the named file but never assert that its path appears.
- **R-369:** the byte snapshot is taken **after the helper’s first `diagnose()` call**. A first-call rewrite can escape detection.
- **R-371:** only an entirely absent marker is tested. A marker elsewhere in the body is not distinguished from the required first-body-line position.

**Executed mutation evidence:** In a disposable archive, changed doctor to:

1. Remove the config path from repair diagnostics.
2. Accept the reviewer marker anywhere in the file.
3. Rewrite every present subagent config to a fixed object.

Then ran its unchanged `doctor-detail.test.mjs`:

```text
PASS doctor leaves a wrong config.json byte-identical
ALL PASS
```

These are concrete unpinned clauses, not merely missing edge-case coverage.

**Smallest fix:** Give R-366–R-368 one `shall` each; assert the actual config path; capture original bytes before the first diagnosis; add a misplaced-marker case. Until then, the affected clauses should not be represented as fully pinned.

### 2. SHOULD — The README correction leaves one overclaim and introduces an unsupported command example

**Locations:** `packages/nana-setup/README.md:43`; `packages/nana-pack/README.md:459–463`

The installer table still says `forceTopLevelAsync` forces **“every top-level subagent launch”** into the gated background runner.

The new Known-limits paragraph names **`/delegate` and similar slash commands** as the foreground exception. The cited source establishes a **structured delegation bridge**, not that command:

- `src/slash/delegation-adapters.js:170–189` sets `foregroundOnly:true`.
- Its caller, `src/slash/prompt-template-bridge.js:144–176`, handles structured delegation requests.
- The package’s command registrations contain no `/delegate`. Its `/run` implementation builds a different launch request (`src/slash/slash-commands.js:598–643`).

Executed upstream override:

```text
ordinary async:false       → async:true, clarify:false
foregroundOnly:true        → async:false, foregroundOnly:true
```

The exception is real; its newly documented entry point is inaccurate.

**Smallest fix:** Narrow the installer-table claim too. Describe the exception as the structured delegation bridge’s `foregroundOnly` path; name a slash command only after tracing it to that path.

### 3. SHOULD — Invalid MCP server entries receive a green diagnosis

**Location:** `packages/nana-setup/lib/doctor.mjs:351–365`

The new guards reject invalid top-level and `mcpServers` shapes, but silently exclude invalid server entries from consideration.

**Executed results**, for each of `null`, `[]`, `42`, `"x"` and `false`:

| Position | Doctor result |
|---|---|
| Whole `mcp.json` | `fail` |
| `mcpServers` | `fail` |
| `mcpServers.memory` | **`ok`** |

Pi 1.0.2’s actual `validateMcpServerConfig("memory", value)` rejects all five:

```text
server "memory" must be an object
```

This does not create a codemode bypass—the invalid server cannot load—but the green row is misleading beside the new shape diagnostics. The added test deliberately pins skipping an invalid entry.

**Smallest fix:** Report malformed server entries by name before checking exposure, and replace the skip assertion with failure assertions.

### 4. NOTE — Scope ratification remains a landing-owner action

**Locations:** `readme-check.config.json:50–57,138–141`; the three fixture changes

The earlier external-path exceptions remain technically reasonable. The new `docs/agents.md` exception also correctly names upstream documentation.

Re-read the fixture diffs: they add only a vendor manifest in temporary homes; no assertions were removed or relaxed. All three tests pass again.

**Smallest fix:** Fable should record scope approval. No implementation change is needed for these exceptions. I found no recorded ratification in the reviewed artifacts.

## Round-1 closure

| Round-1 finding | Round-2 result |
|---|---|
| **MUST 1 — malformed config recommends ineffective install** | **Closed for the executed malformed-file case.** Doctor now instructs manual repair and explicitly says install will not touch the file. |
| **MUST 2 — `null` crashes doctor** | **Closed.** Null, array, number, string and boolean configs all return failure rows without throwing. |
| **MUST 3 — requirement rows overclaim evidence** | **Partially closed.** Reviewer byte identity/frontmatter and absent-package citation are fixed; finding 1 remains. |
| **SHOULD 4 — overly broad background/gate guarantee** | **Partially closed.** Pack prose now limits ordinary launches and documents extension-inheritance exceptions; finding 2 remains. |
| **NOTE 5 — scope additions** | Technically approved again; owner acknowledgment remains outstanding. |

### Repeated malformed-config probe

Wrote `{ bad`, called `diagnose()`, then `stepSubagentConfig()`:

```text
doctor: fail — not valid JSON; repair <path> by hand
        (`nana-setup install` will not touch this file)

install: unchanged — already present, left untouched
after: { bad
```

Preservation is correct, and the diagnostic no longer recommends the ineffective remedy. A minor usability improvement would be to print the required values explicitly rather than merely say “the required values.”

## Trimmed reviewer and upstream contracts

**Reviewer discovery: verified by execution.** Ran the unpacked pi-subagents **0.75.0 discovery implementation** against a temporary agent directory containing the current seed. A Node resolution hook supplied missing dependencies from the scratch installation; vendor source was unchanged.

```text
name: reviewer
source: user
tools: read, grep, find, ls, bash, watchdog_diff
filePath: <temporary agent dir>/agents/reviewer.md
firstBodyLine: <!-- nana-setup reviewer seed -->
```

The description survives parsing; the user definition shadows the builtin. Upstream merge order still permits project definitions to override it.

The removed ownership/gate paragraph no longer enters the child prompt. The remaining prompt retains self-service evidence commands, “Could not verify,” and decision-only supervisor escalation.

**Extension exceptions: source-confirmed.** `child-tool-plan.js:272–273` disables ambient extensions for an explicit extensions override or a denying capability ceiling. Thus the narrowed default-inheritance claim is sound; background execution alone does not establish gate loading.

## Requirement-by-requirement audit

Scope: the lane’s rows **R-360–R-371**.

| Row | What the cited tests actually pin | Assessment |
|---|---|---|
| R-360 | Seeded JSON equals seed; existing config bytes survive install. | Adequate; one `shall`. |
| R-361 | Exact three-key set and literal values. | Adequate; one `shall`. |
| R-362 | Missing config fails and recommends install. | Adequate; one `shall`. |
| R-363 | Full seed byte match, existing reviewer preservation, independently parsed name/description/bash. | Adequate; one `shall`. |
| R-364 | Literal floor, old-version failure with command, floor acceptance, absent-package failure with command. | Adequate; one `shall`. |
| R-365 | Default-exposure warning names server and both keys; direct exposure passes. | Core clause pinned; one `shall`. Auto-enable-off test also passes but remains uncited. |
| R-366 | Invalid JSON/non-object failures and manual-repair wording. | File-path clause unpinned; two `shall`s. |
| R-367 | False async-force key fails, names key, avoids tested install recommendation. | Behavioral case pinned; two `shall`s. |
| R-368 | Depth 2 fails, names key, avoids tested install recommendation. | Behavioral case pinned; two `shall`s. |
| R-369 | Bytes survive a second diagnosis, after the first already ran. | Does not pin first-call nonmutation. |
| R-370 | Absent reviewer fails and recommends install. | Adequate; one `shall`. |
| R-371 | Entirely unmarked reviewer fails and suggests manual repair. | First-body-line position unpinned; one `shall`. |

## Commands and acceptance status

- `pi --version` → **0.87.1**
- Changed setup tests, including all three collateral fixtures → **PASS**
- `npm run map:check` → **0 problems**
- `npm run readme:check` → **5 missing-path problems**
- `npm test` → **87 PASS, 1 FAIL, 1 SKIP; 5390 checks passed, 2 failed**

The sole failing suite file is `packages/nana-pack/tests/readme-check.test.mjs`. Its missing `.ext` and knowledge `node_modules` paths match the environment failures established in round 1, not a newly introduced failure.

**Not verified:** full suite on pi 1.0.2, live reviewer self-service, live child gate interception, TUI responsiveness/fan-out, or handoff-mtime acceptance. Those remain the seat’s acceptance checks.

**VERDICT: BLOCK — 8/10.**
