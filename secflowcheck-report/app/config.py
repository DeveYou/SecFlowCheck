from pydantic import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "SecFlowCheck Report Service"
    DEBUG: bool = True
    VERSION: str = "1.0.0"
    MONGO_URI: str = "mongodb://localhost:27017/secflowcheck"
    MONGO_DB: str = "secflowcheck"
    API_KEY: str = "supersecretapikey"

settings = Settings()
