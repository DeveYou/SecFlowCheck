from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Dict
import jwt 
from passlib.context import CryptContext
from app.config import settings

# 1. Configuration for Password Hashing
# "bcrypt" is robust and standard for microservices
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain-text password against the stored hash.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Generates a secure hash from a plain-text password.
    """
    return pwd_context.hash(password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a short-lived JWT Access Token.
    Contains user identity (sub) and roles.
    """
    to_encode = data.copy()
    
    # Set expiration
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Add claims
    to_encode.update({
        "exp": expire,
        "type": "access",
        "iss": settings.APP_NAME  # Issuer claim for security
    })
    
    # Sign token
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Creates a long-lived JWT Refresh Token.
    Used to obtain new access tokens without re-login.
    """
    to_encode = data.copy()
    
    # Set expiration (usually days or weeks)
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    # Add claims
    to_encode.update({
        "exp": expire, 
        "type": "refresh",
        "iss": settings.APP_NAME
    })
    
    # Sign token
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt