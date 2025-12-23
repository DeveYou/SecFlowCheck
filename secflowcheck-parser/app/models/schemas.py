from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class FeatureVector(BaseModel):
    num_jobs: int
    num_steps: int
    has_secrets: int  # 0 or 1
    privileged_access: int  # 0 or 1

class Finding(BaseModel):
    type: str # 'secret', 'permission', 'structure'
    message: str
    location: str # "job: build, step: 2"
    severity: str # "CRITICAL", "HIGH", "MEDIUM"

class ParsedPipeline(BaseModel):
    filename: str
    content: Dict[str, Any]
    features: FeatureVector
    findings: List[Finding]


class ParseRequest(BaseModel):
    content: str
    filename: str = "unknown.yml"