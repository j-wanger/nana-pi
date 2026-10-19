Plan: win-python-template. The template fix makes the rendered project pass under a forced cp1252 child on macOS. It changes nothing under the default encoding.

REPRO (macOS, done; the repo was not touched)
Scratch folder: <os-temp>/nana-cp1252-AJMe (called B below)

  cd $B && uvx copier copy --trust --defaults --vcs-ref HEAD -d language=python -d project_name=enc-probe <repo> $B/proj
  cd $B/proj && env -u PYTHONIOENCODING PYTHONPATH=$B/proj/src uvx --with pytest pytest -o addopts= -p no:cacheprovider
    -> 65 passed, exit 0
  cd $B/proj && PYTHONIOENCODING=cp1252 uvx --with pytest pytest -o addopts= -p no:cacheprovider tests/test_requirements_trace.py
    -> 7 failed, 26 passed, exit 1
       E   UnicodeDecodeError: 'utf-8' codec can't decode byte 0xb7 in position 550: invalid start byte
       The 7 are all the pytester tests except test_bad_marker_id_is_a_usage_error, whose child prints no " · ".
       This matches Windows run 3 ("7 failed, 58 passed").
  An adopt=true render fails the same way (7 failed).

Why forcing reproduces it:
- In pytest 9.1.1, `Pytester.popen` copies `os.environ` into the child's environment.
- `Pytester.run` writes the child's stdout to a file and reads it back with `encoding="utf8"`.
- The child's stdout is a file, so Python encodes it with the locale encoding, which is cp1252 on Windows.
- `PYTHONIOENCODING=cp1252` forces the same thing on macOS.

Forcing artifact:
- The full suite under forcing also fails `tests/test_code_map.py::test_impact_gives_transitive_callers_and_callees`.
- Its `cli()` helper decodes with `text=True`, which uses the parent's locale encoding (UTF-8 on macOS). The child writes the em dash as cp1252 0x97.
- On Windows both sides use cp1252, so that test passes there (it is among the 58 passing).
- So the must-meet check runs only `tests/test_requirements_trace.py`.

FIX
File: templates/python/template/tests/test_requirements_trace.py.jinja. Insert before line 398 (`def _project(...)`), after `test_summary_counts_statuses`. Seven lines added, nothing else changed:

  @pytest.fixture(autouse=True)
  def _utf8_child_output(monkeypatch: pytest.MonkeyPatch) -> None:
      """pytester reads a child pytest's output as UTF-8, but a child writes it in the
      locale's encoding (cp1252 on Windows), so the summary's ' · ' would not decode."""
      monkeypatch.setenv("PYTHONIOENCODING", "utf-8")

Why this design:
- `PYTHONIOENCODING=utf-8` sets exactly the encoding pytester decodes, and only for the test's own children. Monkeypatch restores it after each test.
- `PYTHONUTF8=1` was tested and does NOT fix the forced repro (still 7 failed): `PYTHONIOENCODING` takes priority over UTF-8 mode.
- Fixing it in the conftest was rejected. Swapping " · " for ASCII changes every user's output and breaks parity with TypeScript (`requirements-trace.ts:481` also uses " · "). Forcing UTF-8 stdout in the conftest would garble cp1252 consumers on Windows.
- The module header is unchanged, so the template's `docs/code-map.md.jinja` needs no change.

Proof:
- Forced cp1252, trace tests only: 33 passed, exit 0 (before the fix: 7 failed).
- Default encoding, full suite: 65 passed. The output is byte-identical before and after the fix, timings aside. The summary still prints "requirements: 23 total (9 implemented · 14 untested)" with UTF-8 bytes C2 B7.
- The fixed render passes `uv sync`, ruff check, ruff format --check, mypy, `uv run pytest` (coverage 100%), `code_map.py --check` and `readme_check.py`.
- I committed the fix in a temp clone ($B/clone, 7f0d1f5) and ran three checks there:
  - Template acceptance: `node scripts/template-acceptance.mjs --src $B/clone --ref HEAD` exited 0 for all four modes.
  - The v0.6.0 → HEAD copier update merged with no .rej. After the map was regenerated, the full suite gave 65 passed and printed the Part G drift line. The forced trace run gave 33 passed.
  - With `NANA_TEST_REQUIRE_COPIER=1`, templates-render gave 162 pass, 0 fail, 0 skip. templates-update gave 34 pass, 0 fail, matching TT2's macOS count.

MUST-MEET
Row, added to SUB-019 after R-1321 (R-1360 is free; feat/win-review-paths holds R-1350..R-1356):

  | R-1360 | WHEN a Python project rendered from the template runs its requirements trace tests with its Python processes writing their output in cp1252, those tests shall pass. | untested | — |

It flips to implemented with evidence `packages/nana-pack/tests/templates-render.test.mjs::R-1360: a rendered Python project's trace tests pass when its Python processes write their output in cp1252`.

Test: one new check in packages/nana-pack/tests/templates-render.test.mjs:
- Place it in the scaffold block under `if (language === "python")`, after "copier renders the template" and before the render is removed. Put `// req: R-1360` directly above the check call.
- Run `uvx --with pytest pytest -o addopts= -p no:cacheprovider tests/test_requirements_trace.py` with cwd set to the render and env `{...process.env, PYTHONIOENCODING: "cp1252"}`.
- Pass means exit 0. On failure, print the tail of the output.
- If uvx cannot resolve pytest, SKIP with a reason, but FAIL under `NANA_TEST_REQUIRE_COPIER=1` (the convention from win-template-tests build 2).
- Use `uvx`, not this file's `pytestAvailable()` (`uv run --no-project ... python3`). That probe SKIPs on Windows (log line 4633), while `uvx --with pytest pytest` runs there (the update leg).
- The prototype is $B/proto-check.mjs: FAIL on the unfixed render (7 failed), PASS on the fixed one.

Why a nana-pack test and not a template test:
- The claim is about nana-pi's template, and nana-pi rows cite nana-pack tests.
- A shipped template test that forces cp1252 itself would fight the fixture over the same variable. It could then only check that the variable is set, which tests the code rather than the behaviour.
- It adds nothing to every user's project, and it reuses an existing render, so no extra copier call.

No second row. The default-encoding claim is already pinned by `test_full_run_passes_when_status_matches` (real child, " · " line) and `test_summary_counts_statuses`. Template acceptance runs both on macOS.

Windows CI evidence (still to come): on the Windows leg, the R-1360 check passes and is not skipped, and templates-update's "Python earlier-tag update prints Part G drift" passes (exit 0 with the drift line). templates-update should then be 34 pass, 0 fail.

THE LANE'S OTHER DUTIES
- Lane class: ordinary (template, test and row; no install, hook or gate). One final reviewer.
- Order: start after feat/win-template-tests lands. Its templates-update Windows fixes are what let the update leg run on Windows, and it also edits templates-update.test.mjs.
- Release: template acceptance passes (above). CI cuts the tag after land; the lane cuts no tag by hand.
- Copier answers: no new question; `.copier-answers.yml.jinja` is unchanged.
- Python adopt path: the same file ships in adopt mode. The fixture carries no marker, so the `req-candidate` checks are unaffected. The adopt-py SKILL.md file list is unchanged.
- TypeScript template: no change needed. Its tests spawn node children with `encoding: "utf8"`, and node writes UTF-8 to pipes on Windows. It has no pytester-style decode.
- The rendered project's own CI is ubuntu-only. The Windows impact is local runs plus nana-pi's own Windows leg.
- Docs: drop the HANDOFF residual line "Templates on Windows: a Python project made from the template fails its own tests there..." Add a session entry. Run the map, README and `npm run test:locked` checks before land.

KNOWN LIMITS
1. That the full rendered suite passes on Windows after the fix is inferred, not verified. Run 3's only failures are the 7 decode failures, and macOS forcing confirms the fix. This is the claim most likely to be wrong.
2. macOS forcing changes only the child's stdio encoding, not the parent's locale. The full suite under forcing therefore always fails the code-map impact test, which is why the check is scoped to the trace file.
3. The fixture covers only the trace tests' pytester children. A future template test that decodes a Python child as fixed UTF-8 would hit the same bug. The `cli()` helpers in test_code_map.py and test_readme_check.py are consistent on Windows today. They would break only if the scripts printed a character cp1252 lacks (inferred).
4. Already-rendered projects stay broken on Windows until `uvx copier update` to the tag that carries the fix.
5. R-1321's trace leg still SKIPs on Windows because templates-render's `uv run ... python3` probe fails there. The cause is inferred to be no `python3` in uv's Windows environment. This is a separate residual and is not fixed here.