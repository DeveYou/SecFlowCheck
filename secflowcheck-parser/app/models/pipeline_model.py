from app.models.job_model import Job
from pydantic import BaseModel
from typing import Optional

class Pipeline(BaseModel):
  pipline_type: str
  jobs: list[Job]
  total_jobs: int
  total_steps: int