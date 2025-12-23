import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    APP_TITLE: str = "SecFlowCheck CLI Service"
    VERSION: str = "1.0.0"

    PARSER_API: str
    ANALYZER_API: str
    TIMEOUT: int

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")

settings = Settings()