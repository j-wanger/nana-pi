# Lane roster — build brief 2 (2026-10-13 · feat/roster · worktree ~/nana-pi-wt/roster · tip c7c7690)

**Builder: Claude Sonnet 5.5.** The seat's mutation runner on `c7c7690` caught 59 of 63 code breaks. It also found four
places where the code or a test says less than its row or `CHANGE.md` §6. Fix exactly these five items, each with the
test named below. The contract is still `CHANGE.md`; build brief 1's rules all hold (wrong code first for every new
case; a mutation breaks code, never an assertion; the do-not-touch list; explicit paths; message file under `$TMPDIR`;
`Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`; never a work provider, gateway or project name).

1. **R-1125: `piLaunch` never throws.** `pi-watchdog.mjs:84-86`: a `package.json` whose `bin` is neither a string nor
   an object, or whose `bin.pi` is not a string (e.g. `{"bin": 5}`, `{"bin": {"pi": 5}}`), makes `win.resolve` throw.
   Refuse it with the existing "declares no pi bin" reason instead. Test in `win32-launch.test.mjs`, forced win32 like
   the existing refusal case, `// req: R-1125` directly above:
   `win32 launch refuses with a named reason, without throwing, when pi's bin is not a string`
2. **R-1122: no C1 control character.** `nana-roster.mjs:66` lets U+0080–U+009F through; the row says "no control
   character". Reject them too (`\x80-\x9f`). Test in `nana-roster.test.mjs`, `// req: R-1122`, cases U+0085 in a model
   and U+009F in a provider, each refused naming its slot and field:
   `a provider or model holding a C1 control character is refused naming the slot and field`
3. **R-1125: a refusal reaches `--out`.** `pi-watchdog.mjs:171` returns `text: ''`, so neither launcher writes the
   refusal to `--out`, while a spawn failure's text is written there (`pi-worker.mjs:150`, `pi-review.mjs` failed
   branch). Return `text: \`pi launch refused: ${launch.refused}\`` — the stderr line stays as it is. Extend the
   Windows-only case at `win32-launch.test.mjs:290` with a second check, `// req: R-1125` above it:
   `Windows: a refused launch writes its reason to --out`
4. **Stale comment.** `worker-config.mjs:11` still says roster changes are an edit to `LANE_DEFAULTS`. Since this lane a
   machine's roster lives in the user-scope `nana-pack.json` and `LANE_DEFAULTS` is the default only. Say that in one
   line; no code change.
5. **R-1128: nana-soul cannot drift from the shared file.** `templates-render.test.mjs:334-335` compares nana-soul with a
   copy of the two bullets written into the test, so an edit to the shared file's bullets that the R-1126/R-1127 titles
   do not check leaves nana-soul stale with every test green. Make the existing R-1128 check read the two bullets
   ("Default pattern", "Seat land review") from `templates/_shared/working-under-nana-pi.md` and require nana-soul to
   carry each byte for byte. Keep its title exactly. Show it red first: with the shared file's "with the same arguments"
   changed to "with the same flags" in the shared file and AGENTS.md only, the check must fail; then revert that edit.

## Done — do not report DONE until all of these pass on your last commit
`node docs/reviews/roster-2026-10-13/acceptance.mjs > docs/reviews/roster-2026-10-13/acceptance-output.txt 2>&1` → exit 0,
`0 mismatch(es)`; `npm run test:locked` (0 failed); `npm run map:check`; `npm run readme:check`;
`node scripts/requirements-tree.mjs --check`; `node packages/nana-setup/bin/install-check.mjs`. Commit, push the branch,
and when draft PR #8's CI run completes, read the Windows job log
(`gh api repos/j-wanger/nana-pi/actions/jobs/<job id>/logs`) and report the three Windows titles' results — item 3's new
check must pass there. No Windows claim lands that CI did not show; a red Windows title is BLOCKED with its log lines.

## Report
≤ 25 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each item, its title and the red you saw first;
the CI run ID with the Windows titles' results; the `test:locked` summary line; the last line of acceptance; the one
claim most likely wrong.
