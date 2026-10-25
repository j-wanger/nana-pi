# Review — keep-movement (each lane's review folder keeps its tree movement), 2026-10-25 (the land reviewer)

Feature: FEAT-007 · Review a specific revision independently

Class: hook (it changes `review-ledger keep`, a review tool path the land checklist runs before every final round). Threat model: honest variation in our tools' output, files and environment in scope (a repository with no committed ledger, no local `main`, a movement that cannot be computed, a `--into` folder that does not exist yet, an earlier `tree-movement.md`, a read-only or non-regular target, an item with no kept review text, Windows paths and file modes); deliberate forgery out (a hand-planted ledger, a fake `node` or `git` on PATH).

Review `git diff 36af3dda..HEAD` on `feat/keep-movement`. Main is 36af3dda (review-movement, landed). The lane's commits: db71d7f2 (plan of record, build brief 1, seat title check), b7fe4740 (build 1), fb7a5ae4 (pairs script and the independent check), cd6b8dbf (pairs at b7fe4740 and build brief 2), 5c950f45 (build 2), 89e90fc4 (pairs at 5c950f45 and notes), ed18d018 (the lane's own keep: `tree-movement.md`), and the final commit with these briefs.

The plan of record is `docs/reviews/keep-movement-2026-10-25/must-meet.md`, after one adversary pass (`plan-attack.md`; 0 MUST, 4 SHOULD, 8 NOTE). The draft kept each round's section in the machine's review store; the adversary showed the landed movement would then never reach the repository, so the seat took its option A by subtraction. `review-ledger keep --into` writes one `tree-movement.md`, the shared helper's section for HEAD against main, replacing any earlier copy (R-2910); no file and no message without a committed ledger (R-2911); a movement that cannot be computed or written leaves no new file and one warning while the review texts are still kept (R-2912); with no kept review text, keep exits 0 when it wrote the movement and 1 when it did not (R-2913). R-2905's person line now names the lane folder's file; AGENTS.md and the requirements skill say the land report points the owner there. The new name is a sealed tunable in review-round.mjs beside keep's other naming tunable.

The seat's record:
- Build 1 (small, b7fe4740): rows implemented; locked full suite 222 PASS, 0 FAIL, 2 SKIP; CI passed every leg on the first try. It reported two hand red cases that stayed green.
- Wrong-code pairs (`seat-mutate.mjs`, written by a pairs agent, confirmed by a checker agent that split items 13 and 16): 19 of 21 red at b7fe4740, with 13a (the write's catch refuses) and 16a (the final no-text refusal removed) surviving (`seat-mutate-b7fe4740.txt`). Build 2 (5c950f45) added a read-only `tree-movement.md` case to R-2912's and R-2913's tests, test file only. At 5c950f45, 21 of 21 red, 0 survived (`seat-mutate-5c950f45.txt`); pair 16a now turns R-2913 red while R-2573 stays green, because R-2573's fixture commits no ledger.
- The independent check at b7fe4740 (`independent-check-b7fe4740.md`), with scratch HOME, USERPROFILE and PI_CODING_AGENT_DIR: MATERIAL none. Every written file matched the helper's section and the script's file-written report byte for byte; replacement, the no-ledger repository, no `main`, a crashing pack copy and a missing `--into` folder all behaved as the rows say; no file leaked a path.
- The seat ran this lane's own keep before this round (`tree-movement.md` in this folder; zero kept review texts so far, exit 0), as the land checklist asks and as the seat had skipped for most recent lanes.
- No local install check: no file under `packages/nana-setup/` and no hook changes.
- map:check, readme:check, the trace, the tree check (`21 of 21 made and read by code, 21 parked`), the known-bugs check, the seat titles check (`0 missing`) and `nana-writing HANDOFF.md` (0 over, 0 passive) are clean; the frontier check reads 1196 of 1200 words.
- The launchers on main now add the tree movement to this prompt themselves; the lane folder's `tree-movement.md` holds the same report at ed18d018's parent.

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat reads that run and lands only on green.

Ask above all, as the land reviewer: is this change safe to put on main for every later keep? Can it change what keep writes for review texts, alter the kept-text checks nana-land relies on, write outside the --into folder, or fail differently on Windows?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, including your first sentence, and do not bold it.
