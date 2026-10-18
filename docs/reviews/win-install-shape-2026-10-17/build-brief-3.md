# Lane win-install-shape — build brief 3 (2026-10-18 · feat/win-install-shape · tip after the seat's merge of main ddc45b4)

**Builder: Claude Sonnet 5**, the same worktree and rules as brief 1. Windows run 2 passed all five files. Before the final
review the seat ran an adversarial skip audit (`seat-skip-audit.md` here) against the bar that sent the handoff lane
back: each Windows skip names a case that cannot exist on Windows, each skip prints its reason, and no lane check passes
with its behaviour removed. Fix these, all in tests:

1. **`install.test.mjs`: exec form is not pinned on Windows.** IS1 says this file asserts exec-form hook entries there,
   but `entryInvokes` accepts a shell-form entry on win32 (`settings.mjs:152-157`). Add one win32 check per installed hook
   entry that `command === "node"` and `args` is an array. Fix the hook SKIP text that says "checked below through
   entryInvokes" to say what is checked.
2. **`install.test.mjs:411`: a silent guard drops six space-in-home checks on Windows.** The reason is true (no path
   enters a command string there; `hooks-win32-exec.test.mjs` covers Windows). Print a SKIP line with it.
3. **`retired-artifacts.test.mjs:294-299`: the win32 replacement for the alternate-Claude-home scoping (R-663) passes
   with the scoping removed**, because both homes hold only `spec`, which win32 drops before choosing the home. Use an
   artifact win32 does retire (the critic's probe used an empty `enforce` in both homes: install moved the alternate
   home's copy into its backups and left the default home's in place). Assert exactly that on win32.
4. **`state-manifest.test.mjs:147`: the control-character name skip is false.** The product refuses
   `/[\u0000-\u001f\u007f]/` on every platform, and Windows allows DEL (U+007F) in a name. On win32 use a
   `bad\u007fname.md` stand-in and keep the check; keep the LF name elsewhere.
5. **`skills-and-standards.test.mjs` section 7d (around :365): a silent guard drops three checks on Windows.** Print a
   SKIP line with its reason.
6. **`skills-and-standards.test.mjs` section 7a (around :278): "forcing the branch is only meaningful off win32" is not a
   reason to skip on Windows.** The no-write-through guard (`mirrorDirsProblem`, R-352) runs only on Windows and has never
   run there. On win32 run the section natively (no forcing): create the directory link as a `"junction"`, and skip only
   if link creation itself fails, saying so. The cases that need no link run unconditionally.
7. **`skills-and-standards.test.mjs` section 6 (around :222): the same false reason.** The forcing variable is a no-op on
   Windows, so run the section natively there. Doctor's stale-copy ✗ and install's "N files copied" line have no Windows
   run anywhere else.
8. **`uninstall.test.mjs:34-45`: the gate starts too early.** The no-confirmation-flag refusal (R-900) passes on Windows;
   move it above the gate.
9. **Skip counters:** the SKIP lines at `skills-and-standards.test.mjs:203` and `:316` do not increment the file's skip
   count; make them count, so the file's own summary matches the runner's.

If a native Windows run of sections 6 or 7a shows the product doing something wrong (not just differently), stop and
report it; that is a product bug for an install lane, not this one. Must-meet IS1 still governs. Do not change product
files. Do not touch `HANDOFF.md` or `docs/sessions/`.

## Done
The five files green on macOS with their counts unchanged or higher; the code-map and trace checks.

## Report
≤ 12 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each file's macOS line before and after; each edit;
the one claim most likely wrong on Windows.
