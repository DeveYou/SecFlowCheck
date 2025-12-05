from pydantic import BaseModel
from typing import Optional

class Finding(BaseModel):
    rule_id: str
    severity: str
    description: str
    location: Optional[str] = None