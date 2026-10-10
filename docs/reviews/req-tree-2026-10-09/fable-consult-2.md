# Fable second opinion: lock the approved tree? (2026-10-09, before sol plan round 3)

Question: sol r1 MUST 3 / r2 MUST 1 asks the suite to pin the approved tree against a committed
manifest. Options weighed: (A) a generated outline with a staleness check, (B) sol's hand-kept
manifest, (C) decline and put the control in increment 2.

Fable's read (summary):
- The failure mode is real as slow rot, not an increment-1 risk: until increment 2 the editors are
  the seat and Jake, with a reviewer reading the diff. A decay and a legitimate regroup are the
  same edit; only a declared intent tells them apart, and that lives in the lane brief (increment 2).
- (B) is weaker than it looks: an agent's goal is a green suite, so it edits both files. The only
  editor it slows is Jake renaming by hand — friction on the owner, not control over sessions.
  Correction to the seat: under sol's r2 wording new rows are exempt, so "every new row is a
  two-file edit" is not true; drop that reason.
- (A) is right in shape: the tree test already needs a heading parser; a renderer over it is cheap.
  The output is both Jake's permanent navigation outline (the one-off `outline.md` goes stale after
  the move) and a compact diff surface. Agents will regenerate it blindly, as with the code map;
  that is fine — visibility is enough once increment 2 gives the reviewer a yardstick.
- Contents: structure only (ID, label, purpose, nesting, row count, row IDs as ranges); no status
  mix (it churns every lane; `req:rows` reports it).
- Option D = (A)'s artifact now + (C)'s control in increment 2, no manifest; narrow the NOT list's
  "browser page or generator" to "an HTML page"; put the governance line to Jake as a decision.
- Most likely wrong: that the renderer stays cheap once scattered rows make ranges long.
  (Seat measured: longest range line 126 characters, all lists 3.2k characters in total.)

Seat: adopted D in full.
