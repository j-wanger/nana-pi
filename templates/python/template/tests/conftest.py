"""@module tests/conftest.py
@purpose Check that every REQUIREMENTS.md row's status agrees with the `req:` markers the test sources actually carry.
@inputs REQUIREMENTS.md and every tests/**/test_*.py source, read from the pytest rootdir
@outputs the parsed rows, the traced ids, a problem list, a summary line on the
  terminal, and a non-zero exit status on a full run that disagrees
@effects disk (reads REQUIREMENTS.md and the test sources), process (sets the session exit status)
@errors pytest.UsageError for a malformed requirements table or a bad or orphan marker

The requirements-first rail. A test declares which rows it evidences with a
comment directly above its ``def test_...`` line (decorators may sit in between)::

    # req: R-001 G-004
    def test_a_bounded_page_never_repeats_a_row() -> None:
        ...

Stacked comment lines merge. At the end of a FULL run the plugin compares the
Status column of REQUIREMENTS.md against what the sources trace:

- a marker naming an id that is not a row fails the run;
- an ``implemented`` row with no marker and no external evidence fails the run;
- an ``untested``, ``planned`` or ``violated`` row that a marker traces fails the
  run (the status is stale: promote it);
- an ``implemented`` row citing ``tests/<file>::<test>`` that does not exist, or
  does not carry that row's marker, fails the run;
- an ``implemented`` row whose evidence names no test in this repo -- empty, prose,
  or a half-written citation -- fails the run: the cell is a claim the suite backs.

Evidence that lives in another repo is cited with a ``<repo>:`` prefix; a row
whose evidence is entirely external is traced there, not here. A PARTIAL run
(pytest given paths) only reports -- it never fails -- because the markers it can
see are the whole suite's but the status claims are not its business to judge.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

import pytest

pytest_plugins = ["pytester"]  # for tests/test_requirements_trace.py

STATUSES = frozenset({"implemented", "untested", "planned", "violated", "retired"})

ID_RE = re.compile(r"^[RG]-\d{3}$")
EXTERNAL_RE = re.compile(r"^[a-z][a-z0-9-]*:")
MARKER_RE = re.compile(r"^\s*#\s*req:\s*(.+?)\s*$")
DEF_RE = re.compile(r"^\s*(?:async\s+)?def\s+(test[A-Za-z0-9_]*)\s*\(")
BACKTICK_RE = re.compile(r"`([^`]+)`")

#: The call names that count as a test declaration in a helper-driven suite, where the
#: marked call is a call and not a ``def`` -- and may sit ANYWHERE on the line
#: (``for case in CASES: check("...", ...)``). The FIRST such call on the line wins.
CALL_NAMES = ("test", "it", "check")


def _call_re(names: tuple[str, ...]) -> re.Pattern[str]:
    alt = "|".join(re.escape(n) for n in names)
    return re.compile(rf"""(?:^|[^\w.$])(?:{alt})\s*\(\s*(['"])(.*?)\1""")


CALL_RE = _call_re(CALL_NAMES)


@dataclass
class Row:
    """One REQUIREMENTS.md row: its status and what its evidence cell claims."""

    status: str
    external: bool = False
    #: Citations of the form ``tests/<file>::<test name>`` -- the ones this suite must back.
    local: list[str] = field(default_factory=list)
    #: Citation text that is neither a local test citation nor an external ``<repo>:``
    #: reference. On an ``implemented`` row that is a problem, not evidence.
    other: list[str] = field(default_factory=list)


def _cites(evidence: str) -> list[str]:
    raw = BACKTICK_RE.findall(evidence) if "`" in evidence else evidence.split(",")
    return [c.strip() for c in raw if c.strip() and c.strip() != "—"]


def _is_local(cite: str) -> bool:
    """A well-formed citation of a test in THIS repo: ``tests/<file>::<test name>``."""
    head, sep, name = cite.partition("::")
    return bool(sep) and head.startswith("tests/") and bool(name.strip()) and head != "tests/"


def load_requirements(path: Path) -> dict[str, Row]:
    """Parse REQUIREMENTS.md into rows by id. Raises UsageError on a malformed table."""
    if not path.exists():
        return {}
    found: dict[str, Row] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if not cells or not ID_RE.match(cells[0]):
            continue
        if len(cells) != 4:
            raise pytest.UsageError(
                f"REQUIREMENTS.md: {cells[0]} has {len(cells)} cells, expected 4; a '|' inside a cell breaks the table"
            )
        rid, status = cells[0], cells[2].lower()
        if rid in found:
            raise pytest.UsageError(f"REQUIREMENTS.md: duplicate id {rid}")
        if status not in STATUSES:
            raise pytest.UsageError(
                f"REQUIREMENTS.md: {rid} has unknown status {status!r} (expected one of {sorted(STATUSES)})"
            )
        cites = _cites(cells[3])
        found[rid] = Row(
            status=status,
            external=bool(cites) and all(EXTERNAL_RE.match(c) for c in cites),
            local=[c for c in cites if _is_local(c)],
            other=[c for c in cites if not _is_local(c) and not EXTERNAL_RE.match(c)],
        )
    return found


def _ids_at(lines: list[str], start: int, name: str) -> tuple[list[str], int]:
    ids: list[str] = []
    i = start
    while i < len(lines):
        m = MARKER_RE.match(lines[i])
        if not m:
            break
        for rid in m.group(1).split():
            if not ID_RE.match(rid.rstrip(",")):
                raise pytest.UsageError(f"{name}:{i + 1}: bad requirement id {rid!r} (expected R-NNN or G-NNN)")
            ids.append(rid.rstrip(","))
        i += 1
    return ids, i


def scan_source(source: str, name: str, call_names: tuple[str, ...] = CALL_NAMES) -> list[tuple[list[str], str]]:
    """Every marker in one test source, as ``(ids, test name)``.

    The marked line is either a ``def test_...`` (the usual shape) or a call to one of
    ``call_names`` with a string title, anywhere on the line -- which is what a suite
    driven by a table and a helper looks like.
    """
    call_re = CALL_RE if call_names == CALL_NAMES else _call_re(call_names)
    lines = source.split("\n")
    found: list[tuple[list[str], str]] = []
    i = 0
    while i < len(lines):
        if not MARKER_RE.match(lines[i]):
            i += 1
            continue
        ids, j = _ids_at(lines, i, name)
        while j < len(lines) and lines[j].lstrip().startswith("@"):
            j += 1  # decorators may sit between the marker and the def
        line = lines[j] if j < len(lines) else ""
        hit = DEF_RE.match(line) or call_re.search(line)
        if hit is None:
            raise pytest.UsageError(
                f"{name}:{i + 1}: '# req:' must sit directly above a 'def test_...' line "
                f"or a {' or '.join(f'{n}(' for n in call_names)} call"
            )
        found.append((ids, hit.group(1) if hit.re is DEF_RE else hit.group(2)))
        i = j + 1
    return found


def scan_dir(directory: Path, call_names: tuple[str, ...] = CALL_NAMES, prefix: str = "tests") -> dict[str, list[str]]:
    """Every marker under a tests directory, as ``{id: ['tests/<path>::<test>', ...]}``.

    Recursive and deterministic: feature-shaped suites nest their tests, so a marker
    in ``tests/billing/test_caps.py`` counts, and its citation keeps the path
    relative to the project root.
    """
    traced: dict[str, list[str]] = {}
    for f in sorted(directory.rglob("test_*.py")):
        if not f.is_file() or "__pycache__" in f.parts:
            continue
        rel = f"{prefix}/{f.relative_to(directory).as_posix()}"
        for ids, name in scan_source(f.read_text(encoding="utf-8"), rel, call_names):
            for rid in ids:
                traced.setdefault(rid, []).append(f"{rel}::{name}")
    return traced


def trace_problems(requirements: dict[str, Row], traced: dict[str, list[str]]) -> list[str]:
    """The mismatches, as human-readable lines; empty when the file and the suite agree."""
    problems: list[str] = []
    for rid in sorted(set(traced) - set(requirements)):
        problems.append(f"{rid} is marked on {len(traced[rid])} test(s) but is not in REQUIREMENTS.md")
    for rid, row in sorted(requirements.items()):
        have = traced.get(rid, [])
        if row.status == "implemented" and not have and not row.external:
            problems.append(
                f"{rid} is 'implemented' but no test carries '# req: {rid}' and its evidence is not external"
            )
        elif row.status in {"untested", "planned", "violated"} and have:
            problems.append(f"{rid} is '{row.status}' but {len(have)} test(s) trace it; set status to implemented")
        if row.status != "implemented":
            continue
        problems += _evidence_problems(rid, row)
        for cite in row.local:
            if cite not in have:
                problems.append(f"{rid} cites '{cite}' but no test with that name carries '# req: {rid}'")
    return problems


def _evidence_problems(rid: str, row: Row) -> list[str]:
    """What an ``implemented`` row's evidence cell must say: a test in this repo, or an external repo."""
    if row.external:
        return []
    problems = [
        f"{rid} evidence '{junk}' is not a test citation ('tests/<file>::<test name>') "
        f"or an external '<repo>:' reference"
        for junk in row.other
    ]
    if not row.local:
        problems.append(
            f"{rid} is 'implemented' but its evidence names no test in this repo "
            f"(expected 'tests/<file>::<test name>', backticked)"
        )
    return problems


def summary(requirements: dict[str, Row], traced: dict[str, list[str]]) -> str:
    """The one-line status tally the suite prints."""
    counts: dict[str, int] = {}
    for row in requirements.values():
        counts[row.status] = counts.get(row.status, 0) + 1
    parts = " · ".join(f"{counts[s]} {s}" for s in sorted(counts))
    return f"requirements: {len(requirements)} total ({parts}); {len(traced)} traced by tests"


def check(
    root: Path, test_roots: tuple[str, ...] = ("tests",), call_names: tuple[str, ...] = CALL_NAMES
) -> tuple[dict[str, Row], dict[str, list[str]], list[str], str]:
    """Read a project's REQUIREMENTS.md, scan its test roots and report the disagreements.

    ``test_roots`` are project-root-relative, so citations stay project-root-relative too
    -- a repo with several suites passes them all and cites each by its real path.
    """
    requirements = load_requirements(root / "REQUIREMENTS.md")
    traced: dict[str, list[str]] = {}
    for rel in test_roots:
        if not (root / rel).is_dir():
            continue
        for rid, cites in scan_dir(root / rel, call_names, rel).items():
            traced.setdefault(rid, []).extend(cites)
    return requirements, traced, trace_problems(requirements, traced), summary(requirements, traced)


def _is_full_run(config: pytest.Config) -> bool:
    testpaths = [str((config.rootpath / p).resolve()) for p in config.getini("testpaths")]
    args = [str(Path(a.split("::")[0]).resolve()) for a in config.args]
    return args == testpaths


@pytest.hookimpl(tryfirst=True)
def pytest_sessionfinish(session: pytest.Session, exitstatus: int) -> None:
    """Compare REQUIREMENTS.md against the markers; fail a full run that disagrees."""
    config = session.config
    try:
        requirements, traced, problems, line = check(config.rootpath)
    except pytest.UsageError as err:
        # A malformed table or a bad marker is reported as a trace problem rather
        # than an internal error: the point is a readable failure, not a traceback.
        requirements, traced, problems, line = {}, {}, [str(err)], "requirements: unreadable"
    if not requirements and not traced and not problems:
        return
    reporter = config.pluginmanager.get_plugin("terminalreporter")
    full = _is_full_run(config)
    if reporter is not None:
        reporter.write_line("")
        reporter.write_line(line)
        if problems:
            head = "requirements trace FAILED:" if full else "requirements trace (partial run, informational):"
            reporter.write_line(head, red=full)
            for p in problems:
                reporter.write_line(f"  {p}", red=full)
            if full:
                reporter.write_line("  fix REQUIREMENTS.md or the markers; do not silence this check")
    if problems and full and exitstatus == 0:
        session.exitstatus = int(pytest.ExitCode.TESTS_FAILED)
