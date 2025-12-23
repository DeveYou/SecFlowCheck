from pydantic_settings import BaseSettings
import os

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
    INSTANCE_IP: str = "auth"
    INSTANCE_HOST: str = "auth"

    # OAuth2 / OIDC
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None
    GITHUB_CLIENT_ID: str | None = None
    GITHUB_CLIENT_SECRET: str | None = None
    GITLAB_CLIENT_ID: str | None = None
    GITLAB_CLIENT_SECRET: str | None = None
    
    # Session Middleware
    SESSION_SECRET: str = "supersecret-session-key"
    
    # Frontend Redirection
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")

settings = Settings()