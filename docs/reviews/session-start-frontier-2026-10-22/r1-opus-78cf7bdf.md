**Final review: session-start-frontier, b5b5f8c2..8d87c948**

No MUST finding stands. Every one of the eight must-meet tests is present, and the seat's 18 wrong-code pairs each turned a test red.

**What I checked**
- **The checker move.** `checkFrontier` in `packages/nana-pack/lib/frontier-check.mjs` builds heading stacks in one pass. Its `heading.end` matches the old "next heading at the same or higher level" boundary: the stack is ordered by level, so a heading is removed only by the first later heading of equal or higher level. The read-window end calculation is the same as before. The frontier baseline test passes, so the checker CLI's output is unchanged.
- **The hook.** `nana-objective.mjs` runs the objective producer first, then the frontier producer with `--max 9000 - objectiveLength`. Both run through `runHookProducer` under the 1.5 s limit. Two producers fit under the installed `timeout: 5`, the same arithmetic as the adoption hook (R-2013). The tag line adds 16 characters on top of 9,000, still under the 10,000 cap. When a producer prints nothing, `runHookProducer` writes nothing and returns 0, as before. The other hooks ignore its new return value.
- **The pi extension.** It recomputes the block on every `session_start` and is loaded automatically from the extensions folder named in `package.json`. It sets its section the same way `nana-objective.ts` and `nana-rulings.ts` do, and never throws.
- **Runs.** I ran the five lane test files (summary, golden, hook, deadlines, baseline) locally: 5 of 5 pass. On this repo, the producer shows 7 Next titles and 26 asks with the one blocking ask first. At `--max 600` it keeps the blocking ask and counts the 29 titles it left out. At `--max -50` it prints the omitted line, and at `--max abc` the fail-open line. The real hook from a subfolder prints `[nana:objective]`, then `[nana:frontier]`, 3,058 characters in total.
- **Roles.** My own session runs with `NANA_ROLE=reviewer`, and the producer correctly printed nothing until I unset it.

**SHOULD / NOTE (not blocking)**
- NOTE: an ask written with bold around the tag only, like `- **[blocking, since …]** text`, renders as `[blocking, since …] **** text`. The title pattern needs the title inside the bold, and the fallback strips only the tag. This is cosmetic, and the repo's own asks use the `**[tag] Title.**` form. It is not yet in the FEAT-002 known-bugs file.
- NOTE: the slow title selection on huge files and the negative count in the omitted line are already recorded as FEAT-002 known bugs. The slow case only appears with over 15,000 list items, and the largest seat-written HANDOFF measured is 24 KB.
- NOTE: `hook-producer.mjs` now imports from nana-pack. That file has no imports itself, `map:check` is green, and the hooks already run from the checkout, so this is acceptable.

The Windows CI leg was not checked here. The seat's land-on-green condition covers it.

VERDICT: LAND
