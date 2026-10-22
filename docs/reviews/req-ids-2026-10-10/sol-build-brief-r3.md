# Review brief — four-digit requirement IDs, build round 3 (final), 2026-10-10 (reviewer: gpt-5.6-sol; roles: scope + adversarial + compatibility)

Your round 2 (`sol-build-r2.md`) sent the lane back: rows and markers depended on JavaScript's and
Python's different `\s`, and a byte-order mark was handled differently. Build round 4
(`build-brief-4.md`, `builder-report-4.md`) put ONE explicit whitespace list in both rails — the
union of both languages' own, so no row either rail reads today becomes hidden — and removes one
leading U+FEFF per file. The seat chose the union over your ASCII-only suggestion because ASCII-only
would silently hide rows that both rails read today (e.g. a no-break space before the ID).

Since round 2 the seat also wrote, before this final round, everything the merge carries (Owner's
rule: nothing is written to main after a land): the seven desk features' frozen status now cites
The owner's 2026-10-10 ruling; R-1000 and R-1001 also apply to project setup (FEAT-014); `HANDOFF.md`
and the session entry in `docs/sessions/2026-10.md` describe the merged state.

Review `git diff 5c266a2..HEAD` closely and confirm the whole change `eeeca20..HEAD` holds; your
verdict covers all of it.

## Attack
1. **Parity.** Run both rails on the same inputs (OS temp dir; TS through `scripts/requirements-trace.mjs`,
   Python through the template `conftest.py` under `uvx --with pytest python`). Find any input — row,
   general file, marker, evidence citation, Part G merge — where they still disagree, or where a line
   the near-miss check accepts as a row is not loaded.
2. **No regressions.** Every candidate line in nana-pi's ledger and both template ledgers still reads
   as a row; no existing row's cells changed except the seven status lines and FEAT-014's
   `Also applies:` line (outside the tables).
3. **Tests pin clauses.** Break the code (TS `.trim()`, Python `.strip()`, drop the BOM removal,
   Python marker `.split()`) and see named tests go red.
4. **Ledger and notes.** The R-1001 rewording; the two shares pass the tree checker (R-292); the
   outline regenerated; `HANDOFF.md` and the session entry claim nothing untrue for the merged state.
5. **Acceptance script.** `node docs/reviews/req-ids-2026-10-10/seat-verify-ids.mjs` must exit 0.

## Output
Answer with the full review as your final message. MUST / SHOULD / NOTE with file:line, evidence and
the smallest fix; score; last line exactly one of `VERDICT: LAND`, `VERDICT: LAND-WITH-FIXES`,
`VERDICT: SEND-BACK`.
