Feature: FEAT-033 · Adopt explicit engineering standards
Card: fix

# Review brief 1: acceptance-win-cmd

Review `git diff main...HEAD`. On Windows, `scripts/template-acceptance.mjs` spawned pnpm (a `.cmd` shim) without a shell, so Node refused it (ENOENT/EINVAL) and the report said only "exited 1". A peer seat reproduced that spawn behaviour on Windows 11, Node 22.22.2. The fix launches `.cmd`/`.bat` commands through the repo's `win-command` helper on win32 and makes `textOf` name a spawn error. Question: will `npm run template:accept` now run the TypeScript modes on a Windows machine with pnpm on PATH, is macOS and Linux behaviour unchanged, and does the shim launch keep win-command's argument safety? Native Windows is not run in lane CI; tests inject the platform. Threat model: honest variation in Windows PATH and shims; forgery out.
