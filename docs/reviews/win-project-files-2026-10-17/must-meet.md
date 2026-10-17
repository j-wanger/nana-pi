# win-project-files — project instruction files work on Windows (W1 of the Windows fixes, 2026-10-17)

**The feature.** On a Windows clone, Claude Code loads a nana project's instructions, and `nana-setup project`
refreshes a stale AGENTS.md working region. Today both fail: git for Windows checks out the committed `CLAUDE.md`
symlink as a 9-byte text file reading `AGENTS.md`, so Claude Code loads no project instructions (the owner's open ask
since 2026-10-12), and the refresh renames over a file it still holds open, which Windows refuses
(`packages/nana-setup/lib/project.mjs:223-236`). The lane also turns on the Windows CI leg's verbose output, so every
later Windows lane can read a failure's detail from the log.

**Design.** `CLAUDE.md` becomes a regular one-line file, `@AGENTS.md`, on every platform: Claude Code imports a
repo-relative `@path` with no approval prompt (https://code.claude.com/docs/en/memory.md, imports; checked
2026-10-17). nana-pi's own `CLAUDE.md` changes from mode 120000 to a regular file. `nana-setup project` writes the
import file for a new project on every platform; `--check` accepts the import file and a link to AGENTS.md (existing
macOS projects keep their link), and flags anything else that is not the project's own CLAUDE.md, the 9-byte placeholder
included; a refresh replaces the placeholder (exact bytes `AGENTS.md`, optional newline) with the import file and never
writes through a link. The working-region refresh closes its descriptor after the identity and byte re-check and before
the rename, and retries briefly on EPERM or EBUSY. CI's Windows suite leg runs `npm test -- --verbose`.

**Lane class: ordinary** (nana-setup project, not install, uninstall or doctor). One final reviewer. It touches
`packages/nana-setup/`, so the install check runs before the land. Threat model: honest variation in our tools' output
and in git's checkout settings in scope; deliberate forgery out. The adversary's points on this lane (`attack.md` 1.1,
2.3) are taken: no test pins writing a copy of AGENTS.md into CLAUDE.md.

## Rows (one per must-meet test; PF4 is evidence from the Windows CI leg on existing rows)

| ID | Text |
|---|---|
| R-1310 | nana-pi's committed `CLAUDE.md` shall be a regular file whose content is the line `@AGENTS.md`. |
| R-1311 | `nana-setup project` shall write a new project's `CLAUDE.md` as the one-line import `@AGENTS.md` on every platform. |
| R-1312 | `nana-setup project --check` shall report ✗ for a `CLAUDE.md` holding only the text `AGENTS.md` and ✓ for the import file or a link to AGENTS.md, and a refresh shall replace that placeholder with the import file and never write through a link. |
| R-1313 | The CI workflow's Windows suite leg shall run the suite with `--verbose`. |

Rows that today describe `CLAUDE.md` as a link or a win32 copy are reworded to the import file; the builder finds them by
searching `REQUIREMENTS.md` for CLAUDE.md, and keeps their IDs.

## Must-meet tests

- **PF1.** nana-pi's committed `CLAUDE.md` is a regular file (git mode 100644) whose content is `@AGENTS.md` and a
  newline.
- **PF2.** `nana-setup project` on a new folder writes `CLAUDE.md` as that import file, with
  `NANA_SETUP_PLATFORM=win32` forced and on the host platform alike.
- **PF3.** `nana-setup project --check` reports ✗ for a `CLAUDE.md` holding the 9-byte placeholder, ✓ for the import
  file and for a link to AGENTS.md; a refresh turns the placeholder into the import file and leaves a link untouched.
- **PF4.** `packages/nana-setup/tests/project-working-region.test.mjs` and `packages/nana-setup/tests/project.test.mjs`
  pass on the Windows CI leg: each file's Windows pass count equals its macOS count minus declared win32 skips, each
  skip printing its reason.
- **PF5.** `ci.yml`'s Windows suite leg runs the suite verbose (`packages/nana-pack/tests/ci-workflow.test.mjs`).

Every Windows lane also holds: no other file's Windows or macOS pass count drops against the run at the lane's base, and
the lane's final green Windows run id goes in its corpus. Proof: a draft PR from the lane branch; the seat pushes and
reads the Windows job log once per build.

## Known limits

A Windows clone made before this lands keeps its placeholder until the owner pulls (git rewrites the file because its
mode changes) or runs `nana-setup project`. Other projects' links stay links on macOS; their Windows clones need one
`nana-setup project` run.
