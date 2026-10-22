# win-skill-occupied: Windows refuses a skill folder it did not make (2026-10-19, main b3f6ec2)

**Feature.** On Windows, install and `--dry-run` exit 1 and leave the requirements skill folder byte-identical when nana-setup did not make it, and doctor marks it ✗ with the move fix. Copies nana-setup made, marked or older and unmarked, keep refreshing as today. This is macOS's behaviour on the Windows copy path.

**Class: install.** Changes `nana-setup install` (`linkSkill`, win32 branch) and `doctor` (`skillLinkState`, win32 branch). Default ladder: the roster reviewer, the land reviewer (or a seat land review), wrong-code pairs, one independent check, and `install-check.mjs` on macOS before `nana-land`. Applying any ruling from the owner on land verification is the seat's job, not this plan's.

**Threat model.** In scope: honest variation in our own output. That covers a copy written by today's or an older nana-setup, LF or CRLF, `.bak-` files from earlier repairs, files an owner added, and an owner's own `requirements` skill. Out of scope: forgery, such as a planted marker or a byte-copied nana SKILL.md in a foreign folder.

## Design
- **Ownership.** A real directory at `~/.claude/skills/requirements` counts as nana-setup's copy when any one of these holds (lstat only, never followed):
  1. It holds a regular file `.nana-setup-copy`, the marker.
  2. Every file the pack ships is byte-equal to the pack. This is doctor's ✓ test today, so install never refuses what doctor calls ✓.
  3. Its regular-file `SKILL.md`, with CRLF read as LF, has a sha256 in a frozen list. The list holds the 12 versions shipped before the marker, ec7c17c to 79114a0. The file has had only this path.
- Any other real directory is a directory nana-setup did not make.
- **Install (win32).** `mirrorDirsProblem` runs first (R-352). Then a directory nana-setup did not make returns PROBLEM before any write, dry run included. The detail is the POSIX text: `a directory is already at <path> — left untouched; move or remove it, then re-run`. Otherwise install mirrors as today. Then `writeIfChanged` writes the marker with constant content (no path, no time), and its status folds into the step's. A second run stays "nothing to do" (R-300).
- **Doctor (win32).** A directory nana-setup did not make reads `✗ … a directory is there instead of nana-setup's copy of <source> — move it, then re-run \`nana-setup install\``. Every other detail is unchanged.
- One exported predicate `ownSkillCopy` and one constant `SKILL_COPY_MARKER` in `steps.mjs` serve both install and doctor. The list lives in `lib/skill-copy-history.json` as `{sha256: "<short commit> <date>"}`, after the `retired-fingerprints.json` precedent.

## Must-meet tests
All are in `packages/nana-setup/tests/skills-and-standards.test.mjs`. R-1420 to R-1425 go in a new section 4b. R-1426 tags an existing section-6 check. Each forces `NANA_SETUP_PLATFORM=win32` off Windows and runs natively on Windows; the file passes on CI's Windows leg today (55 pass, 3 skip). No skip.

| Row | Row text (EARS) | Test title | Today |
|---|---|---|---|
| R-1420 | WHERE the platform is win32, IF a directory that nana-setup did not make occupies the requirements skill path, THEN install shall exit 1 with a ✗ line naming that directory and the move-or-remove fix. | win32 occupied skill dir: install exits 1 with ✗ naming the directory and the fix | RED: exit 0, `updated 1 file copied` |
| R-1421 | WHERE the platform is win32, IF a directory that nana-setup did not make occupies the requirements skill path, THEN install shall leave that directory's entries and bytes unchanged. | win32 occupied skill dir: the owner's folder is byte-identical after install | RED: folder became `SKILL.md` (pack) + `SKILL.md.bak-20261019` |
| R-1422 | WHERE the platform is win32, IF a directory that nana-setup did not make occupies the requirements skill path, THEN install --dry-run shall exit 1 with that directory unchanged. | win32 occupied skill dir: --dry-run exits 1 and leaves the folder unchanged | RED: exit 0 |
| R-1423 | WHERE the platform is win32, IF a directory that nana-setup did not make occupies the requirements skill path, THEN doctor shall mark the skill ✗ with a detail saying a directory is there instead of nana-setup's copy and to move it. | win32 occupied skill dir: doctor reads ✗ — a directory instead of nana-setup's copy — with the move fix | RED: `copy is stale or incomplete (SKILL.md) — re-run` (✓ after today's install) |
| R-1424 | WHERE the platform is win32, IF an unmarked directory at the requirements skill path holds a SKILL.md that, with CRLF read as LF, equals a version the pack shipped before the marker, THEN install shall exit 0 with the pack's current SKILL.md in place. | win32 pre-marker copy: install exits 0 and refreshes a shipped older SKILL.md, LF and CRLF | GREEN guard: 0499e52 copy exits 0 and is refreshed; red under "no list" or "no CRLF read" |
| R-1425 | WHERE the platform is win32, WHEN install writes the requirements skill mirror, it shall place a regular file named `.nana-setup-copy` inside it. | win32 fresh mirror: install writes the .nana-setup-copy marker | RED: fresh mirror holds only `SKILL.md`. This test seals the marker name. |
| R-1426 | WHERE the platform is win32, IF the requirements skill directory holds a copy that nana-setup install wrote and its SKILL.md has since changed, THEN install shall exit 0 with the pack's current SKILL.md in place. | win32: install refreshes the stale copy (existing section-6 check, tag only) | GREEN guard: red under "marker not read" or "byte-equal to the current pack only". Every Windows machine depends on it at each future SKILL.md change. |

**Probes.** Run on this Mac at b3f6ec2 with a temp HOME and win32 forced. The foreign folder held only `SKILL.md` = `---\nname: requirements\n---\n# MINE\n`. An empty folder exits 0 today and is filled. SKILL.md has 12 versions with 12 distinct LF hashes; the current file is 79114a0.

**Guards that stay green:**
- All of section 6: the second run reports "nothing to do", the `.bak` lands beside the file, and R-665 holds.
- R-352 (section 7a).
- `install.test.mjs`: R-300 and its win32 mirror check.
- `retired-artifacts.test.mjs`: "win32 preserves requirements mirror behavior…".

**Fixture.** `tests/fixtures/skill-copy/requirements-0499e52.md`, made with `git show 0499e52:packages/nana-pack/skills/requirements/SKILL.md`. It is not named SKILL.md. The test reads it with CRLF turned into LF.

## Known limits
- An unmarked older copy whose SKILL.md was hand-edited, or matches no shipped version, is refused. The printed fix is "move or remove it, then re-run". Nothing is lost.
- An empty folder at the skill path is now refused on Windows (today it is filled). macOS does the same.
- The list is frozen at the lane's final tip. A seat check with `git log` proves it complete; no test does. The builder recomputes it after the last rebase.
- The marker counts by presence alone; a planted marker is forgery. A marked copy that an owner later rewrites is backed up and refreshed, as today.
- R-304, R-381, R-382 and R-388 are untested and worded for every platform. On Windows they now hold only for nana-setup's own copy. Recorded as a residual, not rewritten here.
- A hand-written Windows rule file is still backed up and replaced. macOS does the same, so it is out of scope.
- Real Windows proof comes from CI's Windows leg (non-blocking) and the owner's machine.

## Rows the builder adds as `planned` first (seat, 2026-10-19)

- **R-1420** — WHERE the platform is win32, IF a directory that nana-setup did not make occupies the requirements skill path, THEN install shall exit 1 with a ✗ line naming that directory and the move-or-remove fix.
- **R-1421** — WHERE the platform is win32, IF a directory that nana-setup did not make occupies the requirements skill path, THEN install shall leave that directory's entries and bytes unchanged.
- **R-1422** — WHERE the platform is win32, IF a directory that nana-setup did not make occupies the requirements skill path, THEN install --dry-run shall exit 1 with that directory unchanged.
- **R-1423** — WHERE the platform is win32, IF a directory that nana-setup did not make occupies the requirements skill path, THEN doctor shall mark the skill ✗ with a detail saying a directory is there instead of nana-setup's copy and to move it.
- **R-1424** — WHERE the platform is win32, IF an unmarked directory at the requirements skill path holds a SKILL.md that, with CRLF read as LF, equals a version the pack shipped before the marker, THEN install shall exit 0 with the pack's current SKILL.md in place.
- **R-1425** — WHERE the platform is win32, WHEN install writes the requirements skill mirror, it shall place a regular file named `.nana-setup-copy` inside it.
- **R-1426** — WHERE the platform is win32, IF the requirements skill directory holds a copy that nana-setup install wrote and its SKILL.md has since changed, THEN install shall exit 0 with the pack's current SKILL.md in place.
