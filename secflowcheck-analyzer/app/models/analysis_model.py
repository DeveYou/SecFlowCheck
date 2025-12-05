from app.models.finding_model import Finding
from pydantic import BaseModel
from typing import List, Optional

class AnalysisResult(BaseModel):
    pipeline_type: str
    score: str
    total_findings: int
    findings: List[Finding]