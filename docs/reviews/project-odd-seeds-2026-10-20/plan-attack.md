# project-odd-seeds — plan attack (one adversary)

Verdict: AMEND

AMEND. The plan's bugs are real and its tests are red today. One mechanism changes, two tests and one row get wider, and nothing waits on another lane.

What I probed (a temp clone of main 72abe19a on macOS, with a temp home):
- Every "what is wrong" claim reproduces. A dangling AGENTS.md link and a dangling or folder .pi/nana-pack.json read "unchanged". A file at docs and a dangling .pi link crash with a stack trace. A dangling CLAUDE.md is never named. `<date>` inside a --name is filled. The dry-run region row says skipped where the real run says unchanged.
- My draft of the eight tests fails 7 of 8 on main; M8 passes, as the plan says.
- A prototype of the amended design passes 8/8 in 2.3 s.
- On the prototype: project 124/124, project-working-region 28/28, entry-guidance 17/17, project-dismiss 14/14, doctor-quiet 7/7, trust 13/13, project-key 20/20. The plan's two project fails came from a copy that was not a git checkout.
- 12 of the 13 wrong-code pairs turn their check red: W1, W2, W3, W4, W5, W8, W9, Wa, Wb, Wc, Wd, We. W10 is untried.

What I changed:
1. M5 mechanism. The plan sets byHand flags by hand in four places in checkProject. That copies setup's decisions inside the check, and that drift is the bug being fixed. Doctor already solves it: install's dry run decides doctor's last line, and the README says so. The amended design runs `setupProject(dir, layout, {dryRun: true})` in runProject's check path. A ✗ line is project's only when the dry run would change that label; this month's log maps to `docs/sessions/YYYY-MM.md`. A SetupError (a dismissed folder) keeps today's line. checkProject carries no byHand flag.
2. R-2423 adds "and write nothing". A prediction run without dryRun would otherwise pass the mixed case (pair We). M5 asserts the missing month log is still missing after each check.
3. M3 and R-2421 are wider. The row claimed every odd shape; the test tried one dangling link. M3 now also uses a folder at HANDOFF.md and a file at docs, and the row says "that path or a folder on it".
4. M4 covers six seed paths × {dangling link, folder}, plus a CLAUDE.md link and folder beside a regular AGENTS.md. The row claimed every seed path.
5. Brief: the seat runs install-check before land (the lane touches packages/nana-setup/); update nana-setup.mjs @outputs and @effects; leave runDoctor untouched so the lane stays ordinary. Two known limits added: a dismissed folder keeps today's line; an unwritable AGENTS.md is still sent to project (inferred).

Class: ordinary. It touches only the project path, not runDoctor, install, a hook, an extension, the gate or the land tools.

Files the build touches: packages/nana-setup/lib/project.mjs; packages/nana-setup/bin/nana-setup.mjs (runProject and the header only); packages/nana-setup/tests/project-odd-seeds.test.mjs (new); packages/nana-setup/README.md; REQUIREMENTS.md; docs/requirements-tree.md and docs/code-map.md (regenerated).

Conflicts:
- In-flight lanes: none (worktree diffs checked).
  - win-copy-backup-noise edits fsops.mjs but not seedFile; this lane does not edit fsops.mjs.
  - objective-path-shapes edits objective.ts but not trustRecord.
  - Six lanes edit packages/nana-setup/README.md in other sections: text merges.
- This slate (inferred; neither plan seen):
  - knowledge-index-recover may change stepKnowledgeRefresh in project.mjs. Its dry run must stay read-only and spawn nothing, because --check now runs it.
  - claude-config-dir may touch resolveLayout in nana-setup.mjs.
- Land order: this lane is independent. The later of these three lanes merges main and re-runs project-odd-seeds.test.mjs and project.test.mjs.

Most likely wrong: that the eight checks pass on the Windows CI leg. They are proven on macOS only. Windows CI already runs dangling-link fixtures in project.test.mjs, but the dangling `.pi` link where a folder belongs is new there. The seat reads this file's Windows result before land.

The prototype diff and draft test are in this session's scratchpad (project-odd-seeds-proto.diff, project-odd-seeds.draft.test.mjs). The seat may give them to the builder; they are not in the brief because the brief may be committed. No probe processes remain.
