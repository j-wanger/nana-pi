# Round 3 review — `feat/pi-1.0`

Reviewed `1c4a369..21f181b` as new code, re-derived the round-2 closures, and audited R-360–R-372. Worktree unchanged.

## Findings, ranked

### 1. LOW — Record MCP diagnostic precedence explicitly

**Locations:** `REQUIREMENTS.md` R-365/R-372; `packages/nana-setup/lib/doctor.mjs:359–380`

The new invalid-server check correctly takes precedence over exposure warnings. R-365’s wording remains unconditional, however.

Executed:

```text
{broken: null, memory: {command: "x"}} → fail, naming broken
{memory: {command: "x"}}               → warn, naming exposure and autoEnableCodemode
```

The first result is appropriate, but R-365 literally promises a warning whenever *any* server lacks exposure. Its citations cover valid configurations, not this mixed case.

**Disposition: RECORD at landing, not a blocker.** State that malformed-server failures take precedence over exposure warnings; qualify R-365 accordingly. This is a small contract-precision residual, not a runtime safety defect.

### 2. NOTE — Scope ratification and live adoption acceptance remain owner actions

The round-2 scope acknowledgment remains outstanding in the reviewed artifacts: the external-path exceptions and three fixture changes need landing-owner ratification. No further implementation change is required for them.

The installed pi remains **0.87.1**. This review does not establish acceptance on 1.0.2 or completion of architecture-ruling A1–A6: live child gate interception, reviewer self-service, depth behavior, responsive parallel TUI operation, and unchanged handoff mtime.

**Disposition: RECORD at landing.** These do not block landing the code; they do block calling the machine’s pi 1.0 adoption verified.

## Round-2 closure

| Finding | Round-3 result |
|---|---|
| **MUST 1 — incomplete requirements/evidence fix** | **Closed.** R-366–R-368 now each have one `shall`; path assertions are explicit; the nonmutation oracle uses bytes supplied before the first diagnosis; a misplaced-marker fixture distinguishes position from presence. All three independent mutations fail named tests. |
| **SHOULD 2 — overbroad/unsupported README claims** | **Closed.** The setup table limits the guarantee to ordinary model-driven top-level tool launches and links the exceptions. The pack identifies the structured delegation bridge and its `foregroundOnly` path, without claiming `/delegate` is a registered command. |
| **SHOULD 3 — invalid MCP server entries read green** | **Closed.** Non-object entries are rejected and named before exposure inspection. The previous skip assertion is replaced by failure assertions for null, array, number, string, and false. All pass. |

The repair diagnostic also now prints literal `forceTopLevelAsync: true` and `maxSubagentDepth: 1`, addressing round 2’s usability observation.

## Independent mutation results

Used a disposable `git archive 21f181b`; changed only `doctor.mjs`, restored it between mutations, and ran the unchanged `doctor-detail.test.mjs` each time.

| Mutation | Exit | Named test turned red |
|---|---:|---|
| Remove the config path from repair diagnostics, including the interpolated reason | 1 | `subagent config: unparseable reads ✗ naming the path and the literal required values, never install (no crash)` — plus six other checks |
| Accept the reviewer marker anywhere in the file | 1 | `reviewer agent: marker present but NOT on the first body line reads ✗` |
| Rewrite each present config immediately after reading it during diagnosis | 1 | `doctor never rewrote the file, including on its very first diagnose() call` |

Unmodified archive: **exit 0, ALL PASS**. The rewrite mutation failed specifically on byte preservation, not merely on a downstream diagnostic.

Logs: `/var/folders/lg/h9m6nvvd2_9d7s3hyjvdlqxr0000gn/T/astra-r3-rtijajwo/`.

## New-code review

The fix adds one substantive runtime branch: invalid MCP server entries now produce a failure before exposure analysis. The subsequent exposure dereference is protected by that validation. No config-writing behavior was introduced.

The remaining runtime change improves repair text. The test changes directly address the three demonstrated blind spots rather than weakening their expected outcomes.

**No new blocking runtime defect found.** The diagnostic-precedence wording residual is finding 1.

## Requirement audit: R-360–R-372

A mechanical count confirms **exactly one `shall` in each of all 13 rows**. I also read the cited assertions; marker existence alone was not treated as coverage.

| Row | Clause pinned by cited tests | Assessment |
|---|---|---|
| R-360 | Absent config receives seed content; existing config survives install byte-identically. | Pinned |
| R-361 | Exact three-key set and all three literal values. | Pinned |
| R-362 | Missing config fails and names install as remedy. | Pinned |
| R-363 | Installed reviewer matches the entire seed; existing reviewer is preserved; frontmatter is independently parsed. | Pinned |
| R-364 | Literal 0.75.0 floor; old and absent packages fail with the pinned command; floor version passes. | Pinned |
| R-365 | Default exposure warns and names both keys; direct exposure and disabled auto-enable pass. | Pinned for valid configurations; precedence residual above |
| R-366 | Malformed/non-object configs fail, name their actual path and literal required values, and avoid the tested install recommendation. | Pinned; path mutation fails |
| R-367 | False async-force key fails with key, required value, path, and no tested install recommendation. | Pinned |
| R-368 | Depth 2 fails with key, required value, path, and no tested install recommendation. | Pinned |
| R-369 | Wrong config remains byte-identical after its first diagnosis, against the original supplied bytes. | Pinned; rewrite mutation fails |
| R-370 | Absent reviewer fails and names install as remedy. | Pinned |
| R-371 | Absent or misplaced marker fails with manual-repair advice; correct placement passes. | Pinned; anywhere-marker mutation fails |
| R-372 | All five non-object server shapes fail, naming the server and object-shape problem. | Pinned |

## Commands and acceptance status

- `git diff --check 1c4a369..21f181b` → clean.
- `pi --version` → **0.87.1**.
- `npm run map:check` → **0 problems**.
- `npm run readme:check` → **5 missing-path problems**, matching round 2’s absent bench `.ext` and knowledge `node_modules` artifacts.
- Completed `npm test` rerun → **87 PASS, 1 FAIL, 1 SKIP; 5395 checks passed, 2 failed**.
- Sole failing suite: `packages/nana-pack/tests/readme-check.test.mjs`, for those missing paths.
- `doctor-detail.test.mjs` → **59 passing checks**.
- `install.test.mjs` → **74 passing checks**.
- Requirements trace and collateral setup fixtures → **PASS**.

The first full-suite attempt exceeded my 200-second timeout; the second completed in 302.8 seconds. I am not reporting a green full suite.

**Remaining items are landing records and adoption acceptance work, not code defects that block this branch.**

**VERDICT: LAND — 9/10.**
