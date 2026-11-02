No MUST findings.

- **SHOULD — `packages/nana-knowledge/lib/hook.ts:211`:** Budget checks gate the retry, but do not reserve time for its synchronous query. A retry starting just before expiry can finish beyond 1,500 ms. It still fails open; the locked-hook test passes.
- **NOTE:** New failure fields contain structured codes only, never exception messages.
- **NOTE:** M2 still requires all 10 pulls and rebuilds. Only failure diagnostics changed.
- **NOTE:** The merge preserves main’s content, apart from the intentionally removed obsolete busy-timeout bug entry.

Independent macOS run: **109 checks passed** across `build-busy.test.mjs` and `hook.test.mjs`. Recorded evidence includes 11/11 red mutation pairs and the passing macOS install check.

No listed harm found in the confirmation diff.

VERDICT: LAND
