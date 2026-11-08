"""@module scripts/data_checks.py
@purpose Run the generic data-standards checks against one project described by a manifest dict
@inputs settings for project root, databases, identifiers, keys, normalizer, connectors, lineage and budgets
@outputs a list of findings, each {check, severity, location, detail}
@effects disk (reads source files, report files and immutable SQLite databases), process (CLI exit status)
@errors a check that cannot run returns one 'error' finding naming why, never raises

Nothing in this file is project-specific: every name, path and budget comes from the manifest.
Severities: error (standard broken), warn (budgeted or advisory), ok (check ran clean), info (summary).
This file is the canonical implementation included by the optional Python template.
"""

from __future__ import annotations

import ast
import copy
import fnmatch
import hashlib
import json
import re
import sqlite3
import sys
from collections import defaultdict
from collections.abc import Callable
from pathlib import Path
from typing import Any

Finding = dict[str, str]


def _f(check: str, severity: str, location: str, detail: str) -> Finding:
    return {"check": check, "severity": severity, "location": location, "detail": detail}


# ── shared helpers ──────────────────────────────────────────────────────────


def _root(m: dict[str, Any]) -> Path:
    return Path(m["project_root"]).expanduser()


def _sources(m: dict[str, Any]) -> list[Path]:
    root = _root(m)
    out: list[Path] = []
    for pattern in m.get("source_globs", ["**/*.py"]):
        out.extend(p for p in root.glob(pattern) if "__pycache__" not in p.parts)
    return sorted(set(out))


def _rel(m: dict[str, Any], p: Path) -> str:
    return p.relative_to(_root(m)).as_posix()


def _parse(path: Path) -> ast.Module | None:
    try:
        return ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    except (SyntaxError, UnicodeDecodeError):
        return None


def _ro(path: Path) -> sqlite3.Connection:
    # immutable=1, not just mode=ro: a WAL-mode database opened mode=ro still creates
    # or updates its -wal/-shm sidecar files, which writes into the probed project.
    wal = Path(str(path) + "-wal")
    if wal.exists() and wal.stat().st_size:
        raise ValueError(
            f"WAL database {path.name}: immutable reads cannot include pending WAL; supply a checkpointed copy"
        )
    return sqlite3.connect(path.resolve().as_uri() + "?mode=ro&immutable=1", uri=True)


def _call_name(node: ast.AST) -> str:
    """Dotted name of a call target: requests.get, sqlite3.connect, hash."""
    if isinstance(node, ast.Call):
        node = node.func
    parts: list[str] = []
    while isinstance(node, ast.Attribute):
        parts.append(node.attr)
        node = node.value
    if isinstance(node, ast.Name):
        parts.append(node.id)
    return ".".join(reversed(parts))


def _module_matches(rel: str, patterns: list[str]) -> bool:
    return any(fnmatch.fnmatch(rel, p) for p in patterns)


def _quoted(name: str) -> str:
    """SQLite identifiers cannot be parameters; double embedded identifier quotes."""
    return '"' + name.replace('"', '""') + '"'


def _namespace_values(m: dict[str, Any], descriptor: Any) -> set[str] | None:
    if not isinstance(descriptor, dict) or "namespace" not in descriptor:
        return None
    spec = m["namespaces"][descriptor["namespace"]]
    db = next(d for d in m["databases"] if d["label"] == spec["db"])
    conn = _ro(_root(m) / db["path"])
    try:
        query = f"SELECT {_quoted(spec['column'])} FROM {_quoted(spec['table'])}"  # noqa: S608 - quoted identifiers
        return {str(row[0]) for row in conn.execute(query) if row[0] is not None}
    finally:
        conn.close()


def _identifier_column(conn: sqlite3.Connection, table: str, col: str, typ: str, want: str) -> list[str]:
    problems = []
    if typ.upper() != want:
        problems.append(f"declared {typ or 'untyped'}, settings say {want}")
    column, relation = _quoted(col), _quoted(table)
    # SQLite cannot bind identifiers, so both are quoted above.
    query = (
        f"SELECT typeof({column}), COUNT(*) FROM {relation} "  # noqa: S608 - quoted identifiers
        f"WHERE {column} IS NOT NULL GROUP BY 1"
    )
    storage = {"INTEGER": "integer", "TEXT": "text", "REAL": "real"}.get(want)
    bad = [(kind, n) for kind, n in conn.execute(query) if storage and kind != storage]
    if bad:
        problems.append(f"stored values of type {bad}, expected {storage}")
    return problems


# ── (a) identifier types ────────────────────────────────────────────────────


def check_identifier_types(m: dict[str, Any]) -> list[Finding]:
    """Each declared identifier has its one declared SQL type in every table, and stored values match it."""
    c = "identifier-types"
    out: list[Finding] = []
    declared: dict[str, str] = {
        k: (v["type"] if isinstance(v, dict) else v).upper() for k, v in m["identifiers"].items()
    }
    namespaces = {k: _namespace_values(m, v) for k, v in m["identifiers"].items()}
    seen = 0
    for db in m["databases"]:
        path = _root(m) / db["path"]
        conn = _ro(path)
        try:
            tables = [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")]
            for t in tables:
                for _cid, col, typ, *_ in conn.execute(f"PRAGMA table_info('{t}')"):
                    if col not in declared:
                        continue
                    values = namespaces[col]
                    if values is not None and not _in_namespace(m, conn, (db["label"], t, col), values):
                        continue
                    seen += 1
                    loc = f"{db['path']}:{t}.{col}"
                    out.extend(
                        _f(c, "error", loc, detail) for detail in _identifier_column(conn, t, col, typ, declared[col])
                    )
                    if values is not None:
                        query = f"SELECT {_quoted(col)} FROM {_quoted(t)}"  # noqa: S608 - quoted identifiers
                        missing = sum(
                            1 for row in conn.execute(query) if row[0] is not None and str(row[0]) not in values
                        )
                        if missing:
                            out.append(_f(c, "error", loc, f"{missing} values missing from namespace"))
        finally:
            conn.close()
    if not out:
        out.append(_f(c, "ok", "*", f"{seen} identifier columns, each matches its declared type"))
    return out


def _in_namespace(m: dict[str, Any], conn: sqlite3.Connection, site: tuple[str, str, str], values: set[str]) -> bool:
    db, table, col = site
    anchors = m.get("namespaces", {}).values()
    if any(s["db"] == db and s["table"] == table and s["column"] == col for s in anchors):
        return True
    query = f"SELECT {_quoted(col)} FROM {_quoted(table)}"  # noqa: S608 - quoted identifiers
    return any(str(row[0]) in values for row in conn.execute(query) if row[0] is not None)


# ── (b) declared keys hold in data ──────────────────────────────────────────


def check_keys(m: dict[str, Any]) -> list[Finding]:
    """Each declared key has zero duplicate rows; each crosswalk id column is unique where non-null."""
    c, out = "keys-hold", []
    checked = 0
    dbs = {d["label"]: _root(m) / d["path"] for d in m["databases"]}
    specs = [(k, False) for k in m.get("keys", [])] + [(k, True) for k in m.get("crosswalk_unique", [])]
    for spec, nonnull_only in specs:
        cols = spec["columns"]
        collist = ", ".join(_quoted(x) for x in cols)
        where = " AND ".join(f"{_quoted(x)} IS NOT NULL" for x in cols) if nonnull_only else "1"
        conn = _ro(dbs[spec["db"]])
        try:
            q = (
                f"SELECT {collist}, COUNT(*) FROM {_quoted(spec['table'])} "  # noqa: S608 - quoted identifiers
                f"WHERE {where} GROUP BY {collist} HAVING COUNT(*) > 1"
            )
            dups = conn.execute(q).fetchall()
        finally:
            conn.close()
        checked += 1
        loc = f"{spec['db']}:{spec['table']}({', '.join(cols)})"
        if dups:
            out.append(_f(c, "error", loc, f"{len(dups)} duplicated key values"))
    if not out:
        out.append(_f(c, "ok", "*", f"{checked} declared keys, zero duplicates"))
    return out


# ── (c) one normalizer per kind ─────────────────────────────────────────────


def check_normalizers(m: dict[str, Any]) -> list[Finding]:
    """Locate additional normalizers without importing or evaluating any project code.

    Sample equivalence cannot safely be inferred by executing arbitrary Python. An
    additional definition is an explicit error, not a guessed clean sample verdict.
    """
    c, out = "one-normalizer", []
    cfg = m["normalizer"]
    if not cfg:
        return []
    canon_rel, canon_fn = cfg["canonical"].split(":")
    canonical = _parse(_root(m) / canon_rel)
    if canonical is None or not any(isinstance(n, ast.FunctionDef) and n.name == canon_fn for n in canonical.body):
        return [_f(c, "error", cfg["canonical"], "cannot inspect the declared normalizer")]
    # A top-level call can initialise files outside the database directory. Do not run it.
    initialisers = [
        n for n in canonical.body if not isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef))
    ]
    if any(isinstance(n, ast.Call) for stmt in initialisers for n in ast.walk(stmt)):
        out.append(
            _f(c, "error", cfg["canonical"], "cannot run sample check safely: module initialises code; not executed")
        )
    name_re = re.compile(cfg.get("function_name_pattern", "norm"), re.I)
    arg_re = re.compile(cfg.get("arg_name_pattern", "name"), re.I)
    for p in _sources(m):
        tree = _parse(p)
        if tree is None:
            continue
        for node in ast.walk(tree):
            if not isinstance(node, ast.FunctionDef) or not name_re.search(node.name):
                continue
            args = node.args.args
            if len(args) != 1 or not arg_re.search(args[0].arg):
                continue
            if (_rel(m, p), node.name) != (canon_rel, canon_fn):
                out.append(
                    _f(
                        c,
                        "error",
                        f"{_rel(m, p)}:{node.lineno}",
                        "second normalizer; cannot establish sample equivalence safely; project code not executed",
                    )
                )
    return out


# ── (d) connectors ──────────────────────────────────────────────────────────


def _connect_is_readonly(call: ast.Call, assigns: dict[str, str]) -> bool:
    """True when the first argument (or the local it names) carries mode=ro or immutable=1."""
    if not call.args:
        return False
    arg = call.args[0]
    text = assigns.get(arg.id, "") if isinstance(arg, ast.Name) else ast.unparse(arg)
    return "mode=ro" in text or "immutable=1" in text


def _local_assigns(tree: ast.Module) -> dict[int, dict[str, str]]:
    """Per call line: simple `name = expr` assignments in the enclosing function, unparsed."""
    by_line: dict[int, dict[str, str]] = {}
    for fn in ast.walk(tree):
        if not isinstance(fn, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        local = {
            t.id: ast.unparse(n.value)
            for n in ast.walk(fn)
            if isinstance(n, ast.Assign)
            for t in n.targets
            if isinstance(t, ast.Name)
        }
        for n in ast.walk(fn):
            if isinstance(n, ast.Call):
                by_line.setdefault(n.lineno, local)
    return by_line


def _network_names(node: ast.AST) -> list[str]:
    if isinstance(node, ast.Import):
        return [a.name for a in node.names]
    if isinstance(node, ast.ImportFrom) and node.module:
        return [node.module]
    if isinstance(node, ast.Call):
        return [_call_name(node)]
    return []


def check_connectors(m: dict[str, Any]) -> list[Finding]:
    """Network calls only in the allowed connector modules; sqlite3.connect only in the db modules."""
    c, out = "connectors", []
    cfg = m["connectors"]
    net_re = [re.compile(x) for x in cfg["network_patterns"]]
    net_bad = 0
    for p in _sources(m):
        rel = _rel(m, p)
        tree = _parse(p)
        if tree is None:
            continue
        assigns = _local_assigns(tree)
        for node in ast.walk(tree):
            for n in _network_names(node):
                if any(r.search(n) for r in net_re) and not _module_matches(rel, cfg["network_modules"]):
                    net_bad += 1
                    out.append(
                        _f(
                            c,
                            "error",
                            f"{rel}:{getattr(node, 'lineno', 0)}",
                            f"network surface {n!r} outside the connector modules",
                        )
                    )
            if (
                isinstance(node, ast.Call)
                and _call_name(node) == "sqlite3.connect"
                and not _module_matches(rel, cfg["db_modules"])
            ):
                ro = _connect_is_readonly(node, assigns.get(node.lineno, {}))
                sev = "warn" if ro else "error"
                mode = "read-only" if ro else "writable"
                out.append(_f(c, sev, f"{rel}:{node.lineno}", f"{mode} sqlite3.connect outside the db modules"))
    if not net_bad:
        out.append(
            _f(c, "ok", "network", f"every network surface is inside {len(cfg['network_modules'])} connector modules")
        )
    if len(out) == (0 if net_bad else 1):
        out.append(_f(c, "ok", "database", "every sqlite3.connect is inside the db modules"))
    return out


# ── (e) stable persisted ids ────────────────────────────────────────────────


def _value_target(parent: ast.AST, child: ast.AST) -> str:
    if isinstance(parent, ast.Dict):
        return next(
            (
                str(k.value)
                for k, v in zip(parent.keys, parent.values, strict=True)
                if v is child and isinstance(k, ast.Constant)
            ),
            "",
        )
    if isinstance(parent, ast.Assign):
        return " ".join(ast.unparse(t) for t in parent.targets)
    if isinstance(parent, ast.AnnAssign):
        return ast.unparse(parent.target)
    if isinstance(parent, ast.keyword) and parent.arg:
        return parent.arg
    return ""


def _hash_target(node: ast.AST, parents: dict[ast.AST, ast.AST]) -> str:
    current = node
    while current in parents:
        parent = parents[current]
        target = _value_target(parent, current)
        if target:
            return target
        if isinstance(parent, (ast.FunctionDef, ast.Module)):
            break
        current = parent
    return ""


def check_stable_ids(m: dict[str, Any]) -> list[Finding]:
    """No builtin hash() feeding an id: it is salted per process (PYTHONHASHSEED), so ids drift across runs."""
    c, out = "stable-ids", []
    id_re = re.compile(m.get("id_name_pattern", r"(^|_)id$"), re.I)
    for p in _sources(m):
        tree = _parse(p)
        if tree is None:
            continue
        parents: dict[ast.AST, ast.AST] = {}
        for node in ast.walk(tree):
            for ch in ast.iter_child_nodes(node):
                parents[ch] = node
        for node in ast.walk(tree):
            if not (isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "hash"):
                continue
            target = _hash_target(node, parents)
            loc = f"{_rel(m, p)}:{node.lineno}"
            if target and id_re.search(target.split(".")[-1].strip("'\"]")):
                out.append(_f(c, "error", loc, f"builtin hash() feeds {target!r}: value changes every process"))
            else:
                out.append(
                    _f(c, "warn", loc, f"builtin hash() call (target {target or 'unnamed'}); not persisted-id shaped")
                )
    if not out:
        out.append(_f(c, "ok", "*", "no builtin hash() calls"))
    return out


# ── (f) lineage ─────────────────────────────────────────────────────────────


def _json_provenance(path: Path, key: str) -> dict[str, Any] | None:
    text = path.read_text(encoding="utf-8")
    try:
        doc = json.loads(text) if path.suffix == ".json" else json.loads(text.splitlines()[0])
    except (json.JSONDecodeError, IndexError):
        return None
    if isinstance(doc, dict) and isinstance(doc.get(key), dict):
        return dict(doc[key])
    return None


def check_lineage(m: dict[str, Any]) -> list[Finding]:
    """Every output under the report dirs carries a provenance block with the required fields."""
    c, out = "lineage", []
    cfg = m["lineage"]
    key, required = cfg["provenance_key"], cfg["required_fields"]
    exts = set(cfg["extensions"])
    total = good = 0
    for d in cfg["report_dirs"]:
        for p in sorted((_root(m) / d).rglob("*")):
            if not p.is_file() or p.suffix not in exts:
                continue
            if _module_matches(_rel(m, p), cfg.get("exclude_globs", [])):
                continue  # hand-written documents, not generated outputs
            total += 1
            loc = _rel(m, p)
            if p.suffix in (".json", ".jsonl"):
                prov = _json_provenance(p, key)
                missing = required if prov is None else [r for r in required if r not in prov]
            else:
                text = p.read_text(encoding="utf-8", errors="replace")
                marker = re.search(cfg.get("markdown_marker", r"<!-- provenance: (\{[^\n]*\}) -->"), text)
                try:
                    prov = json.loads(marker.group(1)) if marker else None
                except json.JSONDecodeError:
                    prov = None
                missing = required if not isinstance(prov, dict) else [r for r in required if r not in prov]
            if missing:
                whole = missing in (required, [key])
                out.append(_f(c, "error", loc, f"no {key!r} block" if whole else f"{key} lacks {missing}"))
            else:
                good += 1
    out.append(_f(c, "ok" if good == total else "info", "*", f"{good}/{total} outputs carry {key} with {required}"))
    return out


# ── (g) reusable processing ─────────────────────────────────────────────────


class _Anon(ast.NodeTransformer):
    """Erase local names, annotations and docstrings so copies of one body hash alike."""

    def __init__(self, function: ast.FunctionDef) -> None:
        self.locals = {n.id for n in ast.walk(function) if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Store)}
        self.locals.update(n.arg for n in ast.walk(function) if isinstance(n, ast.arg))

    def visit_Name(self, node: ast.Name) -> ast.AST:
        return ast.copy_location(ast.Name(id="_" if node.id in self.locals else node.id, ctx=node.ctx), node)

    def visit_arg(self, node: ast.arg) -> ast.AST:
        return ast.copy_location(ast.arg(arg="_", annotation=None), node)

    def visit_FunctionDef(self, node: ast.FunctionDef) -> ast.AST:
        node.name, node.returns, node.decorator_list = "_", None, []
        body = node.body
        if (
            body
            and isinstance(body[0], ast.Expr)
            and isinstance(body[0].value, ast.Constant)
            and isinstance(body[0].value.value, str)
        ):
            node.body = body[1:] or [ast.Pass()]
        self.generic_visit(node)
        return node

    def visit_AnnAssign(self, node: ast.AnnAssign) -> ast.AST:
        new = ast.Assign(targets=[node.target], value=node.value or ast.Constant(None))
        return self.generic_visit(ast.copy_location(new, node))


def check_duplicate_bodies(m: dict[str, Any]) -> list[Finding]:
    """Near-identical function bodies across modules: one helper copied instead of imported."""
    c, out = "reusable-processing", []
    min_nodes = m.get("duplicates", {}).get("min_ast_nodes", 40)
    groups: dict[str, list[str]] = defaultdict(list)
    for p in _sources(m):
        tree = _parse(p)
        if tree is None:
            continue
        for node in ast.walk(tree):
            if not isinstance(node, ast.FunctionDef):
                continue
            if sum(1 for _ in ast.walk(node)) < min_nodes:
                continue
            anon = _Anon(node).visit(copy.deepcopy(node))
            digest = hashlib.sha256(ast.dump(anon, include_attributes=False).encode()).hexdigest()
            site = f"{_rel(m, p)}:{node.lineno} {node.name}"
            groups[digest].append(site)
    # Literal differences can select entirely different SQL measures; shape alone is not a copy.
    for sites in sorted(groups.values(), key=len, reverse=True):
        modules = {s.split(":")[0] for s in sites}
        if len(modules) >= 2:
            names = sorted({s.split(" ")[1] for s in sites})
            kind = "copies"
            out.append(
                _f(
                    c,
                    "error",
                    sites[0],
                    f"{len(sites)} {kind} across {len(modules)} modules of {names}: " + ", ".join(sites[1:]),
                )
            )
    if not out:
        out.append(_f(c, "ok", "*", "no function body is copied across modules"))
    return out


# ── (h) row-wise operations ─────────────────────────────────────────────────

_QUERY_CALLS = ("execute", "fetchall", "fetchone", "fetchmany")


def _walk_shallow(stmts: list[ast.stmt]) -> list[ast.AST]:
    """Nodes under stmts, not descending into nested loops (so each site is counted at its innermost loop)."""
    out: list[ast.AST] = []
    stack: list[ast.AST] = list(stmts)
    while stack:
        n = stack.pop()
        out.append(n)
        if not isinstance(n, (ast.For, ast.AsyncFor)):
            stack.extend(ast.iter_child_nodes(n))
    return out


def _is_query_iter(node: ast.AST) -> bool:
    return isinstance(node, ast.Call) and _call_name(node).split(".")[-1] in _QUERY_CALLS


def check_rowwise(m: dict[str, Any]) -> list[Finding]:
    """Warn on execute-per-row loops and nested loops over query results, against a manifest budget."""
    c, out = "row-wise-ops", []
    budget = m.get("rowwise", {}).get("budget", 0)
    top = m.get("rowwise", {}).get("top_sites", 5)
    many = 0
    per_file: dict[str, list[str]] = defaultdict(list)
    for p in _sources(m):
        tree = _parse(p)
        if tree is None:
            continue
        rel = _rel(m, p)
        for node in ast.walk(tree):
            if isinstance(node, ast.Call) and _call_name(node).endswith("executemany"):
                many += 1
            if not isinstance(node, (ast.For, ast.AsyncFor)):
                continue
            inner = [n for stmt in node.body for n in ast.walk(stmt)]
            shallow = _walk_shallow(node.body)
            if any(isinstance(n, ast.Call) and _call_name(n).split(".")[-1] == "execute" for n in shallow):
                per_file[rel].append(f"{node.lineno} execute-in-loop")
            if _is_query_iter(node.iter) and any(isinstance(n, (ast.For, ast.comprehension)) for n in inner):
                per_file[rel].append(f"{node.lineno} nested-loop-over-query")
    total = sum(len(v) for v in per_file.values())
    for rel, sites in sorted(per_file.items(), key=lambda kv: -len(kv[1]))[:top]:
        out.append(_f(c, "warn", rel, f"{len(sites)} row-wise sites: " + ", ".join(sites[:4])))
    sev = "warn" if total > budget else "ok"
    out.append(
        _f(c, sev, "*", f"{total} row-wise sites in {len(per_file)} files (budget {budget}); executemany calls: {many}")
    )
    return out


# ── runner ──────────────────────────────────────────────────────────────────

CHECKS: dict[str, Callable[[dict[str, Any]], list[Finding]]] = {
    "identifier-types": check_identifier_types,
    "keys-hold": check_keys,
    "one-normalizer": check_normalizers,
    "connectors": check_connectors,
    "stable-ids": check_stable_ids,
    "lineage": check_lineage,
    "reusable-processing": check_duplicate_bodies,
    "row-wise-ops": check_rowwise,
}


def run_all(m: dict[str, Any]) -> list[Finding]:
    findings: list[Finding] = []
    for name, fn in CHECKS.items():
        try:
            findings.extend(fn(m))
        except Exception as e:
            findings.append(_f(name, "error", "*", f"check crashed: {e!r}"))
    return findings


def format_findings(findings: list[Finding]) -> str:
    """Render a table without writing a report into the inspected project."""
    rows = ["| check | severity | location | detail |", "|---|---|---|---|"]
    rows.extend(
        "| "
        + " | ".join(f[k].replace("|", "/").replace("\n", " ") for k in ("check", "severity", "location", "detail"))
        + " |"
        for f in findings
    )
    return "\n".join(rows)


def load_settings(path: Path) -> dict[str, Any]:
    """Resolve a manifest root relative to its settings file, never the caller's cwd."""
    manifest: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
    manifest["project_root"] = str((path.parent / manifest.get("project_root", ".")).resolve())
    return manifest


def main(argv: list[str]) -> int:
    """Run from any cwd; a settings error returns a usage failure."""
    if len(argv) != 1:
        print("usage: data_checks.py <data-checks.json>", file=sys.stderr)
        return 2
    try:
        findings = run_all(load_settings(Path(argv[0]).resolve()))
    except (OSError, ValueError, TypeError) as err:
        print(f"data checks settings error: {err}", file=sys.stderr)
        return 2
    print(format_findings(findings))
    return int(any(f["severity"] == "error" for f in findings))


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
