# Review — pack-config-agent-dir-pins (tests pin that a moved agent folder never opens the stranded config file, and that post-edit and lifecycle keep working under a malformed block), 2026-10-20 (Opus, the lane's one final reviewer)

Feature: FEAT-011 · Keep policy changes safe and recoverable (R-825 sits in FEAT-013 · Install and connect harness
runtimes, on the same code path as R-193)

Review `git diff 385c633f..HEAD` on `feat/pack-config-agent-dir-pins` (main was `445f4d5b` when this brief was
written, after the ci-suite-timeout and knowledge-index-pins lands; `git merge-base HEAD main` is `385c633f`). The plan
of record is `docs/reviews/pack-config-agent-dir-pins-2026-10-20/must-meet.md`: a pin lane over three existing untested
rows, R-193, R-825 and R-781, with no new row and no product code (the R-2110 to R-2119 block stays unused).
`plan-attack.md` holds the adversary's AMEND, which widened R-193's check to every pack reader of nana-pack.json, gave
R-781's Evidence a declared limitation, and made R-825 read the journal at the dir it expects. `build-brief-1.md` is
the one build (7878d8e4). The seat's record is `seat-verify-7878d8e4.md`: CI run 39389264752 on draft pull request #115
at 7878d8e4, 0 failing files on all three legs, with the Windows suite log `ci-windows-7878d8e4.log` beside it. No
seat pairs and no independent check: an ordinary lane.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, against the merge base 385c633f; the seat's
notes commit changes no row): three rows re-statused, none added, retired or reworded.

```
tree movement 385c633..7878d8e: 3 rows in 2 features
FEAT-011 · Keep policy changes safe and recoverable
  R-193 untested -> implemented; also applies: FEAT-015
  R-781 untested -> implemented; also applies: FEAT-001, FEAT-002, FEAT-023, FEAT-030
FEAT-013 · Install and connect harness runtimes
  R-825 untested -> implemented
```

The change under review: in `packages/nana-pack/tests/agent-dir-config.test.mjs`, an `opened(run)` helper that wraps
node:fs's CommonJS read entry points (openSync, readFileSync, open, readFile, createReadStream, promises.open,
promises.readFile), calls `syncBuiltinESMExports`, and restores and resyncs in `finally`; R-193's block runs
loadConfig, loadUserObjective, adoptionSettings, the roster notice's session_start and one gate decision inside it, and
needs the stranded file present, a UI note naming it, no recorded open of it, and a recorded open of the active file;
R-825's block counts UI notes and journal mismatch lines across three sub-cases (a moved empty dir with the stranded
file renamed away and restored in `finally`, a moved dir holding `{}`, the variable unset). In
`config-handlers-malformed.test.mjs`, five unrelated malformed blocks (gate, notify, handoff, objective, journal.path),
each with a failing postEdit command on a.ts, must keep lifecycle's session_start journal line and, except under
gate = 7, post-edit's failure feedback; the existing objective check gains `// req: R-781`. Both headers, the three
Evidence cells and `docs/code-map.md` follow. No `lib/`, `bin/` or `extensions/` change.

Judge whether each of the three rows now has a check that fails when the code breaks the row, and whether each row is
no wider than its checks. Judge whether R-193's wrapper really observes every pack read of nana-pack.json, whether its
guard (the active file's open recorded) turns a wrapper that sees nothing into a loud failure, and whether restoring
the originals leaves later checks in the file on an unwrapped fs. Judge whether R-825's note filter (a note containing
"agent dir" or "PI_CODING_AGENT_DIR") would still count the mismatch note if its wording moved. Judge whether R-781's
declared limitation and the gate = 7 exclusion keep that row honest. Judge whether any block can reach the real home
folder or leave HOME, USERPROFILE or PI_CODING_AGENT_DIR pointing somewhere later checks do not expect.

Threat model: honest variation in our tools' output and the OS is in scope (an absolute, relative or tilde agent dir;
macOS, Linux and native Windows; another spelling of the same folder; every malformed-block shape; CI temp roots).
Deliberate forgery, such as a file planted to fool the read wrapper, is out. Lane class: ordinary — tests,
REQUIREMENTS.md and the code map only; no install, uninstall or doctor code, no Claude Code hook, no pi extension, no
gate policy, no land or review tool.

Check: (1) the must-meet checks are not vacuous: each new check reds on the wrong code the plan names (W1 to W9, by the
builder's report, macOS only), and the suppressed-note control reds R-193 through its guard; (2) the new checks run on
every leg without a skip, and the Windows leg's PASS lines for R-193 and R-825 show a real observation (the seen list
holds the active file; every count is 0); (3) the tests write only inside the temp folders they own, the R-825 rename
of the stranded file is restored on every path, and the wrapped fs is restored before the next block; (4) nothing else
changed: the two test files, the three rows' status and Evidence, and the code map lines those headers drive; (5) the
plan's known limits, the open Windows spelling question and the builder's W8 probe in the worktree are recorded as
HANDOFF residuals or in the seat's record, and none hides a bug that stops the feature; (6) HANDOFF and the session
entry are true; (7) any MUST.
