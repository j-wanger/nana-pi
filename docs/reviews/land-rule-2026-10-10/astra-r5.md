## MUST

None.

## SHOULD

None.

## NOTE

Confirmation covers `1836fa3..7db7a536d4be5a02d5b73843fc72f79672eb92e1`.

All three round-4 SHOULDs are closed:
- The session summary correctly names the final non-blank line.
- CHANGE §5 and the pack README correctly explain that rerunning cannot clear an empty verdict; recovery requires a fresh reviewed commit.
- Permanent tests and seat acceptance cover rejected hyphen, en-dash, and decimal scores.

The delta since `6929fb0` contains those fixes and supporting review records and evidence. Production code is unchanged.

Independent verification passed:
- Complete review-ledger and land tests.
- Seat acceptance: zero mismatches.
- Test-coverage check: zero gaps.

Ledger-touching checks used scratch homes. The checkout remains clean. I did not repeat the full repository suite or mutation run.

Previously accepted operational and procedural limits remain unchanged.

**Score: 10/10.**

VERDICT: LAND
