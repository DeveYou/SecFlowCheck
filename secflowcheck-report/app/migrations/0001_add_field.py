import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.report_doc import Report
from app.config import settings

async def migrate():
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB]
    await init_beanie(database=db, document_models=[Report])
    cursor = Report.find_many({})
    async for doc in cursor:
        changed = False
        if not getattr(doc, "metadata", None):
            doc.metadata = {}
            changed = True
        if changed:
            await doc.save()

if __name__ == "__main__":
    asyncio.run(migrate())
