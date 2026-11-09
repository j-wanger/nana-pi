Feature: FEAT-031 · Run checks reliably and without contaminating work
Serves: roadmap step 3 — trim each helper's starting context, starting with its largest measured part

# Plan: agents-trim

## Why

The load log (`~/.pi/agent/nana-context-loads.jsonl`, last 60 launches, 2026-11-09) shows every builder and adversary launch receives the project's `AGENTS.md` as its context file, 19,977 characters. That is about three times the next largest part (known bugs, 6,079) and four times the builder preamble (4,807). The shared working section, `templates/_shared/working-under-nana-pi.md`, is 10,623 of those characters and is emitted into every project's `AGENTS.md`. Most of it is seat procedure. Seats already get that procedure elsewhere: Claude Code seats through `nana-soul.md` and `nana-seat.md`, and pi seats through the seat guide that `packages/nana-pack/extensions/nana-rulings.ts` injects. Builders get their rules from `packages/nana-pack/prompts/builder-preamble.md`, and reviewers from the review standard.

## Design (after the adversary, 2026-11-09)

1. Cut the shared section to what any session in a project folder needs: the runtime table (or a shorter equivalent), startup reads, the advisory-gate warning, "builders and reviewers put open questions in their report; only the seat posts issues", where seat procedure lives, and pointers to the seat guide and builder preamble.
2. Delete seat procedure that is duplicated elsewhere: the land checklist, review ladder, default pattern, launchers, larger lanes, plan rules and issue-posting detail. Before deleting a rule, confirm it is in `nana-seat.md`, `nana-soul.md`, `nana-rulings.md`, the builder preamble or the review standard. A rule found nowhere else moves to the seat guide only if the guide stays under its 8,192-byte cap (`packages/nana-pack/lib/rulings-config.mjs`; 7,109 bytes today). Otherwise it moves to `nana-rulings.md` or `nana-soul.md`, whichever already holds its topic. Raise no caps.
3. Regenerate nana-pi's `AGENTS.md` region with `nana-setup project` (or the generator its tests use). Trim this repo's own sections after the marker only where they duplicate the shared section.

Not doing: a role-specific context passed by pi-worker. pi loads `AGENTS.md` from the cwd itself, so an extra context would duplicate it.

## Must-meet tests (R-3965–R-3967)

- M1 (R-3965): the shared section is at most 4,500 characters. This is a chosen tunable defined once, with one pinning test. It is roughly the size of the parts a builder needs.
- M2 (R-3966): the seat guide still loads in full for a pi seat after this change. It stays under its cap, and the existing delivery test passes unchanged.
- M3 (R-3967): every rule the lane removes from the shared section is either present in a named seat, ruling or soul file, or listed in the lane report as deleted, with the reason. This is a report check that the reviewer verifies, not a test.

Existing tests that pin moved wording are updated to read the new home. They are not deleted unless their only subject was the removed duplicate. The adversary listed candidates: templates-working, templates-render, project-working-region, project-stale, entry-guidance, seat-rule, rulings, one-reviewer, land-merge, land-ci-read, win-main-only, review-paperwork and credential-strip.

## Validation

- The load log after the land shows the builder's context file at least 35% smaller than 19,977.
- The next real lane's builder runs with the trimmed file. Its report and review show no departure caused by missing guidance.
- `node scripts/requirements-trace.mjs`, `npm run map:check` and the readme check are green.

## Precedent

- `templates/_shared/working-under-nana-pi.md`: the shared section.
- `packages/nana-setup/lib/working-region.mjs` and `packages/nana-setup/lib/project.mjs`: the generator.
- `packages/nana-setup/claude/rules/nana-seat.md`, `packages/nana-setup/claude/rules/nana-soul.md` and `packages/nana-pack/rules/nana-rulings.md`: the seat-side homes.
- `packages/nana-pack/lib/rulings-config.mjs`: the seat-guide cap.

## Threat model

Honest variation in which sessions read which file is in scope. Deliberate forgery is out.
