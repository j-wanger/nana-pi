"""@module tests/conftest.py
@purpose Check that every REQUIREMENTS.md row's status agrees with the `req:` markers the test sources actually carry, and that its Requirement cell carries exactly one `shall`.
@inputs REQUIREMENTS.md, optional REQUIREMENTS-general.md, and every tests/**/test_*.py source, read from the pytest rootdir
@outputs the parsed rows, the traced ids, the ids off EARS form, the `ears:` report line,
  a problem list, a summary line on the terminal, and a non-zero exit status on a full
  run that disagrees
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

``check()`` also counts the EARS form (G-013/G-014/G-015): every non-retired row's
Requirement cell must carry exactly one whole-word ``shall`` outside a code span. The
count of off-form rows is reported on its own ``ears:`` line every run, and once that
count exceeds the ``requirements_ears_allowance`` ini option (default
EARS_ALLOWANCE_DEFAULT), each off-form row becomes a problem line too -- subject to the
same full/partial distinction as every other problem here.
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
#: A `shall`, case-insensitive, not preceded or followed by an ASCII letter, digit or
#: underscore -- explicitly ``[A-Za-z0-9_]``, written identically (the literal class, never
#: ``\w`` or a Unicode property) in both rails (astra r2 MUST 1). Requirement rows are
#: English prose, so this is a deliberately NARROWER contract than "every Unicode word
#: character": a non-ASCII letter immediately touching "shall" (e.g. "shallé") counts as a
#: BOUNDARY, not part of a longer word -- "shallé" carries a `shall`. The reason is version
#: independence, not linguistics: ``\w``/``\p{L}`` read from the runtime's OWN Unicode
#: database, and Node 22 (Unicode 17) and this rendered Python (3.14, Unicode 16) disagreed
#: on 4,657 codepoints' letter/digit membership, including U+088F and U+A7F1 -- a silent,
#: version-dependent split neither language's own tests would ever catch. An explicit ASCII
#: class has no Unicode database to disagree about. ``re.ASCII`` is REQUIRED alongside
#: ``re.IGNORECASE`` (astra r3 MUST 1): Python's case-insensitive matching is Unicode-aware
#: by default, so plain ``re.IGNORECASE`` makes ``[A-Za-z]`` ALSO match four non-ASCII
#: characters that case-fold to an ASCII letter -- U+0130 (İ), U+0131 (ı), U+017F (ſ, which
#: also makes "ſhall" itself match "shall") and U+212A (the Kelvin sign, folds to K) -- all
#: four confirmed by an exhaustive sweep (`docs/reviews/ears-form-2026-10-04/
#: boundary-sweep.mjs`) over every codepoint. ``re.ASCII`` restricts `\w`-adjacent
#: case-folding to ASCII only, closing that gap; it does not affect the literal class or the
#: literal "shall" otherwise. JS's own `/gi` (no `u` flag) never had this bug -- confirmed by
#: the same sweep -- so only Python needed the flag. See PARITY_FIXTURES (the test file) for
#: the codepoints this was measured against.
SHALL_RE = re.compile(r"(?<![A-Za-z0-9_])shall(?![A-Za-z0-9_])", re.IGNORECASE | re.ASCII)

#: The allowance default for a project with no declared ini value: a new project writes
#: rows one at a time, so it starts at zero (chosen, design-ruling.md 2026-10-04 §1; same
#: default as the TypeScript rail). Pinned by
#: test_requirements_trace.py::test_seal_ears_allowance_default_is_0.
EARS_ALLOWANCE_DEFAULT = 0

#: The template-owned Part G source (chosen, R-581).
GENERAL_REQUIREMENTS_FILE = "REQUIREMENTS-general.md"

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


def load_requirements(path: Path, text: str | None = None) -> dict[str, Row]:
    """Parse REQUIREMENTS.md into rows by id. Raises UsageError on a malformed table."""
    if text is None:
        if not path.exists():
            return {}
        text = path.read_text(encoding="utf-8")
    found: dict[str, Row] = {}
    for line in text.splitlines():
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


def _mask_code_spans(text: str) -> str:
    """Mask every code span, CommonMark style (astra r1 MUST 1): a run of N backticks opens a
    span that closes only at the NEXT run of EXACTLY N backticks, so `` `shall` ``, ``shall``
    and `` `` `shall` `` `` are each ONE span, not a pair of empty ones either side of a bare
    "shall". An unmatched backtick run is literal text, not a span. The whole span --
    delimiters and content -- is replaced with a SINGLE SPACE, never with nothing (astra r2
    MUST 3): deleting it outright let the words either side glue together -- `` sh`x`all ``
    read back as the word "shall" (falsely counted), and `` shall`x`é `` read back as one
    token "shallé" (a real `shall` lost). A `shall` inside a span is a mention, never a
    promise (G-013); the space is a separator, not content."""
    out: list[str] = []
    i = 0
    n = len(text)
    while i < n:
        if text[i] != "`":
            out.append(text[i])
            i += 1
            continue
        j = i
        while j < n and text[j] == "`":
            j += 1
        run = j - i
        k = j
        close_end = -1
        while k < n:
            if text[k] != "`":
                k += 1
                continue
            m = k
            while m < n and text[m] == "`":
                m += 1
            if m - k == run:
                close_end = m
                break
            k = m
        if close_end == -1:
            out.append(text[i:j])  # no matching close: the opening run is literal text
            i = j
        else:
            out.append(" ")  # the whole span becomes ONE separator, delimiters and content gone
            i = close_end
    return "".join(out)


def _shall_count(requirement: str) -> int:
    """Whole-word, case-insensitive `shall` tokens in a Requirement cell, code spans masked first."""
    return len(SHALL_RE.findall(_mask_code_spans(requirement)))


def shall_counts(text: str) -> dict[str, int]:
    """Every row's `shall` count in its Requirement cell, read straight from the table text --
    independent of ``load_requirements()`` so ``Row``'s shape carries no new field and every
    existing comparison against it stays exact."""
    counts: dict[str, int] = {}
    for line in text.splitlines():
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if not cells or not ID_RE.match(cells[0]):
            continue
        if len(cells) != 4:
            continue  # load_requirements already raises on this shape
        counts[cells[0]] = _shall_count(cells[1])
    return counts


def ears_off_form(requirements: dict[str, Row], counts: dict[str, int]) -> list[str]:
    """Ids off EARS form (G-013): not ``retired``, and the Requirement cell's `shall` count,
    code spans masked, is not exactly one."""
    return sorted(rid for rid, row in requirements.items() if row.status != "retired" and counts.get(rid, 0) != 1)


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


def _row_cells(text: str) -> dict[str, tuple[str, str, str]]:
    """Return requirement, status and evidence cells for each table row."""
    found: dict[str, tuple[str, str, str]] = {}
    for line in text.splitlines():
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if not cells or not ID_RE.match(cells[0]):
            continue
        if len(cells) != 4:
            raise pytest.UsageError(f"{cells[0]} has malformed table cells")
        if cells[0] in found:
            raise pytest.UsageError(f"duplicate id {cells[0]}")
        found[cells[0]] = (cells[1], cells[2], cells[3])
    return found


def check(
    root: Path,
    test_roots: tuple[str, ...] = ("tests",),
    call_names: tuple[str, ...] = CALL_NAMES,
    ears_allowance: int = EARS_ALLOWANCE_DEFAULT,
) -> tuple[dict[str, Row], dict[str, list[str]], list[str], str, list[str], str, str]:
    """Read a project's REQUIREMENTS.md, scan its test roots and report the disagreements,
    including rows off EARS form (G-013/G-014/G-015).

    ``test_roots`` are project-root-relative, so citations stay project-root-relative too
    -- a repo with several suites passes them all and cites each by its real path.
    """
    reqs_path = root / "REQUIREMENTS.md"
    project_text = reqs_path.read_text(encoding="utf-8") if reqs_path.exists() else ""
    general_path = root / GENERAL_REQUIREMENTS_FILE
    text = project_text
    if general_path.exists():
        general_text = general_path.read_text(encoding="utf-8")
        project_cells = _row_cells(project_text)
        general_cells = _row_cells(general_text)
        for rid in general_cells:
            if not rid.startswith("G-"):
                raise pytest.UsageError(f"{rid} is not a Part G id in {GENERAL_REQUIREMENTS_FILE}")
        merged = {rid: cells for rid, cells in project_cells.items() if not rid.startswith("G-")}
        for rid, cells in general_cells.items():
            owned = project_cells.get(rid)
            merged[rid] = (
                cells[0],
                owned[1] if owned else cells[1],
                owned[2] if owned else cells[2],
            )
        text = (
            "\n".join(line for line in project_text.splitlines() if not line.startswith("|"))
            + "\n"
            + "\n".join(f"| {rid} | {cells[0]} | {cells[1]} | {cells[2]} |" for rid, cells in merged.items())
        )
    requirements = load_requirements(reqs_path, text)
    counts = shall_counts(text)
    off_form = ears_off_form(requirements, counts)
    traced: dict[str, list[str]] = {}
    for rel in test_roots:
        if not (root / rel).is_dir():
            continue
        for rid, cites in scan_dir(root / rel, call_names, rel).items():
            traced.setdefault(rid, []).extend(cites)
    problems = trace_problems(requirements, traced)
    if len(off_form) > ears_allowance:
        problems += [f"{rid} carries {counts.get(rid, 0)} shall (one is the form)" for rid in off_form]
    line = summary(requirements, traced)
    ears_line = f"ears: {len(off_form)} rows off form (allowance {ears_allowance})"
    # `line` and `ears_line` joined by one newline, in that order -- a structural guarantee
    # (G-014's "in its own line after the summary line") pinned without spying on a consumer.
    report = f"{line}\n{ears_line}"
    return requirements, traced, problems, line, off_form, ears_line, report


def _drift_line(root: Path) -> str | None:
    """Return the non-failing Part G text reconciliation notice, if needed."""
    general_path = root / GENERAL_REQUIREMENTS_FILE
    requirements_path = root / "REQUIREMENTS.md"
    if not general_path.exists() or not requirements_path.exists():
        return None
    project_cells = _row_cells(requirements_path.read_text(encoding="utf-8"))
    general_cells = _row_cells(general_path.read_text(encoding="utf-8"))
    differences = sorted(
        rid
        for rid, cells in project_cells.items()
        if rid.startswith("G-") and rid in general_cells and cells[0] != general_cells[rid][0]
    )
    if not differences:
        return None
    return f"part g: {len(differences)} cells in REQUIREMENTS.md differ from REQUIREMENTS-general.md (the file governs): {', '.join(differences)}"


def _is_full_run(config: pytest.Config) -> bool:
    testpaths = [str((config.rootpath / p).resolve()) for p in config.getini("testpaths")]
    args = [str(Path(a.split("::")[0]).resolve()) for a in config.args]
    return args == testpaths


def pytest_addoption(parser: pytest.Parser) -> None:
    """Register the EARS allowance ini option (G-013/G-014/G-015): rows tolerated off form
    before a FULL run fails naming them. Default EARS_ALLOWANCE_DEFAULT (see above)."""
    parser.addini(
        "requirements_ears_allowance",
        help="rows tolerated off EARS form (not exactly one `shall`) before a full run fails naming them",
        type="int",
        default=EARS_ALLOWANCE_DEFAULT,
    )


@pytest.hookimpl(tryfirst=True)
def pytest_sessionfinish(session: pytest.Session, exitstatus: int) -> None:
    """Compare REQUIREMENTS.md against the markers; fail a full run that disagrees."""
    config = session.config
    ears_allowance = config.getini("requirements_ears_allowance")
    try:
        requirements, traced, problems, _line, _off_form, _ears_line, report = check(
            config.rootpath, ears_allowance=ears_allowance
        )
    except pytest.UsageError as err:
        # A malformed table or a bad marker is reported as a trace problem rather
        # than an internal error: the point is a readable failure, not a traceback.
        requirements, traced, problems = {}, {}, [str(err)]
        report = "requirements: unreadable" + "\n" + "ears: unreadable"
    if not requirements and not traced and not problems:
        return
    reporter = config.pluginmanager.get_plugin("terminalreporter")
    full = _is_full_run(config)
    if reporter is not None:
        reporter.write_line("")
        for line_out in report.split("\n"):
            reporter.write_line(line_out)
        drift_line = _drift_line(config.rootpath)
        if drift_line:
            reporter.write_line(drift_line)
        if problems:
            head = "requirements trace FAILED:" if full else "requirements trace (partial run, informational):"
            reporter.write_line(head, red=full)
            for p in problems:
                reporter.write_line(f"  {p}", red=full)
            if full:
                reporter.write_line("  fix REQUIREMENTS.md or the markers; do not silence this check")
    if problems and full and exitstatus == 0:
        session.exitstatus = int(pytest.ExitCode.TESTS_FAILED)
