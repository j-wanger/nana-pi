# Plan review brief: roster-notice lane, round 1 of 2

Reviewer: gpt-5.6-sol. Lane class: FORMAT, so the plan gets two review rounds. The roster file gains a slot and an entry kind, and lane mode gains an option and two refusals.

Read `CHANGE.md` first. The other files here are its evidence: three research notes, two critiques, two fact-checks and two probes. The repo is at main `2dbc817`. Read it as much as you need, and change nothing. Files the plan cites but this folder leaves out, such as `cc-strings.txt` and the probe outputs, are cited by line.

Threat model. In scope: honest variation in our tools' output and in users' files. Out of scope: deliberate forgery, such as a misleading model name or a forged roster file or hook input. A finding outside the model is a residual.

What changed since the first plan. Two critiques and two fact-checks led to seat revisions 3 and 4, logged at the end of `CHANGE.md`. In short:
- the open-lanes segment is cut;
- a new shared bullet tells each seat how to route a larger lane (three rows);
- a Claude Code entry may name only the four models the Claude Code subagent tool takes;
- the plan recommends a null default for the larger-lane builder;
- once that slot is set, lane mode refuses a launch that names no lane size;
- pi shows the notice as a widget, not a notify;
- a read-only `--json` print is added;
- Claude Code's clear and pi's new now show the notice;
- the hook treats an input read error as no source;
- the provider rule now says how each entry is built.

Please check:
1. The lineup the notice shows is the lineup each seat runs, for both seats, on macOS and on Windows.
2. No honest input crashes, blocks, hangs or shows a wrong lineup.
3. Each row has one behaviour, and a test that pins it.
4. The census of existing checks misses no check that this change turns red or leaves unpinned.
5. The subtraction test: name any part that does not earn its cost.
6. Any MUST.

Give each finding a file and line at `2dbc817`, then end with your verdict.
