# Lane clean-revision — build brief 3 (2026-10-19 · feat/clean-revision · on 163afc3)

**Builder: Claude Sonnet 5, a subagent in `<worktrees>/clean-revision`.** Same rules as before: single test files only, in the foreground, each under 9 minutes; no full suite; no push; no `HANDOFF.md`, `docs/sessions/` or the seat's review files.

Round 1 said LAND from both reviewers (Opus, Fable). Both raise the same SHOULD, and it is cheap to make true now.

## R-1375 promises more than git does

The scratch `git add -A` re-hashes files against a stat-less index. When an object it would write already exists in the real store (reached through the alternates file), git "freshens" that object, updating its mtime. Opus measured it: a clean 5-file repo touched 6 loose objects; a dirty edit in a 2-file repo touched the unchanged file's blob and the trees; after `git gc` the pack file's mtime moved. No git setting turns freshening off. Content, size and mode stay the same; nothing is added or removed; freshening only delays gc pruning. R-1375 promises every git-folder entry keeps its mtime, and the README says derivation "never writes the repository". The R-1375 check misses this because its fixture's only file is the one it edits.

Do this:
1. Reword R-1375 in `REQUIREMENTS.md` to what holds, one `shall`, EARS form: WHEN the revision of a dirty or clean tree is derived in a repository with no clean or smudge filter, no entry shall be added to or removed from the repository's git folder, every entry shall keep its size and mode, and no repository hook shall run — written as ONE shall (e.g. "the repository's git folder shall keep the same set of entries, each with its size and mode, and no repository hook shall run" is two; choose a single-shall wording such as "the derivation shall leave the repository's git folder with the same entries, each of the same size and mode, and run none of its hooks"). Keep the row `implemented` only if its check passes. Run `npm run req:tree`.
2. Extend the R-1375 check (no new check call): give its fixture at least one committed file the test does NOT edit, derive both a clean and a dirty revision, and assert the git folder keeps the same entry set and each entry's size and mode, and that the hook log stays empty. Drop the mtime assertion. Show the extended check red with each scratch pin removed (splitIndex, hooksPath) and with the alternates replaced by a real copy of the objects into the real store if that is a meaningful wrong code; restore.
3. README (`packages/nana-pack/README.md`, the review-tools section that says derivation "never writes the repository"): say it adds and removes nothing in the repository and runs no hook, and that git may refresh the timestamps of objects it re-hashes. Run `npm run readme:check`.
4. Run review-ledger, immutable-review, land and path-spelling test files, the three requirement tests and `map:check`; all exit 0.

## Report

First line `VERDICT: DONE | PARTIAL | BLOCKED`. Then the commits, each command with its exit code, and the red-then-green evidence for the extended check.
