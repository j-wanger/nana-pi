---
parent: py-init
referenced_at: "referenced (step unknown)"
---

# Feasibility Scanner — 10 Dimensions

Run all checks. Record each as: **compatible**, **upgradeable**, or **blocking**.

## 1. Build System
```bash
python3 -c "
import tomllib, pathlib, sys
p = pathlib.Path('pyproject.toml')
if not p.exists(): print('NO_PYPROJECT'); sys.exit()
with open(p, 'rb') as f: data = tomllib.load(f)
req = data.get('build-system', {}).get('requires', [])
print(' '.join(req) if req else 'NO_BUILD_SYSTEM')
"
```
- No pyproject.toml / no build-system → upgradeable
- setuptools, hatchling, flit-core → compatible
- poetry-core, pdm-backend → **blocking**

## 2. Source Layout
```bash
find . -maxdepth 3 -name "__init__.py" -not -path "./.venv/*" -not -path "./venv/*" -not -path "./.git/*" -not -path "./.tox/*" 2>/dev/null
```
- `./src/<pkg>/__init__.py` → compatible (source_dir=`src`, package_name=`<pkg>`)
- `./<pkg>/__init__.py` at root → compatible (source_dir=`.`, package_name=`<pkg>`)
- Both patterns → **blocking** (ambiguous layout)
- No `__init__.py` → upgradeable (scaffold src/, ask user for package_name)

## 3. Linter / Formatter
```bash
python3 -c "
import tomllib, pathlib
p = pathlib.Path('pyproject.toml')
if p.exists():
    with open(p, 'rb') as f: data = tomllib.load(f)
    for k in ['ruff','black','isort','flake8','pylint']:
        if k in data.get('tool', {}): print(f'pyproject:{k}')
"
[ -f .pre-commit-config.yaml ] && grep -oE '(ruff|black|isort|flake8|pylint)' .pre-commit-config.yaml 2>/dev/null | sort -u | sed 's/^/precommit:/'
```
- ruff present → compatible | black/isort/flake8/pylint (no ruff) → upgradeable | none → upgradeable

## 4. Type Checker
```bash
python3 -c "
import tomllib, pathlib
p = pathlib.Path('pyproject.toml')
if p.exists():
    with open(p, 'rb') as f: data = tomllib.load(f)
    tool = data.get('tool', {})
    if 'mypy' in tool: print('pyproject:mypy')
    if 'pyright' in tool: print('pyproject:pyright')
"
test -f mypy.ini && echo "file:mypy.ini"; test -f .mypy.ini && echo "file:.mypy.ini"; test -f pyrightconfig.json && echo "file:pyright"
```
- mypy configured → compatible | pyright only → compatible (add mypy alongside) | none → upgradeable

## 5. Test Framework
```bash
python3 -c "
import tomllib, pathlib
p = pathlib.Path('pyproject.toml')
if p.exists():
    with open(p, 'rb') as f: data = tomllib.load(f)
    if 'pytest' in data.get('tool', {}): print('pytest:pyproject')
"
test -f pytest.ini && echo "file:pytest.ini"; find . -maxdepth 3 \( -name "test_*.py" -o -name "*_test.py" \) -not -path "./.venv/*" 2>/dev/null | head -3
```
- pytest configured → compatible | test files but no config → upgradeable | none → upgradeable

## 6. Pre-commit Config
```bash
[ -f .pre-commit-config.yaml ] && { echo "EXISTS"; grep -oE 'repo: https://[^ ]+' .pre-commit-config.yaml; } || echo "MISSING"
```
- Missing → upgradeable | has ruff/mypy repos → compatible | has black/isort repos → upgradeable

## 7. Dependency Manager
```bash
test -f uv.lock && echo "uv"; test -f poetry.lock && echo "poetry"; test -f Pipfile.lock && echo "pipenv"
test -f requirements.txt && echo "pip"; test -f setup.py && echo "setup.py"; test -f environment.yml -o -f conda.yaml && echo "conda"
```
- uv.lock → compatible | poetry.lock → **blocking** | Pipfile.lock → **blocking** | conda → **blocking** | requirements.txt/setup.py → upgradeable | none → upgradeable

## 8. Agent Config
```bash
test -d .claude && echo "has:.claude"; test -f .claude/settings.json && echo "has:settings.json"
test -f CLAUDE.md && echo "has:CLAUDE.md"; test -d .claude/rules && echo "has:rules"
```
- No .claude/ or CLAUDE.md → upgradeable | settings.json/CLAUDE.md exists → upgradeable (merge)

## 9. CI Workflows
```bash
test -d .github/workflows && ls .github/workflows/ 2>/dev/null
test -f .gitlab-ci.yml && echo "gitlab-ci"; test -f Jenkinsfile && echo "jenkins"
```
- No CI → upgradeable | GitHub Actions present → compatible | non-GitHub CI → compatible (skip CI layer)

## 10. Git Secrets Scanning
```bash
[ -f .pre-commit-config.yaml ] && { grep -qE '(gitleaks|detect-secrets|trufflehog)' .pre-commit-config.yaml && echo "has-scanner" || echo "no-scanner"; } || echo "no-precommit"
```
- Scanner present → compatible | pre-commit but no scanner → upgradeable | no pre-commit → upgradeable
