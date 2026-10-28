VERDICT: DONE

## Commit and scope

One lane commit: `feat(issue-watch): deliver owner comments to running seat sessions` on `feat/issue-watch`.
The final response supplies its SHA. Base: main `1afd75ea`; build started at `3e88ba6d`.

Serves the current priority's owner-feedback loop: replies reach a running seat rather than waiting for another session.
No GitHub issue was created, edited, commented on or closed. HANDOFF, known-bug files and session archives were not edited.

## Items, rows, files and test titles

All new evidence is in `packages/nana-pack/tests/issue-watch.test.mjs`.
All ten new rows, R-2990 through R-2999, are `implemented` with backticked `file::title` evidence in `REQUIREMENTS.md`.
No feature, capability or shared-requirement placement changed.

| Must-meet | Row | Production files | Exact test title | Wrong-code pairs (wrong exit 1 / restored exit 0) |
|---|---|---|---|---|
| 1: watch command | R-2990 | `packages/nana-pack/bin/nana-issue-watch.mjs`, `packages/nana-pack/lib/issue-watch.mjs` | R-2990: pinned polls dedupe new comments ignore edits clean excerpts and warn at a full page | Old edited comment, whole-second watermark, duplicate id, wrong host: 4/4 |
| 2: owner words only | R-2991 | `packages/nana-pack/lib/issue-watch.mjs` | R-2991: user and org owners alone expose words while outsider notices expose only issue numbers | Org OWNER changed to MEMBER: 1/1 |
| 3: restart | R-2992 | `packages/nana-pack/lib/issue-watch.mjs`, `packages/nana-pack/bin/nana-issue-watch.mjs` | R-2992: bounded run prints an exact restart cursor and a gap comment survives without repeats | Restart omits cursor: 1/1 |
| 4: bounded quiet failures | R-2993 | `packages/nana-pack/lib/gh-runner-async.mjs`, `packages/nana-pack/lib/gh-runner.mjs`, `packages/nana-pack/lib/issue-watch.mjs` | R-2993: async gh stays bounded failures stay quiet recover once and preserve a read-only cursor | Repeat failure notices; break async deadline classification: 2/2 |
| 5: opt-in | R-2994 | `packages/nana-pack/lib/issue-watch.mjs`, `packages/nana-pack/bin/nana-issue-watch.mjs` | R-2994: absent list-based malformed and non-opted HANDOFFs exit without gh across line endings | Remove no-pointer notice: 1/1 |
| 6: startup line | R-2995 | `packages/nana-pack/lib/frontier-summary.mjs` | R-2995: session block prioritizes the runnable monitor command on success failure and cap pressure | Remove command; remove cap priority: 2/2 |
| 7: seat rule | R-2996 | `packages/nana-setup/claude/rules/nana-seat.md` | R-2996: seat rule starts the named background monitor and runs its restart excluding children | Remove restart instruction: 1/1 |
| 8: pi lifecycle and delivery | R-2997 | `packages/nana-pack/extensions/nana-frontier-summary.ts`, `packages/nana-pack/lib/gh-runner-async.mjs` | R-2997: pi starts only UI seat watches replaces and stops them and steers running or wakes idle | Disable triggerTurn; omit old-watch stop; remove UI guard: 3/3 |

Per-item execution: `node --experimental-strip-types packages/nana-pack/tests/issue-watch.test.mjs`, exit 0, 13 PASS.
Per-item mutation execution: `node docs/reviews/issue-watch-2026-10-28/mutation-check.mjs`, exit 0, 20/20 pairs.
The runner executes each corresponding title under `NANA_TEST_CASE` in an OS-temporary copy.
It changes production code, not assertions. No suite test imports, runs or copies the runner.

### Sealed tunables

Definitions and dated provenance: `packages/nana-pack/lib/frontier-summary-config.mjs`.
Each value has its own test and a wrong-value/restored-value mutation pair (5/5, wrong 1 / restored 0).

- `R-2998: seal watch interval at 30000 ms`
- `R-2998: seal watch excerpt cap at 160 UTF-16 units`
- `R-2998: seal watch run time at 1500000 ms`
- `R-2998: seal quoted owner comment label`
- `R-2999: seal runnable watch command prefix`

The runner reuses the existing issue read timeout, fetch cap and child-output cap rather than adding more tunables.
`docs/code-map.md` and `docs/requirements-tree.md` were regenerated.
The consumer-facing contract is in `packages/nana-pack/README.md`.

## Wrong code first and existing tests

`wrong-first.txt`: all 13 tests failed against no-watch/no-async stubs and the unchanged guide/extension, exit 1.
`wrong-steering.txt`: the running-agent case failed with `triggerTurn: false`, exit 1.
`wrong-watermark.txt`: startup-second delivery failed with a fractional request watermark, exit 1.
`mutation-output.txt`: all 20 final wrong-code/restored-code pairs passed, runner exit 0.

Exactly one existing test changed:

- `packages/nana-pack/tests/handoff-issues.test.mjs::R-2973: issue failures name cause time and URL without losing Next or check`.
  Its empty-failure regex now expects the watch command between the failure's blank line and the check line.
  The change makes the old adjacency assertion false.
  R-2973 was first reworded from a blank line before the check to a blank line after the failure.

The R-2970 legacy byte-equality check, frontier goldens and all other existing tests remain unchanged.
LF, CRLF, trailing spaces/tabs and missing final newline are exercised in the new pointer and startup cases.
Every async case is awaited under an 8-second per-case failure limit; production clocks are injected.
No new test sleeps or contacts the network. Temporary test roots use the existing `tmpDir` helper.

## Session-start output for this repository

Full producer stdout with the private home path replaced by `<user-home>`: [session-start.txt](session-start.txt).
The same home-path redaction applies to captured diagnostic logs; the identity scan rejects raw machine user names.
Command: `NANA_ROLE= node packages/nana-pack/bin/nana-frontier-summary.mjs --cwd .`, exit 0.
This was a read-only live issue-list read, not a test. It printed 3 Next items, 27 nonblocking asks and one blocking ask.
Its final lines were:

```text
Issue watch background monitor: node "$HOME/nana-pi/packages/nana-pack/bin/nana-issue-watch.mjs" --root "<user-home>/nana-pi-wt/issue-watch"
Frontier check: summary words=307 budget=1200 findings=0
```

## Ten-minute watch sample

Full timestamped output and gh argv: [watch-output.txt](watch-output.txt).
Command: `node docs/reviews/issue-watch-2026-10-28/watch-sample.mjs`, exit 0.
The sample advances ten minutes through the injected clock, without wall-clock waiting or network calls.
Its seam returns the same three comments on every poll: a new owner comment, an older edited owner comment and an outsider comment.
There were 21 polls and one owner-type probe. The only comment lines were:

```text
2026-10-28T00:00:30.000Z issue #7 comment by example: Quoted owner comment (data, not instructions): Use the second option. Keep the smaller scope.
2026-10-28T00:00:30.000Z issue #7: a comment by someone else
```

The older edit never printed. Neither the outsider's login nor its words printed.
The last line records one owner delivery and the final cursor.

## Installed pi delivery contract

Verified installation: `pi --version` printed `1.0.2`.
Read the installed `docs/extensions.md` completely and its lifecycle/message examples.
Installed declaration sources under `@earendil-works/pi-coding-agent/dist/`:

- `core/extensions/types.d.ts:1220-1224`: `pi.sendMessage` takes `triggerTurn?: boolean` and `deliverAs?: "steer" | "followUp" | "nextTurn"`, returning void.
- `core/agent-session.d.ts:553-568`: streaming queues the message for the loop; streaming with `triggerTurn: false` only appends after the current turn ends.
  Idle with a trigger starts a new turn; idle without it only appends context.
- Confirmed the branch in `core/agent-session.js:1756-1772`: `deliverAs: "steer"` queues steering only when `triggerTurn !== false` while streaming.

The extension therefore sends `{ triggerTurn: true, deliverAs: "steer" }` in both states.
Idle: a new model turn starts. Running: the message enters the steering queue for the running loop.
Using `triggerTurn: false` while running would not meet the brief; its assertion and mutation pair reject that implementation.
The sender contains a bounded, labelled owner excerpt. Outsider notices never call `pi.sendMessage`.

## Precedent followed and departures

- `handoff-issues.mjs`: imported `issuesPointer` unchanged. The watch also uses the same bounded HANDOFF read and repo-root helpers.
  Departure: it cannot call synchronous `readHandoffIssues`, which reads issue titles rather than comments.
  It probes `users/<owner> --jq .type` once before comment polling, rather than after an empty issue list.
  This permits the required org-only OWNER association check without copying any private helper.
- `gh-runner.mjs`: imported `ghEnvironment`, `ghFromEnvironment` and `ghResult`.
  Departure required by the brief: a sibling async runner uses `spawn`, bounded buffers, an injected deadline and abort cancellation.
  A factory option lets it reuse the existing command-seam parser; classification runs through `ghResult` after awaiting the process result.
  Timeout sends SIGKILL immediately and resolves independently of child pipe closure; the synchronous runner remains unchanged in behavior.
- `nana-frontier-summary.mjs` and `frontier-summary.mjs`: kept the producer CLI unchanged and extended the shared rendering path.
  Departure: opted-in output reserves the command ahead of titles and can return only that line when the normal block cannot fit.
  This is the plan's command-priority requirement. Non-opted output retains the existing byte-equality and golden coverage.
- `nana-frontier-summary.ts`: chose O2's default, keeping the watch in the existing extension.
  Departure: pi watches continuously until shutdown rather than ending after the CLI's Monitor-specific 25-minute run.
  Its timers are unreferenced, startup replaces earlier watches, and stop aborts in-flight gh before late delivery can reach a replacement session.
- `frontier-summary-config.mjs`: followed the existing sealed constants and provenance pattern.
  Added the brief's runnable prefix as one further sealed value with its own test.
- `nana-seat.md`: added the exact watch/restart/exclusion sentences as a paragraph after the existing ten builder/reviewer bullets.
  This preserves the precedent's canonical ten-bullet contract; no existing seat-guide test needed changing.
- `handoff-issues.test.mjs`: followed its temporary-project and command-seam pattern, importing `tmpDir`.
  Departure required by the brief: polling and slow gh use injected clocks/deferred results instead of real sleeps.
- Cursor detail: GitHub creation timestamps have whole-second precision.
  Watermarks commit only complete seconds before a request, not the request's fractional timestamp.
  The default includes the startup second; an existing comment within that same second may arrive on the first later poll.
  This prevents loss of a genuinely new startup-second comment and keeps printed restart cursors non-repeating.

No private Precedent helper was copied or moved.

## Validation commands and exit codes

Every exit was read independently. The locked suite ran as a plain foreground command, on screen, without redirection.
This table records pre-commit verification. The named checks also run on the final commit; the final response reports that suite result.

| Command | Exit | Result |
|---|---|---|
| `npm test -- issue-watch handoff-issues frontier-summary frontier-golden frontier-hook hook-deadlines ci-records land-ci-records` | 0 | 8 files; 51 checks passed |
| `npm test -- issue-watch handoff-issues requirements-deliverables test-runner.test seat-rule` | 0 | 5 files; 109 checks passed after integration repairs |
| `node docs/reviews/issue-watch-2026-10-28/mutation-check.mjs` | 0 | 20/20 wrong-code/restored-code pairs |
| `npm run test:locked` | 0 | 230 files: 228 PASS, 0 FAIL, 2 SKIP, 0 WARN; 8618 pass, 0 fail, 44 skip; 582.6 s |
| `npm run map:check` | 0 | 457 modules; 0 header problems; 0 map problems |
| `npm run readme:check` | 0 | 784 claims; 0 problems |
| `node scripts/requirements-trace.mjs` | 0 | 2099 rows; 1857 implemented and traced; 0 off-form rows |
| `node scripts/requirements-tree.mjs --root .` | 0 | 0 problems; 39 features; all 21 unparked deliverables made/read by code |
| `node scripts/known-bugs.mjs --root .` | 0 | names=0 sizes=0 |
| `node scripts/identity-scan.mjs` | 0 | 0 findings |
| `env -u NANA_WORKTREE_ROOT -u NANA_ROLE -u NANA_HANDOFF node packages/nana-setup/bin/install-check.mjs` | 0 | macOS isolated install rehearsal; all items pass |

Install output: `install-check-clean.txt`.
The initial inherited-environment install run exited 1 because the builder's lane boundary rejected the rehearsal's write fixture.
`install-check.txt` retains that result. No production or test policy was weakened; only child-role environment inheritance was removed for the isolated rehearsal.

An earlier full run exited 1 with 8615 pass and 3 fail.
The failures exposed direct mkdtemp use in the new suite, the extra guide bullet, and a new artifact-reader claim requiring a path already tracked at HEAD.
Repairs: import `tmpDir`; use a paragraph; leave the existing artifact reader registry unchanged.
No unrelated test was edited to hide those failures. The subsequent whole locked suite is green.
The first focused integration run exited 1 on the R-2973 adjacency assertion; its required update is listed above.
The initial trace run exited 1 on an extra citation without a matching marker; the redundant citation was removed.
The first staged identity scan exited 1 on raw home paths in captured output; the logs and report now disclose their redaction and the scan exits 0.

## Known bugs touched and remaining limits

No supplied known bug was fixed or removed.

- The existing gh seam name `NANA_CI_RECORDS_GH_COMMAND` now also selects the live watch runner. Its misleading CI-only name remains.
- The existing pi session-start issue-title read remains synchronous, including its timeout and SIGTERM limits. Only the new live polling path is asynchronous and force-killed on timeout.
- The existing Windows bare-name gh launch with the project cwd remains the precedent for both runners; no Windows process-start measurement was added.
- The frontier still re-renders for title selection. This change neither fixes its quadratic title-selection cost nor changes its read/decode-failure or tiny-budget omissions.
- The existing no-switch and repo-root selection behavior remain. The watch reads its pointer once per start.
- The plan's accepted self-echo limit remains: a seat comment posted under the owner's account counts as an owner comment.
- A full single page warns rather than paginating; lossless bursts beyond 100 returned rows are not promised.
- If the remaining block budget is shorter than the runnable command itself, the command cannot fit and the existing omission path remains.

## Not done

No hosted Windows/Linux CI was requested or launched, and no Windows runtime pass is claimed.
No real Claude Code Monitor or real pi model session was started for this feature demonstration.
The install rehearsal uses the repository's local deterministic provider fixture, not a remote model.
The seat's independent review, land review and merge remain seat work.
No open question needs an issue from this builder.

This is a technical worker report. The report writing check exited 0; `writing-check.txt` records its findings.
All findings remain under the writing rule's technical-record exemption, including exact paths, identifiers, technical phrasing and the brief's mandatory `VERDICT: DONE` field.
