import pandas as pd
import httpx
from app.models.pipeline import ParsedPipeline
from app.ml.model_loader import load_model
from app.config import settings

class AnalysisService:
    def __init__(self):
        self.model = load_model()

    async def analyze_pipeline(self, pipeline: ParsedPipeline):
        # Feature Extraction
        features = pipeline.features
        
        # ML Inference
        # Order must match training columns
        input_data = pd.DataFrame([{
            "num_jobs": features.num_jobs,
            "num_steps": features.num_steps,
            "has_secrets": features.has_secrets,
            "privileged_access": features.privileged_access
        }])
        
        try:
            # Predict
            prediction = self.model.predict(input_data)[0]
            risk_score = str(prediction)
        except Exception as e:
            print(f"ML Prediction Warning: {e}")
            # Fallback based on secrets found
            if features.has_secrets:
                risk_score = "CRITICAL"
            elif features.privileged_access:
                risk_score = "HIGH"
            else:
                risk_score = "LOW"

        # Construct Result - matching Report model field names
        # Keep 'features' at top level for frontend display
        # Convert findings to match Report Finding schema (rule_id, severity, description, location)
        converted_findings = []
        for f in pipeline.findings:
            finding_dict = f.dict()
            converted_findings.append({
                "rule_id": finding_dict.get("type", "unknown"),  # type -> rule_id
                "severity": finding_dict.get("severity", "MEDIUM"),
                "description": finding_dict.get("message", "No description"),  # message -> description
                "location": finding_dict.get("location")
            })
        
        analysis_result = {
            "pipeline_name": pipeline.filename,  # matches Report.pipeline_name
            "score": risk_score,                 # matches Report.score
            "grade": self._map_risk_to_grade(risk_score),
            "findings": converted_findings,
            "total_findings": len(pipeline.findings),
            "features": features.dict(),         # for frontend display
            "metadata": {"features": features.dict()}  # for report storage
        }

        return analysis_result

    def _map_risk_to_grade(self, risk_score: str) -> str:
        """
        Maps the risk score to a grade (A-E).
        LOW -> A
        MEDIUM -> C
        HIGH -> D
        CRITICAL -> E
        """
        mapping = {
            "LOW": "A",
            "MEDIUM": "C",
            "HIGH": "D",
            "CRITICAL": "E"
        }
        return mapping.get(risk_score, "UNKNOWN")

    async def _send_to_report_service(self, result: dict):
        if not settings.REPORT_API_URL:
            print("REPORT_API_URL not set, skipping report submission.")
            return

        try:
            headers = {"x-api-key": settings.REPORT_API_KEY}
            # Ensure URL ends with trailing slash to avoid 307 redirect
            url = settings.REPORT_API_URL.rstrip('/') + '/'
            async with httpx.AsyncClient(follow_redirects=True) as client:
                # Send to report service
                response = await client.post(
                    url, 
                    json=result,
                    headers=headers
                )
                print(f"Report sent: status={response.status_code}")
        except Exception as e:
            print(f"Failed to send report to {settings.REPORT_API_URL}: {e}")
