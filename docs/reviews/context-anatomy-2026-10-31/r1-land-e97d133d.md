Two MUST findings remain.

1. **MUST — Cloud authentication settings are dropped.**  
   `packages/nana-pack/bin/worker-config.mjs:104` carries provider switches but omits `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, and `GOOGLE_APPLICATION_CREDENTIALS`.

   Realistic input: a terminal or pi seat launches a reviewer whose cloud credentials exist only in Claude’s user-settings `env`. Isolation removes those settings; the carry helper preserves the provider selection but loses authentication. A previously working reviewer cannot authenticate.

   A temporary-fixture probe confirmed all four names are dropped. Carry the required credential configuration and test settings-only Bedrock and Vertex authentication inputs.

2. **MUST — A hook test now writes into the real Windows profile.**  
   `packages/nana-setup/tests/shared-memory-input.test.mjs:32` supplies temporary `HOME` and `CLAUDE_CONFIG_DIR`, but neither `USERPROFILE` nor `PI_CODING_AGENT_DIR`. Its explicit child environment also discards the suite runner’s temporary `USERPROFILE`.

   On Windows, `os.homedir()` falls back to the actual user profile when `USERPROFILE` is absent. The newly added logging in `packages/nana-setup/claude/hooks/nana-shared-memory.mjs` therefore appends this test’s delivery to the real `.pi/agent/nana-context-loads.jsonl`.

   Set both home variables and an explicit temporary agent directory in this fixture. This is a platform-path finding; I did not execute Windows locally.

**Verification:** All ten `context-anatomy.test.mjs` checks passed locally. Those checks do not cover either failing input above.

VERDICT: SEND-BACK
