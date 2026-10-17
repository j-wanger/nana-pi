# Lane win-project-files — build brief 5 (2026-10-17 · tip a0488b6, main 9fcd4f2 merged)

Builder: Claude Sonnet 5, the same builder. Windows run 4 (log `ci-windows-run-4.log` here): `project.test.mjs` **121
pass** and `ci-workflow.test.mjs` 12 pass on Windows. One real product bug remains, and it is a harm (data lost):

`project-working-region.test.mjs` "target identity change during staging is refused" failed with
`status=created detail="refreshed marker-owned region"`: the hook replaced `AGENTS.md` with the owner's text, the
refresh did not notice, and it overwrote the owner's file. It passed on runs 1 and 3 and failed on runs 2 and 4, so the
check is intermittent on Windows. The identity checks in `packages/nana-setup/lib/project.mjs` (`:209-210` and
`:257`) compare `dev` and `ino` as JavaScript numbers. The seat's inference, not verified: an NTFS file id is 64 bits
(a 48-bit record index and a 16-bit sequence number in the high bits); as a double it loses the low bits, so a deleted
and recreated file that reuses the record can read as the same `ino`. Confirm or refute that from Node's documentation,
then compare identity with `bigint: true` stats (`fs.fstatSync(fd, { bigint: true })`, `fs.lstatSync(p, { bigint:
true })`) at every identity comparison in that file. Keep the check's win32 skip for the case where the hook's own
replacement throws. No new test; the existing check is the must-meet test for this, and it must pass on Windows.

Same rules as brief 1. Done: `npm test -- packages/nana-setup/tests/project-working-region.test.mjs` and the same for
`project.test.mjs` green on macOS; `seat-titles.mjs 1` → `0 missing`; the code-map check. Commit with explicit paths,
push. Report ≤ 8 lines, saying whether the 64-bit inference held.
