# Desk hardening 2026-09-09 — the three remaining astra items closed

Jake: "lets close these three" — unbounded server buffers, client-side races, per-spawn stage signing key. Three Opus 4.8 workers, one per item, each in its own worktree off `034be76`; the seat wrote briefs, merged, ran the suite sequentially (the desk tests use fixed ports and cannot run across worktrees at once), and folded every review round. Reviewers: gpt-6-astra on the stage-key lane (a provenance boundary), gpt-5.6-sol on buffers + races. All reviews static (no execution tool); the seat ran the suite after every merge: 32 files green at every checkpoint (baseline 30 + three new test files).

Briefs: `brief-common.md` + `brief-{buffers,races,stagekey}.md` (round 1); `review-brief-*` per round.

| Lane | Round | Verdict | What the round found / what folded |
|---|---|---|---|
| buffers | sol r1 | BLOCK (blockers on races) | oversized line WITH newline slipped past the cap; exitNote write return ignored; POSIX-only kill on data cap; teardown; README overclaim |
| buffers | sol r2 | PASS all dims | closed |
| races | sol r1 | BLOCK | Esc abort lands on the new session; bash buffer bound counted only `delta`; 5 unguarded continuations; reconnect+held POST duplicates a row; restore() swallows explicit 409 |
| races | sol r2 | BLOCK | adoption-by-count can claim an older identical command's card; error text escapes the budget; surrogate cut; stale toasts; `die()` |
| races | sol r3 | BLOCK | count-based adoption unsound (compaction / branch / other client / stale run) → **adoption REMOVED** |
| races | sol r4 | BLOCK | terminal event after a rebuild has no continuation to flush it; `resync()` reentrant |
| races | sol r5 | BLOCK | abandoned-run toast lacked the command; 8-run bound undeclared (seat fixed directly) |
| races | sol r6 | BLOCK | one wording slip (ninth vs oldest evicted) — seat fixed |
| races | sol r7 | see file | confirmation |
| stagekey | astra r1 | BLOCK | concurrent desks lose issuance records (single file, no lock); fork loses inherited blocks |
| stagekey | astra r2 | BLOCK | the lock's retry branch can freeze the whole desk; missed observation seeds the wrong predecessor → **lock store REMOVED, per-session files** |
| stagekey | astra r3 | BLOCK | overlapping ledger read strands fork seeding; prune deletes non-record json; lifetime cache broadens the residual |
| stagekey | astra r4 | BLOCK | the round-3 recovery hook (`inheritFrom`) seeds an unrelated session via prompt-driven switches → **recovery REMOVED** |
| stagekey | astra r5 | BLOCK | retry budget advertised not enforced; seven doc sentences |
| stagekey | astra r6 | BLOCK | deadline recheck after the await; test discrimination; three doc lines |
| stagekey | astra r7 | BLOCK | one README sentence (inherited-only qualification) — seat fixed |
| stagekey | astra r8 | **LAND** | confirmation |

Three subtractions closed blockers that two rounds of patching had not: the lock store, the bash adoption heuristic, the fork-recovery hook. Each time the reviewed mechanism had grown a failure class worse than the defect it fixed.

Final state per lane is in `apps/desk/README.md` (Contract notes 2026-09-09 ×3, Known limits) and `docs/review-punchlist-2026-09-08.md`.
