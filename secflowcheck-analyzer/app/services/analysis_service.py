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

        # Construct Result
        analysis_result = {
            "filename": pipeline.filename,
            "risk_score": risk_score,
            "grade": self._map_risk_to_grade(risk_score),
            "findings": [f.dict() for f in pipeline.findings],
            "features": features.dict()
        }

        # Send to Report Service
        await self._send_to_report_service(analysis_result)

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
            async with httpx.AsyncClient() as client:
                # Assuming /reports endpoint
                await client.post(f"{settings.REPORT_API_URL}/reports", json=result)
        except Exception as e:
            print(f"Failed to send report to {settings.REPORT_API_URL}: {e}")
