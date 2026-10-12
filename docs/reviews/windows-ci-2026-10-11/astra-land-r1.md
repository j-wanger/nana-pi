## MUST

1. **`HANDOFF.md:15,30` — correct the Windows baseline.**  
   Run 1 reports **63 PASS, 69 FAIL, 1 SKIP** (`ci-run-1-windows.log:997`). Run 2 reports **68 PASS, 64 FAIL, 1 SKIP** (`ci-run-2-windows.log:985`). The handoff assigns the measurement result to the first run, although the measurement step was removed. “Native Windows is unexecuted” also contradicts both runs.  
   **Smallest fix:** record both totals with their checkout conditions; replace the stale residual with “Windows machine install-and-hooks rehearsal remains unexecuted.”

2. **`HANDOFF.md:50`; `docs/sessions/2026-10.md:11` — preserve the uncertainty around the refresh failure.**  
   The triage explicitly labels open-file replacement as an **inferred cause** (`windows-triage.md:403`). The handoff and session entry present it as established. The catch in `packages/nana-setup/lib/project.mjs:229` hides several possible failures, not just rename errors.  
   **Smallest fix:** say “Windows refresh fails; open-file replacement is the suspected cause.” Keep confirmation in the queued fix lane.

## SHOULD

1. **`README.md:25,210` — remove stale release-evidence wording.**  
   Both passages say the first hosted run remains unproven. Line 177 already records the first successful hosted release.  
   **Smallest fix:** delete the two stale sentences. The revised macOS-gating wording is otherwise correct.

2. **`docs/reviews/windows-ci-2026-10-11/windows-triage.md:214–216` — withdraw the unsupported desk teardown diagnosis.**  
   The proposed `taskkill /T /F` fix already exists in `apps/desk/server.mjs:628–639`. The triage itself recognizes that implementation elsewhere. Marking a claim “INFERRED” does not resolve contradictory source evidence.  
   **Smallest fix:** retain the resolver failure and test-portability findings; remove the orphan diagnosis and already-implemented fix unless separate evidence supports them. Keep the desk frozen.

## NOTE

- **`.github/workflows/ci.yml:19–41` — workflow scope is correct.** Windows runs in bash with the shared setup. Linux and Windows are non-blocking; macOS remains blocking. The measurement step is absent.
- **`.github/workflows/ci.yml:43–69` — release is unchanged.** It still needs the suite and runs only for pushes to main.
- **`REQUIREMENTS.md:998,1006–1007` — the three requested rows each contain one `shall`.** Their cited tests exist. In-memory mutations removing bash, removing Windows, and making Windows blocking failed the intended checks.
- **`packages/nana-pack/tests/templates-render.test.mjs:316–318` — support wording is pinned exactly.** All three front doors match the canonical line, without claiming Windows parity.
- **`windows-triage.md:5–67` — the main classification and queue are appropriate.** Product defects, deliberate support gaps, test portability, and frozen desk work remain distinct. Existing Windows failures need not be fixed in this lane.

**Verification:** workflow and requirements-tree tests passed; map and README checks passed. Full suite and hosted runs were not rerun during this review.

**Score: 8/10.** No workflow blocker found; correct the evidence summaries before landing.

VERDICT: LAND-WITH-FIXES
