# lane-class · seat check at ccbd535e (build 3), 2026-10-28

Four independent read-only checks ran in one workflow. Nothing was edited in the lane tree.

## Rails — all exit 0

- `npm run map:check`: 450 modules, 0 problems.
- `npm run readme:check`: 780 claims, 0 problems.
- `node scripts/requirements-trace.mjs`: 2079 rows, 0 rows off form.
- `node scripts/requirements-tree.mjs --check`: 0 problems; deliverables 21 of 21 made and read by code, 21 more parked.
- `node scripts/known-bugs.mjs --root .`: names=0 sizes=0.
- `node scripts/identity-scan.mjs`: findings=0.
- `node scripts/lane-class.mjs --root . --base main`: `ordinary`.
- No removed `.mjs` or `.ts` line in the diff contains a backslash.

## Rewording checks — each turned its row red

In a scratch worktree at ccbd535e, one change at a time:

1. "without" to "with" an agreed reading: R-2952 red.
2. The fix sentence deleted: R-2952 red.
3. "Later sources win": R-2950 red.
4. The heading sentence deleted: R-2954 red.
5. `--files <planned files>` removed from AGENTS.md: R-2969 red.
6. Manifest folders dropped from the prefix match: R-2961 red.

## MUST — the extension import hop is gone

`scripts/lane-class.mjs:42` returns `${dir}/`, and `:58` tests `p.startsWith(`${d}/`)`, so it looks for `packages/nana-pack/extensions//`. Zero modules match; with one `/`, twelve do. Run alone with `--files`, against the same graph:

| File | 602edced (build 2) | ccbd535e (build 3) |
|---|---|---|
| `packages/nana-pack/lib/pipe-guard.mjs` | hook, imported by `nana-gate.ts` | ordinary |
| `packages/nana-pack/lib/post-edit-config.mjs` | hook, imported by `nana-post-edit.ts` | ordinary |
| `packages/nana-pack/lib/writing-config.mjs` | hook, imported by `nana-writing.ts` | ordinary |
| `packages/nana-stage/lib/sign.mjs` | hook, imported by `nana-stage.ts` | ordinary |
| `packages/nana-knowledge/lib/tokenize.ts` | hook, imported by `nana-knowledge.ts` | ordinary |

Three of the four checks found this independently. Eleven of the 21 libraries that extensions import change class. The R-2963 check stays green because its only hook case goes through a launched CLI.

## SHOULD — a bold Must-meet after `## Precedent` is refused

`readBrief` on `## Precedent\n- AGENTS.md\n\n**Must-meet**\n1. R-1: …` reads `[AGENTS.md, R-1]` as Precedent, and `checkPrecedent` refuses `R-1`. With `## Must-meet` it passes.

## Agreed with the seat

- The ten landed lanes print the same class as at build 2. planner-prompt prints `ordinary`; it edits the rulings file the nana-rulings extension reads, which is the owner's widening question (issue 242), not a script error.
- Planned lists: page-on-pages prints `ordinary`; issues-home prints `gate: packages/nana-pack/bin/nana-land.mjs — land tool`.
- Backslash and `./` forms print the same line as posix paths.
- No edit outside the brief; the AGENTS.md marker region is byte-identical to the template render.

## NOTES, not sent back

- R-2969's row says "project section", but its check matches the line anywhere in AGENTS.md. Wording only.
- The `--files` placeholder did not say comma-separated; brief 4 fixes it in passing.
