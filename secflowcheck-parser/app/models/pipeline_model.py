from app.models.job_model import Job
from pydantic import BaseModel
from typing import Optional
from app.models.ml_features_model import MLFeatures

class Pipeline(BaseModel):
  pipline_type: str
  jobs: list[Job]
  total_jobs: int
  total_steps: int
  ml_features: MLFeatures