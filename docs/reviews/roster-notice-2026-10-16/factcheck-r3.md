# Fact-check r3: fleet/CHANGE.md (roster-notice, seat draft 3) against the repo at 2dbc817

Read-only, 2026-10-16. "Ran" = run here today. "Read" = confirmed by reading the cited source, not run. INFERRED = neither.
Nothing under the repo, its worktrees, `~/.claude` or `~/.pi` was changed. New scratch probes are in `fleet/fc3/`
(`hookcount.mjs`, `claims-probe.mjs`, `placement.mjs`); `probe/malformed-probe.mjs`, `fc/shape-larger.mjs` and
`notice-lengths.mjs` were re-run.

Result: 2 WRONG items that change the plan (MUST), 19 smaller WRONG or imprecise items (SHOULD), 6 UNVERIFIABLE, the rest VERIFIED.
The plan holds no owner name, no verbatim owner quote, no provider, routing-service or machine name (details at the end).

## MUST (WRONG, changes the plan)

1. **Two install-check count edits cannot pin the new hook, so pair 36 cannot red them.** §5.2 says the `>= 5` floors at
   `install-check.test.mjs:329` (check `:321`) and `:519` (check `:517`) become 6. Ran (`fc3/hookcount.mjs`, the test's own
   fixture stub): today the two hook regexes already match **6** calls on linux and on darwin. The 6 calls are objective,
   adoption, shared memory, knowledge, and the verifier hit and miss. With the roster notice row there are 7.
   - So a floor of 6 still passes when the table drops the row (pair 36), and `:321` and `:517` stay green under pair 36.
   - Pair 36's red list ("I1; install-check `:45`, `:474`, `:289`, `:321`, `:517`") then fails N/N in the mutation runner.
   - Fix: make both floors 7, or assert a `nana-roster-notice.mjs` call by name, as the `:297` list does for `:289`.
2. **"Paste the `--json` output into the file" is wrong for every installed machine.** The installer seeds the user-scope
   nana-pack.json from `packages/nana-setup/pi/nana-pack.seed.json`, which holds an `objective` block
   (`steps.mjs:63`, `:589`; `state-manifest.mjs:48`). Ran: this Mac's file holds exactly one key, `objective`.
   R-1192 prints one object holding only `roster`. So the D1 cost line ("paste the `--json` output, change one value") and
   §3.8's README text ("a block to paste into the file and change one value") describe an edit that goes wrong both ways:
   - pasted beside the existing object, the file is two JSON values, which is invalid JSON. Ran
     (`probe/malformed-probe.mjs`): an invalid-JSON file stops pi's gate at the next start (`stopReason` set).
   - pasted over the whole file, it drops `objective` and any `gate` or `postEdit` block. AGENTS.md's Config text says a
     missing block means defaults, "which discards that scope's custom denies".
   - N4 and the acceptance step hold only because they use a temporary agent dir with no other key.
   - Fix: the README and D1 must say "add or replace the `roster` member inside the existing object". The alternative is a
     `--json` form that prints the whole file with the roster merged in.

## SHOULD (WRONG or imprecise, does not change the design)

1. §2: `feat/regroup` is at **b95b117** now, not 22e0140, which is 3 commits back. The row set is the same at both
   (R-1170 to R-1180, R-1184, R-1187; Ran).
2. §1: `cc-strings.txt:174964` is the hook-output schema line ("`hookSpecificOutput` - Event-specific output (must include
   `hookEventName`)"), not one of the two warnings. The warnings are at `:212115-212116` only. Ran `strings` on the
   installed 2.1.299 binary today: both warnings are present.
3. §3.6: `types.d.ts:217` is `mode`. `hasUI` is at `:219`, and its comment "(true in TUI and RPC modes)" is at `:218`.
4. §3.6: pack README `:152` is `scratch=$(mktemp -d)`. The documented `pi-review … -p` launch is at `:153`.
5. §3.8's count-comment list misses `packages/nana-setup/lib/steps.mjs:522` ("all five on win32", R-1056's count). The comment
   at `win32-degrade.test.mjs:94` ("the other four") is history and can stay.
6. §5.2 `settings-merge.test.mjs:799`: only `migrated.length` changes (5 to 6). Read: migration runs at `steps.mjs:521` before
   `mergeHooks` at `:527`, and `mergeHooks` pushes at `settings.mjs:532`, so the new entry lands at index 5. The check's
   `migrated[4]` still reads the foreign `after` entry. The phrase "its last-index read" invites an edit that would break it.
7. §5.2: the Row cell for `code-map.test.mjs:39` reads "—". Its marker is `G-004 G-009 G-010`.
8. §3.5: `hook-producer.mjs:15-21` does hold the two fail-open markers. But it is not a precedent for "the constant lives in
   the hook" or "holds no path". Those markers live in a lib that both hooks import statically (`nana-objective.mjs:11`,
   `nana-adoption.mjs:11`). The objective marker also embeds the absolute CLI path (`${cli}`, `:15`).
9. §3.5 says "It reads no cwd", but `piAgentDir()` resolves a relative `PI_CODING_AGENT_DIR` with `path.resolve`, so against
   `process.cwd()` (`agent-dir.mjs:67-76`).
   - The hook runs in Claude Code's project folder and the extension runs in pi's cwd. A relative value can then name two
     different files in the two seats, which breaks R-1211's parity.
   - The threat model lists inside and outside the home folder, but not a relative value.
10. §3.4: importing `tildeify` from `packages/nana-setup/lib/paths.mjs` would be the first nana-pack → nana-setup import. Read:
    today only setup → pack and knowledge → pack edges exist. The code map allows it (one `packages` layer).
11. §3.5 reuses `readHookInput`. Its module's @purpose names "the shared-memory SessionStart hook" only
    (`shared-memory-input.mjs:3`), so a second consumer makes that header stale.
12. §3.8 lists "Root README (`:11`, `:166`, packages bullet)", but `:11` is the packages bullet. There are two places, not three.
13. EARS form: every new row has exactly one `shall` (Ran). But R-1211 is not EARS-led ("For one roster file, …"). The
    ubiquitous form starts "The roster notice hook and the roster notice extension shall …". R-1206 and R-1210 put their
    trigger after "exactly when"; R-163 uses the WHEN form ("WHEN a session starts with a UI, …").
14. The evidence files the plan names hold the owner's name or account name and provider names:
    - `research-alter.md`, `research-startup.md`, `../factcheck-repo.md` and `design-critique.md` hold the owner's name;
    - `probe/doctor.txt` and `probe-shapes.mjs` hold the account name;
    - `probe/models.txt`, `research-roster.md` and `research-alter.md` hold provider names.

    Only CHANGE.md is claimed clean. Keep the evidence out of the public corpus or scrub it first.
15. Line drift once `feat/regroup` lands (Read: its diff). `templates-render.test.mjs` shifts by +2 after `:186` and by +49
    after `:471`:
    - `:274` becomes `:276`, `:342` becomes `:344` and `:407` becomes `:409`;
    - `:551`/`:573`/`:580` become `:602`/`:624`/`:631`;
    - `:739`/`:749`/`:756` become `:790`/`:800`/`:807`.

    Elsewhere, root `README.md:166` becomes `:167` and the tree total is 1,152. `requirements-trace.ts:16-21` does not move.
16. Small line slips: `assertOnlyHookFails` is at `:576-583`, not `:575-582`. At `install.test.mjs:331` the loop starts; its
    check line is `:333`.
17. §1 and §5.4 cite "saved docs `hooks.md`". The file is `scratchpad/hooks.md`, saved 2026-10-12 from code.claude.com, not
    beside the plan. Name its place and date in the evidence line.
18. Seat revision 3, item 5, cites draft-2 row IDs ("R-1192 into R-1194 and R-1195" and others). R-1192 now means the `--json`
    row. Mark those IDs as draft-2 IDs.
19. Context for D2 (VERIFIED as written). The desk client posts the whole config back (`apps/desk/public/app.js:2185`, `...n`).
    The server refuses any top-level key outside gate, postEdit, notify, journal, handoff and receipts
    (`server.mjs:1385`, `:2358-2359`). That list leaves out `objective`, which the installer seeds. So the desk's nana-pack save
    is already refused on a seeded machine, before any `roster`. This is outside the lane; it is a residual worth one line.

Optional: earlier lanes that renamed titles kept `docs/reviews/<lane>/test-title-map.json`, which `win32-degrade.test.mjs:95`
points at. This lane renames seven titles (settings-merge `:35`, `:117`, `:138`, `:278`, `:392`; install-check `:523`;
readme-check `:75`). No code enforces the map.

## UNVERIFIABLE

- Whether SessionStart fires for a Claude Code subagent. `hooks.md` documents SubagentStart separately (`:51`) and says
  nothing either way.
- How `systemMessage` looks in either terminal UI, and whether pi's own status line replaces the info notice after an in-TUI
  resume or fork (`interactive-mode.js:3060-3078`, `:1491`, `:4547`, `:4738` read; the look is not observed).
- That the Agent tool's four model names hold in versions other than 2.1.299.
- That the Windows machine holds a roster file. Memory records both seats on one Windows machine (VERIFIED, Read); nothing
  records a roster file there.
- That a top-level `additionalContext` is dropped. The plan already marks this INFERRED from strings.
- The owner's 2026-10-16 no-sweep decision. It is not in memory or the repo; the plan states it as this session's decision.
  "larger or riskier" is the seat's memory wording and is not presented as a quote.

## Recounts (all VERIFIED)

- Rows: 22 added (R-1190 to R-1211, one table line each, no gap), 12 reworded (R-1120, R-1121, R-1122, R-1123, R-961,
  R-1124, R-301, R-1051, R-1063, R-1055, R-1056, R-658), 1 evidence-only (R-1075). Ran a count: every added row has exactly
  one `shall` outside code spans; R-1121, R-1122 and R-1123 as reworded have one each.
- IDs: main's highest is R-1183. R-1185 and R-1186 occur only in mutation scripts and their outputs. R-1190 to R-1219 occur
  nowhere on any local or remote branch or in either worktree (Ran, including the regroup worktree's uncommitted file).
- Placement (Ran `fc3/placement.mjs`, main and regroup agree): FEAT-006 holds R-960, R-961, R-1120 to R-1125 and R-1110;
  SUB-012 holds R-301, R-985 and R-1128; SUB-013 holds R-316 and R-1061; SUB-015 holds R-1050, R-1051, R-1053, R-1058 and
  R-1063; SUB-019 holds R-859 and R-1126 to R-1142; FEAT-015, FEAT-017, FEAT-018, FEAT-021, FEAT-028 and FEAT-032 hold every
  other cited row. The header's feature list covers every row the census touches. FEAT-006, FEAT-023 and FEAT-015 have no
  SUB children, so all 22 new rows are leaves: +22 holds.
- New titles: L1-L15 (15) + H1-H3 (3) + I1 (1) + N1-N5 (5) + W1-W5 (5) + T1 (1) + X1-X2 (2) = 32, plus 4 loop instances. None
  exists on main (Ran: no file or name exists yet).
- Wrong-code pairs: 60 rows, numbered 1 to 60 with no gap (Ran). 18 + 5 + 8 + 8 + 17 + 4 = 60. Every new check except X1 and X2
  has at least one pair. Loop instances: `install.test.mjs:99` and `win32-degrade.test.mjs:61` (pair 35), `:69` (pair 33),
  `hooks-win32-exec.test.mjs:182` (pair 33, Windows leg).
- Lengths (Ran `notice-lengths.mjs`): 144, 208, 205, 169; +78 for the runnable pointer; 283; draft 2's longest 247. These
  are hand-typed strings, not composed by code.

## VERIFIED (cited fact holds)

- **§1.**
  - `hooks.md:726`, `:810`, `:1006`, `:1013`, `:1115` and `:1261-1263` hold what §1 says. SessionStart sources are startup,
    resume, clear, compact and fork (`:308`, `:1190-1194`).
  - `nana-lifecycle.ts:47` sets the `nana-pack ✓` status.
  - The roster is pi-only (`nana-roster.mjs:77-91`; `bin/worker-config.mjs:19-34`).
  - `templates/_shared/working-under-nana-pi.md:30` says only that the models come from the roster.
  - Ran `nana-roster.mjs`: luna is the only builder, `source: default`.
  - The roster section is pack `README.md:214-224`, and a roster replaces every slot (`:218`).
  - No doctor, state, desk or extension code mentions the roster (Ran grep).
  - The 10-13 split, both seats on one Windows machine, and "subagents do not build by default, one exception" are all in
    the seat's memory (Read).
- **§2.**
  - The row texts quoted for R-1120 to R-1124, R-961, R-960, R-301, R-1051, R-1055, R-1056 and R-658 hold.
  - R-1120's evidence cell holds the owner's name (`REQUIREMENTS.md:342`).
  - R-1075's cell cites `dispatch: the three SessionStart entries …`; R-1051's cites `:278`'s title; R-658's cites `:75`'s.
  - No other evidence cell cites a title the census renames (Ran a grep for each renamed title).
  - `requirements-trace.ts:16-21` lists "a `planned` row a marker traces" as a problem, and `planned` is a status.
  - The tree total is 1,139 (`requirements-tree.test.mjs:40`, `:54-55`); the regroup tip says 1,152.
- **Roster and lane mode.**
  - `nana-roster.mjs:34`, `:37-40`, `:57`, `:63`, `:67`, `:71`, `:79`, `:85`, `:90`, `:98`, `:107`, `:110` say what §3.3 and
    §3.4 say.
  - `pi-worker.mjs:22`, `:26`, `:47`, `:72-74`, `:96-97`, `:106` (`-p`), `:132` and `:141` match their roles. No test pins
    `LANE_USAGE` or the `:132` list (only the legacy usage, `worker-lane.test.mjs:49`).
  - `parseWatchdogArgv` ignores unknown own options (`pi-watchdog.mjs:100-119`), so residual 2 holds.
  - `pi-watchdog.mjs:177` ignores stdin and sends stdout to a file. `NANA_ROLE` is set only by pi-worker (`:65`, `:110`) and
    by pi-review, through the watchdog.
  - Ran `fc/shape-larger.mjs`: `roster has an unexpected field largerBuilder`, for both an entry and null.
  - Ran: `--json` today prints the plain lines, so residual 16 holds.
- **Claude Code.**
  - Installed version 2.1.299. The Agent tool's `model` takes exactly `["sonnet","opus","haiku","fable"]` (Ran: `strings` on
    the binary, and `cc-strings.txt:337100`).
  - `--output-format`, `--verbose`, `--no-session-persistence` and `--setting-sources` exist.
  - `apps/bench/lib/catch-judge.mjs:115` passes `--setting-sources ""`.
- **pi 1.0.2.**
  - `types.d.ts:553-559` (reasons), `:80` (notify), `:84` (setStatus) and `:101` (setWidget).
  - `runner.js:813-839` awaits each handler and catches throws.
  - `footer.js:252-261` puts statuses on one cut line.
  - `interactive-mode.js:2270-2280` and `:3060-3078` handle info notices; `rpc-mode.js:87-95` sends notify.
  - Desk `app.js:1469` turns notify into a toast.
  - Root `package.json:22` loads the extensions folder.
- **Setup.**
  - `settings.mjs:171`, `:181`, `:189-228` (`nodeHook` timeout 5) and `:416`; `mergeHooks` at `:520-536`.
  - `steps.mjs:44`; `state-manifest.mjs:58`; `install-check-config.mjs:10-16` and `:33`.
  - `install-check.mjs:246`; `:273` passes empty stdout; `:274-281` are the per-hook branches.
  - The seed holds no `roster` key, and the install runs before the hooks (`install-check.mjs:221` before `:258`), so the
    plan's INFERRED fixture claim is now Read.
  - `tildeify` is at `paths.mjs:101-104` and rewrites a prefix only. Two copies exist (setup, knowledge).
  - `displayText` is at `display.mjs:109`; `piAgentDir` at `agent-dir.mjs:67`; `readHookInput` at `shared-memory-input.mjs:11`.
  - `doctor.mjs:335` iterates HOOKS, and the comments at `:381` and `:383` hold the counts.
  - `AGENTS.md:147` holds the install-check rule; `CLAUDE.md` is a symlink to `AGENTS.md`.
- **Docs.**
  - Pack README `:28` "Seven extensions", `:208` Lane builder, `:214-224` Machine roster.
  - Root README `:11` and `:166`; nana-setup README `:37`, `:45` and `:438` ("five").
  - Desk README `:127-129`.
  - Both package.json descriptions say "seven".
  - `nana-writing.ts:4` ("seventh") and `config-handlers-malformed.test.mjs:4` ("seven").
  - `win32-degrade.test.mjs:68`, `:92`, `:123` and `:229`.
- **D2.** `server.mjs:1385-1395` and `:2354-2359`: whole-file replace, `.bak`, and an unknown key (`roster`) refused. Ran: a
  trailing comma stops the gate.
- **Census (every other §5.2 line).** Read, and each says what the plan claims:
  - settings-merge `:35`, `:45`, `:117`, `:138`, `:142` (R-316), `:276`, `:278` (R-1051), `:280`, `:302` and `:304` (R-1061),
    `:392` (R-1050), `:799` (R-908), `:839`, `:856`;
  - install-check `:45`, `:242`/`:251`, `:289`/`:297` (R-1084), `:321`/`:328`, `:357` (R-1070), `:474`, `:517`, `:523`, `:539`,
    `:551`, `:758`;
  - the 14 single-FAIL checks, with markers R-1076, R-1077 and R-1083; the stub fallback is at `:219`;
  - uninstall `:253`, `:276`, `:288`, `:292`; state-manifest `:56`, `:61` (`Array(17)`), `:65`; restore `:51`, `:119-120`;
  - win32-degrade `:61`, `:69` (no marker), `:103-109`, `:126`, `:132-135`, `:210-238`;
  - hooks-win32-exec `:100` and `:182`; install `:99` (R-301 R-985) and `:331`;
  - config-handlers-malformed `:21`; its UI filter needs the absolute path and "postEdit.commands" (`:117`);
  - templates-render `:274`, `:297`, `:342`, `:372-382`, `:392`, `:398`, `:407`, and the 8 claim-scanner instances;
  - skill-claims `:39`, `:75`, `:78`, `:80` and `skill-claims.mjs:29`;
  - nana-roster `:40` and `:209` red as stated; `:55`, `:66`, `:75`, `:89`, `:103`, `:120`, `:154`, `:167`, `:197` and `:220`
    stay green;
  - `worker-lane.test.mjs:215-218`; `win32-launch.test.mjs:222-232`; readme-check `:75`; requirements-trace `:61`;
    code-map `:39`.
- **Claim scanner (INFERRED claim now Ran).** `fc3/claims-probe.mjs` runs the repo's `claims()` on the planned bullet and a
  sample table row. The bullet yields no claim. The row yields one path claim, `nana-roster-notice.mjs`. The backticked
  extension name yields none, so an exemption for it would print `STALE exemption`.

## Census sweep (what was searched beyond the plan's list)

- Searched for literal hook lists (`nana-shared-memory` across the repo) and for extension lists (`nana-lifecycle`).
  - Searched for the counts "seven" in all files, and "four", "five" and "six" in nana-setup.
  - Searched for directory scans over hooks and extensions, and for pi launches in RPC mode in tests.
  - Searched for evidence cells that cite the renamed titles.
  - Also read: the product-report test (temporary fixtures), `agent-dir-consumers.test.mjs`, `verifier-pipe.test.mjs:154-155`
    (it matches the row by regex), the bench RPC probe (`run.mjs:652` picks the `get_state` line), and the desk e2e files
    (not in the suite, no notify assertions).
- The only new misses are SHOULD 5 (`steps.mjs:522`) and MUST 1 (the two count floors).

## Names, quotes, providers, machines (CHANGE.md only)

- Ran case-insensitive greps for the owner's first and last names, the account and handle, the email domain, the absolute home and
  temporary-folder prefixes, every common provider and routing-service name, and this Mac's hostname and computer name. No hits.
- The seat's list of work-context words also has no hits.
- Every quoted passage is code, a row or doc phrase, or a test title. None is the owner's speech.
- Model ids (`gpt-6-luna`, `gpt-5.6-sol`, `gpt-6-astra`, `sonnet`, `opus`, `haiku`, `fable`) appear. They are not provider
  names, and the same ids are already public in `worker-config.mjs` and the pack README.
- "this Mac" and "the Windows machine" are not machine names.
