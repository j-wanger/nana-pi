# report-not-passed: must-meet

Feature: FEAT-039 · See the product and its decisions in one report
Class: ordinary. The lane changes only the product report script, its test, the ledger, the README and the tree outline. It touches no install, hook, gate, land or review tool.
Threat model: honest variation in this clone's runtime data is in scope. That covers PASS, FAIL or SKIP labels, missing or other-schema data, files changed since the run, files with no recorded run, and Python or TypeScript citations. A forged runtime-data file is out of scope. A finding outside the model is a residual.

## Feature
The Issues view lists every implemented row that did not pass in this clone's last measured run, under a heading that gives their number. A row did not pass in two cases: any cited file recorded FAIL, or every cited file has a recorded label and none is PASS. On the 2026-10-17 runtime data the list is exactly R-1064, R-1058, R-1063, R-1330 and R-1340.

## Design
- `buildReport` adds `model.notPassed`. It holds rows with status implemented, in ledger order and without duplicates. Each entry has the same shape as a `model.violated` entry ({id, requirement, status, evidence, tests}). It reads the per-file run states the report already computes (`runStateOf`, through the files map). It reads no new data and adds no store.
- The rule works on a row's unique cited files. A row is listed when any run's label is FAIL. It is also listed when every file has a run and no label is PASS. A row citing no file is never listed.
- The changed-since mark does not change the rule in either direction. A stale SKIP still counts, and a stale PASS still passes. Each card already shows the file's mark (R-1513).
- Renderer: the Issues view keeps its legend and violated cards first. Then it appends to the view root:
  - one `h3` reading `Implemented rows that did not pass in this clone's last measured run: <n>`, drawn even when n is 0;
  - one note line;
  - one `row()` card per listed row.
- The heading and note strings are declared inside `renderInto`. The page runs `String(renderInto)`, so a module-scope constant throws there. The PASS and FAIL label constants sit at module scope, and only `buildReport` reads them.
- The note says, in plain words, that a row appears here when a cited file failed or every cited file skipped or failed. It also says a file with no recorded run counts neither way. The wording never says "verified".

## Must-meet tests
All six live in packages/nana-pack/tests/product-report.test.mjs, in one new block after the R-1515 block. Each renders through `renderHtmlAt` on the page `generateReport` wrote. All are cross-platform with no skip.

| Row | Requirement (EARS) | Test title |
|---|---|---|
| R-1650 | WHERE a row with status implemented cites at least one test file in this repository and the runtime data records a label other than PASS for every file it cites, the product report's Issues view shall list that row as an implemented row that did not pass in the last measured run. | R-1650: an implemented row whose cited files all last ran SKIP, one file or two, is listed as not passed, and an untested row citing such a file is not |
| R-1651 | IF the runtime data records FAIL for any test file a row with status implemented cites, THEN the product report's Issues view shall list that row as an implemented row that did not pass in the last measured run. | R-1651: an implemented row citing a failing file is listed as not passed, alone, beside a passing file and beside a file with no recorded run |
| R-1652 | IF the runtime data records PASS for a test file a row with status implemented cites and FAIL for none of its cited files, THEN the product report shall leave that row out of its list of implemented rows that did not pass. | R-1652: an implemented row citing a passing file and no failing one, alone or beside a skipped file or a file with no recorded run, is left out of the not-passed list |
| R-1653 | IF a test file a row with status implemented cites has no recorded run in the runtime data and none of its cited files recorded FAIL, THEN the product report shall leave that row out of its list of implemented rows that did not pass. | R-1653: a row citing a file with no recorded run, alone or beside a skipped file, is left out, and with no runtime data the not-passed list is empty |
| R-1654 | IF the product report marks a cited test file's label as changed since the run, THEN the product report shall still use that recorded label to decide whether the citing row did not pass. | R-1654: a label marked changed since still decides, so a row whose only file last ran SKIP and changed since is listed and one whose only file last ran PASS and changed since is not |
| R-1655 | The product report's Issues view shall head its list of implemented rows that did not pass with the number of rows in that list. | R-1655: the not-passed heading states the number of rows listed under it |

## Red today, and how we know
- On main 6b3e432 the Issues view draws only the legend and the violated cards. It has no "did not pass" text and no `notPassed` key. Every check finds the heading first, and each exclusion check also requires a listed control row. So all six checks are red today.
- Prototype probe (temp clone, not committed): with this design the six checks pass, and the 60 existing checks stay green, both R-1017 checks included. EARS: 0 rows off form. Trace: 1,291 total, all traced.
- Wrong code tried on the prototype, and the check it turned red:
  - FAIL short-circuit dropped: R-1651.
  - `some` used for `every`: R-1652.
  - Missing run treated as non-PASS: R-1653, plus R-1017's card count.
  - Changed files skipped: R-1654.
  - Changed label treated as non-PASS: R-1654.
  - Implemented filter dropped: R-1650.
  - Count taken from `model.violated`: R-1653 and R-1655.
  - Heading moved to module scope: the file exits 1 with a ReferenceError.
- The first plan's tests let two of those through. A changed-since PASS counted as not passed kept all checks green and listed 742 rows on real data. A count taken from the violated list stayed green while the fixture listed 5 rows, the same as the copied ledger's 5 violated rows. The amended R-1654 and R-1655 checks close both.
- Real-data probe: the rule lists exactly the five rows above. R-534 (one PASS file, one SKIP file) is left out. A rule that drops changed files would list 0, because the cited file changed after the 2026-10-17 measure.

## Known limits
- The list shows no skip reason, because the runtime data records none. The runner works its reasons out at run time inside the test runner, which the parallel-runner lane is rewriting.
- A FAIL fixed after the run stays listed, marked changed since, until the next `npm run map:measure`.
- Labels belong to the whole file. A PASS file may have skipped the cited check, so a row like that is not listed. This repeats an existing residual.
- A row citing a skipped file beside a file with no recorded run is left out. None exist today.
- With no runtime data, the heading reads 0. The legend directly above it says no run is recorded.
- Only implemented rows are considered. Violated rows keep their own list. The list reads only this clone's runtime data, not CI's Linux or Windows results.