from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config import settings
from app.models.report_doc import Report

async def init_db(app):
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB]
    app.state.db_client = client
    app.state.db = db
    await init_beanie(database=db, document_models=[Report])


def close_extensions(app):
    """
    Gracefully close MongoDB connections on shutdown.
    """
    client = getattr(app.state, "db_client", None)
    if client:
        client.close()