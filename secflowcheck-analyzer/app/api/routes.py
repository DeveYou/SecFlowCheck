from fastapi import APIRouter, HTTPException, Body
from app.services.analysis_service import AnalysisService
from app.schemas.pipeline import ParsedPipeline

router = APIRouter()
analysis_service = AnalysisService()

@router.post("/analyze")
async def analyze_pipeline(pipeline: ParsedPipeline):
    # The pipeline is automatically validated by Pydantic
    try:
        result = await analysis_service.analyze_pipeline(pipeline)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
