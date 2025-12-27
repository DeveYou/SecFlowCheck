import yaml
import re

SECURITY_STEP_KEYWORDS = ("lint", "scan", "test", "sast", "dast")
SECRET_KEYWORDS = re.compile(r"(password|secret|token|key)", re.IGNORECASE)


def detect_pipeline_type(yaml_content: dict) -> str:
    if "jobs" in yaml_content:
        return "GitHub Actions"
    elif "stages" in yaml_content or any(
        isinstance(v, dict) and "script" in v for v in yaml_content.values()
    ):
        return "GitLab CI"
    else:
        return "Unknown"


def _init_metrics():
    return {
        "job_count": 0,
        "step_count": 0,
        "uses_write_all_permissions": False,
        "plaintext_secrets_count": 0,
        "uses_unpinned_actions_count": 0,
        "has_security_steps": False,
        "uses_self_hosted_runner": False,
    }

def _analyze_github_step(step, metrics):
    if not isinstance(step, dict):
        return
        
    name = step.get("name", "unnamed")
    
    # Detect security steps
    if any(k in name.lower() for k in SECURITY_STEP_KEYWORDS):
        metrics["has_security_steps"] = True

    # Detect plaintext secrets
    for value in step.get("env", {}).values():
        if SECRET_KEYWORDS.search(str(value)):
             metrics["plaintext_secrets_count"] += 1

    # Detect unpinned actions
    uses = step.get("uses")
    if isinstance(uses, str) and "@" in uses:
        if uses.endswith(("@main", "@master", "@latest")):
             metrics["uses_unpinned_actions_count"] += 1
    return name

def _process_github_pipeline(data, metrics):
    jobs_info = []
    
    for job_name, job_data in data.get("jobs", {}).items():
        metrics["job_count"] += 1
        steps = job_data.get("steps", [])
        metrics["step_count"] += len(steps)

        runs_on = job_data.get("runs-on", "unknown")
        if isinstance(runs_on, str) and "self-hosted" in runs_on:
             metrics["uses_self_hosted_runner"] = True

        if job_data.get("permissions") == "write-all":
             metrics["uses_write_all_permissions"] = True

        step_names = []
        for step in steps:
            name = _analyze_github_step(step, metrics)
            if name:
                step_names.append(name)

        jobs_info.append({
            "job": job_name,
            "runs_on": runs_on,
            "steps": step_names
        })
    return jobs_info

def _process_gitlab_pipeline(data, metrics):
    jobs_info = []
    for job_name, job_data in data.items():
        if not isinstance(job_data, dict) or "script" not in job_data:
            continue

        metrics["job_count"] += 1
        scripts = job_data.get("script", [])

        # Normalize scripts to be a list of strings
        if isinstance(scripts, str):
            scripts = [scripts]
        
        if not isinstance(scripts, list):
            continue

        metrics["step_count"] += len(scripts)

        for line in scripts:
            if isinstance(line, list):
                line = " ".join(str(x) for x in line)
            
            line_str = str(line)

            if any(k in line_str.lower() for k in SECURITY_STEP_KEYWORDS):
                 metrics["has_security_steps"] = True
            if SECRET_KEYWORDS.search(line_str):
                 metrics["plaintext_secrets_count"] += 1

        jobs_info.append({
            "job": job_name,
            "stage": job_data.get("stage", "default"),
            "script": scripts
        })
    return jobs_info

def parse_pipeline(yaml_text: str):
    try:
        data = yaml.safe_load(yaml_text) or {}
    except yaml.YAMLError:
        data = {}
        
    pipeline_type = detect_pipeline_type(data)
    metrics = _init_metrics()
    
    if pipeline_type == "GitHub Actions":
        _process_github_pipeline(data, metrics)
    elif pipeline_type == "GitLab CI":
        _process_gitlab_pipeline(data, metrics)
        
    return {
        "ml_features": metrics
    }
