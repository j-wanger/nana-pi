# post-edit-values-named — build brief 1

Feature: FEAT-030 · Get trustworthy feedback after edits. Lane class: hook. Rows R-2210 to R-2215. Read must-meet.md first.
Follow packages/nana-pack/prompts/builder-preamble.md. Work in the lane worktree on feat/post-edit-values-named, branched from main (07f8f6f9 or newer). Run single test files only. Never edit HANDOFF.md or docs/sessions/.

## Tests first (red), then code
- New `packages/nana-pack/tests/post-edit-values-named.test.mjs`:
  - Give it the six-tag header.
  - It holds six checks with the exact must-meet titles.
  - Put each `check("title", …` on one line, directly under its `// req:` marker.
- Setup:
  - Temp HOME and USERPROFILE; delete PI_CODING_AGENT_DIR (as post-edit-default-timeout does).
  - Copy `extensions/nana-post-edit.ts` and the whole `lib/` into a tmpDir.
  - Rewrite the five exports with `(export const NAME\s*=\s*)[^;]+;` to 1234, 64, 37, 9 and 11. Record per name whether the rewrite happened, and require that in its check.
  - Write a stand-in package at `<copy>/node_modules/@earendil-works/pi-coding-agent`:
    - package.json: `type: module`, `exports: ./index.js`.
    - `withFileMutationQueue(file, fn)` throws `new Error("Q".repeat(500))` when the path holds `lock-case`, and returns `fn()` otherwise.
  - Write one user config once, journal disabled, with one command per case. Each `match` names its case file: `timeout-case`, `overflow-case`, `fail-case`, `lock-case`.
  - Write each checker to a script file and run it as `node <JSON-quoted path>`. Set `process.exitCode`; never call `process.exit()` after a write.
  - Import the copy with `pathToFileURL`. Fire `tool_result` with `hasUI: false`, and read line 3 of the appended text.
- The checks:
  - R-2210: the command is `node -e "setTimeout(()=>{},10000)"` with `timeoutMs` 300. Record `setTimeout` delays during that one call only, and restore setTimeout in a finally. Expect exactly [300, 1234]; the line includes `timed out`.
  - R-2211: the script writes U+1F600, a comma, then the comma list of 0 to 59, and exits 0. The line includes ` could not run`. It ends with the last 8 units of the output's first 64 UTF-16 units.
  - R-2212 and R-2213 share one run. The script writes 50 distinct letters and exits 1.
    - R-2212: the line ends with ` (output truncated: last 37 of 50 chars shown): <last 37>`.
    - R-2213: the line starts with `- check <first 9 of cmd> (command truncated: first 9 of <cmd length> chars shown) exited 1`.
  - R-2214: for the file `lock-case.lock`, the line includes ` did not run — could not lock ` and ends with `for checking: ` plus 11 Q's.
  - R-2215 imports the real `lib/post-edit-config.mjs` and checks 2000, 1048576, 400 and 300.
- Test constants carry a `chosen:` comment. No sealed literal appears outside R-2215. Confirm all six are red on the base.

## Then the code
- `lib/post-edit-config.mjs`: add the five exports with provenance exactly as in must-meet Design. Update `@purpose` and `@outputs`.
- `extensions/nana-post-edit.ts`:
  - Import the five names.
  - Delete the four local consts and their comments.
  - Replace every use, including `promptText(lockError, 300)` and the FAILURE_CAP doc comment.
  - Keep `POST_EDIT_FAILURE_CAP * 3`. Change nothing else.
- `tests/post-edit-hardening.test.mjs`:
  - Import `POST_EDIT_KILL_GRACE_MS` from `../lib/post-edit-config.mjs`.
  - Add `const SETTLE_BOUND_MS = POST_EDIT_KILL_GRACE_MS + 4000;` with a `chosen:` comment (today's 6000 bound).
  - Replace the four `ms < 6000`, in checks a, b, c and f. Titles and markers are unchanged.
- `packages/nana-pack/README.md`: add the one sentence from must-meet to the SIGTERM note.
- REQUIREMENTS.md: add R-2210 to R-2215 after R-2151, with the exact text, as implemented, with evidence `file::title`.
- Run `npm run req:tree`, then `npm run map`. Do not touch display-surfaces.test.mjs.

## Wrong code to try (each turns only its own check red; restore after each)
- Try Wg, Wo, Wo2, Wcp, Wf, Wf2, Wc, Wc2, Wl, Wl2 and Ws1 as must-meet Evidence lists.
- Wfc: set the config failure cap to 1999. This must turn display-surfaces' R-087 check red.
- Retune probe: set the config grace to 6000. post-edit-hardening must exit 0. Restore, and confirm `git diff` is clean there.

## Done
- The new file runs 6 PASS. Each wrong version fails only its named check.
- These files each exit 0: post-edit-default-timeout, post-edit-status, post-edit-hardening, display-surfaces, post-edit-file-queue, post-edit-utf8, config-handlers-malformed.
- `node scripts/requirements-trace.mjs` exits 0 with 0 rows off form. `npm run map:check` and `npm run readme:check` each report 0 problems.
- `git diff main` touches only:
  - the config module, the extension and the new test
  - post-edit-hardening.test.mjs and the pack README
  - REQUIREMENTS.md, docs/code-map.md and docs/requirements-tree.md

## Report (≤ 10 lines)
1. Commit hash and the files changed.
2. The six checks, red on the base and then green.
3. The wrong-code table: each version and the check it turned red.
4. Each blast-radius file with its pass and fail counts.
5. Trace, tree, map and README check results.
6. post-edit-hardening's result with the grace at 6000.
7. Anything that differs from this brief, and why.