# Review — CI pins pi's dependency tree, 2026-10-13 (gpt-5.6-sol build review and gpt-6-astra land review, in parallel)

Review `git diff 3f5151f..HEAD` on `feat/ci-pi-pin` (based on current `main`, `3f5151f`). Threat model: honest
variation in our tools and registries in scope (an upstream release breaking a declared range; a later edit that
drops the flag or adds an install line without it); deliberate forgery out. Lane class: small, urgent, CI
workflow shape.

**Materiality bar (Jake, 2026-10-13) — apply it to every finding.** A MUST is a defect a real user or one of our
own tools would plausibly hit under the threat model above, with a consequence that matters: data lost or
corrupted, a security or review boundary bypassed in practice, wrong output someone acts on, a broken install,
hook or CI gate, or a regression of behaviour main has today. Name the realistic input and the consequence; if
you cannot, it is a SHOULD or NOTE. Contrived inputs, rare edge cases, wording, citation and run-ID bookkeeping,
and test-evidence gaps are SHOULD or NOTE — the seat records them as residuals without a rebuild. Verdict:
`VERDICT: LAND` when there is no MUST; `VERDICT: SEND-BACK` only for a MUST. Do not use LAND-WITH-FIXES.

Records in `docs/reviews/ci-pi-pin-2026-10-13/`: the plan `CHANGE.md` (research workflow, two fact-checks, sol
plan r1 92/100 with its fixes applied, one seat amendment), the seat's acceptance script `acceptance.mjs`
(installs CI's own pi line into scratch prefixes and runs the 18 drift files against it, with an unpinned
control; 23/33 at launch, 33/33 now, re-run by the seat — it does network installs, so read
`acceptance-output.txt` rather than re-running unless you want to), the title check `seat-titles.mjs` (0
missing), the seat's ten code breaks (`seat-mutate-output.txt`, 10/10 caught), build brief 1 and the builder's
CI run 38399666350 (macOS 0 failing files, Ubuntu 1 known, Windows 67). Also `HANDOFF.md` and the session entry.

Check: (1) `.github/workflows/ci.yml` and `packages/nana-pack/tests/ci-workflow.test.mjs` against CHANGE §2–§3 and
rows R-1090–R-1092: every pi install line resolves the declared tree, the value's provenance is right, and
nothing else in the workflow changed; (2) each new row has one `shall` and a cited test that pins it; (3) the
HANDOFF lines and the session entry are true; (4) any MUST under the bar. Answer with MUST / SHOULD / NOTE,
file:line, evidence and the smallest fix; a score; the last line exactly `VERDICT: LAND` or `VERDICT: SEND-BACK`.
