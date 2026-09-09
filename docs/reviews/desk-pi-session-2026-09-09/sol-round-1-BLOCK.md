### A. Dependency contract — FINDING

- **BLOCK — `apps/desk/pi-session.mjs:86-107`** — Resolution is not guaranteed to select the package behind `PI_BIN`. Volta’s executable is a manager shim rather than a symlink into the package, and its package store is not searched. The fallback may either fail despite a normal global installation or import a stale `.local`/Homebrew copy while spawning the Volta copy. Similar custom-prefix/bun layouts depend accidentally on symlink structure. The suggested `npm i -g` may reproduce the same failure under Volta.  
  **Minimal fix:** resolve manager/global npm roots associated with the selected executable, add common manager stores, and refuse ambiguous fallback matches unless they can be tied to `PI_BIN`; otherwise require `DESK_PI_ROOT`.

- The testing-oriented root exports are an acceptable local-tool dependency given the fatal export check and parity test. Import occurs once at startup. The source records the roughly 0.4-second/120-MB cost.

### B. Semantics — FINDING

- **SHOULD — `apps/desk/server.mjs:672-676`** — v1 IDs are not stable across reads. Pi’s migration generates IDs with `randomUUID()` each invocation, so two unchanged `/api/transcript` requests return different `id` and `parentId` values. Branch membership remains structurally equivalent, but the API identity contract drifts on refresh.  
  **Minimal fix:** cache migrated v1 results by canonical path plus file identity/mtime/size, or explicitly define migrated v1 IDs as ephemeral and ensure clients never use them as identity.

- Read requests do not write migrations back. Rename only appends its intentional `session_info`; opening/resuming through pi performs pi’s own migration rewrite. Hidden `session_info` nodes correctly connect the branch without reaching the renderer.

### C. Hand-rolled consistency — FINDING

- **SHOULD — `apps/desk/server.mjs:606-609`** — `readSessionMeta()` accepts `{type:"session"}` without a string `id`, whereas pi’s loader requires both. Such a file can appear in the rail but cannot be resumed or historically renamed.  
  **Minimal fix:** require `typeof header.id === "string"` as `hasSessionHeader()` already does.

- **SHOULD — `apps/desk/server.mjs:611-622,672-686`** — `parseSessionEntries()` preserves valid JSON scalars, including `null`. Unconditional `e.type` access means a valid header followed by `null` can turn `/api/sessions` or `/api/transcript` into a 500. The former is a regression from the prior byte-window scanner.  
  **Minimal fix:** guard entries with `e && typeof e === "object" && !Array.isArray(e)` before inspecting fields; add a corruption fixture.

- **NIT — `apps/desk/server.mjs:623-627`** — The rail’s bounded head/tail scan can report a stale name while the full transcript reports the latest `session_info` if that entry has moved outside both windows after large later messages.  
  **Minimal fix:** document this bounded-scan limitation or use a bounded growing reverse scan for the latest name.

- The cycle guard remains present on the only desk branch walk.

### D. Safety regressions — PASS

Host/Origin checks, realpath confinement, rename 409 paths, teardown escalation, and write symlink guards are unchanged. Pi’s root import adds `signal-exit` through `proper-lockfile`, but its listener coexists with the desk’s signal handlers; the desk’s first-signal teardown and second-signal exit semantics remain effective.

### E. READMEs — FINDING

- **SHOULD — `README.md:32-40`** — “the only hard requirement is a global pi” contradicts the same table’s Node, uv, and pnpm runtime requirements.  
  **Minimal fix:** say dependencies vary by component and that global pi is the common requirement for pi-hosted components.

- **SHOULD — `apps/desk/README.md:20` and `README.md:37`** — Both state pi `≥ 0.84.4` as a runtime requirement, but code only warns below that version and continues when the exports exist.  
  **Minimal fix:** either fail startup below 0.84.4 or describe it as the minimum verified version rather than an enforced requirement.

The named exports, Node engine floor, Playwright scope/version, pack/stage peer-dependency descriptions, and “no npm dependencies of its own” wording otherwise match the code.

### F. Tests — FINDING

- **SHOULD — `apps/desk/test/pi-session-parity.test.mjs:142-165,244-254`** — The test exercises prefix fallback but not `PI_BIN` walk-up, manager shims, mismatched installations, repeated v1 reads, missing header IDs, or scalar entries. Consequently it misses the dependency and semantic failures above.  
  **Minimal fix:** add synthetic executable/package layouts and compare two unchanged v1 transcript responses.

- **NIT — `apps/desk/test/pi-session-parity.test.mjs:36-44`** — Reserving port 0 and closing it before spawning the server leaves an `EADDRINUSE` race.  
  **Minimal fix:** let the server bind port 0 and report its selected port, or retry startup on collision.

The test fails rather than skips when pi is absent. The old-parser copy is acceptable as a frozen before-contract, while `SessionManager.getBranch()` remains the authoritative current-format oracle.

VERDICT: BLOCK
