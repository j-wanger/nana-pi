Feature: FEAT-006 · Launch builders with execution limits. Lane claude-code-builder-parity. Class: gate. Builder: pi-worker (small lane). Build session 3: R-2647's check on Windows and under a wrong prompt.

Work in the lane worktree on feat/claude-code-builder-parity at build 2's tip, f8bdd255. The spec is still `docs/reviews/claude-code-builder-parity-2026-10-22/must-meet.md`. Change only `packages/nana-pack/tests/worker-claude.test.mjs`. Do not edit product code, HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder.

Finding F3 (Windows, measured): the seat ran `worker-claude.test.mjs` at f8bdd255 on GitHub's windows-latest runner (scratch run 39910554893). R-2650 and every other check passed, and the reports reached `--out`. R-2647 failed with `promptChecks` `{"bytes":false,"bugsAfterBrief":false,"bugsOnce":false}` and every other sub-check true; the no-feature build passed. So the prompt file holds the preamble and the brief, but not `BUG_TEXT` as written. Inferred cause: the lane is a `git worktree add` checkout of the fixture repo, and git on the runner converts the committed known-bug file to CRLF on checkout (`core.autocrlf`). pi-worker copies the lane file's bytes, which is what R-2647 asks ("the text of the known-bug file"); the test's oracle is the string the fixture wrote before the commit. Build the expected known-bug bytes from the lane's checked-out `docs/known-bugs/FEAT-006.md`, read once after the worktree is added, and use them in `expectedPrompt`, `bugsAfterBrief` and `bugsOnce`. Assert those bytes hold `- fixture bug`, so an empty or wrong read cannot pass. `noFeatureBugs` must find neither those bytes nor `BUG_TEXT`.

Finding F4 (macOS, measured): the seat's wrong-code pair p9 (the prompt passed as argv text instead of `--append-system-prompt-file`) now makes `worker-claude.test.mjs` throw while it builds `promptChecks`: the fake records `prompt: null`, and `path.relative(real(LANE), promptCall.prompt)` throws. R-2647 and every later check never run (`seat-mutate-output-f8bdd255.txt`, p9: "named but NOT REACHED: /^R-2647: /"). At build 1's tip the old single expression short-circuited, so R-2647 failed by name. Make each sub-check of `promptChecks` and `noFeatureChecks` false, not a throw, when its input is missing or not a string (the recorded `prompt` or `cwd`), so p9 turns R-2647 red by name and the later checks still run.

Precedent:
- packages/nana-pack/tests/worker-claude.test.mjs — `expectedPrompt`, `promptChecks` and `noFeatureChecks` (build 2), and the fixture's `git worktree add` of the lane.
- packages/nana-pack/tests/build-records.test.mjs — a win32 expected value built from what is on disk, not from a literal (R-2599).

1. Fix F3 in the test only. Keep every title and `// req:` marker.
2. Fix F4 in the test only.
3. Check by hand, without committing it, that the p9 mutation (in `packages/nana-pack/bin/pi-worker.mjs`, pass the prompt file's text as an argv value in place of `--append-system-prompt-file` and its path) turns R-2647 red by name with the later checks still reported; then restore the file.
4. Checks before your one commit: `node packages/nana-pack/tests/worker-claude.test.mjs`; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`. You cannot run Windows here; reason about the win32 bytes from the code and say what you could not run.

Seat check: `node docs/reviews/claude-code-builder-parity-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done: R-2647's expected known-bug bytes come from the lane's checked-out file; no sub-check throws on a missing or non-string input; the p9 hand check shows R-2647 red by name; the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; what changed; the p9 hand check's result; each departure from the Precedent files with its reason; the full suite's summary line; map, readme, trace, tree and seat-check status; what you could not run.
