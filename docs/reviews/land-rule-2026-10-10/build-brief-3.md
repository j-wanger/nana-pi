# Lane land-rule — continuation 2: ONE job — a green suite with the restored tests (seat, after build 2 PARTIAL)   (2026-10-10 · feat/land-rule)

Build 2 (`dd5ac7a`) restored the land tests and the title map — good. But it committed a RED suite:
`land.test.mjs` fails 22 checks and the trace rail fails on evidence. This round has one job: make
`npm run test:locked` pass with every restored test testing what its title says. Nothing else; the
per-row focused tests and the mutation pairs are the NEXT round. Finish this whole job before you
report — do not stop at the first green file.

## The causes the seat found (fix the class, not each test)
1. **Fixtures still build the old world.** The restored tests hand-write version-1 LAND records and
   build tips with commits no reviewed revision covers, so the new rule refuses them early ("no
   verified version-2 LAND review", "uncovered commits") — before the step each test means to check
   (a suite-time branch switch, tracked changes, divergence, a release-status line, a signal exit).
   Change the shared fixture helpers so that, by default, the tip a test lands is covered and has a
   verified version-2 LAND for its item (written the way `complete()` writes one, into the test's
   scratch `home`); a test that is ABOUT a missing, wrong-item, wrong-revision, drifted, version-1 or
   uncovered review sets that up explicitly. Then each test reaches the step its title names, and its
   original assertion holds unchanged unless the title map records an intended change.
2. **The two R-978 exemption tests are still in the file**, failing. The map retires them: delete them.
3. **The pack README dropped pinned phrases.** R-981's test ("README and AGENTS describe the land
   helper") checks patterns such as "clean source tree"; build 1's README rewrite removed them. Put
   each pinned phrase back in the rewritten land paragraph, true of the new behaviour — never edit
   the test's patterns.
4. **Evidence cites missing or unmarked tests.** R-975, R-976 and R-977 still cite the deleted
   `land-rule.test.mjs`; R-588 and R-979 cite titles that carry no `// req:` marker. Point each at the
   restored tests that pin it (R-975, R-976, R-977, R-979, R-588 as they were at `661f76e`, with the
   mapped renames), each with its marker. New rows R-1002–R-1011 keep citing whatever passing tests pin
   them now; the next round adds focused ones.

## Then
`npm run req:tree`, `npm run map`, `npm run map:check`, `npm run readme:check`,
`npm run test:locked` (MUST pass), commit, `npm run template:accept`, then
`node docs/reviews/land-rule-2026-10-10/seat-verify-land.mjs > docs/reviews/land-rule-2026-10-10/seat-verify-land-output.txt 2>&1`
and `node docs/reviews/land-rule-2026-10-10/seat-verify-tests.mjs >> docs/reviews/land-rule-2026-10-10/seat-verify-land-output.txt 2>&1`
(both exit 0), commit that file. Report the suite's summary line and check count.

Rules as `build-brief.md`. Frozen: `CHANGE.md`, both seat scripts, the title map's existing entries,
FEAT-008's `Purpose:` and `Also applies:` lines, `HANDOFF.md`, `docs/sessions/`. Report ≤ 30 lines,
first line `VERDICT: …`.
