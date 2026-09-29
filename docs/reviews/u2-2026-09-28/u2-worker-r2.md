I fixed all five MUST items in one commit, `a8135f6` on `lane/u2-agent-dir`. `env -u NANA_HANDOFF npm test` exits 0. I re-ran all three of the reviewer's probes before and after the fix: each hole shows up on the old code and is closed now.

**Tests:** `env -u NANA_HANDOFF npm test` → `74 files: 73 PASS, 0 FAIL, 1 SKIP, 0 WARN · checks: 4619 pass, 0 fail, 6 skip`, exit 0. New tests: `tests/agent-dir-hostile.test.mjs` (A, B, C), `tests/agent-dir-parity.test.mjs` (MUST E), and one project-scope dangling-link row added to `config-project-gate-fallback.test.mjs`. On a checkout of the old HEAD `c602c68` the new tests fail: 18 hostile checks, 19 parity checks, and the project row (it allows `ls`).

**Probes** (`node --experimental-strip-types /tmp/u2fix/u2-{config-symlink,adversarial,deleted-cwd}.mjs "$PWD"`):
- **A (symlinked policy file):** before, edits, writes and `printf x >` to the link's target were ALLOW; after, all BLOCK. The fix also covers the default `~/.pi/agent` location and `trust.json`, including the first hop of a dangling link.
- **B (dangling link):** before, `dangling-config` gave no stop and silently fell back to defaults; after, the gate stops with "unreadable (dangling symlink → …/no-target)". The directory and unreadable cases still stop; a genuinely missing file still means defaults. If a link goes dangling mid-process, the last valid policy is kept.
- **C (deleted cwd):** before, `piAgentDir`, `piTrustStorePath`, `loadConfig` and `tool_call` all threw `ENOENT uv_cwd`; after, all four return. Because the active file can't be known, the gate stops with a named reason ("agent dir unresolvable…") instead of throwing.

**Desk: constants, not per-request.** The desk never changes its own environment or working directory, and every pi it spawns inherits the same environment. So the value can't change while the desk runs; changing the variable means restarting the desk. The reasoning is in a comment at the constants.

**Beyond the four named constants:** I also moved the desk's `PI_DIR` and `SESSIONS_DIR` to the active agent dir. Otherwise the desk would write the active `settings.json` but list resources from the old one. I also fixed two stale placeholder texts in `app.js` (journal and receipts) and made the "Global instructions" heading use the server's path. The user-scope label now comes from the server's `nanaPath`.

**One resolver:** `git grep -n -E "process\.env\.PI_CODING_AGENT_DIR" -- ':!**/tests/**' ':!**/test/**'` finds only `packages/nana-pack/lib/agent-dir.mjs:58,75` and `apps/bench/lib/pi-exports.mjs:180`. The bench one passes the raw value to pi's own pricer, which resolves it, so it isn't a second resolver. The parity test enforces this. I also confirmed the gate, objective and lifecycle extensions load through pi's real extension loader with no errors, since the `.ts` → `.mjs` import is new.

**Diff and scope:** 16 files, +494/−108 in total. Excluding tests: 13 files, +232/−108, within the 16-file / 400-line ceiling, so no checkpoint was needed. Everything is inside the extended allowlist. Two deliberate additions beyond the brief's wording: the `PI_DIR`/`SESSIONS_DIR` change above, and a new informational "pi agent dir" line in `nana-setup doctor` saying which directory it checked and why. `AGENT_DIR_VAR_RE` is kept, and `README.md` and `AGENTS.md` now say exactly which spellings are caught and that general variable expansion, including `cd <dir> && … > nana-pack.json`, is not. The handoff store, round-cap ledger, stage keys, `objective.ts`, the trust predicate and the T2c label are untouched.

**Residuals:**
1. `templates/_shared/working-under-nana-pi.md` (lines 11, 44, 77 and the gate paragraph) still says `~/.pi/agent`. It isn't on the allowlist, but it's rendered into every scaffolded project's `AGENTS.md`, so this is the same stale-declaration defect T2c was blocked for and needs its own item.
2. The `--pi-home` help text in `packages/nana-setup/bin/nana-setup.mjs` still says "default ~/.pi/agent" (also outside the allowlist).
3. A symlinked project `.pi/nana-pack.json` still doesn't put its target on the floor, because `policyFileHit` has no cwd; only the user-scope and default-dir files are covered.
4. With a relative `PI_CODING_AGENT_DIR`, the desk resolves it against its own working directory, while the pi sessions it spawns resolve it against each session's directory.
5. `settings.json` / `auth.json` in the active dir are still not on the floor, as the brief directed.
6. An existing user config that pins `objective.path` to `~/.pi/agent` is left alone; there is no migration.

**The claim most likely wrong:** the deleted-cwd case now blocks every gated tool. I believe that's the conservative reading of the fallback rules, since the gate can't know which policy file pi is reading. A reviewer could reasonably want the session's last valid policy kept instead, but that policy is stored under the old absolute path, so this build can't find it.

VERDICT: DONE
