Feature: FEAT-041 · Shape each agent's context by role

Lane context-anatomy. Class: gate. Builder: pi-worker (larger lane). Build session 5, on this branch's tip (6808a04b).

Round 1 results on 6808a04b: the final reviewer said LAND; the land reviewer said SEND-BACK with two MUST findings; the independent check said FAIL on the same first finding. Fix both MUSTs.

1. Cloud logins are dropped. With user settings excluded, the carry keeps `CLAUDE_CODE_USE_BEDROCK` and `AWS_REGION` but drops the credentials and endpoints. The independent check ran the real Claude Code 2.1.310 binary against a fake local endpoint: main's reviewer reached the endpoint with an authorization header; this branch's reviewer produced no output and was killed after 240 seconds. The Claude Code builder is now worse than main too: it switches to Bedrock with no credentials. Add to the sealed carry lists in `packages/nana-pack/bin/worker-config.mjs`, with provenance: env names `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AWS_PROFILE`, `ANTHROPIC_BEDROCK_BASE_URL`, `ANTHROPIC_VERTEX_BASE_URL`, `ANTHROPIC_VERTEX_PROJECT_ID`, `CLOUD_ML_REGION`, `CLAUDE_CODE_SKIP_BEDROCK_AUTH`, `CLAUDE_CODE_SKIP_VERTEX_AUTH`, `GOOGLE_APPLICATION_CREDENTIALS`, `CLAUDE_CODE_USE_FOUNDRY`; settings keys `awsAuthRefresh`, `awsCredentialExport`, `gcpAuthRefresh`. Verify each name against the installed Claude Code before sealing it and drop any it does not read. Add a test that builds the reviewer's and the builder's settings from user settings carrying settings-only Bedrock and settings-only Vertex logins and asserts every credential and endpoint is carried, and a wrong-code pair. Secrets must still never reach stdout, stderr or the load log.

2. A hook test writes into the real home on Windows. `packages/nana-setup/tests/shared-memory-input.test.mjs` sets a temp `HOME` and `CLAUDE_CONFIG_DIR` but not `USERPROFILE` or `PI_CODING_AGENT_DIR`, and its explicit child environment drops the runner's temp `USERPROFILE`; on Windows `os.homedir()` then resolves the real profile and the new hook logging appends there. Set both home variables and an explicit temp agent dir in this fixture, and grep every other test that runs the hook or a launcher for the same gap and fix it the same way.

Optional, only if small: the Claude Code builder launched by `pi-worker` gets the same `--effort` read from user settings that `claude-review` now gets (final reviewer SHOULD). Report whether you did it.

## Done when

Green: locked full suite (foreground), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, `node scripts/identity-scan.mjs`, and the pair runner with the new pairs. Push and report the finished CI run for the new tip, Windows included; rerun a failed Windows job once and say if you did.

## Precedent

- `packages/nana-pack/bin/worker-config.mjs`: `CLAUDE_CARRY_KEYS`, `CLAUDE_CARRY_ENV_NAMES`.
- `packages/nana-pack/lib/claude-settings-carry.mjs`: the settings carry.
- `packages/nana-setup/tests/shared-memory-input.test.mjs`: the hook fixture.
- `packages/nana-pack/tests/context-anatomy.test.mjs`: the lane's tests.
