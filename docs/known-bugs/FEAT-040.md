# FEAT-040 — known bugs

*One line per known bug in this feature. A review finding that does not block a land goes here as one line.*

- Memory maker (memory-making, seat scoring run): the rule maker finds 8 of 46 labelled owner corrections; most corrections are long redirects with no cue word. The model shaper lane is the planned answer.
- Memory maker (memory-making, seat scoring run): precision is 183 of 310; 90 of the false candidates are review MUST titles that are bare labels or fragments, inherited from the review findings reader.
- Memory maker (memory-making, plan residual): evidence pointers into Claude Code transcripts go missing once the runtime's 30-day cleanup deletes the file; the private quote and context keep the record readable.
- Memory maker (memory-making build 1): a review pointer detects a replaced title at an unchanged index only when the caller supplies the expected title.
- Memory maker (memory-making, final review): a pending seat question clears only on an owner turn, so a later short owner reply about something else becomes a decision answering the old question.
- Memory maker (memory-making, final review): correction cues match anywhere in the turn, so a short "don't worry, go ahead" is read as a correction and never as a decision.
- Memory maker (memory-making, final review): seat context requires isSidechain === false exactly; a transcript shape without the field yields no candidates.
- Memory maker (memory-making, final review): owner entries with no timestamp are dropped even with no date window set.
- Memory maker (owner-profile build 2): the maker's evidence resolver rejects a seat-saved pointer whose session key contains a colon.
- Owner profile (owner-profile, plan residual): the pushback probe moved to a later checking lane; until it lands, nothing measures whether the profile makes the seat agree more.
- Owner profile (owner-profile, plan residual): a quote the seat wrongly attributes to the owner is saved like a real one; only the trust ladder limits it.
- Owner profile (owner-profile, final review): show and sync skip the role refusal, so a builder or reviewer that ran show would print owner claims into output that may be committed under docs/reviews; the delivery slice fixes this first.
- Owner profile (owner-profile, final review): privacy is checked only at init; a repo made public later is not re-checked.
- Owner profile (owner-profile, final review): the 2026-10-31 ruling sits above the 2026-10-28 ruling, out of date order.
- Owner profile (owner-profile, final review): with no session variable the session key falls back to the local date while the record date is UTC, so they can disagree near midnight.
- Owner profile (owner-profile, final review): the "locked" reason word is never used.
- Owner profile (owner-profile build 3): a second writer now waits up to 420,000 ms for the clone lock, so a save behind a hung sync can block the seat for seven minutes.
- Memory shaper (memory-shaper, seat scored runs): two runs on the frozen labels miss the bar, with correction recall 28/46 and 26/46 and precision 217/318 and 227/329; the rules stay the maker until the owner decides.
- Memory shaper (memory-shaper, seat scored runs): the shaper finds 54 of 56 review lessons, two fewer than the rules.
- Memory shaper (memory-shaper build 1): the reply schema was array-rooted and every Claude call failed; only the seat's synthetic canary caught it, since tests inject the runner.
- Memory shaper (memory-shaper, final review): the sealed prompt asks for a bare JSON array while the validator expects an object with a units key; the Claude runner works because its schema forces the object, but the pi runner gets no schema and would leave every batch unclassified.
- Memory shaper (memory-shaper, final review): the model check accepts any reply model whose name starts with the requested one, and passes when one of several named models matches (inherited from callJudge).
- Memory shaper (memory-shaper, final review): the token cap is checked before each batch, so one batch can push the total past the cap.
- Owner profile (owner-profile, confirmation review): the lock poll interval is the total wait over 100, now 4,200 ms, so a waiting save can notice a released lock about four seconds late.
- Owner profile (owner-profile, confirmation review): the 28 locked git steps behind the lock wait are not counted from the code; the risk runs only toward waiting too long.
- Requirements (owner-profile, round-3 review): SUB-023 sits above SUB-022 in REQUIREMENTS.md; the tree keeps the same order.
- Requirements (owner-profile, round-3 review): the SUB-022 heading follows the R-3249 table row with no blank line, so a strict Markdown renderer may read it as part of the table.
- Memory making (making-trigger, plan residual): the merge step catches exact normalized repeats only; a reworded duplicate of a saved claim is stored again until upkeep lands.
- Memory making (making-trigger, plan residual): whether a detached making run survives Claude Code's exit, especially on Windows, stays unchecked until the session-end lane.
- Memory making (making-trigger, plan residual): background making draws on the seat's Claude account when a land ends; the day cap bounds tokens, not rate limits.
- Memory making (making-trigger, plan residual): a repository started from another's history (a fork) shares its memory key.
- Memory making (making-trigger, independent recheck): a write killed partway leaves a temp file that readers ignore but the next commit adds to the private store, and nothing counts or removes it.
- Memory making (making-trigger, independent recheck): a damaged, skipped supersede event in the project store shows the old extracted record live beside the saved one, a duplicate rather than a loss.
- Owner profile (making-trigger, independent recheck): a damaged file already in the profile's own records or events folders still blocks saves; only new writes are safe.
- Memory making (making-trigger, independent recheck): the temp name adds 41 characters to store paths, so a long clone folder on Windows can pass the 260-character limit without long paths enabled.
- Memory making (making-trigger, independent recheck): store writes need hard links, so on FAT, exFAT or some network drives every write fails with an error.
