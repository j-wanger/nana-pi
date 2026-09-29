1. **R2 HIGH — FIXED:** malformed/unusable stores now receive the repair-first line (`objective.ts:348`); ordinary missing decisions retain `/trust` (`:349`).
2. **NEW HIGH — `/trust` still cannot clear the label with `PI_CODING_AGENT_DIR`.**
3. `trustRecord()` always reads `~/.pi/agent/trust.json` (`objective.ts:78,294`), while pi’s `getAgentDir()` honors `PI_CODING_AGENT_DIR` (`config.js:421-425`).
4. Probe: with an affirmative record in the overridden store, `trustRecord(project)` returned `vouched:false` and named the absent default store.
5. Therefore `/trust` writes the overridden store, restart rereads the default store, and the label persists indefinitely. Conversely, a stale default `true` can suppress the label despite the active store declining trust.
6. This is a real supported configuration already recognized elsewhere by nana-pack’s gate.
7. **MED — parent failures still produce false instructions:** when `~/.pi/agent` is a file, the nonexistent child `trust.json` is called `unreadable`, then “repair or remove that file” targets the wrong object.
8. Missing `~/.pi/agent` is fine only when HOME is writable; an unwritable parent/read-only volume makes both remediation forms fail. Foreign ownership is removable only when parent permissions permit it.
9. Valid-JSON wrong-shape → `malformed` is acceptable schema terminology; parent-not-directory → `unreadable` is misleading.
10. A valid oversized store can be compacted below 1 MiB by pi’s rewrite; thus README’s categorical claim that pi’s write “cannot fix … size” is false, though the emitted “not reliably” wording is defensible.
11. The race remains: a store repaired after nana’s read can make the destructive remove advice stale. The loss consequence itself is stated clearly.
12. Other surfaces faithfully repeat the design, but `AGENTS.md`/README hard-code the wrong store and `project.mjs:309` overclaims that the label always says how to clear it.
13. **CARRY—HIGH/blocking:** resolve the active store exactly as pi does, including `PI_CODING_AGENT_DIR`, tilde/relative semantics; test affirmative/declined records in both default and overridden stores.
14. **CARRY—MED:** distinguish parent-not-directory/unwritable/read-only cases and provide a non-guaranteed privilege/write-access escape instead of naming a nonexistent file.
15. **CARRY—LOW:** correct the oversized-store README claim and caution against removing a store whose state changed.
16. Deferred `nana-setup trust <dir>` should remain follow-up; it does not substitute for truthful built-in remediation.

VERDICT: BLOCK
