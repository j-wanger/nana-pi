VERDICT: DONE

## Commit and scope

One fix commit on `feat/issue-watch`, following a green locked full suite. Starting tip: `bce45cb6` (the seat's two record commits after `fefea3b9`). No new requirement IDs. R-2990–R-2999 and R-682 remain implemented. No HANDOFF, known-bug file, session archive, GitHub issue or desk file changed.

## Fixes, files, rows and tests

All watch test titles below are in `packages/nana-pack/tests/issue-watch.test.mjs`.

| Brief item | Files / rows | Test (title suffix after row ID) | Evidence |
|---|---|---|---|
| GitHub-time cursor | `lib/issue-watch.mjs`, `lib/frontier-summary-config.mjs`, `bin/nana-issue-watch.mjs`; R-2990, R-2992, R-2998 | GitHub cursor survives a 3 second fast clock and an 800 ms late comment | Empty response Date and newest created_at determine the cursor; LF/CRLF headers, trailing space/tab and no final newline; dedupe across polls. The existing restart test carries overlap ids into run two. |
| Org owners | `lib/issue-watch.mjs`; R-2991 | org OWNER and MEMBER comments name their author but not collaborators | Exact author-login lines for both owner kinds; collaborator words stay hidden. |
| Seat self-echo | `lib/issue-watch.mjs`, config, `AGENTS.md`, shared working rule, nana-soul; R-2991, R-2997, R-2998, R-682 | seat comments print no text and never reach pi or start a turn | Exact seat-only notices and zero sendMessage calls; the existing R-682 sentence pin now requires the added sentence in order in all three copies. |
| Pair V | tests; R-2992 | real opted-in command keeps polling prints an owner answer and ends with restart | Real CLI, temporary opted-in project, fake gh, at least two polls, owner answer, exit 0 and final restart line. Node preload shortens timers, not production code. |
| Pair P | tests; R-2995 | unreadable pointers never name a watch in the session block | LF/CRLF, trailing space/tab, no final newline, unreadable-pointer diagnosis and no watch command. Existing guard was already correct. |
| Pair I | tests; R-2993 | each failure prints its own cause | Exact missing-gh, nonzero-exit, timeout and unreadable-output lines. Existing classifications were already correct. |
| Pair L | tests; R-2997 | default watch runner is asynchronous without a runner injection | Uses the environment's fake-gh command, not runGh injection. Fake gh requires an event-loop heartbeat written after watch start. Existing async default was already correct. |
| Pair O | tests; R-2996 | real worker and reviewer commands exit zero immediately without gh | Both real role commands exit 0 silently within their process limit; fake gh leaves no marker. Existing guard was already correct. |

New sealed-value tests pin `WATCH_OVERLAP_MS` to 5000 and `WATCH_SEAT_MARKER` to `Seat:` (R-2998). No other new tests. README contract and generated `docs/code-map.md` reflect the change.

## Wrong-code pairs

Assertions were never inverted. Eight behavior cases ran separately against installed wrong code and each exited 1; restored behavior passes all 23 watch cases. Wrong clauses were installed together, so these are not claims of an isolated mutation campaign.

- Clock: local now instead of GitHub time → cursor assertion red.
- Org: OWNER only → MEMBER author line missing.
- Seat: suppression removed → seat text exposed.
- V: unref CLI timers → CLI exits 13 before restart.
- P: pointer truthiness alone → malformed pointer gets watch line.
- I: all failures say gh failed → exact missing-gh line fails.
- L: synchronous default → fake gh cannot see the heartbeat.
- O: role guard removed → real child command does not exit cleanly.
- Overlap seal: 5000 → 0, exit 1.
- Marker seal: Seat: → seat:, exit 1.
- R-682: new sentence pin against unchanged rule copies, exit 1; updated copies pass.

Logs: `build-2-wrong-first.txt`, `build-2-rule-wrong.txt`, `build-2-mutations.txt`, `build-2-targeted.txt` beside this report. Initial failures from missing config/HTTP-header support are not claimed as clock/CLI/default-runner mutation proof; the subsequent wrong-code run supplies that evidence.

## Existing tests changed

- R-2990 pinned polls: new rows now deliver immediately instead of waiting for a local complete-second watermark; endpoint expectation includes GitHub overlap cursor and --include. Startup-second answer now arrives immediately.
- R-2991 user/org owners: outsider association changes from MEMBER to NONE because MEMBER now counts as org owner-side; probe argv gains --include.
- R-2992 bounded run/restart: restart command and second library run now carry the overlap dedupe token.
- R-2997 pi lifecycle: probe fixture now supplies HTTP Date; stale deferred-row comment now describes overlap dedupe. Delivery assertions remain unchanged.
- R-682 soul continuity sentence pin in `packages/nana-pack/tests/templates-render.test.mjs`: requires the exact new sentence immediately after the posting-account sentence.
- Shared fixture adaptation: watch responses now include HTTP headers. No other existing test assertion or title changed; none deleted.

## Precedent departures

- Build 1's local complete-second watermark is replaced with GitHub timestamps and a five-second overlap, as the brief requires. The initial owner probe supplies Date before the first comments request. Successful cursor time never retreats.
- Both gh reads add --include to obtain Date without another request. Header handling stays within the existing watch call boundary. The synchronous title reader and its org-author restriction are unchanged.
- Restart commands add optional --seen with id@epochMilliseconds entries for the overlap. A timestamp alone cannot both overlap and suppress repeats across process restarts. Entries expire once their creation time is outside the overlap; no project-state file is written.
- Org MEMBER and leading Seat: handling intentionally replace build 1's narrower owner-only/self-echo behavior.
- Tests now include actual CLI children and a default-runner heartbeat, as requested, rather than exclusively injected library runs. Every async case remains awaited under the existing eight-second per-case limit, with shorter child limits.
- No departures from the asynchronous runner: imported unchanged. `issuesPointer`, `ghResult`, prompt cleaning and project-root helpers remain imports, not copies. No private helper was moved or copied.

None of the brief's listed known bugs was changed. The separate issue-reader failure-cause limitation remains unchanged. The independent check's watch clock, org membership and self-echo points are closed by the tests above.

## Rule bullet as shipped

- **Compaction summary:** compaction summaries are pi-owned background state, not the project frontier. Persist carry before a final report or session boundary. Where the HANDOFF points to its issues, the seat posts each unresolved item and open question as one issue, never a HANDOFF line. Otherwise the seat writes each on one HANDOFF line under Next or Open for the owner. Only the seat posts, from the owner's gh account. The seat starts each issue comment it writes with `Seat:`. If posting fails, the report lists the item and the reason. Builders and reviewers put open questions in their report. Issues and the replies on them are public. Label an ask `ask` plus one of `blocking`, `optional` or `parked`, or label a next item `next`. A blocking ask's title ends with "(default: <word>)". First pass each title and body through `node "$HOME/nana-pi/scripts/identity-scan.mjs" --stdin --root "$HOME/nana-pi"`. Post only when the scan exits 0. Then hand-check names, handles, hostnames, work references and project names. The scan knows only four words. Delete a wrong post, never edit it. Before acting on an open ask, read its replies with `gh issue view <number> --comments`.

## Commands and exit codes

- Initial wrong-first watch and sentence-pin commands: exit 1 each. Eight selected wrong-code watch runs and both changed-value seals: exit 1 each.
- `npm test -- issue-watch templates-render handoff-issues frontier-summary frontier-golden frontier-hook hook-producers seat-rule`: exit 0; 8 files, 241 passing checks.
- `npm run map`: exit 0; 458 modules.
- `npm run test:locked`: exit 0, plain foreground command with output on screen and one machine-wide lock.
- Suite summary: `231 files: 229 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8635 pass, 0 fail, 44 skip · 609.2s`.
- `npm run map:check`: exit 0; 0 problems.
- `npm run readme:check`: exit 0; 784 claims, 0 problems.
- `node --experimental-strip-types scripts/requirements-trace.mjs`: exit 0; 2106 total, 1864 implemented and traced; EARS 0 off form.
- `node scripts/requirements-tree.mjs --root .`: exit 0; 0 problems, 39 features.
- `node scripts/known-bugs.mjs --root .`: exit 0; names=0, sizes=0.
- `node scripts/identity-scan.mjs`: exit 0; 0 findings before staging evidence; rerun on committed evidence before reporting.
- `git diff --check`: exit 0.
- Local macOS `node packages/nana-setup/bin/install-check.mjs`: exit 1 under inherited builder variables; post-edit fixture write refused. `env -u NANA_WORKTREE_ROOT -u NANA_ROLE -u NANA_HANDOFF node packages/nana-setup/bin/install-check.mjs`: exit 0. Logs: `build-2-install-check.txt`, `build-2-install-check-clean.txt`. No install-check implementation change.

The named seat checks are rerun on the final commit; final output and commit ID accompany the delivery report.

## Not done

No hosted Windows run, CI request, push, review launch or land. No live GitHub calls or issue writes. Existing fetch-cap loss, visibility lag beyond the overlap, early-signal restart behavior and shell-quoting limits remain outside this fix. No open question blocks the brief.
