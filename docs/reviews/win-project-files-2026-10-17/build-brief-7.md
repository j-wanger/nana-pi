# Lane win-project-files — build brief 7 (2026-10-17 · tip 45edfda)

Builder: Claude Sonnet 5, the same builder. Confirmation round 2 (`sol-r2.md` here) sent back one MUST: in the retry
loop (`packages/nana-setup/lib/project.mjs:210-211`) the re-check runs before the 20 ms delay, so a save during the
delay is still overwritten by the next rename. Move the delay before the re-check, so the re-check runs immediately
before each retry's rename. Extend the injected-rename case so the owner's write lands after the refused rename and
before the re-check would have run under the old order (for example, inside an injected delay seam, or by writing from
the rename seam's failing call while the re-check runs after the delay); see the case fail on the current order first.
No other change.

Same rules as brief 1; `npm test -- <file>` on this Mac. Done: `project-working-region.test.mjs` and
`project.test.mjs` green; `seat-titles.mjs 1` → `0 missing`. Commit with explicit paths, push. Report ≤ 6 lines,
including the failure you saw on the old order.
