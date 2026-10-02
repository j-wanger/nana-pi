"""@module scripts/readme_check.py
@purpose Check that every command, path, flag and script name a README states exists and
  runs as written, and that a reader can install, run and test from it alone (G-012).
@inputs README.md (plus any README named in readme-check.config.json), package.json or
  the files under scripts/, and the project root
@outputs a claim list, a problem list and a summary line on stdout; the module functions
  return plain data
@effects disk (reads the READMEs, the files they name and the package metadata), process
  (exits non-zero from the CLI when a claim does not hold)
@errors a problem list naming each README line whose claim fails; SystemExit for a bad
  CLI invocation

The README is read before the code, so a README claim is a requirement with the README as
its row. This checks the five things that make one honest: its commands exist, its paths
exist, it says how to install / run / test and what the project is for, the flags it shows
exist in the script it shows them for, and every script the project ships is mentioned.

Dependency-free on purpose (stdlib only), so it runs from the post-edit gate before the
environment exists. Everything except ``load_config``, ``check_project`` and ``main`` is
pure over text, so the claim readers are testable on fixture strings.
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

CONFIG_PATH = "readme-check.config.json"
MAP_CONFIG_PATH = "code-map.config.json"

#: Fence info strings whose body is shell: a `json` or `python` block is not a command.
SHELL_LANGS = frozenset({"", "bash", "sh", "shell", "zsh", "console", "shell-session", "text"})

#: Extensions that make a bare token (no slash) a path claim.
KNOWN_EXT = frozenset(
    {
        ".md",
        ".py",
        ".ts",
        ".tsx",
        ".mjs",
        ".cjs",
        ".js",
        ".jsx",
        ".json",
        ".toml",
        ".yaml",
        ".yml",
        ".lock",
        ".txt",
        ".cfg",
        ".ini",
        ".sh",
        ".typed",
        ".html",
        ".css",
    }
)

#: Package-manager subcommands that are the tool's own, not a project script.
PM_BUILTINS = frozenset(
    {
        "add",
        "audit",
        "bin",
        "cache",
        "ci",
        "config",
        "create",
        "dedupe",
        "deploy",
        "dlx",
        "doctor",
        "env",
        "exec",
        "fund",
        "i",
        "import",
        "info",
        "init",
        "install",
        "licenses",
        "link",
        "list",
        "login",
        "logout",
        "ls",
        "outdated",
        "pack",
        "patch",
        "ping",
        "prune",
        "publish",
        "rebuild",
        "remove",
        "rm",
        "root",
        "run",
        "setup",
        "store",
        "uninstall",
        "unlink",
        "up",
        "update",
        "upgrade",
        "version",
        "view",
        "whoami",
        "why",
        "x",
    }
)

#: Command heads that make an inline code span a command the README names: ``npm test`` in
#: prose is as much a claim as the same line inside a fence (G-012).
COMMAND_HEADS = frozenset(
    {
        "npm",
        "pnpm",
        "yarn",
        "bun",
        "npx",
        "uv",
        "uvx",
        "python",
        "python3",
        "node",
        "make",
        "just",
    }
)

#: The three things a reader must be able to do from the README alone.
SECTIONS = (
    ("install", ("install", "setup", "getting started")),
    ("run", ("run", "usage", "start")),
    ("test", ("test", "verify", "check")),
)

FENCE_RE = re.compile(r"^\s*```+\s*([A-Za-z0-9_-]*)\s*$")
PROMPT_RE = re.compile(r"^\s*[$>]\s+")
PM_RE = re.compile(r"^(npm|pnpm|yarn|bun)\s+(?:run\s+)?([A-Za-z0-9:_.-]+)")
RUNNER_RE = re.compile(r"^(make|just)\s+([A-Za-z0-9:_.-]+)")
BACKTICK_RE = re.compile(r"`([^`]+)`")
FLAG_RE = re.compile(r"--[A-Za-z][\w-]*")
SCRIPT_RE = re.compile(r"(?<![\w/.-])(scripts/[\w./-]+\.(?:py|mjs|cjs|js|ts|sh))")
HEADING_RE = re.compile(r"^#{1,6}\s+(.*?)\s*$")
#: ``./scripts/x.py`` or ``scripts/x.mjs`` as the head of a span: an invocation, not a mention.
SCRIPT_HEAD_RE = re.compile(r"^\.?/?scripts/[\w./-]+\.(?:py|mjs|cjs|js|ts|sh)$")
#: What separates two commands inside one span: ``a && b``, ``a; b``, ``a | b``.
CHAIN_RE = re.compile(r"&&|\|\||;|\|")


class ConfigError(Exception):
    """readme-check.config.json does not say what the checker needs."""


@dataclass(frozen=True)
class Config:
    """Which READMEs to check, and which scripts are deliberately undocumented."""

    readmes: tuple[str, ...]
    undocumented: dict[str, str]


@dataclass(frozen=True)
class Claim:
    """One thing a README asserts, and where it asserts it."""

    kind: str
    line: int
    text: str


def _map_roots(root: Path) -> list[str]:
    """The code-map roots, so a README beside one of them is checked too."""
    f = root / MAP_CONFIG_PATH
    if not f.exists():
        return []
    try:
        raw: Any = json.loads(f.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []
    entries = raw.get("roots") if isinstance(raw, dict) else None
    if not isinstance(entries, list):
        return []
    out: list[str] = []
    for entry in entries:
        path = entry if isinstance(entry, str) else entry.get("path") if isinstance(entry, dict) else None
        if isinstance(path, str) and path:
            out.append(path)
    return out


def default_readmes(root: Path) -> tuple[str, ...]:
    """``README.md`` plus every ``<code-map root>/README.md`` that exists."""
    found = ["README.md"]
    found += sorted(f"{r}/README.md" for r in _map_roots(root) if (root / r / "README.md").is_file())
    return tuple(dict.fromkeys(found))


def parse_config(text: str, root: Path, where: str = CONFIG_PATH) -> Config:
    """Validate the optional config. ``readmes`` defaults, ``undocumented`` needs a reason each."""
    try:
        raw: Any = json.loads(text)
    except json.JSONDecodeError as err:
        raise ConfigError(f"{where}: not valid JSON ({err})") from err
    if not isinstance(raw, dict):
        raise ConfigError(f"{where}: the top level must be an object")
    readmes = raw.get("readmes", None)
    if readmes is not None and (not isinstance(readmes, list) or not all(isinstance(r, str) and r for r in readmes)):
        raise ConfigError(f"{where}: 'readmes' must be an array of paths")
    undocumented: dict[str, str] = {}
    entries = raw.get("undocumented", [])
    if not isinstance(entries, list):
        raise ConfigError(f"{where}: 'undocumented' must be an array of objects with a 'name' and a 'reason'")
    for i, entry in enumerate(entries):
        if not isinstance(entry, dict) or not isinstance(entry.get("name"), str) or not entry["name"]:
            raise ConfigError(f"{where}: undocumented[{i}] must be an object with a non-empty 'name'")
        reason = entry.get("reason")
        undocumented[entry["name"]] = reason.strip() if isinstance(reason, str) else ""
    return Config(
        readmes=tuple(readmes) if readmes else default_readmes(root),
        undocumented=undocumented,
    )


def load_config(root: Path) -> Config:
    """Read the optional config at the project root."""
    f = root / CONFIG_PATH
    if not f.exists():
        return Config(readmes=default_readmes(root), undocumented={})
    return parse_config(f.read_text(encoding="utf-8"), root)


# ------------------------------------------------------------------- the claims


def shell_lines(text: str) -> list[tuple[int, str]]:
    """Every shell line inside a fenced block, as ``(1-based line number, command)``."""
    out: list[tuple[int, str]] = []
    lang: str | None = None
    for n, line in enumerate(text.split("\n"), start=1):
        fence = FENCE_RE.match(line)
        if fence:
            lang = None if lang is not None else fence.group(1).lower()
            continue
        if lang is None or lang not in SHELL_LANGS:
            continue
        command = PROMPT_RE.sub("", line).strip()
        if command and not command.startswith("#"):
            out.append((n, command))
    return out


def looks_like_path(token: str) -> str | None:
    """The path a backticked or command token names, or None when it is not a path claim."""
    tok = token.strip().rstrip(".,;:)")
    slashed = "/" in tok  # a trailing slash makes a directory claim: `src/` is a path
    tok = tok.rstrip("/")
    if not tok or " " in tok or tok.startswith(("-", "/")) or "://" in tok:
        return None
    if any(ch in tok for ch in "<>{}*…$|=") or "::" in tok:
        return None
    if slashed or Path(tok).suffix in KNOWN_EXT:
        return tok
    return None


def _fenced_lines(text: str) -> set[int]:
    """Line numbers (1-based) inside a fenced block, the fence lines themselves included."""
    out: set[int] = set()
    open_fence = False
    for n, line in enumerate(text.split("\n"), start=1):
        if FENCE_RE.match(line):
            open_fence = not open_fence
            out.add(n)
            continue
        if open_fence:
            out.add(n)
    return out


def command_span(span: str) -> str | None:
    """The command a span states, or None when the span is prose, a path or a symbol."""
    command = span.strip()
    head = command.split()[0] if command.split() else ""
    return command if head in COMMAND_HEADS or SCRIPT_HEAD_RE.match(head) else None


def inline_command_claims(text: str) -> list[Claim]:
    """Commands shown inline in backticks.

    ``npm test`` in a sentence names a command just as a fenced block does, and a README
    that names a script it does not have is wrong either way. Only spans outside fences: a
    fenced line is already a command claim.
    """
    out: list[Claim] = []
    fenced = _fenced_lines(text)
    for n, line in enumerate(text.split("\n"), start=1):
        if n in fenced:
            continue
        for span in BACKTICK_RE.findall(line):
            for part in CHAIN_RE.split(span):
                command = command_span(part)
                if command is not None:
                    out.append(Claim("command", n, command))
    return out


def command_claims(text: str) -> list[Claim]:
    """Every command a fenced block shows or a sentence names inline, as a claim each."""
    fenced = [Claim("command", n, command) for n, command in shell_lines(text)]
    return fenced + inline_command_claims(text)


def path_claims(text: str) -> list[Claim]:
    """Every backticked token that names a path, plus the paths the commands name."""
    out: list[Claim] = []
    for n, line in enumerate(text.split("\n"), start=1):
        for span in BACKTICK_RE.findall(line):
            for token in span.split():
                path = looks_like_path(token)
                if path is not None:
                    out.append(Claim("path", n, path))
    for n, command in shell_lines(text):
        for token in command.split():
            path = looks_like_path(token)
            if path is not None and "/" in path:
                out.append(Claim("path", n, path))
    return out


def flag_claims(text: str) -> list[Claim]:
    """Every ``--flag`` the README shows beside a ``scripts/...`` file, as ``script --flag``."""
    out: list[Claim] = []
    for n, line in enumerate(text.split("\n"), start=1):
        scripts = SCRIPT_RE.findall(line)
        if not scripts:
            continue
        for flag in dict.fromkeys(FLAG_RE.findall(line)):
            out.append(Claim("flag", n, f"{scripts[0]} {flag}"))
    return out


def headings(text: str) -> list[str]:
    """Every heading's text, lowercased."""
    return [m.group(1).lower() for m in (HEADING_RE.match(line) for line in text.split("\n")) if m]


def first_paragraph(text: str) -> str:
    """The prose before the first ``##``, with the title line dropped."""
    out: list[str] = []
    for line in text.split("\n"):
        if line.startswith("## "):
            break
        if line.startswith("# ") or FENCE_RE.match(line):
            continue
        if line.strip():
            out.append(line.strip())
    return " ".join(out)


# ----------------------------------------------------------------- the problems


def _package_scripts(root: Path) -> dict[str, str]:
    f = root / "package.json"
    if not f.exists():
        return {}
    try:
        raw: Any = json.loads(f.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    scripts = raw.get("scripts") if isinstance(raw, dict) else None
    return {k: v for k, v in scripts.items() if isinstance(k, str)} if isinstance(scripts, dict) else {}


def _script_files(root: Path) -> list[str]:
    base = root / "scripts"
    if not base.is_dir():
        return []
    return sorted(f.name for f in base.iterdir() if f.is_file() and not f.name.startswith("."))


def command_problems(root: Path, where: str, claim: Claim, scripts: dict[str, str]) -> list[str]:
    """One command line, measured against package.json scripts and the files it names."""
    problems: list[str] = []
    pm = PM_RE.match(claim.text)
    if pm and pm.group(2) not in scripts and pm.group(2) not in PM_BUILTINS:
        problems.append(f"{where}:{claim.line}: '{pm.group(1)} {pm.group(2)}' is not a script in package.json")
    runner = RUNNER_RE.match(claim.text)
    if runner and not any((root / name).exists() for name in ("Makefile", "makefile", "justfile", "Justfile")):
        problems.append(f"{where}:{claim.line}: '{runner.group(1)}' is not this project's runner (no such file)")
    return problems


def path_problems(root: Path, where: str, claim: Claim) -> list[str]:
    """A path the README names has to be there."""
    if (root / claim.text).exists():
        return []
    return [f"{where}:{claim.line}: '{claim.text}' does not exist"]


def flag_problems(root: Path, where: str, claim: Claim) -> list[str]:
    """A flag the README shows has to be in the source of the script it shows it for."""
    script, flag = claim.text.split(" ", 1)
    f = root / script
    if not f.is_file():
        return []  # the missing file is already a path problem
    if flag in f.read_text(encoding="utf-8"):
        return []
    return [f"{where}:{claim.line}: '{script}' has no '{flag}' flag"]


def section_problems(where: str, text: str) -> list[str]:
    """A README a reader cannot install, run and test from is incomplete."""
    problems: list[str] = []
    if not first_paragraph(text):
        problems.append(f"{where}:1: no first paragraph saying what this project is for")
    found = headings(text)
    for name, words in SECTIONS:
        if not any(word in heading for heading in found for word in words):
            problems.append(f"{where}:1: no heading for how to {name} it ({' | '.join(words)})")
    return problems


def documented_problems(root: Path, config: Config, texts: dict[str, str]) -> list[str]:
    """Every script this project ships is named somewhere, or declared undocumented with a reason."""
    body = "\n".join(texts.values())
    names = [*_package_scripts(root), *_script_files(root)]
    problems: list[str] = []
    for name in dict.fromkeys(names):
        if name in config.undocumented:
            if not config.undocumented[name]:
                problems.append(f"{CONFIG_PATH}:1: undocumented '{name}' has no reason")
            continue
        if name not in body:
            problems.append(f"{config.readmes[0]}:1: script '{name}' is not documented in any README")
    return problems


def claims(text: str) -> list[Claim]:
    """Every claim one README makes, in line order."""
    found = command_claims(text) + path_claims(text) + flag_claims(text)
    return sorted(found, key=lambda c: (c.line, c.kind, c.text))


def check_readme(root: Path, where: str, text: str, scripts: dict[str, str]) -> tuple[list[Claim], list[str]]:
    """One README's claims and the problems they raise."""
    found = claims(text)
    problems = section_problems(where, text)
    for claim in found:
        if claim.kind == "command":
            problems += command_problems(root, where, claim, scripts)
        elif claim.kind == "path":
            problems += path_problems(root, where, claim)
        else:
            problems += flag_problems(root, where, claim)
    return found, problems


def check_project(root: Path) -> tuple[list[Claim], list[str], str]:
    """Every configured README, checked. Returns ``(claims, problems, summary line)``."""
    config = load_config(root)
    scripts = _package_scripts(root)
    texts: dict[str, str] = {}
    found: list[Claim] = []
    problems: list[str] = []
    for rel in config.readmes:
        f = root / rel
        if not f.is_file():
            problems.append(f"{rel}:1: does not exist, but readme-check is configured to check it")
            continue
        texts[rel] = f.read_text(encoding="utf-8")
        one, bad = check_readme(root, rel, texts[rel], scripts)
        found += one
        problems += bad
    problems += documented_problems(root, config, texts)
    line = f"readme: {len(found)} claims checked; {len(problems)} problem(s)"
    return found, problems, line


# ------------------------------------------------------------------------- CLI

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def main(argv: list[str], root: Path = PROJECT_ROOT) -> int:
    """The CLI: default check, ``--list`` to print every claim it checks."""
    mode = argv[0] if argv else "--check"
    if mode not in {"--check", "--list"}:
        sys.stderr.write(f"unknown mode '{mode}' (expected --check or --list)\n")
        return 2
    found, problems, line = check_project(root)
    if mode == "--list":
        for claim in found:
            sys.stdout.write(f"{claim.kind}: {claim.text}\n")
    sys.stdout.write(line + "\n")
    for p in problems:
        sys.stdout.write(f"  {p}\n")
    return 1 if problems else 0


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except ConfigError as err:  # a bad config is a usage error, not a traceback
        sys.stderr.write(f"{err}\n")
        sys.exit(2)
