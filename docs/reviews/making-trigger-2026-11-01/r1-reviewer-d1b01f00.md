No MUST finding stands. The change does what the brief asks for the seat and for every land. I found one SHOULD that will matter in a few months, plus some notes.

## What I checked

**Land starter.** It can't change a land's outcome, exit code or earlier output.
- `runLand` (`nana-land.mjs:312-325`) calls the starter only when the land returned code 0 and the lane is known.
- It calls it after `runRecordedLand` has fully returned, so after containment and the review-lock release. Any throw becomes the fixed `memory: not started` line.
- The starter's own reads are inside a `try` (`memory-run.mjs:134-137`). The child gets `stdio: 'ignore'`, so it holds no output pipe and the land returns at once.
- The extra `git branch --show-current` call is read-only and its errors are caught.
- All of nana-land's imports are local files: I walked the 43 modules it now loads. A fresh `import()` loads cleanly.

**No test or CI run starts a real run or spends.**
- Only `main()` passes the real starter.
- The two tests that run the land CLI (`land.test.mjs:615`, `:671`) use the branch `integration`, so the lane is null and nothing starts.
- No test runs `nana-memory.mjs` or `scripts/memory-run.mjs`.
- `runMemory` never builds a model runner itself; tests always inject one.
- Both `runMemory` and `startMemory` stop under `CI` or any `NANA_ROLE`.

**Units done once, never re-sent.** These are the only ways a unit is marked done:
- an ask, with its record;
- a valid reply;
- a completed but malformed reply, marked once as `unclassified`;
- a turn with no seat message before it, marked `skipped`.

A call that fails (`ok:false`) leaves its units pending. Seen files are written inside the same lock step as the records. A merge that fails partway leaves files uncommitted; the next run commits them, then skips the re-sent units by unit key, so there is one record and no loss.

**Seat saves beside a run.** The run holds the clone lock only for local steps: a 0 ms try first, then a 1 s wait. Fetch, model calls and push happen outside it. Saves now go through `mergeMemory`, and damaged project files are skipped. An older machine without this change still syncs, because the new files arrive already committed.

**Owner text.** Output is fixed words and counts. Store, evidence copies, ledgers and lane requests all live in the private clone or its git folder. The runner is fixed to `claude`.

**Tests.** I re-ran `memory-run`, `memory-run-recovery` and `memory-run-seals`: all pass.

## SHOULD

- **Review lessons will silently stop in about 80 days.** `pendingUnits` lists landed review files with `git ls-tree -r --name-only refs/heads/main -- docs/reviews/` through `profileGit` (`memory-run.mjs:64-65`). `profileGit` caps output at 1 MiB.
  - nana-pi's listing is 255 KB now. It grew about 8–13 KB a day over the last two weeks, so it passes 1 MiB around late January 2027.
  - Then git fails with `ENOBUFS` and the allowed set is empty, so every review file is skipped.
  - Lands stop making review lessons, and `status` stops counting them as pending, so nothing shows the change.
  - Fix: list only the matched lane folders, or raise the buffer for this call.

## NOTE

1. **First lock step says "busy" for any failure** (`memory-run.mjs:101-102`). A dirty clone, a failed rebase or a failed commit all report `memory: busy` on every run; build 4 fixed this only for the second step. Units stay pending.
2. **Branch name is fixed.** The `refs/heads/main` listing means a repository whose main branch has another name never gets review units.
3. **Rare lock race.** In `acquireMemoryLock` (`memory-run.mjs:36`), if the holder releases between our `EEXIST` and our read, `statSync` throws `ENOENT` past the `catch`. On the day lock this aborts the whole extraction after spend; the units are re-sent next run, nothing is lost.
4. **Forks may be re-sent.** Unit keys include the session id (`memory-store.mjs:14`). The fork test keeps the same session id. If real Claude Code forks rewrite it on copied entries, those turns are sent again.
5. **Windows runner assumption has no known-bug line.** Plan A6 says an npm-installed `claude.cmd` won't start from `spawnSync("claude")`, so every call fails and units stay pending. `FEAT-040.md` doesn't record it.
6. **Seat save can briefly say "not pushed".** The run's fetch runs outside the clone lock, so it can collide with a seat save's fetch in the same clone. The save is kept and pushed at the next sync.
7. **Merge cost grows with the store.** `mergeMemory` re-reads the whole store for each candidate while holding the clone lock (`memory-store.mjs:48`). That's fine at today's size, but the hold grows with candidates × store files; saves wait, they don't fail.
8. **Land line wording.** It prints `memory: started` even when the repository isn't enabled, and it repeats the prefix: `last 120s memory: complete`.

VERDICT: LAND
