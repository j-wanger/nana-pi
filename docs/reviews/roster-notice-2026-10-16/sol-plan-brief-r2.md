# Plan review brief: roster-notice lane, round 2 of 2

Reviewer: gpt-5.6-sol. Lane class: FORMAT, two plan-review rounds; this is the last. Read `CHANGE.md` (seat draft 6) and your round 1, `sol-plan-r1.md`. The repo is at main `2dbc817`; change nothing.

What changed since round 1 (seat revision 6, logged at the end of `CHANGE.md`; counts now 26 rows added, 12 reworded, 36 new titles plus 4 loop instances, 68 pairs, residuals 1 to 23):
- MUST 1, relative agent dir: new row R-1215. While `PI_CODING_AGENT_DIR` stays relative after pi's normalisation, the notice reads `roster unknown: …` with the change pointer and names no lineup. Detection reuses `piAgentDirIsCwdRelative()`. Lane mode is unchanged and residual 18 says so. New L16 checks both seats; new pair 68 reds it.
- SHOULD 2, provider: kept out. The notice also enters the Claude seat's context, and a seat that copies it into a repository file must not carry a machine's provider; a standing rule keeps machine provider names out of repository files. The plan and README now say the notice names each entry by model and thinking, and `nana-roster` prints providers. Residual 23 says two providers serving one model id read alike.
- SHOULD 3, scout: the notice never names the scout. R-1194 names the builders, reviewer and land; R-1199 reads "name no scout, set or null". L1, L7, pair 11, the examples and residual 21 follow.

Threat model, unchanged. In scope: honest variation in our tools' output and in users' files. Out of scope: deliberate forgery, such as a misleading model name or a forged roster file or hook input. A finding outside the model is a residual.

Review the plan as a whole, but especially the change since round 1. Give each finding a file and line at `2dbc817`, then end with your verdict. Please check:
1. The lineup the notice shows is the lineup each seat runs, for both seats, on macOS and on Windows, or the notice says it cannot know.
2. No honest input crashes, blocks, hangs or shows a wrong lineup.
3. Each row has one behaviour, and a test that pins it.
4. The census of existing checks misses no check that this change turns red or leaves unpinned.
5. The subtraction test: name any part that does not earn its cost.
6. Any MUST.
