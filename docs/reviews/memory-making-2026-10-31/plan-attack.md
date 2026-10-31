# Plan attack — memory-making

Adversary pass over `plan.md` before build 1. Grounding: the plan, the factory design (seat scratch), the precedent modules it names, and a structure-only profile of the 11 seat transcripts in the nana-pi Claude Code project folder (entry types, keys, `origin` kinds and counts; no text read into this file). Counts below come from that profile on 2026-10-31.

Transcript facts the findings rely on:

- 11 seat transcript files, one `sessionId` each, sizes up to about 130 MB. One session spans 10-09 to 10-21; another 10-21 to 10-27.
- 246 owner turns carry `origin.kind: "human"`. Every task notification arrives as a `type: "user"` string turn with `origin.kind: "task-notification"` (about 3,800 of them).
- 175 of the 246 owner turns come after at least one task notification since the previous owner turn. Only 24 follow a seat text that ends in a question mark.
- 24 `AskUserQuestion` calls, each with an answered `tool_result`. 6 user entries carry `toolDenialKind`, 1 carries `userFeedback`. 26 image parts sit in user content.
- Oldest surviving transcript starts 10-04. No `cleanupPeriodDays` is set in user settings, so (inferred) Claude Code's 30-day default deletes transcripts.
- Review folders: 258 lane folders; `plan-attack.md` is in 179, `sol-plan-r*.md` in about 22, `review-brief-r2.md` in 69, `factcheck-*.md`, `tree-movement.md`, `CHANGE.md`, `seat-land.md` in many.

---

## MUST

### MUST — The decision rule looks at the wrong seat turn, and test 3 cannot see it

Failing case: in real transcripts the seat ends its turn with a question, then task notifications arrive and the seat answers each one in text ("still running", "reviewer done"). The owner then answers. 175 of 246 owner turns sit after such traffic; 67 of 68 owner turns in the newest file are `promptSource: "queued"`, typed while the seat was busy. A rule that reads "the seat turn before the owner turn" finds a status line, not the question. Test 3 puts the question directly before the reply, so it passes while real recall for decisions collapses. Separately, the 24 `AskUserQuestion` answers are the cleanest decisions in the corpus (question and chosen option are structured), and A6 drops them as tool results.

Fix: define the question source as the last question sentence or `YOUR CALL` block in seat text **since the previous owner turn** (not the adjacent entry), skipping notification turns and the seat's replies to them; seal the question pattern. Add to test 3 a fixture where the question is followed by two task-notification user turns and two seat status turns before the reply, and assert the candidate still carries the original question. Either read `AskUserQuestion` tool_use/tool_result pairs as `decision` candidates (question plus chosen label, evidence = the tool_result entry uuid), or record them as a named residual with the count 24 so the scoring run does not label them as misses of the rule.

### MUST — The false-candidate bar is per session and blind to unlabelled turns

Failing case: a "session" is a file that can run 12 days and 100 owner turns; the corpus has 11 sessions. "≤ 1 false candidate per session" therefore allows a few percent false rate in a long session and 100% in a one-turn session; it is not a rate. Worse, test 7 counts precision only over labelled turns and reports the rest as "(n unlabelled)". The plan labels 35 anchored positives plus 50 sampled turns, about a third of the 246. A rule that fires on every owner turn would show false candidates only on the sampled `none` labels; the other two thirds are invisible, so the go/no-go can read "over the bar" while the run is mostly noise.

Fix: the corpus is small enough to label every owner turn in the window (246). Make the labelled set the full window; then every candidate is scored. Restate the bar as a rate: false candidates per labelled owner turn (or precision), not per session. Make `memory:score` print the unlabelled-candidate count as a gate input, and have the seat treat any unlabelled candidate as unscored, so the bar cannot pass with unlabelled > 0. Keep per-session max as a reading only.

### MUST — A correction candidate is the owner's words with nothing they correct

Failing case: owner corrections are usually short and relative ("no, the other one", "why did you do that again"). Test 1 pins `claim` to the owner text alone. The scoring run counts it as a recall hit, and the seat sees 70% recall, but the record is useless to any later reader: it says nothing about what was wrong. The plan already rejected bare one-word answers for decisions (test 3) for exactly this reason; corrections need the same treatment. The bar measures detection, not a usable memory, which is what the owner asked for.

Fix: seal a correction claim form like the decision one, `<owner text> — correcting: <last seat sentence before it>` (same look-back rule as the decision MUST), and pin it in test 1. Add to the seat's scoring run a usability reading: of 20 sampled hits, how many a reader could act on without opening the transcript. Report it beside recall.

---

## SHOULD

### SHOULD — Reusing `textFrom` for owner text pulls tool ids, part types and image bytes into claims

Failing case: `textFrom` in the extractor falls back to `Object.values` on any object without a `text` string. On a user part array it returns `tool_result`, the `tool_use_id`, and nested content; on an image part it returns `image`, `base64`, the media type and the base64 payload. 26 image parts exist in user content. An owner turn sent with a screenshot gets a claim full of base64.

Fix: owner text = only `type: "text"` parts (or a string `content`); move `textFrom` for the extractor unchanged, but do not use it for owner turns. Add an owner turn with a text part plus an image part to test 2 or test 1 and assert the claim holds only the text.

### SHOULD — Use `origin.kind`, not wrapper sniffing, to tell owner turns from notifications

Failing case: A6 relies on recognising wrapper tags. Every real notification carries `origin.kind: "task-notification"` and every owner turn `origin.kind: "human"`; a notification whose body does not start with the wrapper (a different producer, `producer: "session-task"` exists in one file) slips through as an owner turn. The noise fixture in test 2 is built from the plan's list, not the real key shape.

Fix: when `origin` is present, an owner turn requires `origin.kind === "human"`; fall back to the wrapper rules only when `origin` is absent (older runtime versions — honest variation). Seal the wrapper tag list as a tunable (it is a vocabulary; the plan's sealed list omits it). Give test 2 one notification with `origin.kind: "task-notification"` and a plain-text body holding a cue.

### SHOULD — Evidence pointers into Claude Code transcripts expire in about 30 days and are machine-local

Failing case: transcripts older than about 30 days are gone (oldest surviving file starts 10-04; inferred default cleanup). Every `claude-code:` pointer turns `missing` within a month, so test 5's "base of later re-verification" holds only briefly. The hand split's 119 memory entries include September items whose source turns cannot be anchored, so "anchor 12 corrections and 23 decisions" may come up short. Lane owner-profile already adds a `quote` field because a macOS pointer cannot resolve on Windows; this lane's candidate has none.

Fix: write the source text (and, for decisions, the question) into the private candidates file beside the pointer, as the `quote` field lane owner-profile defines, so a candidate survives its transcript. Before the build, the seat checks how many of the 35 hand-split items still have a surviving transcript and states the number in the scoring note. Name the expiry as a residual in the plan.

### SHOULD — Decision evidence has two sources but the pointer names one

Failing case: test 5 says `resolveEvidence` returns "the exact source text each candidate was cut from" for test 3, but the decision claim is cut from two entries (the owner reply and the seat question). The pointer `claude-code:<sessionId>#<uuid>` names one. The builder must guess; the reviewer cannot judge.

Fix: either the decision pointer carries both uuids (`#<ownerUuid>+<seatUuid>`) and resolve returns both texts, or the plan states that only the reply resolves and the question is carried as quoted text. Same for the correction context in the MUST above.

### SHOULD — The review-file exclusion misses plan-attack and plan-review files and double-counts rounds

Failing case: O3 excludes plan, brief, must-meet and report files. `plan-attack.md` (179 folders) and `sol-plan-r*.md` hold MUST findings against plans, often predictions that the plan then fixed; a pattern anchored on `plan.md` keeps them. Confirmation rounds (`sol-r2.md`, `astra-r2.md`) often restate round-1 MUST titles while marking them fixed, producing a second candidate for the same lesson. This file itself uses `MUST —` headings and would be read as a review with three MUSTs. Test 4 has only `plan.md`, so it cannot catch any of this.

Fix: switch to an allow pattern for reviewer outputs (round files of the review launchers) or extend the exclusion to `plan-*`, `*-plan-*`, `factcheck-*`, `tree-movement.md`, `CHANGE.md`; dedupe identical titles within one lane folder. Add `plan-attack.md` and a round-2 file repeating a round-1 title to the test 4 fixture and assert two candidates, not four.

### SHOULD — Day filtering and the `date` field need a stated timezone and per-turn dates

Failing case: the extractor filters whole sessions by their first timestamp, in `America/New_York` via a module-private `edtDay` with an inline timezone literal. Sessions here span up to 12 days, so `--from 10-22` drops a session that started 10-21 but holds a week of owner turns. Test 1's "the turn's day" does not say UTC or local; a fixture timestamp near midnight passes under one and fails under the other. If the builder writes its own day function, it duplicates `edtDay` against the 10-22 helper ruling.

Fix: filter by each owner turn's own timestamp; name `edtDay` in the helper move (to `claude-transcript.mjs`) and seal the timezone as a tunable with provenance; pin a near-midnight fixture in test 1.

### SHOULD — Growing the cue vocabulary from the scoring labels overfits the comparison

Failing case: O1 says the seat grows the cue list from the scoring run, then scores again on the same labels. Recall rises by construction, and the rules baseline that a model shaper "must beat" is tuned on the test set; the model lane is then judged against an inflated baseline.

Fix: split the labelled window by date before the first run (for example first half tune, second half score) and report recall on the held-out half only. Also report recall separately for the memory-anchored positives (selected because the seat already noticed them) and the random sample.

### SHOULD — Recall must require a kind match

Failing case: test 7 matches by evidence pointer. A candidate with the right pointer but the wrong kind (a decision read as a correction) can count as a hit for both kinds' recall.

Fix: a hit needs pointer and kind to match; a pointer match with the wrong kind counts as one miss and one false candidate. Put one such pair in the test 7 fixture.

### SHOULD — FEAT-040 is claimed by two parallel lanes with different labels

Failing case: lane context-anatomy's plan also proposes "FEAT-040 · Shape each agent's context by role" under CAP-01; lane owner-profile plans to reuse this lane's FEAT-040. A10 covers row IDs but not the feature ID. Whichever lands second hits a tree conflict, and the owner gets two questions with the same default ID.

Fix: the seat assigns feature IDs across the three lanes before any build (for example this lane FEAT-040, context-anatomy FEAT-041) and edits both plans' Feature lines and questions now.

---

## NOTE

### NOTE — The symlink refusal rejects `/tmp` and `os.tmpdir()` on macOS

`preserve` refuses any symlinked component from the filesystem root; `/tmp` and `/var` are symlinks on macOS, so `--out /tmp/x` or `--out $TMPDIR/x` fails (the extractor's own tests `realpath` the temp root to dodge this). The seat's scratch folder is under `/private/tmp`, so the seat's run works, but the refusal line should name the symlinked component and suggest the real path. Run the git-checkout check on the realpath of the nearest existing ancestor.

### NOTE — Default project scope reads every non-worktree project

`transcriptFiles` walks every project folder except `-wt-` and `-private-tmp-` (25 such folders on this machine). Without `--project` the maker makes candidates from unrelated repos, possibly owner work sessions, into a store meant for nana-pi agents. Default `--project` to the current repo's folder or require it.

### NOTE — stderr is not covered by the counts-only rule

Test 6 checks stdout only. An error path that prints a candidate, a line or a claim (a stale-evidence message, an assertion message) goes to stderr and into a pasted log. Assert in test 6 that stderr also holds no fixture claim text on a forced failure.

### NOTE — Correction claims cut at the claim cap may lose the correction

Owner turns that correct the seat are often long instructions with the correction mid-text; a front cut at the cap can keep the preamble and drop the correction. Record the count of claims hitting the cap in `memory:make`'s stdout so the seat can see it.

### NOTE — Worker "lessons" are lane-specific defect titles

A MUST title names one lane's bug, not a reusable lesson; the plan already treats the worker side as a reading. The 20-sample read should count how many titles state a rule another lane could follow, not just how many are real.

### NOTE — Lane class and map

`lane-class.mjs` on the planned files prints `ordinary` (confirmed). The helper move edits `writing-trial-extractor.mjs`, whose map callers are the two named tests; `scripts/*.mjs` importing pack lib has precedent (`scripts/ci-records.mjs`, `scripts/known-bugs.mjs`). No blocker found. The only nested arrow helper in the precedent modules (`namesOwner` inside `scoreDecisions`) is not on this lane's path.
