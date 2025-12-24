from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    PARSER_API_URL: str
    ANALYZER_API_URL: str
    GATEWAY_URL: str

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")

settings = Settings()