# install-honest-report: install tells the truth about a held lock and its own skill links (2026-10-19, main f29827a)

Feature: FEAT-013 · Install and connect harness runtimes (rows under SUB-014 · Preserve files and preview installation changes)

**Feature.** If a settings lock from another run already exists, `nana-setup install` stops before its first write, so its "Nothing was written" line is true. A re-run over a home that install set up prints no retired row for the skill links install made, so its summary counts no extra skipped rows. A link that is not nana's own is still reported.

**Class: install.** Changes `nana-setup install`: `install()`, `stepSettings` and `stepRetiredArtifacts` in `packages/nana-setup/lib/steps.mjs`. Ladder: the roster reviewer, the land reviewer, wrong-code pairs, one independent check, the mutation runner, and `install-check.mjs` on macOS before `nana-land`.

**Threat model.** In scope (honest variation): a lock left by an interrupted run (any pid, any age, unreadable content); a second nana-setup run at the same time; skill links install made; a canonical link spelled relatively; a link to another pack skill or an outside folder; a link at a legacy skill name install no longer links; a recognized legacy artifact waiting to retire; win32. Out of scope (forgery): a crafted lock, or a planted look-alike pack tree. A finding outside the model is a residual.

## Design
- **Lock before the first write.** `install()` keeps the preflight `readClaudeSettings` first, so a bad settings file still aborts without taking a lock (R-924). Outside a dry run, it then calls `withSettingsLock` once around the Claude-home steps: retired artifacts, hooks, rules, skills and settings. The lock is released when the settings step returns or throws. The later steps (shared memory, pi config, subagent, reviewer, knowledge, PATH, desk, pi registration) run after the release, as today, so a Ctrl-C during a slow `pi install` or knowledge build leaves no lock behind. Report row order does not change.
- **No second acquisition.** `stepSettings` takes an explicit "lock already held" argument, and only `install()` passes it. Called alone, as the settings tests do, it still takes the lock itself. The in-lock re-read and the compare against the preflight snapshot stay.
- **Dry run** never takes the lock and is not blocked by one (R-926).
- **Kept as is:** no stale-lock reclamation, the lock message text, uninstall's own lock call, and the win32 skip of the four pi-only names in the retired step.
- **A link at a managed skill name belongs to the skill step.** In `stepRetiredArtifacts`, after the ancestor check and the lstat, an entry `.claude/skills/<name>` with `<name>` in `NEW_CLAUDE_SKILLS` whose lstat is a symbolic link yields no row. `stepSkills` inspects that same path next and already reports every link there that is not the pack's own as ✗ "foreign link … left untouched" (R-665). Every other entry reports exactly as today, including a link at a retired name install does not link (py-init, ts-init, nana-init, nana). There is no realpath compare. The retired step never moves a link, so its row at these four names was noise for a canonical link and a duplicate of the ✗ row for a foreign one.
- **Docs:** the `steps.mjs` header names the lock's extent. The nana-setup README covers the lock paragraph, one clause in the retired-artifacts row of the install table, and the install and settings-merge test-table rows. Run `npm run map`.

## Must-meet tests
| Row | Row text (EARS) | Test (file::title) | Today |
|---|---|---|---|
| R-1590 | IF the settings lock file already exists when install starts, THEN install shall exit 2 without creating, moving, linking, copying or removing anything under the home it was given. | `packages/nana-setup/tests/settings-merge.test.mjs::lock: a held lock stops install before its first write` | RED. A held lock and an empty `.claude/enforce` gave exit 2 and "Nothing was written". The home then held 5 hook links, 6 rules and 5 skill links, and the flag was in `.claude/backups/<date>-retired/`. Red on win32 too: under NANA_SETUP_PLATFORM=win32, rules were copied and the flag retired (17 new entries). |
| R-1591 | WHEN install runs again over the Claude skill links it made, it shall print no retired row for those skills. | `packages/nana-setup/tests/install.test.mjs::second install prints no retired row for a skill it linked` | RED on POSIX: run 2 printed four `– retired .claude/skills/<spec, py-lint, py-review, py-test>  skipped  unrecognized kind or provenance` rows. Green on win32 before and after, because those names are never linked or examined there. |
| R-1592 | WHEN install runs again over a home it set up with nothing changed since, it shall report no more skipped rows than the run that set it up. | `packages/nana-setup/tests/install.test.mjs::second install reports no more skipped rows than the first` | RED on POSIX: run 1 printed 2 skipped rows, run 2 printed 6 ("(6 skipped)"). Equal on win32 (14 and 14). |
| R-1593 | IF a symbolic link sits at a retired Claude skill name that install does not link, THEN install shall report it as an unrecognized retired artifact and leave the link unchanged. | `packages/nana-setup/tests/retired-artifacts.test.mjs::a link at a retired skill name install does not link is still reported unrecognized` | GREEN guard. Under "skip every symlink under .claude/skills/" a probe showed no row at all and exit 0, so the link was reported nowhere. Runs on every platform. |

**Test shapes.**
- R-1590 uses settings-merge `freshHome`, lock content `{pid: 4242, at: now − 90 s}` and an empty `.claude/enforce`. It snapshots the whole home before and after: relative names, kinds, link targets and bytes, by lstat only. One check: status 2, stderr includes "Nothing was written", and the two snapshots are equal.
- R-1591 and R-1592 reuse install.test section 2's `first` and `second` runs, with no new install. R-1591: `!/retired \.claude\/skills\//.test(second.stdout)`. R-1592: the count of row lines starting with the skipped symbol `–` in `second` is at most the count in `first`. Both run on every platform.
- R-1593 uses a fresh `home()`. It makes `.claude/skills/nana` with `fs.symlinkSync(outside, target, "junction")` to an outside temp folder holding a `SKILL.md`. Off win32 the type argument is ignored, and on win32 a junction needs no privilege. Record `readlinkSync` before `install(h)`. One check: stdout matches `/retired \.claude\/skills\/nana\s+skipped\s+unrecognized kind or provenance/`, and readlink equals the recorded value. It asserts no exit code, because that row is skipped rather than ✗. No platform guard.

**Existing guards that must stay green.** `retired-artifacts.test.mjs::foreign newly managed skill link survives end-to-end install` (R-665) pins that a foreign link at a managed name is still reported ✗ and kept. `recognized Claude skill and empty flag move under dated backups` catches a skip by name rather than by link.

**Pin on an existing row.** Add `// req: R-926` above the existing check `lock: --dry-run is not blocked by a lock` and leave the check unchanged. Flip R-926 to implemented, citing that check.

**Probes.** All ran on main f29827a in a scratch clone with a temp HOME and `--home`. A candidate patch of 13 insertions and 9 deletions in `steps.mjs` (the design above) turned all three red probes green:
- A held lock gave exit 2 with the home unchanged.
- The re-run printed 2 skipped rows on both runs and no retired rows.
- A foreign link at spec produced only the ✗ skill row, with exit 1.
- A link at nana kept its retired row.
- Test files: settings-merge 216/0, retired-artifacts 47/0, uninstall 31/0, win32-degrade 98/0, install 101/0, state-manifest 20/0.
- skills-and-standards failed the same 5 doctor checks with and without the patch in the sandbox, so those failures come from the environment.

## Known limits
- The lock ends at the settings step. A second run started during the later steps proceeds, as today. No test pins the lock's extent.
- No test separates "take the lock before the first write" from "check for it before the first write, take it at settings". The second keeps a race in which two runs start together and the loser's "Nothing was written" is false. The reviewer checks this by reading the code.
- `--dry-run` with a held lock exits 0 (R-926), which differs from R-313's "same exit codes". Recorded as a residual.
- An interrupted run still leaves the lock. The next run stops before writing and says so. There is no reclamation, and doctor does not report a leftover lock.
- A link into another checkout's pack is foreign (R-665). It now gets only its ✗ skill row and no retired row.
- R-322 and R-924 stay untested. Their checks exist but are untagged. Recorded as a residual.

## Rows the builder adds as `planned` first (under SUB-014)
- **R-1590**, **R-1591**, **R-1592**, **R-1593**: the row text exactly as in the table above.