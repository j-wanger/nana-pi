Feature: FEAT-040 · Make and keep memory

Lane owner-profile. Class: ordinary. Threat model: honest variation in our tools' output and in the seat's own saves is in scope (two machines saving and syncing, offline saves, Windows line endings and file names, concurrent saves, a misattributed quote, a remote whose visibility cannot be checked); deliberate forgery is out.

Review `git diff origin/main...HEAD` on `feat/owner-profile`. Main is a6dcc99a. The plan of record is `docs/reviews/owner-profile-2026-10-31/plan.md`, revised after its adversary pass (`plan-attack.md`). Build briefs 1 and 2 and the build records state each change. The owner's confirmed design is `docs/memory-factory-design-2026-10-31.md`, added in this change; judge the lane against its principles 6 and 7. The 2026-10-31 entry "a private owner profile the seat saves to on its own" in `docs/sessions/2026-10.md` summarises the lane.

The change: a private profile store (init, save, show, sync, confirm, retract, supersede) using the shared record shape, a trust ladder, refusals for roles, worktrees and disabled machines, a shared pack config writer, and the owner's new lane cap (four building, two planning) in the seat guide, the rulings file, R-1140 and the city text. A subgroup under FEAT-040; R-3230 to R-3249.

The seat's record:
- Builds 1 and 2; locked full suite at 68c22e69: 245 files, 243 pass, 2 skip. CI run 41241426767 passed on all three systems.
- The real private repo exists and is verified private; no real record is saved before this lands.
- Known bugs added: seven lines in `docs/known-bugs/FEAT-040.md`, four carried from the making-station review.

Question: does the feature work for its user, the seat saving what it learns about the owner and the owner reading it back on another machine, and does the change cause a harm the review standard lists? Check especially that no owner text can reach this public repo, a public remote, stdout or CI logs; that the remote check fails closed; that two clones converge without conflict; that the trust ladder cannot be climbed by the seat alone; and that the rulings change replaces only the cap sentence.

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
