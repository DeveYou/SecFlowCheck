from celery import Celery
import os

BROKER_URL = os.getenv("CELERY_BROKER", "amqp://guest:guest@rabbitmq:5672//")
BACKEND = os.getenv("CELERY_RESULT_BACKEND", "")

celery_app = Celery("secflowcheck_analyzer", broker=BROKER_URL, backend=BACKEND)
celery_app.conf.task_routes = {"app.tasks.*": {"queue": "analysis_queue"}}
