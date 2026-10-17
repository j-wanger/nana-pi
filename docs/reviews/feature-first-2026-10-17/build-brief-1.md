# Lane feature-first — build brief 1 (2026-10-17 · feat/feature-first · tip after the seat's plan commit)

Builder: the small-lane builder. Lane class: ordinary. The plan of record is `must-meet.md` in this folder: it gives
every new sentence verbatim (T1 to T5 and the README carry), the rows and the six must-meet checks FF1 to FF6. Copy each
sentence exactly as written there; do not reword, and change no other rule text.

## Text edits (from `must-meet.md`)
1. T1: `packages/nana-pack/prompts/review-standard.md`, line 1 replaced. Lines 2 and 3 unchanged.
2. T2: `templates/_shared/working-under-nana-pi.md`, the "Review ladder", "Plans", "Review bar" and "Seat land review"
   bullets. Then copy the shared file's text into nana-pi's `AGENTS.md` marker region byte for byte (`CLAUDE.md` is a
   link to `AGENTS.md`), and give `packages/nana-setup/claude/rules/nana-soul.md` the same "Seat land review" bullet
   byte for byte (R-1128).
3. T3: `packages/nana-setup/claude/rules/nana-seat.md`, bullet 5 replaced. The guide keeps exactly ten bullets.
4. T4: `packages/nana-pack/prompts/builder-preamble.md`: add the must-meet line after "Follow requirement diff → tagged
   tests → code.", delete the "Fix the class…" line. The CRLF line and the report shape stay.
5. T5: `packages/nana-setup/claude/rules/nana-standards.md` (three bullets; the file stays under 80 lines),
   `packages/nana-pack/skills/requirements/SKILL.md` (§1 step 1, §2's opening and first two bullets, the mutation
   bullet, §6's first paragraph), the root `README.md` sentence, and `templates/_shared/OBJECTIVE.md`.
6. The carried README fix: in `packages/nana-pack/README.md`'s mutation runner section, the sentence saying exit 0 means
   every pair turned RED becomes "Exit 0 means the run completed; its RESULT line counts the survivors." Check the runner
   (`packages/nana-pack/lib/mutation-runner.mjs`, its exit at the end of the run) agrees before you write it.

## Rows (REQUIREMENTS.md)
- R-1101 text becomes: "The shared working pattern shall say that plans get no review round."
- R-1108 text becomes: "The review standard shall define a MUST as a missing or empty must-meet test, a broken main use
  the brief names, or a harm from its listed set, and limit a confirmation round to the change since the round its brief
  names."
- R-1110: in its list of twelve rules, "fix the class" becomes "only the brief's must-meet tests, plus one seal test per
  new sealed tunable". Still twelve rules.
- R-1127: "when the roster sets no land model" becomes "in an install, hook or gate lane, when the roster sets no land
  model".
- R-1140: its list's mutation-runner rule becomes "in an install, hook or gate lane, re-run the mutation runner after
  the seat's own change".
- R-1300 (added, beside R-1101): "The shared working pattern shall give an ordinary lane one final reviewer, and an
  install, hook or gate lane the land reviewer, the seat's wrong-code pairs and one independent check as well."
- R-1301 (added, beside the coding-standards rows; find where R-920 lives): "The coding standards and the requirements
  skill shall write one requirement row per must-meet test, no wider than the test, and ask every land's reviewer
  whether the feature works for its user."
New rows land `planned` and flip to `implemented` with their check's title in the Evidence cell. Update each reworded
row's Evidence cell where its cited title changes. R-291's leaf total moves by two.

## Checks (exact titles; `seat-titles.mjs` lists them)
- FF1, `packages/nana-pack/tests/review-standard.test.mjs`, `// req: R-1108`:
  `R-1108: the review standard makes a missing or empty must-meet test, a broken main use on a named platform and the four listed harms a MUST, and every other finding a known bug`
  — asserts T1's must-meet clause, the main-use clause, each of the four harms, and the known-bug sentence; and that
  "wrong output someone acts on" and "a security or review boundary bypassed" are gone. Also edit the existing check
  `review standard defines a MUST and limits confirmation rounds to the delta` so it asserts the new phrases in place of
  the five old ones; keep its title and its confirmation-round assertion.
- FF2, `packages/nana-pack/tests/templates-render.test.mjs`, `// req: R-1101` and `// req: R-1300`:
  `R-1300: the shared working pattern gives an ordinary lane one final reviewer, defines install, hook and gate lanes, and says plans get no review round`
  — replaces the check `shared working pattern caps plan review at one or two rounds`; asserts the ladder's two
  sentences, the lane-class definition and "Plans get no review round", and that "plan-review round" and "only a named
  fail-open bug reopens the plan" are gone.
- FF3, same file, `// req: R-1127`:
  `R-1127: the shared seat land review applies in an install, hook or gate lane when the roster sets no land model`
- FF4, `packages/nana-setup/tests/seat-rule.test.mjs`, `// req: R-1140`:
  `R-1140: the seat guide reruns the mutation runner only in an install, hook or gate lane`
  — also change the fixed list's mutation-runner bullet to T3's text.
- FF5, `packages/nana-pack/tests/worker-lane.test.mjs`, `// req: R-1110`:
  `R-1110: the builder preamble has the must-meet line with its seal-test exception and no fix-the-class line`
  — also change the twelve-line list: the fix-the-class line out, T4's line in.
- FF6, `packages/nana-setup/tests/skills-and-standards.test.mjs`, `// req: R-1301`:
  `R-1301: the coding standards and the requirements skill write one row per must-meet test no wider than the test, and drop clause-by-clause pinning`
  — asserts T5's standards bullets (the builder line's seal-test exception included) and the skill's §2 and §6
  sentences, and that "name the clause each cited test pins", "A row is the weakest of its clauses" and "A row's status
  is the weakest of its clauses" are gone from both files.
Edit any other existing check only where this change makes it false, and list each such edit in your report.

## Done
`node docs/reviews/feature-first-2026-10-17/seat-titles.mjs 1` → `seat-titles 1: 0 missing`; `npm run req:tree`
then `node scripts/requirements-tree.mjs --check`; `node scripts/code-map.mjs --check`; `npm run -s readme:check`;
`node scripts/requirements-trace.mjs`; the full suite as `AGENTS.md` says (`npm run test:locked`). Do not touch
`HANDOFF.md`, `docs/sessions/` or the seat's files in this folder.
