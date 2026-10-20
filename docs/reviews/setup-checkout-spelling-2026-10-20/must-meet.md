# setup-checkout-spelling — must-meet

Feature: FEAT-013 · Install and connect harness runtimes (doctor and stale-line rows under FEAT-015, uninstall under FEAT-018)
Lane class: install, hook or gate. It covers nana-setup install, doctor and uninstall, the session-start stale-copy producer, and the pi rulings extension's stale check, which shares `linkOk`. Needs: wrong-code pairs, the land reviewer, one independent check, install-check on macOS before nana-land.
Threat model: honest spelling variation of the checkout's folder is in scope: letter case on a case-insensitive volume, a lowercase drive letter, a Windows 8.3 short name, and what an earlier install wrote under such a spelling. Out of scope: a forged link, a hand-edited entry naming a look-alike path, and the home folder's own spelling.

Feature (falsifiable): nana-setup treats every spelling of its checkout's folder as that folder. Run through a second spelling, doctor gives the same rows, install exits 0 and changes no byte under the home, and the stale-copy producer prints nothing. A home an earlier install wrote through another spelling still reads as this checkout's: its links, hook entries and pi package entries. Uninstall would remove its links.

## Design
- Root fix: `lib/paths.mjs` computes `pkgRoot` through `realPath` (packages/nana-pack/lib/real-path.mjs), the folder's spelling on disk. Everything else derives from it: repoRoot, sources, hook commands, launchers, pi entries.
- Compare sites: each `fs.realpathSync` that judges a path against the checkout moves to `realPath(x, { mustExist: true })`:
  - `linkOk`
  - `skillLinkState`
  - `linkSkill`'s foreign-link test
  - the retired-hook cleanup's two compares
  - `pathVisibleNode`'s candidate
  - the win32 settings rows
  - `knowledgeHookHealthy`
  - uninstall's `repoReal`, preflight targets and per-link removal target
  - `realpathSafe`'s body becomes `realPath(p)`. Pi identity, package source and the PATH row follow it.
- Kept on purpose: `linkFile`, `linkSkill`'s plain relink and `mergeRepoHooks`. They converge an earlier spelling once.
- Why both halves:
  - Compares alone still let an install through a second spelling relink 16 links (POSIX), rewrite 8 Windows launchers, and flip back next run.
  - pkgRoot alone turns an earlier-spelling home into doctor 22 ✗, install exit 1 and an uninstall refusal.
- Linux: native realpath equals what node already resolved. No change.

One-time change (seat decides): a home an earlier install wrote through another spelling converges on its next install.
- POSIX: links are relinked with no backup, and the knowledge hook command is rewritten.
- Windows: six hook entries are rewritten, and eight launcher files are rewritten with a dated backup each.
- Doctor reads that home ✓ before and after, except the four Windows launcher rows, which read ✗ until that install.

## Must-meet tests (all in `packages/nana-setup/tests/checkout-spelling.test.mjs`)
Red-today evidence: adversary probes on main 6bc2f727 in temp clones (macOS APFS, temp homes). "Forced win32" means NANA_SETUP_PLATFORM=win32. Green evidence: the same probes on a clone with this design.

| Row | Requirement | Test title | Red today |
|---|---|---|---|
| R-1980 (FEAT-015) | WHEN doctor runs through a second spelling of the checkout's folder (another letter case on a case-insensitive volume, a lowercase drive letter or an 8.3 short name) for a home that install set up through the folder's on-disk spelling, THEN doctor shall give every row the label and status it gives through the on-disk spelling. | `R-1980: doctor through a second spelling of the checkout gives the same rows as through its on-disk spelling` | POSIX: 21 rows differ (22 ✗ against 1). Forced win32: 10 differ (6 settings, 4 PATH launchers). |
| R-1981 (SUB-013) | WHEN install runs through a second spelling of the checkout's folder for a home that install set up through the folder's on-disk spelling, THEN install shall exit 0 with no problem row. | `R-1981: install through a second spelling of the checkout exits 0 and refuses none of its own links` | POSIX: exit 1; spec, py-lint, py-review and py-test reported as foreign links. Forced win32 already passes. |
| R-1982 (SUB-014) | WHEN install runs through a second spelling of the checkout's folder for a home that install set up through the folder's on-disk spelling, THEN install shall leave every file and link under that home byte-identical. | `R-1982: install through a second spelling of the checkout leaves the home byte-identical` | POSIX: 16 links relinked and settings.json rewritten. Forced win32: 6 entries rewritten; 8 launchers rewritten, each with a backup. |
| R-1983 (FEAT-015) | WHEN install has run through the checkout folder's on-disk spelling and then through a second spelling, THEN the stale-copy producer shall print nothing when run through either spelling. | `R-1983: after installs through both spellings the stale-copy producer prints nothing through either` | Through the second spelling, the stale line names the four skills and tells the user to move them. Through the on-disk spelling, it names 16 items. |
| R-1984 (SUB-013) | WHEN a home holds links, hook settings entries and pi package entries that an earlier install wrote through a second spelling of the checkout's folder, THEN doctor and install run through the on-disk spelling shall accept them as this checkout's, doctor giving the rows it gave before and install exiting 0 with no problem row. | `R-1984: links, hook entries and pi entries written through another spelling of the checkout still read as this checkout's` | POSIX: 26 rows differ (pi rows included); install exit 1 with 4 problem rows. Forced win32: 11 differ. In a git clone, main's doctor marks "pi package source" ✗ and advises `pi remove`. |
| R-1985 (FEAT-018) | WHEN a home holds links that an earlier install wrote through a second spelling of the checkout's folder, THEN uninstall --dry-run run through the on-disk spelling shall pass its preflight and report each of those links as one it would unlink. | `R-1985: uninstall --dry-run would unlink every link written through another spelling of the checkout` | Main: exit 1, "inventory links do not resolve inside". Preflight-only fix: exit 0, but 0 of 20 links would unlink ("resolves outside repository"). |

Platforms:
- macOS: the case spelling, in POSIX form and forced win32.
- Windows: native, with case, lowercase drive letter and 8.3 short name. The short name is the copy as os.tmpdir() spells it (RUNNER~1 on hosted runners).
- Linux: each check prints SKIP with its reason. The volume is case-sensitive, it has no drive letter or short name, and node resolves links itself.
- R-1985 runs in POSIX form only. Uninstall refuses on win32, forced included.

## Known limits
- Link spellings are not tested: node resolves a symlinked or junctioned checkout path itself.
- The home's own spelling stays out of scope, including the Windows "PATH resolves pi-review" text compare (an existing residual).
- Earlier-spelling Windows launchers are rewritten once, each with a backup. Their four doctor rows read ✗ until then. The R-1984 fixture leaves launchers in the on-disk spelling for that reason.
- Uninstall leaves an earlier-spelling knowledge hook entry, reported as a settings hook variant, because removal matches exact text. An install through the on-disk spelling converges it first. Today, uninstall through that same spelling removes it, so this is a small regression.
- A desk plist written through another spelling reads ✗ in doctor's desk row on the real home until `install --desk` (inferred, untested).
- No check covers the moved retired-hook and `pathVisibleNode` compares, or the pi rulings extension's stale section loaded through a second spelling.
- On a non-missing error (EACCES, ELOOP), `realpathSafe` now falls back as `realPath` does: to JS realpath or the path itself, not an ancestor walk.
- On a subst or mapped drive, the native realpath is believed to name the underlying path (inferred). Entries then hold that path.
- Doctor, install and the stale line print the on-disk spelling even when run through another.