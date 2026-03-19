# Python Adaptive Maintenance Agent

## Overview
The Python Adaptive Maintenance Agent provides automated assistance for keeping Python codebases current with evolving interpreter versions, PyPI ecosystem changes, framework evolution, and type annotation adoption. It handles Python 2→3 migrations, pip/poetry/uv dependency updates, Django/Flask/FastAPI upgrades, and packaging modernization.

## Core Skills

### 1. Python Version Upgrade
- Analyze current Python version and generate upgrade paths (2.7 → 3.8 → 3.11 → 3.12)
- Detect deprecated syntax: `print` statements, `unicode`/`str` split, `long`, `basestring`, `xrange`
- Run `python -m py_compile` and `pylint --py3k` to surface Python 2 incompatibilities
- Handle `__future__` imports and recommend removal after full migration
- Use `2to3` and `pyupgrade` for automated syntax modernisation

### 2. Dependency Management
- Audit `requirements.txt`, `Pipfile`, or `pyproject.toml` for outdated packages
- Migrate from `requirements.txt` + `pip` to `pyproject.toml` with `poetry` or `uv`
- Resolve version conflicts using `pip install --dry-run`
- Pin transitive dependencies using `pip-compile` or `uv lock`
- Remove unused dependencies detected by `deptry` or `pipreqs`

### 3. Type Annotation Modernization
- Add `mypy`-compatible type hints incrementally
- Migrate from `typing.List`/`Dict`/`Tuple` to built-in generics (`list[str]`, `dict[str, int]`) — Python 3.9+
- Replace `Optional[X]` with `X | None` union syntax — Python 3.10+
- Introduce `TypedDict`, `Protocol`, `dataclass`, and `NamedTuple`
- Configure `mypy` in `pyproject.toml` with strict mode adoption roadmap

### 4. Django / Flask / FastAPI Updates
- Django: manage migration history, update `INSTALLED_APPS`, fix removed middleware and deprecated settings
- Django: upgrade from function-based views to class-based views, update URL patterns
- Flask: migrate from Flask 1.x to 2.x/3.x — update `before_first_request`, async route support
- FastAPI: update Pydantic v1 → v2 (`model_dump` vs `dict()`, field aliases, model validators)
- Align ORM queries with current Django ORM / SQLAlchemy 2.x patterns

### 5. Code Style Enforcement
- Configure `ruff` as unified linter + formatter (replaces flake8, pylint, isort, pyupgrade)
- Migrate legacy `setup.cfg` / `tox.ini` config to `pyproject.toml`
- Adopt `pyproject.toml`-only project layout (PEP 517/518/621)

### 6. Virtual Environment and Packaging
- Migrate from `virtualenv` + bare `pip` to `poetry`, `pipenv`, or `uv` workflows
- Fix broken virtual environments caused by Python version changes
- Configure `.python-version` for `pyenv` and align with CI Python version matrix

### 7. Python 2 to Python 3 Migration
- Run full `2to3 -w` transformation and verify output
- Fix: `unicode`/`bytes` handling, `dict.items()` vs `dict.iteritems()`
- Update `ConfigParser`, `urllib`, `StringIO`, `cPickle` to Python 3 equivalents
- Address division behaviour change (`/` vs `//`) and `range` vs `xrange`

## analyze

> **HEADING FORMAT — MANDATORY:** Every group heading MUST be a markdown hyperlink.
> Compliant: [`src/app.py:14`](src/app.py#L14)
> Non-compliant: `app.py` · `**app.py**` · a plain bullet

Scan the workspace. Group findings by fix pattern. Before writing the heading, READ the file to confirm the exact line number.

[`path/to/module.py:lineNumber`](path/to/module.py#LlineNumber)

**Before** — exact lines from the file at that line:
```language
[exact lines from the file at that line number]
```
**After** — complete working replacement:
```language
[complete corrected replacement — not just the changed line]
```
**Why:** [why it fails under the target Python version]
**Also affects:** [`path/to/other_module.py:line`](path/to/other_module.py#Lline)

Rules:
- Heading MUST be a markdown hyperlink — NOT bold text, NOT plain filename
- `lineNumber` MUST be confirmed by reading the file
- Before block MUST be verbatim from the file at that line
- After block MUST be a complete working replacement
- Top 5 by severity; summarise remainder

## Phase 1 — Planning

### Classify
Adaptive maintenance triggered by a Python interpreter version change, PyPI package EOL, framework major version upgrade, or packaging environment change.

### Scope inventory
- Current Python version (`python --version`) and target version
- Package manager in use: `pip`/`requirements.txt`, `poetry`/`pyproject.toml`, `uv`
- Run `pip audit` or `safety check` — note any security findings (handle via corrective/vulnerability-cve)
- Confirm a virtual environment exists and is active before any changes [G-ENV-02]
- List deprecated imports (use `pylint --py3k` or `pyupgrade --py3-plus`)

### Rollback procedure [G-ROLL-01]
- Restore previous version pins in `requirements.txt` / `pyproject.toml`
- `pip install -r requirements.txt` or `poetry install --sync` to restore environment
- `git revert <sha>` for committed changes

**Branch naming** [G-GIT-01]: `adaptive/python-<version>` e.g. `adaptive/python-312-upgrade`

## Phase 2 — Adaptive

Produce a numbered migration plan. Each step MUST include all three — a step without a code block is incomplete:
- **Change** — exact file edit as fenced Before/After code block
- **Command** — exact `pip` / `poetry` / `uv` command; when pinning a package version use `==` only — `>=`, `~=`, and `^` are not acceptable in a migration step because they defer the version decision to install time
- **Verify** — command or check confirming the step succeeded

**Virtual environment** [G-ENV-02]: before any `pip install`, confirm a venv is active — `python -c "import sys; print(sys.prefix)"` must differ from the system Python prefix. Never install into system Python.

**`mypy` gate**: if `mypy` is configured (`mypy.ini`, `[tool.mypy]`, or `.mypy.ini`), run `mypy <changed_file>` after every step — a step that introduces new mypy errors is incomplete.

**`2to3` caution**: `2to3` output is a starting point, not a finish. Every `bytes`/`str` boundary change in the diff MUST be manually reviewed — auto-applying without inspection is not a valid step.

**Version boundary** [G-SCOPE-02]: one major Python version per invocation (3.8→3.11 is valid; 2.7→3.12 in one step is not).

Do not describe steps in prose without code.

## Phase 3 — Validation

1. **Build**: `pyproject.toml` → `pip install -e . && pytest`; `requirements.txt` → `pip install -r requirements.txt && pytest`; no build file → `python <module>.py`
2. **Test**: look for `test_*.py`, `*_test.py` — run explicitly, report pass/fail counts
3. **mypy**: if configured, run `mypy` and confirm zero new errors
4. **Coverage** [G-VAL-03]: `pytest --cov=<module>` — coverage must not decrease
5. Paste full command output [G-VAL-01]
