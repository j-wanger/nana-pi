## Round 3 review

**LAND.** Both round-2 MUSTs are closed by execution. Two non-blocking documentation/evidence residuals remain.

### MUST — None remaining

The new remedies accurately distinguish uncertainty from confirmed obstruction. The deployment order now closes both previously demonstrated windows.

### SHOULD — New rows cite weaker checks than their clauses

**Locations:** `REQUIREMENTS.md:55–56`; `packages/nana-pack/tests/objective-golden.test.mjs:1100–1104,1167–1169,1196–1198`.

R-856 requires admitting that emptiness could not be confirmed. Its cited checks instead assert waiting/removal advice and conditional reclamation.

R-857 prohibits claiming pi’s trust check fails. Its checks reject only the exact phrase “pi’s own trust check and /trust both fail.”

**Executed evidence:**

- Removed the held remedy’s inability-to-confirm sentence: every cited R-856 check remained green.
- Replaced the stale remedy’s uncertainty admission with “pi’s own trust check fails”: the cited R-856/R-857 checks remained green.
- The broader exact-text goldens caught these mutations: **12** and **4** failures respectively.

This is a citation/assertion mismatch, **not an undetected production regression**.

**Smallest fix:** Add the row markers and citations to the existing exact-text checks covering these fixtures, or strengthen the cited assertions.

**Residual to record:** R-856/R-857 are protected by broader goldens, but their current citations do not pin their stated clauses.

### NOTE — README incorrectly attributes reclamation to nana

**Location:** `packages/nana-pack/README.md:743–744`.

“Pi reclaims it, and so does nana’s own check” implies nana removes stale empty lock directories.

**Executed evidence:** With a readable stale empty lock and affirmative record, `trustRecord()` returned vouched while leaving the same lock inode present. Pi’s subsequent lookup reclaimed it successfully.

**Smallest fix:** Replace the parenthetical with: “pi reclaims it; nana’s check confirms emptiness and classifies the path as usable.”

The rest of the revised paragraph correctly distinguishes nana’s conservative classification from pi’s possible reclamation.

**Residual to record:** Nana diagnoses lock paths without reclaiming them; one README parenthetical says otherwise.

## Round-2 closure

### Unreadable-folder remedies — closed

**Locations:** `packages/nana-pack/lib/objective.ts:313–315,503–517`.

I independently recreated all requested fixtures against installed **pi 1.0.2**:

| Fixture | Nana classification | Pi lookup | Remedy assessment |
|---|---|---|---|
| Fresh unreadable non-empty folder | `store locked` | `ELOCKED` | Correct: admits uncertainty, prohibits removal, waits and rechecks |
| Stale unreadable empty folder, affirmative record | `lock path obstructed` | Returned `true` after reclamation | Correct: no unconditional failure claim; distinguishes the empty case |
| Stale unreadable non-empty folder | `lock path obstructed` | `ENOTEMPTY` | Correct: inspection first, conditional move-aside advice |
| Genuinely acquired unreadable lock | `store locked` | `ELOCKED` | Correct: protects the held lock |

The acquired-lock probe used installed proper-lockfile under `umask(0o444)`. Listing failed with `EACCES`; releasing the acquired lock removed it successfully.

Additional execution:

- Disabled the held-unreadable remedy branch: **19 failures**.
- Disabled the stale-unreadable remedy branch: **8 failures**.
- Compared **144** readable/non-unreadable remedy combinations against `42e7432^`: **byte-identical**.
- Restored production code and reran the entire objective file: **1,214 checks passed**, including real-hook versus registered pi-handler byte parity.

### Quiesce-first runbook — closed

**Location:** `docs/reviews/edge-builtin-mcp-2026-10-04/worker-report.md:509–539`.

The order is now sound: stop and confirm quiescence **before either checkout changes**, update both checkouts and manifest, start, verify, then retire the adapter.

**Executed evidence:** I launched an isolated real desk server with a stub pi that delayed its `get_state` response.

1. Began an app spawn and confirmed `get_state` was pending.
2. Sent SIGTERM, awaited desk exit, and confirmed the captured child PID was absent.
3. Replaced the temporary manifest.
4. Waited beyond the delayed-response deadline: no stale writeback occurred, and the listener was unavailable.
5. Restarted the desk: its manifest endpoint reported the replacement tool list.

This closes both the mixed-code transition and pending-writeback windows. No further ordering defect found. The actual launchd commands and live deployment remain the seat’s steps; I did not execute them.

## Verification and cap ruling

- Objective corpus: **1,214 passed**.
- Requirements trace/EARS: **passed**, zero off-form rows.
- Code map: **passed**, zero problems.
- README checker: the same **five declared missing-path findings**.
- All mutations restored; working tree clean.
- No live desk, configuration, or checkout changed.
- Full suites and model-driven MCP e2e were not rerun this round.

**Landing blockers: none.** Carry the two bounded residuals above; neither warrants another review round.

VERDICT: LAND — 9/10
