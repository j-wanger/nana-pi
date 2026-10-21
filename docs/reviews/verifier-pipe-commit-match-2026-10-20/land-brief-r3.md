# Review round 3 — verifier-pipe-commit-match, 2026-10-20 (pi gpt-6-astra, the land reviewer)

Feature: FEAT-010 · Guard risky commands and protected resources

Round 2 reviewed `fefbfa4c`. Both reviewers sent it back, each with commands main asks on that the tip let through:
- Final reviewer M1 (new in build 6): a pipeline that ends a subshell running `set +e`, e.g. `set -e; (set +e; npm test | tail -5); git commit -m x`, and its `$( … )`, backtick and `(cd app; …)` forms. S1: a case pattern's `)`. S2: the HANDOFF relief figures predate build 6.
- Land reviewer MUST: a `case` pattern's `)` paired with the enclosing `(` and closed the errexit scope early, e.g. `(set -e; case "$OSTYPE" in darwin*) echo preparing;; esac; npm test | tail -5; git commit -m checked)`.
This is the last round the cap allows.

**The seat's ruling.** Every finding came from one relaxation: reading `set +e` as turning errexit off, scoped by bracket pairing. On a gate floor each such relaxation had become a bypass, so the seat subtracted it. Bash errexit now counts as active at a pipeline when the live text before it holds `errexit` anywhere, or a `set` word with an option word of `-` and letters including `e` in the same simple command. `set +e` never turns it off. This can only add asks against rounds 1 and 2, never remove one; the trade is that `set -e` then `set +e` before a masked pipeline now asks.

This round reviews only what changed since round 2: `git diff fefbfa4c..HEAD` on `feat/verifier-pipe-commit-match`.

- `22140aaf`, `bacbf07d`, `0f9c7e2b`: `build-brief-9.md` to `build-brief-11.md`.
- `184f8cd7` (build 9): the rule above in its first form (a `set` at command position whose first option word enables errexit); the scope walk and build 6's backtick group in `liveText` removed; build 6's PowerShell changes kept. Cases for every round-2 command; "set +e disables errexit" moved from discarded to consumed.
- `e19f5444` (build 10): the seat probed five spellings build 9 (and round 1) missed: `set -x -e`, `set -u -o errexit`, `set -o nounset -o errexit`, `shopt -s -o errexit`, `! set -e`. The matcher widened, fail-safe, to the rule above. R-2350, R-2351, R-2356 and both READMEs state it.
- `acb649cb` (build 11): build 10 scanned the whole prefix once per pipe (3,489 ms on 64 KB of `a|b;`, against 20 ms on round 1); build 11 finds the first enable once (24.6 ms). No behaviour change.
- `ad93798f` and the pairs record: the seat's pairs re-anchored and rerun on acb649cb: 69 of 73 red (`seat-mutate-output-acb649cb.txt`). E2 to E6 are rewritten for the new matcher; E4 puts the old `set +e` rule back and turns the round-2 cases red. F4 is red again, since build 9 removed the backtick group. K1, K8, C1 and S26 survive as declared.
- `9d062e11` merges main `954b8726` (the win-hook-variant-loop land: doctor's Windows hook rows; no pipe-guard file). Review the merge as `git show --remerge-diff 9d062e11`. The seat's merge helper resolved HANDOFF and the session file, keeping both sides' lines, and regenerated the tree and code map.
- The notes commit: HANDOFF and the session entry record round 2 and builds 9 to 11; the Landed line names the subtraction and dates the relief figures to the fifth build. CI-PENDING.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, run at 9d062e11):

```
tree movement 954b872..9d062e1: 10 rows in 2 features
FEAT-010 · Guard risky commands and protected resources
  R-982 implemented -> retired
  R-2350 new (implemented)
  R-2351 new (implemented)
  R-2352 new (implemented)
  R-2353 new (implemented)
  R-2354 new (implemented)
  R-2355 new (implemented)
  R-2356 new (implemented)
  R-2357 new (implemented)
FEAT-013 · Install and connect harness runtimes
  R-1064 text changed
```

Threat model and lane class as rounds 1 and 2: honest variation in commands agents and the owner write is in scope; deliberate forgery is out. Install, hook or gate lane: the Claude Code verifier hook and the pi gate share this predicate.

Check: (1) every round-2 command now asks, and no command that main, round 1's tip or round 2's tip asked on now goes unasked, in either dialect; (2) the errexit rule is applied as the rows and READMEs state, with no spelling of an errexit enable that real bash honours going unasked; (3) no crafted or honest input gets materially slower than round 1; (4) the rows say no more than their checks prove; (5) HANDOFF and the session entry are true; (6) any MUST.

Answer with the full review as your final message: MUST / SHOULD / NOTE, a score, and as the last line exactly `VERDICT: LAND` or `VERDICT: SEND-BACK`.
