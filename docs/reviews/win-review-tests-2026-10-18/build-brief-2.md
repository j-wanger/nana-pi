# Lane win-review-tests — build brief 2 (2026-10-18 · feat/win-review-tests · tip after 153e3d4)

**Builder: Claude Sonnet 5**, the same worktree and rules as brief 1. The seat's audit of build 1 (`seat-audit-1.md`,
the critic's list) confirmed three MUSTs and two SHOULDs. Fix them, all in tests. A Windows run on 153e3d4 is going on
draft pull request #23 in parallel; the seat will send its findings in the next brief if any remain.

1. **`immutable-review.test.mjs:31`: the win32 fake crashes when `OBSERVE_PID` is unset**, which most runs are (:127,
   :138, :206, :212, :256, :267). The sh stub keeps going after a failed redirect; the Node port must too. Guard the pid
   write with `if (process.env.OBSERVE_PID)`, and guard every other optional environment file the same way. Without
   this, checks 9 (stall) and 12 (live checkout) fail on Windows for the wrong reason.
2. **Checks 14 (:308) and 17 (:359) will fail on Windows** because the reclaim bug (check 11's cause, lane W7c's fix)
   leaves the killed `nana-review-*` checkout registered. Right after check 11, if `killedCheckout` still exists, remove it
   and its registration in the test (`git worktree remove --force`, then `prune`). This keeps 14 and 17 meaningful, does
   nothing on POSIX, and leaves check 11 failing on Windows as planned.
3. **`review-ledger.test.mjs`: most allowed-to-fail checks do not print the two spellings.** WR1 requires each such FAIL
   to print the short and long paths it compared. Append one `pathForms(...)` suffix to each allowed check's detail: the
   checks at :169, :175, :387, :404, :513 (three), :697, :882, :902, :962, :967, :970, :973, :982, :991 (two), :1004 and
   :1007. Use `O.d` plus the out path in section 20, and the relevant `.git` folder elsewhere. At :970 print the real
   value, not the `""` default.
4. **SHOULD, `review-ledger.test.mjs:43`:** the win32 `plain` port appends to `COUNT` without a guard and crashes when
   `COUNT` is unset (:754), so :756 (R-701) passes on Windows only because the stub crashed. Guard it.
5. **SHOULD, `immutable-review.test.mjs:64-65`:** the comment says POSIX uses a `path.resolve` no-op; the code uses
   `fs.realpathSync`. Fix the comment.

Keep the short 8.3 temp roots. Do not change product files. Do not touch `HANDOFF.md` or `docs/sessions/`.

## Done
The three files green on macOS with their counts unchanged (17, 155, 52); the code-map and trace checks.

## Report
≤ 8 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: the commit; each file's macOS line; each edit; the one claim
most likely wrong on Windows.
