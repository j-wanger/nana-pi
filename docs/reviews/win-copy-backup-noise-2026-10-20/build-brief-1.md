# Build brief — win-copy-backup-noise
Feature: FEAT-018 · Update or remove managed components safely. Class: install, hook or gate.
Threat model: honest variation in platform, line endings and record state is in scope. Record forgery is out.
Builder: the roster's builder through `pi-worker --lane win-copy-backup-noise`.
- Work in `~/nana-pi-wt/win-copy-backup-noise` on `feat/win-copy-backup-noise`, off current main. Follow `packages/nana-pack/prompts/builder-preamble.md`.
- Run single test files only. Never edit HANDOFF.md or docs/sessions/.

## Change
1. `packages/nana-setup/lib/paths.mjs`: add `copyRecord: path.join(claudeHome, "nana-setup-copies.json")` with a `chosen:` comment, and add it to the header @outputs.
2. New `lib/copy-record.mjs` (six-tag header, named exports, hash name defined once and marked chosen). `openCopyRecord(file)` returns `{ unedited(target), remember(target, bytes), save(o) }`.
   - It reads the record only if lstat says it is a regular file. Any read, parse or shape failure gives an empty record.
   - `save` writes nothing on a dry run or when nothing was remembered. Otherwise it calls `writeIfChanged` and keeps earlier entries.
   - A SKIPPED result or a caught throw becomes one SKIPPED row labelled "copy record". The row names the path and says the next update backs up each changed copy. `save` never throws.
3. `lib/fsops.mjs`: add an optional `unedited` predicate to `writeBytesWithBackup`, applied to regular files only, and pass it through in `linkFile` on `copyInstead`.
   - A file that passes is replaced with no backup, and the detail names the refresh. The dry run says it would refresh, with no backup wording.
   - fsops must not import copy-record. Update the header.
4. `lib/steps.mjs`: the three win32 sites (`stepRules`, the `linkSkill` file loop, `stepPiConfig`'s rulings copy) pass `o.copyRecord?.unedited(target)`.
   - After a non-dry-run CREATED, UPDATED or UNCHANGED copy, on win32 only, call `remember(target, sourceBytes)`.
   - `install()`: open the record at the START of `fileSteps` when win32 (the dry run reads it too). Push the `save(o)` rows at its END.
5. `lib/state-manifest.mjs`: add `rebuild("copy record", layout.copyRecord, "file")`.
6. README:
   - Add an install-table row for the record (Windows only).
   - Rewrite the Windows sentence in "Never destroys a file it replaces" and the skill-mirror sentence that says "in-folder file backups".
   - Add the test file to the test table.
7. REQUIREMENTS.md FEAT-018: add rows R-2310–R-2313, R-2315 and R-2316 exactly as written in the must-meet. Mark each implemented, with evidence, when its test passes. Do not use R-2314.

## Tests (write first; one-line `check("R-nnnn: …"` directly under `// req: R-nnnn`)
New `packages/nana-setup/tests/copy-record.test.mjs`:
- Setup: copy the checkout once, the way `checkout-spelling.test.mjs` `copyFixture` does. Give each case a fresh tmpDir home with `nana-knowledge/sources.json` seeded, and reset the copied sources first. Set `NANA_SETUP_PLATFORM=win32` unless the host is win32. Run the copied `nana-setup.mjs install --home H`.
- R-2310: make two changes to the nana-soul.md, nana-rulings.md and spec/SKILL.md sources. Assert no `.bak-` name anywhere under H, and each copy equals its new source.
- R-2311: the owner edits the rule, skill and pi rulings copies, then the sources change. Assert each edited copy has exactly one backup holding the owner's bytes.
- R-2312: with the record removed, with `{not json`, and with `["x"]`, a change gives one backup per changed copy.
- R-2313: install, delete the record, install, change the sources, install. Assert no `.bak-`.
- R-2315: dry run after a change. The rule and pi rulings rows name no backup, and a home snapshot is unchanged.
- R-2316: put a directory, then a read-only `{}` file, at the record path. Restore the file mode before cleanup. Assert exit 0, one skipped "copy record" row, and the knowledge and pi rows still printed. Under POSIX root, the read-only case prints SKIP and counts no PASS.

Existing file: in `state-manifest.test.mjs`, the R-954 install-coverage check gets the record (kind "file") as an install target and in the win32-only set.

Re-run these files singly: fsops, install, install-overlap, win32-degrade, skills-and-standards, rulings-install, writing-rule, retired-artifacts, settings-lock, checkout-spelling, stale-copies, uninstall, state-manifest, doctor-detail, fresh-machine.

## Wrong code to try (each must turn the named check red)
- Always unedited → R-2311. Any record entry means unedited → R-2311.
- A bad or wrong-shape record owns every copy → R-2312.
- Remember only on CREATED, remember before the write, key by file name, or wire the rules only → R-2310.
- Never remember on UNCHANGED → R-2313.
- Open the record only inside the lock, keep the backup wording, or save on a dry run → R-2315.
- Save with no try/catch → R-2316 (read-only case).
- Write the record on POSIX → the existing uninstall.test R-903 round trip.
- Drop the inventory row → R-955. Use kind "generated" → R-954.
Seat hazard: no pairs file may spell a pi launch as `spawn("pi"`.

## Done
- The six new checks and the R-954 change pass, and the re-run files pass.
- `npm run map:check` and `npm run readme:check` are green with the map regenerated.
- No inline tunable, and every touched module keeps a valid header.

## Report (≤ 10 lines)
Verdict, commit, the six rows PASS/FAIL with red-before evidence, files changed, each wrong code tried with the check it turned red, and open doubts.