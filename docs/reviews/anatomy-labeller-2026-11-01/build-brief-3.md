Feature: FEAT-042 · Measure builder context

Lane anatomy-labeller (Part 1). Class: ordinary. Builder: pi-worker (small lane). Build session 3, on branch tip be5d10cf. Confirmation round 2 (kept in this folder as `r2-*.md`) sent back one MUST: the merge of main restored two `docs/known-bugs/FEAT-039.md` lines that main deleted on purpose (the R-3104 timeout lines, removed by the audit-test-speed lane's fix). The seat's brief 2 caused it by asking for a union.

## Precedent

- `docs/known-bugs/FEAT-039.md` as on `origin/main` (81b78dfa)

Report each departure.

## Build

Make `docs/known-bugs/FEAT-039.md` identical to `origin/main`'s copy: remove the two restored R-3104 lines ("Component audit (component-audit, CI): the R-3104 activity test exceeded its 20 s case limit…" and "Component audit (hive-render build 4, CI): the R-3104 Windows timeout recurred…"). Change nothing else.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

`git diff origin/main HEAD -- docs/known-bugs/FEAT-039.md` prints nothing, and every file this lane did not set out to change matches `origin/main` (`git diff origin/main HEAD --stat` lists only `apps/bench/`, `REQUIREMENTS.md`, `docs/code-map.md`, `docs/requirements-tree.md`, `docs/sessions/2026-10.md`, `HANDOFF.md`, `docs/known-bugs/FEAT-042.md` if changed, and this lane's review folder). The known-bugs check and `node scripts/identity-scan.mjs --root .` exit 0. Commit, push the branch and stop.
