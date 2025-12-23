from pydantic import BaseSettings
import os

class Settings(BaseSettings):
    APP_TITLE: str = "SecFlowCheck Report Service"
    APP_NAME: str = "report-service"
    DEBUG: bool
    VERSION: str = "1.0.0"
    MONGO_URI: str
    MONGO_DB: str
    API_KEY: str

    # Eureka (Service Discovery)
    EUREKA_SERVER: str = "http://discovery:8761/eureka"
    SERVICE_PORT: int = 8002
    INSTANCE_IP: str = "secflowcheck-report"

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")

settings = Settings()
