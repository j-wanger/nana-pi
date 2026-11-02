# Plan: seat-anatomy (2026-11-02), revision 2

Lane `seat-anatomy`, worktree `~/nana-pi-wt/seat-anatomy`, branch `feat/seat-anatomy`, base `origin/main` `7c4e7e19`.
Revision 2 answers the adversary attack (`plan-attack.md`); the disposition list is at the end.

Lane class: `ordinary` (`node scripts/lane-class.mjs --root . --files apps/bench/lib/anatomy-seat.mjs,apps/bench/lib/anatomy-slots.mjs,apps/bench/lib/anatomy-config.mjs,apps/bench/lib/anatomy-pulls.mjs,apps/bench/lib/anatomy.mjs,apps/bench/anatomy.mjs,packages/nana-pack/lib/memory-making.mjs,packages/nana-pack/lib/memory-score.mjs,packages/nana-pack/lib/claude-transcript.mjs,apps/bench/test/anatomy-seat.test.mjs,apps/bench/README.md,REQUIREMENTS.md,docs/known-bugs/FEAT-042.md,docs/code-map.md,docs/requirements-tree.md`;
it also prints "also reaches" lines from `claude-transcript.mjs` and `memory-making.mjs` to nana-land, install-check,
nana-setup, stale-copies and doctor through the import graph. The changes there are added exports and default-off
options, so the class stays ordinary.) One final reviewer, the roster's reviewer.

Stakes: low blast and reversible for the code. The lane adds a hand-run reader and report. It changes no hook,
launcher, prompt or live session, and it spends nothing. Two harms are real:
- private seat text (owner words, memory, rules) reaching git, stdout, agent logs or review files (T8, A12);
- numbers read as more than they are: recorded payload read as "what the model received" (A1, T1).

IDs: rows R-3640 to R-3648 in FEAT-042. No new feature and no new artifact. On the base, `REQUIREMENTS.md` tops out
at R-3474, A-098 and FEAT-043. In-flight plans claim FEAT-044, FEAT-045, A-100, A-101 and rows up to R-3619 (grep,
2026-11-02). The seat may move the range at merge time.

## Purpose

Agreed reading (issue #281; the owner said "go with your recommendation"): **A now, built so B can reuse it.**
A is a seat context study, one time. It runs the builder anatomy tools on seat sessions to show what the seat is given,
by kind, what it reads for itself and what repeats. B is a reusable context check for every role, re-run and compared,
fed by the load log. B attaches later by adding a runtime and role adapter, not by rewriting this one.

Current priority (2026-11-02): "craft each role's context by design, builder first, measured by drop tests; memory
delivery and the knowledge pull follow from what those tests show". The owner also said "eventually every role".
This lane is the seat's descriptive baseline. It covers the builder drop test lane's measures, without the drop:

- per kind, recorded chars and share at the start and over the session;
- what the seat reads for itself, as tool calls by class;
- repeats, as three separate measures (T6);
- the owner's corrections per session, as the outcome signal (T7).

It is not a drop test and not a paid replay. **The acceptance deliverable is the counts-only baseline.** The seat runs
the private extraction on the real seat transcripts after build 1 and commits `seat-counts.md` in this lane before
the final round (seat steps 1 and 2). Model labelling is a separate optional experiment, outside this lane.

### What the numbers can and cannot claim (attack MUST 1)

- **Can claim:** the transcript recorded N UTF-16 chars of payload of kind K in segment S. Kinds can be compared with
  each other within recorded payload. Changes can be compared across sessions of the same Claude Code version.
- **Cannot claim:** that the model received those chars, in that form, on that turn. Claude Code may wrap, trim, drop or
  add text on the wire, and versions differ. Chars are not tokens. Recorded totals bound nothing about delivery.
- **How the report keeps this visible:** every kind carries a delivery class from config:
  - `recorded-input` is a payload the transcript itself presents as model input: the system prompt snapshot,
    instruction files, hook output text, owner turns, tool results and the compaction summary.
  - `unknown` covers deltas, listings, harness reminders, environment and unknown attachment types.

  Headline shares are computed over `recorded-input` only. `unknown` chars print in a separate column and are never
  folded into the headline. The report also prints coverage: the share of entries whose payload field was found, by
  attachment type.
- **The `/context` check is a diagnostic, not a bound.** It is seat step 2: one live seat session, Claude Code's
  `/context` categories against this report's start kinds for the same session. The check compares each category's
  share, not absolute chars against tokens. `seat-counts.md` prints both columns and every category whose share differs
  by more than the seat-chosen 5 points, with no smoothing. A mismatch is a finding to report, not a reason to adjust
  the numbers.

### What a Claude Code seat transcript records (checked 2026-11-02, keys and lengths only)

The 14 main-thread transcripts in the nana-pi Claude project folder (Claude Code 2.1.280 to 2.1.316) all carry the
slots below. The README line "Claude Code builders remain outside this slice because their transcripts omit the system
message" is out of date for these versions: `prompt_snapshot` records it.

**Payload extraction is by field, per shape, from a config table.** It never runs `textFrom` over a whole attachment,
because that would pull ids, paths and metadata into the totals.

| Recorded entry | Payload field | Kind | Delivery |
|---|---|---|---|
| `attachment.type: prompt_snapshot` | `systemPrompt[]` strings | `system-prompt` | recorded-input |
| `attachment.type: instructions`, `files[].type: User` | `files[].content` | `user-rules` (known nana rule names, else `user-rules-other`) | recorded-input |
| same, `type: Project` | `files[].content` | `project-instructions` | recorded-input |
| same, `type: AutoMem` | `files[].content` | `auto-memory` | recorded-input |
| `hook_success`, `hookEvent: SessionStart`, by `command` | `content` | `shared-memory`, `objective`, `adoption`, `roster-notice`, else `hook-other` | recorded-input |
| `hook_additional_context` (SessionStart) | `content[]` strings | correlated with its hook (T4), else `hook-other` | recorded-input |
| `hook_success`, `hookEvent: UserPromptSubmit` | `content` | `knowledge-pull` | recorded-input |
| `hook_cancelled` | none | `knowledge-pull`, 0 chars, reason `timed-out` | — |
| `skill_listing` (`content`), `deferred_tools_delta`, `agent_listing_delta`, `mcp_instructions_delta` (`addedLines`/`addedBlocks`), `deferred_tools_record` (`entries`) | as named | `tools` (opaque) | unknown |
| `invoked_skills` | `skills[].content` | `skills` | unknown |
| `file`, `edited_text_file`, `compact_file_reference` | `content`, `snippet`, none | `attached-files` | unknown |
| `environment`, `session_context`, `date`, `model`, `auto_mode`, `remote_session_change` | `snapshot`, `context`, `date`, `text`, none, none | `environment` | unknown |
| `total_tokens_reminder`, `silent_turn_reminder` (`text`), `task_status`, `ultra_effort_*`, `thinking_drop`, `command_permissions` | `text` or none | `harness` | unknown |
| `queued_command` | `prompt` | correlated to an owner turn (T4) | per T4 |
| any other attachment type | none (type counted) | `attachment-other` | unknown |
| `user` entry accepted by memory-making's `ownerTurn` | text parts | `owner` | recorded-input |
| other `user` text (wrapper tags, `isMeta`) | text parts | `notification` or `harness` by wrapper tag | unknown |
| `user` with `isCompactSummary` | text parts | `compaction-summary` | recorded-input |
| `assistant` `tool_use` plus its `tool_result` | result text | a pull row by class (T5), not a part | recorded-input |

## Assumptions

- A1. The transcript is the record. Its numbers mean what "What the numbers can and cannot claim" says, and no more.
- A2. **Segment boundaries come from one state machine** (attack MUST 2). The events are:
  - boundary events: file start, `compact_boundary`, `isCompactSummary`, and SessionStart `hook_success` or
    `hook_additional_context` with any source;
  - standing events: `prompt_snapshot`, `instructions`, and the tools and environment attachments.

  A new segment opens at a boundary event that follows any non-start event: an assistant message, a tool result, a
  `user` entry, a UserPromptSubmit hook or a queued command. Consecutive boundary and standing events **coalesce** into
  one start window, whatever their order. So a `compact_boundary`, its summary and a `SessionStart:compact` hook group
  open one segment, not two. Parts in the start window have phase `standing`; everything after has phase `turn`. Phase
  does not depend on an owner turn, so tool work that continues after an auto compaction is `turn`. A segment whose
  window lacks the snapshot or the instructions records `unrecorded-system` or `unrecorded-instructions`. The start
  kind (`startup`, `resume`, `clear`, `compact`, `unknown`) comes from the hook's `hookName` suffix or the boundary
  type.
- A3. **Physical files, logical sessions and inheritance are separate** (attack MUST 3).
  - A logical session is the entries' `sessionId`.
  - Every entry with a `uuid` is owned by the earliest-timestamp occurrence across all files, with ties broken by
    `sessionId`, then `uuid`, never by file order.
  - A file that repeats owned uuids (a resume copy or a fork) gets those entries as `inherited`. They form its context
    prefix but count in no corpus total.
  - Forks are reported as their own logical sessions, with inherited and new chars in separate columns. Corrections and
    owner turns count once, in the owning session.
  - A private alias map (session id to ordinal) lives only in the store. Results do not depend on enumeration order.
- A4. **Event identity, not text equality** (attack MUST 4). These rules are in config:
  - Within one start window, a `hook_additional_context` and a `hook_success` with the same `hookEvent` are one
    delivery when the additional text appears inside the `hook_success` content, either raw or as a JSON
    `additionalContext` value. Otherwise they are two deliveries.
  - Separate invocations, in different windows or with different `toolUseID`s, are separate deliveries even when the
    text is identical. They count as repeated deliveries in T6.
  - A `queued_command` with `humanTurn: true` is one owner turn with the first later `user` owner turn in the same
    segment whose text equals its `prompt`, before the next queued or owner turn. With no such match, it is an owner
    turn counted as `queued-unmatched`.
  - Repeated identical owner prompts with different uuids stay separate.
  - A case the rules cannot settle counts in an `ambiguous` row by reason and is never silently merged.
- A5. Seat scope is main-thread Claude Code files in the repo's own project folder (`projectKey(repo)`).
  `transcriptFiles` gains a default-off observer that reports each project folder it skips and why: `worktree`,
  `other-project` or `private-tmp`. `streamEntriesIn` gains a default-off torn-line counter. These are counts-only
  observation options; existing callers see no change. `isSidechain` entries are counted and never become parts.
  Subagent files under `<session>/subagents/` are not enumerated. The report says so in its denominator note, and the
  Agent tool's result in the main thread is the `delegation` pull. No second walker or parser is added.
- A6. pi seat sessions are out of this slice. The nana-pi pi session folder holds 35 sessions, 31 of them pi-worker or
  pi-review children and none with more than five user turns. The first B attachment is the adapter key
  `pi:seat`. It moves `extractContexts`' private system-section loop into an exported helper that both pi adapters
  import. That move belongs to that later lane, not this one.
- A7. The function definitions and rule labels apply to seat units unchanged. Rule-label function shares are not
  findings (FEAT-042 known bug: κ 0.36). The findings of this lane are the deterministic kind, repeat, read and
  correction counts.
- A8. Store shape: A-092 rows with `id`, `cwd`, `branch`, `parts[]` (`name`, `raw`, `attempt`, `spans`), `excluded`,
  `pulls`. Seat contexts add these fields:
  - `role: "seat"` and `runtime: "claude-code"`;
  - `id` as `seat-<ordinal>:s<segment>` (never the UUID), and `lane: "seat"`;
  - `start`, `version` and `inheritedChars`;
  - per part `phase`, `delivery`, `identity` (private: the hook invocation id or file path) and `inherited`.

  Readers treat a missing `role` as builder. Because ids and lane are safe by construction, `reportContexts`,
  `reportLabels`, `agree` and `sample` print nothing private without edits (T8).
- A9. Large seat files (up to 130 MB) are read with `streamEntriesIn`, so the seat adapter is async.
- A10. **Corrections join** (attack MUST 5). Inputs are memory-score labels (`evidence`, `kind`: correction, decision
  or none) or memory-making candidates (`kind`: correction, decision or lesson). They are read through memory-score's
  `rows`, which gains a named export. `outcome-score`'s reader is not used, because it drops `none` and rejects
  candidates.
  - Evidence normalizes to an owner-turn key: `claude-code:<sessionId>#<ownerUuid>`, with any `+<pairedUuid>` suffix
    dropped. Rows are deduplicated by that key.
  - Two different kinds on one key count as `conflict`.
  - An explicit `none` is kept apart from `unlabelled`.
  - AskUserQuestion answers, whose evidence names a tool-result entry that `ownerTurn` rejects, count as
    `structured-answers`, apart from owner turns.
  - Keys whose session is absent from the store count as `outside`. Keys whose uuid is absent from a present session
    count as `missing-turn`.
  - Counts from candidates print as `estimated` (cue-matched). Counts from labels print as `labelled`.
- A11. Kind totals use every retained payload char of a part, glue and oversize spans included (attack MUST 6).
  Function shares stay `reportContexts`' business, with its oversize exclusion, and are not the kind shares.
- A12. **No raw transcript reaches the coding harness** (attack MUST 8). The builder works only from synthetic
  fixtures. Those fixtures are built from the shape table above, which came from a keys-and-lengths probe, plus a
  sanitized shape fixture the seat may add: keys, types and lengths, with every string replaced by a tripwire. The
  builder does not open, cat, grep or excerpt a real transcript. Briefs, build reports, reviews and `seat-counts.md`
  carry no transcript excerpt. The seat's real run prints counts only.

What may be wrong: A4's correlation rules rest on shapes from one Claude Code version range. If a later version writes
hook output differently, entries land in `ambiguous` or `attachment-other`, where they stay visible. A3's
earliest-timestamp owner assumes resume copies keep their original timestamps; the builder's fixture pins both cases.

## Open choices

- O1. Module split: `anatomy-seat.mjs` is the Claude Code seat adapter, turning transcript files into contexts.
  `anatomy-slots.mjs` is the role-neutral report of kinds, phases, sessions, repeats, reads and corrections over any
  store. The builder may rename them if each keeps one purpose.
- O2. The adapter registry is keyed by runtime and role. It sits in `anatomy.mjs` as a map:
  `{ "pi:builder": extractContexts, "claude-code:seat": extractSeatContexts }`. Each entry returns the same
  contract: `{ contexts, skipped, denominators }`, where every context is the A8 shape. The CLI default stays
  `pi:builder`.
- O3. Seat tool classes beyond the shared read classes: `delegation` (Agent/Task), `web` (WebFetch/WebSearch),
  `skill`, `write` (Edit/Write/NotebookEdit; count only), `memory` (reads whose target matches
  `SLOT_MARKERS.readPaths`), `other`. They live in a separate `SEAT_CLASS_FUNCTION` in `anatomy-config.mjs`.
  `CLASS_FUNCTION` is not edited, so builder `byClass` rows do not change.
- O4. CLI flags: `segment --role seat [--runtime claude-code] --projects <root> --repo <repo> --out <private>` and
  `report --in <private> [--corrections <jsonl>]`. With a seat store, `report` adds the `slots` block from
  `anatomy-slots.mjs` to the existing output. Names may change if the README matches.
- O5. Not in this lane: printing the context load log's shared-memory chars beside the transcript's. That is B's
  second data source.

## Questions for the owner

The owner is away. The seat decides these with an astra consult; each default is the one this plan defends.

Question: In a later labelling run over seat units, may the model labeller receive the owner's own turns and the memory files?
Default: no. Label only the system-supplied kinds (system prompt, rules, project instructions, hook output, knowledge pulls, compaction summaries). Owner turns and memory files stay deterministic counts until the owner says yes.
What the default gains and misses: gains no new copy of the owner's words or memory at a model provider without his say; misses a function split of the seat's largest variable input, the owner's turns.
Cost of a wrong guess: hard to undo. Text sent to a model cannot be recalled. This lane sends nothing either way, so the default only shapes a later run.
If answered otherwise: the later run adds owner and memory kinds to its label input. The owner's yes is recorded with the date in that run's notes.

Question: In that later run, should the labeller reuse the sealed prompt that says "a builder's context", or a role-neutral prompt?
Default: a role-neutral prompt with a new sealed hash, checked by a fresh seat agreement sheet before any share is read.
What the default gains and misses: gains labels not pushed toward builder readings of seat text; misses direct reuse of the builder κ 0.86 check, so it costs one more sheet (about USD 2).
Cost of a wrong guess: easy to undo. Labelling happens outside this lane, and a new prompt needs only a new private folder.
If answered otherwise: the seat labels with the sealed prompt and marks the shares as builder-framed.

## Feature

Feature: FEAT-042 · Measure what each role's context is for

These are in-place text edits, with no regroup and no new feature:
- The label widens from "a builder's context" to "each role's context".
- The Purpose line adds "and seat".
- Artifact A-092 becomes "segmented role contexts", with the seat command added to its `Made by` line.

The owner's direction for B ("eventually every role") makes one feature the stable home. Rows R-3640 to R-3648,
one per must-meet.

The deliverable is the seat store, a run of A-092, made by `node apps/bench/anatomy.mjs segment --role seat ...` by
hand outside git. It is read by `apps/bench/anatomy.mjs` (report, label, sample, assemble). The committed counts file
is `docs/reviews/seat-anatomy-2026-11-02/seat-counts.md`, counts only, written before the final round.

## Threat model

In scope, as honest variation in our tools' output:

- Claude Code version drift: attachment types added, renamed or missing, and payload fields moved. These land in
  `attachment-other`, in a coverage miss or in an `unrecorded-*` reason.
- Compactions, auto or manual, with or without a hook refresh, plus `/clear` and resume inside one file.
- Resume copies and forks that repeat earlier entries in another file.
- Sidechain entries and subagent files.
- Torn JSON lines.
- Hook outputs that change size and wording over time. They are read as recorded per segment.
- JSON hook envelopes, repeated identical hook output, and queued prompts that do or do not reappear.
- Timed-out knowledge pulls.
- Correction files in either labels or candidates form, including paired evidence, duplicates and conflicts.
- pi seat files, which are not read (A6).
- Builder stores written before this lane, which have no `role` field.

Out of scope: deliberate forgery of transcripts, labels or candidates files. Residuals: the recorded-versus-sent gap
(A1, which is reported and not closed), the noise of cue-matched candidate counts (A10), subagent files not enumerated
(A5), and A4's version-range dependence.

## Precedent

- `apps/bench/lib/anatomy-sessions.mjs` (`extractContexts`): the store row shape, the per-part `push` with
  `segmentPart(raw, name, id)`, exclusions with reasons, skips and denominators. The seat adapter follows it as a
  sibling and does not edit it. Its private system-section loop moves out only when `pi:seat` arrives (A6).
- `apps/bench/lib/anatomy-spans.mjs` (`segmentPart`): imported unchanged.
- `apps/bench/lib/anatomy-pulls.mjs` (`pullsOf`): **move** the per-call classification (dedicated reader target,
  `bashReads`, equal char split) into an exported helper, for example `callClasses(name, args, options)`. `pullsOf`
  and the seat adapter both call it. Builder `pullsOf` output stays identical.
- `apps/bench/lib/anatomy-measures.mjs` (`reportContexts`, `reportLabels`, `distinctUnits`, `normalize`): imported,
  not edited. `normalize` and `distinctUnits` give T6's normalized-duplicate measure.
- `apps/bench/lib/anatomy-labels.mjs` (`labelContexts`, `readLabels`): used unchanged on the seat store (T9).
- `apps/bench/lib/anatomy.mjs` (`runAnatomy`, `argsIn`): argument parsing, `privateFolder` with `refuseCheckout`,
  exclusive writes, the fixed-reason error map and the adapter registry (O2).
- `apps/bench/lib/anatomy-config.mjs`: home of every new tunable, each marked `chosen` with a reason:
  - the payload field table and kind and delivery rules;
  - the known rule-file names and hook command markers;
  - the boundary and standing event types and the correlation rules;
  - `SEAT_CLASS_FUNCTION`.

  `REPORT_PARTS` gains the seat kinds; builder parts never carry those names. `CLASS_FUNCTION` is unchanged.
- `packages/nana-pack/lib/memory-replay-context.mjs` (`rebuildContext`): the nearest reader of Claude Code seat slots,
  covering instruction files, the SessionStart hook and the compaction refresh. The seat adapter follows its slot
  reading and its `parentUuid` care. Its loop is inline, not a helper, so nothing moves out of it. `SLOT_MARKERS` is
  imported from `packages/nana-pack/lib/memory-replay-config.mjs` for the shared-memory hook marker and the memory
  read paths.
- `packages/nana-pack/lib/memory-making.mjs`: **move** the private `ownerTurn` to a named export, and import it
  (2026-10-22 ruling). `projectKey` comes from `packages/nana-setup/lib/project-key.mjs`, as memory-making imports it.
- `packages/nana-pack/lib/memory-score.mjs`: **move** the private `rows` reader to a named export, for example
  `readScoreRows`, and import it for A10.
- `packages/nana-pack/lib/claude-transcript.mjs` (`transcriptFiles`, `streamEntriesIn`, `textFrom`, `privateFolder`):
  imported. Two default-off observation options are added (A5). Existing callers pass none and see identical results.
- `apps/bench/test/anatomy.test.mjs` and `apps/bench/test/anatomy-labels.test.mjs`: the synthetic-fixture, OS-temp
  output, stub-runner and tripwire patterns.

From `npm run map:search` (added to the list above): "read Claude Code transcript entries" and "owner turn in a
Claude transcript" surfaced `memory-replay-context.mjs`, `writing-trial-extractor.mjs` and `outcome-meter.mjs`.
I took `memory-replay-context.mjs` as the slot-reading precedent. `writing-trial-extractor.mjs` reads seat sessions
for sentences only, so it is not followed. "segment pushed context into function units" confirmed the anatomy modules.
"SessionStart hook output" surfaced the hook producers (`packages/nana-setup/lib/shared-memory-input.mjs`, the roster
notice hook), which are used only as the source of the hook `command` labels. "compaction summary" surfaced pi's
`nana-handoff.ts`, which is not relevant here.

### Shared code with builder-drop (attack SHOULD 10)

builder-drop is being revised and may split into two lanes. Either way, ownership is by function:

| Shared code | Owner | Other lane's rule |
|---|---|---|
| `anatomy-measures.mjs` `assembleParts` (`--labels`, `--drop-part`) | builder-drop | seat-anatomy does not edit it |
| `anatomy-measures.mjs` `reportContexts`, `reportLabels`, `distinctUnits`, `normalize` | neither edits | a lane that must change them takes the T9 regression checks with it |
| `anatomy.mjs` `argsIn` `OPTIONS`/`COMMANDS` arrays | both append | the merge keeps both lanes' entries |
| `anatomy.mjs` `runAnatomy` `segment` and `report` branches, and the adapter registry | seat-anatomy | builder-drop does not edit them |
| `anatomy.mjs` `runAnatomy` `assemble` branch | builder-drop | seat-anatomy does not edit it |
| `anatomy-pulls.mjs` `pullsOf`, new `callClasses` | seat-anatomy | builder-drop imports `pullsOf`, whose signature and output stay as they are; a replay-stream caller with another call shape imports `callClasses` |
| `anatomy-sessions.mjs` `extractContexts` | neither edits | builder-drop imports it |
| `anatomy-config.mjs` `CLASS_FUNCTION`, `REPORT_PARTS` | `CLASS_FUNCTION` unchanged here; seat-anatomy appends to `REPORT_PARTS` | each lane adds its own named constants |
| README "Builder context anatomy" section | builder-drop owns the `assemble` paragraph | seat-anatomy edits only the stale Claude Code sentence and adds its own "Seat context anatomy" subsection and Layout lines |

Whichever lane lands second merges main and re-runs T9's builder regression checks on the merged tip.

## Outside precedent

- `ccusage` (ryoppippi/ccusage, MIT): skip. It reads Claude Code JSONL for token usage per session and day, not for
  context slots. It offers nothing beyond the file layout `claude-transcript.mjs` already handles.
- Public reference: Claude Code's `/context` command shows live context use by category. It serves as seat step 2's
  diagnostic only (A1).

## Must-meet

All tests go in `apps/bench/test/anatomy-seat.test.mjs`, on synthetic fixtures in OS temp built from the shape table.
They read no real transcript, call no model and spend nothing. Each test carries its `req:` marker. Assertions are on
observable output.

- **T1 (R-3640) Payload by field, kind and delivery class.** A one-segment fixture holds every row of the shape table.
  It includes one unknown attachment type and metadata fields filled with tripwire strings. `segment --role seat`
  produces:
  - each payload under its kind and delivery class;
  - no metadata chars in any total;
  - the unknown type under `attachment-other`, with delivery `unknown`;
  - per-type coverage counts.

  `assemble` reconstructs every part exactly. Pins: chars per kind, the `recorded-input` and `unknown` totals, and no
  tripwire metadata in any part.
- **T2 (R-3641) One boundary state machine.** The fixtures cover:
  - a compaction with both the boundary and a compact hook group, in either order: one segment;
  - a compaction with no hook refresh;
  - a hook group with two hooks;
  - tool work continuing after an auto compaction before any owner turn: phase `turn`;
  - `/clear`, and `resume`.

  Pins: segment count, each segment's start kind, and phase per part.
- **T3 (R-3642) Sessions, forks and skips.** The fixtures cover:
  - a resume copy and a fork that repeat a prefix in another file: inherited chars are separate, corpus totals
    count each uuid once, and the fork is its own session;
  - files enumerated in two orders: identical report;
  - a `-wt-` folder, an other-project folder, `isSidechain` entries and a torn line: each counted by reason through the
    observation options.

  Pins: per-session new and inherited chars, order invariance, and each skip count.
- **T4 (R-3643) Hook and queued-prompt identity.** The fixtures cover:
  - a raw hook output with its additional context: one delivery;
  - a JSON envelope with `additionalContext`: one delivery;
  - two identical invocations in different windows: two deliveries and one repeated delivery;
  - changed hook output across segments;
  - a queued prompt that is delivered later: one owner turn;
  - a queued prompt that never reappears: `queued-unmatched`;
  - two identical owner prompts: two turns;
  - an unresolvable pair: `ambiguous`.

  Pins: each count.
- **T5 (R-3644) What the seat reads for itself.** The fixture tool calls cover:
  - `Read`, `Grep`, `Glob` and `Bash` reads, which classify by target class;
  - a memory-folder read: `memory`;
  - `Agent`: `delegation`; `WebFetch`: `web`; `Skill`: `skill`; `Edit`: `write`; an unknown tool: `other`;
  - a piped shell read, which splits as the builder's does.

  Pins: count and result chars per class, and conservation (class chars sum to total result chars). The builder's
  existing `pullsOf` tests pass unchanged.
- **T6 (R-3645) Kind totals and three repeat measures.** A fixture holds a 24k-char opaque tools listing and a
  normalized duplicate whose raw length changes (another cwd). `report` gives:
  - kind totals that include glue and oversize text;
  - **repeated delivery**: the chars of a slot identity (kind plus hook invocation or file path) delivered again in a
    later segment;
  - **exact duplicate text**: chars of byte-identical payloads after the first;
  - **normalized duplicate units**: the count of units equal after `normalize`.

  Pins: the three numbers and the kind totals, each with its named denominator.
- **T7 (R-3646) Corrections per session.** `report --corrections` runs on the real candidate shapes and
  on a labels file. The candidate shapes include paired evidence `#owner+paired`, AskUserQuestion evidence, duplicate
  evidence and two conflicting kinds on one turn. The labels file includes `none` rows. Per session, the report gives:
  - owner turns, from the imported `ownerTurn`;
  - corrections, decisions and `none`;
  - `unlabelled`, `conflict`, `structured-answers`, `outside` and `missing-turn`;
  - the source tag, `labelled` or `estimated`.

  A malformed row is refused with a fixed diagnostic. Pins: every count for both inputs.
- **T8 (R-3647) Seat output stays private on every path.** Tripwires go into every payload, metadata field, session
  id, cwd, evidence pointer, rule-file name outside the list, tool target and stub-runner failure text. The following
  print none of them on stdout or stderr: `segment`, `report` (plain, `--labels`, `--corrections`), `sample`, `agree`,
  `label` (progress and failure) and `assemble`. `segment` refuses an output folder inside a git checkout before
  reading any transcript. Pins: no tripwire, ids of the form `seat-<n>:s<m>`, and the fixed refusal text.
- **T9 (R-3648) Reuse, builder regression and the adapter contract.**
  - On the seat store, `label` with a stub runner labels each distinct non-oversize unit once, and
    `report --labels`, `sample` and `assemble` run.
  - On the existing builder fixture, `segment` (default `pi:builder`), plain `report` and `report --labels` give the
    same output as `main` apart from the added `role` field. This is golden JSON recorded from main at build 1.
  - A synthetic third adapter registered in the test (`fake:planner`) returning the contract shape goes through
    `report` and the `slots` block with no other code change.

  Pins: the labelled distinct count, builder output equality, and the fake adapter's report.

Nine tests (the brief said about eight); rows map T1 to T9 onto R-3640 to R-3648 in
order. Expected changes to existing tests (a forecast, not a limit): none. `anatomy.test.mjs` and
`anatomy-labels.test.mjs` already pin oversize exclusion and duplicate output, so they must pass unchanged. No test
pins FEAT-042's label text. `docs/code-map.md` and `docs/requirements-tree.md` regenerate; historical review files
stay as they are.

## Files to change

New:
- `apps/bench/lib/anatomy-seat.mjs`
- `apps/bench/lib/anatomy-slots.mjs`
- `apps/bench/test/anatomy-seat.test.mjs`

Edited:
- `apps/bench/lib/anatomy-config.mjs`
- `apps/bench/lib/anatomy-pulls.mjs`
- `apps/bench/lib/anatomy.mjs`
- `apps/bench/anatomy.mjs` (header inputs)
- `packages/nana-pack/lib/memory-making.mjs` (export `ownerTurn`)
- `packages/nana-pack/lib/memory-score.mjs` (export `rows`)
- `packages/nana-pack/lib/claude-transcript.mjs` (default-off observers)
- `apps/bench/README.md`
- `REQUIREMENTS.md`

Regenerated: `docs/code-map.md`, `docs/requirements-tree.md`.

## Cost

Build and review: no model spend beyond the builder and reviewer. The seat steps below are free: local reads, counts
only.

Later, outside this lane, optional labelling of system-supplied seat kinds is an inference and has not been measured.
The builder store's 11,019 units cost USD 16.50, about USD 1.50 per 1,000. That puts roughly 3,000 to 6,000 distinct
system-supplied units at USD 5 to 9, plus about USD 2 for an agreement sheet.

## Seat steps (after build 1, before the final round; counts only, after the identity scan)

1. Run `segment --role seat` over the nana-pi Claude project folder, then `report --corrections` with the memory
   labels file, and the candidates file if no labels exist. Commit `seat-counts.md` in this lane with these sections:
   - kinds by start and session, with delivery class and coverage;
   - the three repeat measures;
   - reads by class;
   - corrections per session, with source tag;
   - sessions, forks, skips, exclusions and `ambiguous` rows.

   No excerpt and no session id appear in it.
2. On one live seat session, run Claude Code's `/context` and set its category shares beside this report's start-kind
   shares for that session. `seat-counts.md` prints both columns and lists every category over the 5-point gap, with
   the sentence "recorded payload is not delivered context". The gap is a finding, not a correction.

## Disposition of the attack

1. MUST, recorded versus sent: **taken.** There is a new "What the numbers can and cannot claim" section. Each kind
   carries a delivery class, and `unknown` stays out of the headline. Coverage is reported. `/context` is a seat-step
   diagnostic whose mismatch is printed (A1, T1, seat step 2).
2. MUST, phantom starts: **taken.** One coalescing state machine, with phase independent of owner turns (A2, T2).
3. MUST, resume and fork accounting: **taken.** Files, logical sessions and inheritance are separate, with ownership
   by earliest timestamp, order invariance and private aliases (A3, T3).
4. MUST, event identity: **taken.** Correlation is by invocation, window and queued identity, and ambiguous cases are
   reported (A4, T4).
5. MUST, correction joins: **taken.** Evidence normalizes to an owner-turn key. Conflicts, `none` versus unlabelled,
   structured answers and the estimated or labelled tags are all handled. memory-score's reader is used and
   outcome-score's dropped (A10, T7).
6. MUST, kind shares versus the reporter: **taken.** Kind totals cover all payload, glue and oversize included. There
   are three named repeat measures (A11, T6).
7. MUST, invisible skips: **taken.** Default-off observers on the shared walker and stream, with no second parser.
   Subagent files are an honestly narrowed denominator (A5, T3).
8. MUST, privacy on the real-transcript path: **taken.** No raw transcript in the harness, and fixtures come from
   shape only. Safe ids are built into the store, so every reporter is covered. Tripwires cover metadata, evidence and
   runner failures (A8, A12, T8).
9. SHOULD, role versus runtime: **taken.** The registry is keyed `runtime:role` under one contract, with a fake
   adapter contract test. The later `pi:seat` move of the system-section loop is named. T5 asserts observable classes
   and conservation (O2, A6, T5, T9).
10. SHOULD, builder-drop overlap: **taken.** The ownership table names each shared function. `CLASS_FUNCTION` is left
    unchanged, and builder plain and labelled report and extraction regression run on the merged tip (T9).
11. NOTE, label-text test: **kept.** The forecast stays "no label-text test change". Shared-report regression is
    covered by T9, and historical files are left unchanged.
12. SHOULD, deliverable and labelling: **taken.** The counts-only baseline is committed in this lane before the final
    round. Labelling is a separate optional run outside the lane. The privacy question is now marked hard to undo, and
    its default sends no owner text.

## Owner questions — decided by the seat with an astra consult (2026-11-02)

The owner, away until 07:00 EST, said: "make your best judgment and then consult with pi Astra when you need me". The seat asked astra (pi, gpt-6-astra, read-only); see `owner-consult-question.md` and `owner-consult-astra.md`. Both concern the optional later labelling run, outside this lane, which sends nothing. Decisions: (1) the later run may send the owner's turns and memory files to the same provider the seat already uses, on the precedent of the owner's "yes profile records get sent as well"; this is a delegated decision on precedent, not a new owner yes, and the owner can reverse it at 07:00 before any run; (2) a role-neutral label prompt with its own sealed hash and a fresh seat agreement sheet before shares are read.
