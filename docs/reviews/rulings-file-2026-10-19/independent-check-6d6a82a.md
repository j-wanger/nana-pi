# Independent check — rulings-file at 6d6a82a (2026-10-19)

VERDICT: FINDINGS

Setup: a private clone at 743c568 under `<tmp>/rulings-file-check.JvSA1o`, with a temp HOME and a separate temp pi home for every probe. Each test file ran on its own. The real `~/.pi/agent`, `~/.claude/rules`, the worktree and main were not touched. Only the seat's own untracked `seat-mutate.mjs` is in the worktree.

Must-meet tests:
- `node packages/nana-pack/tests/rulings.test.mjs` → exit 0. HOLDS.
- `node packages/nana-setup/tests/rulings-install.test.mjs` → exit 0. HOLDS.
- The four changed tests also exit 0: state-manifest, uninstall, requirements-tree and restore.
  - restore needs `npm_config_prefix` to find pi. Base b3f6ec2 fails the same way without it, so this comes from my environment, not the lane.

Probes:
1. Install, install again, then doctor (macOS, `--home H --pi-home PI`, PI outside H).
   - First install: `+ rule nana-rulings.md created` and `+ pi nana-rulings.md created`. Both are symlinks to `lane/packages/nana-pack/rules/nana-rulings.md`.
   - Second install: both rows `unchanged`.
   - Doctor: `✓ rule nana-rulings.md` and `✓ pi nana-rulings.md`. HOLDS.
2. `PI_CODING_AGENT_DIR=$PI node probe2.mjs` loads the extension through the installed symlink, for startup, reload, new, resume and fork.
   - Every reason gives `"## Standing rulings (nana)\n\n# Nana — Standing rulings…"`, length 2430.
   - Section keys come out as `nana-objective,nana-rulings`. HOLDS.
3. Dangling link (checkout moved), with `PI_CODING_AGENT_DIR='~/agent'`.
   - Output: `"RULINGS UNAVAILABLE: missing at …"`, length 191.
   - A file with a byte-order mark injects as `"## Standing rulings (nana)\n\n# x\n- 2026-10-19: bom\n"`. HOLDS.
4. Install over hand-edited regular files on macOS.
   - Output: `rule … updated backed up nana-rulings.md -> nana-rulings.md.bak-20261019`, and the same line for the pi copy.
   - The backups still hold "my own pi rulings" and "my own claude rulings". No data is lost. HOLDS.
5. `NANA_SETUP_PLATFORM=win32` install over an existing POSIX symlink.
   - Output: `pi nana-rulings.md updated replaced a symlink with a copy (the link's target was not written through)`.
   - The source hash is unchanged and the result is a regular file (`-rw-r--r--`). Doctor shows ✓ for both. HOLDS.
6. Stale win32 copy: I appended a ruling to the pack file, as a pull would, without re-installing.
   - Doctor shows `✗ rule nana-rulings.md` and `✗ pi nana-rulings.md`.
   - The extension still injects the old copy (known limit 3).
   - Re-install: `backed up … -> nana-rulings.md.bak-20261019, then copied`. HOLDS.
7. `uninstall --yes` after probe 1.
   - Output: `+ rule link nana-rulings.md updated unlinked …` and `+ pi rule link nana-rulings.md updated unlinked …`.
   - Both links are gone. The pack's `rules/nana-rulings.md` is still there. HOLDS.
8. `uninstall --yes` with a hand-made regular file at `$PI/nana-rulings.md`.
   - Output: `– pi rule link nana-rulings.md skipped left — found regular file`.
   - The file still reads "hand text". HOLDS.
9. `node packages/nana-setup/bin/install-check.mjs` → exit 0, 13 PASS. HOLDS.
10. Map check: "0 problem(s)", exit 0. Readme check: "691 claims checked; 0 problem(s)", exit 0. All nine new rows are `implemented`. HOLDS.
11. `install --dry-run` with an outside `PI_CODING_AGENT_DIR` prints `would link` for both rows. Afterwards neither `$H/.claude` nor the agent dir exists. HOLDS.
12. Adjacent tests: runtime-map, config-handlers-malformed, readme-check, pi-registration, writing-injection, install, seat-rule and win32-degrade all exit 0. HOLDS.
13. `node packages/nana-pack/tests/templates-render.test.mjs` → exit 1.
    - Output: `FAIL shared runtime matrix declares four runtime surfaces, ten capabilities, and the discovered source inventory`.
    - Base b3f6ec2: exit 0, 164 PASS.
    - With `extensions/nana-rulings.ts` moved out of the lane copy: exit 0, 0 FAIL. FINDING.

Findings:
- MUST: the new extension breaks an existing check, so the suite is red on the tip that would land.
  - The test is in `packages/nana-pack/tests/templates-render.test.mjs`, check marked `req: R-680 R-985`.
  - `runtimeInventory()` collects every `.ts` file in `packages/nana-pack/extensions`. Each one needs an entry in `RUNTIME_INVENTORY_TEXT` and text in the shared runtime table (`templates/_shared/working-under-nana-pi.md`).
  - `nana-rulings` has neither, so the check fails.
  - The plan's known limit 7 says the AGENTS runtime table and its template are "left to a later lane". An existing check forbids leaving them: R-985 requires every discovered extension in the table.
  - So the land would carry a red check (R-680/R-985 violated), against the land rule that the suite passes on the reviewed tip.
  - Fix in this lane: add a `nana-rulings` cell to the pi rows of the shared table, regenerate AGENTS.md, and add the test's inventory entry.
- Known bug (low): on win32 every refresh of a changed rulings file leaves a dated backup next to it, in `~/.claude/rules` and in the pi agent dir.
  - The cause is the existing copy-and-back-up step that all rule files go through.
  - Rulings change with most lanes that record a ruling, so these backups pile up on Windows.
  - The names end in `.bak-YYYYMMDD`, not `.md`, so Claude Code does not load them as rules (inferred from how rule files are picked up, not tested).

---

Seat note: the checker ran on 743c568 (build 1), not on 6d6a82a; this file is named for the tip the seat's record covers. Its MUST was fixed in build 2 (fa83ab3): the runtime table and its template now name the rulings surface, and templates-render passes on CI's macOS, Ubuntu and Windows legs at 9c993df. Its low known bug (dated backups pile up on Windows) is a HANDOFF residual. No independent check re-ran on build 2 or the merge of main b8ace0b; the pairs on 9c993df and CI at 9c993df cover them.
