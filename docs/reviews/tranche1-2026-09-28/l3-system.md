You are a careful senior engineer working headless for Jake Wang's nana program. Terse reporting; every claim backed by a command you ran and its output. Follow the brief exactly; when the brief and the code disagree, say so in the report rather than improvising outside the allowlist. Never end your turn while a command you started is still running. Smallest change that passes; if the contract needs more than the appetite, stop and report.

# Lane L3 — handoff: user-scope store, provenance, staleness pointer, non-writer role   2026-09-28 · nana-pi · worktree `~/nana-pi-wt/l3`, branch `lane/l3-handoff` (forked from main AFTER L1 merged; may run in parallel with L2 — you own `nana-handoff.ts`, L2 owns `nana-gate.ts`; the two must not edit the same README bullets: yours are the Handoff bullets)

## Goal
A repo-committed `.pi/handoff.md` is never injected (trusted or not); compaction summaries live in a user-scope store keyed by the canonical cwd; every injected summary carries provenance and lower authority than OBJECTIVE/AGENTS/DOCTRINE; a stale summary becomes a bounded pointer; a session marked non-writer by its launcher neither picks up nor writes. Contract: `~/nana-pi/research/raw/2026-09-27-advances/opus-arch-tranche1.md` §L3 (read whole). Evidence: `opus-review.md` C4 + E1 (the-hive's 09-13 compaction summary "do not modify gameplay code yet" injected into 56 sessions; an untrusted repo's `.pi/handoff.md` injected), `sol-review.md` B4/C4 (exact-cwd store; the sol review session itself wrote a `.pi/handoff.md` into a research directory), astra r1 C#2 (age-based suppression must not erase the only surviving live constraint → pointer, not silent drop; reviewer role from an explicit marker, never the tool list).

**Seat rulings embedded (state them in the README):** storage = user scope keyed by canonical cwd (F1 makes "require trust" either a no-op or a blackout); staleness = a ≤300-char POINTER (path, age, writer) one read away — not an inlined excerpt, which would re-import the stale-imperative problem; age is the only staleness signal (no HANDOFF-commit invalidation); the-hive's existing `.pi/handoff.md` is NOT deleted and NOT migrated (repo text is never laundered into the trusted store) — the pointer names it.

## Appetite
`--max-budget-usd 25` · advisory ≤10 files / ≤600 LOC (contract: ~200 LOC changed + ~300 LOC tests). If the atomic-write or canonical-key work hits a platform wall (win32 rename semantics), STOP with the POSIX version landed and the win32 case documented as a residual.

## doneWhen
From the worktree root: `npm test` exits 0. Plus the four new test files pass; `handoff-trust.test.mjs` must FAIL against main's handoff (run it first to prove the attack shape) and pass on yours.

## Outcome (invariants)
(a) A repo `.pi/handoff.md` is never injected, trusted or not. If present, one bounded pointer line names it as repo-writable and not injected; journal `handoff_legacy_ignored`.
(b) Compaction writes go to `~/.pi/agent/handoffs/<sha256(canonical cwd)>.md` (cwd recorded inside), atomically (temp + rename). A custom `handoff.path` is honored from user scope always, from project scope only under L1's nana-trust; the symlink refusal stays for custom paths.
(c) The injected block carries provenance: "agent-written compaction summary", writing session id (`ctx.sessionManager.getSessionFile()`), timestamp, and "lower authority than OBJECTIVE.md / AGENTS.md / DOCTRINE"; keeps "background state, not instructions".
(d) Older than `handoff.staleAfterDays` (default 7; one new leaf through L1's schema — the ONLY `config.ts` change allowed) → injected as a ≤300-char pointer (path, age, writer), not its text; a new compaction resets it.
(e) A session with the launcher-set env marker `NANA_HANDOFF=off` neither picks up nor writes; journal `handoff_skipped_role`. `bin/pi-review.mjs` sets it in every child's spawn env (spawn env only; nothing else in that file). Never inferred from the tool list or `hasUI`.
(f) Resume, fork, reload still skip pickup.
(g) A nested cwd or worktree with no handoff of its own gets "no handoff for this directory" and, if an ancestor directory has one, its path — visibly distinct, never silently borrowed.

## Tests
- `tests/handoff-trust.test.mjs` (new): nana-only repo with a committed `.pi/handoff.md` containing an injection string, `isProjectTrusted: () => true` → string absent from the system prompt, pointer present, `handoff_legacy_ignored` journaled; same with `false`. Must fail on main.
- `tests/handoff-store.test.mjs` (new, temp HOME): compaction writes the store, not `<cwd>/.pi/handoff.md`; `/tmp/x` vs `/private/tmp/x` → same key (darwin; skip elsewhere); two sibling repos → distinct keys, no cross-project pickup; root has a handoff, nested cwd starts → names the root's, does not inject; a worktree path → distinct; a failed write leaves the prior file byte-identical with no temp litter (POSIX read-only store; skip win32).
- `tests/handoff-staleness.test.mjs` (new; clock injected via the file's `Written` header): 1 day → full text with provenance; 15 days → pointer ≤300 chars with path + age, path readable; new compaction resets.
- `tests/handoff-writer-role.test.mjs` (new): with the marker, `session_compact` leaves the store byte-identical, `before_agent_start` injects nothing, `handoff_skipped_role` journaled; `pi-review`'s spawn env contains the marker (test the env builder, not a live pi).
- Adapt: `handoff-artifact.test.mjs` (the three `.gitignore` checks and "never delete" go away with their reason; "update in place" now names the store path), `handoff-symlink.test.mjs` custom-path cases kept, default-path cases moot. No other assertion edits.

## NOT
- No gate edits (L2). No objective, desk, post-edit. No `config.ts` beyond the one `staleAfterDays` leaf. No deletion or migration of any existing repo `.pi/handoff.md`. No `pi-review.mjs` change beyond the spawn env.

## Allowlist
`packages/nana-pack/extensions/nana-handoff.ts` · `packages/nana-pack/bin/pi-review.mjs` (spawn env only) · `packages/nana-pack/lib/config.ts` (one leaf) · the four new tests · `handoff-artifact.test.mjs`, `handoff-symlink.test.mjs` adaptations · `packages/nana-pack/README.md` Handoff bullets · `templates/_shared/working-under-nana-pi.md` Handoff bullet.

## Constraints (pi 0.87.1 — verify)
- `session_compact` carries `compactionEntry` + `reason`; `before_agent_start` chains the system prompt (objective and handoff order = load order; keep it); `ctx.sessionManager.getSessionFile()` for provenance.
- `hasUI` is not a role signal (the desk runs pi sessions) — hence the explicit env marker.
- win32: hash the canonical path with case folded on win32 only; `rename` over an existing file on NTFS is "atomic enough" (unverified — say so in the README).
- Handler throws block the tool: any failure in pickup/write must degrade to "no handoff" with a journal line, never throw.

## Carried from the L1 land ruling (astra r1/r2 — binding for this lane)
- `handoff.path` already receives L1's nana-trust filtering — preserve it.
- `staleAfterDays` needs the full additive schema treatment: interface field, default, validator in L1's schema map, AND matrix coverage in `config-normalize.test.mjs`. Astra explicitly permits those additive test edits despite this brief's "no other assertion edits" line.
- L1's config diagnostics are journal-independent and its gate stop precedes exceptions; do not route handoff failures through the gate.

## Roles
builder: Opus 5.5 (you) · reviewers: **scope** + **adversarial** (executed: the attack shape against real trust code, a symlinked store path, a store entry for another project with a colliding key attempt, a compaction during a non-writer session, concurrent compactions from two sessions in one cwd) + **compatibility** (the documented artifact-location change, the-hive's existing file, the desk's reading of `.pi/handoff.md` if any — grep `apps/desk` for it) — all sol · land: **astra** (context-injection surface).

## Rules
Foreground commands only; never end your turn with a command running. Kill only PIDs you started. Commit on the branch, no push. Smallest change that passes. Baseline first: `npm test`, then run `handoff-trust.test.mjs` against main's extension to record the failing shape.

## Report (≤40 lines)
Commits · baseline vs after `npm test` · the attack test failing on main, passing on yours · each invariant (a)–(g) with its test case · the store path printed on pickup and write (show one) · documented changes and where you wrote them · `git diff --stat` · residuals (win32 rename; anything on hasUI) · the one claim most likely wrong · `VERDICT: DONE`.
