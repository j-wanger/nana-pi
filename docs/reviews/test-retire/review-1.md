I'm sending this lane back for one MUST. Most of it is sound: all eight Lane A files are deleted, the three named live cases moved without weakening, and the 20 keep files run on pull requests again. But one sweep move takes the trace parser's own tests out of pull-request CI.

**Checks I ran on the tip `e83ba269`** (the working tree is unchanged):
- The six checker commands from the new CI step all exit 0: map, README, trace, tree, component audit and records-move.
- 15 touched test files pass: test-packs-core, test-packs-ci, component-audit, first-look, requirements-deliverables, anatomy, config-handlers-malformed, code-map-land, readme-check, requirements-trace, product-report, code-map-launch, ci-workflow, pages-workflow and stale-copies. R-2483 ran rather than skipped.
- I ran `selectPackFiles` with fake pull-request diffs, once with this lane's pack list and once with main's.

## Answers to the brief's questions

**1. Is every deleted case's live protection kept?** Yes, with the gaps listed below.
- All eight Lane A files are gone at the tip. The "six" is commit `44cf620e`; `55130b2b` deletes the last two. The stated reason holds: deleting them earlier would have dropped markers that were still marked implemented between commits.
- Live cases moved: R-3786 to anatomy, R-3779 and R-3781 to first-look, R-2483 to stale-copies. R-070 and R-774 were folded onto existing checks.
- The swept duplicates are covered by the new `Repository checks` step: the map and README CLI cases, R-3778 and R-3795.
- The browser edge files were never collected, so deleting them removes no CI coverage.

**2. R-3777, R-3782 and R-3864:** all three stay implemented, and their assertions match the originals. R-3777 copied over unchanged. R-3782 keeps its 20 s bound. R-3864 runs the same three conditions in process.

**3. Do the moved keep files run on pull requests?** Yes for all 20. Editing each file's subject module selects it: build-busy, hook, build-report, claude-launch, handoff-asks, suite-records, review-timeline, gate-status, pipe-guard-pwsh-oracle, review-ledger, runtime-land, ts-syntax-check and handoff-writer-role. The second half of the question fails: two kept live-guard files now sit in `main` (see the MUST below).

**4. The new CI step:** correct. It sits in the suite job's macOS leg, so it runs on `feat/**` pushes, on pull requests that aren't duplicates, and on main pushes. Each checker runs once, with no limit except the job's 90 minutes.

## MUST: the trace rail's tests no longer run on pull requests

`packages/nana-pack/lib/test-packs-config.mjs:149` moves the whole `requirements-trace.test.mjs` file from `land` to `main`. That file holds about 45 checks besides the G-014 CLI case, including 36 R-1000/R-1001 checks of how rows and markers are parsed. It also holds the check that the trace rail's test roots match the folders `npm test` collects.

- **Not what the plan asked for.** The plan sends a checker case to `main` only when it is the only pin of a live row. G-014 has a second marker in the same file (line 111), and the CLI spawn had no time limit, so this case was never in the failure class. The plan moves a case; the builder moved the file.
- **Not covered by the new step.** `node scripts/requirements-trace.mjs` only checks that the real ledger passes. A parser that starts silently accepting a malformed row still passes it.
- **What changed in selection.** With main's pack list, a pull request editing `scripts/requirements-trace.mjs` runs this test file. With this lane's list it doesn't, and editing `templates/typescript/template/tests/requirements-trace.ts`, where the parser actually lives, doesn't run it either. On pull requests the file now runs only when it is itself edited.
- **Realistic input.** 3 of the 14 edits to the trace script since October 1 didn't touch its test. One was `9886ee6f` ("share complete requirement row recognition"), which changed row recognition in the template parser. A lane like that would pass pull-request CI, land, and turn main red on the push run, which blocks further lands.
- **The requirement was rewritten to fit.** R-3855 (`REQUIREMENTS.md:3089`) now says "land pack and direct CI repository checks". `test-packs-core.test.mjs:31` now asserts the file is in `main`, and the file was dropped from M6's core-guard list.
- **Fix:** return the file to `land`, restore its M6 entry and R-3855's text, and if needed split only the G-014 CLI case into a `main`-pack file.

## SHOULD and NOTE (for the known-bug file)

- **SHOULD: `requirements-unclaimed` lost its pull-request runs.** It moved from `release` to `main` (`test-packs-config.mjs:151`). Before, pull requests touching templates or the trace script added the release pack and ran it; I confirmed it is now never selected on a pull request. It now runs on every main push on every platform, including the Windows shards with uvx pytest, at a cost nobody measured. The plan's rule for this file is followable, but the shift from before landing to after is the same as in the MUST.
- **SHOULD: the R-070/R-774 fold covers less than the old file.** It lands on the single `gate.allowPatterns = null` variant (`config-handlers-malformed.test.mjs:40`). Both rows say "null or all-null", and nothing now tests all three arrays null. The old check that a benign edit is not blocked is also gone; it was what told built-in denies apart from fail-closed blocking of everything.
- **NOTE:** the trace test's CLI spawn now has a 20 s limit where it had none. That is a limit on a whole-repository checker, the pattern this lane removes, though at about 100 times the measured 0.2 s.
- **NOTE:** `Repository checks` runs only on macOS. Linux and Windows lose the full map and README command-line runs that the deleted `land` cases made on every leg. The in-process checks remain.
- **NOTE:** test-packs-ci M8 now excuses test files a lane deletes in a commit. That is needed for any retirement lane, but it loosens the check.
- **NOTE:** R-2482 stays implemented while its evidence pins only the limit constant. The Evidence cell says so plainly.

## Known bugs this change touches

- Line 3 (records-move had no live-repository check): closed for CI, because the new step runs it directly. It took 51–73 s on macOS.
- Line 71 (R-2483 meta-run exposure): the meta-run now lives inside `stale-copies.test.mjs`. Off Windows, stale-copies' exposure to its 5 s hook limit drops from three runs to two; Windows is unchanged.

VERDICT: SEND-BACK
