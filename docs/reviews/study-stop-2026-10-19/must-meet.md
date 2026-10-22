# study-stop: must-meet (adversary-amended)

**Feature.** When a graded run's child has finished but the run's evidence was not written, the bench study first records that run's spend. It then stops before any further paid call, with an error naming the evidence folder and the cause. A grader error whose evidence is on disk keeps today's behaviour.

**Class.** Ordinary. The lane touches apps/bench plus one count in a requirements-tree test. It changes no install, hook, gate, land or review tool.

**Threat model.** In scope is honest variation:
- an unwritable evidence folder: a file where a folder should be, a read-only folder or a full disk;
- a study asset missing at copy time;
- per-platform Node error text: on Windows ENOTDIR names only the blocking component, while POSIX names the full target;
- per-platform error codes.

Out of scope: deliberate forgery of evidence, results or ledger files.

**Today.** Probed 2026-10-19 on a temp copy at 0f2e0ca, with a stub child and no network.
- **Evidence write fault.** `executeRun` returns a grader-error record that keeps the spend, and `runPlan` moves on. With t1 blocked and t2 interleaved, 4 of 4 children start, 2 runs have no evidence, and no error is raised.
- **Asset-copy fault after the child.** It goes through the same catch and leaves no evidence folder at all. Interleaved, 4 of 4 children start with no error. The first-draft fix, which wraps `writeEvidence` only, also left 4 of 4.
- **Three-failure streak.** It never trips while a healthy task is interleaved, because every decided run resets it (R-519).
- **Probe evidence** (`raw/_probe/<profile>`). It already stops after its ledger row (run.mjs:994). No test pins this.
- **Already stop:** the ledger, results, keys, fingerprint and schedule writes. Each throws, and `main` exits 1 (run.mjs:1072). Ctrl-C salvage exits 130.
- **R-542** reads violated, pending the owner. The owner ruled 2026-10-10 (docs/sessions/2026-10.md): a study stops when it cannot write its evidence.

**Design.**
1. In `executeRun`:
   - hoist `evidenceDir` above the `try`;
   - declare `let evidenceWritten = false` and set it true right after `writeEvidence` returns;
   - in the existing catch, when `measured && !evidenceWritten`, add `evidenceError: { path: evidenceDir, code: e.code ?? null, message: e.message }` to the same grader-error record. Its state, spend and "already spent N tokens" wording stay unchanged.
2. In `runPlan`, after the results append is acknowledged and `releaseInflight` has run, throw when `rec.evidenceError` is set. The error names:
   - the tuple, the folder, the code and Node's message;
   - the spend and the results path;
   - "Refusing to spend anything further".

   `main`'s existing `.catch` exits 1.
3. Leave the probe path unchanged. One test pins it.
4. Update README stop condition 6, the README Evidence section, the `@errors` header and the "Every run leaves evidence" comment. Then:
   - regenerate the code map and the requirements tree;
   - raise the tree test's leaf total;
   - flip R-542 to implemented.

**Must-meet.** Every test is in `apps/bench/test/orchestration-paths.test.mjs`, new section 8c.

| Row | Requirement | Test title | Red today |
|---|---|---|---|
| R-1500 | WHEN a graded run's evidence write fails, the bench runner shall start no further paid child in that invocation. | evidence failure: no further paid child starts after a run's evidence cannot be written | 4 of 4 spawned |
| R-1501 | WHEN a graded run's evidence write fails, the bench runner shall stop with an error that names the run's evidence folder and the write's error code. | evidence failure: the stop names the run's evidence folder and the error code | No error. The message-only fix is also red on macOS |
| R-1502 | WHEN a graded run's evidence write fails, the bench runner shall append that run's record, with its measured spend, to the results file before it stops. | evidence failure: the run's spend is in results.jsonl before the stop | 4 rows. The rethrow fix gives 0 |
| R-1503 | WHEN a graded run's asset copy fails after its child has finished, the bench runner shall start no further paid child in that invocation. | asset failure: no further paid child starts after a run's asset copy fails and leaves no evidence | 4 of 4. The narrow fix also gives 4 of 4 |
| R-1504 | WHEN a graded run's checker reports a grader error after the run's evidence is written, the bench runner shall go on to the next scheduled run unless the three-failure rule stops the study. | grader error: a checker grader error with its evidence on disk does not stop the study | Green today (a pin). Red on "stop on every paid grader error" |
| R-542 (flip; text unchanged) | — | probe evidence failure: the study stops with the probe's spend in the ledger and no graded run started; plus the R-1500, R-1501 and R-1503 tests and five existing ledger and results tests once they carry the marker | Probe check green today. Red with run.mjs:994 deleted (2 spawns) |

**Shared setup.**
- The real `runPlan` and `executeRun`, with `plainProfile` "lean", so no registration probe runs.
- One stub child per case. It appends one byte per spawn to a counter file and emits `streamOf({ text: "the answer", tokens: 100 })`.
- Tasks t1 and t2, with `fixture: false`. Todo order t1/0, t2/0, t1/1, t2/1.

Per case:
- **Evidence case.** `raw/t1` is planted as a FILE. A reference `fs.mkdir(evDir, { recursive: true })` must throw and supplies the code and Node's message. R-1501 removes every copy of that message from the error, then requires `evDir` in what remains. Forwarding Node's message alone therefore fails on every platform.
- **Asset case.** t1 declares `assets: [{ from: "missing-asset.txt", to: "asset.txt" }]`.
- **Grader case.** t1 checks with `{ type: "no-such-checker" }`.
- **Probe case.** `extProfile` with a stub that emits `JSON.stringify(TOOLS)`, so `probe.ok` is true. `raw` is planted as a FILE, with one todo.

**Probed.** I ran all six checks against today's code, the narrow fix, the amended fix and eight wrong fixes.
- The amended fix: orchestration-paths passes 91 checks. Integration 48, ops 48 and plan 57 pass, unchanged.
- requirements-trace counts 1,239 rows, 0 off EARS form.
- Tree check, tree test, code-map check, code-map test and readme-check all exit 0.

**Known limits**
- Exit 1 relies on `main()`'s existing `.catch`. No test drives `main`, because it needs a real pi install for pricing. The tests pin `runPlan`'s rejection.
- The stopping run stays a grader-error record. A resume skips it unless its line is deleted, the same as an interrupted tuple.
- Diff-read faults and a mid-write fault (stream written, argv not) stop through the same flag. No test pins them. A model that leaves its workspace unreadable may now stop the study the same way (inferred, not probed).
- The asset-fault run still has no evidence on disk, an R-532 gap on that path. The lane makes it stop; it does not make it write.
- There are no read-only or disk-full tests. chmod is a no-op on Windows and is bypassed by root. The planted file reaches the same catch.
- In the evidence case the spend is recorded (R-1502), so R-542's "unrecorded spend" has nothing to name. The error names the spend anyway, unpinned.
- Throwing before `releaseInflight` is not caught, because section 9's Ctrl-C test clears the hook. It is harmless, because `main` exits at once.
- catch-ledger still loses the record of a judge call whose append fails, though it does stop. This predates the lane.
- The new checks were not run on Windows. The ENOTDIR shape comes from CI run 2, and that leg is non-blocking.