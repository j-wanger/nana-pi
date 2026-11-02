The lane works for its user. A seat's prose-first Precedent bullets now launch, and untracked or invalid paths are still refused before the lock. I found no MUST.

**How I checked**
- I read the diff against merge base `9f0892b0` (origin/main has since moved to `69727fbf`). That covers `brief-precedent.mjs`, `brief-config.mjs`, the new tests, the README, `planner.md`, the four new rows (R-3716 to R-3719), R-2579's amended evidence and the new FEAT-006 known-bug line.
- Local runs all pass: `brief-check.test.mjs` (8, including R-3716 to R-3719), `worker-lane.test.mjs` (68), `planner-prompt.test.mjs` (11) and `apps/bench/test/anatomy.test.mjs` (9).
- CI run 41516073177 on the exact tip `fc472a30` is green on every suite and install-check leg, Windows included. `brief-check` took 54.8 s on Windows, well under the 300 s limit per file.
- I ran `brief-check --tree .` on temporary briefs. The seat's failing bullet, verbatim, now gives `2 checked at HEAD fc472a30`. An untracked span is refused with the chosen value, the quoted bullet, the rule and HEAD.
- I compared main's parser with the lane's on about 40 edge-case bullets. The old forms keep their values and outcomes: a leading span with `:12` or punctuation, `**bold**`, bare path-shaped subjects with suffixes and later spans, `./`, backslashes, trailing slashes and `none:`. Prose-first bullets, `*`AGENTS.md`*`, double-backtick spans and wrapped spans now pass.
- The must-meet tests:
  - R-3716 and R-3717 fail on main's parser.
  - R-3719 fails on main's README and planner text.
  - R-3718 is a keep-what-works test, so it passes on main by design. The mutation record shows it catches the build-2 kind of regression.
- The corpus record agrees: 0 of 2,561 bullets went from accepted to refused, and 85 went from refused to accepted.

**Findings**

1. **SHOULD — some bullets main accepts are now refused.** This happens when the first word is a tracked name with no slash and no file extension, and the bullet holds a later code span that is not a path. Main took the first word; the lane takes the span.
   - Realistic inputs: `- Makefile — the `test` target`, `- LICENSE — the `MIT` text`, `- scripts — the `lane-class` helper`.
   - What happens: brief-check prints `"MIT" is not tracked at HEAD (bullet: "LICENSE — the `MIT` text"); each Precedent bullet names one tracked path, in backticks or as its first word`.
   - The rule sentence misleads here: LICENSE *is* the first word and is tracked.
   - This is the rule plan Revision 3 chose, and the README states it. nana-pi has no extensionless files at its root, and the corpus has no such bullet. The refusal happens before the lock, loses no data and is fixed by backticking the subject. Other projects that use pi-worker can still hit it.
   - Suggested FEAT-006 line: "Precedent check (precedent-line-parse, final review): a bullet whose first word is a tracked extensionless file or folder and that holds a later non-path code span is now refused, and the rule sentence 'or as its first word' does not explain why."

2. **NOTE — `./seed — see `other``** falls in the same family. `normalizePath` removes `./` before the path-shape test, so `seed` counts as prose and `other` is chosen. Main accepted `seed`. This is a contrived input.

3. **NOTE — the 160-unit quote cap can split an emoji.** `entry.bullet.slice(0, 159)` can cut a surrogate pair in half, so the refusal shows an escape like `\ud83d` before `…`. Only the display is affected.

4. **NOTE — a stale timing comment in the test.** The comment above `CHILD_LIMIT_MS` in `brief-check.test.mjs` says the limit "keeps seven children under the 300-second per-file land limit". The file now starts about 30 more children. The measured time is fine; the comment is out of date.

5. **NOTE — bench numbers shift for old prose-first briefs.** `apps/bench/lib/anatomy-sessions.mjs` re-reads old briefs, so their Precedent paths now come from the code span instead of a prose word like `the`. Precedent-pull counts for those old sessions change, and become more accurate.

6. **NOTE — land checklist items still to do.** The lane folder has no `tree-movement.md` yet, and the diff touches neither `HANDOFF.md` nor `docs/sessions`. Both belong in the reviewed change before the final round.

The space-in-path limit is the residual the brief names, and the plan records that none of the 24 such tracked paths is cited in the corpus. The folder-name gap is already recorded in FEAT-006.

VERDICT: LAND
