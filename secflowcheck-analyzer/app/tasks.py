from celeryconfig import celery_app
import httpx
import os
from typing import Dict

REPORT_API = os.getenv("REPORT_API_URL", "http://report:8002/reports")
REPORT_JWT = os.getenv("REPORT_JWT", None)  # if report API expects JWT

@celery_app.task(bind=True, acks_late=True, soft_time_limit=30)
def forward_report(self, result: Dict, pipeline_name: str = None):
    payload = {
        "pipeline_name": pipeline_name or "unknown",
        "pipeline_type": result.get("pipeline_type"),
        "score": result.get("score"),
        "total_findings": result.get("total_findings"),
        "findings": result.get("findings"),
        "metadata": result.get("metadata", {})
    }
    headers = {}
    if REPORT_JWT:
        headers["authorization"] = f"Bearer {REPORT_JWT}"
    try:
        with httpx.Client(timeout=10) as client:
            resp = client.post(REPORT_API, json=payload, headers=headers)
            resp.raise_for_status()
            return {"status": "ok", "id": resp.json().get("id")}
    except Exception as e:
        # requeue or fail depending on your strategy
        raise self.retry(exc=e, countdown=5, max_retries=3)
