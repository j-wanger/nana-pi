# Build 2 — precedent-line-parse

Feature: FEAT-006 · Launch builders with execution limits
Branch: feat/precedent-line-parse

## Changes

- R-3716 to R-3719: implemented, with tagged file::title evidence. R-2579 gains refusal evidence.
- `packages/nana-pack/lib/brief-precedent.mjs`: select a leading CommonMark backtick span; otherwise select the first span when the first word is not path-shaped; otherwise retain the bare first word. Preserve code-span inner spaces, reject URLs, and apply the existing path cleanup.
- Refusals retain the existing `"<value>" is not tracked at HEAD` substring, add original bullet text before bold removal, cap it including the ellipsis, and state the rule once before the existing remedy.
- `packages/nana-pack/lib/brief-config.mjs`: seal PRECEDENT_QUOTE_CAP at 160 UTF-16 units.
- `packages/nana-pack/tests/brief-check.test.mjs`: M1–M4 only. M1 exercises real launches, CRLF, trailing whitespace and absent final newlines. M2 exercises both commands, exact refusals and no spawn. M3 uses literal compatibility fixtures. M4 pins both documentation surfaces and the cap.
- `packages/nana-pack/prompts/planner.md` and `packages/nana-pack/README.md`: selection-rule sentences.
- Generated `docs/code-map.md` and `docs/requirements-tree.md` updated through their generators.
- `docs/known-bugs/FEAT-006.md` gains exactly the authorized single line. No other known-bug line changes.

## Wrong-code pairs

Command: `node packages/nana-pack/tests/brief-check.test.mjs`.

1. Main's complete parser before implementation: exit 1; M1, M2 and M4 fail; M3 passes as intended.
2. Main's parser with only first-span selection and no bare fallback: exit 1; M1, M2, M3 and M4 fail.
3. Revised parser and documents: exit 0; M1–M4 pass.

`wrong-code.txt` retains the result summary, without temporary machine paths from unrelated parity diagnostics. No assertion was inverted. The cap test first failed with the absent export, then passed at 160.

## Corpus

`corpus.mjs` reads main's tracked `docs/reviews/**/*{brief,plan}*.md` corpus and imports main's complete parser from its git blob. It imports the revised parser and the existing list scanner rather than duplicating either helper. `corpus.txt` records every bullet, parsed value and outcome, then lists every changed outcome and every changed extensionless-first-word selection.

Reproducible counts on main bfde4ae2873297bf5fcf29752e086c8c46157771:

| Kind | Bullets | Changed values | Changed outcomes |
| --- | ---: | ---: | ---: |
| bare-path-first | 891 | 0 | 0 |
| backticked-first | 1444 | 25 | 16 |
| prose-with-span | 189 | 189 | 91 |
| bare-word | 34 | 0 | 0 |
| none | 3 | 0 | 0 |

372 sections, 2561 bullets. The plan's earlier survey reported 358 sections and 219 bare-path-first bullets. The requested glob on this baseline yields the larger population above; all 891 bare-path-first bullets preserve outcomes, covering the claimed 219 without a new refusal. No original survey script was supplied, so the earlier count could not be reproduced.

The 16 changed backticked-first outcomes are spans containing multiple space-separated line references. Previously only their first whitespace token was checked; the required CommonMark whole-span rule now checks their full contents. They are listed, not special-cased. Other changed backticked-first values name commands or symbols and remain refused. This is a documented compatibility departure required by Revision 2's whole-span rule; the fixed M3 corpus remains unchanged.

## Precedent and test departures

- Exported private `entryText` from its existing module under standing authorization, for the corpus audit's original-bullet text. No helper was copied or moved.
- Original entry joining now trims each physical line before inserting its single joining space, so refusal diagnostics do not retain wrap indentation or trailing whitespace.
- CommonMark whole-span selection changes the historical multi-reference entries described above; this follows the explicit plan rule rather than preserving the old whitespace truncation.
- No existing worker-lane, brief-check or planner-prompt assertion was edited. No test was deleted. R-2580's bare tracked fixture stays unchanged.
- The authorized folder-word residual remains. Existing wrong-file, lane-HEAD, unchecked line-suffix, case, POSIX-backslash and Markdown-list-boundary residuals remain unchanged. Nested entries stay separate, but may now select a code span like any other entry.

## Commands and exits before commit

All test files ran one at a time on native Windows Node.

- Map impact for brief parser/config and both consumers: 0; `impact.txt`, `consumer-impact.txt`.
- `node packages/nana-pack/tests/brief-check.test.mjs`: 0.
- `node packages/nana-pack/tests/worker-lane.test.mjs`: 0 (existing platform skip retained).
- `node packages/nana-pack/tests/planner-prompt.test.mjs`: 0.
- `node packages/nana-pack/tests/test-runner.test.mjs`: 0.
- `node packages/nana-pack/tests/context-anatomy.test.mjs`: 0; direct known-bug-digest coverage.
- `node apps/bench/test/anatomy.test.mjs`: 0.
- `node apps/bench/test/anatomy-labels.test.mjs`: 0.
- `node apps/bench/test/anatomy-seat.test.mjs`: 0.
- Test output: `build-1-green.txt`, the artifact name requested by the original brief.
- `node docs/reviews/precedent-line-parse-2026-11-02/corpus.mjs`: 0.
- `npm run map`: 0; `node scripts/requirements-tree.mjs --write`: 0.
- `npm run map:check`: 0; `npm run readme:check`: 0.
- `node scripts/requirements-trace.mjs`: 0.
- `node scripts/requirements-tree.mjs --check`: 0.
- `node scripts/known-bugs.mjs --root .`: 0.
- `node packages/nana-pack/bin/brief-check.mjs --brief docs/reviews/precedent-line-parse-2026-11-02/build-brief-1.md --tree .`: 0.
- Same brief-check on an OS-temp brief with the seat's exact failing bullet: 0.
- `node scripts/lane-class.mjs --root . --base origin/main`: 0, `ordinary`; parser/config also reach pi-review and claude-review.
- `git diff --check`: 0.

## Not done

No push, CI access, model launch, credential access, full-suite run or install operation. AGENTS.md explicitly delegates the full suite to CI. The installed rulings are stale; the owner was notified. Supplied untracked briefing files stay outside the implementation commit. Final staged identity validation and last-commit seat-check results are reported with the full tip in the completion message.
