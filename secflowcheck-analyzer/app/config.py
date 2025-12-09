from pydantic import BaseSettings

class Settings(BaseSettings):
    APP_TITLE: str = "SecFlowCheck Analyzer Service"
    APP_NAME: str = "analyzer-service"
    DEBUG: bool
    VERSION: str = "1.0.0"

    # Celery
    CELERY_BROKER: str
    CELERY_RESULT_BACKEND: str

    REPORT_API_URL: str
    REPORT_JWT: str

    # Eureka (Service Discovery)
    EUREKA_SERVER: str = "http://discovery:8761/eureka"
    SERVICE_PORT: int = 8003
    INSTANCE_IP: str = "secflowcheck-analyzer"

    class Config:
        env_file = "../.env"

settings = Settings()
