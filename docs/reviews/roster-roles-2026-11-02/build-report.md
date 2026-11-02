# Roster roles — build 1 technical record

## Commits and scope

- Implementation: `d02c4ff59a51c4340d5f6f758e4994f073a2644e` (`roster-roles: add role slots and shared worker launch`).
- The evidence commit adds this record and mutation results, and corrects the README recovery instructions described below. It changes no production code or tests.
- Feature: FEAT-041. Existing roster rows stay in FEAT-006; notice rows stay in FEAT-023. No feature, capability or artifact moves.

### Files

| Item | Files |
|---|---|
| Roster schema, null tokens, fallbacks, tools, provider aliases | `packages/nana-pack/bin/worker-config.mjs`, `packages/nana-pack/bin/nana-roster.mjs` |
| Compatible writes | `packages/nana-pack/lib/roster-set.mjs`; imports the existing JSON parser and member writer |
| Shared role resolution and lineage | `packages/nana-pack/lib/roster-roles.mjs` |
| One entry-to-argv implementation for lane and role modes | `packages/nana-pack/bin/pi-worker.mjs` |
| Runtime-specific notices | `packages/nana-pack/lib/roster-notice.mjs`, `packages/nana-pack/extensions/nana-roster-notice.ts`, `packages/nana-setup/claude/hooks/nana-roster-notice.mjs` |
| Tests | `packages/nana-pack/tests/nana-roster.test.mjs`, `packages/nana-pack/tests/nana-roster-set.test.mjs`, `packages/nana-pack/tests/roster-notice.test.mjs`, `packages/nana-pack/tests/worker-claude.test.mjs`, `packages/nana-setup/tests/seat-rule.test.mjs` |
| Guidance | `packages/nana-setup/claude/rules/nana-seat.md`, `packages/nana-setup/claude/rules/nana-soul.md`, `templates/_shared/working-under-nana-pi.md`, `AGENTS.md`, `packages/nana-pack/rules/nana-rulings.md`, `packages/nana-pack/README.md` |
| Contract and generated navigation | `REQUIREMENTS.md`, `docs/requirements-tree.md`, `docs/code-map.md` |
| Session entry | `docs/sessions/2026-10.md`; the brief's explicit newest-first entry only; unchanged previous entries |
| Evidence | This folder's red, green, gate and mutation logs, `session-entry.md`, and `seat-mutate.mjs` |

### Rows

- New, in must-meet order: R-3524 (MM3), R-3525 (MM4), R-3526 (MM5), R-3527 (MM6), R-3528 (MM7 scout), R-3529 (MM8), R-3530 (MM9).
- Seals: R-3531 (fallback map), R-3532 (Claude scout tools), R-3533 (lineage aliases).
- Amended: R-1121, R-1122, R-1123, R-1192, R-1194, R-3215; additionally R-1140 and R-1211 for the conflicts described below.
- Retired: R-1199, replaced by R-3528.

## Requirements → tests → implementation

The requirement diff preceded the tagged tests and implementation. The red logs ran against the unmodified implementation inherited from main. All new must-meet checks and all three new seal checks printed FAIL, including MM6 on native Windows. The initial commands each exited 1:

```text
node --experimental-strip-types packages/nana-pack/tests/nana-roster.test.mjs
node --experimental-strip-types packages/nana-pack/tests/nana-roster-set.test.mjs
node --experimental-strip-types packages/nana-pack/tests/roster-notice.test.mjs
node packages/nana-setup/tests/seat-rule.test.mjs
node --experimental-strip-types packages/nana-pack/tests/worker-claude.test.mjs
```

`red-roster.log`, `red-set.log`, `red-notice.log`, `red-guide.log` and `red-worker.log` retain those runs. Windows fixtures use fake commands in OS-temp folders, including a path with spaces, and never modify the real agent directory. The role brief includes CRLF, trailing tab and no final newline. No suite test runs, imports or copies the seat mutation script.

### Existing test edits

- `nana-roster.test.mjs`: the two exact command-output expectations now include the three null role lines. A malformed scout carrying both pi fields and a Claude runtime now refuses through the Claude validator, so its expected named path is scout rather than runtime. The JSON test already reads the canonical order and needed no change.
- `roster-notice.test.mjs`: replaced the named R-1199 negative test with MM7's set/null scout test. Existing parity now excludes runtime-specific lineage text; the roster itself stays equal. Existing exact role/model assertions remain intact.
- `seat-rule.test.mjs`: the launch bullet now includes role children. The allowed-bullet inventory includes the new role-launch bullet. Its title now names original rules plus the role-launch rule. MM9 checks commands and exceptions rather than one frozen new sentence.
- `worker-claude.test.mjs`: appended MM4–MM6 and the launch half of MM8 using the existing fixture body, bounded process helpers and public fake-pi helper. Existing cases and assertions remain unchanged. The new role fixture clears inherited seat markers and gives the pi shell marker precedence when testing a nested pi seat.
- No other existing test was edited or deleted. The forecast files `worker-lane.test.mjs`, `context-anatomy.test.mjs`, `roster-notice-hook.test.mjs`, `templates-render.test.mjs` and `rulings.test.mjs` remained true and passed unchanged.

## Precedent choices and departures

- Read the brief's precedent files, the additional precedent files named in revision 2, and all three known-bug files before implementation. `impact.log` records the mapped blast radius; `literal-audit.log` records the test/checker literal search before narrowing edits.
- O2: factored lane mode's inline launch assembly into `prepareWorker` in the same file. Both modes consume one launch specification. No private function was moved or copied. Existing settings, log, watcher, JSON and Windows launch helpers remain imports from their canonical modules.
- The new small `roster-roles.mjs` module shares fallback resolution and pair diagnostics between notices and the worker. The plan did not list this file by name; sharing avoids two independently implemented fallback/lineage policies.
- O4: the single sealed alias map stays in `worker-config.mjs`. Provenance: installed pi 1.4.0, pi-ai `dist/types.d.ts` KnownProvider, read 2026-11-02. Only direct `anthropic`, `openai` and `openai-codex` providers receive aliases; other providers remain unknown.
- R-1211 was not in the plan's amendment list. MM8 requires a pi seat with no planner to show an unverified diagnostic while a Claude Code seat can verify the same roster. The parity row now excludes only runtime-specific lineage diagnostics.
- R-1140 was not in the amendment list. Its ban on any bullet beyond the original sixteen conflicted with MM9's required new role-launch bullet. It now permits that one rule; all original rules remain required.
- The plan's recovery through a new slot's null token conflicts with MM3: set retains the named key, and older validators reject even a null new key. The README instead gives three working recoveries: pull the older checkout, remove the new keys by hand and reset any Claude scout, or restore the backup. No write semantics changed.
- `nana-soul.md` was not in the planned file list. R-1128 and the existing template check require its Default pattern bullet to match the shared source. Its only change mirrors that bullet.
- `pi-watchdog.mjs`, `pack-config-write.mjs`, `context-load-log.mjs`, `roster-notice-config.mjs` and `lane-watcher.mjs` needed no change. The worker attaches logging to the existing child's spawn event and calls the existing cleanup-only watcher with a sentinel lock inside its private folder.
- machine-lane-limits had not landed when the build started: fetched `origin/main` remained `7c4e7e195bdbfcf284ab2636b41c93748c30dc77`. No merge was needed. Slots precede source; there is no lanes producer on this base.

## Mutation proof

The shared runner broke code or runtime-consumed guidance, never assertions. The table names one pair per must-meet. `mutation-results.log` and `mutation-pair-logs/` retain the record and individual outputs.

| Pair | Wrong implementation | Result |
|---|---|---|
| MM1 | Planner fallback prints none | RED; MM1 and declared token/output checks |
| MM2 | Scout rejects Claude Code | RED; MM2 |
| MM3 | Set persists every normalized slot | RED; MM3 |
| MM4 | Scout loses research tools | RED; MM4 |
| MM5 | Context line logs before the spawn outcome | RED; MM5, including Windows ENOENT |
| MM6 | Windows role has no cleanup watcher | RED; MM6 forced-stop case |
| MM7 | Set scout is omitted from notice | RED; MM7 |
| MM8 | Resolved lineage diagnostics disappear | RED; both notice and launch checks |
| MM9 | Guide loses its slot command | RED; MM9 |

```text
RESULT: 9/9 red (9 exactly their named titles, 0 with a named title green, 0 with an unnamed red), 0 survived, across 1 shards
```

## Commands and exits

| Command | Exit | Evidence |
|---|---:|---|
| `node scripts/test.mjs --jobs=1 nana-roster.test nana-roster-set.test roster-notice.test roster-notice-hook.test worker-claude.test worker-lane.test context-anatomy.test seat-rule.test templates-render.test rulings.test` | 0 | `touched-tests-serial.log`: 10 PASS files; 230 pass, 0 fail, 27 skip |
| `npm test -- --jobs=1 agent-dir-config.test agent-dir-parity.test build-records.test pack-config-utf16.test win32-launch.test rulings-install.test project-working-region.test` | 0 | `caller-tests-npm.log`: 7 PASS files; 197 pass, 0 fail, 7 skip |
| `node docs/reviews/roster-roles-2026-11-02/seat-mutate.mjs` with `SEAT_MUTATE_OUT` and `SEAT_MUTATE_LOGDIR` | 0 | Nine pairs red; all named cases reached |
| `npm run map:check` | 0 | `map-check.log` |
| `npm run readme:check` | 0 | `readme-check.log` |
| `node scripts/requirements-trace.mjs` | 0 | `trace.log` |
| `npm run req:tree`, then `node scripts/requirements-tree.mjs --root .` | 0, 0 | `tree-write.log`, `tree-check.log` |
| `node scripts/known-bugs.mjs --root .` | 0 | `known-bugs.log` |
| `node packages/nana-pack/bin/nana-writing.mjs docs/reviews/roster-roles-2026-11-02/session-entry.md` | 0 | `writing-session.log`; no findings |
| `node packages/nana-pack/bin/nana-writing.mjs HANDOFF.md` | 0 | `writing-handoff.log`; no findings; HANDOFF unchanged |
| `node scripts/identity-scan.mjs --root .` | 0 | `identity.log` |
| `node packages/nana-setup/bin/install-check.mjs` | 1 initially; 0 with inherited launcher markers removed | `install-check.log`, `install-check-clean-env.log` |
| `git diff --check` | 0 | Before implementation commit |

The install-check retry used `env -u NANA_ROLE -u NANA_HANDOFF -u NANA_WORKTREE_ROOT -u PI_SESSION_ID`. It ran the same script and all checks passed. The initial post-edit write failure is consistent with the inherited builder boundary. Removing only those markers made the retry pass; no install code changed.

The first parallel touched-test attempt hit the tool's 240-second limit. The isolated context retry also hit child time limits while another lane's stress load saturated the shared machine. The later serial run passed without changing those tests or their limits. Both unsuccessful logs remain for transparency. The extra caller-test run first failed because direct Node execution supplies no npm_execpath; running the same seven files through npm test passed. No test or limit changed.

## Known bugs this change touches, without fixing

- FEAT-041: percent, bang or quote in a temporary path can still refuse a Windows batch launch. The README states it.
- FEAT-041: builder-style Claude launches still receive no effort flag. This role path follows that existing policy, not the reviewer's effort policy.
- FEAT-041: settings carry's case handling and per-model effort alias limits remain unchanged. The shared helper remains the implementation.
- FEAT-041: log appends remain best-effort and untested for concurrent torn writes; a home that is a git repository still causes a skip diagnostic.
- FEAT-006: a first set still freezes the old default lineup and still writes largerBuilder null. MM3 prevents repeating that compatibility cost for unnamed new slots, not for largerBuilder.
- FEAT-006: set still has no lock and one backup; an absent agent folder still refuses. No real user configuration was edited.
- FEAT-006: Claude launches retain their existing inherited environment, advisory boundary, no-stall-stop and child-tool-process limits.
- FEAT-006: on Windows the cleanup watcher kills no surviving child. Role mode uses cleanup-only mode, takes no lane lock, and documents this limit.
- FEAT-006: installed Windows guide/ruling copies still need an install refresh. No installed file was changed by this build.
- FEAT-023: the longer notice still wraps in pi's existing widget. Both runtime entry points use the shared composer.

No known-bug file was edited. The brief did not authorize fixing any other listed residual. No findings list is claimed.

## Not done

- No local full suite: CI covers it, as AGENTS requires. The final branch push is for CI; the builder does not wait for or inspect its run.
- No discretionary model sessions, subagents, reviewer launches, GitHub issue operations or real roster edits. Prescribed tests and install-check use their isolated fixtures.
- No macOS run from this Windows seat. The seat still owes the local macOS install check before land.
- No per-role context bundles, automatic role memory, wider provider lineage inference or automatic model substitutions.
- No edits to HANDOFF, existing archived entries, known-bug files or the two prohibited temporary folders.
- Template rendering cases skip because uvx/copier is absent here; the unchanged renderer's non-render checks passed. Hosted CI remains responsible for the required template toolchain cases.
