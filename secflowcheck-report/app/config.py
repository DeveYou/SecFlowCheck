from pydantic import BaseSettings

class Settings(BaseSettings):
    APP_TITLE: str = "SecFlowCheck Report Service"
    APP_NAME: str = "report-service"
    DEBUG: bool = True
    VERSION: str = "1.0.0"
    MONGO_URI: str = "mongodb://localhost:27017/secflowcheck"
    MONGO_DB: str = "secflowcheck"
    API_KEY: str = "supersecretapikey"

    # Eureka (Service Discovery)
    EUREKA_SERVER: str = "http://discovery-service:8761/eureka"
    SERVICE_PORT: int = 8004
    INSTANCE_IP: str = "secflowcheck-report"

    class Config:
        env_file = ".env"

settings = Settings()
