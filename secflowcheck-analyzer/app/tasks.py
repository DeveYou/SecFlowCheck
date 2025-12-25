from app.celeryconfig import celery_app
import httpx
from typing import Dict
from app.config import settings

REPORT_API = settings.REPORT_API_URL
REPORT_API_KEY = settings.REPORT_API_KEY

@celery_app.task(bind=True, acks_late=True, soft_time_limit=30)
def forward_report(self, result: Dict, pipeline_name: str = None, user_id: str = None):
    print(f"DEBUG WORKER: Processing report for user_id: {user_id}", flush=True)
    payload = {
        "pipeline_name": pipeline_name or "unknown",
        "pipeline_type": result.get("pipeline_type"),
        "score": result.get("score"),
        "total_findings": result.get("total_findings"),
        "findings": result.get("findings"),
        "metadata": result.get("metadata", {}),
        "user_id": user_id
    }
    headers = {}
    if REPORT_API_KEY:
        headers["x-api-key"] = REPORT_API_KEY
    try:
        with httpx.Client(timeout=10) as client:
            resp = client.post(REPORT_API, json=payload, headers=headers)
            resp.raise_for_status()
            return {"status": "ok", "id": resp.json().get("id")}
    except Exception as e:
        # requeue or fail depending on your strategy
        raise self.retry(exc=e, countdown=5, max_retries=3)
