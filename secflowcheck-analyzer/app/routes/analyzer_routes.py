import asyncio
from fastapi import APIRouter, Body, HTTPException
from fastapi.responses import JSONResponse
from app.services.analysis_service import AnalysisService
from app.models.pipeline import ParsedPipeline
from app.tasks import forward_report

router = APIRouter(prefix="/analyzer", tags=["Analyzer"])
analysis_service = AnalysisService()

@router.post("/analyze")
async def analyze_pipeline_endpoint(pipeline_data: dict = Body(...)):
    """
    Analyze a parsed pipeline (from parser service) and return findings.
    """
    try:
        # Validate input against Pydantic model
        pipeline = ParsedPipeline(**pipeline_data)
        
        # Analyze
        result = await analysis_service.analyze_pipeline(pipeline)
        
        # Forward report asynchronously (Celery task)
        forward_report.delay(result, pipeline_name=pipeline.filename)
        
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
