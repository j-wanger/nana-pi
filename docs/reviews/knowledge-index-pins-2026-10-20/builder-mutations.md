# Builder mutation proof — knowledge-index-pins

Date: 2026-10-20

Each mutation changed only the named `lib/` file, ran one test file, and was restored with `git checkout -- <path>` before the next mutation. No `lib/` mutation is committed.

| Requirement | Wrong code | Test file | Required check result | File exit |
|---|---|---|---|---:|
| R-235 | Removed `.git` from `SKIP_DIRS` | `incremental-build.test.mjs` | RED — `the walker skips a .git folder and a nested raw folder under an articles root` | 1 |
| R-235 | Removed `raw` from `SKIP_DIRS` | `incremental-build.test.mjs` | RED — `the walker skips a .git folder and a nested raw folder under an articles root` | 1 |
| R-203 | Deleted only `if (e.isSymbolicLink()) continue;` | `incremental-build.test.mjs` | GREEN, as expected; `Dirent.isDirectory()` still does not follow the link, so no product change was made | 0 |
| R-203 | Replaced the link guard and `Dirent` directory test with `fs.statSync(p).isDirectory()`, which follows links | `incremental-build.test.mjs` | RED — `the walker skips a linked folder under an articles root (a junction on Windows)` | 1 |
| R-236 | Replaced the unchanged size-and-mtime fast-path condition with `false` | `incremental-build.test.mjs` | RED — `a file whose size and mtime are unchanged is not read: same-length new bytes stay unindexed` | 1 |
| R-204 | Made `rowsFor` always call `parseArticle` | `incremental-build.test.mjs` | RED — `first build rows = 2 articles + 2 ledger entries` | 8 |
| R-882 | Removed the fence toggle | `ledger-parse.test.mjs` | RED — `fenced template lines are not rows` | 5 |
| R-204 | Dropped digit-started entries | `ledger-parse.test.mjs` | RED — `numbered entry line is a row` | 3 |
| R-204 | Removed continuation folding | `ledger-parse.test.mjs` | RED — `3-physical-line entry folds into one row` | 1 |
| R-211 | Counted only a `.git` directory | `discovery.test.mjs` | RED — `a git WORKTREE (.git file) counts as a repo` | 5 |
| R-211 | Counted only a `.git` file | `discovery.test.mjs` | RED — `repo with .git DIR contributes each convention subdir it has` | 12 |
| R-884 | Dropped `discovered: true` | `discovery.test.mjs` | RED — `discovered roots are articles, and marked` | 3 |
| R-884 | Broke after the first existing convention subdirectory | `discovery.test.mjs` | RED — `repo with .git DIR contributes each convention subdir it has` | 5 |
| R-232 | Opened the build lock with `w` instead of `wx` | `hook.test.mjs` | RED — `three sequential lock attempts in one process: exactly one wins`; RED — `build() fails fast while another builder holds the lock` | 7 |
| R-232 | Wrote no pid into the lock | `hook.test.mjs` | RED — `the lock file records the owning pid` | 1 |
| R-232 | Made release remove any lock | `hook.test.mjs` | RED — `release leaves a lock owned by ANOTHER pid alone` | 1 |
| R-232 | Skipped lock acquisition in `build()` | `hook.test.mjs` | RED — `build() fails fast while another builder holds the lock` | 1 |
