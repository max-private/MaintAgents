# ISO 14764 Maintenance Decision Tree

Use this flowchart to classify a maintenance request before calling any domain agent.

## Classification

```
START: What triggered this request?
│
├─► Something is currently broken or failing?
│     YES ──► CORRECTIVE → maintenance_corrective
│              │
│              ├─ Test failing or flaky?              domain="test-fix"
│              ├─ Known CVE / active exploit?         domain="vulnerability"
│              └─ SonarQube bug-category rule?        domain="sonarqube-bugs"
│
├─► The environment changed (runtime, OS, platform, schema, API)?
│     YES ──► ADAPTIVE → maintenance_adaptive
│              │
│              ├─ Java / JVM version?                 domain="java"
│              ├─ .NET / NuGet version?               domain="dotnet"
│              ├─ Python / pip / poetry?              domain="python"
│              ├─ Perl / CPAN?                        domain="perl"
│              ├─ Eclipse platform / OSGi?            domain="eclipse-rcp"
│              ├─ REST / SOAP / API framework?        domain="webservice"
│              ├─ OS / container / Docker?            domain="os-compatibility"
│              └─ AUTOSAR schema version?             domain="autosar"
│
├─► No fault, but quality or performance can be improved?
│     YES ──► PERFECTIVE → maintenance_perfective
│              │
│              ├─ Technical debt / code smells?       domain="sonarqube-quality"
│              └─ Throughput / latency / design?      domain="webservice-optimize"
│
└─► Proactive: no known fault yet, prevent future ones?
      YES ──► PREVENTIVE → maintenance_preventive
               │
               ├─ Scan for vulnerable dependencies?  domain="dependency-audit"
               └─ Static analysis / security posture? domain="vulnerability-scan"
```

## Ambiguous requests

If the request spans more than one branch, or the domain is unclear, call `maintenance_route(query)`. The router will score keyword matches across all agents and return the best-fit context.

Do not guess the domain — an incorrect domain loads irrelevant agent context.

## Command sequence

```
analyze  →  plan  →  [corrective|adaptive|perfective|preventive]  →  validate
```

Each phase is a separate command invocation. `analyze` and `plan` can run standalone. `validate` must run after every execution phase.
