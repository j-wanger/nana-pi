# reader-at-land · plan attack (adversary, 2026-10-29)

Checked against main 947e18e8, pi 1.0.2, and the one-off's scratch record.

## MUST

**M1. The quote check, as written, flags most of the one-off's honest quotes.** I ran the plan's rule (whitespace-normalised substring) on the one-off's `reader-out.md` against its `page-text.txt`. 7 of 16 quotes missed. 3 of 4 findings and the drift paragraph each carry a miss. Every miss is honest variation:
- punctuation inside the quotes (`"Backups,"`, `"Feature assessments out of date: 34."`);
- a curly apostrophe for the page's straight one (`clone’s`);
- a quote that runs across element boundaries (`... run: 0`).
The model used curly quotes, so O4's straight-quote format splits nothing unless forced. The result marks good findings `quote not found` every run, and the seat learns to ignore the mark.
Fix:
- normalise curly quotes and apostrophes to straight;
- strip leading and trailing punctuation inside the quote;
- accept either quote style;
- allow several quotes per finding, and pass a finding when at least one quote matches;
- make the one-off's `reader-out.md` and `page-text.txt` a fixture for R-3061, with every one of its findings passing.

**M2. The run-after-run design decays into ceremony.** Three things push the reader toward repeats and padding:
- The prompt asks for a fixed count ("Name the four weaknesses"), so the reader returns four even when nothing new exists.
- It reads the whole page, not the lane's change. Most lanes that change the page touch one view, so each lane gets the same four whole-page complaints.
- Q2's default writes every new finding into FEAT-039's known-bug file. That file is already 17 KB and 107 lines, and the plan feeds it back in whole. So the input grows every lane and repeats get harder to suppress.
The one-off's findings were design judgments for the owner, such as "lead with the product, not the bookkeeping". They were not defects, and the known-bug file buries them as "fix when someone next works on it". That is the seat pasting lines, which is the exact ceremony the current priority says to remove.
Fix:
- Ask for "at most N, or say none".
- Give the reader first-look's accessibility diff and ask first about what this lane changed, plus at most one standing weakness.
- Q2 default: the seat names the top new finding to the owner beside the "is this the shape?" card. It writes a known-bug line only for a finding it judges a defect.
- Add a must-meet that a "none" answer yields `0 findings` and no prompt to write anything.

## SHOULD

**S1. The plan's evidence does not transfer to its design.** The one-off prompt had no known bugs in it. "3 of 4 new" was judged afterward. The planned prompt adds 17 KB of known bugs and 14 views instead of 10, so it grows from about 31 K to about 75 K characters. Fix: say so in A6. Seal a total cap that the one-off's numbers justify. Record the first real run's new, known and noise counts.

**S2. The landing view is dropped.** `PRODUCT_VIEWS` has no landing entry. The one-off's richest view was the phone landing, capped at 6,000 characters, and it sourced findings 1 and 2. Fix: R-3060 names the landing view at both widths.

**S3. The watchdog can kill a healthy run.** `runWatchdog` finds stalls by flat CPU, 75 s by default. A no-tools run waiting on server-side thinking shows flat CPU. A7's stalled first run may have been this. Fix: seal stall seconds well above the model's think time, with provenance. Count the retry as a cost: two 600 s attempts.

**S4. R-3065's words are not pinned.** "In substance" and "final wording follows the owner's answers" leave the seat-rule test unwritten at plan time. Fix: write the exact sentence for the default answers now, as RULE_14. Widen R-1140's prose to name the new rule. The row lists its rules by content.

**S5. R-3060 is wider than any one test.** Fix: split it into "prompt.md holds exactly objective + known bugs + page text" and "pi runs once with the sealed flags, `@file` and a cwd outside the repo".

## NOTE

**N1. A3 is now verified.** I ran `pi -p --no-tools --no-session -ne -ns -nc --provider openai-codex --model gpt-6-astra @p.md "go"` under a 120 s alarm, in an empty scratch folder. It printed `ok` and exited 0, so the subscription login survives `-ne`. Add `-np` (no prompt templates) to the flag set so the reader is fully cold.

**N2. The lane class is confirmed.** `lane-class.mjs` prints `ordinary` for the plan's files plus `packages/nana-pack/prompts/outside-reader.md`.

**N3. The resolver move is low risk but unpinned.** `resolvePlaywright` resolves from `SCRIPT_DIR`, and the new module sits in the same `scripts/` folder,. But first-look's tests inject `browser`, so no test runs the resolver, and a green R-3042 proves nothing about the move. The seat should run `npm run first-look -- --page product` once after the build.

**N4. `--url` takes a file path.** First-look leaves `<out>/after-report.html` as a path. The command must turn it into a `file://` URL before adding `#view`. Pin that in one test.

**N5.** The ceremony elsewhere (README sentence, map and tree regeneration, one test file) is light enough. The split rule should ignore any preamble before the first numbered finding; the one-off opened with "DONE — This review serves…".
