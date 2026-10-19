# Lane readme-check-cp1252 — build brief 1 (2026-10-19 · feat/readme-check-cp1252 · tip after the seat's plan commit)

**Builder: Claude Sonnet 5, a subagent in `<worktrees>/readme-check-cp1252`.** Lane class: ordinary. Read `must-meet.md` here first (the adversary's amended plan; `plan-attack.md` holds its reasons). Requirements first: add the rows `must-meet.md` lists as `planned` in the right feature table of `REQUIREMENTS.md`, run `npm run req:tree`, and bump the R-291 leaf-total literal in `packages/nana-pack/tests/requirements-tree.test.mjs` (three spots) by the rows you add; then the tagged tests; then the code; flip each row to `implemented` when its test passes. Run `npm run map` after adding or moving a module and commit the map. Do not run the full suite and do not push; the seat does both. Do not edit `HANDOFF.md` or `docs/sessions/`.

---

# Build brief: readme-check-cp1252 (ordinary lane, rows R-1440 to R-1449 available, use R-1440 to R-1443)

Worktree <worktrees>/readme-check-cp1252, branch feat/readme-check-cp1252, based on main b3f6ec2. The must-meet is in docs/reviews/readme-check-cp1252-2026-10-19/must-meet.md, and the seat commits it.

## Change, in order
1. REQUIREMENTS.md, in the SUB-019 table after R-1360:
   - Add R-1440 to R-1443 with the must-meet's row text, status `untested`. Each Evidence cell names its check title exactly.
   - Run `npm run req:tree` and commit docs/requirements-tree.md.
2. packages/nana-pack/tests/templates-render.test.mjs: add the four checks, with titles exactly as the must-meet table gives them.
   - Place them in the copier-available `else` branch, Python only. Use one extra scaffold render, like the R-1321 CRLF block, removed in `finally`. Leave the main render untouched.
   - If the render fails, each of the four checks FAILs with the render log tail.
   - Fixture: append ``See `docs/λ-notes.md` and `docs/gone.md`.`` to README.md, and write `src/tpl_py/modλ.py` containing `"""no header"""`.
   - Run four commands through the spec's `python3`: `readme_check.py`, `readme_check.py --list`, `code_map.py --check`, and `code_map.py --impact src/tpl_py/modλ.py`. Pass that impact argument as a literal string, not path.join.
   - Run each under PYTHONIOENCODING utf-8, ascii and cp1252. Use spawnSync WITHOUT `encoding`, so stdout arrives as a Buffer. The file's `run()` decodes as UTF-8 and would mangle cp1252 bytes.
   - Comparator, per the must-meet: the exit equals the UTF-8 exit. The decoded stdout equals the UTF-8 stdout with each character the encoding lacks written as its Python escape. The ascii run decodes as UTF-8. The cp1252 run decodes with TextDecoder("windows-1252"). The cp1252 set comes from decoding bytes 0x00 to 0xFF.
   - On FAIL, print the encoding, both exits and the stderr tail.
   - R-1443 passes when every UTF-8 stdout contains λ.
   - Put each `// req: R-144x` marker directly above a literal `check(` call.
3. templates/python/template/scripts/readme_check.py and code_map.py:
   - Add `import io`.
   - Inside `if __name__ == "__main__":`, before `try:`, add `if isinstance(sys.stdout, io.TextIOWrapper):` and under it `sys.stdout.reconfigure(errors="backslashreplace")`.
   - Change nothing else.
4. Flip the rows to `implemented` once their checks pass. Copier renders uncommitted template edits, so red and green runs work before you commit.

## Wrong code to try first (each must turn a check red; break the code, never the assertion)
- Fix readme_check.py only: R-1441 and R-1442 stay red.
- `errors="replace"`, or `errors="namereplace"`: R-1440 to R-1442 go red, because `?` or `\N{...}` is not the escape.
- `reconfigure(encoding="utf-8")`: the ascii and cp1252 runs print raw λ bytes, not the escape. R-1440 to R-1442 go red.
- Guard only `if sys.platform == "win32"`: R-1440 to R-1442 go red on macOS and Linux.
- Wrap main in `except UnicodeEncodeError: sys.exit(1)`: lines are lost and the impact exit differs. Red.
- Escape at the print sites unconditionally (`.encode("ascii", "backslashreplace").decode()`): R-1443 goes red.
- An unguarded `sys.stdout.reconfigure(...)`: the checks pass, but mypy strict fails in template:accept. Report it as caught by the seat check.

## Do not
- Add any other test, or edit an existing test.
- Touch the TS template, tests/conftest.py, HANDOFF.md or any module header.

## Done
- `NANA_TEST_REQUIRE_COPIER=1 npm test -- templates-render` passes, with the four checks PASS and none SKIP.
- `npm run template:accept` exits 0 on your last commit.
- `npm run map:check` and `npm run readme:check` exit 0, and `npm run req:tree` leaves no diff.
- `npm run test:locked` is green on the last commit.

## Report shape (10 lines or fewer)
Line 1 is VERDICT. Then:
- commits, and each row with its status;
- one line per wrong-code pair, with the check that went red;
- each Done command's exit code;
- the templates-render PASS/SKIP counts and the suite summary line;
- what was not done.