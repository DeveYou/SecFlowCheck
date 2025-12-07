import re
from typing import List, Dict
from app.models.finding_model import Finding

# Basic rule definitions
RULES = [
    {
        "id": "SECRET_PLAINTEXT",
        "pattern": r"(?i)(password|secret|token)\s*[:=]\s*['\"].+['\"]",
        "description": "Plaintext secret detected in environment or variable.",
        "severity": "critical"
    },
    {
        "id": "PERMISSIONS_ALL",
        "pattern": r"permissions:\s*write-all",
        "description": "Overly permissive 'write-all' permission found.",
        "severity": "major"
    },
    {
        "id": "MISSING_SECURITY_STEPS",
        "pattern": r"(lint|scan|test)",
        "description": "Missing security validation steps (lint/scan/test).",
        "severity": "minor",
        "negative_rule": True  # triggered if missing
    }
]

def analyze_pipeline(pipeline: Dict) -> Dict:
    findings: List[Finding] = []
    text_repr = str(pipeline)  # Flatten YAML data for regex scan

    # Apply regex-based rules
    for rule in RULES:
        if rule.get("negative_rule"):
            if not re.search(rule["pattern"], text_repr, re.IGNORECASE):
                findings.append(Finding(
                    rule_id=rule["id"],
                    severity=rule["severity"],
                    description=rule["description"]
                ))
        else:
            matches = re.findall(rule["pattern"], text_repr, re.IGNORECASE)
            if matches:
                findings.append(Finding(
                    rule_id=rule["id"],
                    severity=rule["severity"],
                    description=rule["description"]
                ))

    # Simple scoring (A–E) based on severity count
    score = compute_score(findings)
    return {
        "pipeline_type": pipeline.get("pipeline_type", "Unknown"),
        "score": score,
        "total_findings": len(findings),
        "findings": [f.dict() for f in findings]
    }

def compute_score(findings: List[Finding]) -> str:
    critical = sum(1 for f in findings if f.severity == "critical")
    major = sum(1 for f in findings if f.severity == "major")

    if critical > 0:
        return "E"
    elif major > 2:
        return "D"
    elif len(findings) > 3:
        return "C"
    elif len(findings) > 1:
        return "B"
    else:
        return "A"
