Feature: FEAT-040 · Make and keep memory

Lane owner-profile. Class: ordinary. Builder: pi-worker (small lane). Build session 4, on this branch's tip (b16f15b4, reviewed LAND in rounds 1 and 2).

Lane memory-shaper landed on main at d986d4a6. Merge main into this branch. Expected conflicts: `HANDOFF.md` (the "Lanes in flight" line: keep one line reading "- **Lanes in flight (two building).** The memory factory runs as lanes. owner-profile is in its final review; context-anatomy is merging main."), `docs/sessions/2026-10.md` (keep every entry, newest first), `docs/known-bugs/FEAT-040.md` (keep every line from both sides), `REQUIREMENTS.md` (keep both lanes' rows), and the generated `docs/requirements-tree.md` and `docs/code-map.md` (regenerate). Update heading-count assertions only to the merged counts. Change no behaviour.

## Done when

Green on the merged tip: locked full suite (foreground), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, `node scripts/identity-scan.mjs`, and `node packages/nana-pack/bin/nana-writing.mjs HANDOFF.md`. Push and report the finished CI run for the new tip, Windows included; rerun a failed Windows job once and say if you did.

## Precedent

- `docs/requirements-tree.md`: regenerated, never hand-edited.
- `docs/code-map.md`: regenerated.
