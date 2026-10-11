# Lane windows-ci — build brief (2026-10-11 · feat/windows-ci · worktree ~/nana-pi-wt/windows-ci)

The contract is `CHANGE.md` in this folder (sol plan r1 LAND-WITH-FIXES; its fixes are in the plan).
Three items; do all three before you report.

- [ ] **A. The workflow** (`.github/workflows/ci.yml`, suite job only): `os: [macos-latest,
  ubuntu-latest, windows-latest]`; `continue-on-error: ${{ matrix.os != 'macos-latest' }}`; a
  suite-scoped `defaults: run: shell: bash`. Nothing else changes (release job untouched).
- [ ] **B. Rows and tests.** `REQUIREMENTS.md` FEAT-019: add R-1031 and R-1032 and reword R-684 exactly
  as CHANGE §2 (R-684's text: "The root README, root AGENTS.md and nana-setup README shall each carry
  exactly one `Support:` line, identical across the three and equal to the canonical line its test
  holds, stating: macOS tested; Linux and Windows in hosted CI with non-blocking suite legs; no
  recorded machine install on Linux; on Windows no Claude Code hook except the knowledge pull, no PATH
  command, and the review and builder launchers unavailable; launchd macOS-only — and no competing
  broad Windows parity language."). `packages/nana-pack/tests/ci-workflow.test.mjs`: update R-597's
  pinned matrix and continue-on-error lines; add R-1031's test (suite-scoped bash default, the Windows
  matrix entry, `NANA_TEST_REQUIRE_COPIER` on every leg, the ordered toolchain setup, the global pi
  install, the version check, `npm test`) and R-1032's test (the non-blocking expression covers
  Windows; release still `needs: suite`). `packages/nana-pack/tests/templates-render.test.mjs`: R-684's
  test compares all three front doors to ONE exact canonical line (below) and keeps the broad-parity
  negative fixture.
- [ ] **C. The text.** The canonical support line, verbatim in `README.md`, `AGENTS.md` (line 5, outside
  the shared marker region) and `packages/nana-setup/README.md`:
  `Support: macOS tested; Linux and Windows run in hosted CI, where their suite legs are non-blocking; Linux has no recorded machine install; on Windows there is no Claude Code hook except the knowledge pull, none of the pack's PATH commands are linked, and the review and builder launchers are unavailable; launchd is macOS-only.`
  If the broad-parity detector flags this line, report it rather than weakening the detector. And
  `README.md`'s three release descriptions (lines near 25, 177, 210 that say release follows "a green
  suite") say release follows the blocking macOS suite leg, with Linux and Windows non-blocking.

Mutation pairs, red then green: drop the bash default → R-1031's test; drop `windows-latest` → red;
make Windows blocking → R-1032's test; restore the old support wording in one file → R-684's test.

Then: `npm run req:tree`, `npm run map:check`, `npm run readme:check`, `npm run test:locked` (must
pass; report the summary line), commit with explicit paths (message file under `$TMPDIR`). No test
writes the repository. Do not push. Frozen: `CHANGE.md`, `HANDOFF.md`, `docs/sessions/`. Report ≤ 25
lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`, the checklist ticked, the mutation pairs, the
suite summary line, and the one claim most likely wrong.
