Feature: FEAT-042 · Measure what each role's context is for

Lane seat-anatomy. Class: ordinary. Builder: pi-worker (small lane). Build session 4, on branch tip a4e5f72d. The final reviewer sent round 1 back (`r1-reviewer-a4e5f72d.md` in this folder; read it whole): one MUST and two SHOULDs, all taken here.

## Precedent

- `apps/bench/lib/anatomy-seat.mjs` (the start-window end at line 129)
- `apps/bench/README.md` seat section (the listed events that end a start window)
- `apps/bench/lib/anatomy-config.mjs` (`SEAT_POLICY.hooks`, `SLOT_MARKERS`)
- `packages/nana-setup/lib/settings.mjs` around lines 207-210 (the public hook status labels)

Report each departure.

## Build

1. MUST (R-3641): end the start window only on the README's listed events (assistant work, owner turns, tool results, queued commands, prompt hooks). Other attachments and bookkeeping entries (`total_tokens_reminder`, `file`, `task_status`, `invoked_skills`, tool-list updates, environment, model) stay inside the window. A boundary, its summary and the SessionStart:compact hooks open one segment. Add a T2 fixture in the real order the review lists: boundary, instructions, session context, date, summary, token reminder, file, task status, invoked skills, tool lists, environment, compact hooks, prompt snapshot. Its expected values must fail on the current code.
2. SHOULD 1: a startup or /clear segment's first system-prompt snapshot and instructions count as start content even when they arrive after the owner's first prompt. If that cannot hold without breaking the README's contract, make the table say exactly what it measures instead, and report which you chose.
3. SHOULD 2: hook kinds match the real `command` status labels (from `settings.mjs`, imported, never retyped), so objective, adoption and roster-notice appear as their own kinds. A `hook_additional_context` entry with no command is attributed to its hook's kind when the preceding hook entry names it; otherwise it stays `hook-other`. One fixture case each.
4. Regenerate `seat-counts.md` from the real seat transcripts with the lane's own command, counts only, as before.

Change nothing else. Builder golden output must stay byte-equal. Never print or write transcript text, owner text or session ids. Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: every test file this lane touched, `node packages/nana-pack/tests/test-runner.test.mjs`, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, and `node scripts/identity-scan.mjs --root .` after `git add`. Do not run the locked full suite; CI is the suite. Push and stop.
