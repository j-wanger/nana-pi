Two changes are needed before this lane can land: regenerate the requirements tree and commit it. Re-review only that commit. The fix-card exception, the helper rule and the new rows all do what the brief asks.

## MUST

**M1. The generated requirements tree is out of date, so the suite fails on this tip and passes on main.**
- **Cause:** R-3747 was added in `47baef52` and reworded in `e6c35a92`, but `docs/requirements-tree.md` was regenerated only in build 1 (`34649b4e`). It still lists FEAT-041 as `Rows: 26 · IDs: … R-3733–R-3738` and CAP-01 as `Rows: 472`.
- **Evidence:**
  - `node scripts/requirements-tree.mjs --check` exits 1 here (`docs/requirements-tree.md:7: differs from rendered outline`) and exits 0 on main `2c0a3e4a`.
  - `node --test packages/nana-pack/tests/requirements-tree.test.mjs` fails five R-291 checks, starting with "committed outline equals a fresh render".
  - Rendering the tree in a temp copy differs only by R-3747: 472→473, 26→27, and `R-3747` added to both ID lists.
- **Consequence:** CI goes red on this tip and `nana-land` refuses it. The land helper regenerates generated files only when a merge conflicts, so this won't fix itself.
- **Fix:** run `npm run req:tree` and commit it. The build report's `npm run req:tree` exit 0 dates from before brief 2.

## Your three questions

1. **Can a brief without the marker launch without Precedent? No.** The section may be absent only when `parsedBrief.precedent === null && parsedBrief.fixCard` (`packages/nana-pack/lib/brief-precedent.mjs:114`).
   - `fixCard` is true only for an exact whole line `Card: fix`, after the BOM is stripped and trailing spaces or tabs are trimmed. A leading space, `Card: fixture`, `Text Card: fix` and `Card: feature` are all refused with today's text.
   - pi-worker and brief-check share `checkBriefForLaunch`, so the two still agree (R-2585).
   - A fix card whose Precedent section is empty, an invalid `none:` or an untracked path is still refused, because the exception covers only a missing section.
   - The `readBrief` loop now runs to the end instead of stopping at the first Feature line. It still keeps the first Feature line, so pi-review, known-bug-digest and anatomy-sessions are unaffected.
2. **Do the preamble and the helper ruling contradict each other? No.** The 2026-10-22 ruling (`nana-rulings.md:29`) says a second caller imports a helper and the plan names any move of a private helper to a shared module. The preamble makes the helper public where it already lives and says a move to a shared module needs the brief to name it. They cover different cases, and both agree with G-018 (no reaching into another module's private helpers). The planner repeats the preamble sentence word for word, and R-3737 checks that.
3. **Do the rows match their tests? Yes, for R-3733 to R-3738 and R-3747.**
   - The R-3733 test hashes the four lessons lines and the plan's `6b521260dae24d4c` prefix. It also captures the prompt for a pi launch (`small`) and a Claude Code launch (`larger`).
   - R-3735 runs the real pi-worker at both sizes with BOM, CRLF and CR variants.
   - R-3736 pins the exact refusal texts.
   - The edits to R-2578, R-2618 and R-2662 stay consistent with their unchanged or updated tests.
   - The only problem is that R-3747 is missing from the generated tree (M1).

## SHOULD (known-bug lines for FEAT-041)

- **S1. A project rule is now out of date.** `AGENTS.md:161` still says "A lane brief carries a Precedent section, and pi-worker refuses one without it." A `Card: fix` brief now launches without one. The project rules say a contract change is declared where its readers look.
- **S2. The lessons footer can pull against the preamble.** The footer says "Run the README's checks (tests, lint, types) before you commit". The preamble says to run the full suite only when AGENTS.md doesn't hand it to CI, and to take the machine lock when the repo has one. In this repo, a builder could read the footer as a reason to run `npm test` without the lock on a shared machine. The text is frozen, so the fix would be a pointer elsewhere, not an edit to it.
- **S3. The marker is read anywhere in the brief, including inside a fenced code block.** For example, a brief that shows a sample fix card and forgot its own Precedent section would launch. This is the same fence-blind reading the Feature line already gets.

## NOTE

- The R-3747 test title still says "each known caller" after brief 3 changed the wording to callers found by a fresh read.
- "Drop the leading underscore" is Python wording. In this JS repo, a private function is one that isn't exported, so the rule leaves out what to do there.
- The R-3736 test passes a `laneSize` that `checkBriefForLaunch` ignores. That matches the decision to use the marker instead of lane size (A1), but "at every lane size" proves nothing extra.

## Checks run on `e7b68725`

| Test file | Result |
|---|---|
| builder-context | 7/7 pass |
| requirements-tree | fails (M1) |

These all pass: worker-lane, brief-check, planner-prompt, worker-claude, rulings, frontier, handoff-issues, handoff-staleness, writing-check, known-bugs, skill-claims, code-search, requirements-regroup, requirements-cap-kinds, seat-rule and rulings-install. `map:check`, `requirements-trace` and `nana-writing HANDOFF.md` are clean.

VERDICT: SEND-BACK
