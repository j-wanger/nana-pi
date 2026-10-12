## MUST

1. **The desk orphan-process diagnosis remains in the triage.**  
   The crash-path evidence still says the kill reaches only `cmd.exe` and can orphan the Node child. The buffer-caps evidence repeats the same mechanism. This contradicts the existing Windows process-tree kill in `apps/desk/server.mjs:628–639` and the new withdrawal note. Remove those teardown claims from the evidence paragraphs.

## SHOULD

None.

## NOTE

- The handoff now records both Windows totals with the correct checkout conditions.
- The handoff correctly distinguishes hosted CI from the missing Windows machine install-and-hooks rehearsal.
- The handoff and session archive now label the AGENTS refresh cause as suspected.
- Both stale README statements were removed.
- No code, workflow, requirements, or tests changed after `6a6e5e2`.
- The added files are review records and the round-two brief.
- Score: **9/10**. Every round-one finding except the incomplete orphan-diagnosis withdrawal is closed.

VERDICT: LAND-WITH-FIXES
