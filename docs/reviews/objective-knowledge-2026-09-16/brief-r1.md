# Review brief — objective injection + knowledge pull (round 1 of max 3)

You are an independent code reviewer. Read-only. Be adversarial: find what breaks, what leaks, what fails closed when it should fail open (and the reverse), and what is more machinery than the job needs.

## What changed and why

The owner ruled (2026-09-16) that every session must see one objective + current priority, and that stored research must be pulled at the moment of need. Evidence: `/Users/jwang/nana-agent-loop/docs/audits/2026-09-16-session-spend-vs-objective.md` and `/Users/jwang/nana-agent-loop/docs/audits/2026-09-16-knowledge-utilization.md` (skim the findings sections only).

Three pieces, in three repos/places:

1. **nana-pack `nana-objective` extension** (`/Users/jwang/nana-pi/packages/nana-pack/`, commits `648e12c`, `5b1ca3a`): reads a USER-scope file (default `~/.pi/agent/nana-objective.md`, configured to `/Users/jwang/nana-agent-loop/OBJECTIVE.md` via `~/.pi/agent/nana-pack.json`) at `session_start` for every reason and injects it at `before_agent_start`. Project-scope `objective.*` must be ignored (a repo must not be able to put text into every session's system prompt). Files: `extensions/nana-objective.ts`, `lib/config.ts` (the `objective` merge), `tests/objective-injection.test.mjs`, `README.md`.

2. **New package `nana-knowledge`** (`/Users/jwang/nana-pi/packages/nana-knowledge/`, commit `f611e3f`): FTS5 index (node:sqlite, BM25) over markdown roots listed in `~/.pi/agent/nana-knowledge/sources.json`; a Claude Code `UserPromptSubmit` hook (`bin/nana-knowledge.ts hook`) reads the hook JSON on stdin, queries top 3, prints ≤ 2000 chars of pointers, dedups per session under `~/.pi/agent/nana-knowledge/shown/<session_id>.json`, spawns a DETACHED background build when the index is missing or > 24 h old, and appends a JSONL line to `pull.log`. Must fail open on every error and stay under a 1500 ms wall-clock budget. Files: `lib/*.ts`, `bin/nana-knowledge.ts`, `tests/*.test.mjs`, `README.md`.

3. **Round cap in `/Users/jwang/nana-agent-loop/app/scripts/pi-review.mjs`** (uncommitted working tree; read the file): the round number is parsed from the `--out` basename; round > 3 is refused unless `--over-cap "<reason>"` appears BEFORE `--`.

## Dimensions

A. **Trust boundary.** Can a repo (project config, committed files, symlinks, a crafted `.pi/` dir) get text into the system prompt via the objective extension? Can a crafted markdown file under an indexed root, or a crafted `session_id`/`cwd` in the hook JSON, make the knowledge hook write outside its own dir, run something, or exceed its output cap? Path handling for `shown/<session_id>.json` in particular.
B. **Fail-open discipline.** Enumerate every path in the hook that can throw or block (missing index, locked db, malformed stdin, huge prompt, spawn failure, slow disk). Does each exit 0 silently within budget? Is the budget actually enforced (a timer that exits) or just measured?
C. **Detached build correctness.** Two prompts in quick succession → two concurrent builds? Is there a lock or is concurrent-write to the SQLite file possible? Can a build corrupt an index that a hook is reading?
D. **Injection hygiene.** The hook output goes into the model's context. Is the snippet text sanitized against being read as instructions (at minimum the framing line)? Is the 2000-char cap applied to the FINAL block, after formatting?
E. **Objective extension semantics.** Read-once-per-session vs config-read-live; the five session reasons; the 4000 cap; the in-workspace symlink refusal vs. following a home symlink. Anything that would make the objective silently absent (the failure that matters most here).
F. **Round cap.** Regex false positives/negatives on real corpus names (look at `/Users/jwang/nana-pi/docs/reviews/*/` filenames for the actual naming in use). Can a pi arg after `--` satisfy the override?
G. **Subtraction.** Name anything in the three pieces that is more than the job needs. The owner prefers removing a mechanism over adding a scoring one.
H. **Tests.** Do the tests assert the invariants above, or only mirror the implementation? Name the missing test that matters most.

## Output

Per dimension: PASS or FINDING (severity BLOCK / HIGH / MEDIUM / LOW, file:line, one-paragraph failure scenario, the smallest fix). End with `VERDICT: LAND` or `VERDICT: BLOCK` and a one-line reason.
