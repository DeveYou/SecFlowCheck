import json
import os
import time
from pathlib import Path
from typing import Optional

TOKEN_PATH = Path.home() / ".secflowcheck" / "token.json"


def save_token(token: str, expires_in: int = 3600):
    TOKEN_PATH.parent.mkdir(parents=True, exist_ok=True)
    data = {
        "access_token": token,
        "expires_at": int(time.time()) + expires_in
    }
    TOKEN_PATH.write_text(json.dumps(data))


def load_token() -> Optional[str]:
    if not TOKEN_PATH.exists():
        return None

    data = json.loads(TOKEN_PATH.read_text())
    if data["expires_at"] < time.time():
        return None

    return data["access_token"]


def clear_token():
    if TOKEN_PATH.exists():
        TOKEN_PATH.unlink()
