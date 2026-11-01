# builder-anatomy — seat measurement (counts only)

Run 2026-11-01 by the seat on build 1's tip `1ce8d664`, over pi builder sessions on the seat's machine. The private store and the labelled sheets stay outside git. No unit text appears here.

## Step 1: segment

- Session files read: 2,753. Builds found: 600 (1,971 files not a builder, 182 another project).
- Builds with a build record: 154; split into preamble, brief and known-bug parts: 153 (99.4%). Bar 90%: **pass**.
- Older builds without a record: 446; split: 260 (58%; no gate). Briefs unmatched: 187.
- Builds with a known-bug part: 0 (the digest landed in context-anatomy, after these builds).
- Excluded: 17 compactions (83,913 chars), 69 context edits.

## Step 3: agreement (fixed before shares were read)

The first sample, drawn on build 1's sampler, was not random: after the minimum picks it took the lowest unit ids, so it came from a handful of builds. The final review caught it, build 2 fixed the sampler, and the seat drew a new sample and relabelled it. Only the second draw is reported.

Sample `--seed builder-anatomy-2026-11-01` on build 2's sampler: 150 units, 51,421 chars, from about 133 builds (29 units overlap the first draw). Labeller A: a Claude Code subagent (Claude Sonnet). Labeller B: the roster's land model through pi, in batches of ten. Each saw only the definitions table and the blind sheet.

| Pair | κ | Agreement | Char agreement |
|---|---|---|---|
| A : B | 0.86 | 0.88 | 0.96 |
| rules : A | 0.36 | 0.45 | 0.37 |
| rules : B | 0.36 | 0.45 | 0.37 |
| rules : consensus (132 units) | 0.36 | 0.45 | 0.37 |

Labellers' per-function κ (functions at or above the configured count): task 0.92, constraints 0.86, lessons 0.85, method 0.84, knowledge 0.84, output contract 0.80, tools 0.76, unsorted 1.00. Precedent (5 units), feedback (4) and purpose (1) fall below the count, so their reliability is unmeasured. Top labeller confusions: method/tools 4, constraints/output contract 3.

Readings, as pre-registered in the plan:
- **The functions that occur often enough sort cleanly between two model families (κ 0.86).** Precedent, feedback and purpose are too rare in a random sample to measure; a stratified draw would be needed.
- **The rules fail against the consensus (0.36 < 0.6).** Rule-based function shares are not reported as findings. Seat decision: the model labeller (plan A2) becomes the next lane, not a rule fix, because two model labellers already agree at 0.86 and the rules sit far below the bar.

## Step 2: what holds without the rules

These counts do not depend on function labels.

- Pushed context across 600 builds: 23.6M chars. Builders' own reads (tool calls): 54,854 calls, 251.5M chars, about ten times what was pushed.
- Pulled chars by class (millions): outside the repo 100, docs 55, source 25, tests 23, unclassified shell 22, precedent files 21, discovery 2, brief 0.6, known bugs 0.2.
- Repeated units: 3,591 duplicate groups; 44 appear in all 600 builds.
- Oversize units (above 3,000 chars) are reported as whole rows: the skills listing (20,388 chars) and the added-tools block (4,564 chars) in every build.

Slice 2's pre-registration waits on the model labeller's shares.
