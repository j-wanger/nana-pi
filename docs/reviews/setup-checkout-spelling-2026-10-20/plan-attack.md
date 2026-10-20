# setup-checkout-spelling — plan attack (one adversary)

Verdict: AMEND

AMEND. I probed in temp clones of main 6bc2f727 (macOS APFS, temp homes). The repo is untouched and the probe folder is removed.

**What held**
- Every red-today claim in the seat's plan holds:
  - R-1980 POSIX: 21 rows differ (22 ✗ against 1). Forced win32: 10 differ.
  - R-1981: install exits 1 and calls four of its own skill links foreign.
  - R-1982: 16 links plus settings.json change. Forced win32: 26 snapshot lines change.
  - R-1983: through the second spelling, the stale line tells the user to move nana's own skills.
  - Old R-1984 (pi step, non-git root): 3 pi calls in both directions.
  - Old R-1986: exits 1.
- The design (realPath at pkgRoot plus native compares) turns all of them green.
- With the amended design, 19 related test files keep main's counts on macOS (690 + 194 checks). restore.test.mjs fails in a temp clone on main too.

**Amendments**
1. Uninstall's per-link removal compare must move too (uninstall.mjs, about line 117).
   - Probe of the seat's preflight-only change: `uninstall --dry-run` exits 0, so old R-1986 passes. But all 20 links read "symlink resolves outside repository" and none would unlink. Settings hooks and seeds would go while every link stays.
   - With the line moved: 20 would unlink, 0 outside.
   - The row and test now assert one "would unlink" per link, not only exit 0.
2. Old R-1984 (pi step, non-git fixture) is dropped. Pi entries join the earlier-home row instead.
   - Doctor's "pi packages" row and install's pi step share `packageCoverage`.
   - In a git clone, main's doctor marks "pi package source ✗" for entries written through another spelling. It tells the user to `pi remove` their own entry. That is the user-facing harm; the old R-1984 was only red in a non-git root.
   - Probe: with pi entries, the earlier-home check is red on main (26 / 11 rows differ) and green on the design.
   - Wrong code W3 (restoring realpathSafe's walk) turns it red through the pi rows.
   - Rows are renumbered R-1980 to R-1985.
3. Four more JS realpath compares move to `realPath`: the two retired-hook compares and `pathVisibleNode`'s candidate. These are steps.mjs lines about 374, 388–389 and 802.
   - Once `realpathSafe` is native, line 802 would compare JS against native.
   - Once pkgRoot is canonical, a pre-.mjs install made through a typed spelling would give a PROBLEM row and install would exit 1.
   - None of these has a test.
4. Honest pair coverage: probed W1 alone leaves R-1981 and R-1983 green, while R-1982 goes red in both forms and R-1980 in win32. By analysis W5 alone leaves both green too. Only today's code turns them red. The brief now says so.
5. New known limits:
   - Uninstall leaves an earlier-spelling knowledge hook entry, reported as a variant (exact-text match). Today, uninstall through that same spelling removes it.
   - The desk plist reads ✗ until `install --desk`.
   - The pi rulings extension's stale check shares `linkOk` but is never loaded through a second spelling.
6. The fixture must fail, not pass, when it rewrites no hook entry (or no link in POSIX form). On native Windows it rewrites both separator forms.

**Lane class:** install, hook or gate. It is right: install, doctor and uninstall, the stale-copy hook, and a pi extension's dependency.

**Files the build touches:** packages/nana-setup/lib/{paths,stale-copies,doctor,steps,hook-health,settings,uninstall}.mjs, the new packages/nana-setup/tests/checkout-spelling.test.mjs, packages/nana-setup/README.md, REQUIREMENTS.md, and the regenerated docs/requirements-tree.md and docs/code-map.md.

**Conflicts**
- win-silent-skips, win-hook-settings-repair and win-watchdog-cpu-read are already on main (6bc2f727). The plan's wait is over.
- mutation-runner-win-lock and review-test-waits touch only nana-pack files. They share only the regenerated REQUIREMENTS, code-map and tree files: regenerate on merge.
- doctor-fix-line edits doctor.mjs, probably `skillLinkState` (inferred, no plan seen). Build one after the other: whichever lands second merges main and re-runs its pairs.
- win-config-json-path may touch paths.mjs (inferred). If it does, it clashes with the pkgRoot line and header.
- The windows-skip-lines scanner covers a fixed file list, so the new test is not scanned.

**The one claim most likely wrong:** on Windows, node keeps the typed spelling (lowercase drive letter, RUNNER~1) in the module path, while native realpath returns the long, uppercase form. Then the Windows checks are red before the fix. Nothing ran on Windows. If node already normalizes the drive letter, that spelling is green before the fix, and the report must say so.
