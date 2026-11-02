# Seat context anatomy — counts only (2026-11-03)

Regenerated for lane seat-anatomy-roster-notice (A4) using the lane adapter and reportSlots directly in memory. No transcript text, owner text or session ids were written. The command uses the canonical checkout as the transcript project key, not the lane worktree.

**Interpretation:** recorded payload is not delivered context; UTF-16 chars are not tokens; function rule shares are not findings. Denominator: unique owned main-thread payload chars; recorded-input only for headline shares; unknown separate; subagent files are not enumerated.

Recorded-input chars: 6,882,508. Unknown-delivery chars: 12,202,962.

Sessions: 14. Segments: 72. Owner turns: 351.

## Kinds, whole sessions (recorded-input shares)

| Kind | Chars | Share % |
| --- | --- | --- |
| project-instructions | 1,612,531 | 23.43 |
| system-prompt | 1,603,159 | 23.29 |
| compaction-summary | 954,664 | 13.87 |
| auto-memory | 618,075 | 8.98 |
| shared-memory | 502,330 | 7.3 |
| nana-soul | 398,330 | 5.79 |
| nana-standards | 282,187 | 4.1 |
| user-rules-other | 183,241 | 2.66 |
| owner | 170,469 | 2.48 |
| nana-rulings | 163,981 | 2.38 |
| objective | 147,638 | 2.15 |
| knowledge-pull | 128,178 | 1.86 |
| nana-writing | 98,259 | 1.43 |
| adoption | 11,321 | 0.16 |
| roster-notice | 8,145 | 0.12 |
| hook-other | 0 | 0 |

Unknown-delivery kinds (excluded from input shares):

| Kind | Chars |
| --- | --- |
| notification | 5,807,693 |
| harness | 2,893,523 |
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
| roster-notice | 8,145 | 0.19 |

**turn** — recorded-input 2,588,648, unknown 10,197,605

| Kind | Chars | Share % |
| --- | --- | --- |
| system-prompt | 988,045 | 38.17 |
| project-instructions | 676,725 | 26.14 |
| auto-memory | 307,025 | 11.86 |
| owner | 170,469 | 6.59 |
| knowledge-pull | 128,178 | 4.95 |
| nana-soul | 114,820 | 4.44 |
| nana-standards | 68,571 | 2.65 |
| nana-rulings | 57,236 | 2.21 |
| user-rules-other | 54,356 | 2.1 |
| nana-writing | 23,223 | 0.9 |
| hook-other | 0 | 0 |

## By start type — payload recorded before the first closing event only

These shares measure the coalescing start window, not all startup configuration. The first owner prompt closes it. Startup and clear snapshots and instructions recorded afterward count as turn payload. unrecorded-system means no snapshot in that window, not no snapshot in the segment.

| Start | Segments | Top kinds (share %) |
| --- | --- | --- |
| startup | 6 | shared-memory 76.34, objective 21.47, roster-notice 1.21, adoption 0.98 |
| resume | 0 |  |
| clear | 8 | shared-memory 85.22, objective 10.37, adoption 3.88, roster-notice 0.53 |
| compact | 58 | compaction-summary 22.98, project-instructions 22.53, system-prompt 14.81, shared-memory 9.36, auto-memory 7.49 |
| unknown | 0 |  |

## Repeats

```json
{
  "repeatedDelivery": {
    "chars": 9134586,
    "denominator": 19085470,
    "basis": "new payload chars with the same session kind and slot identity in a later segment"
  },
  "exactDuplicate": {
    "chars": 6710447,
    "denominator": 19085470,
    "basis": "new payload chars byte-identical after the first payload"
  },
  "normalizedDuplicate": {
    "units": 29350,
    "denominator": 71897,
    "basis": "new unit occurrences equal after normalize, including oversize, after the first"
  }
}
```

## The seat's own reads, by class

| Class | Calls | Chars |
| --- | --- | --- |
| precedent | 0 | 0 |
| known-bugs | 272 | 113,286 |
| tests | 970 | 672,492 |
| brief | 192 | 144,396 |
| docs | 6,511 | 5,825,868 |
| source | 14,797 | 3,984,749 |
| outside | 2,224 | 1,959,364 |
| discovery | 12,906 | 3,036,865 |
| unclassified-bash | 64,422 | 10,144,659 |
| memory | 295 | 259,289 |
| delegation | 374 | 393,822 |
| web | 10 | 37,929 |
| skill | 6 | 199 |
| write | 599 | 112,991 |
| other | 2,330 | 1,804,980 |

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
      "entries": 226,
      "found": 226,
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
      "entries": 551,
      "found": 551,
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
      "entries": 1258,
      "found": 1258,
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
      "entries": 1045,
      "found": 1045,
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
  "skipped": [],
  "exclusions": [
    {
      "reason": "unrecorded-system",
      "count": 17
    }
  ],
  "events": [
    {
      "reason": "queued-unmatched",
      "count": 38
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
