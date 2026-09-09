### A. Resolution soundness — FINDING

- **BLOCK — `apps/desk/pi-session.mjs:215-221`** — A known `DESK_PI_ROOT` disagreement only warns, then knowingly imports one installation while spawning another. This violates the module’s central same-install invariant.  
  **Minimal fix:** refuse startup when walk-up identifies a different package root, or derive `PI_BIN` from the explicit root.

- **SHOULD — `apps/desk/pi-session.mjs:64-69,247,273`** — `compareVersions()` ignores prerelease/build suffixes and treats unparsable versions as equal. Thus `0.84.4-beta.1` passes the `0.84.4` floor and can match a binary reporting another build.  
  **Minimal fix:** use exact normalized version equality for binary/package tying and prerelease-aware semver comparison for the minimum floor; reject unparsable versions.

### B. Host/Origin rule with `BOUND_PORT` — PASS

The listen callback runs on the `listening` event before connections are dispatched. Until then, port `0` causes explicit Host/Origin values to fail closed. Fixed-port behavior is unchanged. App manifests prohibit port 0 and consistently validate against their own fixed `m.port`. The raw-socket tests retain rebound rejection and gate-survives-after evidence.

### C. Deterministic v1 IDs — PASS

The positional IDs are restart-stable and cannot collide with pi’s normal eight-character hexadecimal IDs. All documented entry-reference fields are remapped. Historical rename does not orphan v1 sessions: pi’s v1 migration overwrites every non-header ID and reconstructs the linear parent chain, including the appended `session_info`.

### D. Tests — FINDING

- **NIT — `apps/desk/test/pi-resolution.test.mjs:109-111`** — The “costs no subprocess” assertion only checks warnings; it would still pass if the shim were executed.  
  **Minimal fix:** make the shim write a marker or increment a counter and assert that no marker appears.

The explicit roots in stub-spawn tests appropriately isolate spawning from parser resolution; dedicated synthetic and real-install tests cover resolution separately.

### E. Other fold regressions — FINDING

- **SHOULD — `apps/desk/server.mjs:607-610`** — Refactoring the bounded scan removed the old per-line `try/catch`. A malformed but object-shaped message such as `content: {}` now reaches `.find()` and can 500 `/api/sessions`.  
  **Minimal fix:** only call `.find()` when `Array.isArray(content)`, otherwise treat the title text as empty.

README wording, hard-floor documentation, header-ID validation, scalar filtering, and the documented bounded scan are otherwise corrected.

VERDICT: BLOCK
