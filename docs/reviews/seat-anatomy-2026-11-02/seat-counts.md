# Seat context anatomy — counts only (2026-11-03)

Made by the seat after build 2 with `anatomy.mjs segment --role seat --runtime claude-code` over this repository's Claude Code project folder, then `report --corrections` with the private memory labels. Counts only: no excerpt, no session id, no owner text. The private store stays outside git.

**What these numbers can claim:** recorded payload is not delivered context; UTF-16 chars are not tokens; function rule shares are not findings. Denominator: unique owned main-thread payload chars; recorded-input only for headline shares; unknown separate; subagent files are not enumerated.

Recorded-input chars: 6,766,743. Unknown-delivery chars (kept out of shares): 12,121,230.

Sessions: 14. Segments: 132. Owner turns: 344.

## Kinds, whole sessions (recorded-input shares)

| Kind | Chars | Share % |
|---|---:|---:|
| project-instructions | 1,592,270 | 23.53 |
| system-prompt | 1,577,169 | 23.31 |
| compaction-summary | 939,878 | 13.89 |
| auto-memory | 607,437 | 8.98 |
| shared-memory | 493,363 | 7.29 |
| nana-soul | 392,174 | 5.8 |
| nana-standards | 278,243 | 4.11 |
| user-rules-other | 178,012 | 2.63 |
| owner | 164,862 | 2.44 |
| hook-other | 160,340 | 2.37 |
| nana-rulings | 159,966 | 2.36 |
| knowledge-pull | 126,197 | 1.86 |
| nana-writing | 96,832 | 1.43 |

Unknown-delivery kinds (recorded, not counted as input):

| Kind | Chars |
|---|---:|
| notification | 5,788,071 |
| harness | 2,861,023 |
| skills | 1,458,996 |
| tools | 1,027,749 |
| attached-files | 975,731 |
| environment | 9,660 |

## By phase

**standing** — recorded-input 4,186,926, unknown 540

| Kind | Share % |
|---|---:|
| compaction-summary | 22.45 |
| project-instructions | 21.87 |
| system-prompt | 14.1 |
| shared-memory | 11.78 |
| auto-memory | 7.18 |
| nana-soul | 6.62 |
| nana-standards | 5.01 |
| hook-other | 3.83 |
| user-rules-other | 2.95 |
| nana-rulings | 2.45 |
| nana-writing | 1.76 |

**turn** — recorded-input 2,579,817, unknown 12,120,690

| Kind | Share % |
|---|---:|
| system-prompt | 38.25 |
| project-instructions | 26.23 |
| auto-memory | 11.9 |
| owner | 6.39 |
| knowledge-pull | 4.89 |
| nana-soul | 4.45 |
| nana-standards | 2.66 |
| nana-rulings | 2.22 |
| user-rules-other | 2.11 |
| nana-writing | 0.9 |
| hook-other | 0 |

## By start type

| Start | Segments | Top kinds (share %) |
|---|---:|---|
| startup | 10 | shared-memory 76.34, hook-other 23.66 |
| resume | 0 |  |
| clear | 10 | shared-memory 85.22, hook-other 14.78 |
| compact | 112 | compaction-summary 23.22, project-instructions 22.62, system-prompt 14.59, shared-memory 9.39, auto-memory 7.42 |
| unknown | 0 |  |

## Repeats

- **repeatedDelivery:** 9,008,644 of 18,887,973 (47.7%) — new payload chars with the same session kind and slot identity in a later segment
- **exactDuplicate:** 6,621,378 of 18,887,973 (35.1%) — new payload chars byte-identical after the first payload
- **normalizedDuplicate:** 28,935 of 70,971 (40.8%) — new unit occurrences equal after normalize, including oversize, after the first

## The seat's own reads, by class

| Class | Calls | Chars |
|---|---:|---:|
| unclassified-bash | 63,409 | 10,061,164 |
| docs | 6,454 | 5,805,191 |
| source | 14,610 | 3,964,681 |
| discovery | 12,773 | 3,015,251 |
| outside | 2,183 | 1,949,528 |
| other | 2,283 | 1,783,038 |
| tests | 959 | 666,725 |
| delegation | 374 | 393,822 |
| memory | 295 | 259,289 |
| brief | 185 | 139,017 |
| known-bugs | 272 | 113,286 |
| write | 597 | 112,655 |
| web | 10 | 37,929 |
| skill | 6 | 199 |
| precedent | 0 | 0 |

## Corrections

Source: labelled. Owner turns 344: correction 46, decision 139, none 0, unlabelled 159, conflict 0, structured answers 23.
Sessions with owner turns: 14; corrections per owner turn across sessions: min 0.00, max 0.38.

## Coverage, skips and exclusions

Skipped files: other-project 22, private-tmp 2, worktree 218. Exclusions: unrecorded-instructions 16, unrecorded-system 79. Events: queued-unmatched 37, timed-out 18. Ambiguous rows: 0.

Entry types with zero coverage (recorded but not read into a kind): attachment-other (29), auto_mode (68), command_permissions (7), compact_file_reference (57), deferred_tools_record (114), environment (124), file (218), hook_cancelled (18), remote_session_change (72), session_context (70), task_status (149), thinking_drop (34), ultra_effort (72).

## Seat step 2 — /context comparison

Not done. It needs Claude Code's `/context` view on a live seat session, which only the owner's session can show. Recorded payload is not delivered context; when it is run, every category over a 5-point gap is listed here as a finding.
