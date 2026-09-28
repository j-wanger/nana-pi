# Architecture review — tranche 1 lane contracts (Opus 5.5, 2026-09-28)

Read-only over both repos. Grades: **PRIMARY** = source/docs I read or a command I ran; **INFERRED** = reasoned from code, not executed; **unverified** = not checked. Scratch probe: `research/raw/2026-09-27-advances/scratch-arch/trust-probe.mjs`.

## 0. Findings that change the tranche before any contract is written

**F1 — HIGH, PRIMARY. pi 0.84.4 auto-trusts a repo whose `.pi/` holds only nana files, so "require project trust" does not stop the handoff attack, and the existing config trust guard does not protect anything in that case.**
- pi asks about trust only when the cwd has one of `.pi/{settings.json, extensions, skills, prompts, themes, SYSTEM.md, APPEND_SYSTEM.md}` or an ancestor has `.agents/skills` (`dist/core/trust-manager.js:8-16,150-169`; `docs/security.md:9-16`: "A bare `.pi` directory does not count").
- When none of those exist, the session is trusted without asking: `projectTrusted = … (!hasTrustRequiringResources || trustStore.get(cwd) === true)` (`dist/main.js:573-579`; the same expression is in the shipped bundle `dist/bundle/chunks/chunk-OMWWHBTG.js:1548`, which is what the `pi` bin runs). `resolveProjectTrusted` also returns `true` straight away (`dist/core/project-trust.js:21-23`). A saved "no" decision is ignored on that path.
- `ctx.isProjectTrusted()` returns exactly that value (`agent-session.js:2055`, `interactive-mode.js:1619`). Its docs describe it only as a boolean, and nothing tells an extension whether trust was auto-granted or actually decided (`docs/extensions.md:994-998`).
- My probe output: `.pi/nana-pack.json + .pi/handoff.md` gives `hasTrustRequiringProjectResources = false`, which means trusted. Adding `.pi/settings.json` gives `true`, which means pi asks. A nested cwd under a repo whose root has `.pi/settings.json` gives `false`, so it is auto-trusted too.
- Consequences:
  - (a) The Opus C4 probe used `isProjectTrusted: () => false` (`w3/gate2-probe.mjs:27`). Real pi returns `true` for that exact evil-repo shape. A fix that only calls `ctx.isProjectTrusted()` would pass the probe and still inject the file.
  - (b) The same applies to `lib/config.ts:77-78`. A cloned repo that ships only `.pi/nana-pack.json` gets its `gate.allowPatterns` honored (the gate is off), and its `postEdit.commands` run on the first edit. That is repo-supplied shell execution with no trust prompt. pi itself refuses repo code (`.pi/extensions`) without a prompt, so nana is weaker than its host here. INFERRED from code, not run end-to-end in a live pi session.
  - (c) There is no `~/.pi/agent/trust.json` on this machine (PRIMARY: Read → does not exist), and `settings.json` does not set `defaultProjectTrust`. So every project-scope nana behaviour Jake has today runs on auto-trust. Any fix that requires a real trust decision switches project config off in every repo until Jake trusts it once.
- **What it changes:** item 1 must define nana's own trust predicate, and item 3 should move handoff storage to user scope rather than "require trust". The contracts below do both.

**F2 — Blast radius on existing tests, PRIMARY.** 12 of the 13 nana-pack test files build a nana-only `.pi/` fixture and pass `isProjectTrusted: () => true` (Grep). Every one of those fixtures changes meaning once the predicate is fixed. Budget for it: the fixture churn is where most of the cost of lane 1 sits.

**F3 — Tests read the real HOME, PRIMARY.** `gate-status.test.mjs` and others load `os.homedir()/.pi/agent/nana-pack.json` unless the test overrides `HOME`; `objective-injection` and `post-edit-hardening` do override it. A shared runner has to isolate HOME, or every lane's acceptance depends on the machine it runs on (Opus C13).

**F4 — Other writers of nana-pack.json, PRIMARY.** The desk settings window writes user and project `nana-pack.json` directly (`apps/desk/server.mjs:1311,1426-1432`). `nana-setup project` seeds `.pi/nana-pack.json` (`nana-setup/lib/project.mjs:142`), and the `adopt-structure` skill tells agents to create it (`SKILL.md:102`). These writes happen outside pi's tool calls, so the gate never sees them. That is the right channel for a human, and the contracts must keep it working.

---

## 1. Sequencing and coupling (read this first)

```
L4 test path ──► L1 config ──► L2 gate ─┐
                          └──► L3 handoff ┴─► adversarial passes (one per ⚠ lane)
```

| Coupling | Why | Rule |
|---|---|---|
| L1 → L2, L3 | Both import `loadConfig`. L3 needs L1's trust predicate for a *custom* `handoff.path`. L2 needs L1's per-file diagnostics to tell malformed from valid. | L1 lands first. L2 and L3 start from L1's merged commit, never from a parallel branch. |
| L4 → all | Each lane's acceptance is "root `npm test` exits 0". Without L4 each worker invents its own runner. | L4 lands first. It is small and has no semantics. |
| L2 ↔ L3 | L2's protected paths must *not* cover L3's new user-scope handoff store: agents are told to update the handoff in place. | L2 corpus includes "edit of the handoff store → ALLOW". L3 names the store path in its README section. |
| L2 ∥ L3 on `packages/nana-pack/README.md` | Both rewrite sections of one file. | Each lane edits only its own section (Gate bullets vs Handoff bullets). The seat merges L2 before L3. |
| L3 ↔ tranche-2 review ledger | L3 adds a non-writer marker to `bin/pi-review.mjs`, and tranche 2 #6 rewrites that file. | L3 touches only the child `spawn` env (one line + test). Tranche 2 rebases on it. |
| L1 ↔ objective | `objective` is user-scope only and the objective walk belongs to tranche 2. | L1 must leave `objective-injection.test.mjs` passing with no assertion changes (fixture HOME changes are allowed). |

Why this order and not parallel: L1 changes what every fixture means (F2). Running L2 or L3 in parallel against the old `config.ts` guarantees a rebase that reopens their adversarial passes.

---

## 2. Lane contracts

### L4 — Canonical test path (not ⚠; ordinary review)

**Outcome.**
- From the nana-pi root, `npm test` runs every `packages/*/tests/*.test.mjs` plus `apps/desk/test/*.test.mjs` (unit only).
- It prints one PASS/FAIL line per file and a total, and exits non-zero if any file does.
- `nana-setup doctor` prints detail text that matches its ✓/✗.

**Invariants and tests.**
- `scripts/test.mjs` (the runner) is cross-platform:
  - no shell globs;
  - spawns `process.execPath --experimental-strip-types <file>` serially;
  - gives each file a fresh temp `HOME` **and** `USERPROFILE`;
  - excludes `*.e2e.mjs` (fixed ports, and model spend on three suites: sol §C test notes) and `apps/bench/studies/**/fixture/**`, which holds copies of the nana-pack tests (PRIMARY: Grep hit list).
- `packages/nana-setup/tests/doctor-detail.test.mjs` (new) builds four layouts for `rules/nana-personal.md` (regular file, symlink, directory, absent) and asserts status + detail:
  - regular file → ✓ with a detail that does **not** contain "not a regular file";
  - symlink → ✗ with the exact existing string `private rule is a symlink — replace with a regular file`, which `install.test.mjs:198` already pins;
  - directory → ✗ "not a regular file";
  - absent → ✗ with an actionable detail (e.g. "missing — run install to seed it").
- That test fails today on the regular-file case (`doctor.mjs:51-58`, PRIMARY).
- A runner self-test: a deliberately failing fixture file makes `npm test` exit non-zero. Run it via a flag or env, so it is not in the default set.

**Allowlist.** Root `package.json` (`scripts.test` only), new `scripts/test.mjs`, `packages/nana-setup/lib/doctor.mjs` (detail strings only), the new doctor test.

**Must not touch.**
- Any test's assertions.
- Any extension.
- The `pi` field of the root `package.json`.
- No `prepare`/`postinstall` script: `pi install git:` would run it (INFERRED from npm semantics; unverified for pi's installer).

**Pi constraints.** None at runtime. Windows: `post-edit-hardening.test.mjs:84` shells `pgrep`. The runner must report that as that file's failure or declared skip, never hide it.

**Breaks.**
- `gate-status` and anything else that silently read the real `~/.pi/agent/nana-pack.json` now sees an empty HOME. That is intended (F3).
- `pi-registration.test.mjs:143-144` turns its tilde case into a SKIP. That is acceptable, and it must print SKIP, not PASS.

**Cost.** 1 worker session; about 80 LOC runner plus a 60 LOC test. Ordinary review only.

**Falsifier.** On today's tree, `npm test` exits 0 with a file count of 28 package files plus 13 desk unit files (sol counted 1,711 checks including 11 e2e files; the unit-only total will be lower). If any file flips result under the isolated HOME, that file was machine-dependent. List it, don't paper over it.

**Most likely wrong.** That every current test passes under an isolated HOME. Unverified; one or two may rely on real state.

---

### L1 ⚠ — Config safety and the nana trust predicate

**Outcome.**
- `loadConfig` never throws. For any bytes in either file it returns a fully typed config.
- A malformed *leaf* falls back to that leaf's default. A malformed array *entry* is dropped. A file that fails to parse contributes nothing.
- Each of these produces a diagnostic, surfaced once per session per (file, problem) as a `config_invalid` journal line and one UI warning when a UI exists.
- Project-scope config is honored only under **nana-trust**:
  - pi reports the session trusted, **and** trust was actually decided. Either pi would have asked (trust-requiring resources exist at the cwd), or the owner recorded trust for this directory outside the repo.
  - Auto-trust of a nana-only `.pi/` does **not** count (F1).
- A project config that exists but is ignored is announced, never silent.

**Invariants and tests.**
- `tests/config-normalize.test.mjs` (new, temp HOME + USERPROFILE):
  - For each of the 7 blocks, and separately for each leaf, try the values `null, 7, "x", [], true, {}, {"unexpected":1}` at user scope, then again at trusted project scope. Assert: no throw; every leaf has its documented type; the invalid leaf equals its default; valid sibling leaves survive.
  - Named cases: sol's `{"postEdit":{"commands":null}}` and `{"objective":{"path":7}}`, and Opus's trailing-comma file.
- `tests/config-handlers-malformed.test.mjs` (new): drive every registered handler under each malformed user config:
  - gate `tool_call`;
  - post-edit `tool_result`;
  - objective `session_start` + `before_agent_start`;
  - handoff `session_start` + `session_compact`;
  - notify;
  - lifecycle.
  - Assert: none throws; the gate still blocks `rm -rf /tmp/x` headless; objective yields text or the `OBJECTIVE UNAVAILABLE` marker; one `config_invalid` journal line names the file.
- `tests/config-trust.test.mjs` (extended; keep its 5 existing cases' intent):
  - nana-only fixture + `isProjectTrusted: () => true` → project ignored (**the F1 case**);
  - fixture with `.pi/settings.json` + `true` → honored;
  - the owner-recorded trust path → honored;
  - no API → closed;
  - "ignored project config" produces exactly one notice.
- "Never widens": for every malformed variant, the effective `gate.allowPatterns` is a subset of the valid config's list, and `postEdit.commands` from project scope is empty unless nana-trusted.

**Allowlist.**
- `lib/config.ts`.
- `extensions/nana-lifecycle.ts`, only to surface diagnostics once per session.
- New tests, plus fixture setup in the 12 existing test files (trust-fixture changes and HOME isolation only, no assertion edits).
- README Config section.
- `templates/_shared/working-under-nana-pi.md` and `skills/adopt-structure/SKILL.md`: add one line on how to trust a project, so seeded post-edit config is not silently inert.

**Must not touch.** Gate pattern lists, handoff logic, objective resolution (tranche 2), `bin/pi-review.mjs`, desk.

**Pi constraints that shape the design.**
- `loadConfig` runs inside `tool_call` on every inspected call. It must stay synchronous and cheap, so trust evidence is resolved at `session_start` and cached per cwd.
- There is no API that separates auto-trust from a real decision (F1). nana must recompute "would pi have asked" itself. pi exports `hasTrustRequiringProjectResources` and `ProjectTrustStore` from its public index (`dist/index.js:31`, PRIMARY), and runtime imports from pi are a documented extension pattern (`extensions.md:796,1932`).
- pi is **not** resolvable outside the pi process: `import('@earendil-works/pi-coding-agent')` from nana-pi → `ERR_MODULE_NOT_FOUND` (PRIMARY). So the predicate needs a fail-closed fallback in bare harnesses, the same pattern as post-edit's `loadFileQueue`.
- Owner-recorded trust: pi's `/trust` writes `trust.json` (`docs/usage.md:132`). Whether `/trust` is offered, and whether it writes, in a directory with nothing trust-requiring is **unverified**. If it does not, the lane adds a user-scope list (e.g. `trustedProjects` in `~/.pi/agent/nana-pack.json`): an owner act at user scope, the same shape as `objective.projectFile`.
- win32: `os.homedir()` reads `USERPROFILE`; the directory canonicalisation used for trust must match pi's (`canonicalizePath`); drive-letter and case handling are unverified.
- Handler throws BLOCK the tool (`AGENTS.md:51`; `extensions.md:2922`).

**Breaks and replacement contract.**
- (1) *Every repo that relies on a nana-only `.pi/nana-pack.json` loses its project config until Jake trusts it once.* INFERRED: the-hive (Opus A2 says it configures `.gd` checks; I could not list it, since it is outside my allowed dirs). Practical loss is small: 0 receipts on this machine (Opus A2). Replacement: a one-time owner act, plus the visible "project config ignored — trust with …" notice. The seat must tell Jake this in one line **before** landing.
- (2) `config-trust.test.mjs` "trusted: project config honored" now needs a trust-requiring fixture.
- (3) The README sentence "read live on every event" still holds for L1.

**Cost.**
- Code: about 150–250 LOC.
- Tests: about 250 LOC new plus fixture edits in 12 files.
- Effort: 1–2 worker sessions, 1 adversarial round, and probably 1 fix round, because the predicate is subtle.

**Cheapest falsifier.** Already run: `trust-probe.mjs`. If a live `pi` session in a temp repo with only `.pi/nana-pack.json` `{"gate":{"allowPatterns":[".*"]}}` blocks `rm -rf /tmp/x` headless today, F1(b) is wrong and L1 shrinks to normalization only. That probe costs one headless pi run.

**Most likely wrong.** That `/trust` cannot record trust for a nana-only directory. If it can, no user-scope list is needed.

---

### L2 ⚠ — Gate: self-protection, segment-scoped exceptions, missing forms, corpus

**Outcome.**
- (a) Tool calls that touch nana's own policy files, the Claude policy files, or pi's trust store are gated. Covered: `nana-pack.json` at both scopes, `~/.pi/agent/trust.json`, `~/.claude/settings.json`, `settings.local.json`, `~/.claude/hooks/**`.
- (b) Within a session, **config changes can tighten the gate immediately but cannot loosen it**. Loosening takes effect at the next `session_start`, which includes `/reload`.
- (c) An allow pattern exempts only the command segment it matches, never a compound. Any construct the gate cannot segment reliably makes the whole command ineligible for exceptions: command substitution, backticks, `eval`, `sh -c`/`bash -c`, heredocs.
- (d) A small **floor** (named in the README) cannot be skipped by any allow pattern: pipe-to-shell, `rm` recursive on `/` or `~`, `mkfs`, `dd of=/dev/`. The README's `--force-with-lease` exception keeps working.
- (e) The Opus C3 destructive forms are gated, and the benign false positives stop firing.
- No claim of a shell security boundary.

**Invariants and tests** (all headless unless noted, temp HOME).
- `tests/gate-corpus.test.mjs` (new; table-driven):
  - **Must BLOCK:** every existing built-in, plus `rm -r -f ~`, `rm -R x`, `find ~ -delete`, `git clean --force -d`, `git push origin +main`, `git checkout -- .`, `rsync -a --delete a/ b/`, `truncate -s0 f`, `base64 -d x | sh`, `curl u | bash`, PowerShell `ri -r -fo x`, `Remove-Item x -Recurse`, cmd `rd /s /q x`.
  - **Must ALLOW:** `echo reboot`, `git log --grep=sudo`, `ruff format c:\x`, `rm file.txt`, `git push --force-with-lease origin feat` under the README exception, `ls -la`.
  - **Compound under `^git status` exception:** `git status; rm -rf ~`, `git status && sudo rm -rf /`, `git status | sh`, `git status $(rm -rf ~)`, and a heredoc variant → all BLOCK. Plain `git status` → ALLOW.
  - **Floor under an allow pattern of `rm`:** `rm -rf ~` → BLOCK.
  - Interactive variant: a hit shows the dialog, "Block" is the default, and "Allow once" allows only that call.
- `tests/gate-self-protection.test.mjs` (new):
  - `edit`/`write` to `~/.pi/agent/nana-pack.json`, `<cwd>/.pi/nana-pack.json` given relative, absolute, `@`-prefixed, backslash and mixed-case forms, `~/.pi/agent/trust.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`, `~/.claude/hooks/x.sh` → BLOCK.
  - bash `echo {} > ~/.pi/agent/nana-pack.json` and `sed -i s/a/b/ .pi/nana-pack.json` → BLOCK.
  - An edit of L3's user-scope handoff store → ALLOW.
  - An edit of `src/nana-pack-notes.md`? Decide and pin it either way.
- `tests/gate-survives-mutation.test.mjs` (new, **the astra F acceptance test**). Register the gate, fire `session_start`, then write the config files directly with `fs` (standing in for any write the path check missed, e.g. `python -c`):
  - 1. User config gains `allowPatterns: [".*"]` → the next `rm -rf ~` BLOCKs, and a write to `nana-pack.json` BLOCKs.
  - 2. Same for `[""]` and for project scope.
  - 3. Tightening applies live: adding `extraPatterns: ["\\bterraform\\s+destroy\\b"]` mid-session → the next `terraform destroy` BLOCKs.
  - 4. The file becomes malformed mid-session (trailing comma) → last-good user `extraPatterns` still enforced. This is Opus C6.
  - 5. Firing `session_start` with `reason:"reload"` adopts the loosened config, and a `gate_policy_widened` journal line records it.
  - 6. An allow pattern that matches the empty string is rejected at load, with a warning.
  - 7. The status tally stays correct throughout.
- Unchanged and passing: `gate-status.test.mjs`, `gate-config-robustness.test.mjs`. These handlers get called without `session_start`, so the policy must initialise lazily on first `tool_call`.

**Allowlist.**
- `extensions/nana-gate.ts`.
- New `lib/` helper(s) for command segmentation and path resolution. It may *copy* the pure path resolver from post-edit, but must not edit `nana-post-edit.ts`.
- New tests.
- README Gate bullets.
- `AGENTS.md` gate paragraph only if wording changes.

**Must not touch.**
- `lib/config.ts` semantics (L1 owns them; L2 consumes the diagnostics).
- Handoff, objective, post-edit.
- The `read` tool: gating reads is a scope decision, see Residuals.
- Desk settings writes (F4), which are the human channel.

**Pi constraints.**
- Handler throws block the tool. Segmentation errors must resolve to "no exception applies", not throw.
- Later extensions can mutate input after the gate, with no revalidation (sol C2, citing `extensions.md:778-793`).
- `edit`/`write` paths are resolved by pi relative to cwd, with `@` stripped (`nana-post-edit.ts:74`). Protection must run on the resolved path.
- `session_start` fires for startup/new/resume/fork/reload (`extensions.md:399`), so the policy snapshot refreshes on each.
- win32: backslashes, case-insensitive paths, PowerShell aliases.

**Breaks and replacement contract.**
- (1) **README "read live on every event — edits apply without restarting"** (`README.md:108-109`) and the `config.ts` header comment. Replacement: *gate loosening applies at the next session start or `/reload`; tightening and every non-gate block stay live.*
- (2) The desk settings window's gate edits (F4) loosen only after reload. That needs a one-line note in `apps/desk/README.md`; outside the allowlist, so the seat adds it. Whether the desk promises live apply is unverified.
- (3) `allowPatterns` "skip gating entirely — checked first" (`config.ts:30`) becomes "exempt the matched segment from non-floor patterns".
- (4) A headless agent can no longer maintain `nana-pack.json` or Claude settings through pi tools. Replacement: the human channels are `nana-setup`, the desk, or an interactive "Allow once".
- (5) `echo reboot`-style commands stop blocking, which is intended.

**Cost.**
- Code: patterns and segmentation about 150–250 LOC.
- Tests: the corpus plus the three test files, about 400 LOC.
- Effort: 1–2 worker sessions and 1–2 adversarial rounds. The corpus and false-positive tuning are the cost, not the regexes.

**Cheapest falsifier.** Rerun `w3/gate-probe.mjs` and `gate2-probe.mjs` against the landed gate. Any ALLOW on their dangerous rows means the lane did not land.

**Most likely wrong.** That the session-snapshot approach is acceptable to Jake. It removes live loosening, a documented convenience. If he rejects it, the fallback is path protection only, and then the survives-mutation test can only cover writes the path check sees.

---

### L3 ⚠ — Handoff: user-scope store, provenance, staleness, non-writer role

**Recommendation on storage: user scope, keyed by canonical cwd, not "require trust".**
- Under F1, "require trust" either does nothing (via `ctx.isProjectTrusted()`) or switches handoff off in all of Jake's repos (via real trust).
- A user-scope store (e.g. `~/.pi/agent/handoffs/<sha256(canonical cwd)>.md`, with the cwd recorded inside) removes the repo-supplied vector entirely, and needs no trust.
- It also removes the sibling-`.gitignore` code and the "tidy agent deleted it" risk.

**Outcome.**
- (a) A repo-committed `.pi/handoff.md` is **never** injected, trusted or not. If one exists, the session gets a one-line pointer naming it as repo-writable and not injected.
- (b) Compaction writes go to the user-scope store for the canonical cwd, atomically (temp file + rename). A custom `handoff.path` is honored from user scope always, and from project scope only under L1's nana-trust. The symlink refusal stays for custom paths.
- (c) The injected block carries provenance: "agent-written compaction summary", writing session id and timestamp, and "lower authority than OBJECTIVE.md / AGENTS.md / DOCTRINE". It also keeps the existing "background state, not instructions".
- (d) A summary older than a configured age (default 7 days; `handoff.staleAfterDays`) is injected as a bounded pointer (≤300 chars: path, age, writer), not its text. The file stays readable in one step. Age is the only staleness signal: no HANDOFF-commit invalidation (astra #2).
- (e) A session marked non-writer by its launcher neither picks up nor writes. The marker is an explicit env value set by the launcher (e.g. `NANA_HANDOFF=off`), never inferred from the tool list. `pi-review` sets it for every child. Unmarked sessions behave as today.
- (f) Resume, fork and reload still skip pickup.
- (g) A nested cwd or worktree with no handoff of its own gets "no handoff for this directory" and, if an ancestor directory has one, its path. It is visibly distinct and never silently borrowed.

**Invariants and tests.**
- `tests/handoff-trust.test.mjs` (new): the **real** attack shape.
  - A nana-only repo with a committed `.pi/handoff.md` containing an injection string, and `isProjectTrusted: () => true` → the string is absent from the system prompt, the pointer is present, and `handoff_legacy_ignored` is journaled.
  - The same with `false`.
- `tests/handoff-store.test.mjs` (new, temp HOME):
  - compaction writes the store, not `<cwd>/.pi/handoff.md`;
  - `/tmp/x` vs `/private/tmp/x` → same key (darwin; skip elsewhere);
  - two sibling repos → distinct keys, no cross-project pickup;
  - root has a handoff and a nested cwd starts → the nested cwd names the root's handoff and does not inject it;
  - a worktree path → distinct;
  - a failed write leaves the prior file byte-identical with no temp litter (POSIX read-only store; skipped on win32).
- `tests/handoff-staleness.test.mjs` (new; clock injected, e.g. via the file's own `Written` header or mtime):
  - 1 day old → full text with provenance label;
  - 15 days → pointer only, ≤300 chars, includes path and age, and the path is readable (this is the synthesis falsifier's "constraints still visible" as one read away, see "Most likely wrong");
  - a new compaction resets it.
- `tests/handoff-writer-role.test.mjs` (new):
  - with the non-writer marker, `session_compact` leaves the store byte-identical, `before_agent_start` injects nothing, and `handoff_skipped_role` is journaled;
  - `pi-review`'s child spawn env contains the marker (test the env builder, not a live pi).
- Kept or adapted: `handoff-symlink.test.mjs` custom-path cases; the resume/fork/reload skip; the "update in place" wording, now naming the store path.

**Allowlist.**
- `extensions/nana-handoff.ts`.
- `bin/pi-review.mjs`, spawn env only.
- New tests; rewrite of `handoff-artifact.test.mjs` and the default-path parts of `handoff-symlink.test.mjs`.
- README Handoff bullets; `templates/_shared/working-under-nana-pi.md:29`.

**Must not touch.**
- `lib/config.ts` beyond adding the `handoff.staleAfterDays` leaf through L1's schema. If L1 has landed, this is a one-leaf addition reviewed with L3.
- Gate, objective, desk.
- The-hive's existing `.pi/handoff.md`: don't delete it. The pointer handles it, and deleting is Jake's call.

**Pi constraints.**
- `session_compact` carries `compactionEntry` and `reason` (`extensions.md:477-482`).
- `ctx.sessionManager.getSessionFile()` gives provenance (`extensions.md:401`).
- `before_agent_start` chains the system prompt, so objective and handoff order depends on load order. Keep the existing behaviour.
- Print, json and rpc modes have `hasUI` false, but the desk runs pi sessions, so hasUI is not a role signal (INFERRED; whether desk sessions are rpc with UI is unverified). Hence the explicit marker.
- win32: hash the canonical path with case folded on win32 only; `rename` over an existing file is atomic enough on NTFS (unverified).

**Breaks and replacement contract.**
- (1) **README "writes … to `<cwd>/.pi/handoff.md` … The file is the artifact"** (`README.md:170-173`; `nana-handoff.ts:1-19`). Replacement: the artifact lives in the user-scope store, its path is printed on pickup and on write, and it can still be edited by hand.
- (2) Sibling `.pi/.gitignore` management is removed. `handoff-artifact.test.mjs`'s three gitignore checks go away, and `"update .pi/handoff.md in place"` becomes the store path.
- (3) "Never delete it" is dropped from the prompt: its reason (tidy agents in the repo) is gone. The check "prompt forbids deletion" goes too.
- (4) The the-hive 09-13 summary stops being injected on the first session after landing. That is the intended fix for Opus E1. Its text is not migrated automatically: repo-supplied text must not be laundered into the trusted store.
- (5) The handoff-symlink default-path cases become moot.

**Cost.**
- Code: about 200 LOC changed.
- Tests: about 300 LOC new or rewritten.
- Effort: 1–2 worker sessions and 1–2 adversarial rounds.

**Cheapest falsifier.** Run `handoff-trust.test.mjs` against today's code: it fails, because the string is injected with trust `true`, and after the lane it must pass. If Jake says he edits `.pi/handoff.md` by hand in-repo and wants it versioned, user scope is wrong. The fallback is repo-local plus L1's nana-trust, accepting that handoff goes dark until `/trust`.

**Most likely wrong.** The staleness pointer. The synthesis falsifier says a stale summary shows "with its constraints still visible". A pointer makes them one read away, not visible. If the seat reads "visible" literally, (d) must inline a bounded excerpt, which reintroduces the stale-imperative problem that motivated it. The seat should pick one and state it to Jake.

---

## 3. Is "one project-root rule" tranche 1 or tranche 2? — Recommend: split it

**Tranche 1 (in L1, used by L3):**
- One exported function resolving nana's project directory as **the canonical cwd**. That is today's behaviour for both config and handoff, and it matches pi's own rule for `.pi/settings.json` ("Project (current directory)", `docs/settings.md:8`; `sdk.md:895`).
- Plus a visible notice when an ancestor directory holds a `nana-pack.json` or handoff that this cwd is not using. This satisfies the synthesis falsifier's "or a visibly named distinct one" at near-zero risk.

**Tranche 2 (with the objective producer, after ruling 1):** any *walk-up* or git-root rule. Reasons:
1. The objective walk is governed by the 09-18 decentralization ruling, which ruling 1 may change. Unifying roots before that ruling fixes a rule the ruling may reverse.
2. Walk-up config is a new trust surface. pi auto-trusts a nested cwd even when the repo root has `.pi/settings.json` (probe case 3, PRIMARY). A root-level `nana-pack.json` applied to nested cwds would be honored without any trust decision, unless the trust design is redone for ancestors.
3. It diverges nana from pi's own cwd rule, adding the incoherence the priority is meant to remove.

**Cost of deferring:** sessions launched in `packages/x` keep missing root config and continuity, now loudly instead of silently.

---

## 4. Breaks, collected

| Documented feature / test | Lane | Replacement |
|---|---|---|
| Project `.pi/nana-pack.json` honored on auto-trust | L1 | Honored on real trust or an owner-recorded trust; a visible notice when ignored |
| `config-trust.test` "trusted: project config honored" fixture; 12 test fixtures' trust shape | L1 | Fixture gains a trust-requiring resource or owner-recorded trust |
| "Read live on every event" (README:108) for **gate loosening** | L2 | Loosening at next session start/`/reload`; tightening live |
| `allowPatterns` "skip gating entirely" (config.ts:30) | L2 | Segment-scoped exemption; a non-skippable floor |
| Headless agent edits of `nana-pack.json` / Claude settings | L2 | Human channels: nana-setup, desk, interactive Allow once |
| Handoff at `<cwd>/.pi/handoff.md`, sibling `.gitignore`, "Never delete" prompt | L3 | User-scope store, printed path, provenance label |
| `handoff-artifact.test` gitignore and deletion checks | L3 | Store, atomicity and provenance tests |
| `doctor` ✓ with "not a regular file" | L4 | Correct detail; the symlink string is kept verbatim |

## 5. Honest cost (INFERRED estimates; dollar cost not estimated)

| Lane | Worker sessions | Adversarial rounds (sol via pi-review, within the 3-cap) | Main risk to schedule |
|---|---|---|---|
| L4 | 1 | 0 (ordinary review) | Machine-dependent tests surfacing |
| L1 | 1–2 | 1 (+1 fix round likely) | Fixture churn; trust predicate without a pi API |
| L2 | 1–2 | 1–2 | False-positive tuning; Jake accepting snapshot semantics |
| L3 | 1–2 | 1–2 | Staleness-pointer semantics; migration messaging |
| **Total** | **4–7** | **3–5** | Serial L4→L1 critical path; L2 and L3 in parallel after |

Every ⚠ lane gets deterministic tests **and** an independent adversarial pass before landing (nana-agent-loop `AGENTS.md`; astra F). Shared files do not make the lanes one "small config lane" (astra F, last line).

## 6. Residuals deliberately left out of tranche 1

- The `read` tool stays ungated (`.env` readable). Gating reads would block `.env.example` reads headless: a false positive already present for *edits* of `.env.example` (`nana-gate.ts:39`). Keep it as a named residual.
- The gate cannot see writes by code the agent runs (`node -e`, `python -c`). The survives-mutation invariant bounds the *effect* on the gate, not the write.
- The gate source itself (`~/nana-pi/packages/nana-pack/extensions/nana-gate.ts`) is editable in nana-pi sessions by design.
- Loop-runner pi sessions (Opus C10) are out of scope, dormant.

## 7. On the operating rules

- "Verify greps before concluding" and "verify fix claims mechanically" worked for the grep and fix claims, but not for probe *fixtures*. C4's probe hard-coded the host's trust answer, and three lanes plus the seat carried it forward. Suggested addition to the rule: a probe that stubs a host API must cite the host code that produces that value.
- "Spec the contract, not the design" (DOCTRINE) is followed here except in three places where the host forces the shape: the trust predicate, snapshot-vs-live, and the env marker. Those are flagged as constraints, not prescriptions.

VERDICT: DONE

Most-likely-wrong (claims in this report I would bet against first):
1. `/trust` cannot record trust for a nana-only directory. Unverified; if it can, L1 needs no user-scope list.
2. F1(b) end-to-end (a hostile nana-only repo turns off the gate or runs `postEdit` commands in a live pi session). Derived from source and a unit probe, not a live `pi` run.
3. Every current test passes under L4's isolated HOME.
4. Jake accepts losing live gate loosening (the L2 snapshot).
5. The desk runs pi with `hasUI` true, which is my reason for rejecting hasUI as a role signal. Unverified.
