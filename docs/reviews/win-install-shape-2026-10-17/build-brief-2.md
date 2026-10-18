# Lane win-install-shape — build brief 2 (2026-10-18 · feat/win-install-shape · tip after e77ab22)

**Builder: Claude Sonnet 5**, the same worktree and rules as brief 1. Windows run 1 (`ci-windows-run-1.log`, on e77ab22):
`install` 85 pass, 5 skip; `state-manifest` 19 pass, 1 skip; `uninstall` 1 pass, 2 skip. All three pass, and every
skip prints its reason. Windows failures fell from 49 files to 42. Two files are left.

**1. `skills-and-standards.test.mjs`: 30 pass, 6 fail, 4 skip.** The six failures are section 4, the occupied skill
folder, as you predicted. The seat's ruling: this lane declares the Windows behaviour and does not change it. On
Windows, install backs up the owner's `SKILL.md` inside the skill folder (`linkFile`'s copy branch renames it to a
`.bak-` name), copies the pack's files over it, and exits 0. macOS refuses and leaves the folder alone. The seat
records the difference as a known bug. On win32, make section 4 assert the Windows shape:
- install exits 0;
- the owner's exact bytes survive in one `.bak-` file inside the skill folder;
- no `.bak-` folder appears at the skills root, so no second skill claims the name;
- the installed `SKILL.md` equals the pack's source;
- `--dry-run` says it would back up, and doctor reads the mirror as healthy.

Keep the macOS refusal checks unchanged on every other platform.

**2. `retired-artifacts.test.mjs`: 46 pass, 1 fail.** The check at :189 still sees the quoted context hook after
install: `bash 'C:\Users\RUNNER~1\...\.claude\hooks\context-size-check.sh'`. The product removes only
`` bash '${hooksDir}/context-size-check.sh' `` (`settings.mjs:296`), with a `/` before the file name. The fixture writes
`path.join`'s backslash. Find out from the code and git history what a released install actually wrote into
`settings.json` on Windows for this hook. If the old form was slash-joined, write the fixture that way on win32. If no
released Windows install ever wrote this hook, say so and skip the case on win32 with that reason. If a real released
Windows form exists that the product cannot match, stop and report it; that is a product bug for another lane.

Must-meet IS1 still governs. Do not change product files.

## Done
The two files green on macOS with their counts unchanged; the code-map and trace checks.

## Report
≤ 8 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each file's macOS line before and after; each
edit and why; what the history shows for the quoted hook on Windows; the one claim most likely wrong on Windows.
