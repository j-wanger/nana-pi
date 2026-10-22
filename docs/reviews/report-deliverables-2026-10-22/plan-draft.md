# Lane plan draft: report-deliverables (main 09e38e7d)

Feature: FEAT-039 · See the product and its decisions in one report

Probe: a `git archive` export of main with `git init`, and a full local clone for history, both in `scratchpad/plan-rd/probe.xqppFP/`, with a temporary HOME. Read-only `git log` and a read of this clone's runtime data on main. One test file run on the clone. No suite run, no install, no edit to the checkout.

Stakes: low blast, reversible. The lane changes a generated page, one report-only module's exports, and ledger text. No install, hook, gate or land file.

## 1. What the lane changes for the owner

Each deliverable on the report's Product view stops listing "Consumers", the features that share its row; 2 of 38 had one. Instead it shows its maker and reader lines as the ledger writes them. A maker line names a run and its code, or says "manual" and why. A reader line names code or a prompt, or a person or rule and why. The report marks a deliverable "not made by code" when no code makes it. It marks one "not read by code" when no code or prompt reads it. Where a maker line names an artifact, the item shows its age. The runtime map uses its own record: the tip it measured and when. A tracked file shows how many commits and days ago it last changed. That commit's short hash and subject show too, so a sweep reads as "scrub", not as a fresh make. The Product view opens with the same count line and notes the tree checker prints: "deliverables: 13 of 38 made and read by code" today. Six maker lines gain the artifact they make, so seven deliverables show an age; the other 31 say "no artifact named".

## 2. Measurements

| Question | Result | Source |
|---|---|---|
| Artifacts named on main's 102 lines | 0 of 38 deliverables name a tracked path. 1 names `runtime-map` (R-1272). 37 name none | grep of the lines |
| What the 38 point at (inferred from row text and makers) | 6 single tracked files: the outline, three tool-profile study files, the catch-ledger rows, the writing-trial after-measure. 2 per-lane records in review folders: mutation records, movement listings. 12 machine-local or ignored: runtime map, handoff store, knowledge index, journal, roster file, round tally, Claude links, bench raw evidence, the report page, three desk stores. 4 elsewhere: another project's seeds and rendered files, a release tag, main. 14 printed or shown each run | rows, maker lines, `.gitignore` files |
| Last change of the six tracked files (`git log -1 --format=%H%x00%ct%x00%s -- <path>`) | Outline: a2b1306a, a merge of main into a lane, 14 commits and 0 days before HEAD. Three study files: efa8c3f4 and 034be76f, 2,429 and 2,426 commits, 43 days. Catch-ledger rows: fe331dcd, 29 commits, 0 days. After-measure: 5f6e3845, 93 commits, 0 days; that commit carried the day-14 measure, a real make | full clone |
| Sweeps | 1 of 6 files was last touched by the scrub commit fe331dcd (889 files). Its real make, 5ffe0e8f, is 23 days before HEAD. All three record folders were last touched by fe331dcd, so a folder artifact would read as fresh | full clone |
| Merges | `git log -1 -- <path>` names a merge for the outline. A walk without `-c` disagreed with it on 5 of 254 sampled paths; with `-c` it agreed on 254 of 254 | clone, every 15th tracked file plus folders |
| The runtime map's own record | Tip 09e38e7d (HEAD), measured 2026-10-22T09:31:30Z, 15 minutes after HEAD's commit time, so the age clamps to 0 days. Earlier in this session it named tip 01a7f371, 25 commits back, measured 03:37Z; a hand measure on main replaced it (inferred from the seat's measure log) | this clone's data file, read only |
| Other own dates | One bench file, the schedule, records `createdAt`. No other tracked artifact records its make date | study files |
| Report time today | Command: 311 ms median on the export and on the clone after an index refresh. `buildReport` in process: 264 ms. A fresh clone took about 800 ms; the extra 500 ms was `git status` refreshing its index | 5 runs each, macOS |
| Added git cost | `ls-tree` 24 ms, `rev-parse --is-shallow-repository` 14 ms, one full walk with parents and `-c` 163 ms (1,019,213 bytes, 2,514 commits). About 200 ms more, about 510 ms total (inferred sum) | 5 runs each |
| Alternatives | Per artifact, `log -1` plus `rev-list --count`: 260 ms for six, 12 spawns. Pathspec walk: 89 ms for six paths, 906 ms for 252. One git spawn: about 14 ms | same |
| Counts from the walk | Commit counts from the walk's parent list equal `git rev-list --count <sha>..HEAD` for all six | full clone |
| Node's buffer | The walk's output already passes `spawnSync`'s 1 MiB default. The report's git helper sets no `maxBuffer` | measured bytes |
| Ledger growth | REQUIREMENTS.md is 883,904 bytes, up from 563,282 on 2026-10-15. At that rate it passes 1 MiB in about four days (inferred). Then the packets command's `git show HEAD:REQUIREMENTS.md` fails under the same default | `git show` at past commits |
| Windows | Report test file per CI run at 804bf05b: Windows 55.7 s, macOS 40.7 s, Linux 29.3 s (77 checks). No Windows machine was measured | CI logs |
| Consumers today | 2 of 38 show one: R-1008 (FEAT-008) and R-256 (FEAT-025). 36 show "none". 2 are status gaps: R-257, R-264 | `buildReport` on the export |
| Code count | 13 of 38 made and read by code; 0 notes on main. Of the other 25: 7 lack only an automatic maker, 18 lack both, none lacks only a code reader. 16 of the 18 are read only by a person, 2 only by a rule | `deliverables.mjs` on the export |
| Grammar | The checker already accepts `manual: <reason> · <artifact>`. Six such suffixes gave 0 notes and an unchanged outline; a missing file gave one note | export copy |
| Subfolder ledger | From a subfolder, `git log --relative` gives ledger-relative paths and the same first commit as `git log -1` | clone, `apps/bench` |
| Baseline | Report test file: 77 pass, 0 fail, 27 s | clone, one file |
| Impact | `product-report.mjs`: 1 caller, 8 callees. `deliverables.mjs`: 19 transitive callers through the tree checker. Measured tests over 30 s: templates-render 71.8, lift 44.1, regroup 30.6, report 30.4 | `map:impact` on main |

## 3. Decisions

- **D1 What replaces the consumer view.** (a) The written `Made by:` and `Read by:` claims, as the ledger writes them after the row ID, in ledger order. (b) Keep consumers and add the claims. (c) (a) plus GitHub links on each path. Recommend (a): the claim is the real reader the owner approved. Consumers stay on the Features view as "Shared in" and "Shared by". (c) adds the link cases of R-1511 for little gain. For R-2452: (i) narrow it in place, dropping its `Also applies:` clause and the consumer assertions. (ii) Retire it and add a successor, which spends one of the four IDs. Recommend (i): the row keeps order, status, home and gap, and the movement report shows the edit. The lane deletes the skill's sentence on derived consumers. It also deletes the FEAT-039 known bug about retired consumers. Default: `claims`, `narrow`.
- **D2 Age rule (the adversary's M3).** (a) The maker's own record first: today only the runtime map has one, its tip and measurement time. Every other tracked artifact shows the last commit that changed it. The age reads as commits and whole days before HEAD, with that commit's first 8 characters and subject. (b) Also read per-format dates, such as the schedule's `createdAt` or a date in a folder name. (c) Skip sweeps by a files-touched threshold. Recommend (a). (b) guesses formats for one file. (c) is a tuned guess; the subject already says "scrub". Days come from the epoch difference of committer times, clamped at 0. Never calendar dates and never the clock, so R-1012 holds. Commits count those reachable from HEAD and not from the change, as `rev-list --count` does. Default: `own-then-git`.
- **D3 Which lines name an artifact.** (a) This lane adds ` · <artifact>` to six `Made by:` lines: R-291 `docs/requirements-tree.md`; R-509 `apps/bench/studies/tool-profiles-2026-09-08/schedule.json`; R-507 its `results.jsonl`; R-535 its `summary.md`; R-536 `apps/bench/studies/catch-ledger-2026-09-28/rows.jsonl`; R-694 `docs/reviews/writing-trial-2026-10-04/after.md`. All six are `manual` lines. So the skill's grammar sentence gains `[ · <artifact>]` after `manual: <reason>`; the code already accepts it. (b) Leave the lines; age then shows for one deliverable. (c) Also name per-lane folders; each would read as fresh after every lane. Recommend (a). The mapping is the planner's reading of the rows (inferred); the seat confirms it in the brief. Default: `six`.
- **D4 Gap marks.** (a) Two marks. "not made by code" means no claim is an automatic maker. "not read by code" means no claim is a code or prompt reader. Both use the count's own predicate, exported once, so marks and count cannot disagree. (b) Mark only `manual` and `rule`, leaving person readers unmarked. (c) One combined mark. Recommend (a). A person reader already shows on its own line. Under (b), 16 items would disagree with the count. Measured: 13 items carry no mark, 7 carry the maker mark only, 18 carry both. Default: `count-marks`.
- **D5 Count line and notes.** (a) Before the capability cards, the Product view shows the tree checker's own count line and notes. They are the same strings in the same order. They come from `checkDeliverables`, given the HEAD tree the report reads. (b) A count per card. (c) The count only. Recommend (a): one number in both places, and a grep finds either. Default: `checker-lines`.
- **D6 Speed and Windows (the adversary's N4).** (a) One full walk, run only when a maker line names an artifact: `git log -z -c --name-only --relative --format=%x01%H%x00%P%x00%ct%x00%s HEAD`. (b) Per artifact, `log -1` plus `rev-list --count`: two spawns each. (c) A pathspec walk plus `rev-list --parents`. Recommend (a). It is one spawn whatever the artifact count, and it gives exact counts from the same output. Its `-c` matches `git log -- <path>` at merges. Spawn cost dominates (b) on Windows (inferred from the CI ratio, 1.4 against macOS). Git runs only when needed. With no maker or reader line there is no new call, so other projects pay nothing. With paths there is one `ls-tree`. With an artifact named, there are three calls: `ls-tree`, the shallow check and the walk. Default: `walk`.
- **D7 The report's git buffer.** (a) Set `maxBuffer` only on the walk. (b) Set it in the report's one git helper. That also covers the three ledger reads through `git show`; HEAD's ledger passes 1 MiB in about four days. Recommend (b), importing the movement report's `MAX_GIT_BUFFER` (64 MiB) so the value lives once. Default: `helper`.
- **D8 One parser.** (a) `scripts/deliverables.mjs` exports `deliverableClaims(parsed)` and the code predicate, and `checkDeliverables` uses both. Per row, the claims hold makers (run, paths, reason, artifact) and readers (kind, paths, reason). The check's notes and counts stay byte for byte. (b) The report re-parses the raw lines. Recommend (a): the grammar lives once. Default: `shared-parser`.
- **D9 Failure.** No new git call refuses the report. A failed `ls-tree` gives the checker's "paths not checked" note; a failed walk or shallow check gives "age unknown" with a reason. The refusals R-1013 pins stay. Default: `degrade`.
- **D10 Builds.** (a) One build session with the larger builder. It covers the module export, the report model and render, and the five checks. It also covers the rows, six suffixes, skill and README text, map and outline. (b) Two, code then data, as lane A did. Recommend (a): the brief names the six suffixes, so no research is left. Default: `one-build`.

## 4. Must-meet rows

R-2542 to R-2545 in FEAT-039, after R-2454. All four checks go in `packages/nana-pack/tests/product-report.test.mjs`, each with its `req:` marker. Each renders through the page path (`renderHtmlAt`), so a module-scope name read inside `renderInto` fails there. Each row has one "shall". `scripts/product-report.mjs` exports the exact strings; the tests import them.

1. **R-2542** WHEN a live `Kind: product` capability's card in the Product view lists a deliverable, the product report shall show under it each `Made by:` and `Read by:` claim for that row in ledger order as written after the row ID, the mark "not made by code" when no claim is an automatic maker, the mark "not read by code" when no claim is a code or prompt reader, and "no artifact named" when no maker claim names one, in place of the features that list the row on `Also applies:`.
   Test: `packages/nana-pack/tests/product-report.test.mjs::R-2542: a deliverable lists its maker and reader claims in ledger order with its code marks, and no consumers`.
   Does: the R-2452 fixture gains lines. One row has a `session start` maker and a `code` reader (no mark). One has `manual` and `rule` (both marks). One has `land` and `person` ("not read by code"). One has `manual` and `prompt` ("not made by code"). One has two maker lines, to check order. One has no line (both marks). Two consumer features still share rows. It asserts each item's claims in order, its marks and "no artifact named". It also asserts that the Product view holds no "Consumers". Red on main: items show "Consumers:" and no claim.
2. **R-2543** The product report's Product view shall show, before the capability cards, the deliverable count line and each deliverable note that the tree checker's `--root` mode prints for the same ledger and HEAD tree, in that order.
   Test: `packages/nana-pack/tests/product-report.test.mjs::R-2543: the Product view shows the tree checker's deliverable count line and notes for the same ledger and HEAD`.
   Does: the fixture holds one counted deliverable whose paths git tracks, one code path not tracked at HEAD, and one `manual` with no reason. The test runs `scripts/requirements-tree.mjs --root` on it. It asserts the view's lines equal the checker's lines after its first. A kindless ledger shows no count line and no note, as the checker prints none. Red on main: no such line.
3. **R-2544** WHEN a `Made by:` claim names an artifact path tracked in the ledger folder's HEAD tree, the product report shall show beside it the commits and whole days from the last commit that changed that path to HEAD, with that commit's first 8 characters and subject, or say why the age is unknown.
   Test: `packages/nana-pack/tests/product-report.test.mjs::R-2544: a tracked artifact shows the commits, days, short hash and subject of its last change, a sweep or merge included, or why its age is unknown`.
   Does: commits with set committer dates. The artifact's make comes first, then an unrelated commit. Next, "scrub: sweep records" touches the artifact and three other files, and HEAD follows a day later. It expects "last changed 1 commit and 1 day before HEAD by <sha8>: scrub: sweep records". In a merge where both sides change the artifact, it expects the merge, as `git log -1 -- <path>` gives. Dates at +14:00 and -12:00 make calendar days and epoch days differ. A change dated after HEAD clamps to 0 days. A ledger in a subfolder names its artifact relative to itself. Unknown cases: "age unknown: not tracked at HEAD"; "age unknown: shallow clone" from a `--depth 1` clone. A runner that fails only the walk gives "age unknown: git could not read the history", and the page is still written. Red on main: no age.
4. **R-2545** WHEN a `Made by:` claim names `runtime-map`, the product report shall show beside it the tip and measurement time the runtime data records, with the commits from that tip to HEAD and the whole days from that time to HEAD's commit time, or say that the data is missing or unusable, records no tip or time, or names a tip outside HEAD's history.
   Test: `packages/nana-pack/tests/product-report.test.mjs::R-2545: the runtime map shows its own tip and measurement time with commits and days to HEAD, or says why it cannot`.
   Does: the data names a tip two commits back, measured three days before HEAD's time. A later commit changes the maker's own code path. It expects "measured at tip <sha8> on <time>, 2 commits and 3 days before HEAD", not that file's git age. Data measured after HEAD gives 0 days. Then come no data, data of another schema, data with no tip, and a tip not in history, each with its reason. Red on main: no age.

Text-only: R-2452 drops its consumer clause, and its check drops the consumer links. Its title becomes `R-2452: a product card lists its deliverables in line order with status and home, and marks every one not implemented as a gap`.

Strings (contract, exported): `not made by code`; `not read by code`; `no artifact named`; `last changed <n> commit(s) and <d> day(s) before HEAD by <sha8>: <subject>`; `measured at tip <sha8> on <recorded time>, <n> commit(s) and <d> day(s) before HEAD`; `age unknown: ` followed by `not tracked at HEAD`, `shallow clone`, `git could not read the history`, the runtime loader's own reason, `the runtime data records no tip or time`, or `tip <sha8> is not in HEAD's history`. Singular for 1, as the impact freshness line does.

## 5. Class, tunables, limits, threat, files, builds

**Class.** Ordinary: scripts, tests, the ledger, skill and README text; no install, hook, gate or land-tool file. The seat's wrong-code pairs first, then one final reviewer of another model family. A draft PR runs the Windows leg. Carry the movement report's output in the review brief and the land.

**Wrong-code pairs.** Walk without `-c`. Days from calendar dates or local time. No clamp. The runtime map aged by git instead of its tip. Consumers kept. Marks from a predicate other than the count's (person read as code). Count and notes without the HEAD tree. Shallow ignored. No `--relative`. A walk failure that refuses the page. A module-scope string read inside `renderInto`. The buffer pair (no `maxBuffer`) shows only on a long history. So the seat runs the report on a full clone of the tip and checks that every age shows.

**Tunables.**
- The six strings above: contract (R-2542, R-2544, R-2545). Exported from `scripts/product-report.mjs`.
- Short hash length: `TIP_DIGITS` (8) from `packages/nana-pack/lib/land-config.mjs`, reused: contract (R-2528's 8 characters). No new value.
- `MAX_GIT_BUFFER` (64 MiB) imported from `scripts/requirements-moved.mjs`: chosen there. Measured need on 2026-10-22: 1,019,213 bytes for the walk at 2,514 commits, about 405 bytes a commit.
- The walk's flags: contract (R-2544): `-c` makes merges count as `git log -1 -- <path>` does; `--relative` gives ledger-relative paths; `-z` keeps non-ASCII names unquoted.
- Seconds per day: a unit, named once beside the age code.
- No new sealed value, so no pin test.

**Known limits** (for the feature files).
- 31 of 38 deliverables show "no artifact named": printed output, machine-local stores, another project's files, a release tag, main. Their ages need makers that record a date.
- Per-lane records name no artifact; a review folder would read as fresh after every lane.
- Git ignores the report page, so the report's own age does not show.
- The last change can be a sweep, a merge, a rename or a revert. The subject shows which; the report does not guess the last real make.
- A line names one study's files. A newer study in a new folder does not refresh it until someone edits the line.
- The walk can name a change undone inside a merged branch, where `git log -- <path>` names an older commit.
- The runtime map's age is this clone's data; another worktree's land moves it. A Windows land does not measure (R-2526).
- Walk time grows with history: 163 ms at 2,514 commits on macOS.
- Paths in claims are text, not links.
- The check proves a path exists, not that the code makes or reads the artifact (lane A's limit).
- A reason holding " · " breaks the line's parse; none does today.
- Adjacent, not this lane: other scripts that read the ledger through git without a buffer also stop at 1 MiB. The movement report and the lift set 64 MiB; the rest were not audited.

**Threat model.** Honest variation is in scope:
- a ledger with no maker or reader line, or a listed deliverable with none;
- a path not tracked, or a staged-only file;
- a merge, a sweep, a rename or a revert;
- timezone offsets, or a rebase that dates a change after HEAD;
- a shallow clone, a ledger in a subfolder, CRLF ledgers;
- no runtime data, older data with no tip, or a tip outside HEAD's history;
- git failures.

Deliberate forgery is out: a forged commit date, a rewritten tip, or a line naming code that never makes or reads the artifact.

**Files.**
- `scripts/deliverables.mjs`: export `deliverableClaims` and the code predicate; update the header.
- `scripts/product-report.mjs`: claims, marks, ages, count line and notes in the model. The HEAD tree, shallow check and walk go through the injected runner. The buffer goes in its git helper. Remove the consumer code. Change the Product branch of `renderInto`. Update the header.
- `packages/nana-pack/tests/product-report.test.mjs`: four checks; narrow R-2452's.
- REQUIREMENTS.md: four rows, R-2452's text and evidence, six suffixes.
- The requirements skill: drop the derived-consumers sentence; add `[ · <artifact>]` after `manual: <reason>`. Its stage-view sentence names makers, readers, ages and the count.
- The README's product report paragraph gets the same clause.
- Regenerate `docs/requirements-tree.md` and `docs/code-map.md`.
- `docs/known-bugs/FEAT-039.md`: drop the retired-consumers line; add the limits above.
- HANDOFF and the session entry.

**Build sessions.** One, with the larger builder (D10). Seat check: the pairs, then the Windows leg. The seat also runs the report on a full clone of the tip. It reads every age, and checks the count line against `npm run req:tree`. FEAT-039's stored assessment turns out of date, with four rows added and one changed. Refreshing it stays with the queued report republish.
