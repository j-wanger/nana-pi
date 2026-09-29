1. **R1 HIGH — FIXED:** nested `/trust` no longer falsely clears; remedy names the governing file’s root folder (`objective.ts:318`), pinned through real `ProjectTrustStore` (`objective-golden.test.mjs:630-635`).
2. **R1 MED — FIXED:** fail-closed wording now claims only “no usable affirmative trust record could be confirmed” (`objective.ts:317`).
3. **R1 MED — FIXED:** all four requested surfaces describe the label (`AGENTS.md:25`, `working-under-nana-pi.md:33`, `OBJECTIVE.md:8`, `project.mjs:309`).

4. **HIGH — remediation is still not universally true.** The label covers malformed, wrong-shape, unreadable, foreign-owned, directory, FIFO, and oversized stores (`objective-golden.test.mjs:674-689`), but line 2 unconditionally says `/trust` clears it.
5. With malformed JSON, pi’s `/trust` calls `trustStore.getEntry(cwd)` before showing its selector (`interactive-mode.js:4298-4301`); that throws, and `setMany` likewise cannot repair the store. I reproduced both failures.
6. Foreign-owned/unwritable stores can fail similarly; a legitimately still-over-1-MiB store may remain rejected after pi rewrites it. Thus a real owner can follow the displayed instruction exactly and retain the label.

7. **Verified positive cases:** ordinary “Trust” works; “Trust parent folder” also works because it records the canonical parent and removes the cwd entry (`trust-manager.js:47-51`).
8. A symlinked start path works: pi canonicalizes on write and nana canonicalizes on lookup.
9. A governing file selected by `objective.projectFile` works because remediation and lookup use `path.dirname(governing)`, independent of filename.
10. Golden corpus independently rerun: **541 PASS**.

11. **NEW LOW:** `working-under-nana-pi.md:33` and `templates/_shared/OBJECTIVE.md:8` say “until the owner vouches,” which is false when the owner vouched but nana cannot confirm the store. `project.mjs:309` similarly overpromises `/trust`.
12. **CARRY for Astra:** block until the label truthfully covers trust-store failure—e.g. instruct repairing/removing `~/.pi/agent/trust.json` if `/trust` errors or the label persists—and add that regression.
13. Deferred `nana-setup trust <dir>` is a **follow-up, not itself a blocker**; truthful built-in recovery text is sufficient to land.

VERDICT: BLOCK
