from typing import List, Dict, Optional
from bson import ObjectId
from datetime import datetime
from app.models.report_doc import Report

COLLECTION_NAME = "reports"

async def save_report(db, report: dict) -> str:
    doc = Report(**report)
    await doc.insert()
    return str(doc.id)


async def get_report(db, report_id: str) -> Optional[Dict]:
    try:
        oid = ObjectId(report_id)
    except Exception:
        return None
    doc = await db[COLLECTION_NAME].find_one({"_id": oid})
    if not doc:
        return None
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc

async def list_reports(
    db,
    limit: int = 50,
    skip: int = 0,
    score: str = None,
    pipeline_type: str = None,
    repo: str = None,
):
    query = {}
    if score:
        query["score"] = score
    if pipeline_type:
        query["pipeline_type"] = pipeline_type
    if repo:
        query["metadata.repo"] = repo

    cursor = db[COLLECTION_NAME].find(query).sort("created_at", -1).skip(skip).limit(limit)
    results = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        doc.pop("_id", None)
        results.append(doc)
    return results


async def delete_report(db, report_id: str) -> bool:
    try:
        oid = ObjectId(report_id)
    except Exception:
        return False
    res = await db[COLLECTION_NAME].delete_one({"_id": oid})
    return res.deleted_count == 1
