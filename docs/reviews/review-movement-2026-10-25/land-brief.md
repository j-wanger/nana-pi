# Review — review-movement (every reviewer gets the tree movement in its prompt; the last hand-made deliverables are parked), 2026-10-25 (the land reviewer)

Feature: FEAT-007 · Review a specific revision independently

Class: hook (it changes the review launchers claude-review and pi-review, which every later review and land review runs through). Threat model: honest variation in our tools' output, files and environment in scope (a reviewed tree with no committed ledger, an untracked or dirty ledger, no local `main` or no merge base, a lane on `main`, a movement report past 64 KiB or past Windows' 32,767-character command line, a cold loaded Windows start, a tree path with spaces, a linked checkout, a commit between launch and admission); deliberate forgery out (a hand-planted ledger, a fake `node` or `git` on PATH, a brief that lies about the movement).

Review `git diff d3f7f7f3..HEAD` on `feat/review-movement`. Main is d3f7f7f3 (win-test-limits, landed). The lane's commits: dffb8ab5 (plan of record, build brief 1, seat title check), b9d49659 (build brief 2), 53081c82 (build 2, the whole lane; build 1 stopped BLOCKED with its work uncommitted), f72874c4 (pairs script and the independent check), fdc0149c (pairs records and notes), and the final commit with these briefs.

The plan of record is `docs/reviews/review-movement-2026-10-25/must-meet.md`, after one adversary pass (`plan-attack.md`; 1 MUST, 4 SHOULD, 9 NOTE; all taken). Decisions: the tree movement report (R-1460) is made by the review launchers and read in the reviewer's prompt; the review timeline (R-1560) and the tree outline (R-291) are parked in their capabilities' field blocks, each with a reason and a deletion condition. A shared helper, `packages/nana-pack/lib/review-movement.mjs`, runs the pack's `scripts/requirements-moved.mjs` against `main` in the reviewed tree and never throws. claude-review puts the section between the brief and the review standard (R-2900); pi-review writes it to a file in its own temporary folder outside the checkout and passes the path as a third appended system prompt (R-2901, R-2907). A failed movement becomes one not-computed line and the round still records (R-2902, R-2908); a tree with no committed ledger gets no section (R-2903, R-2904). The ledger lines are pinned (R-2905). `scripts/requirements-moved.mjs`'s exit line no longer cuts piped output at 64 KiB on macOS (R-2906). R-2561's text widens to allow the section. The AGENTS.md and requirements-skill sentences now say the launchers add the movement and the seat's land report points the owner to it. requirements-moved.test.mjs's private fixture moved into a shared test helper, `packages/nana-pack/tests/ledger-repo.mjs`, which three test files import.

The seat's record:
- Build 1 (larger) built the lane and stopped BLOCKED, uncommitted: the seat's brief required a bare `scripts/requirements-moved.mjs` path in the requirements skill, which R-598's scaffold check cannot resolve in a generated project. Build 2 (53081c82) used the home-qualified form the skill's other lines use, kept build 1's work, and committed; its locked full suite 221 PASS, 0 FAIL, 2 SKIP. Departure reported: review-standard.test.mjs's pack-copy fixture also copies the two new modules.
- The checker prints `deliverables: 21 of 21 made and read by code, 21 parked` (main: 20 of 23, 19 parked).
- Wrong-code pairs (`seat-mutate.mjs`, 25 pairs written by a pairs agent and confirmed by a checker agent): 25 of 25 red on macOS at 53081c82, 0 survived (`seat-mutate-53081c82.txt`). Pair 13's Windows half (the section as command-line text) ran on a scratch Windows CI job and went red with `spawn ENAMETOOLONG` (`seat-win-pairs-53081c82.txt`).
- The independent check at 53081c82 (`independent-check-53081c82.md`), run with scratch HOME and PI_CODING_AGENT_DIR: MATERIAL none. Both launchers matched an 81 KB report byte for byte; with no `main` each sent one not-computed line, recorded its round and exited 0; a repository with no committed ledger got no section; pi-review left nothing in the checkout and removed its folder.
- CI at 53081c82: every leg passed except the Windows suite, which failed one worker-lane check ("wall-clock ceiling kills the worker process group"); the lane touched no worker code, and main passed it at a6f7921c and d3f7f7f3 (a Windows first-try flake, inferred; recorded for the next lane's notes). All nine lane rows passed on that Windows leg, R-2907 included. CI runs again at the reviewed tip on the draft pull request, and the seat lands only on green.
- No local install check: no file under `packages/nana-setup/` and no hook changes.
- map:check, readme:check, the trace, the tree check, the known-bugs check (`names=0 sizes=0`), the seat titles check (`0 missing`) and `nana-writing HANDOFF.md` (0 over, 0 passive) are clean; the frontier check reads 1198 of 1200 words.
- This lane's own reviews run the main checkout's launchers, which predate the change, so the seat pastes the movement here by hand one last time.

Tree movement (`node "$HOME/nana-pi/scripts/requirements-moved.mjs" --root . --base main`, run in the lane worktree before this brief's commit):

```
tree movement d3f7f7f..fdc0149: 13 rows in 2 features
FEAT-007 · Review a specific revision independently
  R-1560 Parked lines changed
  R-2561 text changed
  R-2900 new (implemented)
  R-2901 new (implemented)
  R-2902 new (implemented)
  R-2903 new (implemented)
  R-2904 new (implemented)
  R-2905 new (implemented)
  R-2906 new (implemented)
  R-2907 new (implemented)
  R-2908 new (implemented)
FEAT-028 · Maintain requirement identity and trace links
  R-291 Parked lines changed
  R-1460 Made by/Read by lines changed
```

Ask above all, as the land reviewer: is this change safe to put on main for every later review and land review? Can the movement step throw past its guards, block a review past its limits, write into a review checkout, leave temporary files behind, or send a reviewer a cut or wrong section on any platform?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, including your first sentence, and do not bold it.
