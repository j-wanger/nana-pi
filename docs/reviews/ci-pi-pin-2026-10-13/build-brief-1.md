# Lane ci-pi-pin — build brief 1 (2026-10-13 · feat/ci-pi-pin · worktree ~/nana-pi-wt/ci-pi-pin)

**Builder: pi gpt-6-luna.** Fresh session, THREE items, URGENT and small. The contract is `CHANGE.md` in this
folder (sol plan r1 LAND-WITH-FIXES 92/100, fixes applied; read §2, §3 and §5 only). Threat model: honest
variation in our tools and registries in scope; deliberate forgery out. New requirement IDs: R-1090–R-1092 only.

## Item 1 — rows first (CHANGE §2)
Add R-1090, R-1091 and R-1092 to FEAT-019 after R-1032, with exactly the text in §2's table, status `untested`
until item 2's tests exist, then `implemented` citing them. `npm run req:tree`. In
`packages/nana-pack/tests/requirements-tree.test.mjs` the leaf total moves 1,070 → 1,073 in all three places
(`:38` title, `:52` assertion, `:53` message).

## Item 2 — four checks in `packages/nana-pack/tests/ci-workflow.test.mjs`, RED before item 3
Exact titles (`node docs/reviews/ci-pi-pin-2026-10-13/seat-titles.mjs 1` must print `0 missing`), each with its
`// req:` line directly above, each doing what CHANGE §5 says:
- `every pi install in CI resolves at the declared cutoff` — `// req: R-1090`; every NON-COMMENT line naming
  `@earendil-works/pi-coding-agent` (with or without `@version`) ends with ` --before="${PI_BEFORE}"`; at least two
  such lines; the suite and release job bodies hold one each.
- `the pi resolution cutoff is declared once, quoted, in UTC ISO form beside PI_VERSION` — `// req: R-1091`.
- `the pi resolution cutoff is sealed at the seat's install moment` — `// req: R-1091`; the ONLY copy of the
  literal `2026-10-04T06:57:57Z` in any test.
- `npm's before is never set through the environment or a repository-root .npmrc` — `// req: R-1092`.
Run the file before item 3: the R-1090 and both R-1091 checks FAIL, R-1092 passes. Then apply each of §5's
"Wrong code first" mutations to a COPY of `ci.yml` (never to an assertion) and confirm the named check goes red;
record `<mutation>: red <title>` in the report.

## Item 3 — the fix in `.github/workflows/ci.yml` (CHANGE §3)
The `PI_BEFORE` key with §3's provenance comment, beside `PI_VERSION` in the workflow `env:`; append
` --before="${PI_BEFORE}"` to the end of the suite and release install lines. Nothing else in the file changes.

## Done — do not report DONE until all of these pass on your last commit
`seat-titles.mjs 1` → `0 missing`; `npm run req:tree`; `npm run map:check`; `npm run readme:check`;
`npm run test:locked` (0 failed); and from the worktree root
`node docs/reviews/ci-pi-pin-2026-10-13/acceptance.mjs > docs/reviews/ci-pi-pin-2026-10-13/acceptance-output.txt 2>&1`
→ exit 0, `ci-pi-pin acceptance: 0 mismatch(es)` (it installs CI's own pi line into scratch prefixes and runs the
18 drift files; it fails 23 of 33 at launch — `acceptance-launch.txt`). Commit the output. Then push the branch
and open a DRAFT pull request against `main` titled "ci-pi-pin (draft, for CI)" (no approval needed — Jake,
2026-10-11). Wait for its CI run (poll no faster than every 60 s) and report the macOS suite job's summary line
and failing files, and the Ubuntu and Windows summary lines.

## Rules
No suite test runs, imports or copies a seat script. Do not edit `CHANGE.md`, `acceptance.mjs`,
`seat-titles.mjs`, `HANDOFF.md` or `docs/sessions/`. Do not touch README install commands (a follow-up lane).
Commit with explicit paths; message file under `$TMPDIR`. Keep gate-trigger text out of command strings.

## Report
≤ 25 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; the four titles and each mutation's red
check; the `test:locked` summary line; the LAST TWO LINES of `acceptance-output.txt`; the CI run ID with the three
suite summary lines; the one claim most likely wrong.
