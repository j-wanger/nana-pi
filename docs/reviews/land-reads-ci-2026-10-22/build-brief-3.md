Feature: FEAT-008 · Integrate and clean up reviewed changes. Lane land-reads-ci, row R-2589's test only. Class: gate. Builder: pi-worker (small lane). Build session 3: the child no-gh case's PATH.

Work in the lane worktree on feat/land-reads-ci. Change only `packages/nana-pack/tests/land.test.mjs`. Do not edit HANDOFF, the session archive, the known-bug files, the rows or any code under `lib/` or `bin/`.

Finding F3 (draft PR CI at 150eefd6): R-2589 fails on the macOS and Linux suite legs and passes on this Mac. The failing assertion is the child CLI case, `assert.match(child.stdout, /^refused:.*gh.*PATH/im)`. Its PATH is node's folder plus git's folder. On GitHub's macOS runner and on Ubuntu, gh sits in the same folder as git (`/usr/local/bin` or `/usr/bin`), so the child finds a real gh and never gives the "cannot start gh from PATH" refusal. On this Mac, git is in `/usr/bin` and gh elsewhere, so the case passes by chance. A Homebrew machine with both in one folder fails the same way.

Precedent:
- packages/nana-pack/tests/land.test.mjs — the in-process no-gh case just above it (an empty bin folder as the whole PATH), and the fake-bin PATH built near line 697.
- packages/nana-pack/tests/worker-lane.test.mjs — `writeStub` (from line 45): a POSIX `#!/bin/sh` script and its win32 form, laid out in a bin folder the child's PATH names.

1. Give the child a PATH that holds node and git and no gh, on every runner. Build a temp bin folder holding only a `node` and a `git` that run the real ones (on POSIX a symlink or an `exec` shim; on win32 a `.cmd` shim, or keep today's folders if they hold no `gh.exe` or `gh.cmd`). Before the land runs, check that `gh` does not resolve on that PATH; if it still does, print one SKIP line naming why and pass the case's other assertions only.
2. Keep R-2589's title, its `// req:` marker and every other case and assertion unchanged.
3. Try the wrong version: put the folder of the real gh (from `which gh`, when present) on the child's PATH. See R-2589 go red, then restore. If this Mac has no gh, say so and skip this step.
4. Run the file, then once more with TMPDIR, TEMP and TMP pointed at a long folder outside the worktree (about 120 extra characters). Run `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs` and `npm run test:locked` before your one commit.

Seat check: `node docs/reviews/land-reads-ci-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done: the child no-gh case finds no gh whatever folder git and gh share, the file ends 0 on macOS, and the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; the wrong version's result; the two runs' results; each departure from the Precedent files with its reason; the full suite's summary line; map, readme, trace and seat-check status.
