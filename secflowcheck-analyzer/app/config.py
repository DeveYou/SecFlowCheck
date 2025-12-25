import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_TITLE: str = "SecFlowCheck Analyzer Service"
    APP_NAME: str = "analyzer-service"
    DEBUG: bool
    VERSION: str = "1.0.0"

    # Celery
    CELERY_BROKER: str
    CELERY_RESULT_BACKEND: str

    REPORT_API_URL: str
    REPORT_API_KEY: str

    # ML Model Path
    SECFLOWCHECK_MODEL_PATH: str

    # Eureka (Service Discovery)
    EUREKA_SERVER: str = "http://discovery:8761/eureka"
    SERVICE_PORT: int = 8002
    INSTANCE_IP: str = "analyzer"
    INSTANCE_HOST: str = "analyzer"

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")

settings = Settings()
