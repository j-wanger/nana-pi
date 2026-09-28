## Findings

### HIGH — Persisted snapshot can be forged to widen the gate `[adversarial][scope]`

`packages/nana-pack/lib/config.ts:268-273,413-416` treats any schema-valid snapshot as the “last validated” policy. `packages/nana-pack/extensions/nana-gate.ts:90-92` then applies forged `allowPatterns` before dangerous-pattern checks.

Executed results:

- Valid custom deny → corrupt config → untampered snapshot remained enforced.
- Missing/malformed snapshot → conservative stop worked for bash, powershell, edit, and write.
- Malformed snapshot → conservative stop worked.
- Replacing the snapshot with `allowPatterns:[".*"]` after the config was corrupted caused a fresh-process `rm -rf` call to return unblocked.
- With corrupt config and no snapshot, the first call stopped; planting the wider snapshot during that same session made the next dangerous call unblocked.

Thus the snapshot is syntactically validated, not proven to be a policy previously loaded from `nana-pack.json`, violating invariants 2 and 6.

The smallest safe subtraction is available under the contract: retain the process-wide in-memory last-good policy for mid-session corruption, but conservatively stop after restart rather than trusting an unauthenticated persisted snapshot. L2 path protection alone cannot establish snapshot provenance.

### MEDIUM — Config diagnostics disappear when a valid sibling disables journaling `[adversarial][compat]`

`packages/nana-pack/lib/config.ts:371-376` emits diagnostics through the effective config, while `packages/nana-pack/lib/config.ts:491-492` suppresses all output when `journal.enabled` is false.

Executed with:

```json
{"journal":{"enabled":false,"path":7}}
```

The UI warning appeared, but zero `config_invalid` journal lines were written. In headless mode the malformed leaf is therefore silent, contrary to invariant 1 and the promise at `packages/nana-pack/README.md:120-122`.

## Review notes

- **Scope:** All 20 changed files are allowlisted; handoff logic, objective resolution, gate patterns, desk, and `pi-review` are untouched.
- **Existing tests:** The 10 listed fixture tests have zero assertion edits. `gate-config-robustness`’s seeded snapshot reflects the replacement no-snapshot-stop contract pinned in `config-gate-fallback`; its assertions were not weakened.
- **Size:** Fixture/docs/test count explains most of the 20 files. The `globalThis` state is justified: the control passed with one evidence resolution/warning/journal line, while a `/tmp` per-copy mutation failed all four checks. Runtime use of pi’s trust APIs is smaller and safer than duplicating trust-store/resource semantics. The persisted-snapshot machinery is the subtractable part.
- **Trust probes:** Real pi 0.87.1 passed nana-only ignored, settings honored, folder/parent trust honored, recorded false ignored, and corrupt trust store closed. Nested cwd inherits recorded parent trust; ancestor `.pi/settings.json` alone is not inherited, matching pi’s cwd resource rule.
- **Race:** Planting `.pi/settings.json` after `session_start` did not activate project `postEdit`; the next session start did.
- **Malformed shapes:** Prototype keys, invalid regex, non-UTF8, directory, `/dev/null` symlink, zero-byte file, and 100k regex entries never threw. Prototype remained unpolluted.
- **Documentation:** The changed policy appears in `packages/nana-pack/README.md:112-126`, `templates/_shared/working-under-nana-pi.md:66`, and `packages/nana-pack/skills/adopt-structure/SKILL.md:134`. `/trust` is available without a resource precondition and writes through `ProjectTrustStore.setMany` in pi’s `interactive-mode.js:2529-2531,4298-4310`.
- **Compatibility:** Desk GET/POST remains a raw write/read round trip; normalization affects runtime consumption only. `nana-setup project` still seeds the same file. Objective files/resolution are diff-clean, and the unchanged objective test passed.

## Residuals to carry

- Today the gate permits `write`/`edit` of both user `nana-pack.json` and the snapshot. Editing user config to `allowPatterns:[".*"]` loosens immediately. L2 owns path protection and session snapshot semantics.
- Trusted project gate leaves can still replace user denies.
- One malformed user-gate entry falls back the whole gate policy.
- No Windows execution was performed; added production code uses Node cross-platform APIs and pi’s trust implementation for trust-path lookup.
- A 100k-pattern input completed without throwing but remains unbounded per-tool-call work.

VERDICT: BLOCK
