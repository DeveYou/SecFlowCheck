from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.config import settings
from app.extensions import init_extensions, close_extensions
from app.errors import ExceptionMiddleware
from app.middleware.auth import APIKeyMiddleware
from app.routes import report_routes
import py_eureka_client.eureka_client as eureka_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start Eureka Client
    await eureka_client.init_async(
        eureka_server=settings.EUREKA_SERVER,
        app_name=settings.APP_NAME,
        instance_port=settings.SERVICE_PORT,
        instance_host=settings.INSTANCE_IP
    )
    print("Registered with Eureka")

    yield

    # Shutdown
    await eureka_client.stop_async()

def create_app():
    app = FastAPI(title=settings.APP_TITLE, version=settings.VERSION, lifespan=lifespan)
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
