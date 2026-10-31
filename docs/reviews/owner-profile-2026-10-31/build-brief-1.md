Feature: FEAT-040 · Make and keep memory

Lane owner-profile. Class: ordinary (re-run lane-class after the build; the seat guide edit may change it). Builder: pi-worker (larger lane). Build session 1, on main e5db630e.

The owner wants a memory factory with six stations and two memory types; this lane is the user-facing store: a private profile repo the seat saves to automatically, synced across the owner's machines, with a trust ladder. The owner took every default on issue 278: saving stays off on each machine until enabled there; until delivery lands the seat saves to both the profile and today's shared memory; the private repo is `nana-profile`, cloned to `nana-profile` in the home folder.

Build the plan of record, `docs/reviews/owner-profile-2026-10-31/plan.md`, revised after its adversary pass (`plan-attack.md`; see "Revision after the attack"). Build every must-meet test it names. Follow its Precedent, Assumptions and Threat model. IDs: a subgroup under FEAT-040, rows R-3230 to R-3249, artifact A-090.

The record shape: lane memory-making is building `packages/nana-pack/lib/memory-making-config.mjs` on `feat/memory-making` now; it is not on main. Fetch that branch and, if the file exists there, copy only its shape field list block into the same path here, unchanged. If it does not exist yet, create that file with only the shape block, using the field names in `docs/reviews/memory-making-2026-10-31/plan.md` on that branch. Report which you did; the seat reconciles the file when the second of the two lanes merges main.

Helper move authorized: the private config-write tail of `packages/nana-pack/lib/roster-set.mjs` moves to a new exported `packages/nana-pack/lib/pack-config-write.mjs`, as the plan says; `nana-roster.mjs` keeps loading `roster-set.mjs` through its dynamic import only. No other private helper moves.

One more change the owner made today: raise the lane cap from two building and one planning to four building and two planning ("lets up the build slots", 2026-10-31). Change it in `packages/nana-setup/claude/rules/nana-seat.md` (the bullet), `packages/nana-setup/tests/seat-rule.test.mjs` (its rule constant, comment and test title), R-1140 in `REQUIREMENTS.md` (its text and the renamed test title in evidence), `packages/nana-pack/rules/nana-rulings.md` (a new 2026-10-31 ruling line for the cap; remove only the cap sentence from the 2026-10-16 line and keep its other two sentences), and the dispatch-yard chapter text in `apps/hive/city.json`. Grep for any other copy before you finish.

Privacy: the repo is public. Fixtures are synthetic; tests use temp homes, local bare remotes and a stubbed `gh`. Do not create or touch any real GitHub repo; the seat creates the private repo with the owner after the build.

## Show your work

A run of `init`, `save`, `show` and `sync` against two temp clones of a local bare remote, with output. Locked full suite in the foreground.

## Done when

The plan's rows are `implemented` with backticked `file::title` evidence. These checks are green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs`. Push the branch, open a draft pull request at build 1, and report the finished CI run for the new tip. A Windows R-3104 timeout is a known flake: rerun the failed job once.

Report: every row and test changed; the sample run; which shape path you took; each departure from the Precedent.

## Precedent

- `packages/nana-pack/lib/memory-making-config.mjs` (from `feat/memory-making`): the record field list.
- `packages/nana-pack/bin/nana-roster.mjs`: reading one member of the user-scope `nana-pack.json`.
- `packages/nana-pack/lib/roster-set.mjs`: the config write (helper move above).
- `packages/nana-pack/lib/json-text.mjs`: `parseJsonBytes`.
- `packages/nana-pack/lib/gh-runner.mjs`: the injectable `gh` seam.
- `packages/nana-pack/lib/release-status.mjs`, `scripts/template-release.mjs`: bounded git children; a push that reports.
- `packages/nana-pack/lib/lane-lock.mjs`: an exclusive lock with a bounded wait.
- `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/lib/suite-records.mjs`: exclusive-create record files.
- `packages/nana-setup/claude/hooks/nana-shared-memory.mjs`, `packages/nana-setup/lib/shared-memory-config.mjs`: budget and fold line for `show`.
- `packages/nana-setup/claude/rules/nana-seat.md`, `packages/nana-setup/tests/seat-rule.test.mjs`: the seat guide and its test.
