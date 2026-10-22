# Review — claude-review-launcher (Claude Code reviews run through a product launcher that reads the roster and runs review-ledger), 2026-10-22 (the final reviewer)

Feature: FEAT-007 · Review a specific revision independently (also FEAT-006's R-1122, the roster's shape)

Class: install, hook or gate (a review tool; it also edits `nana-soul.md` under the setup package). Threat model: honest variation in scope — a missing or logged-out `claude`, a Windows seat (`claude.exe` or `claude.cmd`), an over-cap round, a brief path with spaces or quotes, a brief holding cmd.exe-hostile characters, a pi entry or no roster file, a reviewer that writes a formatted or misplaced verdict; deliberate forgery out (a crafted fake `claude`, a hand-edited ledger, a reviewer told to lie).

Review `git diff 319110de..HEAD` on `feat/claude-review-launcher`. Main is 319110de (ci-jobs, just landed). The lane branched from 09e38e7d and merged main three times: d257e0a0 (biome-pin and suite-records), 76ef0f39 (report-deliverables and review-outputs-kept) and 818be96f (ci-jobs); each merged lane was reviewed and landed. At 76ef0f39 the shared working pattern and AGENTS.md conflicted in three adjacent bullets; the seat kept review-outputs-kept's land-checklist bullet and this lane's review-bar and default-pattern bullets, regenerated the tree outline and code map, and re-ran both review lanes' test files green. At 818be96f only HANDOFF's Landed lines and the session file's top entries conflicted; both sides were kept. The lane's own commits: bf1dad1f (plan), 158659d5 (build 1), 130fe3a3 (the seat's pairs and the independent check), 8bf85a08 (notes and the macOS install check), 5f1f438b (the seat's CI finding F1 and brief 2), 3b180aa8 (build 2), the notes after the third merge, and the final commit with this review's two briefs.

The plan of record is `docs/reviews/claude-review-launcher-2026-10-22/must-meet.md`: decisions D1 to D5, eight rows (R-2560 to R-2567), R-1122's rewording, the tunables and the known limits; `plan-draft.md` and `plan-attack.md` are its inputs.

The seat's record:
- Wrong-code pairs: 19 of 19 red at 158659d5, 10 by exactly their named titles and 9 with more checks red besides (`seat-mutate.mjs`, `seat-mutate-output-158659d5.txt`): the planner's nine, two split in two (a hard-coded `--model opus`; claude spawned directly, skipping review-ledger; the standard doubled; the standard first; a fallback model for a pi entry; `CLAUDE_CODE_SLOTS` unchanged; the prompt as an argument; always exit 0; review-ledger's stderr dropped; `--over-cap` not forwarded; the brief read after admission) and the adversary's eight (standard input never ended; no standard-input error handler; the model read from `largerBuilder`; `--tree` not forwarded; the roster's `ok` unchecked; the read-only clause dropped; an argument after the tool lists; `--brief` resolved against the working folder). Build 2 changed only R-2561's fixture name on Windows.
- Session titles: 0 missing.
- The independent check (`independent-check-158659d5.md`) ran the launcher with a fake `claude` in a temp HOME across 14 cases, including a 307 KB brief full of quoting characters, a missing `claude`, a pi reviewer, malformed rosters, the round cap and an outside working folder, and once with the real `claude`, which could not log in under the temp HOME and returned its reservation. No material problem; its non-blocking lines are FEAT-007 and FEAT-006 known bugs.
- The macOS install check at 76ef0f39: every item PASS (`install-check-76ef0f39.txt`).
- CI: the Windows leg at 130fe3a3 (run 39805845207) found F1 (`ci-windows-130fe3a3.txt`); build 2's tip 3b180aa8 is on PR #169, and the reviewed tip runs there too. The seat lands only on green, including R-2564 passing on the Windows leg.
- Build 2's locked full suite: `207 files: 205 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8318 pass, 0 fail, 40 skip`. After the third merge, map:check, req:tree, readme:check and the trace are green.
- The notes also fold in review-outputs-kept's and ci-jobs' final-review notes as known bugs (FEAT-007, FEAT-019, FEAT-031, unplaced). After the land the seat runs `nana-roster set reviewer claude-code opus` once.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 319110d..818be96: 9 rows in 2 features
FEAT-006 · Launch builders with execution limits
  R-1122 text changed
FEAT-007 · Review a specific revision independently
  R-2560 new (implemented)
  R-2561 new (implemented)
  R-2562 new (implemented)
  R-2563 new (implemented)
  R-2564 new (implemented)
  R-2565 new (implemented)
  R-2566 new (implemented)
  R-2567 new (implemented)
```
