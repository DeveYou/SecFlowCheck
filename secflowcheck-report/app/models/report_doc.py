from beanie import Document
from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime

SCHEMA_VERSION = "1.0.1"

class Finding(BaseModel):
    rule_id: str
    severity: str
    description: str
    location: Optional[str] = None


class Report(Document):
    schema_version: str = SCHEMA_VERSION
    pipeline_name: Optional[str] = Field(None)
    pipeline_type: Optional[str] = None
    score: Optional[str] = None
    grade: Optional[str] = None
    total_findings: int = 0
    findings: List[Finding] = []
    metadata: Optional[Any] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "reports"


