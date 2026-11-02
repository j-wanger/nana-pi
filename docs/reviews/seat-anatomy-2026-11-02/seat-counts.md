# Seat context anatomy — counts only (2026-11-03)

Regenerated after round 1 using the lane adapter and reportSlots directly in memory. No transcript text, owner text or session ids were written. The command uses the canonical checkout as the transcript project key, not the lane worktree.

**Interpretation:** recorded payload is not delivered context; UTF-16 chars are not tokens; function rule shares are not findings. Denominator: unique owned main-thread payload chars; recorded-input only for headline shares; unknown separate; subagent files are not enumerated.

Recorded-input chars: 6,874,920. Unknown-delivery chars: 12,185,468.

Sessions: 14. Segments: 72. Owner turns: 344.

## Kinds, whole sessions (recorded-input shares)

| Kind | Chars | Share % |
| --- | --- | --- |
| project-instructions | 1,612,531 | 23.46 |
| system-prompt | 1,603,159 | 23.32 |
| compaction-summary | 954,664 | 13.89 |
| auto-memory | 618,075 | 8.99 |
| shared-memory | 502,330 | 7.31 |
| nana-soul | 398,330 | 5.79 |
| nana-standards | 282,187 | 4.1 |
| user-rules-other | 183,241 | 2.67 |
| owner | 164,862 | 2.4 |
| nana-rulings | 163,981 | 2.39 |
| objective | 147,638 | 2.15 |
| knowledge-pull | 126,197 | 1.84 |
| nana-writing | 98,259 | 1.43 |
| adoption | 11,321 | 0.16 |
| hook-other | 8,145 | 0.12 |
| roster-notice | 0 | 0 |

Unknown-delivery kinds (excluded from input shares):

| Kind | Chars |
| --- | --- |
| notification | 5,804,929 |
| harness | 2,878,793 |
| skills | 1,458,996 |
| tools | 1,057,225 |
| attached-files | 975,731 |
| environment | 9,794 |
| attachment-other | 0 |
| knowledge-pull | 0 |

## By phase

**standing** — recorded-input 4,293,860, unknown 2,005,357

| Kind | Chars | Share % |
| --- | --- | --- |
| compaction-summary | 954,664 | 22.23 |
| project-instructions | 935,806 | 21.79 |
| system-prompt | 615,114 | 14.33 |
| shared-memory | 502,330 | 11.7 |
| auto-memory | 311,050 | 7.24 |
| nana-soul | 283,510 | 6.6 |
| nana-standards | 213,616 | 4.97 |
| objective | 147,638 | 3.44 |
| user-rules-other | 128,885 | 3 |
| nana-rulings | 106,745 | 2.49 |
| nana-writing | 75,036 | 1.75 |
| adoption | 11,321 | 0.26 |
| hook-other | 8,145 | 0.19 |
| roster-notice | 0 | 0 |

**turn** — recorded-input 2,581,060, unknown 10,180,111

| Kind | Chars | Share % |
| --- | --- | --- |
| system-prompt | 988,045 | 38.28 |
| project-instructions | 676,725 | 26.22 |
| auto-memory | 307,025 | 11.9 |
| owner | 164,862 | 6.39 |
| knowledge-pull | 126,197 | 4.89 |
| nana-soul | 114,820 | 4.45 |
| nana-standards | 68,571 | 2.66 |
| nana-rulings | 57,236 | 2.22 |
| user-rules-other | 54,356 | 2.11 |
| nana-writing | 23,223 | 0.9 |
| hook-other | 0 | 0 |

## By start type — payload recorded before the first closing event only

These shares measure the coalescing start window, not all startup configuration. The first owner prompt closes it. Startup and clear snapshots and instructions recorded afterward count as turn payload. unrecorded-system means no snapshot in that window, not no snapshot in the segment.

| Start | Segments | Top kinds (share %) |
| --- | --- | --- |
| startup | 6 | shared-memory 76.34, objective 21.47, hook-other 1.21, adoption 0.98, roster-notice 0 |
| resume | 0 |  |
| clear | 8 | shared-memory 85.22, objective 10.37, adoption 3.88, hook-other 0.53, roster-notice 0 |
| compact | 58 | compaction-summary 22.98, project-instructions 22.53, system-prompt 14.81, shared-memory 9.36, auto-memory 7.49 |
| unknown | 0 |  |

## Repeats

```json
{
  "repeatedDelivery": {
    "chars": 9132413,
    "denominator": 19060388,
    "basis": "new payload chars with the same session kind and slot identity in a later segment"
  },
  "exactDuplicate": {
    "chars": 6710255,
    "denominator": 19060388,
    "basis": "new payload chars byte-identical after the first payload"
  },
  "normalizedDuplicate": {
    "units": 29340,
    "denominator": 71728,
    "basis": "new unit occurrences equal after normalize, including oversize, after the first"
  }
}
```

## The seat's own reads, by class

| Class | Calls | Chars |
| --- | --- | --- |
| precedent | 0 | 0 |
| known-bugs | 272 | 113,286 |
| tests | 967 | 672,235 |
| brief | 192 | 144,396 |
| docs | 6,500 | 5,821,124 |
| source | 14,751 | 3,979,047 |
| outside | 2,216 | 1,955,355 |
| discovery | 12,877 | 3,032,275 |
| unclassified-bash | 64,233 | 10,122,778 |
| memory | 295 | 259,289 |
| delegation | 374 | 393,822 |
| web | 10 | 37,929 |
| skill | 6 | 199 |
| write | 599 | 112,991 |
| other | 2,318 | 1,798,548 |

## Corrections

Not regenerated: the previous private correction-label input is unavailable to this run. No correction totals are inferred.

## Coverage, skips and exclusions

```json
{
  "coverage": [
    {
      "type": "agent_listing_delta",
      "entries": 71,
      "found": 71,
      "share": 100
    },
    {
      "type": "attachment-other",
      "entries": 30,
      "found": 0,
      "share": 0
    },
    {
      "type": "auto_mode",
      "entries": 69,
      "found": 0,
      "share": 0
    },
    {
      "type": "command_permissions",
      "entries": 7,
      "found": 0,
      "share": 0
    },
    {
      "type": "compact_file_reference",
      "entries": 58,
      "found": 0,
      "share": 0
    },
    {
      "type": "date",
      "entries": 99,
      "found": 99,
      "share": 100
    },
    {
      "type": "deferred_tools_delta",
      "entries": 75,
      "found": 74,
      "share": 98.67
    },
    {
      "type": "deferred_tools_record",
      "entries": 115,
      "found": 0,
      "share": 0
    },
    {
      "type": "edited_text_file",
      "entries": 225,
      "found": 225,
      "share": 100
    },
    {
      "type": "environment",
      "entries": 125,
      "found": 0,
      "share": 0
    },
    {
      "type": "file",
      "entries": 222,
      "found": 0,
      "share": 0
    },
    {
      "type": "hook_additional_context",
      "entries": 41,
      "found": 41,
      "share": 100
    },
    {
      "type": "hook_cancelled",
      "entries": 20,
      "found": 0,
      "share": 0
    },
    {
      "type": "hook_success",
      "entries": 546,
      "found": 546,
      "share": 100
    },
    {
      "type": "instructions",
      "entries": 117,
      "found": 117,
      "share": 100
    },
    {
      "type": "invoked_skills",
      "entries": 53,
      "found": 53,
      "share": 100
    },
    {
      "type": "mcp_instructions_delta",
      "entries": 71,
      "found": 71,
      "share": 100
    },
    {
      "type": "model",
      "entries": 71,
      "found": 71,
      "share": 100
    },
    {
      "type": "prompt_snapshot",
      "entries": 141,
      "found": 141,
      "share": 100
    },
    {
      "type": "queued_command",
      "entries": 1254,
      "found": 1254,
      "share": 100
    },
    {
      "type": "remote_session_change",
      "entries": 73,
      "found": 0,
      "share": 0
    },
    {
      "type": "session_context",
      "entries": 71,
      "found": 0,
      "share": 0
    },
    {
      "type": "silent_turn_reminder",
      "entries": 1043,
      "found": 1043,
      "share": 100
    },
    {
      "type": "skill_listing",
      "entries": 54,
      "found": 54,
      "share": 100
    },
    {
      "type": "task_status",
      "entries": 157,
      "found": 0,
      "share": 0
    },
    {
      "type": "thinking_drop",
      "entries": 35,
      "found": 0,
      "share": 0
    },
    {
      "type": "total_tokens_reminder",
      "entries": 18353,
      "found": 18353,
      "share": 100
    },
    {
      "type": "ultra_effort",
      "entries": 72,
      "found": 0,
      "share": 0
    }
  ],
  "skipped": [
    {
      "reason": "other-project",
      "count": 22
    },
    {
      "reason": "private-tmp",
      "count": 2
    },
    {
      "reason": "worktree",
      "count": 221
    }
  ],
  "exclusions": [
    {
      "reason": "unrecorded-system",
      "count": 17
    }
  ],
  "events": [
    {
      "reason": "queued-unmatched",
      "count": 37
    },
    {
      "reason": "timed-out",
      "count": 20
    }
  ],
  "ambiguous": []
}
```

## Seat step 2 — /context comparison

Not done. The owner's live seat must supply this view. Recorded payload is not delivered context.
