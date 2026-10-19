# Independent check — bom-pack-config at 208ffcd (2026-10-19)

VERDICT: HOLDS

Setup: a private clone of 208ffcd at <tmp>/bom-pack-config-check.uY57J8/lane, with a temp HOME for every probe. No repository was edited. The real ~/.pi/agent/settings.json, ~/.pi/agent/nana-pack.json and ~/.claude/settings.json kept their old mtimes (Oct 4, Oct 19 12:33 and Oct 17).

Must-meet tests, one file at a time with `HOME=$P/home node <file>`:
- doctor-detail: ALL PASS, including R-1580 and R-1586.
- install: PASS, including R-1581.
- adoption-reader: all passed, including R-1584.
- adoption-producer: all passed, including R-1585.
- project: PASS=123 FAIL=0, including R-1582 and R-1583. The first run crashed at line 238 with ERR_MODULE_NOT_FOUND for `trust-manager.js`. The cause was the temp HOME: `npm root -g` moved to another node's global folder. That line is in old code, not this lane. With `npm_config_prefix=<home>/.local` the file passed.
- `scripts/code-map.mjs --check`: 0 problems. `scripts/readme-check.mjs`: 698 claims, 0 problems.

Probes:
P1. `nana-setup doctor --home $H`. The config was the mark + CRLF JSON with objective.path pointing at a real file and projectFile GOALS.md.
  Lane: `✓ pi nana-pack.json`, `✓ pi objective.projectFile "GOALS.md" (per-repo file renamed…)`, `✓ pi objective file …/p1/goal.md`.
  Main 713d6aa on the same HOME: `✗ … missing or unparseable`, `per-repo OBJECTIVE.md (the default name)`, `✗ pi objective file …/nana-objective.md`. Verdict: fixed.
P2. `nana-setup install --home $H`, run twice. The config was the mark + JSON + trailing CRLF, which is what PowerShell 5.1 writes.
  Both runs: exit 0, `· pi nana-pack.json unchanged already present`, `· pi nana-objective.md unchanged not needed — objective.path already points at …/goal.md`.
  shasum of nana-pack.json was cadf266c… before and after, so the bytes and the mark were kept. No nana-objective.md was created. Verdict: holds.
P3. The Claude Code hook `nana-adoption.mjs` with PI_CODING_AGENT_DIR pointing elsewhere. The config was the mark + CRLF with an absolute journal.path that records one root.
  Output: `[nana:adoption] … - \`…/p3/root\` — has: nothing`, exit 0.
  The same config re-saved as UTF-16LE with its mark: no output, exit 0. It stays unparseable and does not crash, as known limit 3 says. Verdict: holds.
P4. Forced win32 (`NANA_SETUP_PLATFORM=win32`) install and doctor. The config was the mark + CRLF with objective.path `~/goal.md`.
  install exit 0: `not needed — objective.path already points at …/p4/goal.md`, `+ pi nana-rulings.md created copied (no symlink on this platform)`.
  doctor: all three rows ✓. Verdict: holds.
P5. Parser parity. I first confirmed pi 1.0.2's `splitBom` is `content.startsWith("\uFEFF") ? content.slice(1) : content`. I then fed seven inputs to the lane parser, to config.ts's `replace(/^\uFEFF/)`, and to pi's `stripBom`.
  - mark only → throws in all three.
  - mark + `null` → null in all three.
  - mark + whitespace + `{}` → `{}` in all three.
  - whitespace + mark + `{}` → throws in all three.
  - two marks + `{}` → throws in all three.
  - mark inside a string value → the value is kept in all three.
  - mark + `{}` + mark → throws in all three.
  Verdict: identical to the pack and pi on every input.
P6. `project <dir> --check`. The user config was marked with 2 commands; the project config was marked too.
  - Project file `{ nope` → `✓ post-edit commands 2 effective checker command(s)`. Unreadable project config falls back to the user's commands, the same as an unmarked bad file on main.
  - Project file `{"gate":{}}` → 2, from the user's commands.
  - Project file `{"postEdit":{"commands":[]}}` → `! … empty`, because the project block replaces the user's.
  Verdict: holds, and malformed text is handled as before.
P7. Three wrong-code mutations, made in the private clone and reverted afterwards:
  - Stripping every leading mark → `FAIL two leading marks … stay unparseable` (doctor-detail, FAILED 1).
  - adoption.mjs back to plain JSON.parse → FAIL R-1584 (stdout "") and FAIL R-1585 (counts `[0,1]`, expected `[1,0]` and `[0,0]`).
  - project.mjs checkProject back to plain JSON.parse → `FAIL --check counts post-edit commands …`, PASS=122 FAIL=1.
  Verdict: each fix is pinned by a test.
P8. Write scope. After the test runs, `find $P/home` showed only npm and uv caches, with no .pi or .claude. The test's `adoption-hook-mark-*` temp folder was removed (0 left). Verdict: nothing was written outside temp.
P9. `project <dir> --home $H` with a marked user config.
  - `commands: []` → `+ .pi/nana-pack.json created`.
  - One command → `– .pi/nana-pack.json skipped you have user-scope postEdit.commands — an empty project block would shadow them here`.
  Verdict: holds.
P10. `doctor` with PI_CODING_AGENT_DIR pointing at another folder. The config was the mark + CRLF with a relative objective.path `obj.md`.
  Output: `· pi agent dir …/p10agent (PI_CODING_AGENT_DIR)`, `✓ pi nana-pack.json`, `✓ pi objective file …/p10agent/obj.md`. Verdict: holds.

Code read:
- json-text.mjs is pure and has the six-tag header.
- All three call sites keep their own catch and fallback. An unmarked file goes through the same text as before, so main's current behaviour is unchanged.
- Nothing writes nana-pack.json back. readPiPackConfig is report-only, and install reads it only to decide whether to create nana-objective.md.
- The `../../nana-pack/lib/` import from nana-setup follows an existing pattern (steps, doctor and paths already import from there).
- nana-pack has no package.json `files` list, so the new lib file ships.
- No gate or land tool is touched.

Findings:
F1 (known bug, not MUST). HANDOFF.md line 98, at the end of the Roster residual, still reads "Doctor and the adoption hook still fail on a file saved with a byte-order mark." That is now false. Item 7 of the plan says the seat removes it, but 208ffcd does not change HANDOFF.md. Per the land checklist, that edit belongs in the reviewed change before the final round.
F2 (environment note, not this lane). project.test.mjs line 238 finds pi through `npm root -g`. Under a temp HOME that resolved to the wrong node's global folder, so the file crashed until `npm_config_prefix` was set. The code predates this lane.
