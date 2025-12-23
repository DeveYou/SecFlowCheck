import joblib
import os
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from app.config import settings

MODEL_PATH = settings.SECFLOWCHECK_MODEL_PATH

print("Loading ML model from:", MODEL_PATH)

_bundle = None

def load_model():
    global _bundle
    if _bundle is None:
        if not os.path.exists(MODEL_PATH):
            raise RuntimeError(f"ML model not found at {MODEL_PATH}")
        _bundle = joblib.load(MODEL_PATH)
    return _bundle
