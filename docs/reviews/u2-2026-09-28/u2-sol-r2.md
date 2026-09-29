## Findings

### HIGH — relative overrides still split the desk from every session it spawns  
**executed + source-read** — `apps/desk/server.mjs:1178`, `apps/desk/server.mjs:1323-1331`, `apps/desk/server.mjs:445-447`

The module constants resolve a relative `PI_CODING_AGENT_DIR` against the **desk’s** cwd, but spawned pi processes inherit the relative value and resolve it against each session’s `cwd`. Inheriting the same environment does not make the effective directory equal.

Executed probe:

```text
desk:            /tmp/.../desk/rel
spawned-session: /tmp/.../project/rel
```

Consequences:

- `PI_DIR` and `SESSIONS_DIR` point at the desk-relative tree.
- Settings, MCP, nana-pack, agents, resources, and session history shown by the client come from that tree.
- Spawned sessions read and write the project-relative tree.
- The desk can therefore display or edit a `nana-pack.json` that the session does not read—the original U2 failure shape.

Absolute and tilde values work. The fix should pin `PI_CODING_AGENT_DIR=ACTIVE_AGENT_DIR` in spawned child environments when the inherited value was relative, or reject/document relative overrides for the desk.

### HIGH — a normal `nana-setup` run can still seed a config later runtimes do not read  
**executed + source-read** — `packages/nana-setup/lib/paths.mjs:18-25`, `packages/nana-setup/lib/doctor.mjs:132-142`

`resolveLayout({})` resolves a relative ambient override against `nana-setup`’s current cwd. A later pi process started elsewhere resolves the same environment value against its own cwd.

Thus `install` can seed `<setup-cwd>/rel/nana-pack.json`, and `doctor` can call it healthy, while pi launched in another project reads `<project>/rel/nana-pack.json`.

This is the same executed split shown above. The parity test misses it because the resolver, desk, setup, and expected value all run from the same cwd. A normal setup invocation should either refuse an ambient relative override without explicit `--pi-home`, or report that the result is cwd-specific rather than generally installed.

Explicit overrides are hermetic:

```text
{"exit":0,"explicit":true,"ambient":false,"default":false}
pi agent dir .../pi-explicit (--pi-home)
pi objective file .../pi-explicit/nana-objective.md
```

`--home` also passed its ambient-environment isolation test.

### MEDIUM — documentation still does not describe `AGENT_DIR_VAR_RE` exactly  
**executed** — `packages/nana-pack/lib/gate-paths.ts:128-130`, `packages/nana-pack/README.md:349-353`, `AGENTS.md:152-156`

The documentation enumerates four spellings, but the optional brace/percent regex also catches malformed or mixed forms:

```text
"$PI_CODING_AGENT_DIR/nana-pack.json"       true
"${PI_CODING_AGENT_DIR}/nana-pack.json"     true
"%PI_CODING_AGENT_DIR%/trust.json"          true
"$env:PI_CODING_AGENT_DIR/trust.json"       true
"$PI_CODING_AGENT_DIR}/nana-pack.json"      true
"${PI_CODING_AGENT_DIR/nana-pack.json"      true
"%PI_CODING_AGENT_DIR/trust.json"           true
"$env:PI_CODING_AGENT_DIR%/trust.json"       true
```

It is also case-insensitive although POSIX variable names are not. Keeping this protection is sound, but either make the regex exactly match the documented forms or document that it deliberately overmatches near-spellings.

## Required confirmations

### MUST A — FIXED

**Executed.** Independent symlink-target probe:

```text
active nana-pack.json true
active trust.json true
default nana-pack.json true
default trust.json true
```

The focused handler test also blocked edit, write, redirection, and `tee` against active targets, plus the default nana-pack target. `activeDirPolicyFiles()` includes the link, first hop, and resolved file target.

### MUST B — FIXED

**Executed + source-read.**

- Dangling user policy link stops with a named repair reason.
- Dangling trusted-project policy link stops rather than becoming absent.
- A genuinely missing file still selects defaults/no project contribution.
- A user link becoming dangling retains its last valid deny.
- Project last-valid behavior uses the same `readConfigFile()` result and passed the existing mid-session malformed-policy fallback probes.

### MUST C — FIXED

**Executed.**

`piAgentDir()`, `piTrustStorePath()`, `commandPolicyHit()`, `loadConfig()`, and the tool handler all returned under deleted cwd; the handler blocked with the named “agent dir unresolvable” reason.

I accept STOP here. Once the relative directory cannot be resolved, the implementation cannot prove which policy is current. Keeping a possibly unrelated baseline would be less conservative. This is an exceptional process-state failure, not ordinary mid-session file corruption.

### One resolver — PARTIAL

**Executed + source-read.**

- `packages/nana-pack/lib/agent-dir.mjs` is the sole repository resolver.
- Gate-paths re-exports it.
- Gate, objective, and lifecycle loaded successfully through pi’s jiti-style real extension loader:

```text
nana-gate.ts function
nana-objective.ts function
nana-lifecycle.ts function
```

- Absolute and tilde parity pass.
- Relative parity fails across the desk/setup process and differently rooted pi child processes, as described above.

### Installer hermeticity — FIXED

**Executed.**

Both `--home` and actual `--home --pi-home` installation ignored ambient `PI_CODING_AGENT_DIR`; no files appeared in the ambient or default agent directory.

### Declaration sweep — PARTIAL

**Source-read.**

The sweep correctly updated receipts, journal, setup paths, objective seed, desk labels, and generated guidance. It did not move or weaken declarations for the deliberately fixed handoff store, review ledger, or desk stage-key store.

The only remaining declaration defect is the regex/documentation mismatch above.

## Test results

**Executed:**

```text
74 files: 73 PASS, 0 FAIL, 1 SKIP, 0 WARN
checks: 4619 pass, 0 fail, 6 skip
```

`git diff --check ab01f1a..HEAD` passed, and the worktree remained clean.

## Round-1 MUST disposition

1. Real target of symlinked active policy file: **FIXED**
2. Dangling policy symlink fallback/stop: **FIXED**
3. Deleted-cwd totality: **FIXED**
4. Desk follows active agent directory: **PARTIAL** — relative override remains split
5. `nana-setup` installs/diagnoses active directory: **PARTIAL** — relative override remains cwd-specific
6. Authoritative declarations and variable-special-case documentation: **PARTIAL**

SCORE: 7/10  
MUST: Resolve or refuse relative `PI_CODING_AGENT_DIR` across desk-spawned sessions and normal `nana-setup` runs; make the documented variable spellings exactly match `AGENT_DIR_VAR_RE`.  
CARRY: Active-dir `settings.json`/`auth.json` remain outside the floor as explicitly ruled; handoff, review ledger, stage keys, and shell-computed-path limitations remain deliberately unchanged.  
VERDICT: BLOCK
