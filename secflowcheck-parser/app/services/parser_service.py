import yaml

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
    data = yaml.safe_load(yaml_text)
    pipeline_type = detect_pipeline_type(data)

    jobs_info = []
    total_steps = 0

    if pipeline_type == "GitHub Actions":
        for job_name, job_data in data.get("jobs", {}).items():
            steps = job_data.get("steps", [])
            total_steps += len(steps)
            jobs_info.append({
                "job": job_name,
                "runs_on": job_data.get("runs-on", "unknown"),
                "steps": [s.get("name", "unnamed") for s in steps if isinstance(s, dict)]
            })
    elif pipeline_type == "GitLab CI":
        for job_name, job_data in data.items():
            if isinstance(job_data, dict) and "script" in job_data:
                total_steps += len(job_data["script"])
                jobs_info.append({
                    "job": job_name,
                    "stage": job_data.get("stage", "default"),
                    "script": job_data["script"]
                })
    else:
        jobs_info.append({"job": "unknown", "steps": [], "script": []})

    return {
        "pipeline_type": pipeline_type,
        "jobs": jobs_info,
        "total_jobs": len(jobs_info),
        "total_steps": total_steps
    }
