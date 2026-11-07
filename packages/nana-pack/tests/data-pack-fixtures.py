"""@module packages/nana-pack/tests/data-pack-fixtures.py
@purpose Exercise data-pack contracts on isolated fixture roots for the eight must-meets
@inputs checkout path, temporary root and case name
@outputs assertion failures or successful process exit
@effects disk (temporary fixtures), process (bounded pytest and entry-point children)
@errors AssertionError on contract failure
"""
from __future__ import annotations

import copy
import hashlib
import json
import runpy
import sqlite3
import subprocess
import sys
from pathlib import Path

repo, temp, case = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3]
source = Path(sys.argv[4]) if len(sys.argv) > 4 else repo / "docs/plan/data-pack-template/seed-checks.py"
api = runpy.run_path(str(source))
root = temp / case
root.mkdir()


def put(name: str, text: str) -> None:
    p = root / name
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")


def snapshot() -> dict[str, str]:
    return {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob("*") if p.is_file()}


m = {
    "project_root": str(root), "source_globs": ["src/*.py"],
    "databases": [{"label": "db", "path": "fixture.sqlite"}],
    "identifiers": {"item_id": "INTEGER"},
    "keys": [{"db": "db", "table": "items", "columns": ["item_id"]}],
    "crosswalk_unique": [],
    "normalizer": {"canonical": "src/norm.py:norm_name", "samples": ["Example Jr.", "O'Example", "Éxample"]},
    "connectors": {"network_patterns": ["^requests(\\.|$)"], "network_modules": ["src/net.py"], "db_modules": ["src/db.py"]},
    "lineage": {"report_dirs": ["reports"], "extensions": [".json", ".jsonl", ".md"], "provenance_key": "provenance", "required_fields": ["input_db"], "markdown_marker": "<!-- provenance: (\\{[^\\n]*\\}) -->"},
    "duplicates": {"min_ast_nodes": 15, "near_copy_literal_similarity": 0.8},
    "rowwise": {"budget": 0, "top_sites": 5},
}
put("src/norm.py", "def norm_name(name):\n    return name.lower()\n")
conn = sqlite3.connect(root / "fixture.sqlite")
conn.executescript("CREATE TABLE items(item_id INTEGER); INSERT INTO items VALUES (1);")
conn.close()


def findings(check: str, settings: dict | None = None) -> list[dict]:
    return [f for f in api["run_all"](settings or m) if f["check"] == check and f["severity"] in ("error", "warn")]


def child(args: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, "-B", *args], cwd=root, text=True, capture_output=True, timeout=45, check=False)


if case == "contracts":
    assert len(api["CHECKS"]) == 8
    for check in api["CHECKS"]:
        assert not findings(check), (check, findings(check))
    defects = {
        "connectors": ("src/outside.py", "import requests\nrequests.get('https://example.invalid')\n", "error"),
        "stable-ids": ("src/outside.py", "item_id = hash('example')\n", "error"),
        "one-normalizer": ("src/outside.py", "def normalize_name(name):\n    return name.upper()\n", "error"),
        "lineage": ("reports/output.json", "{}", "error"),
        "row-wise-ops": ("src/outside.py", "for row in rows:\n    conn.execute('SELECT 1')\n", "warn"),
    }
    for check, (file, text, severity) in defects.items():
        put(file, text)
        assert any(f["severity"] == severity for f in findings(check)), (check, findings(check))
        (root / file).unlink()
    conn = sqlite3.connect(root / "fixture.sqlite")
    conn.execute("INSERT INTO items VALUES (1)")
    conn.commit()
    assert findings("keys-hold")[0]["severity"] == "error"
    conn.execute("CREATE TABLE extra(item_id TEXT)")
    conn.commit()
    assert findings("identifier-types")[0]["severity"] == "error"
    conn.close()
    body = "def process(rows):\n    result = []\n    for row in rows:\n        result.append(row.strip().lower())\n    return result\n"
    put("src/copy_a.py", body)
    put("src/copy_b.py", body)
    assert findings("reusable-processing")[0]["severity"] == "error"
    # Read-only local URI assignment is advisory, not a writable connector error.
    put("src/reader.py", "import sqlite3\ndef read():\n    uri = 'file:example?mode=ro'\n    return sqlite3.connect(uri, uri=True)\n")
    assert [f["severity"] for f in findings("connectors")] == ["warn"]
    forbidden = ("basket" + "ball", "geek")
    assert not any(word in source.read_text().lower() for word in forbidden)
elif case == "readonly":
    put("src/norm.py", "from pathlib import Path\nPath('outside-db.txt').write_text('side effect')\ndef norm_name(name):\n    return name.lower()\n")
    put("data-checks.json", json.dumps(m))
    before = snapshot()
    r = child([str(source), str(root / "data-checks.json")])
    assert r.returncode == 1, r.stdout + r.stderr
    assert "one-normalizer" in r.stdout and "error" in r.stdout, r.stdout
    assert snapshot() == before
elif case == "pytest":
    entry = repo / "templates/python/template/tests/{% if data_checks %}test_data_checks.py{% endif %}"
    put("tests/test_data_checks.py", entry.read_text())
    put("scripts/data_checks.py", source.read_text())
    put("pytest.ini", "[pytest]\npythonpath = scripts\n")
    skip = child(["-m", "pytest", "-rs", "tests/test_data_checks.py"])
    assert skip.returncode == 0 and "1 skipped" in skip.stdout and "data-checks.json" in skip.stdout
    put("data-checks.json", json.dumps(m))
    put("src/outside.py", "for row in rows:\n    conn.execute('SELECT 1')\n")
    warn = child(["-m", "pytest", "-s", "tests/test_data_checks.py"])
    assert warn.returncode == 0 and "warn" in warn.stdout and "1 passed" in warn.stdout, warn.stdout + warn.stderr
    put("src/outside.py", "item_id = hash('example')\n")
    err = child(["-m", "pytest", "-s", "tests/test_data_checks.py"])
    assert err.returncode == 1 and "stable-ids" in err.stdout and "error" in err.stdout, err.stdout + err.stderr
elif case == "real-patterns":
    # These patterns come from the supplied manifest and the real project scan.
    # Different namespaces can legitimately use the same column name and SQL type.
    scoped = copy.deepcopy(m)
    scoped["identifiers"] = {"item_id": {"type": "INTEGER", "namespace": "items"}}
    scoped["namespaces"] = {"items": {"db": "db", "table": "items", "column": "item_id"}}
    conn = sqlite3.connect(root / "fixture.sqlite")
    conn.executescript("CREATE TABLE other_domain(item_id TEXT); INSERT INTO other_domain VALUES ('external');")
    conn.close()
    assert not findings("identifier-types", scoped), findings("identifier-types", scoped)
    # A prose mention is not provenance; a structured marker is, even with Windows text endings.
    for suffix in ["\r\n", " \t\r\n", ""]:
        put("reports/out.md", '<!-- provenance: {"input_db": "fixture.sqlite"} -->' + suffix)
        put("reports/out.jsonl", '{"provenance": {"input_db": "fixture.sqlite"}}' + suffix)
        assert not findings("lineage"), findings("lineage")
    put("reports/out.md", "provenance input_db is discussed here\n")
    assert findings("lineage"), "prose must not satisfy a provenance block"
    # Report reviews are human-authored, not generated outputs (manifest's explicit report scope).
    (root / "reports/out.md").unlink()
    scoped["lineage"]["exclude_globs"] = ["reports/review-*.md"]
    put("reports/review-analysis.md", "Human-written review, not a generated report.")
    assert not findings("lineage", scoped)
    # Identically shaped metric helpers with different meaningful literals are not exact copies.
    a = "def read_metric(conn):\n    rows = conn.execute('SELECT metric_alpha FROM observations').fetchall()\n    result = []\n    for row in rows:\n        result.append(row[0])\n    return result\n"
    put("src/a.py", a)
    put("src/b.py", a.replace("metric_alpha", "metric_beta"))
    assert not findings("reusable-processing"), findings("reusable-processing")
    body = "def process(rows):\n    result = []\n    for row in rows:\n        result.append(normalize_alpha(row))\n    return result\n"
    put("src/c.py", body)
    put("src/d.py", body.replace("normalize_alpha", "normalize_beta"))
    assert not findings("reusable-processing"), findings("reusable-processing")
    # Namespace membership does not misclassify a source id that happens to be computed.
    put("src/id.py", "item_id = hash('example')\n")
    assert findings("stable-ids")[0]["severity"] == "error"
    conn = sqlite3.connect(root / "fixture.sqlite")
    conn.executescript("CREATE TABLE crosswalk(external_id TEXT); INSERT INTO crosswalk VALUES ('a'), ('a'), (NULL), (NULL);")
    conn.close()
    scoped["crosswalk_unique"] = [{"db": "db", "table": "crosswalk", "columns": ["external_id"]}]
    assert len(findings("keys-hold", scoped)) == 1
elif case == "wal":
    conn = sqlite3.connect(root / "fixture.sqlite")
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA wal_autocheckpoint=0")
    conn.execute("INSERT INTO items VALUES (1)")
    conn.commit()
    before = snapshot()
    result = findings("keys-hold")
    assert result and result[0]["severity"] == "error", result
    assert "WAL" in result[0]["detail"] and "fixture.sqlite" in result[0]["detail"], result
    assert snapshot() == before
    conn.close()
else:
    raise AssertionError(case)
