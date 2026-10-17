# Lane roster-notice — build brief 3, after the final review round 1 (2026-10-17)

**Builder: Claude Sonnet 5.** astra said LAND; sol sent the lane back with one MUST (`sol-r1.md`): on a case-insensitive
file system (macOS by default, Windows always), an agent folder spelled with different letter case still lies under the
home folder, but the `~` rewrite compares case-sensitively and the notice shows the absolute home path, against R-1204.
A closed list; rules as in build brief 2.

1. **Case-insensitive `~` on macOS and Windows (R-1204).** In `tildeify` (`packages/nana-setup/lib/paths.mjs`), compare
   the home prefix without regard to letter case on darwin and win32, keep the path's own spelling after the `~`, and
   keep the comparison case-sensitive elsewhere. Tests: in `paths.test.mjs`, a case-variant path under the home folder
   reads `~/…` on darwin and win32 (forced platform where the test already forces one) and stays absolute on linux; in
   `roster-notice.test.mjs` L12, an agent folder spelled in a different case shows `~` in the pointer. Break the fix and
   see each go red, then restore.

Do not change any row's requirement text. Do not touch `CHANGE.md`, the seat's files, `HANDOFF.md` or `docs/sessions/`.

## Done
The touched test files green; `node docs/reviews/roster-notice-2026-10-16/seat-titles.mjs 1` → `0 missing`; the seat's
acceptance → 0 mismatches; `node scripts/code-map.mjs --check`; `node scripts/requirements-trace.mjs`. Commit, push.
Report in ≤ 12 lines, first line `VERDICT: …`.
