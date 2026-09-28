# Review brief — lane L1: config safety + nana-trust predicate (gpt-5.6-sol, round 1 of 3) — roles: scope · adversarial · compatibility

Read-only except running tests/probes under a temp HOME. Worktree `~/nana-pi-wt/l1` (branch `lane/l1-config-safety`, commit `c1bc113` + merge of main). Clean diff vs main: `~/nana-pi/docs/reviews/tranche1-2026-09-28/l1-r1.patch` (20 files, +1152/−67). Worker report: `l1-worker-r1.md`. Brief the worker had: `l1-brief.md` (its invariants 1–6 are the contract). Arch contract: `~/nana-pi/research/raw/2026-09-27-advances/opus-arch-tranche1.md` §0 F1, §L1. Installed pi: 0.87.1 (`$(npm root -g)/@earendil-works/pi-coding-agent`).

Seat-verified (don't re-run whole): `npm test` → 59 files, 2568 checks, exit 0. Jake has already ruled (09-28, #8) that project-scope config is ignored per repo until trusted once — do not re-litigate that policy; review its implementation.

**Scope role**
S1. Allowlist: every changed file is on the brief's allowlist; NOT-list untouched (no gate pattern edits, no handoff logic, no objective resolution, no pi-review, no desk). The worker admits 20 files / +408 in `config.ts` vs an advisory ≤16 files / ≤500 LOC: is the size justified by the contract, or is there machinery a smaller diff would avoid (subtraction test on: the globalThis state, the snapshot file, the conservative stop, evidence sharing across module copies)?
S2. Existing tests: fixture/HOME changes only, no assertion edits — verify on the 10 listed files. The `gate-config-robustness` (a) change: is the replacement contract legitimately pinned elsewhere, or was an assertion weakened?
S3. Smallest change: could invariant 3 (nana-trust) have been met without importing pi's trust module at runtime? Is the fail-closed bare-harness path the smallest correct shape?

**Adversarial role** — executed probes, not reasoning. Use a temp HOME + USERPROFILE and the worktree's extensions.
A1. Corruption + restart: configure a custom deny at user scope, load, corrupt the file, new process → still enforced (snapshot). Delete the snapshot, corrupt the file, new process → every gated class blocked with the repair reason. Corrupt the SNAPSHOT itself. Make the snapshot contain a WIDER policy than the config ever had (tamper) → what wins?
A2. The F1 shape against REAL pi trust code (not a stub): nana-only `.pi/` with `isProjectTrusted: () => true` → project ignored; with `.pi/settings.json` present → honored; with `trust.json` recording the folder → honored; recording the PARENT folder → honored (pi semantics); recording `false` → ignored. Nested cwd under a trusted root: what happens, and is it consistent with pi's own rule?
A3. Race: agent plants `.pi/settings.json` mid-session, then edits a file → project `postEdit.commands` must NOT run until the next `session_start`. Also: agent writes `~/.pi/agent/nana-pack.json` (user scope) mid-session with `allowPatterns:[".*"]` → does the gate now allow everything live? (L2's snapshot semantics are next lane; report what happens TODAY on this branch.)
A4. Malformed shapes the matrix might miss: prototype-pollution keys (`__proto__`, `constructor`), enormous arrays, regex that is invalid (`"("`), non-UTF8 bytes, a directory at the config path, a symlink to `/dev/null`, a 0-byte file. tool_call handler must never throw.
A5. globalThis state across module copies: two copies of `config.ts` loaded (simulate pi's `moduleCache:false`) → one evidence resolution, one warning, one journal line. The mutation test the worker mentions: run it, confirm it fails when state is per-copy.
A6. Gate-survives-after: with this branch, can the agent's own `write`/`edit` of `~/.pi/agent/nana-pack.json` or of the snapshot file loosen the gate in the same session? (Protected-path coverage is L2; state what is true now.)

**Compatibility role**
C1. Documented feature change ("project config honored on auto-trust" → decided/owner-recorded trust + notice): stated where consumers read it (pack README, `working-under-nana-pi.md`, adopt-structure SKILL)? Is the `/trust` instruction correct for pi 0.87.1 (the worker says `/trust` records a nana-only folder — verify in `interactive-mode.js`)?
C2. Other callers of `loadConfig` and of the config shape: desk settings window writes user/project `nana-pack.json` (`apps/desk/server.mjs:1311,1426-1432`), `nana-setup project` seeds `.pi/nana-pack.json`, bench. Does the new normalization/diagnostic change any of their behavior or break the desk's write→read round trip?
C3. win32: `USERPROFILE`, `canonicalizePath` delegation, path separators in the trust evidence; any POSIX-only call added?
C4. The `objective.projectFile` user-scope opt-in and the objective walk: untouched by the diff? (`objective-injection.test.mjs` passes unchanged — confirm the diff does not alter objective resolution.)

End with: findings severity-sorted with `file:line` and, for each, the role tag `[scope]`/`[adversarial]`/`[compat]`; residuals to carry; `VERDICT: LAND` or `VERDICT: BLOCK`. Round 1 of 3.
