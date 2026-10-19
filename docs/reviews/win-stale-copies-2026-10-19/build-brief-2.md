# win-stale-copies — build brief 2 (CI red: the adoption hook now speaks in a home with no nana install)

Feature: FEAT-015 · Diagnose the active environment. Class: install and hook. Same worktree, branch and plan of record
(`must-meet.md`); the builder preamble applies. Row IDs for anything new: R-1606 to R-1609 only.

## What failed

CI run 39298597308 on `defdeda`: macOS, Ubuntu and Windows each fail one file,
`packages/nana-pack/tests/adoption-reader.test.mjs`, 41 pass and 2 fail. It fails the same way locally.

- `c: the hook prints nothing when there is nothing`: the hook now prints `[nana:install] INSTALL STALE: rule
  nana-soul.md, rule nana-standards.md, … skill py-test — tell the user; they fix it with \`node "…/nana-setup.mjs"
  install\``.
- `c: the hook prints the same block`: the same line, added in front of the reader's block.

The test runs the hook under a temp HOME where nana-setup never ran. Every rule and skill row is then ✗ in doctor's
terms, so R-1600 makes the hook print the stale line. Build 1 ran neither test file.

## The decision (the seat's)

A home where nana-setup has never installed anything has no stale copies. It has no install, and doctor already says
so. The stale line is for an install that has fallen behind its checkout. So:

- WHEN the adoption hook runs and the home holds no install record from nana-setup (decide the one signal from what
  install already writes, for example the state manifest `packages/nana-setup/lib/state-manifest.mjs` keeps, and say
  which in the report), THEN the hook shall print no stale line and no stale-check-unavailable line.
- Add exactly one row for this, R-1606, in EARS form under FEAT-015, and one must-meet check for it in
  `packages/nana-setup/tests/stale-copies.test.mjs`, red on `defdeda` (show it). R-1600's wording must stay true:
  add "for a home that holds an install record" to R-1600 and R-1602 only if the trace or the tree requires it, and
  say so.
- Do not edit `adoption-reader.test.mjs`. Its two checks must pass unchanged once the hook is silent there.
- The pi side (the nana-rulings extension, R-1604 and R-1605) is out of scope unless the same failure shows there.

## Run every test file that starts the adoption hook, one at a time, and report each

adoption-producer, adoption-reader, display-surfaces, templates-render (nana-pack); hooks-win32-exec, retired-artifacts,
install-check, install, settings-merge, project-dismiss, hook-producers, stale-copies, restore, state-manifest,
uninstall, verifier-pipe (nana-setup); then requirements-tree, requirements-trace, test-runner. Each must exit 0.
Then `node scripts/requirements-trace.mjs`, `npm run req:tree`, `npm run map`, `npm run map:check`,
`npm run readme:check`; set the R-291 leaf total to the trace total.

## Wrong code to try (each must turn the named check red, then restore)

1. Drop the install-record test so the hook always checks: R-1606's check and the adoption-reader checks go red.
2. Treat a home with a record but a missing rule as "no install": R-1600 or R-1602 goes red.

## Done

One commit on top of `defdeda`. Report in at most 10 lines: the commit, the install-record signal chosen and why,
each red-then-green, each test file's pass count, and anything you could not do. Never edit HANDOFF.md or
docs/sessions/. Never run the full suite.
