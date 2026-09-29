SCORE: 6/10

## A — Contract implemented?

**The six original pack requirements are implemented. The amended cross-consumer contract is not satisfied.**

At `4b1d45f`:

- User config, journal defaults, receipt defaults and trust-API fallback use the shared active-agent-dir resolver.
- The policy floor covers active/default user policy files, symlinked directories and policy-file targets.
- Dangling policy-file links use last-valid/STOP behavior rather than silently selecting defaults.
- A stranded default config produces the specified mismatch diagnostic without being read.
- Deleted-cwd resolution fails closed with a named reason rather than throwing through the gate handler.
- The round-cap ledger remains deliberately fixed.
- The seat’s final change applies the relative-directory refusal before project creation and before `project --check` reads user configuration.

I accept the seat-run acceptance result: **76 files, 75 PASS, 0 FAIL, 1 SKIP, 4728 checks**. I did not rerun it. `git diff --check ab01f1a..HEAD` also passes.

However, widening directory resolution changed consumers beyond the ones the tests assert. Two concrete regressions and one service-launch gap remain.

## B — Contract satisfied across the whole unit?

### 1. HIGH — Changing session enumeration can delete another agent directory’s stage keys

`apps/desk/server.mjs:141` moves session enumeration into the active agent directory. At `:209`, that enumeration supplies `StageKeyStore.knownSessionIds`.

The stage-key store remains shared at `~/.pi/agent/nana-desk/stage-keys`. Its pruning operation, in `apps/desk/stage-keys.mjs`, deletes every recorded session absent from a **nonempty** enumeration.

Consequently, opening an app in a desk using a custom agent directory can delete keys belonging to still-existing default-directory sessions. Two desks using different agent directories can prune each other’s keys.

I executed an isolated reproduction using the actual `StageKeyStore`:

```text
before                             true
after custom-dir enumeration       false
```

The deleted record belonged to a different session namespace, not a deleted session. This loses the ability to verify historical stage blocks after restart.

**Required:** retain the fixed store if desired, but do not use a single active-directory enumeration as proof that globally stored sessions are gone. Disable that unsafe pruning or make deletion depend on appropriately scoped evidence. Add a two-agent-directory regression test.

“Stage keys did not move” is mechanically true but does **not** establish unchanged behavior.

### 2. MEDIUM — Installer and knowledge runtime now select different stores

`packages/nana-setup/lib/paths.mjs:44` derives `knowledgeHome` from the newly relocated `piHome`. `steps.mjs:302–319` builds there by setting `NANA_KNOWLEDGE_HOME` for that subprocess.

But `packages/nana-knowledge/lib/paths.ts:8` still defaults to the fixed user directory, independently of `PI_CODING_AGENT_DIR`.

Executed with an absolute override:

```text
installer: /tmp/u2-land-custom/nana-knowledge
runtime:   /Users/jwang/.pi/agent/nana-knowledge
```

Normal hook/query processes therefore read the old index—or no index—while setup installs and diagnoses another. The new setup README accurately describes where installation writes, but its refresh instruction, `nana-knowledge build`, does not select that same directory automatically.

**Required:** reconcile producer and runtime. The smallest subtraction is to leave knowledge storage outside this relocation, with its independent override honored consistently. Moving it requires a deliberate cross-runtime contract and corresponding tests.

### 3. HIGH — Installed desk service does not receive the installer’s chosen agent directory

`packages/nana-setup/launchd/com.nana.pi-desk.plist.tmpl` exports only `PATH`. `stepDesk` does not serialize `layout.piHome` into the service environment.

Thus a normal shell invocation with an absolute custom override can install/register the pack in that directory, while the launchd-managed desk starts with its own inherited environment and selects the default directory. A shell’s environment is not the service manager’s configuration.

This is source-established; I did not bootstrap or alter the live service.

**Required:** explicitly convey the resolved agent directory to the installed service, or refuse the unsupported arrangement with a clear remedy. Test the rendered service configuration, not merely a directly launched desk.

### 4. MEDIUM — Consumer-facing declarations remain incomplete

`apps/desk/README.md` was not changed. It still names default-directory sessions and user config, promises terminal-equivalent configuration without the relative-path qualification, and lacks a U2 contract note.

The settings-only announcement is insufficient for a user who launches sessions without opening settings. This is especially material because the chosen directory selects policy, credentials, packages and trust.

**Required:** publish the active-directory/pinning contract in the desk README and surface the pin at session creation or another normally encountered location.

Also repair these narrower inaccuracies:

- `AGENTS.md` now says setting the variable means the default file is not read and the pack says so once per session. An override can resolve to the default directory; the warning is conditional on an absent active config and an existing stranded default file.
- The setup README describes refusal for `install`, but omits the final seat-added refusal for `project` and `project --check`.
- `receipts.ts` still claims receipts live outside any source tree; a custom active agent directory can be inside one.
- The authoritative handoff still describes U2 as an unfixed landed defect; update it when this actually lands.

## C — Seat rulings, upstream contract and residuals

### Seat rulings

1. **Scope amendment: correct.** Config readers, writers and launchers belong in the same consistency fix. Separating the desk would knowingly ship the original defect across a package boundary. A targeted feel check is still needed; the written amendment does not substitute for it.
2. **Keep `AGENT_DIR_VAR_RE`: accepted.** Four explicitly limited spellings are useful defense in depth. Partial recognition is not worse than none when the documentation clearly disclaims general shell interpretation. It must not be presented as closing computed-path bypasses.
3. **Desk pins; installer refuses: coherent.** The desk controls child environments; the installer cannot control future terminal launches. The implementation’s announcement placement is not sufficient, and service launch remains unconnected.
4. **Deleted-cwd STOP: accepted.** Unresolvable policy identity is not ordinary malformed content at a known identity. Refusing gated tools is preferable to guessing a possibly unrelated last-valid policy.
5. **Fixed round ledger: accepted.** This prevents `PI_CODING_AGENT_DIR` from resetting the tally. It is not a claim that the ledger is tamper-proof.

### Upstream-contract declaration

Consumers must stop constructing nana-pack user paths from `~/.pi/agent`:

- Config is `<active agent dir>/nana-pack.json`.
- Default journal and receipts follow that directory; explicit configured paths still win.
- Objective configuration in **both runtimes** now comes from that active user config.
- Relative overrides are process-cwd-dependent. A launcher requiring shared policy must propagate an absolute resolved directory.
- There is no automatic migration or fallback read of the old config.
- Handoff storage, review ledger and desk stage-key storage remain fixed exceptions.
- Desk callers should use server-returned paths, not reconstruct them.
- Installer callers must handle refusal and doctor’s nonzero warning result.

Updating the shared template does not update already-generated repositories. I found stale config/journal/receipt declarations in **`~/aml-desk/AGENTS.md`** and **`~/jev-research/AGENTS.md`**. These require a bounded downstream refresh, not an assumption that the producer edit propagated.

### Residuals priced by cost of error

- **High consequence, separately urgent:** relocated `auth.json`/`settings.json` remain outside the added floor; project-policy symlink targets also remain incompletely covered. These are acknowledged exclusions, not repaired by U2.
- **High consequence, accepted advisory limit:** shell-computed paths, custom tools and load-path bypasses remain outside enforcement. Sandbox/container enforcement is still required.
- **Medium assurance gap:** native win32 was not exercised here. Slash/case handling remains by construction; native drive, UNC, junction and service behavior must not be advertised as executed proof.
- **Low operational cost:** existing explicitly pinned objective paths are not migrated; owners must inspect them.
- **Low availability cost:** deleted-cwd STOP requires repairing/restarting the process rather than continuing with uncertain policy.

### Evidence and process accounting

The seat independently ran the final full suite, performed the declaration sweep and implemented the final project refusal. The supplied record attributes the executed symlink, dangling-link, deleted-cwd, process-cwd split and regex probes to **sol**, not to independent seat reproductions of each finding.

I independently inspected the final diff and executed the new stage-key pruning and knowledge-path counterexamples. The service gap and stale declarations are source-read findings.

The over-cap review was explicitly authorized after implementation; that is legitimate. Three BLOCK rounds nevertheless did not establish whole-unit path consistency. Do not purchase another broad review round: implement or subtract the specific mismatches, instrument their consumer boundaries, then make the landing decision.

MUST:
- Prevent active-directory session enumeration from pruning unrelated shared stage keys.
- Reconcile installer and knowledge-runtime storage.
- Propagate the chosen agent directory into the installed desk service.
- Complete desk contract disclosure, expose relative pinning outside Settings, and correct the identified declaration inaccuracies.
- Add focused cross-directory/store/service regression coverage.

CARRY:
- Separately urgent relocated auth/settings and project-policy symlink protection.
- Advisory shell/load-path limitations; native-win32 proof gap.
- Downstream generated-guidance refresh and explicit objective-path migration guidance.

VERDICT: BLOCK
