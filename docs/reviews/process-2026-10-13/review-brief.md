# Review — the review standard and the plan rules, 2026-10-13 (gpt-5.6-sol build review and gpt-6-astra land review, in parallel)

Review `git diff 9974218..HEAD` on `feat/process` (based on `main` `9974218`). Threat model: honest variation in our
tools' output in scope (a reviewer that writes its verdict first; another repo's brief; a missing or blank standard
file); deliberate forgery out. Lane class: FORMAT — it changes what every reviewer and builder is told.

**Materiality bar (Owner, 2026-10-13) — apply it to every finding.** A MUST is a defect a real user or one of our own
tools would plausibly hit, with a consequence that matters: data lost or corrupted, a security or review boundary
bypassed in practice, wrong output someone acts on, a broken install or hook, or a regression of behaviour main has
today. Name the realistic input and the consequence; if you cannot, it is a SHOULD or NOTE. Contrived inputs, rare
edge cases, wording, citation bookkeeping and test-evidence gaps are SHOULD or NOTE. `VERDICT: LAND` when no MUST
stands; `VERDICT: SEND-BACK` only for a MUST. Do not use LAND-WITH-FIXES. (This lane writes that bar into
`packages/nana-pack/prompts/review-standard.md`; the pi-review on PATH is main's, so the brief still carries it.)

Records in `docs/reviews/process-2026-10-13/`: the plan `CHANGE.md` (planning workflow, two fact-checks, a seat
revision that cut it from 17 rows to 12; sol plan r1 LAND 98/100), the proposed texts the build copies byte for byte,
Sonnet's build 1, the seat's acceptance script (51/51), title check (0 missing), and the seat's mutation runner
(`seat-mutate.mjs`; 50/53 at the build, 53/53 after the seat scoped the R-1109 check to its own line — read
`seat-mutate-build1-output.txt` and `seat-mutate-1109-rerun.txt`; do not run it). Draft PR #6's CI run 38433505839:
macOS suite and both install-check jobs green. Also `HANDOFF.md` and the session entry.

Check: (1) `pi-review` still starts, records and lands reviews for every existing caller — this repo and the other
repos that run it from main — and refuses only when the standard file is missing, a directory or blank; (2) the
shared working-pattern text says what the owner ruled and nothing a downstream project would trip on (it fans out through
`nana-setup project`); (3) the builder preamble and the README step 8; (4) each row has one `shall` and a cited test
that pins it; (5) the HANDOFF lines and session entry are true; (6) any MUST under the bar. MUST / SHOULD / NOTE with
file:line, evidence and the smallest fix; a score; the last line exactly `VERDICT: LAND` or `VERDICT: SEND-BACK`.
