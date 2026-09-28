# Review brief — lane L3: handoff store, provenance, staleness, non-writer role (gpt-5.6-sol, round 1 of 3) — roles: scope · adversarial · compatibility

Read-only except probes under a temp HOME (scratch only under /tmp; never modify a worktree). Worktree `~/nana-pi-wt/l3`, branch `lane/l3-handoff`, commit `6b23473` on top of main `6a8c5c7`. Diff: `~/nana-pi/docs/reviews/tranche1-2026-09-28/l3-r1.patch`. Worker report: `l3-worker-r1.md`. Contract: `l3-brief.md` (invariants a–g) and the arch contract `~/nana-pi/research/raw/2026-09-27-advances/opus-arch-tranche1.md` §L3. Installed pi: 0.87.1.

Seat-verified (don't re-run): `npm test` → 65 files, 2713 checks, exit 0; `handoff-trust.test.mjs` exits 6 with 6 FAILs against main's extension and passes here; `~/the-hive/.pi/handoff.md` is byte-untouched (mtime still 09-13).

Seat rulings binding on this lane (don't re-litigate): user-scope store keyed by canonical cwd; staleness = bounded POINTER not an inlined excerpt; age is the only staleness signal; the-hive's repo file is neither deleted nor migrated.

**Scope role**
S1. Allowlist and NOT-list: 12 files vs an advisory ≤10 / ≤600 LOC (worker declares the overage: `config-normalize` required by the L1 ruling, ~390 LOC of new tests). Justified, or is there machinery a smaller diff avoids? Apply the subtraction test to the two ADDITIONS BEYOND THE BRIEF: the `Cwd:` mismatch check (`handoff_cwd_mismatch`) and the symlinked-store refusal. Are they earning their complexity or scope creep?
S2. No assertion weakened: check `handoff-artifact.test.mjs` and `handoff-symlink.test.mjs` adaptations against the contract's stated breaks (the three `.gitignore` checks and "never delete" going away WITH their reason; custom-path cases kept).
S3. `config.ts` touched for exactly one leaf (`staleAfterDays`) plus its schema/default/validator, nothing else? `pi-review.mjs` changed in the spawn env only?

**Adversarial role** — executed probes.
A1. The attack shape beyond the test: a repo `.pi/handoff.md` that is a SYMLINK to the user store; a repo file with a `Cwd:` header naming the victim's cwd; a store entry whose key collides (craft two cwds hashing near each other — or show the key construction makes collision infeasible and say why).
A2. Store integrity: concurrent compactions from two processes in one cwd (the worker tested eight in-process); a store file that is a directory; a store file with no `Written` header (what does staleness do?); a `Written` header in the future; a corrupt UTF-8 store file.
A3. Non-writer marker: `NANA_HANDOFF=off` set to other values (`0`, empty, `OFF`, `false`) — which are honored, and is that documented? Can a child inherit it accidentally and silently lose handoff (e.g. a pi session the desk spawns under a pi-review parent)?
A4. Staleness bound: does the 300-char cap hold when the store path is very long (deep temp dir) or the session file name is pathological? The worker measured 284 chars with a real home — find the worst case.
A5. Invariant (g) and the worker's own most-likely-wrong: a directory with NO handoff and NO ancestor handoff gets nothing added. Is silence right, or should it be explicit? Rule on it.
A6. Failure paths never throw: make the store unreadable/unwritable mid-session, make `getSessionFile()` throw, make the config leaf malformed — `before_agent_start` and `session_compact` must degrade with a journal line, never throw (a throw blocks the tool).

**Compatibility role**
C1. The documented artifact-location change: README Handoff bullets, `templates/_shared/working-under-nana-pi.md`, the extension header. Does any consumer still expect `<cwd>/.pi/handoff.md`? Grep `apps/desk`, `packages/nana-setup`, `templates/`, and the pack skills. The worker says the desk only references the config field — verify.
C2. Existing repo handoffs across Jake's machine (the-hive, and any others): after this lands, first session in those repos gets a pointer instead of the old text. Is the pointer's wording enough for an owner to know what happened and where the text went?
C3. win32: the case-folded key, temp+rename atomicity, the skipped tests. Is the residual honestly scoped in the README?
C4. `staleAfterDays` default 7: interacts with L1's normalization (0 / -1 / Infinity cases claimed). Verify the validator rejects and falls back correctly.

End with findings severity-sorted, `file:line`, role tag per finding; residuals; `VERDICT: LAND` or `VERDICT: BLOCK`.
