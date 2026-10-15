# Lane lift — build brief 8 (2026-10-15 · feat/lift · tip after the seat's records commit)

**Builder: Claude Sonnet 5.** Final review round 2 at `ba58311`: astra LAND (`astra-r2.md`); sol SEND-BACK (`sol-r2.md`)
with one MUST. Fix only this; earlier briefs' rules all hold (touched test files only, in the foreground, each tool call
under 5 minutes; commit; push).

**The grouping-file worktree scan skips a path another worktree's HEAD does not track** (`scripts/requirements-lift.mjs:827-830`).
sol's repro: main commits `map.json`; a second worktree on a branch from before that commit holds an untracked
`map.json` with owner edits; main's `--mapping map.json --write` exits 0. Make the scan compare by content on disk: for
every other worktree, if the ledger's or the grouping file's root-relative path exists there and its bytes differ from
this run's HEAD blob for that path — tracked, untracked, staged or not — or HEAD there tracks it and it is missing,
refuse naming that worktree. A worktree whose copy is byte-identical, or that has no file at that path and does not
track it, is clean. Test, `// req: R-1164`, red first on today's code, using sol's repro:
`R-1164: --write refuses when another worktree holds an untracked grouping file at the same path that differs from this HEAD's`

Do not change any row's text; add the title to R-1164's evidence. Do not touch `CHANGE.md`, the seat's files in this
folder, `HANDOFF.md` or `docs/sessions/`.

## Done
`node scripts/test.mjs packages/nana-pack/tests/requirements-lift.test.mjs` green;
`node docs/reviews/lift-2026-10-14/seat-titles.mjs 1` → `0 missing`;
`node docs/reviews/lift-2026-10-14/acceptance.mjs > docs/reviews/lift-2026-10-14/acceptance-output.txt 2>&1` → 136/136;
`node scripts/code-map.mjs --check`; `npm run -s readme:check`. Commit, push.

## Report
≤ 8 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: the commit; the red you saw first; the test file's summary
line; the last line of each seat output.
