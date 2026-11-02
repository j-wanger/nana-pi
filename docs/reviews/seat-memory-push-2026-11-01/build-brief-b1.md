Feature: FEAT-044 · Deliver memory to each role

Lane seat-memory-push (Lane B). Class: hook (`packages/nana-setup/claude/hooks/nana-shared-memory.mjs`). Builder: pi-worker (larger lane). Build session 1, on main ac20e30a, after Lane A landed. The plan of record is `plan.md` in this folder (revision 2, after `plan-attack.md`); this lane is its "Lane B": the bundle maker, the renderer, the seat push assembler and the hook change, must-meets B1 to B7, rows R-3412 to R-3421 under the new FEAT-044 (purpose line in the plan's Feature section). Follow the plan's Design, Precedent, Assumptions and Open choices (take its defaults; issue #299 had no reply). "The replay lane's change" section is a later lane, out of scope here.

Threat model: honest variation in our tools' output is in scope (missing pointer or marker, damaged profile JSON, slow git, linked worktrees, any `NANA_ROLE`, `CI`, the `memoryPush: false` switch, records of every trust, source and kind); deliberate forgery, such as a planted store or hand-made events, is out.

## Precedent

- `packages/nana-pack/lib/profile-store.mjs` (`show`)
- `packages/nana-pack/lib/memory-store.mjs` (`readMemoryStore`)
- `packages/nana-pack/bin/nana-memory.mjs` (repository resolution and early refusals)
- `packages/nana-pack/lib/profile-guards.mjs` (`seatGuard`)
- `packages/nana-setup/claude/hooks/nana-shared-memory.mjs`
- `packages/nana-setup/lib/hook-producer.mjs` (`HOOK_DEADLINE_MS`)
- `packages/nana-pack/lib/context-load-log.mjs` (`appendContextLoad`)
- `packages/nana-pack/lib/known-bug-digest.mjs`
- `packages/nana-setup/tests/shared-memory-budget.test.mjs` and `packages/nana-setup/tests/shared-memory-hook.test.mjs` (they pin the no-push bytes and must stay green unchanged)
- `packages/nana-pack/tests/profile-fixture.mjs` and `packages/nana-pack/tests/memory-run-fixture.mjs`

Report each departure.

## Build

Requirement rows first (FEAT-044 with its purpose line, R-3412 to R-3421, the A-089/A-090/A-093 reader and maker lines the plan names), then the tagged tests (wrong code first: each new test red against main's code), then code. Moving the repository-resolution helper from `nana-memory.mjs` into `memory-store.mjs`, and the hook's header, fold line and shortener into `memory-render.mjs` unchanged, are authorized moves; every caller imports, none copies. Write the seat's wrong-code pairs into `docs/reviews/seat-memory-push-2026-11-01/seat-mutate.mjs` using the shared mutation runner, at least one pair per must-meet, and run it. Create `docs/known-bugs/FEAT-044.md` with the plan's Residuals as lines. Update both READMEs where the hook or memory delivery is described. Use only synthetic stores; never read the real profile or memory store, and never print record text outside synthetic fixtures.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: every touched test file, the two unchanged shared-memory tests, the mutation runner (every pair red), `npm run map:check`, `npm run readme:check`, the requirements trace, `npm run req:tree` then the tree check, the known-bugs check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Run `node packages/nana-setup/bin/install-check.mjs` and report its exit (a `pi post-edit` write-error is the known builder-environment failure). Do not run the locked full suite; CI is the suite. Push the branch, open a draft PR against main, and stop.
