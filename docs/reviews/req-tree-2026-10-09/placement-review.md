# Placement review of all 1,009 requirements — 2026-10-10

Jake, 2026-10-10: "Do one review on all 1009 placements." Method: a Claude workflow (a different lineage from astra, who drafted the tree). Twelve reviewers each judged one batch of rows (every row once; coverage checked: 1,009 of 1,009, no duplicates) against all 67 headings and their purposes: keep or move, and which other features the row directly constrains. One skeptic per batch tried to refute every proposed move and share (104 upheld, 26 refuted). A consistency critic then compared batches (0 reversals, 31 additions, 6 owner questions); two more skeptics tried to refute the critic's additions and the seat's one ruling (26 upheld, 6 refuted).

Criteria: a row's HOME is the feature whose purpose it most directly serves (the user-visible capability that breaks if the row is violated), not the module its code lives in; a move needs a concrete reason. A row is SHARED with another feature only when it directly constrains that feature (a change to the row must be reviewed with that feature). G rows stay in FEAT-033 by declared design.

Result: 17 moves, 113 shares over 95 requirements in 30 features, 992 rows kept where astra placed them.

## Moves

| Row | From | To | Why (upheld reason, abridged) |
|---|---|---|---|
| R-377 | SUB-014 | FEAT-015 | Grep shows doctor.mjs line 387 ('this project's shared link' line) as sharedLinkState's only production caller, so a violation makes doctor throw. The row has nothing to do with SUB-014's installation writes or previews. |
| R-399 | FEAT-016 | FEAT-015 | The row's actor is doctor and its failure is a false healthy report. FEAT-015 already holds every other subsystem's doctor check, including R-344 (objective hook Node floor), R-364, R-393 and R-675, so the move follows t |
| R-484 | FEAT-023 | FEAT-022 | The 'shall' clause is that Esc aborts the running turn, implemented by app.js's steering handler (reclaim queue, then abort). Violating it breaks the abort control for a live session, which is FEAT-022. The diff window o |
| R-535 | FEAT-038 | FEAT-035 | Three of the four clauses report spend: separate cache buckets, a spend-based ratio, and unknown money with a labelled lower bound; the last matches FEAT-035's 'report unknown or partially priced spend explicitly' and it |
| R-550 | FEAT-034 | FEAT-035 | The missing export is pi's cost function, and refusing to fall back to the bench's own arithmetic protects FEAT-035's rules that money and totals come from pi's own cost function and are never recomputed; FEAT-034's pin  |
| R-572 | FEAT-034 | FEAT-037 | The grading assets are checker probes that must be absent while the model runs and excluded from its edits; that separates grading from the code under evaluation, which is FEAT-037's purpose, and it matches the shape-rul |
| R-601 | SUB-011 | FEAT-031 | The locator is packages/nana-pack/tests/pi-install.mjs, whose @purpose is resolving pi for pack tests. Only test files import it, and the ID block assigns R-601 to the test runner. No installation behaviour depends on it |
| R-657 | FEAT-029 | FEAT-032 | This is a skill-documentation correctness rule, the same contract as FEAT-032's R-599 (runner spelling, no literal -- after a pnpm script). It is pinned in readme-check.test.mjs next to FEAT-032's R-655, R-656 and R-658. |
| R-680 | SUB-012 | FEAT-032 | The row is a documentation-accuracy check: shared instructions must list every discovered hook and extension. It matches FEAT-032 siblings R-658 and R-598. It concerns nothing the installer delivers, so SUB-012 is plainl |
| R-683 | FEAT-006 | SUB-019 | The row pins generic content of the shared working pattern: worktree, branch, review corpus, review cap, lineage, land checklist and override points. None of it constrains how a builder is launched, so FEAT-006 is plainl |
| R-689 | FEAT-031 | FEAT-022 | The test pins the records the desk consumes when it steers live children. These are the extension_ui_request dialog and setStatus records that feed the per-child dialog and status maps, the extension_ui_response answer,  |
| R-699 | FEAT-023 | FEAT-038 | FEAT-023 is about showing changes and notifying the developer, and the usage line never reaches the developer. The desk README contract note says the line exists only to inform the D4 retain/freeze/retire ruling and stat |
| R-814 | FEAT-022 | FEAT-023 | The row guards the five handlers named in R-162 (session_start through session_shutdown). If they disappear, journaling, compaction notices and the status chip (R-159..R-163, all FEAT-023) break, while reload itself stil |
| R-948 | FEAT-027 | FEAT-031 | The shall clause is about the test fixture's own ports. The cited test only checks the fixture's port-zero manifests and distinct bound ports. The parenthetical is a note that production stays unchanged, and it is not pi |
| R-949 | FEAT-026 | FEAT-031 | If this is violated, only concurrent stage-key test runs collide on ports; no signing or provenance behaviour changes. FEAT-031 explicitly covers test isolation and already holds the same kind of desk-test isolation row  |
| R-993 | FEAT-031 | FEAT-030 | The checker's only caller is the post-edit config, with a match on .ts files, and the README says so; nothing in the suite runner invokes it. A wrong exit or diagnostic gives false post-edit feedback, which is FEAT-030's |
| R-994 | FEAT-031 | FEAT-030 | The checker runs only after .ts edits, so evaluating module code would execute the edited file's side effects inside the post-edit check. It would also report runtime errors as syntax verdicts. That breaks trustworthy fe |

## Shares (requirement → features it also applies to)

| Row | Home | Also applies to | Why (abridged, first reason) |
|---|---|---|---|
| R-004 | FEAT-001 | FEAT-013 | The installer hard-codes its own copy of this default (piObjective = <piHome>/nana-objective.md in nana-setup's paths module). Its seed rows R-309 and R-191 tar |
| R-021 | FEAT-009 | FEAT-001 | The label is emitted inside the objective's injected block, in lib/objective.ts, and it counts against the objective's OUTPUT_CAP and byte-identity contracts (R |
| R-022 | FEAT-009 | FEAT-001 | This row limits which file governs and the order of the governing lines, which is FEAT-001's precedence behaviour (R-001, R-003, R-009). Relaxing it, for exampl |
| R-033 | FEAT-009 | FEAT-010 | The row is about the gate: it decides which trust-store path the gate protects, including under a tilde-spelled override. A change to it directly changes gate p |
| R-069 | FEAT-011 | FEAT-009 | R-069 carries the trust floor onto the malformed-config path: an auto-trusted (undecided) project does not count. If the row changed, an untrusted repo's plante |
| R-074 | FEAT-009 | FEAT-011 | This trust condition decides whether project-scope nana-pack.json takes part in loading and precedence at all. FEAT-011's own rows depend on it: R-067, R-069 an |
| R-078 | FEAT-009 | FEAT-011 | The cached decidedByCwd lives in lib/config.ts's globalThis state, and isNanaTrusted gates whether project nana-pack.json is loaded. Once-per-session resolution |
| R-079 | FEAT-009 | FEAT-002, FEAT-010, FEAT-030 | The custom handoff.path is resolved and used for reads and writes under FEAT-002's custom-location group (R-130, R-134, R-142). Whether an untrusted project can |
| R-081 | FEAT-011 | FEAT-010 | Not refuted. The tests assert that effective gate.allowPatterns stays within the valid list, and that a malformed gate block causes a conservative stop. Both ar |
| R-122 | FEAT-002 | FEAT-001 | FEAT-001's stated purpose is to 'preserve its precedence over background context'. No FEAT-001 row enforces that against the compaction summary. R-122's clause  |
| R-137 | FEAT-002 | FEAT-006, FEAT-007 | pi-worker runs builders through the same runWatchdog (R-732), which injects NANA_HANDOFF=off. CLAUDE.md's runtime table declares worker children 'Disabled by NA |
| R-139 | FEAT-007 | FEAT-002 | The role exclusion in SUB-002 (R-137: no pickup or write when NANA_HANDOFF=off, nana-handoff.ts:329/465) works only if the launcher sets the marker. This row is |
| R-183 | FEAT-012 | FEAT-010 | The five-line dialog is the guard's own approval surface. A user choosing Allow once relies on seeing the true subject with no forged heading. FEAT-010's purpos |
| R-184 | FEAT-012 | FEAT-010 | The pinned tests assert the Block, Allow-once and headless fail-closed decisions are unchanged, which is the guard's core behaviour. Any change letting renderin |
| R-185 | FEAT-012 | FEAT-002 | The only header-bearing file the pack writes is the handoff summary (nana-handoff.ts:498: Cwd:, Written:, Writer:). A forged Cwd: field would subvert R-114's di |
| R-186 | FEAT-012 | FEAT-030 | The model-visible failure block is how post-edit communicates check failures, part of FEAT-030's purpose. Its sibling formatting row R-087 already lives in FEAT |
| R-188 | FEAT-012 | FEAT-011 | configNotice and gateStopReason are produced in lib/config.ts. They are the R-082 warning and the R-064 repair reason that FEAT-011 emits when configuration bre |
| R-190 | FEAT-013 | FEAT-009, FEAT-010, FEAT-011 | Direct, and backed by the row's own evidence. Its objective-golden test 'T12 relative override' is a trust-record case tagged R-029 and R-190: it checks that tr |
| R-191 | FEAT-013 | FEAT-001 | R-191's objective clause decides the default governing objective file. FEAT-001's R-004 depends on that same location, and the installer's seed (tested here) mu |
| R-193 | FEAT-011 | FEAT-015 | Doctor prints 'exists but is NOT read' for the stranded default-dir nana-pack.json (doctor.mjs:408), which restates R-193 word for word. If R-193 changed to all |
| R-195 | FEAT-010 | FEAT-011 | The clause 'enforcing the target's policy' is loader behaviour: the agent-dir-hostile A tests check that the symlink target's extraPatterns are loaded and enfor |
| R-199 | FEAT-013 | FEAT-016 | FEAT-016 holds R-404 (the desk resolves the active agent dir once and hands it to every child), and apps/desk/server.mjs imports piAgentDir for its sessions and |
| R-224 | FEAT-004 | FEAT-012 | Verified: nana-knowledge/lib/query.ts and hook.ts import promptPath and promptText from nana-pack/lib/display.mjs. R-224 exists to bind the pull to FEAT-012's s |
| R-256 | FEAT-026 | FEAT-025 | Verified in packages/nana-stage/lib/blocks.mjs:361-374: the canonical text rendering (R-260, FEAT-025) keeps only blocks where show is true, so changing the sho |
| R-283 | FEAT-025 | FEAT-026 | On tool_execution_end, server.mjs verifies only result.details.blocks and passes the rest through, so keeping structuredContent out of the event is what stops a |
| R-284 | FEAT-025 | FEAT-026 | This is the same live-provenance dependency on the rejection path. Without the omission, the malformed raw carrier would ride the live event past the desk's det |
| R-285 | FEAT-006 | FEAT-004 | The row is literally knowledge-hook behaviour: it decides when the hook prints pointers and when it writes the pull log. FEAT-004's retrieval behaviour is direc |
| R-286 | FEAT-006 | FEAT-004 | A grep found exactly one NANA_ROLE consumer: nana-knowledge/lib/hook.ts:160 (`=== "worker"`). Renaming or dropping this value silently breaks the builder knowle |
| R-307 | FEAT-013 | FEAT-015 | Doctor is named as a co-actor, and two cited tests pin doctor's verdict: 'doctor reads ✗ with the same message' and 'doctor exits 1'. That matches the upheld R- |
| R-310 | FEAT-013 | FEAT-003 | The cited test asserts that the installer's knowledgeHome equals the knowledge runtime's default. That is a cross-package path contract tied to FEAT-003's one-d |
| R-345 | FEAT-013 | FEAT-014 | The row names project and project --check, so whether those workspace commands refuse and write nothing under a relative ambient agent dir is set by this row. T |
| R-347 | FEAT-003 | FEAT-015 | Verified: doctor.mjs imports projectMemoryDir and sharedLinkState from project-key.mjs to find the current project's memory directory. Its 'this project's share |
| R-378 | FEAT-013 | FEAT-015, FEAT-018 | doctor.mjs reads isRealHome to grade the pi executable, the PATH entry for pi-review, pi packages and the desk service as FAIL or NOTE. It also uses it to decid |
| R-383 | FEAT-013 | FEAT-014 | The row names the project command, so whether project's --yes stays inert (and cannot short-circuit owner ratification in SUB-021) is set here. A change to it c |
| R-392 | FEAT-013 | FEAT-015 | Install and doctor share packageCoverage, which both use. FEAT-015's R-654 test asserts that doctor names the uncovered nana-pack extensions directory. It runs  |
| R-401 | FEAT-016 | FEAT-020 | The row's object is session parsing. The package binding decides which parser reads history, and FEAT-020's parity rows (R-405, R-407, R-408) depend on that par |
| R-404 | FEAT-016 | FEAT-021 | The row's second half, one absolute agent directory handed to every spawned child, is spawn behaviour. It governs the child's settings, trust store and resource |
| R-426 | FEAT-023 | FEAT-022 | The row's 'without aborting the running turn' clause names FEAT-022's abort control. It holds only because changes.js stops Esc in the capture phase before app. |
| R-458 | FEAT-027 | FEAT-020, FEAT-022, FEAT-023, FEAT-024 | Session-history reads are GETs, and the Origin rule (R-459) covers only state-changing requests. So the Host rule is the only rebinding guard on transcript and  |
| R-459 | FEAT-027 | FEAT-020, FEAT-021, FEAT-022, FEAT-024 | POST /api/rename appends session_info entries to session files (R-410, R-472). POST /api/derive-titles enqueues headless title children (R-411, R-473). Both are |
| R-461 | FEAT-022 | FEAT-027 | The manifest clause directly governs how app manifests load. A non-object manifest is logged and skipped while the other apps' listeners keep serving, so a chan |
| R-484 | FEAT-022 | FEAT-023 | Given the move, the floating diff window's capture-phase Esc handler in changes.js is what must stay scoped to an open window. That makes FEAT-023's diff-window |
| R-578 | FEAT-028 | FEAT-014 | Rendered projects ship a template-owned file holding the shared general requirements, and copier update refreshes it. The update path works only because the rai |
| R-579 | FEAT-028 | FEAT-014 | The split between project-owned Status and Evidence and template-owned cells is what lets a copier update add Part G rows without replacing project fields. The  |
| R-583 | FEAT-028 | FEAT-014 | R-582 (SUB-019) requires an earlier-tag copier update to leave REQUIREMENTS.md unchanged with a clean rail. That update leaves six G cells that differ from the  |
| R-589 | FEAT-013 | FEAT-015 | The row fixes doctor's healthy condition: the link must resolve to this checkout's nana-setup.mjs. Three cited doctor tests pin it: healthy, missing rejected an |
| R-623 | FEAT-007 | FEAT-006 | The row explicitly names pi-worker. It pins how a builder run reaps its process tree on SIGINT/SIGTERM/SIGHUP and which exit codes it returns (130/143/129), so  |
| R-634 | FEAT-011 | FEAT-001, FEAT-002 | lib/objective.ts calls readBounded(file, BOUNDED_READ_CAP, ...). A FIFO or oversized objective file becomes the 'unreadable' marker of R-014, and no FEAT-001 ro |
| R-641 | FEAT-001 | FEAT-002, FEAT-005 | The row names the handoff injector itself. The nana-handoff extension imports the same orderNanaSections composer as the objective and writing injectors. A chan |
| R-650 | FEAT-016 | FEAT-015 | DESK_NODE_FLOOR is defined in packages/nana-setup/lib/doctor.mjs, and doctor's desk verdict reads it at line 617. Retuning the floor directly changes what docto |
| R-663 | FEAT-013 | FEAT-018 | Every cited test is a retired-artifacts migration test, and the ancestor checks gate the moves and unlinks FEAT-018 performs (R-664, R-668, R-669). Changing the |
| R-673 | FEAT-015 | FEAT-014 | Every other project --check row lives in SUB-021: R-336, R-337, R-930, R-989 and R-395. R-336 fixes --check's ✓/✗ lines and exit status. R-673 adds a warning an |
| R-674 | FEAT-015 | FEAT-014 | Two of its three cited tests exercise project --check: the trust warning, and reading trust from its explicit layout without rewriting the environment. So the r |
| R-681 | FEAT-028 | FEAT-014 | Three of the four startup files the test checks are FEAT-014 outputs: the shared working section and both template AGENTS.md.jinja files. So this rule fixes the |
| R-687 | FEAT-013 | FEAT-001, FEAT-014 | The launcher's objective marker in lib/hook-producer.mjs carries the '## Objective and current priority (nana)' block and OBJECTIVE UNAVAILABLE text. This is ho |
| R-700 | FEAT-007 | FEAT-006 | pi-worker imports runWatchdog from pi-watchdog.mjs and advertises --stall-secs. R-732 binds workers to 'the same watchdog'. The CPU-flat process-group kill is t |
| R-702 | FEAT-007 | FEAT-006 | pi-worker imports runWatchdog, and the pack README states a worker succeeds on exit 0 with non-empty output, with no review shape required. If the watchdog gain |
| R-705 | FEAT-007 | FEAT-008 | nana-land.mjs:93-95 rebuilds `git:${realpath(git-common-dir)}` itself instead of importing it from the ledger code, then looks up rounds with that key. A change |
| R-708 | FEAT-007 | FEAT-008 | nana-land.mjs:88-96 accepts only a plain 40-64 hex sha, refuses '+snap:' revisions, and matches round.revision === sha. It depends on a clean tree recording the |
| R-717 | FEAT-007 | FEAT-008 | review-round.mjs records a changed-tree completion as `unverified: true`, and nana-land.mjs:96 accepts only rounds with `unverified !== true`. Weakening this ro |
| R-728 | FEAT-007 | FEAT-006 | pi-worker calls parseWatchdogArgv and prints RETRIES_NOTICE('pi-worker', n) when --retries is explicit (pi-worker.mjs:129). Its failure line counts retries+1 at |
| R-732 | FEAT-006 | FEAT-007 | The row is a role-isolation boundary around FEAT-007's own ledger. Relaxing it so pi-worker writes or reserves in the ledger would change the review tally and c |
| R-740 | FEAT-019 | FEAT-014 | The scaffold and adopt skills in FEAT-014 tell copier to clone at the latest v* tag, so this row fixes which revision a created or adopted project receives. Cha |
| R-756 | FEAT-028 | FEAT-033 | FEAT-033's own note says its G-row cells mirror the shared file under R-756, so any edit to a G row in FEAT-033 is directly constrained by this mirror rule. |
| R-774 | FEAT-011 | FEAT-010 | The built-in denies are FEAT-010's mandatory restrictions, its stated purpose, and R-774's pinned test asserts the guard still blocks a dangerous command. R-039 |
| R-778 | FEAT-009 | FEAT-011 | Not refuted. The rule is implemented in lib/config.ts, in computeDecided and isNanaTrusted. Its only test asserts loadConfig's result: a child's .pi/nana-pack.j |
| R-781 | FEAT-011 | FEAT-001, FEAT-002, FEAT-023, FEAT-030 | nana-objective reads objective.enabled through loadConfig. If a malformed block disabled the objective, the repo invariant that only user-scope enabled:false tu |
| R-810 | FEAT-014 | FEAT-023 | The row's second clause, and its test tagged with both R-810 and R-159, asserts that other journal events such as handoff_missing still follow the configured pr |
| R-819 | FEAT-012 | FEAT-001 | The backstop is finish() in lib/objective.ts, and only the objective producer calls it. It feeds both runtimes' byte-identical output (R-018), so a change to R- |
| R-831 | FEAT-007 | FEAT-006 | pi-worker imports pi-watchdog.mjs, so R-732's guarantee that pi-worker imports no ledger module holds only while the watchdog imports none. R-732's test inspect |
| R-846 | FEAT-007 | FEAT-006 | The rule is enforced in the shared parseWatchdogArgv, which reads its own options only from before the separator. The only existing test of this behaviour launc |
| R-909 | FEAT-018 | FEAT-015 | The row names doctor as a co-actor and requires it to flag every retired bash hook invocation as a problem. That directly constrains doctor's report, consistent |
| R-944 | FEAT-027 | FEAT-021 | The row's own evidence says spawnChild is shared with POST /api/spawn and that the project-path refusal is live only there. The spawn-and-persist tests pin it u |
| R-959 | FEAT-017 | FEAT-015 | Doctor is the subject of this row's shall, and the row fixes doctor's verdict on a restored home: only the trust warning, then a clean exit. Any new doctor chec |
| R-962 | FEAT-006 | FEAT-010 | The guard is implemented in nana-gate.ts as a gate refusal ('lane write boundary'), and it runs after the existing protected-path checks. Changing it changes wh |
| R-964 | FEAT-013 | FEAT-015 | The row requires doctor output to include the pi-worker link's state. Tests pin both the installed and the incorrect-link doctor outcomes. A change to the row c |
| R-969 | FEAT-007 | FEAT-008 | nana-land.mjs:96 requires `round.verdict === "LAND"`, the literal word this row extracts after VERDICT:. Any change to the extraction (case, prefix handling, wh |
| R-973 | FEAT-007 | FEAT-004 | The row is knowledge-hook behaviour: it suppresses pointer output and pull-log writes for reviewer sessions. That is FEAT-004's own retrieval behaviour. |
| R-974 | FEAT-007 | FEAT-004 | The NANA_ROLE=reviewer clause has a single consumer, the knowledge hook (hook.ts:159). Changing that value silently breaks reviewer-session knowledge suppressio |
| R-980 | FEAT-013 | FEAT-015 | The row requires doctor to report nana-land's link state accurately for present and missing links. Its single test asserts doctor's report, so doctor's output i |
| R-985 | FEAT-013 | FEAT-015 | The row makes doctor check the Node Bash PreToolUse hook wiring and skip it on win32. Two cited tests assert doctor outcomes: 'doctor accepts the installed Node |
| R-992 | FEAT-007 | FEAT-008 | nana-land.mjs:15 imports readRounds as its default readLedger and reads the revision, verdict and unverified fields from it. The reader's signature, filtering a |
| G-004 | FEAT-033 | FEAT-029 | The map generator FEAT-029 maintains parses and validates the header against a fixed tag list declared 'in the order G-004 fixes them in', so a change to the he |
| G-007 | FEAT-033 | FEAT-029 | The generator's @purpose cites G-007, and layerProblem and isLayerExempt implement the declared direction and the test-root exemption. The rendered map also pri |
| G-008 | FEAT-033 | FEAT-029 | The generator's tagProblem rejects a multi-sentence @purpose with the message 'G-008: one purpose, one sentence'. Header validation in map:check therefore attri |
| G-009 | FEAT-033 | FEAT-029 | This row defines the generated module map that is FEAT-029's core purpose, and FEAT-029's heading already lists it under 'See also'; G rows cannot move, so shar |
| G-010 | FEAT-033 | FEAT-029 | The map-currency failure conditions are what the generator's check mode enforces, and FEAT-029's note says G-009, G-010 and G-011 cover its generator, so changi |
| G-011 | FEAT-033 | FEAT-029 | The one-command blast radius is the generator's impact walk, which its code cites as G-011; that is FEAT-029's impact-investigation behaviour. |
| G-012 | FEAT-033 | FEAT-032 | Confirmed: the README checker that FEAT-032 runs reports a missing first paragraph and missing install, run and test headings, so changing the required README c |
| G-013 | FEAT-033 | FEAT-028 | The trace rail in FEAT-028 counts off-form rows using this one-shall form, and FEAT-028's allowance seal depends on that count; FEAT-028 already lists this row  |
| G-014 | FEAT-033 | FEAT-028 | This row sets the trace rail's own output line, so a change to it changes the behaviour of FEAT-028's checker. |
| G-015 | FEAT-033 | FEAT-028 | This row sets when the trace rail fails against the declared allowance, which FEAT-028's allowance-seal row also depends on. |
| G-019 | FEAT-033 | FEAT-029 | The failing check this row requires is the generator's 'against the layer direction' and 'SKIPPING a layer' problems, which make --check exit non-zero. Changing |
| G-021 | FEAT-033 | FEAT-032 | FEAT-032's README checker exists to verify that every command, path, flag and script a README names exists, so this row sets the scope of that check. |
| G-022 | FEAT-033 | FEAT-032 | Failing the suite on a stale README claim is the README checker's pass/fail behaviour in FEAT-032, and FEAT-032 already lists this row under 'See also'. |

## Refuted (not applied)

| Row | Kind | Target | Why refuted (abridged) |
|---|---|---|---|
| R-006 | share | FEAT-011 | Refuted. The rule is implemented inside FEAT-011's loadConfig merge, but it only decides which scope supplies the objective keys. No FEAT-011 behaviour depends on it: gate precedence, bounded reading, |
| R-032 | share | FEAT-001 | Refuted. 'Only evidence' is false: the row cites four tests, three of them trust-store and label checks (T12 store override, T2c labelled). FEAT-001 depends on R-018, its own byte-identical row and te |
| R-159 | share | FEAT-014 | Refuted on the facts. The adoption producer and reader find their journal through lib/adoption.mjs adoptionSettings(), under FEAT-014's own rows R-148 and R-810. They do not use the lib/config.ts jour |
| R-159 | share | FEAT-017 | The state manifest classes the journal as disposable (disp(), with a hardcoded base/.pi/agent path), so the state export and restore never archive it. 'Export misses the file' is false. Listing a path |
| R-160 | share | FEAT-014 | Adoption deliberately does not follow the generic journal.path override. R-810 bars a project-scope or relative path from capturing directory_unadopted, and R-148 sets adoption's own user-scope rule.  |
| R-190 | share | FEAT-001 | Refuted. The cited evidence is wrong: 'T12 relative override' in objective-golden tests the trust store (trustRecord), not the objective. The upheld R-191 share already links FEAT-001 to the agent-dir |
| R-192 | share | FEAT-017 | The manifest takes ledger paths from the imported ledgerPaths() function (state-manifest.mjs:44), and FEAT-017's own R-955 already pins that parity, so a location change flows through without the mani |
| R-198 | share | FEAT-016 | The reason is factually off: R-198 does not change which home the desk itself binds. It governs what spawned children receive in their environment, plus the settings-route notice, as the tests show. B |
| R-200 | share | FEAT-017 | The state manifest lists each knowledge file by its own path (sources.json, pull.log, index.db, shown, build.lock), and the restore test shows unknown files in that directory are deliberately left out |
| R-343 | share | FEAT-001 | Doctor follows the rule the objective code uses (isBareFileName). Changing R-343 changes only doctor's output, never how objective injection accepts objective.projectFile, so FEAT-001 does not depend  |
| R-344 | share | FEAT-013 | The premise is factually wrong. The fresh-machine checklist test in fresh-machine.test.mjs checks Node against DESK_NODE_FLOOR, the desk floor of 22.19 under R-650. It never checks NODE_FLOOR, the obj |
| R-414 | share | FEAT-009 | FEAT-009's rows (the untrusted-data label, honouring nana-pack project config only on a recorded decision, the nana-setup trust command) read pi's recorded trust store, not the desk's spawn flags. The |
| R-415 | share | FEAT-009 | Classifying resources by real path is the desk spawn picker's resource policy, which the desk README calls 'a resource policy, not a sandbox'. No FEAT-009 behaviour consumes this classification, so ch |
| R-442 | share | FEAT-027 | The premise is false. apps.mjs gives app listeners no RPC passthrough and no session-changing route (only session spawn, prompt, abort, entries, data and dialog). The 429 queue is reached only through |
| R-448 | share | FEAT-009 | FEAT-009 is about pi's recorded trust decision. R-074 already refuses trust from a per-run -a flag that has no recorded decision, so a request-supplied trust flag could not bypass FEAT-009. The per-sp |
| R-457 | share | FEAT-011 | The dependency runs the other way. The desk writer mirrors the loader's key set, so loader changes affect FEAT-024, but changing this row does not change how FEAT-011 loads, refreshes or falls back on |
| R-476 | share | FEAT-009 | Refusing a project path at spawn when trust is declined is desk-side enforcement inside FEAT-021. It is not the pack's trust floor, which in the pack README is the gate's protection of trust and polic |
| R-644 | share | FEAT-010 | Refuted on direction. R-644 constrains post-edit (FEAT-030) to import the gate's resolver. FEAT-010's gate works the same whichever resolver post-edit uses, so a change to R-644 needs no FEAT-010 revi |
| R-673 | move | SUB-021 | The reviewer's claim that every other project --check row lives in SUB-021 is false. R-674, its paired row for project --check and doctor config warnings, lives in FEAT-015, and R-345, which covers th |
| R-680 | share | FEAT-014 | Adoption and rendering copy the shared section verbatim (R-859, R-986), whatever the matrix says. Changing the matrix contract changes content, not FEAT-014's behaviour. This is a related link, not a  |
| R-686 | move | FEAT-031 | FEAT-031 holds only the local test runner's rows and no CI workflow rows. The CI rows R-597 and R-996 stay in FEAT-019, and R-996 is the same kind of CI suite environment control but was not proposed  |
| R-737 | share | FEAT-033 | The reviewer's reason runs the wrong way. It says changes to Part G must be reviewed with this rendering row, but the share test asks whether FEAT-033 depends on R-737. It does not. FEAT-033's note sa |
| R-751 | share | FEAT-001 | The cross-feature composition contract already exists as R-641, which lives in FEAT-001. R-641 requires canonical objective, handoff, writing section order through the shared orderNanaSections helper, |
| R-781 | share | FEAT-005 | Refuted on the facts. nana-writing calls loadConfig only at session_start, and only when the rule file is unavailable, solely to route the writing_rule_unavailable journal line. The guidance block is  |
| R-811 | share | FEAT-001 | The dependency runs one way only. R-811 makes the adoption predicate follow the projectFileName() result from the objective code. Objective injection does not change if R-811 is relaxed or rewritten,  |
| R-829 | share | FEAT-015 | Refuted as redundant and dilutive. Doctor's note claims the whole file is not read, which is R-193's clause, and that share is upheld. R-829 is the narrower gate-only consequence and cannot fail while |
| R-865 | share | FEAT-030 | Refuted as redundant. Post-edit's dependency is already owned by R-866 in FEAT-030 ('feedback and status independently of receipt configuration'), pinned by the same test. The reviewer cites the R-866 |
| R-944 | share | FEAT-009 | The project-path refusal under declined trust is the desk spawn's per-run resource policy (R-476, homed in FEAT-021), not FEAT-009's recorded-trust label or config rules. No FEAT-009 behaviour reads t |
| R-945 | move | FEAT-031 | Refuted. This is not a suite-level isolation or liveness control. It is one test's scenario parameter for observing FEAT-026's mid-fork ledger-read overlap, and the cited check asserts that inheritanc |
| R-966 | share | FEAT-014 | This is a documentation-content row. The dependency runs the other way: the text describes the marker boundary that R-986/R-988 enforce. Adoption copies the marker region byte-for-byte whatever it say |
| R-976 | share | FEAT-007 | The dependency runs the other way. The land helper reads the revision, verdict and unverified fields through readRounds. Those fields are already fixed by review rows R-992, R-969, R-708 and R-838. A  |
| G-020 | share | FEAT-029 | Refuted. The dependency runs the other way: G-020 relies on the generator's one-sentence check, and the generator does not depend on G-020. The generator enforces one sentence, not splitting, and the  |

## Critic questions and the seat's rulings

- **R-139** — No row or behaviour test says pi-worker children get NANA_HANDOFF=off; it is set by pi-watchdog for every child and is only documented in the runtime matrix. The upheld R-137 -> FEAT-006 share rests on that unrowed behaviour. Should R-139 be widened to 'the watchdog shall set NANA_HANDOFF=off in every child env' and shared with FEAT-006, or should a worker twin row be added?
  - Seat ruling: Out of scope (a row text change). Recorded as a follow-up: the pi-watchdog NANA_HANDOFF=off behaviour for every child has no row; R-137 shares FEAT-006 on that unrowed behaviour.
- **R-078** — Trust is resolved once per session and shared across module copies, so this row decides when a /trust decision reaches FEAT-011's loaded project config, and it can change while R-074 holds. Should it share FEAT-011 like R-778, or does R-074 suffice?
  - Seat ruling: Share FEAT-011 (verified by a skeptic: upheld).
- **R-187** — Its siblings R-185, R-186 and R-188 share their surface owners. R-187 (one-line notifications and statuses) is pinned on the handoff custom-path notice and the post-edit status chip. Should it share FEAT-002 and FEAT-030, or stay FEAT-012-only because those surfaces are UI-only and lower stakes?
  - Seat ruling: No share: the surfaces are display-only, below the high-blast-radius bar.
- **R-689** — The move to FEAT-022 was upheld on the grounds that the records are used while steering. Would FEAT-016 fit better, as pi-version compatibility next to R-402's startup export check?
  - Seat ruling: Keep the upheld move to FEAT-022 (the records the desk consumes while steering).
- **R-699** — The move to FEAT-038 was upheld. CAP-08 is about evaluating agent choices, and this is desk usage telemetry for the D4 retain/freeze/retire ruling. Is FEAT-038 the intended home, or FEAT-016?
  - Seat ruling: Keep the upheld move to FEAT-038 (evidence for the D4 usage ruling, an experiment reading).
- **R-287** — The ledger intro says 'Every row lives in exactly one feature table', and R-287, R-289 and R-291 check that structure. Sharing needs a requirement diff first: how is a share recorded without a second table row, and should R-291's generated outline list shared rows under each feature that shares them?
  - Seat ruling: Answered by the increment-B design: one home table per row; sharing is a feature-level `Also applies:` line; the outline lists shared rows per feature and in an index.

## Consistency resolutions (critic)

The critic's words, kept as written; where a later skeptic refuted one of its additions, a **Final** line says so. Its summary's "2 moves (R-948 and R-945)" became one move (R-948).

- R-484 was moved to FEAT-022 and shared to FEAT-023, but its split twin R-426 (Esc inside the diff window) had no FEAT-022 share. Resolution: share R-426 -> FEAT-022.
- R-949 (stage-key fixture requests port zero) was moved to FEAT-031, while its twin R-948 (app-listener fixture requests port zero) stayed in FEAT-027. R-945, a test-only budget from the same tranche, stayed in FEAT-026. Resolution: move R-948 and R-945 to FEAT-031. R-946 and R-947 assert product behaviour and stay.
  - **Final:** R-948 moved to FEAT-031; R-945's move was REFUTED by the critic-additions skeptic and R-945 stays in FEAT-026 (see Refuted). The critic's text above is kept as written.
- R-623, R-702 and R-831 share FEAT-006 because pi-worker runs the shared watchdog. R-700 (stall kill), R-728 (--retries meaning) and R-846 (argv split) are the same imported code (runWatchdog, parseWatchdogArgv, RETRIES_NOTICE) but had no share. Resolution: share all three with FEAT-006. R-919 (capture-dir cleanup) is housekeeping and gets no share.
- R-781 says 'every other extension' but was shared only with FEAT-001, FEAT-002 and FEAT-030. nana-writing, nana-notify and nana-lifecycle also call loadConfig. Resolution: add FEAT-005 and FEAT-023. R-083 (no handler throws) is the narrower split parent and stays unshared, following the R-829 no-double-flag precedent.
- R-578 and R-579 share FEAT-014, but their sibling R-583 (drift printed without failing) did not, although the earlier-tag update test pins it. Resolution: share R-583 -> FEAT-014. R-580 is the no-general-file fallback for nana-pi itself and stays unshared.
- G-004, G-009, G-010 and G-011 share FEAT-029. G-007 and G-019 (layer direction) and G-008 and G-020 (one-sentence purpose) are enforced by the same generator, whose header and tagProblem cite G-007 and G-008, but had no share. Resolution: share all four with FEAT-029. G-001..G-003, G-005, G-006, G-016..G-018 have no checker and stay unshared.
- R-909 and R-959 share FEAT-015 because each fixes a doctor verdict. Six install-and-doctor co-actor rows in FEAT-013 (R-307, R-392, R-589, R-964, R-980, R-985) fix doctor verdicts too but had no share. Resolution: share all six with FEAT-015. Likewise R-673 and R-674 (project --check co-actors, homed in FEAT-015) get FEAT-014 shares, consistent with R-345 and R-383.
- R-458 (Host rule) was shared with FEAT-020 and FEAT-024 for its GET reads. The other GET surfaces are the live event stream (FEAT-022) and the changes and file-diff reads (FEAT-023), which serve file contents. R-459 (Origin rule) was shared with FEAT-021, FEAT-022 and FEAT-024 but not with FEAT-020's rename and derive-titles POSTs. Resolution: add R-458 -> FEAT-022 and FEAT-023, and R-459 -> FEAT-020.
- R-074 shares FEAT-011, but its trust-predicate siblings were untreated. R-075, R-242, R-077 and R-779 cannot fail while R-074's necessary condition holds, so under the R-829 precedent they get no share. R-778 is an independent sufficiency rule (an ancestor record grants trust), so it gets a share. R-078 is left as a borderline item.
- R-190 is the single PI_CODING_AGENT_DIR resolver, but it was shared only with FEAT-011, while R-199 (FEAT-016) and R-191 (FEAT-001) were shared for the same path agreement. The trust store, the gate floor and the objective default all resolve through R-190. Resolution: add FEAT-009, FEAT-010 and FEAT-001.
- R-224 -> FEAT-012 was upheld as a shared-module binding. Its analogue R-644 (post-edit must use the gate's path resolver) had no share. Resolution: share R-644 -> FEAT-010.
- R-774 -> FEAT-010 was upheld, but its general parent R-081 ('normalization shall never widen the gate') was never proposed. Resolution: share R-081 -> FEAT-010 and keep R-774, because the null-array path may sit outside normalization, so R-774 can fail while R-081 holds.
- R-021 and R-022 share FEAT-001. R-032's only evidence is FEAT-001's byte-identical hook-vs-pi test, yet it had no share. Resolution: share R-032 -> FEAT-001. R-761 is narrower than R-032 and gets no share.
- The R-976 rejection note named R-838 as a review row that should share FEAT-008, but no R-838 share was proposed. Resolution: no share. Every change to R-838 that keeps R-717 still leaves nana-land refusing the changed-tree round, because it checks unverified and revision, so R-717's upheld share carries the dependency (R-829 precedent).
- R-191 shares FEAT-001 for its objective clause but not FEAT-023 for its journal clause. Resolution: no change. FEAT-023's own R-159 already states the journal default, whereas the objective share exists because the installer seed must land where the producer reads.
- R-680 moved to FEAT-032 while R-683 moved to SUB-019, although both are rows about the shared working section. Resolution: no change. R-680 checks the docs against discovered code (documentation accuracy), and R-683 is content that the templates deliver. R-966 stays in FEAT-006 because it documents lane mode.
