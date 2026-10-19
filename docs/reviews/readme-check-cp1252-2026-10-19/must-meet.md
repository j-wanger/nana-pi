# readme-check-cp1252: the Python template's checkers print their whole report under any output encoding (plan, 2026-10-19, adversary-amended)

**Feature.** Take a scaffolded Python project's `scripts/readme_check.py` and `scripts/code_map.py`. Under an ASCII or cp1252 output encoding, each prints the same report as under UTF-8 and exits with the same status. Each character the encoding lacks appears as its Python backslash escape: λ prints as the six characters backslash-u-0-3-b-b (`λ`). Today the first such character raises UnicodeEncodeError mid-report.

**Class: ordinary.** The lane touches two template scripts, one nana-pack test file and four rows, and no install, hook, gate, land or review tool. Templates ship through CI's release tag, so template acceptance must pass: ruff, ruff format, mypy strict and pytest.

**Threat model.** In scope: honest variation in output encodings (cp1252 Windows pipes, cp932, ascii, an explicit PYTHONIOENCODING) and in project path names. Out of scope: deliberate forgery.

**Design.** In each script's `if __name__ == "__main__":` block, before `try:`, add:
```python
if isinstance(sys.stdout, io.TextIOWrapper):
    sys.stdout.reconfigure(errors="backslashreplace")
```
Also add `import io`. The fix keeps the encoding the parent asked for and changes only the error handler. The guard exists because mypy strict rejects a bare `sys.stdout.reconfigure` (probe: union-attr error). stderr already escapes, so it needs no change. Forcing UTF-8 is rejected: it ignores PYTHONIOENCODING and gives a locale-decoding parent mojibake. Probe at b3f6ec2: the guarded fix passes ruff, ruff format and mypy strict. The template's own pytest run passes under PYTHONIOENCODING=cp1252 (64 passed).

## Fixture and comparator

The fixture is one extra Python scaffold render in the copier-available branch of templates-render, removed in `finally`.
- Append the line ``See `docs/λ-notes.md` and `docs/gone.md`.`` to README.md.
- Write `src/tpl_py/modλ.py` containing `"""no header"""`. λ (U+03BB) has no NFD form, and cp1252 lacks it.

There are four commands, each through the spec's `python3`: `readme_check.py`, `readme_check.py --list`, `code_map.py --check`, and `code_map.py --impact src/tpl_py/modλ.py`. Each runs under PYTHONIOENCODING `utf-8`, `ascii` and `cp1252`, with stdout captured as raw bytes.

**Comparator, per command and per encoding e in {ascii, cp1252}:**
- The exit status equals the UTF-8 run's exit status.
- The stdout, decoded, equals the UTF-8 stdout with each character e lacks written as its Python escape. The ascii run decodes as UTF-8. The cp1252 run decodes with `new TextDecoder("windows-1252")`.
  - The escape is backslash-x plus 2 hex digits up to U+00FF, backslash-u plus 4 up to U+FFFF, else backslash-U plus 8, all lowercase.
  - "Lacks" means code point 0x80 or above for ascii. For cp1252 it means a character absent from the TextDecoder("windows-1252") decode of bytes 0x00 to 0xFF.
- A FAIL prints the encoding, both exits and the stderr tail.

| ID | Row | Test (packages/nana-pack/tests/templates-render.test.mjs::) | Red today |
|---|---|---|---|
| R-1440 | WHEN a scaffolded Python project's readme check runs in check or list mode with an output encoding that lacks a character it prints, the readme check shall print the output it prints under UTF-8 output, with each such character written as its Python backslash escape, and exit with the status it exits with under UTF-8 output. | `python: the readme check prints every line under ASCII and cp1252 output` | Probe (exact comparator): unequal in both modes and both encodings. Each run ends in a traceback. Check mode prints 1 of 2 problem lines; list mode prints 21 of 25 lines. |
| R-1441 | WHEN a scaffolded Python project's code map runs in check mode with an output encoding that lacks a character it prints, the code map shall print the output it prints under UTF-8 output, with each such character written as its Python backslash escape, and exit with the status it exits with under UTF-8 output. | `python: the code map check prints every line under ASCII and cp1252 output` | Probe: traceback, and 0 of 3 problem lines printed. Unequal under both encodings. |
| R-1442 | WHEN a scaffolded Python project's code map runs in impact mode with an output encoding that lacks a character it prints, the code map shall print the output it prints under UTF-8 output, with each such character written as its Python backslash escape, and exit with the status it exits with under UTF-8 output. | `python: the code map impact view prints every line under ASCII and cp1252 output` | Probe: traceback, nothing printed, and exit 1 against 0 under both encodings. |
| R-1443 | WHEN a scaffolded Python project's readme check or code map runs with UTF-8 output, it shall print each non-ASCII character of a path it reports unescaped. | `python: the readme check and code map print a non-ASCII path unescaped under UTF-8 output` | Green today; it guards the fix (all 4 UTF-8 stdouts contain λ). It turns red under the escape-everywhere wrong code. |

Green evidence (probe): the same comparator passes for all 4 commands × 2 encodings on a render with the guarded fix applied. R-1443 stays green there. The UTF-8 exits are 1, 1, 1 and 0. They are not pinned, because R-1443 already catches a UTF-8 run that crashes too.

Skips: none beyond the file's existing copier gate, which FAILs under NANA_TEST_REQUIRE_COPIER=1. If the extra render fails, the four checks print FAIL with the render log. They never vanish.

## Known limits
- Adopt mode copies the same script files and is not pinned. `code_map.py --write` is not pinned.
- Python's cp1252 lacks five bytes that WHATWG's windows-1252 decodes to C1 controls (0x81, 0x8D, 0x8F, 0x90, 0x9D). The reports never print them.
- Under Windows' default cp1252 pipe, pi's post-edit decodes as UTF-8. Characters cp1252 has but ASCII lacks (ï, —) show as U+FFFD there. That is a display flaw, not a crash, and is out of scope.
- The TS readme check claims only ASCII-spelled path tokens, while the Python one claims any. This divergence is a residual. The TS template does not crash: Node writes UTF-8 whatever the locale.
- Both scripts already exceed the template's 500-line cap (514 and 845 lines), and each gains 3 lines.
- The impact check passes a forward-slash path. A native-separator Python impact argument on Windows stays untested (win-impact-paths' limit). A plain Python impact run already passes on the Windows leg (CI log for 3bd044e).
- Python 3.15's default UTF-8 mode removes the default Windows case. An explicit or legacy encoding still hits it.

## Rows the builder adds as `planned` first (seat, 2026-10-19)

- **R-1440** — WHEN a scaffolded Python project's readme check runs in check or list mode with an output encoding that lacks a character it prints, the readme check shall print the output it prints under UTF-8 output, with each such character written as its Python backslash escape, and exit with the status it exits with under UTF-8 output.
- **R-1441** — WHEN a scaffolded Python project's code map runs in check mode with an output encoding that lacks a character it prints, the code map shall print the output it prints under UTF-8 output, with each such character written as its Python backslash escape, and exit with the status it exits with under UTF-8 output.
- **R-1442** — WHEN a scaffolded Python project's code map runs in impact mode with an output encoding that lacks a character it prints, the code map shall print the output it prints under UTF-8 output, with each such character written as its Python backslash escape, and exit with the status it exits with under UTF-8 output.
- **R-1443** — WHEN a scaffolded Python project's readme check or code map runs with UTF-8 output, it shall print each non-ASCII character of a path it reports unescaped.
