# Lane win-project-files — build brief 6 (2026-10-17 · tip c3776a4)

Builder: Claude Sonnet 5, the same builder. Final review round 1 (`sol-r1.md` here) sent back one MUST, a harm (data
lost): the rename retry in `packages/nana-setup/lib/project.mjs:272-281` re-tries `renameSync` after an EPERM or EBUSY
without re-checking the destination. On Windows an editor that holds `AGENTS.md`, saves new content and closes it
between attempts has that save overwritten by the next retry.

**The fix.** Before every retry attempt (not before the first), re-check the destination exactly as the final check
before the close does: the same 64-bit identity and the same bytes the refresh read. If either changed, stop: remove the
temp file, leave `AGENTS.md` as the owner left it, and report the refresh skipped with the same kind of detail the
identity-change refusal gives. Do not loosen any existing check.

**The test** (it extends the existing must-meet test for the owner-swap refusal, R-986's check, so it is not a new
must-meet test): add a seam for the rename the way `writeTemp` is a seam, and in `project-working-region.test.mjs` make
the injected rename throw EPERM once while the owner rewrites `AGENTS.md`, then call the real rename. Assert the refresh
reports skipped, `AGENTS.md` holds the owner's new text, and no temp file is left. It runs on every platform. Run it
against the current code first and see it fail.

Same rules as brief 1; run test files through `npm test -- <file>` on this Mac. Done: `project-working-region.test.mjs`
and `project.test.mjs` green; `seat-titles.mjs 1` → `0 missing`; the code-map check. Commit with explicit paths, push.
Report ≤ 8 lines, including the failure you saw before the fix.
