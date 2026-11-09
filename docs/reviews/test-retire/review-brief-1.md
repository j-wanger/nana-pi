Feature: FEAT-031 · Run checks reliably and without contaminating work

# Review brief 1: test-retire

Review the whole lane: `git diff main...HEAD` on branch feat/test-retire.

Plan: `docs/plan/test-retire.md` (What changes 1–4, Validation), with the list `docs/plan/test-retire-list.md`. Builder report: `docs/evidence/test-retire/REPORT.md`, which holds the deletion table, the sweep table and departures (the builder retired six Lane A files where the plan said eight; check its stated reason).

Questions:
- Does every deleted test or case either guard nothing live, or have its live protection kept — moved into a kept file, or covered by the new direct repo-check CI step in `.github/workflows/ci.yml`?
- Do R-3777, R-3782 and R-3864 stay implemented with their cases moved, not weakened?
- Do the moved keep files now run on pull requests (module or land pack), and does no kept live guard sit in a pack PR CI never runs?
- Does the new CI step run each checker once, without a short child limit, on both pull requests and main?

Threat model: honest timing and platform variation in our tools' output is in scope; deliberate forgery is out.
