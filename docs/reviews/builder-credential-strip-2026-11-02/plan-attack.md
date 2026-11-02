## Findings

All probes used temporary fixture credentials and removed their files. No stored credential was accessed; no suite ran.

1. **MUST — Inherited `GIT_CONFIG_PARAMETERS` defeats the strip.**  
   **Evidence:** Plan A1 (`plan.md:23`) incorrectly calls counted environment configuration highest-precedence. On Git `2.56.0.windows.2`, running `git credential fill` with the proposed three controls and an inherited fixture `credential.helper` in `GIT_CONFIG_PARAMETERS` returned exit **0**, `password=true`. Adding `GIT_CONFIG_NOSYSTEM=1` changed nothing. Global, repository-local and conditional-include helpers were suppressed by the reset; the installed system helper is `manager`.  
   **Fix:** Handle inherited command-scope configuration explicitly, preserving unrelated settings while making the reset effective. Add this case to M1–M3. Distinguish inherited configuration from deliberate child overrides.

2. **MUST — Disabling terminal prompts does not disable askpass.**  
   **Evidence:** With an empty helper list, `GIT_TERMINAL_PROMPT=0`, `GCM_INTERACTIVE=never`, and a temporary `GIT_ASKPASS` script returning fixture text, `git credential fill` returned exit **0**, `password=true`. This contradicts A1 and M1’s no-password/no-prompt claim (`plan.md:23,90`).  
   **Fix:** Cover `GIT_ASKPASS`, `core.askPass` and `SSH_ASKPASS` explicitly. Test that fixture askpass programs are never invoked, rather than merely checking a helper-free failure.

3. **MUST — Claude’s settings environment can undo a spawn-only strip.**  
   **Evidence:** `pi-worker.mjs:166–172` supplies sealed settings separately from the eventual spawn environment. `claude-review.mjs:103` likewise constructs settings before spawning the ledger. `claude-settings-carry.mjs:49` copies only supplied sealed names into settings. Existing measured residuals say project settings still supply unsealed environment names (`docs/known-bugs/FEAT-006.md:68–69`). O1 only requires child-environment merges.  
   **Fix:** Put the same effective strip into Claude’s flag-settings environment, not just its process environment. Test conflicting project/local settings through both Claude launch paths. Keep managed-policy precedence as an explicit residual.

4. **MUST — A supported reviewer entry point remains unstripped.**  
   **Evidence:** A3’s exhaustive-launch claim (`plan.md:25`) misses standalone `review-ledger run -- …`. Its actual model spawn inherits `process.env` plus reviewer markers (`packages/nana-pack/bin/review-ledger.mjs:168`). Going through `claude-review` would inherit its strip; direct ledger launches would not.  
   **Fix:** Apply the shared control at the ledger’s model-spawn boundary and include that route in M2. Record other launches by reachability: land subprocesses inherit the caller environment; mutation tests preserve counted Git settings but scrub `NANA_ROLE` (`lib/mutation-runner.mjs:407–415`). README rehearsal overwrites the count (`packages/nana-setup/lib/readme-rehearsal.mjs:76–79`). Do not equate every subprocess with a model child.

5. **MUST — The requirement change leaves contradictory live contracts and reporting instructions.**  
   **Evidence:** `REQUIREMENTS.md:826` expressly requires push-and-stop and push-result reporting, while `REQUIREMENTS.md:152` requires the old dated ruling. Their tests pin those literals (`worker-lane.test.mjs:418`; `rulings.test.mjs:365–382`). The preamble’s report shape still demands the pushed branch, pushed SHA and push exit code (`builder-preamble.md:38`), beyond the line O4 replaces.  
   **Fix:** Amend or retire R-3436 and R-3437 before adding new rows. Replace push-result reporting with branch/tip and verification evidence. Declare affected feature shares, update trace markers and tree movement, and retain shared-marker parity. Express M3 as preservation of unrelated effective Git settings; keep the chosen append mechanism in design/seal evidence.

6. **SHOULD — Specify gate precedence and false-positive policy before writing patterns.**  
   **Evidence:** The proposed precedent permits configured allow patterns to exempt `segHit` matches (`nana-gate.ts:165–182`). Thus an existing broad `^git` exception can defeat M4 without deliberate evasion. O3 blocks every helper binary, while M4 leaves `git credential-cache exit` undecided (`plan.md:33–40,97–100`). Existing corpus tests deliberately gate some documentation mentions (`gate-corpus.test.mjs:103`).  
   **Fix:** Decide whether credential refusals are floor rules. Pin cache shutdown, documentation mentions, executable paths, Git global options and PowerShell call forms. Say unset roles receive **unchanged existing policy**, not unconditional permission.

7. **SHOULD — Document legitimate authentication losses where consumers read the contract.**  
   **Evidence:** O2 justifies reviewer stripping because reviewers never push (`plan.md:32`), but helper authentication also serves private HTTPS fetches, submodules and Git-backed package dependencies. The immutable pi checkout is created locally before the model spawn (`pi-review.mjs:178–185`), so it needs no blanket credential exception. The expected changes omit the pack README.  
   **Fix:** Add a compatibility matrix and seat-owned recovery path for authenticated downloads. Preserve ordinary provider authentication and registry configuration; Git helpers are not pi’s provider login. Update `packages/nana-pack/README.md`, not only known bugs.

8. **SHOULD — Make the residual claim precise and keep smoke evidence synthetic.**  
   **Evidence:** The threat model includes opportunistic helper commands (`plan.md:59`), yet explicitly leaves scripted direct-helper access available (`:64`). Empty Git helper configuration does not disable a directly invoked GCM executable; noninteractive mode is not denial of stored-token access. M8 nevertheless requests a real parent credential lookup (`:106`).  
   **Fix:** State that this prevents Git’s normal helper dispatch, not credential access generally—even for a well-intentioned builder. Preserve that accepted residual rather than promising helper-command coverage. Replace M8’s real-secret lookup with the same temporary helper through the installed launchers; masking output does not avoid retrieving the secret.

**Counts: 5 MUST, 3 SHOULD.**
