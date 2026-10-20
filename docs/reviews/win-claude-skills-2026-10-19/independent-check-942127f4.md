# Independent check — win-claude-skills at 942127f4 (2026-10-19)

VERDICT: HOLDS

Setup: a private clone at <tmp>/win-claude-skills-check.Spkexj, with lane tip 942127f4 in lane/, baseline d4423eff in base/, and a main-to-lane pull simulation in up/. Every probe used a temp HOME under that folder. The worktree, main and the real home were not touched; `git status` in the clone stayed clean after the link probe.

Must-meet tests (single files, temp HOME):
- `node packages/nana-setup/tests/retired-artifacts.test.mjs` → exit 0. "PASS R-1901 …", "PASS R-1902 …", no FAIL. Holds.
- `node packages/nana-setup/tests/stale-copies.test.mjs` → "SUMMARY PASS=13 FAIL=0", with R-1761, R-1762 and R-1763 passing. Holds.
- `node packages/nana-setup/tests/skills-and-standards.test.mjs` → "PASS=82 FAIL=6". R-351, R-938, R-388, R-359 and R-1903 pass. R-1900 fails only on `doctor exit 0`, because the temp home's doctor has `✗ pi pi-subagents not installed`. The baseline d4423eff in the same environment gives "PASS=78 FAIL=5", the same five doctor-exit checks. Environmental. R-1900's own rows were checked directly in P1. Holds.
- CI on 942127f4 (`gh run view 39357366425`): install-check windows-latest success, install-check macos-latest success. The suite legs on ubuntu, macos and windows were still in progress when I checked. Pending.

Probes:
P1. Fresh install then doctor, forced win32 (`NANA_SETUP_PLATFORM=win32 nana-setup install --home $H`, then `doctor`):
  install exit 0; "+ skill spec created 1 file copied (no symlink on this platform)" for all five skills.
  doctor: "✓ skill spec copied from …/nana-pack/skills/spec (no symlink on this platform)" for all five. Its only ✗ row is pi-subagents (environmental). Holds.
P2. Upgrade from main to the lane on win32 (one clone: install on d4423eff, checkout 942127f4, then the adoption checker `bin/stale-copies.mjs`):
  on main: "– skill spec skipped (win32)" ×4, and the checker prints nothing.
  after the pull: "[nana:install] INSTALL STALE: skill spec, skill py-lint, skill py-review, skill py-test — … install".
  install: "+ … created" ×4, exit 0. The checker is then silent, and a 2nd install prints "nothing to do — everything was already in place (6 skipped)". Holds.
P3. macOS regression (no forced platform):
  install creates five symlinks into nana-pack/skills; 2nd install "nothing to do … (2 skipped)"; doctor "✓ skill spec -> …" ×5; checker silent. Holds.
P4. Forced win32, a symlink at spec pointing to the pack's own spec folder, plus a dangling link at py-lint:
  install exit 1, "✗ skill spec problem a symlink or junction is already at …" (same for py-lint).
  The pack's spec folder still holds only SKILL.md: no marker was written through the link, and the clone stayed clean.
  settings.json was still written, so the other steps ran.
  doctor: "✗ skill spec a symlink or junction is there instead of nana-setup's copy …".
  The checker names both paths to move. Holds.
P5. Forced win32, owner edits the spec copy twice on one day, with an install after each edit:
  "+ skill spec updated" ×2; the folder holds "SKILL.md.bak-20261019: edit one" and "SKILL.md.bak-20261019-2: edit two". No backup was overwritten, and no `.bak` entry appeared in the skills folder. Holds.
P6. Forced win32, the pack's py-lint SKILL.md changed in the clone to simulate a pull:
  checker "INSTALL STALE: skill py-lint"; install "updated"; the checker is then silent. The folder now holds `.nana-setup-copy`, SKILL.md and SKILL.md.bak-20261019. Holds (see K2).
P7. Forced win32, dry run on an empty home: exit 0 and "+ skill … created" ×5, yet `.claude/skills` does not exist afterwards. Holds.
P8. Forced win32 uninstall on an installed home: exit 2, and all five copies are still present. Holds.
P9. Forced win32, the captured legacy spec fixture converted to CRLF:
  "– retired .claude/skills/spec skipped unrecognized …" and "✗ skill spec problem a directory is already at …", exit 1.
  The folder is byte-identical (sha256 equal) and no backups folder was created. Holds. This runs the plan's inferred CRLF limit, which is now confirmed.

Findings (no MUST):
K1 (known bug, cosmetic): on win32 every repeat install prints four rows like "– retired .claude/skills/spec skipped unrecognized kind or provenance at …/skills/spec — left untouched". These rows point at nana-setup's own marked copies (P2's 2nd install). The cause is in packages/nana-setup/lib/steps.mjs stepRetiredArtifacts: the win32 skip was removed, but nothing replaced it for a marked copy. Exit code and the summary are unaffected. The wording tells a Windows owner their managed skill is an unrecognized artifact. A fix would skip the row when `.nana-setup-copy` is present.
K2 (known bug, extends existing behaviour): each pack change to a skill leaves a SKILL.md.bak-<date> of nana-setup's own earlier copy in that folder (P6). `requirements` already did this on main; now all five skills do, so the backups build up over pulls. Nothing is lost.
K3 (known limit, now confirmed): a CRLF or edited legacy copy of spec, py-lint, py-review or py-test moves win32 install from exit 0 on main to exit 1 (P9). Nothing is lost and the move fix is printed. Windows users with legacy copies from a CRLF checkout are the realistic case. Linked or occupied paths get the same exit 0 to exit 1 change (P4); the plan documents it.
K4 (test quality, low): the R-1900 test requires doctor exit 0 overall, so it fails on any unrelated ✗ row, such as pi-subagents missing in a temp home. Its row-level regex holds (P1).
K5 (status): the suite legs, including Windows suite, had not finished on 942127f4 at check time. The 13 Windows-only checks the plan rewrote are proven only once that leg is green.