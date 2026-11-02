1. **MUST — M3’s exported inventory does not prove launch-environment coverage.**  
   **Evidence:** `plan.md:70` permits exporting variable names without requiring launchers to consume that definition. A new inline variable could therefore leave the audit green. The stated audit also omits `BASH_DEFAULT_TIMEOUT_MS` and `BASH_MAX_TIMEOUT_MS` (`pi-worker.mjs:400–401`), `NANA_REVIEW_ROOT` (`pi-review.mjs:245`), and watchdog-added state (`pi-watchdog.mjs:190`). Credential configuration includes dynamically numbered slots (`credential-strip.mjs:25–35`).

   **Fix:** Extract an import-safe environment builder actually consumed by the launchers, or independently inspect their assignments. Audit pi, Claude, reviewer and watchdog additions, including numbered Git configuration families. Require a wrong-code test that adds an **actual launch variable** without classifying it. Importing pack helpers from setup is already precedent (`install-check.mjs:14,18`); importing the executable worker is unnecessary.

2. **MUST — M2’s negative control is not portable as specified.**  
   **Evidence:** `nana-gate.ts:128–135` always adds `/tmp` on non-Windows systems, independently of redirected temporary variables. Install-check creates its home beneath `os.tmpdir()` (`bin/install-check.mjs:18`). On Linux with ordinary `/tmp`, `<home>/project` remains exempt even after restoring `NANA_WORKTREE_ROOT`. M2’s mandatory “same call … is blocked” (`plan.md:69`) would fail despite correct production behavior.

   **Fix:** Specify the fixture’s filesystem placement and assert that the target lies outside **every** accepted temporary root before expecting rejection. Cover the `/tmp`-exempt case separately: both gate calls should allow it, while M1 must still prove removal. Do not weaken the gate to manufacture the negative control.

3. **SHOULD — M2 proves gate permission, not the promised post-edit result.**  
   **Evidence:** The test stops at an allowed `tool_call` (`plan.md:66–69`). The actual extension independently loads configuration, runs the checker and appends its result (`nana-post-edit.ts:285–395`). `judgePiPostEdit` also requires the checker’s failure line, exit code and token (`install-check.mjs:246–257`). Gate permission alone proves none of those.

   **Fix:** Extend the lightweight probe through an actual temporary-file write, the real post-edit handler and `judgePiPostEdit`, using synthetic full pi/Claude builder environments. Pin a successful judgment after sanitization and `write-error` for a genuinely non-exempt leaked boundary. This needs no pi session or full install.

4. **SHOULD — Record the audit’s downstream conclusions, not just variable names.**  
   **Evidence:** Local review Git operations provide identity and disable signing (`install-check.mjs:444–450`); the README rehearsal redirects cloning to the local checkout (`readme-rehearsal.mjs:76–79`). Neither needs credentials. The nested worker installs its own worktree boundary (`pi-worker.mjs:397–402`), while its deterministic fixture only reports (`install-check-config.mjs`, `PI_BUILD.briefTask`). Thus these paths do not establish another failure from the caller’s boundary. Runtime shell metadata such as `PI_SESSION_ID` and `PI_SESSION_FILE` is also acknowledged in `profile-config.mjs:25–28`, but absent from the plan’s audit.

   **Fix:** Add a compact variable-family/consumer/keep-or-remove table covering these paths and runtime-added metadata. Keep credential resets; distinguish “no affected consumer found” from “tested under the complete builder environment.”

**Counts: 2 MUST, 2 SHOULD.**
