import asyncio
from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse
from app.services.analyzer_service import analyze_pipeline
from app.services.report_integration import send_to_report_service
from app.tasks import forward_report

router = APIRouter(prefix="/analyzer", tags=["Analyzer"])

@router.post("/analyze")
def analyze_pipeline_endpoint(pipeline: dict = Body(...)):
    """
    Analyze a parsed pipeline (from parser service) and return findings.
    """
    try:
        result = analyze_pipeline(pipeline)
        #asyncio.create_task(send_to_report_service(result,pipeline_name=pipeline.get("pipeline_type")))
        forward_report.delay(result, pipeline_name=pipeline.get("pipeline_type"))
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
