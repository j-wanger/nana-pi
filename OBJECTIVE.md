# Objective and current priority — nana-pi

*This project tracks its own objective and priority. Session start reads the nearest
`OBJECTIVE.md` walking up from the session's directory, so this file is what a nana-pi session is judged against. The program (umbrella) lines from `~/nana-agent-loop/OBJECTIVE.md` still print below these as `program objective:` and `program current priority:`. Every session must be able to say which of the two lines below its spend served.*

**Objective (since 2026-11-02):** nana-pi is the shared toolkit and experience for building products with agents: the pi pack, the seat and its builders and reviewers, setup, the desk and project templates (seat wording, 2026-11-02, written when the owner said "give nana-pi its own objective file"; the owner can change it).

**Current priority (since 2026-11-08):** reduce nana-pi: cut machinery that does not earn its cost while keeping the core lane process, setup, the pack and templates working, using the na-na experiments as evidence (the owner, 2026-11-07: "start doing a reduction process on nana-pi, I want to cut down the extra unnecessary machineries while maintaining the core functionality and capability"; the owner adopted the seat roadmap on 2026-11-08: "Go with your recommendations"). Order: finish the test-pack and lane-push CI lanes, then stop CI work; retire tests by evidence; trim each helper's starting context and log what it loads (this carries the earlier context-craft priority); retire the memory scoring tools and the setup retirement list; ship the data pack as a template feature; then a structure pass. Measures: median lane hours from first build to land, and net lines removed from main since 2026-11-07. Review on: 2026-11-22. (Previous priority, 2026-11-02 to 2026-11-08: craft each role's context by design, measured by drop tests; the owner replaced it with reduction before its 2026-11-16 review, and its context work continues as the third step.)

## Rules

- A new lane opens only by editing the priority line above (one dated commit).
- Session close scores the session against the two lines: CLEAR, STRETCH, or CANNOT.
- Design leads machinery: must-meet tests come before code; surfaces are feel-validated by use.
