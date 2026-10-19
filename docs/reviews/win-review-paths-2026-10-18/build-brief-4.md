# Lane win-review-paths — build brief 4 (2026-10-18 · feat/win-review-paths · tip after the seat's commit on 1187eab)

**Builder: the roster's builder through `pi-worker --lane win-review-paths`.** The seat's wrong-code pairs are all red
on 1187eab (`seat-mutate-output-1187eab.txt`, 16 of 16). Windows CI run 1 on 1187eab (`ci-windows-run-1.log`): land 51,
immutable-review 15 + 2 skips and worker-lane 51 + 1 skip all pass; GP1 to GP6(ii) pass with the case, link, 8.3 and
`\\?\` spellings. Two test-side gaps remain. Change tests only.

**MUST 1 — path-spelling runs past the runner's 300-second file limit on Windows.** It was killed after GP6(ii), so
GP6(iii) and GP7 never ran there. Cause: pi-review's watchdog sees pi's exit only at its next poll (`--poll`, 15 s by
default; `pi-watchdog.mjs` around line 195), so every pi-review spawn in the file waits about 15 s for a fake pi that
exits at once. Pass `--poll 1` to every pi-review spawn in `path-spelling.test.mjs`, before `--`. Change no check's
condition. Report the file's macOS time before and after.

**MUST 2 — four review-ledger checks expect the 8.3 spelling on Windows.** They build the expected value with
`fs.realpathSync` (JS), which keeps the runner's short `RUNNER~1` name, while the tools now key and run by the native
real path (the long name on disk, as the pack README's key paragraph says). In `review-ledger.test.mjs`:
- `tally record {v,ts,kind:round,…}`, `scratch launcher cwd with --tree uses the reviewed repository scope` and
  `pi-review --tree succeeds from a non-git scratch cwd`: build the expected `git:` key with `fs.realpathSync.native`;
- the same scratch-launcher check's `VERDICT: ${A.d}` compare: compare the native real path of both sides;
- `a dangling --out link is resolved to where the write would land`: pass `fs.realpathSync.native(O.d)` as the root, as
  `treeScope` gives the tools.
Then search every test under `packages/nana-pack/tests/` for another expected `git:` key or tree root built with
`fs.realpathSync(` against a value the tools now produce natively, and change those the same way; list each in your
report.

macOS counts stay as they are: path-spelling 11, review-ledger 155, and every other file unchanged.

## Done
path-spelling and review-ledger green on macOS; `npm run map:check`, `node scripts/requirements-trace.mjs` and
`npm run readme:check` clean; the full suite through `npm run test:locked` green. Do not push; the seat pushes.

## Report
≤ 8 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: the commit; path-spelling's macOS time before and after;
each test edit; the suite line.
