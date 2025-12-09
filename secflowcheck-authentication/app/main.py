from fastapi import FastAPI
from contextlib import asynccontextmanager
import py_eureka_client.eureka_client as eureka_client

from app.config import settings
from app.database import engine, Base
from app.routes import auth_routes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Database Tables (Create if not exist)
    async with engine.begin() as conn:
        # In production, use Alembic for migrations instead of this
        await conn.run_sync(Base.metadata.create_all)
    print("Connected to PostgreSQL & Tables verified")

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

app = FastAPI(title=settings.APP_TITLE, lifespan=lifespan)

app.include_router(auth_routes.router)

print("Loaded settings:", settings.dict())

@app.get("/health")
def health_check():
    return {"status": "UP", "db": "PostgreSQL", "service": settings.APP_NAME}