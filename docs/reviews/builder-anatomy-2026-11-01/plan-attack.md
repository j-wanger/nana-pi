# Plan attack: builder-anatomy (2026-11-01)

Adversary for lane `builder-anatomy`. Read the plan, the named precedent modules, the build-record ledger's
field names, and pi session files under `~/.pi/agent/sessions`. Session reads were structural only: keys,
section names, lengths and counts. No session text appears here.

Measured for this note (2026-10-31, this machine, every count from a throwaway scan in the scratchpad):

- 778 sessions whose `session_info.name` starts `pi-worker`; 596 of them have a cwd under `nana-pi-wt/`. The plan
  says 570 and 486. Its denominators are stale, or it applies a filter it does not state.
- Every worker session name has the shape `pi-worker-<word><digits>-<digits>`. The lane name is never in it.
- System message: `content` is the empty string. Text lives in `sections`, an object whose key order is the stored
  order. A separate `toolsAdded` field holds about 4.5k chars of tool schemas per session (3.48M chars over 778).
- Section orders: 359 have no `nana-rulings`, 345 have it, 72 have no `nana-objective`/`nana-writing`, and 1 has no
  `addendum`.
- Builder tool calls: bash 24,934, read 14,421, edit 14,417, grep 6,346, find 1,348, write 1,556.
- Bash first words: node 7,656, npm 5,150, git 4,932, bash 1,597, pnpm 1,506, cd 656 … grep 95, tail 68. The A7
  reader list (`cat sed head tail grep rg`) is under 1% of bash calls.
- Other pushed context: 280 sessions carry `custom_message` entries of type `nana-knowledge` (display true). 84
  `context_edit` entries carry a `replacement`. 25 sessions hold a `compaction`.
- Brief match: matching the cwd lane to `docs/reviews/<lane>[-date]` and then a verbatim brief against today's
  files on main gives 387 one-match, 20 no-match and 189 no-review-folder, out of 596. That is 65%, under the
  plan's 90% gate.
- In one current session, `skills` splits into 2 paragraphs: one of 20,051 chars, 158 XML tags, 0 list items.
  `project_context` has a 5,765-char paragraph. Together they are about 45% of that session's 58k chars.
- Build-record `end` lines carry `attempts` and `sessions` (a list). `start` lines carry `sessionDir`, the worktree's
  session folder, not one session file. There are 152 starts, all since 2026-10-22.

---

## MUST

### M1. A7's reader rule misses most of what builders fetch, so T6 and "pulled vs pushed" are wrong

pi builders fetch through dedicated `grep` (6,346 calls) and `find` (1,348) tools, besides `read`. A7 counts
only `read`, plus bash commands whose first word is a reader. Bash readers are almost all wrapped: `cd … && sed`,
`bash -lc '…'` (1,597), `git show/diff/log` (most of 4,932 git calls), and `node -e` reading files. The plan calls
compound commands a residual. They are not a residual. They are the bulk of bash reads.

Failing case: a build that greps the tree 40 times and runs `git show main:file` 10 times reports near-zero pulled
chars. T6 still passes, because its fixture has "one read per class" on the `read` tool and one bare piped `cat`.

Fix:
- Count the `grep`, `find` and `ls` tools as reads, each with its own class.
- Classify bash by every segment of `&&`, `;`, `|` and `bash -lc` bodies, not by the first word. Add `git show`,
  `git diff`, `git log -p`, `nl` and `awk` to the configured reader list.
- Report an `unclassified-bash` bucket: its calls and result chars. Then the miss is a measured share, not a hidden
  one.
- Pin in T6: a `grep` tool call, a `cd X && sed -n …` call and a `bash -lc 'cat …'` call each count once.

### M2. Giant units make the char shares a property of the part rules, not of labelling

A3 cuts units at blank lines and list items. Real `skills` is one XML paragraph of about 20k chars with no list
items. `project_context` has a 5.7k-char paragraph (the AGENTS.md table and XML wrappers). One part-rule decision
("skills → tools") then sets roughly a third of every build's chars. The κ sample (150 units, uniform by unit)
almost never draws those units, so the gate cannot see the decision that dominates the shares.

Failing case: rules label `skills` as `tools` and the AGENTS table as `knowledge`. Labellers agree at κ 0.7 on 150
mostly short units. The report then says "tools 35%, knowledge 25%" off two labels nobody measured.

Fix:
- Split XML-structured text at element boundaries (`<skill>…</skill>`, the `<available_skills>` children) and
  Markdown tables at rows. Configure this per part.
- Report the unit-size distribution per part, at least max and p90 chars.
- Sample stratified by char weight (probability proportional to chars), or stratify by part and rule tier
  (part / heading / keyword). Report κ per tier and a char-weighted agreement next to Cohen's κ. Shares are by chars,
  so agreement has to be by chars as well.
- Pin in T2: an XML block of N elements gives N units.

### M3. `anatomy assemble` writes the full private text and T4 does not guard it

T4 refuses a checkout or symlink `--out` only for `segment` and `sample`. `assemble` writes the whole context:
the objective, the skills listing and the brief. `--stage` also writes a staged file. Slice 2 will point that output
at a replay checkout, which is a git repo, by design.

Failing case: `anatomy assemble --out ~/nana-pi-wt/x/ctx` writes the objective into a worktree, and a later
`git add -A` commits it.

Fix: put `assemble` under the same `privateFolder({ refuseCheckout: true })` guard, and add it to T4's pin. If
slice 2 needs the text inside a replay repo, it should pass the text as a pi `--append-system-prompt` file from a
private folder, never write it into the clone.

### M4. Brief matching against today's files fails the plan's own 90% gate, and O4's name fallback cannot work

- The session name never holds the lane. It is `pi-worker-<word><digits>-<pid>`, all 596. O4's fallback
  "session name `pi-worker-<lane>-<pid>`" matches nothing.
- Lane-folder lookup by worktree name misses 189 of 596, because review folders are named differently. A verbatim
  match against today's brief on main gives 387 of 596, which is 65%. Step 1 of the seat measurement will fail and
  stall the lane.
- A4 says "a brief on disk is the text that was sent". It is not true after a seat edits a brief in a later commit.

Fix:
- Take the lane from the session `cwd` (`nana-pi-wt/<lane>`).
- For builds since 2026-10-22, take the brief from the build record and read it with `git show <start tip>:<brief>`.
  Map the session through the `end` record's `sessions` list, not the `start` record's `sessionDir`, which is a
  folder shared by every build in that worktree.
- For older builds, search every brief file under `docs/reviews/`, plus each brief's git history blobs
  (`git log --format=%H -- <brief>`), for a verbatim match inside the addendum. Do not limit the search to a
  same-named folder.
- Pin in T1: a brief edited after its build still matches through its committed blob, and a lane whose review
  folder name differs from its worktree still matches.

### M5. Seat-measurement step 4 picks slice-2 targets from signals the data cannot carry

- "A large share that builders never pull": T6 classes pulls by target path (Precedent path, review folder, …),
  never by function. "Never pulls function X" has no definition.
- "No visible tie to outcomes": most chars sit in parts that are constant within a period. Those are the builder
  preamble, AGENTS.md, skills, rulings and writing. Their share varies only with time, and time also moves the
  model, the rules and the lane mix. Any outcome tie is confounded. The one thing that varies per build is the
  brief, and build-2+ briefs carry `feedback` because an earlier build failed. That is reverse causation: feedback
  "ties" to more builds.
- "A function nothing supplies": keyword rules over about 50k chars will hit every function somewhere, so the
  overall zero-supply line will be empty almost always.

Failing case: the seat names `tools` as the drop candidate (large, constant, no outcome tie) and `feedback` as
harmful. Neither reading is supported.

Fix:
- Declare in config a target-class → function map for pulls (Precedent path → precedent, known-bug file → lessons,
  test file → output contract, …). Report pulled chars per function next to pushed chars per function.
- Report supply per build (the share of builds where a function has 0 chars, split by build 1 versus build 2+), not
  only overall.
- State in the plan that outcome ties are read only for brief-borne functions and only within build number. Constant
  parts get no outcome claim. Step 4 then picks by pull frequency, supply gaps and size, and says so.

---

## SHOULD

### S1. Pushed context outside the system message is invisible

The plan treats the system `sections` as everything pushed. Real worker sessions also carry:
- `toolsAdded`, about 4.5k chars of tool schemas per session. That is more than the `tools` section itself
  (460 chars), so `tools` is undercounted.
- the `-p` instruction user message;
- `nana-knowledge` custom messages in 280 sessions;
- `context_edit` replacements (84) and compactions (25), which change what the model saw mid-run.

Fix: record `toolsAdded` and the first user message as parts. Count knowledge messages as a `knowledge-pull` part
with chars. Flag sessions with a context edit or a compaction (reason, counted). Pin `toolsAdded` in T1.

### S2. The agreement gate can be gamed by who labels and what they see

- The seat wrote the definitions, the plan and, through briefs, the rule phrases. Its labels are not independent of
  the rules. A Claude Code subagent on the seat's model family is a correlated second labeller.
- The sheet must not show part name, heading or rule label. The part name alone (`skills`, `nana-rulings`) gives
  away the part-rule label.
- "Consensus" is undefined when the two labellers disagree.
- Cohen's κ on 11 classes with a skewed prevalence can sit above 0.6 while minority functions (`feedback`,
  `lessons`, `precedent`) have near-zero agreement.

Fix:
- Use a different lineage for the second labeller (the roster's pi reviewer model through `catch-judge`, or a gpt
  subagent).
- Strip part, heading and rule from the sheet. Show the unit, plus at most its parent heading as a separate,
  optional column.
- Define consensus as the units both labellers agree on, and report that count.
- Gate on the per-function κ (or F1) for each function with at least 10 sampled units, not only the overall κ.
  Oversample rare functions.

### S3. Byte-exact rebuild can pass while units are mis-attributed

T1 and T5 pin "join parts = section" and "assemble with no option = stored section". Both pass if the store keeps
the raw part and the unit offsets are wrong, overlap or skip text. Headings are "not a unit", so their chars, the
separators and the fences are in no share. `--drop` on every unit under a heading leaves an orphan heading.

Fix:
- Store each part as an ordered list of spans, each a unit or `glue` (heading, separator), and pin that the spans
  tile the part exactly: contiguous, no overlap, joined equal to the part.
- Report `glue` chars as a share.
- Pin that `--drop` removes a heading whose units are all dropped, or say in config that it keeps it.
- Pin that assembly runs from spans, not from the stored raw part (for example, a test that alters one span and
  expects the assembled text to change).

### S4. Slice 2's replay leaks the hidden tests and grades the original builder's API

- "A local clone at the start tip" copies every object and ref by default. The builder can run `git log --all` or
  `git show <landed tip>:apps/…test.mjs`. The original worktree `~/nana-pi-wt/<lane>` and `~/nana-pi` are readable
  on disk too. T6's own "outside the repo" class shows that builders read outside the repo.
- The "hidden" tests were written by the original builder, per the builder preamble. They import its module paths
  and export names. A replay that picks other names fails the import, which the plan scores as a grader error, so
  most replays become unscorable rather than measured.

Fix:
- Build the fixture as a fresh one-commit repo from `git archive <start tip>` (the bench need already lists this).
  Do not clone. Run the builder in a sandbox or temp HOME that cannot read `~/nana-pi*` or `~/.pi/agent/sessions`.
- Pick replay lanes whose brief fixes the module paths and exports the tests import, or grade through the CLI. Report
  the grader-error rate per arm as a first-class number.
- Write these into the slice-2 notes now, so slice 1's store keeps the start tip and brief blob it needs.

### S5. The replay lane pick is survivor- and difficulty-biased

"Six ordinary lanes landed since 10-17, three after one build, three after three or more" selects only landed
lanes. Build count also tracks brief quality and seat edits between builds, not context. It also excludes hook and
gate lanes, where the plan itself says rulings and lessons matter most.

Fix: draw from all first builds with a build record (landed or not), stratified by build count, with a seeded
draw that slice 2 prints. Name the hook and gate exclusion as a residual in the pre-registration.

### S6. Build and session are not one-to-one

`end` records carry `attempts` and a `sessions` list. A watchdog retry makes two sessions for one build. T8's "one
row per build" built from sessions double-counts. T8's "total tokens" is also undefined: summing per-turn
`totalTokens` counts the cached context again on every turn.

Fix: group sessions by build through the `end` record. Define tokens through `collectBuildUsage` or
`pi-usage.totalTokens` (import, do not copy). Pin a two-attempt build as one row.

### S7. T4's sentinel does not reach every leak path

The sentinel sits "in every fixture part". The report also prints duplicates, and could print heading-level shares
or `unsorted` reasons. A reason string or a heading would carry text. `sample` and `agree` print too.

Fix:
- Put sentinels in headings, in a duplicated unit and in a unit that ends `unsorted`.
- Assert their absence from the stdout and stderr of `segment`, `sample`, `agree`, `assemble` and `report`.
- Duplicates print as `dup-<n>` with count and parts only.

---

## NOTE

- N1. The plan's counts (570 / 486 / 253 / 181 / 52) do not match what is on this machine today (778 / 596). Let the
  tool print the denominators. Do not quote them in rows or gates.
- N2. "A char … as in FEAT-041": FEAT-041 exists only on unlanded `feat/context-anatomy`. If that lane lands
  second, the FEAT-042 numbering and the reference both break. Define the char here.
- N3. T2's "a fixture reaches each of the ten functions" is written by the same builder who writes the rules, so it
  confirms the implementation. Have the seat put 10 to 20 hand-labelled fixture units, one or more per function, in
  the brief, written from the definitions table before the rules exist.
- N4. Inline tunables to name in config: the session-name prefix `pi-worker`, the known-bug header pattern, the
  reader list and the git/bash read verbs, the target-class map, the share rounding, the pointer line, the default
  `--n`, the normalization steps, and the per-part unit splitters (M2).
- N5. Precedent the builder will hit:
  - `apps/bench/lib/catch-judge.mjs:165` has a nested `norm` (whitespace collapse) that A6 normalization will
    duplicate.
  - `catch-stats.mjs:32` has the seeded hash inside `seededSample`. Import it, never re-derive it.
  - `claude-transcript.mjs` `transcriptFiles` filters out `-wt-` and `-private-tmp-` folders by default, which would
    drop every builder session. Pass a selector, or walk the folders directly.
  - `entriesIn` reads whole files, which is fine at these sizes.
  - If the bench needs a pi-session reader that the desk also has, its second caller should import it rather than
    write a third.
- N6. `privateFolder` without `allowAncestorSymlinks` rejects any ancestor symlink. On macOS `os.tmpdir()` sits
  under `/var` → `/private/var`, so the plan's "fixtures in OS temp" will refuse themselves. Use the maker mode
  (`allowAncestorSymlinks: true, refuseCheckout: true`) as `memory-shaping` does, and pin that the final-component
  symlink is still refused.
- N7. A8's verdict is the report's first line. Check that worker sessions end with a `VERDICT:` line at all before
  T8 relies on it. A `none` rate near 100% makes the column noise.
- N8. Threat model: it omits pi-worker's `{{WORKTREE}}`/`{{BRANCH}}` substitution in the preamble and the `cwd`
  section. Both are per-lane text that will defeat duplicate detection across builds and verbatim preamble matching.
  Normalize them, or name them as a residual.
