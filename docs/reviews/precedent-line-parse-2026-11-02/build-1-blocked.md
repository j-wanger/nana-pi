# Build 1 — blocked before requirement changes

Feature: FEAT-006 · Launch builders with execution limits

## Scope conflict

Revision 2 explicitly classifies a bare single word without a slash or extension as prose. With no code span, it must refuse. The constraints allow changing only the R-2580 bare `tracked` fixture in `packages/nana-pack/tests/worker-lane.test.mjs`.

That file also requires bare `seed` to pass in its shared default brief, R-2580 cases, R-2616, R-2617, R-2618, R-2619, R-2620 and R-2581. Its fixture tracks a file named `seed`. Tracking that file cannot make the first word path-shaped under Revision 2. The parser must reject it before membership can allow it.

Examples:

- `defaultBriefText` contains `Precedent:\n- seed\n`.
- R-2580's plain-label case contains `Precedent:\n- seed\n` and expects status 0.
- R-2619 expects `- **seed** — note` to launch.

The mandated refusal format also conflicts with protected assertions. R-2579 looks for `"<entry>" is not tracked`; R-2616 and R-2617 look for `"missing.mjs" is not tracked`. Revision 2 instead requires `"<chosen value>" in bullet "<original bullet text>"`. R-2579's bare `tracke` also has no selectable path under the new rule.

No implementation can satisfy both the selection rule and these unchanged launch expectations. Special-casing `seed` would violate the plan. Editing those fixtures would exceed the explicit scope.

## Required authorization

Allow existing worker-lane test edits wherever Revision 2 makes a fixture or assertion false, not only the bare `tracked` fixture. Preserve each test's existing purpose by backticking extensionless fixture paths and updating refusal assertions to the required format. Review other affected tests for the same fixture issue before implementation.

## Work state

- Read all named Precedent files, the plan, the attack, affected existing rows and the complete feature known-bug file.
- No requirement, test, parser, config, prompt or README changes.
- No exports or departures from Precedent.
- No known-bug fixes; no known-bug file changes.
- No new tests or mutation runs; implementation stopped before the requirement diff.
- Corpus, wrong-code and green-run artifacts remain unbuilt.
- Full suite deferred under AGENTS.md's CI-covered-suite rule; no CI access or push.

## Commands

- Worktree and branch inspection: exit 0.
- `git diff --stat`: exit 0, no tracked changes before this record.
- Writing CLI `--help` probe: exit 0, but the CLI interpreted it as a filename; not a successful help check.

This is a blocker record, not a findings list or implementation evidence.
