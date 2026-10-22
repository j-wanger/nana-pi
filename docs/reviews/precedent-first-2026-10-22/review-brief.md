# Review — precedent-first (plans and builder briefs name their precedent; pi-worker checks it at HEAD and attaches the feature's known bugs), 2026-10-22 (the final reviewer)

Feature: FEAT-006 · Launch builders with execution limits

Class: ordinary (pi-worker, new pack libs and one check command, the builder preamble, the shared working-pattern template, AGENTS.md, the rulings text, notes; nana-setup, hooks, extension code, the gate, pi-review, review-round, review-ledger and nana-land are untouched). Threat model: honest variation in the seat's own brief — a forgotten or empty section, a moved, deleted, staged-only or never-committed file, `../`, an absolute path, a glob or a partial folder name, backslash separators, backticks, a `:12` or `:12-40` suffix, trailing punctuation, a wrapped entry, a fenced example of the form, a brief in a subfolder, CRLF, trailing blanks, a BOM or no final newline, a feature with no known-bug file, another feature named in prose; deliberate forgery out (a real but irrelevant tracked file passes: the check proves existence at the lane's HEAD, not relevance).

Review `git diff 7d664b98..HEAD` on `feat/precedent-first`. Main is 7d664b98 (claude-review-launcher, just landed). The lane branched from 4608abd7 and merged main twice: ec5e960f (review-outputs-kept and ci-jobs) and 6ee7bf94 (claude-review-launcher); each merged lane was reviewed and landed. At 6ee7bf94 the shared working pattern and AGENTS.md conflicted in four adjacent bullets; the seat kept this lane's Plans bullet and main's Review corpus, Review ladder and Review bar bullets (the Larger-lanes and Default-pattern bullets merged on their own), confirmed AGENTS.md still holds the shared file byte for byte, regenerated the outline and code map, kept both sides of HANDOFF, the session file and FEAT-006's known bugs, and re-ran worker-lane, brief-check, claude-review and review-standard green. The lane's own commits: 1c9de813 (plan), f3c4a763 (build 1), c4974274 (the seat's finding F1, amendment 1, brief 2), 14d8c810 (build 2), d7a516a4 (the seat's pairs and the p16 finding, brief 3), 1c58155f (build 3), d3e0f475 (the pairs again), 7e64cbf0 (notes), the merges, and the final commit with this brief.

The plan of record is `docs/reviews/precedent-first-2026-10-22/must-meet.md`: the owner's ruling, the lane's own Precedent section, decisions D1 to D9 and amendment 1, eight rows (R-2578 to R-2585), the tunables and the known limits; `plan-draft.md` and `plan-attack.md` (M 2, S 6, N 5) are its inputs.

The seat's record:
- F1 after build 1: the reader took the numbered steps after a blank line as Precedent entries, so pi-worker would have refused this lane's own brief 1. Amendment 1 ends a label section at its first blank line; build 2 fixed it and added the case to R-2580.
- Wrong-code pairs (`seat-mutate.mjs`): 18 of 19 red at 14d8c810; p16 (a folder match with no `/` boundary) survived because R-2579 matched bare entries and "tracke" sits inside "is not tracked"; build 3 matched the quoted form, and all 19 are red at 1c58155f, 16 by exactly their named titles (`seat-mutate-output-1c58155f.txt`).
- brief-check passes both of this lane's build briefs and refuses a brief with no Precedent section.
- Session titles: 0 missing.
- Build 3's locked full suite: `207 files: 205 PASS, 0 FAIL, 2 SKIP`. After the second merge, map:check, req:tree, readme:check and the trace are green.
- The notes also fold in the launcher lane's final-review notes (FEAT-007) and the first first-try Windows failure since CI went to four files (FEAT-031; HANDOFF's count line).

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 7d664b9..6ee7bf9: 8 rows in 2 features
FEAT-006 · Launch builders with execution limits
  R-2578 new (implemented)
  R-2579 new (implemented)
  R-2580 new (implemented)
  R-2581 new (implemented)
  R-2582 new (implemented)
  R-2583 new (implemented)
  R-2585 new (implemented)
FEAT-014 · Create or adopt a project workspace
  R-2584 new (implemented); also applies: FEAT-006
```

CI on PR #170 runs on the reviewed tip, the Windows leg included (win32-launch lists `- seed`, so the HEAD check runs through the flipped-case and 8.3 short-path folder there). The seat lands only on green.
