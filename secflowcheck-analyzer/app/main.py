from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.config import settings
from app.extensions import init_extensions
from app.errors import ExceptionMiddleware
from app.routes import analyzer_routes
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
    app.include_router(analyzer_routes.router)
    return app

app = create_app()

@app.get("/")
def root():
    return {"message": f"{settings.APP_NAME} is running!"}
