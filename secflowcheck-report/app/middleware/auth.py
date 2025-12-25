from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import settings

class APIKeyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Allow GET requests - they come from frontend via gateway (JWT validated)
        # Also allow OPTIONS for CORS preflight
        if request.method in ("GET", "OPTIONS", "HEAD"):
            return await call_next(request)
        
        # Require API key for POST/PUT/DELETE (internal service-to-service calls)
        key = request.headers.get("x-api-key")
        if not key or key != settings.API_KEY:
            raise HTTPException(status_code=401, detail="Invalid or missing API key")
        return await call_next(request)
