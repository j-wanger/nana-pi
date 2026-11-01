# builder-anatomy — seat measurement (counts only)

Run 2026-11-01 by the seat on build 1's tip `1ce8d664`, over pi builder sessions on the seat's machine. The private store and the labelled sheets stay outside git. No unit text appears here.

## Step 1: segment

- Session files read: 2,753. Builds found: 600 (1,971 files not a builder, 182 another project).
- Builds with a build record: 154; split into preamble, brief and known-bug parts: 153 (99.4%). Bar 90%: **pass**.
- Older builds without a record: 446; split: 260 (58%; no gate). Briefs unmatched: 187.
- Builds with a known-bug part: 0 (the digest landed in context-anatomy, after these builds).
- Excluded: 17 compactions (83,913 chars), 69 context edits.

## Step 3: agreement (fixed before shares were read)

Sample `--seed builder-anatomy-2026-11-01`: 150 units, 25,330 chars. Labeller A: a Claude Code subagent (Claude Sonnet). Labeller B: the roster's land model through pi. Each saw only the definitions table and the blind sheet.

| Pair | κ | Agreement | Char agreement |
|---|---|---|---|
| A : B | 0.82 | 0.85 | 0.90 |
| rules : A | 0.33 | 0.45 | 0.55 |
| rules : B | 0.27 | 0.39 | 0.52 |
| rules : consensus (127 units) | 0.31 | 0.44 | 0.57 |

Labellers' per-function κ (functions at or above the configured count): constraints 0.92, output contract 0.88, lessons 0.85, knowledge 0.75, method 0.74, tools 1.00, unsorted 1.00, **precedent 0.27**. Top labeller confusions: precedent/knowledge 5, feedback/lessons 3, precedent/task 3.

Readings, as pre-registered in the plan:
- **The ten functions sort cleanly between two model families, except precedent.** Precedent's share is marked unreliable; its confusion with knowledge and task is a merge or split proposal for the owner.
- **The rules fail against the consensus (0.31 < 0.6).** The rules leave 55% of pushed chars unsorted. Rule-based function shares are not reported as findings. Seat decision: the model labeller (plan A2) becomes the next lane, not a rule fix, because two model labellers already agree at 0.82 and the rules sit far below the bar.

## Step 2: what holds without the rules

These counts do not depend on function labels.

- Pushed context across 600 builds: 23.6M chars. Builders' own reads (tool calls): 54,854 calls, 251.5M chars, about ten times what was pushed.
- Pulled chars by class (millions): outside the repo 100, docs 55, source 25, tests 23, unclassified shell 22, precedent files 21, discovery 2, brief 0.6, known bugs 0.2.
- Repeated units: 3,591 duplicate groups; 44 appear in all 600 builds.
- Oversize units (above 3,000 chars) are reported as whole rows: the skills listing (20,388 chars) and the added-tools block (4,564 chars) in every build.

Slice 2's pre-registration waits on the model labeller's shares.
