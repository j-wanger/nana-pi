# study-stop: build brief

- Worktree: ~/nana-pi-wt/study-stop on branch feat/study-stop, from main.
- Class: ordinary.
- New rows: R-1500 to R-1504 only, from the block R-1500 to R-1509.
- Run single test files only. The seat runs the full suite.
- Order: rows, then tests, then code. Never edit HANDOFF.md.

**1. Rows (REQUIREMENTS.md, FEAT-036, right after R-542).**
- Add R-1500 to R-1504 with the must-meet text verbatim. Each row cites its one test in backticks as `file::title`.
- Flip R-542 to `implemented`. Its evidence cell cites every test that carries `R-542`: the four new ones and the five marker-only ones.
- Replace R-542's "the owner's call" prose with "the owner ruled 2026-10-10: a study stops when it cannot write its evidence".

**2. Tests (apps/bench/test/orchestration-paths.test.mjs).** Add a new section between 8b and 9, called "8c. a paid run that leaves no evidence stops the study". Use the shared setup from the must-meet and the real `runPlan` with deps `{ ledger: [], blockKeys: new Map(), log }`.
- `evidence failure: no further paid child starts after a run's evidence cannot be written`, marker `// req: R-1500 R-542`. Asserts spawns === 1.
- `evidence failure: the stop names the run's evidence folder and the error code`, marker `// req: R-1501 R-542`. Asserts:
  - the reference mkdir threw;
  - `msg.split(ref.message).join("")` includes `evDir`;
  - `msg` includes `ref.code`.
- `evidence failure: the run's spend is in results.jsonl before the stop`, marker `// req: R-1502`. Asserts exactly one row, t1 rep 0, with `spendOf` === 110.
- `asset failure: no further paid child starts after a run's asset copy fails and leaves no evidence`, marker `// req: R-1503 R-542`. Asserts spawns === 1.
- `grader error: a checker grader error with its evidence on disk does not stop the study`, marker `// req: R-1504`. Asserts no rejection, spawns === 4 and two grader-error rows.
- `probe evidence failure: the study stops with the probe's spend in the ledger and no graded run started`, marker `// req: R-542`. Asserts a rejection, spawns === 1 and one ledger row with tokens === 110.

**3. Marker-only edits.** Change `// req: R-517` to `// req: R-517 R-542` above these titles:
- integration.test.mjs: "orchestration: …saying the probe's spend could not be recorded" and "orchestration: …and NO further paid child is spawned";
- orchestration-paths.test.mjs: "append failure: a results append that fails STOPS the study", "append failure: …naming the spend that is now unrecorded" and "append failure: …and no further paid child starts".

Integration test 8 stays green with no change.

**4. Code (apps/bench/run.mjs).** Follow the must-meet design:
- hoist `evidenceDir`;
- add the `evidenceWritten` flag;
- set `evidenceError` in the existing catch only when `measured && !evidenceWritten`;
- in `runPlan`, throw only after `releaseInflight`;
- update the `@errors` header and the "Every run leaves evidence" comment.

**5. README (apps/bench/README.md).** Update stop condition 6 and the Evidence section. A graded run that ran but whose evidence was not written stops the study with exit 1, naming the folder and the cause, after its record lands. A grader error with its evidence on disk does not stop the study.

**6. Regenerate and recount.**
- `node scripts/code-map.mjs --write`
- `node scripts/requirements-tree.mjs --write`
- In packages/nana-pack/tests/requirements-tree.test.mjs, raise the leaf total by 5 from main's value, in both the title and `leafTotal ===`. At 0f2e0ca that is 1,234 to 1,239.
- After any merge of main, recount and rerun both writes.

**Wrong code to try.** Record the check each one turned red.
- Today's code turns R-1500, R-1501, R-1502 and R-1503 red.
- Wrapping `writeEvidence` only, with no flag, turns R-1503 red (4 spawns).
- An error that forwards only Node's message turns R-1501 red.
- Rethrowing out of `executeRun` turns R-1502 red (0 rows).
- Testing `evidenceError` before the append turns R-1502 red.
- Stopping on every paid grader error turns R-1504 red.
- Setting `SYSTEMIC_LIMIT` to 1 on today's code turns R-1501 red.
- Deleting run.mjs:994 turns the probe check red (2 spawns).

**Done** means the six checks pass and each of these commands exits 0:
- `node apps/bench/test/orchestration-paths.test.mjs`
- `node apps/bench/test/integration.test.mjs`
- `node apps/bench/test/ops.test.mjs`
- `node apps/bench/test/plan.test.mjs`
- `node scripts/requirements-trace.mjs`
- `node scripts/requirements-tree.mjs --check`
- `node scripts/code-map.mjs --check`
- `node scripts/readme-check.mjs`
- `node packages/nana-pack/tests/requirements-tree.test.mjs`
- `node packages/nana-pack/tests/code-map.test.mjs`

**Report (10 lines or fewer).** Give:
- the VERDICT line;
- the commits;
- the rows and their statuses;
- the six titles with PASS;
- each wrong-code item and the check it turned red;
- the marker-only edits;
- each command with its exit code;
- what was not done.