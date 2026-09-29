## Findings

### HIGH — the real target of a symlinked active config is outside the policy floor  
**executed** — `packages/nana-pack/lib/gate-paths.ts:145-149`

`activeDirPolicyFiles()` realpaths the agent **directory**, but not `<agent-dir>/nana-pack.json` itself. If that file is a symlink, the gate reads and enforces its target, yet direct edits or shell writes to that target are allowed.

Command:

```sh
node --experimental-strip-types /tmp/u2-config-symlink.mjs "$PWD"
```

Output:

```text
bash {"command":"LINK_DENY"} => BLOCK
edit {"path":"/.../actual-policy.json"} => ALLOW
write {"path":"/.../actual-policy.json"} => ALLOW
bash {"command":"printf x > /.../actual-policy.json"} => ALLOW
edit {"path":"/.../agent/nana-pack.json"} => BLOCK
```

Thus the agent can modify the policy actually in force by naming its real target. The floor should include the realpath of each policy **file**, not only the directory.

---

### HIGH — a dangling `nana-pack.json` symlink is treated as legitimate absence and silently drops custom denies  
**executed** — `packages/nana-pack/lib/config.ts:260-266`

`readConfigFile()` classifies every `ENOENT` as `present: false`; it does not distinguish a genuinely absent file from a dangling policy symlink. This selects defaults with no stop or diagnostic.

Command:

```sh
node --experimental-strip-types /tmp/u2-adversarial.mjs "$PWD"
```

Relevant output:

```text
HOSTILE
missing-dir "…/missing" => stop= null extra= []
agent-is-file "…/afile" => stop= null extra= []
empty "" => stop= null extra= []
newline "…/line1\nline2" => stop= null extra= ["NEWLINE_DENY"]
dangling-config "…/dang" => stop= null extra= []
config-is-directory "…/dircfg" => stop= "user nana-pack.json gate block is malformed — repair it (…:unreadable (EISDIR))" extra= []
unreadable-config "…/unread" => stop= "user nana-pack.json gate block is malformed — repair it (…:unreadable (EACCES))" extra= []
```

A dangling config symlink is evidence of an unusable policy file, not ordinary absence. It must use last-valid policy or conservatively stop.

---

### MEDIUM — `piAgentDir()`, `piTrustStorePath()`, `loadConfig()`, and the gate handler can throw after cwd disappears  
**executed** — `packages/nana-pack/lib/gate-paths.ts:65-72`, `packages/nana-pack/lib/config.ts:530`, `packages/nana-pack/extensions/nana-gate.ts:234-235`

With a relative override, both the main path and catch path call `path.resolve()`. Both throw when `process.cwd()` no longer exists. `loadConfig()` repeats the failing `userConfigPath()` inside its catch, and the gate handler does not wrap `livePolicy()` or `cwdOf()`.

Command:

```sh
node --experimental-strip-types /tmp/u2-deleted-cwd.mjs "$PWD"
```

Output:

```text
piAgentDir => THREW ENOENT ENOENT: no such file or directory, uv_cwd
piAgentDirIsCwdRelative => true
piTrustStorePath => THREW ENOENT ENOENT: no such file or directory, uv_cwd
pathCandidates => [ 'x' ]
policyFileHit => null
commandPolicyHit => null
loadConfig => THREW ENOENT ENOENT: no such file or directory, uv_cwd
tool_call => THREW ENOENT ENOENT: no such file or directory, uv_cwd
```

This violates the explicit “every `gate-paths.ts` function is total” and “gate handler must never throw” contracts. The throw blocks even a benign tool call.

---

### LOW — new tests reproduce implementation paths but omit the hostile invariants above  
**source-read** — `packages/nana-pack/tests/agent-dir-config.test.mjs:92-118`

The symlink test symlinks only the agent directory and then checks `alias/nana-pack.json` and `real-directory/nana-pack.json`; it never makes `nana-pack.json` itself a symlink. Hostile coverage includes only a missing directory and a value naming a file. It omits dangling/directory/unreadable config entries and deleted-cwd totality, allowing both high findings and the handler throw to pass.

## Passing executed probes

### Active-dir deny and default-dir behavior

Command:

```sh
node --experimental-strip-types packages/nana-pack/tests/agent-dir-config.test.mjs
```

Relevant output:

```text
PASS [absolute] (a) active extraPatterns enforced
PASS [absolute] (a) active protectedPaths enforced (edit)
PASS [absolute] (a) active protectedPaths enforced (bash)
...
PASS [relative] (a) active extraPatterns enforced
...
PASS [tilde] (a) active extraPatterns enforced
...
PASS unset: default config is the user config
PASS unset: no mismatch note
all PASS
```

### Policy floor: normal and symlinked agent directory

My handler probe covered edit/write plus redirection, `tee`, `cp`, and `sed -i` through the named symlink, directory realpath, `$HOME`, and tilde:

```text
active deny: BLOCK
edit …/agent-link/nana-pack.json => BLOCK
write …/agent-link/nana-pack.json => BLOCK
shell printf x > …/agent-link/nana-pack.json => BLOCK
shell printf x | tee …/agent-link/nana-pack.json => BLOCK
shell cp /tmp/x …/agent-link/nana-pack.json => BLOCK
shell sed -i s/a/b/ …/agent-link/nana-pack.json => BLOCK
edit …/real-agent/nana-pack.json => BLOCK
write …/real-agent/nana-pack.json => BLOCK
...
shell printf x > $HOME/agent-link/nana-pack.json => BLOCK
shell printf x | tee $HOME/agent-link/nana-pack.json => BLOCK
shell cp /tmp/x $HOME/agent-link/nana-pack.json => BLOCK
shell sed -i s/a/b/ $HOME/agent-link/nana-pack.json => BLOCK
edit ~/agent-link/nana-pack.json => BLOCK
write ~/agent-link/nana-pack.json => BLOCK
...
```

Literal `$HOME/...` in an edit/write tool path was allowed, correctly matching pi’s tool-path semantics; shell forms were blocked.

### Relative-value parity with installed pi

Command ran two child processes with `PI_CODING_AGENT_DIR=agent`, each from a different cwd, and imported installed pi’s `dist/config.js`.

Output:

```text
cwd=…/a
pi.getAgentDir=agent
pi effective=…/a/agent
nana.piAgentDir=…/a/agent
patterns=["FROM_A"]

cwd=…/b
pi.getAgentDir=agent
pi effective=…/b/agent
nana.piAgentDir=…/b/agent
patterns=["FROM_B"]
```

### Mismatch note and journal cardinality

From the real-handler test:

```text
PASS [absolute] (c) stale default deny is NOT read
PASS [absolute] (c) mismatch UI note fires exactly once in the session 1
PASS [absolute] (c) the note names both paths nana-pack: …/abs-agent/nana-pack.json: ... …/.pi/agent/nana-pack.json exists but is NOT read ...
PASS [absolute] (c) exactly one config_agent_dir_mismatch journal line 1
```

Equivalent relative and tilde rows passed.

### Malformed-gate and gate-survives-after invariants

Commands:

```sh
node --experimental-strip-types packages/nana-pack/tests/config-gate-fallback.test.mjs
node --experimental-strip-types packages/nana-pack/tests/config-project-gate-fallback.test.mjs
node --experimental-strip-types packages/nana-pack/tests/gate-survives-mutation.test.mjs
```

Relevant output:

```text
PASS a: corrupted mid-session — terraform destroy STILL blocked
PASS b: stop after restart — ls blocked with the repair reason
PASS c: malformed leaf, fresh process — edit blocked
...
PASS control: both malformed → the user stop wins
...
PASS baseline: rm -rf build gated
PASS 1: user .* → rm -rf ~ BLOCK
PASS 1: user .* → write nana-pack.json BLOCK
all PASS
```

### Round-cap ledger did not move

Command:

```sh
PI_CODING_AGENT_DIR="$H/custom" HOME="$H" node --input-type=module -e \
  "import {ledgerPaths} from './packages/nana-pack/bin/review-round.mjs'; console.log(JSON.stringify(ledgerPaths(),null,2))"
```

Output:

```text
PI_CODING_AGENT_DIR=…/custom
{
  "dir": "…/.pi/agent",
  "tally": "…/.pi/agent/review-ledger.rounds.jsonl",
  "audit": "…/.pi/agent/review-ledger.jsonl",
  "lock": "…/.pi/agent/review-ledger.lock"
}
```

### Full suite

Because this review process inherits `NANA_HANDOFF=off`, the valid repository-suite invocation is:

```sh
env -u NANA_HANDOFF npm test
```

Output:

```text
72 files: 71 PASS, 0 FAIL, 1 SKIP, 0 WARN · checks: 4558 pass, 0 fail, 6 skip · 228.5s
```

SCORE: 4/10  
MUST: Protect the real target of a symlinked active `nana-pack.json`; classify dangling policy symlinks as unusable and apply last-valid/stop behavior; make `piAgentDir()`, `piTrustStorePath()`, `loadConfig()`, and the tool handler total under a deleted cwd; add executed regression tests for all three.  
CARRY: The worker’s documented residual that relocated `settings.json` and `auth.json` are not covered by the active-dir floor; shell-computed paths remain the already-declared advisory-gate limitation.  
VERDICT: BLOCK
