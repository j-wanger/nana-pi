# setup-checkout-spelling — build brief 1

Feature: FEAT-013 · Install and connect harness runtimes
Lane class: install, hook or gate.
Work in `~/nana-pi-wt/setup-checkout-spelling` on `feat/setup-checkout-spelling`, from current main.
Must-meet: `docs/reviews/setup-checkout-spelling-<date>/must-meet.md`.

## Change, in this order
1. REQUIREMENTS.md: add R-1980 to R-1985 with the must-meet text, in the sections it names. Run `npm run req:tree`.
2. Write `packages/nana-setup/tests/checkout-spelling.test.mjs`.
   - Six-tag header; PASS/FAIL/SKIP lines like `tests/stale-copies.test.mjs`.
   - Each `// req: R-198n` sits directly above a line holding `check("R-198n: …", …`. A conditional skip stays on that same line.
   - Run it on today's code, record red and green per check, and commit.
3. Code, all through `realPath` from `packages/nana-pack/lib/real-path.mjs`:
   - `lib/paths.mjs`: `pkgRoot = realPath(<today's expression>)`. The header's `@effects` names the one disk read at import.
   - Change `fs.realpathSync(x)` to `realPath(x, { mustExist: true })` at these sites:
     - `linkOk` (stale-copies.mjs) and `skillLinkState` (doctor.mjs)
     - in steps.mjs: the `preserveForeignLink` branch of `linkSkill`, the two retired-hook compares in `stepRetiredArtifacts`, and `pathVisibleNode`'s candidate
     - the win32 branch of `hookSettingsRows` (hook-health.mjs) and `knowledgeHookHealthy` (settings.mjs)
     - in uninstall.mjs: `repoReal`, the preflight link targets, and the per-link removal target
   - `realpathSafe` (steps.mjs): its body becomes `return realPath(p);`. Keep its name and callers.
   - Leave `linkFile`, `linkSkill`'s plain relink and `mergeRepoHooks` alone. No case folding, no new helper, no inline tunable.
   - Afterwards, `realpathSync` in nana-setup/lib remains only in `mergeRepoHooks`, project.mjs and install-check.mjs.
4. Flip the six rows to implemented with their citations.
   - nana-setup README: add one Known-limits bullet (the one-time change, and uninstall's variant line) and a Tests-table row.
   - Run `npm run map`. map:check and readme:check must be green.

## Test fixture
- Checkout copy: package.json, apps/desk/server.mjs, packages/nana-setup, nana-pack and nana-knowledge, from the test's own checkout. Copy into `tmpDir(path.join(os.tmpdir(), "nana-spelling-"))`; it is not a git repo. Set `canonical = realPath(copy, { mustExist: true })`.
- Spellings (print each, with canonical):
  - case: the leaf's case swapped, used only if it exists; otherwise SKIP (case-sensitive volume).
  - win32 drive: the drive letter lowercased.
  - win32 short: the copy as os.tmpdir() spelled it when that differs from canonical ignoring case. Otherwise the ShortPath probe in `packages/nana-pack/tests/path-spelling.test.mjs`. Otherwise SKIP.
- Forms: a non-Windows host runs POSIX form and forced win32 (`NANA_SETUP_PLATFORM=win32` in the child env). Windows runs native.
- Each run: a fresh home, HOME and USERPROFILE set, `--home`, and a temp project as cwd. Install through canonical must exit 0 first.
- Doctor rows are (glyph, label) pairs. A home snapshot is a sorted lstat walk: a link gives its readlink text, a file its sha256, a folder its name.
- R-1984 earlier home:
  - Install through canonical. Write `<home>/.pi/agent/settings.json` with `packages` set to canonical `packages/nana-pack` and `packages/nana-knowledge`. Record the doctor rows.
  - Re-point each symlink whose readlink starts with canonical. Rewrite canonical, in both `\` and `/` forms, in every hook entry's `command` and `args` and in the pi entries. Leave launchers alone.
  - FAIL, never pass, if no hook entry changed, or in POSIX form if no link changed.
- R-1985 runs in POSIX form only. It asserts exit 0, no "resolves outside repository" row, and one "would unlink" per re-pointed link.

## Wrong code to try (each must turn the named test red; restore after)
- W1: drop the paths.mjs change → R-1982 in both forms, and R-1980 forced win32.
- W2: drop every compare change → R-1984 and R-1985.
- W3: restore realpathSafe's walk → R-1984 pi rows.
- W4: restore `linkOk` → R-1984 hook, rule and PATH rows.
- W5: restore `linkSkill`'s compare → R-1984 install exit 1.
- W6: restore `skillLinkState` → R-1984 skill rows.
- W7: restore `knowledgeHookHealthy` → R-1984 POSIX knowledge row.
- W8: restore the hook-health win32 compare → R-1984 forced win32.
- W9: restore uninstall's preflight compare → R-1985 exit 1.
- W10: restore uninstall's per-link compare → R-1985 shows no "would unlink".
- W11: fold case on both sides instead → expected to survive on macOS and go red only on the Windows 8.3 spelling; say so.
- R-1981 and R-1983 have no single-site pair. Only today's code turns them red, so the tests-first run is their evidence.
- The retired-hook and `pathVisibleNode` compares have no pair.
- No pairs file under docs/reviews may spell a literal pi spawn call.

## Done
- Each check is red before the change; name any that is green, with its reason (R-1981 forced win32 is green today). Each is green after.
- Run files by path only, never the whole suite:
  - nana-setup: checkout-spelling, stale-copies, install, uninstall, settings-merge, win32-degrade, win32-hook-repair, win-shims, pi-registration, doctor-*, skills-and-standards, retired-artifacts, paths, fresh-machine, hooks-win32-exec, state-manifest, verifier-pipe
  - nana-pack: roster-notice
  - Each keeps main's pass and fail counts.
- map:check and readme:check are green.

## Report (≤ 10 lines)
Commits; red and green per check per form; W1–W11 outcomes; any file whose counts moved; the SKIP lines printed; open questions.