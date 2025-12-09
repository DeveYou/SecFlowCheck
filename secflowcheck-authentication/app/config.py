from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App
    APP_TITLE: str = "SecFlowCheck Authentication Service"
    APP_NAME: str = "auth-service"
    DEBUG: bool
    VERSION: str = "1.0.0"

    # Database (PostgreSQL)
    DATABASE_URL: str

    # Security (JWT)
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7


    # Eureka (Service Discovery)
    EUREKA_SERVER: str = "http://discovery:8761/eureka"
    SERVICE_PORT: int = 8001
    INSTANCE_IP: str = "secflowcheck-authentication"

    class Config:
        env_file = "../.env"

settings = Settings()