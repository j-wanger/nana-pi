## Findings

- **MUST — an editor save can still be overwritten during the Windows rename retry.** `packages/nana-setup/lib/project.mjs:272-281` performs its final identity and content checks, closes the descriptor, then retries `renameSync` without rechecking the destination. If an editor holds `AGENTS.md`, writes new content, and closes it after the first `EPERM` or `EBUSY`, the next retry replaces that saved content. This is realistic Windows file-locking behavior and causes data loss. The test at `packages/nana-setup/tests/project-working-region.test.mjs:109-135` only replaces the file before the descriptor closes, so it cannot catch this retry-window bug.

Focused tests passed locally: project working-region 27/27, project 121/121, and CI workflow 12/12. The recorded final Windows runs show the same target counts. PF1–PF5 otherwise have implementation and evidence, and the HANDOFF/session records match that evidence.

VERDICT: SEND-BACK
