# EARS batch A2 — seat close of astra r2's mechanical items, 2026-10-04

astra r2 passed the judgement bar (19/20 PINS; all 12 replayed mutation records turned red) and left three mechanical items. The worker closed them in `f06ed4d`. The seat checked:
- Verifier `--base main`: exit 0.
- `refusal-test.mjs`: ALL PASS. A broken mapping exits non-zero, and 18 affected files stay byte-identical.
- astra's malformed extra record, replayed by the seat: exit 1, "PRE-WRITE CHECKS FAILED — nothing written", REQUIREMENTS.md unchanged.
- R-796 is split: the custom-path clause is implemented with its mutation, and the default-store clause is R-830, untested.
The status rule was tightened after A2 r1: `implemented` needs an executed, recorded red mutation, and the verifier enforces it (`mutationRecords: true`). Landed by the seat per batch0-land-ruling.md §5.
