# Treated after corpus, 2026-10-04 through 2026-10-07

The extractor includes report-sized main-thread assistant messages after the first canonical-rule attachment in treated seat sessions. Its trial verdict measure takes only the last qualifying message per treated seat session. The all-message figures below are a separately labelled audit, not the verdict population.

Snapshot cutoff: inclusive through `2026-10-07T09:47:20.003Z` (UTC). Every after number below uses this cutoff; it bounds mutable transcripts. Baseline messages and measurements come from the separately preserved manifest. A sampled 2026-10-05 session (eddb9d32-a04d-4940-bf4f-7aa79f40ad8f) has the canonical attachment before its report at 2026-10-05T14:02:53.538Z; this is the observable treatment signal, not a file modification date or transcript mention.

## Verdict measure: one message per treated seat session

| Corpus | Unit | Sessions/messages | Strict passes | Lenient passes |
|---|---|---:|---:|---:|
| Baseline | Last qualifying message per seat session | 32 | 0/32 | 3/32 |
| After, at committed cutoff | Last qualifying message per treated seat session | 7 | 6/7 | 6/7 |

This is the like-for-like trial comparison: baseline and after both use the last qualifying message per seat session. Strict uses the committed uppercase verdict-first check. Lenient reproduces the former case-insensitive check against only the first prose sentence.

## All-message audit (not the verdict measure)

| EDT day | Report-sized messages | Strict passes | Lenient passes |
|---|---:|---:|---:|
| 2026-10-04 | 3 | 2 | 2 |
| 2026-10-05 | 14 | 9 | 10 |
| 2026-10-06 | 7 | 4 | 4 |
| 2026-10-07 | 1 | 0 | 0 |
| **Total audit** | **25** | **15** | **16** |

The October 5 audit remains 10/14 on the former lenient check (and 9/14 strict); it is an all-message audit, not the session-unit verdict result. The scan found 21 matching Bash checker calls across the treated sessions by EDT day: October 4: 1, October 5: 13, October 6: 7. Calls are not distinct sent reports: the extractor cannot tell whether an invocation rechecks a draft or is diagnostic, so the seat audits distinct reports at verdict time.

Recompute with `node docs/reviews/writing-trial-2026-10-04/extract.mjs --from 2026-10-04 --to 2026-10-07 --mode after --until 2026-10-07T09:47:20.003Z` against the seat projects under `~/.claude/projects/`. JSON `verdictMeasure` is the trial unit; `allMessageAudit` and `days` are audit-only. `checkerCalls` counts tool invocations, not reports sent.

## Stop trigger (recorded 2026-10-09)

The trial stops on the first of 2026-10-18, the twentieth report checked, or a second lost-detail complaint. `stop-count.mjs` in this folder (read-only) is a temporal PROXY: it counts a report-sized (80+ words) main-thread assistant message in a rule-treated seat session once when a main-thread `nana-writing.mjs --report` call ran earlier in the same turn, excluding calls that name `HANDOFF.md`. It does not match the checker's input to the following report, so it cannot show that a candidate was actually checked.

| Since | Candidate checked reports (proxy) | Without the HANDOFF exclusion |
|---|---:|---:|
| 2026-10-04 to 2026-10-09T09:25Z | 20 | 23 |

Because the proxy cannot establish the twentieth checked report, the 2026-10-18 backstop binds (sol, wave-0 review). Recompute: `node docs/reviews/writing-trial-2026-10-04/stop-count.mjs ~/.claude/projects 2026-10-04T00:00:00Z`.

## Day-14 after-measure and verdict (recorded 2026-10-21)

The 2026-10-18 backstop bound (the twentieth-report proxy could not establish a checked report). The seat ran the after-measure on 2026-10-21, three days late, with the cutoff at the end of 2026-10-18 New York time:

`node docs/reviews/writing-trial-2026-10-04/extract.mjs --from 2026-10-04 --to 2026-10-18 --mode after --until 2026-10-19T03:59:59.999Z`

| Target (baseline.md) | Baseline | After, day 14 (16 treated seat sessions, last qualifying report each) | Met |
|---|---|---|---|
| Verdict word first in 90% of reports | 0/32 strict, 3/32 lenient | 14/16 strict (88%), 15/16 lenient | no, by one report |
| Report sentences over 25 words: 8% or fewer | 31% | 7/311 (2%) | yes |
| Zero banned words | 0 | 0 (also 0 across all 835 report-sized messages) | yes |
| `HANDOFF.md` lines added during the trial: 11% or fewer over the cap | 42% | 45/387 sentences (11.6%), lines added 542bee7c..b3f6ec2e | no, by 0.6 points |
| Identifiers per report (no target) | 48 each | 11 in 16 reports (0.7 each) | the owner judges |
| Lost-detail complaints (stop at two) | — | none recorded | — |

The all-message audit (not the verdict unit) reads 835 report-sized messages, 503 strict verdict passes (60%), 2% of sentences over the cap; the checker ran 217 times in treated sessions. Banned and identifier counts come from `checkText` in report mode over the same session-unit messages the extractor scores. The HANDOFF figure is the landed checker run over the `+` lines of `git diff 542bee7c b3f6ec2e -- HANDOFF.md` (542bee7c added the rule; b3f6ec2e is the last HANDOFF commit on 2026-10-18).

**Verdict: adopt** (the owner, 2026-10-21, on the seat's recommendation). Two targets missed by small margins against large gains on every measure. Adopt follows the land ruling: a PATH link for the checker, the pre-send check made mandatory in the rule, blocking decided per surface, a `writing.enabled` key, and one `toWellFormed()` at the character cap. That work is its own lane (a pi extension change, so an install, hook or gate lane); until it lands the rule and the report-only checker run as they do today.
