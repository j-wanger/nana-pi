"""@module datapack/run.py
@purpose Run every data-standards check for one manifest and print and write the findings
@inputs argv[1]: path to a project manifest JSON
@outputs a findings table and counts on stdout; findings-<project>.md beside this file
@effects disk (writes the findings markdown)
@errors exits 2 on a missing manifest; exits 1 when any finding has severity error

Run from inside the project with: uv run --no-sync python -B <this file> <manifest>
"""

from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

sys.dont_write_bytecode = True  # never leave __pycache__ in the probed project
sys.path.insert(0, str(Path(__file__).parent))
from checks import CHECKS, run_all  # noqa: E402


def main() -> int:
    if len(sys.argv) != 2 or not Path(sys.argv[1]).is_file():
        print("usage: run.py <manifest.json>", file=sys.stderr)
        return 2
    manifest = json.loads(Path(sys.argv[1]).read_text())
    for r in manifest.get("import_roots", []):
        sys.path.insert(0, str(Path(manifest["project_root"]) / r))
    findings = run_all(manifest)

    rows = [f"| {f['check']} | {f['severity']} | `{f['location']}` | {f['detail'].replace('|', '/')} |" for f in findings]
    counts = Counter((f["check"], f["severity"]) for f in findings)
    sevs = ["error", "warn", "excepted", "info", "ok"]
    summary = ["| check | " + " | ".join(sevs) + " | verdict |", "|---|" + "---|" * (len(sevs) + 1)]
    for name in CHECKS:
        c = [counts.get((name, s), 0) for s in sevs]
        verdict = "FAIL" if c[0] else ("WARN" if c[1] else "PASS")
        summary.append(f"| {name} | " + " | ".join(map(str, c)) + f" | {verdict} |")

    for f in findings:
        print(f"{f['check']:<20} {f['severity']:<8} {f['location'][:60]:<60} {f['detail'][:110]}")
    print()
    print("\n".join(summary))

    md = [f"# Data standards findings: {manifest['project']}", "", "## Counts", "", *summary, "",
          "## Findings", "", "| check | severity | location | detail |", "|---|---|---|---|", *rows, ""]
    out = Path(__file__).parent / f"findings-{manifest['project']}.md"
    out.write_text("\n".join(md))
    print(f"\nwrote {out}")
    return 1 if any(f["severity"] == "error" for f in findings) else 0


if __name__ == "__main__":
    raise SystemExit(main())
