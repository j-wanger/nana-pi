Feature: FEAT-042 · Measure what each role's context is for

Lane builder-drop-lessons (lessons-arm-oversize). Class: ordinary. Builder: pi-worker (small lane). Build session 1, on `feat/builder-drop-lessons`, branched from `origin/feat/builder-drop` 8ed1c753. That branch is an experiment branch that does not land; this branch exists so the seat can fold it in after a running pilot. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH.

Why: the replay harness's `cutPart` (`apps/bench/lib/replay-context.mjs` 18-29) throws "replay: model labels missing" when any unit in a cut section has no model label. Units longer than `OVERSIZE_UNIT_CHARS` (3000, `apps/bench/lib/anatomy-config.mjs`) are never labelled. So a `dropLabel` arm cannot run on any real context.

Threat model: honest variation in recorded contexts is in scope: oversize units anywhere, in the system prompt or the first instruction. A forged label store is out.

Standing authorization: when a Precedent file has a private helper this lane needs, export it from its own module (never copy, never move it) and report each export as a departure.

## Build

1. Requirements first: amend R-3601 so its text says that, in a label cut, a unit longer than the sealed oversize bound with no model label stays in place (kept), and any other unlabelled unit still refuses. Add the new check's title to its evidence. No new row.
2. One new tagged check in `apps/bench/test/replay.test.mjs` (`// req: R-3601`). A cut section holds an unlabelled unit longer than `OVERSIZE_UNIT_CHARS`, next to a labelled unit carrying the dropped label. Pins:
   - The render succeeds.
   - The oversize unit's text is present exactly once.
   - The labelled unit is removed.
   - An unlabelled unit at or under the bound in the same fixture still throws "replay: model labels missing".
   Build the oversize text from the imported constant, never a literal length.
3. Code: in `cutPart`, a unit with no label whose text length exceeds `OVERSIZE_UNIT_CHARS` is kept. Import the constant from `anatomy-config.mjs`. Use the same length test anatomy uses (`anatomy-measures.mjs:18`, `s.text.length > OVERSIZE_UNIT_CHARS`). Import that predicate if it is exported, or export it under the standing authorization, rather than restating it. Heading and table removal must treat a kept oversize unit as not removed.

## Constraints

- Edit only `apps/bench/lib/replay-context.mjs`, `apps/bench/test/replay.test.mjs`, `REQUIREMENTS.md`, an export from `apps/bench/lib/anatomy-measures.mjs` under the standing authorization, the generated files through their generators (`npm run map`, `node scripts/requirements-tree.mjs --write`), and this folder.
- Do not touch any other replay harness file: a paid pilot fingerprints them.
- Never read a real context, label store or transcript; fixtures are synthetic.
- Never read, print or use a stored credential. No GitHub API calls.
- No committed text names a person or a machine path.

## Done when

- `wrong-code.txt` in this folder: the new check against the branch base's code (throws) and against yours (passes).
- Green, run locally: `node apps/bench/test/replay.test.mjs`, `node apps/bench/test/anatomy.test.mjs`, `node packages/nana-pack/tests/test-runner.test.mjs`, `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, `node scripts/requirements-tree.mjs --check`, `node scripts/known-bugs.mjs --root .`, and `node scripts/identity-scan.mjs --root .` after `git add`.
- Commit explicit paths on `feat/builder-drop-lessons`.

Report the row change, the code, any export, the wrong-code run and each departure. Commit, do not push, and stop. Report the full tip.

## Precedent

- `apps/bench/lib/replay-context.mjs`: `cutPart` (18-50).
- `apps/bench/lib/anatomy-measures.mjs`: the `oversize` predicate (18).
- `apps/bench/lib/anatomy-config.mjs`: `OVERSIZE_UNIT_CHARS` (11).
- `apps/bench/test/replay.test.mjs`: the R-3601 check (111-147), with its `context` and `labelsFor` fixtures.
