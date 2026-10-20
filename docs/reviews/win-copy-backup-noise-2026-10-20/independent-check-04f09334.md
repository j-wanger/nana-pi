# Independent check — win-copy-backup-noise at dfe54123 (2026-10-20)

VERDICT: FINDINGS

Setup: a private clone at dfe54123 plus a main clone at 72abe19a, both in a mktemp folder, with temp homes and NANA_SETUP_PLATFORM=win32 unless noted. The worktree and the nana-pi checkout both still show clean `git status`, and the worktree tip is still dfe54123. I deleted the temp folder afterwards.

Must-meet and nearby test files, run one at a time with a temp HOME:
- `node copy-record.test.mjs`: 6 passed, 0 failed, 0 skipped (R-2310 to R-2316).
- `node state-manifest.test.mjs`: exit 0, 20 PASS, including "every path created by install maps to a nana-setup-owned manifest row".
- These also exited 0: doctor-fix-line, fsops, win32-degrade, stale-copies, rulings-install, skills-and-standards, retired-artifacts, install-overlap, uninstall, win-shims, settings-lock, checkout-converge, checkout-spelling, install, win32-hook-repair, doctor-detail.

Probes:
1. Install, then twice append a line to the nana-soul, nana-rulings and spec SKILL sources, installing after each change (lane).
   Output: each round printed `rule nana-soul.md updated refreshed managed copy`, the same for `pi nana-rulings.md`, plus `copy record updated`. Backups: 0. "copies equal sources". The record holds 11 entries, one per managed copy, keyed by full path.
   Verdict: the feature works.
2. Unedited rule copy set to read-only (chmod 0444), then a source change and an install, on main and on the lane.
   main: `exit=0`, `backed up nana-soul.md -> nana-soul.md.bak-20261020, then copied`, 31 rows printed.
   lane: `exit=1`, `Error: EACCES: permission denied, open '.../.claude/rules/nana-soul.md'` with a stack ending `at writeBytesWithBackup (fsops.mjs:114:5)`. It printed 0 rows and the copy stayed stale. Skills, settings, pi config, PATH and the record save never ran. No lock was left behind, and a rerun after chmod 0644 exits 0.
   Verdict: REGRESSION (finding 1).
3. A hard link to an unedited rule copy (`ln nana-soul.md ~/soul-keep.md`), then a source change and an install.
   main: backed up the copy; the other name kept its old last line.
   lane: `refreshed managed copy`; the other name's last line became `src change`.
   Verdict: the lane now writes through a hard link (finding 2).
4. A symlink at the record path pointing to an owner file.
   Output: `exit=0`, `copy record skipped ~/.claude/nana-setup-copies.json was not saved (a symlink is there — left untouched, nothing read or written through it)`. The owner file still reads "owner private data".
   Verdict: HOLDS.
5. Native macOS install (platform not forced), source change, install again.
   Output: both installs exit 0. `ls: ~/.claude/nana-setup-copies.json: No such file or directory`. 0 "copy record" rows, the rule is still a symlink, 0 backups.
   Verdict: the POSIX path is unchanged.
6. Doctor on a win32 home, main against lane, plus a dry run on a fresh home.
   Output: both doctors give exit 1 with the same 3 ✗ lines (pi-subagents and knowledge index, environment fixtures only). Fresh `--dry-run`: exit 0, the home tree diff is empty, no copy-record row.
   Verdict: HOLDS.
7. Owner edits the rule copy, then checkouts B, A and B install into one home, each with different source bytes.
   Output: B printed `backed up nana-soul.md -> nana-soul.md.bak-20261020`, then A printed `refreshed managed copy`, then B printed `refreshed managed copy`. The one rule backup ends in "owner edit".
   PATH launchers still back up on every run, as the plan's known limits record.
   Verdict: HOLDS.
8. An unmanaged directory at `.claude/skills/spec`, then a source change and an install.
   Output: `exit=1`, `✗ skill spec problem a directory is already at ~/.claude/skills/spec — left untouched`, `copy record created`, 10 entries with spec not recorded. On the second install, the owner's SKILL.md is unchanged and there are no rule or skill backups.
   Verdict: HOLDS.
9. `state` and `state --paths` on the win32 home, plus `uninstall --yes` on a POSIX home where a record file was planted.
   Output: `copy record  rebuildable  nana-setup  ~/.claude/nana-setup-copies.json  present`. `state --paths` exits 0 and does not list the record, which is right for a rebuildable row. Uninstall exits 0 and leaves the record in place, as the plan's known limits say.
   Verdict: HOLDS.

Findings:
1. MUST: a read-only unedited managed copy now crashes install, where main backs it up and finishes.
   - Cause: the refresh branch in `packages/nana-setup/lib/fsops.mjs` `writeBytesWithBackup` writes in place with `fs.writeFileSync(target, want)`. The backup branch renames the file away first, which works on a read-only file.
   - Effect: a raw EACCES stack, exit 1, no rows printed, and every later install step skipped (probe 2).
   - Native Windows is inferred, not run. Writing to a file with the read-only attribute fails with EPERM there, while renaming it succeeds, so main finishes and the lane does not.
   - The condition is narrow: the owner made a copy read-only without editing it. It still meets "a broken install" and "something main does today no longer working".
   - Cheap fix: fall back to the backup branch when the in-place write throws, or unlink the file before writing.
2. Known bug: the same in-place refresh writes through a hard link (probe 3).
   - The other name receives the new source bytes. Main gives the copy a new file and leaves the other name alone.
   - The bytes overwritten were install's own bytes, so no owner text is lost.
   - The fsops header and the README promise no write-through only for symlinks.
3. Known bug (noted, not probed further): the in-place refresh is not atomic.
   - A crash during the write leaves a truncated copy with no backup.
   - The next install treats the truncated copy as edited, then backs it up and rewrites it. Only install's own bytes are at stake.

Not run: the native Windows leg, the mutation runner and the full suite.
