# L1 fix round (after sol r1 BLOCK): both findings fixed, `npm test` exits 0

**Commits** on `lane/l1-config-safety`, not pushed:
- `4108aec`: removes the persisted snapshot, adds the stop when a new process starts with a malformed gate block, and makes diagnostics ignore `journal.enabled`.
- `3966d4e`: drops the leaf's "— using the default" suffix from the stop reason, because it contradicted the block.

**`npm test`:** exit 0. `59 files: 58 PASS, 0 FAIL, 1 SKIP · checks: 2576 pass, 0 fail, 6 skip`.

**Snapshot removed:** `git grep gate.validated` outside `docs/` only finds `config-gate-fallback`, which plants the old file on purpose. The last good policy now lives only in memory, per process.

**New process with a malformed gate block (HIGH):** I used a temp HOME with `{"gate":{"allowPatterns":".*"}}` and also planted a wider policy in the old snapshot file, then drove the real gate handler in a new node process. All five calls were blocked:
- `bash` `rm -rf /tmp/x`, `bash` `ls`, `powershell`, `edit` and `write` each returned `{"block":true,"reason":"nana-gate: user nana-pack.json gate block is malformed — repair it (…/.pi/agent/nana-pack.json:gate.allowPatterns: expected an array of regex strings, got string — using the default)"}`. That output was captured before `3966d4e` removed the suffix.
- The journal got `config_invalid` and `config_gate_fallback` lines.

**Planted wider policy after restart (`config-gate-fallback` d):** I put `allowPatterns:[".*"]` files in six places: the old snapshot path, `nana-pack.gate.json`, `nana-pack.json.bak`, `$HOME/nana-pack.json`, the cwd's `.pi/nana-pack.json`, and the cwd's `.pi/…validated.json`. In a new process, `rm -rf` and `ls` are both blocked with the stop reason. Against the old `config.ts` the same test gives `{"rm":null,"ls":null}`, which is sol's bypass, so the test catches it.

**Diagnostics with journaling off (MED):** new case in `config-normalize` using sol's input `{"journal":{"enabled":false,"path":7}}`. Exactly one `config_invalid` line is written at the default journal path, and journaling stays disabled. Putting the `enabled` check back makes this case fail.

**Test cases changed, with the new contract:**
- **`config-gate-fallback`:**
  - (a) "a validated snapshot was persisted" became "nothing persisted beside the config".
  - (b) "new process enforces the snapshot" became "stop after restart": bash (including terraform destroy), powershell, edit and write are blocked, the reason names the problem, and `read` is untouched.
  - (c) now uses a malformed leaf in a new process; interactive sessions stop with no dialog, and repairing the file restores service.
  - (d) adds "new process is stopped, so even the last valid allow no longer applies" and the planted-file case. It drops "malformed snapshot leads to stop" because there is no snapshot any more.
  - (e) adds "no config file in a new process = defaults, no stop".
- **`config-normalize`:** the stop regex changed from `/repair nana-pack\.json/` to the new reason format (2 assertions). The test's `VALID` journal path moved from `/tmp/nana-j.jsonl` to a temp dir, because diagnostics now get written there.
- **`gate-config-robustness`:** the planted snapshot file is replaced by loading a valid user gate block `{}` in the same process first. No assertion lines changed.

**`git diff --stat` vs main:** 20 files, +1184/−67.

**Residuals:**
- The agent can still edit the user's `nana-pack.json` directly and widen the gate at once (L2).
- One bad gate entry at user scope stops or falls back the whole gate policy.
- A trusted project's gate settings can still replace the user's denies.
- Nothing was run on Windows.

**Most likely wrong:** that mid-session fallback cannot be bypassed. It relies on memory keyed by the user config path. If the same process switches HOME (tests only), it starts with a clean state and a malformed file stops the gate. That is safe, but I have not probed it inside real pi.

VERDICT: DONE
