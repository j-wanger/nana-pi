All three MUSTs are fixed and committed as `37e77fd` on `lane/u2-agent-dir`. I re-ran both of the reviewer's probes against the old code (HEAD `624cf8e`, in a temporary worktree I've since removed) and against the new code; the split shows before and is gone after.

**Reviewer's probes, before → after**
- **Desk vs. spawned session** (`agent-dir-parity.test.mjs`, now with the desk, the test process and the spawned session in three different cwds): before, 7 FAIL, including `session project/rel-agent vs desk desk-cwd/rel-agent`. After: all PASS. The child's environment now carries the absolute `…/desk-cwd/rel-agent`. Absolute, tilde and unset values reach the child unchanged.
- **Normal `nana-setup` run** (`relative-agent-dir.test.mjs`): before, 12 FAIL. `install` exited 0 and seeded `<cwd>/rel-agent`, and `doctor` said "all good" with exit 0. After: all PASS.
- **Variable spellings** (`agent-dir-var-spellings.test.mjs`): before, 6 FAIL, because the old regex matched malformed forms. After: all PASS. The four spellings still block for both files, all three separator variants (`/`, `\`, `//`), and quoted and mixed-case forms. Literal active-dir and default-dir paths still block.

**What the desk tells the user, and where:** `/api/settings` has a new field, `agentDirNote`. It shows as a line at the top of the Settings modal, above every tab, and only when the value is relative: "PI_CODING_AGENT_DIR is a relative path, so each pi would resolve it against its own start folder. This desk resolved it to <abs>; every session started here is given that absolute directory, so the settings shown are the ones sessions read. pi started outside the desk still resolves the relative value itself." It doesn't quote the raw value: the one-resolver test would flag server.mjs reading `process.env.PI_CODING_AGENT_DIR` directly, and `agent-dir.mjs` isn't on my allowlist.

**`nana-setup`:** `install` (including `--dry-run`) with a relative value in the environment and no flag exits 2. The message names the resolved directory and the cwd, and says to pass `--pi-home <absolute dir>` or set an absolute value. `doctor` still runs every check, then prints a `!` line naming the cwd it resolved against, never says "all good", and exits 1. I chose exit 1 for the warning myself; the brief only said "warning, not healthy".

**Tests:** `env -u NANA_HANDOFF npm test` exits 0: 76 files, 75 PASS, 0 FAIL, 1 SKIP; 4717 checks pass, 0 fail, 6 skip.

**Size and scope:** `git diff --stat` shows 12 files, +226/−20. Excluding tests that is 9 files, +63/−14, within the ≤10 files / ≤200 LOC appetite. Every file is on the allowlist. I didn't touch the settings/auth floor, handoff store, round-cap ledger, stage keys, deleted-cwd STOP behaviour, or add any migration.

**Residuals**
- pi started outside the desk still resolves a relative value against its own cwd. That's pi's behaviour, and the note says so.
- `nana-setup project` doesn't check for the relative case. It has no refusal or warning, and it seeds nothing into the agent directory.
- If the desk's own cwd has been deleted, the resolver returns the value unresolved and the desk passes it on still relative. The reviewer ruled STOP correct for that case.

**Claim most likely wrong:** that every pi process the desk starts goes through `childEnv`. I checked the `spawn`/`execFile`/`exec` calls in server.mjs, and apps.mjs, which uses `deps.childEnv`. I didn't audit other desk modules or indirect launches.

VERDICT: DONE
