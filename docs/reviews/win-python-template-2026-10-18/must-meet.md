# win-python-template — a Python project made from the template passes its own tests on Windows (2026-10-18)

**The feature.** A Python project rendered (scaffolded or adopted) from nana-pi's template passes its own test suite on
Windows. Today it does not: the template's trace tests run pytest in a child through pytester, which reads the child's
output as UTF-8, while a Windows child writes it in the locale's encoding, cp1252, so the summary separator ` · `
(byte 0xb7) fails to decode. Seven trace tests fail there (CI's Windows leg, the win-template-tests lane's run 3). The
same mismatch hits the code-map and readme-check tests' `cli()` helpers when a Windows user sets
`PYTHONIOENCODING=utf-8`: the parent decodes in cp1252 and the child writes UTF-8.

**Lane class: ordinary** — the template's tests, one nana-pack check and one row; no install, hook or gate code. The
template ships through CI's release tag after the land, so template acceptance must pass. Threat model: honest variation
in Windows encodings and locales in scope; deliberate forgery out.

**The fix** (the seat's plan, `plan-design.md` and `plan-attack.md` here; the attack's amended plan wins):
- `templates/python/template/tests/test_requirements_trace.py.jinja`: an autouse fixture sets `PYTHONIOENCODING=utf-8`
  through `monkeypatch`, so pytester's children write the encoding pytester decodes. The summary text users see is
  unchanged.
- The `cli()` helpers in the template's `tests/test_code_map.py` and `tests/test_readme_check.py`: pin both sides,
  `encoding="utf-8"` on the decode and `PYTHONIOENCODING=utf-8` in the child's environment.

## Must-meet (one row)

- **PT1 (R-1360).** WHEN a scaffolded or adopted Python project's requirements trace, code-map and readme-check tests
  run in an environment that sets Python's output encoding to cp1252, they shall pass. Pinned by one check in
  `packages/nana-pack/tests/templates-render.test.mjs`, run in both the scaffold and the adopt blocks right after the
  render: `uvx --with pytest pytest -o addopts= -p no:cacheprovider tests/test_requirements_trace.py
  tests/test_code_map.py tests/test_readme_check.py` with `PYTHONIOENCODING=cp1252` and `LC_ALL=en_US.ISO8859-1`, pass on
  exit 0. It probes `uvx --with pytest pytest --version` first and SKIPs with a reason when that fails, or FAILs under
  `NANA_TEST_REQUIRE_COPIER=1`. It fails on the unfixed template (seven trace tests) on macOS.

## Evidence (no row)

- **PT2.** Windows CI: the PT1 check passes and is not skipped, and templates-update's "Python earlier-tag update prints
  Part G drift" passes (templates-update 34 of 34). Template acceptance passes on macOS.

## Known limits

The rendered project's own CI is ubuntu-only. Under cp1252 output, the template's `scripts/readme_check.py` crashes with
a UnicodeEncodeError when a README names a path holding a character cp1252 lacks (pi's post-edit runs on Windows would
show the traceback). The rendered `test_requirements_trace.py` is over the template's 500-line module cap.

## Seat amendment (2026-10-18, before the final round)

R-1360's row now reads "those that pass under the default encoding shall pass". A user's project can carry tests that
fail under any encoding; the row claims only that cp1252 output adds no failure, which PT1 pins on a freshly rendered
project. The known limit above is the checker's own run under cp1252, not these three test files: the project-README
test calls the checker inside pytest's output capture.
