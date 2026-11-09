Feature: FEAT-031 · Run checks reliably and without contaminating work
Serves: roadmap step 4 (records move): old review records leave the working tree, and the priority's line measure counts code only.

# Review brief 1: records-move

Review the whole lane: `git diff main...HEAD` (most of it is deletions under `docs/reviews/`; read the check, the tests, the README and the requirement rows closely, and sample the deletions). Plan: `docs/plan/records-move.md` (M1–M5, R-3928–R-3934, with its "Changed after the adversary" paragraph). Evidence: `docs/plan/records-move-evidence.md` and `docs/plan/records-move-followup-evidence.md`. The builder removed 222 folders, 3,453 files and about 1.43 million lines, and kept 126. Build 2 changed the check so folders created after the move are always allowed; the seat merged main twice.

Questions: is any removed folder still read by code, a test, a README, REQUIREMENTS.md or a design doc (check basenames and brace forms too)? Does the README's git command really recover a removed folder? Can the check block a future lane? Does the new OBJECTIVE.md measure wording keep the owner's meaning? Threat model: honest drift in references; forgery out.
