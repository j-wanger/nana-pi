# Review — ledger-stages (the product report's Product view shows capability stages: kinds order the cards, product cards list deliverables with gaps, constraint cards list bound stages with coverage or gaps, retired cards come last; a feature's detail view names its capability), 2026-10-21 (the final reviewer)

Feature: FEAT-039 · See the product and its decisions in one report

Class: ordinary (no hook, extension, install or gate code changes). Threat model: honest variation in owners' ledgers
is in scope (no field lines at all, partly kinded ledgers, kindless and retired capabilities anywhere, subgroup-homed
deliverables, shares from proposed or retired features); deliberate forgery is out. Ledgers reaching the report have
passed the tree checker.

Review `git diff c51bfcd8..HEAD` on `feat/ledger-stages` (main is c51bfcd8; the lane was chained on cap-kinds, which
landed as c51bfcd8, and merged main at 64f846e3). The plan of record is
`docs/reviews/ledger-stages-2026-10-21/must-meet.md`: five must-meet checks, rows R-2450 to R-2454, the build rules from
the adversary's evidence, and known limits. `build-brief-1.md` is build 1 (a5fbba37); the seat's record is
`seat-verify-64f846e3.md`, with the wrong-code pairs in `seat-mutate.mjs` and `seat-mutate-output-a5fbba37.txt` (18 of
19 red; P2 a declared test gap). CI run 39553518547 at 016e5e40 reads 0 failing on all three legs: macOS 198 PASS, 0 FAIL, 2 SKIP of 200 files (8,216 checks pass, 36 skip); Ubuntu 197 PASS, 0 FAIL, 3 SKIP of 200 files (8,155 checks pass, 56 skip); Windows 182 PASS, 0 FAIL, 18 SKIP of 200 files (7,144 checks pass, 115 skip). The install check passes on macOS and Windows. The Windows leg's log is ci-windows-016e5e40.log in this folder. Those Windows figures are the run's second attempt: the first failed 3 checks in `packages/nana-setup/tests/stale-copies.test.mjs` (its linked-Claude-folder case), which this lane does not touch; the seat re-ran the failed job unchanged. The land runs the locked suite on the reviewed tip.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, run at 64f846e3, before the seat's notes
commit):

```
tree movement c51bfcd..64f846e: 5 rows in 1 features
FEAT-039 · See the product and its decisions in one report
  R-2450 new (implemented)
  R-2451 new (implemented)
  R-2452 new (implemented)
  R-2453 new (implemented)
  R-2454 new (implemented)
```

The code under review: `scripts/product-report.mjs` (`buildReport`'s capability model and ordering, `renderInto`'s
Product view and detail line). Tests: five checks in `packages/nana-pack/tests/product-report.test.mjs`. Text: one
sentence each in README.md and the requirements skill. The rest is the plan, the seat's records, the generated code map
and outline, HANDOFF and the session entry.

Judge whether the feature works for an owner reading the report:
- on a ledger with no field lines (this repo's today, any project's), the Product view, the detail view, the packets,
  the stamps and the stored assessments behave exactly as on main;
- on a kinded ledger, the card order, needs, deliverables (order, status, home through a subgroup, consumers, gap
  marks), bound-stage coverage (only implemented constraint rows shared by active or frozen features under the bound
  stage) and retired cards match R-2450 to R-2454;
- the page still renders in a browser: `renderInto` references nothing outside itself, links go only to features, the
  h3 text is unchanged and every count bar stays right after its feature line;
- the HANDOFF lines, the three late notes folded from cap-kinds's review and the session entry are accurate.

Known limits already carried (do not send back for them): document order within each kind, no sort by needs;
coverage does not look at whether a covering row's test ran since the last change; no kinded fixture checks the bar
adjacency (pair P2).

Probe in a temporary folder with a temporary HOME. Do not edit the worktree.
