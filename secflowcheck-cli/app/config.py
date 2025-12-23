from pydantic import BaseSettings
import os

class Settings(BaseSettings):
    PARSER_API_URL: str = "http://localhost:8001"
    ANALYZER_API_URL: str = "http://localhost:8002"

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")

settings = Settings()