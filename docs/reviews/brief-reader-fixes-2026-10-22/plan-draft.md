# brief-reader-fixes: plan draft (planner, 2026-10-22, main 61ac64f3)

Feature: FEAT-006 · Launch builders with execution limits (checked: the precedent rows R-2578 to R-2585 sit there, REQUIREMENTS.md:446-452; docs/requirements-tree.md:55-59).

Class: ordinary. The lane changes two pack libs (`lib/brief-precedent.mjs`, `lib/markdown-list-sections.mjs`), one check command (`bin/brief-check.mjs`), two test files and the pack README. It touches no nana-setup install, uninstall or doctor code, no Claude Code hook, no pi extension, no gate policy, and none of nana-land, pi-review or review-round. pi-worker's source is unchanged; its behaviour changes only through the lib it imports, as in precedent-first, which was classed ordinary. Ladder: the seat's wrong-code pairs and one final reviewer from another model family. Builder: the small builder (`pi-worker --lane-size small`).

Stakes: low-to-medium blast, reversible. Every lane launch and every brief-check run passes through this reader. A wrong reading either refuses an honest brief (fails closed, names its reason, loses nothing) or leaves an entry unchecked (the builder still gets the brief text). Every change below is either a new honest form that now reads correctly, or a narrowing that refuses more.

Threat model: honest variation in the seat's own brief is in scope. The seat writes a second label (`Steps:`, `Then:`) straight after the Precedent list with no blank line. It writes the label in bold (`**Precedent:**`, `**Precedent**:`), or inline (`Precedent: <path>`). It writes an entry's path in bold, as a Markdown link, or as `path:93-100).` with two marks after the suffix. It writes a prose heading such as `## Precedent audit` above the real section. It runs brief-check from the main checkout with a brief path relative to that folder. Deliberate forgery is out. A brief built to hide a bad entry after a marker change, or under a prose heading, passes that entry unchecked; the reader proves a parse, not intent. Public repo: every text in this lane names no owner and nothing about the owner's work.

Source: the five final-review notes on precedent-first (LAND 61ac64f3), held outside the repo until a lane folds them. This lane fixes all five, so none is folded as a known bug; the residual limits below are new lines.

## Precedent (this lane's own, in the form the lane requires)

Precedent:
- packages/nana-pack/lib/markdown-list-sections.mjs:40 — the label match (`lines[index].trim() === label`); the bold form joins here, on the label path only.
- packages/nana-pack/lib/markdown-list-sections.mjs:49-56 — amendment 1's label-only blank-line boundary (:50) is the pattern for the new label-only marker-kind boundary; heading sections keep their branch untouched.
- packages/nana-pack/lib/brief-precedent.mjs:30-33 — `normalizeEntry`: the backtick `replaceAll` (:30) is the pattern for removing `**`; the one-mark strip (:31) becomes a run of marks; the suffix strip (:32) stays.
- packages/nana-pack/lib/brief-precedent.mjs:43 — the heading predicate; narrow it here and keep calling `isNamed`.
- packages/nana-pack/lib/frontier-config.mjs:26-32 — `isNamed`, shared with the frontier report and handoff-asks; reuse it unchanged, never edit it.
- packages/nana-pack/lib/brief-precedent.mjs:79 — the no-section refusal; extend its text with the label form, built from `PRECEDENT_SECTION` and `PRECEDENT_NONE`.
- packages/nana-pack/bin/brief-check.mjs:31 — `--tree` already resolves from the working folder; `--brief` (:36) follows the same call.
- packages/nana-pack/tests/worker-lane.test.mjs:83-88 — `runBriefText`; every new pi-worker case uses it.
- packages/nana-pack/tests/worker-lane.test.mjs:183-219 — R-2580's case table and its assertion (exit 0, spawn marker, launch-line count, line before the attempt line); R-2616, R-2617, R-2619 and R-2620 copy its shape.
- packages/nana-pack/tests/worker-lane.test.mjs:143-181 — R-2579's quoted-name match (`JSON.stringify(entry)` then ` is not tracked`); each refusal guard below matches that form.
- packages/nana-pack/tests/brief-check.test.mjs:52-89 — `writeBrief`, `runCheck`, `selectedLine` and the worker-equality loop; R-2621 reuses them with a different working folder.
- packages/nana-pack/tests/frontier.test.mjs:101 — R-878 over packages/nana-pack/tests/fixtures/frontier/legacy.md:15-17 (a bullet entry, then a `2.` entry, in one heading section); it pins that the marker-kind boundary must stay off heading sections.
- packages/nana-pack/tests/frontier.test.mjs:200-204 — R-878's tag on an unindented continuation line in a heading section; it pins lazy continuation there.
- packages/nana-pack/tests/handoff-asks.test.mjs:16-30 — handoff-asks' own entry pins; they stay green unedited.
- docs/reviews/precedent-first-2026-10-22/seat-mutate.mjs — the seat's pair runner to copy for this lane's pairs.

## Measurements (2026-10-22, this Mac, main 61ac64f3)

- Each of the five notes reproduces on main through the pure `readBrief` (node, temp HOME). `Steps:` then `1. Run` gives entries seed, Run, Update and refuses Run and Update. Both bold labels give no section. A bold path, `[seed](seed)`, `[the nested file](tracked/nested.mjs)` and `seed:93-100).` are refused by their raw spelling. `## Precedent audit` with `- missing.mjs` above `## Precedent` refuses missing.mjs. brief-check.mjs:36 resolves `--brief` from `--tree` (read, not run).
- In the 378 tracked build briefs, 657 lines directly after a list item are indented continuations. 37 are unindented non-list lines. I read all 37: each starts a new paragraph or a label (`Stage host:`, `From the repo root:`), none is a wrapped entry. 4 are labels; the list after 3 of them is numbered, after 1 bulleted.
- Label forms in those briefs: 71 plain `Word:` label lines, 5 bold ones, 6 `**Done:**`. In all tracked review records, the one inline `Precedent: <text>` line (docs/reviews/tree-2026-10-14/research-tree.md:105) is prose, not an entry.
- Both tracked `Precedent` headings carry a bracketed note: `## Precedent (this lane's own …)` in the precedent-first plan-draft.md:8 and must-meet.md:13.
- An in-memory copy of the design below, over the real `isNamed`, `trackedAtHead` and brief-config values, reads all 43 cases as planned. The 43 are R-2578's four, R-2579's one, R-2580's twenty text cases (its subfolder case tests the brief's location, not its text), and eighteen new cases. That copy used a `(`/`—` list for D5; D5's "no letter or digit" rule was then checked alone on seven titles, with the same result for every case here. Twelve of the fourteen wrong-code pairs were simulated there, and each turns a planned case red. Pair 3 is by reading the fixture, and pair 14 by reading brief-check.mjs. Nothing was run through pi-worker; only this plan's own Precedent section was checked with git, and it passes at HEAD (15 entries).

## Design

- **D1 · A numbered list ends a bulleted plain-label list, and the reverse (note 1).** In `scanListSections`, on the label path only: remember the first entry's marker kind (bullet `-*+`, or numbered `N.`/`N)`). A list item of the other kind ends the section. A lazy (unindented) continuation line stays part of its entry, as CommonMark reads it. So `Steps:` after the list joins the last entry's note, and the numbered steps after it are a new list, read as Markdown renders it. Heading sections are untouched, so handoff-asks is unchanged by construction (R-878 pins it).
- **D2 · A bold label line counts (note 2).** On the label path only, a trimmed line equal to the label after one wrapping `**…**` is removed (`**Precedent:**`, `**Precedent**:`) is a label line. `__…__` and bold heading titles are left out.
- **D3 · The inline form stays no section, and the refusal names the label form (note 2).** `Precedent: <text>` on one line is not a section; the measured inline line is prose, and reading it would make such prose above a real section win as the first section. The no-section refusal becomes: `Precedent section needs a Precedent heading, or a line holding only Precedent:, then one entry in either form: - <path> or - none: <reason>`. The text is built from the config names. R-2578's asserted substrings stay in it, and R-2585 stays equal because both commands share the text.
- **D4 · Entry spellings (note 3).** In `normalizeEntry`: remove every `**` from the entry text before the none check and the token split, as backticks are removed today. If the text starts with a Markdown link `[text](target)` (no spaces in the target), the target is the path; otherwise the first token is, as today. Then remove backticks, strip a run of trailing marks from `PRECEDENT_TRAILING_PUNCTUATION` (was one), strip the `:N` / `:N-M` suffix, then turn `\` into `/` and drop `./`, as today. A single `*` stays, so `*.mjs` is still refused by its own name (R-2579).
- **D5 · A heading counts only when no word follows Precedent (note 4).** The predicate at brief-precedent.mjs:43 becomes `isNamed(title, PRECEDENT_SECTION)` and the rest of the title, after the name and spaces, is empty or does not start with a letter or digit. `## Precedent`, `## Precedent (this lane's own)` and `## Precedent — the reader` count. `## Precedent audit` does not, so the reader reaches the real section below it. A brief whose only section was `## Precedent files` is now refused with D3's text. That is the fail-closed direction.
- **D6 · brief-check reads a relative brief from its working folder (note 5).** brief-check.mjs:36 becomes `path.resolve(values.get("--brief"))`, the same base `--tree` uses at :31. That is also pi-worker's base: its cwd must be the worktree root (pi-worker.mjs:93-96). Run from the worktree root, brief-check reads the same file as before.
- **D7 · Docs.** In the pack README's lane-mode paragraph (README.md:295), one sentence names the section's start forms: a Precedent heading with no word after the name, or a line holding only `Precedent:`, plain or bold. A plain label's list ends at a blank line, a heading, a non-list line, or a list of the other marker kind. An entry may be bold or a Markdown link (its target is checked). In the brief-check paragraph (README.md:303), one sentence says a relative `--brief` or `--tree` resolves from the working folder. The markdown-list-sections header's `@inputs` changes from "an optional exact label" to "an optional label, plain or bold". No AGENTS.md or template change.
- **D8 · Left out.** Ending a label list at any unindented line (see the first open question). Accepting the inline form. Naming the attempted path in brief-check's unreadable-brief refusal. Stripping underscore emphasis (underscores are legal in paths, as in `templates/_shared/`). A link's `#L12` fragment.

## Must-meet rows (EARS, one shall each) and tests

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2616 | WHEN a list of the other marker kind (numbered after bulleted, or bulleted after numbered) follows a plain `Precedent:` label's list with no blank line between, pi-worker shall end the Precedent section before that list. | `packages/nana-pack/tests/worker-lane.test.mjs::R-2616: a numbered step list straight after a plain Precedent list is not read as entries` |
| R-2617 | WHEN a line holds only a bold Precedent label, `**Precedent:**` or `**Precedent**:`, pi-worker shall read the list under it as the Precedent section. | `packages/nana-pack/tests/worker-lane.test.mjs::R-2617: a bold Precedent label line starts the Precedent section` |
| R-2618 | IF a lane brief holds no Precedent section, THEN pi-worker shall refuse it naming both ways to start one: a Precedent heading, or a line holding only `Precedent:`. | `packages/nana-pack/tests/worker-lane.test.mjs::R-2618: a brief with no Precedent section is told the label stands on a line of its own` |
| R-2619 | WHEN a Precedent entry writes its path in bold, as a Markdown link, or with a line suffix followed by more than one trailing mark, pi-worker shall check the bare path, taking a link's target. | `packages/nana-pack/tests/worker-lane.test.mjs::R-2619: bold, linked and doubly punctuated Precedent paths are checked as the bare path` |
| R-2620 | WHEN a heading's title is Precedent followed by a word, pi-worker shall not read that heading as the Precedent section. | `packages/nana-pack/tests/worker-lane.test.mjs::R-2620: a heading such as Precedent audit is not read as the Precedent section` |
| R-2621 | WHEN brief-check gets a relative `--brief`, it shall read the brief from its working folder. | `packages/nana-pack/tests/brief-check.test.mjs::R-2621: brief-check reads a relative brief from its working folder, not from the worktree` |

R-2622 stays unused. No seal test: the lane adds no tunable.

### What each test does, and why it is red on main

Every pi-worker case uses `runBriefText` and the existing fixture (tracked `seed`, `tracked/nested.mjs`). A pass is R-2580's assertion: exit 0, the spawn marker, and a stderr line starting `pi-worker: precedent: <N> checked at HEAD` before the attempt line. A refusal is exit 1, no spawn marker, and the quoted name followed by ` is not tracked`, as R-2579 matches it.

- **R-2616.** Pass `Precedent:\n- seed\nSteps:\n1. Run the next step\n2. Update another thing\n` (N 1) and `Precedent:\n1. seed\n2. none: second entry\nThen:\n- Run the next step\n` (N 2). Fail-closed guard: `Precedent:\n- seed — reuse the\nreader below\n* missing.mjs\n` refuses naming `"missing.mjs"`, because a lazy wrap and a change of bullet character both keep the list whole. Red on main: both pass cases refuse, naming `"Run"`.
- **R-2617.** Pass `**Precedent:**\n- seed\n` and `**Precedent**:\n- seed\n` (N 1 each). `**Precedent:**\n- missing.mjs\n` refuses naming `"missing.mjs"`. Red on main: no section, so all three give the no-section refusal.
- **R-2618.** `Precedent: seed — the inline form\n` and `Feature: FEAT-006 · Missing\n` each exit 1. Each stderr holds `a Precedent heading`, `a line holding only Precedent:`, `- <path>` and `- none: <reason>`, with no spawn marker and no lock file. These are literals, as R-2578's are. Guard: `Precedent: the rail is one source\n\n## Precedent\n- seed\n` passes (N 1), so inline prose above a real section is not a section. Red on main: the two phrases are absent.
- **R-2619.** Pass, N 1 each: `- **seed** — note`, ``- **`tracked/nested.mjs`**:12,``, `- [seed](seed) — note`, `- [the nested file](tracked/nested.mjs)`, `- seed:93-100).`, each under `Precedent:`. `- [seed](missing.mjs)` refuses naming `"missing.mjs"`, so the target is checked, not the text. Red on main: every pass case refuses by its raw spelling (measured).
- **R-2620.** `## Precedent audit\n- missing.mjs\n\n## Precedent\n- seed\n` passes (N 1). `## Precedent audit\n- seed\n` exits 1 with R-2618's no-section text. Guards: `## Precedent (this lane's own)\n- seed\n` and `## Precedent — the reader\n- seed\n` pass (N 1). Red on main: the first case refuses naming `"missing.mjs"`, and the second passes.
- **R-2621.** After R-2585's loop, run brief-check with cwd set to the fixture temp folder and `--brief passing.md --tree <lane>`. First assert `<lane>/passing.md` does not exist. Expect exit 0 and a selected line equal to pi-worker's line for the same brief from R-2585's "passing with known bugs" case. Red on main: brief-check reads `<lane>/passing.md` and prints `pi-worker: lane refused: cannot read Precedent section from brief`, exit 1.

Existing tests made false: none expected. In simulation, R-2578's four cases, R-2579's case and R-2580's twenty text cases all read the same. D3 keeps every substring R-2578 asserts, and R-2585 compares two commands that share the text. handoff-asks, frontier and product-report never pass a label, so D1 and D2 cannot reach them.

## Tunables

None new. `PRECEDENT_TRAILING_PUNCTUATION` keeps its sealed value `,;.)`; only its use changes, from one mark to a run. Its provenance (77 of 378 briefs put one of these marks after a path) still holds. Markdown grammar (list markers, the link shape, the bold wrapper, "a letter or digit") is syntax, like `LIST_PREFIX`, not a tunable.

## Wrong-code pairs (each must turn a named test red)

Pairs 1, 2 and 4 to 13 were simulated in memory against the planned cases. Pair 3 is by reading the fixture, and pair 14 is by reading brief-check.mjs.

1. The label section keeps reading items of the other marker kind (main's scan): R-2616's two pass cases.
2. The label section ends at any unindented non-list line, so a lazy wrap ends it: R-2616's guard.
3. The marker-kind boundary also applies to heading sections: frontier.test.mjs R-878 at :101 (legacy.md's `2.` entry is dropped, so one open-tag, not two).
4. The marker kind is compared by character (`-` against `*`) instead of bullet against numbered: R-2616's guard.
5. Only `**Precedent:**` is read as bold, not `**Precedent**:`: R-2617's second case.
6. The inline `Precedent: <text>` is read as a one-entry section: R-2618's inline case and its prose guard.
7. One trailing mark is stripped, not a run: R-2619's `seed:93-100).` case.
8. Bold is stripped only as a whole-token `**…**` pair: R-2619's ``**`tracked/nested.mjs`**:12,`` case.
9. The link text is taken instead of its target: R-2619's spaced-text case and its `[seed](missing.mjs)` refusal.
10. The link is parsed from the first whitespace token, so link text with spaces breaks it: R-2619's spaced-text case.
11. Every `*` is stripped, not only `**`: R-2579 (the glob is named `".mjs"`, not `"*.mjs"`).
12. The heading predicate stays plain `isNamed`: R-2620's audit cases.
13. A heading counts only when its title is exactly Precedent: R-2620's bracket and dash guards.
14. brief-check resolves `--brief` from `--tree` (main): R-2621.

## Known limits (the seat writes them to docs/known-bugs/FEAT-006.md before the final round)

- Precedent check (brief-reader-fixes, plan): under a plain label, a bulleted list right after the list with no blank line is still read as entries. An example is `Done:` then `- …`. Markdown renders it as one list. The refusal names that line as not tracked. A blank line ends the section.
- Precedent check (brief-reader-fixes, plan): a plain label's list that switches from bullets to numbers drops the items after the switch unchecked. Markdown renders them as a separate list.
- Precedent check (brief-reader-fixes, plan): under a Precedent heading, every list up to the next heading of its level is read as entries. A second label inside that section does not end it.
- Precedent check (brief-reader-fixes, plan): `Precedent: <path>` on one line is not a section. The refusal says the label stands on its own line.
- Precedent check (brief-reader-fixes, plan): only `**` bold is read, on the label line and in entries. `__` emphasis and a bold heading title are not. A `**` inside a path name is removed.
- Precedent check (brief-reader-fixes, plan): a link target is checked as a path from the worktree root. A target relative to the brief's folder, a URL, a `#L12` fragment, a link title or an angle-bracket target is refused by name.
- Precedent check (brief-reader-fixes, plan): a heading such as `Precedent (audit)` still counts, because only a following word excludes a heading.
- brief-check (brief-reader-fixes, plan): its refusal for an unreadable brief does not name the path it tried.

## Seat steps

- Build with the small builder. The build brief carries the Feature line and a Precedent section in the new form, and runs `brief-check` on itself from the main checkout with a relative `--brief`.
- After the build: run the fourteen pairs with a copy of the precedent-first pair runner, and re-run `node packages/nana-pack/tests/frontier.test.mjs` and `node packages/nana-pack/tests/handoff-asks.test.mjs` whole.
- The builder regenerates the requirements tree (`npm run req:tree -- --write`) for the six new rows, and runs `npm run map` if a module header changes.
- Before the final review: the FEAT-006 known-bug lines above, the HANDOFF line and the session entry go in the lane's change. The seat deletes the late-notes memory file and its MEMORY.md line, because this lane fixes all five notes. The seat runs `node "$HOME/nana-pi/scripts/requirements-moved.mjs" --root . --base main` and carries its output in the review brief and the land.
- One final reviewer from another model family, on the exact tip that lands. CI on the draft PR, the Windows leg included (both test files run there).
- Cross-lane (inferred): a lane building now that edits worker-lane.test.mjs or the pack README merges main if it lands second.

## Open questions (each with a one-word default)

- Should a plain-label list also end at any unindented non-list line? That would also fix `Done:` then bullets, but it would drop entries after an unindented wrapped line (0 of 37 measured). Default: **no**.
- Should the inline `Precedent: <path>` be read as a one-entry section? Default: **no**. The one measured inline line is prose, and reading it would win over a real section below.
- Should brief-check keep `--tree` as the base for a relative `--brief` and only document it, instead of D6? Default: **no**.
- Should brief-check name the attempted path when the brief is unreadable? Default: **later**.
