# Plan review — lane ci-pi-pin (gpt-5.6-sol), 2026-10-13

Review the change declaration `CHANGE.md` in this folder: CI pins pi's dependency resolution with npm's
`--before` after `@earendil-works/pi-codemode` 1.2.0 (2026-10-12 23:00Z) broke fresh installs of pi 1.0.2 for
code that imports pi's modules (18 macOS suite files red since then; main's run 38393632339 included). Lane
class: small and URGENT (Owner 2026-10-11: urgent fixes ship alone, harden later; a small lane gets ONE plan
review — so say everything now). Threat model: honest variation in our tools and registries in scope; deliberate
forgery out.

Records here: `research-npm.md`, `research-ci.md`, `research-repo.md` (the seat's research workflow, 2026-10-13)
and the two adversarial fact-checks `factcheck-external.md`, `factcheck-repo.md`, whose WRONG items the seat
folded into CHANGE.md. The repo is at `main` `3f5151f` (cc-hooks-windows landed). The parallel lane
`feat/install-check` (`ca3fed2`, main merged in) adds an install-check job to `ci.yml` with its own pi install
line; you can read it with `git show feat/install-check:.github/workflows/ci.yml`.

Check: (1) the fix is correct and complete — every CI line that installs pi resolves the declared tree, and the
cutoff's provenance and window are right (you may run `npm view` and scratch installs under a temporary
`--prefix`; never install globally); (2) the three rows each have one `shall`, and the §5 checks pin every
clause (would each named mutation really turn its check red?); (3) nothing in §3's "What NOT to do" is the
better fix; (4) the sequencing with feat/install-check; (5) the residuals and the decisions the seat took in §6
(README follow-up lane; stay on pi 1.0.2) — say if either should be the owner's call instead; (6) anything that
should block the build. Answer with MUST / SHOULD / NOTE, file:line, evidence and the smallest fix; a score out
of 100; the last line exactly one of `VERDICT: LAND`, `VERDICT: LAND-WITH-FIXES`, `VERDICT: SEND-BACK`.
