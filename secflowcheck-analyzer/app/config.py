from pydantic import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "SecFlowCheck Analyzer Service"
    DEBUG: bool = True
    VERSION: str = "1.0.0"

settings = Settings()
