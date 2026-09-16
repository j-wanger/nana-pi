## A. Never blocks, never throws

**FINDING — BLOCK** — `packages/nana-knowledge/extensions/nana-knowledge.ts:78-100`  
`execFile({ timeout: 2000 })` sends the child `SIGTERM`, but its callback—and therefore `makePull()`—does not necessarily settle at two seconds. A child that ignores/traps `SIGTERM`, remains stuck in an uninterruptible syscall, or leaves a descendant holding stdout open can keep the callback pending indefinitely. Windows termination likewise targets the immediate process rather than reliably cleaning the process tree. The existing test’s timer-only child exits normally on `SIGTERM`, so it does not prove the hard bound. Smallest fix: add an independent parent-side timer that resolves `null` at the deadline, then best-effort kill the child/process tree; do not make prompt progress depend on the `execFile` callback.

**FINDING — MEDIUM** — `packages/nana-knowledge/extensions/nana-knowledge.ts:79`  
The extension claims to spawn the Node CLI but actually invokes `process.execPath`. Under bun-run pi this is Bun, so TypeScript and especially `node:sqlite` behavior is no longer the documented Node ≥22.18 contract; the pull may silently remain dead. Smallest fix: invoke a configured or PATH-resolved `node` executable, failing open if unavailable.

Other paths are adequately fail-open: stdin has an `error` listener for EPIPE; synchronous spawn, serialization, `stdin.end`, missing `getSessionId`, malformed prompt, and context getter failures are caught. `maxBuffer` errors reach the callback unless child termination itself hangs. `import.meta.url` is supported by pi’s documented jiti loading path, although failure during `makePull()` construction would disable extension loading rather than reach the handler catch. Queued runs are normally serialized by pi; if callers create overlap, duplicate pulls are possible because shown-state read/write is not atomic, but the build lock prevents concurrent writers and overlap does not otherwise corrupt state.

## B. Trust boundary

**PASS** — `packages/nana-knowledge/lib/hook.ts:57-60`, `:111-158`  
The shared CLI sanitizes session IDs to `[A-Za-z0-9._-]`, caps them at 120 characters, and joins them beneath `shownDir`; fork/rename input cannot traverse outside the knowledge home. `cwd` is only JSON-logged, prompt text only drives tokenized search, and prompt skill expansion is sliced to 8 KiB before entering the pipe. `renderBlock()` enforces the 2000-character cap and source title/snippet cleaning removes line breaks, preventing a source value from creating a new framing line. All writes remain beneath the configured knowledge home. `NANA_KNOWLEDGE_HOME` can redirect storage, but that is inherited process configuration, not controllable by the pi prompt/session.

## C. Context hygiene

**FINDING — MEDIUM** — `packages/nana-knowledge/extensions/nana-knowledge.ts:126`; pi `dist/core/messages.js:89-96`; pi `dist/core/compaction/compaction.js:210-245`  
Each successful pull becomes a persistent custom message, and pi converts custom messages to ordinary LLM `role: "user"` messages without carrying `customType`. Thus up to roughly 2 KB accumulates per fresh pull and the provider sees each block as another user turn, relying entirely on the textual “untrusted DATA” header. Compaction bounds eventual context growth but does not preserve old pointer blocks verbatim: they are summarized or dropped, while external per-session dedup prevents them from being pulled again. Smallest fix is primarily to state this trade-off honestly; if verbatim post-compaction availability is required, the current message-plus-dedup design does not provide it. Avoid adding a reinjection subsystem without demonstrated need.

`display: true` is the correct choice: it affects visibility, not LLM cost, and the desk safely renders it as an expandable `⧉` note (`apps/desk/public/app.js:581`). `display: false` would only conceal context. `systemPrompt` would reduce accumulation but would disappear immediately after dedup, so the custom message is the better current compromise.

## D. One producer, no drift

**FINDING — LOW** — `packages/nana-knowledge/extensions/nana-knowledge.ts:119`  
The wrapper duplicates one skip decision, `prompt === ""`, even though all skip rules belong in `lib/tokenize.ts`/the CLI. It is harmless now but contradicts the stated “anything else duplicated” rule and can drift. Keep only the non-string API guard; pass every string to the producer. The 8 KiB pre-spawn slice is deliberate and correctly shares `PROMPT_MAX_CHARS`.

## E. Subtraction

**PASS**  
The out-of-process boundary is justified by synchronous SQLite/filesystem stalls. Both manifests serve distinct installation paths, the constant move avoids importing SQLite into pi, and `source` is needed for the shared log. No additional configuration or second pull implementation was introduced. The comments are lengthy but do not add runtime machinery.

## F. Tests

**FINDING — HIGH** — `packages/nana-knowledge/tests/extension.test.mjs:77-87`  
The timeout test only uses a child that accepts Node’s default `SIGTERM`, so it mirrors the expected happy timeout behavior and misses the false hard-bound claim. The single most important missing test is a child that installs a `SIGTERM` handler and never exits (ideally also leaves a descendant holding stdout); `makePull()` must still resolve near the deadline. Current tests otherwise cover ENOENT, missing session API, undefined/non-string prompt, slice-before-spawn, per-session dedup, `source:"pi"`, and absence of in-process `node:sqlite`. They do not directly force stdin EPIPE or `maxBuffer`, but those are secondary to the unresolved timeout.

The `PROMPT_MAX_CHARS` move preserves `lib/hook.ts`’s re-export, so `hook.test.mjs` remains source-compatible. I could not execute tests with the available read-only tools, so runtime pass status is unverified.

## G. Docs

**FINDING — HIGH** — `packages/nana-knowledge/README.md:166-168`  
“Bounded at 2 s” is not honest while progress depends on the child close callback after timeout termination. It also reads as a complete pi-side wall-clock guarantee despite unavoidable synchronous work in the parent before spawn. Smallest fix: after implementing independent settlement, say the handler stops waiting after approximately two seconds while child/process-tree cleanup is best-effort; otherwise describe `execFile` timeout as a kill attempt, not a bound.

**PASS** — `packages/nana-knowledge/README.md:162`; `packages/nana-knowledge/package.json:12`; root `package.json:9`  
The local install command correctly installs the package directory and records it under `packages` in user settings. The package manifest exposes `./extensions`, and the repository-root manifest correctly exposes `packages/nana-knowledge/extensions` for `pi install git:`.

## VERDICT: BLOCK

The advertised two-second fail-open bound is not real: a child that does not terminate can leave `before_agent_start` awaiting forever.
