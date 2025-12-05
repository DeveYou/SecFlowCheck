from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from app.services.parser_service import parse_pipeline

router = APIRouter(prefix="/parser", tags=["Parser"])

@router.post("/analyze")
async def analyze_yaml(file: UploadFile = File(...)):
    """
    Upload a GitHub or GitLab CI YAML file for analysis.
    """
    try:
        content = await file.read()
        result = parse_pipeline(content.decode())
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
