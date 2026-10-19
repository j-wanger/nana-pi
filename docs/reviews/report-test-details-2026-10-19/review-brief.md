# Review — report-test-details (the product report lists each requirement's cited tests with title, file, GitHub link and run label), 2026-10-19 (Opus, the lane's one final reviewer)

Feature: FEAT-039 · See the product and its decisions in one report

Review `git diff 4be0b79..HEAD` on `feat/report-test-details` (main was `4be0b79` when this brief was written; `git
merge-base HEAD main` is `4be0b79`). The plan of record is `docs/reviews/report-test-details-2026-10-19/must-meet.md`
(rows R-1510 to R-1515, and R-1012 amended), with the adversary's amendments in `plan-attack.md` and the build in
`build-brief-1.md`. The seat's record `seat-verify-4c975f7.md` holds CI, the macOS log beside it.

Tree movement (`node scripts/requirements-moved.mjs --root . --base 4be0b79`): 7 rows in 1 feature, FEAT-039 — R-1012
text changed; R-1510, R-1511, R-1512, R-1513, R-1514 and R-1515 new (implemented).

Judge whether, under every requirement row, the written page lists each test the row's evidence cites in this
repository as its own item with title and file; links it to GitHub at the report's commit, in a new tab, only for a
GitHub origin; shows the file's recorded label or "No recorded run", marked when the file or a file it ran changed;
and says so for a row citing no test. Judge too whether the six new checks would fail if that behaviour were removed,
given that the renderer ships as source and each check renders the page the command wrote.

Threat model: honest variation in our tools' output and the OS in scope (citation shapes, TypeScript and Python;
origin spellings, no origin, another host; runtime data missing, unreadable, another schema, without an entry, stale,
or read from a linked worktree; Windows paths); deliberate forgery of the ledger or the runtime data out. Lane class:
ordinary — the report script, its template, its test and docs.

Check: (1) the six must-meet checks are not vacuous, and the widened R-1012 check still pins byte-identical output with
an origin and runtime data; (2) the renderer reads only its arguments and globals, and every href is built only from the
matched owner and repository, the 40-hex commit and encoded path segments; (3) the report still refuses when every git
call fails, and a missing origin or missing runtime data is not an error; (4) no test writes outside its temp folders,
none reads or rewrites the real clone's runtime data, and a data-file override set in the caller's environment
(`NANA_RUNTIME_MAP_FILE`) does not change the new checks' result; (5) nothing else changed; (6) HANDOFF and the session entry
are true; (7) any MUST.
