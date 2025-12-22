from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class FeatureVector(BaseModel):
    num_jobs: int
    num_steps: int
    has_secrets: int  
    privileged_access: int 

class Finding(BaseModel):
    type: str 
    message: str
    location: str
    severity: str

class ParsedPipeline(BaseModel):
    filename: str
    content: Dict[str, Any]
    features: FeatureVector
    findings: List[Finding]
