import requests
from app.config import settings

def parse_pipeline(yaml_text: str) -> dict:
    r = requests.post(
        settings.PARSER_API,
        json={"yaml": yaml_text},
        timeout=settings.TIMEOUT
    )
    r.raise_for_status()
    return r.json()

def analyze_pipeline(parsed_pipeline: dict) -> dict:
    r = requests.post(
        settings.ANALYZER_API,
        json=parsed_pipeline,
        timeout=settings.TIMEOUT
    )
    r.raise_for_status()
    return r.json()
