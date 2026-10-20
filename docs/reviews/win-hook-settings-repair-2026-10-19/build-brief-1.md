# win-hook-settings-repair — build brief 1

Feature: FEAT-013 · Install and connect harness runtimes. Class: install, hook or gate.
Work in ~/nana-pi-wt/win-hook-settings-repair, on branch feat/win-hook-settings-repair from main 32d6aa8b.
Rows: R-1880 to R-1885 (block R-1880 to R-1889), plus a pin on R-653. Read must-meet.md first; it holds the row texts, the fixtures F1 to F4 and the design.

## Change
1. REQUIREMENTS.md:
   - Append R-1880 to R-1885 at the end of the SUB-013 table (after R-1208), status untested.
   - Add to R-316's evidence: "win32 exception: an installer-shaped verifier under `Bash` moves (R-1881, R-1882)".
   - Run `npm run req:tree`.
2. Tests first: a new file, packages/nana-setup/tests/win32-hook-repair.test.mjs.
   - Give it the six-tag header and its own check(), freshHome() and run() helpers, modelled on win32-degrade.test.mjs: tmp-dir.mjs homes, the pi-subagents floor seed, withPiStub around doctor, and NANA_SETUP_PLATFORM=win32.
   - Build F1 to F4 from POSIX `desiredHooks({ hooksDir: "/Users/someone/.claude/hooks", repoRoot: "/Users/someone/nana-pi" })`.
   - Compare repaired entries by sorted-key equality to `desiredHooks({ hooksDir, repoRoot, platform: "win32" })`, with repoRoot from lib/paths.mjs. F1 also checks each entry's index.
   - F4 holds four objective look-alikes: timeout 10, another status message, a double-quoted path, and `/Users/someone/custom/nana-objective.mjs`. Add a verifier under `Bash` with timeout 10 and a knowledge entry `NODE_NO_WARNINGS=1 node "<path>" hook`. All must stay byte-identical after install.
   - Write eight checks, with titles exactly as in must-meet.md. Each `// req:` marker sits directly above a one-line `check("title", …`.
   - Run the file before any code change, and confirm that the six red-today checks fail.
3. packages/nana-setup/lib/settings.mjs (design §1 to §5):
   - installerTarget: add the `posix-shell` form (the five hooks) and the `posix-unquoted` knowledge form, win32 only. Define one suffix constant, with provenance.
   - mergeRepoHooks, win32:
     - Scan the PreToolUse groups whose matcher is the POSIX installer's.
     - Splice entries that pass the timeout-5 gate and installerTarget, in descending index order.
     - Drop a group the splice empties. Never rewrite a matcher.
     - Append `{...moved, command, args}` under WIN_VERIFIER_MATCHER only when none is found there.
     - Mark the label found and replaced.
   - Header rules comment: record the win32 exception. Keep the six tags accurate.
4. packages/nana-setup/README.md:
   - Name both repairs and the verifier move in the hooks row and in the "Install never removes or reorders" bullet.
   - Add one tests-table line for the new file.
   - Leave the Platforms section alone.
5. When the checks pass:
   - Flip R-1880 to R-1885 to implemented, with evidence.
   - Add the new check to R-653's evidence.
   - Run `npm run map` and commit the map.

## Wrong code to try (restore each one; it must turn the named check red)
- Remove the posix-shell branch: R-1880, both R-1881 checks, R-1882 and R-1884.
- Remove the posix-unquoted branch: R-1885.
- Each of these turns the R-653 check red: drop the shell-form byte equality; drop the `/.claude/hooks` suffix test; drop the unquoted-form byte equality; drop the timeout gate in the `Bash` scan.
- Rewrite the `Bash` group's matcher instead of moving the entry: R-1882.
- Append under WIN_VERIFIER_MATCHER even when one is already there: the R-1881 F2 check.
- Count a scanned `Bash` group as a repair when nothing moved: R-1883.
- Expected survivor: keeping an emptied `Bash` group.

## Done
- The new file is green, and every red-today check was seen red first.
- These single files are green under packages/nana-setup/tests: settings-merge, win32-degrade, stale-copies, uninstall, verifier-pipe and install.
- These are green: `npm run map:check`, `npm run readme:check`, `node scripts/requirements-tree.mjs --check`, `node scripts/requirements-trace.mjs`.
- No inline tunable was added. No change to POSIX output. No edits to HANDOFF.md or docs/sessions/.

## Report (at most 10 lines)
Tip sha · files changed · each check with red before (yes or no) · wrong-code results, one line each · single-file pass and fail counts · map, readme, tree and trace results · anything left open.