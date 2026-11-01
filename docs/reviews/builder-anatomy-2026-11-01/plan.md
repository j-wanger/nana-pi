# Plan: builder-anatomy (2026-11-01)

Lane: `builder-anatomy`, worktree `~/nana-pi-wt/builder-anatomy`, branch `feat/builder-anatomy`, base main `11454d44`.

Lane class: `ordinary` (`node scripts/lane-class.mjs --root . --files apps/bench/anatomy.mjs,apps/bench/lib/anatomy.mjs,apps/bench/lib/anatomy-config.mjs,apps/bench/test/anatomy.test.mjs,REQUIREMENTS.md,apps/bench/README.md`).
One final reviewer, the roster's reviewer. No wrong-code pairs, no land reviewer, no install check.

Stakes: low blast, reversible. Slice 1 is a hand-run, descriptive analysis tool. It changes no launcher, no prompt
and no live build. The one real harm is private text leaking into git: the builder contexts it reads hold the
owner's objective and the user's skills listing. T4 pins every writer and every printer. A wrong label costs a wrong
description, so the seat measures label agreement (T7) before anyone reads the shares.

Merge order: lane context-anatomy (FEAT-041, R-3210 to R-3229, A-089) lands first. This lane keeps FEAT-042,
R-3270 onward and A-092, and merges main after context-anatomy lands, before its final round. If this lane were
ready first, the seat holds its land until context-anatomy lands, so main never shows FEAT-042 without FEAT-041.
Nothing in this lane reads FEAT-041's code or rows.

## Purpose

Agreed reading (owner, 2026-11-01): memory cannot be designed well without evidence of what each role's context
needs; start with the builder. Break builder context into segments by function, not by source file, and test what
actually helps builds; the result shapes builder memory design. Two named gaps: context is loaded all at once with no
progressive exposure, and there are no standardized build tools or skills. The owner chose a staged approach: cheap
observational evidence first, then causal tests on the segments it points to. The starting hypothesis is ten
functions: purpose, task, method, constraints, precedent, knowledge, lessons, tools, output contract, feedback. The
experiment may merge or split them if tagging shows they do not sort cleanly.

This lane is slice 1, the observational slice, as one feature:

> Describe what each part of a real builder's context is for: split everything pi handed the builder into units,
> label each unit with one of the ten functions, and report what each function costs by units and by chars, what is
> repeated, what nothing supplies and what the builder fetched for itself, with a stored segmented copy that later
> slices can replay with one function removed or staged.

Slice 1 is descriptive only (seat decision, 2026-11-01). It does not pick slice-2 targets from outcome correlations.
Slice 2 tests every function the tagging finds with a meaningful share, in an order the seat sets by hypothesis, and
its pre-registration says so.

Grounding (anatomy research 2026-10-31; structural counts by this planner and the adversary on 2026-10-31; the tool
prints its own denominators, and no row or gate quotes these numbers):

- pi stores each builder's system message as named `sections` (the `content` string is empty), in stored key order:
  `preamble`, `tools`, `rules`, `docs`, `addendum`, `project_context`, `skills`, `cwd`, and in most sessions
  `nana-objective`, `nana-writing` and `nana-rulings`. The `addendum` holds the builder preamble, the brief and the
  known-bug file, joined in that order. A separate `toolsAdded` field holds about 4.5k chars of tool schemas.
- Outside the system message, sessions also hold the `-p` instruction message, `nana-knowledge` custom messages
  (280 sessions), `context_edit` replacements (84) and compactions (25).
- About 600 sessions named `pi-worker…` ran in nana-pi worktrees (adversary count 596 of 778 on this machine). 585 of
  596 end with a `VERDICT:` line.
- The build-record ledger (since 2026-10-22) names each build's brief, feature and start tip; its `end` lines list the
  build's session files and attempts. The land-record ledger names each landed tip.
- Builder tool calls are mostly bash, read, edit, grep and find; bash reads are mostly wrapped (`cd … && sed`,
  `bash -lc`, `git show`), so a first-word reader rule misses them.
- In one current session the `skills` listing is one 20k-char XML paragraph and `project_context` holds a 5.7k-char
  paragraph; together about 45% of that session's chars.
- Static start context is about 9% of a builder's peak context; tool reads fill the rest (city-loop build 2: 20k
  start, 217k peak). That is why this slice counts what the builder fetched (T6).
- The context load log from lane context-anatomy records sizes, never text, so sessions are the text source.

## Assumptions

- A1. pi session files are the record of what builders received. Claude Code builders store no system message in
  their transcript, so they are out of this slice (residual). Today's small-lane builder is pi gpt-6-luna.
- A2. Slice 1 labels with deterministic rules from config, not with a model. Rules are free, repeatable and readable.
  T7 and the seat measurement check them against two independent labellers. If agreement fails, a model labeler on
  `apps/bench/lib/catch-judge.mjs` is a later lane.
- A3. Each part is stored as an ordered list of spans that tile it exactly. A span is a unit or `glue`. A unit is one
  paragraph, one list item or one Markdown table row outside code fences; a fenced block stays inside its paragraph.
  Headings, blank-line separators and table header rows are `glue`; a heading's label is the default for the units
  under it. XML-structured listings (`skills`, `toolsAdded`) are not split (see Revision, M2).
- A4. Oversize units: any unit longer than `OVERSIZE_UNIT_CHARS` (sealed, 3000 chars, chosen) is reported as its own
  row named by part, not mixed into a function share. That keeps the skills listing, the tool schemas and the
  AGENTS.md table blocks from deciding the shares by one part rule.
- A5. A brief is the text committed at the build's start tip, not today's file. For recorded builds the build record
  names it; for older builds a verbatim search runs over every brief file under `docs/reviews/` and each one's git
  history blobs.
- A6. The known-bug part is found by its header line pattern (config), because known-bug files change after reviews.
- A7. "Duplicate" means the same unit after the configured normalization: whitespace collapsed, list markers and
  emphasis stripped, and the lane's worktree path, branch name and `cwd` value replaced by fixed tokens. Reworded
  restatements are not caught (residual).
- A8. Outcome fields in the per-build rows (verdict, build number, land) are for description only. Constant parts
  (preamble, AGENTS.md, skills, rulings, writing) vary only with time, and build-2+ briefs carry feedback because an
  earlier build failed, so no outcome claim is made from these rows in slice 1.
- A9. Unit text is private: the objective comes from a private file and the skills listing names the user's
  installed skills. Only counts, function names, part names, lane names, build numbers and `dup-<n>` ids leave the
  private folder.
- A10. The feature sits under CAP-08 (evaluate agent choices with credible evidence), beside FEAT-038.
- A11. Slice 1 does not change pi-worker. The segmented format and its assembler live in the bench. When a later
  slice makes pi-worker assemble from it, the assembler moves to a package as its second caller, per the 2026-10-22
  ruling.
- A12. This slice does not read the context load log. A later slice can check attributed part sizes against it.
- A13. A char is one UTF-16 code unit of the UTF-8-decoded text (JavaScript string length).

## Open choices

- O1. Module split inside `apps/bench/lib/` (for example sessions and parts; spans, units and labels; pulls; counts
  and agreement), as long as each module has one purpose and `apps/bench/anatomy.mjs` stays thin.
- O2. The rule table's shape: part rules, then heading and lead-phrase rules, then keyword rules, in that order. The
  builder picks the phrases, and they must label the seat's hand-labelled fixture units in the brief as written.
- O3. File formats in the private folder (JSONL is the precedent) and the report's layout, counts only.
- O4. Pull target classes beyond the minimum T6 names, as long as each maps to one function in config.

Named in config (N4), each with provenance: the session-name prefix `pi-worker`, the known-bug header pattern, the
part splitters, the normalization steps and replacement tokens, the bash reader verbs and the shell splitters, the
pull target-class map and its class → function map, the share rounding, the pointer line for staged units, the
default sample size and per-stratum minimum, the per-function κ minimum count, and `OVERSIZE_UNIT_CHARS`.

## Questions for the owner

These three are for slice 2, the first causal round. Slice 1 runs on its defaults with no spend.

Question: How much may the first causal replay round spend?
Default: USD 150 at pi's list prices, covering builders, the fixed reviewer and the bench's probes, stopped by the bench ledger before a run would pass it.
What the default gains and misses: luna builds cost a median USD 0.04 at list prices (p90 USD 0.13, 253 luna builds), so the cap leaves room for a paid reviewer on every replay; it misses that wall time binds first (luna median 27 minutes, p90 70), which a machine-hours cap would catch.
Cost of a wrong guess: hard to undo; money spent does not come back, though the cap bounds the loss.
If answered otherwise: the slice-2 study's token cap, wall budget, repeats or arm count change to fit; slice 1 is unchanged.

Question: Which past lanes should the first causal round replay?
Default: six first builds drawn by a printed seed from all first builds with a build record, landed or not, stratified by build count, with at least one hook or gate lane and at least one lane that did not land; only lanes whose brief fixes the module paths and exports the hidden tests import, or whose tests drive a CLI.
What the default gains and misses: it avoids picking only survivors and easy lanes; it misses lanes from before 2026-10-22, which have no build record and so no exact start tip, which a hand-mapped older lane would add.
Cost of a wrong guess: hard to undo for the spend on unrepresentative lanes; easy to undo for the code.
If answered otherwise: the candidate filter in slice 2 changes; nothing in slice 1 changes.

Question: Which builder model runs the replays?
Default: the roster's small-lane builder only (gpt-6-luna, thinking high, today); the larger builder in a later round.
What the default gains and misses: it matches the model of most recent builds and is the cheapest; it misses whether a stronger model needs less context, which a larger-builder arm would show.
Cost of a wrong guess: easy to undo; a later round adds a larger-builder arm, and the luna replays stay valid.
If answered otherwise: each arm runs twice, once per model, and lanes or repeats shrink to stay inside the budget.

## Feature

Feature: FEAT-042 · Measure what a builder's context is for

Purpose line for the new feature: Split real builder contexts into units labelled by function, report what each
function costs and what builders fetch for themselves, and keep a segmented copy that replays can cut or stage.

Rows: R-3270 to R-3289 (R-3270 to R-3278 used here). Artifact: A-092.

Artifact line: `A-092 · segmented builder contexts · user-home store: ~/<private --out folder>/contexts.jsonl · manual:
the seat runs node apps/bench/anatomy.mjs segment by hand with a private folder outside any git checkout; synthetic
runs use OS temp`. Read by: `code: apps/bench/anatomy.mjs` (the `report`, `sample` and `assemble` subcommands).

The ten functions, as the config states them (chosen: the owner's starting hypothesis, 2026-11-01; each definition is
the labelling guide for rules, fixtures and labellers):

| Function | A unit has this function when it tells the builder… |
|---|---|
| purpose | why the work matters: the objective, the priority or the feature goal the change serves |
| task | what to build or change in this lane: items, rows, files, the spec to read |
| method | how to work: steps, test order, wrong-code-first, how to try red cases |
| constraints | what it must not do or must keep: scope limits, bans, rulings |
| precedent | existing code or prior work to follow, named by path or symbol |
| knowledge | facts about the code, tools or environment it needs to know |
| lessons | recorded past mistakes, known bugs, gotchas |
| tools | the tools, skills, commands and docs available and how to call them |
| output contract | what done means and what the report must hold: checks to pass, report shape |
| feedback | findings on earlier builds or reviews of this lane to address |

A unit no rule labels is `unsorted`, with a reason code from config (never unit text). `unsorted`, `glue` and each
oversize row are measured shares, never hidden.

## Threat model

In scope, honest variation in our own tools' output:

- pi session files of any version on this machine: torn JSON lines, missing or extra sections, an empty section, no
  `addendum`, CRLF and non-ASCII text, very large XML listings, `toolsAdded` present or absent;
- sessions that are not builders (reviewers carry builder text too), builders in other projects, sessions with no
  system message, one build with several attempt sessions, context edits and compactions mid-run;
- briefs edited after their build, review folders named differently from the worktree, a lane with several briefs,
  an addendum with no known-bug part;
- per-lane text pi-worker substitutes into the preamble (`{{WORKTREE}}`, `{{BRANCH}}`) and the `cwd` section;
- code fences holding blank lines and headings, nested lists, Markdown tables, headings with no units under them;
- tool calls whose result is an error or empty, reads outside the worktree, wrapped bash reads (`cd … &&`, pipes,
  `;`, `bash -lc '…'`);
- an output folder inside a git checkout, behind a final-component symlink, or already holding files; OS temp under
  an ancestor symlink (macOS `/var`).

Out of scope, deliberate forgery: a brief or session file written to steer the tagger; hand-edited private files.
A finding outside this model is a residual. Residuals named now: reworded restatements (A7); bash reads through
`node -e` or other interpreters, which land in `unclassified-bash`; Claude Code builders (A1); builds before
2026-10-22 whose brief matches no committed blob.

## Precedent

- `apps/bench/catch-ledger.mjs` and `apps/bench/lib/catch-extract.mjs`: a hand-run CLI with subcommands over a
  corpus; structural extraction that records a reason for every item it does not turn into a row.
- `apps/bench/lib/catch-stats.mjs` (`cohensKappa`, `seededSample`): imported for T7, never copied or re-derived.
- `apps/bench/studies/catch-ledger-2026-09-28/PREREG.md`: units and definitions fixed before labels exist, and a κ
  gate of 0.6.
- `packages/nana-pack/lib/claude-transcript.mjs`: `entriesIn` (torn-line JSONL reader, whole-file reads are fine at
  these sizes) and `privateFolder` in maker mode (`allowAncestorSymlinks: true, refuseCheckout: true`, as
  `memory-shaping.mjs` uses it). `transcriptFiles` is not used: its default selector drops `-wt-` folders, which hold
  every builder session; the CLI walks the sessions folder itself.
- `packages/nana-pack/lib/memory-shaping.mjs` and `packages/nana-pack/lib/memory-score.mjs`: a `run…(argv, { stdout,
  stderr })` entry with injected output and counts-only printing.
- `packages/nana-pack/lib/build-records.mjs` (`readBuildLedger`, `collectBuildUsage`): the build → brief, start tip and
  session-files map, and token totals. Imported; tokens are never re-summed from per-turn `totalTokens`.
- `packages/nana-pack/lib/pi-usage.mjs`: the Usage sum `collectBuildUsage` relies on; imported if needed directly.
- `packages/nana-pack/lib/brief-precedent.mjs` (`readBrief`): the brief's Precedent paths, for the `precedent` pull
  class.
- `packages/nana-pack/lib/markdown-list-sections.mjs`: fence-aware Markdown scanning; follow its fence handling, or
  import it if its exports fit.
- `packages/nana-pack/lib/memory-shaping-config.mjs` and `packages/nana-pack/lib/frontier-summary-config.mjs`: config
  module form with provenance, and the seal-test form in `packages/nana-pack/tests/build-records.test.mjs`.
- `apps/bench/test/catch-ledger.test.mjs`: the bench test form.
- `apps/bench/README.md` and `apps/bench/studies/tool-profiles-2026-09-08/`: read only; the replay (slice 2) uses them.
- Not reused, with reason: `catch-judge.mjs`'s nested `norm` collapses whitespace only; A7's normalization has more
  steps, and a nested helper cannot be imported. No exported pi-session reader exists (the desk reads sessions inside
  its server for its own UI); the bench writes the first one, and a second caller imports it later.

Map searches run: "split markdown into paragraphs and label", "read pi session system message sections", "counts-only
report over private corpus", "agreement kappa between two labelers", "walk docs/reviews briefs", "replay a past lane
from its base commit", "dedupe repeated text across sources". Results as above; no private helper moves. Every reused
module gains one caller and keeps its signature.

## Outside precedent

SWE-bench (MIT): borrow, for the replay this slice prepares. It replays real repository tasks from their base
commit, keeps the tests that landed with the fix hidden from the model, applies them after the run, and scores on
them. Slice 1 stores what that protocol needs (start tip, brief blob, assembled spans).

Public reference: LLMLingua (MIT). Skip: it shrinks prompts by token-level model scores, which needs a model and cuts
by surprise, not by function.

## Must-meet

Eight tests plus one seal test, one row each in FEAT-042, all in `apps/bench/test/anatomy.test.mjs`, on fixtures in
OS temp, on macOS, Linux and the Windows CI leg. The brief carries 10 to 20 hand-labelled fixture units, at least one
per function, written by the seat from the definitions table before any rule exists (N3).

- T1 (R-3270). Parts are everything pi handed the builder. WHEN `anatomy segment` reads the sessions of a build, it
  shall take the lane from the session `cwd`, group attempt sessions into one build through the build record's `end`
  `sessions` list, and record as parts, in order: each system section; the addendum split into `preamble`, `brief`
  and `known-bugs`; `toolsAdded`; the first user (instruction) message; and each `nana-knowledge` message as a
  `knowledge-pull` part. It shall record each context edit and compaction with its chars as an excluded item with a
  reason. The brief is matched against the build record's brief read at its start tip, else against every brief file
  under `docs/reviews/` and its committed blobs. Pins: joining the parts rebuilds each stored section exactly; a brief
  edited after its build matches through its committed blob; a lane whose review folder name differs from its
  worktree matches; a two-attempt build is one context; `toolsAdded` is a part; a compaction is listed as excluded
  with its chars; a reviewer session is skipped with reason `not-builder`; an unmatched brief leaves one `addendum`
  part with reason `brief-unmatched`.
- T2 (R-3271). Spans tile each part and each unit gets one function. WHEN `anatomy segment` splits a part, it shall
  store ordered spans, each a unit or `glue`, that are contiguous, never overlap and join to the part exactly, splitting
  as A3 says; and it shall give each unit exactly one label from the configured vocabulary through the configured
  rule tiers, or `unsorted` with a reason code. Pins: span tiling on a fixture with a fence holding a blank line and a
  heading, a nested list and a Markdown table (one unit per body row); the seat's hand-labelled fixture units get the
  seat's labels; two runs give identical labels; vocabulary and rules come from the config.
- T3 (R-3272). The report describes cost, gaps and repeats. WHEN `anatomy report` reads a private folder, it shall
  print, for each function, `unsorted` and `glue`, its unit count and share and its chars and share, overall and per
  part; each oversize unit (A4) as its own row by part, outside every function share; per part the unit-size maximum
  and p90; per function the share of builds where it has zero chars, split into build 1 and build 2 or later; and the
  duplicate units as `dup-<n>` with count and parts, after A7's normalization. Pins exact counts and shares on a
  fixture with one unit repeated in `project_context` and `preamble` that differs only by worktree path; shares
  summing to 100 within the configured rounding; an oversize unit absent from every function share; zero-supply shares
  for a fixture whose build 2 has `feedback` and build 1 has none.
- T4 (R-3273). Private text stays out of git and out of output. IF `--out` of `segment`, `sample` or `assemble`
  resolves inside a git checkout or its final component is a symlink, THEN the command shall exit nonzero, name the
  reason and write nothing; an ancestor symlink such as OS temp is allowed. No subcommand shall print unit text.
  Pins: a temp git repo refused by all three writers with no file created; a final-component symlink refused; sentinel
  sentences placed in a heading, a duplicated unit, an `unsorted` unit and every part are absent from the stdout and
  stderr of `segment`, `sample`, `agree`, `assemble` and `report`.
- T5 (R-3274). The segmented copy replays whole, cut or staged, from its spans. WHEN `anatomy assemble` rebuilds one
  stored context into a private folder with no option, it shall write each part from its spans, byte-identical to the
  stored part; WITH `--drop <function>`, it shall leave out that function's units, and any heading `glue` whose units
  are all dropped, and print the units and chars removed; WITH `--stage <function>`, it shall put the configured
  pointer line in place of each run of that function's units and write one staged file holding them in order. Pins:
  byte-equality with no option; a test that alters one stored span and sees the assembled text change; the removed
  counts; no orphan heading after a drop; the staged file equal to the joined units; no other span changed.
- T6 (R-3275). What the builder fetched is counted by function. WHEN `anatomy segment` reads a build's tool calls, it
  shall count as reads the `read`, `grep`, `find` and `ls` tool calls and each bash segment (split on `&&`, `;`, `|`
  and inside `bash -lc` bodies) whose verb is in the configured reader list (including `cat`, `sed`, `head`, `tail`,
  `grep`, `rg`, `nl`, `awk`, `git show`, `git diff`, `git log -p`), each with its target class and result chars; it
  shall count other bash calls in `unclassified-bash` with their result chars; and `anatomy report` shall print pulled
  calls and chars per class and per function through the configured class → function map, beside pushed chars per
  function. Pins exact counts on a fixture with a `grep` tool call, `cd X && sed -n …`, `bash -lc 'cat …'`, a
  `git show main:file`, an errored read counted with zero chars and one `npm test` in `unclassified-bash`.
- T7 (R-3276). Label agreement is measured without giving labels away. WHEN `anatomy sample --seed <s>` draws units,
  it shall draw the same units for the same seed through `seededSample`, stratified by rule tier with the configured
  minimum per labelled function, and write a label sheet holding only unit id and unit text, never part, heading or
  rule. WHEN `anatomy agree` reads two filled sheets and the rule labels, it shall print, for each pair among rules and
  the two labellers, Cohen's κ through `cohensKappa`, char-weighted agreement, per-function κ for each function with at
  least the configured count, the consensus count (units both labellers agree on) and the confusion pairs ranked by
  count. IF the sheets hold different unit ids, THEN it shall exit nonzero naming how many differ. Pins: same seed,
  same units; the sheet has no part, heading or rule field; κ equal to `cohensKappa` on fixture labels; a char-weighted
  value differing from the unweighted one on a fixture with one long disagreed unit; the consensus count; the
  mismatch exit.
- T8 (R-3277). Each build gets one row of counts. WHEN `anatomy report` runs, it shall print one row per build: lane,
  build number from the brief file name (or `unknown`), model, the last assistant message's verdict word or `none`,
  units and chars per function, pulled chars, tokens from `collectBuildUsage`, wall minutes and whether the lane has a
  land record. Pins one fixture build's row field for field, a two-attempt build as one row with summed attempts, and
  `none` for a session with no verdict line.
- Seal (R-3278). `OVERSIZE_UNIT_CHARS` is 3000 (chosen: above the knowledge pull's 2,000-char block and below the
  5.7k AGENTS.md table paragraph and the 20k skills listing; the seat may retune it after step 1's size report, and
  the seal test then fails naming this row). Every other test imports the name.

Expected changes outside the new files (a forecast, not a limit): `REQUIREMENTS.md` (FEAT-042 under CAP-08 with A-092
and its Read by line); `apps/bench/README.md` (a section naming the five subcommands, the private-folder rule and how
to test them; every command it names must run); code map, runtime map and requirements outline regenerated. No
existing test should change. Grep tests and checkers for the bench README's layout block and the CAP-08 deliverables
lines before editing them.

## Seat measurement

The seat runs this after build 1, before the review brief, and commits counts only into this lane folder, after the
identity scan. It is description; it names no slice-2 target.

1. `node apps/bench/anatomy.mjs segment --sessions ~/.pi/agent/sessions --repo ~/nana-pi --out <private folder outside
   git>`. Record the printed denominators and skip reasons. Pass when at least 90% of builds with a build record split
   into preamble, brief and known-bug parts; report the older builds' match rate beside it without a gate. Below 90%,
   the brief-match rule is fixed in the next build brief.
2. `report` into `anatomy-counts.md`: function shares by units and chars, per-part shares, oversize rows, glue, unit
   sizes, zero-supply shares by build number, top `dup-<n>` counts, pulled versus pushed by function, and the per-build
   rows.
3. Agreement, fixed before the shares are read, as in the catch-ledger pre-registration: `sample --seed
   builder-anatomy-2026-11-01`. Labeller A is a Claude Code subagent, a model family different from the rules author
   (the gpt builder). Labeller B is a different lineage from A (the roster's pi land model). Each gets only the
   definitions table and the sheet; neither sees part, heading or rule. `agree` reports every pair.
   - Labellers' per-function κ below 0.6 for a function: that function does not sort cleanly; its top confusion pair
     becomes a merge or split proposal for the owner, and its share is marked unreliable.
   - Rules against the consensus below 0.6 where labellers agree: the rules are fixed in the next build brief, or the
     model labeler (A2) becomes a later lane.
4. The lane notes list every function with its shares, its reliability mark and its pulled-versus-pushed figures. The
   slice-2 pre-registration then defines "meaningful share", lists every function at or above it, and orders them by
   the seat's stated hypothesis.

## Later slices

- Slice 2, replay harness (bench, CAP-08):
  - Each replay is one past build 1. The checkout is a fresh one-commit repo made from `git archive <start tip>`, with
    no later objects and no remote, so landed tests cannot be read from history and nothing can be pushed.
  - The builder runs with a temp HOME and agent dir that cannot read `~/nana-pi*`, other worktrees or
    `~/.pi/agent/sessions`; pi gets `--no-context-files --no-skills --no-extensions`, and the assembled context is
    passed as an append-system-prompt file from a private folder, never written into the clone.
  - After the builder exits, the lane's landed req-tagged test files are copied in and run, as bench copies assets
    after the model exits. Lanes are chosen whose brief fixed the module paths and exports those tests import, or
    whose tests drive a CLI. A hidden-test import failure is a grader error, and the grader-error rate per arm is a
    first-class number.
  - A fixed reviewer (one model, one brief template) counts MUST findings. Tokens, wall time and pulls come from the
    stream and T6's counter.
  - Arms: control (whole context) and one drop or stage arm per function with a meaningful share, in the seat's
    order; three repeats per arm on a seeded block schedule; an arm differs only beyond the control arm's spread,
    fixed in a pre-registration before the first run.
  - Lane draw: seeded, from all first builds with a build record, landed or not, stratified by build count, with at
    least one hook or gate lane and one lane that did not land, or a stated reason why not.
  - Bench needs: a fixture from a git commit as a fresh repo, an assembled-context profile, a hidden-test checker.
    Replays run when no lane is building, since each replay's suite takes the machine lock.
- Slice 3, staged delivery: if a stage arm holds up, pi-worker assembles the builder context from the segmented
  format and stages that function behind a file read on demand; the assembler moves to `packages/nana-pack/lib/`.
- Slice 4, build tools and skills: from the pull classes, `unclassified-bash` and repeated read sequences, package the
  most repeated fetch-and-check sequences as one builder command or skill, and test it with the replay.
- Slice 5, builder memory: the memory factory's builder bundle sized and ordered by what slices 2 to 4 measured.

## Revision after the attack

Every MUST and SHOULD is taken; NOTEs as below. Seat decisions of 2026-11-01 are applied where they differ.

- M1 (pulls): T6 now counts the `grep`, `find` and `ls` tools, splits bash into segments including `bash -lc` bodies,
  adds `git show`, `git diff`, `git log -p`, `nl` and `awk`, and reports `unclassified-bash`. A7's first-word rule is
  gone.
- M2 (giant units): seat decision taken. Shares are reported by unit count and by chars (T3). Units above the sealed
  `OVERSIZE_UNIT_CHARS` are their own rows (A4, seal R-3278). Markdown tables split at rows; XML listings are not
  split, because the seat chose to report them as whole rows rather than spread one part rule across hundreds of
  units. Unit-size max and p90 per part are reported. The sample is stratified by rule tier, and agreement is also
  char-weighted (T7).
- M3 (assemble leak): `assemble` is under the same guard and in T4; slice 2 passes the text from a private folder,
  never into the clone.
- M4 (brief matching): lane from `cwd`; recorded builds via the build record's brief at its start tip and the `end`
  `sessions` list; older builds by a verbatim search over every brief and its committed blobs. O4's name fallback is
  removed. The 90% gate now applies to recorded builds; older builds are reported without a gate.
- M5 (targets): seat decision taken. Slice 1 is descriptive; step 4 picks nothing. Pulls map to functions through a
  configured class → function map (T6). Zero supply is reported per build, split by build number (T3). A8 states that
  no outcome claim is made.
- S1: `toolsAdded`, the instruction message and `nana-knowledge` messages are parts; context edits and compactions are
  listed as excluded with their chars (T1).
- S2 and N3: seat decision taken. Labeller A is a different model family from the rules author; B a different lineage
  from A; the sheet hides part, heading and rule; consensus is defined; per-function κ is reported. The seat writes the
  hand-labelled fixture units into the brief.
- S3: spans with `glue` tile each part (T2); glue is a reported share (T3); assembly runs from spans and drops orphan
  headings (T5).
- S4 and S5: seat decision taken as slice-2 design notes (Later slices and question 2).
- S6: builds group attempt sessions through the `end` record; tokens come from `collectBuildUsage` (T1, T8).
- S7: sentinels in headings, duplicates and `unsorted` units, checked across all five subcommands; duplicates print as
  `dup-<n>`; unsorted reasons are codes (T4, T3).
- N1: grounding counts are marked as of 2026-10-31 and no row or gate quotes them; the tool prints its denominators.
- N2: the char is defined here (A13); FEAT-041's order is a merge-order note at the top, per the seat.
- N4: every listed value is named in config (Open choices).
- N5: `seededSample` imported; `transcriptFiles` not used, with reason; `catch-judge`'s nested `norm` not reused,
  with reason; no exported pi-session reader exists to import (Precedent).
- N6: `privateFolder` in maker mode; T4 pins the final-component symlink refusal.
- N7: checked: 585 of 596 nana-pi worker sessions end with a `VERDICT:` line, so the column carries signal.
- N8: worktree path, branch and `cwd` are normalized before duplicate detection (A7); the preamble part is found by
  position before the brief, not by verbatim match, so substitution does not break it.
