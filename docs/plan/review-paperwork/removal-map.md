# Removal map for the three lane-process cuts (nana-pi, read-only scout)

All paths are relative to the repo root. I left out `docs/reviews/`, `docs/sessions/`, `research/` and `apps/bench/studies/`. Anything marked **(inferred)** is my reading, not something I confirmed in code.

## Couplings that change the plan

1. **`claude-review` needs `review-ledger run`.** `claude-review.mjs:40` sets `LEDGER = ./review-ledger.mjs`, and lines 98–129 launch `review-ledger run` as the child. That run path is what records the verdict, holds the round reservation, seals the Claude settings and resolves the launch (`review-ledger.mjs:149–235`). You can't delete the file outright. Its `run` logic has to move into `claude-review.mjs` or a new `lib/` module. Only `keep`, `check` and `report` (lines 62–148) are pure paperwork.
2. **nana-land reads the round ledger, not the review-ledger CLI.** It imports `canonicalItem`, `reviewTextEvidence`, `withReviewLedgerLock` and `repoKeyOf` from `review-round.mjs` (`nana-land.mjs:16`). The `~/.pi/agent/review-ledger.*` files are that store, and they must stay. Renaming them would orphan every recorded LAND verdict. **Keep `review-round.mjs`; only cut its cap.**
3. **Roster validation is strict about slots.**
   - `ROSTER_SLOTS = ['scout','builder','reviewer','land']` (`worker-config.mjs:44`). `validateRosterShape` refuses a roster missing `land` (`nana-roster.mjs:113–114`) and refuses unknown keys (lines 115–117).
   - If you simply drop `land` and `checker`, every machine whose `nana-pack.json` still holds those keys gets "unexpected field". That roster refusal breaks pi-worker, claude-review, the roster notice, visual-reader and outside-reader.
   - The reverse also breaks: once `roster-set.mjs:76` stops writing `land`, any older checkout reading that file refuses it as "missing land". README:832 already documents this kind of cross-checkout refusal for the checker.
   - **Recommendation:** accept and ignore `land` and `checker` as legacy keys.
4. **outside-reader (a KEEP) picks its model from the `land` slot.** `scripts/outside-reader-config.mjs:27` has `ROSTER_SLOT_ORDER = ["scout","land","builder"]`, used at `scripts/outside-reader.mjs:96`. `tests/outside-reader.test.mjs:38,130,157` pins it.
5. **`scripts/requirements-moved.mjs` is also a library.** It exports `defaultGit` and `MAX_GIT_BUFFER`, which these import:
   - `scripts/blast-radius.mjs:27`
   - `scripts/component-audit.mjs:16`
   - `scripts/deliverables.mjs:16`
   - `scripts/product-report.mjs:27`
   - `scripts/lane-class.mjs:16` (also being cut)

   Several tests copy it as a dependency: `requirements-tree.test.mjs:481`, `requirements-regroup.test.mjs:212`, `linked-launch.test.mjs:71–73` (R-1630), and `product-report.test.mjs:24`. `scripts/first-look-config.mjs:16` lists it in `PAGE_SHAPING_PATHS`, pinned by `first-look.test.mjs:115`. So either keep the helper exports in a small module or move them, for example into `deliverables.mjs` or a new `scripts/git-runner.mjs`.
6. **The known-bug section for reviewers is keyed off tree movement.** `reviewKnownBugSection(root, movement, brief)` (`lib/known-bug-digest.mjs:40–48`) takes feature IDs from the movement text and falls back to the brief's `Feature:` line. After the cut, pass `null` (brief only). Row R-3214 (REQUIREMENTS.md:354) says "movement features … or otherwise the brief", so reword it.
7. **The memory factory reads the per-lane review folders.** `lib/memory-run.mjs:63–85` and `lib/memory-making.mjs:119–140` (`reviewUnits`) turn MUST titles in committed `docs/reviews/<lane>-<date>/*.md` into memory. The lane-folder pattern is `memory-run-config.mjs:42–43`. nana-land starts it after each land (`nana-land.mjs:493–506`). The texts it reads are the `r<n>-<role>-<hash>.md` files that `review-ledger keep` wrote. Without `keep` and a required folder, it degrades quietly (`existsSync`) and stops learning from reviews **(inferred)**. Rows R-3293 (:629) and R-3342 (:648) assume the folders exist.
8. **Ask labels are shared by the frontier, the product report and HANDOFF.**
   - `lib/handoff-issues.mjs:54–56` filters issues on labels `ask`, `next`, `blocking`, `optional` and `parked`.
   - The same vocabulary drives `lib/handoff-asks.mjs:11–12`, `lib/frontier-summary.mjs:59–127`, `lib/frontier-check.mjs:88`, `scripts/product-report.mjs:19–20,79,684,970–1000` and `lib/frontier-summary-config.mjs:30`.
   - The live HANDOFF.md (lines 23–25) points its open questions at issues labelled `ask`.
   - HANDOFF and issue watch are KEEP. I therefore scoped group 3 to the *plan-question* rule only (seat guide lines 21–22), not the general ask labels. Cutting the labels everywhere is a much larger change; see the end of group 3.
9. **`docs/sessions` is part of project scaffolding and adoption detection, not only notes.** That covers `nana-setup project` seeds (`packages/nana-setup/lib/project.mjs:125–131`, `lib/project-rows.mjs:89–104`) and `copier.yml:17`. Adoption's "complete Nana structure" also counts it (`bin/nana-adoption.mjs:64,74`, `lib/adoption.mjs`, `extensions/nana-handoff.ts:54`). See group 3.

---

## Group 1: extra reviewers

### 1a. Land reviewer (`--role land`, roster `land`, `land: seat`)

**Code**
- `packages/nana-pack/bin/worker-config.mjs`:
  - :42–45: `land` in `ROSTER_SLOTS` and `NULLABLE_SLOTS`
  - :59: `SLOT_PRINT_ORDER`
  - :63: `SLOT_NULL_TOKENS.land:'seat'`
  - :139, :147: `ROSTER_DEFAULTS.land`, and the comment saying reviewer and land carry no thinking
- `packages/nana-pack/bin/nana-roster.mjs:75,110–124`: required/nullable slot validation (see coupling 3).
- `packages/nana-pack/lib/roster-set.mjs:76`: `writeSlots` includes `'land'`.
- `packages/nana-pack/lib/roster-notice.mjs:46`: the `land <entry|seat>` segment. Also used through `extensions/nana-roster-notice.ts` and `packages/nana-setup/claude/hooks/nana-roster-notice.mjs`.
- `packages/nana-pack/bin/pi-review.mjs:245`: `slot: optionValue('--role')==='land' ? 'land' : 'reviewer'` becomes `'reviewer'`.
- `packages/nana-pack/bin/pi-worker.mjs:116`: refusal text mentions `role === 'land' ? 'nana-land'`.
- `scripts/outside-reader-config.mjs:27`: see coupling 4.
- `packages/nana-setup/lib/install-check-config.mjs:155`: fixture roster has `land: null`. It only needs editing if `land` becomes an unexpected key.

**Tests (edit, don't delete)**
- `tests/nana-roster.test.mjs`: 36, 74–93, 131 ("missing slot land"), 209, 382–386, 414
- `tests/nana-roster-set.test.mjs`: 38, 71, 79, 129–130, 296
- `tests/roster-notice.test.mjs`: 61, 72, 152 (R-1198)
- `tests/context-anatomy.test.mjs:358–364`: loop over role `land`/`sol` (R-3729)
- `tests/outside-reader.test.mjs`: 38, 130, 157
- `tests/worker-claude.test.mjs:975`: `['land',[],'nana-land']` refusal case
- `packages/nana-setup/tests/seat-rule.test.mjs:47` `LAND_RULE` and :52 `RULES` array (bullet count)
- Roster fixtures with `land: null` need editing only if `land` becomes unexpected:
  - `build-records.test.mjs:164,191`
  - `leak-scan.test.mjs:179`
  - `worker-lane.test.mjs:489`
  - `credential-strip.test.mjs:86`
  - `builder-context.test.mjs:61`
  - `context-anatomy.test.mjs:34`
  - `pack-config-utf16.test.mjs:86`
  - `claude-review.test.mjs:50`
  - `worker-claude.test.mjs:96`
  - `lane-class.test.mjs:91`
  - `nana-setup/tests/install-check.test.mjs:1795`

**Rule and prompt text**
- `packages/nana-setup/claude/rules/nana-seat.md:15`: "Land reviews through `pi-review` pass `--role land`…" (delete).
- "Seat land review" bullet, delete in all three:
  - `templates/_shared/working-under-nana-pi.md:32`
  - `AGENTS.md:100`
  - `packages/nana-setup/claude/rules/nana-soul.md:49`
- "The builder, reviewer and land models come from this machine's roster", edit in all three:
  - `templates/_shared/working-under-nana-pi.md:31`
  - `AGENTS.md:99`
  - `nana-soul.md:48`
- Review ladder, which names "the land reviewer", edit in both:
  - `templates/_shared/working-under-nana-pi.md:27`
  - `AGENTS.md:95`
- `packages/nana-pack/README.md`:
  - :644 ("a Claude land model")
  - :820 (`land` may be null)
  - :823 (example roster)
  - :1175 (notice "follow land")

**REQUIREMENTS.md (retire or edit)**
- Retire R-1127 (:1929, FEAT-014) and R-1198 (:2481, FEAT-023).
- Edit:
  - R-1126 (:1928, "land models")
  - R-1120 (:877, default roster includes land astra)
  - R-1121, R-1122, R-1123, R-1192 (:878–881, slot lists)
  - R-1194 (:2477)
  - R-3534 (:366, "old five-slot shape")
  - R-3729 (:361, "slot land for role land")
- CAP-02 `Read by: R-1400 · rule: …reviewer and land models…` (:793): edit.

**Checkers that pin the text**
- `templates-render.test.mjs:572–576` (R-1127) and :578–586 (R-1128: nana-soul must carry the shared "Seat land review" bullet; `Boolean(seatLandBullet)` fails once it's gone).
- `seat-rule.test.mjs:47,52,61` (exact bullet set, R-1140).

### 1b. Independent checker (roster `checker` slot, "one independent check")

**Code**
- `worker-config.mjs`:
  - :48 `OPTIONAL_SLOTS` includes `'checker'`
  - :52 `CLAUDE_CODE_SLOTS`
  - :59 print order
  - :61 `ROLE_FALLBACKS.checker:'builder'`
  - :150 default
- `lib/roster-roles.mjs:24`: checker/reviewer lineage pair (delete the pair; keep adversary/planner).
- `lib/roster-notice.mjs:48`: `['planner','adversary','checker']` loop.
- `bin/pi-worker.mjs:116`: slot list text ("scout, planner, adversary or checker").

**Tests (edit)**
- `worker-claude.test.mjs`: 966, 981–1021 (checker role-launch cases; switch to adversary or planner)
- `nana-roster.test.mjs`: 386, 414
- `nana-roster-set.test.mjs`: 281–308
- `seat-rule.test.mjs:128–135`: MM9 requires `'checker'` in the seat guide, the shared pattern and AGENTS, and requires the ruling text "…scout, planner, adversary and checker…"

**Rule text**
- `nana-seat.md:6`: "…planner, adversary and checker…" and "…a checker once per install, hook or gate lane".
- "Start scout …, planner, adversary and checker" in all three:
  - `templates/_shared/working-under-nana-pi.md:31`
  - `AGENTS.md:99`
  - `nana-soul.md:48`
- `packages/nana-pack/rules/nana-rulings.md`:
  - :20 "Each install, hook or gate lane gets one independent check…" (replace the ruling)
  - :31 2026-11-02 ruling naming the checker slot (replace). Line 21 says a new ruling removes the one it replaces.
- README:778, :832, :834.

**REQUIREMENTS.md**
- Edit:
  - R-3535 (:367)
  - R-3529 (:371, checker/reviewer pair)
  - R-3537 (:373, fallback map)
  - R-3536 (:372, "four role slots")
  - R-1121, R-1123, R-1192
  - R-1194 (checker listed)
- R-1300 (:1924) is covered under 1c.

### 1c. Seat wrong-code pairs and the mutation runner

The "mutation runner" is **`packages/nana-pack/lib/mutation-runner.mjs`** (856 lines) plus **`lib/mutation-runner-config.mjs`** (135 lines). There is **no npm script and no CI step**. Each lane's table is `docs/reviews/<lane>-<date>/seat-mutate.mjs`, run by hand with `SEAT_MUTATE_*` env vars (README:1104–1161). 145 historical tables import the lib. They sit outside the code-map roots and the suite, so they would only become dead scripts.

**Code (delete)**
- `lib/mutation-runner.mjs`, `lib/mutation-runner-config.mjs`. There is no runtime importer outside tests.
- `code-map.config.json:59` and `:69`: `launchAlwaysRun` entries for the lib and its test. `code-map.mjs:61` reports a stale entry as a problem, so `map:check` fails if they stay.

**Tests**
- Delete:
  - `tests/mutation-runner.test.mjs`
  - `tests/mutation-runner-takeover.test.mjs`
- Keep `gate-survives-mutation.test.mjs`. It tests the gate, not the runner.
- Edit:
  - `tests/path-spelling.test.mjs:28` (comment only)
  - `seat-rule.test.mjs:33,75,77` (RULE_5) and :38 (RULE_9 "a long mutation run in parts")
  - `planner-prompt.test.mjs:77` (R-2953 sentence)

**Rule and prompt text**
- `nana-seat.md:16`: "re-run the lane's mutation runner…" (delete).
- `nana-seat.md:18`: "a long mutation run in parts" (edit).
- `packages/nana-pack/prompts/planner.md:27`: "The seat's wrong-code pairs belong to install, hook or gate lanes." (delete).
- Review ladder "the seat's wrong-code pairs", edit in both:
  - `templates/_shared/working-under-nana-pi.md:27`
  - `AGENTS.md:95`
- `prompts/builder-preamble.md`:
  - :22–23 ("Wrong code first", "Mutation proof"). These are the builder's own test discipline, not the seat's pairs. **Keep (inferred).**
  - :40 "mutation pairs" in the report shape: optional edit.
- README §"Seat mutation runner" :1104–1161: delete.

**REQUIREMENTS.md (FEAT-031)**
- Retire:
  - R-1230 to R-1244 (:3047–3061)
  - R-1322 (:3082)
  - R-1770 to R-1779 (:3096–3105)
  - R-1960, R-2170, R-2171, R-2172 (:3119–3122)
  - R-2881, R-2882 (:3136–3137)
  - R-3530 (:3147)
- FEAT-031 header: remove `Artifact: A-035` (:2987) and `mutation-runner.mjs` from `Reads: A-009` (:2988).
- CAP-07: drop R-1239 from `Deliverables:` (:2636) and remove its Made by / Read by / Parked lines (:2656–2658). `requirements-tree.mjs:269–273` refuses a retired row on a Deliverables line.
- Retire R-2953 (:833, FEAT-006) or reword it without the wrong-code clause.
- Retire R-1300 (:1924) or reword it to "every lane gets one final reviewer".
- R-917 (:3039): its evidence includes the mutation-runner test; re-point it.

**Known-bug files:** `docs/known-bugs/FEAT-031.md` has 25 matching lines; FEAT-013, FEAT-015, FEAT-019, FEAT-033 and `unplaced.md` have a few each.

### 1d. Lane class

**Code (delete)**
- `scripts/lane-class.mjs` (121 lines; imports `blast-radius` and `requirements-moved`).
- `packages/nana-pack/lib/lane-class-config.mjs` (42 lines).

**Code (edit)**
- `bin/pi-worker.mjs`:
  - :42 (import)
  - :394–409 (the `laneMode && buildEndKept` block that spawns lane-class and prints the class or "lane class unavailable")
- `docs/components/nana-pi.json:93`: `scripts/lane-class.mjs` listed as a part. `component-audit.mjs:88–89` refuses untracked cited paths.

**Tests**
- Delete `tests/lane-class.test.mjs`.
- Edit:
  - `build-records.test.mjs:313` (asserts no "lane class:" text; reword)
  - `rulings.test.mjs:296–301` (R-2969 requires the AGENTS.md lane-class sentence)
  - `ask-shape.test.mjs:51` (fixture prose only; leave)

**Rule text**
- `AGENTS.md:106`: the whole paragraph "In nana-pi, the lane class is what `node scripts/lane-class.mjs` prints…" (delete).
- "Their briefs state the threat model and lane class" in both:
  - `templates/_shared/working-under-nana-pi.md:29`
  - `AGENTS.md:97`
- `packages/nana-pack/README.md:613` (same phrase) and `:774` (`node scripts/lane-class.mjs`).
- The install/hook/gate definition sentence in the Review ladder (template :27 / AGENTS :95) goes with the ladder rewrite.

**REQUIREMENTS.md (FEAT-029)**
- Retire R-2960 to R-2969 (:2899–2908) and R-3185 (:3001).
- R-3527 (:369, FEAT-041) mentions "printing a lane class": edit.

---

## Group 2: review paperwork

### 2a. `review-ledger` (`bin/review-ledger.mjs`, `keep`)

**Code**
- `bin/review-ledger.mjs` (235 lines):
  - :62–123 `keep` (delete)
  - :124–139 `report` (delete; R-970)
  - :141–148 `check` (delete)
  - :149–235 `run` (move into claude-review; coupling 1)
- Its imports `reviewLaunch`, the Claude settings sealing, `startLaneWatcher`, `complete` and `admit` go with the move.
- `packages/nana-pack/package.json:10`: delete the `"review-ledger"` bin entry.
- `bin/claude-review.mjs`:
  - :4–8 header
  - :39–42 `--over-cap`
  - :40 `LEDGER`
  - :98–129: replace the spawn of review-ledger with an in-process admit, spawn and complete
- `bin/review-round.mjs`: `KEEP_NAME_HASH_CHARS` (:86) and `KEEP_MOVEMENT_FILE_NAME` (:88) are only for `keep`; delete.
- `code-map.config.json:55`: the `launchAlwaysRun` entry for review-ledger.mjs. Move it to whichever module now spawns the reviewer command.
- `readme-check.config.json:224,228`: `review-ledger.lock` and `review-ledger.reservations` stay, because the store names stay.
- `docs/components/nana-pi.json:394`: part list.
- `.github/workflows/ci.yml:76`: comment-only provenance ("review-ledger's projected 412 s"); optional refresh.
- `packages/nana-pack/lib/test-runner-config.mjs:66`: `RUN_ALONE` names `tests/review-ledger.test.mjs`. R-1474 requires every listed file to exist, so remove or rename the entry when that test goes.

**Tests**
- Delete only after porting the ledger-store cases that nana-land still relies on (reservations, verified verdicts, kept text R-2568 and so on):
  - `tests/review-ledger.test.mjs` (rows R-623, R-700, R-714, R-716, R-717, R-729, R-837, R-3455)
  - `tests/review-ledger-launch.test.mjs`
  - `tests/review-ledger-state.test.mjs`
  - `tests/review-ledger-verdicts.test.mjs`
  - `tests/review-ledger-fixture.mjs`

  These drive the retained `review-round` logic through the `run` CLI. The keep-only cases R-2573 and R-2574 can go.
- Delete `tests/keep-movement.test.mjs` (R-2574, R-2910 to R-2913).
- Edit (they use `review-ledger run` as a harness):
  - `credential-strip.test.mjs:129–133`
  - `win32-launch.test.mjs:30,164–165,317–341`
  - `review-timeline.test.mjs:30,78`
  - `path-spelling.test.mjs:23,143–182,241,353`
  - `code-map-launch.test.mjs:154–157` (pinned edges naming review-ledger.test.mjs)
  - `brief-check.test.mjs:155` (fixture string only)
  - `claude-review.test.mjs` throughout, because claude-review's exit status passes through from the ledger (R-2565)

**Rule text**
- Land checklist "run `review-ledger keep --item <slug> --into <lane-review-folder> --repo <path>` with each fix commit and once before the final round…", delete in both:
  - `templates/_shared/working-under-nana-pi.md:30`
  - `AGENTS.md:98`
- `AGENTS.md:18`: bin list names `review-ledger`.
- `packages/nana-pack/README.md`:
  - :9 (keep starts requirements-moved)
  - :613 ("`review-ledger run` wraps any other launcher")
  - :629
  - :651–690 (run/check/report/keep usage)
  - :845
  - :866–868
  - :898
  - :908 (test list)
  - :1616

**REQUIREMENTS.md (FEAT-007)**
- Retire:
  - R-2573, R-2574 (:1155–1156)
  - R-2910 to R-2913 (:1159–1162)
  - R-726 (:1024, check)
  - R-970 (:1145, report)
  - R-729 (:1025)
  - R-1620 (:1112)
  - R-3455 (:3146)
- Re-scope R-971 (:1026), R-1350 and R-1351 (:1136–1137), and R-3661 (:887) from "review-ledger run" to claude-review.
- R-2560 and R-2565 (:1059, :1064): claude-review "runs review-ledger run" / "exits with review-ledger's status"; reword.
- R-2603 (:867): evidence lives in review-ledger-launch; re-point it.
- CAP-02 `Made by: R-1008` (:795) names `review-ledger.mjs`: edit.
- FEAT-007 header: retire Artifact A-057 and its Parked line (:967–968).

### 2b. Tree-movement page

**Code**
- `scripts/requirements-moved.mjs` (337 lines): delete the CLI and `treeMovement`, but rehome `defaultGit` and `MAX_GIT_BUFFER` first (coupling 5).
- `lib/review-movement.mjs` and `lib/review-movement-config.mjs`: delete.
- `bin/pi-review.mjs`:
  - :8–11 header
  - :39–40 imports
  - :88 `movementFolder`
  - :192–202
  - :233–241 (`reviewKnownBugSection(tempRoot, movement, …)` becomes `null`; `movementFolder ??=` reused for the known-bugs file at :236, so keep a temp folder for that)
  - :249 (movement prompt argument)
  - :276–279 cleanup
- `bin/claude-review.mjs`:
  - :5,7 header
  - :18 import
  - :94–96 (movement in the prompt)
  - :122 (movement context part)
- `bin/review-round.mjs:88`: `KEEP_MOVEMENT_FILE_NAME`.
- `lib/memory-making-config.mjs`: `REVIEW_EXCLUDE` includes `^tree-movement\.md$`, sealed by `memory-making.test.mjs:223` (R-3206). That exclusion is harmless to keep.
- `scripts/first-look-config.mjs:16`; `docs/components/nana-pi.json:444`.

**Tests**
- Delete:
  - `tests/requirements-moved.test.mjs`
  - `tests/review-movement.test.mjs`
  - `tests/keep-movement.test.mjs`
- Edit:
  - `immutable-review.test.mjs:18,198,426–450` (R-2901, R-2904, R-2907, R-2908)
  - `claude-review.test.mjs:16–18,326–370` (R-2900, R-2903, R-2906)
  - `review-standard.test.mjs:4,53` (copies review-movement into its temp pack)
  - `tests/ledger-repo.mjs:13,74` (movement config imports)
  - `linked-launch.test.mjs:71–73` (R-1630)
  - `first-look.test.mjs:115`
  - `requirements-tree.test.mjs:481`
  - `requirements-regroup.test.mjs:212`
  - `blast-radius.test.mjs:93` (comment)
  - `product-report.test.mjs:24`
  - `context-anatomy.test.mjs` (movement part names) **(inferred)**

**Rule text**
- `AGENTS.md:161` (project section "The tree in briefs, reviews and lands"): "pi-review and claude-review add the tree movement … The seat's land report points the owner to the lane folder's tree-movement.md, which review-ledger keep writes…" (delete those two sentences).
- `packages/nana-pack/skills/requirements/SKILL.md:142`: same two sentences.
- Root `README.md:107`: the `requirements-moved.mjs` command line.
- `packages/nana-pack/README.md:9, 612, 629`.

**REQUIREMENTS.md**
- Retire:
  - R-1460 to R-1463 (:2760–2763), R-1630 (:2764)
  - R-2447 (:2698), R-2540 (:2705), R-2643 (:2710), R-2786 (:2719), R-2797 (:2723), R-2837 (:2730)
  - R-2900 to R-2908 (:1089–1097)
- Reword R-2561 (:1060) and R-3214 (:354).
- CAP-07: drop R-1460 from `Deliverables:` (:2636) and its Made by / Read by lines (:2640–2642).
- FEAT-028 `Reads: A-015` (:2671): drop requirements-moved.mjs.

### 2c. Round caps (three rounds, over-cap)

**Code (`bin/review-round.mjs`)**
- :20–21 header comment
- :74 `REVIEW_ROUND_CAP`
- :130–138 `roundsUsed` / `roundCapVerdict`
- :140–147 deprecated `roundFromOutPath` (kept only for the external `~/nana-agent-loop` forwarder; external coupling)
- :622–639 `decide` (keep the ledger-path checks and the "in flight" accounting; drop the verdict)
- :651, 661 `overCap` parsing
- :749–752 `REQUIRED`/`REFUSE` text
- :765–768, 771, 774–776 (override audit, OVER CAP note)
- :785–800 `project()` (only callers: claude-review preflight :102–103 and the review-ledger `check`)
- :847–848 (`overCap` fields in the tally and audit)
- :855–861 (the "N of 3 rounds remain" in the unread message, R-1623)

**Other code**
- `bin/pi-review.mjs:6,23,56,74–75`: `--over-cap` in the usage text.
- `bin/claude-review.mjs:39,42,101–103`.
- `bin/pi-worker.mjs:50`: refuses `--over-cap` among the review flags (R-2691); drop that flag from the list.
- `bin/review-timeline.mjs:118`: "over cap" mark (R-1563).

**Tests**
- `review-round.test.mjs:31–33`: cap verdict cases; delete those checks.
- `review-ledger-launch` (R-840, R-841): goes with 2a.
- `review-ledger-state.test.mjs:674`: goes with 2a.
- `claude-review.test.mjs:260` (R-2566 over-cap reason).
- `review-timeline.test.mjs:304–318`.
- `worker-claude.test.mjs:530` (`--over-cap` refusal).

**Rule text**
- `OBJECTIVE.md:14` and `templates/_shared/OBJECTIVE.md:24`: "Review rounds are capped at three per item…". The umbrella `~/nana-agent-loop/OBJECTIVE.md` is outside this repo.
- Review ladder "Maximum three rounds per item", in both:
  - `templates/_shared/working-under-nana-pi.md:27`
  - `AGENTS.md:95`

  This is pinned by `templates-render.test.mjs:559` (`"three rounds"`, R-683).
- Land checklist "For a confirmation round over cap, use the standard reason: …", in both:
  - template :30
  - AGENTS :98
- `packages/nana-pack/README.md:530–533, 578–582, 866–868`.

**REQUIREMENTS.md (FEAT-007 SUB-007, :1005–1028)**
- Retire R-719, R-840, R-841, R-720, R-842 (:1019–1023).
- Edit:
  - R-192 (:1010, "round-cap ledger")
  - R-1623 (:1115)
  - R-1563 (:1163)
  - R-2566 (:1065)
  - R-2691 (:933)
- Keep R-707, R-834, R-711, R-850, R-714, R-715, R-837, R-716 and R-972. The reservation "in flight" check in nana-land needs them; consider rewording "round" to "review".

### 2d. Per-lane review folder as a required artifact, and the nana-land simplification

**nana-land today, against "LAND covers this tip + CI passed + clean merge":**
- Keep:
  - :205–212 (reviewed pairs)
  - :219–220 (verified v2 LAND for sha/item)
  - :237–240 (non-LAND verdict on the same sha; review in flight)
  - :245–249 (uncovered commits)
  - :250–332 (clean merge and CI)
- Cut, as review paperwork:
  - :215, :221–236: kept-text evidence and "relied on" (R-2571, R-2572)
  - :363–373: "earlier kept review text … not in the tip's tree" note (R-2576)
  - :406: "review text relied on" lines
- **Decision needed:** the local-suite fallback (:333–348, `--suite`) goes beyond "CI passed". It feeds the runtime map, product report and suite records (CAP-07 R-1014, R-1272, R-2547). I'd leave it out of this cut **(inferred)**.

**Tests:** `land-merge.test.mjs:87–104` (R-2576) and the R-2571/R-2572 checks; `land.test.mjs:161–349` (writes the tally directly; fine).

**Rule text**
- "Review corpus: `docs/reviews/<lane>-<date>/`", in both:
  - `templates/_shared/working-under-nana-pi.md:26`
  - `AGENTS.md:94`

  Pinned by `templates-render.test.mjs:559`.
- `AGENTS.md:44`: describes review corpora (informational).
- The seat-land path (1a) and the keep line (2a) are the other places that make the folder required.

**REQUIREMENTS.md:** retire R-2571, R-2572 and R-2576 (:1153–1154, :1158); A-057 is covered under 2a.

---

## Group 3: ask issues and notes

**Plan questions as `ask` issues**
- Code: none. It's rule-only.
- `nana-seat.md:21–22`: "Post a plan's questions as one `ask` issue… (default: go)" and "A blocking build waits…" (delete both).
- `seat-rule.test.mjs`:
  - :39–40 (RULE_11, RULE_12)
  - :52 (RULES)
  - :122 (R-3026 checks that line 20's sentence sits before RULE_11; re-anchor it)
- `planner-prompt.test.mjs:100–104` (R-3012, R-3013).
- `prompts/planner.md` "Questions for the owner" (:18–20): keep. Questions then go in the plan or report.
- REQUIREMENTS.md: retire R-3012 and R-3013 (:840–841, FEAT-006).
- Ruling `nana-rulings.md:20`, second sentence "A blocking question carries a one-word default": replace it together with 1b.

**General ask labels (only if you want them gone too; not recommended, coupling 8)**
- `nana-soul.md:37`: "Label an ask `ask` plus one of `blocking`, `optional` or `parked`… title ends with \"(default: <word>)\"". Pinned verbatim by `templates-render.test.mjs:535–556`.
- Code: `handoff-issues.mjs:54–56`, `handoff-asks.mjs`, `ask-shape.mjs`, `frontier-summary.mjs`, `frontier-check.mjs:88`, `product-report.mjs`.
- Rows: R-2972 (:286), R-2607, R-2609, R-878 and the FEAT-002 SUB-005 rows.
- Plus HANDOFF.md:23–25.

**"Put HANDOFF and session notes in the reviewed change before its final round"**
- In the Land checklist, both:
  - `templates/_shared/working-under-nana-pi.md:30`
  - `AGENTS.md:98`
- Keep "nothing is written after a land"; `land-merge.test.mjs:359` asserts nana-land prints no HANDOFF or session text.
- No test pins the sentence itself; no row found.

**`docs/sessions` notes**
- Minimal cut, text only:
  - `templates/_shared/HANDOFF.md:4` ("Narrative lives in `docs/sessions/`")
  - `HANDOFF.md:3`
  - `AGENTS.md:41,44`
  - `prompts/builder-preamble.md:7` ("or session archives"; pinned by `worker-lane.test.mjs:404,424`, R-2510 :322)
- Full cut (much bigger; see coupling 9):
  - Seeds: `nana-setup/lib/project.mjs:5–9,25,125–131`, `lib/project-rows.mjs:89–104`, `copier.yml:17`, `templates/_shared/docs/sessions/README.md`, `readme-check.config.json:104`
  - Adoption criterion: `bin/nana-adoption.mjs:64,74`, `lib/adoption.mjs:6`, `extensions/nana-handoff.ts:54`
  - Knowledge-pull exclusion R-239
  - Tests: `project.test.mjs`, `project-stale.test.mjs`, `project-odd-seeds.test.mjs`, `adoption-producer.test.mjs`, `adoption-reader.test.mjs`, `templates-render.test.mjs:1095`
  - Rows: R-152, R-327, R-395, R-2761, R-2762 and A-047 (:1810)
  - Skills: `adopt-structure/SKILL.md`, `adopt-ts`, `adopt-py`
  - READMEs: root :21, :207; `nana-setup/README.md:195,217–218`; `nana-pack/README.md:24,1552–1555`
  - I'd treat that as a separate decision **(inferred)**.

---

## Files to regenerate, and checkers that will fail until edited

- **Regenerate:**
  - `docs/code-map.md` (`npm run map`; `map:check` fails otherwise)
  - `docs/requirements-tree.md` (`npm run req:tree`; the suite fails on a stale copy, per CAP-07 R-291)
- **`readme:check`:** fails on any README line naming a deleted file, script or flag (`review-ledger`, `lane-class.mjs`, `requirements-moved.mjs`, `--over-cap`, `mutation-runner.mjs`, `SEAT_MUTATE_*`).
- **`map:check`:** fails on stale `launchAlwaysRun` entries (`code-map.config.json:55,59,69`).
- **Component audit:** fails on untracked parts in `docs/components/nana-pi.json` (:93, :394, :444).
- **Requirements tree check:** fails on a retired row left in a `Deliverables:` line (R-1460, R-1239) or an `Also applies:` line.
- **Marker-block equality:** `templates-render.test.mjs` (R-2955, `markerBlock(AGENTS.md) === shared`) needs `templates/_shared/working-under-nana-pi.md` and the AGENTS.md marker region (:90–104) edited identically. `nana-soul.md:48–49` must also match the shared bullets (R-1128).
- **Exact-bullet pins:** `seat-rule.test.mjs` pins the seat guide's exact bullet set (R-1140, :52, :61). Update R-1140's text ("seventeen original rules").
- **`RUN_ALONE` list:** `test-runner-config.mjs:66`, if `review-ledger.test.mjs` is deleted (R-1474).
- **Known bugs:** `docs/known-bugs/FEAT-007.md` has 33 lines on cut machinery and FEAT-031 has 25; smaller counts in FEAT-002, 006, 008, 013, 015, 019, 028, 029, 033, 041 and `unplaced.md`. Prune or keep as history.
- **Installed copies:** `nana-setup install` re-installs the edited rules (`nana-seat.md`, `nana-soul.md`) and the requirements skill. Machines keep the old text until they re-run it, and stale-copies will report the drift.

---

## Suggested split (3 lanes)

**Lane 1, one reviewer (group 1). Do it first.** Under today's rules lanes 2 and 3 touch review tools and would need the land reviewer, pairs and checker; this lane removes those requirements. Lane 1 itself still falls under the current ladder.
- Delete:
  - `scripts/lane-class.mjs`
  - `lib/lane-class-config.mjs`
  - `lib/mutation-runner.mjs`
  - `lib/mutation-runner-config.mjs`
  - tests: `lane-class`, `mutation-runner`, `mutation-runner-takeover`
- Edit code:
  - `bin/worker-config.mjs`
  - `bin/nana-roster.mjs` (tolerate legacy `land`/`checker`)
  - `lib/roster-set.mjs`
  - `lib/roster-roles.mjs`
  - `lib/roster-notice.mjs`
  - `bin/pi-worker.mjs` (:42, :116, :394–409)
  - `bin/pi-review.mjs:245`
  - `scripts/outside-reader-config.mjs`
  - `packages/nana-setup/lib/install-check-config.mjs` (if needed)
  - `code-map.config.json`
  - `docs/components/nana-pi.json`
- Edit text:
  - `nana-seat.md` (:6, :15, :16, :18)
  - `nana-soul.md` (:48–49)
  - `templates/_shared/working-under-nana-pi.md` (:27, :29, :31, :32)
  - AGENTS.md (:95, :97, :99, :100, :106)
  - `prompts/planner.md:27`
  - `nana-rulings.md` (:20, :31; new ruling)
  - `packages/nana-pack/README.md`
- Edit tests:
  - `nana-roster`, `nana-roster-set`, `roster-notice`, `worker-claude`, `context-anatomy`, `outside-reader`, `build-records`
  - `rulings`, `planner-prompt`, `templates-render`
  - `nana-setup/tests/seat-rule`
- Also: REQUIREMENTS.md rows from 1a–1d, CAP-07 R-1239, FEAT-031 A-035; regenerate the code map and tree; known-bug pruning.

**Lane 2, review paperwork (group 2).**
- Fold `review-ledger run` into `claude-review.mjs` (or a new `lib/` module); delete `bin/review-ledger.mjs` and its `package.json` bin entry.
- Delete `lib/review-movement*.mjs` and the movement half of `scripts/requirements-moved.mjs`, after rehoming `defaultGit` and `MAX_GIT_BUFFER` for blast-radius, component-audit, deliverables and product-report.
- Strip the cap and keep constants from `review-round.mjs`.
- Simplify `nana-land.mjs` (kept-text evidence and notes).
- Edit:
  - `pi-review.mjs`, `pi-worker.mjs:50`, `review-timeline.mjs`
  - `lib/known-bug-digest.mjs` callers
  - `first-look-config.mjs`
  - `test-runner-config.mjs:66`
  - `code-map.config.json:55`
  - `docs/components/nana-pi.json`
- Delete or port the review-ledger*, keep-movement, review-movement and requirements-moved tests.
- Edit tests:
  - claude-review, immutable-review, review-standard, credential-strip, win32-launch, path-spelling, review-timeline
  - land-merge, review-round, ledger-repo, linked-launch, first-look, requirements-tree/regroup, code-map-launch
- Edit text:
  - `OBJECTIVE.md:14`, `templates/_shared/OBJECTIVE.md:24`
  - Shared pattern and AGENTS lines :26/:94 (corpus), :27/:95 (three rounds), :30/:98 (keep and over-cap)
  - AGENTS.md :18, :161
  - `skills/requirements/SKILL.md:142`
  - root README:107; nana-pack README
- Retire the 2a–2d rows; regenerate the map and tree.
- Keep in mind coupling 7 (memory factory) and the local-suite decision.

**Lane 3, asks and notes (group 3; smallest, text only). Do it last.** It edits the same Land checklist bullet as lane 2, so it should go after it.
- `nana-seat.md:21–22`
- Shared pattern and AGENTS lines :30/:98 (remove the "HANDOFF and session notes" sentence)
- `templates/_shared/HANDOFF.md:4`, `HANDOFF.md:3`, AGENTS.md:41,44
- Optionally `prompts/builder-preamble.md:7`, with its tests and R-2510
- Tests: `seat-rule.test.mjs` (RULE_11/12, R-3026 anchor), `planner-prompt.test.mjs` (R-3012/3013)
- Rows: retire R-3012 and R-3013
- The full `docs/sessions` removal (scaffolding and adoption) and the general ask labels are bigger and touch KEEP surfaces. Propose them as separate owner decisions rather than part of this lane.