from fastapi import FastAPI, HTTPException, Body
from app.services.parser_service import ParserService
from app.models.schemas import ParsedPipeline, ParseRequest
from app.config import settings
from app.routes import parser_routes
from pydantic import BaseModel
import py_eureka_client.eureka_client as eureka_client
from contextlib import asynccontextmanager

parser_service = ParserService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # REGISTER TO EUREKA
    print("Registering service to Eureka...")
    await eureka_client.init_async(
        eureka_server=settings.EUREKA_SERVER,
        app_name=settings.APP_NAME,
        instance_port=settings.SERVICE_PORT,
        instance_host=settings.INSTANCE_HOST,
        instance_ip=settings.INSTANCE_IP
    )
    print("Registered with Eureka")

    # App is ready
    yield

    # SHUTDOWN
    print("Shutting down Eureka...")
    await eureka_client.stop_async()
    print("Eureka stopped.")

def create_app():
    app = FastAPI(
        title=settings.APP_TITLE,
        version=settings.VERSION,
        lifespan=lifespan
    )

    # Routers
    app.include_router(parser_routes.router)

    return app


app = create_app()


@app.get("/")
def root():
    return {"message": f"{settings.APP_NAME} v{settings.VERSION} is running"}

@app.post("/parse", response_model=ParsedPipeline)
def parse_yaml(request: ParseRequest):
    return parser_service.parse_and_extract(request.content, request.filename)

@app.get("/health")
def health_check():
    return {"status": "ok"}
