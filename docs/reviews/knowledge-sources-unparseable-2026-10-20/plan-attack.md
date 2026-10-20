# knowledge-sources-unparseable — plan attack (one adversary)

Verdict: AMEND

AMEND. The plan holds up. Probes confirm every red-today claim, and one row was wider than its test.

Probes: I ran these on main 72abe19a, in a temp copy from git archive, with a made-up temp HOME and NANA_KNOWLEDGE_HOME.
- After a good build (files 1 · rows 1), I re-saved sources.json six ways: UTF-8 mark, UTF-16LE with a mark, a C:\ path, a trailing comma, an empty file, and a folder in its place. Each build printed `removed 1` and exited 0, and each query then printed `(no hits)`.
- `build --rebuild` on the C:\ file also left `(no hits)`. Status printed only `sources <file>`.
- With the plan's design prototyped, all six cases kept the row and printed the markers. The discovery, incremental-build and unreadable-root test files still passed (0 FAIL).
- W2 (keep rows when roots.length === 0) kept the row for `{"roots":[]}`, so R-2376 catches it.
- V8 on Node 22.22.2 gives these places: bad escape line 3, column 19; missing comma line 4, column 5; trailing comma, empty file and single quotes give no place. The trailing-comma message quotes file text, so printing err.message fails R-2372.

Amendments:
1. R-2372 was wider than its test. The row promised the forward-slash repair for a control character and the manual repair for "otherwise". The test only hit two cases: place plus forward-slash, and no place plus manual. I added F2, a missing comma, which is the most common hand-edit mistake and has a place with the manual repair. I narrowed the row to the three fixtures. The control-character and Unicode-escape cases come from json-text and are already covered by R-1971, R-1972, R-2090 and R-2091.
2. R-2371 now includes F4, an empty file. That is what the hourly background build sees if it reads sources.json while an editor is saving it, and today that wipes the whole index. W10 (treat an empty file as missing and re-seed it) would also overwrite the owner's file. Nothing else catches it.
3. The marker checks now assert that the line appears exactly once on stdout, not that the whole output matches. knowledge-index-recover may add build lines, and those must not break this test.
4. The marker words become named constants with a provenance comment, which follows the no-inline-tunables rule.
5. I added wrong-code tries W9 (marker on stderr), W10 (empty file re-seeded) and W11 (place dropped when the repair is manual).
6. New known limit: while sources.json stays broken, no root is scanned.
7. Brief tip: in the JS test source, F1's backslashes must be doubled, because `\x` before a non-hex character is a JS syntax error.
8. The brief names a builder: a Sonnet subagent, since this is about 40 lines across three modules.

Subtraction test: I considered stopping the build before it opens the database. That makes build.ts simpler. But the index file would not be touched, so the hook would see a stale index and start a build that fails on every prompt. The plan's one-condition change to the keep-rows branch costs less. Kept.

Class: hook. This follows knowledge-unreadable-root and both knowledge pin plans: the CLI is the Claude Code hook's command, and build.ts is the build the hook starts.

Conflicts:
- None of the seven in-flight lanes touches packages/nana-knowledge or json-text.mjs; I checked each branch's diff against its merge-base.
- docs/requirements-tree.md and docs/code-map.md will conflict, because every lane regenerates them. Merge main and regenerate.
- waitFor: none.
- Slate overlaps (inferred, plans not seen): knowledge-index-recover (build.ts at the top of buildLocked, the CLI, the README); shared-memory-index-cap and claude-config-dir (the FEAT-003 table and its tree line); gate-stop-names-config may edit json-text.mjs, while this lane only imports four of its exports.
- Land order: this lane before knowledge-index-recover. Every other slate lane can land in any order, regenerating the map and tree.

Files: packages/nana-knowledge/lib/sources.ts, lib/build.ts, bin/nana-knowledge.ts, tests/sources-file.test.mjs (new), README.md; REQUIREMENTS.md; docs/requirements-tree.md; docs/code-map.md.

Most likely wrong: the exact V8 places in R-2372 (3/19 and 4/5) on whatever Node 22.x CI pulls. I saw them only on 22.22.2. Second: the folder stand-in on Windows. Node's docs say reading a folder errors there, and any error other than ENOENT takes the guard, but nobody has run it.

Disclosure: one probe step ran `cp` into a /tmp/x folder that already existed. That created /tmp/x/build.ts, a copy of the prototype. I deleted it; its creation time matched my copy. No repository, worktree, ~/.pi or ~/.claude was touched. No probe process is left running, and I removed the temp folder.
