# Review — hook-deadlines (the session-start hooks stop a hung producer at 1.5 s, and the verifier hook survives a closed stderr), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-013 · Install and connect harness runtimes (SUB-012 · Deliver commands, hooks and workflow resources)

Review `git diff cdf4b098..HEAD` on `feat/hook-deadlines` (main was `cdf4b098` when the lane branched; `git
merge-base HEAD main` is `cdf4b098`). Main has since moved to `6f07daee`: the doctor-fix-line land (`8466795b`), then
the setup-checkout-spelling land. Neither touches this lane's code or test files, so the land needs a merge of main,
a regenerated map and tree, and a confirmation round on the merged tip. The plan of record is
`docs/reviews/hook-deadlines-2026-10-20/must-meet.md`: six must-meet tests, rows R-2010 to R-2015, with its design,
test shape and known limits. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is the one build
(fe12b848). The seat's record is `seat-verify-fe12b848.md`: CI run 39377281189 on draft pull request #105 at
fe12b848, 0 failing files on all three legs (the Windows suite log `ci-windows-fe12b848.log` beside it), the
wrong-code pairs (`seat-mutate.mjs`; `seat-mutate-output-fe12b848.txt`, 5 of 5 red, 0 survived, three gaps declared)
and the independent check (`independent-check-fe12b848.md`: HOLDS, no MUST, 12 probes, run on fe12b848). The local
macOS install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`; it compares against the merge base
cdf4b098):

```
tree movement cdf4b09..5200890: 6 rows in 1 features
FEAT-013 · Install and connect harness runtimes
  R-2010 new (implemented)
  R-2011 new (implemented)
  R-2012 new (implemented)
  R-2013 new (implemented)
  R-2014 new (implemented)
  R-2015 new (implemented)
```

CAP-04 moves from 416 to 422 rows, FEAT-013 from 156 to 162 and SUB-012 from 33 to 39. No existing row changed.

The code under review: `runHookProducer` in `packages/nana-setup/lib/hook-producer.mjs` passes `timeout:
HOOK_PRODUCER_TIMEOUT_MS` (1500, exported, chosen with provenance, sealed by R-2013) to its spawnSync, and nothing
else in the function changes; a run past the limit falls into the existing failure branch and prints the producer's
R-687 marker. `packages/nana-setup/claude/hooks/verifier-pipe.mjs` adds `process.stderr.on("error", () => {})`
beside its stdout guard. Both headers' `@errors` say so. The setup README gains one sentence. Tests: the new
`packages/nana-setup/tests/hook-deadlines.test.mjs` (R-2010 to R-2012, hung stub producers in a copied tree, expected
text from the checkout's `hookProducerConfig` and limit from its `desiredHooks`); R-2013 in `hook-producers.test.mjs`;
R-2014 and R-2015 in `hooks-closed-output.test.mjs`, whose runner now takes a script, args, env and the stream to
close. The knowledge CLI, `nana-adoption.mjs` and `nana-objective.mjs` do not change.

Judge whether a producer still running at the limit is stopped and replaced by exactly its marker, never its partial
text; whether the adoption hook still prints the second producer's output after the first one's marker, and ends
inside the installed 5 s with both hung; whether the healthy path prints the same as main; whether the verifier hook
keeps its decisions and diagnostics with open pipes and exits 0 with stderr closed; and whether the knowledge pull pin
is a real pin.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux and native Windows; a
producer that loops or stalls in a wait a signal ends; a slow healthy producer; a hook reader that closes its end of a
pipe); deliberate forgery, such as a producer that traps signals on purpose, is out. A producer in a wait no signal
ends is a declared limit, not a finding. Lane class: install, hook or gate — the Claude Code hook launcher and the
verifier hook.

Check: (1) the must-meet checks are not vacuous: each fails on main's code or on the wrong code its pair names
(R-2015 is a pin, and its wrong code sits in the knowledge CLI); (2) the limit applies to all three producers, a
stopped producer prints exactly its marker, and no partial stdout reaches the hook's output; (3) both hooks end
inside the installed limit when their producers hang, on every platform, and the healthy output and exit codes match
main; (4) the verifier hook's ask decision and stderr diagnostic are unchanged with open pipes, and it exits 0 with
stderr closed; (5) the tests write only inside the temp folders and temp homes they own, leave no stub process
behind, and clean up; (6) HANDOFF and the session entry are true, including the narrowed stale-copies residual, the
two removed closed-output residuals, the lane's new residuals and the other lanes' items; (7) any MUST.

Merge note (the seat, before round 1): `ff4218c7` merges main `6f07daee`, which holds the doctor-fix-line land (`8466795b`) and the setup-checkout-spelling land (`6f07daee`). Neither touches the lane's hook files. The merge helper resolved HANDOFF and the session file (both sides kept); the seat then dropped one doubled HANDOFF Landed line (review-test-waits' present-tense copy; main's past-tense line stays). Review `git diff 6f07daee..HEAD` for the lane's own change and `git show --remerge-diff ff4218c7` for the merge. The seat re-ran the local macOS install check on the merged tip before this round.
