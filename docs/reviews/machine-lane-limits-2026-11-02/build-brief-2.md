Feature: FEAT-006 · Launch builders with execution limits

Lane machine-lane-limits. Class: hook. Builder: pi-worker (small lane). Build session 2, on branch tip f218d7c4. Round 1 had both reviewers say LAND (kept in this folder as `r1-*.md`), and the independent check passed (`independent-check-f218d7c4.md`). This build records their notes only. Change no code, test or rule.

## Precedent

- `docs/known-bugs/FEAT-006.md`
- `docs/known-bugs/FEAT-040.md`

Report each departure.

## Build

In `docs/known-bugs/FEAT-006.md`, add one line each, naming "(machine-lane-limits, review round 1)", in that file's existing line style:
1. A rule line cannot prove a seat obeys its build-lane limit.
2. A pi seat's model sees the limit only by running the roster command, because pi shows the notice as a widget.
3. A machine prints the default limit of 4 until its owner writes its own value; a Windows checkout that pulls without running `nana-setup install` keeps the old "four lanes" ruling and seat guide.
4. A bad `lanes` value's warning prints before stdout in the plain roster command but after stdout, before `was:`, in `set`.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

`git diff f218d7c4 HEAD --stat` lists only `docs/known-bugs/FEAT-006.md`. Green, run locally: the known-bugs check, `npm run readme:check`, and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push and stop.
