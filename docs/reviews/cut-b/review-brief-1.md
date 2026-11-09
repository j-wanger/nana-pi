Feature: FEAT-040 · Make and keep memory

# Review brief 1: Cut B

Review this lane's commits: `git diff main...HEAD` on feat/cut-b (it merged main at 45d1f0a1; `git diff --name-only main HEAD` equals `git diff --name-only main...HEAD`).

Card: the owner chose on 2026-11-09 (D3) that the paused memory factory goes, and the owner profile store, the bench's anatomy command and setup's ability to retire an installed memory-end hook stay. The lane deletes the factory's commands, libraries, scripts and tests; moves the pieces the profile and anatomy still use into `profile-config.mjs` and `apps/bench/lib/`; keeps setup's recognition and removal of the installed hook; retires 92 factory rows and four artifacts (R-3867 and R-3932 become `untested`); prunes 38 factory-only known-bug lines and keeps 21 about surviving code; replaces the 11-07 "paused, not deleted" ruling with a dated cut ruling. Size: 57 files, +309 / −3,271.

Seat commit 2: OBJECTIVE.md now carries the definition the owner adopted on 2026-11-09 (D1) as the objective line, and the adopted train order, the start-after-LAND-and-green-CI rule and the measure's vendored-file exclusion in the priority line; HANDOFF.md records the cut. Every test that reads OBJECTIVE.md passes (two setup tests need `NPM_CONFIG_PREFIX=$HOME/.local` locally, a known environment quirk).

Builder checks: 118 test files that name a changed path ran alone, all pass after the main merge; trace, tree, map and README checks exit 0; anatomy `segment` runs work on empty fixtures; install check passed before the merge.

Questions:
- Does anything live still import, spawn or document a deleted factory piece, or did a move change behaviour for the profile store, the anatomy command or setup's hook removal?
- Did any deleted test pin the profile's privacy or a Windows path?
- Do the objective and priority lines say what the owner adopted, without adding anything the owner did not decide?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.

Put exactly one verdict line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, as the last line, and no other line starting with "Verdict".
