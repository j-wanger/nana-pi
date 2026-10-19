# Independent check — win-skill-occupied at 6974bce (2026-10-19)

VERDICT: HOLDS

Setup: a private clone at 04c14e8, plus a second clone at b3f6ec2 for the main-era baseline. Both live under `$P=<tmp>/win-skill-occupied-check.9SbQng`. Every probe used its own temp home, and the forced-win32 probes set `NANA_SETUP_PLATFORM=win32`. I edited no repository; the clone's `git status` is clean.

Must-meet and guard files, each run alone:
- `node packages/nana-setup/tests/skills-and-standards.test.mjs` gave `PASS=75 FAIL=5`. All six R-1420–R-1425 checks and the R-1426 check passed. The same 5 FAILs appear at b3f6ec2 (`PASS=69 FAIL=5`). All 5 are "doctor exits 0" or "green again" checks. They fail because doctor reads `✗ pi pi-subagents not installed` in a temp home. The lane did not cause them.
- `install.test.mjs`, `retired-artifacts.test.mjs` (`PASS=1 FAIL=0`), `win32-degrade.test.mjs`, `uninstall.test.mjs` and `requirements-tree.test.mjs` (`all passed`, leaf total 1,222) all exit 0.

Wrong-code runs: I changed one line of `steps.mjs` at a time and restored it after each run.
- M1, no CRLF read: `FAIL win32 pre-marker copy … LF and CRLF`. The test catches it.
- M2, marker not read: `FAIL win32: install refreshes the stale copy` (R-1426). The test catches it.
- M3, history list ignored: `FAIL win32 pre-marker copy … LF: 1`. The test catches it.
- M4, install never refuses: R-1420, R-1421, R-1422 and R-1423 all FAIL. The tests catch it.

Probes (win32 forced unless noted):
1. Owner's own folder with a CRLF SKILL.md, a `references/mine.md` subfolder and an old `.bak-` file. I ran install, `--dry-run` and doctor. Output: `✗ skill requirements problem a directory is already at …/requirements — left untouched; move or remove it, then re-run`. Exits were dry 1, install 1, doctor 1. Snapshot `SKILL.md:f9b6a42052|SKILL.md.bak-20260101:73cb3858a6|references:D|references/mine.md:444e0fffbd` was the same before and after. `od` shows the CRLF bytes intact. HOLDS.
2. Upgrade path. Install from main gave `exit 0; files: SKILL.md`. Install from the lane then gave `+ skill requirements updated` with exit 0 and files `.nana-setup-copy SKILL.md`. A second lane run gave `· skill requirements unchanged`. Doctor gave `✓ skill requirements copied from …`. The marker reads `nana-setup wrote this skill copy`. Install from a clone at another path gave `unchanged` and `marker bytes unchanged`. HOLDS.
3. Unmarked copy of the 14e1bdc version in CRLF, plus an owner `notes.md` and `SKILL.md.bak-20261001`. Doctor before install read `✗ … copy is stale or incomplete (SKILL.md) — re-run`, which is not the refusal message. Dry run exited 0 and wrote nothing. Install exited 0 and SKILL.md now equals the pack. Files after: `.nana-setup-copy notes.md SKILL.md SKILL.md.bak-20261001 SKILL.md.bak-20261019`, and the owner's files still read `mine` and `old`. HOLDS.
4. Marked copy whose SKILL.md the owner later edited. Install gave `updated` and exit 0. The edit is kept in `SKILL.md.bak-20261019` (`bak has edit: 1`), as main does. HOLDS.
5. Owner SKILL.md with `.nana-setup-copy` as a directory, then as a symlink. Both gave `✗ … left untouched` and exit 1, and the owner's `# MINE` stayed. This fails closed. HOLDS.
6. An empty folder gave `✗` and exit 1. That is a stated known limit, and macOS does the same. A marked folder with SKILL.md deleted gave `updated`, exit 0, and files `.nana-setup-copy SKILL.md`. HOLDS.
7. Current pack SKILL.md with a UTF-8 BOM and no marker gave `✗ … left untouched` and exit 1. It fails closed and loses nothing. This is the adversary's named risk for the owner's machine. HOLDS.
8. Native darwin, no forced platform, owner folder present. Base and lane both gave `✗ … left untouched`, exit 1 and `# MINE`. The macOS path is unchanged. HOLDS.
9. Fresh home, `--dry-run` only. Output: `+ skill requirements created`, exit 0, and the skills folder is still empty. The dry run did not write the marker. HOLDS.
10. SKILL.md as a symlink to an owner file. Base: `updated`, the link was replaced by a copy, and the owner file stayed. Lane: `✗ … left untouched`, exit 1, and the owner file stayed. The lane is stricter and nothing is written through the link. HOLDS.

History list: `git log` of the skill file at 04c14e8 shows 12 versions, from 79114a0 back to ec7c17c. All 12 sha256 values are in `skill-copy-history.json`. `.gitattributes` dates from 2026-10-07, after ec7c17c, so early Windows copies may be CRLF. The CRLF-to-LF read covers that case.

Findings (none MUST):
- Known bug, list completeness: branch `feat/tree-briefs` changes `packages/nana-pack/skills/requirements/SKILL.md`. The risk is that it lands before this lane and the list is not recomputed after the merge. Then a Windows copy installed in between, unmarked, would be refused. No test pins list completeness; the plan records this as a known limit and a seat `git log` check. Nothing is lost, because the refusal leaves the folder alone.
- Known bug, docstring: `ownSkillCopy` in `packages/nana-setup/lib/steps.mjs` says ownership is "decided with `lstat` alone — never following a link". Its second test, byte-equal to the pack, calls `readFileSync`, which reads through a leaf symlink. It only reads and never writes; probe 10 shows no write through the link. The comment is wrong, but nothing is harmed.
- Note, not a defect: on native Windows the old section-4 known-bug checks became one SKIP. CI's Windows skip count goes from 3 to 4. Section 4b covers that path natively.

The claim I would most expect to be wrong: all win32 evidence here is forced on darwin. Real Windows lstat and junction behaviour is unverified until CI's Windows leg runs.
