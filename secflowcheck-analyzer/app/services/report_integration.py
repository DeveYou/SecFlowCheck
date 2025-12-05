import httpx
import os

REPORT_API = os.getenv("REPORT_API_URL", "http://localhost:8002/reports")
REPORT_API_KEY = os.getenv("REPORT_API_KEY", "supersecretapikey")

async def send_to_report_service(result: dict, pipeline_name: str = None):
    async with httpx.AsyncClient() as client:
        payload = {
            "pipeline_name": pipeline_name or "unknown",
            "pipeline_type": result.get("pipeline_type"),
            "score": result.get("score"),
            "total_findings": result.get("total_findings"),
            "findings": result.get("findings"),
        }
        headers = {"x-api-key": REPORT_API_KEY}
        try:
            resp = await client.post(REPORT_API, json=payload, headers=headers, timeout=10)
            resp.raise_for_status()
            print(f"[Analyzer] Report saved with id: {resp.json().get('id')}")
        except Exception as e:
            print(f"[Analyzer] Failed to send report: {e}")
