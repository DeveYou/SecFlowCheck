from fastapi import APIRouter, Body, HTTPException, Request
from fastapi.responses import JSONResponse
from app.services.analysis_service import AnalysisService
from app.models.pipeline import ParsedPipeline
from app.tasks import forward_report

router = APIRouter(prefix="", tags=["Analyzer"])
analysis_service = AnalysisService()

@router.post("/analyze")
async def analyze_pipeline_endpoint(request: Request, pipeline_data: dict = Body(...)):
    """
    Analyze a parsed pipeline (from parser service) and return findings.
    """
    try:
        # Validate input against Pydantic model
        pipeline = ParsedPipeline(**pipeline_data)
        
        # Analyze
        result = await analysis_service.analyze_pipeline(pipeline)
        
        # Get User ID
        user_id = request.headers.get("X-Auth-User")
        print(f"DEBUG ANALYZER: Headers: {request.headers}", flush=True)
        print(f"DEBUG ANALYZER: Found X-Auth-User: {user_id}", flush=True)

        # Forward report asynchronously (Celery task)
        forward_report.delay(result, pipeline_name=pipeline.filename, user_id=user_id)
        
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
