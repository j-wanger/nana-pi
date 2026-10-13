# Plan review — lane fresh-install (gpt-5.6-sol), 2026-10-13, the ONE round a small lane gets

Review the change declaration `CHANGE.md` in this folder. The lane makes every user-facing pi install command
and the missing-pi hint carry CI's pinned `PI_VERSION` and `--before` cutoff (declared once in `ci.yml`'s env,
read by name through a new `pi-pin.mjs`), and closes the non-blocking points the install-check final reviews
left (README Git Bash claim, Jake's check page step 2 PowerShell-only, tests pinning R-1071/R-1078/R-1079, the
promised failure diagnostics, a case-insensitive Path lookup, two dead doctor note labels). Seat reading of its
own scope decision: commands that carry `--ignore-scripts` today keep it, and only the cutoff is added. Threat
model: honest variation in our tools' output in scope; deliberate forgery out.

**Materiality bar (Jake, 2026-10-13) — apply it to every finding.** A MUST is a defect a real user or one of our
own tools would plausibly hit, with a consequence that matters: data lost or corrupted, a security or review
boundary bypassed in practice, wrong output someone acts on, a broken install or hook, or a regression of
behaviour main has today. Name the realistic input and the consequence; if you cannot, it is a SHOULD or NOTE.
Contrived inputs, rare edge cases, wording, citation bookkeeping and test-evidence gaps are SHOULD or NOTE.
`VERDICT: LAND` when no MUST stands; `VERDICT: SEND-BACK` only for a MUST. Do not use LAND-WITH-FIXES.

Check: (1) would a user who follows any changed command on macOS, Windows PowerShell or cmd get a working pi
1.0.2 (you may run `npm` with a scratch `--prefix`; never install globally); (2) can the hint or a README drift
from CI again without a test failing; (3) each row has one `shall` and §5's exact titles and mutation pairs pin
it; (4) anything that should block the build. MUST / SHOULD / NOTE with file:line, evidence and the smallest fix;
a score; the last line exactly `VERDICT: LAND` or `VERDICT: SEND-BACK`.
