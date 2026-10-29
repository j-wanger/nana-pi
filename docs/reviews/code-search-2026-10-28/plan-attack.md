# code-search · plan attack (adversary, 2026-10-28)

Stakes: ordinary lane, reversible, but must-meet 1 touches the shipped template generator.

## MUST

**M1. Must-meet 3 cannot test must-meet 1, and its number is the wrong one.**
Problem: the floor reads each need's map at its base commit. Those maps have no artifact lines, so the floor passes or fails without the "improved map" ever being read. The quoted 0.61 is the structure search's top ten without callees. The command prints top five plus callees, which scored 0.80 on 16.5 modules.
Fix: pin what the command prints: top five plus callees, floor sealed at the measured 0.80 (or a chosen margin under it). Define the answer key in the row: `reused_code` plus `extended`, as `score.py` used. State that the search reads artifact data from REQUIREMENTS.md at the same base, or the floor tests a different search than the one shipped.
Evidence: `v3/score/score.json` table rows "structure" (0.61) and "structure top 5 + their callees" (0.80). Base commits come from `git show` of `docs/code-map.md`.

**M2. Artifact lines in every map entry are the trial's weakest part and its largest blast radius.**
Problem: the trial did not put artifact text in module entries. It ranked artifacts as separate documents and passed the score to writers and readers at weight 0.5. Score says artifact lines "help a little": @1 7 to 6, @5 10 to 9, share 0.61 to 0.59. Only 3 of 6 bases had the new `Artifact:`/`Reads:` form. The walk and whole-header text carried the gain, and the map already holds both. Writing about 327 artifact lines into a 435 KB map duplicates REQUIREMENTS.md. It also makes `map:check` stale on every artifact-line edit, and builders add those lines in most lanes. The entry format comes from `templates/typescript/template/scripts/code-map.mjs`, which every scaffolded project runs. The Python template's `code_map.py` would then drift, and a change ships through a release tag.
Fix: drop must-meet 1. Have the search read artifact lines from REQUIREMENTS.md at query time, as the trial did. If the owner's "improved code map" must mean a map change, bring him readings first. The trial supports two map changes: test links by file stem for spawned bins, and better headers where search failed (`doctor.mjs`, the session-start-frontier modules). Otherwise read "improved" as the search mode itself, O1's default.
Evidence: `v3/structure.mjs` lines 140-200 (`artRank`, `artifactWeight`); the `structure` section of `v3-result.json` (caveats on artifact lines); `scripts/code-map.mjs` shim header.

## SHOULD

**S1. The named BM25 precedent is not reusable code.**
Problem: nana-knowledge ranks with SQLite FTS5's `bm25()` through `node:sqlite`, over a database file. It has no in-memory BM25F with field weights. The layer import itself is legal, since scripts sit above packages. But the builder would follow the wrong precedent, the ruling binds it, and it would inherit a database effect. The real precedent is the trial's `structure.mjs`, which is untracked scratch.
Fix: name `none: no in-memory ranker in the repo` for ranking, carry `structure.mjs` in the brief, and at most reuse `tokenize.ts` stopwords. Drop facets, as both trial reports advise.

**S2. The Purpose reads post-hoc numbers as findings.**
Problem: the callee gain was chosen after the reader's notes, on the same ten needs. The seat wrote those needs knowing the lanes. The seat's 0.76 is inflated by builders following it. Every search scored 0.30 or less on session-start-frontier.
Fix: say "hypothesis on ten needs", and say the search adds to the planner's list rather than replacing it.

**S3. A pinned prompt sentence pins text, not use.**
Fix: keep the sentence. Add a carry line to read the next three plans' Precedent sections against the search output. Add no new check.

## NOTE

- N1. The suite job uses `fetch-depth: 0` on all three legs, so `git show <base>` works in CI. A shallow local clone would fail; the test should fail and name the missing commit, not skip.
- N2. Suite time looks small. Six bases mean six reads of 435 KB plus 1 MB, and ranking ~450 docs ten times. Measure it once in the build report.
- N3. REQUIREMENTS.md is 1,057,460 bytes, past the knowledge index's 1 MiB file cap. The knowledge pull already skips it. This confirms the trial's "knowledge index cannot host this".
- N4. Must-meet 2 drops tests from the top five but not from the callees. Keep it that way. Callees found the reused test helper in 3 of the 6 lanes that reused one, and the top ten alone found it in none.

Counts: 2 MUST, 3 SHOULD, 4 NOTE.
