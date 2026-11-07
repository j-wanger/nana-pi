# one-reviewer build evidence

Feature: FEAT-007 · Review a specific revision independently
Branch: feat/one-reviewer
Scope: removal-map group 1 (1a–1d), assumptions A1–A7.

## Change

Every lane gets one reviewer plus CI. The land/checker slots no longer select,
print or launch extra reviewers. Both review launchers refuse `--role land`
before starting any child (git included) or reserving a review. The worker refuses
`--slot checker`, naming `scout, planner or adversary`. Ordinary review and
adversary launches still use their original entries.

Legacy roster keys remain accepted without validation and ignored by active
readers. `set` preserves their raw values, writes absent `land` as null, keeps
unrelated settings, and does not inject absent optional slots. M1 runs the actual
resolver and config from local commit 89afbe55 against both written shapes. The
same Node entry points and fixtures run on Windows CI; this build ran on macOS.

The outside reader now tries a pi scout and then the builder. The legacy land
entry never participates, including when the scout is null or Claude Code.

## Files

Runtime edits:
- `packages/nana-pack/bin/worker-config.mjs`: active slot tables and legacy vocabulary.
- `packages/nana-pack/bin/nana-roster.mjs`: legacy-key tolerance at validation.
- `packages/nana-pack/lib/roster-set.mjs`: backward-compatible writes.
- `packages/nana-pack/lib/roster-notice.mjs`: surviving lineup only.
- `packages/nana-pack/lib/roster-roles.mjs`: adversary/planner lineage pair only.
- `packages/nana-pack/bin/pi-worker.mjs`: checker refusal; no class import or end step.
- `packages/nana-pack/bin/pi-review.mjs`: land refusal; reviewer load-log slot.
- `packages/nana-pack/bin/claude-review.mjs`: land refusal before roster/input/admission work.
- `scripts/outside-reader-config.mjs`: scout, builder order.

Deleted, as named by the plan:
- `scripts/lane-class.mjs`
- `packages/nana-pack/lib/lane-class-config.mjs`
- `packages/nana-pack/lib/mutation-runner.mjs`
- `packages/nana-pack/lib/mutation-runner-config.mjs`
- `packages/nana-pack/tests/lane-class.test.mjs`
- `packages/nana-pack/tests/mutation-runner.test.mjs`
- `packages/nana-pack/tests/mutation-runner-takeover.test.mjs`

Contracts and generated navigation:
- `REQUIREMENTS.md`
- `templates/_shared/working-under-nana-pi.md` (edited first)
- `AGENTS.md` (identical marker copy; project class paragraph removed)
- `packages/nana-setup/claude/rules/nana-soul.md` (shared default and ladder bullets)
- `packages/nana-setup/claude/rules/nana-seat.md`
- `packages/nana-pack/rules/nana-rulings.md`
- `packages/nana-pack/prompts/planner.md`
- `packages/nana-pack/skills/requirements/SKILL.md`
- `packages/nana-pack/README.md`
- `code-map.config.json`
- `docs/components/nana-pi.json`
- `docs/code-map.md`
- `docs/requirements-tree.md`

New tests: `packages/nana-pack/tests/one-reviewer.test.mjs` holds M1–M5,
M7–M8 and the legacy-vocabulary seal. M6 uses the existing outside-reader fixture.
There are eight new must-meet cases and one new sealed-vocabulary case, no others.
Every new async case is awaited under a per-case limit. All fixtures live in OS
temp folders. Fake model executables emit fixed text; no model session runs.

### Existing test edits

Each edit updates an expectation made false by the removal, or the code-map
history check's explicit accounting for deleted sources:

- `packages/nana-pack/tests/nana-roster.test.mjs`: no land/checker default or printed lines;
  reviewer remains required; legacy land fields are ignored; surviving role seal.
- `packages/nana-pack/tests/nana-roster-set.test.mjs`: land is not settable;
  malformed active role replaces malformed checker; no absent optional slots are injected;
  normalized roster no longer injects checker.
- `packages/nana-pack/tests/roster-notice.test.mjs`: land omitted even when null;
  surviving roles follow reviewer; checker lineage diagnostics disappear.
- `packages/nana-pack/tests/worker-claude.test.mjs`: former checker launch/log/Windows
  cleanup cases use planner or adversary; checker and land now refuse with remaining slots;
  lineage cases exercise adversary/planner.
- `packages/nana-pack/tests/context-anatomy.test.mjs`: final/sol review roles both log reviewer,
  rather than launching the removed land role.
- `packages/nana-pack/tests/outside-reader.test.mjs`: fallback fixture and seal use builder,
  not land; adds M6 with exact provider/model/thinking comparisons.
- `packages/nana-pack/tests/build-records.test.mjs`: R-2967 marker replaced by R-3761;
  title and assertion require no lane-class text, including unavailable diagnostics.
- `packages/nana-pack/tests/rulings.test.mjs`: class-guidance check now pins its absence.
- `packages/nana-pack/tests/planner-prompt.test.mjs`: removes the seat-pair instruction pin.
- `packages/nana-pack/tests/templates-render.test.mjs`: extra-reviewer ladder becomes
  one reviewer plus CI; retired seat-land assertion becomes absence; soul matches shared ladder.
- `packages/nana-setup/tests/seat-rule.test.mjs`: exact bullet set replaces two retired
  bullets with one-reviewer-plus-CI; surviving role list/ruling and independent-work wording.
- `packages/nana-pack/tests/code-map-launch.test.mjs`: named loss reasons for removed sources
  and pi-worker's two deleted class edges; unrelated edges remain checked.
- `packages/nana-pack/tests/path-spelling.test.mjs`: comment stops citing the deleted runner test.

No other existing test was deleted. Gate mutation tests remain intact.

## Rows

Added under FEAT-007: R-3757–R-3764, M1–M8 respectively, all implemented.

Retired (46 rows): R-1127, R-1198, R-1230–R-1244, R-1322,
R-1770–R-1779, R-1960, R-2170–R-2172, R-2881–R-2882,
R-2960–R-2969, R-3185, R-3530.

Edited live: R-1101, R-1120–R-1123, R-1126, R-1128, R-1140,
R-1192, R-1194, R-1300, R-2602, R-2953, R-3523, R-3527–R-3529,
R-3534–R-3537, R-3729. Some edits only repair evidence titles.

R-1239 leaves CAP-07's deliverables/maker/reader/parked lines.
A-035 keeps its stable ID as retired. FEAT-031 no longer reads the removed runner.
CAP-02's roster rule now names builder and reviewer only.

## Wrong-code / green pairs

The rows changed first, then the tagged tests, then runtime and rule text.
`checks.log` preserves full sanitized output and exit codes.

| Case | Obvious wrong implementation exercised before the fix | Red | Green |
|---|---|---|---|
| M1 / R-3757 | Old resolver still requires land | FAIL, exit 1 | PASS, exit 0 |
| M1 optional-slot clause | Writer still injects largerBuilder into absent/legacy rosters | FAIL, exit 1 | PASS, exit 0 |
| M2 / R-3758 | Old notice prints land/checker and checker lineage | FAIL, exit 1 | PASS, exit 0 |
| M3 / R-3759 | Both launchers still start and reserve land reviews | FAIL, exit 1 | PASS, exit 0 |
| M4 / R-3760 | Worker still launches checker | FAIL, exit 1 | PASS, exit 0 |
| M5 / R-3761 | Classifier and runner modules still exist | FAIL, exit 1 | PASS, exit 0 |
| M6 / R-3762 | Outside reader still falls through to land | FAIL, exit 1 | PASS, exit 0 |
| M7 / R-3763 | Old role guidance still requires extra reviewers | FAIL, exit 1 | PASS, exit 0 |
| M8 / R-3764 | Old rulings still require independent checks/checker | FAIL, exit 1 | PASS, exit 0 |
| Legacy vocabulary seal | CODE changed from land/checker to land only | FAIL, exit 1 | PASS, exit 0 |

The seal mutation changed code, not an assertion. Its restoration is in the green run.
Early harness mistakes (a helper import, copied-pack layout, and the temp-helper
source-spelling pin) were repaired before the recorded final runs. No assertion was inverted.

## Precedent and removal-map verification

All plan and brief precedents were read before design. Validation follows
`validateRosterShape`'s nullable/optional-slot pattern, with a separate ignored-key
vocabulary rather than leaving retired keys in active worker tables. The writer
still uses `writePackConfigMember`; no write helper was copied. Tests follow the
retirement precedent's bounded, awaited cases and temp fixtures. Existing public
`ledgerRepo`, `gitShow`, `writeFakePi`, `withPathPrepended` and `tmpDir` helpers are imported.

The shared working pattern was edited first, then copied identically into the
AGENTS marker and the matching soul bullets. The new dated rulings replace the
extra-reviewer rulings. The blocking-question sentence stays: group 3 owns it.
Builder wrong-code-first and mutation-proof instructions stay unchanged (A4).

Map corrections and departures:

1. Group 1 omitted `claude-review.mjs` from its code list. M3 requires its early
   refusal too; both launchers were changed and exercised.
2. R-917 no longer cites a mutation-runner test at this branch's starting tip.
   Its existing runner/temp-helper evidence remains valid; no row edit was needed.
3. The fixed-base edge-loss check also pins deleted sources. Its explicit retired-source
   reasons and two worker-edge reasons were added; this dependency was absent from the map.
4. The requirements skill still required the seat to break code for install/hook/gate lanes.
   That group-1 sentence was removed. Its review-ledger/tree-movement text was not changed.
5. The map said to remove A-035 outright. The standing artifact-ID convention retains a
   retired entry instead; no live maker, reader or deliverable points to it.
6. R-1300 and R-2953 were edited, not retired: their one-reviewer and other planner clauses survive.
7. `largerBuilder` is optional too. M1's no-new-optional-slot constraint now prevents injecting
   it into an absent roster or a legacy roster without it. The pre-lane resolver accepts both.
8. The soul's retired seat-land bullet was replaced with the shared review-ladder bullet,
   so both its statement of the new ladder and R-1128's byte-equal copy remain checkable.

Other group-1 code, rule, fixture, row and generator references were verified.
Legacy `land: null` install-check and launcher fixtures were intentionally kept:
the accepted legacy keys make those fixtures valid without unrelated churn.
Historical seat tables remain untouched and dead under A6.

## Known-bug clauses closed by removal

Known-bug files stay untouched as required. These are closures by retiring the
named machine, not repairs to its implementation. Mixed lines retain their other
clauses; no unrelated known bug is claimed fixed. FEAT-007 and FEAT-031 were read
in full, including the part omitted from the launch brief.

| Source | Clause made inactive |
|---|---|
| docs/known-bugs/FEAT-001.md:14 | Runner tally double-count of unreached named checks. |
| docs/known-bugs/FEAT-007.md:39 | Runner cannot judge Windows pairs with missing npm fixture env. |
| docs/known-bugs/FEAT-007.md:54 | Historical Windows pair script has a stale anchor (all such tables are now dead under A6). |
| docs/known-bugs/FEAT-007.md:92 | A Claude land-model launcher is no longer wanted; second-opinion and PowerShell limits remain. |
| docs/known-bugs/FEAT-013.md:24 | Runner cleanup flake and left worktree entry. |
| docs/known-bugs/FEAT-013.md:34 | Runner's direct-node console-code-page difference. |
| docs/known-bugs/FEAT-013.md:149 | Runner contention-probe overlap attribution. |
| docs/known-bugs/FEAT-015.md:121 | Runner mistakes closing tallies for individual checks. |
| docs/known-bugs/FEAT-019.md:18 | Runner contention check's pool slowdown only; other checks remain. |
| docs/known-bugs/FEAT-029.md:46 | Classifier misses extensions declared by another package manifest. |
| docs/known-bugs/FEAT-029.md:47 | Classifier reads manifests before matching prefixes. |
| docs/known-bugs/FEAT-029.md:48 | Retired class-guidance test matched outside the project section. |
| docs/known-bugs/FEAT-029.md:49 | Classifier overclasses install-check/project-only work. |
| docs/known-bugs/FEAT-029.md:50 | Retired worker-class check cannot distinguish forced failure. |
| docs/known-bugs/FEAT-029.md:61 | Classifier's import-only graph reader only; other graph readers remain. |
| docs/known-bugs/FEAT-031.md:10 | Runner's unrun checks, hard-stop residue, config typing, git hangs and duplicate primitives. |
| docs/known-bugs/FEAT-031.md:11 | Runner cleanup flake. |
| docs/known-bugs/FEAT-031.md:27 | Locked scratch worktree contradicts cleanup promise. |
| docs/known-bugs/FEAT-031.md:28 | Unmeasured cleanup retry bounds. |
| docs/known-bugs/FEAT-031.md:29 | Missing worktree-folder record leaves git metadata. |
| docs/known-bugs/FEAT-031.md:30 | Held scratch folder remains after retries. |
| docs/known-bugs/FEAT-031.md:40 | Contention check times out on a slower runner. |
| docs/known-bugs/FEAT-031.md:41 | Missing killed-worker takeover observation. |
| docs/known-bugs/FEAT-031.md:42 | Lock release error hides original work error. |
| docs/known-bugs/FEAT-031.md:43 | Incomplete release-error coverage. |
| docs/known-bugs/FEAT-031.md:44 | Inline wait/release default can escape checks. |
| docs/known-bugs/FEAT-031.md:45 | Timed-out contention can misattribute an overlap. |
| docs/known-bugs/FEAT-031.md:46 | Unnamed ownership-check child timer. |
| docs/known-bugs/FEAT-031.md:47 | Five-minute release blocks signals. |
| docs/known-bugs/FEAT-031.md:51 | Two-kill takeover race residual. |
| docs/known-bugs/FEAT-031.md:52 | Wait line can name the dead owner, not takeover holder. |
| docs/known-bugs/FEAT-031.md:53 | Takeover release can outlive acquisition wait. |
| docs/known-bugs/FEAT-031.md:55 | Starting-step stall can break the probe's initial lock. |
| docs/known-bugs/FEAT-031.md:56 | Empty overlap marker gives no holder detail. |
| docs/known-bugs/FEAT-031.md:108 | Runner inherits CLAUDE_CONFIG_DIR. |
| docs/known-bugs/FEAT-031.md:116 | Retired R-1779 child guard lacks late-start case. |
| docs/known-bugs/FEAT-031.md:118 | Retired runner's exited-pid checks only; other tests remain. |
| docs/known-bugs/FEAT-031.md:121 | Retired runner's pool slowdown only; other timing costs remain. |
| docs/known-bugs/FEAT-031.md:136 | Stagger check inherits a short exported stagger. |
| docs/known-bugs/FEAT-031.md:137 | Slow worktree add can mask missing stagger. |
| docs/known-bugs/FEAT-031.md:138 | Slow shard setup can fail stagger check. |
| docs/known-bugs/FEAT-033.md:12 | Runner's duplicate transient-code list. |
| docs/known-bugs/FEAT-033.md:22 | Retired runner-config's process-tree re-export note. |
| docs/known-bugs/FEAT-041.md:22 | Checker/builder lineage blind spot. |
| docs/known-bugs/unplaced.md:29 | Runner killed-shard cleanup flake only; objective-platform clauses remain. |

Other review launcher, ledger, verdict, cost, movement, cap and keep bugs remain
out of scope. The old-checkout refusal for explicitly written active role slots
also remains; only legacy land/checker acceptance and compatible default writes changed.

## Checks

Before commit: map impact, then the required generator/check commands and filtered tests.
After commit: rerun the same required seat checks on the reported full tip.
The final response records their exit codes and tip; no push or CI read occurs here.

Commands (all green checks exit 0):

```
npm run map
npm run map:check
npm run req:tree
npm run readme:check
node scripts/requirements-tree.mjs --root .
node scripts/component-audit.mjs --check
node scripts/requirements-trace.mjs
node scripts/test.mjs --jobs=4 one-reviewer.test.mjs outside-reader.test.mjs nana-roster.test.mjs nana-roster-set.test.mjs roster-notice.test.mjs seat-rule.test.mjs worker-claude.test.mjs context-anatomy.test.mjs build-records.test.mjs rulings.test.mjs planner-prompt.test.mjs templates-render.test.mjs path-spelling.test.mjs code-map-launch.test.mjs code-map.test.mjs component-audit.test.mjs requirements-trace.test.mjs requirements-tree.test.mjs readme-check.test.mjs test-runner worker-lane.test.mjs immutable-review.test.mjs claude-review.test.mjs win32-launch.test.mjs roster-notice-hook.test.mjs rulings-install.test.mjs project-working-region.test.mjs pack-config-utf16.test.mjs code-search.test.mjs
```

Precommit result: 30 files: 30 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 836 pass, 0 fail, 13 skip.

The `test-runner` filter runs both runner files. The selected files include every
changed surviving test, all consumers of deleted dependencies, and nearby launch,
install-copy and contract checks. These are path-filtered runs; CI covers the full
suite under AGENTS.md. No unlocked full suite was run.

## Not done

No push, CI read, GitHub issue, model session, installed-machine refresh, or land.
No live install-check: that instrument launches model turns; the seat runs it before land.
Windows-specific execution waits for the seat's CI run; these tests keep their native Windows forms.
Review-ledger, review-round caps, tree movement, nana-land, ask machinery, HANDOFF,
session archives and known-bug files were not edited.
Open questions: none.
