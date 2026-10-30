Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane selective-ci. Class: gate (it adds a seat command and makes `ci.yml`, `scripts/test.mjs` and the test-runner config gate files). Threat model: honest variation in GitHub and gh output, the environment and Windows in scope (cancelled, in-progress and pull-request runs, other branches and workflows, a missing or unauthenticated gh, a commit missing from the local clone); deliberate forgery out.

Review `git diff main...HEAD` on `feat/selective-ci`. Main is d797a9f1. The plan of record is `docs/reviews/selective-ci-2026-10-30/plan.md` revision 3, after one adversary pass (`plan-attack.md`). The owner chose path rules plus test selection with a full run on main; the planner measured that selection saves only 1 to 2 percent of CI time, so the seat dropped selection (posted as a default on issue 274) and kept the main-run check. R-3183 to R-3185 are built; R-3178 to R-3182 and R-3186 stay planned with measurement notes.

The change: `nana-main-ci` (bin and lib) reports the newest finished, non-cancelled push run of the CI workflow on main and names each red leg. With `--post`, it scans the title and body with the identity scan and opens one `next` issue, skipping when an open issue has the same title. The session-start frontier line names the command; the seat guide gains one sentence. R-597 gains workflow evidence; R-2961 gains three gate paths.

The seat's record:
- Build 1 BLOCKED on the seat's unclear map wording; build 2 regenerated the map; build 3 fixed the independent check's one material finding (cancelled runs read as red).
- Wrong-code pairs: the builder's ten plus the seat's four (`seat-pairs.md`), each red then green, at 417943ab and e9b29b28.
- Independent check (`independent-check-a3ce7b7c.md`): MATERIAL one (cancelled runs), fixed in build 3; two minor findings are FEAT-031 known bugs.
- Locked full suite at e9b29b28: 241 files, 239 pass, 2 skip. CI run 41079703595 passed on all three systems.
- Install check on macOS from the seat's shell: every step PASS. Inside the builder it failed its post-edit step; a known bug records that.

Ask above all, as the land reviewer: is this change safe to put on main? Can the command post an issue it should not (unscanned, duplicate, from a builder or reviewer, for a green or cancelled run), can the new gate entries change how other lanes are classed in a harmful way, and does it behave differently on Windows?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
