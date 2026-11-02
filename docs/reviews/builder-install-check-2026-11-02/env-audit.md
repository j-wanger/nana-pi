# Builder environment audit — Revision 2

Threat model: honest caller variation; deliberate sandbox defeat is out.

The shared exported `builderChildEnv(entry, cwd)` in `worker-config.mjs` returns a frozen object. `pi-worker.mjs` imports it as `workerEnv` for both runtime branches. The object preserves the previous property order, string values and runtime split. Credential additions remain composed by `credentialStripEnv` at the existing call sites.

| Family | Set by | Consumer in install-check | Decision | Evidence scope |
| --- | --- | --- | --- | --- |
| `NANA_WORKTREE_ROOT` | shared builder definition | real gate lane write boundary on its own turn | remove | M1 all key casings; M2 real gate/post-edit/judge under inherited builder environment |
| `NANA_ROLE` | shared builder definition, reviewer definition | knowledge and runtime role selection | remove | existing R-1071 and M3 classification |
| `NANA_HANDOFF` | Claude builder definition, reviewer definition, watchdog | lifecycle/handoff suppression | remove | existing R-1071 and M3; watchdog addition audited, not tested under full watchdog environment |
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY` | `CLAUDE_BUILDER_CHILD_ENV` | hooks run directly, not Claude Code runtime | keep | M3 classification; no full Claude runtime run |
| `BASH_DEFAULT_TIMEOUT_MS`, `BASH_MAX_TIMEOUT_MS` | shared Claude builder definition | no affected consumer found in direct hooks or pi turn | keep | M3 classification; unchanged worker-claude tests |
| `GIT_CONFIG_PARAMETERS`, `GIT_CONFIG_COUNT`, numbered `GIT_CONFIG_KEY_n` / `GIT_CONFIG_VALUE_n` | `credentialStripEnv` | review git steps supply their own identity; README rehearsal clones locally | keep credential resets | M3 derives actual additions, including inherited counted slots; credential-strip tests; not a full install |
| `GIT_ASKPASS`, `SSH_ASKPASS`, `GIT_TERMINAL_PROMPT`, `GCM_INTERACTIVE` | `credentialStripEnv` | credential dispatch; sandbox needs no credentials | keep credential resets | M3 classification and credential-strip tests |
| nested `NANA_WORKTREE_ROOT` | install-check's own pi-worker step | its nested builder gate | remove outer boundary; nested worker supplies its own | existing install-check build assertions; no nested model session started |
| `PI_SESSION_ID`, `PI_SESSION_FILE` | pi tool runtime | profile runtime metadata (`profile-config.mjs`) | leave runtime metadata | no affected sandbox consumer found; not tested under full reviewer environment |
| `NANA_REVIEW_ROOT` | pi-review | no affected consumer found in install-check | leave; audit only | not tested under a full reviewer environment |
| watchdog state | watchdog | environment addition is `NANA_HANDOFF=off`; capture/state otherwise travels by options/files | remove handoff override | audit only; not tested under full reviewer environment |

## Sealed decisions

`OVERRIDE_ENV`: `PI_CODING_AGENT_DIR`, `PI_CODING_AGENT_SESSION_DIR`, `CLAUDE_CONFIG_DIR`, `NANA_SHARED_MEMORY_DIR`, `NANA_KNOWLEDGE_HOME`, `NANA_ROLE`, `NANA_SETUP_PLATFORM`, `NANA_TEST_TEMP_ROOTS`, `NANA_HANDOFF`, `NANA_WORKTREE_ROOT`.

`KEPT_CALLER_ENV`: `CLAUDE_CODE_DISABLE_AUTO_MEMORY`, `BASH_DEFAULT_TIMEOUT_MS`, `BASH_MAX_TIMEOUT_MS`, `GIT_CONFIG_PARAMETERS`, `GIT_CONFIG_COUNT`, anchored numbered `GIT_CONFIG_KEY_\d+` and `GIT_CONFIG_VALUE_\d+` patterns, `GIT_ASKPASS`, `SSH_ASKPASS`, `GIT_TERMINAL_PROMPT`, `GCM_INTERACTIVE`.

M2 runs on native Windows with the non-exempt branch: the sanitized write passes, the leaked boundary blocks, and the real post-edit handler's record passes the real judge only for the sanitized write. Its Linux `/tmp` branch permits both calls by design. Fixtures live under the OS temp directory, never in the repository.

## Existing-test edits

- `sealed override list removes every listed key and caller npm config keys case-insensitively`: length 9 becomes 10 and the expected list gains the lane boundary.
- `pin R-1071: the override list`: its second seal also gains the lane boundary. The new contract makes both old assertions false.

No other existing test changed. `worker-lane.test.mjs` and `worker-claude.test.mjs` remain unedited.

## Precedent and exports

- The lane follows the existing override contract and case-insensitive filtering; no new filtering algorithm.
- Revision 2 explicitly authorizes moving the private `workerEnv` definition into `worker-config.mjs`. It is exported there as `builderChildEnv`; no copy remains. This is the planned departure from the read-only launcher precedent, not an additional standing-authorization export.
- No private gate, post-edit, or install-check helper was exported or copied. Tests load real extension entry points and import `acceptedTempRoots`, `within`, `buildEnvironment`, `judgePiPostEdit`, and `credentialStripEnv`.
- The new test uses the existing setup `tmpDir` cleanup helper, after the test-runner source check rejected a direct temporary-directory call. No production behavior changed for this correction.

Known bugs: the complete FEAT-013 known-bug file was read. This change fixes only the brief's leaked builder lane boundary; it changes none of the listed known bugs.

Not run here: full install-check, model sessions, macOS install check, reviewer environment rehearsal, full suite (AGENTS assigns it to CI). The seat owns macOS installation evidence and subsequent review/push.
