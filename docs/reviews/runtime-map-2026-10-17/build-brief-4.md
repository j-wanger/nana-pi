# Lane runtime-map — build brief 4 (2026-10-17 · feat/runtime-map · tip 1301a93)

Builder: Claude Sonnet 5, the same builder. One seat finding on build 3, before the confirmation round.

MM5's new deletion case (`runtime-map.test.mjs:209-224`) deletes this checkout's own tracked `.gitignore` and writes
it back in `finally`. A test must never write the repository it runs in: the suite runs in the main checkout at every
land, a kill between the unlink and the restore (a time-limit kill, a stop) leaves the repository without the file,
and any process reading the checkout meanwhile sees it gone. Move the case into a throwaway fixture repository under the
test's temp folder (MM9 already builds one): commit a small file there, write runtime data whose hashes match, delete
the file without staging, run the impact command in that fixture, and assert it exits with the generator's code and
marks the section stale. No line of this test file may write, delete or rename a path under this checkout.

Done: `node scripts/test.mjs packages/nana-pack/tests/runtime-map.test.mjs` green; `git status --short` clean after
it; `grep -n "unlinkSync\|writeFileSync\|rmSync\|renameSync" packages/nana-pack/tests/runtime-map.test.mjs` shows
no call on a path under the checkout. Same rules as brief 1. Commit with explicit paths, push. Report ≤ 6 lines.
