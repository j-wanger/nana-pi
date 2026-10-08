"""@module scripts/code_map.py
@purpose Generate, check and query this project's code map from the import graph
  and the contract headers (G-004, G-007, G-009, G-010, G-011).
@inputs code-map.config.json at the project root, the module sources under its
  roots, and (for --check) the rendered map on disk
@outputs the rendered map written to disk, an --impact report on stdout, a --check
  problem list on stdout; the module functions return plain data
@effects disk (reads the config and the module sources, writes the map), process
  (exits non-zero from --check as a CLI)
@errors a problem list naming each missing or malformed header, unlayered module,
  reverse or layer-skipping import, unresolved intra-package import, unmapped
  dynamic import, stale or drifted map entry; SystemExit for a bad config or a bad
  CLI invocation

Dependency-free on purpose: ``ast`` for the imports, a line scan for the header.
The map is read by agents, so its whole value is that it is never out of date --
which is what ``--check`` in the suite buys.

Everything except ``load_config``, ``collect_modules``, ``write_map`` and ``main``
is pure over ``{path: source}`` records, so the graph, the renderer and the impact
walk are testable on fixture sources with no filesystem.
"""

from __future__ import annotations

import ast
import json
import re
import sys
from collections import deque
from dataclasses import dataclass, field
from pathlib import Path, PurePosixPath
from typing import Any

#: The fixed contract-header tags, in the order G-004 fixes them in.
HEADER_TAGS = ("module", "purpose", "inputs", "outputs", "effects", "errors")

#: The closed side-effect vocabulary of G-004. A value may carry a parenthetical
#: qualifier (``disk (a cache under .cache/)``); the leading word must be one of
#: these, and ``none`` must stand alone.
EFFECTS = ("none", "disk", "database", "network", "process")

CONFIG_PATH = "code-map.config.json"

TAG_RE = re.compile(r"^@([A-Za-z]+)\s*(.*)$")
MAP_ENTRY_RE = re.compile(r"^### `([^`]+)`$", re.MULTILINE)


class ConfigError(Exception):
    """code-map.config.json is missing or does not declare what the generator needs."""


@dataclass(frozen=True)
class Layer:
    """One declared layer: an id, a title, a blurb and the path regex that selects it."""

    id: str
    title: str
    blurb: str
    match: str

    @property
    def regex(self) -> re.Pattern[str]:
        return re.compile(self.match)


@dataclass(frozen=True)
class Exempt:
    """One module excused from the header rule, and the reason it is excused."""

    path: str
    reason: str


@dataclass(frozen=True)
class Config:
    """The validated contents of code-map.config.json."""

    roots: tuple[str, ...]
    module_extensions: tuple[str, ...]
    map_path: str
    layers: tuple[Layer, ...]
    #: The subset of ``roots`` declared ``"layerExempt": true`` (or named in
    #: ``testRoots``) -- a module under one of these may import any layer (G-007:
    #: tests may import anything). Nothing below is exempt, so a production module
    #: importing a test is still a problem.
    exempt_roots: frozenset[str] = frozenset()
    #: Declared per-module exemptions from the header rule: a module whose CONTENT is
    #: pinned elsewhere (a fixture a published study hashes) cannot take a header
    #: without invalidating that pin. It stays in the map and keeps its edges; what it
    #: loses is the header, and it must say why.
    exempt: tuple[Exempt, ...] = ()

    def is_layer_exempt(self, path: str) -> bool:
        """True when this path sits under a root declared layerExempt."""
        return any(path == root or path.startswith(f"{root}/") for root in self.exempt_roots)

    def exempt_reason(self, path: str) -> str | None:
        """The declared reason this module is excused from the header rule, or None."""
        for entry in self.exempt:
            if entry.path == path:
                return entry.reason
        return None


@dataclass
class Module:
    """One mapped module: its layer, its parsed header and its graph edges."""

    path: str
    layer: Layer | None
    layer_index: int | None
    header: dict[str, str] | None
    header_problem: str | None
    #: Set when code-map.config.json excuses this module from the header rule.
    exempt_reason: str | None = None
    callees: list[str] = field(default_factory=list)
    callers: list[str] = field(default_factory=list)


@dataclass
class Graph:
    """The whole graph: modules by path, the sorted path order, and the problems found."""

    modules: dict[str, Module]
    order: list[str]
    problems: list[str]
    config: Config


@dataclass
class ModuleImpact:
    """One changed path's transitive callers and callees."""

    path: str
    known: bool
    callers: list[str]
    callees: list[str]


@dataclass
class Impact:
    """A change's blast radius: the per-path closures and their union."""

    per: list[ModuleImpact]
    callers: list[str]
    callees: list[str]


# --------------------------------------------------------------------- config


def _parse_roots(entries: list[Any], where: str) -> tuple[tuple[str, ...], frozenset[str]]:
    """Read ``roots``: each entry is a path string, or an object with ``path`` and optional ``layerExempt``."""
    paths: list[str] = []
    exempt: set[str] = set()
    for i, entry in enumerate(entries):
        if isinstance(entry, str) and entry:
            paths.append(entry)
            continue
        if not isinstance(entry, dict) or not isinstance(entry.get("path"), str) or not entry["path"]:
            raise ConfigError(f"{where}: roots[{i}] must be a path string or an object with a 'path'")
        if not isinstance(entry.get("layerExempt", False), bool):
            raise ConfigError(f"{where}: roots[{i}] has a non-boolean 'layerExempt'")
        paths.append(entry["path"])
        if entry.get("layerExempt", False):
            exempt.add(entry["path"])
    return tuple(paths), frozenset(exempt)


def _parse_test_roots(entries: Any, roots: tuple[str, ...], where: str) -> frozenset[str]:
    """``testRoots`` is shorthand for ``layerExempt`` on roots that hold tests."""
    if entries is None:
        return frozenset()
    if not isinstance(entries, list):
        raise ConfigError(f"{where}: 'testRoots' must be an array of root paths")
    for i, entry in enumerate(entries):
        if not isinstance(entry, str) or entry not in roots:
            raise ConfigError(f"{where}: testRoots[{i}] {entry!r} is not one of 'roots'")
    return frozenset(entries)


def _parse_exempt(entries: Any, where: str) -> tuple[Exempt, ...]:
    """``exempt`` is a list of ``{path, reason}``. A missing reason is a --check problem, not a parse error."""
    if entries is None:
        return ()
    if not isinstance(entries, list):
        raise ConfigError(f"{where}: 'exempt' must be an array of objects with a 'path' and a 'reason'")
    found: list[Exempt] = []
    for i, entry in enumerate(entries):
        if not isinstance(entry, dict) or not isinstance(entry.get("path"), str) or not entry["path"]:
            raise ConfigError(f"{where}: exempt[{i}] must be an object with a non-empty 'path'")
        reason = entry.get("reason")
        found.append(
            Exempt(
                path=entry["path"],
                reason=reason.strip() if isinstance(reason, str) else "",
            )
        )
    return tuple(found)


def parse_config(text: str, where: str = CONFIG_PATH) -> Config:
    """Validate the config text. Layer ``match`` is a regex over the module path; first match wins."""
    try:
        raw: Any = json.loads(text)
    except json.JSONDecodeError as err:
        raise ConfigError(f"{where}: not valid JSON ({err})") from err
    if not isinstance(raw, dict):
        raise ConfigError(f"{where}: the top level must be an object")
    for key in ("roots", "moduleExtensions", "layers"):
        if not isinstance(raw.get(key), list) or not raw[key]:
            raise ConfigError(f"{where}: '{key}' must be a non-empty array")
    if not isinstance(raw.get("mapPath"), str) or not raw["mapPath"]:
        raise ConfigError(f"{where}: 'mapPath' must be a non-empty string")
    roots, exempt_roots = _parse_roots(raw["roots"], where)
    exempt_roots |= _parse_test_roots(raw.get("testRoots"), roots, where)
    exempt = _parse_exempt(raw.get("exempt"), where)
    layers: list[Layer] = []
    for i, entry in enumerate(raw["layers"]):
        if not isinstance(entry, dict):
            raise ConfigError(f"{where}: layers[{i}] must be an object")
        for key in ("id", "title", "blurb", "match"):
            if not isinstance(entry.get(key), str) or not entry[key]:
                raise ConfigError(f"{where}: layers[{i}] has no '{key}'")
        layers.append(
            Layer(
                id=entry["id"],
                title=entry["title"],
                blurb=entry["blurb"],
                match=entry["match"],
            )
        )
    return Config(
        roots=roots,
        module_extensions=tuple(raw["moduleExtensions"]),
        map_path=raw["mapPath"],
        layers=tuple(layers),
        exempt_roots=exempt_roots,
        exempt=exempt,
    )


def load_config(root: Path) -> Config:
    """Read and validate the config at the project root."""
    f = root / CONFIG_PATH
    if not f.exists():
        raise ConfigError(f"{CONFIG_PATH} not found at the project root")
    return parse_config(f.read_text(encoding="utf-8"))


# ------------------------------------------------------------ contract header


def split_top_level(value: str) -> list[str]:
    """Split a comma list, ignoring commas inside a parenthetical qualifier."""
    parts: list[str] = []
    depth = 0
    current = ""
    for ch in value:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth = max(0, depth - 1)
        if ch == "," and depth == 0:
            parts.append(current.strip())
            current = ""
            continue
        current += ch
    if current.strip():
        parts.append(current.strip())
    return [p for p in parts if p]


def _effects_problem(value: str) -> str | None:
    words = [re.split(r"[\s(]", item)[0] for item in split_top_level(value)]
    for word in words:
        if word not in EFFECTS:
            return f"@effects '{word}' is not one of {' | '.join(EFFECTS)}"
    if "none" in words and len(words) > 1:
        others = ", ".join(w for w in words if w != "none")
        return f"@effects says 'none' alongside {others}"
    return None


def _collect_tags(lines: list[str]) -> tuple[list[str], dict[str, str], str | None]:
    """Read the tag block at the top of a docstring. A blank line ends it; prose may follow."""
    order: list[str] = []
    fields: dict[str, str] = {}
    current: str | None = None
    for line in lines:
        if not line.strip():
            break
        tag = TAG_RE.match(line.strip())
        if tag:
            name, rest = tag.group(1), tag.group(2).strip()
            if name in fields:
                return order, fields, f"duplicate @{name} in the contract header"
            order.append(name)
            fields[name] = rest
            current = name
            continue
        if current is None:
            return (
                order,
                fields,
                "no contract header: the module docstring must open with @module",
            )
        fields[current] = f"{fields[current]} {line.strip()}".strip()
    return order, fields, None


def _missing_tag_problem(fields: dict[str, str]) -> str | None:
    for tag in HEADER_TAGS:
        if tag not in fields:
            return f"the contract header has no @{tag}"
        if not fields[tag]:
            return f"the contract header's @{tag} is empty"
    return None


def _tag_problem(order: list[str], fields: dict[str, str]) -> str | None:
    missing = _missing_tag_problem(fields)
    if missing:
        return missing
    got = ",".join(t for t in order if t in HEADER_TAGS)
    want = ",".join(HEADER_TAGS)
    if got != want:
        return f"the contract header's tags are out of order: {got} (expected {want})"
    extra = [t for t in order if t not in HEADER_TAGS]
    if extra:
        return "the contract header carries unknown tag(s): " + ", ".join(f"@{t}" for t in extra)
    effects = _effects_problem(fields["effects"])
    if effects:
        return effects
    if re.search(r"[.!?]\s+\S", fields["purpose"]):
        return "@purpose is more than one sentence (G-008: one purpose, one sentence)"
    return None


def parse_contract_header(source: str) -> tuple[dict[str, str] | None, str | None]:
    """Parse the contract block at the top of a module docstring.

    Returns ``(fields, None)`` when it parses and ``(None, problem)`` when it does not.
    """
    try:
        tree = ast.parse(source)
    except SyntaxError as err:
        return None, f"the module does not parse: {err}"
    doc = ast.get_docstring(tree, clean=False)
    if doc is None:
        return None, "no contract header: the module must open with a docstring"
    order, fields, problem = _collect_tags(doc.split("\n"))
    if problem is None:
        problem = _tag_problem(order, fields)
    return (None, problem) if problem else (fields, None)


# ---------------------------------------------------------------------- graph


def dotted_name(config: Config, path: str) -> str | None:
    """The importable dotted name of a module path, or None when no root covers it."""
    for root in config.roots:
        prefix = f"{root}/"
        if not path.startswith(prefix):
            continue
        rest = path[len(prefix) :]
        for ext in config.module_extensions:
            if rest.endswith(ext):
                rest = rest[: -len(ext)]
                break
        parts = [p for p in rest.split("/") if p]
        if parts and parts[-1] == "__init__":
            parts.pop()
        package = PurePosixPath(root).name
        return ".".join([package, *parts]) if package else ".".join(parts)
    return None


def _relative_base(self_name: str, is_package: bool, level: int) -> str:
    """The package a ``from ... import`` with ``level`` dots resolves against."""
    own = [p for p in self_name.split(".") if p]
    package = own if is_package else own[:-1]
    kept = package[: len(package) - (level - 1)] if level > 1 else package
    return ".".join(kept)


#: The call names that load a module by name at runtime. A literal argument is a real
#: edge; anything else is an edge this generator cannot see, and says so.
DYNAMIC_IMPORTERS = frozenset({"import_module", "__import__"})


def _is_dynamic_import(node: ast.Call) -> bool:
    """True for ``importlib.import_module(...)``, a bare ``import_module(...)`` or ``__import__(...)``.

    Deliberately name-based and slightly over-eager: a reported edge a human can look
    at beats an edge the map silently does not have.
    """
    func = node.func
    if isinstance(func, ast.Attribute):
        return func.attr in DYNAMIC_IMPORTERS
    return isinstance(func, ast.Name) and func.id in DYNAMIC_IMPORTERS


def _dynamic_target(
    node: ast.Call, self_name: str, is_package: bool
) -> tuple[tuple[tuple[str, ...], bool] | None, str | None]:
    """One dynamic import, as ``(edge, problem)``: a literal resolves, anything else is reported."""
    spec = node.args[0] if node.args else None
    if not isinstance(spec, ast.Constant) or not isinstance(spec.value, str):
        shown = ast.unparse(node) if spec is not None else f"{ast.unparse(node.func)}()"
        return (
            None,
            f"unmapped dynamic import at line {node.lineno}: {shown} (the argument is not a literal string)",
        )
    name = spec.value
    if not name.startswith("."):
        return ((name,), False), None
    level = len(name) - len(name.lstrip("."))
    rest = name[level:]
    anchor = _relative_base(self_name, is_package, level)
    return (((f"{anchor}.{rest}" if rest else anchor,), True), None)


def _from_targets(node: ast.ImportFrom, self_name: str, is_package: bool) -> list[tuple[tuple[str, ...], bool]]:
    """One ``from ... import ...`` statement, as candidate dotted names per imported name."""
    relative = node.level > 0
    if relative:
        anchor = _relative_base(self_name, is_package, node.level)
        base = f"{anchor}.{node.module}" if node.module else anchor
    else:
        base = node.module or ""
    if not base:
        return []
    return [((f"{base}.{a.name}", base), relative) for a in node.names]


def _dedupe(
    items: list[tuple[tuple[str, ...], bool]],
) -> list[tuple[tuple[str, ...], bool]]:
    """The same imports in source order, each one once."""
    seen: set[tuple[tuple[str, ...], bool]] = set()
    unique: list[tuple[tuple[str, ...], bool]] = []
    for item in items:
        if item not in seen:
            seen.add(item)
            unique.append(item)
    return unique


def _import_targets(
    source: str, self_name: str, is_package: bool
) -> tuple[list[tuple[tuple[str, ...], bool]], list[str]]:
    """Every import this module makes, as ``([(candidate dotted names, is_relative)], problems)``.

    ``from pkg.a import b`` is one import with two candidates -- the submodule
    ``pkg.a.b`` first, then the package ``pkg.a`` when ``b`` is an attribute. The
    first candidate that is a mapped module is the edge. A literal
    ``importlib.import_module("pkg.mod")`` or ``__import__("pkg.mod")`` is an edge
    too; a dynamic import whose argument is not a literal string is a problem, not
    a silently missing edge.
    """
    try:
        tree = ast.parse(source)
    except SyntaxError:
        return [], []
    found: list[tuple[tuple[str, ...], bool]] = []
    problems: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            found.extend(((alias.name,), False) for alias in node.names)
        elif isinstance(node, ast.ImportFrom):
            found.extend(_from_targets(node, self_name, is_package))
        elif isinstance(node, ast.Call) and _is_dynamic_import(node):
            edge, problem = _dynamic_target(node, self_name, is_package)
            if edge is not None:
                found.append(edge)
            if problem is not None:
                problems.append(problem)
    return _dedupe(found), problems


def layer_of(config: Config, path: str) -> tuple[int, Layer] | None:
    """The first declared layer whose regex matches the path, with its index."""
    for i, layer in enumerate(config.layers):
        if layer.regex.search(path):
            return i, layer
    return None


def _layer_problem(config: Config, mod: Module, target: Module) -> str | None:
    a, b = mod.layer_index, target.layer_index
    if a is None or b is None or mod.layer is None or target.layer is None:
        return None
    if config.is_layer_exempt(mod.path):
        return None  # G-007: a test may import anything
    if b < a:
        return f"{mod.path}: imports {target.path} against the layer direction ({mod.layer.id} -> {target.layer.id})"
    if b > a + 1:
        skipped = ", ".join(layer.id for layer in config.layers[a + 1 : b])
        return (
            f"{mod.path}: imports {target.path} SKIPPING a layer ({mod.layer.id} -> {target.layer.id}, past {skipped})"
        )
    return None


def _make_module(config: Config, path: str, source: str, problems: list[str]) -> Module:
    """One module record, appending every problem its layer and header show."""
    found = layer_of(config, path)
    if found is None:
        problems.append(f"{path}: no declared layer covers this module ({CONFIG_PATH} layers)")
    excused = config.exempt_reason(path)
    base = Module(
        path=path,
        layer=None if found is None else found[1],
        layer_index=None if found is None else found[0],
        header=None,
        header_problem=None,
        exempt_reason=excused,
    )
    if excused is not None:
        return base  # declared exempt: no header is read and none is demanded
    fields, problem = parse_contract_header(source)
    if problem:
        problems.append(f"{path}: {problem}")
    elif fields is not None and fields["module"] != path:
        problems.append(f"{path}: the header's @module says '{fields['module']}'")
    base.header = fields
    base.header_problem = problem
    return base


def _link_imports(
    config: Config,
    modules: dict[str, Module],
    sources: dict[str, str],
    problems: list[str],
) -> None:
    """Add every intra-project import edge, appending a problem for each one that does not resolve."""
    by_dotted = {name: path for path in sorted(sources) if (name := dotted_name(config, path)) is not None}
    package_roots = {name.split(".")[0] for name in by_dotted}
    for path in sorted(sources):
        mod = modules[path]
        self_name = dotted_name(config, path) or ""
        is_package = path.endswith("/__init__.py")
        targets, dynamic = _import_targets(sources[path], self_name, is_package)
        problems += [f"{path}: {d}" for d in dynamic]
        for candidates, is_relative in targets:
            target = next((by_dotted[c] for c in candidates if c in by_dotted), None)
            if target is None:
                if is_relative or candidates[0].split(".")[0] in package_roots:
                    problems.append(f"{path}: import '{candidates[0]}' does not resolve to a mapped module")
                continue
            if target == path:
                continue
            mod.callees.append(target)
            modules[target].callers.append(path)
            bad = _layer_problem(config, mod, modules[target])
            if bad:
                problems.append(bad)


def _exempt_problems(config: Config, sources: dict[str, str]) -> list[str]:
    """An exemption has to name a real module and say why, or it is a way to hide one."""
    problems: list[str] = []
    for entry in config.exempt:
        if entry.path not in sources:
            where = ", ".join(config.roots)
            problems.append(f"{CONFIG_PATH}: exempt path '{entry.path}' is not a module under {where}")
        if not entry.reason:
            problems.append(f"{CONFIG_PATH}: exempt path '{entry.path}' has no reason")
    return problems


def build_graph(sources: dict[str, str], config: Config) -> Graph:
    """Build the graph over ``{path: source}``."""
    problems: list[str] = _exempt_problems(config, sources)
    order = sorted(sources)
    modules = {path: _make_module(config, path, sources[path], problems) for path in order}
    _link_imports(config, modules, sources, problems)
    for mod in modules.values():
        mod.callees = sorted(set(mod.callees))
        mod.callers = sorted(set(mod.callers))
    return Graph(modules=modules, order=order, problems=problems, config=config)


# --------------------------------------------------------------------- impact


def _walk(modules: dict[str, Module], start: str, edge: str) -> list[str]:
    seen: set[str] = set()
    first = modules.get(start)
    queue: deque[str] = deque(getattr(first, edge) if first else [])
    while queue:
        nxt = queue.popleft()
        if nxt in seen:
            continue
        seen.add(nxt)
        found = modules.get(nxt)
        queue.extend(n for n in (getattr(found, edge) if found else []) if n not in seen)
    seen.discard(start)
    return sorted(seen)


def impact(graph: Graph, paths: list[str]) -> Impact:
    """The blast radius of a change (G-011): transitive callers and callees per path."""
    per = [
        ModuleImpact(
            path=path,
            known=path in graph.modules,
            callers=_walk(graph.modules, path, "callers"),
            callees=_walk(graph.modules, path, "callees"),
        )
        for path in paths
    ]
    changed = set(paths)

    def union(edge: str) -> list[str]:
        out: set[str] = set()
        for entry in per:
            out.update(getattr(entry, edge))
        return sorted(out - changed)

    return Impact(per=per, callers=union("callers"), callees=union("callees"))


def untraced_tests(graph: Graph) -> tuple[int, int]:
    """G-011 (parity, nana-pi R-862): how many test modules (under a layerExempt/testRoots root)

    import no mapped module at all -- the part of the blast radius ``--impact`` still
    cannot see, because a dropped or process-only test never shows up as anyone's caller.
    Returns ``(untraced, total)``.
    """
    tests = [p for p in graph.order if graph.config.is_layer_exempt(p)]
    untraced = [p for p in tests if not graph.modules[p].callees]
    return len(untraced), len(tests)


def format_impact(graph: Graph, paths: list[str]) -> str:
    """The impact report, as the CLI prints it."""
    result = impact(graph, paths)
    out: list[str] = []
    for entry in result.per:
        suffix = "" if entry.known else "  [NOT A MAPPED MODULE]"
        out.append(f"{entry.path}{suffix}")
        out.append(f"  transitive callers ({len(entry.callers)}): {' '.join(entry.callers) or '—'}")
        out.append(f"  transitive callees ({len(entry.callees)}): {' '.join(entry.callees) or '—'}")
    if len(paths) > 1:
        out.append("")
        out.append(f"blast radius: {len(result.callers)} upstream, {len(result.callees)} downstream")
    untraced, total = untraced_tests(graph)
    out.append("")
    out.append(
        f"untraced tests: {untraced} of {total} test modules import no mapped module "
        "(a test that only starts a process is not linked)"
    )
    return "\n".join(out)


# ------------------------------------------------------------------- renderer


def _refs(paths: list[str]) -> str:
    return ", ".join(f"`{p}`" for p in paths) if paths else "—"


def _layer_id(mod: Module) -> str | None:
    return None if mod.layer is None else mod.layer.id


def render_map(graph: Graph) -> str:
    """The map, as markdown.

    Deterministic: nothing machine-dependent, so a regenerated map is
    byte-identical until the code changes.
    """
    config = graph.config
    roots = "`, `".join(config.roots)
    out = [
        "# Code map",
        "",
        "Generated — do not edit. `uv run python scripts/code_map.py` rewrites it from the",
        "import graph and the contract header at the top of each module;",
        "`uv run python scripts/code_map.py --check` fails when this file and the code",
        "disagree (G-009, G-010). `--impact <file...>` prints a change's transitive callers",
        "and callees (G-011).",
        "",
        f"Covers `{roots}` — {len(graph.order)} modules, as declared in",
        f"`{CONFIG_PATH}`.",
        "",
        "**Layer direction** (G-007): a module may import from its own layer or the one",
        "directly after it, never an earlier one and never skipping one.",
        "",
        "**Effects vocabulary** (G-004): `" + "` · `".join(EFFECTS) + "`, with an optional",
        "parenthetical qualifier. A value a caller is handed back is an *output*, not an",
        "effect; a file written under the project counts as `disk`.",
        "",
    ]
    for i, layer in enumerate(config.layers):
        out.append(f"{i + 1}. **{layer.title}** — {layer.blurb}")
    out.append("")
    for layer in config.layers:
        members = [p for p in graph.order if _layer_id(graph.modules[p]) == layer.id]
        out += [f"## {layer.title}", "", layer.blurb, ""]
        if not members:
            out += ["_No modules._", ""]
            continue
        for path in members:
            mod = graph.modules[path]
            out += [f"### `{path}`", ""]
            if mod.exempt_reason is not None:
                out.append(f"- **exempt** — {mod.exempt_reason}")
                out.append(f"- **callers** — {_refs(mod.callers)}")
                out.append(f"- **callees** — {_refs(mod.callees)}")
                out.append("")
                continue
            if mod.header is None:
                out += [
                    f"- **header** — MISSING OR MALFORMED: {mod.header_problem}",
                    "",
                ]
                continue
            for tag in ("purpose", "inputs", "outputs", "effects", "errors"):
                out.append(f"- **{tag}** — {mod.header[tag]}")
            out.append(f"- **callers** — {_refs(mod.callers)}")
            out.append(f"- **callees** — {_refs(mod.callees)}")
            out.append("")
    return "\n".join(out).rstrip("\n") + "\n"


def map_entries(markdown: str) -> list[str]:
    """The ``### `path` `` headings the rendered map on disk carries."""
    return MAP_ENTRY_RE.findall(markdown)


# ------------------------------------------------------------------------- fs


def collect_modules(root: Path, config: Config) -> dict[str, str]:
    """Every module under the configured roots, as ``{posix path: source}``."""
    found: dict[str, str] = {}
    for declared in config.roots:
        base = root / declared
        if not base.is_dir():
            continue
        for f in sorted(base.rglob("*")):
            rel = f.relative_to(root).as_posix()
            if not f.is_file() or not rel.endswith(config.module_extensions):
                continue
            if any(part.startswith(".") or part == "__pycache__" for part in f.relative_to(root).parts):
                continue
            found[rel] = f.read_text(encoding="utf-8")
    return found


def check_project(root: Path) -> tuple[Graph, str, list[str], str]:
    """The whole check (G-010): header problems, graph problems, and whether the map on disk is current."""
    config = load_config(root)
    graph = build_graph(collect_modules(root, config), config)
    markdown = render_map(graph)
    problems = list(graph.problems)
    map_file = root / config.map_path
    run = "run 'uv run python scripts/code_map.py'"
    if not map_file.exists():
        problems.append(f"{config.map_path} does not exist; {run}")
    else:
        on_disk = map_file.read_text(encoding="utf-8")
        listed = set(map_entries(on_disk))
        problems += [f"{p} has no entry in {config.map_path}; {run}" for p in graph.order if p not in listed]
        problems += [
            f"{config.map_path} lists {p}, which is not a module under {', '.join(config.roots)}"
            for p in sorted(listed)
            if p not in graph.modules
        ]
        if on_disk != markdown:
            problems.append(f"{config.map_path} is stale against the code; {run}")
    mods = [graph.modules[p] for p in graph.order]
    headerless = sum(1 for m in mods if m.header is None and m.exempt_reason is None)
    excused = sum(1 for m in mods if m.exempt_reason is not None)
    line = (
        f"code map: {len(graph.order)} modules over {', '.join(config.roots)}; "
        f"{headerless} without a usable contract header; "
        + (f"{excused} exempt; " if excused else "")
        + f"{len(problems)} problem(s)"
    )
    return graph, markdown, problems, line


def write_map(root: Path) -> tuple[Graph, str]:
    """Render the map and write it to the configured path."""
    config = load_config(root)
    graph = build_graph(collect_modules(root, config), config)
    markdown = render_map(graph)
    (root / config.map_path).write_text(markdown, encoding="utf-8")
    return graph, markdown


# ------------------------------------------------------------------------ CLI

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def main(argv: list[str], root: Path = PROJECT_ROOT) -> int:
    """The CLI: default render, ``--check``, ``--impact <file...>``."""
    mode = argv[0] if argv else "--write"
    if mode == "--impact":
        config = load_config(root)
        graph = build_graph(collect_modules(root, config), config)
        paths = [PurePosixPath(_relative(a, root)).as_posix() for a in argv[1:]]
        if not paths:
            sys.stderr.write("usage: python scripts/code_map.py --impact <file...>\n")
            return 2
        sys.stdout.write(format_impact(graph, paths) + "\n")
        return 0
    if mode == "--check":
        _graph, _markdown, problems, line = check_project(root)
        sys.stdout.write(line + "\n")
        for p in problems:
            sys.stdout.write(f"  {p}\n")
        return 1 if problems else 0
    if mode in {"--write", "--render"}:
        graph, _markdown = write_map(root)
        sys.stdout.write(f"{graph.config.map_path}: {len(graph.order)} modules\n")
        for p in graph.problems:
            sys.stdout.write(f"  {p}\n")
        return 1 if graph.problems else 0
    sys.stderr.write(f"unknown mode '{mode}' (expected --write, --check or --impact)\n")
    return 2


def _relative(arg: str, root: Path) -> str:
    candidate = Path(arg)
    try:
        return (candidate if candidate.is_absolute() else (root / candidate)).resolve().relative_to(root).as_posix()
    except ValueError:
        return arg


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except ConfigError as err:  # a bad config is a usage error, not a traceback
        sys.stderr.write(f"{err}\n")
        sys.exit(2)
