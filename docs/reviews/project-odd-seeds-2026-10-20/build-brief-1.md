# project-odd-seeds — build brief 1

Feature: FEAT-014 · Create or adopt a project workspace
Lane class: ordinary. Builder: a Claude Sonnet subagent in ~/nana-pi-wt/project-odd-seeds on feat/project-odd-seeds, branched from current main. Follow packages/nana-pack/prompts/builder-preamble.md. New row IDs come only from R-2420–R-2429. Do not edit HANDOFF.md or docs/sessions/.
Threat model: honest leftovers (broken links, stray folders or files, the project's own CLAUDE.md, odd names) are in scope. Planted links and lstat-to-write races are out.

## What to change (Design in must-meet.md)
1. Run `npm run map:impact -- packages/nana-setup/lib/project.mjs` first.
2. REQUIREMENTS.md: add R-2420 and R-2421 after R-385 (SUB-020), and R-2422 and R-2423 after R-989 (SUB-021). Use the must-meet row text with status untested. Do not change the text of R-385, R-335, R-338 or R-931.
3. Write the new test file packages/nana-setup/tests/project-odd-seeds.test.mjs:
   - Give it the six-tag header and exactly the eight checks M1–M8, with the must-meet titles verbatim and the fixtures the must-meet names.
   - Put each `// req: R-nnn` line directly above its `check("title", …` call. The title's opening quote must sit on the same line as `check(`, because the trace scanner needs that (a split broke CI once).
   - Put fixtures in os.tmpdir() with a throwaway --home and spawn the CLI.
   - Match a row with `^  <mark> <label>` followed by two or more spaces.
   - Add no skips.
4. Change code only in packages/nana-setup/lib/project.mjs and in runProject and the header of packages/nana-setup/bin/nana-setup.mjs:
   - Add seedEntry, unexported. Ask it first in stepSeeds, stepAgents and stepPackConfig.
   - Make fillSeed one pass. Add the stub region row and the setup closing line.
   - checkProject: add the `; move or remove it by hand` suffix and the own-CLAUDE.md wording. Keep every existing ✗ prefix byte-identical. The R-1312 placeholder line keeps its project remedy.
   - --check summary: take what project fixes from `setupProject(dir, layout, { dryRun: true })`, the way runDoctor uses install's dry run. Catch only SetupError.
   - Do NOT touch runDoctor (that would make this an install lane) or fsops.mjs (win-copy-backup-noise is changing it).
   - Update project.mjs @outputs and @errors, and nana-setup.mjs @outputs and @effects (--check now runs project's dry run, which writes nothing).
5. packages/nana-setup/README.md, project section:
   - odd entries are skipped by name and listed as fixes by hand;
   - project's dry run decides which ✗ rows --check gives to `nana-setup project`, and the rest are listed by hand, in the three summary forms;
   - the advice for the project's own CLAUDE.md;
   - names land literally;
   - one tests-table row for the new file.
6. Flip R-385, R-335, R-338, R-931 and R-2420–R-2423 to implemented, with `file::title` evidence. Run `npm run req:tree` and `npm run map`.
7. Edit an existing check only where your change makes it false, and list each edit. The prototype needed none.

## Wrong code to try first (each must turn its check red)
- W1 keep the two-pass split/join → M6
- W2 `.replace(/<name>/g, name).replace(/<date>/g, date)` → M6
- W3 drop the CLAUDE.md odd row → M1
- W4 continue past any link on the way without a stat → M2
- W5 always call refreshWorkingRegion → M7
- W8 ignore an odd month path in check → M4
- W9 check the missing parent only when not a dry run → M8
- W10 keep `everything was already in place` → M3
- Wa count a dry-run `skipped` row as project's → M5
- Wb drop the month-label mapping → M5
- Wc take the by-hand list from the check's odd entries, not the dry run → M5
- Wd the mixed count uses n → M5
- We run the prediction without dryRun → M5
Also run the new file on main code. M8 is the only check that passes there.

## Tests and checks
Run single test files only and never the full suite: other lanes hold this machine's suite lock, and the seat runs the suite. Run these files under packages/nana-setup/tests/: project-odd-seeds, project, project-working-region, entry-guidance, project-dismiss, doctor-quiet, trust and project-key.

Then run `npm run map:check`, `npm run readme:check` and `node scripts/requirements-trace.mjs`, which must show `ears: 0 rows off form`.

## Done
- M1–M8 pass, and every W pair is red.
- The eight files above are green.
- map:check, readme:check and the trace check are green.
- The rows are flipped, and the tree and map are regenerated.

## Report shape (≤ 10 lines)
VERDICT line; commits; files; rows flipped and added; W pair results; each test file with its PASS/FAIL count; map, readme and trace exit codes; existing checks edited (or none); what was not done.

## Seat amendments (re-check on main 9552afb1)

- Branch from main 9552afb1. No lane that landed since the plan changed lib/project.mjs, bin/nana-setup.mjs, tests/project.test.mjs or fsops.mjs seedFile, so the design's code references still hold.
- Ignore the brief's builder line. Power mode has ended, and the seat launches this lane in <worktrees>/project-odd-seeds with the roster's larger-lane builder.
- Leave fsops.mjs untouched. win-copy-backup-noise has landed and did not change seedFile, so the reason is scope, not a pending merge.
- Create every temp root the way project.test.mjs's `tmp()` helper does: `tmpDir(path.join(os.tmpdir(), "<prefix>-"))`.
- Import the helper with exactly the line `import { tmpDir } from "./tmp-dir.mjs";`.
- Never call mkdtempSync directly. The R-917 source check in packages/nana-pack/tests/test-runner.test.mjs fails the suite on that, and that file is not in your list.
- Create links with `fs.symlinkSync(target, link)` and no type argument, as project.test.mjs does. The Windows reasoning assumes a file-type link at `.pi`.
- Give link fixtures targets with no folder separator, or build the expected `-> target` text from `fs.readlinkSync`. On win32 it returns backslashes; see the comment on the CLAUDE.md shapes in project.test.mjs.
- In runProject's check path, await the prediction: `await setupProject(dir, checkLayout, { dryRun: true })`. Run it after the existing `refuseCwdRelativePiHome(checkLayout, "this check")` call.
- Model the three summary forms, the label dedupe (`[...new Set(...)]`, row order) and the project count on runDoctor's `installLabels`, `installCount` and `byHandLabels` lines.
- Map the month-log row the way doctor maps `row.installLabel ?? row.label`.
- Copy that pattern into runProject. Do not factor a shared helper out of runDoctor, because touching runDoctor makes this an install lane.
- In the bin/nana-setup.mjs header, edit only the @outputs and @effects lines.
- Leave @inputs and @errors byte-identical. claude-config-dir edits those lines and lands after this lane.
- Leave the `refuseCwdRelativePiHome(resolveLayout(opts), "this project setup")` call and the missing-parent check below it where they are.
- Do not change stepKnowledgeRefresh. --check now runs project's dry run, so its dry-run branch must keep returning before any spawn.
- Say that in a comment beside the prediction call, because a later knowledge lane may edit that step.
- No other lane gates this one. Regenerate docs/requirements-tree.md and docs/code-map.md on your final tip. If you merge main, regenerate them again.

## Seat (2026-10-20 ~16:45 EDT, after the re-check)

- Builder: pi-worker --lane project-odd-seeds --lane-size larger (the roster's larger-lane builder, pi gpt-5.6-sol). The owner kept pi sol for larger lanes after power mode; ignore any line above that calls the builder an open question or names a Claude builder.
- Reviews: Claude Opus 5.5 is the final reviewer; the seat lands when every reviewer says LAND (the owner's standing rule since 2026-10-20).
- Run single test files only, never the full suite: eight other builders share this machine, and the seat runs the locked suite at land.
- Branch: from main 9552afb1. Land order across the slate (each later lane merges main before its final review): knowledge-sources-unparseable, lifecycle-compaction-reason, gate-stop-names-config, review-launch-win-paths, shared-memory-index-cap, project-odd-seeds, verifier-pipe-commit-match, win-hook-variant-loop, claude-config-dir.
- No push; no HANDOFF.md, docs/sessions/ or docs/reviews/ edits; commit with explicit paths.
