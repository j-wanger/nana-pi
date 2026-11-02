I'm sending this back. One blocking issue stands: the seat adapter splits every real compaction into two segments. Its tests pass, but they use an order of events that real seat transcripts never have.

To find this I ran small read-only probes over the real seat transcripts. They printed only entry types, counts and the hook status labels, which are public strings in `packages/nana-setup/lib/settings.mjs:207-210`. No transcript text, owner text or session id was printed or written.

## MUST

**1. Each real compaction becomes two segments (R-3641; this is the plan attack's MUST 2 again).**
- **Code:** `apps/bench/lib/anatomy-seat.mjs:129` ends the start window on any entry that is neither a boundary nor a standing event.
- **What the contract says:** the README (`apps/bench/README.md` seat section) says only assistant work, owner turns, tool results, queued commands and prompt hooks end it. Plan A2 says a boundary, its summary and the SessionStart:compact hooks "open one segment, not two".
- **Realistic input:** every compaction in the real seat files. Between the boundary and its hook refresh, Claude Code records 11 to 26 attachments:
  - instructions, session context, date and the summary;
  - then `total_tokens_reminder`, `file`, `task_status`, `invoked_skills`, tool-list updates, environment and model.
  
  `total_tokens_reminder`, `file` and `task_status` count as harness or attached files, so they end the window. The hook group then opens a second "compact" segment.
- **Measured through the adapter:** in 56 of 57 compactions, the summary segment holds no owner turn, knowledge pull or tool call, and a second compact segment carrying the hook refresh follows it.
- **Why the test misses it:** the T2 fixture puts the boundary, summary and hook next to each other, an order the real files never show.
- **Effect on the deliverable, `seat-counts.md`:**
  - "Segments: 132" counts about 55 starts that never happened.
  - Most of "unrecorded-system 79" says the system prompt is missing where the transcript records it. 55 summary halves have no system prompt; the hook half after them holds it, in its start window.
  - The files, skills and tool lists re-attached at compaction are labelled `turn` instead of start-window.
  - The "By start type" and "By phase" tables therefore misreport what the seat is given at each start. Measuring that is the main use the brief names.
- **Fix:**
  - End the window only on the README's listed events, so other attachments and bookkeeping entries do not end it.
  - Add a T2 fixture in the real order: boundary, instructions, session context, date, summary, token reminder, file, task status, invoked skills, tool lists, environment, compact hooks, prompt snapshot.
  - Regenerate `seat-counts.md`.

## SHOULD

1. **Startup and /clear start rows leave out the system prompt and instructions.** In real files those arrive after the owner's first prompt and its environment and tool attachments. Even under the README's list, the owner turn ends the window first. So `seat-counts.md` reads "startup: shared-memory 76.34, hook-other 23.66", and all 20 startup and clear segments count as unrecorded-system, though 14 of them record a system prompt. A segment's first snapshot and instructions should count as start content, or the table should say what it measures.
2. **The objective, adoption and roster-notice kinds never appear.** `SEAT_POLICY.hooks` (`apps/bench/lib/anatomy-config.mjs`) matches on file names such as `nana-objective`. The real `command` field holds the hook's status label, for example "nana: objective + current priority". Only shared memory matches, because `SLOT_MARKERS` lists its label. The objective-and-frontier block, adoption and roster notice all land in `hook-other` (160,340 chars), so the owner cannot size the objective block. Separately, the roster notice's text arrives in a `hook_additional_context` entry with no command (41 entries), which always counts as `hook-other`, not as its hook's kind.

## NOTE

- Seat step 2, the `/context` comparison, is not done, and `seat-counts.md` says so. The plan put it before the final round.
- `seat-counts.md` must be regenerated after MUST 1 is fixed.

## What checks out

- **Builder output unchanged:** I recorded the builder golden on current main code (`5e7b779b`) in OS temp. It equals the committed `builder-golden.json` exactly, and the branch passes against it. `pullsOf` still returns the same rows through `callClasses`, and `CLASS_FUNCTION` is untouched.
- **Reuse is by import:** `ownerTurn`, `textOnly`, `rows`, `callClasses`, `transcriptFiles`, `streamEntriesIn`, `segmentPart`, `distinctUnits`, `normalize` and `SLOT_MARKERS` are all imported. The new options on shared readers are off by default.
- **Recorded is not delivered:** headline shares use recorded-input only, unknown chars sit in a separate column, and the interpretation line is printed.
- **No chars counted twice across compactions:** each entry is pushed once. Inherited parts, resume copies and forks stay out of the totals.
- **Privacy:**
  - The identity scan finds nothing.
  - No session-id pattern or home path appears in the diff.
  - `seat-counts.md` is counts only.
  - The T8 tripwires cover every command, and the checkout refusal comes before any transcript is read.
- **Tests:** the touched tests pass, 7 files and 120 checks.

VERDICT: SEND-BACK
