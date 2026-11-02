Feature: FEAT-044 · Deliver memory to each role

Lane seat-memory-push (Lane B). Class: hook. Threat model: honest variation in our tools' output is in scope (missing pointer or marker, damaged profile JSON, slow git, linked worktrees, any `NANA_ROLE`, `CI`, the `memoryPush: false` switch, records of every trust, source and kind); deliberate forgery, such as a planted store or hand-made events, is out.

Review `git diff origin/main...HEAD` on `feat/seat-memory-push`, ignoring the Lane A files already on main. The plan of record is `plan.md` in this folder (revision 2 after `plan-attack.md`); this lane is its "Lane B". `build-brief-b1.md`, `build-report.md` and `build-brief-b2.md` record the builds. `independent-check-0847dabe.md` is the lane's independent check; `seat-install-check.txt` is the seat's macOS install check; `seat-mutate.mjs` and `mutation-run.txt` are the wrong-code pairs (12 of 12 red). The 2026-11-01 entry "the seat gets a small memory bundle at session start" in `docs/sessions/2026-10.md` summarises the lane.

The change: the bundle maker, renderer and seat push assembler (`memory-bundle.mjs`, `memory-render.mjs`, `memory-push.mjs`, `memory-bundle-config.mjs`), the shared-memory SessionStart hook calling the push, the repository-resolution and renderer moves, and `profileGit`'s optional third argument. R-3412 to R-3421.

Question: does the feature work for its user, the seat, which should get a small ranked bundle of its private memory at session start without losing the shared index; and does the change cause a harm the review standard lists? Check especially that the hook never fails or overruns a session start, that every no-push case prints main's bytes, that no record text reaches a builder, reviewer, log, stderr or the repository, and that the moved helpers leave their existing callers unchanged.

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
