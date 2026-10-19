MUST: 3

**MUST 1. Known limits 2 and 3 describe a real Windows failure as a macOS artifact, and the plan drops the residual on that basis.**

- The `cli()` helpers in `test_code_map.py` and `test_readme_check.py` decode with `text=True`, which uses the parent's locale encoding. The child writes in whatever `PYTHONIOENCODING` says.
- A Windows user with `PYTHONIOENCODING=utf-8` (a common setting) gets a cp1252 parent and a UTF-8 child. On the fixed render, `test_impact_gives_transitive_callers_and_callees` then fails.
- I reproduced the same mismatch on macOS with `LC_ALL=en_US.ISO8859-1 PYTHONIOENCODING=utf-8` and the full suite: 1 failed, `assert 'transitive callees (0): —' in '...transitive callees (0): â\x80\x94...'`. The Windows case itself is inferred.
- So the plan's "on Windows both sides use cp1252" holds only when the variable is unset.
- Preferred remedy: pin both sides in the two `cli()` helpers with `encoding="utf-8"` and `env={**os.environ, "PYTHONIOENCODING": "utf-8"}`, plus `import os`.
  - I tested this on the fixed render. The full suite gave 65 passed under four settings: default, io=cp1252, latin1+io=cp1252, and latin1+io=utf-8. Ruff format is clean; ruff check reports 2 fixable import-order items.
  - With this change the check can run all three test files that start child processes, and Known Limit 2 goes away.
- Minimum remedy: keep a HANDOFF residual for this case and correct Known Limits 2 and 3.

**MUST 2. Dropping the HANDOFF line deletes two residuals this lane does not fix.**

- The line "Templates on Windows: ..." comes from feat/win-template-tests HANDOFF. It also holds two other residuals:
  - copier update fails when a caller names the project folder by its 8.3 short name;
  - template-acceptance and release put git's whole folder on PATH on Windows.
- Remedy: remove only the first three sentences, which are about the Python test failure. Keep the rest.

**MUST 3. R-1360 is wider than its test.**

- "A Python project rendered from the template" covers adopt mode, but the check runs only on the scaffold render.
- I verified that an adopt=true render behaves the same: forced, unfixed gives 7 failed, 26 passed; fixed gives 33 passed.
- "With its Python processes writing their output in cp1252" contradicts the fix: after it, the pytester children write UTF-8. The test forces the environment variable, not every process's output.
- Remedy: run the same command in the adopt block too, which reuses that render. Or narrow the row to "scaffolded". Also reword the condition, for example: "WHEN a scaffolded or adopted Python project's requirements trace tests run in an environment that sets Python's output encoding to cp1252, they shall pass." Update the check title to match.

**Attack results that found no problem**

- (1) With the fix removed, the check fails. My re-run on a fresh render from HEAD under forced cp1252 gave 7 failed, 26 passed, exit 1, the same 7 tests. Fixed: 33 passed. pytest 9.1.1 `Pytester.popen` does copy `os.environ`, and `run` does read back with utf8.
- (2) No user-visible output or contract changes:
  - the conftest summary text is unchanged;
  - the module header and the template code-map are unchanged;
  - the fixture carries no marker;
  - ruff check and format pass on the fixed render;
  - no nana-pi test pins rendered test counts;
  - nana-pi's own map does not cover `templates/`.

SHOULD:

1. **Check strength on macOS.** Forcing only `PYTHONIOENCODING` cannot tell the fix from a wrong fix. A `monkeypatch.delenv("PYTHONIOENCODING")` mutant passes on macOS (33 passed) but would leave Windows broken. Add `LC_ALL: "en_US.ISO8859-1"` beside `PYTHONIOENCODING: "cp1252"`. Verified with both set: unfixed 7 failed, fixed 33 passed, delenv mutant 7 failed. On Linux without that locale, the variable alone still forces cp1252.
2. **Skip detection.** Probe `uvx --with pytest pytest --version` first and SKIP or FAIL on that. Then require exit 0 from the real run. Do not guess "unresolvable" from the run's exit code: uv and pytest both use exit 2, so a collection error could turn into a SKIP.
3. **Placement.** Put the check directly after `if (!ok) continue;`. Later scaffold steps mutate the render, and `dropHeader(tests/test_smoke.py)` is never restored.
4. **Undeclared duty.** A new row means regenerating `docs/requirements-tree.md` and bumping the R-291 leaf-total literal in `packages/nana-pack/tests/requirements-tree.test.mjs`. It is 1,213 on main and becomes 1,220 once win-review-paths lands. Expect a conflict with that lane.
5. **Windows temp path (inferred risk).** templates-render's `dest` is the runner's 8.3 short temp path; `tmpDir` does no long-path resolution. The update leg ran pytest on a long path. If pytest misbehaves under the short path, use `realpathSync.native`, like the update leg's `toLongPath`.
6. **Limit 3 is now confirmed.** I added `` `docs/arrow→.md` `` to the README. Under cp1252 output, `scripts/readme_check.py` crashes with a UnicodeEncodeError traceback (exit 1). Under the default encoding it prints a clean problem line. This would hit pi post-edit runs on Windows, where output goes through a pipe. Record it as a residual.
7. **Module line cap.** The rendered `test_requirements_trace.py` is already 511 lines, over the template AGENTS 500-line cap; the fix makes it 518. Note it as a residual.
8. **Interpreter version.** Under the test's temp HOME, `uvx` here picked Python 3.11.15, below the project's `requires-python >=3.12`. Consider `uvx --python 3.12`.

**Amended plan.**

- Keep the trace-test fixture.
- Extend the fix to pin UTF-8 on both sides of the two `cli()` helpers.
- Reword R-1360 to: "WHEN a scaffolded or adopted Python project's requirements trace, code-map and readme-check tests run in an environment that sets Python's output encoding to cp1252, they shall pass."
- Implement the check like this:
  - probe uvx and pytest first; SKIP, or FAIL under `NANA_TEST_REQUIRE_COPIER=1`;
  - run `tests/test_requirements_trace.py tests/test_code_map.py tests/test_readme_check.py` with `PYTHONIOENCODING=cp1252` and `LC_ALL=en_US.ISO8859-1`;
  - run it in both the scaffold block (right after the render check) and the adopt block.
- Regenerate the requirements tree and bump the R-291 total.
- In the HANDOFF line, cut only the Python sentences. Add residuals for the readme_check UnicodeEncodeError and the module cap.
- If Jake keeps scope to trace tests only, record the `PYTHONIOENCODING=utf-8` code-map failure as a residual instead of calling it an artifact.

Evidence (outputs and patched copies): <os-temp>/adv-cp1252-RXeE. The files are `*-forced.out`, `*-locale.out`, `*-both.out`, `fixed-mismatch.out`, `wide-*.out`, `adopt-*.out` and `rc.out`, next to the `proj`, `fixed`, `mut`, `wide` and `adopt` folders.