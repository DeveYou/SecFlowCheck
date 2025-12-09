from celery import Celery
from .config import settings

celery_app = Celery(
    "secflowcheck_analyzer",
    broker=settings.CELERY_BROKER,
    backend=settings.CELERY_RESULT_BACKEND,
)
celery_app.conf.task_routes = {"app.tasks.*": {"queue": "analysis_queue"}}
