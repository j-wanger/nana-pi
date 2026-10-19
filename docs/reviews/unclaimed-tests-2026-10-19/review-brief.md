# Review — unclaimed-tests (behind one switch, the requirements trace lists every test declaration no `req:` marker claims), 2026-10-19 (Opus, the lane's one final reviewer)

Feature: FEAT-028 · Maintain requirement identity and trace links

Review `git diff 713d6aa..HEAD` on `feat/unclaimed-tests` (main was `713d6aa` when the seat last merged it, at
`429b706`; main has since moved to `27603d4`, after audit-open-questions and review-timeline landed, and the seat merges
it again before this review; `git merge-base HEAD main` is `713d6aa`). The plan of record is
`docs/reviews/unclaimed-tests-2026-10-19/must-meet.md` (rows R-1660 to R-1665), with the adversary's amendments in
`plan-attack.md` and the build in `build-brief-1.md` and `build-brief-1b.md` (build 1 stalled under the launcher's
watchdog before it committed; build 1b judged and finished its uncommitted work). The seat's record
`seat-verify-429b706.md` holds CI, the Windows log beside it.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, run at `429b706`):

```
tree movement 713d6aa..429b706: 6 rows in 1 features
FEAT-028 · Maintain requirement identity and trace links
  R-1660 new (implemented)
  R-1661 new (implemented)
  R-1662 new (implemented)
  R-1663 new (implemented)
  R-1664 new (implemented)
  R-1665 new (implemented)
```

Judge whether, with `NANA_REQ_UNCLAIMED=1`, each rail lists every test declaration its own grammar can bind and no
marker claims, by project-relative path with `/`, line and title, ordered by the whole path string and then line, under
a count line that prints also at zero; whether the Python rail lets a marker above a def's decorators claim that def;
whether twin TypeScript and Python sources give the same listing apart from paths; whether, with the switch on,
nana-pi's trace command and a Python project's pytest run add only the whole listing after their own lines, with the
same exit status and REQUIREMENTS.md and the test sources byte-identical; and whether the skill's audit paragraph, between
Pass 1 and Pass 2, names the switch and calls each listed line a proposal, never a row or evidence. Judge too whether the
six must-meet checks would fail with that behaviour removed.

Threat model: honest variation in our tools' output and the OS in scope (macOS, Linux and Windows paths; CRLF, a
trailing space or tab, no final newline, nested test folders; project configs: call names, test roots, decorators);
deliberate forgery out, so a declaration hidden from the grammar on purpose is a residual. Lane class: ordinary — the
two template trace rails, nana-pi's trace shim, the requirements skill, one new test file, the ledger, tree and code
map; no install, hook, gate, land or review tool imports the trace rail.

Check: (1) the six must-meet checks are not vacuous: each fails with its feature removed (per the builder, all six red
on the old code, and each listed wrong code turned its named check red); (2) with the switch unset, the trace command
and a Python project's pytest run print what they printed before, and the trace command keeps its exit codes now that
it sets `process.exitCode` in place of `process.exit`; (3) both rails build the listing from their own marker grammar
and binding, not a second parser, and `check()`, `scanSource` and `scan_source` keep their return shapes;
(4) `pytest_sessionfinish` gains no branch or loop and never changes the exit status, and the template conftest stays
fully typed (the builder's report as the seat holds it gives no `npm run template:accept` exit); (5) the skill paragraph
names no path or script that exists in only one render or only in nana-pi; (6) no test writes outside its temp folders,
and the child runs compare stdout only; (7) nothing else changed: among existing tests only the R-291 leaf total and the
one status-test call in the TypeScript template, and the code map, tree and count say what the code does;
(8) HANDOFF, its seven "Unclaimed tests" residual lines and the session entry are true; (9) any MUST.
