"""@module datapack/checks.py
@purpose Run the generic data-standards checks against one project described by a manifest dict
@inputs a manifest dict (project root, databases, identifiers, keys, normalizer, connectors, lineage, budgets, exceptions)
@outputs a list of findings, each {check, severity, location, detail}
@effects disk (reads source files, report files and SQLite databases read-only); process (imports the project's normalizer modules)
@errors a check that cannot run returns one 'error' finding naming why, never raises

Nothing in this file is project-specific: every name, path and budget comes from the manifest.
Severities: error (standard broken), warn (budgeted or advisory), ok (check ran clean),
excepted (finding matched a manifest exception; reason in detail).
"""

from __future__ import annotations

import ast
import copy
import difflib
import fnmatch
import hashlib
import importlib
import importlib.util
import json
import re
import sqlite3
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any, Callable

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
    return str(p.relative_to(_root(m)))


def _parse(path: Path) -> ast.Module | None:
    try:
        return ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    except (SyntaxError, UnicodeDecodeError):
        return None


def _ro(path: Path) -> sqlite3.Connection:
    # immutable=1, not just mode=ro: a WAL-mode database opened mode=ro still creates
    # or updates its -wal/-shm sidecar files, which writes into the probed project.
    return sqlite3.connect(f"file:{path}?mode=ro&immutable=1", uri=True)


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


# ── (a) identifier types ────────────────────────────────────────────────────


def check_identifier_types(m: dict[str, Any]) -> list[Finding]:
    """Each declared identifier has its one declared SQL type in every table, and stored values match it."""
    c, out = "identifier-types", []
    declared: dict[str, str] = {k: v.upper() for k, v in m["identifiers"].items()}
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
                    seen += 1
                    loc = f"{db['path']}:{t}.{col}"
                    if typ.upper() != declared[col]:
                        out.append(_f(c, "error", loc, f"declared {typ or 'untyped'}, manifest says {declared[col]}"))
                    stored = conn.execute(
                        f'SELECT typeof("{col}"), COUNT(*) FROM "{t}" WHERE "{col}" IS NOT NULL GROUP BY 1'
                    ).fetchall()
                    want = {"INTEGER": "integer", "TEXT": "text", "REAL": "real"}.get(declared[col])
                    bad = [(k, n) for k, n in stored if want and k != want]
                    if bad:
                        out.append(_f(c, "error", loc, f"stored values of type {bad}, expected {want}"))
        finally:
            conn.close()
    if not out:
        out.append(_f(c, "ok", "*", f"{seen} identifier columns, each matches its declared type"))
    return out


# ── (b) declared keys hold in data ──────────────────────────────────────────


def check_keys(m: dict[str, Any]) -> list[Finding]:
    """Each declared key has zero duplicate rows; each crosswalk id column is unique where non-null."""
    c, out = "keys-hold", []
    checked = 0
    dbs = {d["label"]: _root(m) / d["path"] for d in m["databases"]}
    specs = [(k, False) for k in m.get("keys", [])] + [(k, True) for k in m.get("crosswalk_unique", [])]
    for spec, nonnull_only in specs:
        cols = spec["columns"]
        collist = ", ".join(f'"{x}"' for x in cols)
        where = " AND ".join(f'"{x}" IS NOT NULL' for x in cols) if nonnull_only else "1"
        conn = _ro(dbs[spec["db"]])
        try:
            q = f'SELECT {collist}, COUNT(*) FROM "{spec["table"]}" WHERE {where} GROUP BY {collist} HAVING COUNT(*) > 1'
            dups = conn.execute(q).fetchall()
        finally:
            conn.close()
        checked += 1
        loc = f"{spec['db']}:{spec['table']}({', '.join(cols)})"
        if dups:
            sample = ", ".join(str(d) for d in dups[:3])
            out.append(_f(c, "error", loc, f"{len(dups)} duplicated key values, e.g. {sample}"))
    if not out:
        out.append(_f(c, "ok", "*", f"{checked} declared keys, zero duplicates"))
    return out


# ── (c) one normalizer per kind ─────────────────────────────────────────────


def _load_callable(m: dict[str, Any], rel: str, func: str) -> Callable[[str], Any]:
    root = _root(m)
    for import_root in m.get("import_roots", []):
        prefix = import_root.rstrip("/") + "/"
        if rel.startswith(prefix):
            modname = rel[len(prefix) : -3].replace("/", ".")
            return getattr(importlib.import_module(modname), func)
    path = root / rel
    sys.path.insert(0, str(path.parent))
    name = "_datapack_" + re.sub(r"\W", "_", rel)
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return getattr(mod, func)


def check_normalizers(m: dict[str, Any]) -> list[Finding]:
    """No name normalizer outside the declared one; every found one agrees with it on the sample names."""
    c, out = "one-normalizer", []
    cfg = m["normalizer"]
    canon_rel, canon_fn = cfg["canonical"].split(":")
    name_re = re.compile(cfg.get("function_name_pattern", "norm"), re.I)
    arg_re = re.compile(cfg.get("arg_name_pattern", "name"), re.I)
    found: list[tuple[str, str, int]] = []
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
            found.append((_rel(m, p), node.name, node.lineno))
    try:
        canon = _load_callable(m, canon_rel, canon_fn)
    except Exception as e:  # noqa: BLE001 - report, never crash the run
        return [_f(c, "error", cfg["canonical"], f"cannot import the declared normalizer: {e!r}")]
    samples = cfg["samples"]
    want = {s: canon(s) for s in samples}
    for rel, fn, line in found:
        if (rel, fn) == (canon_rel, canon_fn):
            continue
        loc = f"{rel}:{line} {fn}"
        try:
            impl = _load_callable(m, rel, fn)
            got = {s: impl(s) for s in samples}
        except Exception as e:  # noqa: BLE001
            out.append(_f(c, "error", loc, f"second normalizer; could not run it: {e!r}"))
            continue
        diff = [f"{s!r}: {got[s]!r} vs {want[s]!r}" for s in samples if got[s] != want[s]]
        if diff:
            out.append(_f(c, "error", loc, f"second normalizer disagrees on {len(diff)}/{len(samples)}: " + "; ".join(diff[:3])))
        else:
            out.append(_f(c, "warn", loc, f"second normalizer; agrees with {canon_fn} on all {len(samples)} samples"))
    if not out:
        out.append(_f(c, "ok", cfg["canonical"], "only the declared normalizer exists"))
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
        local = {t.id: ast.unparse(n.value) for n in ast.walk(fn) if isinstance(n, ast.Assign) for t in n.targets if isinstance(t, ast.Name)}
        for n in ast.walk(fn):
            if isinstance(n, ast.Call):
                by_line.setdefault(n.lineno, local)
    return by_line


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
            names: list[str] = []
            if isinstance(node, ast.Import):
                names = [a.name for a in node.names]
            elif isinstance(node, ast.ImportFrom) and node.module:
                names = [node.module]
            elif isinstance(node, ast.Call):
                names = [_call_name(node)]
            for n in names:
                if any(r.search(n) for r in net_re) and not _module_matches(rel, cfg["network_modules"]):
                    net_bad += 1
                    out.append(_f(c, "error", f"{rel}:{node.lineno}", f"network surface {n!r} outside the connector modules"))
            if isinstance(node, ast.Call) and _call_name(node) == "sqlite3.connect":
                if not _module_matches(rel, cfg["db_modules"]):
                    ro = _connect_is_readonly(node, assigns.get(node.lineno, {}))
                    sev = "warn" if ro else "error"
                    mode = "read-only" if ro else "writable"
                    out.append(_f(c, sev, f"{rel}:{node.lineno}", f"{mode} sqlite3.connect outside the db modules"))
    if not net_bad:
        out.append(_f(c, "ok", "network", f"every network surface is inside {len(cfg['network_modules'])} connector modules"))
    if len(out) == (0 if net_bad else 1):
        out.append(_f(c, "ok", "database", "every sqlite3.connect is inside the db modules"))
    return out


# ── (e) stable persisted ids ────────────────────────────────────────────────


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
            # walk up to the nearest dict key, assignment target or keyword naming the value
            target, cur = "", node
            while cur in parents and not target:
                par = parents[cur]
                if isinstance(par, ast.Dict):
                    for k, v in zip(par.keys, par.values):
                        if v is cur and isinstance(k, ast.Constant):
                            target = str(k.value)
                elif isinstance(par, ast.Assign):
                    target = " ".join(ast.unparse(t) for t in par.targets)
                elif isinstance(par, ast.keyword) and par.arg:
                    target = par.arg
                elif isinstance(par, (ast.FunctionDef, ast.Module)):
                    break
                cur = par
            loc = f"{_rel(m, p)}:{node.lineno}"
            if target and id_re.search(target.split(".")[-1].strip("'\"]")):
                out.append(_f(c, "error", loc, f"builtin hash() feeds {target!r}: value changes every process"))
            else:
                out.append(_f(c, "warn", loc, f"builtin hash() call (target {target or 'unnamed'}); not persisted-id shaped"))
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
        return doc[key]
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
            else:  # text outputs: a fenced or front-matter block that names the key and the fields
                text = p.read_text(encoding="utf-8", errors="replace")
                missing = [key] if key not in text else [r for r in required if r not in text]
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

    def visit_Name(self, node: ast.Name) -> ast.AST:
        return ast.copy_location(ast.Name(id="_", ctx=node.ctx), node)

    def visit_arg(self, node: ast.arg) -> ast.AST:
        return ast.copy_location(ast.arg(arg="_", annotation=None), node)

    def visit_FunctionDef(self, node: ast.FunctionDef) -> ast.AST:
        node.name, node.returns, node.decorator_list = "_", None, []
        body = node.body
        if body and isinstance(body[0], ast.Expr) and isinstance(body[0].value, ast.Constant) and isinstance(body[0].value.value, str):
            node.body = body[1:] or [ast.Pass()]
        self.generic_visit(node)
        return node

    def visit_AnnAssign(self, node: ast.AnnAssign) -> ast.AST:
        new = ast.Assign(targets=[node.target], value=node.value or ast.Constant(None))
        return self.generic_visit(ast.copy_location(new, node))


class _AnonLoose(_Anon):
    """Also erase literals, so copies that differ only in a constant (a measure name, a cap) hash alike."""

    def visit_Constant(self, node: ast.Constant) -> ast.AST:
        return ast.copy_location(ast.Constant(value=None), node)


def check_duplicate_bodies(m: dict[str, Any]) -> list[Finding]:
    """Near-identical function bodies across modules: one helper copied instead of imported."""
    c, out = "reusable-processing", []
    min_nodes = m.get("duplicates", {}).get("min_ast_nodes", 40)
    groups: dict[str, list[str]] = defaultdict(list)
    loose: dict[str, list[str]] = defaultdict(list)
    literals: dict[str, list[str]] = {}
    similarity = m.get("duplicates", {}).get("near_copy_literal_similarity", 0.8)
    for p in _sources(m):
        tree = _parse(p)
        if tree is None:
            continue
        for node in ast.walk(tree):
            if not isinstance(node, ast.FunctionDef):
                continue
            if sum(1 for _ in ast.walk(node)) < min_nodes:
                continue
            anon = _Anon().visit(copy.deepcopy(node))
            digest = hashlib.sha1(ast.dump(anon, include_attributes=False).encode()).hexdigest()[:12]
            site = f"{_rel(m, p)}:{node.lineno} {node.name}"
            groups[digest].append(site)
            ldump = ast.dump(_AnonLoose().visit(copy.deepcopy(node)), include_attributes=False)
            loose[hashlib.sha1(ldump.encode()).hexdigest()[:12]].append(site)
            literals[site] = [str(n.value) for n in ast.walk(anon) if isinstance(n, ast.Constant)]
    strict_sets = [set(v) for v in groups.values() if len(v) > 1]
    for digest, sites in loose.items():  # near-copies: same shape, literals that differ only slightly
        if len(sites) < 2 or any(set(sites) <= s for s in strict_sets):
            continue
        anchor = literals[sites[0]]
        close = [x for x in sites if all(difflib.SequenceMatcher(None, a, b).ratio() >= similarity for a, b in zip(anchor, literals[x]))]
        if len(close) > 1 and not any(set(close) <= s for s in strict_sets):
            groups["loose-" + digest] = close
    for digest, sites in sorted(groups.items(), key=lambda kv: -len(kv[1])):
        modules = {s.split(":")[0] for s in sites}
        if len(modules) >= 2:
            names = sorted({s.split(" ")[1] for s in sites})
            kind = "near-copies (literals differ)" if digest.startswith("loose-") else "copies"
            out.append(_f(c, "error" if kind == "copies" else "warn", sites[0], f"{len(sites)} {kind} across {len(modules)} modules of {names}: " + ", ".join(sites[1:])))
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
    out.append(_f(c, sev, "*", f"{total} row-wise sites in {len(per_file)} files (budget {budget}); executemany calls: {many}"))
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


def _apply_exceptions(m: dict[str, Any], findings: list[Finding]) -> list[Finding]:
    for f in findings:
        for ex in m.get("exceptions", []):
            if f["check"] == ex["check"] and fnmatch.fnmatch(f["location"], ex["location"]) and f["severity"] in ("error", "warn"):
                f["severity"] = "excepted"
                f["detail"] += f" [exception: {ex['reason']}]"
    return findings


def run_all(m: dict[str, Any]) -> list[Finding]:
    findings: list[Finding] = []
    for name, fn in CHECKS.items():
        try:
            findings.extend(fn(m))
        except Exception as e:  # noqa: BLE001 - one broken check must not hide the others
            findings.append(_f(name, "error", "*", f"check crashed: {e!r}"))
    return _apply_exceptions(m, findings)
