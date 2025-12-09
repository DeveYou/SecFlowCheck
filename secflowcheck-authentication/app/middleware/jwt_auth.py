from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, HTTPException, status
import jwt
from config import settings

SECRET = settings.SECRET_KEY
ALGO = settings.ALGORITHM



class JWTMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/open"):  # public endpoints prefix
            return await call_next(request)

        auth = request.headers.get("authorization")
        if not auth or not auth.lower().startswith("bearer "):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
        token = auth.split(" ", 1)[1].strip()
        try:
            payload = jwt.decode(token, SECRET, algorithms=[ALGO])
            # attach user to request.state if needed
            request.state.user = payload.get("sub")
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return await call_next(request)
