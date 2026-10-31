# Plan — memory-making

Lane: memory-making · branch `feat/memory-making` from main e5db630e · worktree `~/nana-pi-wt/memory-making`
Grounding: the seat's private memory research (factory design, idea catalogue stations 1 and 2, prior-art surveys, the hand split of 119 memory entries), kept outside the repo because parts quote the owner. The parked lessons-flow plan and replay (branch `feat/lessons-flow`, `docs/reviews/lessons-flow-2026-10-31/`) ground the review source. The adversary's findings are in `plan-attack.md` in this folder; this plan is revised to take them (see the last section).

Lane class: `node scripts/lane-class.mjs --root . --files packages/nana-pack/lib/claude-transcript.mjs,packages/nana-pack/lib/writing-trial-extractor.mjs,packages/nana-pack/lib/memory-making.mjs,packages/nana-pack/lib/memory-making-config.mjs,packages/nana-pack/lib/memory-score.mjs,scripts/memory-make.mjs,scripts/memory-score.mjs,packages/nana-pack/tests/memory-making.test.mjs,packages/nana-pack/tests/fixtures/memory-making/session.jsonl,package.json,packages/nana-pack/README.md,REQUIREMENTS.md,docs/requirements-tree.md,docs/code-map.md` prints `ordinary`. No hook, pi extension, install step, gate policy or land/review tool is touched. One final reviewer, the roster's.

## Purpose

Agreed reading (the owner, 2026-10-31, paraphrase-safe): a memory factory of six stations that supports context management for every agent; ideas are not dropped for weak evidence, experiments decide; the three first lanes run in parallel. This lane is "Lane B memory-making": station 1 (Making) plus the station 2 shape — an extractor run offline over past sources, emitting shaped candidate records, scored against a labelled set. No delivery yet. Its outputs on real transcripts stay outside the repo.

What this lane builds:

- `npm run memory:make` — reads two sources and writes shaped candidate records to a private folder outside any git checkout:
  - This repo's Claude Code seat transcripts → **user** candidates: owner turns that correct the seat (kind `correction`), short owner answers to a seat question (kind `decision`), and answered `AskUserQuestion` calls (kind `decision`).
  - This repo's review folders → **worker** candidates: MUST finding titles from reviewer output files (kind `lesson`), one per distinct title per lane.
  - By default it reads only this repo's own Claude project folder and its worktree folders, and this repo's `docs/reviews/`. Any other project needs an explicit `--project <key>` flag, so owner work sessions are never read by default.
- Every candidate carries the station 2 shape: `id`, `type` (`worker` | `user`), `kind`, `claim`, `quote` (the owner text or review title verbatim, capped), `context` (the seat text it answers or corrects; empty for reviews), `evidence` (a pointer a machine can resolve back to every source text the claim was cut from), `date`, `trust` (always `low`), `source` (always `extracted`), `roles`, `validFrom`, `invalidAt` (null), `supersedes` (empty).
- `npm run memory:score` — compares a candidates file with a labels file (both outside the repo) by evidence pointer and kind, and prints recall per kind, precision over all candidates, the false rate per owner turn, and the unlabelled-candidate count. Counts only.

Model call or rules: **rules.** Extraction is deterministic: a sealed cue vocabulary for corrections, a sealed question pattern for decisions, the structured `AskUserQuestion` pairs, and the existing `mustTitlesOf` reader for reviews. Reasons: zero model spend; deterministic tests; and the rule run sets the baseline any model variant must beat, which is what "experiments decide" needs. A model-call shaper is the next lane only if the seat's scoring run misses the bar below.

How a builder runs it without spending: the builder never reads real transcripts or real labels. Every test uses synthetic fixtures under `packages/nana-pack/tests/fixtures/memory-making/`. No model is called anywhere in the lane. The real run is the seat's, after the build: local file reads, no tokens.

The seat's scoring run (after build 1, outside the repo, counts only into the lane folder):

- Labelled set: the seat has an agent label **every** owner turn in the scored window (correction, decision or none), outside the repo. The labelling agent's prompt holds only the turn texts, the seat context before each, and the kind definitions. It never sees the cue vocabulary, the question pattern or the candidates.
- Frozen vocabulary: the cue vocabulary and question pattern are sealed in the reviewed build tip before any label exists. The scoring run uses that tip unchanged. The seat may not edit either from what the labels show inside this lane. A later change to them is scored only on owner turns dated after this lane's label date, so the tuned rules are never scored on the turns that tuned them.
- Bar (chosen, from the idea catalogue's G2 experiment, not measured): recall of labelled corrections and decisions ≥ 0.70 each, precision over all candidates ≥ 0.80, and zero unlabelled candidates. With any unlabelled candidate the run is unscored, not passed. Per-session counts are a reading only. Under the bar, the seat plans the model-shaper lane against the same labels. Over it, rules stand.
- Readings beside the numbers: recall on the hand split's anchored corrections and decisions as a separate figure (they were chosen because the seat already noticed them); a usability count, out of 20 sampled hits, of claims a reader could act on without opening the transcript; the count of claims cut at the claim cap; how many of the hand split's 35 corrections and decisions still have a surviving transcript.
- Worker candidates from reviews get a reading, not a bar: the lessons-flow replay found 2 real repeat hits in 60 lanes from MUST titles. The seat reports the count and a 20-sample read that counts how many titles state a rule another lane could follow.

## Assumptions

- A1. Two sources only: this repo's Claude Code transcripts and review folders. pi sessions, land records, CI records and known-bug lines are later lanes (see Left for later). Known-bug lines already reach planners and builders, so making candidates from them adds no new reader yet.
- A2. The record shape here is the *candidate* shape. Lane owner-profile adds the stored user-facing record as a subgroup under this lane's feature. The seat makes owner-profile import field names, including `quote`, from `memory-making-config.mjs` (or the reverse, whichever lands first), so the two lanes do not define two shapes.
- A3. All candidates start `trust: low, source: extracted` (seat decision in the factory design). Nothing in this lane raises trust.
- A4. Roles are a sealed first guess per source: owner-turn candidates serve `seat`; review candidates serve `planner`, `builder` and `reviewer`. A later delivery lane tunes them from use logs (lane context-anatomy's baseline).
- A5. Default scope (seat decision): the Claude project folder whose name is `projectKey(<repo root>)` and every folder whose name starts with `projectKey(<repo root>-wt)` followed by `-`, using `packages/nana-setup/lib/project-key.mjs`. Inferred, not checked: a headless builder session in a worktree folder has no `origin.kind: "human"` turn, so the owner-turn rule (A6) yields nothing from it. The seat checks the worktree-folder candidate count in the scoring run.
- A6. Owner turns: a `type: "user"` entry that is not a tool result, not `isMeta`, not sidechain and not `isCompactSummary`. When `origin` is present it must read `origin.kind === "human"`; task notifications carry `origin.kind: "task-notification"`. Only when `origin` is absent (older runtime versions) does the sealed wrapper-tag list decide (command, system-reminder, task-notification wrappers, interrupted-request markers). Owner text is only `type: "text"` parts, or a string `content`; image parts and tool-result parts never enter a claim.
- A7. Decision question source: the last sentence ending in `?`, or a `YOUR CALL` block, in any seat text entry **since the previous owner turn** — not the adjacent entry, because notifications and seat status replies usually sit between. With none, a short answer yields no decision. `AskUserQuestion`: each answered tool_use/tool_result pair yields one decision whose claim is the chosen option with its question.
- A8. Correction context: the last seat text block since the previous owner turn with at least the sealed minimum word count (status replies to notifications are shorter). Its last sentence goes into `context` and the claim.
- A9. Evidence pointers: owner candidates point at both entries, `claude-code:<sessionId>#<ownerUuid>+<seatUuid>` (for `AskUserQuestion`, `#<resultUuid>+<toolUseUuid>`); `resolveEvidence` returns both texts. Review candidates point at `review:<path relative to the reviews root>#<index of the title in mustTitlesOf>`.
- A10. Transcript expiry (residual): Claude Code deletes transcripts after about 30 days by default (inferred; no `cleanupPeriodDays` is set), so `claude-code:` pointers go `missing` within a month. The `quote` and `context` fields keep each candidate readable after its transcript is gone. Re-verification of user candidates therefore checks the quote, not the transcript, after expiry; that is the checking station's job.
- A11. Dates: each owner turn is filtered and dated by its own timestamp, not the session's first one (sessions here span up to 12 days). The day uses the timezone the writing-trial extractor already uses, moved with `edtDay` to the shared module and sealed there as a named tunable with its provenance.
- A12. Review files: reviewer outputs only. The sealed exclusion pattern drops `plan*.md`, `*-plan-*`, `sol-plan-*`, `plan-attack*`, `must-meet*`, `*brief*`, `*report*`, `factcheck-*`, `tree-movement.md`, `CHANGE.md` and build notes. Identical titles in one lane folder collapse to one candidate (confirmation rounds restate round-1 titles).
- A13. Review MUST titles inherit `mustTitlesOf`'s known loss (about 19% bare labels such as `M1.`; pre-2026-10-13 severity-form reviews yield nothing). The lessons-flow label strip is parked; this lane does not fix it. A MUST title names one lane's defect, not a rule; the worker side stays a reading.
- A14. Privacy: candidates hold owner text. The maker resolves the realpath of the `--out` folder's nearest existing ancestor and refuses when that realpath sits inside any git checkout. It refuses an `--out` folder that is itself a symlink, naming that component (macOS `/tmp` and `/var` are symlinks, so it resolves them instead of refusing them). It creates the folder 0700 and the file 0600. stdout and stderr carry counts and fixed messages only, never claim, quote, context or label text, on success and on failure. The labels file is equally private.
- A15. No delivery, no store, no migration of today's memory files, no dedup across runs, no repeat counting, no automatic trigger. The seat runs both commands by hand.
- A16. New requirement rows and the artifact entry take the next free IDs at build time; a parallel lane landing first may shift them. Feature IDs are fixed by the seat: this lane FEAT-040, context-anatomy FEAT-041.

## Open choices

- O1. Correction cue vocabulary: the builder seeds it with generic English cues (a leading "no", "I thought", "again", "why did you", "don't", "stop", repeated question marks and similar) in `memory-making-config.mjs`, provenance `chosen`. It holds no owner quote and no owner word. It is frozen once the seat starts labelling (Purpose).
- O2. The short-answer word cap, the correction-context minimum word count and the question pattern's exact form. All sealed in config.
- O3. Transcript reads: transcripts run to about 130 MB. The builder streams lines, keeping the torn-line rule.
- O4. Candidate `id`: a content hash of evidence pointer plus claim, so a re-run produces the same ids. Exact hash and length are the builder's.
- O5. Output form: one JSONL file in the out folder. One file per record is station 3's call, not this lane's.

## Questions for the owner

None.

The seat fixed the feature: this lane owns FEAT-040 "Make and keep memory" under CAP-01, owner-profile adds a subgroup under it, and context-anatomy takes FEAT-041.

## Feature

Feature: FEAT-040 · Make and keep memory

(New under CAP-01. Purpose line for the new heading: "Turn past sessions and reviews into shaped, low-trust memory records that point back to their evidence, and keep them." Status: active.)

## Threat model

In scope: honest variation in our own tools' output. Claude Code transcripts in every entry shape the runtime writes (torn last lines, attachments, tool results, image parts, sidechains, compaction summaries, task notifications with and without `origin`, queued owner turns, content as string or part array, missing timestamps, sessions spanning many days, files up to about 130 MB); review files in the many shapes `mustTitlesOf` already handles, including confirmation rounds that restate titles; lane folders without dates; odd characters and control codes in owner text; macOS temp folders reached through symlinks; labels that point at turns no candidate covers.

Out of scope: deliberate forgery — someone planting a transcript or review file to inject a memory, a symlink swapped under the out folder during a run, or a label file built to game the score. Memory poisoning matters once records are delivered to agents; it belongs to the delivery and checking lanes. A finding outside this model is a residual and becomes a known bug.

Public-repo rule: no owner text, quote, name or real transcript fragment enters any repo file. Fixtures are synthetic. The maker's and scorer's stdout and stderr carry counts and fixed messages only, so the seat can paste them into the lane folder.

## Precedent

- `packages/nana-pack/lib/writing-trial-extractor.mjs` — the nearest code: reads Claude Code transcripts (torn-line skip, sidechain filter, project-folder walk) and writes a private output folder with 0700 folder and 0600 files (`preserve`). **Helper move:** the module-private `entriesIn`, `textFrom` and `edtDay` (its timezone becoming a named, sealed constant there) and the private-folder creation inside `preserve` move to a new shared `packages/nana-pack/lib/claude-transcript.mjs`, together with the exported `transcriptFiles`. The extractor imports them and keeps its exports and behaviour. The memory maker does not use `textFrom` for owner text (it pulls tool ids and image bytes from part arrays, A6). `packages/nana-pack/tests/writing-trial-extractor.test.mjs` and `packages/nana-setup/tests/writing-rule.test.mjs` (the two callers map impact names) stay green unchanged.
- `packages/nana-setup/lib/project-key.mjs` — `projectKey` reproduces Claude Code's project folder name. Import it for the default scope (A5); do not re-derive the key.
- `packages/nana-pack/lib/review-findings.mjs` — `mustTitlesOf` and `verdictWordOf`. Import; do not copy the rules. Map impact: callers are `review-timeline.mjs` and its test; this lane does not edit the module.
- `packages/nana-pack/lib/display.mjs` — `displayText` for capped, control-free claim, quote and context text. Import.
- `packages/nana-pack/lib/bounded-read.mjs` — `readBounded` for review files. Import. Transcripts stream (O3).
- `scripts/code-search.mjs` and `scripts/code-search-config.mjs` — the seat-run npm script with a sealed, provenance-carrying config. Follow the npm-script form (`map:search`) and the config file shape; the lane's config lives in the pack lib because both lib modules read it.
- `scripts/ci-records.mjs` and `scripts/known-bugs.mjs` — scripts importing pack lib that print counts for the seat. Follow their counts-only output.
- `packages/nana-knowledge/lib/sources.ts` and `packages/nana-knowledge/lib/parse.ts` — the knowledge pull's reader of markdown memory stores, and its recorded reason for excluding review corpora from the pull (reviewer prose about changed code dominated early queries). Not imported in this lane. It is the reader a later delivery lane builds on, and its review exclusion is why review candidates start low and are not delivered here.
- `packages/nana-pack/lib/land-records.mjs` and `packages/nana-pack/lib/ci-records.mjs` — not read in this lane (A1); named as the readers the land and CI sources will use later.

map:search results taken: "read claude code transcript jsonl" returned `writing-trial-extractor.mjs` (taken as the main precedent above) and the bench JSONL readers (skipped: pi event streams, not transcripts). "parse pi session transcript" returned `apps/desk/pi-session.mjs` (pi's own session parser; noted for the later pi-session source, skipped now) and pointed through `doctor.mjs` to `project-key.mjs` (taken). "land record" and "CI run records" returned `land-records.mjs`, `ci-records.mjs`, `land-ci-records.mjs` (later sources). "known bug lines" returned `known-bugs-config.mjs` and `scripts/known-bugs.mjs` (later source; the script's form is followed). "review findings MUST titles" returned `review-findings.mjs` (taken). "memory record extraction" returned the shared-memory hook and its config (delivery side; skipped). "offline scoring against labelled set" and "model call pi print mode" returned nothing that scores labels; `apps/bench/lib/usage.mjs` is noted for a later model-shaper lane's spend accounting.

Expected file changes (a forecast, not a limit): new `packages/nana-pack/lib/claude-transcript.mjs`, `packages/nana-pack/lib/memory-making.mjs`, `packages/nana-pack/lib/memory-making-config.mjs`, `packages/nana-pack/lib/memory-score.mjs`, `scripts/memory-make.mjs`, `scripts/memory-score.mjs`, `packages/nana-pack/tests/memory-making.test.mjs`, fixtures under `packages/nana-pack/tests/fixtures/memory-making/`; edits to `packages/nana-pack/lib/writing-trial-extractor.mjs` (imports only), `package.json` (`memory:make`, `memory:score`), the pack README command list, `REQUIREMENTS.md` (new FEAT-040 heading, rows, one artifact entry and its read line), `docs/requirements-tree.md` and `docs/code-map.md` (regenerated).

Artifact entry (ruling 2026-10-22): the candidates file is a produced artifact. One `Artifact:` line names it as a user-home store at the `--out` folder the seat names, made by the seat running `npm run memory:make` by hand, with one `Read by:` code line naming `packages/nana-pack/lib/memory-score.mjs`.

## Outside precedent

- mem0ai/mem0 (Apache-2.0; licence read from the GitHub API on 2026-10-31) — borrow. Mem0 splits memory writing into an extraction phase that emits candidate facts and a later update phase that picks ADD, UPDATE, DELETE or NOOP against similar stored facts. This lane builds only the candidate phase, with evidence and low trust attached; the update decision is the upkeep station's. Its model-based extractor is skipped here: rules set the baseline first (see Purpose).
- Other public references: GitHub Copilot's agentic memory (blog, 2026) — every memory carries citations that are checked before use; borrowed as the resolvable `evidence` pointer. LeapLabTHU/ExpeL (Apache-2.0) and noahshinn/reflexion (MIT) — lessons from failures; the contrastive failed-versus-passed build comparison is a later lane. ace-agent/ace (Apache-2.0) — delta bullets with helpful/harmful counters; the counters belong to the checking station.

## Must-meet

Each test gets one new FEAT-040 row. Every assertion that names a tunable imports it from `memory-making-config.mjs` (or the moved timezone from `claude-transcript.mjs`). All inputs are synthetic fixtures.

1. **An owner correction becomes a shaped user candidate with what it corrects.** Fixture session: a seat text block over the context minimum, a task notification, a short seat status reply, then an owner turn (`origin.kind: "human"`) starting with a configured cue, carrying a text part and an image part, timestamped just before midnight in the sealed timezone. `memory:make` writes exactly one candidate with `type: "user"`, `kind: "correction"`, `quote` equal to the text part only, `context` equal to the last sentence of the long seat block (not the status reply), `claim` in the sealed form `<quote> — correcting: <context>`, `evidence: "claude-code:<sessionId>#<ownerUuid>+<seatUuid>"`, `date` equal to the turn's day in the sealed timezone, `trust: "low"`, `source: "extracted"`, `roles: ["seat"]`, `validFrom` equal to `date`, `invalidAt: null`, `supersedes: []`. An owner turn with no cue yields none. Proves the station 2 shape on the user type and a correction a reader can use.
2. **Noise yields nothing.** A fixture holding a tool result, an `isMeta` entry, a sidechain owner turn, a compaction summary, a command wrapper and a system-reminder wrapper with no `origin`, a task notification with `origin.kind: "task-notification"` and a plain-text body, and a torn last line — each containing a correction cue — yields zero candidates and no error. Proves A6.
3. **Decisions carry their question, across notification traffic.** A seat question, then two task-notification turns and two seat status replies, then a short owner reply under the sealed word cap, yields one `decision` whose claim is `<reply> — answering: <question>` with the original question. The same reply with no seat question since the previous owner turn yields none. An answered `AskUserQuestion` pair yields one `decision` whose claim holds the chosen option and its question, with evidence naming both entry uuids. Proves A7 and that decisions are never stored as bare answers.
4. **Review MUSTs become worker candidates from reviewer output only.** Fixture lane folder `docs/reviews/demo-2026-10-01/`: a round-1 review with two MUST titles, a round-2 review restating one of them, a `plan.md` and a `plan-attack.md` each with MUST headings. `memory:make --reviews <root>` yields exactly two candidates with `type: "worker"`, `kind: "lesson"`, `claim` and `quote` equal to the `mustTitlesOf` title, `roles` equal to the sealed review roles, `date: "2026-10-01"`, `trust: "low"`. Proves the worker type, the exclusion pattern and per-lane dedupe.
5. **Every evidence pointer resolves.** `resolveEvidence(pointer, roots)` returns every source text each candidate in tests 1, 3 and 4 was cut from: both the owner text and the seat text for user candidates, the title for review candidates. After the fixture review file changes so the title is gone, it returns `stale`; for a missing session or file it returns `missing`. Proves the pointer is machine-checkable.
6. **Real output stays private.** With `--out` inside a fixture git checkout, `memory:make` exits non-zero with the sealed refusal line and writes nothing. With `--out` whose final folder is a symlink, it refuses and names that component. With `--out` under the realpath of the system temp folder, outside any checkout, it writes the candidates file with mode 0600 in a 0700 folder (mode checks skipped on Windows). Its stdout holds counts by type and kind and the count of claims cut at the cap. On success and on a forced failure, neither stdout nor stderr holds any fixture quote, context or claim text. The writing-trial extractor test stays green unchanged after the helper move. Proves A14.
7. **Default scope is this repo only.** A fixture projects root holds three folders: `projectKey(<fixture repo>)`, `projectKey(<fixture repo>-wt)-lane`, and an unrelated project, each with one cue-bearing owner turn. With no `--project`, `memory:make` yields candidates from the first two only. With `--project <unrelated key>`, it reads that folder. Proves owner work sessions are never read by default.
8. **Scoring prints exact counts over all candidates.** Given a fixture candidates file and a labels file (pointer plus kind, including `none` labels, one positive no candidate covers, one candidate whose pointer matches a label of the other kind, and one candidate with no label), `memory:score` prints exactly, per kind, `<kind>: recall <hit>/<labelled>`; then `precision <hit>/<candidates>`, `false per owner turn <false>/<labelled turns>` and `unlabelled <n>`, with `unscored: unlabelled candidates` when n > 0. A hit needs pointer and kind to match; the wrong-kind pair counts as one miss and one false candidate. Its stdout holds no claim or label text. Proves the scoring run the seat's go/no-go reads.

Sealed tunables, each pinned by one test naming its row: the correction cue vocabulary, the decision question pattern, the short-answer word cap, the correction-context minimum word count, the claim character cap, the correction and decision claim forms, the roles per source, the starting trust and source words, the wrapper-tag list, the review-file exclusion pattern, the day timezone, the candidates file name, and the private-output refusal line.

## Left for later lanes

- A model-call shaper (pi print mode, cheap model, injected runner, spend accounted like `apps/bench/lib/usage.mjs`), only if the rule run misses the bar; scored on the same labels.
- More sources: pi sessions (through pi's own session parser), land records, CI red-to-green pairs, known-bug lines, builder "what surprised me" sections, other projects' sessions by explicit choice, and the contrastive failed-versus-passed review comparison.
- The W/U split of mixed records at the quote/how-to-apply seam.
- Repeat detection and Mem0-style add, update or no-op against a store (upkeep, station 4).
- The store (station 3) and owner-profile's private repo; any migration of today's memory files.
- Trust promotion, expiry and evidence re-checks over time, including quote-based re-checks after transcripts expire (stations 4 and 5).
- Delivery to any role (station 6), after context-anatomy's load logging.
- An automatic trigger (idle, Stop or pre-compaction) instead of the seat's hand run; it would also capture turns before transcript expiry.
- The bare-label strip in MUST titles (parked lessons-flow work).

## Revision after the attack

- MUST, wrong seat turn for decisions: taken. The question source is the last question or `YOUR CALL` block since the previous owner turn (A7); `AskUserQuestion` pairs are read as decisions; test 3 now puts two notifications and two status replies between question and reply, and covers `AskUserQuestion`.
- MUST, per-session false bar blind to unlabelled turns: taken with seat decision 3. Every owner turn in the window is labelled; precision is over all candidates; the bar is precision ≥ 0.80 plus zero unlabelled candidates; per-session counts are a reading. Test 8 prints the unlabelled count and the unscored line.
- MUST, correction with nothing it corrects: taken. Sealed claim form `<quote> — correcting: <context>` with the A8 look-back, pinned in test 1; the scoring run adds a usability count over 20 sampled hits.
- SHOULD, `textFrom` pulls tool ids and image bytes: taken. Owner text is text parts only (A6); `textFrom` moves unchanged for the extractor; test 1 has an image part.
- SHOULD, use `origin.kind`: taken. A6 requires `origin.kind === "human"` when present, wrapper tags only when absent; the wrapper-tag list is sealed; test 2 has an `origin`-tagged notification with a plain body.
- SHOULD, pointers expire in about 30 days: taken. Candidates carry `quote` and `context`; expiry is residual A10; the scoring run reports how many hand-split items still have a transcript.
- SHOULD, decision evidence has two sources: taken. Pointers name both uuids and resolve returns both texts (A9, test 5).
- SHOULD, review exclusion and round double-counting: taken. Wider exclusion pattern and per-lane title dedupe (A12); test 4 adds `plan-attack.md` and a restating round 2 and asserts two candidates.
- SHOULD, timezone and per-turn dates: taken. Per-turn filtering and dating, `edtDay` moves to the shared module with a sealed timezone (A11); test 1 is near midnight.
- SHOULD, growing cues from the scoring labels: taken with seat decision 3. The vocabulary is frozen at the build tip before labelling, the labelling agent never sees it, and any later change is scored only on turns after the label date (Purpose); anchored-item recall is reported separately.
- SHOULD, recall must require a kind match: taken. Test 8 counts a wrong-kind pair as one miss and one false candidate.
- SHOULD, FEAT-040 claimed twice: taken with seat decision 1. This lane owns FEAT-040 "Make and keep memory"; context-anatomy takes FEAT-041; the owner question is dropped.
- NOTE, symlink refusal rejects macOS temp: taken. The maker resolves the nearest existing ancestor's realpath, refuses only a symlinked final folder and names it (A14, test 6).
- NOTE, default project scope reads every project: taken with seat decision 2. Default is this repo's folder and its worktree folders; others need `--project` (A5, test 7).
- NOTE, stderr not covered: taken. Test 6 checks stdout and stderr on success and on a forced failure.
- NOTE, claims cut at the cap: taken. stdout prints the capped-claim count (test 6) and the scoring run reports it.
- NOTE, worker titles are lane-specific: taken. The 20-sample read counts titles that state a rule another lane could follow (Purpose, A13).
- NOTE, lane class and map: no change needed; it confirms `ordinary` and the helper-move callers.
