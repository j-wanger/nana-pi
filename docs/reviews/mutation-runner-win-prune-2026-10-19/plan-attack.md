# mutation-runner-win-prune — plan attack (one adversary)

Verdict: AMEND

AMEND. The lane is worth building, the class is ordinary, it waits on no lane, and the no-prune and no --force --force choices stand. My changes rest on probes run in a temp clone of main at 22ccd849 (macOS, git 2.50.1, Node 22), using a fixture with the same faults run through the real runner. The temp folder has been deleted.

Red today, confirmed:
- T1: 1 shard leaves 2 entries ("prunable"); 3 shards leave 4.
- T2: leaves 2 entries.
- T3: green today, as the plan says. My probe confirmed that `prune --expire now` removes a decoy, so W3 turns it red.
- T4: GIT_TRACE shows 1 remove where 4 are wanted (lock run) and 1 where 2 are wanted (drop-dotgit run).
- T5: no line in the record or the output.

A prototype of the amended design was green on all five. Its lock run made 4 removes, 300 to 320 ms apart.

Amendments:
1. **Name the entry by suffix on each retry.** Each retry now names the entry by git's documented unique suffix `<scratch base name>/wt`, not by the scratch folder's real path. The still-listed check becomes an endsWith on the porcelain path. Probe: the suffix found the entry with the scratch parent gone, where the full path failed with "is not a working tree". This removes the plan's own most-likely-wrong claim (Windows real-path/8.3/case compare) and the order dependency. The first remove stays today's full-path call, which Windows has already run in R-1231's other cases.
2. **Give T4 a real observable.** It counts `trace: built-in: git worktree remove` lines in a GIT_TRACE file and checks the gaps against the delay. It also pins "while listed": the drop-dotgit run must make exactly 2 removes. The old T4 named no observable, and its row claimed a delay that no test checked.
3. **Rows R-1770 and R-1771** drop "by the worktree's own path" and the order claim, which no test could observe. They now say the runner asks git again, so they no longer conflict with R-1774 in the lock case.
4. **W2 is replaced**, because order no longer matters. W7 is rewritten as the raw full-path list compare; my probe confirmed it turns T1 red on macOS.
5. **The dead-shard line goes to notes only**, so it prints once. T5 asserts exactly once in the output and once in the record.
6. **Feature sentence** now names the lock exception.
7. **Known limits** now name the overlap with R-1231 and say Windows is the oracle.

Conflicts: none on the runner, its config or its test. In-flight lanes edit other hunks of `REQUIREMENTS.md` and the pack README: FEAT-031's tail and README lines 412 to 462 are untouched by them. `docs/code-map.md` and `docs/requirements-tree.md` are regenerated on merge. Files the build touches:
- packages/nana-pack/lib/mutation-runner.mjs
- packages/nana-pack/lib/mutation-runner-config.mjs
- packages/nana-pack/tests/mutation-runner.test.mjs
- packages/nana-pack/README.md
- REQUIREMENTS.md
- docs/requirements-tree.md
- docs/code-map.md
- docs/reviews/mutation-runner-win-prune-2026-10-19/must-meet.md
- docs/reviews/mutation-runner-win-prune-2026-10-19/build-brief-1.md

Claim most likely wrong: that this turns R-1231's three-shard Windows case green. The cause is inferred, and the fixture faults stand in for it. If a Windows hold on the entry's files outlasts about a second, three retries 250 ms apart fall short. The runner then names the entry instead of removing it. Git for Windows' lookup of a forward-slash suffix is documented but has not been tried on Windows.
