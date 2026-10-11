## MUST

1. **`HANDOFF.md:15` — the first Windows run’s failure count is wrong.**  
   Evidence: run 1 reports 69 failing files. The 64-file count belongs to the temporary LF-checkout measurement at `c05460e`. `windows-triage.md:3` and `docs/sessions/2026-10.md:11` distinguish them correctly.  
   Smallest fix: state that the default run had 69 failures and the LF measurement had 64.

## SHOULD

None.

## NOTE

- `.github/workflows/ci.yml:15-41` adds Windows to the shared suite matrix, uses Bash, and keeps Linux and Windows non-blocking.
- `.github/workflows/ci.yml:43-68` is unchanged from the base revision. Release still needs the suite and remains gated by macOS success.
- The temporary `core.autocrlf=false` step is absent from the final workflow.
- `REQUIREMENTS.md:998,1006-1007` contains exactly one `shall` in each reviewed row.
- The three cited tests pass. Mutations removing Bash, removing Windows, or making Windows blocking fail the intended checks.
- The support line is byte-identical at `README.md:5`, `AGENTS.md:5`, and `packages/nana-setup/README.md:370`.
- The README’s three release descriptions correctly identify macOS as blocking and Linux and Windows as non-blocking.
- `windows-triage.md:3-81` separates product bugs, deliberate gaps, test portability, and frozen desk work. Inferred mechanisms are marked.
- Both hosted logs show Bash, reach `npm test`, and report the recorded totals.
- `npm run map:check` and `npm run readme:check` pass.
- A local locked-suite rerun timed out after 15 minutes. Its first 59 files passed; the builder records a complete green 133-file run.
- Score: **9.0/10**. The implementation is sound; one frontier count needs correction.

VERDICT: LAND-WITH-FIXES
