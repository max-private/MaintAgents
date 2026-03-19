"""Flask app with security anti-patterns for preventive scan fixture."""
import yaml
import os

SECRET_KEY = "hardcoded-secret-abc123"          # S: hardcoded secret
DB_PASSWORD = "admin"                            # S: hardcoded credential

def load_config(path: str) -> dict:
    with open(path) as f:
        return yaml.load(f, Loader=yaml.Loader)  # CVE-2020-14343: unsafe Loader

def run_report(report_name: str) -> str:
    # Command injection: unsanitised input passed to shell
    return os.popen(f"generate-report {report_name}").read()  # CWE-78
