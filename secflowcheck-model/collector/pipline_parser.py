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


def parse_pipeline(yaml_text: str):
    try:
        data = yaml.safe_load(yaml_text) or {}
    except yaml.YAMLError:
        data = {}
    pipeline_type = detect_pipeline_type(data)

    jobs_info = []
    total_steps = 0

    # --- ML feature counters ---
    uses_write_all_permissions = False
    plaintext_secrets_count = 0
    uses_unpinned_actions_count = 0
    has_security_steps = False
    uses_self_hosted_runner = False

    if pipeline_type == "GitHub Actions":
        for job_name, job_data in data.get("jobs", {}).items():
            steps = job_data.get("steps", [])
            total_steps += len(steps)

            runs_on = job_data.get("runs-on", "unknown")
            if isinstance(runs_on, str) and "self-hosted" in runs_on:
                uses_self_hosted_runner = True

            if job_data.get("permissions") == "write-all":
                uses_write_all_permissions = True

            step_names = []

            for step in steps:
                if not isinstance(step, dict):
                    continue

                name = step.get("name", "unnamed")
                step_names.append(name)

                # Detect security steps
                if any(k in name.lower() for k in SECURITY_STEP_KEYWORDS):
                    has_security_steps = True

                # Detect plaintext secrets
                for value in step.get("env", {}).values():
                    if SECRET_KEYWORDS.search(str(value)):
                        plaintext_secrets_count += 1

                # Detect unpinned actions
                uses = step.get("uses")
                if isinstance(uses, str) and "@" in uses:
                    if uses.endswith(("@main", "@master", "@latest")):
                        uses_unpinned_actions_count += 1

            jobs_info.append({
                "job": job_name,
                "runs_on": runs_on,
                "steps": step_names
            })

    elif pipeline_type == "GitLab CI":
        for job_name, job_data in data.items():
            if not isinstance(job_data, dict) or "script" not in job_data:
                continue

            scripts = job_data.get("script", [])

            # Normalize scripts to be a list of strings
            if isinstance(scripts, str):
                scripts = [scripts]
            
            if not isinstance(scripts, list):
                continue

            total_steps += len(scripts)

            for line in scripts:
                if isinstance(line, list):
                    line = " ".join(str(x) for x in line)
                
                line_str = str(line)

                if any(k in line_str.lower() for k in SECURITY_STEP_KEYWORDS):
                    has_security_steps = True
                if SECRET_KEYWORDS.search(line_str):
                    plaintext_secrets_count += 1

            jobs_info.append({
                "job": job_name,
                "stage": job_data.get("stage", "default"),
                "script": scripts
            })

    else:
        jobs_info.append({"job": "unknown", "steps": [], "script": []})

    ml_features = {
        "job_count": len(jobs_info),
        "step_count": total_steps,
        "uses_write_all_permissions": uses_write_all_permissions,
        "plaintext_secrets_count": plaintext_secrets_count,
        "uses_unpinned_actions_count": uses_unpinned_actions_count,
        "has_security_steps": has_security_steps,
        "uses_self_hosted_runner": uses_self_hosted_runner,
    }

    return {
        "ml_features": ml_features
    }
