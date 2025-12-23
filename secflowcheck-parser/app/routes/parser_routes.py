from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from app.services.parser_service import ParserService

router = APIRouter(prefix="/parser", tags=["Parser"])

parser_service = ParserService()

@router.post("/analyze")
async def analyze_yaml(file: UploadFile = File(...)):
    """
    Upload a GitHub or GitLab CI YAML file for analysis.
    """
    try:
        content = await file.read()
        result = parser_service.parse_and_extract(content.decode(), file.filename)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
