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

The trial stops on the first of 2026-10-18, the twentieth report checked, or a second lost-detail complaint. The seat counted checked reports with `stop-count.mjs` in this folder (read-only): a report-sized (80+ words) main-thread assistant message in a rule-treated seat session counts once when a main-thread `nana-writing.mjs --report` call ran earlier in the same turn; checker calls that name `HANDOFF.md` are excluded because they check the frontier file, not a report.

| Since | Checked reports | Twentieth report |
|---|---:|---|
| 2026-10-04 | 20 | 2026-10-09T09:25:13Z |

Without the `HANDOFF.md` exclusion the count is 23 and the twentieth falls on 2026-10-08. Either way the twentieth-report condition fired before 2026-10-18, so the trial has stopped; the after-measure and the verdict note follow. Recompute: `node docs/reviews/writing-trial-2026-10-04/stop-count.mjs ~/.claude/projects 2026-10-04T00:00:00Z`.
