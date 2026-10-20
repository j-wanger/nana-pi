# doctor-fix-line — build brief 2

Same worktree and branch (tip 1d107467: build 1 at 87efebe6 plus the seat's wrong-code table). Class: install, hook or gate (doctor). Rows: R-1990 to R-1999 only; the next free ID is R-1997. Follow packages/nana-pack/prompts/builder-preamble.md. Single test files only (no full or locked suite); do not push; do not edit HANDOFF.md or docs/sessions/.

## What the seat's checks found on 87efebe6
- **Independent check, known bug A (fix it).** On forced win32, after install, `chmod 000` on one rule copy: main's doctor printed `2 missing — run: nana-setup install` and exited 1. The lane's doctor prints every row, then `Error: EACCES: permission denied, open '…/rules/nana-soul.md'` with a stack trace through writeBytesWithBackup, stepRules, install and runDoctor, and no summary line (exit 1). So doctor now crashes where main gave a summary. The dry run throws a non-SetupError, and runDoctor lets it through. The record is in the seat's independent check (the seat commits it with the notes).
- **Pairs: D2 survived** (`every dry-run error reads as a refusal`). No test makes install's dry run throw anything but a SetupError. D1 (relative agent dir with ✗ rows, last line unread) and D3 (two ✗ rows with one label) also survived; leave them as declared limits.
- **Pairs: W5's record was cut short.** The test file ends with `process.exit(failures ? 1 : 0)`. Under W5 the R-1995 failure detail is about 83 KB, and piped stdout was cut at 65,642 bytes, so later checks never printed.

## Change
1. When install's dry run throws anything that is not a SetupError refusal, doctor must not crash. Print every row as today, then one bounded summary line. It names that doctor could not predict install's repairs, gives the error's code (never a stack), and falls back to today's `N missing — run: nana-setup install` advice. Keep the exit code and the `!` handling as they are now.
2. Add R-1997 (EARS, one shall) and one check in doctor-fix-line.test.mjs. Make the dry run throw a plain Error through an injection the code already has, or an unreadable file on forced win32 as the probe did, if that works on all three legs. Then the check asserts: exit 1, every row printed, the fallback summary line present, no `Error:` and no stack line. Show it red on 87efebe6.
3. Replace the file's closing `process.exit(...)` with `process.exitCode = failures ? 1 : 0` so a long failure detail is never cut off. Keep R-1995's detail bounded too (no base64 of the walked home), for example a count plus the first few paths.

## Done
doctor-fix-line, doctor-detail, relative-agent-dir, doctor-quiet, win32-degrade and stale-copies each green alone. R-1997 red on 87efebe6 and green now. Trace, `npm run map:check`, `npm run readme:check` and `node scripts/requirements-tree.mjs --check` exit 0. Run `node docs/reviews/doctor-fix-line-2026-10-20/seat-mutate.mjs D2` once: D2 must now be red. Do not edit the seat's table.

## Report (≤ 8 lines)
VERDICT; commit; the fallback line's exact text; R-1997 red-then-green evidence; D2's result; files changed.
