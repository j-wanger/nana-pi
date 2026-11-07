**Seat-pull-off review, round 1: tip `429671c5` against main `2124b253`**

The change does what the owner asked, and I found no MUST. Install stops writing the Claude Code knowledge hook and removes our own old entries. Doctor names a hook that is still wired and says nothing once it's gone. Search, the index and the pi extension are untouched. Two SHOULDs, both in doctor's wording, should be recorded as known bugs if you don't fix them now.

**What I checked**
- **Install removal (`settings.mjs` `isRetiredKnowledgeHook` / `removeRetiredKnowledgeHook`):** it removes only entries that exactly match a shape our installer has written. That covers the earliest unquoted form, the quoted form (paths with spaces included), the older Windows `node '<path>' hook` form and the Windows exec form, on either platform. These are kept byte for byte:
  - entries with a different timeout, status message or extra arguments;
  - a different `type`;
  - shell form with an `args` key;
  - sibling commands in the same group.
  
  A group is dropped only when this removal empties it; a group that was already empty stays. The R-3740 and R-3745 fixtures pin this.
- **Real upgrade run in a temp home:**
  - Before install, doctor showed `✗ settings UserPromptSubmit retired hook … — run \`nana-setup install\``.
  - Install printed `settings UserPromptSubmit knowledge retirement  updated` and kept `echo mine`.
  - After install, doctor had no settings row about knowledge and no FAIL; the index and sources rows were ✓.
- **Uninstall:** the old entry is added back to what `removeInstallerHooks` and `settingsVariants` look for, so uninstall behaves as it does on main.
- **Install check:** only the Claude Code hook row and its `UserPromptSubmit` input branch are gone. The pi-turn knowledge check is unchanged. The only other caller of doctor is the install check, which runs it on a fresh install.
- **Tests:** `seat-pull-off.test.mjs` passes all 8 cases. The touched tests (`settings-merge`, `doctor-detail`, `win32-hook-repair`, `win32-degrade`, `checkout-converge`, `retired-artifacts`) also pass on macOS. R-3739 to R-3743 and R-3745 would fail if the feature were removed. R-3744 guards that search still works. The builder's wrong-code logs match.
- **Requirement rows:** R-3739 to R-3746 match their tests. The rows marked retired are the ones that described the hook, and R-1050, R-1056 and R-1061 are narrowed correctly.

**SHOULD**
1. **Doctor's summary line says "fix by hand" for the retired hook, though install fixes it.** The row is labelled `settings UserPromptSubmit retired hook`. Install's dry run reports `settings UserPromptSubmit knowledge retirement`. The summary matches rows to install by label, so it puts this row under "by hand". That breaks the R-1990/R-1992 summary contract.
   - Input: any installed machine after pulling main and before re-running install, which is the upgrade path the plan expects.
   - What I saw: `2 missing — fix by hand as each ✗ line says: settings UserPromptSubmit retired hook, pi pi-subagents`, while the row itself says run `nana-setup install`.
   - Consequence: the advice contradicts itself, but either path removes the hook.
   - One-line fix: pass `installLabel: "settings UserPromptSubmit knowledge retirement"` to `add()` for knowledge findings, as the `PATH pi-review` row already does.
2. **Doctor tells you to run install for hand-edited entries that install deliberately keeps.** `retiredSettingsCommands` flags any entry that runs `nana-knowledge.ts hook`, including ones with a changed timeout, extra arguments or an owner status message. Install keeps all of those, so the ✗ never clears.
   - The tests disagree with each other here: R-3741 pins `{…entry, args: []}` as "run install", and R-3740 pins install keeping that same shape.
   - The remedy should say "remove by hand" when the entry isn't one our installer wrote.

**NOTE**
3. Some text still describes the Claude Code hook as live: the description in `packages/nana-knowledge/package.json`, and the header comment of `packages/nana-knowledge/extensions/nana-knowledge.ts` ("The Claude Code side runs `bin/nana-knowledge.ts hook` as a UserPromptSubmit command").
4. Requirement bookkeeping:
   - Tests in `hooks-win32-exec` and `install-check.test.mjs` still carry the tags of retired rows R-1330, R-1713 and R-1083.
   - R-3540 is still implemented but cites the test tagged with retired R-1713.
   - The retired rows' evidence has a double space after `retired;`.
5. `docs/reviews/seat-pull-off-windows-fix.md` sits outside the lane folder `docs/reviews/seat-pull-off-2026-11-06/`.
6. CI for `429671c5` (PR #345) was still running during this review, and the three earlier tips I could see failed. The Windows fixture failure was fixed in `1475bbc4`. `nana-land` needs a green run on this tip.

VERDICT: LAND
