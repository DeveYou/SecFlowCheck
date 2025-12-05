from fastapi import FastAPI
from app.config import settings
from app.extensions import init_extensions
from app.errors import ExceptionMiddleware
from app.routes import analyzer_routes
from eureka.client import EurekaClient


client = EurekaClient(
    app_name="analyzer-service",
    eureka_server="http://discovery:8761/eureka",
    instance_port=8003
)
client.start()

def create_app():
    app = FastAPI(title=settings.APP_NAME, version=settings.VERSION)
    init_extensions(app)
    app.add_middleware(ExceptionMiddleware)
    app.include_router(analyzer_routes.router)
    return app

app = create_app()

@app.get("/")
def root():
    return {"message": f"{settings.APP_NAME} is running!"}
