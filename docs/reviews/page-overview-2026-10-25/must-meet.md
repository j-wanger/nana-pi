# page-overview · must-meet of record (seat, 2026-10-25)

Feature: FEAT-039 · See the product and its decisions in one report

Written by the seat from the planner's draft (`plan-draft.md`, this folder) and one adversary pass (`plan-attack.md`, this folder; 1 MUST, 5 SHOULD, 9 NOTE). The seat took all of them, in the form the seat decisions below give. MUST 1 becomes a new row, R-2927, for missing inputs. SHOULD 2 fixes every named fixture and drops R-2925's two red cases that cannot fail. SHOULD 3 names the two existing checks that change. SHOULD 4 splits Broken's not-passed count into failed and skipped only. SHOULD 5 splits the stale beside count into not measured and unknown. SHOULD 6 changes the skill's count-line sentence with R-2639. NOTE 7 keeps the `blocking` tag and drops the draft's two overstated supports. NOTE 8 limits the assessment count to live features. NOTE 9 adds the checker's note count to Gaps. NOTE 10 replaces the draft's whole closed-question filter: no R-2926, no CLOSED_QUESTION_MARK and no R-1570 narrowing. NOTE 11, 12, 13 and 15 are taken as written; NOTE 14 shapes the HANDOFF notes. Plans get no review round. Where this file and the draft or the attack differ, this file holds.

The owner's decision, 2026-10-25 page discussion, from the readability brief (`<scratch>/readability/brief.md`): option 2, "Restructure", in two lanes, and this is lane one; an ask may carry a "must decide" mark that the overview counts; 30 days makes an artifact stale; the stage-to-stage flow lines retire (lane two, not here); known bugs and each platform's CI on the overview come later, the brief's "later" default. He lifted the page freeze for this work.

Spend line: the current priority since 2026-10-23, the product report showing each deliverable's age and real reader, the last part of its appetite. The page is R-1014's deliverable and the owner is its only reader (`REQUIREMENTS.md:2226`); a page he cannot read is a gap in the ledger. After this lane the first screen shows what needs him, what is broken, the reader and maker gaps, and stale or unmeasured ages, each with the count beside it that keeps a zero honest. The tree checker's line goes from `deliverables: 21 of 21 made and read by code, 21 parked` (run read-only at e4d29927) to `deliverables: 21 of 21 made and read by code, 21 more parked`.

Stakes: medium blast, reversible. The locked suite writes this page at every land (R-2740), and a refusal prints one note and keeps the suite's exit code (R-2742), so a page bug cannot stop a land. The real harm is a misleading first screen: a bare zero read as healthy. So every overview count carries its parked, unmeasured or missing-input text beside or in place of it. The count-line suffix changes the tree checker's output in every project and three test literals. Other projects get the overview at once, since they run the same script by path (`packages/nana-pack/skills/requirements/SKILL.md:140`); R-2927 keeps their kindless ledgers from reading as clean. A revert restores everything; the ledger's closed-question move is plain text and stays harmless.

Threat model: honest variation in our tools' output, files and environment is in scope. Deliberate forgery is out: a hand-planted runtime record, a HANDOFF tag that lies about an ask, a forged commit date. A finding outside this model is a residual. The honest variations:

- HANDOFF with no Open section, with several `Open for <name>` sections, with no blocking ask, with a capitalised `[Blocking, …]` tag, or with asks in mixed kind order;
- a ledger with no `## Open questions` heading, closed questions under `## Closed questions`, or closed questions still under the open heading; CRLF ledgers;
- a ledger with no kinded capability, no deliverable lines, a product capability with a `Deliverables:` list but no claims, no artifact registry, a retired or constraint capability, a parked deliverable that code makes and reads (R-2641);
- an artifact entry read only through an artifact `Read by:` person, rule or runtime line; an artifact park; reader lines that get checker notes;
- a tracked artifact exactly 30 and 31 days before HEAD's commit time; a HEAD commit dated before the artifact's (clamped to 0 days, `scripts/product-report.mjs:174`); a shallow clone or unreadable history (age unknown); a path no longer tracked at HEAD;
- user-home, other-project, git-ref and CI-record classes and unbound clone stores (never aged, R-2791); the runtime map, suite records and build records aged from HEAD's history;
- no runtime data, which every other nana project has today; runtime data whose rows are all SKIP on this platform (the six Windows-only rows on a Mac);
- old bookmarks to `#shared` and prototype-name hashes (`#constructor`, R-1019);
- the page opened at phone width (the renderer adds no layout; R-1043 stays untested).

## Seat decisions

- **One feature, ordinary class, larger builder.** Every row sits in FEAT-039, after R-2802 (`REQUIREMENTS.md:2843`), except R-2639 (FEAT-028, `:2286`), whose text this lane rewords. Class ordinary: no install, uninstall or doctor code, no hook or extension, no gate policy, no land or review tool. nana-land, pi-review, claude-review and review-round import neither changed module (grep at e4d29927); the land's page writer `scripts/test-locked.mjs:192-198` stays untouched. Builder: `pi-worker --lane-size larger`. Main at e4d29927.
- **"Must decide" is the existing `blocking` tag (subtraction; the attack agrees).** HANDOFF's Open lines already carry `[blocking|optional|parked, since …]` (`packages/nana-pack/lib/handoff-asks.mjs:11`), and the report refuses a malformed one (R-1030, `scripts/product-report.mjs:621-627`). `blocking` already means the owner must decide before the work it holds goes on, and the frontier block ranks blocking asks first (R-2607, R-2609, `REQUIREMENTS.md:267`, `:269`). A new mark would need a writer, a frontier-check rule and a hook change, which makes it a hook-class lane. The overview counts `kind === "blocking"` and words it "blocking (must decide)". The draft's two extra supports are dropped: the frontier test's "Must decide" titles are one fixture's names, and the three-ask cap is a convention no code enforces. The seat names the reading in the land report with a one-word default: "Must decide is the blocking tag? Default: yes". The open optional ask on the blocking-ask cap (`HANDOFF.md:29`) now also caps must-decide asks; the land report says so.
- **Closed questions leave the page by a ledger move, not code (NOTE 10).** `parseOpenQuestions` stops at the first line starting with `#` (`scripts/product-report.mjs:131`). The seat verified it on a scratch copy at e4d29927: moving entries 2, 3, 4, 5 and 9 under a new `## Closed questions` heading, below entry 23 and above `## Deliberate omissions`, leaves the tree checker at 0 problems and the parse at 21 entries, stopping at `## Closed questions`. Each moved entry keeps its number and note, in its old order. The Decisions view then lists the 21 open entries in file order (the two bullets, then 1, 6b, 6, 7, 8, 10 to 23), and the overview counts 21. Part-closed entries (6b, 14, 18, 22) and the ruled one (7) stay open. R-1570 and R-1571 keep their text and tests. The requirements skill gains one sentence telling writers to move a closed question there.
- **Finished text in the model.** `renderInto` ships to the page as `String(renderInto)` and never reads a module-scope name (`scripts/product-report.mjs:112-114`, `:494-495`). `buildReport` builds `model.overview`: five blocks, each `{ heading, href, lines }`, every line a segment list like the Artifacts view's (`:450-468`, `featureSegment` at `:704`). The renderer prints each block as an `h3` holding one link, then one list item per line through `renderSegments` (`:371`). Headings and labels are exported contract constants beside the existing ones (`:43-63`), so tests import them; one frozen `OVERVIEW_BLOCKS` and one frozen `OVERVIEW_LABELS` are enough. The stale label builds its number from STALE_AGE_DAYS (NOTE 11).
- **Landing and tabs.** `views[""]` and the fallback (`:358-359`) become `"overview"`; `#overview` is added; the title map (`:401`) and nav (`:404`) gain Overview first. The Shared view goes: its `views` entry, title, tab and branch (`:490`). No row, README or skill names it (grep at e4d29927); `#shared` falls to the Overview. R-1015's shares stay on the Features view and detail.
- **Block headings link to their full views:** Needs you → `#decisions`, Broken → `#issues`, Gaps → `#product`, Stale → `#features`, What it does → `#product`.
- **Line forms.** A count line holds its label, its count and its beside parts joined by ` · `. When the counted list is not empty, the next line names its items. The builder may refine words through the constants, never counts, order or the parts, and reports each change. With today's data (inferred from the e4d29927 model):
  - Needs you: `Asks: 29 · blocking (must decide): 1 · optional: 26 · parked: 2`; one line per blocking ask in file order, `Must decide: <title> · since <date>`; `Open questions in the ledger: 21` (NOTE 13's label).
  - Broken: `Violated: 5`, then the IDs; `Did not pass in this clone's last measured run: 6 · failed: 0 · skipped only: 6 · implemented rows with no recorded run: <n> · <runtime age text>`, then the IDs. A row counts failed when any cited file's label is FAIL, else skipped only, from the labels `didNotPass` already reads (`:85-92`). The no-recorded-run count is implemented rows that cite at least one test file and none of whose cited files has a run state, from `uniqueFilesOf` and `runStateOf` (`:79-83`, `:661-667`). The runtime age text is the exact text the runtime map's entry shows (A-032's, `formatRuntimeAge` at `:204-207`). The builder gets it by passing one extra descriptor to the existing `artifactAges` call (`:699`): class clone store, location the runtime table key (`RUNTIME_AGE_KEY`, `:227`), and that key's run and one writer from ARTIFACT_AGE_TABLE (`scripts/deliverables.mjs:39-43`), under a key that is not `registry:`, so Stale never counts it.
  - Gaps: `Deliverables code does not make and read: 0 · parked: 21 · deliverable notes: 0`; `Artifacts with no declared reader: 0 · parked: 2`. Deliverable IDs follow Product view order (capability order, then each `Deliverables:` line's order); artifact IDs follow A-ID order, as the Artifacts view sorts (`:836`).
  - Stale: `Feature assessments out of date: 34 · unassessed: 1`, then each counted feature ID as a link to its detail, in ledger order; `Artifacts older than 30 days before HEAD's commit: 6 · age not measured: 47 · age unknown: 0`, then one line per stale entry in A-ID order, `A-nnn · <name> · <d> days`.
  - What it does: the checker's count line, then one line per live product capability in Product view order, `<CAP-nn> · <label>: <m> of <n> made and read by code[, <p> more parked]`.
- **One parse for counts and readers.** `deliverableReport` (`scripts/deliverables.mjs:707-734`) also returns the `checkDeliverables` result it printed from, as `check`. `checkDeliverables` (`:504-704`) adds `byCapability`: one entry per live product capability with its listed, parked and made-and-read counts, its gap rows, and its finished count text. They come from the per-capability loop's own `listed`, `parkedRows` and `isMadeAndReadByCode` (`:532`, `:541`, `:572-579`, `:687-688`), so their sums equal the line's numbers by construction. A module-private `deliverableCountText(madeAndRead, total, parked)` builds both the checker line's text after `deliverables: ` (`:728`) and each stage's text. It is not exported: `byCapability` carries the finished text, so product-report.mjs gains no new import (NOTE 11's choice). `deliverableReportLines` (`:736-738`) and the tree checker are unchanged in behaviour apart from the suffix.
- **Artifact gaps come from the checker's consumer join.** The overview reads `check.artifactConsumers` (`:359-500`): a live entry with no reader kind and no accepted park is a gap; one with an accepted park counts as parked (`:490-498`). The page's own `Reads:` join (`scripts/product-report.mjs:817-831`, `:865-866`) stays for the Artifacts view until lane two. The deliverable note count is `check.notes.length`, the checker's `deliverable note:` lines. The land report says why the brief's "21 artifacts no other feature reads" reads 0 here: the artifact-readers lane gave every live entry a declared reader or a park, while the Artifacts view's list still asks a different question (no `Reads:` line and no deliverable).
- **Ages carry days.** `artifactAges` (`:233-342`) also records the whole days it already computes in all three measured formatters (`:200-212`): tracked entries, the runtime map, and both record stores. A second map or a `{ text, days }` value is the builder's choice, named in the report. An entry is stale when its days exceed STALE_AGE_DAYS. Stale counts live registry entries only; every live entry with no day count is counted as not measured when its text starts with AGE_NOT_MEASURED_PREFIX, else as unknown (NOTE 5's two counts).
- **The assessment count covers live features only (NOTE 8).** It uses `liveFeature` (`:777`) over the `assessmentState` each feature already carries (`:744-745`), so retired and proposed features never count as unassessed.
- **Missing inputs name themselves (MUST 1, R-2927).** With no runtime data, the not-passed line reads `<label>: no recorded run: <runtimeReason>`, the reason the Issues legend names (`:904`). With no artifact registry, the artifact gap line and the stale artifact line read `<label>: no artifact registry`, reusing the Artifacts view's text (`artifacts.emptyText`, `:834`). With no deliverable lines (the checker prints no count line when `deliverableFieldLineCount` is 0, `scripts/deliverables.mjs:728`), the deliverable gap line reads `<label>: no deliverable lines` and What it does shows that one text, `no deliverable lines`, with no stage line.
- **The count line (defect 2).** The suffix becomes `, <n> more parked`. R-2639's text changes (FEAT-028; a cross-feature edit). R-2541 stays. `packages/nana-pack/skills/requirements/SKILL.md:127` changes "ends with `, <n> parked`" to "ends with `, <n> more parked`" in the same change (SHOULD 6). The three test literals change (below). The prefix regexes at `requirements-deliverables.test.mjs:719` and `product-report.test.mjs:1284` still match.
- **The empty list label (defect 1).** An empty `artifactFeatures` list renders as `<label>: none` with no list, for the product and the constraint label alike (`:441-445`; model at `:805-811`). R-2794 widens in place (precedent: R-2905's widening in keep-movement) and gains one test.
- **Tests in a new file, helpers moved.** `packages/nana-pack/tests/product-report.test.mjs` took 142.8 s on CI's Windows leg at e4d29927 against the 300 s per-file limit (`scripts/test.mjs:89`). The new checks go in `packages/nana-pack/tests/product-overview.test.mjs`. By the 2026-10-22 ruling, each helper the new file uses moves from `product-report.test.mjs` to a new `packages/nana-pack/tests/report-fixtures.mjs` with its folder passed in, and both files import it. Candidates: `treeFixture` (`:59-68`), `table` (`:69`), `makeAssessment` (`:74-82`), `writeStore` (`:83-88`), `writeRuntimeFile` (`:102-108`), `commitAt` (`:172-185`), `renderHtmlAt` (`:218-237`), `renderPageAt` (`:268-282`), `withinCaseLimit` with CASE_LIMIT_MS (`:36-48`). `check` stays per file, since it holds the file's failure count. The moved `treeFixture` gets an options-passing git runner and an optional first-commit date, in `historyFixture`'s form (`:161-171`), so `commitAt`'s dates hold (NOTE 12). report-fixtures.mjs carries the six-tag header, as `ledger-repo.mjs:1-8` does; it calls no `tmpDir`, so R-917's scan (`test-runner.test.mjs:653-662`) does not apply to it.
- **Headers (NOTE 11).** product-report.mjs's `@outputs` names the Overview; deliverables.mjs's `@outputs` names the per-capability counts and the check result `deliverableReport` now returns.
- **Not in this lane.** Lane two's moves, the flow lines, the Artifacts view and its cards, Product cards beyond the empty label, known bugs and CI on the page, the land's page writer, nana-land, the frontier checker and block, HANDOFF grammar, the assessment store, templates. No template copies the page or the checker (grep at e4d29927).

## Must-meet rows (FEAT-039, after R-2802 at `REQUIREMENTS.md:2843`)

Seven new rows, R-2920 to R-2925 and R-2927, `untested` until each check passes, then `implemented`. R-2926 stays unused: the draft gave it to the dropped closed-question filter, and skipping it keeps that meaning off main. R-2928 to R-2939 stay free. R-2794 widens and gains a test; R-2639 rewords. Tests live in `packages/nana-pack/tests/product-overview.test.mjs`. Every check renders through `renderHtmlAt` or `renderPageAt` on a page `generateReport` wrote, so a module-scope read inside `renderInto` throws. Every assertion imports OVERVIEW_BLOCKS, OVERVIEW_LABELS, STALE_AGE_DAYS and the age prefixes by name; only the seal writes the literal 30.

- **R-2920.** The product report shall render its Overview view for an empty hash, `#overview` and every hash that names no other view and no feature, list its tabs as Overview, Decisions, Product, Artifacts, Features, Issues and Requirements in that order, and show the blocks Needs you, Broken, Gaps, Stale and What it does in that order, each heading linking to its full view.
  - Test: `packages/nana-pack/tests/product-overview.test.mjs::R-2920: the overview is the landing view and first tab, unknown and #shared hashes render it, and its five blocks come in order with links to their views`.
  - Fixture: `treeFixture` with one kinded product capability and one feature. Render `""`, `#overview`, `#shared`, `#nope` and `#constructor`.
  - Expect for each: the `h2` reads the Overview title; the nav links read the seven tabs in order, Overview carrying `aria-current`; five `h3` headings in OVERVIEW_BLOCKS order, each holding one link whose `href` is its block's.
  - Red: `views[""]` left as decisions; the fallback left as decisions; `#shared` still a view; nav still listing Shared, or Overview not first; two blocks swapped; a heading with no link or a wrong `href`; a label read from module scope inside `renderInto`.
- **R-2921.** WHEN the product report renders the Overview, its Needs you block shall count the asks under HANDOFF.md's `Open for` headings by kind as blocking, optional and parked, list each blocking ask's title and since-date in file order, and count the open questions the Decisions view lists.
  - Test: `packages/nana-pack/tests/product-overview.test.mjs::R-2921: Needs you counts asks as blocking, optional and parked, lists each blocking ask's title in file order, and counts the open questions the Decisions view lists`.
  - Fixture: HANDOFF with `## Open for the owner` holding optional "Opt" since 2026-01-05, then `[Blocking, since 2026-02-01] Zeta`; then `## Open for the second owner` holding parked "Held" since 2026-01-03, then blocking "Alpha" since 2026-01-01. Ledger: `## Open questions` with `1. Open one.` and `- (lane) Open bullet.`, then `## Closed questions` with `2. (closed 2026-01-01) Done.`, then `## Deliberate omissions` with one bullet.
  - Expect: the count line for 4 asks, 2 blocking, 1 optional and 1 parked; the item lines Zeta (since 2026-02-01) then Alpha (since 2026-01-01) and no others; the open-question count 2, equal to the number of items in `#decisions`'s open-question list.
  - Red: optional or parked titles listed; blocking asks sorted by date or title (Alpha first); kinds summed or swapped; the question parse reading past `## Closed questions` (3).
- **R-2922.** WHEN the product report renders the Overview with runtime data, its Broken block shall name by ID the violated rows and the implemented rows that did not pass that the Issues view lists, counting the latter as failed when any cited file's label is FAIL and as skipped only otherwise, beside the count of implemented rows none of whose cited files has a recorded run and the runtime data's measured tip and age.
  - Test: `packages/nana-pack/tests/product-overview.test.mjs::R-2922: Broken names the violated rows and the implemented rows that did not pass, split into failed and skipped only, beside the rows with no recorded run and the runtime data's tip`.
  - Fixture: rows R-1 violated; R-2 implemented citing `tests/f.test.mjs::a` (FAIL); R-3 untested citing the same file; R-4 implemented citing only `tests/s.test.mjs::b` (SKIP); R-5 implemented citing only `tests/n.test.mjs::c` (no run); R-6 untested citing the same no-run file. `writeRuntimeFile` with schema 1, those two labels, `tip` = HEAD and a `measuredAt` time.
  - Expect: `Violated: 1` then `R-1`; the not-passed line with 2, failed 1, skipped only 1, no recorded run 1, and the text starting with MEASURED_AT_TIP_PREFIX and HEAD's first TIP_DIGITS characters; then `R-2, R-4` in ledger order, the same rows `#issues` lists.
  - Red: the not-passed line missing; a second rule that lists R-3; IDs left out; only FAIL rows listed (R-4 missing); a FAIL row counted as skipped only; the no-run count taking untested rows (2); the runtime text missing.
- **R-2923.** WHEN the product report renders the Overview, its Gaps block shall name by ID each unparked listed deliverable of a live product capability that code does not both make and read, beside the parked deliverable count and the tree checker's note count, and each live artifact entry with no declared reader and no accepted park, in A-ID order, beside the parked entry count.
  - Test: `packages/nana-pack/tests/product-overview.test.mjs::R-2923: Gaps names the unparked deliverables code does not make and read and the artifacts with no declared reader, each beside its parked count, and counts the checker's notes`.
  - Fixture: one product capability, `Deliverables: R-5, R-1, R-2, R-3, R-4`. R-1 suite-made and code-read; R-2 and R-5 manual, unparked; R-3 manual with a readable `Parked:` line; R-4 code-made and code-read with a `Parked:` line (R-2641, live). Code paths committed. Entries, registered in the order A-005, A-001, A-002, A-003, A-004: A-001 named by another feature's `Reads:` line; A-002 and A-005 with no reader; A-003 with an artifact park; A-004 read only by `Read by: A-004 · person: <reason>`.
  - Expect: deliverable gaps `R-5, R-2` (line order), parked 1, notes equal to the number of `deliverable note:` lines the tree checker CLI prints for the fixture; artifact gaps `A-002, A-005`, parked 1.
  - Red: R-3 listed (marks used without parks); R-4 counted parked; A-004 listed (the page's `Reads:` join used in place of the consumer join); A-003 listed or the parked entry count dropped; the note count missing or 0; artifacts in registry order.
- **R-2924.** WHEN the product report renders the Overview, its Stale block shall count and link by ID each active or frozen feature whose assessment is out of date or missing, and name by ID, name and whole days, in A-ID order, each live artifact entry measured more than STALE_AGE_DAYS whole days before HEAD's commit time, beside the counts of live entries whose age is not measured and whose age is unknown.
  - Test: `packages/nana-pack/tests/product-overview.test.mjs::R-2924: Stale counts live features' out-of-date and unassessed assessments, and artifacts older than the stale age before HEAD's commit time, beside the not-measured and unknown counts`.
  - Repository one, every commit dated through `commitAt` on the moved `treeFixture` with a first commit dated 2020-01-01: `a.txt` and `b.txt` at 2020-01-01, `b.txt` again at 2020-01-02, HEAD at 2020-02-01 (31 and 30 days). Entries: A-001 tracked `a.txt`; A-002 tracked `b.txt`; A-003 user-home store; A-004 tracked at a path not at HEAD; A-005 the runtime map at its table key under run `land` and writer `scripts/runtime-measure.mjs`, with `writeRuntimeFile` naming the first commit as `tip` and `measuredAt` 2019-12-01 (62 days). Features: FEAT-A active with an assessment stamped before a row change (out of date); FEAT-B active with none; FEAT-C proposed with none.
  - Expect: assessments 1 out of date and 1 unassessed, then links to `#FEAT-A` and `#FEAT-B` only; stale `A-001 · <name> · 31 days` then `A-005 · <name> · 62 days`; age not measured 1 (A-003); age unknown 1 (A-004).
  - Repository two: one tracked entry committed 5 days before HEAD, plus A-003's and A-004's kinds. Expect: stale 0, age not measured 1, age unknown 1, and no stale item line.
  - Red: `>=` in place of `>` (A-002 listed); days from `Date.now()` (A-002 listed); days recorded for tracked entries only (A-005 missing); the two beside counts merged; beside counts printed only when something is stale (repository two); unassessed left out; FEAT-C counted; feature IDs not linked; stale entries sorted by days (A-005 first).
- **R-2925.** WHEN the ledger has deliverable lines, the Overview's What it does block shall show the tree checker's deliverable count line, then one line per live product capability in Product view order with `<m> of <n> made and read by code` over its unparked deliverables and `, <p> more parked` when any are parked, the lines adding up to the count line's numbers.
  - Test: `packages/nana-pack/tests/product-overview.test.mjs::R-2925: What it does shows the checker's count line and one line per live product stage whose counts add up to it`.
  - Fixture: product CAP-A with R-1 code-made and read and R-2 parked; product CAP-B with R-3 manual and R-4 code-made and read with a `Parked:` line (R-2641); a constraint capability; a retired product capability.
  - Expect: the first line equals the count line the tree checker CLI prints for the fixture (`deliverables: 2 of 3 made and read by code, 1 more parked`); then `CAP-A · <label>: 1 of 1 made and read by code, 1 more parked` and `CAP-B · <label>: 1 of 2 made and read by code`; no constraint or retired line; the three sums match the count line.
  - Red: R-4 counted parked from its `Parked:` line alone (sums differ); a constraint or retired stage line; the checker line missing.
  - Dropped (SHOULD 2): "document order in place of Product view order" cannot fail, since the stable sort at `:813-816` keeps live product capabilities in document order; "a stage line formatted apart from the shared formatter" is a code shape no output test sees, and the sum check catches a different format.
- **R-2927.** IF the product report has no runtime data, no artifact registry or no deliverable lines, THEN each Overview line that reads that input shall say which input is missing in place of its count, and What it does then lists no stage line.
  - Test: `packages/nana-pack/tests/product-overview.test.mjs::R-2927: with no runtime data, no artifact registry or no deliverable lines, each overview line that reads it names the missing input in place of a count`.
  - Fixture one: a kindless `treeFixture` with no runtime file. Fixture two: the `product-no-lines` ledger (`product-report.test.mjs:1334`), a product capability with `Deliverables: R-8100` and no claim lines, with no runtime file.
  - Expect in both: the not-passed line equals its label, `: `, the no-recorded-run prefix and the reason the `#issues` legend names; the artifact gap line and the stale artifact line each end `: no artifact registry`; the deliverable gap line ends `: no deliverable lines`; What it does holds exactly one line, `no deliverable lines`; no overview line holds a count of 0 for these inputs.
  - Red: the runtime guard dropped (the not-passed line prints 0); the registry guard dropped on either artifact line (0); a checker note printed as the count line (fixture two); a stage line printed with no count line (`CAP-81 · …: 0 of 1 …`); the deliverable gap guard dropped.
- **R-2794 (widened, one new test).** New text: R-2794's current sentence with ", and a list with no item shows its label followed by `none` and no list" added before the final full stop. ID, title and existing evidence stay; the new test joins the evidence.
  - Test: `packages/nana-pack/tests/product-overview.test.mjs::R-2794: a capability card whose list has no item shows its label with none and no empty list`.
  - Fixture: a product capability whose only live feature homes its deliverable; a constraint capability with no active or frozen feature.
  - Expect: each card holds `Features with no deliverable: none` or `Artifacts of this constraint's features: none` and no `capability-artifacts` list.
  - Red: the label over an empty list; the label dropped with nothing in its place.
- **R-2639 (reworded).** New text ends "… and end that line with `, <n> more parked` counting parked rows." ID, title and evidence stay. Its test's two literals (`requirements-tree.test.mjs:523`, `:532`) take the new suffix. Red: the old suffix.

## Expected existing-test changes (each named in the build report; no assertion loosened)

In `packages/nana-pack/tests/product-report.test.mjs`:

- `:346`: `decisions = render()` becomes `render("#decisions")` (R-1013, R-1018 and the markdown-span check read it).
- `:370`: `render("#shared")` becomes `render("#overview")`; the title's "shared" becomes "overview", so it reads `feature IDs link to their detail views in product, features, overview and detail views`. R-1015's evidence does not cite it, so no cell changes.
- `:374`: `render("#shared")` becomes `render("#overview")`.
- `:396-401` (SHOULD 3): R-1019's prototype-hash check expects the Overview `h2`, and its ask-body clause `model.asks.every((ask) => carries(view.text, ask.body))` is replaced by "all five OVERVIEW_BLOCKS headings present". Its title becomes `unknown prototype hashes render the Overview`, and R-1019's evidence cell follows. The route-source regex clause stays.
- `:450` (SHOULD 3): the hand-built `renderInto` call passes `{ hash: "#decisions" }`. A second call in the same check renders with no hash a model holding one Needs you block whose blocking-ask line is the hostile title `<img onerror=alert(1)>`, in the model shape the builder chose. The check's predicate covers both calls' nodes, and requires the hostile title to appear as text.
- `:1117`, `:1141`, `:1148`: `renderPageAt(html)` gains `"#decisions"` (R-1570, R-1571).
- `:1328`: the count literal takes `, 1 more parked` (R-2642's check).
- Helper definitions move to `report-fixtures.mjs` and are imported.

In `packages/nana-pack/tests/requirements-tree.test.mjs`: `:523` and `:532` (R-2639).

The seat's title check also reads these existing checks, whose titles and markers stay: `packages/nana-pack/tests/product-report.test.mjs::renderer inserts all dynamic strings only through text nodes` (R-1019), `R-1570: the Decisions view lists every open question with its number and full text in file order` (R-1570), `R-1571: a ledger with no open questions heading, or none under it, still writes the page and says none are recorded` (R-1571), `R-2642: the Product view lists a deliverable's Parked line among its claims in ledger order` (R-2642), `R-2794: each capability card lists its features with no deliverable and their artifacts, never as a deliverable note` (R-2794), and `packages/nana-pack/tests/requirements-tree.test.mjs::R-2639: a parked deliverable leaves the count's total once and the line names the parked row count in every mode` (R-2639).

## Seal

`packages/nana-pack/tests/product-overview.test.mjs::seal: the overview's stale age is 30 days`, marked `req: R-2924`. It asserts `STALE_AGE_DAYS === 30`, as `packages/nana-pack/tests/review-movement.test.mjs:31-39` asserts its sealed values. No other new value is sealed.

## Tunables

| Name | Where | Value | Provenance |
|---|---|---|---|
| STALE_AGE_DAYS | `scripts/product-report.mjs`, after SECONDS_PER_DAY (`:64-65`) | `30` | contract: the owner's 2026-10-25 page discussion (question 3, default 30). Sealed (R-2924). |
| OVERVIEW_BLOCKS, OVERVIEW_LABELS | `scripts/product-report.mjs`, with the contract constants (`:43-63`) | the headings, hrefs and line labels above | contract (R-2920 to R-2925, R-2927). Messages, not tunables; tests import them. The stale label is built from STALE_AGE_DAYS. |

The count suffix is a message inside the module-private `deliverableCountText`, not a tunable. The missing-input texts reuse `artifacts.emptyText` and the runtime reason; `no deliverable lines` lives in OVERVIEW_LABELS.

## Seat wrong-code pairs

Each is a one-place edit in the built tree and must turn its rows red on macOS. None is Windows-only.

1. `views[""]` back to `"decisions"` → R-2920.
2. The unknown-hash fallback back to `"decisions"` → R-2920, R-1019 (`:396-401`).
3. A `"#shared": "shared"` entry put back in `views` → R-2920.
4. Nav lists Decisions before Overview → R-2920.
5. Two OVERVIEW_BLOCKS entries swapped → R-2920.
6. One block's `href` changed to `#product` → R-2920.
7. The renderer reads OVERVIEW_BLOCKS from module scope in place of the model → R-2920, and every overview check (the vm render throws).
8. The overview's blocking-ask line drawn with `innerHTML` → R-1019 (`:450`).
9. Needs you lists every ask's title → R-2921.
10. Needs you sorts blocking asks by since-date → R-2921.
11. Optional and parked counts swapped in the count line → R-2921.
12. `parseOpenQuestions` breaks only on `# ` (level one) → R-2921, R-1570.
13. Broken drops the not-passed line → R-2922.
14. The overview's not-passed list filters on `didNotPass` without the `implemented` status test → R-2922.
15. The not-passed items line left out → R-2922.
16. The overview's not-passed list keeps only rows with a FAIL label → R-2922.
17. The split counts every row as skipped only → R-2922.
18. The no-recorded-run count drops the `implemented` status test → R-2922.
19. The runtime age text left off the not-passed line → R-2922.
20. Deliverable gaps taken as listed rows not made and read, ignoring `parkedRows` → R-2923.
21. Stage and gap parked rows taken from the presence of a `Parked:` field line → R-2923, R-2925.
22. Artifact gaps from the page's `readIds` and `referencesFor` join → R-2923.
23. The parked entry count dropped from Gaps → R-2923.
24. The deliverable note count dropped → R-2923.
25. Artifact gaps in registry order (no sort) → R-2923.
26. Stale compares with `>=` → R-2924.
27. Stale days computed from `Date.now()` → R-2924.
28. Days recorded only in the tracked formatter → R-2924.
29. The not-measured and unknown counts merged into one → R-2924.
30. The beside counts printed only when the stale count is not 0 → R-2924.
31. Unassessed features left out of the assessment count → R-2924.
32. The `liveFeature` filter dropped → R-2924.
33. Feature IDs printed as text, not links → R-2924.
34. Stale entries sorted by days → R-2924.
35. A constraint capability gets a stage line → R-2925.
36. The checker count line left out of What it does → R-2925.
37. The runtime guard dropped from the not-passed line → R-2927.
38. The registry guard dropped from the artifact gap line → R-2927.
39. The registry guard dropped from the stale artifact line → R-2927.
40. What it does takes `deliverableLines[0]` without the field-line guard → R-2927.
41. Stage lines printed when the count line is absent → R-2927.
42. The deliverable gap line's guard dropped → R-2927.
43. An empty list renders its label over an empty list → R-2794 (new test).
44. An empty list renders nothing → R-2794 (new test).
45. The suffix back to `, <n> parked` → R-2639, R-2642 (`:1328`).
46. STALE_AGE_DAYS retuned to 31 → seal, R-2924.

No one-place edit can make the closed-question move fail: it is ledger text, and pair 12 covers the parse it relies on. The seat re-runs the pairs after any change of its own to code or tests.

## Precedent (verified at main e4d29927)

- Views, landing and fallback: `scripts/product-report.mjs:358-359`; title map `:401`; nav `:404`; the Decisions branch `:406-414`; the Shared branch `:490`; the Issues branch `:491-501`.
- Renderer helpers: `paragraph`, `textList`, `featureLink`, `renderSegments` at `:368-371`. A view built from model segment lines: the Artifacts view `:450-468`, from the model at `:832-897`; `featureSegment` at `:704`; `featureArtifactLines` at `:705-722`.
- The String() rule: `:112-114` and `:494-495`.
- Contract constants and exports: `:43-63`; tunable form `LAND_REPORT_SUBPATH` `:32-33`; SECONDS_PER_DAY `:64-65`.
- Asks: `splitOpenSection` and `TAG` (`packages/nana-pack/lib/handoff-asks.mjs:11-28`); the report's ask parse `:621-627`; the model's asks at `:905`.
- Open questions: `parseOpenQuestions` `:123-143`, its break at `:131`.
- Broken rows: PASS and FAIL labels `:72-75`; `uniqueFilesOf` `:79-83`; `didNotPass` `:88-92`; `runStateOf` `:661-667`; `violated` `:898`; `notPassed` `:901`; legend `:904`.
- Assessment state `:744-745`; `liveFeature` `:777`.
- Ages: `artifactAges` `:233-342`; `plural`, `unknownAge`, `wholeDays` `:172-174`; formatters `:200-212`; `RUNTIME_AGE_KEY` `:227`; the not-measured branch `:240-244`; the runtime branch `:321-340`; descriptors and the ages call in `buildReport` `:686-699`.
- Product cards: model `:783-816`, empty-list model `:805-811`, sort `:813-816`; renderer `:441-445`.
- Counts and consumers: `checkDeliverables` `scripts/deliverables.mjs:504-704`; its per-capability loop from `:532`, `listed` `:541`, `parkedRows` `:546`, the park decision `:572-579`, counters `:687-688`, return `:703`; `deliverableReport` `:707-734`, count line `:728`; `deliverableReportLines` `:736-738`; `artifactConsumers` `:359-500`, park and gap `:490-498`; ARTIFACT_AGE_TABLE `:39-43`; `artifactAgeTableKey` `:45-49`.
- Tests: `check` and `withinCaseLimit` `packages/nana-pack/tests/product-report.test.mjs:31-48`; `treeFixture` `:59-68`; `table` `:69`; `makeAssessment` `:74-82`; `writeStore` `:83-88`; `writeRuntimeFile` `:102-108`; `historyFixture` `:161-171`; `commitAt` `:172-185`; `renderHtmlAt` `:218-237`; `renderPageAt` `:268-282`; the shared-model renders `:336-346`; R-1019 checks `:396-401`, `:446-452`; R-1570 `:1097-1129`; R-1571 `:1131-1157`; R-2642 `:1327-1329`; R-2543's checker comparison `:1331-1369`; R-2545's runtime fixture `:1689-1709`; R-2794 `:1477-1503`. The count literals: `requirements-tree.test.mjs:523`, `:532`, R-2639's check `:534`.
- Shared test-helper modules: `packages/nana-pack/tests/ledger-repo.mjs:1-8`, `land-fixtures.mjs:1-8`. R-917's temp-source scan: `packages/nana-pack/tests/test-runner.test.mjs:653-662`. The per-file limit: `scripts/test.mjs:89`.
- Seal form: `packages/nana-pack/tests/review-movement.test.mjs:31-39`.
- Widening bookkeeping: `docs/reviews/keep-movement-2026-10-25/must-meet.md` (R-2905 widened in place).
- Ledger rows: R-2607, R-2609 `REQUIREMENTS.md:267`, `:269`; R-2639 `:2286`; R-1014's lines `:2224-2227`; R-1012 `:2781`; R-1015 `:2796`; R-1019 `:2801`; R-1570 `:2816`; R-1571 `:2817`; R-2543 `:2825`; R-2791 `:2836`; R-2794 `:2839`; R-2802 `:2843`; the open questions `:3023-3075`, `## Deliberate omissions` `:3077`.
- Rule text: `packages/nana-pack/skills/requirements/SKILL.md:125`, `:127`, `:129`; `README.md:271`.

Helper moves: the test helpers above, from `product-report.test.mjs` to the new `report-fixtures.mjs`, only those the new file uses, each named in the report. In product code nothing private moves between modules: `deliverableCountText` is an in-module extraction, and the runtime age text comes from the existing `artifactAges` call.

## Class and builder

Ordinary. The lane changes the page script, the deliverable check's count text and per-stage counts, tests, the ledger, the README and the skill. Ladder: the roster's final reviewer only (`reviewer: claude-code opus`, through claude-review); the builder (`largerBuilder: openai-codex gpt-6.1-sol high`) is a different lineage. Builder: `pi-worker --lane-size larger`, one session. Reason: the String() rule, the one-parse requirement, the age-days change across three formatters and the helper move are easy to get subtly wrong. Size: medium; about 170 product lines over two files, 400 new test lines over two new files, about 80 moved helper lines and 14 edited test lines, plus ledger, README and skill lines. No local install check: nothing under `packages/nana-setup/` and no hook changes. The seat pushes the draft pull request at build 1 and reads both report test files' Windows times before the review brief. It runs the wrong-code pairs before the final review. Before the final review and the land, it runs `node "$HOME/nana-pi/scripts/requirements-moved.mjs" --root . --base main` and carries its output in both.

## Page effect (expected at today's data; inferred from the e4d29927 model, not run on the built tree)

- Needs you: 29 asks, 1 blocking, 26 optional, 2 parked; 21 open questions. After the seat's HANDOFF notes: 29 asks, 0 blocking, 27 optional, 2 parked.
- Broken: violated 5 (R-433, R-435, R-436, R-445, R-446); did not pass 6, failed 0, skipped only 6 (R-1064, R-1058, R-1063, R-1330, R-1713, R-1340), from this clone's runtime data.
- Gaps: 0 deliverables, 21 parked, 0 notes; 0 artifacts with no declared reader, 2 parked (A-057, A-059).
- Stale: 34 assessments out of date, 1 unassessed; 6 artifacts older than 30 days (A-039, A-040, A-041, A-042, A-074, A-075, each 46 days); 47 not measured, 0 unknown.
- What it does: the count line, then CAP-01 5 of 5 (1 more parked), CAP-02 4 of 4 (2), CAP-04 5 of 5 (1), CAP-05 2 of 2 (3), CAP-06 0 of 0 (5), CAP-07 5 of 5 (3), CAP-08 0 of 0 (6).
- CAP-01 and CAP-02 cards read "Features with no deliverable: none".
- Seven tabs before and after (Shared out, Overview in); the page grows by a few KB (inferred; the builder reports both sizes).

## Known limits (the seat writes them to FEAT-039's file before the final round)

- The overview has no line cap. Many blocking asks, gap IDs or stale entries lengthen it; the assessments line names 35 features today.
- "Must decide" is the `blocking` tag. A decision that holds no work has no mark of its own.
- A closed question leaves the page only when someone moves it under `## Closed questions`. One closed in place still lists.
- Stale counts registry entries only; a plain-path artifact on a `Made by:` line is not counted.
- The six stale entries are one finished study's records (CAP-08, all parked). They stay on the first screen and grow older each day.
- 7 of the 34 out-of-date assessments belong to frozen desk features.
- Ages count to HEAD's commit time, not today. A page built long after HEAD reads young; this keeps R-1012.
- 47 of 80 entries carry no measured age, so the stale count speaks for 33 entries. The beside counts say so, not which.
- The not-passed count is this clone's last measured run; on a Mac all six are Windows-only skips. Another clone's page differs.
- Gaps names parked items by count only; the Product view still shows them in full.
- The Product view's `· gap` mark (status not implemented) and the overview's gap (not made and read by code) answer different questions.
- The Product view's repeats, the artifact cards and the flow lines stay until lane two.
- Other projects get the overview at once through the shared script, without a template tag.

## Notes the seat writes before the final round

- HANDOFF, Open for the owner: remove the blocking "The page discussion" ask (`HANDOFF.md:23`); the owner decided on 2026-10-25. The discussion answered the brief's five questions, not the artifact assessment's eleven. So one optional ask keeps them: "**[optional, since 2026-10-25] The artifact assessment's eleven questions.** The page discussion answered the brief's five, not these. Default: the assessment's defaults."
- HANDOFF, Next item 4 (`HANDOFF.md:16`) becomes: "**Product page readability (the owner, 2026-10-25).** He picked option two, in two lanes. The overview lane is on main. Lane two moves deliverable and artifact detail to feature pages and retires the flow lines. Known bugs and each platform's CI on the overview come later."
- HANDOFF, Next item 5 (`HANDOFF.md:17`): "The owner's discussion sets it." becomes "Page lane two comes next."
- HANDOFF, Landed: "2026-10-25: the product page opens on a one-screen overview of asks, broken rows, gaps, stale items and each stage's deliverables."
- Then `nana-writing HANDOFF.md`.
- FEAT-039 known-bug file: remove "closed questions still list" (fixed by the move); add the known limits above.
- FEAT-028 known-bug file: one line saying earlier records quote the count line without "more".
- The land report: "Must decide is the blocking tag? Default: yes"; the blocking-ask cap now caps must-decide asks; why the brief's 21 unread artifacts read 0 in Gaps.
- A session entry in `docs/sessions/`.
- `docs/requirements-tree.md` and `docs/code-map.md` regenerated after any merge of main, with a confirmation round.
- After the land: check the land-written page's commit against main, then publish it to the owner's copy (seat work, `HANDOFF.md:17`).
