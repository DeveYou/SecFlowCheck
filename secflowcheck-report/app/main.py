from fastapi import FastAPI
from app.config import settings
from app.extensions import init_extensions, close_extensions
from app.errors import ExceptionMiddleware
from app.middleware.auth import APIKeyMiddleware
from app.routes import report_routes
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
    app.add_middleware(APIKeyMiddleware)
    app.include_router(report_routes.router)
    # ensure DB closed on shutdown
    @app.on_event("shutdown")
    async def _shutdown():
        close_extensions(app)
    return app

app = create_app()

@app.get("/")
def root():
    return {"message": f"{settings.APP_NAME} v{settings.VERSION} is running"}
