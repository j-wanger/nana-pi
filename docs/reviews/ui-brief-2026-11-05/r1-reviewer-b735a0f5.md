I found no MUST. The change does what option A asked: a seat writing a UI lane brief in any project can find and follow the template.

**What I ran on tip `90fe8494`** (all exit 0):
- **Seat-guide and rulings tests:** all 21 seat-guide checks pass, including R-3161, R-3162 and R-3163.
- **Requirements trace:** passes. R-3161 to R-3163 are new IDs with no clash.
- **Map and README checks:** map 613 modules, 0 problems; README 1090 claims, 0 problems.
- **HANDOFF and writing:** `nana-writing` passes on `HANDOFF.md` and the template, with no sentence over 25 words and no banned word. Six HANDOFF and writing tests pass.
- **Identity scan:** clean on the template, HANDOFF, the session note, the guide, the plan and the source template.
- **Size:** the guide is 5645 bytes, under the 8192-byte read limit for pi.

**The questions in the brief**
- **The bullet works from other projects.** It names `$HOME/nana-pi/docs/ui-brief-template.md`, the same absolute form the guide already uses in RULE_7 and RULE_16. `$HOME` works in bash and in PowerShell. Today `~/nana-pi` on main does not have the file yet; it appears once this lands and that checkout pulls.
- **The doc mostly stands alone in a public repo.** It has no names or work references. The library link was the owner's choice, and the link alone doesn't let a stranger open the private artifact. Two gaps are below (S1, N3).
- **The gates stay within each lane's spec, with two additions the plan allows.** "No network" applies only when the spec asks for an offline page. The anchored rating is a recommendation and does not block a land. The phone-width scroll check and the contrast check are extras, and R-3163 allows them by name.
- **The four rows match their tests.**
  - R-1140's closed list now holds 18 entries: 17 rules plus the role-launch rule. This matches "seventeen original rules and R-3536's role-launch rule".
  - The R-3161 test checks that the bullet appears exactly once, right after visual-reader.
  - The R-3162 test reads the template through the path in RULE_17, so a moved doc fails it.
  - Removing the bullet or the doc turns these tests red.

**Findings**

- **SHOULD S1. The owner-picks mode can't be followed from the doc alone.** At `docs/ui-brief-template.md:15-17`, the seat must add metadata to "the file kept by the project that maintains the library", and to read stars from "the library's `picks` collection".
  - *Input:* a seat in another project, or a pi seat with no way to read artifact data, has an owner who wants a say.
  - *Consequence:* it cannot find the metadata file or read the stars, so it falls back to seat picks or has to ask.
  - The default mode, seat picks, works. Record as a known bug.
- **NOTE N1. The phone-width check still covers desktop-only pages.** At `docs/ui-brief-template.md:44-45`, the 390-pixel check applies unless the spec names another width.
  - *Input:* a dashboard spec that says nothing about width.
  - *Consequence:* the seat withholds the build or asks for a phone fix the spec doesn't ask for.
  - The rule "show only builds that pass" also pulls against RULE_13, which says to show the owner build 1's shots with the shape question.
  - R-3163 accepts this, so it is within the plan.
- **NOTE N2. Two tests don't check every part of their rows.**
  - In R-3162, the checks `/look/i` and `/captur/i` are also met by "look carefully before you design" and "Capture each at 1440". Deleting the line "by looking at captures, not names or descriptions" still passes.
  - In R-3163, adding a second, unbounded "no network" line would still pass.
- **NOTE N3. The template's first line says "The seat tested u1–u7"** without saying these were experiments. A public reader can't tell what the labels mean. Plan A1 meant to fold the numbers into one evidence paragraph.
- **NOTE N4. Small wording points in R-1140.** Its evidence cell has a double space after the new citation, and "seventeen original rules" counts the new rule as "original". Neither affects the trace.

VERDICT: LAND
