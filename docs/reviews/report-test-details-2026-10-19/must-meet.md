# report-test-details: give each requirement's tests their details (2026-10-19, adversary-amended)

**Feature.** Under every requirement row, the product report lists each test the row's evidence cites in this repository as its own item. Each item shows the title, the file, a GitHub link (new tab) to the file at the report's commit, and the file's PASS, FAIL or SKIP from the clone's last measured run, marked when the file or code it ran changed since. A row citing no test says so. Today a card shows its evidence as one monospace string; the page's FEAT-039 detail has 0 test-file links and 0 list items.

**Reader.** the owner, on the hosted copy Claude Code seats republish. Per test he needs what it checks, a link that works off this machine, and whether it ran here and passed. When nothing pins a row, he needs a plain word.

**Class: ordinary.** Report script, its test, its template, docs. No install, hook, gate, land or review tool.

**Threat model.** In scope, honest variation:
- TypeScript (`packages/x/tests/y.test.mjs::t`) and Python (`tests/test_a.py::test_x`) citations; the README runs the report on any nana project with `--root`;
- `<repo>:` and prose evidence;
- origin spelled https, scp-style or `ssh://`, with or without `.git`; no origin; another host;
- runtime data missing, unreadable, another schema, without an entry, stale, or read from a linked worktree;
- Windows paths.
Out: deliberate forgery of the ledger or the runtime data.

**Measured (2026-10-19, read-only; the adversary re-ran each).**
- Clone data from 10-17: 149 files, 147 PASS, 2 SKIP; per file 76 unchanged, 73 changed. The whole-checkout drift check marks all stale, so the lane uses per-file change.
- R-1058, R-1063, R-1064, R-1330 and R-1340 are implemented, but every file they cite is a macOS SKIP. The page should show this gap.
- Ledger: 2,683 local citations in 151 files, all on disk; 286 rows cite none (0 of them implemented).
- The cited-test rule below and the TypeScript rail's `isLocal` agree on every nana-pi citation; the rule also admits Python paths.

**Design.**
- **Cited test.** From `citesOf` (re-exported by `scripts/requirements-trace.mjs`): a citation holding `::`, a non-empty title, and a path with `/` and no `:`. Split at the first `::`.
- **Model.** Every row in `features[].rows` and `violated` gets `tests: [{title, file}]`. The model gets `files: {<path>: {href, run}}` and `runtime: {legend}`. Packets stay unchanged (R-1029).
- **Link, built in `buildReport`, never in the renderer.** Read `git remote get-url origin` through the injected runner without throwing. Strictly match `https://github.com/o/r`, `git@github.com:o/r`, `ssh://git@github.com/o/r`, each with optional `.git`. href = a named prefix constant (provenance R-1511) + `o/r/blob/<40-hex commit>/` + URI-encoded segments. No link for no origin, another host, credentials in the URL, an absolute path, or an empty, `.` or `..` segment. The renderer sets `target="_blank"` and `rel="noopener noreferrer"`.
- **Run state.** `dataPath(root, {git})` with the report's runner wrapped to add `encoding: "utf8"`, then `loadRuntime`. No new path option: the data's default place and its env override (R-1278) are the contract. Label = `data.tests[file].label`. Changed = the file or any `ran` file is missing or hashes (`hashFile`, cached) differently from `data.hashes`. A `dataPath` throw counts as no runtime data.
- **Render, in `row()` (detail, issues, requirements views).** After the evidence line, an `ol.row-tests` with one `li` per test: title, file (link or text), then `File's last measured run: PASS` (plus ` · changed since`) or `No recorded run`. A row with no tests gets `Tests: none cited in this repository`. One legend line from `model.runtime.legend`: label is per file, the `NOT_COUNTED` text, and the load reason when there is no data.
- **The renderer ships as source** (`String(renderInto)` in the page). It may read only its arguments and globals. Probed: a module constant referenced inside it passes all 57 of today's checks, yet the real page throws ReferenceError.
- **R-1012 amended** (text below). Keep its closing words "byte-identical product reports." because the R-1019 hostile check edits them. Its test gains an origin and runtime data.

**Must-meet.** All checks go in `packages/nana-pack/tests/product-report.test.mjs`, cross-platform, no skip. Each new check renders the page `generateReport` wrote: the renderer and data are pulled from the HTML, the renderer is evaluated in a fresh `vm` context, and a stub DOM receives it. Runtime data is written at the fixture's own `.git/nana/runtime-map.json`, never injected, never the real clone's.

| Row | Requirement (EARS, one shall) | Test title |
|---|---|---|
| R-1510 | The product report shall show, under each requirement row, each test its evidence cites in this repository as its own item carrying the test's title and its file path as separate text. | R-1510: each cited test is its own item with title and file as separate text, for TypeScript and Python citations, and external or prose citations are not listed |
| R-1511 | The product report shall link each cited test's file, opening in a new tab, to that file's GitHub page at the report's commit only when the repository's origin remote is a GitHub repository. | R-1511: cited test files link in a new tab to their GitHub page at the report's commit for each GitHub origin spelling, and nothing links otherwise |
| R-1512 | WHERE the runtime data holds a cited test's file, the product report shall show beside that test the file's recorded label, PASS, FAIL or SKIP, worded as its file's result in the last measured run. | R-1512: a cited test shows its file's recorded PASS, FAIL or SKIP worded as the file's result, read from the clone's runtime data in a checkout and a linked worktree |
| R-1513 | IF a cited test's file, or any file the runtime data credits it with running, is missing or hashes differently from its recorded hash, THEN the product report shall mark that test's recorded label as changed since the run. | R-1513: a recorded label is marked changed when the test file or a file it ran changed or is gone since the run, and unmarked otherwise |
| R-1514 | IF the runtime data is missing, unreadable or of another schema version, or holds no entry for a cited test's file, THEN the product report shall show that test as having no recorded run and no label. | R-1514: missing, unreadable, other-schema or silent runtime data shows no recorded run and never a label |
| R-1515 | WHEN a requirement row's evidence cites no test in this repository, the product report shall say in that row that no test in this repository is cited. | R-1515: a row citing no test in this repository says so, and a row citing one does not |
| R-1012 | (amended text) WHEN the working tree, the origin remote and the runtime data are unchanged between them, two runs of the report command at the same commit shall write byte-identical product reports. | existing `same commit and tree produce byte-identical reports`, fixture widened |

**Red today (probed in a temp clone at 0f2e0ca, temp HOME).** Today's written page, renderer evaluated in a fresh `vm`, renders `#FEAT-039` with 6 links, 0 `li`, no label text. `buildReport` rows carry only `id,requirement,status,evidence,mark`. A fresh clone has no runtime data. Each new check asserts an item, href, label or line that is absent today, so each is red. The widened R-1012 check is green today and must stay green.

**Known limits** (residuals; on the page legend or in the README):
1. Platform skips show only as this clone's file-level SKIP. Runner skip reasons, CI Windows and Linux legs, and in-file SKIP lines are not read. Follow-up after win-leg-blocking lands.
2. The label is per file; a PASS file may have skipped the cited check.
3. "Changed since" cannot see code run from temp copies or by children stopped by a signal.
4. Tests carrying a row's marker without being cited are not listed.
5. No line numbers.
6. Links are GitHub only; a link to an unpushed commit opens a not-found page.
7. Projects without runtime data, Python ones included, show no recorded run.
8. Inferred, not tried: that a plain link fails inside claude.ai's artifact frame, so new-tab links are needed there.