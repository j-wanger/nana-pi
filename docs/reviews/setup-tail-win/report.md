# setup-tail-win technical record

## Scope and decision

Feature: FEAT-013. Branch: `feat/setup-tail-win`.

1. Windows run 42517200227 passed an 8.3 temporary-root spelling to Copier while git returned the long spelling. Canonicalize the single `setup-tail.test.mjs` fixture allocator with `fs.realpathSync.native` before deriving any project, home or template paths. The rest of that file has no independent temporary-root allocator. This covers M3 and the manual-check renders together.
2. Credential M2 is a timing failure, not evidence of credential dispatch: the supplied diff is `[false, false, false]` versus `[false, false, true]`. Only `bounded` differed; the probe sets it from `!r.error`. The real credential probe has a 3000 ms timeout. Neither a password nor fixture-program invocation occurred. `history.log` records `git log main -5 -- <exercised files>` and the separate case-file history. The recent setup-tail fix has no diff in the credential test, reviewer launchers or credential-strip implementation. The last case-file change predates setup-tail and belongs to review-paperwork. No recent setup-tail lane changed credential stripping.

Use the established `RUN_ALONE` scheduling policy rather than raise a margin, retry the lookup or weaken the security oracle. Parallel suite files now deterministically drain before this file starts. The existing runner tests exercise that scheduling contract. External machine load can still delay a process; isolation is not a claim of hard real-time execution. PROBE_MS remains 3000; CASE_MS remains 30000. All real-git fixture credential controls and reviewer routes remain intact. No stored credentials were read.

## Requirement diff, tests, implementation

Rows changed first: R-3887 adds alternate temporary-root spellings; R-3661 evidence declares the isolated runner policy. No row IDs allocated.

Existing tests edited (only the two files named by the brief):
- setup-tail M3 adds a canonical render-root assertion.
- credential-strip M2 pins the new sealed RUN_ALONE entry, then retains the full reviewer matrix.

No test file was added or deleted. No production launcher, credential implementation or return/raise contract changed. No callers needed updating.

Precedent: `packages/nana-pack/tests/setup-retire.test.mjs` canonicalizes its fixture base and project path. The brief's setup-package path does not exist; the actual file lives in nana-pack. Use the explicitly requested native realpath variant rather than its fixture's non-native variant. Scheduling follows the existing hook-deadlines/adoption-reader RUN_ALONE pattern in `test-runner-config.mjs`. No helper copied or moved.

## Wrong-code pairs on macOS

- Root: add the M3 assertion while retaining the old allocator; run the existing setup-tail file with TMPDIR pointing through an OS-temp symlink (`alias` -> its containing temporary directory). Exit 1, specifically M3's canonical render-root assertion. Apply native realpath and repeat the same symlink arrangement: exit 0, all nine cases pass. `root-wrong.log` / `root-green.log`. The mutation breaks path allocation, not the assertion.
- Timing policy: add the M2 policy pin while retaining the old RUN_ALONE map, then run `node scripts/test.mjs credential-strip.test`: exit 1, M2 rejects the missing isolation entry. Add the scheduling entry and run the touched tests: exit 0. `credential-wrong.log` / `touched.log`. No timeout or assertion inversion was used. This pair pins deterministic scheduling policy, not a probabilistic wall-clock reproduction.

## Commands and exits before commit

- `node scripts/test.mjs setup-tail.test credential-strip.test test-runner`: 0; 4 files PASS; 79 checks pass, 0 fail, 0 skip.
- `node scripts/test.mjs --jobs=4 setup-tail.test credential-strip.test`: 0; 2 files PASS; 15 checks pass, 0 fail, 0 skip. The real parallel runner uses the new isolation entry (`parallel.log`).
- `npm run map:check`: initially 1 (new import edge made generated map stale); regenerate with `npm run map` (0), repeat map check (0).
- `npm run readme:check`: 0.
- `npm run req:tree`: 0.
- `node scripts/requirements-trace.mjs`: 0; EARS 0 rows off form.
- `git diff --check`: 0.
- Removed requirement-sentence search across `packages/**/*.test.mjs`: 1 (no matches). No file name, path or test title was removed or renamed.

Long output is in this directory; paths in saved logs are normalized to repo-relative paths or $TMPDIR aliases.

## Not done and limits

- Full suite belongs to CI under AGENTS.md; builders do not push, wait for or read CI.
- Native Windows execution remains for the seat/main CI. The supplied Windows logs are the failure evidence; the wrong-code pairs ran on macOS.
- Local install-check was not started: it opens real pi sessions and model turns, forbidden by the builder's explicit no-session rule. The seat must run it before land.
- No known-bug line was changed. Read all of `docs/known-bugs/FEAT-013.md`; neither named failure corresponds to one of its existing entries. No other known bug was fixed.
- No GitHub issue or API operation, push, model session or subagent launch.

The final response records the commit SHA and the four requested seat checks re-run on that commit.
