# Lane: persisted per-session stage signing key — design B (branch `fix/stagekey`)

Worktree: `/private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/wt-stagekey`. Read `brief-common.md` next to this file first. This lane touches a PROVENANCE BOUNDARY: it gets an adversarial review before landing. Design for the reviewer.

## What exists (read all of it before designing)

- `apps/desk/server.mjs` ~247–250: `spawnChild` mints `stageKey = randomBytes(32).hex` per APP child and passes it as `NANA_STAGE_KEY`; `child.stageKey` is stored on the child record (~274).
- `apps/desk/server.mjs` ~467–470 (`handleChildEvent`): live path — `tool_execution_end` blocks are filtered by `verifiedBlocks(child.stageKey, blocks, event)` (signature AND toolCallId/tool must match the event).
- `apps/desk/apps.mjs` 48–61 and ~354–362: ledger path — `/api/entries` runs `verifiedEntries(child.stageKey, entries)`; a `nana-block` entry that fails verification is REDACTED to `nana-block-rejected` (never deleted, because entries are tree nodes).
- `packages/nana-stage/lib/sign.mjs`: HMAC-SHA256 over canonical JSON, `produced_by.sig` excluded; `packages/nana-stage/extensions/nana-stage.ts` 19–26 reads `NANA_STAGE_KEY`, scrubs it from `process.env`, signs each block.
- `apps/desk/server.mjs` `liveChildForFile` (~1228): the desk learns a child's session file via RPC `get_state` → `sessionFile`; the session's stable identity is the header `id` (see `readSessionMeta` / `pi-session.mjs`). Session files can be renamed (title append) and resumed with `--session <file>` (~187).
- Design doc `docs/agent-frontend-design-2026-09-04.md` line ~236 states exactly what the signature proves: the block was minted inside the app child by the manifest's extension set. The README Known-limit "A restart redacts old stage blocks" and the punch-list item say: "design stable per-session key ownership and storage — never 'fix' it by accepting unverifiable blocks."

## The defect

The key lives only in the desk process for that child. Desk restart or session resume → a new child, a new key → every historical block fails `verifiedEntries` → the stage is blank. Continuity defect; the blocks are intact on disk.

## Design B (decided; implement this, do not re-open the alternatives)

1. **Key store**: one JSON file owned by the desk, `~/.pi/agent/nana-desk/stage-keys.json` (create dir `0700`, file `0600`; write atomically: temp file in the same dir + `rename`; if the desk already has a server-side state directory, use that instead and say so). Shape: `{ "v": 1, "sessions": { "<pi session id>": { "keys": ["<hex>", ...], "updatedAt": <ms> } } }`. Keyed by the pi session header `id`, NOT the file path (rename-proof). Our own path: follows symlinks like the other `~/.pi/agent/*.json` saves (declared policy), no request-derived component.
2. **Spawn**: `spawnChild` for an app session:
   - resume (`--session <file>` given): read the header id from the file (existing parser), look up `sessions[id].keys`; if present use `keys[0]`... NO — a child must sign with ONE key; use the most recent key for that session as the child's `stageKey`. If absent, mint a new key and record it under that id before spawning.
   - new session: mint a key; as soon as the desk learns the child's session id (the existing `get_state`/`desk_hello` path, and again after any `switch_session`/`new_session`/fork — find where the desk already observes `sessionFile` changing), ensure `sessions[id].keys` contains `child.stageKey` (append if missing, most-recent-first, cap the list at 8, drop oldest).
3. **Verification**:
   - Live path (`handleChildEvent`): UNCHANGED — `child.stageKey` only. A block minted now must be signed by this child.
   - Ledger path (`/api/entries`): verify each `nana-block` entry against the set `{child.stageKey} ∪ sessions[currentSessionId].keys`. Any-of-recorded-keys is as strong as single-key for the threat model (a forging extension or a hand-edit holds none of them) and is what makes resume, restart and in-child `switch_session` all verify. State this argument in a code comment and in the design doc addendum.
   - Blocks from before this change (signed under keys never persisted): stay redacted. Say so in the README; no migration, no "accept unverifiable".
4. **Store hygiene**: on load, drop entries whose session id has no file under `~/.pi/agent/sessions/` (reuse the desk's existing session enumeration; do NOT scan the filesystem separately) — cheap, bounded, run at startup only. A corrupt/unparseable store: rename it aside (`.corrupt-<ts>`), start empty, log once. Never throw out of the load path into a request.
5. **What the key file grants**: anyone who can read it can forge blocks for those sessions. That is the same authority as the desk process itself (loopback, no auth) — declare it in Known limits in one sentence, next to the existing loopback statement.

## Tests (failure-first, real server on an ephemeral port; the fake child must sign blocks — reuse `sign.mjs` in the fake, as `stage-chain*.e2e.mjs` / `spawn-and-persist.test.mjs` do)

- **restart-redaction regression** (the headline; must FAIL on `034be76`): spawn app child → it mints a signed block → stop the server, start a NEW server instance on the same store, resume the same session → `/api/entries` returns the block UNREDACTED. Then the negative twin: a hand-appended `nana-block` entry with a bogus sig in the session file → still `nana-block-rejected`; a block signed under a key that was never persisted → still rejected.
- key file: mode `0600`, dir `0700`, atomic write (no partial file observable; simulate a crash between temp write and rename if the pattern allows), corrupt store → aside + empty + server still serves.
- rename-proof: rename the session (title append) → resume by the new path → verifies.
- switch_session within a child: session B's history verified against B's recorded keys, and the child's NEW blocks on B get recorded under B.
- cap: 9 keys for one session → 8 kept, most recent first.
- live path unchanged: a block signed with a persisted OLD key arriving on the LIVE event path is still dropped.
- `nana-stage` side: `packages/nana-stage/tests/blocks.test.mjs` unchanged and green (the extension does not change — confirm and say so).

## Docs (this is a contract change; declare it)

- `apps/desk/README.md`: delete "A restart redacts old stage blocks"; add a Contract-notes entry: where the key store lives, what it holds, the any-of-recorded-keys rule, pre-change blocks stay redacted, what reading the file grants.
- `docs/agent-frontend-design-2026-09-04.md` §3.1/§3.2 (line ~236): one addendum paragraph dated 2026-09-09 with the design-B statement and the precise claim the signature now proves (unchanged: minted inside an app child of THIS desk by the manifest's extension set; the set of keys per session is the desk's issuance record).
- `docs/review-punchlist-2026-09-08.md`: rewrite the STILL OPEN signing-key item as FIXED `<hash>`.
