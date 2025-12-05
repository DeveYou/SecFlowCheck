from pydantic import BaseModel
from typing import List, Optional, Any

class Job(BaseModel):
    job: str
    runs_on: Optional[str] = None
    stage: Optional[str] = None
    steps: Optional[List[str]] = None
    script: Optional[List[str]] = None