## R1 verification

1. **HIGH dangling symlink write-through — FIXED.**  
   `seedFile()` now uses `lstat` and returns `SKIPPED` for any symlink before writing. The original `OBJECTIVE.md -> /tmp/victim` input leaves `/tmp/victim` absent and the link untouched. `packages/nana-setup/lib/fsops.mjs:96-105`

2. **MEDIUM `--check` rejects intentional omissions — FIXED.**  
   Nested repositories are accepted using `git rev-parse`, and omitted project config is accepted when user-scope `postEdit.commands` exists. `packages/nana-setup/lib/project.mjs:270-296`

3. **MEDIUM held knowledge lock reported as rebuilt — FIXED.**  
   The known stderr marker is detected despite exit 0 and reported as skipped/nothing re-indexed. `packages/nana-setup/lib/project.mjs:229-231`

4. **MEDIUM refresh lacks hard deadline — FIXED.**  
   Refresh now uses asynchronous `spawn`, a parent deadline, destroyed pipes, `unref()`, and delayed SIGKILL. A child ignoring SIGTERM no longer blocks indefinitely. `packages/nana-setup/lib/project.mjs:173-214`

5. **MEDIUM fallback emits `_tmp` project name — FIXED for the original `ledger` input.**  
   The fallback now tells Copier to render using the real project name and only fills the date afterward. `packages/nana-pack/skills/adopt-structure/SKILL.md:65-97`

6. **LOW Copier integration silently disappears — NOT FIXED.**  
   Without `uvx`, the test still passes by default; it fails only when an externally supplied `NANA_SETUP_REQUIRE_COPIER=1` is set. No repository CI workflow enforces that variable. `packages/nana-setup/tests/project.test.mjs:243-249`

## New-code regressions

- **HIGH — fallback command permits shell expansion/injection through the project name.**  
  Both documented commands interpolate the real name inside double quotes. A project named `$(touch /tmp/nana-owned)` executes that substitution under bash; quotes/backticks also corrupt the Copier argument. PowerShell’s double-quoted form likewise expands `$()` expressions. Use an argv-safe helper or pass the name through an environment variable rather than command text.  
  `packages/nana-pack/skills/adopt-structure/SKILL.md:77,85`

- **MEDIUM — `project --check` treats every filesystem entry as a healthy file.**  
  `has()` is merely `Boolean(lstat(...))`. Reusing the original dangling `OBJECTIVE.md` symlink—or placing a directory at `HANDOFF.md`—is safely skipped by setup but then receives ✓ from `--check`, which can exit 0 although the objective cannot be read. The new test verifies the skip but never checks this resulting state.  
  `packages/nana-setup/lib/project.mjs:266,278-281`; `packages/nana-setup/tests/project.test.mjs:153-172`

- **MEDIUM — install can claim a forbidden private-rule symlink is healthy.**  
  Given `~/.claude/rules/nana-personal.md` as a symlink to an existing byte-correct file, shared `seedFile()` reports it skipped, the install summary can say everything is already in place, and doctor reports ✓ using `existsSync`. That contradicts the documented invariant that this private rule is a regular copied file and never linked into the repository.  
  `packages/nana-setup/lib/fsops.mjs:98-105`; `packages/nana-setup/lib/doctor.mjs:47-48`

The refresh path has no per-emitter listener leak in normal CLI use. Its SIGKILL grace timer intentionally holds the process open for up to two additional seconds (`project.mjs:199-205`), and timeout remains a reported `SKIPPED` with overall exit 0; both are bounded and consistent with refresh being best-effort.

VERDICT: BLOCK
