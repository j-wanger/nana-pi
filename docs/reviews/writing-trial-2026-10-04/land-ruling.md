# Landing ruling — `feat/writing-trial` → `main` (2026-10-04)

Ruler: Fable (read-only; this file is the only write). Inputs: `git diff main...feat/writing-trial`
(925f950, 0d9eff3, 542bee7, cb21608, b21c170, eae2f76 on 5ef596a; main is now 64a3297),
`astra-r1/r2/r3.md`, `seat-verify-after-r3.md`, my `design-ruling.md` with Amendment 1, pi 1.0.2's
installed docs. `[V]` = I read or ran it today. `[A]` = astra ran it, I read the log. `[I]` = inferred.

Stakes: high-blast (every pi session's system prompt, every Claude Code session's rules), reversible
(the drop verdict removes one file, one link, one extension and one CLI; nothing writes outside the repo).

## 1. Verdict: LAND, with residuals

One reason. Every clause astra opened in three rounds is closed by execution, not prose. Round 1's
eight items closed in round 2 `[A]`. Round 2's seven closed in round 3 `[A]`. Round 3's three closed
in `eae2f76`: the seat re-ran astra's own probes `[A, seat-verify]`, and I ran the suite today `[V]`.
No fourth round is needed. No subtraction earns its place: the one candidate, dropping pi delivery,
would remove the desk and TUI from the trial, and those are Jake's own sessions.

My runs in the worktree `[V]`:

| Check | Result |
|---|---|
| `writing-check.test.mjs` | 44 pass, exit 0; passive diagnostic TP 8 FP 0 FN 4 TN 12 |
| `writing-injection.test.mjs` | 28 pass, exit 0 (the real pi 1.0.2 runner case included) |
| `writing-rule.test.mjs` | 3 pass, exit 0 |
| `config-handlers-malformed.test.mjs` | 98 pass, exit 0, seven extensions enumerated |
| `map:check` | 169 modules, 0 problems |
| `readme:check` | 543 claims, 5 problems, all the worktree's missing `apps/bench/.ext` and `node_modules` |
| rail | 535 rows, 461 implemented and traced, 2 planned, 65 untested, 7 violated |
| acceptance 2, 3, 8, 11 | rule: zero findings · `LANDED.` → `verdict=1/1` · passive line reported · `I reopened the case.` → `verdict=0/1` |

## 2. Deviations from the ruling and Amendment 1

- **IDs — RATIFIED.** The ruling named installer rows R-360 to R-363. The pi 1.0 lane had used
  R-360 to R-372, so the worker took R-373 to R-376 (`925f950`). Amendment 1 deleted R-373 to R-375.
  They never landed and nothing cites them, so the IDs stay unused `[V]`. R-376 stays. R-755 is new,
  split from R-753 after astra r3 MUST 3 — ratified. Fourteen rows plus R-301 and R-376 carry one
  `shall` each `[V]`.
- **`HANDOFF.md` — NOT WRITTEN.** The allowlist asked for one landing line. The branch does not
  touch the file `[V]`. The seat adds the line in the merge commit (§4). Consequence: the expected
  merge conflict does not exist. The files main changed since 5ef596a and the files the branch
  changed do not overlap `[V]`.
- **Root `README.md` — RATIFIED.** Not on the allowlist; one word, "six" to "seven", the same count
  claim as the others.
- **`templates/_shared/working-under-nana-pi.md` — RATIFIED.** "six" became "seven" and the list
  gained "writing". The amendment allowed one word; naming the seventh is the honest completion.
  `project.test.mjs` pins the section verbatim and passes `[V]`. Copier consumers render from the
  latest `v*` tag (v0.6.0), so scaffolded projects say "six" until the next tag (§5).
- **R-376 wording — RATIFIED.** The decision point is a numbered list (A2). The banned word sits in
  a code span after "Jake banned" (A3). The evidence cell's note "For Fable to rule on at landing"
  is answered; the seat trims the cell (§4).
- **`READ_MARGIN` lives in the extension, not `writing-config.mjs` — RATIFIED.** It is the longest
  UTF-8 sequence, a protocol constant, not a tunable. It is sealed by one test anyway `[V]`.
- **The FIFO fixture skips without `mkfifo`.** The worker changed code where astra asked for a
  record. The change is right: a missing prerequisite is not a finding. Ratified.
- **R-743 wording grew** to "the line of the finding's first retained character". The verdict
  finding carries line 1 regardless `[V, writing-check.mjs verdictFinding]`. The row overclaims by
  one check. The seat amends the cell (§4) and removes the matching Open-questions bullet.
- **R-752 wording** carries a second obligation after a dash without a `shall`. One `shall`, so
  the rail accepts it; the row still reads as two. The seat moves the dash clause into a note (§4).

## 3. The seventh extension — ACCEPTABLE for the trial as built

**Why.** Astra executed both failures of the context-file design: our link hid a user `CLAUDE.md`,
and an `AGENTS.override.md` hid our rule while doctor read ✓ `[A, r1 MUST 1]`. An append replaces
nothing and nothing removes it. Composition holds on the installed 1.0.2 runner: a distinctive base,
the objective block and the writing block each once, in order `[V, test; A, r3 probe]`. The read is
bounded and never hangs or exhausts memory `[A, r3; V, tests]`. The worst case is "inject nothing
and journal one line". The cost is 1,303 bytes in every pi system prompt `[V]`, about 330 tokens.

**Who gets it.** Every pi session that loads the pack: TUI, the desk, `pi-review` reviewers and
`pi-worker` builders (neither passes `-ne` or `-nc` `[V]`), and background subagent children on the
default extension selection `[A, r2]`. A child launched with `extensions: []` does not `[A]`.

**The turn-off switch.** pi has one; the pack does not.

- pi: the pack's `packages` entry in `~/.pi/agent/settings.json` becomes object form,
  `{ "source": "../../nana-pi/packages/nana-pack", "extensions": ["-extensions/nana-writing.ts"] }`
  `[V, packages.md "Select package resources"]`, or `pi config` disables the resource `[V, docs; how it
  persists is I]`. Cost: `registrationState` reads string entries only (`steps.mjs:706` `[V]`), so
  `doctor` then reads the pack as unregistered and `install` would run `pi install` again. Restore
  the plain string before running either.
- `pi -ne` disables every extension, the gate included. Not a switch for this.
- Removing `packages/nana-pack/rules/nana-writing.md` injects nothing and journals
  `writing_rule_unavailable` once per session start `[V, R-752 tests]`. The Claude Code link then
  dangles and `doctor` reads ✗ on the rule.
- No `writing.enabled` key, by Amendment 1. The trial ends in adopt or drop. Drop removes the code.
  If the verdict is adopt, the key joins that requirement diff.

The residual line is in §5.

## 4. Merge-commit edits (the seat; prose and rows only, no test marker moves)

1. **`HANDOFF.md`**, under "## Landed 2026-10-02" or a new "## Landed 2026-10-04" heading. This
   text passes the checker in normal mode: 6 sentences, 0 over, 0 passive `[V]`.

   > - **Writing trial LANDED 2026-10-04** (`<merge sha>`): one rule for the seat's messages to Jake
   > and for `HANDOFF.md` lines. Claude Code reads it as a rule file; every pi session gets it from
   > the seventh pack extension. The checker `packages/nana-pack/bin/nana-writing.mjs` reports and
   > never blocks. Baseline, daily tally and the stop condition live in
   > `docs/reviews/writing-trial-2026-10-04/` (`baseline.md`, `tally.md`). The trial ends on day 14
   > or at 20 reports, or after two lost-detail complaints, with one of adopt, extend once, or drop.
   > Review: astra r1 to r3 BLOCK 6/8/8, every item closed by execution; `land-ruling.md` in the
   > same folder.

   Also fold the tag into the existing `v0.6.0` line: "v0.6.1 now also carries the seven-extension
   wording of `working-under-nana-pi.md`".
2. **R-743** requirement cell: "WHEN paths are given, the checker shall check each file and prefix
   each finding with the path and the line of the finding's first retained character, the verdict
   finding excepted (it carries line 1)." Delete the R-743 bullet under Open questions.
3. **R-752** requirement cell: "IF the rule path is missing, not a regular file, unreadable, or the
   bytes actually read are not valid UTF-8, THEN the extension shall inject nothing and journal
   writing_rule_unavailable with the cause." Add under the 13b table: "A bounded read validates
   only the bytes it reads. Before decoding it trims a trailing sequence whose own lead byte proves
   it incomplete, never a byte invalid on its own (astra r3 MUST 1; the four UTF-8 tail tests)."
4. **R-376** evidence cell: the test citation, then "wording per Amendment 1 §A2 and §A3, ratified
   in land-ruling.md §2".
5. **`REQUIREMENTS.md` line 11**: "R-700 to R-741" becomes "R-700 to R-755"; add "R-373 to R-375
   are unused: an installer step Amendment 1 removed before it landed".
6. **`packages/nana-setup/tests/writing-rule.test.mjs` header** `[V]`: `@inputs` names
   `bin/nana-setup.mjs` and a throwaway `--home`; `@effects` says it spawns the installer. The body
   does neither. Set `@inputs` to "lib/steps.mjs's ruleSource/PACK_RULES_DIR, nana-pack's
   lib/writing-check.mjs, the shipped rule file" and `@effects` to "none (reads the rule file)".
   Then `npm run map` and commit the map.

## 5. Residuals to record at landing — one line each

Astra r3's seven are recorded `[V]`: six under `packages/nana-pack/README.md` "Behavior notes"
(byte-vs-character cap, the stat-then-open race, base-test gap, FIFO prerequisite, verdict line
coordinate, the standing limits, the red readme check) and two under REQUIREMENTS "Open questions"
(verdict coordinate, byte-vs-character). Add these:

| Where | Line |
|---|---|
| nana-pack README · Behavior notes | The character cap slices UTF-16 units: a rule over 4,000 chars with an astral character at the cut leaves a lone surrogate in the block (`isWellFormed()` false) `[V]`. Unreachable with the shipped 1,303-byte rule; one `toWellFormed()` at the adopt verdict. |
| nana-pack README · Behavior notes | The writing block has no switch of its own. pi's filter (`-extensions/nana-writing.ts` on the pack's `packages` entry, object form, or `pi config`) removes it; nana-setup then reads the pack as unregistered until the plain entry is restored. |
| nana-pack README · Behavior notes | Reviewer and worker sessions carry the block. The first `pi-review` corpus after landing is the check: a dropped path or a shortened finding moves delivery behind `hasUI` (design-ruling.md §2, Amendment 1 A1). |
| nana-pack README · Known limit | The checker reads any argument but `--report` as a file path; `--help` prints one error line and an empty summary `[V]`. |
| nana-setup README · pi packages row | `registrationState` recognises string `packages` entries only; an object-form entry (pi's resource filter) reads as unregistered, doctor ✗, and install would run `pi install` again. |
| HANDOFF · the v0.6.0 line | The seven-extension wording in `templates/_shared/working-under-nana-pi.md` reaches copier consumers only at the next `v*` tag; `nana-setup project` reads the repo file and emits it at once `[V, project.mjs:121]`. |
| `baseline.md` header | The report corpus is seat sessions only: project dirs without `-wt-`, entries with `isSidechain` false. Worker sessions report to the seat, not Jake, and write differently (8% over cap against the seat's 31%) `[V]`. |

## 6. Fresh-eyes findings astra did not raise — none block

- **The merge is refused as the tree stands** `[V, scratch repo, git 2.50.1]`. `astra-r1.md`,
  `build-brief.md` and `design-ruling.md` are untracked in main's working tree and byte-identical to
  the branch's adds `[V]`. git refuses to overwrite an untracked file even when the content matches.
  Move the folder aside first (§7).
- **No conflict exists.** Main's eleven post-base files are `HANDOFF.md` and the pi 1.0 acceptance
  record; the branch touches neither `[V]`.
- **Lone surrogate at the cap** `[V]`, §5. The byte-level trim handles the read boundary; the
  character-level slice does not.
- **The stale test header** `[V]`, §4 item 6. `map:check` passes because the map copies the header.
- **The baseline command over-counts.** The ruling's throwaway command, taken literally, finds 189
  reports in 14 days; 154 are worker sessions in worktrees `[V]`. Seat-only is 35.
- **The 20-report stop binds first.** 35 seat reports in 14 days is 2.5 a day; the twentieth lands
  around day 8 `[I, same rate]`. Day 14 is the backstop, not the expected end.
- **`PASSIVE` needs three letters before the suffix**, so "is used", "was made" and "is run" never
  match `[V, regex]`. Recall 66.7% on the fixture. Report-only; already recorded as a heuristic.
- **The desk needs no change.** Nothing in `apps/desk` enumerates or counts pack extensions `[V]`.

## 7. Landing day (the seat), in order

1. `mv docs/reviews/writing-trial-2026-10-04 <scratch>` → `git merge feat/writing-trial` → move the
   non-branch files back (`astra-brief.md`, the three logs, `astra-r2-brief.md`, `astra-r2.md`,
   `astra-r3-brief.md`, `astra-r3.md`, `seat-verify-after-r3.md`, this file) → the §4 edits →
   `npm run map` → `git add` → one commit.
2. On MAIN: `npm test`, `npm run map:check`, `npm run readme:check` green. Baselines: main read
   readme 0 problems before the merge; the worktree reads 5, all environment `[V]`.
3. `node packages/nana-setup/bin/nana-setup.mjs install` → `+ rule nana-writing.md`. `doctor` exit 0.
   `~/.pi/agent/AGENTS.md` must not exist `[V, absent today]`. pi loads the pack by path
   (`../../nana-pi/packages/nana-pack` `[V, settings.json]`), so every pi session started after the
   merge already carries the block; `/reload` or restart the open ones. The desk spawns fresh pi
   processes per session, so it needs no restart `[I]`. Claude Code reads the rule from its next
   session; this session's report is baseline.
4. `baseline.md` in this folder. Pre-landing reference, measured today with the branch's checker
   `[V]`: `HANDOFF.md` (main) 125 sentences, 54 over cap (43%), 16 passive, 1 banned, 202
   identifiers under `--report`. `docs/sessions/*.md` 413 sentences, 175 over (42%), 34 passive,
   9 banned. Reports, seat-only, 14 days, 35 inputs: 1,178 sentences, 370 over (31%), 183 passive,
   0 banned, verdict 6/35, 1,676 identifiers (48 a report). Recompute post-merge; `HANDOFF.md` gains
   one line.
5. `tally.md`: fill the landing date; the first row is zeros.
6. Targets, per Amendment 1 A2 (a quarter of the measured share): `HANDOFF.md` added lines over cap
   at or under 11%; reports over cap at or under 8%; a verdict word first in 90% of reports; zero
   banned words. Identifiers per report have no target; record the count and let Jake judge.
7. **Stop condition, plainly.** The trial stops on the first of: 2026-10-18 (day 14), the twentieth
   report checked, or Jake's second complaint that a report dropped detail he needed. Then
   `after.md` over the lines `git diff <landing>..HEAD -- HANDOFF.md` added and over the reports
   since landing, and one verdict: adopt (PATH link, the pre-send check becomes mandatory in the
   rule, blocking decided per surface, a `writing.enabled` key), extend once (14 more days), or drop
   (remove the rule, the link, the extension and the checker; no zombie code).

## The claim most likely wrong

That reviewer and worker sessions read the rule without harm. The scope paragraph excludes their
output, but a model under a 25-word cap may still drop the path a finding needs. The first
`pi-review` corpus after landing is where it would show. If it does, one `hasUI` line in the
extension moves delivery to Jake's own sessions, and the trial continues.
