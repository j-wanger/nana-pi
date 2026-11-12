# Objective and current priority — nana-pi

*This project tracks its own objective and priority. Session start reads the nearest
`OBJECTIVE.md` walking up from the session's directory, so this file is what a nana-pi session is judged against. Only this file's objective and priority print here; the program file is a fallback for folders without a project objective. Every session must be able to say which of the two lines below its spend served.*

**Objective (since 2026-11-09):** nana-pi is a thinking partner with a crew: the owner says what they want once, the seat turns that intent into small lanes that builders from the owner's roster run without the owner watching, and nothing reaches main until a reviewer from another model family accepts it and CI passes. What the owner and the seat agree lives in the tools that act at that moment, the same kit carries this loop to any project, and everything else must earn its place by use (the owner adopted this definition on 2026-11-09 with "Defaults", decision D1; it replaces the 2026-11-02 wording).

**Current priority (since 2026-11-12):** turn start text into tools, keeping each tool only where a sealed experiment shows it helps the objective (the owner, 2026-11-12: "forget the nov 22nd sitting date, proceed with turning start text into tools, but only if they prove to be useful for our product objective through experiments"). Done 2026-11-12: the start-text inventory and four sealed tests (test-selection name match kept and landed; review waiting for CI, five-part decision points and a follow-up-lane word match not kept). Running to 2026-11-15: the lookup-step and source-line trials; new experiments wait for their readouts (the owner, 2026-11-12: "Hold"). Next lanes, drafted by the seat from the 2026-11-12 assessment and na-na records for the owner to edit: start-text trim 2, slow template tests off the lane path, a dead-code lane, shared helpers, then the setup README and doctor fixes. A tool lands only on a pass, and the start line it holds leaves in the same lane. Measures: median lane hours from first build to land, and net code lines removed from packages, apps, scripts and templates since 2026-11-07, excluding vendored files. (Previous priority, 2026-11-08 to 2026-11-12: reduce nana-pi.)

## Rules

- A new lane opens only by editing the priority line above (one dated commit).
- Session close scores the session against the two lines: CLEAR, STRETCH, or CANNOT.
- Design leads machinery: name how to check the result before code; surfaces are feel-validated by use.
