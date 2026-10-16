No MUST findings.

- **SHOULD — define empty declaration arrays.** `shares_added: []` and `shares_dropped: []` are realistic generated mapping output. Treat them as no change so unchanged share lines remain byte-identical, as R-1181 requires.
- **SHOULD — pin duplicate handling directly.** Explicitly test repeated IDs in `also_applies`, `shares_added`, and `shares_dropped`. The current design fails closed through the tree checker, but direct validator coverage would make the intended boundary clear.
- **NOTE — proof summary accounting.** A byte-copied share line is excluded from carried prose and can inflate “lines inserted.” This does not weaken the proof, but the summary classification is imprecise.

The revised plan closes the fact-check MUST. It uses `parseLedger` as the sole share reader, refuses every other form, independently recounts shares, and specifies the cross-lane key handoff.

VERDICT: LAND
