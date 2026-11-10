# Record history

Lane records (briefs, plans, build and review texts, CI excerpts and evidence) live in
`~/nana-records/<project>/<lane>/`, never in the repository.
On Windows, use `%USERPROFILE%\nana-records\<project>\<lane>\`.
`<project>` is the main checkout's folder name, the folder that holds the shared git directory, not the lane worktree's name. The store is a plain private folder,
not configuration; old records remain in git history.
Runtime dependency: Git for reading history.

## Older archive

The earlier archive commit is `5722fc0353e8ca718fe420bfef1f006ec3b3817c`.
From the repository root, list an archived folder and read its brief:

```sh
git show 5722fc0353e8ca718fe420bfef1f006ec3b3817c:docs/reviews/adopt-closes-check-2026-10-19 5722fc0353e8ca718fe420bfef1f006ec3b3817c:docs/reviews/adopt-closes-check-2026-10-19/build-brief-1.md
```

## Remaining records

The last pre-removal commit is `5667a2515bdc2152efc90ec6a4c1017f20da41c4`.
It contains the remaining reviews, plans, evidence and session archives.
For example, the agents-trim brief exists here but not in the older archive:

```sh
git show 5667a2515bdc2152efc90ec6a4c1017f20da41c4:docs/reviews/agents-trim 5667a2515bdc2152efc90ec6a4c1017f20da41c4:docs/reviews/agents-trim/review-brief-1.md
git show 5667a2515bdc2152efc90ec6a4c1017f20da41c4:docs/plan 5667a2515bdc2152efc90ec6a4c1017f20da41c4:docs/plan/agents-trim.md
git show 5667a2515bdc2152efc90ec6a4c1017f20da41c4:docs/evidence 5667a2515bdc2152efc90ec6a4c1017f20da41c4:docs/evidence/land-fix-red/report.md
git show 5667a2515bdc2152efc90ec6a4c1017f20da41c4:docs/sessions 5667a2515bdc2152efc90ec6a4c1017f20da41c4:docs/sessions/2026-10.md
```

Substitute another historical folder and file in the object names to read it.
The README check executes each command without a shell.
