import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    APP_TITLE: str = "SecFlowCheck Parser Service"
    APP_NAME: str = "parser-service"
    DEBUG: bool = True
    VERSION: str = "1.0.0"

    # Eureka (Service Discovery)
    EUREKA_SERVER: str = "http://discovery:8761/eureka"
    SERVICE_PORT: int = 8002
    INSTANCE_IP: str = "secflowcheck-parser"

    class Config:
        env_file = ".env"

settings = Settings()
