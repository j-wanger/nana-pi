# brief-reader-fixes · must-meet (seat, 2026-10-22, after one adversary pass)

Feature: FEAT-006 · Launch builders with execution limits

Class: ordinary (two pack libs, one check command, their tests, the pack README; pi-worker's source is unchanged). Ladder: the seat's wrong-code pairs and one final reviewer from another model family. Builder: the small builder. Stakes: low-to-medium blast, reversible. Every lane launch and brief-check run passes through this reader. A wrong reading either refuses an honest brief (fails closed, names its reason) or leaves an entry unchecked. D1 is a deliberate loosening: a numbered step list after a bulleted plain-label list is read as Markdown renders it, a separate list.

Threat model: honest variation in the seat's own brief. A second label or a numbered step list straight after the Precedent list with no blank line; a bold label line; a path in bold, with backticks, or followed by a colon or several marks; a prose heading such as "Precedent audit" above the real section; nested sub-items under an entry; a relative brief path given to brief-check. Deliberate forgery is out (a brief built to hide a bad entry passes it unchecked; the reader proves a parse, not intent). Public repo: no owner name, nothing about the owner's work.

Source: the five final-review notes on precedent-first (LAND 61ac64f3). This lane fixes four and documents the fifth (brief-check's relative `--brief`), so none is carried as written.

The planner's draft (`plan-draft.md`) holds the measurements; the adversary's attack (`plan-attack.md`, M 3, S 8, N 8) changed the plan as the decisions below say.

## Precedent

Precedent:
- packages/nana-pack/lib/markdown-list-sections.mjs — the label match (:40) and amendment 1's label-only blank-line boundary (:49-56), the pattern for the new label-only marker-kind boundary; heading sections stay untouched.
- packages/nana-pack/lib/brief-precedent.mjs — `normalizeEntry` (:30-33: the backtick strip is the pattern for removing `**`; the one-mark strip becomes a run), the heading predicate (:43) and the no-section refusal (:78-79).
- packages/nana-pack/lib/review-findings.mjs — `BARE_MUST_BOLD_RE` (:18) and `isLabel` (:23): a whole line holding only a bold config word, built from the config value.
- packages/nana-pack/lib/frontier-config.mjs — `isNamed` (:26-32), reused unchanged.
- packages/nana-pack/lib/brief-config.mjs — `PRECEDENT_TRAILING_PUNCTUATION` (:16), retuned here.
- packages/nana-pack/bin/brief-check.mjs — its own `brief-check:` refusal for an unreadable worktree (:31-35), the pattern for the unreadable-brief refusal.
- packages/nana-pack/tests/worker-lane.test.mjs — `runBriefText` (:83-88), R-2580's case table (:183-219), R-2579's quoted-name match (:143-181) and the seal check (:250-255).
- packages/nana-pack/tests/brief-check.test.mjs — `writeBrief`, `runCheck` and the worker-equality loop (:52-89).
- packages/nana-pack/tests/frontier.test.mjs — R-878 (:100, :203-208) pins that heading sections keep their reading.
- packages/nana-pack/lib/mutation-runner.mjs — the shared pair runner; docs/reviews/precedent-first-2026-10-22/seat-mutate.mjs is the per-lane table shape.

## Seat decisions

- **D1 · A list of the other marker kind ends a plain-label list (note 1; adversary M1, S5).** In `scanListSections`, on the label path only: remember the first entry's marker kind (bullet `-*+`, or numbered `N.`/`N)`) and its indentation. A list item of the other kind whose indentation is at most the first entry's ends the section; a more indented item stays part of the list, as on main. A lazy unindented continuation line stays part of its entry. Heading sections and handoff-asks are unchanged (R-878 pins it). A change of bullet character (`-` to `*`) keeps the list whole, a deliberate departure from CommonMark that stays fail-closed.
- **D2 · A bold label line counts (note 2; adversary S4).** On the label path only, the accepted label lines are exactly `Precedent:`, `**Precedent:**` and `**Precedent**:`, built from `PRECEDENT_SECTION` as review-findings builds its bold words. `__…__` and bold headings are left out.
- **D3 · The inline form stays no section; the no-section refusal names the label form (note 2; adversary S2).** Only the no-section case (`precedent === null`) gets the new text: `Precedent section needs a Precedent heading, or a line holding only Precedent:, then one entry in either form: - <path> or - none: <reason>`, built from the config names. An empty section and a reasonless `none:` keep today's text. R-2578's substrings stay.
- **D4 · Entry spellings (note 3; adversary M2, S3, S6, N4).** In `normalizeEntry`: remove every `**` from the entry text before the `none:` check and the token split. Then remove backticks, strip a run of trailing marks from `PRECEDENT_TRAILING_PUNCTUATION`, strip the `:N` / `:N-M` suffix, turn `\` into `/` and drop `./`. Run the unsafe-path check (`..`, absolute, `~`) on the value both before and after the mark strip. A single `*` stays, so `*.mjs` is still refused by its own name. Markdown links are not read (0 of 388 tracked build briefs use one); a link entry is refused by its spelling.
- **D5 · A heading counts only when no word follows Precedent (note 4).** The heading predicate becomes `isNamed(title, PRECEDENT_SECTION)` with the rest of the title, after the name and spaces, empty or not starting with a letter or digit. `## Precedent`, `## Precedent (this lane's own)` and `## Precedent — the reader` count; `## Precedent audit` does not.
- **D6 · brief-check keeps the worktree as the base for a relative brief, and says so when it cannot read one (note 5; adversary M3).** The planner's change of base is dropped: pi-worker resolves a relative brief from the worktree root, so brief-check must too, or R-2585's match breaks for the seat's documented call from the main checkout. When brief-check cannot read its brief it exits 1 with one `brief-check:` line naming the absolute path it tried and that a relative `--brief` resolves from `--tree`, before the shared check runs.
- **D7 · Docs.** The pack README's lane-mode paragraph names the section's start forms (a Precedent heading with no word after the name, or a line holding only `Precedent:`, plain or bold) and where a plain label's list ends (a blank line, a heading, a non-list line, or a list of the other marker kind at the list's own indentation). The brief-check paragraph says a relative `--brief` resolves from `--tree`. The scanner header's `@inputs` names the bold label.

## Must-meet rows

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2616 | WHEN a list item of the other marker kind, indented no more than the first entry, follows a plain `Precedent:` label's list with no blank line between, pi-worker shall end the Precedent section before that item. | `packages/nana-pack/tests/worker-lane.test.mjs::R-2616: a numbered step list straight after a plain Precedent list is not read as entries` |
| R-2617 | WHEN a line holds only `**Precedent:**` or `**Precedent**:`, pi-worker shall read the list under it as the Precedent section. | `packages/nana-pack/tests/worker-lane.test.mjs::R-2617: a bold Precedent label line starts the Precedent section` |
| R-2618 | IF a lane brief holds no Precedent section, THEN pi-worker shall refuse it naming both ways to start one: a Precedent heading, or a line holding only `Precedent:`. | `packages/nana-pack/tests/worker-lane.test.mjs::R-2618: a brief with no Precedent section is told the label stands on a line of its own` |
| R-2619 | WHEN a Precedent entry writes its path in bold, or follows it with a colon or more than one trailing mark, pi-worker shall check the bare path. | `packages/nana-pack/tests/worker-lane.test.mjs::R-2619: bold and punctuated Precedent paths are checked as the bare path` |
| R-2620 | WHEN a heading's title is Precedent followed by a word, pi-worker shall not read that heading as the Precedent section. | `packages/nana-pack/tests/worker-lane.test.mjs::R-2620: a heading such as Precedent audit is not read as the Precedent section` |
| R-2621 | IF brief-check cannot read its brief, THEN it shall exit 1 naming the absolute path it tried and that a relative `--brief` resolves from `--tree`. | `packages/nana-pack/tests/brief-check.test.mjs::R-2621: brief-check names the brief path it tried and the base a relative brief resolves from` |

The retuned `PRECEDENT_TRAILING_PUNCTUATION` keeps its existing seal test, updated to the new value. R-2622 stays unused.

### What each test does, and why it is red on main

Every pi-worker case uses `runBriefText` and the existing fixture (tracked `seed`, `tracked/nested.mjs`). A pass is R-2580's assertion: exit 0, the spawn marker, and a stderr line starting `pi-worker: precedent: <N> checked at HEAD` before the attempt line. A refusal is exit 1, no spawn marker, and the quoted name followed by ` is not tracked`.

- **R-2616.** Pass (N 1): `Precedent:\n- seed\nSteps:\n1. Run the next step\n2. Update another thing\n`, and `Precedent:\n- seed\n1. Run the next step\n`. Pass (N 2): `Precedent:\n1. seed\n2. none: second entry\nThen:\n- Run the next step\n`. Guards that refuse naming `"missing.mjs"`: `Precedent:\n- seed — reuse the\nreader below\n* missing.mjs\n` (a lazy wrap and a change of bullet character keep the list); `Precedent:\n1. seed — reuse:\n   - the parser\n2. missing.mjs\n` and `Precedent:\n- seed — reuse:\n  1. the parser\n- missing.mjs\n` (nested items keep the list). Red on main: the pass cases refuse naming `"Run"`.
- **R-2617.** Pass (N 1 each): `**Precedent:**\n- seed\n` and `**Precedent**:\n- seed\n`. `**Precedent:**\n- missing.mjs\n` refuses naming `"missing.mjs"`. Red on main: no section.
- **R-2618.** `Precedent: seed — the inline form\n` and `Feature: FEAT-006 · Missing\n` each exit 1; each stderr holds `a Precedent heading`, `a line holding only Precedent:`, `- <path>` and `- none: <reason>`, with no spawn marker and no lock file. `## Precedent\n\n## Done\n` keeps today's text (no "Precedent heading" phrase). Guard: `Precedent: the rail is one source\n\n## Precedent\n- seed\n` passes (N 1). Red on main: the two phrases are absent.
- **R-2619.** Pass, N 1 each, under `Precedent:`: `- **seed** — note`, ``- **`tracked/nested.mjs`**:12,``, `- seed:93-100).`, `- seed: the reader`, ``- `seed`: the reader``, `- seed:12: note`, `- **none:** no earlier code exists`. Guards: `- *.mjs` still refuses naming `"*.mjs"`; `- [seed](seed)` refuses by its spelling; `- tracked/..` refuses. Red on main: every pass case refuses by its raw spelling.
- **R-2620.** `## Precedent audit\n- missing.mjs\n\n## Precedent\n- seed\n` passes (N 1). `## Precedent audit\n- seed\n` exits 1 with R-2618's no-section text. Guards: `## Precedent (this lane's own)\n- seed\n` and `## Precedent — the reader\n- seed\n` pass. Red on main: the first case refuses naming `"missing.mjs"`.
- **R-2621.** Run brief-check from the fixture temp folder with `--brief passing.md --tree <lane>`, where `<lane>/passing.md` does not exist and the temp folder holds a `passing.md`. Expect exit 1 and stderr holding `<real lane path>/passing.md` and `--tree`. R-2585's equality loop stays green. Red on main: the refusal names no path.

## Tunables

- `PRECEDENT_TRAILING_PUNCTUATION` (packages/nana-pack/lib/brief-config.mjs) retuned from `,;.)` to `,;.):` — measured: a colon follows 263 path-like list entries in 110 of 388 tracked build briefs, a comma 106 in 72 (adversary M2, 2026-10-22). Its seal check is updated to the new value. Stripping a run of marks, not one, is chosen (cheap; no measured double-mark case).

## Known limits (the seat writes them to the FEAT-006 known-bug file before the final round)

- Under a plain label, a bulleted list right after the list with no blank line is still read as entries (`Done:` then `- …`); a blank line ends the section.
- A plain label's list that switches from bullets to numbers at the top level drops the items after the switch unchecked.
- A nested sub-list item is read as an entry and refused by its first word, as on main.
- Under a Precedent heading, every list up to the next heading of its level is read as entries.
- `Precedent: <path>` on one line is not a section; `## Precedent:` (a colon heading) reads as no section too.
- Only `**` bold is read; `__` emphasis and a bold heading title are not, and a `**` inside a path name is removed.
- A Markdown link entry is refused by its spelling.
- A heading such as `Precedent (audit)` still counts, because only a following word excludes a heading.

## Seat steps

- Build with the small builder; the build brief carries a Precedent section and passes brief-check.
- Wrong-code pairs: the planner's (the label section keeps reading items of the other kind; ends at any unindented non-list line; the kind boundary also on heading sections; kind compared by character; only `**Precedent:**` read as bold; the inline form read as a section; one trailing mark stripped, not a run; bold stripped only as a whole-token pair; every `*` stripped; the heading predicate left as plain `isNamed`; a heading counted only when exactly Precedent) and the adversary's (the kind boundary ignores indentation; the colon not stripped; `**` removed after the `none:` check; brief-check refuses without the path; brief-check resolves the brief from its working folder). Re-run frontier and handoff-asks tests whole.
- Notes, before the final round: the known-bug lines above; the FEAT-006 note this lane does not fix (none) and the late-notes memory removed; the untracked-gap lines from the seat's 2026-10-22 re-check recorded as known bugs or HANDOFF queue lines; HANDOFF pruned toward the owner's 1,200-word budget (Landed lines moved to the session archive, done or gone live lines dropped under the drop rule, no open owner question dropped); the session entry.
- One final reviewer from another model family, on the exact tip that lands; CI on the draft PR, the Windows leg included.
