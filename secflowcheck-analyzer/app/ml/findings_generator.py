from typing import List
from app.models.finding_model import Finding


def generate_findings_from_features(features: dict) -> List[Finding]:
    findings = []

    if features.get("plaintext_secrets_count", 0) > 0:
        findings.append(Finding(
            rule_id="SECRET_PLAINTEXT",
            severity="critical",
            description="ML detected a high likelihood of plaintext secrets in the pipeline."
        ))

    if features.get("uses_write_all_permissions"):
        findings.append(Finding(
            rule_id="PERMISSIONS_ALL",
            severity="major",
            description="Pipeline uses overly permissive write-all permissions."
        ))

    if not features.get("has_security_steps", True):
        findings.append(Finding(
            rule_id="MISSING_SECURITY_STEPS",
            severity="minor",
            description="Pipeline lacks basic security validation steps (lint/scan/test)."
        ))

    if features.get("uses_unpinned_actions_count", 0) > 0:
        findings.append(Finding(
            rule_id="UNPINNED_ACTIONS",
            severity="major",
            description="Pipeline uses unpinned third-party actions."
        ))

    if features.get("uses_self_hosted_runner"):
        findings.append(Finding(
            rule_id="SELF_HOSTED_RUNNER",
            severity="minor",
            description="Pipeline runs on self-hosted runners, increasing attack surface."
        ))

    return findings
