from fastapi import FastAPI
from contextlib import asynccontextmanager
import py_eureka_client.eureka_client as eureka_client
from app.services.parser_service import ParserService
from app.schemas import ParsedPipeline
from app.config import settings
from pydantic import BaseModel

@asynccontextmanager
async def lifespan(app: FastAPI):
    # REGISTER TO EUREKA
    print("Registering service to Eureka...")
    await eureka_client.init_async(
        eureka_server=settings.EUREKA_SERVER,
        app_name=settings.APP_NAME,
        instance_port=settings.SERVICE_PORT,
        instance_host=settings.INSTANCE_IP
    )
    print("Registered with Eureka")
    
    yield
    
    # SHUTDOWN
    print("Shutting down Eureka...")
    await eureka_client.stop_async()
    print("Eureka stopped.")

app = FastAPI(title=settings.APP_TITLE, lifespan=lifespan)
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
