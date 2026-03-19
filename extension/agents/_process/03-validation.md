# Phase 3 — Validation

Run after every Phase 2 execution. All gates must pass before declaring done [G-VAL-01].

## Gate 1 — Build

Detect build tool by project type:

| Project file | Command |
|---|---|
| `pom.xml` | `mvn clean compile` |
| `build.gradle` / `build.gradle.kts` | `./gradlew build` |
| `*.sln` | `dotnet build MySolution.sln` |
| `*.csproj` (no sln) | `dotnet build` |
| `pyproject.toml` | `pip install -e . && python -m py_compile <file>` |
| `requirements.txt` | `pip install -r requirements.txt` |
| `Makefile.PL` | `perl Makefile.PL && make` |
| `Build.PL` | `perl Build.PL && ./Build` |
| `pom.xml` with Tycho | `mvn -Peclipse clean package` |
| None | Compile the changed file directly using the language runtime |

Paste the full command output. A build failure must be diagnosed and fixed before proceeding.

## Gate 2 — Tests

Find test files alongside changed file:
- Java: `*Test.java`, `*IT.java`
- .NET: `*Tests.cs`, `*Test.cs`
- Python: `test_*.py`, `*_test.py`
- Perl: `t/*.t`, `*Test.pm`
- ARXML: Artop CLI or ISOLAR-A validation

Run them explicitly. Report pass/fail counts.

If no tests exist: state "No test coverage found for `<file>` — recommend adding a unit test." Suggest what a minimal test should cover.

## Gate 3 — Coverage [G-VAL-03]

Coverage must not decrease. Run coverage tool:
- Java: `mvn test jacoco:report` or `./gradlew test jacocoTestReport`
- .NET: `dotnet test --collect:"XPlat Code Coverage"`
- Python: `pytest --cov=<module> --cov-fail-under=<threshold>`
- Perl: `cover -test`

Report the delta. If coverage decreased, add tests before declaring done.

## Gate 4 — PR Checklist [G-GIT-03]

- [ ] Branch name follows `<type>/<scope>`
- [ ] PR linked to issue
- [ ] Build output pasted in response
- [ ] Test output pasted in response
- [ ] Coverage delta reported
- [ ] Rollback procedure documented (from Phase 1)
