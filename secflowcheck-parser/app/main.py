from fastapi import FastAPI, HTTPException, Body
from app.services.parser_service import ParserService
from app.schemas import ParsedPipeline
from pydantic import BaseModel

app = FastAPI()
parser_service = ParserService()

class ParseRequest(BaseModel):
    content: str
    filename: str = "unknown.yml"

@app.post("/parse", response_model=ParsedPipeline)
def parse_yaml(request: ParseRequest):
    return parser_service.parse_and_extract(request.content, request.filename)

@app.get("/health")
def health_check():
    return {"status": "ok"}
