# Fact-check — CHANGE.md (fresh-install), external and process claims

Checked 2026-10-13 against: npm registry (`npm view`), npm 10.9.7 on this Mac, scratch prefixes under
`plan-fresh-install/probe/` and `plan-fresh-install/fc-probe/` (my own runs), pi 1.0.2 docs under
`$(npm root -g)/@earendil-works/pi-coding-agent/docs/`, code.claude.com/docs/en/hooks, `.github/workflows/ci.yml`,
`HANDOFF.md`, `docs/sessions/2026-10.md`, `REQUIREMENTS.md`, `~/.claude/nana-memory/shared/*.md`, the review
ledger (`~/.pi/agent/review-ledger*.jsonl`) and the two final review outputs it points at. Nothing global installed;
the repo was not touched.

## WRONG

| # | Plan claim | Evidence | Fix |
|---|---|---|---|
| W1 | §3.4 HANDOFF: "Drop `:44`'s second sentence" | `HANDOFF.md:44` sentence 2 is "Linux runs no install check." — still true (`ci.yml:24` install-check matrix is macOS + Windows only). The note-list text is sentence 3. | Drop the third sentence. |
| W2 | §3.4 step 2b: `npm i -g … --dry-run --prefix "$env:TEMP\pi-pin-probe"`; "expect a line naming pi-codemode at 1.0.2" | Run here (npm 10.9.7): a global `--dry-run` into a missing prefix exits 254 `ENOENT lstat <prefix>`; into an existing prefix without its global module folder, `ENOENT lstat <prefix>/lib`. With `lib` present it prints `add @earendil-works/pi-codemode 1.0.2` / `added 146 packages`, exit 0. The planner's own probe pre-created `pinned/lib`. Windows uses `<prefix>\node_modules`; same arborist path (INFERRED). | Create `$env:TEMP\pi-pin-probe\node_modules` first (or drop 2b). |
| W3 | Header: install check locally before landing "(Owner 2026-10-11)" | `feedback_lane_process_2026_10_11.md` item 5: "(Owner, 2026-10-12, "Yes")". Not in HANDOFF or sessions. | Date 2026-10-12. |
| W4 | §3.3: "the owner's queue (`HANDOFF.md:65`) names 'the README, desk and bench install commands'" as support for touching the frozen desk | `git blame`: line 65 added by the seat in a907b45 (ci-pi-pin, 10-13) under the owner's 10-11 heading; ci-pi-pin `CHANGE.md:182` calls it "Decided by the seat". Not the owner's words, so no the owner authority over a frozen feature. | Rest the decision on `REQUIREMENTS.md:41-42` ("A frozen feature takes no discretionary change to its rows or code") — a README is neither. Decision itself holds. |
| W5 | §1: final reviews "left seven SHOULD/NOTE points; only the note-list one is in HANDOFF" | Ledger: sol LAND, astra LAND at 9974218 (scores 9/10, 95/100 VERIFIED in `ic-sol-r1.md`, `ic-astra-r1.md`). Their seven distinct points do not include the note-list point; it has another source. | "seven points from the final reviews, plus the note-list point (HANDOFF `:44`)". |
| W6 | §3.1: values "declared there once with provenance (R-597, R-1091)" | R-597 = run the suite and gate release (`REQUIREMENTS.md:1037`). No row declares or seals `PI_VERSION`; only its `ci.yml:11` comment carries provenance. | Cite R-1091 and the `ci.yml` comment only. |
| W7 | §3.1: "CI proves that exact tree on macOS and Windows" | `HANDOFF.md:45`: "the install gate checks the workflow text, not the resolved packages". Nothing in CI asserts the resolved versions. | "CI installs with that cutoff on macOS and Windows". |

## UNVERIFIED (not run here; no primary source confirms)

- U1 Placeholder hint is a parse error in PowerShell and cmd. bash/sh (`-n` exit 2, "unexpected token `newline'") and zsh (`-n` exit 1) VERIFIED; no `pwsh` on this Mac. The plan labels this INFERRED; keep that label.
- U2 Unquoted `--before=…` reaches npm intact through `npm.ps1` / `npm.cmd`. Shim text VERIFIED (npm 10.9.7 copies: `%*`; `-Command` branch re-parses `$MyInvocation.Statement` via `Parser::ParseInput` + `Invoke-Expression`). Behaviour not run; the owner's npm version unknown.
- U3 "A PowerShell-started node keeps `Path`." Plausible (Windows env key casing; a spread copy of `process.env` keeps it). Not run.
- U4 "doctor passes on the bad tree": not run. `pi --version` VERIFIED: prints 1.0.2 on my broken scratch tree.
- U5 Builder luna for a "small lane": the roster (`reference_roster.md`, the owner 10-13 "agreed on the worker split") sends "multi-file changes, lanes with many rows" to Sonnet 5.5. This lane has 6 new rows, 4 evidence edits, 5 code files plus a new module, 19+ named tests, 12+ docs. The task assigned luna; the plan does not argue the class.

## VERIFIED (external)

- Registry: pi-codemode 1.2.0 published 2026-10-12T23:00:01.855Z; pi `latest` = 1.2.0; pi 1.0.2 takes six siblings at `^1.0.2`.
- Unpinned `npm i -g --ignore-scripts …@1.0.2` (my scratch run): 119 packages, codemode 1.2.0, import of `dist/index.js` fails "does not provide an export named 'MCP_TYPESCRIPT_PREAMBLE'" (from `pi-codemode/declarations`); codemode 1.2.0 dist has no such symbol, pi 1.0.2's `dist/extensions/codemode/tool.js` imports it.
- Pinned: eight `@earendil-works` packages at 1.0.2; `npm ls -g --all --parseable --long` identical to the seat's global tree (empty diff, 121 paths); npm reports "added 146 packages"; repair log: 119 CHANGE + 27 ADD, exit 0; import OK.
- `--before=`, `--before=""`, `--before=notadate`: npm warns "invalid config", value null, exit 0; an empty `--before=` dry-run resolves all siblings at 1.2.0.
- Unversioned (pi 1.2.0): main import OK; the desk's REQUIRED exports (`parseSessionEntries`, `migrateSessionEntries`, `CURRENT_SESSION_VERSION`) and the bench's (`ModelRuntime`, pi-ai `calculateCost`) present.
- pi answers RPC on stdout: DOC, pi 1.0.2 `docs/rpc.md:29,56` ("Stdout is reserved for protocol records … Do not parse stderr as protocol data"). The plan's §3.4 marks it INFERRED; it can cite the doc.
- Claude Code hooks doc: exec form when `args` is set (no shell, any platform); shell form `sh -c` / Git Bash / PowerShell. "Simulates Claude Code's documented dispatch" is accurate.
- ci.yml: env values and provenance; install-check job matrix, `defaults.run.shell: bash`, pinned line, version check, no `continue-on-error`; `release.needs: [suite, install-check]`; `pull_request` triggers CI. The replacement session sentence ("alongside the suite; the release waits for both") is true.

## VERIFIED (process / rulings)

- Threat-model line, 1 plan round for small lanes, no edits after all-LAND, urgent fixes alone: the owner 10-11 (`feedback_lane_process_2026_10_11.md`, HANDOFF `:18`).
- Materiality bar: the owner 10-13 (`feedback_review_materiality.md`, HANDOFF `:22`). Builder split wording for the new HANDOFF line matches `reference_roster.md`.
- Draft-PR push without asking: the owner 10-11 (`feedback_auto_push_after_land.md`). Independent review before land: the owner 10-10.
- Desk frozen 10-10 (HANDOFF `:12`, `:55`; `REQUIREMENTS.md:950` and six more). Quiesce rule: `packages/nana-setup/README.md:66`.
- Untested-and-traced row fails the rail: `REQUIREMENTS.md:9`; template rail `:84`, `:429`, which `scripts/requirements-trace.mjs` runs.
- R-1093–R-1099 unused on every branch; tree leaf total 1,088; apps may import packages (`code-map.config.json`); FEAT-013/015/019/034 all `active`; `pi-exports.mjs` is not study-pinned; the four README lines are the only README pi installs; `usage.test.mjs:300` carries no marker; README `:121` names a nonexistent "Upgrading pi itself" section; the residuals memory says "delete this memory once recorded".

## Process notes (not wrong, worth a line)

- P1 The materiality ruling's how-to-apply says the seat *downgrades* an under-pinned row; the plan pins instead. The reason holds (a downgrade fails the rail). Splitting is blocked because only R-1099 is spare. Name the deviation in §3.4.
- P2 `map:impact` list (§5) omits `install-check-config.mjs`, which §4 edits.
- P3 luna rule: §5 does not give the new exact title of the tree test, whose title contains "1,088". R-1078's existing cited title still says "job before suite", the same false claim the session fix removes.
- P4 Precedent for a wrong archived sentence: a "Correction to … entry below" paragraph (2026-10-11 entry), not an in-place edit.
- P5 Delete the residuals memory only after the land, not when HANDOFF is edited in the lane.

## Scope creep (no ruling or queue item asked)

- S1 §3.4 R-1079 stdout-only code change to the install-check verdict. The reviews asked only for negative tests. It is defensible (row text plus pi docs) but changes behaviour.
- S2 Step 2b added to the owner's blocking Windows ask, to test a seat inference. It is also broken as written (W2).
- S3 HANDOFF `:23` rewording. sol's NOTE covered only the the owner page `:23`.
- S4 A new `Fix:` line on the bench's import-failure path (R-1097, second title). No hint existed there; the queue asked that existing commands take the cutoff. Small and aimed at the break.
- S5 `--ignore-scripts` added to the desk and bench README commands. The queue asked for the cutoff only. This change follows from choosing CI's install-check line as canonical.
- S6 R-1094 (a presence row) and a new policy sentence in setup README `:70` ("a new pi version moves both values in ci.yml first").
