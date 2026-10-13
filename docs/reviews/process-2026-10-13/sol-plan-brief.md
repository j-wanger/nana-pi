# Plan review — lane process (gpt-5.6-sol), 2026-10-13, round 1 of at most 2 (FORMAT lane)

Review the change declaration `CHANGE.md` in this folder and the three proposed texts beside it
(`review-standard.proposed.md`, `shared-text.proposed.md`, `builder-preamble.proposed.md`). The lane writes Jake's
2026-10-11 and 2026-10-13 process rulings into the shared working pattern, gives pi-review one standard text it
appends to every review (the last-line verdict and the materiality bar), refreshes the builder preamble, and fixes
the fresh-machine step 8. The parallel test runner was split into its own later lane (`test-jobs`); over-cap
enforcement was considered and not pursued (see the "Seat revision" section). Threat model: honest variation in
our tools' output in scope; deliberate forgery out.

**Materiality bar (Jake, 2026-10-13) — apply it to every finding.** A MUST is a defect a real user or one of our
own tools would plausibly hit, with a consequence that matters: data lost or corrupted, a security or review
boundary bypassed in practice, wrong output someone acts on, a broken install or hook, or a regression of
behaviour main has today. Name the realistic input and the consequence; if you cannot, it is a SHOULD or NOTE.
Contrived inputs, rare edge cases, wording, citation bookkeeping and test-evidence gaps are SHOULD or NOTE.
`VERDICT: LAND` when no MUST stands; `VERDICT: SEND-BACK` only for a MUST. Do not use LAND-WITH-FIXES.

Check: (1) the shared text and the review standard say what the rulings say (sources: `HANDOFF.md`,
`docs/sessions/2026-10.md`, and the research files here) and nothing a downstream project would trip on — the
shared section fans out to every nana project through `nana-setup project`; (2) pi-review's change cannot stop a
review from running or recording on a real machine, and other repos' existing review briefs still get a
recordable verdict; (3) each row has one `shall` and §5's exact titles and mutation pairs pin it; (4) anything
that should block the build. MUST / SHOULD / NOTE with file:line, evidence and the smallest fix; a score; the
last line exactly `VERDICT: LAND` or `VERDICT: SEND-BACK`.
