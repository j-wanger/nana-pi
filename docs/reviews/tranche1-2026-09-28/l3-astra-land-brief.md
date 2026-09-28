# Astra land ruling — lane L3: handoff user-scope store, provenance, staleness pointer, non-writer role (context-injection surface)

Read-only. Decide whether this merges to nana-pi main. Installed pi 0.87.1. L1 landed (`6a8c5c7`); L2 is in its own land ruling in parallel.

Read in order: `l3-brief.md` (contract, invariants a–g; note (g) was amended by Jake's ruling — see below) → `l3-worker-r1.md` → `l3-sol-r1.md` (2 HIGH) → `l3-fix-brief.md` → `l3-worker-r2.md` → `l3-sol-r2.md` (2 HIGH on the compact path) → `l3-fix2-brief.md` (seat ruling: correctness beats the 300-char cap) → `l3-worker-r3.md` → `l3-sol-r3.md` (HIGH: decoy resolution) → `l3-fix3-brief.md` → `l3-worker-r4.md` → clean diff `l3-r4.patch` → the code (`extensions/nana-handoff.ts`, the six handoff tests, `bin/pi-review.mjs` spawn env, the one `config.ts` leaf, README Handoff bullets, `templates/_shared/working-under-nana-pi.md`, `AGENTS.md` handoff section) → arch contract `~/nana-pi/research/raw/2026-09-27-advances/opus-arch-tranche1.md` §L3.

**Review history: sol ran its full three rounds (r1, r2, r3 — all BLOCK).** The cap is spent; the last defect (a pointer path containing NBSP/tab/CR/LF resolving to an existing ASCII-space DECOY, proved by sol through the installed resolver) was IMPLEMENTED rather than re-reviewed, per the round-cap rule. Your ruling is the independent check.

**Jake's binding rulings on this lane (do not re-litigate):** storage is a user-scope store keyed by canonical cwd; a repo `.pi/handoff.md` is never injected and never migrated or deleted; staleness yields a bounded pointer, not an inlined excerpt; and **invariant (g) is amended** — a directory with no handoff emits no in-session line, because an unadopted directory is a signal addressed to the SEAT: lane L5 will journal it so the seat assigns an objective and starts that directory's knowledge (`~/nana-pi/docs/directory-adoption-design-2026-09-28.md`; Jake ruled repository roots only, dismissal by a marker file in the directory, an `OBJECTIVE.md` ends the reporting).

**Seat rulings to judge as rulings:** (1) correctness of the locator beats the 300-char cap — two pinned pointers legitimately exceed it; (2) the default-store symlink refusal was SUBTRACTED on sol's subtraction test while the custom-path refusal stayed; (3) the decoy fix emits a JSON-escaped absolute path plus a marker and drops age/writer to fit.

Seat-verified: `npm test` → 65 files, 2784 checks, exit 0; `handoff-trust.test.mjs` fails 6 ways against main's extension and passes here; `~/the-hive/.pi/handoff.md` byte- and mtime-untouched; pi's read tool bases on the session cwd (`dist/core/tools/read.js:56`).

Rule on:
A. **Contract satisfied?** Invariants (a)–(g) as amended, each with the test that pins it; any invariant only asserted.
B. **Blast-radius row for context injection:** trusted/untrusted, root/nested/worktree, reviewer write isolation, stale constraints still reachable, resume/fork/reload, symlinks, interrupted writes, no cross-project pickup. What is covered, what is not.
C. **Harm if merged:** the-hive and basketball-geek have existing repo handoffs that stop being injected on the first session after this lands — is the pointer's wording enough for an owner to understand what happened and where the text went? Is dropping age and writer from an escaped pointer acceptable, or does invariant (c)'s provenance requirement fail there? Is `handoff_missing` on every fresh unadopted session acceptable journal volume?
D. **The L5 seam** (the reason this matters now): `readHandoff` returns `{kind:"missing"|"error"|"ok"}` with a distinct `handoff_missing` journal line. Is that seam sufficient for L5 to distinguish an unadopted directory from a broken store, per sol's constraint that ONLY a genuine miss counts as an adoption candidate? Name anything L5 must not assume.
E. **Seat conduct:** rulings adopted without verification, assertions weakened, scope amendments undeclared (the worker declared one beyond-brief change: the fresh-summary `Source:` line got the same escape treatment).
F. **Coupling to L2:** L2 must ALLOW edits under `~/.pi/agent/handoffs/**`; L3 adds one `config.ts` leaf (`staleAfterDays`). Conflicts?

End with `SCORE: n/10`, MUST (empty if none), CARRY priced by cost of error, the upstream-contract declaration, and `VERDICT: LAND` or `VERDICT: BLOCK`. ≤70 lines.
