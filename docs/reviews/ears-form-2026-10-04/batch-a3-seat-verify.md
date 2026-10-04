# EARS batch A3 — seat close, 2026-10-04

astra r1 BLOCK 5/10 (6/20 PARTIAL; all three merges rejected; one promise dropped). Fable's method ruling (`bc-method-ruling.md`) changed r2 to read-and-replay with no round 3. In r2 all 11 replayed records turned red, three form MUSTs remained, and the record-coverage gap rate was 27/46 (58.7%).
The worker closed it in `0f87323`. The three dropped promises are restored with honest status: R-851 keeps its `--worker` condition; R-844 keeps "at once" (untested); R-855 keeps "naming file and line" (untested). The 27 gap rows were downgraded to `untested`, each carrying astra's uncovered words as the 6b worklist. 19 rows stay implemented.
Seat checks: verifier `--base main` exit 0; refusal-test exit 0; rail `ears: 100 rows off form (allowance 100)`; EARS_ALLOWANCE 100 and its seal 100 in HEAD; working tree clean.
