Feature: FEAT-002 · Resume decisions and next actions

Lane posting-rule. Class: ordinary (`node scripts/lane-class.mjs --root . --files` on the planned files prints `ordinary`). Builder: pi-worker (small lane). Build session 1.

Work in the lane worktree on feat/posting-rule, based on main at cb7832da. The plan of record is `docs/reviews/posting-rule-2026-10-28/plan.md`. Read it whole, and read `plan-attack.md` beside it for the reasons behind each must-meet. The plan has no list of allowed edits.

What the lane does, in one sentence: the carry rule says that where a HANDOFF points to its GitHub issues, the seat posts each open item as an issue and never also writes a HANDOFF line.

Build must-meet 1 and 2 and the plan's two known-bug items. There are no new requirement rows; update R-682's text first, then its check, then the three copies.

- The three copies are `packages/nana-setup/claude/rules/nana-soul.md`, `templates/_shared/working-under-nana-pi.md` and AGENTS.md's marker region. R-859 keeps AGENTS.md's region byte-identical to the template.
- The four sentences in must-meet 1 are exact. Do not reword them.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background. Another lane's suite may hold the machine-wide lock; waiting for it is expected.

## Done when

R-682 stays `implemented` with its evidence, and the locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green.

Report: R-682's check as written; the rule bullet as it now reads in nana-soul.md; proof the check fails on the old wording and on old plus new (run it against a scratch copy, not a committed one); each departure from the Precedent below with its reason; every existing test you changed.

## Precedent

- `packages/nana-setup/claude/rules/nana-soul.md:37`: the carry bullet.
- `templates/_shared/working-under-nana-pi.md:17`: the shared copy.
- `packages/nana-pack/tests/templates-render.test.mjs:530-550`: R-682's sentence pin, and R-859's byte equality in the same file.
- `docs/known-bugs/FEAT-002.md:54-55`: the issue-read known-bug lines the new items sit beside.
