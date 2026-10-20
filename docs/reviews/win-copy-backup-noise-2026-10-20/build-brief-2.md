# win-copy-backup-noise: build brief 2 — the refresh must not write in place

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/win-copy-backup-noise`, branch `feat/win-copy-backup-noise`. **Class:** install, hook or gate. Rules: the builder preamble, but run single test files only — the seat runs the full suite at land, and other lanes hold the machine's suite lock. No push; no `HANDOFF.md` or `docs/sessions/` edits.

The seat's independent check of build 1 (dfe54123) found one MUST and two known bugs, all from one cause. `writeBytesWithBackup`'s new refresh branch in `packages/nana-setup/lib/fsops.mjs` writes the managed copy in place (`fs.writeFileSync(target, want)`). Main's backup branch renames the old file away first.

1. **MUST — a read-only unedited copy crashes install.** With an unedited rule copy set read-only (chmod 0444), a source change and an install: main backs it up and finishes (exit 0, 31 rows); the lane throws a raw `EACCES` stack at `writeBytesWithBackup`, prints no rows, and skips every later install step (skills, settings, pi config, PATH, the record save). On Windows, writing a read-only-attribute file fails with EPERM while renaming it succeeds (inferred).
2. **Known bug — the refresh writes through a hard link.** With `ln <copy> ~/keep.md`, main gives the copy a new file and leaves the other name alone; the lane writes the new bytes through both names.
3. **Known bug — the refresh is not atomic.** A crash mid-write leaves a truncated copy with no backup.

**Do.** Replace the in-place refresh with a write that never touches the old file's bytes: write the new bytes to a temporary file in the same folder, then rename it over the copy (a new file, atomic, never through a hard link). If that rename fails (for example a read-only copy on Windows, EPERM or EACCES), fall back to main's backup branch for that copy, so install still finishes. Install must never throw out of this step: a copy it cannot refresh is reported as a ✗ row naming the copy and the reason, and install goes on. Keep everything build 1 does otherwise (the record, the unedited predicate, the dry-run wording).

**Tests and rows** (FEAT-018, next free IDs R-2317 and R-2318; leave R-2314 unused; EARS form, exactly one "shall", implemented with evidence once green), in `packages/nana-setup/tests/copy-record.test.mjs` with the platform forced to win32:
- R-2317: WHEN install refreshes an unedited managed copy that is read-only, install shall finish with exit 0 and leave that copy holding the new source bytes or, where it cannot replace the file, a dated backup and the new bytes.
- R-2318: WHEN install refreshes an unedited managed copy that has a second hard-linked name, the other name shall keep its old bytes.
Show each red on build 1's code (a temp copy with fsops.mjs reverted) and green after. Skip the read-only case where the test runs as root (a root process can write read-only files), with a real SKIP line.

**Wrong code to try (each must turn its check red, then revert):** the in-place write (build 1's form) → R-2317 and R-2318; temp file and rename with no fallback → R-2317 only where rename fails (say if it stays green on macOS); a fallback that throws → R-2317.

**Run alone:** copy-record, fsops, install, rulings-install, skills-and-standards, uninstall, state-manifest, win32-degrade; then `node scripts/requirements-trace.mjs`, `npm run -s map:check`, `npm run -s readme:check`. Commit with explicit paths.

**Report** (10 lines or fewer, VERDICT first): commit; rows and test titles; red-on-build-1 evidence; the wrong-code results; per-file pass counts.
