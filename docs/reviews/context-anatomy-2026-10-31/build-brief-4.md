Feature: FEAT-041 · Shape each agent's context by role

Lane context-anatomy. Class: gate. Builder: pi-worker (small lane). Build session 4, on this branch's tip (5cc0bcb4).

Build 3 merged main before two more lanes landed. Main is now 11454d44: lane memory-shaper (SUB-022, R-3251 to R-3269, A-091) and lane owner-profile (SUB-023, R-3230 to R-3249, A-090, the new lane cap in the seat guide, the rulings file, R-1140 and the city text, `docs/memory-factory-design-2026-10-31.md`). Merge main. Keep every landed ID exactly as on main; this lane's IDs stay FEAT-041, R-3210 to R-3229 and A-089. Keep both sides of HANDOFF's "Lanes in flight" line as one line reading "- **Lanes in flight (one building).** The memory factory runs as lanes. context-anatomy is in its final reviews." Keep every session entry and known-bug line. Regenerate `docs/requirements-tree.md` and `docs/code-map.md`; update heading-count assertions only to the merged counts. Confirm with `git diff main -- REQUIREMENTS.md` that no landed ID changed. No behaviour change. Re-run the wrong-code pair runner after the merge.

The macOS install check fails at `pi post-edit` only inside the builder's environment (a known bug); the seat runs it from its own shell. Report its result but do not chase it.

## Done when

Green on the merged tip: locked full suite (foreground), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, `node scripts/identity-scan.mjs`, `node packages/nana-pack/bin/nana-writing.mjs HANDOFF.md` and the pair runner. Never commit private logs. Push and report the finished CI run for the new tip; rerun a failed Windows job once and say if you did.

## Precedent

- `docs/requirements-tree.md`: regenerated.
- `docs/code-map.md`: regenerated.
- `packages/nana-pack/tests/requirements-tree.test.mjs`: heading counts.
