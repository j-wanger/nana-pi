# feature-artifact-lines · verified entry table (lane 3, FEAT-028), read-only at main 0943299b

One agent derived the table (`l3-entry-table-derive.md`, this folder); an independent verifier checked every line read-only against main at 0943299b, applied the seat's two new rulings (built-from tie, prompt and rule sources) and wrote this file. Where this file and the derive differ, this file holds. Line numbers name files at 0943299b. The builder anchors each line by its feature heading, never by line number.

Counts: Table A 33 entries (A-049 to A-081), Table B 100 `Reads:` lines, Table C 37 sweep items left out.

## Rules applied

- **Register** an artifact when it lasts beyond the run that writes it, has one fixed location that fits a class shape, and a later run or a person reads it (A-059 is the one exception, kept as an orphan; see its note).
- **Writer**: lane 1's rule, the tracked file whose own code makes the write. A manual entry names no writer.
- **Run**: only the ledger's run vocabulary (`MAKER_RUNS`): session start, suite, land, review, build, CI, hook, extension, manual.
- **Maker feature**: the feature whose rows state the writing behaviour, or for a hand-edited tracked file, its content.
- **Reader** (seat ruling): tracked, non-test run-time code that opens, parses, lists or stats the artifact to decide something. Install-check reads in its temporary home or review repository count. Tests, docs, inventory lists, location constants, removal-only and execute-only code do not. Where one file opens the artifact and another triggers the read, both are listed.
- **Which feature reads** (seat ruling, attack 1): the feature whose own row states the behaviour the reading code serves. A deliverable row's `built from:` list is such a statement for its home feature, so each entry it names that the home feature does not register gets a `Reads:` line there, citing that row. A feature never lists an entry from its own span.
- **Built-from tie** (R-2798): every `built from:` entry in this ledger is now registered or read in its deliverable's home feature (checked by script over all 15 `built from:` claim lines; see "Built-from pairs"). Direct `A-nnn` references are outside R-2798 (its sixth red case), so 7 direct cross-feature references (R-1400, R-301, R-1150, R-457, R-260, R-256, R-257) need no line.
- Every location was checked against `locationShape` in `scripts/deliverables.mjs`. Every tracked location matches at least one file in `git ls-files` at HEAD. Every reader path is a tracked non-test file. Every cited row is homed in the line's feature, except where a note says otherwise.

## Sweep items lane 1 already covers (no table row)

| Sweep item(s) | Covered by |
|---|---|
| 0 nana journal | A-025 |
| 1 compaction handoff store | A-002 |
| 2 knowledge index | A-004 |
| 8 review round tally | A-007 |
| 10 kept review text store | A-008 |
| 17 build records | A-006 |
| 23 suite run records | A-033 |
| 25 CI suite-record artifact | A-034 |
| 26 runtime map | A-032 |
| 28 land product report | A-045 |
| 36 template release tag | A-021 |
| 38 tree outline | A-031 |
| 42 requirements ledger | A-030 |
| 43 hook links | A-012 |
| 44 rule links and private rule | A-013 (the private rule `nana-personal.md` sits in the same `~/.claude/rules/` folder) |
| 49 user objective file | A-001 |
| 54 desk plist and log | A-016, A-017 |
| 55 win32 copy record | A-019 |
| 57 project frontier seeds | A-014, A-046, A-047 (the monthly log is inside A-047's folder) |
| 58 HANDOFF.md | A-003 |
| 62 trust store | A-010 |
| 64 stage keys | A-028 |
| 66 app manifest pointer | A-029 |
| 78 pi session files | A-023 |

The derive's "Where the sweep is wrong at HEAD" section stands as written (the CI run record store is new as A-059; item 47's maker is FEAT-013; items 51 and 65 split).

## Table A, new entries (33)

| A-ID | maker feature (heading) | exact `Artifact:` line | writer or manual evidence (file:line, rows) | note |
|---|---|---|---|---|
| A-049 | FEAT-001 · Keep goals and priorities in view | `Artifact: A-049 · rulings file · tracked: packages/nana-pack/rules/nana-rulings.md · manual: the seat adds each ruling by hand in the reviewed change of the lane that records it` | Tracked; no code writes it (`git grep`: only readers and constants). R-1415 to R-1418 (FEAT-001) state its content. | The rulings file's own ruling (2026-10-16) gives the reason. `nana-rulings.ts:72` and doctor read it inside FEAT-001's rows (own). |
| A-050 | FEAT-001 · Keep goals and priorities in view | `Artifact: A-050 · pi rulings link · user-home store: <pi agent dir>/nana-rulings.md · manual: the owner runs nana-setup install by hand, which links it, or copies it on Windows` | `steps.mjs:722-726` (linkFile, copy on win32); `paths.mjs:82`. R-1412 (FEAT-001). | The Claude rules copy of the same file is inside A-013. |
| A-051 | FEAT-002 · Resume decisions and next actions | `Artifact: A-051 · known-bug files · tracked: docs/known-bugs/ · manual: the seat writes each known bug by hand as one line in its feature's file` | Tracked folder, 30 files at HEAD; no run-time code writes it (only the one-off seat script `docs/reviews/known-bugs-2026-10-21/move.mjs` did). `KNOWN_BUGS_DIR` at `known-bugs-config.mjs:10`. R-2505, R-2506, R-2508 (FEAT-002 SUB-005). | Goes in the feature span, before SUB-001. |
| A-052 | FEAT-003 · Index and connect existing knowledge sources | `Artifact: A-052 · knowledge sources config · user-home store: ~/.pi/agent/nana-knowledge/sources.json · hook: packages/nana-knowledge/lib/sources.ts` | `sources.ts:179-180` (loadSources seeds a missing file); `paths.ts:22`. R-2370 to R-2376 (FEAT-003) state the build's reading of it. | After the seed the owner edits it by hand. The path ignores `PI_CODING_AGENT_DIR` (`paths.ts:17`), so `~/` is right. Run `hook` matches A-004 (the hook spawns the build that loads it). |
| A-053 | FEAT-003 · Index and connect existing knowledge sources | `Artifact: A-053 · project memory shared links · user-home store: ~/.claude/projects/*/memory/shared · session start: packages/nana-setup/claude/hooks/nana-shared-memory.mjs` | `nana-shared-memory.mjs:69` (mkdir), `:84` (symlinkSync). R-872, R-934 (FEAT-003). | First user-home location with a `*`; the user-home shape accepts it. |
| A-054 | FEAT-004 · Retrieve relevant context with provenance | `Artifact: A-054 · knowledge pull log · user-home store: ~/.pi/agent/nana-knowledge/pull.log · hook: packages/nana-knowledge/lib/hook.ts` | `hook.ts:94-95` (appendFileSync). R-231, R-238 (FEAT-004). | FEAT-004 has no Artifact line yet: goes after its Also applies line. |
| A-055 | FEAT-004 · Retrieve relevant context with provenance | `Artifact: A-055 · knowledge shown sets · user-home store: ~/.pi/agent/nana-knowledge/shown/ · hook: packages/nana-knowledge/lib/hook.ts` | `hook.ts:87-88`. R-229 (FEAT-004). | Lasts 7 days; later pulls and builds read it. |
| A-056 | FEAT-007 · Review a specific revision independently | `Artifact: A-056 · review audit log · user-home store: ~/.pi/agent/review-ledger.jsonl · review: packages/nana-pack/bin/review-round.mjs` | `review-round.mjs:740-742` (rotate, appendAudit), `:766`, `:846`; path `:108`. R-722, R-842 (FEAT-007). | The `.1` rotation is the same store. Fixed at `~/.pi/agent` (`:103-104`). |
| A-057 | FEAT-007 · Review a specific revision independently | `Artifact: A-057 · lane copies of kept review texts · tracked: docs/reviews/*/r?-*-????????.md · manual: the seat runs review-ledger keep by hand with each fix commit and once before the final round, as the land checklist says` | `review-ledger.mjs:70` (name), `:93` (write). R-2573 (FEAT-007). | Glob matches exactly 21 tracked files, all kept-text copies. `KEEP_NAME_HASH_CHARS` is 8 (`review-round.mjs:86`). |
| A-058 | FEAT-007 · Review a specific revision independently | `Artifact: A-058 · review standard · tracked: packages/nana-pack/prompts/review-standard.md · manual: edited by hand in reviewed lanes` | Tracked; no code writes it. R-1105 to R-1107 (FEAT-007). | pi-review and claude-review read it through `review-standard.mjs` (FEAT-007, own). |
| A-059 | FEAT-008 · Integrate and clean up reviewed changes | `Artifact: A-059 · CI run records · clone store: <git common dir>/nana/ci-runs · land: packages/nana-pack/lib/suite-records.mjs` | `suite-records.mjs:91-98` (storeSuiteRecord), called from `land-ci-records.mjs:71` with `CI_STORE_SUBPATH` (`suite-records-config.mjs:23`). R-2751, R-2752 (FEAT-008). | Not in the sweep. No code or person reads it yet; kept as an orphan for lane 4's view. Not a lane 2 age-table key, so R-2793 does not bind it. |
| A-060 | FEAT-013 · Install and connect harness runtimes | `Artifact: A-060 · Claude skill links · user-home store: ~/.claude/skills/ · manual: the owner runs nana-setup install by hand` | `steps.mjs:294-349` (linkSkill), `:439-449` (stepSkills); `paths.mjs:68`. R-302, R-665, R-351, R-739 (FEAT-013). | Windows mirrors the skill folders. |
| A-061 | FEAT-013 · Install and connect harness runtimes | `Artifact: A-061 · Claude settings · user-home store: ~/.claude/settings.json · manual: the owner runs nana-setup install or uninstall by hand, which adds or removes only nana's hook entries; Claude Code and the owner write the rest` | `steps.mjs:557` (writeSettingsAtomic), `:666`; `uninstall.mjs:106`; `paths.mjs:71`. R-316, R-1208 (FEAT-013). | The settings lock is in Table C. |
| A-062 | FEAT-013 · Install and connect harness runtimes | `Artifact: A-062 · shared memory store · user-home store: ~/.claude/nana-memory/shared/ · manual: the owner runs nana-setup install by hand, which seeds a missing index; Claude Code sessions write the memory entries` | `steps.mjs:674-677`; `paths.mjs:70`. R-308 (FEAT-013). | |
| A-063 | FEAT-013 · Install and connect harness runtimes | `Artifact: A-063 · PATH command links · user-home store: ~/.local/bin/ · manual: the owner runs nana-setup install by hand, which links each nana command there, or writes sh and .cmd shims on Windows` | `steps.mjs:808-826` (stepPath); `paths.mjs:103`. R-311, R-589, R-980 (FEAT-013). | The folder also holds files nana does not own. |
| A-064 | FEAT-013 · Install and connect harness runtimes | `Artifact: A-064 · pi settings · user-home store: <pi agent dir>/settings.json · manual: the owner runs nana-setup install by hand, which runs pi install for each nana package and pi writes the entries; the owner edits the rest by hand, and the desk's settings form did while it ran, frozen since 2026-10-10` | `steps.mjs:1134` (spawns `pi install`); desk `apps/desk/server.mjs:2325`; `paths.mjs:79`. R-323, R-2025 (FEAT-013). | pi's own code writes it, as for A-010. |
| A-065 | FEAT-013 · Install and connect harness runtimes | `Artifact: A-065 · pi subagent config · user-home store: <pi agent dir>/extensions/subagent/config.json · manual: the owner runs nana-setup install by hand, which seeds a missing copy and never rewrites it` | `steps.mjs:747-749`; `paths.mjs:86`. R-360 (FEAT-013). | |
| A-066 | FEAT-013 · Install and connect harness runtimes | `Artifact: A-066 · pi agent definitions · user-home store: <pi agent dir>/agents/ · manual: the owner runs nana-setup install by hand, which seeds a missing reviewer.md; the owner edits agents by hand, and the desk's settings form did while it ran, frozen since 2026-10-10` | `steps.mjs:779-781`; `server.mjs:1373`, `:2407`; `paths.mjs:88`. R-363 (FEAT-013). | Folder location, because the desk edits any `agents/*.md`. |
| A-067 | FEAT-014 · Create or adopt a project workspace | `Artifact: A-067 · project working region · other project: <project>/AGENTS.md · manual: someone runs nana-setup project by hand, which writes a stub or refreshes the marker-owned working region; a copier template or the adopt-structure skill also writes it` | `project.mjs:158-248` (refreshWorkingRegion), `:278` (stub); `templates/*/template/AGENTS.md.jinja`. R-329, R-334, R-989 (FEAT-014). | |
| A-068 | FEAT-014 · Create or adopt a project workspace | `Artifact: A-068 · project Claude import · other project: <project>/CLAUDE.md · manual: someone runs nana-setup project by hand, which writes the one-line import beside a new AGENTS.md` | `project.mjs:287`, `:312`. R-329, R-1311 (FEAT-014). | |
| A-069 | FEAT-014 · Create or adopt a project workspace | `Artifact: A-069 · project pack config · other project: <project>/.pi/nana-pack.json · manual: someone seeds it by hand with nana-setup project, a copier template or the adopt-structure skill; the owner edits it by hand` | `project.mjs:326-338`; `templates/*/template/.pi/nana-pack.json.jinja`. R-330, R-592 (FEAT-014). | The frozen desk also wrote it (`server.mjs:2370`). |
| A-070 | FEAT-014 · Create or adopt a project workspace | `Artifact: A-070 · not-a-project marker · other project: <project>/.nana-not-a-project · manual: someone runs nana-setup project --not-a-project by hand at a repository root` | `project.mjs:434` (name), `:445`; flag at `nana-setup.mjs:66`. R-158, R-2764 (FEAT-014). | Name defined twice (`adoption.mjs:33`, `project.mjs:434`). |
| A-071 | FEAT-024 · Edit session and project settings safely | `Artifact: A-071 · pi MCP config · user-home store: <pi agent dir>/mcp.json · manual: the owner edits it by hand; desk frozen since 2026-10-10, whose settings form rewrote its server list while it ran` | `apps/desk/server.mjs:1371`, `:2339`. R-455 (FEAT-024, the desk's config writes). | nana-setup never writes it (`paths.mjs:92-94`). FEAT-024 has no Artifact line yet: goes after its Also applies line. |
| A-072 | FEAT-033 · Adopt explicit engineering standards | `Artifact: A-072 · code map · tracked: docs/code-map.md · manual: a builder runs npm run map by hand after a module change, and the suite fails on a stale copy until someone does` | `templates/typescript/template/scripts/code-map.mjs:837` through `scripts/code-map.mjs:46-47`; `package.json:11`; `code-map.config.json:3`. G-009, G-010 (FEAT-033). | |
| A-073 | FEAT-039 · See the product and its decisions in one report | `Artifact: A-073 · feature assessment store · tracked: docs/product-report/assessments.json · manual: an agent or person writes each feature's assessment by hand from the report's packets` | Tracked; no code writes it. Packets from `product-report.mjs:747`. R-1027 (FEAT-039). | FEAT-039 precedes FEAT-034 in the ledger. |
| A-074 | FEAT-034 · Define reproducible comparisons | `Artifact: A-074 · fixture manifest · tracked: apps/bench/studies/tool-profiles-2026-09-08/FIXTURE.sha256 · manual: someone builds the study's fixture by hand with node apps/bench/lib/fixture.mjs build` | `apps/bench/lib/fixture.mjs:133`. R-534, R-573 (FEAT-034). | `fixture.mjs:66-68` reads it to name drift (own). |
| A-075 | FEAT-037 · Grade behavior with trustworthy checks | `Artifact: A-075 · oracle keys · tracked: apps/bench/studies/tool-profiles-2026-09-08/keys.jsonl · manual: someone starts a paid study with node apps/bench/run.mjs by hand` | `apps/bench/run.mjs:1034`. R-570 (FEAT-037). | `run.mjs:820` reads it on resume (own). |
| A-076 | FEAT-038 · Interpret workflow experiments and their limits | `Artifact: A-076 · catch-ledger judge labels · tracked: apps/bench/studies/catch-ledger-2026-09-28/labels-*.jsonl · manual: someone runs node apps/bench/catch-ledger.mjs label by hand, which calls judge models` | `catch-ledger.mjs:94`, `:102`. R-537, R-2517 (FEAT-038). | Glob matches 3 tracked files. |
| A-077 | FEAT-038 · Interpret workflow experiments and their limits | `Artifact: A-077 · catch-ledger judge matches · tracked: apps/bench/studies/catch-ledger-2026-09-28/matches-*.jsonl · manual: someone runs node apps/bench/catch-ledger.mjs match by hand, which calls judge models` | `catch-ledger.mjs:139`, `:149`. R-2517 (FEAT-038). | Glob matches 2 tracked files. |
| A-078 | FEAT-038 · Interpret workflow experiments and their limits | `Artifact: A-078 · catch-ledger results · tracked: apps/bench/studies/catch-ledger-2026-09-28/results.json · manual: someone runs node apps/bench/catch-ledger.mjs build by hand` | `catch-ledger.mjs:187`, `:242`. R-574, R-576 (FEAT-038). | A person reads it. |
| A-079 | FEAT-006 · Launch builders with execution limits | `Artifact: A-079 · builder preamble · tracked: packages/nana-pack/prompts/builder-preamble.md · manual: edited by hand in reviewed lanes` | Tracked; no code writes it (`git grep`: read only at `pi-worker.mjs:154-155` and `install-check.mjs:564`). R-628, R-1110, R-2582, R-2583, R-2662 (FEAT-006) state its content; R-2510 (FEAT-002) adds one clause. | New (seat ruling on derive doubt 15). pi-worker's read serves R-961 and R-2647, both FEAT-006, so it is an own read, as pi-review's read of A-058 is FEAT-007's own. |
| A-080 | FEAT-006 · Launch builders with execution limits | `Artifact: A-080 · seat rule · tracked: packages/nana-setup/claude/rules/nana-seat.md · manual: edited by hand in reviewed lanes` | Tracked; no code writes it. R-1140, R-1141 (FEAT-006) state its content. | New. Installed as a Claude rule (`steps.mjs:65`, CLAUDE_RULES), so the installed copy is inside A-013. |
| A-081 | FEAT-013 · Install and connect harness runtimes | `Artifact: A-081 · soul rule · tracked: packages/nana-setup/claude/rules/nana-soul.md · manual: edited by hand in reviewed lanes` | Tracked; no code writes it. R-1128 (FEAT-013 SUB-012, "Deliver commands, hooks and workflow resources") states it as the Claude Code seat's copy of the working pattern; R-301 (FEAT-013) names it. R-682 (FEAT-002) states one more clause. | New. Home is a judgement (see "For the seat"). With FEAT-013 as maker, install's Windows copy is an own read, so A-081 gets no `Reads:` line. |

## Table B, `Reads:` lines (100)

Within a feature, lines go in A-ID order. Rows marked "built from" are the R-2798 tie.

| feature (heading) | exact `Reads:` line | reader evidence file:line per path | row that states the behaviour | note |
|---|---|---|---|---|
| FEAT-001 · Keep goals and priorities in view | `Reads: A-010 · packages/nana-pack/lib/objective.ts` | `objective.ts:601` (trustRecord for a repo-supplied governing file), `:410-411` (opens the trust store) | R-001 (built from: A-001, A-010, A-014); R-021 states the label | New: built-from tie. R-021 is homed in FEAT-009 and listed in FEAT-001's Also applies. |
| FEAT-001 · Keep goals and priorities in view | `Reads: A-011 · packages/nana-pack/lib/config.ts` | `config.ts:307-310` (readConfigFile), `:611-613` (loadUserObjective) | R-1971, R-020 | |
| FEAT-001 · Keep goals and priorities in view | `Reads: A-014 · packages/nana-pack/lib/objective.ts` | `objective.ts:150-173` (walk up, bounded read) | R-001 (built from) | |
| FEAT-002 · Resume decisions and next actions | `Reads: A-011 · packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-handoff.ts` | `config.ts:491-495`, `:574`; `nana-handoff.ts:322`, `:457` | R-142, R-130 | handoff.path and staleAfterDays. |
| FEAT-002 · Resume decisions and next actions | `Reads: A-030 · scripts/known-bugs.mjs` | `known-bugs.mjs:22-24` | R-2506 | Checks each file name against live features. |
| FEAT-002 · Resume decisions and next actions | `Reads: A-046 · packages/nana-pack/lib/frontier-summary.mjs` | `frontier-summary.mjs:68-71` | R-873 (built from: A-003, A-046), R-2606 | Another project's HANDOFF.md; this repo's copy A-003 is FEAT-002's own. |
| FEAT-002 · Resume decisions and next actions | `Reads: A-069 · packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-handoff.ts` | `config.ts:529-533`, `:574`; `nana-handoff.ts:322` | R-142 | A trusted project's handoff.path. |
| FEAT-003 · Index and connect existing knowledge sources | `Reads: A-055 · packages/nana-knowledge/lib/build.ts` | `build.ts:206-211` (pruneShown) | R-210 | Lists and stats each file's age to choose what to prune. |
| FEAT-003 · Index and connect existing knowledge sources | `Reads: A-062 · packages/nana-setup/claude/hooks/nana-shared-memory.mjs` | `nana-shared-memory.mjs:40-41` | R-935, R-2340 | Prints the shared index. |
| FEAT-004 · Retrieve relevant context with provenance | `Reads: A-004 · packages/nana-knowledge/lib/hook.ts, packages/nana-knowledge/lib/query.ts` | `hook.ts:171-175`; `query.ts:44` | R-217 (built from: A-004), R-230, R-1710 | |
| FEAT-005 · Communicate decisions clearly | `Reads: A-011 · packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-writing.ts` | `config.ts:491-495`; `nana-writing.ts:200`, `:210` | R-2500 | writing.enabled. |
| FEAT-006 · Launch builders with execution limits | `Reads: A-010 · packages/nana-pack/lib/objective.ts, packages/nana-pack/bin/pi-worker.mjs` | `objective.ts:410-411`; `pi-worker.mjs:81-84` | R-965 | The trust notice. |
| FEAT-006 · Launch builders with execution limits | `Reads: A-011 · packages/nana-pack/bin/nana-roster.mjs, packages/nana-pack/bin/pi-worker.mjs` | `nana-roster.mjs:32`, `:133-134`; `pi-worker.mjs:133` | R-1121, R-1124 | The roster. |
| FEAT-006 · Launch builders with execution limits | `Reads: A-023 · packages/nana-pack/lib/build-records.mjs` | `build-records.mjs:44-48`, `:185-188` | R-2598 | Sums Usage from the build's session files. |
| FEAT-006 · Launch builders with execution limits | `Reads: A-051 · packages/nana-pack/lib/brief-precedent.mjs, packages/nana-pack/bin/pi-worker.mjs` | `brief-precedent.mjs:114-117` (stat); `pi-worker.mjs:184` (read into the prompt) | R-2581 | |
| FEAT-006 · Launch builders with execution limits | `Reads: A-061 · packages/nana-pack/bin/pi-worker.mjs` | `pi-worker.mjs:233-239` | R-2655 | |
| FEAT-007 · Review a specific revision independently | `Reads: A-011 · packages/nana-pack/bin/nana-roster.mjs, packages/nana-pack/bin/claude-review.mjs` | `nana-roster.mjs:133-134`; `claude-review.mjs:72` | R-2560, R-2562 | The reviewer slot. |
| FEAT-008 · Integrate and clean up reviewed changes | `Reads: A-007 · packages/nana-pack/bin/review-round.mjs, packages/nana-pack/bin/nana-land.mjs` | `review-round.mjs:515`, `:533-535`; `nana-land.mjs:111`, `:178` | R-976, R-1005 | No A-008 line: R-2571 is homed in FEAT-007. |
| FEAT-008 · Integrate and clean up reviewed changes | `Reads: A-021 · packages/nana-pack/lib/release-status.mjs` | `release-status.mjs:81` | R-588 | Post-merge release status. |
| FEAT-008 · Integrate and clean up reviewed changes | `Reads: A-034 · packages/nana-pack/lib/ci-records.mjs, packages/nana-pack/lib/land-ci-records.mjs` | `ci-records.mjs:120-140`; `land-ci-records.mjs:55` | R-2750 | |
| FEAT-009 · Decide which project content is trusted | `Reads: A-069 · packages/nana-pack/lib/config.ts` | `config.ts:529-533` | R-074 | |
| FEAT-010 · Guard risky commands and protected resources | `Reads: A-011 · packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-gate.ts` | `config.ts:491-495`; `nana-gate.ts:269` | R-1496 | Configured extraPatterns and protectedPaths. |
| FEAT-010 · Guard risky commands and protected resources | `Reads: A-069 · packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-gate.ts` | `config.ts:529-533`; `nana-gate.ts:269` | R-1496 | A trusted project's gate block. |
| FEAT-011 · Keep policy changes safe and recoverable | `Reads: A-011 · packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-gate.ts` | `config.ts:307-310`, `:491-495`; `nana-gate.ts:269` | R-063, R-2360 | |
| FEAT-011 · Keep policy changes safe and recoverable | `Reads: A-069 · packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-gate.ts` | `config.ts:529-533`; `nana-gate.ts:269` | R-067, R-2364 | |
| FEAT-013 · Install and connect harness runtimes | `Reads: A-004 · packages/nana-setup/lib/steps.mjs` | `steps.mjs:787` | R-310 | Stat only: builds the index only when absent. |
| FEAT-013 · Install and connect harness runtimes | `Reads: A-005 · packages/nana-setup/lib/steps.mjs, packages/nana-setup/lib/fsops.mjs` | `steps.mjs:143-144`; `fsops.mjs:64` | R-350 | Windows copies only. |
| FEAT-013 · Install and connect harness runtimes | `Reads: A-036 · packages/nana-setup/lib/steps.mjs, packages/nana-setup/lib/fsops.mjs` | `steps.mjs:309-310`; `fsops.mjs:64` | R-351 | Windows mirror only. |
| FEAT-013 · Install and connect harness runtimes | `Reads: A-037 · packages/nana-setup/lib/steps.mjs, packages/nana-setup/lib/fsops.mjs` | `steps.mjs:143-144`; `fsops.mjs:64` | R-350 | Windows copies only. |
| FEAT-013 · Install and connect harness runtimes | `Reads: A-049 · packages/nana-setup/lib/steps.mjs, packages/nana-setup/lib/fsops.mjs` | `steps.mjs:143-144`; `fsops.mjs:64` | R-350 | Windows copies only. The pi rulings copy at `steps.mjs:722-724` serves R-1412, FEAT-001's own. |
| FEAT-013 · Install and connect harness runtimes | `Reads: A-080 · packages/nana-setup/lib/steps.mjs, packages/nana-setup/lib/fsops.mjs` | `steps.mjs:65` (CLAUDE_RULES), `:143-144`; `fsops.mjs:64` | R-350; R-301 names the file | New. Windows copies only. |
| FEAT-014 · Create or adopt a project workspace | `Reads: A-002 · packages/nana-pack/lib/adoption.mjs, packages/nana-pack/extensions/nana-handoff.ts` | `adoption.mjs:127`; `nana-handoff.ts:377-380` | R-152, R-143 | Stat only: a saved summary counts as adoption. |
| FEAT-014 · Create or adopt a project workspace | `Reads: A-003 · packages/nana-pack/lib/adoption.mjs` | `adoption.mjs:116-119` | R-152 | Stat only. Verified: this repository has no OBJECTIVE.md, so its HANDOFF.md, AGENTS.md and docs/sessions/ decide adoption in its sessions. |
| FEAT-014 · Create or adopt a project workspace | `Reads: A-004 · packages/nana-setup/lib/project.mjs` | `project.mjs:412` | R-331 | Stat only: refresh skipped with no index. |
| FEAT-014 · Create or adopt a project workspace | `Reads: A-011 · packages/nana-pack/lib/adoption.mjs, packages/nana-setup/lib/steps.mjs, packages/nana-setup/lib/project.mjs` | `adoption.mjs:95`; `steps.mjs:731-733`; `project.mjs:330` | R-157, R-150, R-330 | |
| FEAT-014 · Create or adopt a project workspace | `Reads: A-025 · packages/nana-pack/lib/adoption.mjs, packages/nana-pack/bin/nana-adoption.mjs, packages/nana-pack/extensions/nana-handoff.ts` | `adoption.mjs:144-157` (tailLines); `nana-adoption.mjs:39-54`; `nana-handoff.ts:381` | R-146, R-151 | |
| FEAT-014 · Create or adopt a project workspace | `Reads: A-038 · templates/python/template/REQUIREMENTS-general.md.jinja, templates/typescript/template/REQUIREMENTS-general.md.jinja` | both `:1` (`{% include 'templates/_shared/requirements-general.md' %}`) | R-581 | A template copier evaluates, as lane 1 took `ci.yml` as a writer. |
| FEAT-015 · Diagnose the active environment | `Reads: A-001 · packages/nana-setup/lib/doctor.mjs` | `doctor.mjs:494` | R-341 (built from), R-1580 | Stat only. |
| FEAT-015 · Diagnose the active environment | `Reads: A-004 · packages/nana-setup/lib/doctor.mjs` | `doctor.mjs:70-80` (knowledgeIndexState), `:645-647` | R-341 (built from), R-675 | |
| FEAT-015 · Diagnose the active environment | `Reads: A-006 · packages/nana-setup/lib/install-check.mjs` | `install-check.mjs:590` | R-2685 | In the review repository. |
| FEAT-015 · Diagnose the active environment | `Reads: A-007 · packages/nana-setup/lib/install-check.mjs` | `install-check.mjs:474` | R-2074 | In the temporary home. |
| FEAT-015 · Diagnose the active environment | `Reads: A-009 · packages/nana-pack/lib/release-status.mjs, packages/nana-setup/lib/doctor.mjs` | `release-status.mjs:70`; `doctor.mjs:724` | R-341 (built from), R-586 | |
| FEAT-015 · Diagnose the active environment | `Reads: A-010 · packages/nana-pack/lib/objective.ts, packages/nana-setup/lib/doctor.mjs, packages/nana-setup/lib/project.mjs` | `objective.ts:410-411`; `doctor.mjs:500-501`; `project.mjs:534` | R-341 (built from), R-674 | |
| FEAT-015 · Diagnose the active environment | `Reads: A-011 · packages/nana-setup/lib/doctor.mjs, packages/nana-pack/lib/adoption.mjs, packages/nana-setup/lib/steps.mjs, packages/nana-setup/lib/install-check.mjs` | `doctor.mjs:312`, `:483-485`; `adoption.mjs:95`; `steps.mjs:731-733`; `install-check.mjs:383` | R-341 (built from), R-1580, R-1584, R-1582, R-2000 | The install check reads it in the temporary home. |
| FEAT-015 · Diagnose the active environment | `Reads: A-012 · packages/nana-setup/lib/hook-health.mjs, packages/nana-setup/lib/doctor.mjs, packages/nana-setup/bin/stale-copies.mjs` | `hook-health.mjs:16-21`; `doctor.mjs:382`; `bin/stale-copies.mjs:44` | R-341 (built from), R-1760 | |
| FEAT-015 · Diagnose the active environment | `Reads: A-013 · packages/nana-setup/lib/stale-copies.mjs, packages/nana-setup/lib/doctor.mjs, packages/nana-setup/bin/stale-copies.mjs` | `lib/stale-copies.mjs:32-38` (linkOk); `doctor.mjs:383-389`; `bin/stale-copies.mjs:48` | R-341 (built from), R-342, R-1761 | On Windows, linkOk also reads the rule sources' bytes (A-005, A-037, A-049, A-080, A-081). |
| FEAT-015 · Diagnose the active environment | `Reads: A-016 · packages/nana-setup/lib/doctor.mjs` | `doctor.mjs:706-709` | R-341 (built from), R-399 | |
| FEAT-015 · Diagnose the active environment | `Reads: A-021 · packages/nana-pack/lib/release-status.mjs, packages/nana-setup/lib/doctor.mjs` | `release-status.mjs:81`; `doctor.mjs:724` | R-341 (built from), R-586 | |
| FEAT-015 · Diagnose the active environment | `Reads: A-025 · packages/nana-setup/lib/install-check.mjs, packages/nana-pack/lib/adoption.mjs, packages/nana-pack/bin/nana-adoption.mjs` | `install-check.mjs:415`; `adoption.mjs:144-157`; `nana-adoption.mjs:47` | R-1079, R-1584 | The install check reads it in the temporary home. |
| FEAT-015 · Diagnose the active environment | `Reads: A-053 · packages/nana-setup/lib/install-check.mjs` | `install-check.mjs:509` | R-1076 | In the temporary home. doctor also reads the link (`doctor.mjs:461`), but no doctor row names it. |
| FEAT-015 · Diagnose the active environment | `Reads: A-054 · packages/nana-setup/lib/install-check.mjs` | `install-check.mjs:613-616` | R-1096 | In the temporary home. |
| FEAT-015 · Diagnose the active environment | `Reads: A-058 · packages/nana-setup/lib/install-check.mjs` | `install-check.mjs:476` | R-2075 | The checkout's own file. |
| FEAT-015 · Diagnose the active environment | `Reads: A-060 · packages/nana-setup/lib/doctor.mjs, packages/nana-setup/bin/stale-copies.mjs` | `doctor.mjs:86`, `:410`; `bin/stale-copies.mjs:52` | R-666, R-1761 | |
| FEAT-015 · Diagnose the active environment | `Reads: A-061 · packages/nana-setup/lib/doctor.mjs, packages/nana-setup/lib/stale-copies.mjs, packages/nana-setup/bin/stale-copies.mjs, packages/nana-setup/lib/install-check.mjs` | `doctor.mjs:430`; `lib/stale-copies.mjs:49`; `bin/stale-copies.mjs:36`; `install-check.mjs:481`, `:607` | R-1055, R-1760, R-1074 | |
| FEAT-015 · Diagnose the active environment | `Reads: A-062 · packages/nana-setup/lib/doctor.mjs` | `doctor.mjs:194`, `:458`, `:467` | R-990 | |
| FEAT-015 · Diagnose the active environment | `Reads: A-063 · packages/nana-setup/lib/doctor.mjs` | `doctor.mjs:673-674` | R-953 | |
| FEAT-015 · Diagnose the active environment | `Reads: A-064 · packages/nana-setup/lib/doctor.mjs, packages/nana-setup/lib/steps.mjs, packages/nana-setup/lib/install-check.mjs` | `doctor.mjs:258`, `:698`; `steps.mjs:1088` (packageCoverage); `install-check.mjs:554` | R-1810, R-1811, R-2684 | The install check adds the review fixture extension in the temporary home (`install-check-config.mjs:144` ties it to R-2684). |
| FEAT-015 · Diagnose the active environment | `Reads: A-065 · packages/nana-setup/lib/doctor.mjs` | `doctor.mjs:520` | R-362, R-366 | |
| FEAT-015 · Diagnose the active environment | `Reads: A-066 · packages/nana-setup/lib/doctor.mjs` | `doctor.mjs:557` | R-370, R-371 | reviewer.md. |
| FEAT-015 · Diagnose the active environment | `Reads: A-069 · packages/nana-setup/lib/doctor.mjs, packages/nana-setup/lib/project.mjs` | `doctor.mjs:497`; `project.mjs:518` | R-674, R-1583 | doctor's read is stat only. |
| FEAT-015 · Diagnose the active environment | `Reads: A-071 · packages/nana-setup/lib/doctor.mjs` | `doctor.mjs:593` | R-365, R-372 | |
| FEAT-015 · Diagnose the active environment | `Reads: A-079 · packages/nana-setup/lib/install-check.mjs` | `install-check.mjs:564` | R-2684 | New. The checkout's own file, compared with each build run's recorded prompt. |
| FEAT-017 · Inspect durable state and follow restoration steps | `Reads: A-010 · packages/nana-pack/lib/objective.ts, packages/nana-setup/lib/doctor.mjs` | `objective.ts:410-411`; `doctor.mjs:500-501` | R-959 | The same read as FEAT-015's, stated by FEAT-017's own row. |
| FEAT-018 · Update or remove managed components safely | `Reads: A-001 · packages/nana-setup/lib/uninstall.mjs` | `uninstall.mjs:127` | R-903 | Compares the seed's bytes. |
| FEAT-018 · Update or remove managed components safely | `Reads: A-011 · packages/nana-setup/lib/uninstall.mjs` | `uninstall.mjs:127` | R-903 | |
| FEAT-018 · Update or remove managed components safely | `Reads: A-012 · packages/nana-setup/lib/uninstall.mjs, packages/nana-setup/lib/steps.mjs` | `uninstall.mjs:114-118`; `steps.mjs:404-408` | R-902, R-804 | |
| FEAT-018 · Update or remove managed components safely | `Reads: A-013 · packages/nana-setup/lib/uninstall.mjs, packages/nana-setup/lib/fsops.mjs, packages/nana-setup/lib/steps.mjs` | `uninstall.mjs:114-127`; `fsops.mjs:91-96`; `steps.mjs:144` | R-902, R-903, R-2310 | Includes the private rule seed. |
| FEAT-018 · Update or remove managed components safely | `Reads: A-016 · packages/nana-setup/lib/uninstall.mjs` | `uninstall.mjs:78`, `:143` | R-906 | |
| FEAT-018 · Update or remove managed components safely | `Reads: A-050 · packages/nana-setup/lib/uninstall.mjs, packages/nana-setup/lib/fsops.mjs, packages/nana-setup/lib/steps.mjs` | `uninstall.mjs:114-118`; `fsops.mjs:91-96`; `steps.mjs:724` | R-902, R-2310 | |
| FEAT-018 · Update or remove managed components safely | `Reads: A-060 · packages/nana-setup/lib/uninstall.mjs, packages/nana-setup/lib/fsops.mjs, packages/nana-setup/lib/steps.mjs` | `uninstall.mjs:114-118`; `fsops.mjs:91-96`; `steps.mjs:310` | R-902, R-2310 | |
| FEAT-018 · Update or remove managed components safely | `Reads: A-061 · packages/nana-setup/lib/uninstall.mjs, packages/nana-setup/lib/steps.mjs` | `uninstall.mjs:90`, `:102-106`; `steps.mjs:476-480`, `:638` | R-905, R-660 | |
| FEAT-018 · Update or remove managed components safely | `Reads: A-062 · packages/nana-setup/lib/uninstall.mjs` | `uninstall.mjs:127` | R-903 | The MEMORY.md seed. |
| FEAT-018 · Update or remove managed components safely | `Reads: A-063 · packages/nana-setup/lib/uninstall.mjs` | `uninstall.mjs:114-118` | R-902 | |
| FEAT-018 · Update or remove managed components safely | `Reads: A-065 · packages/nana-setup/lib/uninstall.mjs` | `uninstall.mjs:127` | R-903 | |
| FEAT-018 · Update or remove managed components safely | `Reads: A-066 · packages/nana-setup/lib/uninstall.mjs` | `uninstall.mjs:127` | R-903 | The reviewer.md seed. |
| FEAT-019 · Release usable templates and report support | `Reads: A-009 · packages/nana-pack/lib/release-status.mjs` | `release-status.mjs:70`, `:75` | R-584, R-585 | |
| FEAT-019 · Release usable templates and report support | `Reads: A-022 · .github/workflows/ci.yml` | `ci.yml:111` (`needs: [suite, install-check]`) | R-597 | A workflow file GitHub evaluates; it is also one of A-022's writers. |
| FEAT-023 · Inspect changes and receive useful notices | `Reads: A-011 · packages/nana-pack/lib/config.ts, packages/nana-pack/bin/nana-roster.mjs, packages/nana-pack/extensions/nana-notify.ts, packages/nana-pack/extensions/nana-roster-notice.ts, packages/nana-setup/claude/hooks/nana-roster-notice.mjs` | `config.ts:491-495`; `nana-roster.mjs:133-134`; `nana-notify.ts:119`; `nana-roster-notice.ts:38-39`; `nana-roster-notice.mjs:55-56` | R-1194 (built from: A-011), R-160, R-167 | Journal, notify and the roster notice. |
| FEAT-023 · Inspect changes and receive useful notices | `Reads: A-069 · packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-notify.ts` | `config.ts:529-533`, `:572-573` (merges project notify and journal); `nana-notify.ts:119` | R-160, R-167 | New. Same pattern as FEAT-002, FEAT-010, FEAT-011 and FEAT-030's project-config lines; R-160's test names the project journal.path. |
| FEAT-024 · Edit session and project settings safely | `Reads: A-011 · apps/desk/server.mjs` | `server.mjs:1372`, `:1403` | R-457 | Frozen feature: ledger line only. |
| FEAT-024 · Edit session and project settings safely | `Reads: A-064 · apps/desk/server.mjs` | `server.mjs:1370`, `:1403` | R-455 | Frozen feature. |
| FEAT-024 · Edit session and project settings safely | `Reads: A-069 · apps/desk/server.mjs` | `server.mjs:1493`, `:1403` | R-457 | Frozen feature. |
| FEAT-026 · Verify output provenance across session history | `Reads: A-023 · apps/desk/apps.mjs, packages/nana-stage/lib/blocks.mjs` | `apps.mjs:425-428` (RPC get_entries); `blocks.mjs:315` (reduceEntries) | R-264 (built from: A-023), R-451 | pi opens the file; nana parses the entries. Frozen feature. |
| FEAT-028 · Maintain requirement identity and trace links | `Reads: A-015 · scripts/requirements-tree.mjs, scripts/requirements-lift.mjs, scripts/requirements-regroup.mjs, scripts/requirements-moved.mjs` | `requirements-tree.mjs:612-614`; `requirements-lift.mjs:1038-1040`; `requirements-regroup.mjs:823`, `:862`; `requirements-moved.mjs:261-274` | R-1157, R-1162, R-1171, R-1460 | `--root` on another project's ledger (R-1156 tells projects to run them). |
| FEAT-028 · Maintain requirement identity and trace links | `Reads: A-038 · scripts/requirements-lift.mjs` | `requirements-lift.mjs:112-114` (loadSeed reads and parses it), `:1034` | R-1165 | New. The lift gives G-row sections the seed's CAP-90, FEAT-900 and SUB-900 to SUB-904 headings. |
| FEAT-029 · Navigate code and investigate impact | `Reads: A-009 · scripts/code-map.mjs` | `code-map.mjs:65-73` (relationToMain) | R-2529 | |
| FEAT-029 · Navigate code and investigate impact | `Reads: A-030 · scripts/requirement-rows.mjs` | `requirement-rows.mjs:70` | R-649 | |
| FEAT-030 · Get trustworthy feedback after edits | `Reads: A-011 · packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-post-edit.ts` | `config.ts:491-495`, `:571`; `nana-post-edit.ts:288` | R-084 | postEdit.commands. |
| FEAT-030 · Get trustworthy feedback after edits | `Reads: A-069 · packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-post-edit.ts` | `config.ts:529-533`, `:571`; `nana-post-edit.ts:288` | R-084 | A trusted project's postEdit.commands. |
| FEAT-031 · Run checks reliably and without contaminating work | `Reads: A-009 · packages/nana-pack/lib/suite-records.mjs` | `suite-records.mjs:51-54` | R-2547 | The merge base with main. |
| FEAT-032 · Keep instructions and documentation accurate | `Reads: A-003 · scripts/product-report.mjs` | `product-report.mjs:575-579` | R-2514 | R-2514 is homed in FEAT-032 though it states product-report behaviour. |
| FEAT-033 · Adopt explicit engineering standards | `Reads: A-024 · scripts/readme-check.mjs, templates/typescript/template/scripts/readme-check.mjs` | `scripts/readme-check.mjs:17-21` (imports the checker); template `:571-579` (reads each configured README); `readme-check.config.json:9` lists the desk README | G-012, G-022 | G-022 is untested. |
| FEAT-039 · See the product and its decisions in one report | `Reads: A-003 · scripts/product-report.mjs` | `product-report.mjs:575-579` | R-1018 | |
| FEAT-039 · See the product and its decisions in one report | `Reads: A-006 · scripts/product-report.mjs, packages/nana-pack/lib/build-records.mjs` | `product-report.mjs:213-215`; `build-records.mjs:106` | R-2745 | |
| FEAT-039 · See the product and its decisions in one report | `Reads: A-030 · scripts/product-report.mjs` | `product-report.mjs:557`, `:718-719` | R-1014 | |
| FEAT-039 · See the product and its decisions in one report | `Reads: A-032 · scripts/product-report.mjs` | `product-report.mjs:605` | R-1512 | |
| FEAT-039 · See the product and its decisions in one report | `Reads: A-033 · scripts/product-report.mjs, packages/nana-pack/lib/suite-records.mjs` | `product-report.mjs:212` (readSuiteRecords) | R-2744 | |
| FEAT-034 · Define reproducible comparisons | `Reads: A-042 · apps/bench/lib/plan.mjs, apps/bench/run.mjs` | `plan.mjs:176-182`, `:197`; `run.mjs:890` | R-512, R-553 | Torn-tail quarantine and resume skip. |
| FEAT-035 · Account for cost and uncertainty | `Reads: A-042 · apps/bench/aggregate.mjs` | `aggregate.mjs:231` | R-535 | `aggregate.mjs:230` also reads A-039; no FEAT-035 row states it. |
| FEAT-036 · Bound study execution and paid work | `Reads: A-042 · apps/bench/run.mjs, apps/bench/lib/plan.mjs` | `run.mjs:890`, `:945`; `plan.mjs:197` | R-519 | The failure streak is restored from the trailing records. |

Features with no `Reads:` line: FEAT-012, FEAT-016, FEAT-020, FEAT-021, FEAT-022, FEAT-025, FEAT-027, FEAT-037 and FEAT-038.

### Built-from pairs (R-2798), all satisfied

| deliverable row (home) | built-from entries | registered at home | read at home by |
|---|---|---|---|
| R-001 (FEAT-001) | A-001, A-010, A-014 | A-001 | A-010 (new line), A-014 |
| R-873 (FEAT-002) | A-003, A-046 | A-003 | A-046 |
| R-217 (FEAT-004) | A-004 | none | A-004 |
| R-1560 (FEAT-007) | A-007, A-008 | both | none needed |
| R-341 (FEAT-015) | A-001, A-004, A-009, A-010, A-011, A-012, A-013, A-016, A-021 | none | all nine |
| R-406 (FEAT-020) | A-023 | A-023 | none needed |
| R-1194 (FEAT-023) | A-011 | none | A-011 |
| R-264 (FEAT-026) | A-023 | none | A-023 |
| R-1460 (FEAT-028) | A-030 | A-030 | none needed |
| R-1014 (FEAT-039) | A-045 | A-045 | none needed |
| R-1272 (FEAT-029) | A-032 | A-032 | none needed |

The only missing pair in the derive was R-001 → A-010 in FEAT-001; it is added. Every other pair's line now cites its deliverable row.

### Entries with no cross-feature reader

| Entry | Readers |
|---|---|
| A-008 | FEAT-007's own code only |
| A-017, A-018, A-020, A-035, A-040, A-044, A-045, A-048, A-076, A-078 | a person only |
| A-019 | FEAT-018's own code only |
| A-028 | FEAT-026's own code; FEAT-027's `apps.mjs:430` uses the keys, but R-439 is homed in FEAT-026 |
| A-029 | FEAT-027's own code only |
| A-031 | FEAT-028's own check only |
| A-039 | its own feature only (`plan.mjs`) |
| A-041 | its own feature only (`run.mjs:813`) |
| A-043 | its own feature only; the catch-ledger test reads it, but tests are excluded |
| A-047 | FEAT-014's own code only |
| A-052 | its own feature only (`sources.ts:167`, `nana-knowledge.ts:38`) |
| A-056 | FEAT-007's own code only (`review-timeline.mjs:47-49`) |
| A-057 | FEAT-007's own code only (`nana-land.mjs:178`, R-2576) |
| A-059 | no reader yet |
| A-067, A-068, A-070 | FEAT-014's own code, and pi and Claude Code, which are outside nana |
| A-072 | FEAT-033's own check only |
| A-073 | FEAT-039's own code only (`product-report.mjs:470`, `:629`) |
| A-074, A-075, A-077 | their own features only |
| A-081 | FEAT-013's own Windows install copy; Claude Code reads it (outside nana) |

## Table C, sweep items not registered (37, wholly or in part)

Unchanged from the derive; spot checks at HEAD held (`.gitignore:2`, `agentdir.mjs:90`, `build.ts:119`, the retired context script still tracked).

| sweep name | reason |
|---|---|
| 6 knowledge build lock | A lock held for one build and removed on release (`build.ts:119`). |
| 7 stage block session entries | Duplicate: lane 1 merged these into A-023, the pi session store. |
| 11 review reservations and lock | The lock lives for one read-decide-write. A reservation lives only while its review runs and is returned or pruned (R-714 to R-716). |
| 12 review output file | No fixed location: the seat names `--out` per run. The lasting text is A-008 and its lane copy A-057. |
| 14 review snapshot worktree | A temporary worktree, reclaimed after the review. |
| 15 review-round snapshot scratch | A temporary index and object folder, removed after each derivation. |
| 16 watchdog capture file | A temporary capture file in the OS temp folder. |
| 18 worker report | No fixed location (`pi-worker --out`), and only a person reads it. |
| 19 lane worktree lock | A lock held for one build and removed at exit (R-2692). |
| 20 builder temp prompt, preamble and settings | Temp files removed when lane mode ends (R-2692). The preamble's source is A-079. |
| 21 main branch ref and lane cleanup | The ref is A-009. The cleanup part removes a worktree and a branch and makes nothing. |
| 22 user-scope nana-pack.json (.bak part) | The file is A-011. The `.bak` is a backup copy beside it for a hand restore (R-1407). |
| 24 suite run record file | A temp file per run. Its content is kept as A-033 and uploaded as A-034. |
| 27 coverage folders | Temp folders, removed after the measured run. |
| 29 manual product report | Gitignored working-tree output (`.gitignore:2`). No class fits, as lane 1 ruled for R-532's raw folder. Only a person reads it. |
| 30 assessment packets | Written to a `--packets` folder named per run and read once by whoever writes assessments. A-073 holds the result. |
| 32 machine suite lock | A lock, removed when the locked run ends. |
| 33 test runner scratch and per-file temp HOME | Temp folders. |
| 34 mutation run record (lock, part files, logs, scratch) | The kept record is A-035. The rest is per-run working state, removed or left in temp. |
| 35 install-check rehearsal home | A temp home, deleted unless the check fails. |
| 37 template acceptance renders | Temp renders. |
| 40 blast-radius page | Written to `--out` per run. Only a person reads it. |
| 41 regroup review page | Written to `--out` per run. The owner reads it once per regroup. |
| 46 Claude Code settings (lock part) | The settings file is A-061. The O_EXCL lock lives for one install or uninstall. |
| 56 install backups (.bak-stamp part) | `~/.claude/backups/` is A-020. The `.bak-<stamp>` files sit beside each replaced file, with no single location, for a hand restore. |
| 63 copier-rendered project (rest of the tree) | The files nana reads are registered one by one: A-014, A-015, A-046, A-047, A-067, A-068 and A-069. The rest is the new project's own source, read by its own suite and CI. No nana code reads `.copier-answers.yml`. |
| 65 desk config edits (.bak copies, AGENTS.override.md) | Its stores are A-011, A-064, A-066, A-067, A-068, A-069 and A-071. The `.bak` copies are backups for a hand restore. Only the frozen desk writes `AGENTS.override.md`, and only pi reads it. |
| 67 desk session renames and temp system prompt | Renames are inside A-023. The system prompt file is a temp file. |
| 68 bench results and raw evidence (raw, quarantine) | Results are A-042. `raw/` is gitignored and no class fits (lane 1, parked R-532). `results.jsonl.quarantine` is written only on a torn-tail repair, is not tracked, and only a person reads it. |
| 69 bench schedule, fingerprint, probe ledger, oracle keys (fingerprint.txt) | Schedule A-039, ledger A-041, keys A-075. `fingerprint.txt` is the manifest behind the fingerprint that A-039 and A-042 carry. Only a person reads it. |
| 70 bench summary and fixture pins (summary.json) | `summary.md` is A-040 and `FIXTURE.sha256` is A-074. `summary.json` is A-040's JSON twin from the same aggregate call, and only a person reads it. |
| 71 catch-ledger outputs (reports.json, skipped.jsonl, kappa-pairs.json, ledger.jsonl, table.md) | Rows A-043, labels A-076, matches A-077, results A-078. The rest are side outputs of the extract and build steps. They are rebuilt from those with no model call, and only a person auditing the closed study reads them. |
| 72 bench agent dir | Recreated from scratch at every study start (`agentdir.mjs:90`). Only that study's pi children read it, and it holds a credential link. |
| 73 writing-trial private corpus | No fixed location: a private folder named per run, outside every class. |
| 75 lane briefs and review corpus | Not one artifact. Kept-text copies are A-057, mutation records A-035 and install-check records A-048. Briefs and worker or review outputs have paths the seat names per run. The next run reads them wherever the seat put them, often the scratchpad, so the committed copies are a person's record. |
| 77 retired context warning flag | Written only by the retired `context-size-check.sh`, which install unlinks (R-661). No current install wires it, though the script still ships. |
| 79 GitHub CI run results | GitHub's own record of a whole workflow run. Lane 1 ruled a whole-run result has no CI-record shape and narrowed A-022 to the install-check job. `nana-land` reads run results live (R-2586). |

Item 76 (rule and prompt files) is fully registered: A-005, A-049 and A-058, and now A-079, A-080 and A-081 beside them (derive doubt 15). Items 3, 4, 5, 9, 13, 31, 39, 45, 47, 48, 50, 51, 52, 53, 59, 60, 61 and 74 are in Table A.

## Changes from the derive

Added (8 lines):

1. Table A `A-079 · builder preamble` in FEAT-006. Seat ruling on derive doubt 15. Five FEAT-006 rows state its content.
2. Table A `A-080 · seat rule` in FEAT-006. Seat ruling. R-1140 and R-1141 (FEAT-006) state its content.
3. Table A `A-081 · soul rule` in FEAT-013. Seat ruling. R-1128 (FEAT-013) states its job; the home is flagged for the seat.
4. Table B FEAT-001 `Reads: A-010 · packages/nana-pack/lib/objective.ts`. Built-from tie: R-001's list names A-010, which FEAT-009 registers. The derive had left it out on purpose (its doubt 2); the new ruling requires it.
5. Table B FEAT-013 `Reads: A-080 · …steps.mjs, …fsops.mjs`. Install copies the seat rule on Windows (R-350), as it does A-005, A-037 and A-049.
6. Table B FEAT-015 `Reads: A-079 · packages/nana-setup/lib/install-check.mjs`. The install check reads the checkout's preamble (`:564`) and compares it with each build run's prompt (R-2684). This is the preamble's one code reader outside FEAT-006.
7. Table B FEAT-023 `Reads: A-069 · …config.ts, …nana-notify.ts`. Found during verification. `config.ts:572-573` merges a trusted project's notify and journal blocks (R-160, R-167). The derive gave this same read to FEAT-002, FEAT-010, FEAT-011 and FEAT-030 but missed FEAT-023.
8. Table B FEAT-028 `Reads: A-038 · scripts/requirements-lift.mjs`. Found during verification. `loadSeed` (`:112-114`) reads and parses the shared general rows; R-1165 (FEAT-028) states that the lift uses the seed's headings.

Dropped (1 line):

9. Table B FEAT-014 `Reads: A-010 · packages/nana-pack/lib/objective.ts, packages/nana-setup/lib/project.mjs`. The read serves the trust warning, which R-674 (FEAT-015) states, and FEAT-015's A-010 line already lists `project.mjs`. R-2050 (FEAT-014) only constrains that check's stderr; it does not state the read. This fails the attack 1 rule.

Changed evidence or row citations only (the line text stays as the derive wrote it):

10. R-341 cited on FEAT-015's A-001, A-004, A-009, A-010, A-011, A-012, A-013, A-016 and A-021 lines; R-873 on FEAT-002 A-046; R-217 on FEAT-004 A-004; R-264 on FEAT-026 A-023. Attack 1 says a built-from line cites its deliverable row.
11. FEAT-015 A-064: row R-2681 replaced by R-2684. R-2681 only states the lane build start. `install-check-config.mjs:144` ties the pi settings edit to R-2684.
12. FEAT-015 A-011: `install-check.mjs:553` removed from the evidence, since no row states the roster edit there. `:383` (R-2000) still justifies the path.
13. FEAT-013 A-049: `steps.mjs:722-724` removed from the evidence. That copy serves R-1412, which is FEAT-001's own row.
14. FEAT-014 A-003: "Inferred" replaced by verified. This repository tracks no OBJECTIVE.md, so `rootState`'s HANDOFF.md lstat decides adoption here (R-152's HANDOFF plus AGENTS plus docs/sessions branch).
15. `config.ts:491` is now `:491-495`, and `:529` is now `:529-533` (the read sits four lines below the path). The merge lines (`:571-574`) are added where they matter. Other line numbers are tightened the same way: `steps.mjs:309-310`, `steps.mjs:1088`, `uninstall.mjs:90`, `:102-106`, `steps.mjs:404-408`, `code-map.mjs:65-73`, `hook-health.mjs:16-21`, `doctor.mjs:383-389`, and template readme-check `:571-579`.
16. Table A evidence: A-052 gains R-2370 to R-2376; A-064's rows are R-323 and R-2025 in place of R-314 and R-1984 (which do not state that install runs pi install); A-071 gains R-455; A-063 gains R-589; A-060 gains R-739; A-068 gains `project.mjs:312`; A-070 gains the flag at `nana-setup.mjs:66`; A-059's note now says it is an orphan and not a lane 2 age-table key.

Checked and unchanged: the other 28 Table A lines' text, location shape, tracked matches (A-057 matches 21 files, A-076 3, A-077 2), run and maker feature; the other 94 Table B lines' readers, rows and own-span rule; Table C.

## Placement

- **Artifact lines.** Each goes in its maker feature's span, after that feature's existing `Artifact:` lines and in A-ID order. Where the feature has no `Artifact:` line yet, it goes directly after the Status and Also applies lines: FEAT-004 (A-054, A-055) and FEAT-024 (A-071). Every line goes before any `Note …:` block, subgroup heading or requirement table.
  - FEAT-002's A-051, FEAT-007's A-056 to A-058, FEAT-013's A-060 to A-066 and A-081, and FEAT-014's A-067 to A-070 go before those features' first `### SUB-` heading.
  - FEAT-033's A-072 goes before its `Note (moved from old §Part G …)` block.
  - FEAT-006's A-079 and A-080 go after A-006.
  - FEAT-039's A-073 goes after A-045.
- **Reads lines.** Each goes directly after its feature's last `Artifact:` line, the new ones included. Within a feature they are in A-ID order. Where the feature has no `Artifact:` line, they go directly after Status and Also applies: FEAT-010, FEAT-011 and FEAT-030. Every line goes before any `Note …:` block, subgroup heading or requirement table.
  - In FEAT-005 and FEAT-029, the lines go between the `Artifact:` line and the `Note (moved …)` block.
  - In FEAT-033, they go after A-072 and before the Note block.
  - In FEAT-002, FEAT-007, FEAT-013 and FEAT-014, they go before the first `### SUB-` heading.
- No `Reads:` or `Artifact:` line goes in a capability or subgroup span (R-2795 notes either).

## For the seat

1. **Soul rule home (A-081).** FEAT-013 is the chosen home, because R-1128 sits in its subgroup for delivering workflow resources. The other choice is FEAT-002, whose R-682 states one clause. That choice would add `Reads: A-081 · packages/nana-setup/lib/steps.mjs, packages/nana-setup/lib/fsops.mjs` (R-350) to FEAT-013. Default: FEAT-013.
2. **The preamble's code reader is an own read.** The brief's example, pi-worker reading the preamble, is not a cross-feature read. Five FEAT-006 rows state the preamble's content, and pi-worker serves FEAT-006's own R-961 and R-2647. The preamble's only cross-feature reader is the install check (FEAT-015).
3. **FEAT-001's A-010 line rests on R-001's built-from list.** No FEAT-001-homed row states the trust read; R-021 states it from FEAT-009, through FEAT-001's Also applies. The R-2798 ruling makes the line required either way.
4. **Gaps seen but not added.** No feature row states these reads, or the derive's rule leaves them out:
   - product-report on another project's ledger and HANDOFF.md (A-015, A-046) through `--root .`. R-1156 names the command, but no FEAT-039 row says another project.
   - The regroup page reads A-038 through `loadSeed` (`requirements-regroup.mjs:875`). No FEAT-028 row states it.
   - The knowledge build crawls docs folders, which reach A-031, A-051 and A-072. This is a generic crawl, not counted as a read.
   - This repository's own tracked AGENTS.md, CLAUDE.md and `.pi/nana-pack.json` are covered only by the other-project entries A-067 to A-069. HANDOFF.md, by contrast, has its own entry, A-003.
5. **Carried derive doubts, unchanged.** Doubt 3 covers the unusual readers: `ci.yml` and the copier templates. Doubt 4 covers the Windows-only source reads. Doubts 5 to 9 cover the glob location, the run choices, A-057's glob, the bench split and A-071. Doubts 11 to 13 cover the A-015 `--root` reads, G-022 being untested and doctor's A-053 read.

## Seat rulings on "For the seat" (2026-10-24)

1. The soul rule's home is FEAT-013, the verifier's default.
2. pi-worker's preamble read is a same-feature read and gets no line; the install check's read is the cross-feature one.
3. FEAT-001's A-010 line stays, required by R-2798 through R-001's built-from list.
4. The reads no feature's own row states (product-report `--root` on another project, the regroup page, the knowledge build's crawl, this repository's own AGENTS.md, CLAUDE.md and `.pi/nana-pack.json`) get no line in this lane. A FEAT-028 known-bug line records that Table B covers the reads the derive and verify found, not a whole-repository sweep.
