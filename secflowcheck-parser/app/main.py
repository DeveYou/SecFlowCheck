from fastapi import FastAPI
from app.config import settings
from app.extensions import init_extensions
from app.errors import ExceptionMiddleware
from app.routes import parser_routes
from eureka.client import EurekaClient

client = EurekaClient(
    app_name=settings.APP_NAME,
    eureka_server=settings.EUREKA_SERVER,
    instance_port=settings.SERVICE_PORT
)
client.start()

def create_app():
    app = FastAPI(title=settings.APP_TITLE, version=settings.VERSION)
    init_extensions(app)
    app.add_middleware(ExceptionMiddleware)
    app.include_router(parser_routes.router)
    return app

app = create_app()

@app.get("/")
def root():
    return {"message": f"{settings.APP_NAME} is running!"}
