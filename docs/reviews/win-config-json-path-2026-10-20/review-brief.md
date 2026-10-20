# Review — win-config-json-path (both seats and doctor name a user nana-pack.json that does not parse, with the error's place and the repair for its kind, never its text; the Windows checklist's step 7 gives a forward-slash example), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-001 · Keep goals and priorities in view (R-1972 and R-1974 live in FEAT-015 · Diagnose the active environment)

Review `git diff cdf4b098..HEAD` on `feat/win-config-json-path` (main was `cdf4b098` when the lane last merged it;
`git merge-base HEAD main` is `cdf4b098`). Main has since moved to `8466795b` (doctor-fix-line landed; it changed
`packages/nana-setup/lib/doctor.mjs`'s `@outputs` header line, which this lane also edits, and gave three other rows an
install label, not the pi nana-pack.json row), so the land needs a merge of main and a confirmation round on the
merged tip. The plan of record is `docs/reviews/win-config-json-path-2026-10-20/must-meet.md`: three must-meet checks,
rows R-1970 to R-1972 (block R-1970 to R-1979), fixtures (a) to (c) and the known limits. `plan-attack.md` holds the
adversary's AMEND (one read in `config.ts`, no hook, extension or `steps.mjs` edit). `build-brief-1.md` is build 1
(82ed4542, on main 6bc2f727), and `build-brief-2.md` is build 2 (2abae182, merged with main cdf4b098 at d519cc09),
which split the advice by error kind and added rows R-1973 and R-1974. The seat's record is `seat-verify-d519cc09.md`:
CI run 39375725358 on draft pull request #104, 0 failing files on macOS, Ubuntu and Windows (the Windows suite log
`ci-windows-d519cc09.log` beside it); the wrong-code pairs (`seat-mutate.mjs`; `seat-mutate-output-82ed4542.txt`: 20
of 23 red, M17, M18 and M23 survived; `seat-mutate-output-d519cc0.txt`: 24 of 25 red, M18 the one declared survivor;
pairs run on macOS); and the independent check (`independent-check-82ed4542.md`: HOLDS, no MUST, nine probes, run on
build 1; its known bug fixed in build 2, which it did not re-run on). No code or test changed after d519cc09. The
local macOS install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement cdf4b09..124ef8d: 5 rows in 2 features
FEAT-001 · Keep goals and priorities in view
  R-1970 new (implemented)
  R-1971 new (implemented)
  R-1973 new (implemented)
FEAT-015 · Diagnose the active environment
  R-1972 new (implemented)
  R-1974 new (implemented)
```

CAP-01 moves from 185 to 188 rows and FEAT-001 from 32 to 35; CAP-04 from 416 to 418 and FEAT-015 from 96 to 98.

The code under review: in `packages/nana-pack/lib/json-text.mjs`, `jsonErrorPlace` (V8's trailing place only, through
the contract constant `JSON_ERROR_PLACE`), `jsonParseFailure` (a bad escaped or bad control character error is
`forward-slash`, every other parse error `manual`), `configFailureDetail` and `CONFIG_FAILURE_PREFIX`; in
`lib/config.ts`, `readConfigFile`'s `jsonFailure` and the `configFailure` that `loadConfig` and `loadUserObjective`
add to the objective settings; in `lib/objective.ts`, the line after the heading, in the found, UNAVAILABLE and
internal-error blocks; in `packages/nana-setup/lib/doctor.mjs`, `piPackConfigState` and the pi nana-pack.json row; the
root README's Windows step 7; and the pack README's objective-contract bullet. The checks sit in
`packages/nana-pack/tests/objective-golden.test.mjs` (R-1971, R-1973), `packages/nana-setup/tests/doctor-detail.test.mjs`
(R-1972, R-1974) and `packages/nana-setup/tests/fresh-machine.test.mjs` (R-1970).

Judge whether, with a user nana-pack.json that reads but does not parse once one BOM is removed (above all a Windows
path pasted with single backslashes), both seats' objective block keeps its objective lines and adds exactly one line
naming the file, the place when V8 reports one, and the repair for the error's kind, with no text from the file and
none of V8's message, byte-identical between the hook and pi, beside an UNAVAILABLE marker too. Judge whether doctor's
row reads ✗ with the same detail and keeps main's `missing or unparseable` text for a missing or unreadable file;
whether step 7's example parses and resolves to one file inside the home folder in the producer and in doctor; and
whether valid, missing, `null` and folder configs give exactly main's output in both seats and doctor. Judge too
whether each check would fail with its behaviour removed: the seat's pairs cover macOS; CI ran the five checks natively
on all three legs; M18, the line in the internal-error block, is the one declared survivor.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux and Windows; a path pasted
with single backslashes, an unquoted path, a byte-order mark, CRLF, an empty or truncated file, a trailing comma; CI
runs Node 22 on every leg, and the plan saw the same bad-escape message on Node 24); deliberate forgery is out (a
config crafted to defeat the place reader or the advice split). Lane class: install, hook or gate — it changes what
the Claude Code objective hook's producer and the pi nana-objective extension print, `lib/config.ts` (read by every
pack extension, the gate included) and doctor.

Check: (1) the must-meet checks and build 2's two are not vacuous: each named pair turns its check red, and M18 is the
one survivor; (2) no surface shows text from the file or V8's message, and the line stays one physical line under the
output cap; (3) the hook and pi stay byte-identical for every fixture, and a valid config gives main's bytes;
(4) nothing main does today stopped working: the gate's stop on a broken user config, a broken project-scope config,
doctor's other rows, install and its dry run, on all three legs; (5) the tests write only inside the temp homes they
own; (6) the pack README's new bullet against build 2's advice split (the seat's observation: it still says the line
always gives the forward-slash advice); (7) HANDOFF and the session entry are true, including the removed step 7 line,
the new residuals, the doctor-fix-line review lines and the independent check's build; (8) any MUST.
