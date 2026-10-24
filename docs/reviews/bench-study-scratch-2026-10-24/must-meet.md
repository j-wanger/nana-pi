# bench-study-scratch · must-meet of record (seat, 2026-10-24)

Feature: FEAT-034 · Define reproducible comparisons

The owner's pick, 2026-10-24, from the product ledger artifact audit: "Bench fix (Recommended)". The audit (workflow wf_355ecc0f-a46) found that section 11 of `apps/bench/test/orchestration-paths.test.mjs` runs `executeRun` with `studyDir` set to the shipped study `apps/bench/studies/tool-profiles-2026-09-08` and the real profile name `research`, so the run writes its evidence into `<shipped study>/raw/code-bugfix/research/rep0/`; the section then removes `<shipped study>/raw/code-bugfix` recursively. Every checkout that runs the suite loses that task's evidence for every profile and every rep. On this machine the folder is gone while 12 tracked records in the study's `results.jsonl` point into it (the deletion by the suite is inferred). The comment above the call says the opposite: "evidence goes to a scratch dir, so running the tests never writes into the shipped study"; only `resultsPath` went to scratch.

Spend line: the current priority (since 2026-10-23): artifacts as maintained features. The study's evidence is a deliverable artifact (R-507's results point at it); a test that deletes it breaks the artifact.

Stakes: low blast, reversible for the code; the lost evidence is not recoverable. Test code only; `apps/bench/run.mjs` and every product path stay unchanged.

Threat model: honest variation in scope — a checkout with no `raw/` folder (CI, a fresh clone), one with paid evidence under `raw/` (this machine), one with evidence for the same task under other profiles, Windows paths, a slow file system. Deliberate forgery out (a hand-planted file meant to fool the listing).

Class: ordinary (a bench test; no install, hook, gate or land-tool change): the final reviewer only. Builder: the small builder, one session.

## Seat decisions on the attack

The adversary's pass (one agent, read-only, kept as `plan-attack.md`):
- **M1 adopted.** A scratch study folder breaks the sidecar: `lib/profiles.mjs:91-92` resolves `study.sidecarExtension` against `studyDir`, so the run returns `blocked` (`run.mjs:443`). The case passes `study` with `sidecarExtension` and `fixture.dir` made absolute against the shipped folder.
- **S7 adopted: no copy.** `studyDir` is an empty scratch study folder under `freshStudyDir` (its own name, not `real-fixture-run`, N12). The shipped fixture is only read (`verifyFixture`, `hashDir`, `materialize`); c7 has no `task.assets`. Section 10 still covers a relative `fixture.dir`.
- **S3 adopted.** The trailing `fs.rm` of `<shipped study>/raw/code-bugfix` goes; the scratch folder sits under `root`, which `finally` removes. Wrong version 2 (an rm of the shipped folder put back) cannot be caught where that folder is absent, which is everywhere today; it is a known limit, and R-2771 guards an rm inside the scratch folder.
- **S4 adopted.** `rec.evidence` is always relative, so R-2770 asserts the evidence files exist on disk under the scratch folder, and the workspace-diff read at the R-533 check goes through the scratch path.
- **N5, N6 noted.** R-2772's listing includes folders (a created-then-removed child moves only the parent's time); no other bench test writes into a shipped study, so the listing does not flake under `--jobs=4`.

## Must-meet rows

- **R-2770** (FEAT-034): The orchestration test's shipped-study case shall run with an empty scratch study folder, reading the shipped fixture and sidecar by absolute path, and that run's evidence files shall exist under the scratch folder. Test: `R-2770: the shipped-study case runs in a scratch study folder and its evidence files exist there`.
- **R-2771** (FEAT-034): The orchestration test shall leave in place every evidence folder it did not create: a stand-in evidence file the test seeds in the scratch folder, under the same task and another profile, shall survive the case byte for byte. Test: `R-2771: evidence the shipped-study case did not create survives it byte for byte`.
- **R-2772** (FEAT-034): After the orchestration test file's last case, each shipped study folder's recursive listing of paths, sizes and modification times, folders included, shall equal its listing taken before the first case. Test: `R-2772: the orchestration tests leave every shipped study folder's listing unchanged`.

## Precedent

- `apps/bench/test/orchestration-paths.test.mjs` — `freshStudyDir` and section 11 itself; section 10 (test:727-737) for a study whose `fixture.dir` is relative.
- `apps/bench/test/catch-ledger.test.mjs` — lines 298-300, the nearest code that keeps a test's study work out of a shipped study.
- `apps/bench/test/tmp-dir.mjs` — the bench's own test temp helper.
- `apps/bench/run.mjs` — `executeRun`, `evidenceDir` and `rec.evidence` (relative to `studyDir`), unchanged.
- `apps/bench/lib/profiles.mjs` — the sidecar path resolution (lines 91-92), unchanged.

## Wrong versions the builder confirms by hand (not committed)

1. Section 11 runs with `studyDir` set to the shipped study again: R-2770 turns red (no evidence under the scratch folder), and R-2772 turns red on CI (a new `raw/` folder in the shipped study).
2. An `fs.rm` of the scratch folder's whole `raw/code-bugfix` after the case: R-2771 turns red.
3. R-2772's listing without folders: a check that only lists files misses a folder made and removed again; confirm the listing includes folders and their times.

## Known limits (the seat writes them before the final round)

- The lost evidence stays lost; the 12 records keep pointing at a missing folder. A FEAT-034 known-bug line records it.
- An rm of the shipped study's `raw/code-bugfix` put back into a test cannot be caught where that folder is absent (CI, fresh clones, this machine today).
- An operator running `run.mjs` or `catch-ledger.mjs` on a shipped study during the suite can change its listing and fail R-2772 (adversary N6).

## Docs and lines that change

- REQUIREMENTS.md: three rows under FEAT-034. `docs/requirements-tree.md` regenerated. No README claim changes.
