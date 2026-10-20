# Review — hook-deadlines (the session-start hooks stop a hung producer at 1.5 s, and the verifier hook survives a closed stderr), 2026-10-20 (Fable, the land reviewer)

Feature: FEAT-013 · Install and connect harness runtimes (SUB-012 · Deliver commands, hooks and workflow resources)

Review `git diff cdf4b098..HEAD` on `feat/hook-deadlines` (main was `cdf4b098` when the lane branched; `git
merge-base HEAD main` is `cdf4b098`). Main has since moved to `6f07daee` (the doctor-fix-line land, then the
setup-checkout-spelling land), so the land needs a merge of main and a confirmation round on the merged tip. The plan
of record is `docs/reviews/hook-deadlines-2026-10-20/must-meet.md`: six must-meet tests, rows R-2010 to R-2015.
`plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is the one build (fe12b848). The seat's record is
`seat-verify-fe12b848.md`: CI run 39377281189 at fe12b848, 0 failing files on macOS, Ubuntu and Windows
(`ci-windows-fe12b848.log` beside it), the wrong-code pairs (`seat-mutate.mjs`; 5 of 5 red, 0 survived, on macOS
only) and the independent check (`independent-check-fe12b848.md`: HOLDS, no MUST, 12 probes, run on fe12b848). The
final reviewer's brief is `review-brief.md`. The local macOS install check runs before the land.

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

The code under review: `runHookProducer` in `packages/nana-setup/lib/hook-producer.mjs` now starts each session-start
producer (objective, adoption, stale-copies) with spawnSync's `timeout: HOOK_PRODUCER_TIMEOUT_MS`, 1500 ms; a run past
it prints the producer's unavailable marker through the existing failure branch. `verifier-pipe.mjs` ignores errors
on stderr as it already did on stdout. The new test file is `packages/nana-setup/tests/hook-deadlines.test.mjs`; two
older test files gain one check each.

Judge whether the lane fails open: a hook that exits non-zero, or runs past Claude Code's installed 5 s, where main
did not; a producer's partial text printed as if it were its real output; the verifier hook losing or changing its
ask decision; or a healthy producer's output lost on the paths main served. Judge whether it leaves a harm the review
standard lists: data lost or corrupted when the limit stops a producer mid-run (all three producers only read;
stale-copies runs its skill step as a dry run), a broken install or hook, or a test writing outside the temp folders
and temp homes it owns or leaving a process behind. Judge whether anything main does today stopped working: both
hooks' healthy output on macOS, Linux and Windows; the verifier hook's decisions; the knowledge pull hook; and both CI
install-check legs, whose hook objective and hook adoption steps read the hooks' output.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known bug: a producer
in a wait no signal ends, such as a hung network mount, is still not stopped, and Claude Code's limit then drops the
hook's output, as on main; a healthy producer slower than 1.5 s prints its unavailable line for that session, and no
cold start on a real Windows desktop has been measured; a stopped producer prints the same failed marker as a crash;
a producer whose detached child holds its stdout now gives the marker at the limit, and its real output is lost (no
current producer starts a child); no wrong-code pair ran on Windows, and nobody watched a real Windows kill at the
limit; no check proves a stopped producer leaves no process behind; R-2011's margin is about 2 s on macOS and its file
is not on the run-alone list; the shared-memory and roster-notice hooks have no deadline of their own.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux and native Windows; a
producer that loops or stalls in a wait a signal ends; a slow healthy producer; a hook reader that closes its end of a
pipe); deliberate forgery, such as a producer that traps signals on purpose, is out. Lane class: install, hook or
gate — the Claude Code hook launcher and the verifier hook.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.
