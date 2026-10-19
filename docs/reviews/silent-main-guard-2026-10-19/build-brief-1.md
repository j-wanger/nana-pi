# silent-main-guard: build brief 1

Feature: FEAT-028 · Maintain requirement identity and trace links. The lane also adds rows to FEAT-029, FEAT-039 and FEAT-006; see must-meet.md. Class: ordinary. Builder: a Claude Sonnet subagent. It follows packages/nana-pack/prompts/builder-preamble.md and works in the lane worktree on feat/silent-main-guard. Run single test files only. Never edit HANDOFF.md or docs/sessions/.

## Change
1. Run `npm run map:impact -- <file>` on each of the five commands first.
2. Replace the main guard at these five lines: packages/nana-pack/bin/nana-roster.mjs:197, scripts/requirements-moved.mjs:187, scripts/requirements-tree.mjs:487, scripts/requirement-rows.mjs:84 and scripts/product-report.mjs:426. Use this shape:
   `process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))`
   Use node:fs realpathSync, not `.native`. Add the node:fs names each file needs. nana-roster already imports `fs`, so use fs.existsSync and fs.realpathSync there. Swap nana-roster's pathToFileURL import for fileURLToPath. Drop imports left unused. Keep each line's action unchanged.
3. Make no other change in these files: no argument parsing and no README edit.
4. REQUIREMENTS.md: add R-1630 and R-1631 under FEAT-028, R-1632 under FEAT-029, R-1633 under FEAT-039, and R-1634 and R-1636 under FEAT-006. Use the exact text from the rows list. Mark each implemented, with its test as evidence, once it is green. R-1635 is not used.
5. Run `npm run req:tree` and `npm run map`. Set the R-291 leaf total in packages/nana-pack/tests/requirements-tree.test.mjs to the total `node scripts/requirements-trace.mjs` prints.

## Tests (write them first and watch them fail on the old guards)
- New file packages/nana-pack/tests/linked-launch.test.mjs, with a six-tag header and checks R-1630 to R-1634.
  - realRoot = fs.realpathSync(the checkout root found from import.meta.url).
  - Make the link with fs.symlinkSync(realRoot, link, "junction"), inside its own fs.mkdtempSync(os.tmpdir() prefix) folder. Do NOT pass that folder to tmpDir.
  - Use try/finally: run fs.unlinkSync(link), then fs.rmdirSync(folder). No recursive removal may ever meet the link.
  - Make other scratch (agent dir, flat ledger) with tmpDir. Add no platform skip.
- A helper runs `process.execPath <base>/<rel> ...args` with base = realRoot and base = link. Both runs use the same env: GIT_* removed, and HOME, USERPROFILE and PI_CODING_AGENT_DIR set to temp dirs. Both use a temp cwd.
  - It passes when the statuses are equal, stdout is equal, and the real-path run printed something on stdout or stderr.
  - Arguments per row:
    - moved: `--root <realRoot> --base HEAD`
    - tree: `--root <temp dir whose REQUIREMENTS.md has a row table and no CAP or FEAT heading>`
    - rows: none
    - report: `--bogus`
    - roster: none
- nana-roster.test.mjs, R-1636: spawn `node --input-type=module -e "await import(<pathToFileURL(cli).href>); process.stdout.write('imported')" <arg>` with HOME, USERPROFILE and PI_CODING_AGENT_DIR set to temp dirs. Run it once with a missing temp file and once with an existing other file. Both need status 0 and stdout exactly `imported`.
- Put the `// req: R-nnnn` marker directly above each check, with `check("title", …` on one line. Use the titles exactly as must-meet.md gives them.

## Wrong code to try (each must turn the named check red; restore after)
W1: put the resolve-form guard back in any one script. Its linked-launch check must go red.
W2: drop the existsSync term in nana-roster. R-1636 must go red: the missing-file case throws.
W3: use `if (true) main()` in nana-roster. R-1636 must go red.
W4: use `if (false)` as one script's guard. Its linked-launch check must go red through the printed-something condition.

## Done
These single files run green: linked-launch, nana-roster, nana-roster-set, roster-notice, packages/nana-setup/tests/roster-notice-hook, requirements-tree, requirements-moved, requirement-rows, product-report and requirements-trace. `npm run map:check`, `npm run readme:check` and `node scripts/requirements-tree.mjs --check` are green. Real-path runs of all five commands print what they printed before.

## Report (at most 10 lines)
Give the commit SHA, the files changed, and each new check red before and green after. Give W1 to W4, each with the check it turned red. Give the single-file results, the map, README and tree checks, the leaf total, and anything not done.