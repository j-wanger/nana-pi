No MUST findings.

- **SHOULD — unstaged deletions break impact.** `scripts/code-map.mjs:78` hashes every indexed file without handling missing files. Deleting a tracked file before staging makes impact throw `ENOENT` instead of displaying stale results.
- **SHOULD — ordering coverage is weak.** `packages/nana-pack/tests/runtime-map.test.mjs` supplies MM3 entries already longest-first. Reverse their insertion order so removing the sort fails the check.
- **NOTE — session wording overstates process isolation.** `docs/sessions/2026-10.md` says measure starts the locked suite in its own process group. `suiteCommand()` does not detach it; the lock runner detaches its child.

Validation: both affected test files passed—47 checks, zero failures. Reviewed the recorded full measurement and runner mutations; did not repeat the full suite or execute Windows/Linux checks.

VERDICT: LAND
