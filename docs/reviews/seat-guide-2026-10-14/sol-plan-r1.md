## Findings

**SHOULD — Update the runtime matrix.** Adding `nana-seat.md` makes “Both Claude rules” inaccurate. The plan currently preserves that text and even requires an attempted correction to fail. Change the matrix to name all three Claude rules, while keeping worker and reviewer scoping clear.

**SHOULD — Reconcile seat-authored code changes with the worker rule.** The guide permits “any change of your own to code or tests,” while the standing rule sends every tested code change through the worker and reviewer pattern. Narrow this bullet to pre-build acceptance machinery, or explicitly require the resulting change to pass through a worker.

**NOTE — Headless Claude Code remains unsupported by the wording.** The plan correctly records that ending the turn can terminate a background worker in unattended modes. This is outside the stated threat model, but the guide’s broad scope does not expose that limit.

The revised monitor wording preserves passive failure and stall monitoring. The install, doctor, Windows-copy, stale-copy, and uninstall wiring is coherent. The proposed mutation coverage pins the four requirement changes and the stated honest-edit failures.

VERDICT: LAND
