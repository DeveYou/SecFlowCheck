from contextlib import asynccontextmanager
from fastapi import FastAPI
from contextlib import asynccontextmanager
import py_eureka_client.eureka_client as eureka_client
from app.config import settings
from app.extensions import init_db, close_extensions
from app.errors import ExceptionMiddleware
from app.middleware.auth import APIKeyMiddleware
from app.routes import report_routes
import py_eureka_client.eureka_client as eureka_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    # INIT MONGODB FIRST
    print("Initializing MongoDB...")
    await init_db(app)
    print("MongoDB initialized.")

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

    print("Closing MongoDB...")
    close_extensions(app)
    print("MongoDB closed.")
    

def create_app():
    app = FastAPI(
        title=settings.APP_TITLE,
        version=settings.VERSION,
        lifespan=lifespan
    )

    # Middlewares
    app.add_middleware(ExceptionMiddleware)
    app.add_middleware(APIKeyMiddleware)

    # Routers
    app.include_router(report_routes.router)

    return app


app = create_app()


@app.get("/")
def root():
    return {"message": f"{settings.APP_NAME} v{settings.VERSION} is running"}
