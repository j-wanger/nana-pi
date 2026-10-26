# page-overview · plan draft (planner, 2026-10-25)

Feature: FEAT-039 · See the product and its decisions in one report

Written by the planner at main e4d29927 for the seat and one adversary pass. Plans get no review round. Every file:line below was read at e4d29927. Numbers come from a page rendered at e4d29927 to `<scratch>/page-overview/page-e4d29927.html` (2,231,459 bytes, `node scripts/product-report.mjs --out …`), from `node scripts/requirements-tree.mjs --check`, and from the CI record of e4d29927's Windows leg in the clone's ci-runs store.

## Source of the decision

The owner held the page discussion on 2026-10-25 from the readability brief (`<scratch>/readability/brief.md`). He picked:

- option 2, "Restructure", in two lanes; this is lane one;
- an ask may carry a "must decide" mark, and the overview counts it (question 2, default yes);
- the stale age is 30 days (question 3);
- the stage-to-stage flow lines retire (question 4; lane two does it);
- known bugs and per-platform CI on the overview come later (question 5).

He lifted the page freeze for this work. Lane one adds the overview as the first screen, drops the Shared view, and fixes the brief's three defects. Lane two moves deliverable and artifact detail to the feature pages and retires the flow lines.

## Spend line

The current priority since 2026-10-23: each artifact comes from an existing run, is read by something real, and shows its age. The page is R-1014's deliverable, and its only reader is the owner (`REQUIREMENTS.md:2226`). If he cannot read it, the ledger has a gap. After this lane the first screen shows what needs him, what is broken, the reader and maker gaps, and stale or unmeasured ages, with counts. The tree checker's line goes from `deliverables: 21 of 21 made and read by code, 21 parked` (read-only run at e4d29927) to `deliverables: 21 of 21 made and read by code, 21 more parked`.

## Stakes

Medium blast, reversible. The locked suite writes this page at every land (R-2740); a refusal prints one note and keeps the suite's exit code (R-2742), so a page bug cannot stop a land. The real harm is a misleading first screen: a bare "0 stale" or "0 gaps" read as healthy. Every count therefore carries its parked or unmeasured count beside it. The count-line suffix changes the tree checker's output in every project and three test literals. Other projects get the overview at once, since they run the same script by path (`packages/nana-pack/skills/requirements/SKILL.md:140`). A revert restores everything; nothing persistent is written.

## Threat model

Honest variation in our tools' output, files and environment is in scope. Deliberate forgery is out: a hand-planted runtime record, a HANDOFF tag that lies about an ask, a forged commit date. A finding outside this model is a residual. The honest variations:

- HANDOFF with no Open section, with several `Open for <name>` sections, with no blocking ask, or with asks in mixed kind order;
- open questions marked `(closed …)`, `(Closed …)`, `R-058 (closed by …)`, `(closed: …)`; questions closed only in part ("R-739's half closed", "the form half closed"); a section where every entry is closed; CRLF ledgers;
- a ledger with no kinded capability, no `Deliverables:` line, no artifact registry, a retired or constraint capability, a parked deliverable that code makes and reads (R-2641);
- an artifact entry read only through an artifact `Read by:` person, rule or runtime line; an artifact park; a reader line that gets a note (untracked path, test file);
- a tracked artifact exactly 30 days, and 31 days, before HEAD's commit time; a HEAD commit dated before the artifact's (clamped to 0 days, `scripts/product-report.mjs:174`); a shallow clone or unreadable history (age unknown); a path no longer tracked at HEAD;
- user-home, other-project, git-ref and CI-record classes and unbound clone stores (never aged, R-2791);
- no runtime data (the not-passed list is empty and the legend says so), or runtime data from another clone state;
- old bookmarks to `#shared` and prototype-name hashes (`#constructor`, R-1019);
- the page opened at phone width (the renderer adds no layout; R-1043 stays untested).

## Seat decisions

### The "must decide" mark is the existing `blocking` tag (subtraction)

- HANDOFF's Open lines already carry `[blocking, since …]`, `[optional, …]` or `[parked, …]`. The frontier checker refuses an untagged ask (`packages/nana-pack/lib/frontier-check.mjs:88`, R-878), and the report refuses a malformed one (R-1030, `scripts/product-report.mjs:622-628`).
- `blocking` already means "the owner must decide before the work it holds goes on". The frontier block ranks blocking asks first (R-2607, R-2609, `REQUIREMENTS.md:267`, `:269`). The 2026-10-06 attention trial capped blocking asks at three and excluded optional and parked ones. The frontier tests title their blocking asks "Must decide" (`packages/nana-pack/tests/frontier-summary.test.mjs:129`).
- The brief's "none marked as required" held on 2026-10-24 only because no blocking ask stood then. Today one does: "The page discussion" (`HANDOFF.md:23`).
- A new mark would duplicate `blocking`, need a writer, a checker rule and a frontier rule. It fails the subtraction test. So the overview counts `ask.tag.kind === "blocking"` and words it "blocking (must decide)". No new mark, no HANDOFF grammar change, no frontier change.
- Who writes it: the seat, as today, through the tag. The open optional ask on the blocking-ask cap (`HANDOFF.md:29`) now also caps must-decide asks at three; the seat says so in the land report.
- The owner answered "yes" to "should an ask carry a must decide mark". If he meant a decision that blocks no work yet must still be made, this reading is wrong. The land report names it as the claim most likely wrong.

### The stale age

- `STALE_AGE_DAYS = 30` lives in `scripts/product-report.mjs` beside `SECONDS_PER_DAY` (`:64-65`), the page's other day unit, with `LAND_REPORT_SUBPATH` (`:32-33`) as the form for a chosen value with provenance. Sealed (R-2924).
- `renderInto` ships to the page as `String(renderInto)` and must never read a module-scope name (`:111-113`, `:494-495`). So `buildReport` decides staleness and puts finished text in the model; the renderer only prints it.
- How the page measures age today: `artifactAges` (`:233-342`) gives each artifact a text. Tracked entries age by their last commit (`formatArtifactAge`, `:200-202`); the runtime map by its measured time (`:204-207`); suite and build records by the newest record in HEAD's history (`:209-212`). Every one counts whole days to HEAD's commit time through `wholeDays` (`:174`), never the wall clock. That keeps R-1012's same-output rule.
- Every other class gets `age not measured: <class>` (`:240-242`, R-2791); failures get `age unknown: <reason>` (`:173`). R-1012 and R-2791 keep user-home ages off the page, and so off the stale count.
- The change: `artifactAges` also records the whole days it already computes for each measured age (a second map or a `{ text, days }` value; builder's choice, named in the report). An entry is stale when its days are more than `STALE_AGE_DAYS`. Every live entry with no day count is counted beside the stale count as "age not measured or unknown".

### The overview

- `buildReport` builds `model.overview`: five blocks, each `{ heading, href, lines }`, lines as segment lists like the Artifacts view's (`:839-884`, `featureSegment` at `:704`). `renderInto` renders it with its own `paragraph`, `featureLink` and `renderSegments` (`:368-371`).
- Landing: `views[""]` (`:358`) becomes `"overview"`; `#overview` is added; the fallback at `:359` becomes `"overview"`; the title map (`:401`) and nav (`:404`) gain Overview first.
- Block headings link to their full views: Needs you → `#decisions`, Broken → `#issues`, Gaps → `#product`, Stale → `#features`, What it does → `#product`.
- Labels are exported contract constants beside the R-2542 ones (`:43-46`), so tests import them. Proposed lines (the builder may refine words, never the counts or order, and reports each change):
  - Needs you: `<a> asks: <b> blocking (must decide), <o> optional, <p> parked · <q> open questions`, then one line per blocking ask title, in file order.
  - Broken: `Violated: <n>` with the IDs; `Did not pass in this clone's last measured run: <n>` with the IDs. The same two lists the Issues view shows (`:898`, `:901`).
  - Gaps: `Deliverables code does not make and read: <n>` with IDs, `· parked: <p>`; `Artifacts with no declared reader: <n>` with IDs, `· parked: <p>`.
  - Stale: `Feature assessments out of date: <n> · unassessed: <u>` with each ID linked to its detail view; `Artifacts older than 30 days before HEAD: <n>` with `A-nnn · <name> · <d> days` items, `· age not measured or unknown: <m>`.
  - What it does: the checker's count line, then one line per live product capability in Product view order: `<CAP-nn> · <label>: <m> of <n> made and read by code[, <p> more parked]`.
- About 25 lines today. No line cap; a known limit.

### One parse for counts and readers

- `deliverableReport` (`scripts/deliverables.mjs:707-734`) also returns the `checkDeliverables` result it printed from. The page takes the count, the per-stage counts and the consumer join from that one run, so the overview cannot disagree with the checker.
- `checkDeliverables` (`:504-704`) adds `byCapability`: for each live product capability, its listed count, parked count, made-and-read count and gap rows. They come from the per-capability loop's own `listed`, `parkedRows` and `isMadeAndReadByCode` (`:541`, `:546`, `:687-688`), so their sums equal the line's numbers by construction.
- The artifact gap uses `artifactConsumers` (`:359-500`): an entry with no kind and no accepted park (`:490-498`) is a gap; an entry with an accepted park is counted as parked. Today: 80 live entries, 0 gaps, 2 parked (A-057, A-059).
- The page's own reference join (`scripts/product-report.mjs:817-831`) stays for the Artifacts view until lane two, as artifact-readers recorded.

### The count line (defect 2)

- Today's line uses one number for two things: "21 of 21 made and read by code, 21 parked". The page shows exactly what the checker prints (R-2543, `REQUIREMENTS.md:2825`), so any reword changes the checker.
- Smallest fix: the suffix becomes `, <n> more parked`. "More" says the parked rows sit outside the total. R-2639's text changes (`REQUIREMENTS.md:2286`, FEAT-028; a cross-feature edit). R-2541 stays.
- One formatter: extract `deliverableCountText(madeAndRead, total, parked)` inside `scripts/deliverables.mjs` from `:728`. The checker line and each stage line call it. In-module extraction, not a move.
- Readers of the line: no code parses it. Tests pin it at `packages/nana-pack/tests/requirements-tree.test.mjs:523`, `:532`, and `packages/nana-pack/tests/product-report.test.mjs:1328`; prefix regexes at `requirements-deliverables.test.mjs:719` and `product-report.test.mjs:1284` still match. Old must-meet files and session notes quote the old form as history.

### Closed open questions (defect 3)

- At e4d29927, 5 of 26 questions say they are closed: 2, 3, 4, 5 and 9 (`REQUIREMENTS.md:3029-3037`). Each holds a parenthetical starting "closed". The part-closed ones (6b, 14, 18, 22) say "half closed" with no parenthesis and stay.
- `buildReport` leaves out any entry whose text matches `CLOSED_QUESTION_MARK` (`"(closed"`), case-insensitive, after `parseOpenQuestions` (`scripts/product-report.mjs:123-143`). Contract value, R-2926.
- R-1570 narrows to "every entry R-2926 does not leave out"; its test stays. With every entry closed, the Decisions view says none are recorded (R-1571's line); a known limit.
- Not chosen: deleting closed entries from the ledger. It needs no code, but nothing stops the next closure from listing again, and the closure notes are provenance.

### The empty list label (defect 1)

- CAP-01 and CAP-02 print "Features with no deliverable:" over an empty list (`scripts/product-report.mjs:441-445`; model at `:806-811`). Their feature lines then read as features with no deliverable.
- An empty list renders as `<label>: none` with no list, for the product and the constraint label alike. R-2794 widens in place (precedent: R-2905's widening in keep-movement); it gains one test.

### The Shared view

- Drop `#shared` from `views` (`:358`), the title map (`:401`) and nav (`:404`), and the branch at `:490`. No row names the Shared view, and no README or skill does (grep at e4d29927). `#shared` falls to the Overview. R-1015's shares stay on the Features view and detail.

### Tests in a new file, helpers moved

- `packages/nana-pack/tests/product-report.test.mjs` took 142.8 s on CI's Windows leg at e4d29927 against the 300 s per-file limit (`scripts/test.mjs:89`). It runs 78.2 s on this Mac. New checks go in `packages/nana-pack/tests/product-overview.test.mjs`.
- By the 2026-10-22 ruling, a helper's second caller imports it. Each helper the new file uses moves from `product-report.test.mjs` to a new `packages/nana-pack/tests/report-fixtures.mjs`, with its folder passed in. Candidates: `treeFixture` (`:59-68`), `table` (`:69`), `makeAssessment` (`:74-82`), `writeStore` (`:83-88`), `writeRuntimeFile` (`:102-108`), `commitAt` (`:172-185`), `renderHtmlAt` (`:218-237`). The builder moves only those it uses and names each. Precedent: `packages/nana-pack/tests/ledger-repo.mjs` and `land-fixtures.mjs`.

### Not in this lane

Lane two's moves, the flow lines, the Artifacts view and its cards, Product cards beyond the empty label, known bugs and CI on the page, the land's report writer (`scripts/test-locked.mjs:192-198`), nana-land, the frontier checker and block, HANDOFF grammar, the assessment store, templates. No template copies the page or the checker (grep at e4d29927); the page ships to other projects only through the script.

## Must-meet rows (FEAT-039, after R-2802 at `REQUIREMENTS.md:2843`)

Seven new rows, R-2920 to R-2926, `untested` until each check passes, then `implemented`. R-2927 to R-2939 stay free. R-2794 widens and gains a test; R-1570 narrows; R-2639 rewords. Tests live in `packages/nana-pack/tests/product-overview.test.mjs` unless noted. Every check renders through `renderHtmlAt` on a written page, so a module-scope read inside `renderInto` throws. Every assertion imports the label constants and `STALE_AGE_DAYS` by name.

- **R-2920.** The product report shall render its Overview view for an empty hash, `#overview` and every hash that names no other view and no feature, list its tabs as Overview, Decisions, Product, Artifacts, Features, Issues and Requirements in that order, and show the blocks Needs you, Broken, Gaps, Stale and What it does in that order, each heading linking to its full view.
  - Test: `R-2920: the overview is the landing view and first tab, unknown and #shared hashes render it, and its five blocks come in order with links to their views`.
  - Fixture: `treeFixture` with one kinded capability. Render `""`, `#overview`, `#shared`, `#nope` and `#constructor`.
  - Red: `views[""]` left as decisions; the fallback left as decisions; `#shared` still rendering a Shared view; nav still listing Shared, or Overview not first; two blocks swapped; a heading with no link or a wrong `href`; a label read from module scope inside `renderInto`.
- **R-2921.** WHEN the product report renders the Overview, its Needs you block shall count the asks under HANDOFF.md's `Open for` headings as blocking, optional and parked in that order, list the title of each blocking ask in file order, and count the open questions the Decisions view lists.
  - Test: `R-2921: Needs you counts asks as blocking, optional and parked, lists each blocking ask's title in file order, and counts the open questions the Decisions view lists`.
  - Fixture: HANDOFF asks in the order optional A, blocking B, parked C, blocking D. Open questions: `1. Open one.`, `2. (closed 2026-01-01) Done.`, `- (lane) Open bullet.`
  - Expect: the count line for 4 asks, 2 blocking, 1 optional, 1 parked and 2 open questions; item lines B then D only.
  - Red: optional or parked titles listed; blocking titles sorted by date or title; kinds summed into one number; the question count taken before the closed filter (3).
- **R-2922.** WHEN the product report renders the Overview, its Broken block shall count and name by ID the rows the Issues view lists as violated and as implemented rows that did not pass in the last measured run.
  - Test: `R-2922: Broken counts and names the violated rows and the implemented rows that did not pass, the same rows the Issues view lists`.
  - Fixture: one violated row; one implemented row citing a test file whose runtime label is FAIL (`writeRuntimeFile`); one untested row citing the same file.
  - Red: the not-passed line missing; a second rule that lists the untested row; IDs left out, count only.
- **R-2923.** WHEN the product report renders the Overview, its Gaps block shall name by ID each unparked listed deliverable of a live product capability that code does not both make and read, as the tree checker counts it, beside the parked deliverable count, and each live artifact entry with no declared reader and no accepted park, as the deliverable check's consumer join gives it, beside the parked entry count.
  - Test: `R-2923: Gaps names the unparked deliverables code does not make and read and the artifacts with no declared reader, each beside its parked count`.
  - Fixture: R-1 suite-made and code-read; R-2 manual, unparked; R-3 manual with a readable `Parked:` line; R-4 code-made and code-read with a `Parked:` line (R-2641, live). Entries: A-001 named by a `Reads:` line; A-002 with no reader; A-003 with an artifact park; A-004 read only by `Read by: A-004 · person: <reason>`.
  - Expect: deliverable gaps `R-2`, parked 1; artifact gaps `A-002`, parked 1.
  - Red: R-3 listed (marks used without parks); R-4 counted parked; A-004 listed (the page's own `Reads:` join used in place of `artifactConsumers`); A-003 listed or its parked count left out.
- **R-2924.** WHEN the product report renders the Overview, its Stale block shall count and link each feature whose assessment is out of date or unassessed, and name by ID, name and days each live artifact entry whose measured age is more than `STALE_AGE_DAYS` whole days before HEAD's commit time, beside the count of live entries whose age is not measured or unknown.
  - Test: `R-2924: Stale counts out-of-date and unassessed assessments, and artifacts older than the stale age before HEAD's commit time, beside the count with no measured age`.
  - Fixture: `commitAt` commits dated 2020: `a.txt` and `b.txt` at 2020-01-01, `b.txt` again at 2020-01-02, HEAD at 2020-02-01 (31 and 30 days). Entries: A-001 tracked `a.txt`; A-002 tracked `b.txt`; A-003 user-home store; A-004 tracked at a path not at HEAD. A store with one assessment stamped before a row change (out of date) and one feature with none.
  - Expect: stale `A-001 · <name> · 31 days` only; beside it 2 (A-003 not measured, A-004 unknown); assessments 1 out of date, 1 unassessed, both linked to `#FEAT-…`.
  - Red: `>=` in place of `>` (A-002 listed); days from `Date.now()` (A-002 listed, since 2020 is long past); unknown ages left out of the beside count; the beside count missing when it is the only nonzero number; unassessed left out; feature IDs not linked.
- **R-2925.** WHEN the ledger has deliverable lines, the Overview's What it does block shall show the tree checker's deliverable count line, then one line per live product capability in Product view order with `<m> of <n> made and read by code` over its unparked deliverables and `, <p> more parked` when any are parked, the lines adding up to the count line's numbers.
  - Test: `R-2925: What it does shows the checker's count line and one line per live product stage, in Product view order, whose counts add up to it`.
  - Fixture: product CAP-A with R-1 code-made and read and R-2 parked; product CAP-B with R-3 manual and R-4 parked but code-made and read (R-2641); a constraint capability; a retired product capability.
  - Expect: the first line equals the checker CLI's count line; then CAP-A `1 of 1 …, 1 more parked`, CAP-B `1 of 2 …`; no constraint or retired line; the three sums match.
  - Red: R-4 counted as parked from its `Parked:` line alone (sums differ); a constraint or retired line; document order in place of Product view order; the checker line missing; a stage line formatted apart from `deliverableCountText`.
- **R-2926.** IF an entry under REQUIREMENTS.md's `## Open questions` heading holds `CLOSED_QUESTION_MARK` in any letter case, THEN the product report shall leave it out of the Decisions view's open-question list and the overview's question count.
  - Test: `R-2926: an open question marked closed in parentheses leaves the Decisions list and the overview count, and one closed only in part stays`.
  - Fixture: `2. R-058 (closed by t1-gate): x.`, `4. (Closed 2026-10-02) y.`, `5. (closed: z) w.`, `6b. The form half closed 2026-10-04; the rest waits.`, `- (lane) Open bullet.`
  - Expect: the Decisions list holds 6b and the bullet in file order; the overview counts 2.
  - Red: a case-sensitive match (question 4 stays); a match on bare `closed` (6b leaves); a match only at the text's start (question 2 stays); the filter applied to the overview but not the Decisions view, or the reverse.
- **R-2794 (widened, one new test).** New clause: "… and a card whose list has no item shows its label followed by `none` and no list." Rest of the text, ID and title stay.
  - New test (`product-overview.test.mjs`): `R-2794: a capability card whose list has no item shows its label with none and no empty list`.
  - Fixture: a product capability whose only live feature homes its deliverable; a constraint capability with no active or frozen feature.
  - Red: today's label over an empty `ul`; the label dropped with nothing in its place.
- **R-1570 (narrowed).** "… shall list every numbered or bulleted entry … that R-2926 does not leave out, in file order …". Its test stays; it renders `#decisions` now.
- **R-2639 (reworded).** "… end that line with `, <n> more parked` counting parked rows." Its test's two literals (`requirements-tree.test.mjs:523`, `:532`) take the new suffix. Red: the old suffix.

## Expected existing-test changes (each named in the build report; no assertion loosened)

In `packages/nana-pack/tests/product-report.test.mjs`:

- `:346`: `decisions = render()` becomes `render("#decisions")` (R-1013, R-1018 and the markdown-span check use it).
- `:370`: `render("#shared")` becomes `render("#overview")`; the title's "shared" becomes "overview"; R-1015's evidence cell follows.
- `:374`: `render("#shared")` becomes `render("#overview")`.
- `:396-401`: R-1019's prototype-hash check expects the Overview heading; its title becomes "unknown prototype hashes render the Overview"; R-1019's evidence cell follows.
- `:1117`, `:1141`, `:1148`: `renderPageAt(html)` gains `"#decisions"` (R-1570, R-1571).
- `:1328`: the count literal takes `, 1 more parked` (R-2642's check).
- Helper definitions move to `report-fixtures.mjs` and are imported.

In `packages/nana-pack/tests/requirements-tree.test.mjs`: `:523` and `:532` (R-2639).

## Seal

`packages/nana-pack/tests/product-overview.test.mjs::seal: the overview's stale age is 30 days`, marked `req: R-2924`. It asserts `STALE_AGE_DAYS === 30`, as `packages/nana-pack/tests/review-movement.test.mjs:31-40` asserts its sealed values. No other new value is sealed.

## Tunables

| Name | Where | Value | Provenance |
|---|---|---|---|
| STALE_AGE_DAYS | `scripts/product-report.mjs`, after `SECONDS_PER_DAY` (`:64-65`) | `30` | chosen by the owner, 2026-10-25, page discussion question 3 (default 30); sealed (R-2924). |
| CLOSED_QUESTION_MARK | `scripts/product-report.mjs`, after `OPEN_QUESTIONS_ENTRY` (`:115-116`) | `"(closed"`, matched case-insensitively | contract (R-2926): the ledger's own closure note, as questions 2 to 5 and 9 write it at e4d29927. |
| Overview labels | `scripts/product-report.mjs`, beside the R-2542 marks (`:43-46`) | the block headings and line labels above | contract (R-2920 to R-2925). Messages, not tunables; tests import them. |

The count suffix is a message inside `deliverableCountText`, not a tunable.

## Seat wrong-code pairs

Each is a one-place edit in the built tree and must turn its rows red on macOS. None is Windows-only.

1. `views[""]` back to `"decisions"` → R-2920.
2. The `#shared` view entry and its branch restored → R-2920.
3. Nav lists Decisions before Overview → R-2920.
4. One overview label read from a module-scope constant inside `renderInto` → R-2920 (throws in the vm render), and every overview check.
5. Needs you lists every ask's title → R-2921.
6. Needs you counts `parseOpenQuestions` output before the closed filter → R-2921.
7. Broken drops the not-passed line → R-2922.
8. Gaps lists every row with a code mark, ignoring parks → R-2923.
9. Gaps uses the page's `readIds` and `referencesFor` join in place of `artifactConsumers` → R-2923.
10. The parked entry count dropped from Gaps → R-2923.
11. Stale compares with `>=` → R-2924.
12. Stale days computed from `Date.now()` → R-2924.
13. The beside count skips `age unknown` entries → R-2924.
14. Unassessed features left out of Stale → R-2924.
15. Stage parked count taken from the presence of a `Parked:` claim → R-2925.
16. A constraint capability gets a stage line → R-2925.
17. The closed match made case-sensitive → R-2926.
18. The closed match without the parenthesis → R-2926.
19. An empty list renders its label over an empty `ul` → R-2794 (new test).
20. The suffix back to `, <n> parked` → R-2639, and the R-2642 check at `product-report.test.mjs:1328`.
21. `STALE_AGE_DAYS` retuned to 31 → seal.

## Precedent (verified at main e4d29927)

- Views, landing and fallback: `scripts/product-report.mjs:358-359`; title map `:401`; nav `:404`; the Shared branch `:490`.
- Renderer helpers: `paragraph`, `textList`, `featureLink`, `renderSegments` at `:368-371`. A view built from model lines with segments: the Artifacts view, `:450-468`, from the model at `:839-896`; `featureSegment` at `:704`; `featureArtifactLines` at `:705-722`.
- The String() rule for the renderer: `:111-113` and `:494-495`.
- Contract label constants and their exports: `:43-62`.
- Asks: `splitOpenSection` and its `TAG` (`packages/nana-pack/lib/handoff-asks.mjs:11-28`); the report's ask parse `:622-628`.
- Open questions: `parseOpenQuestions` `:123-143`; the model field at `:905`.
- Broken rows: `violated` `:898`, `notPassed` `:901`.
- Assessment state: `:745`.
- Ages: `artifactAges` `:233-342`; `wholeDays` `:174`; `unknownAge` `:173`; formatters `:200-212`; the not-measured branch `:240-242`; the ages map in `buildReport` `:699`.
- Tunable form: `LAND_REPORT_SUBPATH` `:32-33`; `SECONDS_PER_DAY` `:64-65`.
- Empty list: renderer `:441-445`; model `:806-811`.
- Counts and consumers: `checkDeliverables` `scripts/deliverables.mjs:504-704`, its per-capability loop from `:532`, counters `:687-688`, return `:703`; `deliverableReport` `:707-734`, count line `:728`; `artifactConsumers` `:359-500`, park and coverage `:490-498`.
- Frontier meaning of blocking: R-2607, R-2609 (`REQUIREMENTS.md:267`, `:269`); `packages/nana-pack/tests/frontier-summary.test.mjs:129`; `packages/nana-pack/lib/frontier-check.mjs:88`.
- Tests: `treeFixture` `packages/nana-pack/tests/product-report.test.mjs:59-68`; `table` `:69`; `makeAssessment` `:74-82`; `writeStore` `:83-88`; `writeRuntimeFile` `:102-108`; `historyFixture` `:161-171` and `commitAt` `:172-185` for dated ages; `renderHtmlAt` `:218-237`; `renderPageAt` `:268-282`; R-2543's checker comparison `:1340-1366`; R-2794's fixture and check `:1478-1500`; R-1570 `:1097-1129`. The count literals: `requirements-tree.test.mjs:523`, `:532`, R-2639's check `:534`.
- Shared test-helper modules: `packages/nana-pack/tests/ledger-repo.mjs:1-12`, `land-fixtures.mjs:1-8`.
- Seal form: `packages/nana-pack/tests/review-movement.test.mjs:31-40`.
- Widening and narrowing bookkeeping: `docs/reviews/keep-movement-2026-10-25/must-meet.md` (R-2905 widened, R-2573 narrowed).
- Ledger rows: R-2639 `REQUIREMENTS.md:2286`; R-1012 `:2781`; R-1015 `:2796`; R-1019 `:2801`; R-1570 `:2816`; R-2543 `:2825`; R-2791 `:2836`; R-2794 `:2839`; R-2802 `:2843`; R-1014's lines `:2224-2227`.

Helper moves: the test helpers above, from `product-report.test.mjs` to the new `report-fixtures.mjs`, only those the new file uses. In product code, `deliverableCountText` is an in-module extraction in `scripts/deliverables.mjs`; nothing private moves between modules.

## Class and builder

Ordinary. The lane changes the page script, the deliverable check's count text and per-stage counts, tests, the ledger, README and one skill sentence. It changes no install, uninstall or doctor code, no Claude Code hook or pi extension, no gate policy, and no land or review tool. The land's page writer is `scripts/test-locked.mjs:192-198`, which this lane does not touch; nana-land does not import the page (grep at e4d29927).

- Reviewer: the roster's final reviewer only (`reviewer: claude-code opus`, through claude-review).
- Builder: `pi-worker --lane-size larger` (`largerBuilder: openai-codex gpt-6.1-sol high`), one session. Reason: the String() renderer rule, the one-parse requirement and the helper move are easy to get subtly wrong.
- Size: medium. About 150 product lines over two files, 300 to 350 new test lines over two new files, about 60 moved helper lines and 12 edited test lines, plus ledger, README and skill lines.
- The seat pushes the draft pull request at build 1 and reads both test files' Windows times before the review brief. It runs the wrong-code pairs before the final review.
- No local install check: nothing under `packages/nana-setup/` and no hook changes.
- Before the final review and the land, the seat runs `node "$HOME/nana-pi/scripts/requirements-moved.mjs" --root . --base main` and carries its output in both.

## Page effect (expected at today's data; inferred from the e4d29927 model, not run on the built tree)

- Needs you: 29 asks, 1 blocking, 26 optional, 2 parked; 21 open questions (26 less 5 closed). After the seat's HANDOFF note below: 28 asks, 0 blocking.
- Broken: violated 5 (R-433, R-435, R-436, R-445, R-446); did not pass 6 (R-1064, R-1058, R-1063, R-1330, R-1713, R-1340), from this clone's runtime data.
- Gaps: 0 deliverables, 21 parked; 0 artifacts with no declared reader, 2 parked.
- Stale: 34 assessments out of date, 1 unassessed; 6 artifacts older than 30 days (A-039, A-040, A-041, A-042, A-074, A-075, each 46 days); 47 of 80 entries with age not measured or unknown.
- What it does: the count line, then CAP-01 5 of 5 (1 more parked), CAP-02 4 of 4 (2), CAP-04 5 of 5 (1), CAP-05 2 of 2 (3), CAP-06 0 of 0 (5), CAP-07 5 of 5 (3), CAP-08 0 of 0 (6).
- CAP-01 and CAP-02 cards read "Features with no deliverable: none".
- The page's tab count goes from seven to seven (Shared out, Overview in); size changes by a few KB (inferred).

## Known limits (the seat writes them to FEAT-039's file before the final round)

- The overview has no line cap. Many blocking asks, gap IDs or stale entries lengthen it; the assessments line lists 34 IDs today.
- "Must decide" is the `blocking` tag. A decision that blocks no work has no mark of its own.
- Stale counts registry entries only; a plain-path artifact on a `Made by:` line is not counted.
- Ages count to HEAD's commit time, not today. A page built long after HEAD reads young; this keeps R-1012.
- 47 of 80 entries carry no measured age, so the stale count speaks for 33 entries. The beside count says so; it does not say which.
- The not-passed count is this clone's last measured run. Another clone's page differs.
- A question counts as closed only through `(closed`. Prose closure keeps it listed; an open question quoting `(closed` hides.
- With every open question closed, the Decisions view says none are recorded.
- Gaps lists parked items as counts only; the Product view still shows them in full.
- The Product view's repeats, the artifact cards and the flow lines stay until lane two.
- Other projects get the overview at once through the shared script, without a template tag.

## Notes the seat writes before the final round

- HANDOFF, Open for the owner: remove the blocking "The page discussion" ask (`HANDOFF.md:23`); the owner decided on 2026-10-25. The ask also named the artifact assessment's eleven questions. If any stays unanswered, one optional ask names them (inferred: the discussion answered the brief's five questions).
- HANDOFF, Next item 4 (`HANDOFF.md:16`) becomes: "**Product page readability (the owner, 2026-10-25).** He chose option two, in two lanes. The overview lane is on main. Lane two moves deliverable and artifact detail to feature pages and retires the flow lines. Known bugs and each platform's CI on the overview come later."
- HANDOFF, Next item 5 (`HANDOFF.md:17`): "The owner's discussion sets it" becomes "Page lane two comes next."
- HANDOFF, Landed: "2026-10-2x: the product page opens on a one-screen overview of asks, broken rows, gaps, stale items and each stage's deliverables."
- Then `nana-writing HANDOFF.md`.
- FEAT-039 known-bug file: remove the line "closed questions still list" (fixed here); add the known limits above.
- FEAT-028 known-bug file: one line saying earlier records quote the count line without "more".
- README (`README.md:271`): the page opens on the overview; its five blocks; the 30-day stale age counted to HEAD's commit time; closed questions left out; no Shared view. Skill (`packages/nana-pack/skills/requirements/SKILL.md:129`): one sentence on the overview. Both are builder work; the seat checks them.
- A session entry in `docs/sessions/`.
- `docs/requirements-tree.md` and `docs/code-map.md` regenerated, and again after any merge of main, with a confirmation round.
- After the land: check the land-written page's commit against main, then publish it to the owner's copy (seat work, `HANDOFF.md:17`).
