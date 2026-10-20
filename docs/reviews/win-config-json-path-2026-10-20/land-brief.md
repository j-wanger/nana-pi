# Review — win-config-json-path (both seats and doctor name a user nana-pack.json that does not parse, with the error's place and the repair for its kind, never its text; the Windows checklist's step 7 gives a forward-slash example), 2026-10-20 (Fable, the land reviewer)

Feature: FEAT-001 · Keep goals and priorities in view (R-1972 and R-1974 live in FEAT-015 · Diagnose the active environment)

Review `git diff cdf4b098..HEAD` on `feat/win-config-json-path` (main was `cdf4b098` when the lane last merged it;
`git merge-base HEAD main` is `cdf4b098`). Main has since moved to `8466795b` (doctor-fix-line landed; it changed
`packages/nana-setup/lib/doctor.mjs`'s `@outputs` header line, which this lane also edits), so the land needs a merge
of main and a confirmation round on the merged tip. The plan of record is
`docs/reviews/win-config-json-path-2026-10-20/must-meet.md`: three must-meet checks, rows R-1970 to R-1972 (block
R-1970 to R-1979). `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` and `build-brief-2.md` are the two
builds (82ed4542 on main 6bc2f727; 2abae182, merged with main cdf4b098 at d519cc09, which adds rows R-1973 and
R-1974). The seat's record is `seat-verify-d519cc09.md`: CI run 39375725358 on macOS, Ubuntu and Windows, 0 failing
files on each (`ci-windows-d519cc09.log` beside it); the macOS wrong-code pairs (`seat-mutate.mjs`; 24 of 25 red on
d519cc0, M18 declared; 20 of 23 on 82ed4542); and the independent check (`independent-check-82ed4542.md`: HOLDS, no
MUST, nine probes, run on build 1; its known bug fixed in build 2). The final reviewer's brief is `review-brief.md`.
The local macOS install check runs before the land.

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

The code under review: `jsonErrorPlace`, `jsonParseFailure`, `configFailureDetail` and `CONFIG_FAILURE_PREFIX` in
`packages/nana-pack/lib/json-text.mjs`; the `configFailure` that `lib/config.ts` adds to the objective settings from
its one read, which the Claude Code objective hook (through `loadUserObjective`) and every pi session (through
`loadConfig`, which the gate also reads) take; the config line in `lib/objective.ts`; the pi nana-pack.json row in
`packages/nana-setup/lib/doctor.mjs`; the root README's Windows step 7; and the pack README's objective-contract bullet.

Judge whether the lane fails open: a broken user config that now turns the objective off or drops its lines (a broken
file that spells `enabled: false` must still print them), a hook that exits non-zero or prints nothing, a pi session
whose gate no longer stops gated tools on a broken user config, or doctor reading ✓ for a broken, missing or
unreadable file. Judge whether it leaves a harm the review standard lists: text from the owner's config or V8's message
shown in a surface that did not show it before; a broken install or hook (a session-start block over the output cap or
split across lines, the hook and pi no longer byte-identical); data lost or corrupted (install or doctor writing to the
config); or a test writing outside the temp homes it owns. Judge whether anything main does today stopped working: the
objective block for a valid, missing, `null` or folder config, the gate's stop and pi's config warning, a broken
project-scope config in a trusted repo, doctor's other rows, install and its dry run, on any of the three CI legs. The
plan's known limits that HANDOFF records (no place for an unexpected token or an empty file; V8's wording, with Node 24
unchecked here; the gate stop and journal still quoting up to 120 characters of V8's message; the silent adoption
fallback and no line for an unreadable config; a path of valid escapes; `~\`; doctor's objective file row; the unpinned
internal-error line; the independent check on build 1 only; the pack README bullet's stale advice) are known limits
unless the review standard lists them as harms.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux and Windows; a path pasted
with single backslashes, an unquoted path, a byte-order mark, CRLF, an empty or truncated file, a trailing comma; CI
runs Node 22 on every leg); deliberate forgery is out (a config crafted to defeat the place reader or the advice split).
Lane class: install, hook or gate — it changes what the Claude Code objective hook's producer and the pi
nana-objective extension print, `lib/config.ts` (read by every pack extension, the gate included) and doctor.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.


Build 3 (since the briefs were written): build 3 (7e17a969, build-brief-3.md) rewrote the pack README bullet in item (6), so it now says the line gives the forward-slash advice for a backslash error and "Repair the JSON by hand." for any other parse error. The seat commit after it (a0bccd0d) drops the unparseable config from the doctor-fix-line residual's list of ✗ lines that name no fix, since doctor's row now names one. Main 8466795b was merged in at ec916812 before build 3. Build 3 touched only the README; CI ran on d519cc09.
