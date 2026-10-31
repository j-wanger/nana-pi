# FEAT-040 — known bugs

*One line per known bug in this feature. A review finding that does not block a land goes here as one line.*

- Memory maker (memory-making, seat scoring run): the rule maker finds 8 of 46 labelled owner corrections; most corrections are long redirects with no cue word. The model shaper lane is the planned answer.
- Memory maker (memory-making, seat scoring run): precision is 183 of 310; 90 of the false candidates are review MUST titles that are bare labels or fragments, inherited from the review findings reader.
- Memory maker (memory-making, plan residual): evidence pointers into Claude Code transcripts go missing once the runtime's 30-day cleanup deletes the file; the private quote and context keep the record readable.
- Memory maker (memory-making build 1): a review pointer detects a replaced title at an unchanged index only when the caller supplies the expected title.
