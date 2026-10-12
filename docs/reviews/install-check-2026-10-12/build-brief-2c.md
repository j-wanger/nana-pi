# Lane install-check — build brief 2c (2026-10-12 · feat/install-check · worktree ~/nana-pi-wt/install-check)

**Builder: pi gpt-6-luna.** Fresh session, ONE item: tests. No production code changes unless a test
proves the code wrong — then fix the class and say so in the report.

## Why
Session 2b (`4571d4b`) moved the runner into `lib/install-check.mjs` with an injected async spawn and fixed
the Windows pi session (CI run 38296688856: `PASS pi session`). Its two test items were not written: the
report says so itself. The seat now names every required case by its exact title.

## The item — make `seat-titles.mjs 2c` print `0 missing`
Run `node docs/reviews/install-check-2026-10-12/seat-titles.mjs 2c` from the worktree root. It lists 15
titles; each must appear verbatim as a `check("…")` title in `packages/nana-setup/tests/install-check.test.mjs`
with a `// req:` line directly above it naming the listed rows. At launch all 15 are missing.

- These run through `runInstallCheck` with a recording fake spawn (no real child process): every
  `environment:`, `spawn:`, `install:`, `platform:` and `pi launch:` case, and the reporting cases
  "a run with any FAIL line exits non-zero…" and "the first lines name Git Bash…". The recording spawn returns
  scripted results per child so the run reaches every step (install exit 0, a `pi list` listing both
  packages, a session that lists `reload-runtime`, hooks that print their markers, doctor exit 0).
- The other reporting cases may call `classifyResult` with an injected date.
- The spawn case FAILS if any one named child is missing from the recording. The same-environment case
  compares every recorded child's environment with the first one, key by key.
- You may rename an existing test to a listed title only if its body pins exactly that title's clause.
- Wrong code first for each: break the code the case is about (for example, spawn one `git init` through a
  direct `child_process` call; read `NANA_SETUP_PLATFORM`; drop `npm_config_*` removal), see the case fail,
  restore. Record each in the report as `<title>: red under <mutation>`.

## Done — do not report DONE until all of these pass on your last commit
`seat-titles.mjs 2c` → `0 missing`; `npm run req:tree`; `npm run map:check`; `npm run readme:check`;
`npm run test:locked` (0 failed); the acceptance script (exit 0; commit `acceptance-output.txt`).
No push needed this session.

## Rules
Brief 2a's rules hold. Do not edit the seat scripts (`acceptance.mjs`, `seat-titles.mjs`), `CHANGE.md`,
`HANDOFF.md` or `docs/sessions/`. Flip R-1070, R-1071, R-1080 or R-1084 to `implemented` only when the cited
tests pin every clause; otherwise leave them `untested` and say which clause is missing.

## Report
≤ 25 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; the last line of `seat-titles.mjs 2c`
verbatim; each title with its red-under mutation; rows flipped and the clause each cited test pins; the
`test:locked` summary line; the one claim most likely wrong.
