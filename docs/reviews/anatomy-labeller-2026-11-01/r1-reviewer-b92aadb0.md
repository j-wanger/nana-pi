## Review: anatomy-labeller, Part 1 (`git diff origin/main...HEAD`, tip dda8d9e2)

**Answer:** Yes, the feature works for the seat's labelling run, and I found no harm from the review standard. No MUST stands.

### What I checked

The new label tests pass 19/19 and the existing anatomy tests pass 9/9 at this tip.

I also ran `node apps/bench/anatomy.mjs label` end to end. It went through the real `createRunner` → `claudeRunner` → `callJudge` path. Only the `claude` program was a fake one I put first on PATH, so no model was called and nothing was spent. The fake runner and synthetic store lived in a temporary folder under `/tmp`, which I deleted afterwards.

| What the brief asks | Result |
|---|---|
| Unit text and keys stay out of stdout, stderr and the repo | **Met.** Stdout prints counts, the model and the prompt hash only. Stderr prints fixed reasons only. Error messages are never printed. My fake `claude` wrote unit text to its stderr and exited non-zero; nothing reached our stdout or stderr. Unit text goes to the child on stdin, never in its arguments. The only 64-character hash in the lane folder is the prompt hash. |
| Store and folder refuse a checkout and are written private | **Met.** The folder guard runs before any input is read or any call is made. It refuses a checkout for both `--out` and `--resume` (I checked `--resume` by hand). The folder ends up 0700 and both files 0600. Resume refuses a symlinked `labels.jsonl`. |
| A killed or capped run keeps every finished batch and resumes without re-sending them | **Met.** Each finished batch is appended and flushed to disk at once. I killed a real run with `kill -9` during call 2: 40 rows survived. The resume sent only the 56 remaining units and ended with 96 distinct keys. Resume repairs a torn last line. |
| A resume under a changed model, prompt, effort or seed is refused | **Met.** The tests cover model and prompt. I checked effort and seed by hand: each exits 1 with `label fingerprint mismatch` and makes no call. |
| A malformed reply rejects its whole batch | **Met.** Missing, extra or duplicate ids, a label outside the vocabulary, extra fields, a non-object row and a non-JSON reply all reject the batch. |
| The cap charges unknown usage pessimistically | **Met.** A call with no usage charges 20,000 tokens. That includes a timeout or a failure where the reply can't be read. The test stops at exactly `ceil(cap / charge)` calls and prints `tokens >= 0` and `cost unknown`. |

Main's existing behaviour is unchanged. The five original subcommands keep their paths, `--resume` is refused for them, and nothing in the new import chain runs at load time.

### Findings

- **SHOULD: a kill during resume's repair can lose the file.** When resume finds a torn last line, it rewrites `labels.jsonl` in place (`apps/bench/lib/anatomy-labels.mjs:279`). That truncates the file before writing it back. A kill in those few milliseconds would lose the finished rows, and getting them back means paying for those batches again. The window is tiny and happens only after an earlier kill. Fix: write a private temporary file with exclusive creation, then rename it over the original. Record as a known bug.
- **NOTE: some refusals are untested.** No test covers the effort and seed refusals, or the checkout refusal under `--resume`. All three work; I checked them by hand.
- **NOTE: resume doesn't check the input store.** The manifest records the context and distinct-unit counts, but resume doesn't compare them. Resuming against a re-segmented store goes ahead silently. Keys hash the text, so the labels stay valid, which plan A6 accepts.
- **NOTE: a failed resume leaves an empty folder.** `--resume` with a missing folder creates an empty one, then fails with the generic reason.
- **NOTE: only the unit's own worktree path and branch are masked.** Other home-folder paths in a unit still reach the model. The README describes this correctly. Plan A3's line "home-folder paths do not leave the machine" overclaims. The builders' model provider has already received this text.
- **NOTE: the plan's canary hasn't run.** Seat step 1 calls the real runner on a three-unit synthetic store and counts files under `~/.claude/projects`. The plan puts it before the review brief, but the session note says no model was paid, so it hasn't happened. Run it before the full labelling run. If the real model call failed every time, the run would stop after three calls, at most USD 1.50.

VERDICT: LAND
