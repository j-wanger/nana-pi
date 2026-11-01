Feature: FEAT-042 · Measure what a builder's context is for

Lane builder-anatomy. Class: ordinary. Threat model: honest variation in our tools' output is in scope (session shapes across pi versions, briefs changed by git line-ending conversion, compactions and context edits, oversize units, sessions from other projects); deliberate forgery, such as a planted session or brief written to skew the counts, is out.

Review `git diff origin/main...HEAD` on `feat/builder-anatomy`. Main is 8c665dcd. The plan of record is `docs/reviews/builder-anatomy-2026-11-01/plan.md`, revised after its adversary pass (`plan-attack.md`). `build-brief-1.md` and `build-1-record.md` record the build. The 2026-11-01 entry "the builder's context, split by what each part is for" in `docs/sessions/2026-10.md` summarises the lane.

The change: `apps/bench/anatomy.mjs` with five subcommands (segment, report, sample, agree, assemble), a sealed config, and counts-only reports over a private store. No subcommand spends. FEAT-042; R-3270 to R-3278; A-092.

The seat's record:
- Locked full suite at 1ce8d664: 248 files, 246 pass, 2 skip. CI run 41271177583 passed on all three systems. The seat's later commits change only notes and the measurement record.
- The seat ran the measurement over real sessions privately; `anatomy-counts.md` holds counts only. 153 of 154 recorded builds split (bar 90%). Two model labellers agree at κ 0.82; the tagging rules agree with their consensus at 0.31, below the 0.6 bar. As the plan pre-registered, rule-based function shares are not reported as findings, and the seat chose a model labeller as the next lane.
- Known bugs: three lines in a new `docs/known-bugs/FEAT-042.md`, including the failed rules bar.

Question: does the feature work for its user, the seat measuring builder context, and does the change cause a harm the review standard lists? Check especially that no subcommand prints or commits private unit text; that writers refuse folders inside a git checkout; that the sample is blind (no part, heading or rule); that agreement uses the imported kappa; and that assembly with a dropped or staged function keeps every other span intact. A failed rules bar is a measured result recorded as a known bug, not by itself a reason to send back.

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
