# Astra land ruling — lane T2a, round 2 (confirm the MUSTs)

Your r1 (`t2a-astra-land.md`, 7/10 BLOCK) issued three MUSTs. Worktree `~/nana-pi-wt/t2a` at `47d2027` (fix report `t2a-worker-r6.md`), on top of the seat's merge of main. Clean diff vs main: `t2a-r6.patch`.

**MUST 1 — consumer declarations and the Node floor.**
- A new "Objective contract" section in `AGENTS.md`; one bullet in `templates/_shared/working-under-nana-pi.md`; a paragraph in `templates/_shared/OBJECTIVE.md` describing what a session actually sees (the worker ran the seed through the CLI and confirmed the description matches, and that its new prose is not itself picked up as a marker line).
- Node floor published as ≥ 22.18 in the setup README, the root README row and the CLI header. Failure modes: an older Node prints `OBJECTIVE UNAVAILABLE: Node <v> is older than 22.18 … — upgrade Node` and exits 0 (tested by raising the floor to 99); no node on PATH prints a named marker; doctor gained a `node for the objective hook` check.
- **Seat-verified independently:** the worker's own most-doubted claim was that 22.18 is the right floor. The Node 22.18.0 changelog confirms `module: unflag --experimental-strip-types` (#56350), so type stripping is default from exactly 22.18.0. The floor is correct.

**MUST 2 — doctor's `projectFile` cases.** `projectFileState()` now reports: absent/`null`/`false`/`""`/`OBJECTIVE.md` → ✓ default; a different bare filename → ✓ rename; a separator, `.`, `..` or a non-string → ✗ with the reason and the effective fallback. Tests cover every case through `diagnose()` plus a check that doctor's rule matches the producer's `isBareFileName`.

**MUST 3 — HANDOFF reconciliation, done by the SEAT, not the worker.** You found the lane's patch would delete main's two notices. The seat merged main into the lane and, separately, corrected the entry ON MAIN (`a0d66d6`): the provenance entry had falsely claimed the label Jake ruled was "Implemented in lane T2a" when the lane deliberately left the wording untouched. It now records the ruling as PENDING, states what T2a did structurally, carries sol's and your position that structural safety does not answer the semantic question, and names the open choice. The flaky-test notice is preserved.

Seat-verified: `npm test` → 70 files, 3514 checks, exit 0.

Judge only, ≤30 lines: (1) each MUST FIXED / PARTIAL / NOT FIXED with the line; (2) is the corrected HANDOFF entry now an accurate and sufficient record of the open decision; (3) any NEW defect from this round — in particular the worker's residuals: doctor checks the `node` on its OWN PATH, which may differ from the one Claude Code uses for the hook, and the below-floor path was tested by raising the floor rather than on a real 22.17; (4) your final CARRY list. End with `SCORE: n/10`, MUST (empty if none), CARRY, `VERDICT: LAND` or `VERDICT: BLOCK`.
