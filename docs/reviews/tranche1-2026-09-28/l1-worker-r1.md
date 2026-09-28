# Lane L1 report: config safety + nana-trust (pi 0.87.1)

**Commit:** `c1bc113` on `lane/l1-config-safety`. Not pushed.

**`npm test`:** baseline `55 files: 54 PASS, 0 FAIL, 1 SKIP · 2382 pass`. After: `58 files: 57 PASS, 0 FAIL, 1 SKIP · 2551 pass`. The three extra files are the new tests. `objective-injection.test.mjs` passes untouched (`git diff --quiet` on it is clean).

**Invariants and the tests that pin them:**
1. **Never throws, fully typed.** `config-normalize`: 1,470 checks over 7 blocks × each leaf × the 7 values, at user and trusted project scope. It also covers sol's `commands:null` and `path:7`, Opus's trailing-comma file, dropped array entries, a BOM file, garbage bytes and EISDIR. `config-handlers-malformed`: all six extensions under 24 variants. No handler throws, the gate blocks `rm -rf /tmp/x` headless, the objective text or marker is injected, and there is exactly one `config_invalid` line naming the file. There is one UI warning per session.
2. **Gate block never falls back to defaults.** `config-gate-fallback` a–e: a `terraform destroy` deny is loaded, the file is corrupted mid-session, and the command is still blocked. A fresh child process then enforces the snapshot. With no snapshot, bash, powershell, edit and write are all blocked with "repair nana-pack.json", including in interactive sessions. A corrupt snapshot also leads to that stop. The allowed set never exceeds the last valid policy.
3. **Project config needs nana-trust.** `config-trust` (23 cases) runs against the real installed pi trust module:
   - The F1 shape (nana-only `.pi/` with `isProjectTrusted` true) is ignored.
   - `.pi/settings.json` is honored.
   - Trust recorded in `trust.json`, for the folder or a parent, is honored.
   - A recorded "no" is ignored.
   - A settings file planted mid-session does not count; the next `session_start` picks it up.
   - A corrupt `trust.json` fails closed.
   - Evidence is shared across module copies.
4. **Ignored config is announced once.** `config-trust`: exactly one warning and one `config_project_ignored` line per session, and the warning names `/trust`.
5. **Bare harness fails closed.** `config-trust` "bare harness": `.pi/settings.json` plus `true` is still ignored.
6. **Never widens.** The normalize matrix checks allowPatterns ⊆ the valid list on every variant, and gate-fallback (d) does the same.

**Live check in real pi 0.87.1**, headless, temp HOME, this worktree's extensions:
- F1 repo with `allowPatterns:[".*"]`: `rm -rf` blocked, target survives, one ignored line with all six extensions loaded.
- Positive control (folder recorded in `trust.json`): config honored and the rm ran. So pi's trust module does load inside real pi.
- Agent writes `.pi/settings.json` and then edits a file: the repo's `postEdit` command did not run.

**Fallback design:** snapshot first, conservative stop if there is none. Every valid user load writes `~/.pi/agent/nana-pack.gate.validated.json`. The snapshot keeps a customised deny working across a restart; the stop covers a first-ever config that is broken, where there is no validated policy to fall back to. A missing file counts as defaults, not as malformed.

**Does `/trust` record a nana-only folder? Yes.** `interactive-mode.js:2529` opens the selector with no resource precondition, and `showTrustSelector` (line 4298) writes through `ProjectTrustStore.setMany`. Running pi's store on a nana-only folder saved it with its canonical path. So no `trustedProjects` list was added. I did not drive the TUI `/trust` itself.

**Found during the work, fixed:** pi loads each extension with its own copy of `config.ts` (`loader.js:411`, `moduleCache:false`). The first live run journaled the ignored notice twice. Worse, post-edit's copy would have worked out trust lazily, after an edit could have planted `.pi/settings.json`. The config state is now process-wide (`globalThis`). A mutation test fails if it goes back to per-copy state.

**Fixtures changed** (config moved to user scope under a temp HOME, no assertion edits): gate-status, gate-config-robustness, handoff-artifact, handoff-symlink, lifecycle-reload, notify-fallback, post-edit-file-queue, post-edit-hardening, post-edit-status, receipt-binding. `config-trust` was rewritten; its original five cases keep their intent.

**FINDING:** `gate-config-robustness` (a) "benign edit returns normally" with `allowPatterns:null` is false under invariant 2 when no snapshot exists, because the gate stops. Its fixture now seeds a validated snapshot. The replacement contract (no snapshot → stop) is pinned in gate-fallback (c).

**Size:** 20 files, +1152/−67, of which `config.ts` is +408. That is over the advisory 16 files / 500 LOC and the ~250 LOC code estimate; the brief's own allowlist (3 new tests + 12 fixtures + code + docs) already exceeds 16 files. Within budget, about $4.3 spent.

**Residuals:**
- A trusted project's gate leaves still replace the user's (existing merge semantics), so a project can drop a user deny.
- Any gate problem at user scope, even one bad entry, falls back to the whole snapshot.
- The snapshot file is agent-writable (L2's job).
- pi's `maybeSaveImplicitProjectTrustAfterReload` can write `trust:true` on its own, without an owner act.
- If `nana-lifecycle` is not loaded, trust is resolved at first use.
- Not tested on win32; canonicalisation is delegated to pi's own functions.
- Documented change: repos that relied on auto-trust lose project config until the owner runs `/trust` (README says this). Jake needs to be told before this lands.

**Most likely wrong:** that the conservative stop (which blocks every bash and edit call when a user's first-ever gate block is malformed) is acceptable in practice rather than being too harsh on a typo.

VERDICT: DONE
