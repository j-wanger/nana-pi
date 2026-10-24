# feature-artifact-lines · derived entry table (lane 3, FEAT-028), read-only at main 0943299b

One agent derived this read-only against main at 0943299b. Line numbers name files at 0943299b. The builder anchors each line by its feature heading, never by line number.

Scope: the audit sweep's 80 items (snapshot fc06e29d), the ledger's 46 entries, its Made-by and Read-by lines, and a grep for each entry's location constant.

## Rules applied

- **Register** an artifact when it lasts beyond the run that writes it, has one fixed location that fits a class shape, and a later run or a person reads it. Locks, reservations and temp files do not qualify. Outputs at a path the caller names per run do not qualify either.
- **Writer**: lane 1's rule, the tracked file whose own code makes the write. A manual entry names no writer.
- **Run**: only runs the ledger's claims already use: session start, suite, land, review, build, CI, hook, extension, manual.
- **Reader**: a tracked, non-test file that opens, parses, lists or stats the artifact at run time. When a different file triggers the read and serves the reading feature's row, the line lists the opener first, then that file.
  - Excluded: tests, docs, and name-only uses. These are `state-manifest.mjs` (an inventory), `gate-paths.ts` (a protected-path list), `install-check-config.mjs` (contract values) and `deliverables.mjs` (location constants).
  - Also excluded: code that only removes the artifact, and code that only executes it.
  - Stat-only reads are counted and marked. So are reads in the install check's temporary home or review repository. See Doubts.
- **Feature**: a `Reads:` line goes in the feature whose own row states the behaviour the reading code serves. A feature never lists an entry from its own span. Reads only inside a feature's own span are therefore absent.
- New IDs run A-049 to A-078 in ledger order (FEAT-039 sits before FEAT-034). Every location was checked against `locationShape` in `scripts/deliverables.mjs`. Every tracked location matches at least one file at HEAD.

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

Items that lane 1 covers only in part also appear in Table C, for the part left over.

## Where the sweep is wrong at HEAD

- **Missing artifact.** The sweep has no item for the CI run record store, `<git common dir>/nana/ci-runs`. At 0943299b, `nana-land` stores every CI suite record it reads there. The calls are `packages/nana-pack/lib/land-ci-records.mjs:71` and `storeSuiteRecord` at `packages/nana-pack/lib/suite-records.mjs:91-98`. The subpath is `CI_STORE_SUBPATH` at `suite-records-config.mjs:23`, and rows R-2750 to R-2756 state it. The land-ci-timings lane added `land-ci-records.mjs` after the snapshot. Registered as A-059.
- **Item 47 (shared memory store).** The sweep puts the maker in FEAT-003. The write that nana makes is install seeding the index (`steps.mjs:674-677`), and R-308 (FEAT-013) states it. Registered under FEAT-013. FEAT-003 reads it.
- **Item 17 (build records).** Since the snapshot, `packages/nana-pack/lib/lane-watcher.mjs` also appends end records through `appendBuildRecord` (R-2724). The writer is still `build-records.mjs`, so A-006 is unchanged.
- **Item 39 (code map).** The writer line is now `templates/typescript/template/scripts/code-map.mjs:837`. The rerun command is `npm run map`; no `map:write` script exists.
- **Item 51.** It is two artifacts: the subagent config and the agents folder.
- **Item 65.** It covers seven stores, five of them registered here.
- **No other changes.** No other sweep writer moved or disappeared at HEAD.

## Table A, new entries (30)

| A-ID | maker feature (heading) | exact `Artifact:` line | writer evidence file:line | note |
|---|---|---|---|---|
| A-049 | FEAT-001 · Keep goals and priorities in view | `Artifact: A-049 · rulings file · tracked: packages/nana-pack/rules/nana-rulings.md · manual: the seat adds each ruling by hand in the reviewed change of the lane that records it` | Tracked; no code writes it. Rows R-1415 to R-1418 (FEAT-001) state its content. | The rulings bullet "A new ruling lands in the reviewed change of the lane that records it" is the reason. |
| A-050 | FEAT-001 · Keep goals and priorities in view | `Artifact: A-050 · pi rulings link · user-home store: <pi agent dir>/nana-rulings.md · manual: the owner runs nana-setup install by hand, which links it, or copies it on Windows` | `packages/nana-setup/lib/steps.mjs:722-726`; `paths.mjs:82` | R-1412 (FEAT-001). The Claude rules copy of the same file is inside A-013. |
| A-051 | FEAT-002 · Resume decisions and next actions | `Artifact: A-051 · known-bug files · tracked: docs/known-bugs/ · manual: the seat writes each known bug by hand as one line in its feature's file` | Tracked folder, 30 files at HEAD; no code writes it. `KNOWN_BUGS_DIR` is defined at `known-bugs-config.mjs:10`. | R-2505, R-2506 and R-2508 sit in FEAT-002 SUB-005; the entry goes in the feature span, before SUB-001. |
| A-052 | FEAT-003 · Index and connect existing knowledge sources | `Artifact: A-052 · knowledge sources config · user-home store: ~/.pi/agent/nana-knowledge/sources.json · hook: packages/nana-knowledge/lib/sources.ts` | `sources.ts:179-180` (seeds a missing file on the first build); `paths.ts:22` | After the seed the owner edits it by hand. An automatic entry cannot say so. The path is fixed and ignores `PI_CODING_AGENT_DIR` (paths.ts:17), so the location uses `~/`. |
| A-053 | FEAT-003 · Index and connect existing knowledge sources | `Artifact: A-053 · project memory shared links · user-home store: ~/.claude/projects/*/memory/shared · session start: packages/nana-setup/claude/hooks/nana-shared-memory.mjs` | `nana-shared-memory.mjs:69` (mkdir), `:84` (symlinkSync) | R-872, R-934. This is the first user-home location with a `*`. The checker accepts it, since the shape is `^(~\|<pi agent dir>)/.+`. |
| A-054 | FEAT-004 · Retrieve relevant context with provenance | `Artifact: A-054 · knowledge pull log · user-home store: ~/.pi/agent/nana-knowledge/pull.log · hook: packages/nana-knowledge/lib/hook.ts` | `hook.ts:94-95` (appendFileSync) | R-231, R-238. The pi extension also writes through `hook.ts`. The run is `hook` to match A-004. |
| A-055 | FEAT-004 · Retrieve relevant context with provenance | `Artifact: A-055 · knowledge shown sets · user-home store: ~/.pi/agent/nana-knowledge/shown/ · hook: packages/nana-knowledge/lib/hook.ts` | `hook.ts:87-88` | R-229. The state manifest calls it disposable. It still lasts 7 days and later pulls and builds read it. |
| A-056 | FEAT-007 · Review a specific revision independently | `Artifact: A-056 · review audit log · user-home store: ~/.pi/agent/review-ledger.jsonl · review: packages/nana-pack/bin/review-round.mjs` | `review-round.mjs:740-742` (rotate, then appendAudit), `:766`, `:846`; path `:108` | R-722, R-842. The `.1` rotation is the same store and is not entered separately. The path is fixed at `~/.pi/agent` (`:103`). |
| A-057 | FEAT-007 · Review a specific revision independently | `Artifact: A-057 · lane copies of kept review texts · tracked: docs/reviews/*/r?-*-????????.md · manual: the seat runs review-ledger keep by hand with each fix commit and once before the final round, as the land checklist says` | `review-ledger.mjs:70` (name), `:93` (write) | R-2573. The glob matches 21 tracked files at HEAD, all kept-text copies, and no other file. `KEEP_NAME_HASH_CHARS` is 8 (`review-round.mjs:86`). |
| A-058 | FEAT-007 · Review a specific revision independently | `Artifact: A-058 · review standard · tracked: packages/nana-pack/prompts/review-standard.md · manual: edited by hand in reviewed lanes` | Tracked; no code writes it. | R-1105 to R-1107 state its content and delivery. |
| A-059 | FEAT-008 · Integrate and clean up reviewed changes | `Artifact: A-059 · CI run records · clone store: <git common dir>/nana/ci-runs · land: packages/nana-pack/lib/suite-records.mjs` | `suite-records.mjs:91-98`, called from `land-ci-records.mjs:71` at land; `suite-records-config.mjs:23` | Not in the sweep (see above). R-2751, R-2752. Under lane 1's writer rule the writer is `suite-records.mjs`, the same file as A-033's writer but with a different run. No code reads this store yet. |
| A-060 | FEAT-013 · Install and connect harness runtimes | `Artifact: A-060 · Claude skill links · user-home store: ~/.claude/skills/ · manual: the owner runs nana-setup install by hand` | `steps.mjs:294-349` (linkSkill), `:439-449`; `paths.mjs:68` | R-302, R-665, R-351. Windows mirrors the skill folders instead. |
| A-061 | FEAT-013 · Install and connect harness runtimes | `Artifact: A-061 · Claude settings · user-home store: ~/.claude/settings.json · manual: the owner runs nana-setup install or uninstall by hand, which adds or removes only nana's hook entries; Claude Code and the owner write the rest` | `steps.mjs:557-595` (writeSettingsAtomic), `:622`, `:666`; `uninstall.mjs:106`; `paths.mjs:71` | R-316, R-1208. The settings lock beside it is not entered (see Table C). |
| A-062 | FEAT-013 · Install and connect harness runtimes | `Artifact: A-062 · shared memory store · user-home store: ~/.claude/nana-memory/shared/ · manual: the owner runs nana-setup install by hand, which seeds a missing index; Claude Code sessions write the memory entries` | `steps.mjs:674-677`; `paths.mjs:70` | R-308. The sweep said FEAT-003 (see above). |
| A-063 | FEAT-013 · Install and connect harness runtimes | `Artifact: A-063 · PATH command links · user-home store: ~/.local/bin/ · manual: the owner runs nana-setup install by hand, which links each nana command there, or writes sh and .cmd shims on Windows` | `steps.mjs:808-826`; `paths.mjs:103` | R-311, R-980. The folder also holds files nana does not own, the same as A-012's folder. |
| A-064 | FEAT-013 · Install and connect harness runtimes | `Artifact: A-064 · pi settings · user-home store: <pi agent dir>/settings.json · manual: the owner runs nana-setup install by hand, which runs pi install for each nana package and pi writes the entries; the owner edits the rest by hand, and the desk's settings form did while it ran, frozen since 2026-10-10` | `steps.mjs:1113-1134` (spawns `pi install`); desk `apps/desk/server.mjs:2325`; `paths.mjs:79` | R-314, R-1984. pi's own code writes it, as for A-010. |
| A-065 | FEAT-013 · Install and connect harness runtimes | `Artifact: A-065 · pi subagent config · user-home store: <pi agent dir>/extensions/subagent/config.json · manual: the owner runs nana-setup install by hand, which seeds a missing copy and never rewrites it` | `steps.mjs:747-749`; `paths.mjs:86` | R-360. |
| A-066 | FEAT-013 · Install and connect harness runtimes | `Artifact: A-066 · pi agent definitions · user-home store: <pi agent dir>/agents/ · manual: the owner runs nana-setup install by hand, which seeds a missing reviewer.md; the owner edits agents by hand, and the desk's settings form did while it ran, frozen since 2026-10-10` | `steps.mjs:779-781`; `server.mjs:1373`, `:2407`; `paths.mjs:88` | R-363. The location is the folder, because the desk edits any `agents/*.md`. |
| A-067 | FEAT-014 · Create or adopt a project workspace | `Artifact: A-067 · project working region · other project: <project>/AGENTS.md · manual: someone runs nana-setup project by hand, which writes a stub or refreshes the marker-owned working region; a copier template or the adopt-structure skill also writes it` | `project.mjs:158-248` (refreshWorkingRegion), `:278` (stub); `templates/*/template/AGENTS.md.jinja`; adopt-structure `SKILL.md:20` | R-329, R-334, R-989. |
| A-068 | FEAT-014 · Create or adopt a project workspace | `Artifact: A-068 · project Claude import · other project: <project>/CLAUDE.md · manual: someone runs nana-setup project by hand, which writes the one-line import beside a new AGENTS.md` | `project.mjs:287` | R-329, R-1311. |
| A-069 | FEAT-014 · Create or adopt a project workspace | `Artifact: A-069 · project pack config · other project: <project>/.pi/nana-pack.json · manual: someone seeds it by hand with nana-setup project, a copier template or the adopt-structure skill; the owner edits it by hand` | `project.mjs:326-338`; `templates/*/template/.pi/nana-pack.json.jinja` | R-330, R-592. The frozen desk also wrote it (`server.mjs:2370`). |
| A-070 | FEAT-014 · Create or adopt a project workspace | `Artifact: A-070 · not-a-project marker · other project: <project>/.nana-not-a-project · manual: someone runs nana-setup project --not-a-project by hand at a repository root` | `project.mjs:434` (name), `:441-445` | R-158, R-2764. The name is defined twice (`adoption.mjs:33`, `project.mjs:434`); the sweep noted this too. |
| A-071 | FEAT-024 · Edit session and project settings safely | `Artifact: A-071 · pi MCP config · user-home store: <pi agent dir>/mcp.json · manual: the owner edits it by hand; desk frozen since 2026-10-10, whose settings form rewrote its server list while it ran` | `apps/desk/server.mjs:1371`, `:2339` | nana-setup never writes it (`paths.mjs:92-94`). doctor reads it. See Doubts. |
| A-072 | FEAT-033 · Adopt explicit engineering standards | `Artifact: A-072 · code map · tracked: docs/code-map.md · manual: a builder runs npm run map by hand after a module change, and the suite fails on a stale copy until someone does` | `templates/typescript/template/scripts/code-map.mjs:837` through `scripts/code-map.mjs:46-47`; `package.json:11` | G-009, G-010. |
| A-073 | FEAT-039 · See the product and its decisions in one report | `Artifact: A-073 · feature assessment store · tracked: docs/product-report/assessments.json · manual: an agent or person writes each feature's assessment by hand from the report's packets` | Tracked; no code writes it. Packets come from `product-report.mjs:747`. | R-1027. FEAT-039 sits before FEAT-034 in the ledger, so A-073 precedes A-074. |
| A-074 | FEAT-034 · Define reproducible comparisons | `Artifact: A-074 · fixture manifest · tracked: apps/bench/studies/tool-profiles-2026-09-08/FIXTURE.sha256 · manual: someone builds the study's fixture by hand with node apps/bench/lib/fixture.mjs build` | `apps/bench/lib/fixture.mjs:133` | R-534, R-573. `fixture.mjs:66-68` reads it to name drift. |
| A-075 | FEAT-037 · Grade behavior with trustworthy checks | `Artifact: A-075 · oracle keys · tracked: apps/bench/studies/tool-profiles-2026-09-08/keys.jsonl · manual: someone starts a paid study with node apps/bench/run.mjs by hand` | `apps/bench/run.mjs:1034` | R-570. `run.mjs:820` reads it on resume. |
| A-076 | FEAT-038 · Interpret workflow experiments and their limits | `Artifact: A-076 · catch-ledger judge labels · tracked: apps/bench/studies/catch-ledger-2026-09-28/labels-*.jsonl · manual: someone runs node apps/bench/catch-ledger.mjs label by hand, which calls judge models` | `catch-ledger.mjs:94`, `:102` | R-537, R-2517. Paid cache, reread by `match` and `build` (`:111`). |
| A-077 | FEAT-038 · Interpret workflow experiments and their limits | `Artifact: A-077 · catch-ledger judge matches · tracked: apps/bench/studies/catch-ledger-2026-09-28/matches-*.jsonl · manual: someone runs node apps/bench/catch-ledger.mjs match by hand, which calls judge models` | `catch-ledger.mjs:139`, `:149` | R-2517. Reread by `build` (`:132`). |
| A-078 | FEAT-038 · Interpret workflow experiments and their limits | `Artifact: A-078 · catch-ledger results · tracked: apps/bench/studies/catch-ledger-2026-09-28/results.json · manual: someone runs node apps/bench/catch-ledger.mjs build by hand` | `catch-ledger.mjs:187`, `:242` | R-574, R-576. A person reads it. |

## Table B, `Reads:` lines (96)

Placement: the line goes after the feature's `Artifact:` lines, or after Status and Also applies, and before any subgroup. Within a feature, lines go in A-ID order.

| feature (heading) | exact `Reads:` line | reader evidence file:line per path | row that states the behaviour | note |
|---|---|---|---|---|
| FEAT-001 · Keep goals and priorities in view | `Reads: A-011 · packages/nana-pack/lib/config.ts` | `config.ts:307-310` (readConfigFile), `:611-613` (loadUserObjective) | R-1971, R-020 | The objective producer's user settings. |
| FEAT-001 · Keep goals and priorities in view | `Reads: A-014 · packages/nana-pack/lib/objective.ts` | `objective.ts:150-173` (walk up, bounded read) | R-001 | Lane 1's built-from list also names A-014. |
| FEAT-002 · Resume decisions and next actions | `Reads: A-011 · packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-handoff.ts` | `config.ts:491`; `nana-handoff.ts:322`, `:457` | R-142, R-130 | handoff.path and staleAfterDays. |
| FEAT-002 · Resume decisions and next actions | `Reads: A-030 · scripts/known-bugs.mjs` | `known-bugs.mjs:22-24` | R-2506 | Checks each file against an active or frozen feature in the ledger. |
| FEAT-002 · Resume decisions and next actions | `Reads: A-046 · packages/nana-pack/lib/frontier-summary.mjs` | `frontier-summary.mjs:68-71` | R-2606 | Another project's HANDOFF.md. This repo's copy, A-003, is FEAT-002's own entry. |
| FEAT-002 · Resume decisions and next actions | `Reads: A-069 · packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-handoff.ts` | `config.ts:529`; `nana-handoff.ts:322` | R-142 | handoff.path from a trusted project's config. |
| FEAT-003 · Index and connect existing knowledge sources | `Reads: A-055 · packages/nana-knowledge/lib/build.ts` | `build.ts:206-211` (pruneShown) | R-210 | Lists and stats, then prunes old files. |
| FEAT-003 · Index and connect existing knowledge sources | `Reads: A-062 · packages/nana-setup/claude/hooks/nana-shared-memory.mjs` | `nana-shared-memory.mjs:40-41` | R-935, R-2340 | Prints the shared index. |
| FEAT-004 · Retrieve relevant context with provenance | `Reads: A-004 · packages/nana-knowledge/lib/hook.ts, packages/nana-knowledge/lib/query.ts` | `hook.ts:171-175`; `query.ts:44` | R-230, R-1710 | Matches R-201's existing Read-by paths. |
| FEAT-005 · Communicate decisions clearly | `Reads: A-011 · packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-writing.ts` | `config.ts:491`; `nana-writing.ts:200`, `:210` | R-2500 | writing.enabled. |
| FEAT-006 · Launch builders with execution limits | `Reads: A-010 · packages/nana-pack/lib/objective.ts, packages/nana-pack/bin/pi-worker.mjs` | `objective.ts:410-411`; `pi-worker.mjs:81-84` | R-965 | The trust notice. |
| FEAT-006 · Launch builders with execution limits | `Reads: A-011 · packages/nana-pack/bin/nana-roster.mjs, packages/nana-pack/bin/pi-worker.mjs` | `nana-roster.mjs:32`, `:133-134`; `pi-worker.mjs:133` | R-1121, R-1124 | The roster. |
| FEAT-006 · Launch builders with execution limits | `Reads: A-023 · packages/nana-pack/lib/build-records.mjs` | `build-records.mjs:44-48`, `:185-188` | R-2598 | Sums Usage from the build's session files. |
| FEAT-006 · Launch builders with execution limits | `Reads: A-051 · packages/nana-pack/lib/brief-precedent.mjs, packages/nana-pack/bin/pi-worker.mjs` | `brief-precedent.mjs:114-117`; `pi-worker.mjs:184`, `:208` | R-2581 | The feature's known-bug file goes into the builder prompt. |
| FEAT-006 · Launch builders with execution limits | `Reads: A-061 · packages/nana-pack/bin/pi-worker.mjs` | `pi-worker.mjs:233-239` | R-2655 | The Claude builder's settings come from the user settings file. |
| FEAT-007 · Review a specific revision independently | `Reads: A-011 · packages/nana-pack/bin/nana-roster.mjs, packages/nana-pack/bin/claude-review.mjs` | `nana-roster.mjs:133-134`; `claude-review.mjs:72` | R-2560, R-2562 | The reviewer slot. |
| FEAT-008 · Integrate and clean up reviewed changes | `Reads: A-007 · packages/nana-pack/bin/review-round.mjs, packages/nana-pack/bin/nana-land.mjs` | `review-round.mjs:515`, `:533-535`; `nana-land.mjs:111`, `:178` | R-976, R-1005 | The kept-text check (A-008) serves R-2571, which FEAT-007 homes, so FEAT-008 gets no A-008 line. |
| FEAT-008 · Integrate and clean up reviewed changes | `Reads: A-021 · packages/nana-pack/lib/release-status.mjs` | `release-status.mjs:81` | R-588 | The post-merge release status. |
| FEAT-008 · Integrate and clean up reviewed changes | `Reads: A-034 · packages/nana-pack/lib/ci-records.mjs, packages/nana-pack/lib/land-ci-records.mjs` | `ci-records.mjs:120-140` (gh download into temp, parse); `land-ci-records.mjs:55` | R-2750 | |
| FEAT-009 · Decide which project content is trusted | `Reads: A-069 · packages/nana-pack/lib/config.ts` | `config.ts:529` | R-074 | |
| FEAT-010 · Guard risky commands and protected resources | `Reads: A-011 · packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-gate.ts` | `config.ts:491`; `nana-gate.ts:269` | R-1496 | Configured extraPatterns and protectedPaths. |
| FEAT-010 · Guard risky commands and protected resources | `Reads: A-069 · packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-gate.ts` | `config.ts:529`; `nana-gate.ts:269` | R-1496 | The trusted project's gate block. |
| FEAT-011 · Keep policy changes safe and recoverable | `Reads: A-011 · packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-gate.ts` | `config.ts:307-310`, `:491`; `nana-gate.ts:269` | R-063, R-2360 | |
| FEAT-011 · Keep policy changes safe and recoverable | `Reads: A-069 · packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-gate.ts` | `config.ts:529`; `nana-gate.ts:269` | R-067, R-2364 | |
| FEAT-013 · Install and connect harness runtimes | `Reads: A-004 · packages/nana-setup/lib/steps.mjs` | `steps.mjs:787` | R-310 | Stat only. Install builds the index only when it is absent. |
| FEAT-013 · Install and connect harness runtimes | `Reads: A-005 · packages/nana-setup/lib/steps.mjs, packages/nana-setup/lib/fsops.mjs` | `steps.mjs:143-144`; `fsops.mjs:64` | R-350 | Windows copies only. POSIX links by path. |
| FEAT-013 · Install and connect harness runtimes | `Reads: A-036 · packages/nana-setup/lib/steps.mjs, packages/nana-setup/lib/fsops.mjs` | `steps.mjs:310`; `fsops.mjs:64` | R-351 | Windows mirror only. |
| FEAT-013 · Install and connect harness runtimes | `Reads: A-037 · packages/nana-setup/lib/steps.mjs, packages/nana-setup/lib/fsops.mjs` | `steps.mjs:143-144`; `fsops.mjs:64` | R-350 | Windows copies only. |
| FEAT-013 · Install and connect harness runtimes | `Reads: A-049 · packages/nana-setup/lib/steps.mjs, packages/nana-setup/lib/fsops.mjs` | `steps.mjs:143-144`, `:722-724`; `fsops.mjs:64` | R-350 | Windows copies only. R-1412 and R-1413 (FEAT-001) state the same copy for the rulings file. |
| FEAT-014 · Create or adopt a project workspace | `Reads: A-002 · packages/nana-pack/lib/adoption.mjs, packages/nana-pack/extensions/nana-handoff.ts` | `adoption.mjs:127`; `nana-handoff.ts:377-380` | R-152, R-143 | Stat only. A saved summary counts as adoption. |
| FEAT-014 · Create or adopt a project workspace | `Reads: A-003 · packages/nana-pack/lib/adoption.mjs` | `adoption.mjs:116-119` | R-152 | Stat only. Inferred: the generic root check meets this repo's own HANDOFF.md in nana-pi sessions. |
| FEAT-014 · Create or adopt a project workspace | `Reads: A-004 · packages/nana-setup/lib/project.mjs` | `project.mjs:412` | R-331 | Stat only. The refresh is skipped when no index exists. |
| FEAT-014 · Create or adopt a project workspace | `Reads: A-010 · packages/nana-pack/lib/objective.ts, packages/nana-setup/lib/project.mjs` | `objective.ts:410-411`; `project.mjs:534` | R-2050 | R-2050 only implies the trust check; R-674 (FEAT-015) states it. |
| FEAT-014 · Create or adopt a project workspace | `Reads: A-011 · packages/nana-pack/lib/adoption.mjs, packages/nana-setup/lib/steps.mjs, packages/nana-setup/lib/project.mjs` | `adoption.mjs:95`; `steps.mjs:731-733`; `project.mjs:330` | R-157, R-150, R-330 | Journal path and projectFile; skip the project seed when user postEdit is set. |
| FEAT-014 · Create or adopt a project workspace | `Reads: A-025 · packages/nana-pack/lib/adoption.mjs, packages/nana-pack/bin/nana-adoption.mjs, packages/nana-pack/extensions/nana-handoff.ts` | `adoption.mjs:144-157` (tailLines); `nana-adoption.mjs:39-54`; `nana-handoff.ts:381` | R-146, R-151 | |
| FEAT-014 · Create or adopt a project workspace | `Reads: A-038 · templates/python/template/REQUIREMENTS-general.md.jinja, templates/typescript/template/REQUIREMENTS-general.md.jinja` | Both at `:1` (`{% include 'templates/_shared/requirements-general.md' %}`) | R-581 | The reader is a template that copier runs. See Doubts. |
| FEAT-015 · Diagnose the active environment | `Reads: A-001 · packages/nana-setup/lib/doctor.mjs` | `doctor.mjs:494` | R-1580 | Stat only (existsSync). |
| FEAT-015 · Diagnose the active environment | `Reads: A-004 · packages/nana-setup/lib/doctor.mjs` | `doctor.mjs:70-80` (knowledgeIndexState), `:645-647` | R-675 | |
| FEAT-015 · Diagnose the active environment | `Reads: A-006 · packages/nana-setup/lib/install-check.mjs` | `install-check.mjs:590` | R-2685 | In the install check's review repository. |
| FEAT-015 · Diagnose the active environment | `Reads: A-007 · packages/nana-setup/lib/install-check.mjs` | `install-check.mjs:474` | R-2074 | In the temporary home. |
| FEAT-015 · Diagnose the active environment | `Reads: A-009 · packages/nana-pack/lib/release-status.mjs, packages/nana-setup/lib/doctor.mjs` | `release-status.mjs:70`; `doctor.mjs:724` | R-586 | |
| FEAT-015 · Diagnose the active environment | `Reads: A-010 · packages/nana-pack/lib/objective.ts, packages/nana-setup/lib/doctor.mjs, packages/nana-setup/lib/project.mjs` | `objective.ts:410-411`; `doctor.mjs:500-501`; `project.mjs:534` | R-674 | |
| FEAT-015 · Diagnose the active environment | `Reads: A-011 · packages/nana-setup/lib/doctor.mjs, packages/nana-pack/lib/adoption.mjs, packages/nana-setup/lib/steps.mjs, packages/nana-setup/lib/install-check.mjs` | `doctor.mjs:312`, `:483-485`; `adoption.mjs:95`; `steps.mjs:731-733`; `install-check.mjs:383`, `:553` | R-1580, R-1584, R-1582, R-2000 | The install check reads it in the temporary home. |
| FEAT-015 · Diagnose the active environment | `Reads: A-012 · packages/nana-setup/lib/hook-health.mjs, packages/nana-setup/lib/doctor.mjs, packages/nana-setup/bin/stale-copies.mjs` | `hook-health.mjs:16`, `:39`; `doctor.mjs:382`; `bin/stale-copies.mjs:44` | R-1760 | |
| FEAT-015 · Diagnose the active environment | `Reads: A-013 · packages/nana-setup/lib/stale-copies.mjs, packages/nana-setup/lib/doctor.mjs, packages/nana-setup/bin/stale-copies.mjs` | `lib/stale-copies.mjs:32-38` (linkOk); `doctor.mjs:385-389`; `bin/stale-copies.mjs:48` | R-342, R-1761 | On Windows, linkOk also reads the source bytes (A-005, A-037, A-049). |
| FEAT-015 · Diagnose the active environment | `Reads: A-016 · packages/nana-setup/lib/doctor.mjs` | `doctor.mjs:706-709` | R-399 | |
| FEAT-015 · Diagnose the active environment | `Reads: A-021 · packages/nana-pack/lib/release-status.mjs, packages/nana-setup/lib/doctor.mjs` | `release-status.mjs:81`; `doctor.mjs:724` | R-586 | |
| FEAT-015 · Diagnose the active environment | `Reads: A-025 · packages/nana-setup/lib/install-check.mjs, packages/nana-pack/lib/adoption.mjs, packages/nana-pack/bin/nana-adoption.mjs` | `install-check.mjs:415`; `adoption.mjs:144-157`; `nana-adoption.mjs:47` | R-1079, R-1584 | The install check reads it in the temporary home. |
| FEAT-015 · Diagnose the active environment | `Reads: A-053 · packages/nana-setup/lib/install-check.mjs` | `install-check.mjs:509` | R-1076 | In the temporary home. doctor also reads it (`doctor.mjs:461`, `project-key.mjs:48`) but no doctor row names it. |
| FEAT-015 · Diagnose the active environment | `Reads: A-054 · packages/nana-setup/lib/install-check.mjs` | `install-check.mjs:613-616` | R-1096 | In the temporary home. |
| FEAT-015 · Diagnose the active environment | `Reads: A-058 · packages/nana-setup/lib/install-check.mjs` | `install-check.mjs:476` | R-2075 | The checkout's own file. |
| FEAT-015 · Diagnose the active environment | `Reads: A-060 · packages/nana-setup/lib/doctor.mjs, packages/nana-setup/bin/stale-copies.mjs` | `doctor.mjs:86`, `:410`; `bin/stale-copies.mjs:52` | R-666, R-1761 | |
| FEAT-015 · Diagnose the active environment | `Reads: A-061 · packages/nana-setup/lib/doctor.mjs, packages/nana-setup/lib/stale-copies.mjs, packages/nana-setup/bin/stale-copies.mjs, packages/nana-setup/lib/install-check.mjs` | `doctor.mjs:430`; `lib/stale-copies.mjs:49`; `bin/stale-copies.mjs:36`; `install-check.mjs:481`, `:607` | R-1055, R-1760, R-1074 | |
| FEAT-015 · Diagnose the active environment | `Reads: A-062 · packages/nana-setup/lib/doctor.mjs` | `doctor.mjs:194`, `:458`, `:467` | R-990 | |
| FEAT-015 · Diagnose the active environment | `Reads: A-063 · packages/nana-setup/lib/doctor.mjs` | `doctor.mjs:673-674` | R-953 | |
| FEAT-015 · Diagnose the active environment | `Reads: A-064 · packages/nana-setup/lib/doctor.mjs, packages/nana-setup/lib/steps.mjs, packages/nana-setup/lib/install-check.mjs` | `doctor.mjs:258`, `:698`; `steps.mjs:1081-1088`; `install-check.mjs:554` | R-1810, R-1811, R-2681 | |
| FEAT-015 · Diagnose the active environment | `Reads: A-065 · packages/nana-setup/lib/doctor.mjs` | `doctor.mjs:520` | R-362, R-366 | |
| FEAT-015 · Diagnose the active environment | `Reads: A-066 · packages/nana-setup/lib/doctor.mjs` | `doctor.mjs:557` | R-370, R-371 | reviewer.md. |
| FEAT-015 · Diagnose the active environment | `Reads: A-069 · packages/nana-setup/lib/doctor.mjs, packages/nana-setup/lib/project.mjs` | `doctor.mjs:497`; `project.mjs:518` | R-674, R-1583 | doctor's read is stat only. |
| FEAT-015 · Diagnose the active environment | `Reads: A-071 · packages/nana-setup/lib/doctor.mjs` | `doctor.mjs:593` | R-365, R-372 | |
| FEAT-017 · Inspect durable state and follow restoration steps | `Reads: A-010 · packages/nana-pack/lib/objective.ts, packages/nana-setup/lib/doctor.mjs` | `objective.ts:410-411`; `doctor.mjs:500-501` | R-959 | The same read as FEAT-015's, cited by FEAT-017's own row. |
| FEAT-018 · Update or remove managed components safely | `Reads: A-001 · packages/nana-setup/lib/uninstall.mjs` | `uninstall.mjs:127` | R-903 | Compares the seed's bytes. |
| FEAT-018 · Update or remove managed components safely | `Reads: A-011 · packages/nana-setup/lib/uninstall.mjs` | `uninstall.mjs:127` | R-903 | |
| FEAT-018 · Update or remove managed components safely | `Reads: A-012 · packages/nana-setup/lib/uninstall.mjs, packages/nana-setup/lib/steps.mjs` | `uninstall.mjs:114-118`; `steps.mjs:406-408` | R-902, R-804 | |
| FEAT-018 · Update or remove managed components safely | `Reads: A-013 · packages/nana-setup/lib/uninstall.mjs, packages/nana-setup/lib/fsops.mjs, packages/nana-setup/lib/steps.mjs` | `uninstall.mjs:114-127`; `fsops.mjs:91-96`; `steps.mjs:144` | R-902, R-903, R-2310 | Includes the private rule seed. Refreshing the Windows copies compares their bytes. |
| FEAT-018 · Update or remove managed components safely | `Reads: A-016 · packages/nana-setup/lib/uninstall.mjs` | `uninstall.mjs:78`, `:143` | R-906 | |
| FEAT-018 · Update or remove managed components safely | `Reads: A-050 · packages/nana-setup/lib/uninstall.mjs, packages/nana-setup/lib/fsops.mjs, packages/nana-setup/lib/steps.mjs` | `uninstall.mjs:114-118`; `fsops.mjs:91-96`; `steps.mjs:724` | R-902, R-2310 | |
| FEAT-018 · Update or remove managed components safely | `Reads: A-060 · packages/nana-setup/lib/uninstall.mjs, packages/nana-setup/lib/fsops.mjs, packages/nana-setup/lib/steps.mjs` | `uninstall.mjs:114-118`; `fsops.mjs:91-96`; `steps.mjs:310` | R-902, R-2310 | |
| FEAT-018 · Update or remove managed components safely | `Reads: A-061 · packages/nana-setup/lib/uninstall.mjs, packages/nana-setup/lib/steps.mjs` | `uninstall.mjs:85-106`; `steps.mjs:476-480`, `:638` | R-905, R-660 | |
| FEAT-018 · Update or remove managed components safely | `Reads: A-062 · packages/nana-setup/lib/uninstall.mjs` | `uninstall.mjs:127` | R-903 | The MEMORY.md seed. |
| FEAT-018 · Update or remove managed components safely | `Reads: A-063 · packages/nana-setup/lib/uninstall.mjs` | `uninstall.mjs:114-118` | R-902 | |
| FEAT-018 · Update or remove managed components safely | `Reads: A-065 · packages/nana-setup/lib/uninstall.mjs` | `uninstall.mjs:127` | R-903 | |
| FEAT-018 · Update or remove managed components safely | `Reads: A-066 · packages/nana-setup/lib/uninstall.mjs` | `uninstall.mjs:127` | R-903 | The reviewer.md seed. |
| FEAT-019 · Release usable templates and report support | `Reads: A-009 · packages/nana-pack/lib/release-status.mjs` | `release-status.mjs:70`, `:75` | R-584, R-585 | |
| FEAT-019 · Release usable templates and report support | `Reads: A-022 · .github/workflows/ci.yml` | `ci.yml:111` (`needs: [suite, install-check]`) | R-597 | A workflow file as reader. It is also one of A-022's writers. See Doubts. |
| FEAT-023 · Inspect changes and receive useful notices | `Reads: A-011 · packages/nana-pack/lib/config.ts, packages/nana-pack/bin/nana-roster.mjs, packages/nana-pack/extensions/nana-notify.ts, packages/nana-pack/extensions/nana-roster-notice.ts, packages/nana-setup/claude/hooks/nana-roster-notice.mjs` | `config.ts:491`; `nana-roster.mjs:133-134`; `nana-notify.ts:119`; `nana-roster-notice.ts:38-39`; `nana-roster-notice.mjs:55-56` | R-160, R-167, R-1194 | Journal, notify and the roster notice. |
| FEAT-024 · Edit session and project settings safely | `Reads: A-011 · apps/desk/server.mjs` | `server.mjs:1372`, `:1403` | R-457 | Frozen feature: ledger line only, as lane 1 did. |
| FEAT-024 · Edit session and project settings safely | `Reads: A-064 · apps/desk/server.mjs` | `server.mjs:1370`, `:1403` | R-455 | Frozen feature. |
| FEAT-024 · Edit session and project settings safely | `Reads: A-069 · apps/desk/server.mjs` | `server.mjs:1493`, `:1403` | R-457 | Frozen feature; the project-scope write. |
| FEAT-026 · Verify output provenance across session history | `Reads: A-023 · apps/desk/apps.mjs, packages/nana-stage/lib/blocks.mjs` | `apps.mjs:425-428` (RPC get_entries); `blocks.mjs:315` (reduceEntries) | R-451 | pi opens the file; nana parses the entries. Frozen feature. |
| FEAT-028 · Maintain requirement identity and trace links | `Reads: A-015 · scripts/requirements-tree.mjs, scripts/requirements-lift.mjs, scripts/requirements-regroup.mjs, scripts/requirements-moved.mjs` | `requirements-tree.mjs:612-614`; `requirements-lift.mjs:1038-1040`; `requirements-regroup.mjs:823`, `:862`; `requirements-moved.mjs:261-274` | R-1157, R-1162, R-1171, R-1460 | `--root` on another project's ledger. The requirements skill tells projects to run them (R-1156). |
| FEAT-029 · Navigate code and investigate impact | `Reads: A-009 · scripts/code-map.mjs` | `code-map.mjs:67-72` | R-2529 | |
| FEAT-029 · Navigate code and investigate impact | `Reads: A-030 · scripts/requirement-rows.mjs` | `requirement-rows.mjs:70` | R-649 | |
| FEAT-030 · Get trustworthy feedback after edits | `Reads: A-011 · packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-post-edit.ts` | `config.ts:491`; `nana-post-edit.ts:288` | R-084 | postEdit.commands. |
| FEAT-030 · Get trustworthy feedback after edits | `Reads: A-069 · packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-post-edit.ts` | `config.ts:529`; `nana-post-edit.ts:288` | R-084 | A trusted project's postEdit.commands. |
| FEAT-031 · Run checks reliably and without contaminating work | `Reads: A-009 · packages/nana-pack/lib/suite-records.mjs` | `suite-records.mjs:51-54` | R-2547 | The merge base with main. The mutation runner also reads main (`mutation-runner.mjs:156`); no row is cited for it. |
| FEAT-032 · Keep instructions and documentation accurate | `Reads: A-003 · scripts/product-report.mjs` | `product-report.mjs:575-579` | R-2514 | R-2514 is homed in FEAT-032 although it states product-report behaviour. |
| FEAT-033 · Adopt explicit engineering standards | `Reads: A-024 · scripts/readme-check.mjs, templates/typescript/template/scripts/readme-check.mjs` | `scripts/readme-check.mjs:17-21`; template `:571-579` | G-012, G-022 | `readme-check.config.json:9` lists the desk README. G-022 is untested. |
| FEAT-039 · See the product and its decisions in one report | `Reads: A-003 · scripts/product-report.mjs` | `product-report.mjs:575-579` | R-1018 | |
| FEAT-039 · See the product and its decisions in one report | `Reads: A-006 · scripts/product-report.mjs, packages/nana-pack/lib/build-records.mjs` | `product-report.mjs:213-215`; `build-records.mjs:106` | R-2745 | Matches C5's Read-by path. |
| FEAT-039 · See the product and its decisions in one report | `Reads: A-030 · scripts/product-report.mjs` | `product-report.mjs:557`, `:718-719` | R-1014 | |
| FEAT-039 · See the product and its decisions in one report | `Reads: A-032 · scripts/product-report.mjs` | `product-report.mjs:605` | R-1512 | |
| FEAT-039 · See the product and its decisions in one report | `Reads: A-033 · scripts/product-report.mjs, packages/nana-pack/lib/suite-records.mjs` | `product-report.mjs:212` | R-2744 | |
| FEAT-034 · Define reproducible comparisons | `Reads: A-042 · apps/bench/lib/plan.mjs, apps/bench/run.mjs` | `plan.mjs:176-182`, `:197`; `run.mjs:890` | R-512, R-553 | Torn-tail quarantine and resume skip. |
| FEAT-035 · Account for cost and uncertainty | `Reads: A-042 · apps/bench/aggregate.mjs` | `aggregate.mjs:231` | R-535 | `aggregate.mjs:230` also reads A-039 for the integrity line, but no FEAT-035 row states it. |
| FEAT-036 · Bound study execution and paid work | `Reads: A-042 · apps/bench/run.mjs, apps/bench/lib/plan.mjs` | `run.mjs:890`, `:945`; `plan.mjs:197` | R-519 | The failure streak is restored from the trailing records. |

Features with no `Reads:` line: FEAT-012, FEAT-016, FEAT-020, FEAT-021, FEAT-022, FEAT-025, FEAT-027, FEAT-037 and FEAT-038.

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

## Table C, sweep items not registered (37, wholly or in part)

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
| 20 builder temp prompt, preamble and settings | Temp files removed when lane mode ends (R-2692). |
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

Item 76 (rule and prompt files) is fully registered: A-005, A-049 and A-058. Items 3, 4, 5, 9, 13, 31, 39, 45, 47, 48, 50, 51, 52, 53, 59, 60, 61 and 74 are in Table A.

## Doubts

1. **The reader rule.** About 18 lines count reads that only stat a path, or that happen in the install check's temporary home or review repository. The seat's wording "open or parse" would drop them.
   - Stat-only: A-001 doctor, A-002, A-003 and A-004 in FEAT-013 and FEAT-014, A-069 doctor.
   - Temporary home or review repository: A-006, A-007, A-011, A-025, A-053, A-054, A-061 and A-064 in FEAT-015.
2. **Lines that exist only because of where a row is homed.** These follow the rule literally:
   - FEAT-008 has no A-008, because R-2571 is homed in FEAT-007.
   - FEAT-001 has no A-010, because the trust-label rows are FEAT-009's, though R-001's built-from list names A-010.
   - FEAT-032 gets A-003 from R-2514, a product-report row.
   - FEAT-017 repeats doctor's A-010 read through R-959.
   - FEAT-014's A-010 line rests on R-2050, which only implies the trust check.
   - FEAT-015 collects 24 lines, many through its encoding (BOM) rows and install-check rows.
3. **Unusual readers.**
   - FEAT-019's A-022 line names `ci.yml`, a workflow file that GitHub evaluates and that is also an A-022 writer.
   - FEAT-014's A-038 line names two copier templates.
   - FEAT-026's A-023 line parses entries that pi reads through RPC.
4. **Windows-only reads.** FEAT-013's A-005, A-036, A-037 and A-049 lines read content only on Windows. doctor, stale-copies and FEAT-018's copy refresh compare bytes against those same sources on Windows. Those comparisons are listed under the installed copies (A-013, A-050, A-060), not the sources.
5. **A-053's location** `~/.claude/projects/*/memory/shared` is the first user-home glob. A-053, A-060, A-061 and A-062 follow `CLAUDE_CONFIG_DIR` when it is set, as lane 1 noted for A-012 and A-013.
6. **Run choices.**
   - A-052 says `hook`, though after the seed the file is edited by hand.
   - A-054 and A-055 say `hook`, though the pi extension writes through the same file.
   - A-059 shares its writer with A-033 under a different run (`land` against `suite`).
7. **A-057's glob** misses a round of 10 or more and depends on `KEEP_NAME_HASH_CHARS` staying 8.
8. **The bench and catch-ledger split is judgement.** Registered: code-read caches and records (A-074 to A-077) and the build's results (A-078). Left out as side outputs: `fingerprint.txt`, `summary.json`, `reports.json`, `skipped.jsonl`, `kappa-pairs.json`, the catch `ledger.jsonl` and `table.md`.
9. **A-071 (mcp.json)** sits in a frozen feature (FEAT-024). Its only nana writer is the frozen desk, and doctor reads it. It could instead go to Table C as pi's own config.
10. **A-064 (pi settings).** Its maker is FEAT-013, though pi writes the entries. The `pi install` spawn is `steps.mjs:1134`.
11. **FEAT-028's A-015 line** depends on reading `--root` runs over other projects' ledgers as reads of A-015.
12. **FEAT-033's A-024 line** cites G-012 and G-022, and G-022 is untested.
13. **FEAT-015's A-053 line** cites only the install check. doctor reads the link too, but no row names it.
14. **Not counted as reads:** uninstall's index removal (R-904), and the install check running the bin launchers (A-063, R-2071).
15. **Not registered and not sweep items:** `packages/nana-pack/prompts/builder-preamble.md` (read by `pi-worker`), `nana-seat.md` and `nana-soul.md`. They are tracked prompt and rule files of the same kind as A-037 and A-058.
16. **Whole-run CI results.** `nana-land` reads whole-run CI conclusions, and `ci-records.mjs:129` lists each run's jobs. No entry or `Reads:` line records either read (Table C item 79).
