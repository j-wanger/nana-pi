All four MUSTs are done and committed as `d4426ca` on `lane/u2-agent-dir`, parent `4b1d45f`.

**Astra's two counterexamples, re-run before and after**
- **Stage keys** (`node /tmp/u2repro/sk.mjs <module>`): a desk on the default dir records a key for a live session, then a desk on a custom dir opens its store.
  - Before (HEAD `stage-keys.mjs`): the record exists `true` → `false` after the custom-dir desk runs.
  - After: `true` → `true`.
- **Knowledge home** (with `PI_CODING_AGENT_DIR=/tmp/u2-land-custom`, comparing the installer's `resolveLayout().knowledgeHome` with the runtime's `home()`):
  - Before: installer `/tmp/u2-land-custom/nana-knowledge`, runtime `~/.pi/agent/nana-knowledge`.
  - After: both are `/Users/jwang/.pi/agent/nana-knowledge`.

**What changed**
- **MUST 1:** each stage-key record now stores the sessions root it was issued under (`sessionsRoot`, resolved). A desk prunes a record only when that root matches its own. A record with no root is pruned only by a desk on the default `~/.pi/agent/sessions`. A record that can't be read is kept. The empty-enumeration guard is unchanged. The server passes its sessions dir to the store.
- **MUST 2:** `knowledgeHome` is `<base>/.pi/agent/nana-knowledge` unless `--pi-home` or `--home` is given. The reason is in a comment in `paths.mjs` and in the setup README.
- **MUST 3:** the plist template gets `PI_CODING_AGENT_DIR` (absolute) in `EnvironmentVariables` when the chosen dir is not `<base>/.pi/agent`. Otherwise the plist is byte-identical to before, so nobody without an override gets a service reload. There is no service definition on win32 or other platforms: `stepDesk` skips them, so there was nothing to change there.
- **MUST 4:** added an "Agent directory" contract to the desk README, which also covers the pin rule and the fixed exceptions. I replaced the `~/.pi/agent` paths in that README with `<agent dir>`. The `AGENTS.md` warning now states both conditions. The setup README documents the refusal for `install`, `project` and `project --check`; I checked each one exits 2. I corrected the claim in `receipts.ts`.

**Where the pin shows now:** the "Open a session" popover shows the pin note right under its title (`public/app.js`). The Settings note is still there.

**Tests:** `env -u NANA_HANDOFF npm test` → 77 files: 76 PASS, 0 FAIL, 1 SKIP; 4748 checks; exit 0. The new tests:
- **MUST 1:** 7 "two roots" checks in `stage-key-persistence.test.mjs`.
- **MUST 2 and 3:** new `packages/nana-setup/tests/agent-dir-consumers.test.mjs` (13 checks). It asserts the installer path equals the runtime default under an absolute override, and reads the rendered plist from a real `install --desk` run; `plutil -lint` accepts it. That run passes `--claude-home`, so `launchctl` is never called.

**Diff and scope:** 12 files, +152/−27. Excluding tests, 10 files and +113/−27 lines, within the appetite. Every file is on the allowlist, and none of the NOT items were touched.

**Residuals**
- A record written by a desk on one root, for a session id that also exists under another root, is re-tagged to whichever desk wrote it last. This is harmless because session ids are unique.
- A corrupt `<id>.json` is no longer deleted by the prune; the next lookup of that session still moves it aside.
- The pin note in the popover is untested: no end-to-end test covers it.
- Updating the authoritative handoff for when U2 lands is still open.

**The claim most likely wrong:** that the plist change is a no-op for the default user. It depends on `path.resolve(layout.piHome)` equalling `path.join(base, ".pi", "agent")` exactly. A `PI_CODING_AGENT_DIR` that points at `~/.pi/agent` through a symlink, or with a trailing oddity the resolver keeps, would render a redundant but harmless entry and trigger one reload.

VERDICT: DONE
