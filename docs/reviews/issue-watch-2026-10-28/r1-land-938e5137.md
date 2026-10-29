- **SHOULD — Cursor can retreat across restart.** In `packages/nana-pack/lib/issue-watch.mjs:36,110–111`, `githubTime` starts at negative infinity. If the first response contains only an older edited comment, its creation time moves the cursor backward. I reproduced yesterday’s edited comment being delivered after restarting with that cursor. Initialize the watermark from the incoming cursor and add this restart case to the tests.

Validation: issue-watch, handoff-issues, and frontier-golden tests passed locally. Windows CI remains a landing prerequisite.

No MUST findings.

VERDICT: LAND
