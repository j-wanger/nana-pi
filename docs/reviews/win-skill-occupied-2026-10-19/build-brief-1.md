# Lane win-skill-occupied — build brief 1 (2026-10-19 · feat/win-skill-occupied · tip after the seat's plan commit)

**Builder: Claude Sonnet 5, a subagent in `<worktrees>/win-skill-occupied`.** Lane class: install. Read `must-meet.md` here first (the adversary's amended plan; `plan-attack.md` holds its reasons). Requirements first: add the rows `must-meet.md` lists as `planned` in the right feature table of `REQUIREMENTS.md`, run `npm run req:tree`, and bump the R-291 leaf-total literal in `packages/nana-pack/tests/requirements-tree.test.mjs` (three spots) by the rows you add; then the tagged tests; then the code; flip each row to `implemented` when its test passes. Run `npm run map` after adding or moving a module and commit the map. Do not run the full suite and do not push; the seat does both. Do not edit `HANDOFF.md` or `docs/sessions/`.

---

# win-skill-occupied: build brief 1 (feat/win-skill-occupied, <worktrees>/win-skill-occupied)

**Goal.** On Windows, refuse and leave untouched a requirements skill folder that nana-setup did not make, as macOS does. Read `docs/reviews/win-skill-occupied-2026-10-19/must-meet.md` first. Rows: R-1420 to R-1426, under SUB-015.

**Product:**
- `lib/steps.mjs`:
  - Export `SKILL_COPY_MARKER = ".nana-setup-copy"`. Provenance: "chosen: presence marks a win32 mirror nana-setup made; sealed by R-1425".
  - Export `ownSkillCopy(target, source)`. It uses lstat only and never follows a link. It returns true when any one holds: the marker is a regular file; every `skillFiles(source)` file is byte-equal; or `SKILL.md` is a regular file whose sha256, after CRLF becomes LF, is a key in `skill-copy-history.json`.
- `linkSkill` win32 branch:
  - After `mirrorDirsProblem`, if the target is a real directory and `!ownSkillCopy`, return PROBLEM. The detail is `a directory is already at ${target} — left untouched; move or remove it, then re-run`. Do this before any write, dry run included.
  - After the mirror, `writeIfChanged` the marker. Its content is one constant line, with no path and no date. Fold its status into the step's, so a second run stays UNCHANGED.
- Update the `steps.mjs` header: `@outputs` names the marker file and the new exports.
- `lib/skill-copy-history.json` (new): one key per blob from `git log --format=%h -- packages/nana-pack/skills/requirements/SKILL.md`, which gives 12 at b3f6ec2. Each key is the LF sha256 and each value is "<short commit> <date>". Recompute it after your last rebase.
- `lib/doctor.mjs`, `skillLinkState` win32 branch: a directory with `!ownSkillCopy` returns `{ok:false, detail:"a directory is there instead of nana-setup's copy of ${source} — move it, then re-run \`nana-setup install\`"}`. Leave every other detail unchanged.

**Tests.** All go in `tests/skills-and-standards.test.mjs`.
- Section 4: delete the win32 known-bug else-branch. On win32, print a SKIP line and count it. The reason: "the POSIX refusal expects a symlink fix; section 4b runs the win32 refusal natively".
- New section 4b holds R-1420 to R-1425, with titles verbatim from must-meet.md. Put each `// req: R-14xx` directly above its `check(`.
- Use `env = process.platform === "win32" ? {} : { NANA_SETUP_PLATFORM: "win32" }`.
- R-1421 and R-1422 snapshot names and bytes recursively, before and after. R-1423 runs doctor on the occupied folder.
- R-1424 uses the new fixture `tests/fixtures/skill-copy/requirements-0499e52.md`, from `git show 0499e52:...SKILL.md`. Read it with CRLF turned into LF, then build one LF home and one CRLF home.
- R-1426: add `// req: R-1426` directly above section 6's existing `check("win32: install refreshes the stale copy", …)`. Do not change that check.
- Write no other new test.

**Ledger and docs:**
- REQUIREMENTS.md: add the seven rows under SUB-015. Flip each to implemented when its test passes.
- Regenerate `docs/requirements-tree.md`. Re-sum the leaf total in `packages/nana-pack/tests/requirements-tree.test.mjs`; it is +7 on b3f6ec2.
- README: update the Windows skill line (about line 380) and the skills-and-standards row (about line 442). Both must say a folder nana-setup did not make is refused, and name the marker.
- HANDOFF: remove the "Install on Windows … backs it up and overwrites it" known bug. Add the R-304, R-381, R-382 and R-388 wording residual. Add a session entry.
- Run `npm run map` and commit the code map.

**Wrong code to try.** Each must fail a named test; report each pair.
1. Ownership by "byte-equal to the current pack" alone: R-1426 and R-1424 fail.
2. Marker written but never read: R-1426 fails.
3. No history list: R-1424 fails.
4. Hash lookup without turning CRLF into LF: R-1424 fails.
5. Ownership checked only outside a dry run: R-1422 fails.
6. Marker written before the refusal: R-1421 fails.
7. Marker content holds a timestamp: section 6 "a second run changes nothing" and install.test R-300 fail.
8. Doctor left unchanged: R-1423 fails.

**Done:**
- The skills-and-standards, install, retired-artifacts, win32-degrade, state-manifest, fresh-machine and requirements-tree test files pass.
- `npm run test:locked` passes.
- `npm run map:check` and `npm run readme:check` are green.
- `node packages/nana-setup/bin/install-check.mjs` passes on macOS.
- All seven rows are implemented.
- Touch no in-flight lane's file: nana-pack bin and lib, and objective-golden.

**Report (≤ 10 lines):** commits; files; rows and their status; the eight wrong-code pairs, each with its failing test title; the history count and the commit range it covers; each command with its exit code; the suite summary line with its check count; what was not done.