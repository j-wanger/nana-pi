Feature: FEAT-033 · Adopt explicit engineering standards

# Review brief 1: gen-files

Review `git diff main...HEAD` on feat/gen-files (three commits, e72c06d2 to 2e4221d7; 30 files, +142 / -6,081).

The owner adopted the seat's recommendation on 2026-11-09 ("go with your recommendations on the prior choices"): the code map and requirements tree are generated instead of committed, in their own lane. Scope default: nana-pi only; templates and downstream projects keep their tracked, byte-compared maps.

The lane:
1. Untracks `docs/code-map.md` and `docs/requirements-tree.md` and ignores them.
2. `map:check` reports graph and launch problems only and compares nothing with a map file on disk. The tree `--check` no longer reads the outline. `map:search` renders the map in memory.
3. Deletes the land tool's generated-file regeneration and the CI waiter's CONFLICTING inspection; any conflicting merge now refuses.
4. Retires the rows and tests that pinned regeneration, rewrites R-291, G-010, A-031 and A-072, and makes the global standards line and the requirements skill conditional on whether a project tracks its map. The 2026-11-09 merge ruling drops its "including generated-file regeneration" clause.

The plan had one adversary round, which changed five points (local copies, README existence claims, two skill readers, G-010, artifact classes).

Builder's validation: in a fresh clone of the tip, `git ls-files` lists neither file; the map, tree, README and trace checks exit 0; a planted bad header and a misplaced row each exit 1 naming the problem; 55 related test files pass alone; `check:lane` passed at the builder's stop. Seat re-ran in its own fresh clone: neither file present, the four checks exit 0, stale local copies from main leave both checks green and untracked, a planted bad header exits 1 naming the file; the macOS install check passes.

Questions:
- Does any check now stop catching something it caught before: a bad header, a layer breach, a missing launch reason, a malformed tree, a README claim?
- Does any reader still need either file on disk on a clean checkout: CI, a hook, a skill, a script, a test?
- Can an ordinary lane land differently now that the regeneration path and the CONFLICTING inspection are gone? Does any caller of `cleanMergeTree` or the CI waiter keep a broken contract?
- Is any retired row or deleted test still pinning live behaviour?
- Do the standards line, the skill and the ruling edit say only what the owner decided, and stay true for projects that still track their map?

Threat model: honest variation in scope is in; deliberate forgery is out.

Put exactly one verdict line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, as the last line, and no other line starting with "Verdict".
