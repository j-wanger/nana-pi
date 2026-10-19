# Lane rulings-file — build brief 1 (2026-10-19 · feat/rulings-file · tip after the seat's plan commit)

**Builder: Claude Sonnet 5, a subagent in `<worktrees>/rulings-file`.** Lane class: install + hook. Read `must-meet.md` here first (the adversary's amended plan; `plan-attack.md` holds its reasons). Requirements first: add the rows `must-meet.md` lists as `planned` in the right feature table of `REQUIREMENTS.md`, run `npm run req:tree`, and bump the R-291 leaf-total literal in `packages/nana-pack/tests/requirements-tree.test.mjs` (three spots) by the rows you add; then the tagged tests; then the code; flip each row to `implemented` when its test passes. Run `npm run map` after adding or moving a module and commit the map. Do not run the full suite and do not push; the seat does both. Do not edit `HANDOFF.md` or `docs/sessions/`.

---

# rulings-file — build brief 1

Worktree ~/nana-pi-wt/rulings-file, branch feat/rulings-file.

Follow packages/nana-pack/prompts/builder-preamble.md. Read docs/reviews/rulings-file-2026-10-19/must-meet.md first.

Add rows R-1410 to R-1418 to REQUIREMENTS.md FEAT-001 as `proposed`. Each row flips to `implemented` when its test passes.

**Change.**
1. `packages/nana-pack/lib/rulings-config.mjs` (new, six-tag header):
   - RULINGS_FILE `nana-rulings.md` (contract R-1412);
   - RULINGS_READ_CAP 8192 (chosen: 3.4 times the seed, about 2k tokens);
   - RULINGS_HEADING `## Standing rulings (nana)`;
   - RULINGS_SECTION `nana-rulings`;
   - RULINGS_UNAVAILABLE `RULINGS UNAVAILABLE:`.
2. `packages/nana-pack/extensions/nana-rulings.ts` (new):
   - On every `session_start` reason, read `path.join(piAgentDir(), RULINGS_FILE)` with `readBounded(file, RULINGS_READ_CAP)` from lib/bounded-read.mjs. Refuse an empty file. Decode with `new TextDecoder("utf-8", {fatal:true})`.
   - At `before_agent_start`, set `sections[RULINGS_SECTION]` to `${RULINGS_HEADING}\n\n${text}`, or to the marker.
   - The marker is one line: `RULINGS UNAVAILABLE: <cause> at <displayed path>. Tell the user; they restore it with \`nana-setup install\`.` It speaks to the user, so an agent does not run install itself.
   - Never throw. Take an optional `{ agentDir }` test seam, as nana-writing takes `rulePath`.
   - Do not call orderNanaSections, and do not edit prompt-sections.mjs.
3. `packages/nana-pack/rules/nana-rulings.md` (new): copy the must-meet's Seed block byte for byte.
4. nana-setup:
   - steps.mjs: CLAUDE_RULES gains the imported RULINGS_FILE, and `ruleSource` maps it to PACK_RULES_DIR. Add a link step for `layout.piRulings` with `copyInstead: win()` and label `pi nana-rulings.md`.
   - paths.mjs: add `piRulings: path.join(piHome, RULINGS_FILE)`.
   - doctor.mjs: add a row `pi nana-rulings.md` in the pi user config section, using `linkOk(layout.piRulings, <pack file>)`.
   - state-manifest.mjs: add `rule link nana-rulings.md` and a rebuildable link row for the pi copy. Update the exact lists in the state-manifest, uninstall and restore tests to match.
5. Docs and counts:
   - Pack README: add the extension to the table. Add a known limit: it has no switch of its own (like the writing block), shows a marker, and reaches builders and reviewers.
   - nana-setup README: add the file to the installed-files table.
   - Change "eight" to "nine" in packages/nana-pack/package.json, root package.json and root README.md (two lines).
   - Run `npm run map` and `npm run req:tree`.

**Tests first, all red.** Use the titles exactly as in the must-meet table.
- RT (`packages/nana-pack/tests/rulings.test.mjs`): R-1410, R-1411, the seal, and R-1415 to R-1418.
  - Set PI_CODING_AGENT_DIR to a temp dir outside HOME.
  - Run the FIFO case in a subprocess with a time limit, and skip it on win32.
  - The R-1415 to R-1418 tests fail when the file is missing or has no bullet.
  - Match words whole, in any case. Strip `\r` from each line before checking it.
- IT (`packages/nana-setup/tests/rulings-install.test.mjs`): R-1412 to R-1414.
  - Run `install --home H --pi-home P` and `doctor --home H --pi-home P`, with P outside H/.pi/agent.
  - Match only the rulings rows, not the exit code.

**Wrong code to try.** Each item must turn a named test red. Restore each one after trying it.
- Read the shipped pack file instead of the agent-dir copy.
- Ignore PI_CODING_AGENT_DIR.
- Inject on `startup` only.
- Cache the first read.
- Inject nothing on a missing file.
- Accept an empty file.
- Truncate an over-cap file.
- Go off by one at the cap.
- Install under `<home>/.pi/agent`, ignoring `--pi-home`.
- Copy on POSIX, or link on win32.
- Drop the Claude rule entry.
- Make doctor use existsSync.
- Add "Jake", an undated bullet or "luna" to the file.
- Delete the scope sentence.

**Done.**
- Both new test files pass, and every edited existing test is listed.
- `npm run test:locked` is green on your last commit (the preamble's full suite).
- `npm run map:check` and `npm run readme:check` pass, and the tree outline is current.
- Every row is implemented.
- Everything is committed.

**Report (at most 10 lines):**
- commit SHAs;
- red-then-green per test title;
- the result of each wrong-code item;
- existing tests you edited, and why;
- the rulings file's byte size;
- the suite summary line;
- open doubts.