## Findings

- **HIGH — install prints `✗` but exits successfully.** `PROBLEM` reaches the row and summary, yet `runInstall()` unconditionally returns `0`. Automation therefore treats a forbidden `nana-personal.md` symlink as a successful install. The regression test checks output and doctor’s exit code, but not install’s exit code.  
  `packages/nana-setup/bin/nana-setup.mjs:81-90`  
  `packages/nana-setup/tests/install.test.mjs:196-202`

- **MEDIUM — CLAUDE.md alias validation accepts wrong or dangling targets.** It compares only `path.basename(target) === "AGENTS.md"`. Thus `CLAUDE.md -> missing/AGENTS.md` or `CLAUDE.md -> /tmp/AGENTS.md` receives ✓ whenever the project’s real `AGENTS.md` exists. It should compare the resolved link target with the project’s `AGENTS.md`.  
  `packages/nana-setup/lib/project.mjs:323-340`

## R2 verification

1. **FIXED** — fallback Copier commands obtain the name from `NANA_PROJECT_NAME`; no project-name placeholder appears in those command arguments. Shared-seed substitution uses literal `split().join()`, so `$&`, `$'`, `$1`, `$()`, backticks and semicolons remain file content rather than replacement or shell syntax.  
   `packages/nana-pack/skills/adopt-structure/SKILL.md:84-94`  
   `packages/nana-setup/lib/project.mjs:32-38`

2. **PARTIAL** — ordinary seed dangling symlinks/directories correctly produce ✗ and exit 1, but the CLAUDE.md exception accepts dangling or unrelated links whose basename is `AGENTS.md`.  
   `packages/nana-setup/lib/project.mjs:275-295,323-340`

3. **FIXED for the stated behavior** — install and doctor both classify a symlinked private rule as ✗, and install’s summary no longer says “everything was already in place.” The separate HIGH finding remains: install exits 0.  
   `packages/nana-setup/lib/steps.mjs:49-67`  
   `packages/nana-setup/lib/doctor.mjs:49-60`  
   `packages/nana-setup/bin/nana-setup.mjs:81-90`

4. **FIXED** — the residual explicitly records that the repository has no CI workflow and that Copier enforcement remains manual. Only template/fixture workflows exist.  
   `packages/nana-setup/README.md:210`

VERDICT: BLOCK
