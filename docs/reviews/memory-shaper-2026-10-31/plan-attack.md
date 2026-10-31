# Plan attack — memory-shaper

Adversary pass over `plan.md` in this folder, before the build. Read: the plan, the seat's factory design, memory-making's code on `origin/feat/memory-making` (`memory-making.mjs`, `memory-making-config.mjs`, `memory-score.mjs`, `claude-transcript.mjs`), the private scoring folder's two scripts (enumerator and labeller; code only, no label, turn or candidate file opened), `apps/bench/lib/usage.mjs`, `apps/bench/lib/catch-judge.mjs`, `piLaunch`, pi 1.0.2 `--help` and its `cli.md`, `json.md`, `configuration.md`, `settings.md`, and `claude --help`. Two counts-only scripts ran over the transcripts in scope (they print numbers, no text). No model was called.

Measured facts used below (counts only, 2026-10-31):

- In-scope owner turns: 573 (329 in worktree folders, 244 in the main project folder). Worktree turns with seat text before them: 0. Main turns with seat text before them: 233. So the pre-filter sends 233 turns and drops 340, as A2 says.
- Owner turn ids present in more than one transcript file: 0.
- Owner turns whose only earlier assistant entries in the file carry no text (tool-use only): 3.
- Sent turns longer than 4000 characters: 1.
- The labeller writes a label on **both** the substantial and the question pointer of every turn (the kind on the primary, `none` on the other), and on the last-seat fallback only when both are absent. So a correction/decision mix-up scores as a false candidate, not an unlabelled one. A3 is right on that point.
- The labeller assigns kinds by turn index over the enumerator's file order; the enumerator has no date or time cutoff and reads reviews from the main checkout's `docs/reviews` as it stood at labelling time (main tip e5db630e, working tree clean but for `.memory/`).
- Transcript files in scope newer than the labelling run: the seat's own live session is one of them and is still growing.
- pi on this machine has credentials for `openai-codex` only (`~/.pi/agent/auth.json` keys). No Anthropic provider is configured in pi.
- Claude Code's `cleanupPeriodDays` is unset (default 30 days). The oldest in-scope transcript's mtime is 2026-10-04.

---

## MUST

### M1. The scored input set is not frozen; new turns and new review titles make the run unscored and send it to the wrong place

Failing case: the labels cover every turn the enumerator saw at labelling time, with no time cutoff. `memory:shape` walks the live transcript folders and the live main checkout's `docs/reviews`. Between labelling and the seat's run:

- the seat's own session keeps receiving owner turns (the owner's answer to this plan's question is one), each with seat text before it, so each passes the pre-filter and goes to the model;
- memory-making must land before this lane builds, which adds its lane folder to main's `docs/reviews`; its final review file, and any review file of owner-profile or context-anatomy that lands meanwhile, adds MUST titles.

Any of those classified non-`none` has no label, `scoreMemory` prints `unscored: unlabelled candidates`, and the plan routes that to the builder as a pairing bug ("Any `unlabelled` count > 0 means the pointer pairing is wrong"). The builder cannot fix it; the run is never scorable. It also spends model calls on owner text from after the labelling, which the owner was never asked about in the scoring context.

The other direction also fails: transcripts older than 30 days are deleted by Claude Code's default cleanup. The oldest in-scope file passes 30 days on 2026-11-03. A run after that loses labelled turns; their labels stay in the recall denominators, so the shaper's recall drops for a reason the rule baseline never paid.

Fix:
- Freeze reviews: the seat runs with `--reviews <private snapshot>` made by `git archive e5db630e docs/reviews` (the tree the labels saw). The pointer form `review:<lane>/<file>#<i>` does not include the root, so the labels still match.
- Freeze transcripts by time: add an `--until <ISO instant>` flag that drops owner turns (and ask pairs) whose entry timestamp is after the instant while still updating pairing state from every earlier entry. The seat passes the enumerator's run time. Pin it in must-meet 3 (a turn one second after the instant reaches no prompt and yields no candidate). Alternative with no new flag: copy the in-scope project folders into a private snapshot now and pass `--root`; this misses nothing only if done before 2026-11-03 and it cannot remove turns already appended since labelling, so the time flag is still needed.
- Before scoring, the seat checks the shaper's unit counts (sent + skipped turns, asks, review titles) against the enumerator's printed counts; a mismatch is an input problem, not a pairing bug. Change the "goes back to the builder" sentence to say so.

### M2. The bar drops lessons, so a shaper that calls every review title `none` passes and "replaces the rule maker"

Failing case: the bar is correction recall, decision recall, precision, zero unlabelled, zero unsent. Lesson recall is not in it. The rule maker emits every distinct MUST title and gets lesson recall 56/56 with poor precision. A shaper that answers `none` to all review titles loses all 56 lessons, raises precision (fewer false lessons) and passes the bar. The plan then makes it the storing lane's input, silently dropping the worker type.

Fix: add lesson recall to the bar (≥ 0.70, chosen, same provenance), or keep review titles on the rule path and send only owner turns to the model (which also removes M3's mixed-batch problem and about 140 units of spend). Pick one in the plan; do not leave lessons as a reading only.

### M3. A kind that is invalid for the unit's source is accepted and produces a malformed candidate

Failing case: A6 validates "each kind in the four-word list". A batch mixes owner turns and review titles. The model answers `lesson` for an owner turn or `decision` for a review title. Both pass A6. The shaper then builds a `lesson` with a `claude-code:` pointer (or a user `decision` with a `review:` pointer and user roles). The pointer is labelled, so it scores as a false candidate rather than being caught, and the station 2 record has the wrong `type` and `roles` for its source.

Fix: the allowed kinds depend on the unit's source: owner turn → `correction | decision | none`; review title → `lesson | none`. A reply outside that set rejects the batch (same fail-closed rule). Add the two cases to must-meet 4's batch list. Simpler still: never mix sources in one batch, and give each source its own reply schema.

### M4. The owner question's fallback is false: a Claude model is not "one config value" away

Failing case: "If answered otherwise: the seat swaps the sealed model name before the build (one config value), for example to a Claude model". pi here has `openai-codex` credentials only, so `pi --model <claude model>` fails at the first call. The Claude route is a different runner: `claude -p` with its own flags and its own JSON output, which `parseStream` does not read. If the owner picks Claude after the build, the runner, must-meet 6 and the stream parser are rebuilt.

The privacy trade is also understated. The seat transcripts already go to Anthropic, so a Claude model behind an isolated `claude -p` adds no new provider. `gpt-6-luna` through `openai-codex` sends raw owner turns (which may name people and the owner's work, which the public repo is barred from carrying) to a second provider. Whether that provider may keep or train on it depends on the account's data settings (inferred; not checked). The plan's case for Luna, "another lineage than the labelling agent", is a real reason (correlated judgement between a Claude labeller and a Claude shaper could flatter the scores), but it is a measurement trade, while the exposure is irreversible.

Fix: make the runner provider-neutral at the injection point the plan already has, and build both real runners, or flip the default to the no-new-exposure route and build that one:
- Claude route, following `apps/bench/lib/catch-judge.mjs` (the plan's named precedent): `claude -p --model <sealed> --output-format json --json-schema <reply schema> --tools "" --strict-mcp-config --no-session-persistence --setting-sources "" --system-prompt <sealed>`, prompt on stdin, cwd the OS temp folder, `--max-budget-usd <sealed>` as a hard per-call stop. `--setting-sources ""` keeps the user's Claude Code hooks (knowledge pull, shared memory) from running on owner text; `--no-session-persistence` keeps the prompt out of `~/.claude/projects`. Do not use `--bare` (it refuses OAuth and needs an API key).
- Rewrite the question with the true trade: privacy (no new provider) against label correlation (same lineage as the labeller), and state that the default is the owner's to change only before the build. Keep the label `blocking`.

### M5. "No seat text" vs "no seat entry" is ambiguous, and the wrong reading emits unlabelled pointers

Failing case: Purpose says the pre-filter drops turns with "no seat text before it"; must-meet 3 says "no seat entry". The labeller's `lastSeat` updates only on a non-sidechain entry with a uuid whose `assistantText(e).trim()` is non-empty. Three in-scope owner turns have only tool-use assistant entries before them. A builder who reads "seat entry" as "any assistant entry" sends those three, and pairs them with the tool-only entry's uuid. That pointer has no label (the labeller wrote `+none`), so one non-`none` reply makes the run unscored.

Fix: define a seat entry once, in the plan and the walk, exactly as the labeller does: non-sidechain, non-meta, has a uuid, and `assistantText(entry).trim()` is non-empty. Add a tool-use-only assistant entry before an owner turn to must-meet 2's or 3's fixture and assert it is skipped and counted as skipped.

---

## SHOULD

### S1. Units are not structurally isolated in the prompt; honest owner text can shift reply alignment

Failing case (honest variation, in scope): owner turns and seat context often contain pasted prompts, JSON, Markdown headings, code fences and lines like `unit 7:` or `"kind": "decision"`. If units are concatenated with text headers, a turn that contains a fence or a heading can make the model attribute text to the wrong id, or echo a nested JSON object as its reply. A6 catches a wrong id set but not a swapped claim (unit 3's claim under unit 4's id), which passes validation and writes a claim that does not match its quote.

Fix: send the batch as one JSON array of `{id, owner, context, question}` (or `{id, title}`), with `JSON.stringify` escaping; ids short and local to the batch (`u1`…`u10`), mapped back in code, never the pointer. Start the user prompt with fixed text, never with unit text (pi treats a leading `/` as a slash command in some paths; inferred). Add one fixture unit whose owner text contains a code fence and a fake `{"id": ...}` line to must-meet 4's accepted batch.

### S2. Default `spawnSync` buffer will kill real calls

Failing case: Node's `spawnSync` default `maxBuffer` is 1 MiB. In `--mode json`, every `message_update` (text and thinking deltas) carries a `usage` object (`json.md` line 98), the `message_start` repeats the whole prompt, and `agent_end`/`message_end` repeat the full messages. A 10-unit batch with up to 60 000 characters of input and a few thousand reasoning and reply tokens can pass 1 MiB. The call then fails with `ENOBUFS`, the stream is cut before `message_end`, the usage is lost, and the batch is `unclassified`. Fake-runner tests cannot see this.

Fix: seal the buffer size as a tunable (catch-judge uses 64 MiB) and add a fixture stream over 1 MiB to must-meet 6's parse case. Pipe all three stdio streams; never `inherit` stderr (pi's own error text could carry provider messages); assert the spawn options in must-meet 6.

### S3. Spend accounting has no case for a call whose usage is unknown

Failing case: a call killed by the per-call timeout or the buffer limit never reaches `message_end`, so `parseStream` reports zero tokens and zero cost. The running total under-counts, the cap check uses that total, and stdout prints a summed cost that omits the call while claiming it is known. Also, pi reports `cost.total: 0` for an unpriced model, which is indistinguishable from "priced at zero" unless checked.

Fix: count a call as `usage unknown` when the stream did not settle or has no assistant `message_end`; print `calls with unknown usage <n>`; print `cost unknown` (and mark the token total as a lower bound) whenever that count is over zero or any call has `totalTokens > 0` with `cost.total === 0`. Use `parseStream`'s `complete`, not `settled` alone (pi exits 0 and settles after an assistant error). Note in the readings that the `openai-codex` price is pi's list price; the subscription's real cost differs.

### S4. The prompt is seat-written after the seat studied the misses; the blindness residual says the opposite

Failing case: the residual says the seat "writes no prompt text", but the plan's kind definitions are the prompt's core and are written by the seat after the rule run's miss analysis. "Redirects work the seat is doing" and must-meet 1's "long redirect with no cue word" describe the rules' miss pattern. Separately, the labelling agent used its own kind definitions (memory-making plan, line 27), which this plan does not cite. If the shaper's definitions differ from the labeller's, the score measures definition drift as much as the model.

Fix: carry the labelling agent's kind definitions verbatim (they hold no owner text) as the prompt's definitions, and record that in the plan. Any extra wording is disclosed as seat-written after the miss analysis. Also record the sealed prompt hash and every sealed value in the lane folder before the first scored run; the final reviewer checks the landing tip's hash against that record, so a post-score edit cannot slip in through a review round.

### S5. The private helper `shape` must move, and the plan's Precedent does not name it

The shaper needs memory-making's record builder with the model's claim. `shape(type, kind, rawQuote, rawContext, evidence, date)` is private and derives the claim from the rule forms, so it cannot be imported as is. Its siblings `ownerTurn`, `askCalls`, `askAnswer`, `sourceFiles`, `inWindow`, `textOnly`, `words` are private too; the walk move covers them only if the exported generator yields everything the shaper needs (owner text, seat texts for all three pointer candidates, the ask pair, the day). The 2026-10-22 ruling requires the Precedent section to name each helper move.

Fix: Precedent names exporting `shape` with an optional claim override (or a split into `shapeRecord(…, claim)` plus the rule claim form), so the shaper imports it instead of rebuilding the field list. Also state which stored `context` the shaper writes: `shape` head-cuts context at `CLAIM_CAP` through `displayText`, while A5 says the model sees a tail cut; a head cut drops the question that sits at the end. Pick tail for the stored context and say so.

### S6. Must-meet 2 contradicts itself, and its fixture labels restate the implementation

Failing case: the same fixture turn is called `correction` in run one and `decision` in run two, and the test expects full recall from one labels file in both. One labels file has one kind for that turn, so one run cannot reach full recall. A builder resolves this by building the labels file in the test from the shaper's own pairing code, which then passes by construction.

Fix: hand-write the fixture labels file in the labeller's form (primary pointer with the kind, the other of substantial and question with `none`, fallback only when both are absent), as memory-making's `fixtures/memory-making/labels.jsonl` does. Assert `unlabelled 0` in both runs, full recall in the run whose kinds match the labels, and one false candidate (not unlabelled) in the other.

### S7. Land condition against the bar is unstated

Failing case: all six must-meets pass on synthetic fixtures whatever the real score is. The plan schedules the comparison "after build 1" but never says whether the lane lands when the shaper misses the bar. As written, the lane can land a shaper that is worse than the rules, and the storing lane's input decision is made elsewhere.

Fix: one sentence: the lane lands either way (the tool is the experiment), the comparison counts go in the lane folder before the final round, and the "replaces the rule maker" switch is a separate decision recorded with those counts. Or: the lane lands only over the bar. Either is fine; say which.

### S8. Validate the real pi launch once on synthetic text before any owner text is sent

pi 1.0.2 has every flag must-meet 6 lists (`--mode json`, `--no-session`, `--no-tools`, `--no-extensions`, `--no-skills`, `--no-prompt-templates`, `--no-context-files`, `--system-prompt`, `--thinking`, `--model`), and `--no-extensions` also disables configured packages and built-ins (`cli.md`, `settings.md`). Not verified: that stdin alone, with no message argument, becomes the prompt in `--mode json` (the docs say piped stdin is prepended to the first prompt; inferred that it stands alone). If it does not, every call fails or runs an empty prompt.

Fix: the seat runs one canary call on a synthetic batch (fixture text) before the real run and checks that the reply parses and usage is non-zero. Add `--offline` only if startup network calls cause failures; it is not needed for isolation.

---

## NOTE

### N1. Duplicate owner turns across files: none today

Measured 0 owner turn ids in more than one file. The enumerator keeps the first file's pairing; the rule maker does not dedupe. If a resumed or forked session ever copies entries, the shaper would pay twice and may pair differently. Cheap guard: dedupe by `<session>#<uuid>`, first file in `transcriptFiles` order wins.

### N2. Batch-level rejection costs recall on one bad unit

One empty claim rejects ten units. That is a chosen trade (deterministic, simple). The readings already count `unclassified`; if that count is large in either run, report it beside recall so a low score is not read as model judgement.

### N3. Sealed values the plan does not list

Provider name (if the model name does not carry it), the spawn buffer size (S2), the per-call dollar cap if the Claude route is taken (M4), the fence-strip pattern, the per-source allowed kinds (M3), and the fixed stdout words (`unsent`, `unclassified`, `skipped`, `unscored: spend cap reached`) all belong in `memory-shaping-config.mjs` with provenance. The spend-cap line and the per-source kinds are contract values.

### N4. Nothing but `shaped-candidates.jsonl` should land in `--out`

The pi stream holds the full prompt (`message_start`) and reply. A debugging dump of streams into the private folder would be a second copy of owner text with no mode guarantee. Assert in must-meet 6 that the folder holds only the candidates file (and the pre-existing `candidates.jsonl`) after a run.

### N5. Node's `JSON.parse` error message quotes the input

Since Node 20, `SyntaxError` messages include the start of the parsed text (for example `Unexpected token 'H', "Here is th"... is not valid JSON`). Any path that prints a caught parse error's message leaks reply text. Must-meet 4's prose-around-JSON batch should also assert stderr holds no reply text.

### N6. Threat model

Honest variation in scope is well chosen. Two honest cases belong in it explicitly: owner turns that are themselves pasted prompts or JSON (S1), and inputs that change between labelling and scoring (M1). Deliberate prompt injection stays out, correctly, as a residual for the checking and delivery stations.
