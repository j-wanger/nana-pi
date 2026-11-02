# Plan — precedent-line-parse

## Purpose

A fix that restores agreed behaviour: R-2579 and R-2580. pi-worker should refuse only a Precedent entry that names an untracked path, and start when every entry names a tracked one. Twice on 2026-11-02 pi-worker refused a brief with `Precedent entries at HEAD bf5ee134: "the" is not tracked at HEAD`. The bullet was "- the runner's declared Windows skip list in `packages/nana-pack/tests/test-runner.test.mjs` (case J)…". `normalizeEntry` (`packages/nana-pack/lib/brief-precedent.mjs`) takes the first whitespace token as the path. The seat's goal:
- a bullet's path is its first backticked span, so a bullet may start with prose;
- a bullet with no path, or whose path is untracked at HEAD, is refused with a message that quotes the bullet and states the rule: "each Precedent bullet names one tracked path in backticks";
- briefs whose bullets start with a backticked path behave exactly as now.

**Corpus survey** (`docs/reviews/**/*{brief,plan}*.md` on main bfde4ae2, read through `readBrief`): 358 files with a Precedent section, 1,761 bullets.
- 1,404 start with a backticked path.
- 219 start with a bare unbackticked path, such as "packages/nana-pack/bin/pi-worker.mjs — …" or "AGENTS.md — …".
- 105 start with prose and hold a backtick span.
- 31 hold no backtick and do not start with a path.
- 2 are `none:`.

The planner prompt (`packages/nana-pack/prompts/planner.md:32`) tells planners that "each entry starts with a tracked path", so bare first-token paths are a documented, accepted form.

## Design

1. Path selection in `normalizeEntry`, in this order:
   1. `none:` as now.
   2. If the bullet's first token is a backticked span, that span (today's behaviour).
   3. Else if the bullet holds any backticked span, its first backticked span.
   4. Else the first token (today's behaviour for bare paths).
   Trailing punctuation, `:line` suffixes, `./` and backslash handling apply to the chosen value as now.
2. Refusal message. Each refused entry is quoted in full as its bullet text, capped at a sealed length with an ellipsis, beside its chosen value. The message states the rule once: "each Precedent bullet names one tracked path, in backticks or as its first word". The existing "commit the file, or merge main if it landed there" remedy stays.
3. The planner prompt's sentence is widened to say the same rule in its own words; the R-2954 test is updated to match.

## Assumptions

- A1: Keeping step 1.4 (a bare first token) is a deliberate departure from the seat's literal wording ("a bullet with no backticked path is refused"). That wording would newly refuse 219 accepted historical bullets and the planner prompt's own documented form. **Question for the seat (default: keep bare first-token paths):** if the seat wants backticks mandatory, the brief drops step 1.4 and also edits the planner prompt to require backticks.
- A2: A bullet whose first backticked span is not a path (for example "`ENOTFILE`") is refused, quoted. It was refused before too, on its first prose word, so this changes no outcome, only the message.

## Open choices

None.

## Questions for the owner

None. The seat holds A1.

## Feature

Feature: FEAT-006 · Launch builders with execution limits

Lane class: `node scripts/lane-class.mjs --root . --files packages/nana-pack/lib/brief-precedent.mjs,packages/nana-pack/lib/brief-config.mjs,packages/nana-pack/tests/brief-check.test.mjs,REQUIREMENTS.md` prints `ordinary`, noting that the parser also reaches pi-review and claude-review. With `packages/nana-pack/prompts/planner.md` and `packages/nana-pack/tests/planner-prompt.test.mjs` added, the builder pastes the line again.

## Threat model

In scope: honest variation in how seats write Precedent bullets. That covers prose first, a bare path first, several backticked spans, line suffixes, Windows separators, bold markers, multi-line bullets and CRLF. Out: a brief that names a tracked path while relying on a different file. Review catches that, and it is a residual.

## Precedent

- `packages/nana-pack/lib/brief-precedent.mjs`: `normalizeEntry`, `entryText`, `checkPrecedent` and `checkBriefForLaunch`'s refusal.
- `packages/nana-pack/lib/brief-config.mjs`: `PRECEDENT_*` sealed values; a new message-cap value goes here.
- `packages/nana-pack/tests/brief-check.test.mjs` and `packages/nana-pack/tests/worker-lane.test.mjs`: the R-2578 to R-2580 checks and the brief-check parity checks.
- `packages/nana-pack/prompts/planner.md` (32) and `packages/nana-pack/tests/planner-prompt.test.mjs` (R-2954).

## Outside precedent

none: a parser for this repository's own brief format.

## Must-meet

Rows R-3716 to R-3719 (FEAT-006); R-2579's evidence is amended.

- M1 (R-3716): a prose-first bullet launches when its first backticked span is a tracked path. The seat's failing bullet, verbatim, passes the precedent check and the launch line counts it. The same with `**bold**` markers, a `:12-30` suffix, a trailing comma, and the span on a wrapped second line.
- M2 (R-3717): an untracked or non-path span is refused, quoting the bullet. Use a prose-first bullet whose first span is untracked, and one whose first span is `ENOTFILE`. Each refusal line quotes the bullet text, capped, states the rule sentence, and names HEAD's short sha. pi-worker starts nothing, and brief-check prints the same line.
- M3 (R-3718): today's forms are unchanged. A backticked-first bullet, a bare-path-first bullet (`AGENTS.md — …`, `packages/… — …`) and `none: <reason>` give the same parsed values as main's parser on a fixed corpus. That corpus is at least one real bullet of each kind, copied into the test as literal fixtures, not read from `docs/reviews`.
- M4 (R-3719): the planner prompt states the same rule, and the message cap is sealed.

Expected existing-test edits: R-2579's refusal-text assertions, if they pin the old message exactly, and R-2954's planner sentence.

Seat checks:
- `brief-check.test.mjs`, `worker-lane.test.mjs`, `planner-prompt.test.mjs` and `test-runner.test.mjs`;
- the map, readme, trace, tree and known-bugs checks, and the identity scan;
- `node packages/nana-pack/bin/brief-check.mjs` on this lane's own brief, and on a temp copy of the seat's failing bullet.

## Revision 2 (after `plan-attack.md`: 2 MUST, 3 SHOULD, all taken; seat confirmed "keep" on A1)

These changes override the sections above wherever they differ.

**Selection order, replaced (attack 1, 3).** For each bullet, after `none:`:
1. If the first token is a code span, that span.
2. Else, if the first token is path-shaped, that bare token, today's behaviour. Path-shaped means it contains `/`, or it is a single name with a file extension (`^[\w.-]+\.[A-Za-z0-9]+$`, for example `AGENTS.md`). A bare bullet keeps its own subject even when it later mentions another backticked file (`build-records-2026-10-22/build-brief-1.md:11-12`).
3. Else, the first token is prose: the first code span in the bullet.
4. Else, refuse.

A bare single word with no `/` and no extension (`scripts`, `docs`, `tracked`) is prose, not a path, so "- scripts and tests provide the precedent" now refuses (attack 3). This is the one intended new refusal. The seat's "no new refusals for the 219" holds: every one of the 219 starts with a token containing `/` or an extension. The builder re-runs the corpus survey on its build and records 0 changed outcomes for those 219 in `corpus.txt`. The R-2580 fixture that uses bare `tracked` (`worker-lane.test.mjs:198`) is updated to a backticked or slash form, as an expected edit.

**Code spans (attack 4).** A span is a CommonMark backtick run of length N closed by the same run length. Its content is trimmed by one leading and one trailing space when both are present. A span with inner spaces keeps them, and the path is then checked whole. A span holding `://` is invalid-path. Nested sub-bullets stay separate entries, each needing its own path, as today. R-2616's marker-kind boundary is unchanged.

**Refusal text (attack 2).** Each refused entry is shown as `"<chosen value>" in bullet "<original bullet text>"`.
- The original text is the bullet's lines joined with single spaces, before bold removal.
- The bullet text is capped at a sealed `PRECEDENT_QUOTE_CAP` of 160 UTF-16 code units, counting the trailing `…` inside the cap.
- The rule sentence appears once per refusal: "each Precedent bullet names one tracked path, in backticks or as its first word".
- The remedy stays.

**Consumers (attack 5).** Parsed Precedent paths also feed `known-bug-digest.mjs` (24-25) and `apps/bench/lib/anatomy-sessions.mjs` (135-136), which drives precedent pull classification. Selection changes only for prose-first bullets, which were refused before, so those consumers see a value they never saw. The builder runs both consumers' tests. `packages/nana-pack/README.md` (around 747) states the new rule.

**Must-meet, revised.** Rows R-3716 to R-3719 (FEAT-006), each worded as observable selection or refusal.

- M1 (R-3716), selection. Each case passes the precedent check, with exactly that entry counted:
  - the seat's failing bullet, verbatim;
  - prose with `**bold**`, a `:12-30` suffix and a trailing comma;
  - a span on a wrapped second line;
  - a double-backtick span;
  - a span with an inner space naming a tracked file;
  - prose with a tracked first span and an untracked second span (the first is chosen).
- M2 (R-3717), refusal. Each case refuses, and the line pins the quoted original text, the rule sentence and HEAD:
  - prose with an untracked first span;
  - prose with `ENOTFILE` first;
  - prose with an invalid first span and a tracked second span (no skipping ahead);
  - prose with no span;
  - a bare folder word (`scripts and tests …`);
  - a URL span;
  - a bold wrapped bullet over 160 chars, pinning the exact capped text with `…`.
  pi-worker starts nothing, and brief-check prints the same line.
- M3 (R-3718), compatibility. Literal fixtures from the corpus: a backticked-first bullet, `AGENTS.md — …`, a bare `packages/… — …` path, `none: <reason>`, and the two `build-records` bullets: a bare subject plus a backticked tracked destination, and a bare subject plus backticked `repoKeyOf`. Each parses to the same value as main's parser and gets the same accept or refuse outcome.
- M4 (R-3719): the planner prompt and pack README state the rule, and `PRECEDENT_QUOTE_CAP` is pinned once.

Seat checks add `known-bug-digest` and anatomy-sessions tests, wherever they live, and `corpus.txt`.

## Revision 3 (after build 1 blocked: `build-1-blocked.md`)

These changes override Revision 2 wherever they differ.

Build 1 found two conflicts with protected tests. The worker-lane fixtures track an extensionless file `seed` and launch bare `- seed` and `- **seed** — note` (R-2580, R-2581, R-2616 to R-2620). R-2579, R-2616 and R-2617 also assert the substring `"<entry>" is not tracked`. Real repositories hold extensionless files too (`Makefile`, `LICENSE`). So:

**Selection order, final.** After `none:`:
1. If the first token is a code span, that span.
2. Else, if the first token is not path-shaped (no `/` and no file extension) and the bullet holds a code span, the first code span. This is the seat's prose-first case: "the runner's … `packages/…`".
3. Else, the first token, which is today's behaviour exactly.

Consequences:
- `- seed` and `- **seed** — note` launch as today.
- A bare path-shaped subject keeps its subject even when a backticked file follows.
- The bare-folder prose hole ("- scripts and tests provide the precedent" passes) stays as today. It is recorded as one FEAT-006 known-bug line: "(precedent-line-parse, plan attack) a bullet whose first word is a tracked folder name and that holds no backticked path passes the Precedent check". It is no longer a must-meet. M2's bare-folder case is dropped.
- A bullet whose first word is an extensionless file name and which later holds a backticked path now selects that span. `corpus.txt` lists every such changed selection; the 219 must still show 0 changed outcomes.

**Refusal text, final.** Keep the existing substring and append the bullet: `"<chosen value>" is not tracked at HEAD (bullet: "<original bullet text>")`. The bullet text is capped at `PRECEDENT_QUOTE_CAP`, 160 UTF-16 units including `…`. The rule sentence is "each Precedent bullet names one tracked path, in backticks or as its first word", appended once per refusal before the remedy. Existing substring assertions stay true.

**Test edits.** Existing worker-lane and brief-check assertions should need no edit. If one checks exact equality of the whole refusal line, update it to the new line and list it. The R-2580 bare `tracked` fixture stays unchanged, since bare words still select as today.

## Build 3 compatibility correction and residual

A chosen code span contributes only its first whitespace-separated token, then the existing punctuation and line-suffix normalization applies. Bare-first path shape is decided after that same normalization. These corrections preserve main's accepted multiple-line-reference spans and bare suffixed subjects.

Residual: a path containing a space inside a code span is not supported. M1's inner-space fixture pins selection of the first token, not the whole span.
