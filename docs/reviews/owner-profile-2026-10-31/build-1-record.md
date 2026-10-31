# Owner profile — build 1 technical record

Follow-up: [Windows guard correction](windows-fix-record.md) records the first hosted failure and its red/green repair within this build.

## Scope and files

Feature FEAT-040, subgroup SUB-022, artifact A-090. The build serves the current priority of carrying learning into later work. The build stays on `feat/owner-profile`; no main commit, real profile, real profile remote, issue, HANDOFF, known-bug file or session archive was changed.

- New command: `packages/nana-pack/bin/nana-profile.mjs` (`init`, `save`, `confirm`, `retract`, `supersede`, `show`, `sync`).
- New library files: `packages/nana-pack/lib/profile-config.mjs`, `profile-store.mjs`, `profile-sync.mjs`, `pack-config-write.mjs`, and the shape-only `memory-making-config.mjs`.
- Existing writer: `packages/nana-pack/lib/roster-set.mjs` imports the moved writer. `nana-roster.mjs` remains unchanged and keeps its dynamic import.
- New tests: `packages/nana-pack/tests/profile-store.test.mjs` and `profile-sync.test.mjs`, with `profile-fixture.mjs` for isolated homes, bare remotes, process bounds and synthetic gh/git seams.
- Lane cap and save rule: `packages/nana-setup/claude/rules/nana-seat.md`, `packages/nana-setup/tests/seat-rule.test.mjs`, `packages/nana-pack/rules/nana-rulings.md`, `apps/hive/city.json`.
- Contract and generated navigation: `REQUIREMENTS.md`, `packages/nana-pack/README.md`, `docs/requirements-tree.md`, `docs/code-map.md`, and `code-map.config.json` (declare the injectable git runner, following gh-runner's declaration).
- Existing test expectations necessarily changed: `packages/nana-pack/tests/code-map-launch.test.mjs` and `requirements-tree.test.mjs`.

## Every changed row and new test

All new rows are implemented with backticked file-and-title evidence in the ledger. There are no new shared rows.

| Row | Test file | Exact title |
|---|---|---|
| R-3230 | packages/nana-pack/tests/profile-store.test.mjs | a save writes one shape record into the private clone and nowhere else |
| R-3231 | packages/nana-pack/tests/profile-store.test.mjs | only a seat on an enabled machine may write |
| R-3232 | packages/nana-pack/tests/profile-store.test.mjs | trust rises only on the owner words across sessions |
| R-3233 | packages/nana-pack/tests/profile-store.test.mjs | retract and supersede hide the right records |
| R-3234 | packages/nana-pack/tests/profile-store.test.mjs | the pointer is configuration and the push target stays verified private |
| R-3235 | packages/nana-pack/tests/profile-sync.test.mjs | two machines converge without a merge |
| R-3236 | packages/nana-pack/tests/profile-sync.test.mjs | offline contention and a stopped rebase lose nothing |
| R-3237 | packages/nana-pack/tests/profile-store.test.mjs | seal: PROFILE_MEDIUM_SESSIONS is 3 |
| R-3238 | packages/nana-pack/tests/profile-store.test.mjs | seal: PROFILE_SHOW_BUDGET is 4000 |
| R-3239 | packages/nana-pack/tests/profile-store.test.mjs | seal: PROFILE_GIT_TIMEOUT_MS is 15000 |
| R-3240 | packages/nana-pack/tests/profile-store.test.mjs | seal: PROFILE_LOCK_WAIT_MS is 5000 |
| R-3241 | packages/nana-pack/tests/profile-store.test.mjs | seal: PROFILE_LOCK_STALE_MS is 120000 |
| R-3242 | packages/nana-pack/tests/profile-store.test.mjs | seal: PROFILE_PUSH_RETRIES is 1 |
| R-3243 | packages/nana-pack/tests/profile-store.test.mjs | seal: PROFILE_LIMITS |
| R-3244 | packages/nana-pack/tests/profile-store.test.mjs | seal: PROFILE_SESSION_VARIABLES |
| R-3245 | packages/nana-pack/tests/profile-store.test.mjs | seal: PROFILE_STAMP_FORMAT |
| R-3246 | packages/nana-pack/tests/profile-store.test.mjs | seal: PROFILE_PATH_POLICY |
| R-3247 | packages/nana-pack/tests/profile-store.test.mjs | seal: PROFILE_REMOTE_FORMS |
| R-3248 | packages/nana-pack/tests/profile-store.test.mjs | seal: PROFILE_LAYOUT |
| R-3249 | packages/nana-pack/tests/profile-store.test.mjs | seal: PROFILE_WORDS |

R-1140 changes fifteen rules to sixteen, adds the automatic-saving contract, and raises the cap to four building and two planning. Its evidence renames these existing titles:

- `seat guide holds no bullet beyond its fifteen rules` → `seat guide holds no bullet beyond its sixteen rules`.
- `seat guide carries: at most two lanes building and one in planning, each slot defined` → `seat guide carries: at most four lanes building and two in planning, each slot defined`.

The same existing seat test updates the header, count comment, RULE_7 constant and RULES list. The new save bullet is pinned by that list and must-meet 1. No separate new seat test was added.

Two existing tests became false after the required feature/subgroup and helper move:

- `requirements-tree.test.mjs::R-288: all real headings have non-empty purposes`: expected headings 68 → 70.
- `requirements-tree.test.mjs::R-1158: a CRLF ledger gives the same problems and line numbers as its LF copy`: same heading-count update.
- `code-map-launch.test.mjs::R-3156: every fixed-base callee survives or has a named loss reason`: add two loss reasons for roster-set's former bounded-read and json-text imports. Both now live in the shared writer. The reach is still present transitively.

Their requirement rows and titles are unchanged. No test was deleted. No roster test was edited. The runner test was not edited; the new fixture adopted its required shared temp helper and exact import spelling instead.

## Wrong-code pairs and commands

Committed text logs redact home/temp prefixes and trim trailing output whitespace. Test fixture bytes and assertions are unchanged by that log cleanup.

Assertions were never inverted. The wrong implementations broke code:

- Empty profile configuration → all thirteen seal tests fail (`wrong-store.txt`); real sealed configuration → all thirteen pass.
- No-op command returning success without writes → all seven must-meets fail (`wrong-store-commands.txt`, `wrong-sync.txt`); real command → all seven pass in the full suite.
- Old seat guide/cap against the revised existing seat test → red (`wrong-seat.txt`); revised guide → green (`seat-run.txt` and full suite).

The first wrong-code run also exposed a fixture root error and a missing shape file. Those early diagnostics remain in `wrong-store.txt`; they are not claimed as behavioral proof. After correcting the root, the no-op command was run again for the behavioral red pair before enabling the command implementation. The cycle fixture was then corrected to use unretracted cycle records rather than expecting a retracted record to revive. The two-clone test counts eight files and seven logical claims; the plan's phrase “seven saves” conflates the shared claim with its two saves.

| Command | Exit | Record |
|---|---:|---|
| git fetch origin feat/memory-making | 0 | shape provenance below |
| npm run map:impact -- packages/nana-pack/lib/roster-set.mjs | 0 | read before helper move |
| node packages/nana-pack/tests/profile-store.test.mjs (empty config) | 1 | wrong-store.txt |
| node packages/nana-pack/tests/profile-store.test.mjs (no-op CLI) | 1 | wrong-store-commands.txt |
| node packages/nana-pack/tests/profile-sync.test.mjs (no-op CLI) | 1 | wrong-sync.txt |
| node packages/nana-setup/tests/seat-rule.test.mjs (old rule) | 1 | wrong-seat.txt |
| node packages/nana-pack/tests/profile-store.test.mjs (implementation) | 0 | store-run.txt |
| node packages/nana-pack/tests/profile-sync.test.mjs (implementation) | 0 | sync-run.txt |
| node packages/nana-setup/tests/seat-rule.test.mjs | 0 | seat-run.txt |
| npm test -- nana-roster-set pack-config-utf16 nana-roster.test | 0 | roster-run.txt; 32 checks pass |
| npm test -- test-runner.test | 0 | runner-run.txt; fixture import corrected |
| node packages/nana-setup/bin/install-check.mjs | 1 | install-check.txt; inherited lane boundary refused its temp write |
| env -u NANA_WORKTREE_ROOT node packages/nana-setup/bin/install-check.mjs | 0 | install-check-clean.txt; all 18 items pass |
| npm run map | 0 | map-run.txt |
| npm run req:tree | 0 | tree-run.txt; precommit reader-path note disappears once the new file is at HEAD |
| npm run readme:check | 0 | readme-run.txt; 936 claims, 0 problems |
| node scripts/requirements-trace.mjs | 0 | trace-run.txt; 1985 traced, 0 off-form rows |
| node scripts/lane-class.mjs --root . | 0 | class-run.txt; ordinary, same lazy writer reach |
| npm run test:locked (first run) | 1 | full-suite-first.txt; stale heading/edge expectations and fixture cleanup |
| npm run test:locked (second run) | 1 | full-suite-second.txt; fixture used single quotes where the existing source check requires double quotes |
| npm run test:locked (third run, foreground) | 0 | full-suite.txt |
| npm run map:check | 0 | map-check.txt |
| npm run readme:check | 0 | readme-check.txt |
| node scripts/requirements-tree.mjs --root . | 0 | tree-check.txt |
| node scripts/known-bugs.mjs --root . | 0 | known-bugs-check.txt |
| node scripts/identity-scan.mjs | 0 | identity-check.txt |
| checkRepo evidence-title check | 0 | title-check.txt; 0 missing |

Full-suite summary:

```text
244 files: 242 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8785 pass, 0 fail, 44 skip · 626.9s
```

The locked command holds the repository's one machine-wide full-suite lock. No split full run was used. Install-check uses its synthetic runtime, not a real model. The final response reports the last-tip seat checks, branch push, draft PR and finished hosted CI separately.

## Sample run

`sample-run.txt` records `init`, `save`, `sync` and `show` across two temp clones of one local bare remote. The gh answer and GitHub URL observation are stubbed; transport goes only to that bare remote. Both final clone statuses are empty.

```text
clone-a init: profile: initialized
clone-b init: profile: initialized
clone-a save: Saved: Prefer quiet colours (8ed58b115bcca39d266b15b9b648111ef140fb7d55ccd155af5287b939fc8d8d)
clone-b sync: profile: synced
clone-b show: [low 2026-10-31] Prefer quiet colours (8ed58b115bcca39d266b15b9b648111ef140fb7d55ccd155af5287b939fc8d8d)
clone-b save: Saved: Uses metric units (c8e8efbbcf5800f4ddd3aaea79e26091b9e6d3c8339dd2d163f1b6c6e5012350)
clone-a sync: profile: synced
clone-a show: both records, newest first, low trust
Both clone statuses: "" ""
```

## Shape path, precedent and departures

Fetched `origin/feat/memory-making`. Its config file existed (blob `0cde65122558e6e4136c8a0569b22089d91ba3f8`). Copied only its two-line shape field-list block unchanged into the same path here, preceded by the required module header. No extractor constants or code were copied. The seat must reconcile this file when the second lane merges main, as the brief directs.

Every named precedent file was read before design. Imports reuse `piAgentDir`, `readBounded`, `parseJsonBytes`, `ghFromEnvironment`, `ghResult`, `gitCommonDir`, `suiteRecordStamp`, and `releaseLaneLock`. No other private helper moved or was copied.

Departures and reasons:

1. The supplied lane-lock file only exports pid-checked release; it has no acquisition/wait API. The profile imports that release and implements bounded clone-local exclusive acquisition, with old dead-pid eviction.
2. Immutable records use exclusive-create plus fsync, not the handoff's replace-by-rename. Every save/event has a new random path; replacement would violate the append-only contract.
3. Show follows the shared-memory whole-output budget and fold-line contract, but omits whole records rather than copying its private description-shortening function. JSON records have no markdown index descriptions. No private helper was copied or moved.
4. The shape-only upstream block has no exported type, trust, role, source or kind vocabularies. The profile's words are sealed locally until the seat reconciles the lanes. No second field list is defined.
5. The generic profile readme is `readme.md`, not the plan diagram's `README.md`, because every created path must satisfy the lowercase safe-path contract. The content is generic and tracked in the private clone.
6. The artifact registry accepts `<project>/...` for other-project locations and no `cli` maker run. A-090 therefore uses `<project>/records/ and events/` and a reason-bearing `manual` maker describing the seat's automatic, no-approval CLI invocation. This changes registry spelling, not the save trigger. Extending the registry grammar belongs outside this store lane.
7. The brief overrides the plan's wait-for-memory-making order: the shape block was fetched/copied while that lane is building. This lane does not merge the other lane's implementation.

Session provenance: this pi builder shell exposes `PI_SESSION_ID` and `PI_SESSION_FILE`; it does not expose `CLAUDE_SESSION_ID`. Claude seat-shell availability remains inferred. The sealed variable order and local-day fallback deliberately err toward low trust.

The lane-cap grep found no other active cap copy outside the requested files. Historical review/session records were not edited. Unrelated road-lane prose and old parallel-lane research are not capacity policies.

## Not done and open carry

- No real GitHub repository was created or touched for profile data. The seat creates the private repo with the owner after the build/land.
- No startup delivery, startup sync, doctor row, PATH shim, old-entry migration, search cache or pushback probe was added. Those are the plan's later slices.
- No known bug was fixed. No known-bug file was edited, as the builder instructions forbid it.
- The seat still needs the two planned residual lines: honest quote misattribution remains possible despite the ladder and veto line; deliberate record/quote poisoning and a hostile local pointer edit remain outside this threat model.
- Installed Windows copies of the guide stay stale until setup runs. This is existing behavior.
- The seat reconciles the shape/vocabulary and merges this store after memory-making. The current brief authorizes the parallel shape-copy path, not an independent second shape.
- No real model session, subagent, independent reviewer or issue action was launched. Draft-PR creation and finished CI reporting are handled after the checked commit.
