# Review — the install check on macOS and Windows, 2026-10-13 (gpt-5.6-sol build review and gpt-6-astra land review, in parallel)

Review `git diff a907b45..HEAD` on `feat/install-check` (main `a907b45` — the Claude Code hooks on Windows and the
CI pin — is merged in). Threat model: honest variation in hosted runners and machines in scope (Git Bash
present, PowerShell primary, backslash paths, a caller environment carrying our override variables); deliberate
forgery out. Lane class: CI workflow shape plus a new command.

**Materiality bar (Owner, 2026-10-13) — apply it to every finding.** A MUST is a defect a real user or one of our
own tools would plausibly hit under the threat model above, with a consequence that matters: data lost or
corrupted, a security or review boundary bypassed in practice, wrong output someone acts on, a broken install,
hook or CI gate, the check passing when nana is broken (or failing when it works), or a regression of behaviour
main has today. Name the realistic input and the consequence; if you cannot, it is a SHOULD or NOTE. Contrived
inputs, rare edge cases, wording, citation bookkeeping and test-evidence gaps are SHOULD or NOTE — the seat
records them as residuals without a rebuild. Verdict: `VERDICT: LAND` when there is no MUST; `VERDICT: SEND-BACK`
only for a MUST. Do not use LAND-WITH-FIXES.

Records in `docs/reviews/install-check-2026-10-12/`: the plan `CHANGE.md` (seat planning workflow, two
fact-checks, sol plan r1–r3 at 82, 78, 100), nine luna build briefs (`build-brief-1`, `-2a`…`-2e`, `-3a`, `-3b`,
`-4`) and their outcomes in the session entry, the seat's acceptance script `acceptance.mjs` (runs the command
like a user, checks the real home is untouched, injects four faults in scratch worktrees; 30/30 — it runs a real
install, so prefer reading `acceptance-seat-final.txt`), the title check `seat-titles.mjs` (0 missing for 2d, 2e,
3a, 3b, 4), and the seat's mutation runner `seat-mutate.mjs` (44 breaks, all caught at the final tip — do NOT run
it; read `seat-mutate-final-output.txt`). CI run 38406425780 shows the `install-check` job green on macOS and
Windows with every line PASS and both known-red lists empty; run 38409020787 on the merged tip concluded success.

Check: (1) `packages/nana-setup/lib/install-check.mjs`, `lib/install-check-config.mjs`, `bin/install-check.mjs` and
the `install-check` job in `.github/workflows/ci.yml` against CHANGE §2–§3 and rows R-1070–R-1084, R-597 and
R-1032 — above all, could the check report PASS while install or a hook is broken on a real machine, or FAIL
while it works; (2) each row has one `shall` and a cited test that pins it; (3) the README "Install check"
section and every command it names; (4) the HANDOFF lines, the session entry and the owner's check page are true;
(5) any MUST under the bar. Answer with MUST / SHOULD / NOTE, file:line, evidence and the smallest fix; a score;
the last line exactly `VERDICT: LAND` or `VERDICT: SEND-BACK`.
