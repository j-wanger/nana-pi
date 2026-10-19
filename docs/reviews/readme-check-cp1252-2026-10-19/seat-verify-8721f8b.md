# Seat checks — readme-check-cp1252 build 1, tip 8721f8b (2026-10-19)

- CI run 39249884922 on draft pull request #35 tested 8721f8b merged into main `1e3bf1f` (merge `57aa094`). macOS
  `150 files: 148 PASS, 0 FAIL, 2 SKIP` (templates-render 168 pass); Ubuntu `150 files: 147 PASS, 1 FAIL, 2 SKIP`, the
  failure lane-write-guard, main's (linux-lane-guard fixes it, not yet on main); Windows
  `150 files: 126 PASS, 23 FAIL, 1 SKIP` (`ci-windows-run-1.log`), every failure main's: immutable-review, land and
  review-ledger (the short-path bug; win-review-paths fixes it and reached main after `1e3bf1f`), 16 desk files and
  4 bench files. install-check passes on macOS and Windows.
- The lane's checks on Windows, log lines 4652–4655: `PASS python: the readme check prints every line under ASCII and
  cp1252 output`, `PASS python: the code map check prints every line under ASCII and cp1252 output`, `PASS python: the
  code map impact view prints every line under ASCII and cp1252 output`, `PASS python: the readme check and code map
  print a non-ASCII path unescaped under UTF-8 output`. templates-render there: 167 pass, 2 skip, both older (biome not
  resolvable; uv could not resolve pytest for the CRLF trace check). Beside them, line 4582: `PASS python scaffold:
  requirements-trace, code-map and readme-check tests pass under a cp1252 Python environment`; line 3871:
  readme-check.test.mjs 11 pass.
- Template acceptance: the seat ran `npm run template:accept` at 8721f8b on macOS, exit 0 in 56 s (ruff, ruff format,
  mypy strict and pytest, both templates, scaffold and adopt). CI's suite does not run it; the release job skips on a
  pull request.
- No wrong-code pairs: an ordinary lane. The build brief lists seven wrong-code tries; the builder's results for them
  are not in the repository. The commits show only the order: the four checks in `ee986f0` before the fix in
  `087031f`. The red-before evidence is the adversary's probe at `b3f6ec2` (`plan-attack.md`): all four commands fail
  under ascii and cp1252 without the fix and pass with it.
- No independent check: an ordinary lane. No finding to settle.
- R-1440 to R-1443 read `implemented`. `node scripts/requirements-trace.mjs`: 1219 total, 932 implemented, 0 rows off
  form; `npm run map:check`: 0 problems.
